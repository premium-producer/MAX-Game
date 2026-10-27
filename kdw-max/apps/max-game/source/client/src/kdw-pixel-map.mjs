// PDF «Маска»: 12×6 cabinets,256px. Blue flat section is the touch surface.
export const PIXEL_MAP=Object.freeze({width:3072,height:1536,left:560,gameWidth:1760,right:752,safeFraction:.07});
export function pixelMapEnabled(params){return params.get('view')==='pixel-map';}
export function pixelMapViewport(width,height){
 const scale=Math.min(width/PIXEL_MAP.width,height/PIXEL_MAP.height),left=(width-PIXEL_MAP.width*scale)/2,top=(height-PIXEL_MAP.height*scale)/2;
 const touch={left:left+560*scale,top,width:1760*scale,height:1536*scale};touch.right=touch.left+touch.width;touch.bottom=touch.top+touch.height;
 const safe={left:touch.left+touch.width*.07,top:touch.top+touch.height*.07,width:touch.width*.86,height:touch.height*.86};safe.right=safe.left+safe.width;safe.bottom=safe.top+safe.height;
 return{scale,left,top,width:3072*scale,height:1536*scale,touch,safe};
}
export function createPixelMapPlan(catalog,measureDevice){
 const screens=Object.values(catalog.tasks).flatMap(t=>Object.values(t.screens));
 const widest=Math.max(392,...screens.map(s=>measureDevice({kind:s.deviceKind,asset:catalog.assets[s.assetId]}).width));
 // Reserve the device and reference only. Route history is allowed to leave left.
 const gameWidth=Math.ceil(Math.max(2048,widest+760+64+64)/64)*64,gameHeight=1280;
 const scale=Math.min(1760*.86/gameWidth,1536*.86/gameHeight),width=3072/scale,height=1536/scale;
 const zone={left:(560+1760*.07)/scale,top:(height-gameHeight)/2,w:gameWidth,h:gameHeight};
 return{width,height,scale,zone};
}
export function pixelIdleLayout(zone){
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
export function alignPixelKeyboard(node){
 const area=pixelActivityViewport();if(!node||!area)return false;
 // Lift the four key rows under the route icons instead of anchoring them
 // to the lower safe edge; keep the same proportional inset on scaled walls.
 Object.assign(node.style,{left:((area.left+area.right)/2)+'px',top:'auto',bottom:(innerHeight-area.bottom+area.height*.08)+'px'});
 node.style.setProperty('--kdw-scale',Math.min(area.width/1600,area.height/900));return true;
}
export function installPixelMapInput(){
 const root=document.documentElement;root.dataset.pixelMap='true';let ignored=0;
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
 return()=>{for(const type of types)document.removeEventListener(type,reject,true);delete root.dataset.pixelMap;};
}
export function installPixelMapDebug(){
 const node=document.createElement('div');node.dataset.pixelMapCalibration='';node.setAttribute('aria-hidden','true');
 node.style.cssText='position:fixed;inset:0;z-index:100000;pointer-events:none';document.body.append(node);
 const draw=()=>{const v=pixelMapViewport(innerWidth,innerHeight),r=v.touch,s=v.safe;node.innerHTML=`<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect x="${v.left}" y="${v.top}" width="${v.width}" height="${v.height}" fill="none" stroke="#39ff14" stroke-width="2"/><rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" fill="none" stroke="#00bfff" stroke-width="3"/><rect x="${s.left}" y="${s.top}" width="${s.width}" height="${s.height}" fill="none" stroke="#ffdb29" stroke-dasharray="16 10" stroke-width="3"/><text x="${s.left+12}" y="${s.top+35}" fill="white" font-size="24">3072×1536 · центр1760 · safe1513.6×1320.96 · 7%</text></svg>`;};
 draw();addEventListener('resize',draw);return()=>{removeEventListener('resize',draw);node.remove();};
}
