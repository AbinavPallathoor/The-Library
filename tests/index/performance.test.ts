import { it, expect } from "vitest";
import { VaultIndex } from "../../src/index/vault-index";
it("indexes and searches 5000 canonical notes without duplicates", () => {
  const index = new VaultIndex();
  const start = performance.now();
  for (let i = 0; i < 5000; i++)
    index.upsert(
      `Learnings/Topic ${i}.md`,
      `---\ntags: [topic]\n---\n## Mechanism ${i}\nA linked topic with Unicode α and math $P$.\n[[Topic ${i + 1}]]`,
      i,
    );
  const built = performance.now();
  expect(index.findNotes({ text: "", tags: [], sort: "title" })).toHaveLength(
    5000,
  );
  expect(
    index.findNotes({
      text: "Mechanism 3456",
      tags: ["topic"],
      sort: "title",
    })[0].path,
  ).toBe("Learnings/Topic 3456.md");
  console.log(
    JSON.stringify({
      notes: 5000,
      indexMs: Math.round(built - start),
      searchMs: Math.round(performance.now() - built),
    }),
  );
});
