/**
 * Adapter for the bundled Obsidian 1.14.4 core graph. These are internal APIs;
 * feature detection keeps other versions (and disabled graphs) harmless.
 * Observed in obsidian.asar/app.js: graph.dataEngine.getOptions/setOptions,
 * updateSearch; renderer.zoomTo/setPan/changed and nodes[].{id,x,y}.
 */
interface Renderer {
  nodes: Array<{ id: string; x: number; y: number }>;
  width: number; height: number; panX: number; panY: number; targetScale: number;
  containerEl?: HTMLElement;
  zoomTo(scale: number): void;
  setScale(scale: number): void;
  setPan(x: number, y: number): void;
  changed(): void;
}
interface Engine {
  getOptions(): Record<string, unknown>;
  setOptions(options: Record<string, unknown>): void;
  updateSearch(): void;
}
interface Graph { dataEngine: Engine; renderer: Renderer }
interface Workspace { getLeavesOfType(type: string): Array<{ view: unknown }> }
interface Cache { resolvedLinks: Record<string, Record<string, number>> }
interface Snapshot { options: Record<string, unknown>; panX: number; panY: number }

function graph(value: unknown): value is Graph {
  const v = value as Partial<Graph> | null;
  return !!v?.dataEngine && !!v.renderer &&
    ['getOptions', 'setOptions', 'updateSearch'].every(k => typeof (v.dataEngine as unknown as Record<string, unknown>)[k] === 'function') &&
    ['zoomTo', 'setScale', 'setPan', 'changed'].every(k => typeof (v.renderer as unknown as Record<string, unknown>)[k] === 'function') && Array.isArray(v.renderer.nodes);
}

/** Include one hop in either direction, without expanding to the entire vault. */
export function notebookConnections(paths: string[], links: Cache['resolvedLinks']): string[] {
  const primary = new Set(paths), result = new Set(paths);
  for (const [source, destinations] of Object.entries(links)) {
    if (primary.has(source)) Object.keys(destinations).forEach(path => result.add(path));
    else if (Object.keys(destinations).some(path => primary.has(path))) result.add(source);
  }
  return [...result].sort();
}

export function graphQuery(paths: string[]): string {
  const escape = (path: string) => path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  // One anchored path regex prevents similarly named folders or files leaking in.
  return `path:/^(?:${paths.map(escape).join('|') || '(?!)'})$/`;
}

export class NotebookGraphFocus {
  private saved = new Map<Graph, Snapshot>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private selected = '';
  constructor(private workspace: Workspace, private cache: Cache) {}

  focus(paths: string[]): void {
    const selected = [...new Set(paths)].sort().join('\n');
    const views = this.workspace.getLeavesOfType('graph').map(leaf => leaf.view).filter(graph);
    if (selected === this.selected && views.every(view => this.saved.has(view))) return;
    this.clearTimers();
    this.selected = selected;
    const included = notebookConnections(paths, this.cache.resolvedLinks);
    const allowed = new Set(included);
    for (const view of views) {
      try {
        if (!this.saved.has(view)) this.saved.set(view, {
          options: structuredClone(view.dataEngine.getOptions()),
          panX: view.renderer.panX, panY: view.renderer.panY,
        });
        view.dataEngine.setOptions({ search: graphQuery(included), showOrphans: true, showTags: false, showAttachments: false, hideUnresolved: true });
        view.dataEngine.updateSearch();
        // Core search and its force layout are asynchronous. Repeat bounded fits;
        // never keep overriding the user's manual pan/zoom indefinitely.
        for (const delay of [300, 900, 1800]) this.timers.push(setTimeout(() => this.fit(view, allowed), delay));
      } catch { /* An incompatible core graph must not prevent notebook navigation. */ }
    }
  }

  private fit(view: Graph, allowed: Set<string>): void {
    try {
      const r = view.renderer;
      const nodes = r.nodes.filter(n => allowed.has(n.id) && Number.isFinite(n.x) && Number.isFinite(n.y));
      if (!nodes.length || r.width <= 0 || r.height <= 0) return;
      const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const ratio = r.containerEl?.ownerDocument.defaultView?.devicePixelRatio || 1;
      const scale = Math.min(2, Math.max(1 / 128, Math.min(r.width * ratio / (maxX - minX + 180), r.height * ratio / (maxY - minY + 180))));
      r.zoomTo(scale);
      r.setScale(scale);
      r.setPan(r.width * ratio / 2 - (minX + maxX) / 2 * scale, r.height * ratio / 2 - (minY + maxY) / 2 * scale);
      r.changed();
    } catch { /* The pane may have closed while its layout was settling. */ }
  }

  restore(): void {
    this.clearTimers();
    this.selected = '';
    for (const [view, saved] of this.saved) {
      try {
        view.dataEngine.setOptions(saved.options);
        view.dataEngine.updateSearch();
        if (typeof saved.options.scale === "number") view.renderer.setScale(saved.options.scale);
        view.renderer.setPan(saved.panX, saved.panY);
        view.renderer.changed();
      } catch { /* A closed graph pane needs no restoration. */ }
    }
    this.saved.clear();
  }

  private clearTimers(): void { this.timers.forEach(clearTimeout); this.timers = []; }
}
