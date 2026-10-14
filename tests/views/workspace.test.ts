// @vitest-environment happy-dom
import { it, expect, vi } from "vitest";
import { Workspace } from "../../src/views/workspace";
import { emptyState, layoutMode } from "../../src/domain/core";
import { VaultIndex } from "../../src/index/vault-index";
import {
  buildStudySurface,
  eligiblePrompts,
  renderTemplate,
} from "../../src/study/prompts";
const tick = () => new Promise((r) => setTimeout(r, 10));
const setup = () => {
  const root = document.createElement("div");
  document.body.append(root);
  const state = emptyState(),
    index = new VaultIndex();
  index.upsert("Learning.md", "## Understanding\nOriginal content");
  const save = vi.fn(async () => true);
  const ui = new Workspace(root, {
    state,
    index,
    persist: async () => {},
    render: async (md, el) => {
      el.textContent = md;
      return () => {};
    },
    saveNote: save,
    notice: vi.fn(),
    openAsset: async () => {},
    resolveLink: (link, source) => index.resolve(link, source)?.path,
    applyDraft: async () => {
      throw Error("not used");
    },
    undo: async () => {},
    workflow: "Guide",
  });
  ui.mount();
  return { root, state, index, save, ui };
};
it("keeps reading free of editing, outlines, related sections and the brand header", async () => {
 const { root, ui, save } = setup();
 expect(root.querySelector('.library-topbar')).toBeNull();
 await ui.openNote('Learning.md');
 expect(root.querySelector('textarea,.clear-outline,.clear-related')).toBeNull();
 expect([...root.querySelectorAll('button')].map(b => b.textContent)).not.toContain('Edit');
 root.querySelector('.clear-markdown')!.dispatchEvent(new MouseEvent('dblclick', {bubbles:true}));
 expect(save).not.toHaveBeenCalled();
 ui.destroy();
});
it("shows clickable notebook and topic ancestors in order", async () => {
 const {root,ui,index} = setup();
 index.upsert('Learnings/Cisco Networking.md','---\ntags: [hub]\n---\n[[TCP]]');
 index.upsert('Learnings/TCP.md','Reliable delivery');
 await ui.openNote('Learnings/TCP.md');
 const nav = root.querySelector('nav')!;
 expect(nav.textContent).toBe('Learnings›Cisco Networking›TCP');
 expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('TCP');
 (nav.querySelectorAll('button')[1] as HTMLButtonElement).click();
 await tick();
 expect(root.querySelector('h1')?.textContent).toBe('Cisco Networking');
 ui.destroy();
});
it("has mobile layout boundaries and hides answers until reveal", () => {
  expect([480, 800, 1280].map(layoutMode)).toEqual([
    "single",
    "compact",
    "desktop",
  ]);
  const p = {
    id: "p",
    notePath: "A.md",
    question: "Explain",
    answer: "Secret",
    kind: "explain" as const,
    evidence: "source-backed" as const,
    enrolled: true,
  };
  expect(buildStudySurface(p, false)).toEqual({ question: "Explain" });
  expect(buildStudySurface(p, true).answer).toBe("Secret");
  expect(eligiblePrompts([{ ...p, evidence: "tentative" }])).toEqual([]);
  expect(
    renderTemplate("learning", {
      mechanism: "Prediction → correction; $P$",
      examples: "",
      connections: "[[Missing]]",
    }),
  ).toContain("$P$");
  expect(renderTemplate("learning", { examples: "" })).not.toContain(
    "Examples",
  );
});
it("mobile Library navigation leaves Home and unchanged refresh does not rerender", async () => {
  const { root, ui } = setup();
  await ui.openNote("Learning.md");
  const article = root.querySelector("article");
  ui.refresh();
  await tick();
  expect(root.querySelector("article")).toBe(article);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Library")!
    .click();
  expect(root.dataset.page).toBe("Library");
  expect(root.dataset.screen).toBe("list");
  ui.destroy();
});
it('launches into a notebook shelf without capture or sidebars, then opens its index', () => {
 const {root,ui,index} = setup();
 index.upsert('Robotics/Index.md','## Foundations\n[[Robotics/Feedback]]');
 index.upsert('Robotics/Feedback.md','Feedback explanation');
 ui.refresh();
 expect(root.querySelector('aside')).toBeNull();
 expect(root.textContent).not.toContain('Capture');
 (root.querySelector('[aria-label="Open notebook Robotics"]') as HTMLButtonElement).click();
 expect(root.textContent).toContain('Foundations');
 expect(root.textContent).toContain('Feedback');
 expect(root.querySelector('textarea')).toBeNull();
 ui.destroy();
});
it('exposes only navigation, without notebook creation or study actions', async () => {
 const {root,ui} = setup();
 const names = () => [...root.querySelectorAll('button')].map(b => b.textContent);
 expect(names()).not.toContain('New notebook');
 expect(names()).not.toContain('Practice');
 await ui.openNote('Learning.md');
 expect(names()).not.toContain('Recall');
 expect(names()).not.toContain('Pin');
 expect(names()).not.toContain('Edit');
 ui.destroy();
});
