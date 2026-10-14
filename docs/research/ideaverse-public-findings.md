# Ideaverse public investigation

Date: 2026-10-14. Scope selected by user: public demonstrations only.

## Identity and evidence boundary

Ideaverse Pro is a downloadable Obsidian vault, not one standalone plugin. The product combines notes, configuration, styling, templates, views, and other plugins. No purchased vault was supplied. No vault runtime was observed.

Sources:

- [Product description and screenshots](https://www.linkingyourthinking.com/ideaverse-pro)
- [ACE lesson](https://www.linkingyourthinking.com/ideaverse-for-obsidian/ideaverse-lesson-2-the-headspace-of-ace)
- [Maps of Content lesson](https://www.linkingyourthinking.com/ideaverse-for-obsidian/ideaverse-lesson-6-how-to-do-note-making-and-map-making)

## Finding ledger

| Area | Publicly supported behavior | Evidence type | Remaining unknown |
| --- | --- | --- | --- |
| Home | Central navigation, Bases, Wayfinders | Product description; Home screenshot | Exact queries and saved layouts |
| Atlas | Knowledge organized around connected ideas | Description; ACE lesson | Complete schema and navigation rules |
| Calendar | Date-organized notes, meetings, and ideas | Description; Home screenshot | Recurrence and date handling |
| Efforts | Three intensity levels; areas, projects, works | Description; Efforts and Home screenshots | Complete lifecycle and automation |
| Collections | 22+ collections with dynamic views | Description; movie screenshot | Exhaustive collection/template inventory |
| Garden | Rediscovery using time, connections, and tags | Description; Garden screenshot | Ranking formulas |
| Capture | Hotkey capture and routing | Description; capture screenshot | Full macros and input forms |
| Zero | Clean structure without personal example content | Description | Exact install manifest |

### Screenshot observations

These establish visible appearance and labels, not runtime behavior:

- [Home Base](https://cdn.prod.website-files.com/5f7f16adf0e1d240ab23c493/69262d9c1b987ee3870e297c_idv-pro-2.5-hero-1.avif): cream panels, teal outer frame and links, purple typography, large serif heading, colored navigation strips. Knowledge navigation includes Dots, Maps, Sources; time navigation includes Days, Records, Reviews; action navigation includes Areas, Projects, Works. Projects expose Active, Simmering, Sleeping. Side panes show recent notes, project tables, graph, and calendar.
- [Efforts](https://cdn.prod.website-files.com/5f7f16adf0e1d240ab23c493/67ff08c5f11b9414a0820f8f_CleanShot%202025-04-15%20at%2014.57.51.avif): a combined table of areas, projects, and works with numeric rank. This older image says Pro 2; it cannot establish every Pro 2.5 detail.
- [Garden](https://cdn.prod.website-files.com/5f7f16adf0e1d240ab23c493/67ff08ceff58088a11ef225d_CleanShot%202025-04-15%20at%2015.09.26.avif): Plant, Cultivate, Question, Repot, Revitalize, Revisit navigation; visible nested garden tags and a related-note graph.
- [Capture](https://cdn.prod.website-files.com/5f7f16adf0e1d240ab23c493/69262d9cedd6d311da1a5514_idv-pro-2.5-quickadd.avif): choices include quotes, people, clippings, events, ideas, meetings, nice things, areas, projects, works, movies, TV, and appending to a daily note. QuickAdd is explicitly named; complete configuration is not visible.
- [Movies](https://cdn.prod.website-files.com/5f7f16adf0e1d240ab23c493/69262d9c815e65b67decac8a_idv-pro-2.5-movies.avif): compact cover cards with sorting, filtering, property selection, and New controls. This does not establish whether covers are fetched automatically.

## REA analysis

Operation: `analyze_javascript_application`, directory input, summary output.
Input: downloaded public page HTML plus its extracted inline JavaScript, analyzed inertly. External scripts and paid vault files were not included.

- Parent Evidence: `ev_00bf00a53d2ba68717fa40a365c6d78f9a8c4b1a918c7cc1b247d31b29f97753`
- Summary Evidence: `ev_331aba075d80e770270c561734b99fe4f1b09d4fad526fb64916c33827c734f1`
- Artifact SHA-256: `44f781436a1442383354676b9ccfd64f75b4b99ea17c6861e778394ad6e79974`
- Two relevant files; one JavaScript file parsed; zero parse failures; no Electron entry points recovered in this bounded input.
- Semantic coverage remains unknown, with 408 static-analysis unknowns. These concern the captured website scripts, not 408 missing product features.

REA analyzed the website artifacts successfully but did not recover the Obsidian product. The useful product evidence is the published descriptions and screenshots. Do not use this result as proof of feature equivalence or runtime validation.

## Completion boundary

Public feature inventory and representative visual inspection: complete for the sources above.
Full Pro parity, exact original theme CSS, template bodies, all 22+ collection definitions, installed plugin list, and query implementations: unresolved without further public evidence or a supplied vault.
Implementation and in-Obsidian verification: not started.
