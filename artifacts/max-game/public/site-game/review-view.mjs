const imageCache = new Map();
const imageUrl = path => `../${path}`;
function imageFor(path) {
  if (!path) return Promise.resolve(null);
  if (imageCache.has(path)) return imageCache.get(path);
  const pending = new Promise((resolve,reject) => {
    const image = new Image(); image.decoding='async'; image.draggable=false;
    image.onload=()=>image.decode().then(()=>resolve(image),reject);
    image.onerror=()=>reject(new Error(`Asset unavailable: ${path}`));
    image.src=imageUrl(path);
  });
  imageCache.set(path,pending);
  pending.catch(()=>imageCache.delete(path));
  return pending;
}
export function warmReviewTask(flow) {
  return Promise.allSettled(Object.values(flow.screens).filter(screen=>screen.media).slice(0,3).map(screen=>imageFor(screen.media)));
}
export class ReviewTaskView {
  constructor(device,aside,flow,{screenId,onAction,onNotice,reduced}) {
    this.device=device;this.aside=aside;this.flow=flow;this.screenId=screenId;
    this.onAction=onAction;this.onNotice=onNotice;this.reduced=reduced;
    this.live=true;this.busy=true;this.serial=0;this.elapsed=0;this.wait=0;this.autoElapsed=0;
    device.innerHTML='<div class="channel-screen review-screen"><div class="channel-images"></div><div class="channel-targets"></div><div class="channel-load" hidden role="status"></div></div><div class="channel-action"></div>';
    this.screenElement=device.querySelector('.review-screen');
    this.images=device.querySelector('.channel-images');this.targets=device.querySelector('.channel-targets');
    this.loading=device.querySelector('.channel-load');this.action=device.querySelector('.channel-action');
    this.screenElement.classList.toggle('pc',flow.device==='pc');
    this.prepareInitial();
  }
  dispose(){this.live=false;this.serial++;}
  valid(serial){return this.live&&this.device.isConnected&&serial===this.serial;}
  async prepareInitial(){
    const serial=++this.serial,screen=this.flow.screens[this.screenId];this.busy=true;this.describe(screen);this.wait=0;
    try{this.renderFrame(await imageFor(screen.media),screen,false);if(!this.valid(serial))return;this.busy=false;this.loading.hidden=true;this.controls(screen);this.warmNext(screen);}
    catch{if(this.valid(serial))this.fail(screen);}
  }
  describe(screen){this.aside.replaceChildren();const p=document.createElement('p');p.textContent=screen.copy;this.aside.append(p);}
  renderFrame(image,screen,incoming){
    const frame=document.createElement('div');frame.className=`channel-frame${incoming?' incoming':''}`;frame.style.opacity=incoming?'0':'1';
    if(image)frame.append(image.cloneNode(false));
    else {const gap=document.createElement('div');gap.className='review-gap';gap.textContent='Клиентский экран пока не предоставлен';frame.append(gap);}
    this.images.append(frame);
  }
  controls(screen){
    this.action.replaceChildren();this.targets.replaceChildren();this.autoElapsed=0;
    for(const choice of screen.actions.filter(action=>action.label)){
      const button=document.createElement('button');button.type='button';button.className='primary';button.textContent=choice.label;
      button.onclick=()=>this.press(choice.id);this.action.append(button);
    }
  }
  warmNext(screen){for(const next of screen.actions.map(action=>this.flow.screens[action.to]).filter(Boolean).slice(0,2))imageFor(next.media).catch(()=>{});}
  async press(actionId){
    if(!this.live||this.busy)return;
    const from=this.screenId,screen=this.flow.screens[from],action=screen.actions.find(entry=>entry.id===actionId);
    if(!action)return;
    this.busy=true;this.action.inert=true;this.wait=0;
    const next=this.flow.screens[action.to];
    try{
      const image=next?await imageFor(next.media):null;
      if(!this.live||this.screenId!==from)return;
      const result=this.onAction(from,actionId);
      if(!result?.accepted){this.busy=false;this.action.inert=false;this.onNotice('Действие устарело. Повторите на текущем экране.');return;}
      if(!next)return;
      const serial=++this.serial;this.screenId=next.id;this.renderFrame(image,next,true);this.elapsed=0;
      this.describe(next);this.action.replaceChildren();this.loading.hidden=true;this.transitionSerial=serial;this.warmNext(next);
    }catch{if(this.live&&this.screenId===from)this.fail(next??screen);}
  }
  fail(screen){
    this.busy=true;this.loading.hidden=false;this.loading.replaceChildren();
    const p=document.createElement('p');p.textContent='Экран не загрузился';
    const button=document.createElement('button');button.type='button';button.className='primary';button.textContent='Повторить';
    button.onclick=()=>{this.loading.hidden=true;this.busy=false;this.action.inert=false;if(this.images.children.length===0)this.prepareInitial();};
    this.loading.append(p,button);if(screen.media)imageCache.delete(screen.media);
  }
  tick(dt){
    if(!this.live)return;
    if(this.busy&&!this.transitionSerial&&this.loading.hidden){this.wait+=dt;if(this.wait>.8){this.loading.hidden=false;this.loading.textContent='Загружаем экран…';}}
    if(this.transitionSerial){
      this.elapsed+=dt;const progress=this.reduced()?1:Math.min(1,this.elapsed/.7),smooth=progress*progress*(3-2*progress);
      this.screenElement.style.setProperty('--screen-transition',String(Math.sin(Math.PI*progress)));
      const incoming=this.images.querySelector('.incoming'),old=this.images.querySelector('.channel-frame:not(.incoming)');
      if(incoming)incoming.style.opacity=String(smooth);if(old)old.style.opacity=String(1-smooth);
      if(progress>=1){old?.remove();incoming?.classList.remove('incoming');this.transitionSerial=null;this.busy=false;this.action.inert=false;this.screenElement.style.setProperty('--screen-transition','0');this.controls(this.flow.screens[this.screenId]);}
    }else if(!this.busy){
      const screen=this.flow.screens[this.screenId];
      if(screen.autoTo){this.autoElapsed+=dt;if(this.autoElapsed>=(this.reduced()?.12:.65))this.press('auto');}
    }
  }
}
