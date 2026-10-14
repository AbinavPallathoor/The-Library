# Obsidian diagram and recall support

Research checked 14 October 2026. This is a design recommendation; nothing was installed or tested in Abinav's running vault. Sources are official Obsidian help, maintainer repositories/docs, and live GitHub repository/release metadata.

## Which tools should explain concepts and connect learning notes?

### Takeaway

Use Excalidraw for authored visual explanations, native Mermaid for processes, and native Canvas for topic maps. Keep the global/local graph as a navigation aid: its edges describe note links, while a useful teaching diagram needs chosen relationships and labels. These roles follow the tools' documented capabilities; the suggested division is a design inference. [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin), [Mermaid](https://obsidian.md/help/advanced-syntax), [Canvas](https://obsidian.md/help/plugins/canvas), [Graph](https://obsidian.md/help/plugins/graph).

### Cited Findings

- **Excalidraw** embeds editable drawings in Markdown with syntax such as `![[drawing.excalidraw|600]]`. Its drawings support internal links, backlinks, and transcluding a note heading or block into drawing text. Editable drawing content is stored in Markdown with Excalidraw scene data, rather than being only an exported picture. PNG/SVG auto-export provides portable previews; Publish needs an image export. Embedding a drawing requires the community plugin renderer. The maintainer also documents selecting groups/areas for partial drawing embeds and custom styling for note snapshots. [Maintainer README](https://github.com/zsviczian/obsidian-excalidraw-plugin).
- **Native Mermaid** renders a `mermaid` fenced code block, including flowcharts, sequence diagrams, and timelines. Diagram source remains ordinary note text. Obsidian documents clickable note nodes using `internal-link`, but explicitly says links inside Mermaid diagrams do not appear in Graph view. Thus a visible arrow in a flowchart should not be assumed to create a vault relationship. [Advanced formatting](https://obsidian.md/help/advanced-syntax).
- **Native Canvas** places notes, attachments, Markdown text cards, and webpages on an infinite canvas; connections can have labels and directions. It stores `.canvas` files in the open JSON Canvas format. Notes can be narrowed to a heading/block, avoiding duplicated topic summaries. Standalone text cards do not appear in Backlinks unless converted to files. Desktop supports PNG export; mobile supports editing/panning but currently does not support image export. [Canvas documentation](https://obsidian.md/help/plugins/canvas).
- **Canvas embed limitation:** official help currently says `![[My canvas.canvas]]` shows shapes without the text inside cards. For a readable learning diagram, open the full canvas or embed an exported image. Ordinary note/heading/block embeds stay connected to their source and update when the source changes. [Embed files](https://obsidian.md/help/embeds).
- **Graph view** represents notes as circles and internal links as lines, with click-to-open and filtering. This supports finding connected material; it does not document understanding, learning progress, typed conceptual relations, or mastery. [Graph documentation](https://obsidian.md/help/plugins/graph).
- **draw.io is optional**, with distinct plugins that must not be conflated. `somesanity/draw-io-obsidian` is community plugin ID `drawio`: it serves an offline editor locally, creates `.drawio.svg`, and documents shape-to-note links/Markdown fragments with interactivity currently limited to reading mode. Its manifest is desktop-only. [README](https://github.com/somesanity/draw-io-obsidian), [manifest](https://raw.githubusercontent.com/somesanity/draw-io-obsidian/main/manifest.json).
- `doge-liang/obsidian-drawio`, ID `drawio-editor`, is another credible option: XML files, `drawio` code blocks, and `.drawio` embeds; portable `.drawio.svg`/`.drawio.png` retain editable data inside an image. Previews work offline on desktop/mobile, but editing is desktop-only. Offline editing requires a separate one-time webapp download and local server; online editor mode also exists. These are maintainer claims, not local validation. [Maintainer README](https://github.com/doge-liang/obsidian-drawio).
- **Mindmap NextGen** derives a Markmap view from Markdown and supports inline `markmap` blocks, folding, LaTeX, and PNG copying. It is useful for hierarchical outlines, but does not replace hand-authored spatial or causal explanations. The older `lynchjames/obsidian-mind-map` README targets an old Obsidian API; prefer evaluating the newer alternative if mind maps become a repeated need. [NextGen](https://github.com/james-tindal/obsidian-mindmap-nextgen), [older plugin](https://github.com/lynchjames/obsidian-mind-map).

### Inferences

- Default to one drawing tool. Excalidraw best fits explanatory sketches such as sensor geometry or an uncertainty ellipse. Mermaid fits a predict–measure–correct process. Canvas fits an overview joining several substantial topics. Install draw.io only if precise architecture/UML/shape-library diagrams become frequent; install a Markmap tool only if outline-to-map conversion demonstrably saves effort.
- Keep diagrams inside the relevant explanation, with a caption that states what the arrows, colors, or axes mean. Keep conceptual links as normal wikilinks as well when they should appear in navigation.

### Gaps

- No local renderer, theme, stylus, or mobile test was performed. Exported PNG/SVG preserve appearance but lose editable semantics and some clickable/embedded behavior. Plugin-specific scene/XML rendering remains a dependency even when files are stored locally; open storage is not universal feature interoperability.

## Which tools actually schedule recall, and what can a diagram answer do?

### Takeaway

Use Obsidian Spaced Repetition (OSR) as the default single scheduler because it covers both individual flashcards and whole-note review. Keep native foldable callouts for self-testing without scheduling. Choose Anki instead when image occlusion is a central requirement. [OSR](https://github.com/st3v3nmw/obsidian-spaced-repetition), [Callouts](https://obsidian.md/help/callouts), [Anki image occlusion](https://docs.ankiweb.net/manual/editing#image-occlusion).

### Cited Findings

- **OSR flashcards** live in Markdown: `Question::Answer`, reverse cards, multiline `?` separators, and text clozes. Decks can use tags/folders; rich card content includes images, audio/video, LaTeX, and code. Cram mode is available separately from due-card review. [OSR README](https://github.com/st3v3nmw/obsidian-spaced-repetition), [Q&A syntax](https://stephenmwangi.com/obsidian-spaced-repetition/flashcards/q-and-a-cards/).
- **OSR whole-note review** is different: tag a note for review (default `#review`), open it from the note queue, and rate the note to produce its next due date. It opens the note rather than automatically hiding answers or assessing competence. [Note review documentation](https://stephenmwangi.com/obsidian-spaced-repetition/notes/).
- **Schedulers:** old documentation lists SM-2-OSR implemented and FSRS planned. This is stale: release **1.15.0** explicitly enabled opt-in FSRS; merged implementation PR **#1425** specifies FSRS for flashcards while whole-note scheduling stays on the existing OSR path. Do not promise FSRS whole-note scheduling or infer support from the broad README wording. [Old algorithm docs](https://stephenmwangi.com/obsidian-spaced-repetition/algorithms/), [1.15.0 release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases/tag/1.15.0), [implementation PR](https://github.com/st3v3nmw/obsidian-spaced-repetition/pull/1425).
- **Diagram answers:** images are supported card content, and release 1.14.0 records fixes to links/embedded media. A multiline answer containing a local PNG/SVG embed is the strongest documented starting point. Live Mermaid or Excalidraw rendering inside the review UI remains unverified in this vault. [README](https://github.com/st3v3nmw/obsidian-spaced-repetition), [1.14.0 release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases/tag/1.14.0).
- **Foldable callouts** accept Markdown/embeds; `[!question]-` or `[!answer]-` collapses content by default. This gives a native reveal-answer pattern, with no scheduler documented in the feature. It is appropriate for explaining or redrawing a diagram before revealing the reference. [Callouts](https://obsidian.md/help/callouts).
- **Anki native image occlusion** has been included since **23.10**, with rectangle/ellipse/polygon masks and hide-one or hide-all modes. Export a drawing as an image, then create masks in Anki. This is an Anki capability; it is not a built-in Excalidraw recall system. [Anki editing manual](https://docs.ankiweb.net/manual/editing#image-occlusion).
- **Obsidian_to_Anki** exports Markdown cards through AnkiConnect; Anki must run for export. It supports custom note types, clozes, images/audio, and a link back to the source file. That does not establish automatic export of editable Excalidraw scenes, native Anki occlusion masks, or arbitrary Obsidian plugin renderers. [Maintainer README](https://github.com/ObsidianToAnki/Obsidian_to_Anki).

### Inferences

- A fact card and a topic review solve different problems. Use cards for a precise retrieval target; use whole-note review for “explain the mechanism, redraw the model, then compare.” Rate after attempting retrieval, because simply opening an attractive note supplies the answer immediately.
- Prefer OSR plus exported diagram answers initially. If anatomical labels, circuit components, or other image masks become essential, move that review workflow to Anki rather than running two schedulers for the same material. Image occlusion checks identification; additional prompts should test why the parts interact.

### Gaps

- Dynamic embeds in OSR, exported media synchronization, and current AnkiConnect compatibility were not tested. OSR's documentation warns it is partially outdated. Scheduling-data storage also evolved in recent releases; integration should inspect the installed version instead of hard-coding the older HTML-comment/frontmatter format. [Documentation warning](https://stephenmwangi.com/obsidian-spaced-repetition/), [1.15.0 changes](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases/tag/1.15.0).

## What should the minimum system and planned plugin own?

### Takeaway

Start with **Excalidraw + OSR**, supported by native **Mermaid, Canvas, Templates, Bases, links, and callouts**. The planned plugin should help capture, structure, find, and deliberately revisit material, integrating with established editors/reviewers. This is a recommendation based on the documented division of capabilities above, not an implemented feature list.

### Cited Findings

- **Templates** inserts predefined note text and basic title/date/time variables. This covers a simple learning/idea/reference note skeleton without a second templating plugin. [Templates](https://obsidian.md/help/plugins/templates).
- **Bases** filters, sorts, and edits note properties in database-like views. Data remains in local Markdown/properties; view definitions use `.base` files or embedded code blocks. Use it for topic/status/type views, while a scheduler owns actual recall dates and outcomes. Bases is not itself a recall scheduler. [Bases](https://obsidian.md/help/bases).
- **Maintenance snapshot:** live GitHub metadata reports Excalidraw **2.29.0**, released **12 October 2026**; OSR **1.15.4**, **14 June 2026**; original Obsidian_to_Anki **3.6.0**, **24 January 2024**. The latter repository is not archived but its last reported push is June 2024. Excalidraw/OSR also are not archived. These dates support relative recency only, not compatibility with Abinav's host. [Excalidraw release](https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.29.0), [OSR release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases/tag/1.15.4), [Anki bridge release](https://github.com/ObsidianToAnki/Obsidian_to_Anki/releases/tag/3.6.0), [bridge repository metadata](https://api.github.com/repos/ObsidianToAnki/Obsidian_to_Anki).
- Optional draw.io releases observed were `drawio` **3.1.1** and `drawio-editor` **0.7.1**; Mindmap NextGen **1.16.0** was released April 2026, versus the older Mind Map's **1.1.0** in December 2020. None of these repositories was marked archived in the live check. [drawio release](https://github.com/somesanity/draw-io-obsidian/releases/tag/3.1.1), [drawio-editor release](https://github.com/doge-liang/obsidian-drawio/releases/tag/0.7.1), [NextGen release](https://github.com/james-tindal/obsidian-mindmap-nextgen/releases/tag/1.16.0), [older release](https://github.com/lynchjames/obsidian-mind-map/releases/tag/1.1.0).

### Inferences

- The planned plugin should preserve normal Markdown notes and normal embeds; offer deliberate note-type/template choices; add discoverable commands to create/open relevant diagrams; and link a learning note to its recall prompts. It should not recreate a drawing editor, invent a parallel flashcard language, or silently write another scheduler's state.
- Introduce optional adapters only after checking available commands/APIs on the installed versions. Keep the basic note usable if an optional integration is absent. If a dedicated “today” view is added, clearly distinguish unscheduled notes from scheduler-provided due items; a homemade stale-note filter is not a validated learning schedule.
- Prefer local attachments over URL-only images when offline use matters. Validate one real note through reading view, live preview, review UI, light/dark theme, and the target phone/tablet. Scope plugin CSS to its own views and use Obsidian variables; exported image text and diagram labels need separate contrast checks.

### Gaps

- Installed Obsidian version, vault plugins, theme CSS, mobile devices, and actual usage were not inspected. No installation, compatibility certification, migration, or plugin implementation was performed. Final integration details require a small real-vault prototype and representative rendering checks.
