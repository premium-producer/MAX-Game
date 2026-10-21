export const KEYBOARD_DISMISS_ICON='<svg class="kdw-keyboard-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const contents=new WeakMap();
// Keep the animated shell alive through opening, typing and layout changes.
// Only the key contents change; visibility changes retarget the same transition.
export function updateKeyboardPanel(scene,markup,open){
 const panel=scene?.querySelector('.kdw-keyboard');if(!panel)return;
 const template=document.createElement('template');template.innerHTML=markup;
 const next=template.content.querySelector('.kdw-keyboard'),body=next.innerHTML;
 if(contents.get(panel)!==body){panel.replaceChildren(...next.childNodes);contents.set(panel,body);}
 panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
 scene.dataset.keyboard=String(open);
}
