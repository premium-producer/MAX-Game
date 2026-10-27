// Display ownership is independent of a network/decode attempt. A failed image
// never becomes an error screen and a late portrait cannot revoke a ready frame.
const guards=new WeakMap(),live=new Set();
const data=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
// Reuse the existing neutral photograph template inside the current device.
// Never invent a MAX screen, logo grid or replacement game controls.
export function fallbackImageSource({width=390,height=800}={}){
 return data(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(1,width)}" height="${Math.max(1,height)}" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice"><path fill="#251444" d="M0 0h1080v1920H0z"/><circle cx="540" cy="430" r="200" fill="#8674a6"/><ellipse cx="540" cy="990" rx="400" ry="330" fill="#8674a6"/></svg>`);
}
export const NEUTRAL_PORTRAIT=data('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><path fill="#251444" d="M0 0h1080v1920H0z"/><circle cx="540" cy="430" r="200" fill="#8674a6"/><ellipse cx="540" cy="990" rx="400" ry="330" fill="#8674a6"/></svg>');
export function fallbackForImage(image,snapshot){
 const asset=snapshot?.view?.device?.asset;
 if(/avatar|portrait|Фото посетителя/i.test(image.src+' '+image.alt))return NEUTRAL_PORTRAIT;
 return fallbackImageSource({width:asset?.width||image.naturalWidth||390,height:asset?.height||image.naturalHeight||800,portrait:/avatar|portrait|Фото посетителя/i.test(image.src+' '+image.alt),actions:snapshot?.view?.actions??[]});
}
export const imageSource=image=>guards.get(image)?.source??image.src;
export function requestImageSource(image,source){const guard=guards.get(image);if(guard)guard.request(source);else image.src=source;}
export function guardImage(image,{fallback=fallbackForImage(image),onChange=()=>{},onFault=(reason)=>console.error('MAX media fallback',reason),fallbackAfter=1500,attemptTimeout=6000,makeImage=()=>new Image()}={}){
 guards.get(image)?.dispose();
 let disposed=false,epoch=0,sourceReadyVersion=0,display=image.src,shown=!!(image.complete&&image.naturalWidth),readyDone=false,settle,fallbackTask=null;
 const timers=new Set(),ghosts=new Set(),probes=new Set(),ready=new Promise(r=>settle=r);
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
 const connected=()=>!disposed&&image.isConnected;
 function resolve(){if(!readyDone){readyDone=true;settle();}}
 function swap(source,isFallback){
  if(!connected())return;
  let ghost;
  if(shown&&source!==display&&image.animate&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){ghost=image.cloneNode(true);ghost.removeAttribute('id');ghost.dataset.mediaGhost='true';ghost.setAttribute('aria-hidden','true');Object.assign(ghost.style,{position:'absolute',left:image.offsetLeft+'px',top:image.offsetTop+'px',width:image.offsetWidth+'px',height:image.offsetHeight+'px',pointerEvents:'none',margin:'0'});image.after(ghost);ghosts.add(ghost);}
  display=source;image.src=source;image.dataset.gpuDecoded='true';image.dataset.mediaFallback=String(isFallback);image.dataset.preparedPhone='true';shown=true;
  if(ghost){const animation=ghost.animate([{opacity:1},{opacity:0}],{duration:360,easing:'ease-out',fill:'forwards'});animation.finished.catch(()=>{}).finally(()=>{ghost.remove();ghosts.delete(ghost);onChange();});}
  resolve();onChange();
 }
 async function decoded(source){const probe=makeImage();probes.add(probe);probe.decoding='async';probe.src=source;let id;try{await Promise.race([probe.decode(),new Promise((_,reject)=>{id=later(()=>reject(Error('MEDIA_DECODE_TIMEOUT')),attemptTimeout);})]);return probe;}finally{clearTimeout(id);timers.delete(id);probes.delete(probe);}}
 async function useFallback(reason,version=epoch){
  if(!connected()||version!==epoch||image.dataset.mediaFallback==='true')return;
  const sourceWasReady=sourceReadyVersion===version;
  onFault({reason,asset:guard.source.startsWith('data:')?'inline':guard.source,screen:image.closest('.route-phone')?.dataset.sceneVersion??null});
  try{await decoded(fallback);}catch{/* The self-contained SVG still has a browser-native display path. */}
  if(connected()&&version===epoch&&(sourceWasReady||sourceReadyVersion!==version))swap(fallback,true);
 }
 async function load(source,version){
  const fallbackTimer=later(()=>void useFallback('slow',version),fallbackAfter);
  for(let attempt=0;attempt<3&&connected()&&version===epoch;attempt++){
   try{await decoded(source);if(connected()&&version===epoch){clearTimeout(fallbackTimer);timers.delete(fallbackTimer);sourceReadyVersion=version;swap(source,false);}return;}
   catch(error){if(!connected()||version!==epoch)return;void useFallback(error?.message??'decode',version);if(attempt<2)await new Promise(r=>later(r,attempt?2000:350));}
  }
 }
 const guard={source:image.src,ready,request(source){const url=new URL(source,image.ownerDocument?.baseURI??globalThis.document?.baseURI??'http://localhost/').href;if(url===guard.source&&epoch)return;guard.source=url;image.dataset.mediaOriginal=url;const version=++epoch;void load(url,version);},fallback(reason){if(!fallbackTask)fallbackTask=useFallback(reason).finally(()=>fallbackTask=null);return fallbackTask;},dispose(){disposed=true;epoch++;for(const id of timers)clearTimeout(id);timers.clear();for(const probe of probes)probe.src='';probes.clear();for(const node of ghosts)node.remove();ghosts.clear();observer?.disconnect();live.delete(guard);resolve();},get connected(){return connected();}};
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{if(image.src!==display){const next=image.src;image.src=display;guard.request(next);}}):null;
 observer?.observe(image,{attributes:true,attributeFilter:['src']});guards.set(image,guard);live.add(guard);
 image.dataset.gpuDecoded=shown?'true':'false';guard.request(image.src);
 return guard;
}
export function useImageFallback(image,reason,options){let guard=guards.get(image);if(!guard)guard=guardImage(image,options);return guard.fallback(reason);}
export function retireDetachedMedia(){for(const guard of live)if(!guard.connected)guard.dispose();}
globalThis.addEventListener?.('pagehide',()=>{for(const guard of live)guard.dispose();},{once:true});

// Validation remains readable; technical faults have a diagnostic-only surface.
export function visitorMessage(message){const text=String(message??'');if(/Не удалось|не загруз|недоступ|Загружа|Готовим|Нет связи|timeout|failed|backend|NOT_READY|UNAVAILABLE/i.test(text)||/\b[A-Z][A-Z0-9_]{4,}\b/.test(text)){if(text)console.error('MAX_UI_RECOVERY',text);return '';}return text;}
