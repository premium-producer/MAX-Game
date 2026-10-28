import {mountTransitionAction} from './kdw-transition-action.mjs';
// Authored controls retain their handlers and revision guards. All visible
// transition controls use the same presenter as the WebGL activities.
const sources='.client-actions .kdw-transition-button,.pc-forward .kdw-transition-button,.bn-source-forward .kdw-transition-button';
export function createTransitionControls(document){
 const root=document.createElement('section');root.id='kdw-transition-controls';
 Object.assign(root.style,{position:'fixed',inset:'0',zIndex:'100',pointerEvents:'none',fontFamily:'Max Sans, sans-serif'});document.body.append(root);
 const entries=new Map();
 const eligible=source=>source.isConnected&&!source.closest('[hidden],[data-activity-ghost],[data-media-ghost]')&&getComputedStyle(source).visibility!=='hidden'&&source.getBoundingClientRect().width>0;
 function retire(source,entry){clearTimeout(entry.retry);entry.presentation.dispose({keepFeedback:true});source.style.opacity=entry.opacity;source.style.pointerEvents=entry.pointerEvents;if(entry.aria===null)source.removeAttribute('aria-hidden');else source.setAttribute('aria-hidden',entry.aria);if(entry.tabIndex===null)source.removeAttribute('tabindex');else source.setAttribute('tabindex',entry.tabIndex);delete source.dataset.transitionSource;entries.delete(source);}
 return {
  update(host){
   const current=new Set([...document.querySelectorAll(sources)].filter(eligible));
   for(const [source,entry]of entries)if(!current.has(source))retire(source,entry);
   for(const source of current){let entry=entries.get(source);
    if(!entry){const button=document.createElement('button');button.type='button';button.className='kdw-activity-button kdw-transition-button';button.dataset.transitionControl='';
     const presentation=mountTransitionAction(button,root,'kdw-transition-actions');
     entry={button,presentation,opacity:source.style.opacity,pointerEvents:source.style.pointerEvents,aria:source.getAttribute('aria-hidden'),tabIndex:source.getAttribute('tabindex'),signature:null,retry:null};entries.set(source,entry);
     source.dataset.transitionSource='true';source.style.opacity='0';source.style.pointerEvents='none';source.setAttribute('aria-hidden','true');source.tabIndex=-1;
     button.addEventListener('click',()=>{
      if(button.disabled||button.closest('[inert]')||!eligible(source)||source.disabled||source.closest('[inert]'))return;
      presentation.press();button.disabled=true;
      // Invoke the original action with its original token. Only the temporary
      // pointer flag is restored; hidden/inert/disabled and session guards stay.
      const previous=source.style.pointerEvents;source.style.pointerEvents=entry.pointerEvents;
      try{source.click();}finally{source.style.pointerEvents=previous;}
      entry.retry=setTimeout(()=>{if(entries.get(source)===entry&&eligible(source)&&!source.disabled&&!source.closest('[inert]'))presentation.retry();},500);
     });
    }
    const signature=[source.textContent,source.dataset.answer,source.dataset.pcAction,source.dataset.bnAction].join('|');
    if(signature!==entry.signature){clearTimeout(entry.retry);entry.signature=signature;entry.presentation.reset();entry.button.textContent=source.textContent;}
    const owner=source.closest('.journey-zone')??host,phone=owner?.querySelector('.route-phone');
    const alpha=Math.min(Number(owner?.dataset.contentPresence??1),Number(owner?.dataset.uiPresence??1),Number(phone?.dataset.pathPresence??1));
    const blocked=source.disabled||!!source.closest('[inert]')||alpha<.97;
    entry.button.disabled=blocked;entry.presentation.update(true,alpha,blocked);
   }
  },
  dispose(){for(const [source,entry]of entries)retire(source,entry);root.remove();},
 };
}
