import {Box2,Vector2} from 'three';

export const TOUCH_MINIMUM=500;
const point=new Vector2(),box=new Box2();
export function touchBounds(rect,scale=1){
 const min=TOUCH_MINIMUM*Math.max(0,Number.isFinite(scale)?scale:0);
 const width=Math.max(rect.width,min),height=Math.max(rect.height,min);
 return {left:rect.left+(rect.width-width)/2,top:rect.top+(rect.height-height)/2,width,height};
}
export function touchContains(rect,x,y,scale=1){
 if(!rect||rect.width<=0||rect.height<=0||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const r=touchBounds(rect,scale);
 box.min.set(r.left,r.top);box.max.set(r.left+r.width,r.top+r.height);
 return box.containsPoint(point.set(x,y));
}
export function touchEligible(root,el){
 return el?.isConnected&&root.contains(el)&&!el.disabled&&!el.closest('[inert],[hidden]')&&el.getClientRects().length>0
  &&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).pointerEvents!=='none'
  &&Number(el.dataset.pathPresence??1)>.1&&Number(el.dataset.uiFade??1)>.1;
}
export function touchPick(root,target,x,y,scale=1){
 const direct=target?.closest?.('button');
 // Respect the browser's exact target, including a disabled control blocking one behind it.
 if(direct)return touchEligible(root,direct)?direct:null;
 // Native disabled controls may retarget an event to the parent. Keep their
 // actual footprint inert instead of selecting a nearby expanded action.
 for(const el of root.querySelectorAll('button')){
  if(!el.disabled||!el.hasAttribute('data-answer')||!el.isConnected||el.closest('[inert],[hidden]')||el.getClientRects().length===0||getComputedStyle(el).visibility==='hidden')continue;
  if(touchContains(el.getBoundingClientRect(),x,y,0))return null;
 }
 let selected=null,best=Infinity;
 for(const el of root.querySelectorAll('button')){
  if(!touchEligible(root,el)||el.hasAttribute('data-phone-drag'))continue;
  const tile=el.querySelector('.tile'),r=(tile||el).getBoundingClientRect();
  if(!touchContains(r,x,y,scale))continue;
  const distance=point.set(x,y).distanceToSquared(new Vector2(r.left+r.width/2,r.top+r.height/2));
  if(distance<best){selected=el;best=distance;}
 }
 return selected;
}
