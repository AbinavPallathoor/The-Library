import {graphQuery} from './focus';
export interface NotebookColourGroup {paths:string[];colour:string}
interface Engine {getOptions():Record<string,unknown>;setOptions(options:Record<string,unknown>):void;updateSearch():void}
interface Workspace {getLeavesOfType(type:string):{view:unknown}[]}
/** Core 1.14.4 colour groups: {query, color:{a:1,rgb:number}}. */
export class NotebookGraphColours {
 private original=new Map<Engine,unknown>();
 constructor(private workspace:Workspace){}
 apply(groups:NotebookColourGroup[]) {
  const colours=groups.filter(g=>g.paths.length && /^#[0-9a-f]{6}$/i.test(g.colour)).map(g=>({query:graphQuery(g.paths),color:{a:1,rgb:parseInt(g.colour.slice(1),16)}}));
  for(const type of ['graph','localgraph']) for(const leaf of this.workspace.getLeavesOfType(type)) {
   const engine=(leaf.view as {dataEngine?:Engine})?.dataEngine;
   if(!engine || typeof engine.getOptions!=='function' || typeof engine.setOptions!=='function' || typeof engine.updateSearch!=='function')continue;
   try {
    const current=engine.getOptions().colorGroups;
    if(!this.original.has(engine))this.original.set(engine,structuredClone(current ?? []));
    const desired=[...colours,...(this.original.get(engine) as unknown[])];
    if(JSON.stringify(current)===JSON.stringify(desired))continue;
    engine.setOptions({colorGroups:desired});engine.updateSearch();
   }catch{/* Unsupported core graph must not interrupt navigation. */}
  }
 }
 restore(){for(const [engine,colorGroups]of this.original){try{engine.setOptions({colorGroups});engine.updateSearch();}catch{}}this.original.clear();}
}
