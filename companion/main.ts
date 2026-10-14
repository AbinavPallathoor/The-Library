import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { readFile } from "node:fs/promises";
import { schemas, descriptions } from "../src/bridge/tool-handlers";
import workflow from "../docs/workflows/llm-note-workflow.md";
const descriptorPath = process.argv[2];
if (!descriptorPath) {
  process.stderr.write(
    "Usage: node the-library-mcp.cjs /absolute/path/to/connection.json\n",
  );
  process.exit(1);
}
async function call(name: string, input: unknown) {
  const config = JSON.parse(await readFile(descriptorPath, "utf8")) as {
    url: string;
    token: string;
    vaultId: string;
  };
  const url = new URL(config.url);
  if (
    url.hostname !== "127.0.0.1" ||
    url.protocol !== "http:" ||
    url.pathname !== "/v1/rpc"
  )
    throw Error("Invalid local bridge address");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + config.token,
    },
    body: JSON.stringify({ vaultId: config.vaultId, name, input }),
    signal: AbortSignal.timeout(30000),
  });
  const body = (await response.json()) as { error?: string; result?: unknown };
  if (!response.ok) throw Error(body.error ?? "Bridge request failed");
  return body.result;
}
serveStdio(() => {
  const server = new McpServer({ name: "clear-notes", version: "0.1.0" });
  for (const name of Object.keys(schemas) as (keyof typeof schemas)[])
    server.registerTool(
      name,
      { description: descriptions[name], inputSchema: schemas[name] },
      async (input: unknown) => {
        try {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(await call(name, input)),
              },
            ],
          };
        } catch (e) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: e instanceof Error ? e.message : "Bridge unavailable",
              },
            ],
          };
        }
      },
    );
  server.registerResource(
    "workflow",
    "clear://workflow",
    { mimeType: "text/markdown" },
    async () => ({
      contents: [
        { uri: "clear://workflow", mimeType: "text/markdown", text: workflow },
      ],
    }),
  );
  server.registerResource(
    "workspace-policy",
    "clear://workspace-policy",
    { mimeType: "application/json" },
    async () => ({
      contents: [
        {
          uri: "clear://workspace-policy",
          mimeType: "application/json",
          text: JSON.stringify(await call("get_workspace_policy", {})),
        },
      ],
    }),
  );
  return server;
});
