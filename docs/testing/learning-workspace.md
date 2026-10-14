# Clear 0.1.0 verification

Date: 2026-10-14. Environment: macOS, Node 26.7.0; Obsidian API package 1.14.4. Native Obsidian 1.14.4 is installed, but its CLI is disabled.

## Passed

- 22 unit/integration tests: routes, exact content hashes, frontmatter preservation, search, alias/heading/body matching, explicit course tagging, transaction preflight, retries, concurrent request IDs, rollback conflicts, checked undo, newer recall metadata preservation, folder renames, read/edit/save/cancel gating, retained drafts after conflict, mobile return navigation, hidden answers, templates and bridge authentication.
- TypeScript check and production builds.
- Four release tests: plugin/theme/companion ZIP contents, bundled font license, actual plugin bundle loading in a VM that rejects all Node/Electron imports, and a real spawned stdio MCP companion listing seven tools, two resources and completing an authenticated bridge call.
- 5,000-note synthetic index: 152 ms to parse/index and 16 ms for the measured searches in Node. This excludes native vault disk reads and is not an Android performance claim.
- T3 browser at 1280×800 and Pixel 7 dimensions (412×915): no document overflow, single-pane phone layout, reader initially has no textarea, Edit exposes Save/Cancel, bundled serif selected, Home→note→Library returns to the list.
- Independent code review found and prompted fixes to mobile navigation, repeated index redraws, undo metadata protection, and descendant paths after folder renames.

## Unverified / remaining integration work

- Native Obsidian end-to-end rendering and lifecycle. A disposable fixture exists at `.preview/Clear Validation`; it contains only generated test notes and the plugin. The native folder-picker automation did not complete opening it. The user's DigitalBrain vault was not modified.
- Physical Android installation, Android WebView rendering, on-screen keyboard and device sync. No adb/device was available. The mobile manifest, no-Node load check and responsive browser checks are compatibility evidence, not physical-device acceptance.
- Native Mermaid, Canvas and Excalidraw rendering. Clear delegates to Obsidian's Markdown renderer and asset opening. No Excalidraw editor API is bundled. Third-party renderers need native testing.
- OSR scheduling integration and image-occlusion authoring are not implemented. Recall is explicitly unscheduled; users may use Obsidian Spaced Repetition separately.
- A real external LLM host connected to a real Obsidian vault. The actual stdio companion and local bridge were tested together using an SDK client and test dispatcher.
- T3 screenshot capture failed and the automation host later explicitly disconnected. A separate local Chromium run then captured and visually checked desktop and phone screenshots, completed Edit/Cancel and phone Library-return interactions, and reported no page errors or overflow. These remain browser-demo checks, not native Obsidian/device checks.
- Registry export exists; automatic import/migrations from other schemas are not implemented. Unknown schema versions fail closed without overwriting persisted data.

## Recovery decisions

Obsidian supplies an atomic read/modify operation for content, but not a compare-and-delete. The native adapter refuses to delete newly created files during rollback/undo and reports a partial result. Topic associations are retained if their later ownership cannot be established. These conservative leftovers are preferable to deleting a human edit. Existing-file restoration and newer prompt/role ownership are checked.

## Native acceptance checklist

Open the generated fixture in Obsidian, enable Clear, then browse → read Mermaid → follow link → return → Edit → Save/Cancel → add recall → reveal/assess → change a note externally → retry stale write → rename a folder → reload/unload. Repeat reading, search, editing, keyboard and recall on Android. Run OSR/Excalidraw-specific tests before advertising those integrations as verified.

Browser screenshots: [desktop](clear-desktop.png), [reader](clear-reader.png), [phone layout](clear-android-layout.png).
