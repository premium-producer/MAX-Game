import {contactRadius,circleIntersectsRect,pickCircleControl,missionHitRect} from './kdw-contact-area.mjs';
import {pressKeyboardKey} from './kdw-keyboard-ui.mjs';
// Native overlays live outside #circles. Focus fields and enter ordinary click handlers on
// touch-down/entry, just like the GPU buttons, without waiting for OSC /delete.
const roots='#kdw-transition-controls,#kdw-personal-channel,#kdw-business-native,#kdw-interactions,#kdw-posts,#kdw-webgl-store';
export function installNativeTouch({document,active=()=>true,now=()=>performance.now()}={}){
 let hand=null,suppressUntil=0,suppressId=null;
 function enter(e){
  if(!hand||e.pointerId!==hand.id||!active())return;
  const radius=contactRadius(e);
  const insidePrevious=hand.rect&&circleIntersectsRect(e.clientX,e.clientY,radius,hand.rect);
  const eligible=el=>el.closest(roots)&&!el.disabled&&!el.readOnly&&!el.closest('[hidden],[inert]')&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).pointerEvents!=='none';
  const el=document.querySelectorAll?pickCircleControl(document,roots.split(',').flatMap(r=>['button','input','textarea'].map(t=>r+' '+t)).join(','),e.clientX,e.clientY,radius,eligible,missionHitRect):document.elementFromPoint(e.clientX,e.clientY)?.closest('button,input,textarea');
  if(insidePrevious&&!(el&&hand.target?.isConnected&&el!==hand.target))return;
  hand.rect=null;
  if(!el||!el.closest(roots)||el.disabled||el.readOnly||el.closest('[hidden],[inert]'))return;
  const r=missionHitRect(el);if(!circleIntersectsRect(e.clientX,e.clientY,radius,r))return;
  const transition=el.classList?.contains('kdw-transition-button');
  if(transition&&hand.transitions.has(el))return;
  if(transition){hand.transitions.add(el);el.dataset.transitionContact='true';}
  hand.target=el;hand.rect={left:r.left,right:r.right,top:r.top,bottom:r.bottom};
  suppressId=e.pointerId;suppressUntil=now()+1000;
  e.preventDefault();e.stopImmediatePropagation();if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.focus({preventScroll:true});el.click();
 }
 const down=e=>{if(!e.isTrusted||e.pointerType!=='touch'||!active())return;suppressId=null;suppressUntil=0;hand={id:e.pointerId,rect:null,transitions:new Set()};enter(e);};
 const move=e=>{if(e.isTrusted&&e.pointerType==='touch'&&(e.buttons&1))enter(e);};
 const end=e=>{if(hand?.id!==e.pointerId)return;if(hand.rect){suppressId=e.pointerId;suppressUntil=now()+1000;}for(const el of hand.transitions)delete el.dataset.transitionContact;hand=null;};
 const click=e=>{if(e.isTrusted&&e.pointerType==='touch'&&e.pointerId===suppressId&&now()<=suppressUntil){e.preventDefault();e.stopImmediatePropagation();return;}pressKeyboardKey(e.target?.closest?.('[data-kdw-key],[data-pc-key]'));};
 const listeners={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,click};
 for(const [type,fn]of Object.entries(listeners))document.addEventListener(type,fn,{capture:true,passive:false});
 return()=>{for(const [type,fn]of Object.entries(listeners))document.removeEventListener(type,fn,true);if(hand)for(const el of hand.transitions)delete el.dataset.transitionContact;hand=null;};
}
