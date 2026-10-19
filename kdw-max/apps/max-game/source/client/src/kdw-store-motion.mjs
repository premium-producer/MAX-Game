// Screen-space DOM animation follows the live source and destination every frame.
// Durable selection is committed separately; a cancelled flight never loses data.
export function createStoreMotion(root,{duration=680}={}){
 const flights=new Map(),pulses=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 const slot=i=>root.querySelector(`[data-kdw-slot="${i}"]`)?.closest('.kdw-slot');
 function land(index){const target=slot(index);if(!target)return;delete target.dataset.arriving;
  if(reduced.matches)return;const a=target.animate([{transform:'scale(.94)',filter:'brightness(1.7)'},{transform:'scale(1.055)',filter:'brightness(1.25)',offset:.48},{transform:'scale(1)',filter:'brightness(1)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});pulses.add(a);a.finished.catch(()=>{}).finally(()=>pulses.delete(a));
 }
 function cancel(index){const f=flights.get(index);if(f){f.element.remove();flights.delete(index);}const target=slot(index);if(target)delete target.dataset.arriving;}
 function tick(now){frame=0;for(const [index,f] of flights){
  const source=root.querySelector(`[data-kdw-product="${f.product}"] .kdw-product-photo`),target=slot(index),photo=target?.querySelector('.kdw-product-photo');
  if(!source||!photo||root.hidden){cancel(index);continue;}
  target.dataset.arriving='true';const from=source.getBoundingClientRect(),to=photo.getBoundingClientRect(),t=Math.min(1,(now-f.start)/duration),ease=t*t*t*(t*(t*6-15)+10),arc=Math.sin(Math.PI*ease)*Math.min(100,Math.abs(from.x-to.x)*.16);
  const x=from.x+(to.x-from.x)*ease,y=from.y+(to.y-from.y)*ease-arc,w=from.width+(to.width-from.width)*ease,h=from.height+(to.height-from.height)*ease;
  Object.assign(f.element.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',transform:`rotate(${Math.sin(Math.PI*t)*-7}deg)`,opacity:String(Math.min(1,t*12))});
  if(t===1){cancel(index);land(index);}
 }
 if(flights.size)frame=requestAnimationFrame(tick);}
 return {
  add(product,index){cancel(index);const source=root.querySelector(`[data-kdw-product="${product}"] .kdw-product-photo`);if(!source)return;
   if(reduced.matches){land(index);return;}
   const element=source.cloneNode(true);element.classList.add('kdw-product-flight');element.setAttribute('aria-hidden','true');element.style.opacity='0';root.append(element);
   flights.set(index,{element,product,start:performance.now()});const target=slot(index);if(target)target.dataset.arriving='true';if(!frame)frame=requestAnimationFrame(tick);
  },
  cancel,
  sync(){for(const index of flights.keys()){const target=slot(index);if(target)target.dataset.arriving='true';}},
  clear(){cancelAnimationFrame(frame);frame=0;for(const index of flights.keys())cancel(index);for(const a of pulses)a.cancel();pulses.clear();},
 };
}
