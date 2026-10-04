const cache=new Map();
const source=asset=>new URL(`../${asset.path}`,import.meta.url).href;
function imageFor(asset){
 if(!asset)return Promise.resolve(null);const url=source(asset);if(cache.has(url))return cache.get(url);
 const pending=new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>img.decode().then(()=>resolve(img),reject);img.onerror=()=>reject(new Error('Asset unavailable'));img.src=url;});cache.set(url,pending);pending.catch(()=>cache.delete(url));return pending;
}
export const warmDescriptor=view=>Promise.allSettled([view.missing?null:view.device?.asset,...(view.prepareNext??[])].filter(Boolean).map(imageFor));
export function warmAssets(assets){return Promise.allSettled(assets.filter(Boolean).map(imageFor));}
export class DescriptorView{
 constructor(device,aside,descriptor,{screenId,onAction,onNotice,reduced}){
  this.device=device;this.aside=aside;this.onAction=onAction;this.onNotice=onNotice;this.reduced=reduced;this.live=true;this.serial=0;this.wait=0;this.busy=false;this.elapsed=0;
  device.innerHTML='<div class="channel-screen review-screen"><div class="channel-images"></div><div class="channel-targets"></div><div class="channel-load" hidden role="status"></div></div><div class="channel-action"></div>';
  this.screenElement=device.querySelector('.review-screen');this.images=device.querySelector('.channel-images');this.targets=device.querySelector('.channel-targets');this.loading=device.querySelector('.channel-load');this.action=device.querySelector('.channel-action');this.update(descriptor,screenId);
 }
 dispose(){this.live=false;this.serial++;}
 valid(serial){return this.live&&this.device.isConnected&&serial===this.serial;}
 async update(descriptor,screenId){
  if(this.screenId===screenId&&this.descriptor){this.descriptor=descriptor;return;}
  // Coalesce unsolicited backend changes while a decoded frame is entering.
  // The current blend keeps its pose; only the latest queued descriptor follows.
  if(this.pending||this.loadingImage){this.queued={descriptor,screenId};return;}
  const serial=++this.serial;this.screenId=screenId;this.descriptor=descriptor;this.busy=true;this.wait=0;this.error=false;this.action.inert=true;this.targets.inert=true;this.loading.hidden=true;this.pending=null;
  this.loadingImage=true;
  this.screenElement.classList.toggle('pc',descriptor.device?.kind==='pc');warmDescriptor(descriptor);
  try{const img=await imageFor(descriptor.missing?null:descriptor.device?.asset);if(!this.valid(serial))return;const frame=document.createElement('div');const incoming=!!this.images.children.length;frame.className=`channel-frame${incoming?' incoming':''}`;frame.style.opacity=incoming?'0':'1';
   if(img&&!descriptor.missing){const displayed=img.cloneNode(false);displayed.alt='Учебный интерфейс MAX';displayed.draggable=false;frame.append(displayed);}else{const gap=document.createElement('div');gap.className='review-gap';gap.textContent=descriptor.missing??'Клиентский экран пока не предоставлен';frame.append(gap);}
   for(const annotation of descriptor.device?.annotations??[]){const text=document.createElement('div');text.className='channel-header-fix';text.textContent=annotation.text;frame.append(text);}
   this.images.append(frame);this.loadingImage=false;this.loading.hidden=true;if(incoming){this.pending={serial,descriptor};this.elapsed=0;}else this.commit(descriptor);
  }catch(error){if(this.valid(serial)){this.loadingImage=false;if(this.queued){const queued=this.queued;this.queued=null;this.update(queued.descriptor,queued.screenId);return;}this.fail(descriptor,screenId);}}
 }
 fail(descriptor,screenId){this.error=true;this.loading.hidden=false;this.loading.replaceChildren();const note=document.createElement('p');note.textContent='Экран не загрузился';const retry=document.createElement('button');retry.className='primary';retry.textContent='Повторить';retry.onclick=()=>{if(descriptor.device?.asset)cache.delete(source(descriptor.device.asset));this.screenId=null;this.update(descriptor,screenId);};this.loading.append(note,retry);}
 commit(descriptor){if(this.queued){const queued=this.queued;this.queued=null;this.update(queued.descriptor,queued.screenId);return;}this.busy=false;this.action.inert=false;this.targets.inert=false;this.action.replaceChildren();this.targets.replaceChildren();this.aside.replaceChildren();this.aside.hidden=!descriptor.instruction?.text;
  if(descriptor.instruction?.text){const p=document.createElement('p');p.textContent=descriptor.instruction.text;this.aside.append(p);}
  for(const action of descriptor.actions??[]){const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',action.label);button.onclick=()=>this.press(action.actionId);
   if(action.placement==='hotspot'){button.className='channel-hotspot';const rect=action.rect,asset=descriptor.device?.asset;const [x,y,w,h]=Array.isArray(rect)?rect:[rect.x,rect.y,rect.width,rect.height];button.style.cssText=`left:${x/asset.width*100}%;top:${y/asset.height*100}%;width:${w/asset.width*100}%;height:${h/asset.height*100}%`;this.targets.append(button);}else{button.className='primary';button.textContent=action.label;this.action.append(button);}}
 }
 async press(actionId){if(this.busy||!this.live)return;const serial=this.serial,screenId=this.screenId,revision=this.descriptor.revision;this.busy=true;this.action.inert=true;this.targets.inert=true;try{const result=await this.onAction(screenId,actionId,revision);if(!this.valid(serial))return;if(!result?.reply?.ok){this.busy=false;this.action.inert=false;this.targets.inert=false;this.onNotice('Действие не принято. Повторите на текущем экране.');}else if(result.snapshot.state.screenId===screenId){this.busy=false;this.action.inert=false;this.targets.inert=false;}}catch{if(this.valid(serial)){this.busy=false;this.onNotice('Нет связи с backend. Подтверждённый экран сохранён.');}}}
 tick(dt){if(!this.live)return;if(this.busy&&!this.pending&&!this.error){this.wait+=dt;if(this.wait>.8){this.loading.hidden=false;this.loading.textContent='Загружаем экран…';}if(this.loadingImage&&this.wait>=12){this.serial++;this.loadingImage=false;if(this.queued){const queued=this.queued;this.queued=null;this.screenId=null;this.update(queued.descriptor,queued.screenId);}else this.fail(this.descriptor,this.screenId);}}if(this.pending){this.elapsed+=dt;const p=this.reduced()?1:Math.min(1,this.elapsed/.7),smooth=p*p*(3-2*p),incoming=this.images.querySelector('.incoming'),old=this.images.querySelector('.channel-frame:not(.incoming)');this.screenElement.style.setProperty('--screen-transition',String(Math.sin(Math.PI*p)));if(incoming)incoming.style.opacity=String(smooth);if(old)old.style.opacity=String(1-smooth);if(p>=1){old?.remove();incoming?.classList.remove('incoming');this.screenElement.style.setProperty('--screen-transition','0');const pending=this.pending;this.pending=null;this.commit(pending.descriptor);}}}
}
