import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
await build({
  entryPoints: ["preview/main.ts"],
  outfile: ".preview/preview.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  loader: { ".md": "text" },
});
createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  const file =
    path === "/styles.css"
      ? "styles.css"
      : path === "/preview.js"
        ? ".preview/preview.js"
        : "preview/index.html";
  try {
    res.setHeader(
      "content-type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end();
  }
}).listen(5173, "127.0.0.1", () =>
  console.log("The Library preview: http://127.0.0.1:5173"),
);
