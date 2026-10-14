import type {Notebook} from './model';
export const palette = ['#b4d6f6','#b7dcca','#d2c4ed','#e5ccaa','#e3b8ca'];
export function notebookColour(book: Notebook, saved: Record<string,string> = {}): string {
 const custom=saved[book.id];
 if (/^#[0-9a-f]{6}$/i.test(custom || '')) return custom;
 const defaults:Record<string,string>={'Computer Networking':palette[0],'ROS2 Robotics':palette[1],'Probability and Statistics':palette[2],'Thoughts':palette[3]};
 return defaults[book.title] || palette[[...book.id].reduce((a,c)=>a+c.charCodeAt(0),0)%palette.length];
}
