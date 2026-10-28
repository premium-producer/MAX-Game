import {hit,inside} from './activity-model.mjs';
import {reportActivityContact} from './activity-runtime.mjs';
// Own only GPU activity hits. Native fields, keyboard and operator UI keep their route.
export function installActivityInput({getFrame,select,scroll,react}){
 const hands=new Map();let suppressUntil=0,drag=null;
 // The phone's invisible geometry is itself a role=dialog and may sit behind
 // GPU cards. Only real controls and operator dialogs pre-empt activity hits.
 const blocked=target=>target?.closest?.('button,input,textarea,[role="dialog"]:not(.task-dialog),[data-pixel-map-calibration]');
 function enter(e){const frame=getFrame();if(!frame?.interactive||blocked(e.target))return false;const card=hit({x:e.clientX,y:e.clientY},frame.hits);if(!card)return false;
  let hand=hands.get(e.pointerId);if(!hand){hand={generation:frame.key,seen:new Set()};hands.set(e.pointerId,hand);}if(hand.generation!==frame.key)return false;
  // Consume only the game target; the production inactivity clock still sees
  // the original trusted contact after pixel-map/calibration filtering.
  reportActivityContact(e);
  if(hand.seen.has(card.id))return true;hand.seen.add(card.id);suppressUntil=performance.now()+1000;
  if(card.action==='reaction')react(card);else if(card.action==='card')select(card.id);return true;
 }
 const down=e=>{hands.delete(e.pointerId);const initial=getFrame();if(initial?.interactive&&!blocked(e.target))hands.set(e.pointerId,{generation:initial.key,seen:new Set()});if(enter(e)){e.preventDefault();e.stopImmediatePropagation();return;}const f=getFrame();if(f?.interactive&&!blocked(e.target)&&inside({x:e.clientX,y:e.clientY},f.scrollClip))drag={id:e.pointerId,y:e.clientY};};
 const move=e=>{if(drag?.id===e.pointerId){scroll(drag.y-e.clientY);drag.y=e.clientY;e.preventDefault();return;}if(hands.has(e.pointerId)&&enter(e)){e.preventDefault();e.stopImmediatePropagation();}};
 const end=e=>{hands.delete(e.pointerId);if(drag?.id===e.pointerId)drag=null;};
 const click=e=>{if(performance.now()<suppressUntil&&!blocked(e.target)){e.preventDefault();e.stopImmediatePropagation();}};
 const wheel=e=>{const f=getFrame();if(f?.interactive&&!blocked(e.target)&&inside({x:e.clientX,y:e.clientY},f.scrollClip)){scroll(e.deltaY);e.preventDefault();e.stopImmediatePropagation();}};
 const handlers={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,click,wheel};for(const [name,fn]of Object.entries(handlers))document.addEventListener(name,fn,{capture:true,passive:false});
 const clear=()=>{hands.clear();drag=null;suppressUntil=0;};
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 return()=>{for(const [name,fn]of Object.entries(handlers))document.removeEventListener(name,fn,true);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);clear();};
}
