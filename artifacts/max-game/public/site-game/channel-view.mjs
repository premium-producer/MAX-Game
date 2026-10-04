import {CHANNEL_SCREENS,ChannelTransition} from './channel-task.mjs?v=public52';
const url=screen=>`./client-media/frame-${CHANNEL_SCREENS[screen].frame}.png`;
const cache=new Map();
function imageFor(screen){
 if(!CHANNEL_SCREENS[screen].frame)return Promise.resolve(null);
 const src=url(screen);if(cache.has(src))return cache.get(src);
 const promise=new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>img.decode().then(()=>resolve(img),reject);img.onerror=()=>reject(Error('Image unavailable'));img.src=src;});
 cache.set(src,promise);promise.catch(()=>cache.delete(src));return promise;
}
// Warm the first screens at mission selection, before the palm/reveal animation.
export function warmChannel(){return Promise.allSettled(['chats','menu','name'].map(imageFor));}
export class ChannelView {
 constructor(device,aside,{screen='chats',type='private',reduced,onSave,onComplete,onNotice}){
  this.device=device;this.aside=aside;this.flow=new ChannelTransition(screen,type);this.reduced=reduced;this.onSave=onSave;this.onComplete=onComplete;this.onNotice=onNotice;this.live=true;this.wait=0;this.error=false;this.initial=true;
  device.innerHTML='<div class="channel-screen"><div class="channel-images"></div><div class="channel-targets"></div><div class="channel-load" hidden role="status"></div></div><div class="channel-action"></div>';
  this.images=device.querySelector('.channel-images');this.targets=device.querySelector('.channel-targets');this.loading=device.querySelector('.channel-load');this.action=device.querySelector('.channel-action');this.prepareInitial();
 }
 dispose(){this.live=false;this.flow.cancel();}
 valid(id){return this.live&&this.device.isConnected&&id===this.flow.serial;}
 async prepareInitial(){const id=++this.flow.serial;this.error=false;this.wait=0;this.loading.hidden=true;this.flow.phase='loading';this.describe(this.flow.screen);try{const img=await imageFor(this.flow.screen);if(!this.valid(id))return;this.mountImage(img,false,this.flow.screen);this.flow.phase='idle';this.initial=false;this.loading.hidden=true;this.controls();this.warmNext();}catch{if(this.valid(id))this.fail();}}
 describe(screen){this.aside.replaceChildren();const p=document.createElement('p');p.textContent=CHANNEL_SCREENS[screen].copy;this.aside.append(p);}
 mountImage(img,incoming,screen){if(!img)return;img.alt='Учебный интерфейс MAX';img.draggable=false;img.className='';img.style.opacity='1';const frame=document.createElement('div');frame.className=`channel-frame${incoming?' incoming':''}`;frame.style.opacity=incoming?'0':'1';frame.append(img);if(CHANNEL_SCREENS[screen].header){const header=document.createElement('div');header.className='channel-header-fix';header.textContent=CHANNEL_SCREENS[screen].header;frame.append(header);}this.images.append(frame);}
 controls(){
  const screen=CHANNEL_SCREENS[this.flow.screen];this.targets.replaceChildren();this.action.replaceChildren();this.device.classList.toggle('channel-gap',!!screen.gap);
  for(const a of screen.actions??[]){const b=document.createElement('button');b.type='button';b.className='channel-hotspot';b.setAttribute('aria-label',a.label);const [x,y,w,h]=a.rect;b.style.cssText=`left:${x/3.6}%;top:${y/8}%;width:${w/3.6}%;height:${h/8}%`;b.onclick=()=>this.press(a.id);this.targets.append(b);}
  if(screen.button){const b=document.createElement('button');b.className='primary';b.textContent=screen.button.label;b.onclick=()=>this.press('button');this.action.append(b);}
  if(screen.gap){const p=document.createElement('p');p.className='channel-gap-copy';p.textContent='Экран публичной ссылки требует исправления';this.targets.append(p);}
 }
 warmNext(){const next=[...new Set((CHANNEL_SCREENS[this.flow.screen].actions??[]).map(a=>a.to))].filter(s=>CHANNEL_SCREENS[s]?.frame&&s!==this.flow.screen);for(const s of next.slice(0,2))imageFor(s).catch(()=>{});}
 async press(action){
  const request=this.flow.request(action);if(!request){this.onNotice(this.flow.phase==='idle'?'Приватный канал выбран. Нажмите «Продолжить».':'Экран меняется — дождитесь появления.');return;}
  if(request.to==='complete'){this.onSave('created',true,this.flow.type);this.onComplete();return;}
  this.targets.inert=true;this.action.inert=true;this.wait=0;this.error=false;
  await this.prepare(request);
 }
 async prepare({id,to}){try{const img=await imageFor(to);if(!this.valid(id)||!this.flow.prepared(id))return;this.mountImage(img,true,to);this.loading.hidden=true;}catch{if(this.valid(id))this.fail();}}
 fail(){this.flow.serial++;const screen=this.initial?this.flow.screen:this.flow.pending;if(CHANNEL_SCREENS[screen]?.frame)cache.delete(url(screen));this.error=true;this.loading.hidden=false;this.loading.replaceChildren();const p=document.createElement('p');p.textContent='Не удалось загрузить экран';const b=document.createElement('button');b.className='primary';b.textContent='Повторить загрузку';b.onclick=()=>{if(this.initial){this.prepareInitial();return;}this.error=false;this.wait=0;this.loading.hidden=true;const request=this.flow.retry();if(request)this.prepare(request);};this.loading.append(p,b);}
 tick(dt){
  if(!this.live)return;
  if(this.flow.phase==='loading'&&!this.error){this.wait+=dt;if(this.wait>12)this.fail();else if(this.wait>.8){this.loading.hidden=false;this.loading.textContent='Загружаем экран…';}}
  const progress=this.flow.progress,smooth=progress*progress*(3-2*progress);const incoming=this.images.querySelector('.incoming');
  if(this.flow.phase==='transition'){this.device.style.setProperty('--screen-transition',String(Math.sin(Math.PI*progress)));if(incoming)incoming.style.opacity=String(smooth);const old=this.images.querySelector('.channel-frame:not(.incoming)');if(old)old.style.opacity=String(1-smooth);}
  if(this.flow.step(dt,this.reduced())){const old=this.images.querySelector('.channel-frame:not(.incoming)');old?.remove();incoming?.classList.remove('incoming');if(incoming)incoming.style.opacity='1';this.device.style.setProperty('--screen-transition','0');this.targets.inert=false;this.action.inert=false;this.loading.hidden=true;this.describe(this.flow.screen);this.controls();this.onSave(this.flow.screen,false,this.flow.type);this.warmNext();}
 }
}
