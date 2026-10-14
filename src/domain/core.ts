import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { ClearState } from "./types";
export const revision = (text: string) =>
  bytesToHex(sha256(new TextEncoder().encode(text)));
export function validateRoute(path: string): { ok: boolean } {
  return {
    ok:
      typeof path === "string" &&
      path.endsWith(".md") &&
      path.length < 1024 &&
      !/[\\\u0000-\u001f:*?"<>|#^]/.test(path) &&
      path.split("/").every((p) => !!p && !p.startsWith(".") && p === p.trim()),
  };
}
export function parseNoteStyle(markdown: string) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  return {
    frontmatter: m?.[1] ?? "",
    body: m ? markdown.slice(m[0].length) : markdown,
  };
}
export function emptyState(): ClearState {
  return {
    schemaVersion: 1,
    vaultId: crypto.randomUUID(),
    topicLinks: [],
    prompts: [],
    drafts: [],
    receipts: [],
    pins: [],
    positions: [],
    roles: {},
    journals: [],
    query: { text: "", tags: [], sort: "modified" },
    settings: {
      folders: [],
      captureFolder: "",
      openOnStart: true,
      readingFont: "Clear Lora",
    },
    captures: [],
  };
}
export function loadState(raw: unknown): ClearState {
  if (raw == null) return emptyState();
  const s = raw as ClearState;
  if (s.schemaVersion !== 1)
    throw Error(
      "Unsupported Clear state version. Existing data has been preserved.",
    );
  for (const key of [
    "pins",
    "positions",
    "prompts",
    "topicLinks",
    "drafts",
    "receipts",
    "journals",
    "captures",
  ] as const)
    if (!Array.isArray(s[key])) throw Error(`Invalid Clear data: ${key}`);
  if (!s.vaultId || !s.roles || !s.query || !s.settings)
    throw Error("Invalid Clear data");
  return s;
}
export function renameState(s: ClearState, oldPath: string, newPath: string) {
  const swap = (p: string) =>
    p === oldPath
      ? newPath
      : p.startsWith(oldPath + "/")
        ? newPath + p.slice(oldPath.length)
        : p;
  s.pins = s.pins.map(swap);
  s.lastNote = s.lastNote ? swap(s.lastNote) : undefined;
  s.positions.forEach((p) => (p.notePath = swap(p.notePath)));
  s.prompts.forEach((p) => (p.notePath = swap(p.notePath)));
  s.topicLinks.forEach((t) => {
    t.notePath = swap(t.notePath);
    t.hubPath = swap(t.hubPath);
  });
  for (const path of Object.keys(s.roles))
    if (swap(path) !== path) {
      s.roles[swap(path)] = s.roles[path];
      delete s.roles[path];
    }
  // Drafts and journals keep their original revisions/paths: stale operations must conflict.
}
export const layoutMode = (width: number) =>
  width < 600 ? "single" : width < 900 ? "compact" : "desktop";
export const planSetup = (existing: string[], requested: string[]) =>
  [...new Set(requested)].filter((p) => !existing.includes(p));
