# Clear learning workspace

Status: implementation underway; see ../../testing/learning-workspace.md for delivered scope and unverified integrations. This is the active design; it supersedes the university-centered design.

## Purpose

Provide a better Obsidian interface for one shared collection of learning, ideas, and reference notes. The primary experience is finding a topic, reading its explanation and diagrams, following useful connections, and practising recall. University content belongs in the same library as everything else. Course codes are optional tags added only when explicitly supplied by the user.

Keep the user's existing workflow: learn → blurt to an external LLM → search/update the right notes → connect topics → return later to learn and review. The plugin is the navigation and learning interface; Markdown files in the vault remain the content store.

## Organization

- One searchable library across configured vault folders. Learning, Idea, and Reference are views/filters, not mandatory physical directories.
- Topics and existing hub notes provide conceptual navigation. A note can appear in several topic views without duplicating files.
- No university, semester, syllabus, module, assessment, or exam-management hierarchy.
- Optional course tags are ordinary Obsidian tags, such as `#course/CS101`. They filter the same library and review view; they do not relocate notes or create a course database.
- Add a course tag only when the user supplies a code for that capture or explicitly asks to apply it. Do not infer it from a subject, mention of university, existing similar notes, or last-used filter.
- Updating a shared topic preserves existing course tags and can add another explicitly supplied tag. If a tag would ambiguously imply the whole note belongs to a course, the LLM may label the relevant section; it must explain the association rather than duplicate the concept.
- Course tagging is never required to create, find, read, or review a note.

## Main interface

Desktop uses a quiet three-part layout: navigation sidebar, searchable note list, reading pane. The sidebar contains Home, Library, Topics, Ideas, Reference, Review, and Capture. Course tags are a secondary filter, never a primary section.

### Home

Resume the last topic and reading location, access pinned topics/notes, see recent changes, and open study or capture. Show actual due counts only when a supported scheduler provides them; otherwise label the action Study. Avoid charts and administrative statistics that do not help the user choose a next action.

### Library and Topics

Search titles, existing aliases, headings, tags, and body text. Results display title, meaningful excerpt, topic/tag context, and a useful modified date. Support list/compact-card presentation, recent/title sorting, role/tag filters, and clearing filters. Show empty states and index status honestly.

Topics opens existing hubs and their linked notes, with breadcrumbs and return navigation. Offer suggested related notes based on existing links/tags as navigation suggestions, not verified conceptual prerequisites. Ordinary wikilinks and heading links remain clickable. Unresolved links are visible without automatically creating files.

### Reading and learning

The reader foregrounds a topic's explanation, informative headings, worked examples, diagrams, and sources. Include a collapsible outline, related-note panel, pin, back/forward, and visible Open in Obsidian Editor action. Preserve native editing and link behavior. Save reading position per note; restore a heading anchor where possible and fall back to a nearby scroll position after edits.

Render notes through supported Obsidian Markdown APIs, with child components cleaned up on navigation/unload. Editable Excalidraw assets open in their supported editor; Mermaid and ordinary image embeds render in the note. If an embed renderer is unavailable, show the asset link and a useful explanation rather than an empty placeholder. Canvas opens as a topic overview; it does not replace the readable topic page.

### Review

From any learning note, Start recall opens a prompt-first surface with the explanation hidden. Support explanation, comparison, diagram reconstruction, application and precise factual prompts. Reveal answers explicitly; record the user's assessment rather than infer mastery from reading or capture completion.

Scheduled review is opt-in via OSR. Library and study filters can select topics or an explicitly applied course tag. A shared note's prompt is one prompt, not a duplicate card per tag. Changing a filter does not change due dates. Missing OSR leaves unscheduled study available; no fabricated due dates or mastery percentages.

### Capture

Show drafts, pending clarifications and concise change receipts. Capture accepts free text, optional source, mode and explicitly supplied course code. The user need not classify every sentence. The external LLM does the semantic organization; Clear validates and applies its proposed changes.

### Responsive behavior

At widths below 900 px, collapse sidebar navigation and let the user switch between note list and reader. Below 600 px, show one main pane at a time with visible back/search controls. Do not require hover or hidden gestures. Preserve scrollable reading, keyboard focus, browser-like back behavior inside the workspace, reduced motion and readable contrast. These are proposed layout targets, subject to host validation.

## Note-making workflow

1. Read workspace policy and search existing topics/headings before writing.
2. Read matching notes with their revisions. Update a coherent topic before creating a distinct new note. Keep useful existing content and sources.
3. Distill the user's explanation under actual subject headings. Add a short explanation, useful visual, concrete example, assumptions/mistakes, compact recall, and related links where appropriate; omit empty sections.
4. Label supported corrections, model-added explanations and unresolved claims. Use supplied/checked sources; do not turn guesses into memorization targets.
5. Add an optional course tag only if explicitly supplied. Preserve other tags and the note's location.
6. Generate selected recall prompts without awarding mastery or automatically enrolling everything.
7. Apply routine user-authorized changes with revision checks and idempotent request IDs. Preview is optional; conflict resolution preserves intervening human edits.
8. Return note links, visual changes, suggested/enrolled prompts, corrections and open questions. Raw transcript storage is optional and excluded from normal navigation by default.

Recall-mode blurts preserve the initial attempt before reference feedback. New-learning blurts organize material without grading recall. Ideas and occasional reference material need not enter the review queue.

## Storage and contracts

Existing-vault mode preserves paths and formatting. A compatibility profile supports flat Thoughts/Learnings/Archives and existing date/tags metadata; the live vault has not been inspected during planning. Course tags may be inserted in the body to preserve frontmatter. Do not delete existing tags to satisfy an old tag-count convention.

Topic associations, stable prompt IDs, pins, reading positions, capture provenance and receipts live in versioned plugin data. Note content and course tags remain ordinary Markdown. Export/import the registry for recovery; follow file renames/deletions and report missing targets instead of recreating them. Reconcile external filesystem changes without requiring those writes to go through Clear.

```ts
type Role = 'learning' | 'idea' | 'reference';
type CaptureMode = 'new-learning' | 'recall' | 'idea' | 'reference';
type EvidenceState = 'user-statement' | 'source-backed' | 'tentative';
interface TopicLink { hubPath: string; notePath: string; heading?: string }
interface NoteSnapshot { path: string; markdown: string; revision: string }
interface RecallPrompt {
  id: string; notePath: string; question: string; answer: string;
  kind: 'explain' | 'compare' | 'draw' | 'apply' | 'fact';
  evidence: EvidenceState; enrolled: boolean;
}
interface NoteWrite { path: string; expectedRevision: string | null; markdown: string; role: Role }
interface CaptureDraft {
  id: string; mode: CaptureMode; sourceRefs: string[]; explicitCourseCode?: string;
  writes: NoteWrite[]; topicLinks: TopicLink[]; prompts: RecallPrompt[];
  corrections: string[]; questions: string[];
}
interface ChangeSet extends CaptureDraft { vaultId: string }
interface Receipt {
  requestId: string; changeSetId: string; status: 'applied' | 'conflict' | 'partial';
  paths: string[]; conflicts: string[]; questions: string[];
}
interface LibraryQuery { text: string; role?: Role; tags: string[]; sort: 'title' | 'modified' }
interface ReadingPosition { notePath: string; heading?: string; scrollTop: number }
```

Revisions are SHA-256 of exact current content. Null expected revision means create only if absent. Serialize plugin writes, preflight all revisions, journal before mutation, and recheck existing files inside `Vault.process()`. Multi-file writes are not filesystem-atomic. Recovery and undo restore only unchanged after-write revisions; otherwise return an explicit partial receipt. Repeated request IDs return the same receipt; changed content with the same ID is an error.

## Integrations and scope

The core release delivers browsing, reading, linked visual notes, recall and the LLM note-making workflow. Keep the researched original styling direction: dark teal reading panels, warm text, teal links/accent, restrained lavender headings, and an optional workspace theme. Prior Ideaverse research informs navigation and appearance, but exhaustive paid-vault parity is not a release claim.

Use native Mermaid, Canvas, templates, links and callouts, with optional Excalidraw and OSR adapters. Test supported integration commands/APIs; preserve OSR-owned scheduling data and use exported image fallback where live review embeds are unsupported. Anki is an optional alternate scheduler, not a simultaneous duplicate queue.

Existing LLM file tools work with the reusable guide and automatic indexing. An optional desktop stdio MCP companion forwards seven typed tools to the opt-in local plugin bridge: `get_workspace_policy`, `find_notes`, `read_note`, `propose_capture`, `apply_changes`, `get_receipt`, `get_review_context`. There is no course-context tool. Explicit vault identity, loopback-only bridge, validated schemas and local connection credentials remain as in the earlier technical plan. The plugin has no LLM API key or required hosted chat service. Mobile does not start the desktop Node bridge.

Calendar, project management and specialized collections remain optional later extensions. They are not required for the first library/reader release and must not displace the user's main navigation-and-learning goal.

## Acceptance

Primary scenario: open Home → resume a topic → search a heading/body phrase → read a note and diagram → follow a related link → return to the prior reading position → start recall without seeing answers → reveal and assess.

Authoring scenario: submit a mixed blurt through existing file tools and later through MCP → update an existing topic and create one distinct topic → link to a hub → suggest prompts → report changes. Run it with no course code and with an explicitly supplied code; neither path creates a course hierarchy or changes folders.

Verify keyboard/narrow-layout behavior, stale filters, empty results, rename/delete, Unicode/math, broken assets, missing OSR/Excalidraw, capture conflicts/retries/recovery and restart persistence. Test a 5,000-note index and record timings. Host checks in actual Obsidian are mandatory; browser mocks do not prove native rendering, plugin lifecycle or scheduler integration.

Related evidence: [learning research](../../research/reports/Obsidian%20learning%20and%20recall.md), [original public product findings](../../research/ideaverse-public-findings.md). The latest user requirement is dark mode, read-only by default with explicit Edit/Save, and Android-compatible core code.
