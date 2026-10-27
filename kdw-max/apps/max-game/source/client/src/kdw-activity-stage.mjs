import {LANE_FLOW,FREE_FLOW} from './kdw-post-stream.mjs';
import {createFlightPlacement} from './kdw-flight-placement.mjs';
import {pixelActivityViewport,pixelFlowViewport} from './kdw-pixel-map.mjs';
// Both activities use the live device rectangle and the same right-hand field.
// Never recenter the route or introduce another scene projection.
export function activityGeometry(){
 const phone=document.querySelector('.route-phone'),canvas=phone?.querySelector('.task-media-canvas'),arena=document.querySelector('#arena');
 if(!canvas||!arena)return null;
 const rect=canvas.getBoundingClientRect(),a=arena.getBoundingClientRect(),scale=a.width/parseFloat(arena.style.width);
 if(!(rect.width>0&&scale>0))return null;
 const host=phone.closest('.journey-zone');
 const area=pixelActivityViewport(),flowArea=area?pixelFlowViewport(innerWidth,innerHeight):null;
 for(const field of document.querySelectorAll('.kdw-post-cards,.kdw-product-stream'))field.style.clipPath=flowArea?`inset(${flowArea.top}px ${innerWidth-flowArea.right}px ${innerHeight-flowArea.bottom}px ${flowArea.left}px)`:'none';
 return {phone,rect,scale,playArea:area,flowArea,layoutRevision:host?.dataset.compositionRevision??'',alpha:Math.max(0,Math.min(1,Number(phone.dataset.pathPresence??0),Number(host?.dataset.contentPresence??1),Number(host?.dataset.uiPresence??1))),
  matched:phone.dataset.mediaReadyKey===phone.dataset.sceneVersion};
}
export function rightCardRect(g,spawn){
 const area=g.playArea??{left:0,top:0,right:innerWidth,bottom:innerHeight,height:innerHeight};
 const flow=g.flowArea??area;
 const gap=32*g.scale,edge=64*g.scale,available=Math.max(2,area.right-g.rect.right-edge-16);
 const slot=Math.max(1,Math.min(440*g.scale,(available-gap)/2,
  spawn.flow==='lanes'?area.height*LANE_FLOW.maxHeight/LANE_FLOW.envelope*440:Infinity)),w=slot*(spawn.size??1);
 const x=g.rect.right+edge+(spawn.column%2)*(slot+gap)+(slot-w)*(spawn.offset??0);
 const entry=spawn.flow==='lanes'?LANE_FLOW.envelope*slot/440:600*g.scale,
  y=flow.top-entry+(flow.height+entry+64*g.scale)*Math.max(0,spawn.progress);
 return {x,y,w,unit:w/440};
}
export function createRightCardLayout(){
 const planner=createFlightPlacement(),heights=new Map();let geometryKey='',geometry=null;
 const height=(s,w,unit,measure)=>{const key=w.toFixed(3)+':'+(s.post?.id??''),cached=heights.get(s.spawnId);if(cached?.key===key)return cached.h;const h=measure(s,w,unit);heights.set(s.spawnId,{key,h});return h;};
 return {
  clear(){planner.clear();heights.clear();geometryKey='';geometry=null;},
  layout(g,rows,measure){
   if(!rows.length){planner.clear();heights.clear();return new Map();}
   if(rows[0].flow!=='free')return new Map(rows.map(s=>{const r=rightCardRect(g,s);return[s.spawnId,{...r,h:height(s,r.w,r.unit,measure)}];}));
   const area=g.playArea??{left:0,top:0,right:innerWidth,bottom:innerHeight,height:innerHeight};
   const flow=g.flowArea??area;
   // The phone floats a few pixels by design. Its drift must never resize text,
   // rerun collision search, or change a card's established flight geometry.
   const key=JSON.stringify([area.left,area.right,area.height,flow.top,flow.bottom,Math.round(g.rect.width*4),g.layoutRevision]);
   if(key!==geometryKey){geometryKey=key;const left=Math.min(area.right-20,g.rect.right+64*g.scale),available=Math.max(1,area.right-20-left),width=Math.max(1,Math.min(440*g.scale,available*.43,area.height*FREE_FLOW.maxHeight/FREE_FLOW.envelope*440));geometry={left,right:left+Math.min(available,width*2.1),width,entry:width*FREE_FLOW.envelope/440,path:flow.height+width*FREE_FLOW.envelope/440+64*g.scale};}
   const {left,right,width,entry,path}=geometry;
   // One compact continuous field beside the phone, not the whole remaining
   // viewport. Keep card sizing independent of the new horizontal boundary.
   const ids=new Set(rows.map(r=>r.spawnId));for(const id of heights.keys())if(!ids.has(id))heights.delete(id);
   const cards=rows.map(s=>{
    const w=width*s.size,unit=w/440,h=height(s,w,unit,measure);
    return {id:s.spawnId,w,h,unit,entry,y:flow.top-entry+path*s.progress,v:path/s.travel,offset:s.offset};
   });
   return planner.layout(cards,{left,right,height:flow.bottom});
  },
 };
}
const activityEntries=new WeakMap();
export function alignActivityActions(node,g,alpha,inert){
 const scale=g.rect.width/390;
 Object.assign(node.style,{left:g.rect.left+'px',top:(g.rect.bottom+32*scale)+'px',width:'390px',transform:`scale(${scale})`,opacity:String(alpha)});
 node.inert=inert;
}
export function alignActivityPhone(node,g,{sharedPresence=false}={}){
 const now=performance.now();
 if(!activityEntries.has(node))activityEntries.set(node,now);
 const progress=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,Math.max(0,(now-activityEntries.get(node))/360));
 const alpha=sharedPresence?g.alpha:Math.min(g.alpha,progress*progress*(3-2*progress));
 const scale=g.rect.width/390;
 Object.assign(node.style,{left:g.rect.left+'px',top:g.rect.top+'px',height:g.rect.height/scale+'px',transform:`scale(${scale})`,opacity:String(alpha)});
 node.dataset.activityAligned='true';
 node.inert=alpha<.97||g.phone.inert;
 return alpha;
}
// Keep the outgoing visual briefly, but revoke all input immediately.
export function fadeActivityOut(root){
 if(root.hidden||!root.childElementCount||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const ghost=root.cloneNode(true);ghost.removeAttribute('id');ghost.dataset.activityGhost='true';ghost.inert=true;ghost.setAttribute('aria-hidden','true');
 Object.assign(ghost.style,{position:'fixed',inset:'0',zIndex:'102',overflow:'hidden',pointerEvents:'none',color:'#fff',fontFamily:"'Max Sans',sans-serif"});
 for(const node of ghost.querySelectorAll('[id]'))node.removeAttribute('id');
 document.body.append(ghost);
 const animation=ghost.animate([{opacity:1},{opacity:0}],{duration:280,easing:'ease-out',fill:'forwards'});
 animation.finished.catch(()=>{}).finally(()=>ghost.remove());
}
