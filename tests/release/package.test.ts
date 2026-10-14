import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { unzipSync } from "fflate";
import vm from "node:vm";
it("ships installable mobile plugin, offline font and license", () => {
  const members = unzipSync(readFileSync("dist/the-library-plugin.zip"));
  expect(Object.keys(members).sort()).toEqual([
    "the-library/FONT-LICENSE.txt",
    "the-library/main.js",
    "the-library/manifest.json",
    "the-library/styles.css",
  ]);
  const manifest = JSON.parse(
    new TextDecoder().decode(members["the-library/manifest.json"]),
  );
  expect(manifest.isDesktopOnly).toBe(false);
  expect(new TextDecoder().decode(members["the-library/styles.css"])).toContain(
    "data:font/woff2;base64,",
  );
});
it("loads the actual plugin bundle without Node or Electron on mobile", () => {
  const code = readFileSync("main.js", "utf8");
  const required: string[] = [];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    TextEncoder,
    TextDecoder,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout,
    require: (name: string) => {
      required.push(name);
      if (name !== "obsidian") throw Error("Mobile cannot require " + name);
      return {
        Plugin: class {},
        ItemView: class {},
        PluginSettingTab: class {},
        Component: class {},
      };
    },
  };
  vm.runInNewContext(code, sandbox);
  expect([...new Set(required)]).toEqual(["obsidian"]);
});
it("packages the companion and optional theme", () => {
  expect(Object.keys(unzipSync(readFileSync("dist/the-library-mcp.zip")))).toContain(
    "the-library-mcp/the-library-mcp.cjs",
  );
  const theme = unzipSync(readFileSync("dist/the-library-theme.zip"));
  expect(Object.keys(theme)).toContain("The Library Night/theme.css");
});
