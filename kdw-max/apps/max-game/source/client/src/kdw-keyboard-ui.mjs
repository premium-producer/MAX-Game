export const KEYBOARD_DISMISS_ICON='<svg class="kdw-keyboard-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const contents=new WeakMap();
const presses=new WeakMap();
export function pressKeyboardKey(button){
 if(!button||button.disabled||button.closest('[hidden],[inert]'))return;
 const previous=presses.get(button);clearTimeout(previous?.timer);previous?.animation?.cancel();
 button.dataset.keyboardPressed='true';
 const animation=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?null:button.animate?.([
  {transform:'translateY(0) scale(1)'},
  {transform:'translateY(3px) scale(.96)',offset:.2},
  {transform:'translateY(0) scale(1)'}
 ],{duration:240,easing:'ease-out'});
 if(animation)animation.id='kdw-key-press';
 const timer=setTimeout(()=>{animation?.cancel();delete button.dataset.keyboardPressed;presses.delete(button);},240);
 presses.set(button,{timer,animation});
}
const keyId=button=>JSON.stringify([button.hasAttribute('data-pc-key')?'pc':'kdw',button.getAttribute('data-pc-key')??button.getAttribute('data-kdw-key'),button.className]);
// Keep the animated shell alive through opening, typing and layout changes.
// Only the key contents change; visibility changes retarget the same transition.
export function updateKeyboardPanel(scene,markup,open){
 const panel=scene?.querySelector('.kdw-keyboard');if(!panel)return;
 const template=document.createElement('template');template.innerHTML=markup;
 const next=template.content.querySelector('.kdw-keyboard'),body=next.innerHTML;
 if(contents.get(panel)!==body){
  // A first capital letter, Shift or language change must not retire the very
  // button that is showing its press. Keep matching physical keys alive.
  const existing=new Map();
  for(const button of panel.querySelectorAll('[data-pc-key],[data-kdw-key]')){const id=keyId(button);if(!existing.has(id))existing.set(id,[]);existing.get(id).push(button);}
  for(const button of next.querySelectorAll('[data-pc-key],[data-kdw-key]')){
   const prior=existing.get(keyId(button))?.shift();if(!prior)continue;
   for(const attr of [...prior.attributes])if(attr.name!=='data-keyboard-pressed'&&!button.hasAttribute(attr.name))prior.removeAttribute(attr.name);
   for(const attr of button.attributes)prior.setAttribute(attr.name,attr.value);
   if(prior.innerHTML!==button.innerHTML)prior.innerHTML=button.innerHTML;
   button.replaceWith(prior);
  }
  panel.replaceChildren(...next.childNodes);contents.set(panel,body);
 }
 panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
 scene.dataset.keyboard=String(open);
}
