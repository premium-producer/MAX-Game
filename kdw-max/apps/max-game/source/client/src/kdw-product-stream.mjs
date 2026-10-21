import {createRightCardLayout} from './kdw-activity-stage.mjs';
import {createPostTrails} from './kdw-post-trails.mjs';
import {createPresentationClock} from './application/presentation-clock.mjs';
import {storeTimeline,storeElapsed,storeGoal} from './kdw-store-rating.mjs';
import {createFlowEntry} from './kdw-flow-entry.mjs';
import {createCardPop} from './kdw-card-pop.mjs';
export function createProductStream(root,markup){
 const clock=createPresentationClock(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),placement=createRightCardLayout(),entry=createFlowEntry();
 const completionPop=createCardPop();
 let timeline=null,signature='',trails=null,canvas=null;
 function reset(){completionPop.clear();timeline=null;signature='';trails?.clear();trails=null;canvas=null;placement.clear();entry.clear();}
 return {
  accept(snapshot){clock.accept(snapshot);},
  sync(g,snapshot,editing,interactive=editing){
   const field=root.querySelector('.kdw-product-stream');if(!field)return;
   if(!canvas?.isConnected){canvas=document.createElement('canvas');canvas.className='kdw-post-trails';field.prepend(canvas);trails=createPostTrails(canvas);}
   const activity=snapshot?.state.progress.business?.storeActivity;
   field.style.opacity=String(editing?g.alpha:0);field.inert=!interactive||!editing||g.alpha<.97||!snapshot?.state.ownerActive||storeGoal(activity);
   if(editing&&storeGoal(activity)){
    const selected=new Set(activity.published.map(row=>row.spawnId));
    const remaining=[];
    for(const node of field.querySelectorAll('[data-product-spawn]')){
     if(selected.has(node.dataset.productSpawn))node.remove();else remaining.push(node);
    }
    completionPop.start(remaining);trails?.clear();return;
   }
   if(!editing||!activity||storeGoal(activity))return;
   const next=JSON.stringify(activity);if(next!==signature){signature=next;timeline=storeTimeline(activity);}
   const read=clock.read(true),elapsed=storeElapsed(activity,snapshot.state,read.time??snapshot.view.clock.serverTime);
   const rows=storeGoal(activity)?[]:timeline.at(elapsed),live=new Set(rows.map(s=>s.spawnId)),sources=[];
   for(const node of field.querySelectorAll('[data-product-spawn]'))if(!live.has(node.dataset.productSpawn))node.remove();
   for(const spawn of rows){
    let node=field.querySelector(`[data-product-spawn="${spawn.spawnId}"]`);
    if(!node){const template=document.createElement('template');template.innerHTML=markup(spawn.post);node=template.content.firstElementChild;node.dataset.productSpawn=spawn.spawnId;field.append(node);}
    node.dataset.flow=spawn.flow??'';node.dataset.column=String(spawn.column);
   }
   const rects=placement.layout(g,rows,(spawn,w,unit)=>{
    const node=field.querySelector(`[data-product-spawn="${spawn.spawnId}"]`);
    node.style.width='440px';return node.offsetHeight*unit;
   });
   const admitted=entry.update(rows,s=>{const r=rects.get(s.spawnId),node=field.querySelector(`[data-product-spawn="${s.spawnId}"]`);return {...r,h:node.offsetHeight*r.w/440};},interactive&&g.alpha>.97&&!g.phone.inert&&snapshot.state.ownerActive&&!read.stale);
   for(const spawn of rows){
    const node=field.querySelector(`[data-product-spawn="${spawn.spawnId}"]`),{x,y,w}=rects.get(spawn.spawnId);
    Object.assign(node.style,{left:x+'px',top:y+'px',width:'440px',transform:`scale(${w/440})`});
    const visible=admitted.has(spawn.spawnId),state=visible?'admitted':'waiting';
    if(node.dataset.flowEntry!==state){node.dataset.flowEntry=state;node.style.visibility=visible?'':'hidden';}
    node.disabled=!visible||field.inert||read.stale||node.dataset.pending==='true';if(visible)sources.push({x,y,w});
   }
   trails.draw(sources,elapsed,g.scale,reduced.matches);
  },reset,clear:reset,
 };
}
