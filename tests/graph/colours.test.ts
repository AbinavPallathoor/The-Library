import {it,expect,vi} from 'vitest';
import {NotebookGraphColours} from '../../src/graph/colours';
import {notebookColour} from '../../src/notebooks/colours';
import {VaultIndex} from '../../src/index/vault-index';
import {notebooks} from '../../src/notebooks/model';
it('keeps a chosen colour across notebook title changes and rejects malformed colours',()=>{
 const index=new VaultIndex();index.upsert('Networking/Networking.md','---\nnotebook-id: stable\ntitle: Computer Networking\n---');
 const book=notebooks(index)[0];expect(notebookColour(book)).toBe('#b4d6f6');
 expect(notebookColour({...book,title:'Networks'},{stable:'#abcdef'})).toBe('#abcdef');
 expect(notebookColour(book,{stable:'red;display:none'})).toBe('#b4d6f6');
});
it('updates graph colours without replacing search and restores existing groups',()=>{
 const original=[{query:'tag:#work',color:{a:1,rgb:123}}];
 let options:Record<string,unknown>={search:'my filter',colorGroups:original};
 const engine={getOptions:()=>options,setOptions:vi.fn((v)=>{options={...options,...v};}),updateSearch:vi.fn()};
 const colours=new NotebookGraphColours({getLeavesOfType:t=>t==='graph'?[{view:{dataEngine:engine}}]:[]});
 colours.apply([{paths:['A.md'],colour:'#b4d6f6'}]);
 expect(options.search).toBe('my filter');expect((options.colorGroups as any[])[0].color.rgb).toBe(0xb4d6f6);
 const count=engine.setOptions.mock.calls.length;colours.apply([{paths:['A.md'],colour:'#b4d6f6'}]);expect(engine.setOptions).toHaveBeenCalledTimes(count);
 colours.apply([{paths:['A.md'],colour:'#112233'}]);expect((options.colorGroups as any[])).toHaveLength(2);
 colours.restore();expect(options.colorGroups).toEqual(original);expect(options.search).toBe('my filter');
});
