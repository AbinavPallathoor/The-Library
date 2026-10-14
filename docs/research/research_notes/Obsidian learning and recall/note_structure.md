# Obsidian note organization for learning, ideas, and reference

## What organization fits an integrated personal knowledge system?

### Takeaway
Recommend one capture inbox, three flexible note roles, and a few curated topic hubs. Keep physical storage compatible with the user's existing vault; roles describe purpose rather than requiring new folders. This is a design recommendation, not an empirically established optimum.

### Cited Findings
- Andy Matuschak recommends organizing evergreen notes around concepts so that material from different books and projects can accumulate in the same place. He explicitly distinguishes this from notes organized around a particular source. — [Concept-oriented evergreen notes](https://notes.andymatuschak.org/Evergreen_notes_should_be_concept-oriented)
- His writing inbox separates incomplete captures from developed notes and pairs capture with an ongoing practice of developing, archiving, or discarding material. Not everything captured needs to become an evergreen note. — [Writing inbox](https://notes.andymatuschak.org/A_writing_inbox_for_transient_and_incomplete_notes)
- Nick Milo describes Maps of Content as notes used to gather, develop, and navigate ideas. His ACE framework distinguishes knowledge work in Atlas, time-based records in Calendar, and actionable work in Efforts. These are the author's organization practices, not controlled learning studies. — [Maps](https://blog.linkingyourthinking.com/maps/); [ACE](https://blog.linkingyourthinking.com/notes/ace-helps-you-with-context-switching)
- Tiago Forte's PARA organizes material around Projects, Areas, Resources, and Archives, prioritizing current projects and goals. That emphasis is useful when work execution is the main retrieval context. — [PARA, original author](https://fortelabs.com/blog/para/)
- Obsidian properties hold structured values, including links, lists, numbers, and dates; tags are searchable keywords and can be nested. — [Properties](https://obsidian.md/help/properties); [Tags](https://obsidian.md/help/tags)

### Inferences
- Proposed roles: **Learning** explains something the user wants to understand; **Idea** develops an original possibility, argument, or hypothesis; **Reference** preserves something useful to look up or apply. A note can change role, and some legitimately serve more than one role. Hubs provide navigation across all three. This combines concept-based accumulation with the broader goal of remembering useful information. — [Concept-oriented notes](https://notes.andymatuschak.org/Evergreen_notes_should_be_concept-oriented); [Maps](https://blog.linkingyourthinking.com/maps/)
- Prefer a small optional schema: `kind`, `status`, and linked `topics`; add `source` or `review_after` only when they support an actual workflow. For example, `kind: idea`, `status: developing`, and `topics: ["[[Robot localization]]"]`. These are proposed conventions supported by native properties, not Obsidian defaults. — [Properties](https://obsidian.md/help/properties)
- Use folders for stable storage boundaries such as attachments, templates, or existing personal categories. Use properties for consistent fields and lists; tags for lightweight cross-cutting labels; links for concepts and relationships that deserve explanation. Avoid maintaining equivalent folder, tag, and property taxonomies unless each serves a distinct purpose. This is a maintenance tradeoff inferred from the available mechanisms. — [Properties](https://obsidian.md/help/properties); [Tags](https://obsidian.md/help/tags); [Internal links](https://obsidian.md/help/links)
- Start with a Home note linking to Inbox, current topics, developing ideas, and useful references. A Robot localization hub could group Foundations, Estimation, Implementation, and Experiments, with links and brief context. Hubs should remain useful navigation pages; recall prompts belong near the explanations they assess. — [Maps](https://blog.linkingyourthinking.com/maps/)

### Gaps
- No comparative evidence was found here establishing ACE, PARA, or evergreen notes as universally superior. Author enthusiasm and claims of effectiveness should not be presented as scientific validation. The user's actual retrieval habits and willingness to maintain metadata remain untested.

## How should individual notes be written and split?

### Takeaway
Write a coherent explanation in the user's own words, supported by an example, meaningful visual, sources, and a compact recall section when appropriate. Update an existing concept note first; split only when a section becomes independently reusable or obscures the note's purpose.

### Cited Findings
- Matuschak's atomicity principle seeks notes focused on one concern while preserving enough completeness to make connections. He explicitly warns that excessive fragmentation can damage cohesion and says there is no definitive test for the right granularity. — [Atomic evergreen notes](https://notes.andymatuschak.org/Evergreen_notes_should_be_atomic)
- Christian Tietze's reading-note workflow clusters related material, develops concept notes, and feeds detail back into an overview. The article was updated in 2025 to acknowledge that demanding atomic notes had hindered many users. Sascha Fast's accompanying clarification treats atomicity as a goal achieved through ongoing work rather than an admission requirement. — [Processing reading notes](https://zettelkasten.de/posts/create-zettel-from-reading-notes/); [2025 clarification](https://zettelkasten.de/posts/principle-of-atomicity-difference-between-principle-and-implementation/)
- Obsidian's native Templates plugin inserts reusable text snippets, and internal links can target entire notes, headings, or blocks. Consequently, every subtopic does not need a separate file merely to be addressable. — [Templates](https://obsidian.md/help/plugins/templates); [Internal links](https://obsidian.md/help/links)

### Inferences
- Prefer descriptive names such as `Kalman filter`, `Covariance describes joint uncertainty`, or `MuJoCo recording checklist`. Use a claim title when the note develops an argument; use a topic or task name when it is an explanatory overview or reference. Avoid requiring timestamps in conceptual titles. — [Concept-oriented notes](https://notes.andymatuschak.org/Evergreen_notes_should_be_concept-oriented)
- Keep a concept together while learning it. Extract a section when other notes repeatedly need that section on its own, when its examples and sources grow independently, or when the parent becomes difficult to scan. Leave a short explanation and link in the parent. No arbitrary word limit is needed; heading links can handle intermediate granularity. — [Atomicity clarification](https://zettelkasten.de/posts/principle-of-atomicity-difference-between-principle-and-implementation/); [Internal links](https://obsidian.md/help/links)
- The following are proposed outlines, not prescribed methodology. They can be native template snippets; omit irrelevant headings instead of filling empty boxes. — [Templates](https://obsidian.md/help/plugins/templates)

**Learning example: `Kalman filter`**
1. **What problem it solves** — short explanation in the user's words and a concrete robot example.
2. **Predict, measure, correct** — labeled process diagram and the meaning of each step.
3. **A scalar worked example** — actual values, intermediate reasoning, and interpretation.
4. **Uncertainty and trust** — explanation linked to `[[Covariance]]`; expand matrix notation as understanding develops.
5. **Assumptions and failure cases** — limits, misconceptions, and unresolved questions.
6. **Try from memory** — three or four prompts such as “Explain the correction step” and “Reconstruct the process diagram,” with separate hidden answer cues.
7. **Sources and connections** — relevant source locations, `[[Robot localization]]`, and `[[Extended Kalman filter]]`.

**Idea example: `Could wheel slip trigger a covariance adjustment?`**
- Problem observed; proposed mechanism; sketch of the data flow; assumptions; evidence for and against; smallest useful experiment; unresolved questions; links to relevant learning and experiment notes. Mark speculation explicitly and revise the idea as evidence arrives.

**Practical reference example: `MuJoCo recording checklist`**
- When to use it; environment prerequisites; ordered commands or steps; expected output; recovery actions; last verified date; links to official documentation and related experiments. Recall is optional: a checklist is valuable even when consulted rather than memorized.

### Gaps
- Exact technical explanations, commands, and correctness checks for these example subjects require their own source research. These outlines illustrate structure only. The optimal recall-prompt count is not established by the note-organization sources.

## How should navigation, visuals, and review work together?

### Takeaway
Use curated links to explain conceptual relationships and native filtered views to surface administrative queues. Keep diagrams and recall near the relevant content, with a light recurring processing routine rather than a separate question-bank hierarchy.

### Cited Findings
- Bases is a core plugin for database-like file views: users can view, edit, filter, and sort files and properties. Data remains in local Markdown files and their properties; views can be stored in `.base` files or embedded. — [Bases](https://obsidian.md/help/bases)
- Search supports property filters and embedded results; Backlinks exposes linked and unlinked mentions of the active note. — [Search](https://obsidian.md/help/plugins/search); [Backlinks](https://obsidian.md/help/plugins/backlinks)
- Mermaid diagrams render inside Markdown code blocks. Mermaid internal-link nodes do not appear in Obsidian's Graph view. Canvas supports spatial arrangements of notes, attachments, and web pages, but text-only cards do not appear in Backlinks until converted into files. — [Mermaid](https://obsidian.md/help/advanced-syntax); [Canvas](https://obsidian.md/help/plugins/canvas)
- Foldable callouts support collapsed answer content. Embeds can reuse a note, heading, or block and stay updated with their source. Embedded canvases currently show shapes without card text, so opening the Canvas itself may be necessary. — [Callouts](https://obsidian.md/help/callouts); [Embeds](https://obsidian.md/help/embeds)

### Inferences
- Let a Base answer “Which captures remain unprocessed?” or “Which idea notes are developing?” Let a curated hub answer “How do these concepts fit together, and where should I start?” File lists cannot supply that explanatory judgment automatically. — [Bases](https://obsidian.md/help/bases); [Maps](https://blog.linkingyourthinking.com/maps/)
- Proposed workflow: capture briefly with source/context; during a short processing session, search for an existing topic, merge or develop the capture, and link it into a hub. During review, choose a small set of important notes, attempt their prompts or redraw their diagrams before revealing cues, and repair explanations after checking. Keep developing ideas and practical references accessible without requiring memorization. — [Writing inbox](https://notes.andymatuschak.org/A_writing_inbox_for_transient_and_incomplete_notes); [Search](https://obsidian.md/help/plugins/search); [Callouts](https://obsidian.md/help/callouts)
- Choose Mermaid for a stable process or relationship diagram; Canvas for exploratory spatial comparison; embedded images for plots or illustrations. Maintain ordinary text links as well when backlink discovery matters. A future plugin should assist these workflows without assuming it must replace native capabilities. — [Mermaid](https://obsidian.md/help/advanced-syntax); [Canvas](https://obsidian.md/help/plugins/canvas); [Embeds](https://obsidian.md/help/embeds)

### Gaps
- Foldable callouts provide concealment, not a documented recall scheduling or grading system. This research did not validate a spaced-review algorithm, UI prototype, or existing vault. No vault inspection, migration, installation, or implementation was performed.
