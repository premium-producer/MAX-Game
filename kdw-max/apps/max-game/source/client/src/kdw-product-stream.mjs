import {guardImage,fallbackImageSource} from './kdw-graceful-media.mjs';
import {createRightCardLayout} from './kdw-activity-stage.mjs';
import {createPostTrails} from './kdw-post-trails.mjs';
import {createPresentationClock} from './kdw-card-clock.mjs';
import {storeTimeline,storeElapsed,storeGoal} from './kdw-store-rating.mjs';
import {createFlowEntry} from './kdw-flow-entry.mjs';
import {createCardPop} from './kdw-card-pop.mjs';
export function createProductStream(root,markup){
 const clock=createPresentationClock({smooth:true}),reduced=matchMedia('(prefers-reduced-motion: reduce)'),placement=createRightCardLayout(),entry=createFlowEntry();
 const completionPop=createCardPop();
 let timeline=null,signature='',trails=null,canvas=null,fieldNode=null;const nodes=new Map();
 function reset(){completionPop.clear();timeline=null;signature='';trails?.clear();trails=null;canvas=null;placement.clear();entry.clear();nodes.clear();fieldNode=null;}
 return {
  accept(snapshot){clock.accept(snapshot);},
  sync(g,snapshot,editing,interactive=editing){
   const field=root.querySelector('.kdw-product-stream');if(!field)return;
   if(fieldNode!==field){fieldNode=field;nodes.clear();placement.clear();entry.clear();}
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
   for(const [id,node]of nodes)if(!live.has(id)){node.remove();nodes.delete(id);}
   for(const spawn of rows){
    let node=nodes.get(spawn.spawnId);
    if(!node){const template=document.createElement('template');template.innerHTML=markup(spawn.post);node=template.content.firstElementChild;node.dataset.productSpawn=spawn.spawnId;Object.assign(node.style,{left:'0px',top:'0px',width:'440px',willChange:'transform'});field.append(node);nodes.set(spawn.spawnId,node);for(const image of node.querySelectorAll('img'))guardImage(image,{fallback:fallbackImageSource({width:440,height:300})});}
    node.dataset.flow=spawn.flow??'';node.dataset.column=String(spawn.column);
   }
   const rects=placement.layout(g,rows,(spawn,w,unit)=>{
    return nodes.get(spawn.spawnId).offsetHeight*unit;
   });
   const admitted=entry.update(rows,s=>rects.get(s.spawnId),interactive&&g.alpha>.97&&!g.phone.inert&&snapshot.state.ownerActive&&!read.stale);
   for(const spawn of rows){
    const node=nodes.get(spawn.spawnId),{x,y,w}=rects.get(spawn.spawnId);
    node.style.transform=`translate3d(${x}px,${y}px,0) scale(${w/440})`;
    const visible=admitted.has(spawn.spawnId),state=visible?'admitted':'waiting';
    if(node.dataset.flowEntry!==state){node.dataset.flowEntry=state;node.style.visibility=visible?'':'hidden';}
    const disabled=!visible||field.inert||read.stale||node.dataset.pending==='true';if(node.disabled!==disabled)node.disabled=disabled;if(visible)sources.push({x,y,w});
   }
   trails.draw(sources,elapsed,g.scale,reduced.matches);
  },reset,clear:reset,
 };
}
