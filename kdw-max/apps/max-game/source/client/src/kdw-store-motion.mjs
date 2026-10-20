// Screen-space DOM animation follows the live source and destination every frame.
// Durable selection is committed separately; a cancelled flight never loses data.
export function createStoreMotion(root,{duration=680}={}){
 const flights=new Map(),reserved=new Set(),pulses=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 const slot=i=>root.querySelector(`[data-kdw-slot="${i}"]`)?.closest('.kdw-slot');
 function land(index){const target=slot(index);if(!target)return;delete target.dataset.arriving;
  if(reduced.matches)return;const a=target.animate([{transform:'scale(.94)',filter:'brightness(1.7)'},{transform:'scale(1.055)',filter:'brightness(1.25)',offset:.48},{transform:'scale(1)',filter:'brightness(1)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});pulses.add(a);a.finished.catch(()=>{}).finally(()=>pulses.delete(a));
 }
 function cancel(index){reserved.delete(index);const f=flights.get(index);if(f){f.shellAnimation?.cancel();f.shell?.remove();f.element.remove();if(!f.committed&&f.button?.isConnected)f.button.style.visibility='';flights.delete(index);}const target=slot(index);if(target)delete target.dataset.arriving;}
 function tick(now){frame=0;for(const [index,f] of flights){
  if(!f.committed)continue;
  const target=slot(index),photo=target?.querySelector('.kdw-product-photo');
  if(!photo||root.hidden){cancel(index);continue;}
  target.dataset.arriving='true';const from=f.from,to=photo.getBoundingClientRect(),t=Math.min(1,(now-f.start)/duration),ease=t*t*t*(t*(t*6-15)+10),arc=Math.sin(Math.PI*ease)*Math.min(100,Math.abs(from.x-to.x)*.16);
  const x=from.x+(to.x-from.x)*ease,y=from.y+(to.y-from.y)*ease-arc,w=from.width+(to.width-from.width)*ease,h=from.height+(to.height-from.height)*ease;
  Object.assign(f.element.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',transform:`rotate(${Math.sin(Math.PI*t)*-7}deg)`});
  if(f.element.classList.contains('kdw-product-emoji')){
   const endFont=parseFloat(getComputedStyle(photo).fontSize)*to.height/photo.offsetHeight;
   f.element.style.fontSize=(from.fontSizePx+(endFont-from.fontSizePx)*ease)+'px';
  }
  if(t===1){cancel(index);land(index);}
 }
 if([...flights.values()].some(f=>f.committed))frame=requestAnimationFrame(tick);}
 return {
  // Capture while still in the falling field: its font and ancestor scale differ
  // from the catalogue, and the authority may detach this source before add().
  capture(source){const rect=source.getBoundingClientRect();return {...rect.toJSON(),fontSizePx:parseFloat(getComputedStyle(source).fontSize)*rect.height/source.offsetHeight};},
  reserve(index){reserved.add(index);const target=slot(index);if(target)target.dataset.arriving='true';},
  begin(index,button){
   cancel(index);this.reserve(index);if(reduced.matches)return;
   const source=button.querySelector('.kdw-product-photo'),from=this.capture(source),rect=button.getBoundingClientRect();
   // Own the pixels before awaiting the command: the stream may remove its node.
   const shell=button.cloneNode(true);shell.removeAttribute('data-product-spawn');shell.removeAttribute('data-kdw-product');shell.classList.add('kdw-product-selection-shell');shell.inert=true;shell.setAttribute('aria-hidden','true');
   Object.assign(shell.style,{position:'fixed',left:rect.x+'px',top:rect.y+'px',width:button.offsetWidth+'px',height:button.offsetHeight+'px',transform:`scale(${rect.width/button.offsetWidth})`,transformOrigin:'0 0'});
   shell.querySelector('.kdw-product-photo').style.visibility='hidden';
   const element=source.cloneNode(true);element.classList.add('kdw-product-flight');element.setAttribute('aria-hidden','true');
   Object.assign(element.style,{left:from.x+'px',top:from.y+'px',width:from.width+'px',height:from.height+'px',fontSize:from.fontSizePx+'px',opacity:'1'});
   root.append(shell,element);button.style.visibility='hidden';
   const shellAnimation=shell.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});
   shellAnimation.finished.then(()=>shell.remove(),()=>{});
   flights.set(index,{element,from,button,shell,shellAnimation,committed:false});
  },
  add(product,index,button,origin){
   if(reduced.matches){cancel(index);land(index);return;}
   if(!flights.has(index))this.begin(index,button??root.querySelector(`[data-kdw-product="${product}"]`));
   const f=flights.get(index);if(!f)return;
   f.product=product;f.committed=true;f.start=performance.now();
   const target=slot(index);if(target)target.dataset.arriving='true';if(!frame)frame=requestAnimationFrame(tick);
  },
  cancel,
  sync(){for(const index of new Set([...reserved,...flights.keys()])){const target=slot(index);if(target)target.dataset.arriving='true';}},
  clear(){cancelAnimationFrame(frame);frame=0;for(const index of new Set([...reserved,...flights.keys()]))cancel(index);for(const a of pulses)a.cancel();pulses.clear();},
 };
}
