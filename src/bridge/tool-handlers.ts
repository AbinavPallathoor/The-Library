import { z } from "zod";
import { draftSchema, pathSchema, roleSchema } from "../domain/schemas";
import type { ClearState } from "../domain/types";
import type { VaultPort } from "../storage/vault-port";
import { VaultIndex } from "../index/vault-index";
import { ChangeWriter, proposeCapture } from "../capture/change-writer";
export const schemas = {
  get_workspace_policy: z.object({}).strict(),
  find_notes: z
    .object({
      text: z.string().default(""),
      tags: z.array(z.string()).default([]),
      role: roleSchema.optional(),
      sort: z.enum(["title", "modified"]).default("title"),
      limit: z.number().int().min(1).max(100).default(30),
    })
    .strict(),
  read_note: z.object({ path: pathSchema }).strict(),
  propose_capture: z.object({ draft: draftSchema }).strict(),
  apply_changes: z
    .object({ changeSetId: z.string().min(1), requestId: z.string().min(1) })
    .strict(),
  get_receipt: z.object({ requestId: z.string().min(1) }).strict(),
  get_review_context: z
    .object({
      notePath: pathSchema.optional(),
      includeAnswers: z.boolean().default(false),
    })
    .strict(),
};
export const descriptions = {
  get_workspace_policy:
    "Read note organization and revision policy. No writes.",
  find_notes:
    "Find existing coherent topics before creating a note. No writes.",
  read_note: "Read exact Markdown and SHA-256 revision. No writes.",
  propose_capture:
    "Validate and store an authored draft. Does not modify Markdown.",
  apply_changes:
    "Apply a previously proposed change set with revision checks and an idempotent request ID. Writes Markdown.",
  get_receipt:
    "Recover a result by request ID after a lost response. No writes.",
  get_review_context:
    "Read recall prompts, with answers excluded unless explicitly requested. No writes.",
};
export class ToolHandlers {
  constructor(
    private state: ClearState,
    private index: VaultIndex,
    private vault: VaultPort,
    private writer: ChangeWriter,
    private persist: () => Promise<void>,
  ) {}
  async dispatchTool(name: string, input: unknown): Promise<unknown> {
    if (!Object.hasOwn(schemas, name)) throw Error("Unknown tool");
    const key = name as keyof typeof schemas;
    schemas[key].parse(input);
    switch (key) {
      case "get_workspace_policy":
        return {
          vaultId: this.state.vaultId,
          organization:
            "One library. Update existing coherent topics first. Preserve paths, frontmatter, Unicode, math and sources.",
          courseTags:
            "Only add #course/CODE when explicitly supplied for this capture. Never infer a code.",
          revision:
            "SHA-256 of exact Markdown. Null means create only if absent.",
          recall:
            "Tentative claims cannot be enrolled. Generation does not grade recall.",
          tools: Object.keys(schemas),
          captureSchema: z.toJSONSchema(draftSchema),
          folders: this.state.settings.folders,
        };
      case "find_notes": {
        const q = schemas.find_notes.parse(input);
        return this.index
          .findNotes(q)
          .slice(0, q.limit)
          .map(({ path, title, excerpt, tags, revision, role }) => ({
            path,
            title,
            excerpt,
            tags,
            revision,
            role,
          }));
      }
      case "read_note":
        return this.vault.read(schemas.read_note.parse(input).path);
      case "propose_capture": {
        const { draft } = schemas.propose_capture.parse(input);
        const c = proposeCapture(draft, this.state.vaultId);
        const old = this.state.drafts.find((d) => d.id === c.id);
        if (old && JSON.stringify(old) !== JSON.stringify(c))
          throw Error("Draft ID already used; choose a new ID");
        if (!old) {
          this.state.drafts.push(c);
          await this.persist();
        }
        return c;
      }
      case "apply_changes": {
        const args = schemas.apply_changes.parse(input);
        const c = this.state.drafts.find((d) => d.id === args.changeSetId);
        if (!c) throw Error("Propose the change set first");
        return this.writer.applyChanges(c, args.requestId);
      }
      case "get_receipt":
        return this.writer.getReceipt(
          schemas.get_receipt.parse(input).requestId,
        );
      case "get_review_context": {
        const a = schemas.get_review_context.parse(input);
        return this.state.prompts
          .filter((p) => !a.notePath || p.notePath === a.notePath)
          .map((p) =>
            a.includeAnswers ? p : (({ answer, ...rest }) => rest)(p),
          );
      }
    }
  }
}
