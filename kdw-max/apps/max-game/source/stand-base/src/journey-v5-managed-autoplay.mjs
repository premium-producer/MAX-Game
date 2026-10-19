import {createV5AutomaticCatalog,V5AutoplayPresentation} from './journey-v5-autoplay.mjs';

// Exhibition ID/videos and ordinary selected missions share the existing visual
// readiness clock, while keeping their authority/host/bindings separate.
export function managedAutoplayPolicy(context){
 const exhibition=context?.show?.automatic===true;
 const selected=context?.autoplay?.protocol==='max-selected-autoplay-v1'&&context.autoplay.enabled===true;
 const raw=exhibition?context.show.screenDelayMs:context?.autoplay?.screenDelayMs;
 const valid=Number.isInteger(raw)&&raw>=500&&raw<=10000&&raw%100===0;
 return {enabled:exhibition||selected&&valid,delayMs:valid?raw:1000};
}

export function synchronizeManagedAutoplay(previous,context,catalog){
 const policy=managedAutoplayPolicy(context);
 if(!policy.enabled)return {presentation:null,routes:null,delayMs:policy.delayMs};
 if(previous?.presentation&&previous.delayMs===policy.delayMs)return previous;
 return {presentation:new V5AutoplayPresentation(),routes:previous?.routes??createV5AutomaticCatalog(catalog),delayMs:policy.delayMs};
}
