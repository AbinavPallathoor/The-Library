import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".preview/The Library Validation");
await mkdir(path.join(root, ".obsidian/plugins/the-library"), { recursive: true });
for (const f of ["main.js", "manifest.json", "styles.css"])
  await copyFile(f, path.join(root, ".obsidian/plugins/the-library", f));
await writeFile(
  path.join(root, ".obsidian/community-plugins.json"),
  JSON.stringify(["the-library"]),
);
await writeFile(
  path.join(root, ".obsidian/app.json"),
  JSON.stringify({ defaultViewMode: "preview" }),
);
for (const [name, body] of Object.entries({
  "Thinking in systems.md":
    "---\ntags: [systems]\n---\n## A system is connected\nBehavior emerges from relationships. A **balancing loop** reduces a gap.\n\n```mermaid\nflowchart LR\nObserve --> Compare --> Adjust --> Observe\n```\n\n## Remember this\nTry to reconstruct the feedback loop from memory.\n\n- [ ] This checkbox must remain unchanged in The Library reading mode.\n\n[[Feedback loops]]\n[[Memory and practice]]",
  "Feedback loops.md":
    "## Correcting the gap\nA thermostat compares the room temperature with a target. Feedback closes the gap.\n\n[[Thinking in systems]]",
  "Memory and practice.md":
    "## Retrieve before rereading\nTry to explain an idea before looking at the answer.\n\n[[Thinking in systems]]",
  "An idea.md": "## A place to wander\nConnect what I learn across subjects.",
}))
  await writeFile(path.join(root, name), body);
console.log(root);
