import {createTransitionLayout} from './kdw-transition-layout.mjs';
const pose=()=>({x:0,y:0,scale:1});
export const DEFAULT_LAYOUT={schemaVersion:1,standby:{logo:pose(),video:pose(),missions:pose()},game:{device:pose(),reference:pose(),button:pose()},devices:{},screens:{}};
// Legacy reference/button entries remain readable in saved profiles, but the
// device owns the whole game composition. Old independent offsets never detach it.
export function resolveComposition(value,kind,screen){const {device}={...value.game,...value.devices?.[kind],...value.screens?.[screen]};return{device,reference:device,button:device};}
export function affineRect(r,before,after){const scale=after.width/before.width;return{...r,x:after.x+(r.x-before.x)*scale,y:after.y+(r.y-before.y)*scale,w:r.w*scale,h:r.h*scale,...(Number.isFinite(r.scale)?{scale:r.scale*scale}:{})};}
export function compositionRect(r,p,anchor,unit=1){const a=anchor??{x:r.x+r.width/2,y:r.y+r.height/2};return{x:a.x+(r.x-a.x)*p.scale+p.x*unit,y:a.y+(r.y-a.y)*p.scale+p.y*unit,width:r.width*p.scale,height:r.height*p.scale};}
const buttonSelector='.client-actions .kdw-transition-button,.pc-forward .kdw-transition-button,.bn-source-forward .kdw-transition-button,.kdw-post-actions .kdw-transition-button,.kdw-store-actions .kdw-transition-button';
/** One affine map for the GPU, native controls and connector bounds. No game state writes. */
export function createCompositionLayout({document,params,arena,getSize,getHost}){
 const transition=createTransitionLayout({document,params}),preview=document.documentElement.dataset.layoutPreview==='true';
 let value=structuredClone(DEFAULT_LAYOUT),savedValue=value,previewUntil=0,override=null,disposed=false,pending=false,available=true,lastReport=0,lastKey='',events=null,layoutEpoch=0;
 const touched=new Map();let maps=[];
 const remember=el=>{if(!touched.has(el))touched.set(el,{translate:el.style.translate,scale:el.style.scale});};
 const restore=()=>{for(const [el,style]of touched){el.style.translate=style.translate;el.style.scale=style.scale;}touched.clear();maps=[];};
 const live=el=>el&&el.isConnected&&!el.closest('[hidden]')&&el.getBoundingClientRect().width>0;
 const send=data=>{if(preview&&parent!==window)parent.postMessage({type:'kdw-layout:scene',...data},location.origin);};
 const accept=state=>{value=state.effective;savedValue=state.value;previewUntil=state.preview?.expiresAt??0;};
 async function poll(){if(disposed||pending||!available||events?.readyState===1)return;pending=true;try{const r=await fetch('/__kdw/layout/state',{cache:'no-store',signal:AbortSignal.timeout(3000)});if(r.status===404)available=false;if(r.ok)accept(await r.json());}catch{/* A missing operator service keeps the saved geometry. */}finally{pending=false;}}
 const receive=e=>{if(!preview||e.source!==parent||e.origin!==location.origin||e.data?.type!=='kdw-layout:draft')return;const v=e.data.value;if(v?.schemaVersion===1&&v.standby&&v.game)override=v;const guides=document.querySelector('[data-composition-guides]');if(guides)guides.hidden=!e.data.guides;};
 window.addEventListener('message',receive);
 let guides;if(preview){guides=document.createElement('div');guides.dataset.compositionGuides='';guides.style.cssText='position:fixed;inset:0;z-index:100000;pointer-events:none';guides.innerHTML='<svg viewBox="0 0 3072 1536" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><rect x="1" y="1" width="3070" height="1534" fill="none" stroke="#74f9ff" stroke-width="3"/><rect x="560" y="0" width="1760" height="1536" fill="none" stroke="#ffcf4a" stroke-width="3"/><path d="M1536 0V1536M0 768H3072" stroke="#ffffff66" stroke-width="2" stroke-dasharray="12 12"/><rect x="683.2" y="107.52" width="1513.6" height="1320.96" fill="none" stroke="#68f996" stroke-width="2" stroke-dasharray="12 12"/></svg>';document.body.append(guides);}
 const ready=poll().then(()=>{if(available&&!disposed){events=new EventSource('/__kdw/layout/events');events.onmessage=e=>{try{accept(JSON.parse(e.data));}catch{}};}}),timer=setInterval(()=>void poll(),1000);
 function layout(){
  transition();const host=getHost();if(!host||document.documentElement.dataset.pixelMap!=='true')return null;
  const v=override??(previewUntil&&Date.now()>previewUntil?savedValue:value),standby=host.dataset.screen==='standby',device=host.querySelector('.route-phone'),kind=device?.querySelector('.demo-app')?.dataset.device==='pc'?'pc':'phone',screen=document.documentElement.dataset.kdwScreen??'';
  const current=resolveComposition(v,kind,screen),targets=[];
  if(standby){targets.push([host.querySelector('[data-idle-part] img')?.closest('[data-idle-part]'),v.standby.logo]);targets.push([device,v.standby.video]);const icons=[...host.querySelectorAll('[data-idle-mission]')];const rects=icons.map(el=>el.getBoundingClientRect());if(rects.length){const anchor={x:(Math.min(...rects.map(r=>r.left))+Math.max(...rects.map(r=>r.right)))/2,y:(Math.min(...rects.map(r=>r.top))+Math.max(...rects.map(r=>r.bottom)))/2};for(const icon of icons)targets.push([icon,v.standby.missions,anchor]);}}
  else{const reference=host.querySelector('.task-dialog .instruction'),r=live(device)?device.getBoundingClientRect():live(reference)?reference.getBoundingClientRect():host.getBoundingClientRect(),anchor={x:r.x+r.width/2,y:r.y+r.height/2};
   const members=[device,reference,...host.querySelectorAll('.object[data-object],.object[data-route-next],.v5-device-timer'),...document.querySelectorAll(buttonSelector)].filter(live);
   // A descendant already follows its transformed owner (native controls,
   // captions, badges). Apply the shared affine map once to each root only.
   for(const el of new Set(members))if(!members.some(parent=>parent!==el&&parent.contains(el)))targets.push([el,current.device,anchor]);
  }
  const a=arena.getBoundingClientRect(),unit=a.width/3072,sceneUnit=a.width/getSize().width;
  const records=targets.filter(([el])=>live(el)).map(([el,p,anchor])=>({el,p,anchor,before:el.getBoundingClientRect()}));
  const adjustments=[];
  for(const {el,p,anchor,before}of records){if(!p||p.scale===1&&p.x===0&&p.y===0)continue;remember(el);const old=getComputedStyle(el).translate.split(' '),tx=old[0]&&old[0]!=='none'?old[0]:'0px',ty=old[1]||'0px';
   // An existing translate belongs to the reference/button layout. Keep it.
   const parentScale=el.parentElement.getBoundingClientRect().width/el.parentElement.offsetWidth||sceneUnit;
   adjustments.push({el,p,tx,ty,parentScale,target:compositionRect(before,p,anchor,unit)});
  }
  // Batch writes/reads across the group. Icon pivots are at their tile centre,
  // not the caption-box centre; measure that actual pose before translating.
  for(const {el,p}of adjustments)el.style.scale=String(p.scale);
  const scaled=adjustments.map(a=>a.el.getBoundingClientRect());
  adjustments.forEach(({el,tx,ty,parentScale,target},i)=>{el.style.translate=`calc(${tx} + ${(target.x-scaled[i].x)/parentScale}px) calc(${ty} + ${(target.y-scaled[i].y)/parentScale}px)`;});
  maps=records.filter(({el})=>touched.has(el)).map(({el,before})=>({el,before,after:el.getBoundingClientRect()}));
  const containing=el=>maps.filter(m=>m.el===el||m.el.contains(el)).at(-1);
  if(preview&&performance.now()-lastReport>500){lastReport=performance.now();send({standby,screen,kind,rects:records.map(({el})=>{const r=el.getBoundingClientRect();return{role:el.matches('.route-phone')?'device':el.matches('.instruction')?'reference':el.matches('.object')?'icons':el.matches('.v5-device-timer')?'timer':el.dataset.idleMission?'missions':el.matches(buttonSelector)?'button':'logo',x:(r.x-a.x)/unit,y:(r.y-a.y)/unit,width:r.width/unit,height:r.height/unit};})});}
  const key=JSON.stringify(v),changed=key!==lastKey;lastKey=key;if(changed||!host.dataset.compositionRevision)host.dataset.compositionRevision=String(++layoutEpoch);
  return{changed,project(el,r){const m=containing(el);if(!m)return r;const px={...r,x:a.x+r.x*sceneUnit,y:a.y+r.y*sceneUnit,w:r.w*sceneUnit,h:r.h*sceneUnit},mapped=affineRect(px,m.before,m.after);return{...mapped,x:(mapped.x-a.x)/sceneUnit,y:(mapped.y-a.y)/sceneUnit,w:mapped.w/sceneUnit,h:mapped.h/sceneUnit};},scale(el){const m=containing(el);return m?m.after.width/m.before.width:1;}};
 }
 layout.before=restore;
 layout.ready=ready;
 layout.dispose=()=>{disposed=true;events?.close();restore();clearInterval(timer);window.removeEventListener('message',receive);guides?.remove();};
 window.addEventListener('pagehide',layout.dispose,{once:true});
 return layout;
}
