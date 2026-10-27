// Only the sandboxed desktop preload can supply this capability. URL parameters
// alone cannot enable an offscreen owner or acknowledge a visible output.
export const standOutput=globalThis.kdwStandOutput??null;
export const outputHidden=()=>standOutput?!(standOutput.presenting?.()??true):document.hidden;
export function remoteBackground(canvas){
 canvas.hidden=true;
 document.documentElement.dataset.spoutContent='true';
 const style=document.createElement('style');
 style.textContent='html[data-spout-content],html[data-spout-content] body,html[data-spout-content] #arena,html[data-spout-content] #world{background:transparent!important}html[data-spout-content] body::before,html[data-spout-content] body::after{display:none!important}';
 document.head.append(style);
 return {tick:(delta,options)=>standOutput.tick(delta,options),pause:()=>{},scanPulse:()=>{},dispose:()=>style.remove()};
}
