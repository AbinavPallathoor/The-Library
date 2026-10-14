import { build } from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2020",
  external: ["obsidian", "electron", "node:*"],
  loader: { ".md": "text" },
  logLevel: "info",
});
await build({
  entryPoints: ["companion/main.ts"],
  outfile: "dist/the-library-mcp.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  loader: { ".md": "text" },
  logLevel: "info",
});
let fonts = "";
for (const [weight, style] of [
  [400, "normal"],
  [400, "italic"],
  [600, "normal"],
]) {
  const data = await readFile(
    `node_modules/@fontsource/lora/files/lora-latin-${weight}-${style}.woff2`,
  );
  fonts += `@font-face{font-family:'Clear Lora';font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data.toString("base64")}) format('woff2');}\n`;
}
await writeFile(
  "styles.css",
  fonts + (await readFile("src/styles.css", "utf8")) + (await readFile("theme/tokens.css", "utf8")).replace(".theme-dark", "body.library-focus"),
);
await writeFile(
  "theme/theme.css",
  fonts + (await readFile("theme/tokens.css", "utf8")),
);
await copyFile(
  "node_modules/@fontsource/lora/LICENSE",
  "theme/FONT-LICENSE.txt",
);
