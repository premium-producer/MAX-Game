import {rightCardRect} from './kdw-activity-stage.mjs';
import {createPostTrails} from './kdw-post-trails.mjs';
import {createPresentationClock} from './application/presentation-clock.mjs';
import {storeTimeline,storeElapsed,storeGoal} from './kdw-store-rating.mjs';
export function createProductStream(root,markup){
 const clock=createPresentationClock(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let timeline=null,signature='',trails=null,canvas=null;
 function reset(){timeline=null;signature='';trails?.clear();trails=null;canvas=null;}
 return {
  accept(snapshot){clock.accept(snapshot);},
  sync(g,snapshot,editing){
   const field=root.querySelector('.kdw-product-stream');if(!field)return;
   if(!canvas?.isConnected){canvas=document.createElement('canvas');canvas.className='kdw-post-trails';field.prepend(canvas);trails=createPostTrails(canvas);}
   const activity=snapshot?.state.progress.business?.storeActivity;
   field.style.opacity=String(editing&&!storeGoal(activity)?g.alpha:0);field.inert=!editing||g.alpha<.97||!snapshot?.state.ownerActive||storeGoal(activity);
   if(!editing||!activity)return;
   const next=JSON.stringify(activity);if(next!==signature){signature=next;timeline=storeTimeline(activity);}
   const read=clock.read(true),elapsed=storeElapsed(activity,snapshot.state,read.time??snapshot.view.clock.serverTime);
   const rows=storeGoal(activity)?[]:timeline.at(elapsed),live=new Set(rows.map(s=>s.spawnId)),sources=[];
   for(const node of field.querySelectorAll('[data-product-spawn]'))if(!live.has(node.dataset.productSpawn))node.remove();
   for(const spawn of rows){
    let node=field.querySelector(`[data-product-spawn="${spawn.spawnId}"]`);
    if(!node){const template=document.createElement('template');template.innerHTML=markup(spawn.post);node=template.content.firstElementChild;node.dataset.productSpawn=spawn.spawnId;field.append(node);}
    const {x,y,w}=rightCardRect(g,spawn);
    if(!node.dataset.held)Object.assign(node.style,{left:x+'px',top:y+'px',width:'440px',transform:`scale(${w/440})`});
    node.disabled=field.inert||read.stale||node.dataset.pending==='true';sources.push({x,y,w});
   }
   trails.draw(sources,elapsed,g.scale,reduced.matches);
  },reset,clear:reset,
 };
}
