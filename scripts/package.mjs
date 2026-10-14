import { readFile, writeFile, mkdir } from "node:fs/promises";
import { zipSync } from "fflate";
await mkdir("dist", { recursive: true });
async function zip(name, files) {
  const entries = {};
  for (const [destination, source] of Object.entries(files))
    entries[destination] = new Uint8Array(await readFile(source));
  await writeFile("dist/" + name, zipSync(entries, { level: 9 }));
}
await zip("the-library-plugin.zip", {
  "the-library/main.js": "main.js",
  "the-library/manifest.json": "manifest.json",
  "the-library/styles.css": "styles.css",
  "the-library/FONT-LICENSE.txt": "theme/FONT-LICENSE.txt",
});
await zip("the-library-theme.zip", {
  "The Library Night/theme.css": "theme/theme.css",
  "The Library Night/manifest.json": "theme/manifest.json",
  "The Library Night/FONT-LICENSE.txt": "theme/FONT-LICENSE.txt",
});
await zip("the-library-mcp.zip", {
  "the-library-mcp/the-library-mcp.cjs": "dist/the-library-mcp.cjs",
  "the-library-mcp/README.md": "docs/installation/llm-connection.md",
});
console.log("Packaged The Library plugin, The Library Night theme, and MCP companion.");
