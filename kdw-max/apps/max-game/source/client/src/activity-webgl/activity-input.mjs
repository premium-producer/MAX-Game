import {contactRadius} from '../kdw-contact-area.mjs';
import {hit,inside} from './activity-model.mjs';
import {reportActivityContact} from './activity-runtime.mjs';
// Own only GPU activity hits. Native fields, keyboard and operator UI keep their route.
export function installActivityInput({getFrame,select,scroll,react,manualScroll=true}){
 const hands=new Map();let suppressUntil=0,drag=null;
 const counts={};let last=null;
 const record=(reason,e,card=null)=>{counts[reason]=(counts[reason]??0)+1;last={reason,x:Math.round(e.clientX),y:Math.round(e.clientY),card,at:Date.now()};};
 // Chromium implicitly captures touch to its initial DOM target. Resolve what
 // is under the hand now, so a former button cannot block the rest of a touch.
 const targetAt=e=>document.elementFromPoint?.(e.clientX,e.clientY)??e.target;
 // The phone's invisible geometry is itself a role=dialog and may sit behind
 // GPU cards. Only real controls and operator dialogs pre-empt activity hits.
 const blocked=target=>target?.closest?.('button,input,textarea,[role="dialog"]:not(.task-dialog),[data-pixel-map-calibration]');
 function enter(e){const frame=getFrame();if(!frame?.interactive){record('frame-inactive',e);return false;}if(blocked(targetAt(e))){record('native-control',e);return false;}const card=hit({x:e.clientX,y:e.clientY,radius:contactRadius(e)},frame.hits);if(!card){record('miss',e);return false;}
  let hand=hands.get(e.pointerId);if(!hand||hand.generation!==frame.key){hand={generation:frame.key,seen:new Set()};hands.set(e.pointerId,hand);}
  // Consume only the game target; the production inactivity clock still sees
  // the original trusted contact after pixel-map/calibration filtering.
  reportActivityContact(e);
  if(hand.seen.has(card.id)){record('already-selected',e,card.id);return true;}
  // Admission can be temporarily busy while a prior product is being saved.
  // Consume this hit, but remember it only after the controller accepts it.
  const action=card.action;
  if(action==='card'&&select(card.id)===false){record('controller-refused',e,card.id);return true;}
  record(action==='card'?'accepted':action==='reaction'?'reaction':'occluded',e,card.id);
  if(action==='reaction')react(card);
  hand.seen.add(card.id);suppressUntil=performance.now()+1000;return true;
 }
 const down=e=>{hands.delete(e.pointerId);const initial=getFrame();if(initial?.interactive&&!blocked(targetAt(e)))hands.set(e.pointerId,{generation:initial.key,seen:new Set()});if(enter(e)){e.preventDefault();e.stopImmediatePropagation();return;}const f=getFrame();if(manualScroll&&f?.interactive&&!blocked(targetAt(e))&&inside({x:e.clientX,y:e.clientY},f.scrollClip))drag={id:e.pointerId,y:e.clientY,key:f.key};};
 const move=e=>{
  if(!(e.buttons&1))return;
  if(drag?.id===e.pointerId){const f=getFrame();if(f?.interactive&&drag.key===f.key&&!blocked(targetAt(e))&&inside({x:e.clientX,y:e.clientY},f.scrollClip)){scroll(drag.y-e.clientY);drag.y=e.clientY;record('scroll',e);e.preventDefault();return;}drag=null;}
  // A contact may already be down when this activity becomes ready.
  if(enter(e)){e.preventDefault();e.stopImmediatePropagation();}
 };
 const end=e=>{hands.delete(e.pointerId);if(drag?.id===e.pointerId)drag=null;};
 const click=e=>{if(performance.now()<suppressUntil&&!blocked(targetAt(e))){e.preventDefault();e.stopImmediatePropagation();}};
 const wheel=e=>{const f=getFrame();if(manualScroll&&f?.interactive&&!blocked(targetAt(e))&&inside({x:e.clientX,y:e.clientY},f.scrollClip)){scroll(e.deltaY);e.preventDefault();e.stopImmediatePropagation();}};
 const handlers={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,click,wheel};for(const [name,fn]of Object.entries(handlers))document.addEventListener(name,fn,{capture:true,passive:false});
 const clear=()=>{hands.clear();drag=null;suppressUntil=0;};
 window.addEventListener('max-service-pointer-cancel',clear);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 const stop=()=>{for(const [name,fn]of Object.entries(handlers))document.removeEventListener(name,fn,true);window.removeEventListener('max-service-pointer-cancel',clear);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);clear();};
 stop.snapshot=()=>({counts:{...counts},last,dragging:!!drag,contacts:hands.size});return stop;
}
