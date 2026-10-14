import { it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startBridge } from "../../src/bridge/server";
it("real bundled stdio companion lists tools and calls its authenticated bridge", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "the-library-mcp-test-"));
  const bridge = await startBridge(
    "test",
    async (name) => ({ name, vaultId: "test" }),
    { persistDescriptor: false },
  );
  const config = path.join(dir, "connection.json");
  await writeFile(
    config,
    JSON.stringify({ url: bridge.url, token: bridge.token, vaultId: "test" }),
  );
  const client = new Client({ name: "clear-release-test", version: "1.0.0" });
  try {
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [path.resolve("dist/the-library-mcp.cjs"), config],
      }),
    );
    expect((await client.listTools()).tools).toHaveLength(6);
    const result = await client.callTool({
      name: "get_workspace_policy",
      arguments: {},
    });
    expect(JSON.stringify(result)).toContain("test");
    expect((await client.listResources()).resources).toHaveLength(2);
  } finally {
    await client.close();
    await bridge.close();
    await rm(dir, { recursive: true, force: true });
  }
}, 15000);
