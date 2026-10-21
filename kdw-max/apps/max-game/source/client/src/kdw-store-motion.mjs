// Screen-space DOM animation follows the live source and destination every frame.
// Durable selection is committed separately; a cancelled flight never loses data.
export function createStoreMotion(root,{duration=680,revealDuration=300,getSlot=null,photoSelector='.kdw-product-photo',sourcePhotoSelector=photoSelector,scrollerSelector='.kdw-store-scroll',sequence=false,onApproach=null}={}){
 const flights=new Map(),reserved=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 let nextApproach=0;
 const cornerNames=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'];
 // Flight coordinates are viewport pixels; native corners are local CSS pixels.
 // Interpolate in the same space so docking under the scaled phone cannot snap.
 const screenCorners=(photo,rect)=>{const style=getComputedStyle(photo),scale=rect.width/photo.offsetWidth;return cornerNames.map(key=>parseFloat(style[key])*scale);};
 const slot=getSlot??(i=>root.querySelector(`[data-kdw-slot="${i}"]`)?.closest('.kdw-slot'));
 function mark(index,f){const target=slot(index);if(!target)return;
  if(f?.landingStart!==undefined){delete target.dataset.arriving;target.dataset.landing='true';target.style.setProperty('--kdw-reveal',String(f.reveal??0));}
  else target.dataset.arriving='true';
 }
 function cancel(index){reserved.delete(index);const f=flights.get(index);if(f){f.shellAnimation?.cancel();f.shell?.remove();f.element.remove();if(!f.committed&&f.button?.isConnected)f.button.style.visibility='';flights.delete(index);}const target=slot(index);if(target){delete target.dataset.arriving;delete target.dataset.landing;target.style.removeProperty('--kdw-reveal');}}
 // Flying images remain above the scene without a phone mask. Only landing
 // transfers ownership to the native clipped catalogue/feed.
 function dock(f,photo){
  const scroller=photo.closest(scrollerSelector);if(!scroller)return;
  // Once landed, native scrolling/clipping must own the image, not a viewport
  // overlay following scroll one RAF later. Keep it outside the fading slot.
  const rect=photo.getBoundingClientRect(),bounds=scroller.getBoundingClientRect(),scale=bounds.width/scroller.offsetWidth;
  f.element.dataset.docked='true';
  Object.assign(f.element.style,{left:((rect.left-bounds.left)/scale+scroller.scrollLeft)+'px',top:((rect.top-bounds.top)/scale+scroller.scrollTop)+'px',width:photo.offsetWidth+'px',height:photo.offsetHeight+'px',fontSize:getComputedStyle(photo).fontSize,borderRadius:getComputedStyle(photo).borderRadius,transform:'none'});
  if(f.element.parentElement!==scroller)scroller.append(f.element);
  
 }
 function tick(now){frame=0;for(const [index,f] of flights){
  if(!f.committed)continue;
  if(sequence&&!f.approached){
   const preceding=[...flights.values()].some(other=>other!==f&&other.committed&&other.order<f.order);
   if(preceding||now<f.approachAt||now<nextApproach){
    // Await the previous card's reveal outside the device. Do not aim at an
    // offscreen future feed row or create blank scroll space for it.
    const feed=root.querySelector(scrollerSelector);
    if(!feed||root.hidden){cancel(index);continue;}
    const bounds=feed.getBoundingClientRect(),from=f.from;
    const t=Math.min(1,(now-f.start)/Math.max(duration,f.approachAt-f.start)),ease=t*t*(3-2*t);
    const toX=Math.max(bounds.right+24,from.x-100),toY=Math.max(bounds.top,Math.min(bounds.bottom-from.height,from.y));
    f.current={...from,x:from.x+(toX-from.x)*ease,y:from.y+(toY-from.y)*ease};
    Object.assign(f.element.style,{left:f.current.x+'px',top:f.current.y+'px',transform:`rotate(${-4*Math.sin(Math.PI*t)}deg)`});
    f.element.dataset.flightPhase='queued';
    continue;
   }
   f.approached=true;f.from=f.current??f.from;f.start=now;
   f.element.dataset.flightPhase='flying';
   onApproach?.(index);
   if(!flights.has(index))continue;
  }
  const target=slot(index),photo=target?.querySelector(photoSelector);
  if(!photo||root.hidden){cancel(index);continue;}
  const from=f.from,to=photo.getBoundingClientRect(),t=Math.min(1,(now-f.start)/duration),ease=t*t*t*(t*(t*6-15)+10),arc=Math.sin(Math.PI*ease)*Math.min(100,Math.abs(from.x-to.x)*.16);
  const x=from.x+(to.x-from.x)*ease,y=from.y+(to.y-from.y)*ease-arc,w=from.width+(to.width-from.width)*ease,h=from.height+(to.height-from.height)*ease;
  if(t<1){const corners=screenCorners(photo,to).map((end,i)=>from.corners[i]+(end-from.corners[i])*ease);
   Object.assign(f.element.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',borderRadius:corners.map(r=>r+'px').join(' '),transform:`rotate(${Math.sin(Math.PI*t)*-7}deg)`});}
  if(t<1&&f.element.classList.contains('kdw-product-emoji')){
   const endFont=parseFloat(getComputedStyle(photo).fontSize)*to.height/photo.offsetHeight;
   f.element.style.fontSize=(from.fontSizePx+(endFont-from.fontSizePx)*ease)+'px';
  }
  if(t===1){
   f.landingStart??=now;
   f.element.dataset.flightPhase='landing';
   const progress=Math.min(1,(now-f.landingStart)/revealDuration);
   f.reveal=1-Math.pow(1-progress,3);
   // Keep the landed image over its live destination while the card unfolds.
   // Fade the duplicate only after the underlying image is almost opaque.
   f.element.style.opacity=String(1-Math.max(0,(progress-.65)/.35));
   dock(f,photo);
   if(progress===1){if(sequence)nextApproach=now+120;cancel(index);continue;}
  }
  mark(index,f);
 }
 if([...flights.values()].some(f=>f.committed))frame=requestAnimationFrame(tick);}
 return {
  has(index){return reserved.has(index)||flights.has(index);},
  active(){return reserved.size>0||flights.size>0;},
  // Capture while still in the falling field: its font and ancestor scale differ
  // from the catalogue, and the authority may detach this source before add().
  capture(source){const rect=source.getBoundingClientRect();return {...rect.toJSON(),corners:screenCorners(source,rect),fontSizePx:parseFloat(getComputedStyle(source).fontSize)*rect.height/source.offsetHeight};},
  reserve(index){reserved.add(index);const target=slot(index);if(target)target.dataset.arriving='true';},
  begin(index,button){
   cancel(index);if(sequence&&reduced.matches)return;this.reserve(index);if(reduced.matches)return;
   const source=button.querySelector(sourcePhotoSelector),from=this.capture(source),rect=button.getBoundingClientRect();
   // Own the pixels before awaiting the command: the stream may remove its node.
   const shell=button.cloneNode(true);shell.removeAttribute('data-product-spawn');shell.removeAttribute('data-kdw-product');shell.removeAttribute('data-spawn');shell.classList.add('kdw-product-selection-shell');shell.inert=true;shell.setAttribute('aria-hidden','true');
   Object.assign(shell.style,{position:'fixed',left:rect.x+'px',top:rect.y+'px',width:button.offsetWidth+'px',height:button.offsetHeight+'px',transform:`scale(${rect.width/button.offsetWidth})`,transformOrigin:'0 0'});
   shell.querySelector(sourcePhotoSelector).style.visibility='hidden';
   const element=source.cloneNode(true);element.classList.add('kdw-product-flight');element.setAttribute('aria-hidden','true');
   Object.assign(element.style,{left:from.x+'px',top:from.y+'px',width:from.width+'px',height:from.height+'px',borderRadius:from.corners.map(r=>r+'px').join(' '),fontSize:from.fontSizePx+'px',opacity:'1'});
   root.append(shell,element);button.style.visibility='hidden';
   const shellAnimation=shell.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});
   shellAnimation.finished.then(()=>shell.remove(),()=>{});
   const flight={element,from,button,shell,shellAnimation,committed:false};flights.set(index,flight);
  },
  add(product,index,button,origin){
   if(reduced.matches){cancel(index);return;}
   if(!flights.has(index))this.begin(index,button??root.querySelector(`[data-kdw-product="${product}"]`));
   const f=flights.get(index);if(!f)return;
   f.product=product;f.committed=true;f.start=performance.now();
   if(sequence){
    const previous=[...flights.values()].filter(other=>other!==f&&other.committed);
    f.order=Math.max(0,...previous.map(other=>other.order))+1;
    f.approachAt=Math.max(f.start,nextApproach,...previous.map(other=>other.approachAt+duration+revealDuration+120));
   }
   const target=slot(index);if(target)target.dataset.arriving='true';if(!frame)frame=requestAnimationFrame(tick);
  },
  cancel,
  sync(){for(const index of new Set([...reserved,...flights.keys()])){const f=flights.get(index);mark(index,f);const photo=slot(index)?.querySelector(photoSelector);if(f?.landingStart!==undefined&&photo)dock(f,photo);}},
  clear(){cancelAnimationFrame(frame);frame=0;nextApproach=0;for(const index of new Set([...reserved,...flights.keys()]))cancel(index);},
 };
}
