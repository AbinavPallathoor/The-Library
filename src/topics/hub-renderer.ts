export function mergeOwnedHub(current: string, links: string[]) {
  const start = "<!-- clear:links:start -->",
    end = "<!-- clear:links:end -->";
  const block =
    start +
    "\n" +
    [...new Set(links)]
      .map((p) => "- [[" + p.replace(/\.md$/, "") + "]]")
      .join("\n") +
    "\n" +
    end;
  const a = current.split(start).length - 1,
    b = current.split(end).length - 1;
  if (!a && !b) return current.trimEnd() + "\n\n" + block + "\n";
  if (a !== 1 || b !== 1 || current.indexOf(end) < current.indexOf(start))
    throw Error("Malformed Clear hub section");
  return (
    current.slice(0, current.indexOf(start)) +
    block +
    current.slice(current.indexOf(end) + end.length)
  );
}
