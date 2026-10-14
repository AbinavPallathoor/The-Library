import { parse } from "yaml";
import { parseNoteStyle, revision } from "../domain/core";
import type { NoteRecord, LibraryQuery, Role } from "../domain/types";
export class VaultIndex {
  notes = new Map<string, NoteRecord>();
  upsert(
    path: string,
    markdown: string,
    modified = Date.now(),
    role: Role = "learning",
  ) {
    const { frontmatter, body } = parseNoteStyle(markdown);
    let meta: Record<string, unknown> = {};
    try {
      const parsed = parse(frontmatter);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        meta = parsed;
    } catch {
      /* Malformed frontmatter is still searchable content. */
    }
    const strings = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x) => typeof x === "string")
        : typeof v === "string"
          ? [v]
          : [];
    const plain = body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!?(\[\[)(.*?)(\]\])/g, "$2")
      .replace(/[#*_>`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    this.notes.set(path, {
      path,
      markdown,
      revision: revision(markdown),
      modified,
      role,
      title: path.split("/").pop()!.replace(/\.md$/, ""),
      aliases: strings(meta.aliases ?? meta.alias),
      tags: [
        ...new Set([
          ...strings(meta.tags).map((x) => x.replace(/^#/, "")),
          ...Array.from(
            body.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu),
            (m) => m[1],
          ),
        ]),
      ],
      headings: Array.from(body.matchAll(/^#{1,6}\s+(.+)$/gm), (m) => m[1]),
      links: Array.from(
        body.matchAll(/!?\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g),
        (m) => m[1],
      ),
      excerpt: plain.slice(0, 180),
    });
  }
  remove(path: string) {
    this.notes.delete(path);
  }
  resolve(link: string, source = ""): NoteRecord | undefined {
    const target = link.split("#")[0].replace(/\.md$/, "");
    if (!target) return this.notes.get(source);
    const relative = source.includes("/")
      ? source.slice(0, source.lastIndexOf("/") + 1) + target + ".md"
      : target + ".md";
    return (
      this.notes.get(target + ".md") ??
      this.notes.get(relative) ??
      [...this.notes.values()].find(
        (n) => n.title.toLowerCase() === target.toLowerCase(),
      )
    );
  }
  findNotes(q: LibraryQuery): NoteRecord[] {
    const terms = q.text
      .toLocaleLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const score = (n: NoteRecord) =>
      terms.reduce(
        (s, t) =>
          s +
          (n.title.toLowerCase().includes(t)
            ? 8
            : n.aliases.some((a) => a.toLowerCase().includes(t))
              ? 7
              : n.headings.some((h) => h.toLowerCase().includes(t))
                ? 4
                : 1),
        0,
      );
    return [...this.notes.values()]
      .filter(
        (n) =>
          (!q.role || q.role === n.role) &&
          q.tags.every((t) =>
            n.tags.some((x) => x.toLowerCase() === t.toLowerCase()),
          ) &&
          terms.every((t) =>
            [n.title, ...n.aliases, n.markdown]
              .join(" ")
              .toLowerCase()
              .includes(t),
          ),
      )
      .sort(
        (a, b) =>
          score(b) - score(a) ||
          (q.sort === "modified"
            ? b.modified - a.modified
            : a.title.localeCompare(b.title)) ||
          a.path.localeCompare(b.path),
      );
  }
  related(path: string) {
    const n = this.notes.get(path);
    if (!n) return [];
    return [...this.notes.values()].filter(
      (o) =>
        o.path !== path &&
        (n.links.some((l) => this.resolve(l, path)?.path === o.path) ||
          o.links.some((l) => this.resolve(l, o.path)?.path === path)),
    );
  }
}
