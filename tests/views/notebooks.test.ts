// @vitest-environment happy-dom
import { it, expect } from 'vitest';
import { VaultIndex } from '../../src/index/vault-index';
import { notebooks, notebookDraft } from '../../src/notebooks/model';
it('keeps curated cross-links and discovers unlisted notes without duplicating storage', () => {
 const index = new VaultIndex();
 index.upsert('Robotics/Index.md', '---\nnotebook-id: stable\ntitle: Robotics\n---\n## Foundations\n[[Robotics/Feedback]]\n[[Thinking/Memory]]\n[[Missing]]');
 index.upsert('Robotics/Feedback.md', 'Feedback');
 index.upsert('Robotics/New.md', 'New');
 index.upsert('Thinking/Memory.md', 'Memory');
 const book = notebooks(index).find(b => b.id === 'stable')!;
 expect(book.sections[0].entries.map(e => e.path)).toEqual(['Robotics/Feedback.md','Thinking/Memory.md',undefined]);
 expect(book.additional.map(n => n.title)).toEqual(['New']);
 expect(index.notes.size).toBe(4);
});
it('new notebooks use portable Markdown and reject unsafe names', () => {
 const draft = notebookDraft('Robotics', 'id');
 expect(draft.path).toBe('Notebooks/Robotics/Robotics.md');
 expect(draft.markdown).toContain('notebook-id: id');
 expect(() => notebookDraft('../Escape', 'id')).toThrow();
});
it('does not let loose root notes absorb other folders', () => {
 const index = new VaultIndex();
 index.upsert('Loose.md','Root'); index.upsert('Science/A.md','A'); index.upsert('Art/B.md','B');
 expect(notebooks(index).map(b => [b.title,b.additional.length])).toEqual([['Art',1],['Science',1],['Unsorted',1]]);
});

it('recognizes a named notebook by its stable metadata without creating another shelf', () => {
 const index = new VaultIndex();
 index.upsert('Learnings/Computer Networking/Computer Networking.md','---\nnotebook-id: networking\ntitle: Computer Networking\n---\n## Models\n[[OSI Model]]');
 index.upsert('Learnings/Computer Networking/OSI Model.md','Layers');
 const books = notebooks(index);
 expect(books).toHaveLength(1);
 expect(books[0].id).toBe('networking');
 expect(books[0].index?.title).toBe('Computer Networking');
 expect(books[0].sections[0].entries[0].path).toBe('Learnings/Computer Networking/OSI Model.md');
 expect(books[0].additional).toEqual([]);
});
