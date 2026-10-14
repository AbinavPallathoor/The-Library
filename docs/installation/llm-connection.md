# Connect your LLM to The Library

The Library works without an AI account or API key. Your existing LLM filesystem tools can follow [the note workflow](../workflows/llm-note-workflow.md). Explain your blurt in your LLM client; there is no capture screen.

For revision-protected tools on desktop:

1. Install the The Library plugin and open the vault in Obsidian.
2. In Settings → The Library, press **Start local bridge**. It displays a connection-file path under `~/.clear/connections/`. This local file contains the credential; do not sync or share it.
3. Extract `the-library-mcp.zip`. With Node 22 or newer installed, add this stdio server to your LLM client's MCP settings, substituting absolute paths:

```json
{
  "mcpServers": {
    "the-library": {
      "command": "node",
      "args": ["/absolute/path/the-library-mcp.cjs", "/absolute/path/to/connection.json"]
    }
  }
}
```

The server exposes `get_workspace_policy`, `find_notes`, `read_note`, `propose_capture`, `apply_changes`, `get_receipt`, and `get_review_context`. Workflow and policy are also MCP resources. Read policy and search first; the policy includes the full capture JSON schema. Propose stores a draft; apply writes its exact contents with revision checks. Reuse the same request ID after a lost response. Changed content requires a new ID.

The bridge starts only when requested, binds to localhost, and stops when the plugin unloads. Restart it after reopening Obsidian. A connected client with the credential can read and change Markdown in this vault. No hosted service or telemetry is involved.

Android runs the library, reader, guarded editor, and recall. The Node MCP bridge runs on desktop. Changes can be synchronized using your existing vault-sync setup; The Library is not a synchronization service.
