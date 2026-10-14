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
it("starts read-only and saves only through explicit Edit then Save", async () => {
  const { root, ui, save } = setup();
  await ui.openNote("Learning.md");
  expect(root.querySelector("textarea")).toBeNull();
  const button = (text: string) =>
    [...root.querySelectorAll("button")].find((b) => b.textContent === text)!;
  button("Edit").click();
  expect(root.querySelector("textarea")).not.toBeNull();
  const input = root.querySelector("textarea")!;
  input.value = "Changed";
  input.dispatchEvent(new Event("input"));
  expect(save).not.toHaveBeenCalled();
  button("Save").click();
  await tick();
  expect(save).toHaveBeenCalledWith(
    "Learning.md",
    expect.any(String),
    "Changed",
  );
  expect(root.querySelector("textarea")).toBeNull();
  ui.destroy();
});
it("cancel discards edits and navigation cannot discard a draft silently", async () => {
  const { root, ui, save } = setup();
  await ui.openNote("Learning.md");
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Edit")!
    .click();
  await ui.openNote("Missing.md");
  expect(root.querySelector("textarea")).not.toBeNull();
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Cancel")!
    .click();
  expect(save).not.toHaveBeenCalled();
  ui.destroy();
});
it("retains editor content after a conflict", async () => {
  const { root, ui, save } = setup();
  save.mockResolvedValue(false);
  await ui.openNote("Learning.md");
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Edit")!
    .click();
  root.querySelector("textarea")!.value = "My draft";
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Save")!
    .click();
  await tick();
  expect(root.querySelector("textarea")!.value).toBe("My draft");
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
it('keeps a note recall attempt when unrelated vault events refresh the view', async () => {
 const {root,ui,state} = setup();
 state.prompts.push({id:'p',notePath:'Learning.md',question:'Explain',answer:'Answer',kind:'explain',evidence:'source-backed',enrolled:true});
 await ui.openNote('Learning.md');
 [...root.querySelectorAll('button')].find(b => b.textContent==='Recall')!.click();
 const attempt = root.querySelector('textarea,input');
 ui.refresh();
 expect(root.querySelector('textarea,input')).toBe(attempt);
 ui.destroy();
});
