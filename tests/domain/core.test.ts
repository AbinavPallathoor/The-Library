import { describe, it, expect } from "vitest";
import {
  emptyState,
  loadState,
  validateRoute,
  parseNoteStyle,
  revision,
  renameState,
} from "../../src/domain/core";
import { VaultIndex } from "../../src/index/vault-index";
import { mergeOwnedHub } from "../../src/topics/hub-renderer";
describe("safe portable state", () => {
  it("preserves metadata and rejects paths outside Markdown content", () => {
    expect(emptyState().schemaVersion).toBe(1);
    for (const path of [
      "../outside.md",
      "/a.md",
      ".obsidian/config.md",
      "a/../b.md",
      "a\\b.md",
      "x.txt",
      "a//b.md",
    ])
      expect(validateRoute(path).ok).toBe(false);
    expect(validateRoute("Learnings/Covariance.md").ok).toBe(true);
    expect(
      parseNoteStyle("---\ndate: today\ntags: [math]\n---\nBody").frontmatter,
    ).toBe("date: today\ntags: [math]");
  });
  it("does not reset future state or ignore malformed persisted data", () => {
    expect(() => loadState({ schemaVersion: 99 })).toThrow(/version/);
    expect(() => loadState({ schemaVersion: 1, pins: "invalid" })).toThrow();
    expect(loadState(null).pins).toEqual([]);
  });
  it("hashes exact bytes and follows renamed references", () => {
    expect(revision("x")).toHaveLength(64);
    expect(revision("x")).not.toBe(revision("x\n"));
    const s = emptyState();
    s.pins = ["a.md"];
    s.positions = [{ notePath: "a.md", scrollTop: 90 }];
    s.roles["a.md"] = "idea";
    renameState(s, "a.md", "b.md");
    expect(s.pins).toEqual(["b.md"]);
    expect(s.roles["b.md"]).toBe("idea");
    expect(s.positions[0].notePath).toBe("b.md");
  });
});
describe("one library", () => {
  it("searches aliases, headings and body, with optional course tag filtering", () => {
    const index = new VaultIndex();
    index.upsert(
      "Learnings/Covariance.md",
      "---\naliases: [Uncertainty]\ntags: [math]\n---\n## Correlation\nA joint relationship. #course/CS101",
      10,
      "learning",
    );
    index.upsert("Thoughts/Robot.md", "Try a new design", 12, "idea");
    index.upsert(
      "Archives/Robotics.md",
      "[[Learnings/Covariance]]",
      11,
      "reference",
    );
    const q = { text: "", tags: [], sort: "title" as const };
    expect(index.findNotes(q)).toHaveLength(3);
    for (const text of ["Uncertainty", "Correlation", "joint"])
      expect(index.findNotes({ ...q, text })).toHaveLength(1);
    expect(index.findNotes({ ...q, tags: ["course/cs101"] })[0].path).toBe(
      "Learnings/Covariance.md",
    );
    expect(index.findNotes({ ...q, role: "idea" })).toHaveLength(1);
  });
  it("only replaces the owned region in a hub", () => {
    expect(mergeOwnedHub("My words\n", ["a.md"])).toContain("My words");
    const a = mergeOwnedHub("My words\n", ["a.md"]);
    expect(mergeOwnedHub(a, ["b.md"])).not.toContain("[[a]]");
    expect(() =>
      mergeOwnedHub("<!-- clear:links:start -->", ["a.md"]),
    ).toThrow();
  });
});
it("follows folder renames without changing similarly named folders", () => {
  const s = emptyState();
  s.pins = ["Learnings/A.md", "LearningsElse/B.md"];
  s.roles["Learnings/A.md"] = "idea";
  renameState(s, "Learnings", "Knowledge");
  expect(s.pins).toEqual(["Knowledge/A.md", "LearningsElse/B.md"]);
  expect(s.roles["Knowledge/A.md"]).toBe("idea");
});
