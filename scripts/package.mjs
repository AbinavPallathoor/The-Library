import { readFile, writeFile, mkdir } from "node:fs/promises";
import { zipSync } from "fflate";
await mkdir("dist", { recursive: true });
async function zip(name, files) {
  const entries = {};
  for (const [destination, source] of Object.entries(files))
    entries[destination] = new Uint8Array(await readFile(source));
  await writeFile("dist/" + name, zipSync(entries, { level: 9 }));
}
await zip("clear-plugin.zip", {
  "clear/main.js": "main.js",
  "clear/manifest.json": "manifest.json",
  "clear/styles.css": "styles.css",
  "clear/FONT-LICENSE.txt": "theme/FONT-LICENSE.txt",
});
await zip("clear-theme.zip", {
  "Clear Night/theme.css": "theme/theme.css",
  "Clear Night/manifest.json": "theme/manifest.json",
  "Clear Night/FONT-LICENSE.txt": "theme/FONT-LICENSE.txt",
});
await zip("clear-mcp.zip", {
  "clear-mcp/clear-mcp.cjs": "dist/clear-mcp.cjs",
  "clear-mcp/README.md": "docs/installation/llm-connection.md",
});
console.log("Packaged Clear plugin, Clear Night theme, and MCP companion.");
