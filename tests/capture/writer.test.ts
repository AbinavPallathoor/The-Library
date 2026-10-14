import { it, expect } from "vitest";
import { emptyState, revision } from "../../src/domain/core";
import {
  ChangeWriter,
  proposeCapture,
  toCourseTag,
} from "../../src/capture/change-writer";
import type { CaptureDraft, NoteSnapshot } from "../../src/domain/types";
class MemoryVault {
  files = new Map<string, string>();
  writeCount = 0;
  fail = "";
  afterWrite?: () => void;
  async read(path: string): Promise<NoteSnapshot | null> {
    const markdown = this.files.get(path);
    return markdown === undefined
      ? null
      : { path, markdown, revision: revision(markdown) };
  }
  async create(p: string, m: string) {
    if (this.files.has(p) || this.fail === p) throw Error("collision");
    this.files.set(p, m);
    this.writeCount++;
    this.afterWrite?.();
  }
  async update(p: string, r: string, m: string) {
    if (revision(this.files.get(p) ?? "") !== r || this.fail === p)
      throw Error("conflict");
    this.files.set(p, m);
    this.writeCount++;
    this.afterWrite?.();
  }
  async remove(p: string, r: string) {
    if (revision(this.files.get(p) ?? "") !== r) throw Error("conflict");
    this.files.delete(p);
  }
}
const draft = (): CaptureDraft => ({
  id: "draft",
  mode: "new-learning",
  sourceRefs: [],
  writes: [
    {
      path: "A.md",
      markdown: "α $P$\n",
      expectedRevision: null,
      role: "learning",
    },
    { path: "B.md", markdown: "Body", expectedRevision: null, role: "idea" },
  ],
  topicLinks: [],
  prompts: [],
  corrections: [],
  questions: [],
});
const setup = () => {
  const vault = new MemoryVault(),
    state = emptyState();
  return {
    vault,
    state,
    writer: new ChangeWriter(vault, state, async () => {}),
    change: proposeCapture(draft(), state.vaultId),
  };
};
it("applies once and returns the same receipt after lost responses", async () => {
  const { vault, writer, change } = setup();
  const a = await writer.applyChanges(change, "r1");
  expect(a.status).toBe("applied");
  expect(await writer.applyChanges(change, "r1")).toEqual(a);
  expect(vault.writeCount).toBe(2);
  await expect(
    writer.applyChanges({ ...change, questions: ["different"] }, "r1"),
  ).rejects.toThrow(/reuse/);
});
it("preflights every path and protects edits after proposal", async () => {
  const { vault, writer, change } = setup();
  vault.files.set("B.md", "Human edit");
  expect((await writer.applyChanges(change, "r1")).status).toBe("conflict");
  expect(vault.files.has("A.md")).toBe(false);
});
it("rolls back completed writes on failure", async () => {
  const { vault, writer, change } = setup();
  vault.fail = "B.md";
  expect((await writer.applyChanges(change, "r1")).status).toBe("conflict");
  expect(vault.files.has("A.md")).toBe(false);
});
it("never rolls back an intervening human edit", async () => {
  const { vault, writer, change } = setup();
  vault.afterWrite = () => vault.files.set("A.md", "Human changed");
  vault.fail = "B.md";
  expect((await writer.applyChanges(change, "r1")).status).toBe("partial");
  expect(vault.files.get("A.md")).toBe("Human changed");
});
it("undo is checked and does not remove edited files", async () => {
  const { vault, writer, change } = setup();
  await writer.applyChanges(change, "r1");
  vault.files.set("A.md", "Keep");
  expect((await writer.undoReceipt("r1")).status).toBe("partial");
  expect(vault.files.get("A.md")).toBe("Keep");
});
it("adds only an explicit course tag and preserves content", () => {
  const d = draft();
  expect(proposeCapture(d, "v").writes[0].markdown).toBe(d.writes[0].markdown);
  d.explicitCourseCode = "CS101";
  expect(proposeCapture(d, "v").writes[0].markdown).toContain("#course/CS101");
  expect(toCourseTag(" CS101 ")).toBe("course/CS101");
  expect(() => toCourseTag("")).toThrow();
  d.prompts = [
    {
      id: "p",
      notePath: "A.md",
      question: "Q",
      answer: "A",
      kind: "fact",
      evidence: "tentative",
      enrolled: true,
    },
  ];
  expect(() => proposeCapture(d, "v")).toThrow(/tentative/);
});
it("serializes concurrent attempts with the same request", async () => {
  const { vault, writer, change } = setup();
  await Promise.all([
    writer.applyChanges(change, "r1"),
    writer.applyChanges(change, "r1"),
  ]);
  expect(vault.writeCount).toBe(2);
});
it("undo preserves newer prompt assessments and reports metadata conflict", async () => {
  const { state, writer, change } = setup();
  change.prompts = [
    {
      id: "p",
      notePath: "A.md",
      question: "Q",
      answer: "A",
      kind: "fact",
      evidence: "source-backed",
      enrolled: true,
    },
  ];
  await writer.applyChanges(change, "r1");
  state.prompts[0].assessment = "remembered";
  expect((await writer.undoReceipt("r1")).status).toBe("partial");
  expect(state.prompts[0].assessment).toBe("remembered");
});
