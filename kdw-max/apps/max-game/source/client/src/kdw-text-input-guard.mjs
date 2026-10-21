import {moderateInput} from './kdw-text-input.mjs';
import {filterUserText} from './kdw-text-policy.mjs';

/** One input path for typing, paste, drop, undo, IME and the on-screen keyboard. */
export function createTextInputGuard(root,{selector,fieldAttribute,limits,onEdit,onRemoved}){
 const composing=new Set(),matches=e=>e?.matches?.(selector);
 function edit(input,{final=false,onlyChanged=false}={}){
  const before=input.value,result=moderateInput(input,{final,limit:limits[input.getAttribute(fieldAttribute)]});
  if(!onlyChanged||before!==result.value)onEdit(input,result);
  if(result.removed)onRemoved();return result;
 }
 const input=e=>{if(matches(e.target)&&!e.isComposing&&!composing.has(e.target))edit(e.target,{final:['insertFromPaste','insertFromDrop','insertReplacementText'].includes(e.inputType)});};
 const start=e=>{if(matches(e.target))composing.add(e.target);};
 const end=e=>{if(matches(e.target)){composing.delete(e.target);edit(e.target);}};
 const blur=e=>{if(matches(e.target)&&!composing.has(e.target))edit(e.target,{final:true,onlyChanged:true});};
 root.addEventListener('input',input);root.addEventListener('compositionstart',start);root.addEventListener('compositionend',end);root.addEventListener('focusout',blur);
 return {edit,pending(){return composing.size>0||[...root.querySelectorAll(selector)].some(e=>moderatePending(e));},finish(){if(composing.size)return false;root.querySelectorAll(selector).forEach(e=>edit(e,{final:true,onlyChanged:true}));return true;},reset(){composing.clear();},dispose(){composing.clear();root.removeEventListener('input',input);root.removeEventListener('compositionstart',start);root.removeEventListener('compositionend',end);root.removeEventListener('focusout',blur);}};
}

// Read-only: autosave must not rewrite a prefix while the user is still composing it.
const moderatePending=e=>filterUserText(e.value,{start:e.selectionStart??e.value.length,end:e.selectionEnd??e.value.length}).pending;
