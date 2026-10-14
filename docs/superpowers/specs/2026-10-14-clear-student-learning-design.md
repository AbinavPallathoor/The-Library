# Clear student learning system

> Superseded by [2026-10-14-clear-learning-workspace-design.md](2026-10-14-clear-learning-workspace-design.md). The user explicitly removed university-based organization; retain this document only as prior design context.

Status: proposed design. The user requested a new plan; this document and its implementation plan are review artifacts, not an implemented plugin.

This design supersedes the earlier Ideaverse proposal as the implementation basis. It incorporates the [learning research](../../research/reports/Obsidian%20learning%20and%20recall.md) and preserves the original goal of an Obsidian plugin with cohesive styling and connected workflows.

## User's working model

The user is a university student. Notes cover course learning, independent learning, original ideas, and practical information worth remembering. Their normal capture method is to learn something, explain it to an external LLM in an unstructured blurt, and have that LLM use tools to create or update and organize notes. Notes should remain easy to browse, learn from, and review visually.

Success means one blurt can improve the correct topic notes, connect them to the right course/module, produce meaningful diagrams and useful recall prompts, and reveal unresolved understanding without manufacturing mastery or a proliferation of files.

## Recommended organization

Navigation hierarchy: University → Semester → Course → Module → Topics. Independent learning is navigable by topic outside this hierarchy. Concepts can belong to multiple courses/modules, and to independent-learning hubs, without duplicate content.

Course and module pages are readable Markdown hubs. Each course includes code/title, semester, syllabus/module links, materials, assessments/deadlines, and study entry points. Modules link to topics in an intentional order and distinguish missing syllabus coverage from completed capture. Topic pages carry the explanation; optional session notes retain genuinely useful lecture-specific context rather than serving as the default unit of knowledge.

Roles are Learning, Idea, and Reference. They do not impose physical folders. A subject can have several roles; course membership does not change its role. A project/assignment can be an Effort with a deadline and link to its concept notes. Completed semesters remain browsable; course archiving never suspends shared-topic review automatically.

Three independent states:

- **Capture:** raw, organized, or needs clarification.
- **Coverage:** absent, partially captured, or captured against a supplied syllabus item.
- **Learning:** not reviewed or an explicit history of recall attempts. Capture counts and card counts are not mastery scores.

Without a supplied syllabus, report coverage as unknown. Exam views select course/module prompts, due reviews, misconceptions, and practice problems; they do not infer exam importance from an LLM's confidence. User-set exam emphasis changes filtering/order without silently rewriting scheduler due dates.

## Storage profiles and portability

Default is existing-vault mode: user-selected paths, existing note style and metadata preserved, no automatic migrations. A DigitalBrain compatibility profile preserves flat Thoughts/Learnings/Archives routing, filename-as-title, date/tags frontmatter, and existing topical tags. This profile comes from prior conventions and the installed note skill; the live vault has not been inspected for this plan. New course fields need not be added to every note.

Course/module membership, capture provenance, prompt identity, and UI state live in versioned plugin data, keyed by internal IDs with current note paths and optional heading targets. Course hubs contain ordinary links so navigation survives disabling the plugin. Export/import a JSON registry for recovery; the registry is not a replacement for Markdown. External changes/renames update paths; missing notes/headings appear as diagnostics and are never recreated merely because a link exists.

For a new-vault profile, offer folder/property suggestions in setup, with a file preview. Both profiles use the same internal model. Original transcripts are optional and excluded from normal navigation by default; retain only when requested. Temporary drafts expire only through an explicit cleanup action, with a visible count.

## LLM capture and learning workflow

1. **Capture context.** Accept course/module when known, source references, and mode: new learning, recall attempt, idea, or reference. Mixed blurts can yield several related topics. Missing course context leaves membership unassigned; it does not select an unrelated course.
2. **Search before writing.** Search filenames, headings, content, aliases when present, and memberships. Read likely matches and their revisions. Prefer updating one coherent topic page; create a separate note only for a distinct reusable topic. Ambiguous same-name subjects remain unresolved until the context disambiguates them.
3. **Distill the explanation.** Separate the user's statements from explanations added by the model. Use descriptive headings, concise own-words explanations, a worked example where useful, assumptions, and linked sources. Preserve good existing content and merge overlap rather than append a session transcript.
4. **Check understanding.** Compare to supplied material or independently checked sources using the external LLM's existing tools. Unsupported corrections remain tentative. Label unresolved claims; cite sources beside supported additions. No fabricated page citations or claims of having verified an unavailable slide deck.
5. **Add visuals.** Prefer Mermaid for structured flows, Excalidraw for editable sketches, Canvas for relationships across notes. Choose a diagram that explains the mechanism, not a decorative illustration. Preserve labels/units/arrow direction; add normal wikilinks because diagram links alone may not contribute to the note graph.
6. **Derive recall prompts.** Keep a small selected set addressing explanation, comparison, reconstruction, and application. Prompts must have a supported answer or explicit evaluation rubric. Tentative explanations stay out of memorization queues. Enrollment follows the user's configured policy; generating a prompt is separate from enrolling it.
7. **Apply and connect.** Apply a typed set of changes to notes, course hubs, and memberships. Use optimistic revision checks, idempotent request IDs, a recoverable write journal, and change receipts. The user's instruction to make/update notes authorizes routine changes; do not add a repetitive approval screen for every blurt. Preview mode is available. Conflicts stop affected changes and preserve the draft.
8. **Report.** Return links to created/updated notes, course/module assignments, diagrams, suggested/enrolled prompts, corrections, and unresolved questions. Ask targeted follow-ups only when the missing information matters.

New-learning mode organizes material without awarding a recall result. Recall mode captures an answer before showing reference material and offers a rubric/feedback; the user records the rating. The LLM cannot set mastery or submit a scheduler rating based only on its own judgment. Additional explanation can repair a note after the attempt, without altering the historical response.

## Note presentation

Learning pages use a short at-a-glance explanation, real topic headings, useful diagrams, concrete examples, assumptions/mistakes, compact hidden-answer recall blocks, and sources/connections. Omit empty sections. Course lecture context is linked to the concept and may be a heading-level addition. Ideas show problem, hypothesis, mechanism, evidence/uncertainty, and next experiment. Reference pages show when to use the material, concise instructions/facts, examples, and verification dates when relevant.

Example: a blurt about sampling and aliasing updates `Sampling Theorem`, associates it with a Signals and Systems module, adds a frequency/sampling explanation, records a misleading statement as a correction, and suggests explain/draw/apply prompts. It does not create one file for every sentence or certify the topic as learned.

## Product surfaces

| Surface | Primary behavior |
| --- | --- |
| Home | Continue learning, active semester/course, capture, due study, unfinished ideas |
| University | Semester/course/module hubs, ordered syllabus topics, materials, assessments |
| Learn / Atlas | Independent topics and shared concepts, prerequisites, sources, backlinks |
| Capture | Blurt/draft browser, context selector, receipt history, conflict resolution |
| Review | Prompt-first study, course/topic filters, diagram reconstruction and practice tasks |
| Ideas / Garden | Develop ideas, revisit gaps and unfinished notes; separate from due recall |
| Reference / Collections | Searchable references and saved table/list/card views |
| Calendar / Efforts | Local dates, daily notes, deadlines, projects and ranked intensities |
| Maps | Curated hubs, linked drawings, Canvas entry points |

Retain clean setup/Zero, saved views, and theme support from the original proposal. Public Ideaverse parity remains bounded by supplied evidence; exhaustive paid-vault functionality is not a release assertion.

## LLM integration architecture

Deliver an Obsidian plugin, an optional local MCP companion, a reusable model-independent workflow guide, and an optional companion theme. The plugin does not need an LLM API key. The user continues talking to their preferred external LLM.

Initial file-tool compatibility is supported: an LLM can follow the guide using its existing filesystem tools; plugin indexing detects Markdown changes. Course context remains visible in hub links, with a Reconcile command to register external changes. This path cannot promise the same change receipts/transactions as plugin-mediated writes.

The managed path uses a stdio MCP companion with explicit vault identity. It forwards validated tools to an opt-in desktop-only plugin bridge. The plugin owns Obsidian file operations, metadata/index updates, and receipts. The bridge binds only `127.0.0.1` on an allocated port; connection descriptors/tokens are stored in machine-local configuration, not synced notes. The companion reads the descriptor supplied in client configuration, checks vault ID, and fails clearly when Obsidian or the bridge is closed. No automatic client-configuration edits occur during building/testing.

Ordinary note navigation and capture work without MCP. Mobile does not start the Node bridge; it can view/study supported notes and sync normal vault content. No claim of mobile MCP authoring or tested native mobile compatibility precedes device validation.

Tool contract:

| Tool | Input | Output / effects |
| --- | --- | --- |
| `get_workspace_policy` | none | Schema version, vault ID, routing, templates, review policy, supported features |
| `find_notes` | query, optional role/course/module, limit | Candidate IDs, paths, matching headings; no edits |
| `read_note` | path | Exact Markdown, revision, known memberships |
| `get_course_context` | course ID, optional module ID | Supplied syllabus, ordered topics, linked sources/assessments |
| `propose_capture` | CaptureDraft | Validated ChangeSet, affected paths, questions and suggested prompts; no edits |
| `apply_changes` | ChangeSet ID, request ID | Receipt or explicit conflict/partial outcome |
| `get_receipt` | request ID | Same persisted receipt; supports retry after transport loss |
| `get_review_context` | selected note/course/module | Eligible prompts and reference locations; no due-date/rating edits |

No arbitrary shell, JavaScript evaluation, external filesystem paths, network fetch, automatic installation, deletion, or mass-renaming tool. These are implementation boundaries for this bridge; the user's independent LLM may have other tools.

### Domain model

```ts
type Role = 'learning' | 'idea' | 'reference';
type CaptureMode = 'new-learning' | 'recall' | 'idea' | 'reference';
type EvidenceState = 'user-statement' | 'source-backed' | 'tentative';
interface Semester { id: string; title: string; active: boolean }
interface Membership { courseId: string; moduleId: string; notePath: string; heading?: string }
interface Course { id: string; code: string; title: string; semesterId: string; hubPath: string }
interface Module { id: string; courseId: string; title: string; order: number; hubPath: string }
interface SyllabusItem {
  id: string; moduleId: string; title: string; order: number;
  sourceRef: string; coverage: 'absent' | 'partial' | 'captured';
}
interface Assessment {
  id: string; courseId: string; title: string;
  kind: 'exam' | 'assignment' | 'lab'; date: string | null; notePath?: string;
}
interface NoteSnapshot { path: string; markdown: string; revision: string }
interface RecallPrompt {
  id: string; notePath: string; question: string; answer: string;
  kind: 'explain' | 'compare' | 'draw' | 'apply' | 'fact';
  evidence: EvidenceState; enrolled: boolean;
}
interface NoteWrite {
  path: string; expectedRevision: string | null; markdown: string; role: Role;
}
interface CaptureDraft {
  id: string; mode: CaptureMode; sourceRefs: string[];
  writes: NoteWrite[]; memberships: Membership[];
  prompts: RecallPrompt[]; corrections: string[]; questions: string[];
}
interface ChangeSet extends CaptureDraft { vaultId: string }
interface Receipt {
  requestId: string; changeSetId: string; status: 'applied' | 'conflict' | 'partial';
  paths: string[]; conflicts: string[]; questions: string[];
}
```

Revision is SHA-256 of exact current bytes. `expectedRevision: null` means create only if absent. Reusing a request ID with different content is an error. Metadata and schema validation are deterministic; the external LLM, not `propose_capture`, authors the explanations and performs semantic/source checks. Role/type provenance remains in registry/receipt rather than forcing extra frontmatter fields.

Set up semester/course/module definitions through the plugin UI or reconcile explicitly supplied hub files first. The eight initial LLM tools manage notes and memberships against those definitions; they do not pretend to create courses through an undeclared API. Syllabus items and assessments are explicit user/supplied-source records. Course/module deletion removes registry associations only through an explicit UI action and never deletes topic notes.

Multi-file updates are not represented as an atomic filesystem transaction. Preflight all revisions, serialize plugin writes, persist a journal, and recheck each write inside `Vault.process()`. On failure, attempt rollback only where after-write revisions still match; otherwise return partial, identify affected paths, and retain the recovery journal. Undo has the same revision checks. Never overwrite an intervening human edit.

## Recall and diagram integration

Use native hidden-answer callouts plus a prompt-only Review surface; original notes remain ordinary Markdown. OSR owns due scheduling and ratings. Keep stable Clear prompt IDs independent of scheduler formatting. If a prompt answer changes, mark it revised and offer re-review; do not silently preserve an old confidence label.

Default enrollment policy is selected-only: the user may opt into auto-enrolling source-backed prompts for specified courses. OSR flashcards and note-level review have different scheduling behavior. Missing or incompatible OSR yields unscheduled study with no fabricated due dates. Discover documented supported commands/integration surfaces at implementation; do not assume a private API.

Mermaid is first-class for LLM-created diagrams. Excalidraw drawings are linked/embedded; create/open through a verified adapter only. Until editable drawing creation is verified, the LLM can create a Mermaid diagram and the user can sketch in Excalidraw. OSR diagram-answer fallback uses exported images. Canvas is an overview, not a replacement for a readable explanation. Anki image occlusion remains an optional alternate workflow rather than a second simultaneous scheduler.

## Styling

Original Clear CSS follows the observed cream panels, teal framing, muted purple text, serif headings, and pastel section accents. Plugin views are scoped; workspace theme is opt-in. Give course/topic hierarchy, reading, diagrams, and recall strong visual priority. Study mode hides answers until reveal and avoids accidental reference previews. Support keyboard focus, narrow layouts, reduced motion, readable contrast, and disabling/unloading cleanly.

## Validation and release conditions

Mandatory first scenario: create a course/module fixture; ingest one mixed-topic blurt; update an existing shared concept and create one distinct topic; add hub links, a Mermaid diagram and prompts; inspect receipt; then study without revealing answers early.

Also validate multiple-course membership, duplicate names, edits during capture, retries, mid-batch failure/recovery, externally renamed notes, missing headings, unverified claims, Unicode/math, optional transcript retention, OSR absence, Excalidraw absence, bridge shutdown, wrong vault identity, restart persistence, calendar date boundaries, and theme unload.

Unit and integration tests cannot replace actual Obsidian host checks. Package tests separately cover plugin/theme/MCP artifacts. Desktop runtime and external-LLM tool connectivity are required for the managed authoring release; mobile checks are reported separately. A 5,000-note fixture measures startup and incremental search; record timings and resolve observable interaction stalls.

## Sources and planning assumptions

- [Prior researched learning workflow](../../research/reports/Obsidian%20learning%20and%20recall.md).
- [Obsidian links](https://obsidian.md/help/links): heading/block links support shared-topic navigation.
- [Obsidian Vault API](https://docs.obsidian.md/Plugins/Vault): `process()` supports revision checks around writes; multi-file atomicity is our responsibility.
- [Obsidian lifecycle events](https://docs.obsidian.md/Plugins/Events): registered listeners/intervals must unload.
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/): stdio tools connect to an external MCP-capable LLM host; host compatibility still needs validation.

No real course names, semester dates, syllabus files, or exam dates have been supplied. These remain setup inputs rather than fictional personal data. The latest registry versions observed during planning are recorded in the plan; they are not an installed or tested stack.
