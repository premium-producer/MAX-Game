import {v5Text,v5CopyMarkup} from './journey-v5-ui-copy.mjs';
// Descriptor projection only: every action is issued to the common backend.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sharedAssetUrl=asset=>asset?.path?`./${asset.path}`:null;
export function sharedTaskMarkup(snapshot,{token='',title='MAX',resultText='Задание выполнено.'}={}){
 const view=snapshot.view,asset=view.missing?null:view.device?.asset,kind=view.device?.kind??'phone';
 const attrs=action=>`data-answer="${esc(action.actionId)}" data-answer-token="${esc(token)}" data-screen-id="${esc(snapshot.state.screenId)}"`;
 const hotspots=(view.actions??[]).filter(a=>a.placement==='hotspot'&&asset).map(a=>{
  const [x,y,w,h]=Array.isArray(a.rect)?a.rect:[a.rect.x,a.rect.y,a.rect.width,a.rect.height];
  return `<button class="media-hotspot" ${attrs(a)} aria-label="${esc(v5Text(a.label))}" style="left:${x/asset.width*100}%;top:${y/asset.height*100}%;width:${w/asset.width*100}%;height:${h/asset.height*100}%"></button>`;
 }).join('');
 const annotations=(view.device?.annotations??[]).filter(()=>asset).map(a=>{const [x,y,w,h]=a.rect;return `<span style="position:absolute;left:${x/asset.width*100}%;top:${y/asset.height*100}%;width:${w/asset.width*100}%;height:${h/asset.height*100}%;background:#fff;color:#111;font-size:20px;text-align:center"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;color:#fff"><path d="M0 0H100V100H0Z"/></svg><span style="position:relative">${v5CopyMarkup(a.text)}</span></span>`;}).join('');
 const frame=asset?`<div class="task-media-frame"><div class="task-media-canvas" style="aspect-ratio:${asset.width}/${asset.height}"><img class="task-media-image" src="${esc(sharedAssetUrl(asset))}" alt="Учебный экран MAX" draggable="false" decoding="async">${annotations}${hotspots}</div></div>`:`<p class="media-missing" role="status">${esc(view.missing??'Контент не предоставлен')}</p>`;
 const actions=(view.actions??[]).filter(a=>a.placement!=='hotspot').map(a=>`<button class="pill app-option client-action" ${attrs(a)}>${v5CopyMarkup(a.label)}</button>`).join('');
 const body=String(snapshot.state.status==='result'?resultText:view.instruction?.text??'').trim();
 const chrome=kind==='pc'?'<div class="pc-chrome" aria-hidden="true"><span>MAX бизнес</span></div>':'';
 return `<section class="task-dialog context-popup client-task" role="dialog" aria-label="${esc(v5Text(title))}"><div class="instruction glass-control"${body?'':' hidden'}><div class="instruction-copy" data-task-content><span class="eyebrow">ВОЗМОЖНОСТИ MAX</span><h2>${v5CopyMarkup(title)}</h2><p>${v5CopyMarkup(body)}</p></div></div><div class="demo-app" data-device="${kind}">${chrome}<span class="phone-camera" aria-hidden="true"></span><div class="phone-content" data-task-content><div class="client-scene task-media">${frame}</div><div class="client-actions">${actions}</div></div><span class="phone-home" aria-hidden="true"></span></div></section>`;
}
const warmed=new Map();
export function warmSharedAssets(resources){
 return Promise.allSettled(resources.filter(a=>a?.path).map(a=>{
  const url=sharedAssetUrl(a);if(warmed.has(url))return warmed.get(url);
  const image=new Image();image.src=url;const ready=image.decode();warmed.set(url,ready);ready.catch(()=>warmed.delete(url));return ready;
 }));
}
