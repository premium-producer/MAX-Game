export const clampPosition=(x,y)=>({x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))});
// C1-continuous resistance: full travel in the middle, progressively less near
// the boundary. Inverting the starting pose avoids a jump when re-grabbing it.
export function resistedAxis(start,delta,band=.14){
 const p=Math.max(0,Math.min(1,start));if(!delta)return p;
 const b=Math.max(.001,Math.min(.45,band));
 const raw=p<b?2*Math.sqrt(b*p)-b:p>1-b?1+b-2*Math.sqrt(b*(1-p)):p;
 const v=raw+delta;
 return v<b?Math.max(0,v+b)**2/(4*b):v>1-b?1-Math.max(0,1+b-v)**2/(4*b):v;
}
export function dragPosition(start,dx,dy,width,height){
 return clampPosition(start.x+dx/Math.max(1,width),start.y+dy/Math.max(1,height));
}

export function installJourneyDrag({root,enabled,onCommit,onPreview}){
 const gestures=new Map(),suppressed=new WeakSet();
 function paint(g,p){g.el.style.setProperty('--x',p.x);g.el.style.setProperty('--y',p.y);onPreview(g.zone,g.step,p);}
 function end(e,cancelled=false){
  const g=gestures.get(e.pointerId);if(!g)return;gestures.delete(e.pointerId);
  if(g.el.hasPointerCapture?.(e.pointerId))g.el.releasePointerCapture(e.pointerId);
  delete g.el.dataset.dragging;
  if(g.drag){suppressed.add(g.el);e.stopImmediatePropagation?.();if(cancelled)paint(g,g.start);else onCommit(g.zone,g.step,g.current);}
 }
 const down=e=>{
  const el=e.target.closest('[data-object]');if(!el||!enabled(el)||e.button!==0||[...gestures.values()].some(g=>g.el===el))return;
  const zone=Number(el.closest('[data-zone]').dataset.zone),r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();
  // Pointer travel uses layout dimensions, not the lifted/hover-scaled visual bounds.
  const scale=el.parentElement.clientWidth?p.width/el.parentElement.clientWidth:1;
  gestures.set(e.pointerId,{el,zone,step:el.dataset.object,x:e.clientX,y:e.clientY,start:{x:Number(el.style.getPropertyValue('--x')),y:Number(el.style.getPropertyValue('--y'))},width:p.width-(el.offsetWidth?el.offsetWidth*scale:r.width),height:p.height-(el.offsetHeight?el.offsetHeight*scale:r.height),drag:false});
  el.setPointerCapture(e.pointerId);
 };
 const move=e=>{const g=gestures.get(e.pointerId);if(!g)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.drag&&Math.hypot(dx,dy)<7)return;g.drag=true;g.el.dataset.dragging='true';g.current=dragPosition(g.start,dx,dy,g.width,g.height);paint(g,g.current);e.preventDefault();e.stopImmediatePropagation();
 };
 const up=e=>end(e),cancel=e=>end(e,true);
 const click=e=>{const el=e.target.closest('[data-object]');if(el&&suppressed.has(el)&&e.detail!==0){suppressed.delete(el);e.stopImmediatePropagation();e.preventDefault();}};
 const key=e=>{const el=e.target.closest('[data-object]'),delta={ArrowLeft:[-.035,0],ArrowRight:[.035,0],ArrowUp:[0,-.06],ArrowDown:[0,.06]}[e.key];if(!el||!delta||!enabled(el))return;
  const zone=Number(el.closest('[data-zone]').dataset.zone),step=el.dataset.object;
  e.preventDefault();onCommit(zone,step,dragPosition({x:Number(el.style.getPropertyValue('--x')),y:Number(el.style.getPropertyValue('--y'))},delta[0],delta[1],1,1));
  root.querySelector(`[data-zone="${zone}"] [data-object="${step}"]`)?.focus({preventScroll:true});
 };
 for(const [event,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['click',click],['keydown',key]])root.addEventListener(event,fn,true);
 return {cancel(){for(const id of [...gestures.keys()])end({pointerId:id},true);}};
}
