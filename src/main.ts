import {
  Plugin,
  ItemView,
  WorkspaceLeaf,
  Notice,
  TFile,
  Component,
  MarkdownRenderer,
  PluginSettingTab,
  Setting,
  Platform,
} from "obsidian";
import { emptyState, loadState, renameState } from "./domain/core";
import type { ClearState, CaptureDraft } from "./domain/types";
import { VaultIndex } from "./index/vault-index";
import { ObsidianVault } from "./storage/obsidian-vault";
import { ChangeWriter, proposeCapture } from "./capture/change-writer";
import { Workspace } from "./views/workspace";
import workflow from "../docs/workflows/llm-note-workflow.md";
import { ToolHandlers } from "./bridge/tool-handlers";
const VIEW = "clear-workspace";
export default class ClearPlugin extends Plugin {
  state!: ClearState;
  index = new VaultIndex();
  vaultPort!: ObsidianVault;
  writer!: ChangeWriter;
  handlers!: ToolHandlers;
  private saving: Promise<unknown> = Promise.resolve();
  private indexing: Promise<unknown> = Promise.resolve();
  private stopped = false;
  private batchDepth = 0;
  private bridge?: { close: () => Promise<void>; descriptorPath: string };
  async onload() {
    try {
      this.state = loadState(await this.loadData());
    } catch (e) {
      new Notice(String(e), 15000);
      return;
    }
    this.vaultPort = new ObsidianVault(this.app);
    this.writer = new ChangeWriter(this.vaultPort, this.state, () =>
      this.persist(),
    );
    this.handlers = new ToolHandlers(
      this.state,
      this.index,
      this.vaultPort,
      this.writer,
      () => this.persist(),
    );
    this.registerView(VIEW, (leaf) => new ClearView(leaf, this));
    this.addRibbonIcon("book-open", "Open The Library", () => void this.open());
    this.addCommand({
      id: "open",
      name: "Open learning workspace",
      callback: () => void this.open(),
    });
    this.addCommand({
      id: "reconcile",
      name: "Refresh library",
      callback: () => void this.reconcile(),
    });
    const updatePresentation = () => document.body.classList.toggle("library-focus", this.app.workspace.getActiveViewOfType(ClearView) !== null);
    this.registerEvent(this.app.workspace.on("active-leaf-change", updatePresentation));
    this.addCommand({id: "exit-library", name: "Return to Obsidian", callback: () => document.body.classList.remove("library-focus")});
    this.addSettingTab(new ClearSettings(this.app, this));
    this.registerEvent(
      this.app.vault.on("modify", (f) => {
        if (f instanceof TFile) void this.update(f);
      }),
    );
    this.registerEvent(
      this.app.vault.on("create", (f) => {
        if (f instanceof TFile) void this.update(f);
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (f) => {
        for (const path of this.index.notes.keys())
          if (path === f.path || path.startsWith(f.path + "/"))
            this.index.remove(path);
        this.refreshViews();
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (f, old) => {
        renameState(this.state, old, f.path);
        for (const path of this.index.notes.keys())
          if (path === old || path.startsWith(old + "/"))
            this.index.remove(path);
        void this.persist();
        if (f instanceof TFile) void this.update(f);
        else void this.reconcile();
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      void (async () => {
        await this.writer.recover();
        await this.reconcile();
        if (!this.stopped && this.state.settings.openOnStart) await this.open();
      })().catch((e) => new Notice("The Library could not initialize: " + String(e)));
    });
  }
  private includes(path: string) {
    return (
      !this.state.settings.folders.length ||
      this.state.settings.folders.some((folder) =>
        path.startsWith(folder.replace(/\/$/, "") + "/"),
      )
    );
  }
  async update(file: TFile) {
    const job = this.indexing.then(async () => {
      if (this.stopped) return;
      if (file.extension !== "md" || !this.includes(file.path)) {
        this.index.remove(file.path);
        return;
      }
      try {
        const text = await this.app.vault.cachedRead(file);
        if (this.app.vault.getAbstractFileByPath(file.path) !== file) return;
        const role =
          this.state.roles[file.path] ??
          (file.path.startsWith("Thoughts/")
            ? "idea"
            : file.path.startsWith("Archives/")
              ? "reference"
              : "learning");
        this.index.upsert(file.path, text, file.stat.mtime, role);
        this.refreshViews();
      } catch {
        /* A concurrent deletion is reconciled by the vault event. */
      }
    });
    this.indexing = job.catch(() => {});
    await job;
  }
  async reconcile() {
    this.batchDepth++;
    try {
      const paths = new Set(
        this.app.vault
          .getMarkdownFiles()
          .filter((f) => this.includes(f.path))
          .map((f) => f.path),
      );
      for (const path of this.index.notes.keys())
        if (!paths.has(path)) this.index.remove(path);
      for (const f of this.app.vault.getMarkdownFiles()) await this.update(f);
    } finally {
      this.batchDepth--;
      this.refreshViews();
    }
  }
  persist() {
    const snapshot = JSON.stringify(this.state);
    const next = this.saving.then(() => this.saveData(JSON.parse(snapshot)));
    this.saving = next.catch(() => {});
    return next;
  }
  refreshViews() {
    if (this.batchDepth || this.stopped) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW))
      (leaf.view as ClearView).ui?.refresh();
  }
  async open() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    document.body.classList.add("library-focus");
  }
  async saveNote(
    path: string,
    expectedRevision: string | null,
    markdown: string,
  ) {
    const draft: CaptureDraft = {
      id: crypto.randomUUID(),
      mode: "new-learning",
      sourceRefs: [],
      writes: [
        {
          path,
          expectedRevision,
          markdown,
          role:
            this.state.roles[path] ??
            this.index.notes.get(path)?.role ??
            "learning",
        },
      ],
      topicLinks: [],
      prompts: [],
      corrections: [],
      questions: [],
    };
    const receipt = await this.writer.applyChanges(
      proposeCapture(draft, this.state.vaultId),
      crypto.randomUUID(),
    );
    if (receipt.status !== "applied") return false;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) await this.update(file);
    return true;
  }
  async startBridge() {
    if (Platform.isMobile)
      throw Error(
        "The LLM bridge is desktop-only. Android supports notebooks, editing and recall.",
      );
    if (this.bridge) return this.bridge.descriptorPath;
    const { startBridge } = await import("./bridge/server");
    this.bridge = await startBridge(this.state.vaultId, (name, input) =>
      this.handlers.dispatchTool(name, input),
    );
    return this.bridge.descriptorPath;
  }
  async stopBridge() {
    await this.bridge?.close();
    this.bridge = undefined;
  }
  onunload() {
    document.body.classList.remove("library-focus");
    this.stopped = true;
    void this.stopBridge();
  }
}
class ClearView extends ItemView {
  ui?: Workspace;
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: ClearPlugin,
  ) {
    super(leaf);
  }
  getViewType() {
    return VIEW;
  }
  getDisplayText() {
    return "The Library";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    const p = this.plugin;
    this.contentEl.empty();
    this.contentEl.addClass("clear-view");
    this.ui = new Workspace(this.contentEl, {
      exit: () => document.body.classList.remove("library-focus"),
      state: p.state,
      index: p.index,
      persist: () => p.persist(),
      notice: (m) => new Notice(m),
      saveNote: (...args) => p.saveNote(...args),
      workflow,
      render: async (md, container, path) => {
        const component = new Component();
        this.addChild(component);
        try {
          await MarkdownRenderer.render(
            this.app,
            md,
            container,
            path,
            component,
          );
        } catch (e) {
          this.removeChild(component);
          throw e;
        }
        return () => this.removeChild(component);
      },
      resolveLink: (link, source) =>
        this.app.metadataCache.getFirstLinkpathDest(
          link.split("#")[0] || source,
          source,
        )?.path,
      openAsset: async (path) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile)
          await this.app.workspace
            .getLeaf("tab")
            .openFile(file, { state: { mode: "preview" } });
      },
      applyDraft: async (draft) => {
        const receipt = await p.writer.applyChanges(
          proposeCapture(draft, p.state.vaultId),
          crypto.randomUUID(),
        );
        await p.reconcile();
        return receipt;
      },
      undo: async (id) => {
        const r = await p.writer.undoReceipt(id);
        new Notice(
          r.status === "undone"
            ? "Changes restored."
            : "Some files were retained to protect your work: " +
              r.conflicts.join(", "),
        );
        await p.reconcile();
      },
    });
    this.ui.mount();
  }
  async onClose() {
    this.ui?.destroy();
    this.ui = undefined;
  }
}
class ClearSettings extends PluginSettingTab {
  constructor(
    app: Plugin["app"],
    private plugin: ClearPlugin,
  ) {
    super(app, plugin);
  }
  display() {
    const p = this.plugin;
    this.containerEl.empty();
    this.containerEl.createEl("h2", { text: "The Library" });
    new Setting(this.containerEl)
      .setName("Open The Library on startup")
      .addToggle((t) =>
        t.setValue(p.state.settings.openOnStart).onChange(async (v) => {
          p.state.settings.openOnStart = v;
          await p.persist();
        }),
      );
    new Setting(this.containerEl)
      .setName("Library folders")
      .setDesc(
        "Comma-separated folder paths. Leave blank to include all Markdown notes.",
      )
      .addText((t) =>
        t.setValue(p.state.settings.folders.join(", ")).onChange(async (v) => {
          p.state.settings.folders = v
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          await p.persist();
        }),
      )
      .addButton((b) =>
        b.setButtonText("Refresh library").onClick(() => void p.reconcile()),
      );
    new Setting(this.containerEl).setName("Reading font").addDropdown((d) =>
      d
        .addOptions({
          "Clear Lora": "Lora (bundled serif)",
          "var(--font-text)": "Obsidian text font",
          serif: "System serif",
        })
        .setValue(p.state.settings.readingFont)
        .onChange(async (v) => {
          p.state.settings.readingFont = v;
          await p.persist();
          p.refreshViews();
        }),
    );
    new Setting(this.containerEl)
      .setName("Export The Library registry")
      .setDesc(
        "Pins, prompts, drafts and receipts. Markdown content stays in your vault.",
      )
      .addButton((b) =>
        b.setButtonText("Export JSON").onClick(() => {
          const blob = new Blob([JSON.stringify(p.state, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "clear-registry.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }),
      );
    if (!Platform.isMobile)
      new Setting(this.containerEl)
        .setName("External LLM connection")
        .setDesc(
          "Optional local MCP bridge. Off on every startup. Your vault is shared only with clients holding its local connection file.",
        )
        .addButton((b) =>
          b.setButtonText("Start local bridge").onClick(async () => {
            try {
              const path = await p.startBridge();
              new Notice("Connection file: " + path, 15000);
            } catch (e) {
              new Notice(String(e));
            }
          }),
        )
        .addButton((b) =>
          b.setButtonText("Stop bridge").onClick(() => void p.stopBridge()),
        );
  }
}
