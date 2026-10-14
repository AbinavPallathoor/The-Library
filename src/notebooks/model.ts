import { parse, stringify } from 'yaml';
import { parseNoteStyle } from '../domain/core';
import type { NoteRecord } from '../domain/types';
import type { VaultIndex } from '../index/vault-index';
export interface Notebook {
 id: string; title: string; folder: string; index?: NoteRecord; cover: number;
 sections: { title: string; entries: { title: string; path?: string }[] }[];
 additional: NoteRecord[];
}
export function notebooks(index: VaultIndex): Notebook[] {
 const books: Notebook[] = [];
 for (const note of index.notes.values()) {
  let meta: Record<string, unknown> = {};
  try { meta = parse(parseNoteStyle(note.markdown).frontmatter) || {}; } catch {}
  const declaredNotebook = typeof meta['notebook-id'] === 'string' && meta['notebook-id'].trim().length > 0;
  if (!declaredNotebook && !/(^|\/)Index\.md$/i.test(note.path)) continue;
  const folder = note.path.includes('/') ? note.path.slice(0, note.path.lastIndexOf('/')) : '';
  const book: Notebook = { id: String(meta['notebook-id'] || note.path), title: String(meta.title || folder.split('/').pop() || 'Notebook'), folder, index: note, cover: 0, sections: [], additional: [] };
  let section = { title: 'Contents', entries: [] as {title:string;path?:string}[] };
  for (const line of parseNoteStyle(note.markdown).body.split('\n')) {
   if (/^#{1,6} /.test(line)) { if (section.entries.length) book.sections.push(section); section = {title: line.replace(/^#+\s+/, ''), entries: []}; }
   for (const m of line.matchAll(/(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    const target = index.resolve(m[1], note.path);
    section.entries.push({title: m[2] || target?.title || m[1], path: target?.path});
   }
  }
  if (section.entries.length) book.sections.push(section);
  books.push(book);
 }
 const owned = (path: string) => books.filter(b => b.index && (!b.folder || path.startsWith(b.folder + '/'))).sort((a,b) => b.folder.length-a.folder.length)[0];
 for (const note of index.notes.values()) {
  if (books.some(b => b.index?.path === note.path)) continue;
  let book: Notebook | undefined = owned(note.path);
  if (!book) {
   const folder = note.path.includes('/') ? note.path.split('/')[0] : '';
   book = books.find(b => !b.index && b.folder === folder);
   if (!book) { book = {id: 'folder:'+folder, title: folder || 'Unsorted', folder, cover: 0, sections: [], additional: []}; books.push(book); }
  }
  if (!book.sections.some(s => s.entries.some(e => e.path === note.path))) book.additional.push(note);
 }
 for (const book of books) { book.cover = [...book.id].reduce((n,c) => n+c.charCodeAt(0),0)%4; book.additional.sort((a,b) => a.title.localeCompare(b.title)); }
 return books.sort((a,b) => a.title.localeCompare(b.title));
}
export function notebookDraft(title: string, id: string) {
 title = title.trim();
 if (!title || title.length > 80 || /[\\/:*?"<>|\[\]#\n\r]/.test(title) || title.startsWith('.') || title.endsWith('.')) throw Error('Use a notebook name without path separators or special characters.');
 return {path: `Notebooks/${title}/${title}.md`, markdown: `---\n${stringify({'notebook-id':id,title})}---\n\n## Notes\n\n`};
}
