// Logical coordinates match the MAX game. Contract checked against circle-model.
export const GLASS_IOR=1.46;
export function glassPanels(mode){return mode==='single'?[[2264,192,1760,1024]]:[[2264,272,864,864],[3160,272,864,864]];}
export function glassLayers(_mode,time=0){
 // One wall-space composition. Panel layout only changes its visibility mask.
 // Fourth component is a stable lighting phase, never a panel owner.
 return [[2410,200,570,0],[3260,1216,810,1.9],[4024,270,515,4.1]].map(([x,y,r,phase])=>[
  x+18*Math.sin(time*.14+phase),y+14*Math.cos(time*.11+phase),r,phase
 ]);
}
export function glassTileRect(tile,logicalWidth){const scale=4096/logicalWidth;return tile.renderRect.map(v=>v*scale);}

export const GLASS_REACH=224;
export function glassTileVisible(tile,width,mode){
 // Only the delivered crop matters; the padded input may see a neighboring panel.
 const [x,y,w,h]=(tile.rect??tile.renderRect).map(v=>v*4096/width),m=GLASS_REACH;
 return glassPanels(mode).some(([px,py,pw,ph])=>x<px+pw+m&&x+w>px-m&&y<py+ph+m&&y+h>py-m);
}

export function glassRefractionLimit(width){return Math.min(46,48*4096/width);}
