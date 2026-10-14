# Clear: Obsidian workflow plugin and companion theme

Status: proposed design for review; not approved or implemented.

Superseded as the implementation basis by [Clear learning workspace](2026-10-14-clear-learning-workspace-design.md) and its [implementation plan](../plans/2026-10-14-clear-learning-workspace-plan.md). Retained as the earlier Ideaverse research/design context.

## Intended outcome

Build an installable Obsidian plugin that reproduces the publicly demonstrated Ideaverse workflows and visual character. User selected public demonstrations as the evidence source. Preserve the long-term goal of complete functional coverage, while recording features whose original behavior is unknown instead of claiming complete parity.

Product research and exact source links: [public findings](../../research/ideaverse-public-findings.md).

The existing repository has only a README and SVG icon. There is no implementation to extend.

## Approaches

1. **Plugin plus companion theme — recommended.** One plugin supplies navigation, indexing, views, capture, and optional starter files. A separate theme styles the whole Obsidian workspace. This matches the request for an installable plugin and gives a deliberate choice about global appearance.
2. **Starter vault plus existing plugins.** Closest to the reference product's distribution model; easier to compose initially, but requires more third-party configuration and is less useful as a plugin for an existing vault.
3. **Plugin with only local styling.** Simplest install and least interference with other themes; cannot reproduce the frame, editor, and sidebar appearance shown in the reference.

The remaining design assumes option 1. Visual matching uses original CSS written from screenshot observations. Original paid lesson text, demo notes, artwork, and unavailable template source are not implementation inputs.

## Deliverables and architecture

- Plugin release: `main.js`, `manifest.json`, `styles.css`, installation instructions.
- Companion theme release: its own `manifest.json` and `theme.css`.
- TypeScript implementation using Obsidian's public plugin APIs. Confirm supported API and minimum host version during implementation planning.
- Modules: lifecycle/settings, incremental vault index, query engine, views, capture/templates, starter setup, and theme.
- Notes remain Markdown, wikilinks, and YAML properties. Plugin preferences and saved view definitions live in plugin data, not a separate note database.
- Index filenames, configured properties, tags, timestamps, and resolved/unresolved links. Subscribe to creation, modification, deletion, rename, and metadata updates. Recompute affected records and link counts rather than scanning all content on every keystroke.
- One dashboard view provides persistent section navigation. Users can open sections in separate leaves. Native Markdown editing remains available for every result.

## Feature contract

### Home and navigation

Provide a central launch page, recent notes, pinned destinations, active efforts, and today's note. Include compact Wayfinder-style navigation strips and breadcrumbs. Support keyboard operation and opening notes in another leaf. Pins and view configuration persist across reloads.

### Atlas

Browse knowledge as Dots, Maps, and Sources. Filter by configured kind, tags, folder, and text. Show incoming/outgoing links and unresolved links. Users can explicitly create a map note and insert selected wikilinks. Listing an unresolved destination must not create a placeholder file.

### Calendar

Month navigation, daily notes, dated events and meetings, and review lists. Configurable date property, daily note folder, and naming format. Clicking an existing date note opens it; creating a new one is explicit. Daily append is idempotent with respect to the destination file and preserves its existing contents. Recurring scheduling is not claimed as a reference feature.

### Efforts

Support areas, projects, and works. Projects expose Active, Simmering, and Sleeping intensities. A combined view sorts by numeric rank. Users can edit rank and intensity without destroying other properties. Completion/archive is a separate explicit action; it is not equivalent to Sleeping. The exact reference lifecycle is unknown, so these semantics are Clear's implementation decisions.

### Collections

Reusable saved queries with table, list, and cover-card presentations; sort, filter, choose properties, and create a note. Ship definitions for publicly visible categories and let users define additional collections. Include groups, people, questions, quotes, statements, things, maps, books, clippings, movies, TV, events, meetings, reviews, areas, projects, and works where supported by the cited screenshots.

The source advertises 22+ collections but does not reveal the complete inventory. Do not invent missing categories and label them recovered. Treat exhaustive original inventory as an open parity item. Cover cards use an existing attachment/property; automatic media lookup is not assumed.

### Garden

Filter by Plant, Cultivate, Question, Repot, Revitalize, and Revisit tags. Offer recent/least recently modified and connection-count sorting, plus an orphan view. Provide explicit add/remove garden-tag actions and a related-note view. Ranking rules must be documented as Clear's own rules, not inferred original algorithms.

### Capture

Keyboard command and visible action open a searchable capture chooser. Create typed notes using user-editable templates, or append a thought to today's note. Show destination before submission. Sanitize filenames, keep writes inside the configured vault, resolve collisions without overwriting, and report errors without discarding entered text. Cancellation performs no write.

### Zero / starter setup

Optional clean setup creates selected folders, original starter templates, and navigation files. Preview the exact file list; skip existing files and make repeat runs safe. Never populate personal example content automatically. Existing-vault mode works through folder/property mappings and does not require moving notes.

### Theme

Light appearance follows the observed teal frame, warm cream panels, muted purple text, serif headings, colored folders, and pastel navigation bands. Exact font family and CSS are unknown. Use configurable CSS variables and available system fonts initially. Supply a corresponding dark palette as Clear's own adaptation.

Plugin view styling stays scoped. The optional companion theme controls workspace chrome and Markdown rendering. Disabling either component restores host behavior without rewriting notes. Ensure focus visibility, readable contrast, scrollable overflow, reduced-motion support, and usable narrow layouts.

## Data and configuration

Proposed properties: `clear-kind`, `clear-intensity`, `clear-rank`, `clear-date`, `clear-cover`; nested garden tags remain configurable. Existing properties may be mapped instead. These names are new design choices, not recovered source schema.

Default setup lives under a user-selected root; existing-vault operation needs no fixed ACE folders. Settings contain mappings, capture destinations, template paths, saved views, pins, and a version for migrations. Do not assume any previously used personal vault layout is still current.

All writes use supported Obsidian APIs and preserve unrelated frontmatter and note content. Escape display strings; never evaluate note content or templates as JavaScript. Handle missing metadata, missing attachments, malformed properties, and deleted targets with useful empty/error states.

## Implementation sequence

1. Foundation: plugin lifecycle, settings, index/query contracts, Home, read-only navigation, and visual tokens.
2. Capture and file operations: editable templates, daily append, safe starter setup, rename/delete handling.
3. Workflow views: Atlas, Calendar, Efforts, Collections, Garden; save/restore filters and layouts.
4. Companion theme and integration: global styling, accessibility, narrow layouts, installation packages.
5. Verification: disposable Obsidian vault, workflow checks, restart persistence, release build, and updated parity ledger.

This is an implementation ordering, not permission to omit later stages or declare a foundation-only build complete. A detailed implementation plan follows design review.

## Acceptance and validation

- Install and enable in a disposable Obsidian vault; disable/re-enable without duplicate listeners or lost settings.
- Create, edit, rename, and delete notes; verify all relevant views update correctly.
- Each visible action opens the advertised destination or produces the declared file change; no decorative controls masquerade as features.
- Capture cancellation writes nothing; duplicate names and setup reruns do not overwrite notes; failed writes keep entered text available.
- Effort changes persist across restart and preserve unrelated metadata.
- Date handling covers month/year boundaries, local dates, and configured note names.
- Collections support working filters, sorting, property selection, and card fallback when a cover is absent.
- Garden counts are checked against fixture links, including unresolved targets and self-links.
- Theme checked in actual Obsidian for editor, sidebar, modal, table, and card layouts; compare representative screenshots to reference images.
- Core query/file-planning tests, TypeScript/build checks, and host runtime checks must be reported separately. A browser mockup is not an Obsidian runtime pass.
- Benchmark index startup and incremental changes on a generated 5,000-note fixture; record measurements and address visible interaction stalls.

## Explicit uncertainties

The public material cannot establish the original complete plugin list, theme CSS, template text, collection inventory, saved query definitions, hotkeys, or hidden automation. No exact-equivalence claim is acceptable while these remain unknown. Future public evidence can expand the contract. The product's course content and personal example vault are separate from the requested plugin behavior.

## Review decision

Approve or amend the recommended plugin-plus-theme architecture and the behavior contract above before implementation planning.
