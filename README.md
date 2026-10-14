# The Library

A quiet notebook workspace for **Obsidian**. Flat illustrated covers, pastel blue accents, dark surfaces, and an offline Lora reading font. No sidebars or capture screen.

Open a notebook, browse its index, and read. Editing only begins when you press **Edit**; **Save** commits changes and **Cancel** discards the draft. Revision checks protect notes changed elsewhere.

## Your notebooks

```text
Notebooks/
  Robotics/
    Index.md
    Feedback loops.md
    Assets/
```

**New notebook** creates a portable `Index.md` with a stable `notebook-id` and title in YAML. Add ordinary Markdown notes beside it. Index headings group `[[wikilinks]]`; unlisted notes appear automatically under Additional notes. Missing links remain visible without creating files. Links to other notebooks open the original note, without making copies.

Existing folders appear as notebooks without moving your notes. Root-level notes appear under Unsorted. Add an `Index.md` to curate a folder. The shelf searches notebook titles and note content. Each notebook gets deterministic abstract cover artwork; custom cover uploads are not implemented.

The reader includes related links, saved reading positions, and optional recall practice with answers hidden until reveal. Practice is self-assessed and unscheduled. Mermaid renders through Obsidian; Excalidraw and Canvas assets open through their native views when their supporting plugins are available.

## Install on desktop or Android

1. Build the archives below, then extract `dist/the-library-plugin.zip` into your vault’s `.obsidian/plugins/`.
2. Confirm `.obsidian/plugins/the-library/` contains `main.js`, `manifest.json`, and `styles.css`.
3. Enable **The Library** in Community plugins. Use the book ribbon icon or **The Library: Open learning workspace**.
4. Optional: extract `dist/the-library-theme.zip` into `.obsidian/themes/`, select **The Library Night**, and choose dark mode.

The workspace is dark independently of the selected theme. Library presentation hides Obsidian sidebars, ribbon, and the active view’s tab/header chrome without deleting panes. **Return to Obsidian** restores the chrome; a command-palette escape is also available. The companion theme styles native views outside Library mode.

Use the same plugin folder on Android. The desktop MCP bridge is optional and requires Node 22+. Vault synchronization is handled by your existing sync service.

**Upgrading from Clear:** disable the old plugin first, copy its `data.json` into the new `the-library` folder if you want to retain prompts, pins, and reading positions, then enable The Library. Existing notes need no migration. Internal font and MCP resource identifiers remain compatible; local bridge credentials still live under `~/.clear/connections/`.

## Notes through your LLM

Explain what you learned to your existing LLM, then ask it to update your notebooks. It should read indexes, search before creating, update coherent topic notes, add useful diagrams, and link new notes into their index. Course codes are optional tags added only when explicitly supplied.

[LLM workflow](docs/workflows/llm-note-workflow.md) · [Connect the MCP companion](docs/installation/llm-connection.md)

The seven desktop tools support revision-checked proposals, writes, receipts, and recall context. No hosted service, telemetry, or AI API key is required by the plugin. The local bridge starts only when explicitly enabled. Existing drafts and receipts remain in plugin data; there is no capture UI.

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

Archives are generated in `dist/`. The browser preview uses demonstration notes. These commands do not modify a personal vault.

Native Obsidian presentation and physical Android behavior still need device validation. Browser layout and the mobile-safe bundle checks do not establish native parity. No automatic spaced-repetition scheduling or custom cover picker is included.
