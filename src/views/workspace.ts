import type {
  ClearState,
  Receipt,
  CaptureDraft,
} from "../domain/types";
import { VaultIndex } from "../index/vault-index";
import { parseNoteStyle, layoutMode } from "../domain/core";
import { topicTrail } from "../notebooks/breadcrumbs";
import { cover } from "./cover";
import { notebooks, type Notebook } from "../notebooks/model";
import { el, button } from "./dom";
export interface WorkspaceHost {
  focusNotebook?: (book?: Notebook, path?: string) => void;
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
type Page = "Home" | "Library";
export class Workspace {
  private displayedRevision?: string;
  private page: Page = "Home";
  private current?: string;
  private bookId?: string;
  private main!: HTMLElement;
  private history: string[] = [];
  private historyIndex = -1;
  private cleanup?: () => void;
  private renderId = 0;
  private resize?: ResizeObserver;
  private scrollTimer?: ReturnType<typeof setTimeout>;
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
  navigate(page: Page) {
    this.page = page;
    this.current = undefined;
    this.bookId = undefined;
    this.root.dataset.screen = "list";
    this.root.dataset.page = page;
    this.host.focusNotebook?.();
    this.shelf();
  }
  refresh() {
    if (this.destroyed) return;
    this.root.style.setProperty(
      "--clear-reading-font",
      this.host.state.settings.readingFont || "Clear Lora",
    );
    {
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
      } else {
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
    const headingText = el("div", "library-heading-text", undefined, heading);
    el("h1", "", "Notebooks", headingText);
    el("p", "library-description", `${notebooks(this.host.index).length} notebooks in your library`, headingText);
    const tools = el("div", "library-tools", undefined, wrap);
    el("span", "library-collection-label", "All notebooks", tools);
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
        cover(tile, book.title, book.cover);
        const caption = el("div", "library-book-caption", undefined, tile);
        const count = book.additional.length + book.sections.reduce((n,s) => n+s.entries.length,0);
        el("span", "clear-muted", `${count} ${count === 1 ? "note" : "notes"}`, caption);
        el("span", "library-open-arrow", "↗", caption).setAttribute("aria-hidden", "true");
      }
      if (query) for (const note of this.host.index.findNotes({text:query,tags:[],sort:"title"}).slice(0,60)) {
        const row = button(results, "", () => this.openNote(note.path), "library-search-note");
        el("strong", "", note.title, row); el("span", "clear-muted", note.path, row);
      }
      if (!results.children.length) el("p", "clear-empty", query ? "No matches. Try another phrase." : "Add a folder of Markdown notes to your vault to see it here.", results);
    };
    search.oninput = draw; draw();
  }
  private openBook(book: Notebook) {
    this.host.focusNotebook?.(book);
    this.bookId = book.id; this.current = undefined; this.page = "Library";
    this.clearReader(); this.root.dataset.screen = "list";
    const wrap = el("section", "library-index", undefined, this.main);
    button(wrap, "All notebooks", () => this.navigate("Library"), "clear-text-button");
    const heading = el("div", "library-heading library-notebook-heading", undefined, wrap);
    const miniature = el("div", "library-mini-cover", undefined, heading);
    cover(miniature, "", book.cover);
    const titleBlock = el("div", "library-heading-text", undefined, heading);
    el("p", "library-description", "Notebook", titleBlock);
    el("h1", "", book.title, titleBlock);
    el("p", "library-description", "Contents", titleBlock);
    if (book.index) {
      const actions = el("div", "library-top-actions", undefined, heading);
      button(actions, "Read index", () => this.openNote(book.index!.path), "clear-text-button");
    }
    const row = (title: string, path?: string) => {
      const b = button(wrap, "", () => path && this.openNote(path), "library-index-row");
      const text = el("span", "library-row-text", undefined, b);
      el("span", "library-row-title", title, text);
      const note = path && this.host.index.notes.get(path);
      el("span", "library-row-detail", note ? note.headings[0] || note.role : "Not created yet", text);
      el("span", "library-open-arrow", "↗", b).setAttribute("aria-hidden", "true");
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
    const home = button(toolbar, "Library", () => this.navigate("Library"), "clear-mobile-back");
    home.setAttribute("aria-label", "Library");
    const navigation = el("nav", "library-breadcrumbs", undefined, toolbar);
    navigation.setAttribute("aria-label", "Note location");
    const books = notebooks(this.host.index);
    const selected = books.find(b => b.id === this.bookId);
    const owns = (b: Notebook) => b.folder ? path.startsWith(b.folder + "/") : !path.includes("/");
    const book = selected && (owns(selected) || selected.sections.some(s => s.entries.some(e => e.path === path)))
      ? selected : books.filter(owns).sort((a,b) => b.folder.length-a.folder.length)[0];
    this.bookId = book?.id;
    this.host.focusNotebook?.(book, path);
    if (book) {
      button(navigation, book.title, () => this.openBook(book), "library-crumb");
      for (const item of topicTrail(this.host.index, book, path)) {
        el("span", "library-crumb-separator", "›", navigation).setAttribute("aria-hidden", "true");
        if (item.path === path) el("span", "library-crumb-current", item.title, navigation).setAttribute("aria-current", "page");
        else button(navigation, item.title, () => this.openNote(item.path), "library-crumb");
      }
    } else el("span", "library-crumb-current", n.title, navigation).setAttribute("aria-current", "page");
    const history = el("div", "library-history", undefined, toolbar);
    const back = button(history, "←", () => this.travel(-1), "clear-icon-button");
    back.setAttribute("aria-label", "Previous note"); back.disabled = this.historyIndex <= 0;
    const forward = button(history, "→", () => this.travel(1), "clear-icon-button");
    forward.setAttribute("aria-label", "Next note"); forward.disabled = this.historyIndex >= this.history.length - 1;
    const scroll = el("div", "clear-reader-scroll", undefined, this.main);
    const article = el("article", "clear-article", undefined, scroll);
    el("h1", "clear-note-heading", n.title, article);
    if (n.tags.length) {
      const tags = el("div", "clear-tags", undefined, article);
      for (const t of n.tags) el("span", "clear-tag", "#" + t, tags);
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
        "Unable to render this note. Open the original file in Obsidian to inspect its Markdown.",
        body,
      );
    }
    if (generation !== this.renderId) return;
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
    const next = this.historyIndex + delta;
    if (next >= 0 && next < this.history.length) {
      this.historyIndex = next;
      void this.openNote(this.history[next], false);
    }
  }
  destroy() {
    this.host.focusNotebook?.();
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
