# Clear

A dark, reading-first Obsidian workspace for one library of learning, ideas and reference notes. Search, follow topic links, pin notes, resume reading, capture thoughts and practise recall. Editing requires **Edit → Save**; Cancel discards the draft. Existing Markdown stays in its current folders.

The palette uses deep teal, warm text and muted lavender, with an offline Lora serif. This is an original interpretation of the public Ideaverse aesthetic; the exact paid-vault font has not been verified.

## Install

1. Extract `dist/clear-plugin.zip` into your vault's `.obsidian/plugins/`. You should have `.obsidian/plugins/clear/main.js`, `manifest.json`, `styles.css` and the font license.
2. In Obsidian → Settings → Community plugins, enable **Clear**. Open it with the book ribbon icon or **Clear: Open learning workspace**. It opens on startup by default.
3. Optional: extract `dist/clear-theme.zip` into `.obsidian/themes/`, select **Clear Night** in Appearance, and select dark mode. The Clear workspace itself is dark with any host theme.

Use the same plugin files on **Android**. Copy them into the Android vault's `.obsidian/plugins/clear/`, then enable Clear on that device. The library, reader, guarded editor, capture and recall use mobile-compatible APIs. Only the optional Node MCP bridge requires desktop. Clear does not provide vault synchronization.

## Use

- **Library:** search titles, aliases, headings and content; filter by existing tags. Ideas and Reference are alternate views of the same files.
- **Topics:** opens notes with hub tags, multiple outgoing links, or topic associations supplied by your LLM.
- **Reading:** links, outline, pinning and reading position. Notes are not editable until you press Edit. This protection applies inside Clear; Obsidian's own editor remains available outside it.
- **Recall:** answer before revealing, then assess yourself. This release provides unscheduled practice; no automatic mastery scores or due-date claims.
- **Capture:** keep a blurt, copy it with LLM instructions, create a note, or apply a structured LLM proposal. Course tags are added only when explicitly supplied.
- **LLM tools:** [connect the optional MCP companion](docs/installation/llm-connection.md) or use your existing file tools with the [workflow guide](docs/workflows/llm-note-workflow.md).

Clear never sends notes to a hosted service and has no telemetry or AI API key. Starting the local bridge explicitly lets credential-bearing local clients read and update this vault. It is off on startup.

Undo restores only content that still matches the saved revision. Newly created notes and topic associations are conservatively retained during undo/recovery, with a partial receipt, because Obsidian has no atomic compare-and-delete API. Remove those retained items manually if desired.

## Build and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run package
npm run test:release
npm run preview
```

The preview uses demonstration notes, not your vault. [Verification and remaining limitations](docs/testing/learning-workspace.md). Release archives are in `dist/`. No live personal vault is modified by these commands.
