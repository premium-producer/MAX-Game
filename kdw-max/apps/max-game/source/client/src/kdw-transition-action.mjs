// Completion controls have their own stationary parent. Phone overlays may
// move/reflow after composition without dragging this control along with them.
const presentations=new WeakMap();
export function mountTransitionAction(button,root,className){
 const anchor=document.createElement('div');anchor.className=className;anchor.dataset.activityTransition='';
 Object.assign(anchor.style,{position:'fixed',left:'0px',top:'0px',width:'390px',transform:'none',pointerEvents:'auto'});
 root.append(anchor);anchor.append(button);
 let visible=false,leaving=false,inputBlocked=true,animation=null;const ghosts=new Set();
 function hide(){anchor.inert=true;visible=false;button.hidden=true;button.dataset.actionPlaced='false';button.style.opacity='0';animation?.cancel();animation=null;}
 function placed(){if(!visible||leaving||button.dataset.actionPlaced==='true')return;button.dataset.actionPlaced='true';anchor.inert=inputBlocked;button.style.opacity='1';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)animation=button.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
 }
 presentations.set(button,{placed});hide();
 return {
  update(show,alpha,inert){anchor.style.opacity=String(alpha);inputBlocked=inert;anchor.inert=inert||button.dataset.actionPlaced!=='true';if(!show||leaving){if(visible)hide();return;}if(!visible){visible=true;button.hidden=false;button.dataset.actionPlaced='false';button.style.opacity='0';}},
  press(){if(leaving)return;leaving=true;const r=button.getBoundingClientRect(),ghost=document.createElement('div'),copy=button.cloneNode(true);
   ghost.className=className;ghost.dataset.activityGhost='';ghost.dataset.actionFeedback='';ghost.inert=true;ghost.setAttribute('aria-hidden','true');
   Object.assign(ghost.style,{position:'fixed',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',transform:'none',pointerEvents:'none',zIndex:'110',fontFamily:'Max Sans, sans-serif'});
   copy.hidden=false;copy.disabled=true;copy.removeAttribute('id');copy.removeAttribute('data-activity-finish');copy.removeAttribute('data-transition-control');
   Object.assign(copy.style,{translate:'none',scale:'none',transform:'none',opacity:'1',width:'100%',height:'100%',minHeight:'0',maxHeight:'none',transition:'none'});
   ghost.append(copy);document.body.append(ghost);ghosts.add(ghost);hide();
   const effect=ghost.animate([{opacity:1,filter:'brightness(1.65)',boxShadow:'0 0 24px #62eaffaa'},{offset:.4,opacity:1,filter:'brightness(1.3)',boxShadow:'0 0 16px #62eaff55'},{opacity:0,filter:'brightness(1)',boxShadow:'0 0 0px #62eaff00'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?160:320,easing:'ease-out'});
   effect.finished.catch(()=>{}).finally(()=>{ghost.remove();ghosts.delete(ghost);});
  },
  retry(){leaving=false;},
  reset(){leaving=false;hide();},
  dispose({keepFeedback=false}={}){hide();if(!keepFeedback){for(const ghost of ghosts)ghost.remove();ghosts.clear();}presentations.delete(button);anchor.remove();},
 };
}
export function placeTransitionAction(button){presentations.get(button)?.placed();}
