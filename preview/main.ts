import { Workspace } from "../src/views/workspace";
import { emptyState, revision } from "../src/domain/core";
import { VaultIndex } from "../src/index/vault-index";
import { marked } from "marked";
import workflow from "../docs/workflows/llm-note-workflow.md";
const state = emptyState(),
  index = new VaultIndex();
const samples: Record<string, string> = {
  "Learnings/Thinking in systems.md":
    "---\ntags: [systems, thinking]\n---\n## See the relationships\nA system is more than its parts. Its behavior emerges from the relationships between them—and from the feedback that travels through those relationships.\n\n> Look for the pattern that keeps producing an outcome, rather than only the event itself.\n\n## Feedback changes behavior\nA **reinforcing loop** amplifies change. A **balancing loop** keeps a system near a target. The interesting behavior often comes from how the two interact.\n\n### A familiar example\nA thermostat measures the room, compares it with the target, and adjusts the heater. The gap gets smaller as the feedback loop does its work.\n\n## A useful question\nWhere is the delay between action and feedback? Delays often explain why a sensible decision produces a surprising outcome.\n\n## Connections\n[[Learnings/Feedback loops]]\n[[Learnings/How memory becomes durable]]\n[[Ideas/A garden of ideas]]",
  "Learnings/Feedback loops.md":
    "---\ntags: [systems]\n---\n## Actions that return\nFeedback connects the outcome of an action back to the next decision. Small corrections can produce stable behavior.\n\n## In practice\nWhen learning a skill, attempt it first, observe the error, then adjust your next attempt.\n\n[[Learnings/Thinking in systems]]",
  "Learnings/How memory becomes durable.md":
    "---\ntags: [learning, memory]\n---\n## Retrieve before rereading\nTrying to recall something exposes the parts you do not yet understand. Feedback then helps correct the gaps.\n\n## Give learning some space\nReturn to important ideas over time. A short, effortful retrieval can be more informative than another comfortable reread.\n\n[[Learnings/Feedback loops]]",
  "Learnings/Covariance and shared movement.md":
    "---\ntags: [math, course/MA101]\n---\n## Moving together\nCovariance describes how two variables vary together. Positive covariance means they tend to move in the same direction.\n\n## A concrete example\nOn warmer days, ice cream sales often rise. Temperature and sales may have positive covariance. This alone does not establish causation.\n\n## The visual intuition\nImagine a cloud of paired observations: a tilted cloud suggests shared movement.",
  "Ideas/A garden of ideas.md":
    "---\ntags: [ideas]\n---\n## Let connections grow\nWhat if my notes felt like a garden I can wander through? Some ideas are seeds, others are paths between things I already know.\n\n## Try next\nCreate a small visual map around one question I keep returning to.\n\n[[Learnings/Thinking in systems]]",
  "Reference/Reading thoughtfully.md":
    "---\ntags: [reading]\n---\n## Keep a question nearby\nRead with a question in mind. Pause to explain the answer in your own words, then compare it with the source.",
  "Learnings/Robotics.md":
    "---\ntags: [hub, robotics]\n---\n## Sensing and deciding\n[[Learnings/Feedback loops]]\n[[Learnings/Covariance and shared movement]]\n\n## Thinking beyond the parts\n[[Learnings/Thinking in systems]]",
};
samples['Learnings/Index.md'] = '---\nnotebook-id: systems\ntitle: Learning & systems\n---\n## Connected thinking\n[[Learnings/Thinking in systems]]\n[[Learnings/Feedback loops]]\n## Learning well\n[[Learnings/How memory becomes durable]]';
samples['Ideas/Index.md'] = '---\nnotebook-id: ideas\ntitle: Ideas & possibilities\n---\n## Growing ideas\n[[Ideas/A garden of ideas]]';
samples['Reference/Index.md'] = '---\nnotebook-id: reference\ntitle: Reading & references\n---\n## Reading\n[[Reference/Reading thoughtfully]]';
samples['Robotics/Index.md'] = '---\nnotebook-id: robots\ntitle: Robotics\n---\n## Foundations\n[[Learnings/Feedback loops]]\n[[Learnings/Covariance and shared movement]]';
let time = Date.now();
for (const [path, text] of Object.entries(samples)) {
  index.upsert(
    path,
    text,
    time--,
    path.startsWith("Ideas/")
      ? "idea"
      : path.startsWith("Reference/")
        ? "reference"
        : "learning",
  );
}
state.lastNote = "Learnings/Thinking in systems.md";
state.pins = [
  "Learnings/How memory becomes durable.md",
  "Learnings/Covariance and shared movement.md",
  "Ideas/A garden of ideas.md",
  "Learnings/Feedback loops.md",
];
state.prompts = [
  {
    id: "p1",
    notePath: state.lastNote,
    question: "How does a balancing loop differ from a reinforcing loop?",
    answer:
      "A balancing loop reduces a gap from a target. A reinforcing loop amplifies a change.",
    kind: "compare",
    evidence: "source-backed",
    enrolled: true,
  },
];
let timer: ReturnType<typeof setTimeout>;
const notice = (s: string) => {
  document.querySelector("#notice")!.textContent = s;
  clearTimeout(timer);
  timer = setTimeout(
    () => (document.querySelector("#notice")!.textContent = ""),
    5000,
  );
};
const ui = new Workspace(document.querySelector("#app")!, {
  state,
  index,
  persist: async () => {},
  notice,
  workflow,
  render: async (md, container) => {
    container.innerHTML = await marked.parse(
      md.replace(
        /\[\[([^\]]+)\]\]/g,
        (_, target: string) =>
          `<a class="internal-link" data-href="${target}">${target.split("/").pop()}</a>`,
      ),
    );
    return () => {};
  },
  resolveLink: (l, s) => index.resolve(l, s)?.path,
  openAsset: async () => {},
  saveNote: async (path, expected, md) => {
    if ((index.notes.get(path)?.revision ?? null) !== expected) return false;
    index.upsert(path, md);
    return true;
  },
  applyDraft: async () => {
    throw Error(
      "Preview uses demonstration notes. Install The Library in Obsidian for vault writes.",
    );
  },
  undo: async () => {},
});
ui.mount();
