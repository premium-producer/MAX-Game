// User's Figma reference. Depth is a visual calibration input, not physical millimetres.
export const PANEL_GLASS_REFERENCE=Object.freeze({lightAngleDegrees:-68,lightIntensity:.7,refraction:100,depth:116.91,dispersion:0,frost:0,splay:0});
// A separate user-supplied Figma material for controls, not a panel override.
export const BUTTON_GLASS_REFERENCE=Object.freeze({lightAngleDegrees:-45,lightIntensity:.8,refraction:100,depth:33.47,dispersion:0,frost:56.25,splay:0});
export const MAX_GLASS_CONTROLS=20;
// Project calibration in local design pixels, not a claimed Figma-to-px mapping.
export const BUTTON_GLASS_CALIBRATION=Object.freeze({frostRadius:18,lodMax:5,transmission:.72,violetTint:.24,samples:4});
export const CONTEXT_GLASS_CALIBRATION=Object.freeze({frostRadius:36,uiLodMax:5,otherObjectOpacity:.45});
export const BUTTON_FROST_RADIUS=BUTTON_GLASS_CALIBRATION.frostRadius;
// Four overlapping bilinear footprints on a prefiltered mip, rather than nine
// separated copies of the source. No refraction under matte surfaces. LOD5
// bounds the conservative support to 56 native pixels (inside tile halo64).
export function backdropBlurLod(radius,nativeScale=1){return Math.min(5,Math.max(0,Math.log2(Math.max(1,radius*nativeScale))));}
export const BACKDROP_BLUR_GLSL=`
vec4 backdropBlur(sampler2D image,vec2 uv,float level){
 float l=clamp(level,0.,5.);
 vec2 texel=1./vec2(textureSize(image,0));
 vec2 d=texel*exp2(l)*.25,lo=texel*.5,hi=vec2(1.)-lo;
 return (textureLod(image,clamp(uv+vec2(d.x,d.y),lo,hi),l)
        +textureLod(image,clamp(uv+vec2(-d.x,d.y),lo,hi),l)
        +textureLod(image,clamp(uv+vec2(d.x,-d.y),lo,hi),l)
        +textureLod(image,clamp(uv-vec2(d.x,d.y),lo,hi),l))*.25;
}
`;
// Shared by sharp UI and both optical passes: hidden nodes leave no glass ghost.
export function objectContextPresence(el){
 const object=el?.closest?.('[data-object]'),zone=el?.closest?.('.journey-zone');
 if(!object||!zone)return 1;
 const t=Math.max(0,Math.min(1,Number(zone.dataset?.objectFocus??0))),focus=t;
 const completion=zone.querySelector?.('.field-success');
 if(completion){
  const reveal=Math.max(0,Math.min(1,Number(completion.dataset.popupReveal??1)));
  const caption=el.closest?.('.icon-caption')&&object.dataset.completionCovered==='true';
  const previous=object.dataset?.object===zone.dataset?.focusObject&&!el.closest?.('.icon-caption')?0:focus;
  return 1-Math.max(previous,reveal)*(caption?1:1-CONTEXT_GLASS_CALIBRATION.otherObjectOpacity);
 }
 // A task borrows the existing field tile. Only its caption fades; no second icon.
 if((object.dataset?.object===zone.dataset?.sharedTask||object.dataset?.object===zone.dataset?.focusObject)&&!el.closest?.('.icon-caption'))return 1;
 return 1-focus*(object.dataset?.object===zone.dataset?.focusObject?1:1-CONTEXT_GLASS_CALIBRATION.otherObjectOpacity);
}
export function taskContentPresence(el){
 return el?.closest?.('[data-task-content]')?Number(el.closest('.journey-zone')?.dataset?.contentPresence??1):1;
}
export function glassControlPresence(el,doc){
 const zone=el.closest?.('.journey-zone');
 const retained=zone?.dataset?.uiRetained&&el.closest?.('[data-object]')?.dataset?.object===zone.dataset.uiRetained;
 let opacity=retained?1:Number(zone?.dataset?.uiPresence??1);
 if(el.closest?.('.context-popup,.picker'))opacity*=Number(zone?.dataset?.popupPresence??1);
 opacity*=objectContextPresence(el);
 opacity*=taskContentPresence(el);
 opacity*=Number(el.closest?.('.field-success')?.dataset?.popupReveal??1);
 // Stop at the zone: the invisible DOM root is an input/layout tree, not paint.
 for(let node=el;node;node=node.parentElement){
  const style=doc.defaultView.getComputedStyle(node);
  if(style.display==='none'||style.visibility==='hidden')return 0;
  opacity*=Number(style.opacity??1)*Number(node.dataset?.uiFade??1);
  if(node===zone||!zone)break;
 }
 return Math.max(0,Math.min(1,opacity));
}
// Foreground controls before popup surfaces before world controls. Overlap is
// composited in this order, never by the deepest rounded-box distance.
export function glassLayerPriority(el){
 // The selected picker tile flies above the field, including the fading round
 // next-plus beneath its landing slot. Its Frost must own that whole footprint.
 if(el.closest?.('.picker'))return el.closest('[data-flight-active]')?5:4;
 const popup=el.closest?.('.context-popup,.field-success');
 return popup?(el.matches?.('button')?3:2):1;
}
// A published frame belongs to the same prepared WebGL pose as its glyphs.
// DOM mutations cannot expose partially initialized controls between frames.
const FRAME_KEY='__maxJourneyOpticalFrame';
export function publishGlassFrame(doc,controls){doc[FRAME_KEY]=controls;}
export function clearGlassFrame(doc){delete doc[FRAME_KEY];}
export function readGlassControls(doc,{viewport=false,prepare=false,poses=null}={}){
 if(!prepare&&doc[FRAME_KEY]){
  const controls=doc[FRAME_KEY];if(!viewport)return controls;
  const arena=doc.querySelector('#arena'),frame=arena.getBoundingClientRect();
  const factor=frame.width/doc.defaultView.innerWidth,offsetX=frame.left*4096/doc.defaultView.innerWidth,offsetY=frame.top*4096/doc.defaultView.innerWidth;
  return controls.map(c=>({...c,rect:[c.rect[0]*factor+offsetX,c.rect[1]*factor+offsetY,c.rect[2]*factor,c.rect[3]*factor],radius:c.radius*factor}));
 }
 const arena=doc.querySelector('#arena');if(!arena)return [];
 const frame=arena.getBoundingClientRect(),scale=(viewport?doc.defaultView.innerWidth:frame.width)/4096;if(!(scale>0))return [];
 const origin=viewport?{left:0,top:0}:frame;
 const logicalWidth=parseFloat(arena.style?.width)||4096;
 const radiusScale=viewport?frame.width/logicalWidth/scale:4096/logicalWidth;
 const selectors='.mission-choices button,.inventory b,.back,.tools button,.repeat,.branches button,.journey-zone .glass-control,.journey-zone .pill';
 return [...doc.querySelectorAll(selectors)].filter(el=>{
  const zone=el.closest?.('.journey-zone'),overlay=zone?.querySelector?.('.task-cover,.reset-cover');
  return !overlay||overlay.contains(el);
 }).sort((a,b)=>glassLayerPriority(b)-glassLayerPriority(a)).map(el=>{
  const pose=poses?.get(el),r=pose?null:el.getBoundingClientRect(),style=doc.defaultView.getComputedStyle(el);
  const rect=pose?[pose.x*4096/logicalWidth,pose.y*4096/logicalWidth,pose.w*4096/logicalWidth,pose.h*4096/logicalWidth]:[(r.left-origin.left)/scale,(r.top-origin.top)/scale,r.width/scale,r.height/scale];
  const raw=style.borderTopLeftRadius;
  const motionScale=el.offsetWidth?(pose?pose.w/el.offsetWidth:r.width/(el.offsetWidth*frame.width/logicalWidth)):1;
  const radius=Math.min(rect[2]/2,rect[3]/2,raw.includes('%')?rect[3]*parseFloat(raw)/100:(parseFloat(raw)||0)*radiusScale*motionScale);
  return {rect,radius,blurScale:el.matches?.('.instruction,.field-success')?CONTEXT_GLASS_CALIBRATION.frostRadius/BUTTON_FROST_RADIUS:1,opacity:glassControlPresence(el,doc)*(el.closest('button')?.disabled? .25:1)};
 }).filter(c=>c.opacity>.001&&c.rect.every(Number.isFinite)&&c.rect[2]>0&&c.rect[3]>0).slice(0,MAX_GLASS_CONTROLS);
}
export function panelOptics(width){
 const scale=4096/width;
 return {blur:0,shift:Math.min(72,56*scale)}; // Clear refraction, 8 native pixels left inside halo64.
}

// Finite squircle bezel from the surface-profile approach described by kube:
// https://kube.io/blog/liquid-glass-css-svg/ (math, independently implemented).
// Critical: bevel < corner radius. Normals must reach the flat face BEFORE the
// rounded-box distance field's medial axis, where nearest-edge direction flips.
export const PANEL_RADIUS=56;
export const PANEL_BEZEL=48;
// Face magnification is an explicit screen-space lens, separate from Snell's
// edge refraction. See ybouane/liquidglass shaders.ts dome mode (not vendored).
export const PANEL_MAGNIFICATION=1.08;
export const PANEL_OPTICS_GLSL=`
uniform float uPaneRadius,uPaneBezel;
vec3 panelSurface(vec2 p,vec4 b,out float distance,out float height){
 vec2 local=p-b.xy-b.zw*.5;
 vec2 outside=max(abs(local)-(b.zw*.5-uPaneRadius),0.);
 vec2 delta=abs(local)-(b.zw*.5-uPaneRadius);
 distance=length(outside)+min(max(delta.x,delta.y),0.)-uPaneRadius;
 float t=clamp(-distance/uPaneBezel,0.,1.);
 float k=1.-t,k2=k*k,k4=k2*k2;
 height=pow(max(0.,1.-k4),.25);
 // Analytic derivative of h(t)=(1-(1-t)^4)^.25 without infinity at t=0.
 vec2 outward=sign(local)*outside/max(length(outside),.0001);
 return normalize(vec3(outward*k*k2,pow(max(0.,1.-k4),.75)));
}
vec2 panelRayShift(vec3 normal,float height,float ior,float depth,float limit,vec2 local,float inside){
 vec3 ray=refract(vec3(0.,0.,-1.),normal,1./ior);
 vec2 shift=ray.xy/max(-ray.z,.001)*(depth+uPaneBezel*height);
 shift-=local*${1-1/1.08}*smoothstep(0.,uPaneBezel,inside)*clamp((ior-1.)/.46,0.,1.);
 return shift/sqrt(1.+dot(shift,shift)/(limit*limit));
}
`;

// CPU reference for continuity, symmetry and tile-support regression checks.
export function panelSample(p,b,{width=4096,ior=1.46,depth=PANEL_GLASS_REFERENCE.depth}={}){
 const local=p.map((v,i)=>v-b[i]-b[i+2]/2);
 const delta=local.map((v,i)=>Math.abs(v)-(b[i+2]/2-PANEL_RADIUS));
 const outside=delta.map(v=>Math.max(0,v)),length=Math.hypot(...outside);
 const distance=length+Math.min(Math.max(...delta),0)-PANEL_RADIUS;
 const t=Math.max(0,Math.min(1,-distance/PANEL_BEZEL)),k=1-t,a=Math.max(0,1-k**4),height=a**.25;
 const n=[...local.map((v,i)=>Math.sign(v)*outside[i]/Math.max(length,.0001)*k**3),a**.75];
 const norm=Math.hypot(...n),normal=n.map(v=>v/norm),eta=1/ior;
 const nz=normal[2],f=eta*nz-Math.sqrt(1-eta*eta*(1-nz*nz));
 const ray=[f*normal[0],f*normal[1],-eta+f*nz];
 const face=t*t*(3-2*t)*(1-1/PANEL_MAGNIFICATION)*Math.max(0,Math.min(1,(ior-1)/.46));
 const raw=ray.slice(0,2).map((v,i)=>v/Math.max(-ray[2],.001)*(depth+PANEL_BEZEL*height)-local[i]*face);
 const limit=panelOptics(width).shift,denom=Math.sqrt(1+(Math.hypot(...raw)/limit)**2);
 return {distance,normal,shift:raw.map(v=>v/denom),height};
}
