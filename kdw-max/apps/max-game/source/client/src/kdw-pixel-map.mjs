// PDF «Маска»: 12×6 cabinets,256px. Blue flat section is the touch surface.
// PORTRAIT-LAYOUT-C: the new stand is one vertical 1080×1920 touch panel, the
// whole surface accepts touch. Selected by ?display=portrait, landscape stays default.
export const PIXEL_MAP_PROFILES=Object.freeze({
 landscape:Object.freeze({name:'landscape',width:3072,height:1536,left:560,gameWidth:1760,right:752,safeFraction:.07}),
 portrait:Object.freeze({name:'portrait',width:1080,height:1920,left:0,gameWidth:1080,right:0,safeFraction:.04})
});
const initialProfile=typeof location!=='undefined'&&new URLSearchParams(location.search).get('display')==='portrait'?'portrait':'landscape';
export let PIXEL_MAP=PIXEL_MAP_PROFILES[initialProfile];
export function selectPixelMapProfile(name){PIXEL_MAP=PIXEL_MAP_PROFILES[name]??PIXEL_MAP_PROFILES.landscape;return PIXEL_MAP;}
export const pixelMapPortrait=()=>PIXEL_MAP.name==='portrait';
export function pixelMapEnabled(params){return params.get('view')==='pixel-map';}
export function pixelMapViewport(width,height){
 const P=PIXEL_MAP,f=P.safeFraction;
 const scale=Math.min(width/P.width,height/P.height),left=(width-P.width*scale)/2,top=(height-P.height*scale)/2;
 const touch={left:left+P.left*scale,top,width:P.gameWidth*scale,height:P.height*scale};touch.right=touch.left+touch.width;touch.bottom=touch.top+touch.height;
 const safe={left:touch.left+touch.width*f,top:touch.top+touch.height*f,width:touch.width*(1-2*f),height:touch.height*(1-2*f)};safe.right=safe.left+safe.width;safe.bottom=safe.top+safe.height;
 return{scale,left,top,width:P.width*scale,height:P.height*scale,touch,safe};
}
export function createPixelMapPlan(catalog,measureDevice){
 const screens=Object.values(catalog.tasks).flatMap(t=>Object.values(t.screens));
 const widest=Math.max(392,...screens.map(s=>measureDevice({kind:s.deviceKind,asset:catalog.assets[s.assetId]}).width));
 if(pixelMapPortrait()){
  // Variant C: the scene is sized for the phone (800 units high) at ~1.24 px per
  // unit, so the phone is ~1.3× larger than in the landscape stand (~487×994 px).
  // A wider PC screen is fitted by the composition, not by shrinking the scene.
  const P=PIXEL_MAP,f=P.safeFraction,gameWidth=800,gameHeight=1400;
  const scale=Math.min(P.gameWidth*(1-2*f)/gameWidth,P.height*(1-2*f)/gameHeight),width=P.width/scale,height=P.height/scale;
  const w=P.gameWidth*(1-2*f)/scale,h=P.height*(1-2*f)/scale;
  return{width,height,scale,zone:{left:(P.left+P.gameWidth*f)/scale,top:(height-h)/2,w,h},portrait:true};
 }
 // Reserve the device and reference only. Route history is allowed to leave left.
 const gameWidth=Math.ceil(Math.max(2048,widest+760+64+64)/64)*64,gameHeight=1280;
 const scale=Math.min(1760*.86/gameWidth,1536*.86/gameHeight),width=3072/scale,height=1536/scale;
 const zone={left:(560+1760*.07)/scale,top:(height-gameHeight)/2,w:gameWidth,h:gameHeight};
 return{width,height,scale,zone};
}
export function pixelIdleLayout(zone){
 if(zone.h>zone.w)return portraitIdleLayout(zone);
 // One composition: brand above, landscape video left, missions in reading
 // order in a 2×2 grid right. All coordinates remain in the shared safe zone;
 // the renderer and pointer targets consume exactly the same icon positions.
 const iconSize=200,gap=64,logoWidth=560,logoHeight=logoWidth*140/440.4539794921875;
 const videoWidth=zone.w*.65,videoHeight=videoWidth*550/960;
 const gridLeft=videoWidth+80,gridWidth=zone.w-gridLeft,cellWidth=gridWidth/2;
 const gridHeight=2*(iconSize+96)+gap;
 const bodyHeight=Math.max(videoHeight,gridHeight),headingGap=100;
 const top=(zone.h-logoHeight-headingGap-bodyHeight)/2,bodyTop=top+logoHeight+headingGap;
 return{centre:{x:zone.w/2,y:zone.h/2},gap,iconSize,rowShift:0,
  missionOrder:['digital-id','business','blogger','communication'],
  logo:{x:(zone.w-logoWidth)/2,y:top,width:logoWidth,height:logoHeight},
  video:{x:0,y:bodyTop+(bodyHeight-videoHeight)/2,width:videoWidth,height:videoHeight},
  icons:Array.from({length:4},(_,i)=>({
   x:gridLeft+cellWidth*(i%2+.5)-iconSize/2,
   y:bodyTop+(bodyHeight-gridHeight)/2+Math.floor(i/2)*(iconSize+96+gap)
  }))};
}
// Vertical stand menu, as on the stand render: logo and banner video on top,
// the four missions in a 2×2 grid within arm's reach (0.9–1.8 m, 23.6–72.1% of
// the zone height), the grid's lower captions ending at the lower edge.
// Same mission order and icon size as landscape. Self-contained for the preview.
export function portraitIdleLayout(zone){
 const iconSize=200,gap=64,cellWidth=zone.w/2,gridHeight=2*(iconSize+96)+gap;
 const gridTop=Math.max(zone.h*.236,zone.h*.721-gridHeight);
 const logoWidth=Math.min(360,zone.w*.45),logoHeight=logoWidth*140/440.4539794921875,videoTop=logoHeight+40;
 const videoHeight=Math.max(0,gridTop-48-videoTop),videoWidth=Math.min(zone.w,videoHeight*960/550);
 return{centre:{x:zone.w/2,y:zone.h/2},gap,iconSize,rowShift:0,
  missionOrder:['digital-id','business','blogger','communication'],
  logo:{x:(zone.w-logoWidth)/2,y:0,width:logoWidth,height:logoHeight},
  video:{x:(zone.w-videoWidth)/2,y:videoTop,width:videoWidth,height:videoWidth*550/960},
  icons:Array.from({length:4},(_,i)=>({x:cellWidth*(i%2+.5)-iconSize/2,y:gridTop+Math.floor(i/2)*(iconSize+96+gap)}))};
}
export function pixelActivityViewport(){
 if(typeof document==='undefined'||document.documentElement.dataset.pixelMap!=='true')return null;
 return pixelMapViewport(innerWidth,innerHeight).safe;
}
// Moving cards keep the horizontal safe zone, but enter/leave at the physical
// display edges. The inset safe rectangle is for layout, not a vertical mask.
export function pixelFlowViewport(width,height){
 const {safe,touch}=pixelMapViewport(width,height);
 return {...safe,top:touch.top,bottom:touch.bottom,height:touch.height};
}
let keyboardLayout={};
export function setKeyboardLayout(value){keyboardLayout=value??{};}
export function alignPixelKeyboard(node){
 if(!node)return false;
 node.style.setProperty('--kdw-keyboard-width',keyboardLayout.width??1);node.style.setProperty('--kdw-keyboard-height',keyboardLayout.height??1);
 const area=pixelActivityViewport(),unit=Math.min(innerWidth/PIXEL_MAP.width,innerHeight/PIXEL_MAP.height),x=(keyboardLayout.x??0)*unit,y=(keyboardLayout.y??0)*unit;
 if(!area){node.style.left=`calc(50% + ${x}px)`;node.style.bottom=-y+'px';return false;}
 // Lift the four key rows under the route icons instead of anchoring them
 // to the lower safe edge; lift by another 15% of the safe height on all walls.
 // Portrait: the keys end at the lower edge of arm's reach (0.9 m, 72.1% of the safe height).
 const portrait=pixelMapPortrait(),lift=portrait?area.height*(1-.721):area.height*.23;
 Object.assign(node.style,{left:((area.left+area.right)/2+x)+'px',top:'auto',bottom:(innerHeight-area.bottom+lift-y)+'px'});
 node.style.setProperty('--kdw-scale',portrait?Math.min(area.width/1600,area.height*.24/900):Math.min(area.width/1600,area.height/900));return true;
}
// Variant C as in the brief: a compact reference (no eyebrow, smaller type, height
// by content) and task icons without captions, so the phone sits higher.
export const PORTRAIT_CSS=`html[data-pixel-map-profile=portrait] #circles .task-dialog .instruction{height:auto!important;padding:28px 36px!important;gap:10px!important}
html[data-pixel-map-profile=portrait] #circles .task-dialog .instruction .eyebrow{display:none!important}
html[data-pixel-map-profile=portrait] #circles .task-dialog .instruction h2{font-size:38px!important;line-height:1.1!important}
html[data-pixel-map-profile=portrait] #circles .task-dialog .instruction p{font-size:27px!important;line-height:1.2!important}
html[data-pixel-map-profile=portrait] #circles .object[data-object] .icon-caption{display:none!important}`;
export function installPixelMapInput(){
 const root=document.documentElement;root.dataset.pixelMap='true';root.dataset.pixelMapProfile=PIXEL_MAP.name;let ignored=0;
 if(PIXEL_MAP.name==='portrait'&&!document.getElementById('kdw-portrait-style')){const style=document.createElement('style');style.id='kdw-portrait-style';style.textContent=PORTRAIT_CSS;document.head.append(style);}
 const reject=e=>{
  const rect=pixelMapViewport(innerWidth,innerHeight).touch;
  let x=e.clientX,y=e.clientY;
  if(e.type==='click'&&e.detail===0){const r=e.target?.getBoundingClientRect?.();if(!r)return;x=r.x+r.width/2;y=r.y+r.height/2;}
  if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom)return;
  if(e.type==='pointerdown')root.dataset.pixelMapIgnoredTouches=String(++ignored);
  e.preventDefault();e.stopImmediatePropagation();
  if(e.type.startsWith('pointer'))e.target?.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:e.pointerId}));
  window.dispatchEvent(new Event('max-service-pointer-cancel'));
 };
 const types=['pointerdown','pointermove','pointerup','click'];for(const type of types)document.addEventListener(type,reject,true);
 return()=>{for(const type of types)document.removeEventListener(type,reject,true);delete root.dataset.pixelMap;delete root.dataset.pixelMapProfile;};
}
export function installPixelMapDebug(){
 const node=document.createElement('div');node.dataset.pixelMapCalibration='';node.setAttribute('aria-hidden','true');
 node.style.cssText='position:fixed;inset:0;z-index:100000;pointer-events:none';document.body.append(node);
 const draw=()=>{const v=pixelMapViewport(innerWidth,innerHeight),r=v.touch,s=v.safe;node.innerHTML=`<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect x="${v.left}" y="${v.top}" width="${v.width}" height="${v.height}" fill="none" stroke="#39ff14" stroke-width="2"/><rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" fill="none" stroke="#00bfff" stroke-width="3"/><rect x="${s.left}" y="${s.top}" width="${s.width}" height="${s.height}" fill="none" stroke="#ffdb29" stroke-dasharray="16 10" stroke-width="3"/><text x="${s.left+12}" y="${s.top+35}" fill="white" font-size="24">${PIXEL_MAP.width}×${PIXEL_MAP.height} · ${PIXEL_MAP.name} · safe${(s.width/v.scale).toFixed(1)}×${(s.height/v.scale).toFixed(1)} · ${PIXEL_MAP.safeFraction*100}%</text></svg>`;};
 draw();addEventListener('resize',draw);return()=>{removeEventListener('resize',draw);node.remove();};
}
