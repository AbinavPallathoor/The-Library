import { el } from './dom';
/** Original vector artwork: offline, crisp at any size, no external requests. */
export function cover(parent: HTMLElement, title: string, variant: number) {
 const art = el('div', 'library-cover art-' + variant, undefined, parent);
 const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 240 220'); svg.setAttribute('aria-hidden','true');
 const shape = (tag:string, attrs:Record<string,string>) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
  svg.append(node);
 };
 if (variant===0) {
  for(let i=0;i<16;i++) shape('path',{d:`M ${-55+i*10} 225 C ${-10+i*8} ${80-i*3}, ${160+i*6} ${230-i*9}, ${150+i*8} -20`,fill:'none',stroke:'currentColor','stroke-width':i%4===0?'1.4':'.65',opacity:'.55'});
 } else if(variant===1) {
  for(let i=0;i<9;i++) shape('ellipse',{cx:'120',cy:'106',rx:String(25+i*9),ry:'79',transform:`rotate(${i*20} 120 106)`,fill:'none',stroke:'currentColor','stroke-width':'.7',opacity:'.5'});
  shape('circle',{cx:'120',cy:'106',r:'7',fill:'currentColor'});
 } else if(variant===2) {
  shape('path',{d:'M 45 200 Q 90 140 165 35',fill:'none',stroke:'currentColor','stroke-width':'1.3'});
  for(let i=0;i<7;i++) { const x=63+i*13,y=175-i*19; shape('path',{d:`M${x} ${y} Q${x-66} ${y-38} ${x-24} ${y-64} Q${x+4} ${y-38} ${x} ${y} M${x} ${y} Q${x+60} ${y+2} ${x+60} ${y-33} Q${x+22} ${y-36} ${x} ${y}`,fill:'none',stroke:'currentColor','stroke-width':'.85',opacity:'.65'}); }
 } else {
  for(let i=0;i<12;i++) shape('path',{d:`M${26+i*8} 175 L${120+i*6} ${15+i*5} L${214-i*8} 175 Z`,fill:'none',stroke:'currentColor','stroke-width':'.8',opacity:'.6'});
  shape('circle',{cx:'173',cy:'48',r:'19',fill:'currentColor',opacity:'.7'});
 }
 art.append(svg);
 el('span','library-cover-title',title,art);
 return art;
}
