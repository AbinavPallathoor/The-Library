import type {
  ClearState,
  NoteRecord,
  RecallPrompt,
  Receipt,
  CaptureDraft,
} from "../domain/types";
import { VaultIndex } from "../index/vault-index";
import { parseNoteStyle, layoutMode } from "../domain/core";
import { eligiblePrompts } from "../study/prompts";
import { notebooks, notebookDraft, type Notebook } from "../notebooks/model";
import { el, button, field, select } from "./dom";
export interface WorkspaceHost {
  exit?: () => void;
  state: ClearState;
  index: VaultIndex;
  persist: () => Promise<void>;
  render: (
    markdown: string,
    container: HTMLElement,
    path: string,
  ) => Promise<() => void>;
  saveNote: (
    path: string,
    expectedRevision: string | null,
    markdown: string,
  ) => Promise<boolean>;
  notice: (message: string) => void;
  resolveLink: (link: string, source: string) => string | undefined;
  openAsset: (path: string) => Promise<void>;
  applyDraft: (draft: CaptureDraft) => Promise<Receipt>;
  undo: (id: string) => Promise<void>;
  workflow: string;
}
type Page = "Home" | "Library" | "Review";
export class Workspace {
  private displayedRevision?: string;
  private page: Page = "Home";
  private current?: string;
  private editing = false;
  private saving = false;
  private bookId?: string;
  private list!: HTMLElement;
  private main!: HTMLElement;
  private nav!: HTMLElement;
  private history: string[] = [];
  private historyIndex = -1;
  private cleanup?: () => void;
  private renderId = 0;
  private resize?: ResizeObserver;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private cards = false;
  private queryTimer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  constructor(
    private root: HTMLElement,
    private host: WorkspaceHost,
  ) {}
  mount() {
    this.root.classList.add("clear-workspace");
    this.root.replaceChildren();
    this.root.style.setProperty(
      "--clear-reading-font",
      this.host.state.settings.readingFont || "Clear Lora",
    );
    this.nav = el("header", "library-topbar", undefined, this.root);
    button(this.nav, "The Library", () => this.navigate("Library"), "library-wordmark");
    const actions = el("div", "library-top-actions", undefined, this.nav);
    button(actions, "Practice", () => this.navigate("Review"), "clear-text-button");
    if (this.host.exit) button(actions, "Return to Obsidian", this.host.exit, "clear-text-button");
    this.list = el("div", "library-unused", undefined, this.root);
    this.list.hidden = true;
    this.main = el("main", "clear-main", undefined, this.root);
    this.resize =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(
            (entries) =>
              (this.root.dataset.layout = layoutMode(
                entries[0].contentRect.width,
              )),
          );
    this.resize?.observe(this.root);
    this.root.dataset.layout = layoutMode(this.root.clientWidth || 1280);
    this.navigate("Home");
  }
  private persist() {
    void this.host
      .persist()
      .catch(() =>
        this.host.notice(
          "Could not save The Library settings. Your Markdown notes are unchanged.",
        ),
      );
  }
  private allowNavigation() {
    if (this.editing) {
      this.host.notice("Save or cancel your edit before leaving this note.");
      return false;
    }
    return true;
  }
  navigate(page: Page) {
    if (!this.allowNavigation()) return;
    this.page = page;
    this.current = undefined;
    this.bookId = undefined;
    this.root.dataset.screen = "list";
    this.root.dataset.page = page;
    if (page === "Review") this.review();
    else this.shelf();
  }
  refresh() {
    if (this.destroyed) return;
    this.root.style.setProperty(
      "--clear-reading-font",
      this.host.state.settings.readingFont || "Clear Lora",
    );
    if (!this.editing) {
      if (this.current) {
        const note = this.host.index.notes.get(this.current);
        if (!note) {
          this.current = undefined;
          this.clearReader();
          el(
            "p",
            "clear-empty",
            "This note was moved or deleted. Find it in the library.",
            this.main,
          );
        } else if (note.revision !== this.displayedRevision)
          void this.openNote(this.current, false);
      } else if (this.page !== "Review") {
        const book = notebooks(this.host.index).find(b => b.id === this.bookId);
        if (book) this.openBook(book); else this.shelf();
      }
    }
  }
  private clearReader() {
    this.renderId++;
    this.cleanup?.();
    this.cleanup = undefined;
    this.main.replaceChildren();
  }
  private shelf() {
    this.clearReader();
    const wrap = el("section", "library-shelf", undefined, this.main);
    const heading = el("div", "library-heading", undefined, wrap);
    el("h1", "", "Notebooks", heading);
    button(heading, "New notebook", () => this.newNotebook(), "clear-primary");
    const tools = el("div", "library-tools", undefined, wrap);
    const search = el("input", "clear-search", undefined, tools);
    search.type = "search"; search.placeholder = "Search notebooks and notes";
    search.setAttribute("aria-label", search.placeholder);
    const results = el("div", "library-grid", undefined, wrap);
    const draw = () => {
      results.replaceChildren();
      const query = search.value.trim().toLowerCase();
      results.classList.toggle("library-search-results", !!query);
      const books = notebooks(this.host.index);
      for (const book of books.filter(b => !query || b.title.toLowerCase().includes(query))) {
        const tile = button(results, "", () => this.openBook(book), "library-book");
        tile.setAttribute("aria-label", "Open notebook " + book.title);
        const art = el("div", "library-cover art-" + book.cover, undefined, tile);
        for (let i=0; i<4; i++) el("i", "", undefined, art).setAttribute("aria-hidden", "true");
        el("span", "library-cover-title", book.title, art);
        el("strong", "", book.title, tile);
        el("span", "clear-muted", `${book.additional.length + book.sections.reduce((n,s) => n+s.entries.length,0)} notes`, tile);
      }
      if (query) for (const note of this.host.index.findNotes({text:query,tags:[],sort:"title"}).slice(0,60)) {
        const row = button(results, "", () => this.openNote(note.path), "library-search-note");
        el("strong", "", note.title, row); el("span", "clear-muted", note.path, row);
      }
      if (!results.children.length) el("p", "clear-empty", query ? "No matches. Try another phrase." : "Create your first notebook. Existing Markdown folders also appear here.", results);
    };
    search.oninput = draw; draw();
  }
  private newNotebook() {
    if (!this.allowNavigation()) return;
    this.clearReader();
    const wrap = el("section", "library-index", undefined, this.main);
    el("h1", "", "A new notebook", wrap);
    const input = el("input", "clear-search", undefined, wrap);
    input.placeholder = "Notebook name"; input.setAttribute("aria-label", "Notebook name");
    const actions = el("div", "library-tools", undefined, wrap);
    const create = button(actions, "Create notebook", async () => {
      create.disabled = true;
      try {
        const draft = notebookDraft(input.value, crypto.randomUUID());
        if (!await this.host.saveNote(draft.path, null, draft.markdown)) throw Error("A notebook with this name already exists.");
        const book = notebooks(this.host.index).find(b => b.index?.path === draft.path);
        if (book) this.openBook(book); else this.navigate("Library");
      } catch (e) { this.host.notice(String(e)); } finally { create.disabled = false; }
    }, "clear-primary");
    button(actions, "Cancel", () => this.navigate("Library")); input.focus();
  }
  private openBook(book: Notebook) {
    if (!this.allowNavigation()) return;
    this.bookId = book.id; this.current = undefined; this.page = "Library";
    this.clearReader(); this.root.dataset.screen = "list";
    const wrap = el("section", "library-index", undefined, this.main);
    button(wrap, "All notebooks", () => this.navigate("Library"), "clear-text-button");
    const heading = el("div", "library-heading", undefined, wrap);
    el("h1", "", book.title, heading);
    if (book.index) {
      const actions = el("div", "library-top-actions", undefined, heading);
      button(actions, "Read index", () => this.openNote(book.index!.path), "clear-text-button");
      button(actions, "Edit index", () => this.edit(book.index!), "clear-text-button");
    }
    const row = (title: string, path?: string) => {
      const b = button(wrap, title + (path ? "" : " — not created"), () => path && this.openNote(path), "library-index-row");
      b.disabled = !path;
    };
    for (const section of book.sections) {
      el("h2", "library-section", section.title, wrap);
      for (const entry of section.entries) row(entry.title, entry.path);
    }
    if (book.additional.length) {
      el("h2", "library-section", book.sections.length ? "Additional notes" : "Notes", wrap);
      for (const note of book.additional) row(note.title, note.path);
    }
    if (!book.sections.length && !book.additional.length) el("p", "clear-muted", "Add Markdown notes to this notebook’s folder, or ask your LLM to organize what you learned here.", wrap);
  }
  async openNote(path: string, push = true, anchor?: string) {
    if (!this.allowNavigation()) return;
    const n = this.host.index.notes.get(path);
    if (!n) {
      this.host.notice(
        "This note is missing. The Library will not create it automatically.",
      );
      return;
    }
    this.current = path;
    this.displayedRevision = n.revision;
    this.host.state.lastNote = path;
    this.root.dataset.screen = "reader";
    if (push) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(path);
      this.historyIndex = this.history.length - 1;
    }
    this.persist();
    this.clearReader();
    const generation = this.renderId;
    const toolbar = el("div", "clear-reader-toolbar", undefined, this.main);
    button(
      toolbar,
      "Library",
      () => this.navigate("Library"),
      "clear-mobile-back",
    );
    const book = notebooks(this.host.index).find(b => b.id === this.bookId) ?? notebooks(this.host.index).filter(b => path.startsWith(b.folder + "/")).sort((a,b) => b.folder.length-a.folder.length)[0];
    if (book) button(toolbar, book.title, () => this.openBook(book), "clear-text-button");
    const back = button(
      toolbar,
      "←",
      () => this.travel(-1),
      "clear-icon-button",
    );
    back.setAttribute("aria-label", "Previous note");
    back.disabled = this.historyIndex <= 0;
    const forward = button(
      toolbar,
      "→",
      () => this.travel(1),
      "clear-icon-button",
    );
    forward.setAttribute("aria-label", "Next note");
    forward.disabled = this.historyIndex >= this.history.length - 1;
    el("span", "clear-reading-label", "Reading", toolbar);
    const pin = button(
      toolbar,
      this.host.state.pins.includes(path) ? "Unpin" : "Pin",
      () => {
        const s = this.host.state;
        s.pins = s.pins.includes(path)
          ? s.pins.filter((p) => p !== path)
          : [...s.pins, path];
        pin.textContent = s.pins.includes(path) ? "Unpin" : "Pin";
        this.persist();
      },
    );
    button(toolbar, "Recall", () => this.review(path));
    button(toolbar, "Edit", () => this.edit(n), "clear-primary");
    const scroll = el("div", "clear-reader-scroll", undefined, this.main);
    const article = el("article", "clear-article", undefined, scroll);
    el(
      "p",
      "clear-breadcrumb",
      n.path.includes("/")
        ? n.path.slice(0, n.path.lastIndexOf("/"))
        : "Your library",
      article,
    );
    el("h1", "clear-note-heading", n.title, article);
    if (n.tags.length) {
      const tags = el("div", "clear-tags", undefined, article);
      for (const t of n.tags) el("span", "clear-tag", "#" + t, tags);
    }
    if (n.headings.length) {
      const details = el("details", "clear-outline", undefined, article);
      el("summary", "", "In this note", details);
      for (const h of n.headings)
        button(
          details,
          h,
          () => this.goHeading(article, h),
          "clear-outline-link",
        );
    }
    const body = el(
      "div",
      "clear-markdown markdown-rendered",
      undefined,
      article,
    );
    body.setAttribute("aria-label", "Note content, reading mode");
    const preventEdits = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('input,textarea,button,select,[contenteditable="true"]')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    body.addEventListener("click", preventEdits, true);
    body.addEventListener(
      "dblclick",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    );
    body.addEventListener("beforeinput", preventEdits, true);
    body.addEventListener(
      "click",
      (event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          "a.internal-link,a[data-href]",
        );
        if (link) {
          event.preventDefault();
          event.stopPropagation();
          const target = link.dataset.href ?? link.getAttribute("href") ?? "";
          const resolved = this.host.resolveLink(target, path);
          if (resolved && this.host.index.notes.has(resolved))
            void this.openNote(resolved, true, target.split("#")[1]);
          else if (resolved) void this.host.openAsset(resolved);
          else this.host.notice("Linked note not found: " + target);
        }
      },
      true,
    );
    const guard = () => {
      body
        .querySelectorAll<HTMLInputElement>("input,textarea,select")
        .forEach((e) => (e.disabled = true));
      body
        .querySelectorAll<HTMLElement>("[contenteditable]")
        .forEach((e) => (e.contentEditable = "false"));
    };
    const observer = new MutationObserver(guard);
    observer.observe(body, { childList: true, subtree: true });
    try {
      const dispose = await this.host.render(
        parseNoteStyle(n.markdown).body,
        body,
        path,
      );
      if (generation !== this.renderId || this.destroyed) {
        observer.disconnect();
        dispose();
        return;
      }
      guard();
      this.cleanup = () => {
        observer.disconnect();
        dispose();
      };
    } catch {
      observer.disconnect();
      el(
        "p",
        "clear-error",
        "Unable to render this note. You can still open Edit to inspect its Markdown.",
        body,
      );
    }
    if (generation !== this.renderId) return;
    const related = this.host.index.related(path);
    if (related.length) {
      const footer = el("section", "clear-related", undefined, article);
      el("h2", "", "Keep exploring", footer);
      for (const r of related)
        button(
          footer,
          r.title,
          () => this.openNote(r.path),
          "clear-related-link",
        );
    }
    const pos = this.host.state.positions.find((p) => p.notePath === path);
    if (anchor) this.goHeading(article, anchor);
    else scroll.scrollTop = pos?.scrollTop ?? 0;
    scroll.addEventListener("scroll", () => {
      const existing = this.host.state.positions.find(
        (p) => p.notePath === path,
      );
      if (existing) existing.scrollTop = scroll.scrollTop;
      else
        this.host.state.positions.push({
          notePath: path,
          scrollTop: scroll.scrollTop,
        });
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.persist(), 300);
    });
  }
  private goHeading(article: HTMLElement, heading: string) {
    const target = [...article.querySelectorAll("h1,h2,h3,h4,h5,h6")].find(
      (e) => e.textContent?.trim() === heading,
    );
    target?.scrollIntoView?.({ block: "start" });
  }
  private travel(delta: number) {
    if (!this.allowNavigation()) return;
    const next = this.historyIndex + delta;
    if (next >= 0 && next < this.history.length) {
      this.historyIndex = next;
      void this.openNote(this.history[next], false);
    }
  }
  private edit(note: NoteRecord) {
    this.editing = true;
    this.clearReader();
    const toolbar = el("div", "clear-reader-toolbar", undefined, this.main);
    el("strong", "", "Editing " + note.title, toolbar);
    const save = button(
      toolbar,
      "Save",
      async () => {
        if (this.saving) return;
        this.saving = true;
        save.disabled = true;
        cancel.disabled = true;
        try {
          if (await this.host.saveNote(note.path, note.revision, input.value)) {
            this.editing = false;
            await this.openNote(note.path, false);
          } else
            this.host.notice(
              "The note changed elsewhere. Your draft is still here; copy it before cancelling and reopening the latest version.",
            );
        } catch {
          this.host.notice("Could not save. Your draft remains here.");
        } finally {
          this.saving = false;
          save.disabled = false;
          cancel.disabled = false;
        }
      },
      "clear-primary",
    );
    const cancel = button(toolbar, "Cancel", () => {
      if (this.saving) return;
      this.editing = false;
      void this.openNote(note.path, false);
    });
    el(
      "p",
      "clear-editor-hint",
      "Markdown editing · Changes are saved only when you press Save.",
      this.main,
    );
    const input = el("textarea", "clear-editor", undefined, this.main);
    input.value = note.markdown;
    input.setAttribute("aria-label", "Edit Markdown");
    input.spellcheck = true;
    input.focus();
  }
  private review(path?: string) {
    if (!this.allowNavigation()) return;
    this.page = "Review";
    this.current = undefined;
    this.clearReader();
    this.root.dataset.screen = "reader";
    const wrap = el("section", "clear-study", undefined, this.main);
    button(
      wrap,
      "Back to library",
      () => this.navigate("Library"),
      "clear-text-button",
    );
    el(
      "h1",
      "clear-page-title",
      path ? "Recall this topic" : "A little practice.",
      wrap,
    );
    el(
      "p",
      "clear-subtitle",
      "Try before you reveal. Explain it, sketch it, or work an example.",
      wrap,
    );
    const all = this.host.state.prompts.filter(
      (p) => !path || p.notePath === path,
    );
    const tags: string[] = [];
    const prompts = eligiblePrompts(all).filter(
      (p) =>
        this.host.index.notes.has(p.notePath) &&
        tags.every((t) =>
          this.host.index.notes.get(p.notePath)?.tags.includes(t),
        ),
    );
    const card = el("div", "clear-study-card", undefined, wrap);
    let i = 0;
    const show = () => {
      card.replaceChildren();
      const p = prompts[i];
      if (!p) {
        el(
          "h2",
          "",
          prompts.length
            ? "Practice complete."
            : "Choose something worth remembering.",
          card,
        );
        el(
          "p",
          "",
          prompts.length
            ? "Your assessment is saved. Come back when you want another attempt."
            : "Add a focused question and answer, or ask your LLM to propose a few from your notes.",
          card,
        );
        return;
      }
      el(
        "p",
        "clear-muted",
        `${i + 1} of ${prompts.length} • ${this.host.index.notes.get(p.notePath)?.title}`,
        card,
      );
      el("h2", "clear-question", p.question, card);
      const attempt = field(
        card,
        "Your attempt (optional)",
        "Explain from memory…",
        true,
      );
      attempt.classList.add("clear-attempt");
      button(
        card,
        "Reveal answer",
        () => {
          attempt.setAttribute("readonly", "true");
          const answer = el("div", "clear-answer", p.answer, card);
          answer.style.whiteSpace = "pre-wrap";
          const ratings = el("div", "clear-rating", undefined, card);
          for (const [grade, label] of [
            ["again", "Try again"],
            ["partial", "Partly remembered"],
            ["remembered", "Remembered"],
          ] as const)
            button(ratings, label, () => {
              p.assessment = grade;
              p.reviewedAt = Date.now();
              this.persist();
              i++;
              show();
            });
          reveal.remove();
        },
        "clear-primary",
      ).id = "clear-reveal";
      const reveal = card.querySelector("#clear-reveal")!;
    };
    show();
    if (all.some((p) => !p.enrolled)) {
      const pending = el("details", "clear-outline", undefined, wrap);
      el("summary", "", "Suggested questions", pending);
      for (const p of all.filter((p) => !p.enrolled)) {
        el("p", "", p.question, pending);
        if (p.evidence === "tentative")
          el("p", "clear-muted", "Needs verification before practice", pending);
        else
          button(pending, "Include in practice", () => {
            p.enrolled = true;
            this.persist();
            this.review(path);
          });
      }
    }
    el(
      "p",
      "clear-muted",
      "This is unscheduled practice. The Library does not infer mastery or invent due dates. For scheduled cards, use Spaced Repetition in Obsidian.",
      wrap,
    );
    const add = el("details", "clear-prompt-form", undefined, wrap);
    el("summary", "", "Add a recall question", add);
    const notes = [...this.host.index.notes.values()];
    let target = path ?? notes[0]?.path ?? "";
    select(
      add,
      "Note",
      notes.map((n) => [n.path, n.title]),
      target,
      (v) => (target = v),
    );
    const q = field(add, "Question", "Why does…?"),
      a = field(
        add,
        "Answer",
        "A short explanation, with a source if needed.",
        true,
      );
    button(
      add,
      "Add to practice",
      () => {
        if (!target || !q.value.trim() || !a.value.trim()) {
          this.host.notice("Choose a note and fill in both fields.");
          return;
        }
        this.host.state.prompts.push({
          id: crypto.randomUUID(),
          notePath: target,
          question: q.value.trim(),
          answer: a.value.trim(),
          kind: "explain",
          evidence: "user-statement",
          enrolled: true,
        });
        this.persist();
        this.review(path);
      },
      "clear-primary",
    );
  }
  destroy() {
    this.destroyed = true;
    this.renderId++;
    this.cleanup?.();
    this.resize?.disconnect();
    clearTimeout(this.scrollTimer);
    clearTimeout(this.queryTimer);
    this.persist();
    this.root.replaceChildren();
  }
}
