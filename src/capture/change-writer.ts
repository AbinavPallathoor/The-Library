import type {
  CaptureDraft,
  ChangeSet,
  ClearState,
  Journal,
  Receipt,
} from "../domain/types";
import type { VaultPort } from "../storage/vault-port";
import { revision } from "../domain/core";
import { draftSchema, changeSchema } from "../domain/schemas";
export function toCourseTag(code: string) {
  const c = code.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(c))
    throw Error(
      "Course code must contain letters, numbers, underscores or hyphens",
    );
  return "course/" + c;
}
export function proposeCapture(
  input: CaptureDraft,
  vaultId: string,
): ChangeSet {
  const draft = draftSchema.parse(input);
  if (new Set(draft.writes.map((w) => w.path)).size !== draft.writes.length)
    throw Error("Duplicate write paths");
  if (new Set(draft.prompts.map((p) => p.id)).size !== draft.prompts.length)
    throw Error("Duplicate prompt IDs");
  if (draft.explicitCourseCode) {
    const tag = "#" + toCourseTag(draft.explicitCourseCode);
    for (const w of draft.writes)
      if (!w.markdown.split(/\s+/).includes(tag))
        w.markdown = w.markdown.trimEnd() + "\n\n" + tag + "\n";
  }
  return { ...draft, vaultId };
}
export class ChangeWriter {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private vault: VaultPort,
    public state: ClearState,
    private save: () => Promise<void>,
  ) {}
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work);
    this.queue = next.catch(() => {});
    return next;
  }
  getReceipt(id: string) {
    return this.state.receipts.find((r) => r.requestId === id) ?? null;
  }
  applyChanges(input: ChangeSet, requestId: string): Promise<Receipt> {
    return this.serial(async () => {
      if (!requestId.trim()) throw Error("A request ID is required");
      const c = changeSchema.parse(input);
      if (c.vaultId !== this.state.vaultId) throw Error("Wrong vault");
      if (new Set(c.writes.map((w) => w.path)).size !== c.writes.length)
        throw Error("Duplicate write paths");
      const digest = revision(JSON.stringify(c));
      const prior = this.state.journals.find((j) => j.requestId === requestId);
      if (prior) {
        if (prior.digest !== digest)
          throw Error("Cannot reuse request ID for different content");
        if (prior.receipt) return prior.receipt;
        throw Error("Request interrupted; recover it before retrying");
      }
      const j: Journal = {
        requestId,
        digest,
        changeSet: c,
        before: [],
        created: [],
        after: {},
        status: "pending",
        previousRoles: { ...this.state.roles },
        previousPrompts: structuredClone(this.state.prompts),
        previousLinks: structuredClone(this.state.topicLinks),
      };
      const conflicts: string[] = [];
      for (const w of c.writes) {
        const current = await this.vault.read(w.path);
        if ((current?.revision ?? null) !== w.expectedRevision)
          conflicts.push(w.path);
        if (current) j.before.push(current);
        else j.created.push(w.path);
      }
      for (const p of c.prompts)
        if (
          !c.writes.some((w) => w.path === p.notePath) &&
          !(await this.vault.read(p.notePath))
        )
          conflicts.push(p.notePath);
      for (const t of c.topicLinks)
        for (const p of [t.hubPath, t.notePath])
          if (
            !c.writes.some((w) => w.path === p) &&
            !(await this.vault.read(p))
          )
            conflicts.push(p);
      this.state.journals.push(j);
      await this.save();
      if (conflicts.length) return this.finish(j, "conflict", [], conflicts);
      try {
        for (const w of c.writes) {
          if (w.expectedRevision === null)
            await this.vault.create(w.path, w.markdown);
          else await this.vault.update(w.path, w.expectedRevision, w.markdown);
          j.after[w.path] = revision(w.markdown);
          await this.save();
        }
        for (const w of c.writes) this.state.roles[w.path] = w.role;
        for (const p of c.prompts) {
          const i = this.state.prompts.findIndex((x) => x.id === p.id);
          if (i < 0) this.state.prompts.push(structuredClone(p));
          else this.state.prompts[i] = structuredClone(p);
        }
        for (const t of c.topicLinks)
          if (
            !this.state.topicLinks.some(
              (x) =>
                x.hubPath === t.hubPath &&
                x.notePath === t.notePath &&
                x.heading === t.heading,
            )
          )
            this.state.topicLinks.push(structuredClone(t));
        return await this.finish(
          j,
          "applied",
          c.writes.map((w) => w.path),
          [],
        );
      } catch {
        const blocked = await this.rollback(j);
        return this.finish(
          j,
          blocked.length ? "partial" : "conflict",
          blocked,
          blocked.length
            ? blocked
            : ["Write failed; completed changes were restored."],
        );
      }
    });
  }
  private async finish(
    j: Journal,
    status: Receipt["status"],
    paths: string[],
    conflicts: string[],
  ) {
    const r: Receipt = {
      requestId: j.requestId,
      changeSetId: j.changeSet.id,
      status,
      paths,
      conflicts,
      questions: j.changeSet.questions,
    };
    j.status = "complete";
    j.receipt = r;
    this.state.receipts = this.state.receipts.filter(
      (x) => x.requestId !== r.requestId,
    );
    this.state.receipts.push(r);
    await this.save();
    return r;
  }
  private async rollback(j: Journal) {
    const blocked: string[] = [];
    for (const [path, after] of Object.entries(j.after).reverse())
      try {
        const before = j.before.find((s) => s.path === path);
        if (before) await this.vault.update(path, after, before.markdown);
        else await this.vault.remove(path, after);
      } catch {
        blocked.push(path);
      }
    // Never roll back registry entries changed by a later capture or recall session.
    const equal = (a: unknown, b: unknown) =>
      JSON.stringify(a) === JSON.stringify(b);
    for (const w of j.changeSet.writes) {
      if (blocked.includes(w.path)) continue;
      if (
        this.state.roles[w.path] !== w.role &&
        this.state.roles[w.path] !== j.previousRoles[w.path]
      ) {
        blocked.push("Role: " + w.path);
        continue;
      }
      if (j.previousRoles[w.path])
        this.state.roles[w.path] = j.previousRoles[w.path];
      else delete this.state.roles[w.path];
    }
    for (const p of j.changeSet.prompts) {
      const current = this.state.prompts.find((x) => x.id === p.id),
        old = j.previousPrompts.find((x) => x.id === p.id);
      if (equal(current, old)) continue;
      if (!equal(current, p)) {
        blocked.push("Prompt: " + p.id);
        continue;
      }
      this.state.prompts = this.state.prompts.filter((x) => x.id !== p.id);
      if (old) this.state.prompts.push(structuredClone(old));
    }
    // Topic memberships have no revisions. Retain added memberships on undo rather
    // than remove a connection another capture may now depend on.
    for (const t of j.changeSet.topicLinks)
      if (
        !j.previousLinks.some((x) => equal(x, t)) &&
        this.state.topicLinks.some((x) => equal(x, t))
      )
        blocked.push("Topic link: " + t.notePath);
    return blocked;
  }
  undoReceipt(id: string) {
    return this.serial(async () => {
      const j = this.state.journals.find((x) => x.requestId === id);
      if (!j || j.receipt?.status !== "applied")
        throw Error("No applied change to undo");
      const blocked = await this.rollback(j);
      return this.finish(
        j,
        blocked.length ? "partial" : "undone",
        blocked,
        blocked,
      );
    });
  }
  recover() {
    return this.serial(async () => {
      for (const j of this.state.journals.filter(
        (x) => x.status === "pending",
      )) {
        const blocked = await this.rollback(j);
        for (const w of j.changeSet.writes)
          if (!j.after[w.path]) {
            const current = await this.vault.read(w.path);
            if ((current?.revision ?? null) !== w.expectedRevision)
              blocked.push(w.path);
          }
        await this.finish(
          j,
          blocked.length ? "partial" : "conflict",
          blocked,
          blocked.length
            ? blocked
            : ["Interrupted request restored; submit a new request ID."],
        );
      }
    });
  }
}
