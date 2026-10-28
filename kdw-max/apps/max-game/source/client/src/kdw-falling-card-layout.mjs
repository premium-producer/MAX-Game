import {FREE_FLOW} from './kdw-post-stream.mjs';
export const FALLING_CARD_DEFAULTS=Object.freeze({scale:2.2,spawnRight:0});
const bounded=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
// Scale cards independently of the phone. Widening the field never resizes them.
// spawnRight is an extra distance in pixels on the 3072-wide production canvas.
export function fallingCardGeometry(g){
 const area=g.playArea,flow=g.flowArea,viewportScale=g.viewportScale??1;
 const physicalRight=g.displayRight??area.right;
 const factor=bounded(g.cardScale,.5,3,FALLING_CARD_DEFAULTS.scale),extra=bounded(g.spawnRight,0,1600,FALLING_CARD_DEFAULTS.spawnRight)*viewportScale;
 const left=Math.min(area.right-20*viewportScale,g.rect.right+64*g.scale);
 const available=Math.max(1,area.right-20*viewportScale-left);
 const base=Math.max(1,Math.min(440*g.scale,available*.43,area.height*FREE_FLOW.maxHeight/FREE_FLOW.envelope*440));
 const width=Math.min(base*factor,Math.max(1,physicalRight-left));
 const right=Math.min(physicalRight,Math.max(left+width,left+Math.min(available,base*2.1)+extra));
 const entry=width*FREE_FLOW.envelope/440;
 return{left,right,width,entry,path:flow.height+entry+64*g.scale};
}
