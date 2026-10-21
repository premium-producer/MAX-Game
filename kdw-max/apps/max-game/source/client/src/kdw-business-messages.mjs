const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=(part,cls='')=>`<img class="bn-original ${cls}" data-bn-source="${part.assetId}" width="${part.box[2]}" height="${part.box[3]}" style="width:${part.box[2]}px;height:${part.box[3]}px" alt="" draggable="false">`;
const fixed=(part,cls='')=>`<div class="bn-flow-fixed ${cls}" style="width:${part.box[2]}px;height:${part.box[3]}px">${image(part)}</div>`;
export function businessMessagesMarkup(flow,values,action){
 const bubble=(key,incoming=false)=>`<div class="bn-message ${incoming?'bn-message-in':'bn-message-out'}" data-bn-message="${key}"><span class="bn-message-skin" data-bn-skin="${(incoming?flow.incomingSkin:flow.outgoingSkin).assetId}" aria-hidden="true"></span><div class="bn-message-copy"><span data-bn-binding="${key}">${esc(values[key])}</span></div>${image(incoming?flow.incomingMeta:flow.outgoingMeta,'bn-message-meta')}</div>`;
 return `<div class="bn-order-messages" aria-label="Переписка с бизнесом"><div class="bn-order-flow">${flow.previous.map(p=>fixed(p,'bn-flow-previous')).join('')}${bubble('orderQuestion')}${fixed(flow.status,'bn-flow-status')}${fixed(flow.action,'bn-flow-action')}${bubble('deliveryQuestion')}${bubble('deliveryAnswer',true)}<div class="bn-flow-choices">${flow.choices.map((part,i)=>`<button class="bn-flow-choice" type="button" data-bn-action="${esc(action)}" aria-label="${['С 10:00 до 16:00','С 16:00 до 22:00','Выбрать другой день'][i]}" style="width:${part.box[2]}px;height:${part.box[3]}px">${image(part)}</button>`).join('')}</div></div></div>`;
}
export function channelNameMarkup(flow,name,tail){
 return `<div class="bn-channel-feed"><div class="bn-channel-flow">${fixed(flow.prefix,'bn-channel-prefix')}<div class="bn-channel-name-row"><div class="bn-message bn-message-out bn-channel-name" data-bn-message="channelName" data-bn-max-width="300" data-bn-min-width="143" data-bn-base-bottom="12"><span class="bn-message-skin" data-bn-skin="${flow.skin.assetId}" aria-hidden="true"></span><div class="bn-message-copy"><span data-bn-binding="name">${esc(name)}</span></div>${image(flow.meta,'bn-message-meta')}</div></div><div class="bn-channel-tail" style="height:${flow.tail.box[3]}px">${image(flow.tail)}${tail}</div></div></div>`;
}
/** Normal text layout determines height. Reserve a metadata row only when the
 * last line cannot hold the original timestamp/ticks; never scale the glyphs. */
export function fitBusinessMessages(root){
 for(const bubble of root.querySelectorAll('[data-bn-message]')){
  const incoming=bubble.classList.contains('bn-message-in'),maxWidth=Number(bubble.dataset.bnMaxWidth)||(incoming?276:282),minWidth=Number(bubble.dataset.bnMinWidth)||80;
  bubble.style.width=maxWidth+'px';
  const copy=bubble.querySelector('.bn-message-copy'),span=copy.firstElementChild,meta=bubble.querySelector('.bn-message-meta');
  let scale=bubble.getBoundingClientRect().width/bubble.offsetWidth||1,lines=[...span.getClientRects()];
  if(lines.length===1){const padding=incoming?20:22,width=Math.min(maxWidth,Math.max(minWidth,Math.ceil(lines[0].width/scale+Number(meta.getAttribute('width'))+8+padding)));bubble.style.width=width+'px';}
  scale=bubble.getBoundingClientRect().width/bubble.offsetWidth||1;lines=[...span.getClientRects()];const last=lines.at(-1),room=copy.clientWidth;
  const reserve=!!last&&last.width/scale+Number(meta.getAttribute('width'))+8>room+.25;
  const base=Number(bubble.dataset.bnBaseBottom)||(incoming?8:11);
  bubble.style.paddingBottom=(base+(reserve?13:0))+'px';bubble.dataset.metaRow=String(reserve);bubble.dataset.lines=String(Math.round(copy.offsetHeight/parseFloat(getComputedStyle(copy).lineHeight)));
 }
 for(const stream of root.querySelectorAll('.bn-order-messages,.bn-channel-feed'))stream.scrollTop=stream.scrollHeight-stream.clientHeight;
}
export function messageFlowAssets(flow){const ids=[];const visit=v=>{if(!v||typeof v!=='object')return;if(v.assetId){ids.push(v.assetId);return;}for(const next of Object.values(v))visit(next);};visit(flow);return ids;}
