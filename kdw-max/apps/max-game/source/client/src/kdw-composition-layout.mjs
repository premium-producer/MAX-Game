import {setKeyboardLayout} from './kdw-pixel-map.mjs';
import {createTransitionControls} from './kdw-transition-controls.mjs';
import {placeTransitionAction} from './kdw-transition-action.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';
import {alignActivityActions} from './kdw-activity-stage.mjs';
import {createTransitionLayout} from './kdw-transition-layout.mjs';
const pose=()=>({x:0,y:0,scale:1});
export const DEFAULT_LAYOUT={schemaVersion:1,standby:{logo:pose(),video:pose(),missions:pose()},game:{device:pose(),reference:pose(),button:pose()},devices:{},screens:{}};
// Legacy reference/button entries remain readable in saved profiles, but the
// device owns the whole game composition. Old independent offsets never detach it.
export function resolveComposition(value,kind,screen){const layers=[value.game,value.devices?.[kind],value.screens?.[screen]],{device}=Object.assign({},...layers);return{device,reference:device,button:device,relative:Object.assign({},...layers.map(v=>v?.relative))};}
export function deviceClassScale(rules={},kind='phone',screen=''){
 return ['business.channel.result','business.store.start'].includes(screen)?rules.cardsScale??1.2:kind==='pc'?rules.pcScale??1:1;
}
const cx=r=>r.x+r.width/2,cy=r=>r.y+r.height/2;
const centeredRect=(r,x,y,k=1)=>({...r,x:x-r.width*k/2,y:y-r.height*k/2,width:r.width*k,height:r.height*k});
// One logical phone-width unit follows scene/common scale, not the current
// device aspect ratio or its separate size. Switching to a wide PC or enlarged
// activity phone therefore changes only the device, not every neighbour.
export function relativeCompositionRects({device,reference=null,button=null,icons=[],timers=[]},rules={},center=null,unit=device?.height*390/800,buttonPlacement='reference'){
 if(!device||!Object.keys(rules).length)return{device,reference,button,icons,timers};
 const ds=rules.deviceScale??1,d=centeredRect(device,(rules.centered&&center?center.x:cx(device))+(rules.centerX??0)*unit/100,(rules.centered&&center?center.y:cy(device))+(rules.centerY??0)*unit*800/390/100,ds),width=unit;
 const order=icons.map((r,i)=>({r,i})),placed=[];
 let right=d.x-(rules.iconsDeviceGap===undefined?(order.length?device.x-order.at(-1).r.x-order.at(-1).r.width:0):rules.iconsDeviceGap*width/100);
 for(let n=order.length-1;n>=0;n--){const {r,i}=order[n],k=rules.iconWidth===undefined?1:rules.iconWidth*width/100/r.width,w=r.width*k;placed[i]=centeredRect(r,right-w/2,cy(d)+(cy(r)-cy(device)),k);const gap=rules.iconGap===undefined?(n>0?r.x-order[n-1].r.x-order[n-1].r.width:0):rules.iconGap*width/100;right=placed[i].x-gap;}
 const referenceButton=buttonPlacement==='reference'&&reference?button:null;
 let ref=reference,b=referenceButton;
 if(reference){const k=rules.referenceWidth===undefined?1:rules.referenceWidth*width/100/reference.width;
  ref=centeredRect(reference,cx(reference),cy(reference),k);if(referenceButton)b=centeredRect(referenceButton,cx(referenceButton),cy(referenceButton),ref.width/referenceButton.width);
  const gap=referenceButton?(rules.buttonGap===undefined?Math.max(0,referenceButton.y-reference.y-reference.height)*k:rules.buttonGap*width/100):0;
  ref.x=d.x+d.width+(rules.deviceReferenceGap===undefined?(reference.x-device.x-device.width):rules.deviceReferenceGap*width/100);
  ref.y=cy(d)-(ref.height+gap+(b?.height??0))/2;
  if(b){b.x=ref.x+(ref.width-b.width)/2;b.y=ref.y+ref.height+gap;}
 }
 if(button&&!referenceButton){const gap=Math.max(0,button.y-device.y-device.height)*ds;b=centeredRect(button,cx(d),d.y+d.height+gap+button.height*ds/2,ds);}
 const oldCenter=icons.length?icons.reduce((v,r)=>v+cx(r),0)/icons.length:cx(device),newCenter=placed.length?placed.reduce((v,r)=>v+cx(r),0)/placed.length:cx(d);
 return{device:d,reference:ref,button:b,icons:placed,timers:timers.map(r=>centeredRect(r,cx(r)+newCenter-oldCenter,cy(d)+(cy(r)-cy(device))))};
}
export function affineRect(r,before,after){const scale=after.width/before.width;return{...r,x:after.x+(r.x-before.x)*scale,y:after.y+(r.y-before.y)*scale,w:r.w*scale,h:r.h*scale,...(Number.isFinite(r.scale)?{scale:r.scale*scale}:{})};}
export function compositionRect(r,p,anchor,unit=1){const a=anchor??{x:r.x+r.width/2,y:r.y+r.height/2};return{x:a.x+(r.x-a.x)*p.scale+p.x*unit,y:a.y+(r.y-a.y)*p.scale+p.y*unit,width:r.width*p.scale,height:r.height*p.scale};}
const buttonSelector='.kdw-transition-actions .kdw-transition-button,.client-actions .kdw-transition-button,.pc-forward .kdw-transition-button,.bn-source-forward .kdw-transition-button,.kdw-post-actions .kdw-transition-button,.kdw-store-actions .kdw-transition-button';
/** Device-relative maps shared by GPU, native controls and connector bounds. No game state writes. */
export function createCompositionLayout({document,params,arena,getSize,getHost,getPresentation=()=>null}){
 const transitionControls=createTransitionControls(document);
 const transition=createTransitionLayout({document,params}),preview=document.documentElement.dataset.layoutPreview==='true';
 let value=structuredClone(DEFAULT_LAYOUT),savedValue=value,previewUntil=0,override=null,disposed=false,pending=false,available=true,lastReport=0,lastKey='',events=null,layoutEpoch=0;
 const touched=new Map(),corrections=new WeakMap();let maps=[],finishActions=()=>{};
 const remember=el=>{if(!touched.has(el))touched.set(el,{translate:el.style.translate,scale:el.style.scale});};
 const restore=()=>{for(const [el,style]of touched){el.style.translate=style.translate;el.style.scale=style.scale;}touched.clear();maps=[];finishActions=()=>{};};
 const live=el=>el&&!el.hasAttribute('data-transition-source')&&(!el.matches(buttonSelector)||getComputedStyle(el).visibility!=='hidden')&&el.isConnected&&!el.closest('[hidden],[data-activity-ghost],[data-media-ghost]')&&el.getBoundingClientRect().width>0;
 const send=data=>{if(preview&&parent!==window)parent.postMessage({type:'kdw-layout:scene',...data},location.origin);};
 const accept=state=>{value=state.effective;savedValue=state.value;previewUntil=state.preview?.expiresAt??0;};
 async function poll(){if(disposed||pending||!available||events?.readyState===1)return;pending=true;try{const r=await fetch('/__kdw/layout/state',{cache:'no-store',signal:AbortSignal.timeout(3000)});if(r.status===404)available=false;if(r.ok)accept(await r.json());}catch{/* A missing operator service keeps the saved geometry. */}finally{pending=false;}}
 const receive=e=>{if(!preview||e.source!==parent||e.origin!==location.origin||e.data?.type!=='kdw-layout:draft')return;const v=e.data.value;if(v?.schemaVersion===1&&v.standby&&v.game)override=v;const guides=document.querySelector('[data-composition-guides]');if(guides)guides.hidden=!e.data.guides;};
 window.addEventListener('message',receive);
 let guides;if(preview){guides=document.createElement('div');guides.dataset.compositionGuides='';guides.style.cssText='position:fixed;inset:0;z-index:100000;pointer-events:none';guides.innerHTML='<svg viewBox="0 0 3072 1536" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><rect x="1" y="1" width="3070" height="1534" fill="none" stroke="#74f9ff" stroke-width="3"/><rect x="560" y="0" width="1760" height="1536" fill="none" stroke="#ffcf4a" stroke-width="3"/><path d="M1536 0V1536M0 768H3072" stroke="#ffffff66" stroke-width="2" stroke-dasharray="12 12"/><rect x="683.2" y="107.52" width="1513.6" height="1320.96" fill="none" stroke="#68f996" stroke-width="2" stroke-dasharray="12 12"/></svg>';document.body.append(guides);}
 const ready=poll().then(()=>{if(available&&!disposed){events=new EventSource('/__kdw/layout/events');events.onmessage=e=>{try{accept(JSON.parse(e.data));}catch{}};}}),timer=setInterval(()=>void poll(),1000);
 function layout({delta=0,reduced=false}={}){
  const host=getHost();if(!host||document.documentElement.dataset.pixelMap!=='true')return null;
  const v=override??(previewUntil&&Date.now()>previewUntil?savedValue:value),standby=host.dataset.screen==='standby',device=host.querySelector('.route-phone'),kind=device?.querySelector('.demo-app')?.dataset.device==='pc'?'pc':'phone',screen=document.documentElement.dataset.kdwScreen??'';
  setKeyboardLayout(v.keyboard);
  transitionControls.update(host);
  const presentation=getPresentation(),current=resolveComposition(v,presentation?.kind??kind,presentation?.screen??screen),targets=[];
  for(const [name,val]of Object.entries({fallingCardScale:current.relative.fallingCardScale??2.2,fallingSpawnRight:current.relative.fallingSpawnRight??0}))if(host.dataset[name]!==String(val))host.dataset[name]=String(val);
  const a=arena.getBoundingClientRect(),unit=a.width/3072,sceneUnit=a.width/getSize().width,relativeUnit=390*sceneUnit*current.device.scale;
  let basis=null;
  if(standby){targets.push([host.querySelector('[data-idle-part] img')?.closest('[data-idle-part]'),v.standby.logo]);targets.push([device,v.standby.video]);const icons=[...host.querySelectorAll('[data-idle-mission]')];const rects=icons.map(el=>el.getBoundingClientRect());if(rects.length){const anchor={x:(Math.min(...rects.map(r=>r.left))+Math.max(...rects.map(r=>r.right)))/2,y:(Math.min(...rects.map(r=>r.top))+Math.max(...rects.map(r=>r.bottom)))/2};for(const icon of icons)targets.push([icon,v.standby.missions,anchor]);}}
  else{const reference=host.querySelector('.task-dialog .instruction'),r=live(device)?device.getBoundingClientRect():live(reference)?reference.getBoundingClientRect():host.getBoundingClientRect(),anchor={x:r.x+r.width/2,y:r.y+r.height/2};
   const members=[...new Set([device,reference,...host.querySelectorAll('.object[data-object],.object[data-route-next],.v5-device-timer'),...document.querySelectorAll(buttonSelector)].filter(live))];
   const transforms=members.map(el=>[el,el.style.transform]);for(const [el]of transforms)el.style.transform='none';
   // External activity footers were aligned to the composed phone last frame.
   // Restore their authored device-relative geometry before measuring a new pose.
   const media=device?.querySelector('.task-media-canvas');
   if(media)for(const footer of document.querySelectorAll('.kdw-post-actions,.kdw-store-actions,.kdw-transition-actions'))if(live(footer))alignActivityActions(footer,{rect:media.getBoundingClientRect()},footer.style.opacity,footer.inert);
   transition();basis=new Map(members.map(el=>{const r=el.getBoundingClientRect(),offset=el.hasAttribute('data-object')?presentation?.icons?.[el.dataset.object]:el===device||el===reference||el.matches(buttonSelector)||el.matches('[data-mission-timer],[data-mission-queue-count]')?presentation?.device:null;return[el,{x:r.x+(offset?.x??0)*sceneUnit,y:r.y+(offset?.y??0)*sceneUnit,width:r.width,height:r.height}];}));
   for(const [el,transform]of transforms)el.style.transform=transform;
   // A descendant already follows its transformed owner (native controls,
   // captions, badges). Only transition buttons can override their owner.
   for(const el of new Set(members))if(el.matches(buttonSelector)||!members.some(parent=>parent!==el&&parent.contains(el)))targets.push([el,current.device,anchor]);
  }
  const hostBounds=host.getBoundingClientRect(),virtual=presentation?.deviceRect,restDevice=virtual?{x:hostBounds.x+virtual.x*sceneUnit,y:hostBounds.y+virtual.y*sceneUnit,width:virtual.width*sceneUnit,height:virtual.height*sceneUnit}:basis?.get(device),anchor=restDevice?{x:cx(restDevice),y:cy(restDevice)}:null;
  const records=targets.filter(([el])=>live(el)).map(([el,p,oldAnchor])=>{const before=el.getBoundingClientRect(),rest=basis?.get(el)??before;return{el,p,before,rest,target:p?compositionRect(rest,p,standby?oldAnchor:anchor,unit):rest};});
  if(!standby){
   const d=records.find(r=>r.el===device),ref=records.find(r=>r.el.matches('.instruction')),buttons=records.filter(r=>r.el.matches(buttonSelector)),icons=records.filter(r=>r.el.matches('.object[data-object]')),timers=records.filter(r=>r.el.matches('.v5-device-timer'));
   if(restDevice){const hostRect=hostBounds,b=buttons.length===1?buttons[0]:null,result=relativeCompositionRects({device:compositionRect(restDevice,current.device,anchor,unit),reference:ref?.target,button:b?.target,icons:icons.map(r=>r.target),timers:timers.map(r=>r.target)},{...current.relative,deviceScale:(current.relative.deviceScale??1)*deviceClassScale(current.relative,presentation?.kind??kind,presentation?.screen??screen)},{x:hostRect.x+hostRect.width/2,y:hostRect.y+hostRect.height/2},relativeUnit,params.get('transitionLayout')==='device'?'device':'reference');if(d)d.target=result.device;if(ref)ref.target=result.reference;if(b)b.target=result.button;icons.forEach((r,i)=>r.target=result.icons[i]);timers.forEach((r,i)=>r.target=result.timers[i]);}
  }
  let settling=false;
  for(const record of records){const {el,rest,before,target}=record,k=target.width/rest.width,goal={scale:k,x:target.x-rest.x*k,y:target.y-rest.y*k};let motion=corrections.get(el);
   if(standby||!motion||reduced||el.dataset.actionPlaced==='false'){motion=Object.fromEntries(Object.entries(goal).map(([key,value])=>[key,new V5MotionValue(value)]));corrections.set(el,motion);}
   else for(const [key,value]of Object.entries(goal)){motion[key].step(value,Math.min(delta,.05),20,false);if(!motion[key].at(value,.005,.01))settling=true;}
   record.target={x:before.x*motion.scale.value+motion.x.value,y:before.y*motion.scale.value+motion.y.value,width:before.width*motion.scale.value,height:before.height*motion.scale.value};
  }
  // Device children (standard transition buttons) need compensation after
  // the device transform, so their size follows the reference rather than the
  // phone. Two bounded batches keep DOM/GPU/input in the same geometry.
  const roots=records.filter(r=>!records.some(parent=>parent!==r&&parent.el.contains(r.el))),children=records.filter(r=>!roots.includes(r));
  function applyBatch(batch){const adjustments=[];
   for(const {el,target}of batch){const before=el.getBoundingClientRect();if(Math.abs(target.x-before.x)<.001&&Math.abs(target.y-before.y)<.001&&Math.abs(target.width-before.width)<.001)continue;remember(el);const cs=getComputedStyle(el),old=cs.translate.split(' '),tx=old[0]&&old[0]!=='none'?old[0]:'0px',ty=old[1]||'0px',scale=(parseFloat(cs.scale)||1)*target.width/before.width,parentScale=el.parentElement.getBoundingClientRect().width/el.parentElement.offsetWidth||sceneUnit;adjustments.push({el,target,tx,ty,scale,parentScale});}
   for(const {el,scale}of adjustments)el.style.scale=String(scale);
   const scaled=adjustments.map(r=>r.el.getBoundingClientRect());
   adjustments.forEach(({el,tx,ty,parentScale,target},i)=>{el.style.translate=`calc(${tx} + ${(target.x-scaled[i].x)/parentScale}px) calc(${ty} + ${(target.y-scaled[i].y)/parentScale}px)`;});
  }
  applyBatch(roots);applyBatch(children);
  // Activity renderers update fixed footer parents after the device has moved.
  // Reapply the exact screen target afterwards; do not add a second offset.
  finishActions=()=>{const actions=records.filter(r=>r.el.matches(buttonSelector)&&!host.contains(r.el));applyBatch(actions);for(const {el}of actions)placeTransitionAction(el);};
  maps=records.filter(({el})=>touched.has(el)).map(({el,before})=>({el,before,after:el.getBoundingClientRect()}));
  const containing=el=>maps.filter(m=>m.el===el||m.el.contains(el)).at(-1);
  if(preview&&performance.now()-lastReport>500){lastReport=performance.now();const measuredDevice=records.find(r=>r.el===device)?.el.getBoundingClientRect(),measuredRef=records.find(r=>r.el.matches('.instruction'))?.el.getBoundingClientRect(),measuredIcons=records.filter(r=>r.el.matches('.object[data-object]')).map(r=>r.el.getBoundingClientRect()).sort((a,b)=>a.x-b.x),measuredButton=records.find(r=>r.el.matches(buttonSelector))?.el.getBoundingClientRect(),ratios={};
   if(measuredDevice){const w=relativeUnit;if(measuredIcons.length){ratios.iconWidth=measuredIcons[0].width/w*100;ratios.iconsDeviceGap=(measuredDevice.x-measuredIcons.at(-1).right)/w*100;if(measuredIcons.length>1)ratios.iconGap=(measuredIcons[1].x-measuredIcons[0].right)/w*100;}if(measuredRef){ratios.referenceWidth=measuredRef.width/w*100;ratios.deviceReferenceGap=(measuredRef.x-measuredDevice.right)/w*100;if(measuredButton)ratios.buttonGap=(measuredButton.top-measuredRef.bottom)/w*100;}}
   send({standby,screen,kind,ratios,rects:records.map(({el})=>{const r=el.getBoundingClientRect();return{role:el.matches('.route-phone')?'device':el.matches('.instruction')?'reference':el.matches('.object')?'icons':el.matches('.v5-device-timer')?'timer':el.dataset.idleMission?'missions':el.matches(buttonSelector)?'button':'logo',x:(r.x-a.x)/unit,y:(r.y-a.y)/unit,width:r.width/unit,height:r.height/unit};})});}
  const key=JSON.stringify(v),changed=key!==lastKey;lastKey=key;if(changed||!host.dataset.compositionRevision)host.dataset.compositionRevision=String(++layoutEpoch);
  return{changed:changed||settling,project(el,r){const m=containing(el);if(!m)return r;const px={...r,x:a.x+r.x*sceneUnit,y:a.y+r.y*sceneUnit,w:r.w*sceneUnit,h:r.h*sceneUnit},mapped=affineRect(px,m.before,m.after);return{...mapped,x:(mapped.x-a.x)/sceneUnit,y:(mapped.y-a.y)/sceneUnit,w:mapped.w/sceneUnit,h:mapped.h/sceneUnit};},scale(el){const m=containing(el);return m?m.after.width/m.before.width:1;}};
 }
 layout.before=restore;
 layout.afterActivity=()=>finishActions();
 layout.ready=ready;
 layout.dispose=()=>{disposed=true;transitionControls.dispose();events?.close();restore();clearInterval(timer);window.removeEventListener('message',receive);guides?.remove();};
 window.addEventListener('pagehide',layout.dispose,{once:true});
 return layout;
}
