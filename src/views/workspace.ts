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
import { el, button, field, select } from "./dom";
export interface WorkspaceHost {
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
type Page =
  | "Home"
  | "Library"
  | "Topics"
  | "Ideas"
  | "Reference"
  | "Review"
  | "Capture";
export class Workspace {
  private displayedRevision?: string;
  private page: Page = "Home";
  private current?: string;
  private editing = false;
  private saving = false;
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
    this.nav = el("nav", "clear-nav", undefined, this.root);
    this.nav.setAttribute("aria-label", "Clear navigation");
    const brand = el("div", "clear-brand", undefined, this.nav);
    el("span", "clear-mark", "✳", brand);
    el("span", "", "Clear", brand);
    el("p", "clear-brand-caption", "A place for your thinking", this.nav);
    for (const [name, icon] of [
      ["Home", "⌂"],
      ["Library", "▤"],
      ["Topics", "❋"],
      ["Ideas", "◇"],
      ["Reference", "▧"],
      ["Review", "◷"],
      ["Capture", "＋"],
    ] as [Page, string][]) {
      const b = button(
        this.nav,
        "",
        () => this.navigate(name),
        "clear-nav-item",
      );
      b.dataset.page = name;
      el("span", "clear-nav-icon", icon, b).setAttribute("aria-hidden", "true");
      el("span", "", name, b);
      b.setAttribute("aria-label", name);
    }
    const mobileMenu = select(this.nav, "Navigate Clear", ["Home", "Library", "Topics", "Ideas", "Reference", "Review", "Capture"].map(p => [p, p] as [string, string]), this.page, value => { this.navigate(value as Page); mobileMenu.value = this.page; });
    mobileMenu.classList.add("clear-mobile-navigation");
    el("div", "clear-nav-foot", "Your notes. Room to think.", this.nav);
    this.list = el("aside", "clear-library", undefined, this.root);
    this.list.setAttribute("aria-label", "Note library");
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
          "Could not save Clear settings. Your Markdown notes are unchanged.",
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
    const mobileMenu = this.nav.querySelector<HTMLSelectElement>(".clear-mobile-navigation");
    if (mobileMenu) mobileMenu.value = page;
    this.current = undefined;
    this.clearReader();
    this.root.dataset.screen = "list";
    this.root.dataset.page = page;
    for (const b of this.nav.querySelectorAll<HTMLButtonElement>(
      "[data-page]",
    )) {
      b.classList.toggle("is-active", b.dataset.page === page);
      b.setAttribute(
        "aria-current",
        b.dataset.page === page ? "page" : "false",
      );
    }
    this.renderList();
    if (page === "Home") this.home();
    else if (page === "Review") this.review();
    else if (page === "Capture") this.capture();
    else this.emptyReader();
  }
  refresh() {
    if (this.destroyed) return;
    this.root.style.setProperty(
      "--clear-reading-font",
      this.host.state.settings.readingFont || "Clear Lora",
    );
    this.renderList();
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
      } else if (this.page === "Home") this.home();
    }
  }
  private clearReader() {
    this.renderId++;
    this.cleanup?.();
    this.cleanup = undefined;
    this.main.replaceChildren();
  }
  private heading(title: string, sub?: string) {
    el("h1", "clear-page-title", title, this.main);
    if (sub) el("p", "clear-subtitle", sub, this.main);
  }
  private renderList() {
    this.list.replaceChildren();
    const head = el("div", "clear-list-head", undefined, this.list);
    el(
      "h2",
      "",
      this.page === "Ideas"
        ? "Ideas"
        : this.page === "Reference"
          ? "Reference"
          : this.page === "Topics"
            ? "Topics"
            : "Library",
      head,
    );
    const search = el("input", "clear-search", undefined, head);
    search.type = "search";
    search.placeholder = "Find something you know…";
    search.setAttribute("aria-label", "Search your notes");
    search.value = this.host.state.query.text;
    search.oninput = () => {
      this.host.state.query.text = search.value;
      clearTimeout(this.queryTimer);
      this.queryTimer = setTimeout(() => {
        this.renderResults(results, count);
        this.persist();
      }, 100);
    };
    const filters = el("div", "clear-filters", undefined, head);
    const tags = [
      ...new Set([...this.host.index.notes.values()].flatMap((n) => n.tags)),
    ].sort();
    const selected = this.host.state.query.tags[0] ?? "";
    if (selected && !tags.includes(selected)) tags.unshift(selected);
    select(
      filters,
      "Filter by tag",
      [["", "All tags"], ...tags.map((t) => [t, "#" + t] as [string, string])],
      selected,
      (v) => {
        this.host.state.query.tags = v ? [v] : [];
        this.renderResults(results, count);
        this.persist();
      },
    );
    select(
      filters,
      "Sort notes",
      [
        ["modified", "Recently changed"],
        ["title", "Title"],
      ],
      this.host.state.query.sort,
      (v) => {
        this.host.state.query.sort = v as "title" | "modified";
        this.renderResults(results, count);
        this.persist();
      },
    );
    const tools = el("div", "clear-list-tools", undefined, head);
    const count = el("span", "clear-muted", "", tools);
    button(
      tools,
      this.cards ? "List" : "Cards",
      () => {
        this.cards = !this.cards;
        this.renderList();
      },
      "clear-text-button",
    );
    button(
      tools,
      "Clear filters",
      () => {
        this.host.state.query = { text: "", tags: [], sort: "modified" };
        this.persist();
        this.renderList();
      },
      "clear-text-button",
    );
    const results = el("div", "clear-results", undefined, this.list);
    this.renderResults(results, count);
  }
  private renderResults(results: HTMLElement, count: HTMLElement) {
    results.replaceChildren();
    results.classList.toggle("is-cards", this.cards);
    const q = {
      ...this.host.state.query,
      role:
        this.page === "Ideas"
          ? ("idea" as const)
          : this.page === "Reference"
            ? ("reference" as const)
            : undefined,
    };
    let notes = this.host.index.findNotes(q);
    if (this.page === "Topics")
      notes = notes.filter(
        (n) =>
          this.host.state.topicLinks.some((t) => t.hubPath === n.path) ||
          n.links.length >= 2 ||
          n.tags.includes("hub"),
      );
    count.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
    if (!notes.length)
      el(
        "p",
        "clear-empty",
        this.host.index.notes.size
          ? "No matches. Clear the filters or try another phrase."
          : "Your library is empty. Add a Markdown note to your vault, or open Capture.",
        results,
      );
    // Incremental pages avoid thousands of DOM nodes on Android.
    let shown = 0;
    const more = () => {
      const end = Math.min(shown + 60, notes.length);
      for (; shown < end; shown++) {
        const n = notes[shown];
        const b = button(
          results,
          "",
          () => this.openNote(n.path),
          "clear-note-row",
        );
        b.classList.toggle("is-selected", this.current === n.path);
        el("span", "clear-note-title", n.title, b);
        el("span", "clear-note-excerpt", n.excerpt || "Open this note", b);
        el(
          "span",
          "clear-note-meta",
          n.tags.length
            ? n.tags
                .slice(0, 2)
                .map((t) => "#" + t)
                .join("  ")
            : n.role,
          b,
        );
      }
      if (shown < notes.length) {
        const next = button(
          results,
          "Show more notes",
          () => {
            next.remove();
            more();
          },
          "clear-load-more",
        );
      }
    };
    more();
  }
  private home() {
    this.clearReader();
    const wrap = el("section", "clear-home", undefined, this.main);
    el(
      "p",
      "clear-date",
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
      wrap,
    );
    el("h1", "clear-greeting", "Make room for a thought.", wrap);
    el(
      "p",
      "clear-home-intro",
      "Return to an idea. Follow a connection. Let what you learn become yours.",
      wrap,
    );
    const last =
      this.host.state.lastNote &&
      this.host.index.notes.get(this.host.state.lastNote);
    if (last) {
      const c = button(
        wrap,
        "",
        () => this.openNote(last.path),
        "clear-resume",
      );
      el("span", "clear-resume-label", "Continue reading", c);
      el("h2", "", last.title, c);
      el("p", "", last.excerpt, c);
      el("span", "clear-resume-link", "Open note ↗", c);
    }
    const actions = el("div", "clear-home-actions", undefined, wrap);
    button(
      actions,
      "Explore your library",
      () => this.navigate("Library"),
      "clear-primary",
    );
    button(actions, "Start recall", () => this.navigate("Review"));
    button(actions, "Capture a thought", () => this.navigate("Capture"));
    const pins = this.host.state.pins
      .map((p) => this.host.index.notes.get(p))
      .filter((n): n is NoteRecord => !!n);
    el(
      "h2",
      "clear-section-title",
      pins.length ? "Kept close" : "Recent connections",
      wrap,
    );
    const rows = el("div", "clear-home-notes", undefined, wrap);
    for (const n of (pins.length
      ? pins
      : this.host.index.findNotes({ text: "", tags: [], sort: "modified" })
    ).slice(0, 6)) {
      const b = button(
        rows,
        "",
        () => this.openNote(n.path),
        "clear-home-note",
      );
      el("span", "", n.title, b);
      el("span", "clear-muted", n.headings[0] ?? n.role, b);
    }
    if (!this.host.index.notes.size)
      el(
        "p",
        "clear-empty",
        "Your existing Markdown notes will appear here. Clear keeps them in their current folders.",
        rows,
      );
  }
  private emptyReader() {
    this.clearReader();
    const e = el("div", "clear-reader-empty", undefined, this.main);
    el("span", "clear-empty-mark", "✳", e);
    el("h1", "", "Follow your curiosity.", e);
    el("p", "", "Choose a note from the library to begin reading.", e);
  }
  async openNote(path: string, push = true, anchor?: string) {
    if (!this.allowNavigation()) return;
    const n = this.host.index.notes.get(path);
    if (!n) {
      this.host.notice(
        "This note is missing. Clear will not create it automatically.",
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
      for (const t of n.tags)
        button(
          tags,
          "#" + t,
          () => {
            this.host.state.query.tags = [t];
            this.navigate("Library");
          },
          "clear-tag",
        );
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
    const tags = this.host.state.query.tags;
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
      "This is unscheduled practice. Clear does not infer mastery or invent due dates. For scheduled cards, use Spaced Repetition in Obsidian.",
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
  private capture() {
    this.clearReader();
    this.root.dataset.screen = "reader";
    const wrap = el("section", "clear-capture", undefined, this.main);
    this.heading(
      "Catch a thought.",
      "Blurt freely. Your LLM can turn it into connected notes.",
    );
    this.main.append(wrap);
    const raw = field(
      wrap,
      "What did you learn?",
      "Write the messy version. Connections, questions and half-formed ideas belong here.",
      true,
    );
    raw.classList.add("clear-blurt");
    const source = field(
      wrap,
      "Source (optional)",
      "Book, article, lecture or link",
    );
    const course = field(
      wrap,
      "Course code (only if you want a tag)",
      "e.g. CS101",
    );
    let mode = "new-learning";
    select(
      wrap,
      "Capture mode",
      [
        ["new-learning", "New learning"],
        ["recall", "Recall attempt"],
        ["idea", "Idea"],
        ["reference", "Reference"],
      ],
      mode,
      (v) => (mode = v),
    );
    const actions = el("div", "clear-home-actions", undefined, wrap);
    button(
      actions,
      "Copy for my LLM",
      async () => {
        const text =
          this.host.workflow +
          "\n\nCapture mode: " +
          mode +
          "\nSource: " +
          source.value +
          "\n" +
          (course.value.trim()
            ? "Explicit course code: " + course.value.trim() + "\n"
            : "No course code supplied.\n") +
          "\nMy blurt:\n" +
          raw.value;
        try {
          await navigator.clipboard.writeText(text);
          this.host.notice(
            "Copied instructions and blurt. Paste them into your LLM.",
          );
        } catch {
          this.host.notice(
            "Clipboard unavailable. Select and copy your text manually.",
          );
        }
      },
      "clear-primary",
    );
    button(actions, "Keep draft", () => {
      if (!raw.value.trim()) return;
      this.host.state.captures.push({
        id: crypto.randomUUID(),
        text: raw.value,
        source: source.value,
        mode: mode as "new-learning",
        ...(course.value.trim()
          ? { explicitCourseCode: course.value.trim() }
          : {}),
      });
      this.persist();
      this.host.notice("Draft saved in Clear.");
    });
    const quick = el("details", "clear-capture-details", undefined, wrap);
    el("summary", "", "Create a note yourself", quick);
    const title = field(quick, "Note title", "A coherent topic");
    const content = field(quick, "Markdown", "Your explanation…", true);
    button(
      quick,
      "Create note",
      async () => {
        const folder = this.host.state.settings.captureFolder;
        const path =
          (folder ? folder.replace(/\/$/, "") + "/" : "") +
          title.value.trim() +
          ".md";
        if (!title.value.trim() || !content.value.trim()) {
          this.host.notice("Enter a title and note content.");
          return;
        }
        try {
          if (await this.host.saveNote(path, null, content.value))
            void this.openNote(path);
        } catch (e) {
          this.host.notice(String(e));
        }
      },
      "clear-primary",
    );
    const structured = el("details", "clear-capture-details", undefined, wrap);
    el("summary", "", "Apply an LLM proposal", structured);
    el(
      "p",
      "",
      "Paste the CaptureDraft JSON returned by your connected LLM. Clear checks revisions before writing.",
      structured,
    );
    const json = field(
      structured,
      "Proposal JSON",
      '{"id": "…", "writes": […]}',
      true,
    );
    button(
      structured,
      "Apply proposal",
      async () => {
        try {
          const receipt = await this.host.applyDraft(JSON.parse(json.value));
          this.host.notice(
            receipt.status === "applied"
              ? "Notes updated."
              : `${receipt.status}: ${receipt.conflicts.join(", ")}`,
          );
          this.capture();
        } catch (e) {
          this.host.notice("Proposal could not be applied: " + String(e));
        }
      },
      "clear-primary",
    );
    if (this.host.state.captures.length) {
      el("h2", "clear-section-title", "Saved drafts", wrap);
      for (const c of this.host.state.captures) {
        const row = el("div", "clear-draft", undefined, wrap);
        el("p", "", c.text.slice(0, 160), row);
        button(row, "Load draft", () => {
          raw.value = c.text;
          source.value = c.source;
          course.value = c.explicitCourseCode ?? "";
          mode = c.mode;
        });
        button(row, "Remove draft", () => {
          this.host.state.captures = this.host.state.captures.filter(
            (x) => x.id !== c.id,
          );
          this.persist();
          this.capture();
        });
      }
    }
    if (this.host.state.receipts.length) {
      el("h2", "clear-section-title", "Recent changes", wrap);
      for (const r of this.host.state.receipts.slice(-5).reverse()) {
        const row = el("div", "clear-receipt", undefined, wrap);
        el("strong", "", r.status, row);
        el("p", "", r.paths.join(", ") || r.conflicts.join(", "), row);
        if (r.status === "applied")
          button(row, "Undo these changes", async () => {
            await this.host.undo(r.requestId);
            this.capture();
          });
      }
    }
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
