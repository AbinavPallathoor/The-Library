# The Library notebook workspace

Implemented direction updated October 14: pastel blue, flat abstract cover art, no skeuomorphism. See the current [README](../../../README.md) and [implementation record](../plans/2026-10-14-the-library-notebooks.md). The original concept below is retained as design history; native device validation remains outstanding.

# Clear notebook workspace — proposed redesign

Status: visual concept for review. The user approved developing this direction after rejecting the dashboard. This document supersedes the prior library/sidebar UI direction for the next implementation; the existing plugin has not yet been rebuilt.

## Intent

A quiet, fully themed notebook experience inside Obsidian. Everything the user learns, thinks about or wants to remember belongs in notebooks. It should feel like the application rather than an extra dashboard tab. No sidebar, Capture screen, file tree, graph widget or administrative metrics. Retain dark mode, explicit editing, meaningful diagrams, active recall and Android support.

The approved conceptual flow is **notebook shelf → notebook index → note**. External LLM tools remain responsible for turning blurts into well-organized notes. Course codes remain optional explicit tags.

## Visual concept

[Three-screen mockup](../../design/notebook-concept-v1.png). Generated with the built-in image-generation tool as a design concept, not a screenshot of working software.

- Charcoal page: `#24232b`.
- Slim teal frame: `#214747`.
- Warm text: `#e9e0d4`.
- Lavender serif headings: `#c5addd`.
- Teal links: `#9ec9bd`.
- Comfortable bookish serif similar to the public Ideaverse visual direction. The exact paid-vault font remains unverified; the implementation must bundle a licensed font that works offline on Android.
- Sparse controls, centered readable pages, generous margins and a limited number of meaningful section dividers.

Prompt brief: three complete dark app screens, shown side by side; notebook covers on the shelf; a sectioned Robotics contents page; a Kalman filters reading page with a predict/correct diagram. Teal framing, lavender headings, warm serif text; no sidebar, tabs, Capture, dashboard metrics or promotional slogan. Small persistent breadcrumb/search and explicit Edit control. The generated cover textures are a concept choice to review, not a committed implementation requirement.

## Pages

### Notebook shelf

One page headed Notebooks. A small search action and a discreet New notebook action. Notebook covers show titles; four representative notebooks appear in the concept. No separate Learning/Ideas/Reference applications or sidebar. On narrow screens the covers reflow without losing readable titles; Android uses the same three-step navigation.

### Notebook index

An ordinary `Index.md` provides a short introduction, section headings and ordered links. Examples: Foundations; State estimation; Ideas & experiments. A notebook contains learning, ideas and reference notes together. The index displays all notes, not just recently opened ones.

The index view shows curated entries first, then a quiet Additional notes section for notebook files absent from Index.md. This guarantees discoverability without rewriting the user's custom prose on every vault event. LLM-authored changes should put new notes into a meaningful index section, with revision checks. Missing targets are visible and do not create files.

### Reading page

A quiet breadcrumb returns to the notebook/index; search and Edit remain discoverable. The note fills one comfortable reading column with headings, examples, diagrams and links. No adjacent note list or inspector. Reading is non-editable by default. Edit deliberately opens the guarded editor, with Save and Cancel; stale revisions preserve the draft.

Practice recall is a secondary action within the note or notebook. It opens a focused prompt-first page; answers are absent until reveal. No recall widgets clutter ordinary reading. Scheduling is a separate integration and is not implied by the concept.

## Markdown organization

A notebook is a folder with `Index.md`:

```text
Robotics/
  Index.md
  Feedback loops.md
  Kalman filters.md
  Assets/
Thinking/
  Index.md
  Developing an idea.md
```

A note has one canonical physical home. Other notebook indexes may link to it without copying it. Assets stay with their notebook or an explicitly configured shared asset location. Folder and file renames update associations. Do not split coherent notes into a file per question.

Existing notes are not moved automatically. The implementation should preview notebook assignments and moves before migrating a real vault. It can initially expose existing folders as notebooks and show unassigned root notes in a temporary Unsorted view. The plugin continues to read ordinary Markdown without a proprietary content database.

## Whole-application presentation

Provide a companion theme for native Markdown, dialogs, controls, links, search, code, callouts and editor surfaces. While notebook mode is active, hide normal Obsidian tab-strip/ribbon/sidebar chrome through scoped presentation rules. Keep a clearly labeled Return to Obsidian action in a small menu and a command-palette escape. Exit/unload must restore the previous presentation; hiding chrome must not delete or discard the user's other open panes.

This remains an Obsidian plugin and theme, not a separately installed Android app. Native desktop and Android checks must verify fullscreen presentation, navigation, system back behavior, keyboard handling and recovery. A browser mockup cannot prove host chrome behavior.

## External LLM workflow

Read notebook indexes → search existing notes → read exact revisions → update a coherent note or create a distinct one → update the appropriate index → optionally suggest recall prompts → return changed-note links and open questions. No capture input is exposed in the product UI. Existing drafts and receipts must remain recoverable when upgrading from 0.1.0 even though Capture navigation is removed.

## Acceptance for the rebuild

1. Launch into a notebook shelf with no sidebars or tab-like frame.
2. Open Robotics, see all its notes grouped in the index, and read one.
3. Follow a cross-notebook link and return with the reading position preserved.
4. Edit only after explicit Edit, then Save/Cancel; stale writes cannot overwrite human edits.
5. Practise recall without revealing the note's answer in advance.
6. Navigate and search on Android without hover or hidden swipe-only controls.
7. Exit notebook mode or unload the plugin and recover normal Obsidian chrome.
8. Validate with the user's actual theme reference and a disposable native vault before claiming host parity.

Next step: review the visual direction, particularly the notebook covers and typography, before replacing the current interface.
