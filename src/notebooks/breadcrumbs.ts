import type { VaultIndex } from '../index/vault-index';
import type { NoteRecord } from '../domain/types';
import type { Notebook } from './model';

/** Topic ancestry uses declared hubs, never arbitrary backlinks. */
export function topicTrail(index: VaultIndex, book: Notebook, path: string): NoteRecord[] {
 const note = index.notes.get(path);
 if (!note) return [];
 const inside = (n: NoteRecord) => book.folder ? n.path.startsWith(book.folder + '/') : !n.path.includes('/');
 const hubs = [...index.notes.values()].filter(n => inside(n) && n.path !== path && n.path !== book.index?.path && n.tags.includes('hub')).sort((a,b) => a.path.localeCompare(b.path));
 const links = (n: NoteRecord, target: string) => n.links.some(l => index.resolve(l,n.path)?.path === target);
 const roots = hubs.filter(h => !hubs.some(other => other !== h && links(other,h.path)));
 // A cyclic hub component has no root. Search it safely with visited paths.
 const queue = (roots.length ? roots : hubs).map(h => [h]);
 const visited = new Set<string>();
 while (queue.length) {
  const chain = queue.shift()!;
  const last = chain[chain.length-1];
  if (visited.has(last.path)) continue;
  visited.add(last.path);
  if (links(last,path)) return [...chain,note];
  for (const child of hubs) if (links(last,child.path) && !visited.has(child.path)) queue.push([...chain,child]);
 }
 return [note];
}
