import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {JourneyFiberGlass} from './journey-fiber-glass.mjs';
import {JourneyContextGlass} from './journey-context-glass.mjs';
import {MotionRegistry,MotionValue} from './journey-motion.mjs';
import {JourneyIntroBurst} from './journey-intro-burst.mjs';
import {networkBackTarget,networkBackLimits,constrainBackMotion} from './journey-network-nav.mjs';
import {INTERACTION_BAND} from './circle-model.mjs';
import {JourneyTransition} from './journey-transition.mjs';
import {RouteReconnect} from './journey-reconnect.mjs';
import {PopupFocus,InstructionMotion,TaskContentTransition,joinTaskContentCommit} from './journey-popup-motion.mjs';
import {V5DeviceMorph} from './journey-v5-device-morph.mjs';
import {objectContextPresence,glassControlPresence,taskContentPresence,readGlassControls,publishGlassFrame,clearGlassFrame} from '../../service/public/max-panel-optics.js';
import {scenePose,projectBounds} from './journey-scene-pose.mjs';
import {REVEAL_MOTION} from './journey-guided-reveal.mjs';
import {prepareReferenceFrame,ReferenceStartTrace} from './journey-reference-frame.mjs';
import {paintBfmTile,createBfmGradientMap} from './journey-bfm-tile-paint.mjs';
import {paintBfmPhone,BFM_PHONE_LIGHT_PAD} from './journey-bfm-device-paint.mjs';
import {enableV5Inertia,V5_INERTIA,V5MotionValue,v5InstructionTop} from './journey-v5-inertia.mjs';
import {yieldToBrowser,withTimeout} from './asset-preparation.mjs';

// DOM is a layout/accessibility tree only. Every visible primitive is rendered by
// the existing game's WebGL context; text textures are rebuilt only on UI changes.
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`varying vec2 vUv;uniform vec2 size;uniform float radius,fill,clock,energy,alpha,dark,selection,scan,scanProgress,deviceFrame,contentProgress,contentActive,referenceRole;
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){vec2 p=(vUv-.5)*(size+24.);float d=box(p,size*.5,radius);
float inside=1.-smoothstep(-.7,.7,d);float rim=exp(-abs(d)*1.6);
float glow=exp(-max(d,0.)*.25)*(1.-inside)*(.12+energy*.32);
vec3 violet=vec3(.431,.102,1.);vec3 blue=vec3(.278,.102,1.);
vec3 body=mix(blue,violet,.5+.5*sin(vUv.x*3.+vUv.y*2.+clock*.45));
body=mix(body,vec3(.051,0.,.102),dark);
float light=.3+.7*pow(max(0.,dot(normalize(p+vec2(.001)),normalize(vec2(-.7,1.)))),2.);
float selectedEdge=selection*exp(-abs(d)*.85);
vec3 c=mix(body,vec3(1.),rim*light*.55);c=mix(c,mix(violet,vec3(1.),.78),selectedEdge);
float a=inside*fill+rim*(.16+energy*.35)+glow+selectedEdge*.85+selection*exp(-max(d,0.)*.5)*(1.-inside)*.18;
float angle=fract(atan(p.x,p.y)/6.2831853+.5);
float pulse=pow(max(0.,1.-abs(fract(angle-clock*.22)-.5)*2.),14.);
float scanRim=scan*exp(-abs(d)*.8)*max(pulse*.65,step(angle,scanProgress));
c=mix(c,vec3(1.),scanRim);a+=scanRim;
float deviceArrival=smoothstep(.08,.82,alpha);
float deviceRim=deviceFrame*deviceArrival*exp(-abs(d)*.85);
float deviceHalo=deviceFrame*deviceArrival*exp(-max(d,0.)*.24)*(1.-inside)*.22;
c=mix(c,vec3(.12,.78,1.),clamp(deviceRim+deviceHalo,0.,1.));c=mix(c,vec3(1.),deviceRim*.35);a+=deviceRim*.8+deviceHalo;
float edgeAngle=fract(atan(p.y/size.y,p.x/size.x)/6.2831853+.5);
float edgeDistance=abs(edgeAngle-contentProgress);
edgeDistance=min(edgeDistance,1.-edgeDistance);
float edgeEnvelope=smoothstep(0.,.12,contentProgress)*(1.-smoothstep(.88,1.,contentProgress));
float edgeWave=contentActive*edgeEnvelope*exp(-pow(edgeDistance/.23,2.));
float softRim=edgeWave*exp(-abs(d)*.11);
float softHalo=edgeWave*exp(-max(d,0.)*.045)*(1.-inside);
vec3 edgeColor=mix(vec3(.26,.77,1.),vec3(.72,.54,1.),.5+.5*sin(edgeAngle*6.2831853));
c=mix(c,mix(edgeColor,vec3(1.),.28),clamp(softRim*.30,0.,1.));
a+=softRim*.24+softHalo*.08;
if(referenceRole>.5){
 if(referenceRole<1.5){
  float t=clamp(vUv.x*.70+(1.-vUv.y)*.42,0.,1.);
  c=mix(vec3(0.,.75,1.),vec3(.278,.102,1.),smoothstep(0.,.55,t));
  c=mix(c,vec3(.583,0.,1.),smoothstep(.48,1.,t));
  c+=vec3(.15)*exp(-length((vUv-vec2(.25,.8))*vec2(2.,3.))*2.);
  a=inside*.98+rim*.15+glow*.4+selectedEdge*.4;
 }else if(referenceRole<2.5){
  float lightPool=exp(-length((vUv-vec2(.80,.10))*vec2(2.,2.7))*2.);
  c=mix(vec3(.06,.025,.13),vec3(.43,.10,.95),lightPool*.95);a=inside*.86+rim*.12;
 }else if(referenceRole<3.5){c=vec3(.055,.026,.12);a=inside*.96+rim*.10;}
 else{c=mix(vec3(.04,.65,.98),vec3(.25,.3,.98),vUv.x*.6);a=inside*.88+rim*.16;}
}
gl_FragColor=vec4(c,clamp(a*alpha,0.,1.));
#ifdef BFM_COLOR_MANAGED
// This UI palette is authored in display sRGB. Keep intermediate targets linear;
// Three selects the output transfer for the current render destination.
gl_FragColor=sRGBTransferEOTF(gl_FragColor);
#include <colorspace_fragment>
#endif
}`;
const surfaceSelector='.cta-orb,.tile,.badge,.medallion,.pill,.mission-card,.instruction,.reset-popup,.field-success,.demo-app,.phone-camera,.phone-home,.app-progress i';
const movingSelector='button,.attract-icons>.tile,.context-popup,.field-success,.task-dialog .instruction,.route-phone,[data-task-content]';

// Range rectangles describe CSS line boxes; the painted glyphs can extend past
// them. Include both measurements so long Cyrillic headings are never cropped.
export function webglTextRasterBounds(metrics,width,height){
 const left=-Math.max(0,metrics.actualBoundingBoxLeft??0)-4;
 const right=Math.max(width,metrics.width,metrics.actualBoundingBoxRight??0)+4;
 const top=-Math.max(height/2,metrics.actualBoundingBoxAscent??0)-4;
 const bottom=Math.max(height/2,metrics.actualBoundingBoxDescent??0)+4;
 return {left,top,width:right-left,height:bottom-top};
}

export function createJourneyWebGLUI({root,arena,getSize,onMotion,onFrame,startup=null,gradients=null}){
 const referenceVisual=document.documentElement.dataset.visual==='reference';
 const bfmVisual=document.documentElement.dataset.visual==='webgl-bfm-v5';
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,1,-10,10);
 const fiberGlass=new JourneyFiberGlass(getSize),contextGlass=new JourneyContextGlass();
 const introBurst=new JourneyIntroBurst();
 const plane=new THREE.PlaneGeometry(1,1),svgLoader=new SVGLoader();
 const cache=new Map(),births=new WeakMap(),flights=new Map(),rotatingMaps=new Map();let groups=new Map();
 const textMeasure=document.createElement('canvas').getContext('2d');
 const warmPhoneImages=new Map(),warmPhoneUploads=new Map();let warmPhoneKeys=new Set();
 const uploadedPhoneTextures=new WeakSet(),failedPhoneTextures=new WeakSet();
 const startupTextureKeys=new Set(),startupProgramPins=[];let captureStartup=false;
 const transitions=new Map(),reconnections=new Map();
 const contentTransitions=new Map(),instructionMotions=new Map(),focusMotions=new WeakMap();
 const feedbacks=new Map(),motions=new MotionRegistry(),vectorCache=new Map();
 const pendingParts=new Set();let partsDirty=false;
 const retiredMaterials=[];
 const poses=new WeakMap();let retained=new Set(),previousGroups=new Map();
 const navigation=new WeakMap();
 const targets=new WeakMap();
 const referenceOffsets=new WeakMap();let referenceClock=0;
 const referenceTrace=referenceVisual&&new URLSearchParams(location.search).get('motion-debug')==='1'?new ReferenceStartTrace():null;
 const sizeSnapHosts=new Set();
 let finished=[];
 let dirty=true,disposed=false,time=0,order=0,materials=[],geometry=[],used=new Set();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 publishGlassFrame(document,[]);
 const rect=el=>{const a=arena.getBoundingClientRect(),r=el.getBoundingClientRect(),scale=a.width/getSize().width;return{x:(r.left-a.left)/scale,y:(r.top-a.top)/scale,w:r.width/scale,h:r.height/scale};};
 // Only cache sizes: avoid float noise from arena scale changing a warm key.
 const cachePixels=value=>bfmVisual?Math.round(value*64)/64:value;
 function texture(key,draw,w,h,scale=2){
  if(captureStartup)startupTextureKeys.add(key);
  used.add(key);if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(w*scale));canvas.height=Math.max(1,Math.ceil(h*scale));
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);draw(ctx);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  cache.set(key,tex);return tex;
 }
 const idTextureKey=src=>`${new URL(src,document.baseURI).href}:360:800:2:0:false`;
 function add(mesh,parent,x,y,w,h){mesh.position.set(x+w/2,y+h/2,0);mesh.scale.set(w,h,1);mesh.renderOrder=order++;mesh.frustumCulled=false;parent.add(mesh);return mesh;}
 function basic(map,opacity=1){const m=new THREE.MeshBasicMaterial({map,transparent:true,opacity,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});materials.push(m);return m;}
 function surface(el,r,parent,origin,opacity){
  const cs=getComputedStyle(el),radius=Math.min(parseFloat(cs.borderTopLeftRadius)||0,r.w/2,r.h/2);
  if(bfmVisual&&el.matches('.demo-app')){
   const pad=BFM_PHONE_LIGHT_PAD,w=r.w+pad*2,h=r.h+pad*2;
   const map=texture(`bfm-phone:${cachePixels(r.w)}:${cachePixels(r.h)}:${cachePixels(radius)}`,c=>paintBfmPhone(c,r.w,r.h,radius),w,h);
   const material=basic(map,opacity);material.userData.deviceShell=true;
   const mesh=add(new THREE.Mesh(plane,material),parent,r.x-origin.x-pad,r.y-origin.y-pad,w,h);
   mesh.scale.y=-h;return;
  }
  if(bfmVisual&&el.matches('.tile,.medallion')){
   const map=texture(`bfm-tile:${cachePixels(r.w)}:${cachePixels(r.h)}:${gradients?0:cachePixels(radius)}`,c=>paintBfmTile(c,r.w,r.h,gradients?0:radius),r.w,r.h);
   const material=basic(map,opacity);
   if(gradients){
    const owner=el.closest('[data-object],[data-route-next],[data-mission]'),id=owner?.dataset.object||owner?.dataset.routeNext||owner?.dataset.mission||'palm';
    const key=`${id}:${cachePixels(r.w)}:${cachePixels(r.h)}`;
    if(!rotatingMaps.has(key))rotatingMaps.set(key,createBfmGradientMap(map));
    material.map=rotatingMaps.get(key);material.map.rotation=gradients.angle(id);material.userData.gradientId=id;
    material.alphaMap=texture(`bfm-clip:${cachePixels(r.w)}:${cachePixels(r.h)}:${cachePixels(radius)}`,c=>{c.fillStyle='#000';c.fillRect(0,0,r.w,r.h);c.fillStyle='#fff';c.beginPath();c.roundRect(0,0,r.w,r.h,radius);c.fill();},r.w,r.h);
   }
   const mesh=add(new THREE.Mesh(plane,material),parent,r.x-origin.x,r.y-origin.y,r.w,r.h);
   mesh.scale.y=-r.h;el.dataset.v5Paint='native-radial';return;
  }
  const optical=el.matches('.glass-control,.pill'),cover=el.matches('.task-cover,.reset-cover');
  const fill=el.matches('.field-success')?.30:el.matches('.demo-app')?.98:el.matches('.reset-popup')?.9:cover?.15:optical?.035:.7;
  const mat=new THREE.ShaderMaterial({defines:bfmVisual?{BFM_COLOR_MANAGED:1}:{},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,uniforms:{size:{value:new THREE.Vector2(r.w,r.h)},radius:{value:radius},fill:{value:fill},clock:{value:time},energy:{value:0},alpha:{value:opacity}}});
  mat.uniforms.referenceRole={value:(referenceVisual||bfmVisual)?(el.matches('.tile,.medallion')?1:el.matches('.instruction,.field-success,.mission-card')?2:el.matches('.demo-app')?3:el.matches('.pill')?4:0):0};
  mat.uniforms.dark={value:el.matches('.field-success')?.65:el.matches('.demo-app,.phone-camera')?.96:0};
  mat.uniforms.selection={value:0};
  mat.uniforms.deviceFrame={value:!referenceVisual&&!bfmVisual&&el.matches('.demo-app')&&document.documentElement.dataset.experiment==='guided'?1:0};
  mat.userData.deviceShell=el.matches('.demo-app');
  mat.uniforms.contentProgress={value:0};mat.uniforms.contentActive={value:0};
  mat.uniforms.scan={value:el.closest('[data-palm]')?1:0};mat.uniforms.scanProgress={value:0};
  materials.push(mat);add(new THREE.Mesh(plane,mat),parent,r.x-origin.x-12,r.y-origin.y-12,r.w+24,r.h+24);
 }
 function text(node,parent,origin,opacity){
  if(!node.textContent.trim())return;const style=getComputedStyle(node.parentElement),a=arena.getBoundingClientRect(),scale=a.width/getSize().width;
  const range=document.createRange(),lines=[];let line;
  // Browser line wrapping remains the authoritative geometry, including Cyrillic.
  for(let j=0;j<node.length;j++){range.setStart(node,j);range.setEnd(node,j+1);const r=range.getBoundingClientRect();if(!r.width&&!r.height||!r.width&&/\s/u.test(node.textContent[j]))continue;
   if(!line||Math.abs(line.top-r.top)>2*scale){line={top:r.top,left:r.left,right:r.right,height:r.height,text:''};lines.push(line);}
   line.text+=node.textContent[j];line.right=Math.max(line.right,r.right);
  }
  for(const l of lines){const font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
   textMeasure.font=font;textMeasure.textBaseline='middle';if('letterSpacing'in textMeasure)textMeasure.letterSpacing=style.letterSpacing;
   const raster=webglTextRasterBounds(textMeasure.measureText(l.text),(l.right-l.left)/scale,l.height/scale);
   const w=cachePixels(raster.width),h=cachePixels(raster.height);
   const key=JSON.stringify([l.text,font,style.color,style.letterSpacing,w,h]);
   const map=texture(key,c=>{c.font=font;c.fillStyle=style.color;c.textBaseline='middle';if('letterSpacing'in c)c.letterSpacing=style.letterSpacing;c.fillText(l.text,-raster.left,-raster.top);},w,h);
   // Orthographic Y grows down; flip plane UV to keep canvas text upright.
   const mesh=add(new THREE.Mesh(plane,basic(map,opacity)),parent,(l.left-a.left)/scale-origin.x+raster.left,(l.top-a.top+l.height/2)/scale-origin.y+raster.top,w,h);mesh.scale.y=-h;
   mesh.userData.textRun=l.text;
  }
 }
 function vector(el,r,parent,origin,opacity){
  const serialized=new XMLSerializer().serializeToString(el).replaceAll('currentColor',getComputedStyle(el).color);
  let shapes=vectorCache.get(serialized);
  if(!shapes){shapes=[];for(const path of svgLoader.parse(serialized).paths)for(const shape of path.toShapes())shapes.push(new THREE.ShapeGeometry(shape,10));vectorCache.set(serialized,shapes);}
  const view=el.viewBox.baseVal,sx=r.w/(view.width||64),sy=r.h/(view.height||64);
  for(const geo of shapes){
   const mat=basic(null,opacity);mat.color.set(getComputedStyle(el).color);const mesh=new THREE.Mesh(geo,mat);
   mesh.position.set(r.x-origin.x,r.y-origin.y,0);mesh.scale.set(sx,sy,1);mesh.renderOrder=order++;mesh.frustumCulled=false;parent.add(mesh);
  }
 }
 function motionId(el){return (el.dataset.replaceChoice?`replacement:${el.dataset.replaceChoice}`:null)||el.dataset.place||el.dataset.object||(el.hasAttribute('data-route-next')?`route-add${el.dataset.routeNext?':'+el.dataset.routeNext:''}`:null)||(el.dataset.branch?`branch-${el.dataset.branch}`:null)||(el.hasAttribute('data-menu')?'nav-missions':'nav-branches');}
 function iconLayout(el,base){
  if(base){
   const point=targets.get(base.host)?.get(motionId(el))||base.normalized;
   const left=el.matches('.object')?(Number.isFinite(point.left)?point.left:point.x*base.travelX):base.left;
   const top=el.matches('.object')?(Number.isFinite(point.top)?point.top:point.y*base.travelY):base.top;
   return {...base,x:base.x+left-base.left,y:base.y+top-base.top};
  }
  const style=getComputedStyle(el),left=parseFloat(style.left)||0,top=parseFloat(style.top)||0;
  const tile=el.querySelector('.tile'),host=el.closest('.journey-zone'),t=rect(tile),e=rect(el),h=rect(host);
  // Measure once with transforms removed. offset* rounds fractional layout values,
  // including tile pivots; those errors become visible when the owner changes.
  return {host,tile,left,top,normalized:{x:Number(el.style.getPropertyValue('--x')),y:Number(el.style.getPropertyValue('--y'))},hostX:h.x+host.clientLeft,hostY:h.y+host.clientTop,travelX:el.parentElement.clientWidth-el.offsetWidth,travelY:el.parentElement.clientHeight-el.offsetHeight,cx:t.x-e.x+t.w/2,cy:t.y-e.y+t.h/2,x:t.x+t.w/2-h.x-host.clientLeft,y:t.y+t.h/2-h.y-host.clientTop,size:t.w,radius:!referenceVisual&&!bfmVisual&&el.matches('.route-first,.route-next')?t.w/2:parseFloat(getComputedStyle(tile).borderTopLeftRadius)||t.w*.28};
 }
 function image(el,r,parent,origin,opacity){
  if(el.closest('.route-phone')&&el.dataset.gpuDecoded==='false')return;
  // Canvas can draw one decoded source into many textures. Do not move the
  // cached DOM image between simultaneous icon states during GPU warmup.
  const source=startup?.assets.getImage(el.src)??el;
  if(!source.complete||!source.naturalWidth){el.addEventListener('load',()=>{if(el.isConnected){const owner=el.closest(movingSelector);if(owner)pendingParts.add(owner);else pendingParts.add(el);partsDirty=true;}},{once:true});return;}
  // Rasterize vector phone screens directly at a bounded high resolution, never via a 360px PNG.
  const idScreen=el.matches('.id-screen-image'),rasterW=idScreen?360:cachePixels(r.w),rasterH=idScreen?800:cachePixels(r.h);
  const scale=el.matches('.id-screen-image,.task-media-image')?Math.min(2048/Math.max(rasterW,rasterH),Math.max(2,1600/rasterH)):2;
  const rounded=el.matches('.task-media-image'),pad=rounded?16:0,radius=rounded?parseFloat(getComputedStyle(el).borderTopLeftRadius)||0:0;
  const shadow=rounded&&!!el.closest('.story-task');
  const map=texture(`${el.src}:${rasterW}:${rasterH}:${scale}:${radius}:${shadow}`,c=>{
   if(rounded){const fit=Math.min(r.w/source.naturalWidth,r.h/source.naturalHeight),w=source.naturalWidth*fit,h=source.naturalHeight*fit,x=pad+(r.w-w)/2,y=pad+(r.h-h)/2;
    c.beginPath();c.roundRect(x,y,w,h,Math.min(radius,w/2,h/2));
    if(shadow){c.shadowColor='rgba(13,0,26,.65)';c.shadowBlur=12;c.shadowOffsetY=6;c.fillStyle='#0D001A';c.fill();c.shadowColor='transparent';}
    c.save();c.clip();c.drawImage(source,x,y,w,h);c.restore();}
   else c.drawImage(source,0,0,rasterW,rasterH);
  },rasterW+pad*2,rasterH+pad*2,scale);
  const mesh=add(new THREE.Mesh(plane,basic(map,opacity)),parent,r.x-origin.x-pad,r.y-origin.y-pad,r.w+pad*2,r.h+pad*2);mesh.scale.y=-(r.h+pad*2);
  if(el.matches('.route-brand'))mesh.userData.logoSize={w:r.w,h:r.h};
 }
 function cancelPlacement(host,{leaving=false}={}){
  for(const [picker,flight]of flights)if(picker.closest('.journey-zone')===host){
   flights.delete(picker);delete picker.dataset.selecting;
   for(const el of picker.querySelectorAll('[data-orbit-index]')){
    el.removeAttribute('aria-disabled');delete el.dataset.flightActive;
    const motion=groups.get(el)?.motion;
    // During dismissal keep the current pose; the popup owns its fade-out.
    // A pointer cancellation without dismissal instead restores the menu.
    if(leaving)motion?.hold();else motion?.cancel();
   }
  }
 }
 function cancelContent(host){
  const motion=contentTransitions.get(host);
  if(motion&&host.isConnected&&host.querySelector('.route-phone'))motion.restore(reduced.matches);
  else{motion?.cancel();contentTransitions.delete(host);}
  // Manual close keeps the currently displayed alpha, then the shell fades out.
 }
 function connectionsMoving(host){
  for(const [el,item]of groups)if(el.isConnected&&el.closest('.journey-zone')===host&&el.matches('[data-object],[data-flight-active]')){
   if(el.dataset.dragging==='true'||item.motion?.connectionsMoving||item.motion?.phase==='placing'||item.motion?.intro)return true;
  }
  return false;
 }
 function visit(el,parent=scene,origin={x:0,y:0},opacity=1){
  if(el.closest('[hidden]'))return;
  if(retained.has(el))return;
  const firstMaterial=materials.length;
  const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;
  const r=rect(el);if(!r.w||!r.h)return;opacity*=Number(cs.opacity);
  if(el.matches(movingSelector)){
   const previous=previousGroups.get(el),group=previous?.group||new THREE.Group();group.clear();scene.add(group);const born=births.get(el)??time;births.set(el,born);
   el.dataset.sceneId=String(group.id);
   const item={el,group,base:r,born,opacity,hover:0,version:el.dataset.sceneVersion||'',bounds:new Map()};if(el.matches('[data-orbit-index],[data-object],[data-route-next]')){
    const l=iconLayout(el),id=motionId(el),menu=el.hasAttribute('data-orbit-index'),next=el.hasAttribute('data-route-next');item.layout=l;
    const initial=menu?{x:Number(el.dataset.originX),y:Number(el.dataset.originY),size:l.size*.16,radius:l.radius*.16,menu:true,phase:Number(el.dataset.orbitIndex)*1.7}:next?{...l,x:l.x-32,size:l.size*.8,radius:l.radius*.8,menu:true,next:true}:{...l,phase:l.x*.01};
    item.motion=motions.get(l.host,id,initial);
    if(bfmVisual)enableV5Inertia(item.motion);
    if(el.dataset.captionVisible==='false'&&item.motion.elapsed===0)item.motion.label.value=0;
    if(!menu&&(item.motion.phase==='placing'||next&&item.motion.phase==='menu'))item.motion.adopt();
    if(el.dataset.planning==='true'&&item.motion.elapsed===0)item.motion.badge.value=0;
   for(const part of [el,...el.querySelectorAll('.tile,.icon-caption,.badge,.glass-control')]){const b=rect(part);item.bounds.set(part,{x:b.x-r.x,y:b.y-r.y,w:b.w,h:b.h});}
   }
   groups.set(el,item);parent=group;origin={x:r.x,y:r.y};
  }
  if(el.matches(surfaceSelector))surface(el,r,parent,origin,opacity);
  if(el.tagName.toLowerCase()==='svg')vector(el,r,parent,origin,opacity);
  else if(el.tagName==='IMG')image(el,r,parent,origin,opacity);
  else for(const node of el.childNodes)if(node.nodeType===Node.TEXT_NODE)text(node,parent,origin,opacity);else if(node.nodeType===Node.ELEMENT_NODE)visit(node,parent,origin,opacity);
  // Children keep their own owner; static text participates just like buttons.
  for(let n=firstMaterial;n<materials.length;n++)materials[n].userData.el??=el;
 }
 function backTarget(el){
  const host=el.closest('.journey-zone'),h=rect(host);
  const nodes=[...host.querySelectorAll('[data-object] .tile')].map(tile=>{const r=rect(tile);return{x:r.x-h.x-host.clientLeft,y:r.y-h.y-host.clientTop};});
  const band=document.documentElement.dataset.service==='true'?{
   top:Math.max(0,INTERACTION_BAND.top-h.y-host.clientTop),
   bottom:Math.min(host.clientHeight,INTERACTION_BAND.bottom-h.y-host.clientTop)
  }:{};
  const size={width:host.clientWidth,height:host.clientHeight,w:el.offsetWidth,h:el.offsetHeight,...band};
  const target=networkBackTarget(nodes,size,time,reduced.matches);
  return target?{...target,limits:networkBackLimits(size)}:null;
 }
 function rebuild(){
  // A full invalidation can coincide with a decoded phone image. Preserve
  // pending partial refreshes when deciding which owners may be retained.
  // Otherwise the shell survives with the empty children from its first frame.
  const changedParts=[...pendingParts].filter(el=>el.isConnected);
  pendingParts.clear();partsDirty=false;
  previousGroups=new Map(groups);
  const affected=el=>changedParts.some(part=>part===el||part.contains(el)||el.contains(part)&&!(el.matches('.instruction-copy')&&el.closest('.journey-zone')?.dataset.instructionHeaderStable==='true'&&part.hasAttribute('data-instruction-body')));
  retained=new Set([...groups].filter(([el,item])=>el.isConnected&&!el.closest('[hidden]')&&!affected(el)&&item.version===(el.dataset.sceneVersion||'')).map(([el])=>el));
  for(const [el]of groups)if(!retained.has(el))el.style.removeProperty('transform');
  for(const el of root.querySelectorAll('[data-orbit-index],[data-object],[data-route-next]'))if(!retained.has(el))el.style.removeProperty('transform');
  for(const host of root.children){
   const el=host.querySelector('.network-back');if(!el){navigation.delete(host);continue;}
   const target=backTarget(el);if(!target)continue;
   let state=navigation.get(host);if(!state){state={x:new MotionValue(target.x),y:new MotionValue(target.y),alpha:new MotionValue(0)};navigation.set(host,state);}
   el.style.left=`${state.x.value}px`;el.style.top=`${state.y.value}px`;
  }
  // Keep the previous program references until replacements have rendered.
  // Disposing every material first evicts Three's program cache at each PLACE.
  const keep=new Set([...retained].map(el=>groups.get(el).group));
  const liveMaterials=new Set();for(const group of keep)group.traverse(mesh=>{if(mesh.material)liveMaterials.add(mesh.material);});
  for(const child of [...scene.children])if(!keep.has(child))scene.remove(child);
  retiredMaterials.push(...materials.filter(m=>!liveMaterials.has(m)));materials=materials.filter(m=>liveMaterials.has(m));
  groups=new Map([...groups].filter(([el])=>retained.has(el)));used=new Set();
  for(const el of root.children)visit(el);
  // A retained copy owner stops the root walk. Its newly swapped body is a
  // separate moving owner and must still be seeded on a coincident full rebuild.
  for(const part of changedParts)if(part.hasAttribute('data-instruction-body')&&!groups.has(part))visit(part);
  for(const host of sizeSnapHosts)for(const item of groups.values())if(item.el.closest('.journey-zone')===host&&item.el.hasAttribute('data-object')&&item.motion&&!item.motion.intro){
   item.motion.size.value=item.layout.size;item.motion.size.velocity=0;
   item.motion.radius.value=item.layout.radius;item.motion.radius.velocity=0;
  }
  sizeSnapHosts.clear();
  introBurst.attach(scene);
  const active=new Map();for(const {el,motion}of groups.values())if(motion){const host=el.closest('.journey-zone');if(!active.has(host))active.set(host,new Set());active.get(host).add(motionId(el));}motions.prune(active);
  scene.traverse(mesh=>{if(mesh.material)mesh.layers.set(mesh.material.userData.el?.closest('.context-popup,.picker,.field-success')?1:0);});
  for(const m of materials)if(m.userData.baseOpacity===undefined){m.userData.baseOpacity=m.uniforms?.alpha?.value??m.opacity;m.userData.fade=1;}
  const liveTextures=new Set(materials.map(m=>m.map));for(const [key,tex]of cache)if(!liveTextures.has(tex)&&!warmPhoneKeys.has(key)&&!startupTextureKeys.has(key)){tex.dispose();cache.delete(key);}
  root.dataset.sceneRetained=String(retained.size);root.dataset.sceneGroups=String(groups.size);
  retained.clear();previousGroups.clear();
  dirty=false;
 }
 function rebuildParts(){
  previousGroups=new Map(groups);
  const parts=[...pendingParts].filter(el=>el.isConnected);pendingParts.clear();partsDirty=false;
  const stale=el=>!el?.isConnected||parts.some(part=>part===el||part.contains(el));
  for(const [el,item]of groups)if(stale(el)){item.group.removeFromParent();groups.delete(el);el.style.removeProperty('transform');}
  const removed=[];scene.traverse(mesh=>{if(mesh.material&&stale(mesh.material.userData.el))removed.push(mesh);});
  removed.forEach(mesh=>mesh.removeFromParent());
  materials=materials.filter(m=>{if(stale(m.userData.el)){retiredMaterials.push(m);return false;}return true;});
  for(const el of parts)visit(el);
  for(const m of materials)if(m.userData.baseOpacity===undefined){m.userData.baseOpacity=m.uniforms?.alpha?.value??m.opacity;m.userData.fade=1;}
  const liveTextures=new Set(materials.map(m=>m.map));
  for(const [key,tex]of cache)if(!liveTextures.has(tex)&&!warmPhoneKeys.has(key)&&!startupTextureKeys.has(key)){tex.dispose();cache.delete(key);}
  previousGroups.clear();
 }
 return {
  async prepareGPU(renderer){
   await contextGlass.prepareGPU(renderer);await introBurst.prepareGPU(renderer,camera);introBurst.attach(scene);
   if(!bfmVisual||!startup)return;
   const warmHost=document.createElement('section');warmHost.className=startup.host.className;warmHost.inert=true;warmHost.setAttribute('aria-hidden','true');
   Object.assign(warmHost.style,{position:'absolute',left:'0',top:'0',width:`${startup.host.clientWidth}px`,height:`${startup.host.clientHeight}px`,opacity:'0',pointerEvents:'none'});
   root.append(warmHost);
   const dimensions=getSize();camera.right=dimensions.width;camera.bottom=dimensions.height;camera.updateProjectionMatrix();
   const batches=[{icons:startup.icons.join('')+startup.palm},{icons:startup.palmBurst},...startup.frames,...startup.finals];let completed=0;
   const stats={batches:batches.length,images:startup.assets.images.size,textures:0,pixels:0};startup.progress(0,batches.length);
   try{
    for(const batch of batches){
     if(disposed)throw Error('MAX GPU preparation cancelled');
     warmHost.replaceChildren();
     if(batch.icons)warmHost.innerHTML=`<div class="playfield guided-field">${batch.icons}</div>`;
     else if(batch.html)warmHost.innerHTML=batch.html;
     else{
      const template=document.createElement('template');template.innerHTML=batch.markup;
      const popup=template.content.firstElementChild,device=popup.querySelector('.demo-app');popup.classList.add('guided-task');device.remove();
      if(batch.paused)device.insertAdjacentHTML('beforeend','<button class="pill phone-resume" data-phone-resume>Продолжить задание</button>');
      const phone=document.createElement('section');phone.className='route-phone client-task';
      Object.assign(phone.style,{left:'0',top:'0',width:`${batch.metrics.width}px`,height:`${batch.metrics.height}px`});phone.append(device);warmHost.append(phone,popup);
      const instruction=popup.querySelector('.instruction'),copy=instruction.querySelector('.instruction-copy'),style=getComputedStyle(instruction);
      instruction.style.height=`${copy.scrollHeight+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)}px`;
      instruction.style.top='0px';
     }
     for(const image of warmHost.querySelectorAll('img'))if(!startup.assets.getImage(image.src))throw Error(`Unprepared MAX image: ${image.src}`);
     const oldChildren=new Set(scene.children),oldMaterials=materials.length,warmScene=new THREE.Scene();
     const target=renderer.getRenderTarget(),mask=camera.layers.mask,autoClear=renderer.autoClear;
     try{
      captureStartup=true;visit(warmHost);captureStartup=false;
      for(const child of [...scene.children])if(!oldChildren.has(child))warmScene.add(child);
      // Use the identical paint keys and keep their program references alive.
      const pinned=materials.splice(oldMaterials);startupProgramPins.push(...pinned);
      for(const material of pinned){if(material.map){renderer.initTexture(material.map);uploadedPhoneTextures.add(material.map);}if(material.alphaMap)renderer.initTexture(material.alphaMap);}
      camera.layers.enableAll();await withTimeout(()=>renderer.compileAsync(warmScene,camera),60000,'MAX startup shader');
      if(disposed)throw Error('MAX GPU preparation cancelled');
      renderer.setRenderTarget(contextGlass.target);renderer.autoClear=true;renderer.render(warmScene,camera);
     }finally{
      captureStartup=false;renderer.setRenderTarget(target);renderer.autoClear=autoClear;camera.layers.mask=mask;
      for(const [el]of groups)if(warmHost.contains(el))groups.delete(el);
      for(const child of [...scene.children])if(!oldChildren.has(child))scene.remove(child);
      motions.zones.delete(warmHost);warmScene.clear();
     }
     startup.progress(++completed,batches.length);await yieldToBrowser();
    }
    stats.textures=startupTextureKeys.size;
    for(const key of startupTextureKeys){const image=cache.get(key)?.image;if(image)stats.pixels+=image.width*image.height;}
    root.dataset.startupAssets=JSON.stringify(stats);
   }finally{warmHost.remove();}
  },
  prewarmPhoneImages(sources){
   const wanted=new Set(sources.map(idTextureKey));warmPhoneKeys=wanted;
   for(const [src,entry]of warmPhoneImages)if(!wanted.has(entry.key))warmPhoneImages.delete(src);
   for(const source of sources){
    const src=new URL(source,document.baseURI).href,key=idTextureKey(src);
    if(cache.has(key)||warmPhoneImages.has(src))continue;
    const image=new Image(),entry={image,key,ready:false};warmPhoneImages.set(src,entry);image.src=src;
    void image.decode().then(()=>{
     if(disposed||warmPhoneImages.get(src)!==entry||!warmPhoneKeys.has(key))return;
     entry.ready=true;const tex=texture(key,c=>c.drawImage(image,0,0,360,800),360,800,2);
     warmPhoneUploads.set(key,tex);
    }).catch(()=>{if(warmPhoneImages.get(src)===entry)warmPhoneImages.delete(src);});
   }
  },
  takePreparedPhoneImage(template){
   const entry=warmPhoneImages.get(template.src);
   if(!entry?.ready||entry.image.isConnected)return false;
   for(const attr of template.attributes)if(attr.name!=='src')entry.image.setAttribute(attr.name,attr.value);
   entry.image.dataset.preparedPhone='true';template.replaceWith(entry.image);
   warmPhoneImages.delete(template.src);return true;
  },
  holdObject(host,id){groups.get(host.querySelector(`[data-object="${id}"]`))?.motion?.hold();},
  readObjectOffset(host,id){const item=groups.get(host.querySelector(`[data-object="${id}"]`));if(!item?.motion)return null;const target=iconLayout(item.el,item.layout);return {x:item.motion.x.value-target.x,y:item.motion.y.value-target.y};},
  captureObject(host,id){const item=groups.get(host.querySelector(`[data-object="${id}"]`));if(!item?.motion)return null;const target=iconLayout(item.el,item.layout),actual=item.motion.captureDrag();return {x:actual.x-target.x,y:actual.y-target.y};},
  releaseCapturedObject(host,id){motions.zones.get(host)?.get(id)?.releaseDrag();},
  releaseObject(host){for(const item of groups.values())if(item.el.closest('.journey-zone')===host)item.motion?.release();},
  refreshPart(el){pendingParts.add(el);partsDirty=true;},
  refreshParts(elements){for(const el of elements)pendingParts.add(el);partsDirty=true;},
  renderFibers(renderer,target){fiberGlass.render(renderer,target);},
  invalidate({layout=false}={}){if(layout)for(const item of groups.values())item.version=null;dirty=true;},
  snapIconSizes(host){sizeSnapHosts.add(host);for(const item of groups.values())if(item.el.closest('.journey-zone')===host&&item.el.hasAttribute('data-object'))item.version=null;dirty=true;},
  bounds(el){return el?.isConnected?poses.get(el):null;},
  setTarget(host,id,point){if(!targets.has(host))targets.set(host,new Map());targets.get(host).set(id,{...point});},
  isSettled(host,id){const m=motions.zones.get(host)?.get(id);return !!m&&!m.intro&&!m.connectionsMoving&&m.alpha.value>.995;},
  highlightTile(el){groups.get(el)?.motion?.press();},
  showTapFeedback(host,point,message='Все объекты уже на поле'){
   // A transient annotation, never a picker/overlay: input and field stay intact.
   for(const [el]of feedbacks)if(el.parentElement===host){el.querySelector('p').textContent=message;pendingParts.add(el);partsDirty=true;return;}
   const el=document.createElement('div');el.className='tap-feedback';el.setAttribute('role','status');
   const width=Math.min(420,host.clientWidth-32),x=Math.max(16,Math.min(host.clientWidth-width-16,point.x-width/2));
   const y=point.y+80<host.clientHeight?point.y+44:Math.max(12,point.y-76);
   el.innerHTML=`<p style="left:${x}px;top:${y}px;width:${width}px">Все объекты уже на поле</p>`;
   el.querySelector('p').textContent=message;host.append(el);feedbacks.set(el,time);dirty=true;
  },
  busy(host,includeContent=true){return !!motions.zones.get(host)?.get('open-max')?.intro||transitions.get(host)?.busy===true||includeContent&&contentTransitions.get(host)?.busy===true;},
  contentBusy(host){return contentTransitions.get(host)?.busy===true;},
  instructionReady(instruction){
   const copy=instruction?.querySelector('.instruction-copy'),body=copy?.querySelector('p'),item=groups.get(body)||groups.get(copy);
   if(!instruction?.isConnected||instruction.closest('[hidden]')||!body?.textContent.trim()||!item?.group.parent)return false;
   return item.group.children.some(mesh=>mesh.userData.textRun?.trim()&&mesh.material?.map&&mesh.material.userData.baseOpacity>0&&mesh.material.opacity>.001&&(mesh.material.userData.el===body||body.contains(mesh.material.userData.el)));
  },
  canInterrupt(host){const t=transitions.get(host);return !t?.busy||t.local===true;},
  cancelContent,
  joinContentTransition(host,commit){
   const motion=contentTransitions.get(host);
   return joinTaskContentCommit(motion,()=>{host.dataset.contentPresence='0';host.dataset.contentPhase=motion.phase;onMotion();commit();});
  },
  transitionContent(host,commit,options){
   let motion=contentTransitions.get(host);
   if(!motion){motion=bfmVisual?new V5DeviceMorph():new TaskContentTransition();contentTransitions.set(host,motion);}
   const accepted=motion.start(()=>{host.dataset.contentPresence='0';host.dataset.contentPhase=motion.phase;onMotion();commit();},reduced.matches,options);
   if(accepted&&!motion.busy){host.dataset.contentPresence=String(motion.value);host.dataset.contentPhase=motion.phase;}
   return accepted;
  },
  cancelInstruction(el){instructionMotions.delete(el);},
  resizeInstruction(el,before){
   // `top` can be a CSS clamp() expression. Resolve it after layout instead
   // of parsing the inline string into NaN and snapping the information card.
   const target={top:parseFloat(getComputedStyle(el).top),height:parseFloat(getComputedStyle(el).height)};
   if(reduced.matches)return;
   let motion=instructionMotions.get(el);
   if(!motion){motion=new InstructionMotion(before,bfmVisual?{Motion:V5MotionValue,omega:V5_MOTION.travelOmega}:undefined);instructionMotions.set(el,motion);}
   motion.retarget(target);
   el.style.top=bfmVisual?v5InstructionTop(motion.height.value):`${motion.top.value}px`;el.style.height=`${motion.height.value}px`;
  },
  transition(host,commit,{enterOnly=false,retain=null,local=false,exitOnly=false,holdFocus=false,interrupt=false}={}){
   let motion=transitions.get(host);if(!motion){motion=new JourneyTransition(bfmVisual?V5_MOTION.popup:undefined);transitions.set(host,motion);}
   if(motion.busy&&!interrupt)return false;
   host.dataset.uiRetained=retain||'';
   motion.local=local;const key=local?'popupPresence':'uiPresence';
   if(holdFocus)host.dataset.holdFocus='true';
   // Keep navigation reachable; dispatch owns queuing and duplicate protection.
   host.inert=false;
   const accepted=motion.start(()=>{host.dataset[key]='0';onMotion();commit();},{reduced:reduced.matches,enterOnly,exitOnly,interrupt});
   host.dataset[key]=String(motion.value);onMotion();return accepted;
  },
  cancelTransitions(){reconnections.clear();introBurst.clear();flights.clear();motions.clear();for(const host of contentTransitions.keys())cancelContent(host);instructionMotions.clear();for(const [host,motion]of transitions){motion.cancel();host.inert=false;delete host.dataset.uiPresence;delete host.dataset.uiRetained;}transitions.clear();},
  cancelPlacement,
  seedReveal(host,id,tile,point=null){
   if(!id||!tile)return;const r=rect(tile),h=rect(host);
   const motion=motions.get(host,id,{x:point?.x??r.x+r.w/2-h.x-host.clientLeft,y:point?.y??r.y+r.h/2-h.y-host.clientTop,size:r.w*.88,radius:r.w*.24});
   motion.adopt();motion.alpha.value=0;motion.label.value=0;motion.badge.value=0;
  },
  seedRouteObject(host,id,orb){
   if(!orb)return;const r=rect(orb),h=rect(host);
   const motion=motions.get(host,id,{x:r.x+r.w/2-h.x-host.clientLeft,y:r.y+r.h/2-h.y-host.clientTop,size:r.w,radius:r.w/2});
   motion.presentStart();introBurst.start(host,{x:motion.x.value,y:motion.y.value},r.w,reduced.matches);
  },
  startPalmScan(host,tile){
   if(!tile)return;const r=rect(tile),h=rect(host);
   introBurst.startScan(host,{x:r.x+r.w/2-h.x-host.clientLeft,y:r.y+r.h/2-h.y-host.clientTop},r.w,reduced.matches);
  },
  placingObject(host){
   for(const [picker,flight]of flights)if(picker.isConnected&&picker.closest('.journey-zone')===host)return {step:flight.el.dataset.place,tile:flight.el.querySelector('.tile')};
   return null;
  },
  connectionsMoving,
  connectionsSuspended(host){return reconnections.get(host)?.active===true;},
  reconnectRoute(host){let gate=reconnections.get(host);if(!gate){gate=new RouteReconnect();reconnections.set(host,gate);}gate.begin();},
  flyTo(el,target,complete){
   const item=groups.get(el),picker=el.closest('.picker');if(!item?.motion||!picker)return false;
   const host=el.closest('.journey-zone'),h=rect(host);
   const goal={x:target.x-h.x-host.clientLeft,y:target.y-h.y-host.clientTop,size:target.tile,radius:target.radius??(target.tile===76?22:30)};
   const waypoints=!reduced.matches&&target.waypoints?.length?target.waypoints.slice():[{x:goal.x,y:goal.y}];
   el.dataset.flightActive='true';item.motion.fly(goal,waypoints);
   for(const sibling of picker.querySelectorAll('[data-orbit-index]'))if(sibling!==el){const m=groups.get(sibling)?.motion;if(m)m.leave({x:Number(sibling.dataset.originX),y:Number(sibling.dataset.originY),size:m.size.value*.35,radius:m.radius.value*.35});}
   flights.set(picker,{el,motion:item.motion,complete,started:time,goal});return true;
  },
  prepare(delta){
   if(disposed)return;onFrame?.(delta);if(bfmVisual&&(document.hidden||root.dataset.presentationPaused==='true'))delta=0;time+=Math.min(delta,.05);let moving=false;
   for(const host of root.children){
    const ctaTarget=host.dataset.ctaVisible==='true'?1:0,ctaOld=Number(host.dataset.ctaPresence??ctaTarget);
    const ctaNext=reduced.matches?ctaTarget:ctaOld+Math.sign(ctaTarget-ctaOld)*Math.min(Math.abs(ctaTarget-ctaOld),Math.min(delta,.05)/.18);
    host.dataset.ctaPresence=String(ctaNext);if(ctaNext!==ctaOld)moving=true;
    const task=host.dataset.activeTask;
    if(task)host.dataset.focusObject=task;
   }
   for(const [el,born]of feedbacks){
    if(!el.isConnected){feedbacks.delete(el);continue;}
    if(time-born>=1){el.remove();feedbacks.delete(el);dirty=true;}
   }
   for(const [host,motion]of transitions){
    if(!host.isConnected){motion.cancel();transitions.delete(host);continue;}
    if(motion.tick(delta)){host.dataset[motion.local?'popupPresence':'uiPresence']=String(motion.value);moving=true;}
    if(!motion.busy){host.inert=false;delete host.dataset.uiRetained;delete host.dataset.holdFocus;transitions.delete(host);}
   }
   for(const [host,motion]of contentTransitions){
    if(!host.isConnected||!host.querySelector('.task-dialog,.route-phone')){cancelContent(host);continue;}
    if(motion.tick(bfmVisual&&(document.hidden||root.dataset.presentationPaused==='true')?0:delta))moving=true;
    host.dataset.contentPresence=String(motion.value);host.dataset.contentPhase=motion.phase;
    if(!motion.busy)contentTransitions.delete(host);
   }
   for(const [el,motion]of instructionMotions){
    if(!el.isConnected){instructionMotions.delete(el);continue;}
    motion.step(delta,reduced.matches);
    el.style.top=bfmVisual?v5InstructionTop(motion.height.value):`${motion.top.value}px`;el.style.height=`${motion.height.value}px`;moving=true;
    if(motion.settled){el.style.top=bfmVisual?v5InstructionTop(motion.target.height):`${motion.target.top}px`;el.style.height=`${motion.target.height}px`;instructionMotions.delete(el);}
   }
   if(dirty)rebuild();
   else if(partsDirty)rebuildParts();
   introBurst.step(Math.min(delta,.05),rect,reduced.matches);
   for(const host of root.children){
    let focus=focusMotions.get(host);if(!focus){focus=new PopupFocus();focusMotions.set(host,focus);}
    const old=focus.amount.value,motion=transitions.get(host);
    host.dataset.objectFocus=String(focus.step(host.dataset.activeTask,motion?.local&&motion.phase==='exit',delta,reduced.matches));
    host.dataset.focusObject=focus.object;if(old!==focus.amount.value)moving=true;
   }
   const size=getSize();camera.right=size.width;camera.bottom=size.height;camera.updateProjectionMatrix();
   finished=[];for(const [picker]of flights)if(!picker.isConnected)flights.delete(picker);
   for(const material of materials){if(material.uniforms?.clock)material.uniforms.clock.value=reduced.matches?0:time;if(material.userData.gradientId){const angle=gradients.angle(material.userData.gradientId);if(angle!==material.map.rotation){material.map.rotation=angle;moving=true;}}}
   let referenceFrames=new Map();
   if(referenceVisual){
    if(!document.hidden&&root.dataset.presentationPaused!=='true'&&!reduced.matches)referenceClock+=Math.min(delta,.05);
    const entries=[];
    for(const item of groups.values()){
     const {el,base}=item,presence=Number(el.dataset.pathPresence??1);
     if(el.matches('.route-phone'))entries.push({owner:el,id:'device',role:'device',presence,rect:rect(el)});
     if(el.matches('.task-dialog .instruction'))entries.push({owner:el,id:'instruction',role:'instruction',presence,rect:rect(el)});
     if(!item.motion)continue;
     const l=iconLayout(el,item.layout);
     entries.push({owner:el,id:motionId(el),role:el.matches('[data-palm]')?'palm':'icon',presence,motion:item.motion,layout:l,width:base.w,height:base.h,
      hover:el.matches(':hover,:focus-visible'),dragging:el.dataset.dragging==='true',selected:l.host.dataset.activeTask===el.dataset.object,labelVisible:el.dataset.captionVisible!=='false',
      parts:[...item.bounds].map(([part,bounds])=>({kind:part.matches('.tile')?'tile':part.matches('.icon-caption')?'caption':'other',bounds}))});
    }
    referenceFrames=prepareReferenceFrame(entries,{delta,time,driftTime:referenceClock,reduced:reduced.matches,offsets:referenceOffsets});
    if(referenceTrace){
     const host=root.querySelector('.journey-zone'),context={phase:host?.dataset.revealPhase,contact:host?.dataset.referenceContact||null,runId:host?.dataset.referenceRun||null,scanned:host?.dataset.referenceScanned==='true'};
     const previous=referenceTrace.rows.at(-1),row=referenceTrace.record(context,entries,referenceFrames);
     if(previous?.phase!==row.phase||previous?.contact!==row.contact||row.duplicateIds.length)console.debug('MAX reference frame',JSON.stringify(row));
    }
   }
   for(const item of groups.values()){
    const {el,group,base,born}=item;const age=time-born;
    const hovered=el.matches(':hover,:focus-visible')||el.dataset.dragging==='true';
    item.hover+=(Number(hovered)+(el.matches('[data-place]')?.3:0)-item.hover)*Math.min(1,delta*16);
    let dx=0,dy=0,s=1,fade=1,visual=null;
     if(el.matches('.network-back')){
      const target=backTarget(el),state=navigation.get(el.closest('.journey-zone'));
      if(target&&state){state.x.step(target.x,Math.min(delta,.05),10,reduced.matches);state.y.step(target.y,Math.min(delta,.05),10,reduced.matches);state.alpha.step(1,Math.min(delta,.05),10,reduced.matches);
       constrainBackMotion(state,target.limits);
       dx=state.x.value-parseFloat(el.style.left);dy=state.y.value-parseFloat(el.style.top);fade=state.alpha.value;moving=true;}
     }else if(el.matches('[data-cta]')){
      const p=Number(el.closest('.journey-zone').dataset.ctaPresence??1);fade=p*p*(3-2*p);s=.98+.02*fade;
     }else if(item.motion){
     const l=iconLayout(el,item.layout),m=item.motion;
     const waiting=el.hasAttribute('data-route-next')&&!!motions.zones.get(l.host)?.get('open-max')?.intro&&!reduced.matches;
     if(el.hasAttribute('data-route-next'))el.inert=waiting;
     const selected=!!el.dataset.object&&(l.host.dataset.pickerObject===el.dataset.object||l.host.dataset.activeTask===el.dataset.object);
     if(!waiting&&!referenceVisual)m.step(Math.min(delta,.05),{...l,hover:hovered,dragging:el.dataset.dragging==='true',expanded:el.getAttribute('aria-expanded')==='true',selected,present:!el.matches('[data-route-next]:disabled'),labelVisible:el.dataset.captionVisible!=='false',badgeVisible:el.dataset.planning!=='true',planning:l.host.dataset.routePhase!=='playing',movementOmega:bfmVisual?V5_INERTIA.iconsOmega:['trace','phone-enter','phone-exit'].includes(l.host.dataset.revealPhase)?REVEAL_MOTION.fieldOmega:null,dragOmega:bfmVisual?V5_INERTIA.phoneOmega:null,presenceOmega:bfmVisual?V5_MOTION.presenceOmega:null,reduced:reduced.matches,time});
     s=m.size.value/l.size;dx=m.x.value-l.x;dy=m.y.value-l.y;fade=m.alpha.value;item.hover=m.energy.value;
     visual=scenePose(l,m,base.w,base.h);
     if(referenceVisual){const prepared=referenceFrames.get(el)?.pose;if(prepared){dx+=prepared.x-visual.x;dy+=prepared.y-visual.y;visual=prepared;}}
     for(const [part,local]of item.bounds)if(part.isConnected)poses.set(part,projectBounds(local,visual));
     el.style.transformOrigin=`${l.cx}px ${l.cy}px`;
     // Optical radius and the shader rim use exactly the same animated value.
     l.tile.style.borderRadius=`${m.radius.value/s}px`;
     const badge=el.querySelector('.badge');if(badge)badge.dataset.uiFade=String(m.badge.value);
     const caption=el.querySelector('.icon-caption');if(caption)caption.dataset.uiFade=String(m.label.value);
     group.traverse(mesh=>{if(mesh.material?.userData.el===l.tile&&mesh.material.uniforms?.radius){mesh.material.uniforms.radius.value=m.radius.value/s;mesh.material.uniforms.selection.value=m.selection.value;}
      if(mesh.userData.logoSize){const k=.3+.7*m.logo;mesh.scale.set(mesh.userData.logoSize.w*k,-mesh.userData.logoSize.h*k,1);}
     });
     const flight=flights.get(el.closest('.picker'));
     if(flight?.el===el&&m.arrived())finished.push([el.closest('.picker'),flight]);
     moving=true;
    }else if(el.matches('[data-task-content]')){
     const host=el.closest('.journey-zone'),p=Number(host.dataset.contentPresence??1);
     const copy=el.matches('.instruction-copy'),body=el.hasAttribute('data-instruction-body');
     const stable=copy&&host.dataset.instructionHeaderStable==='true'||body&&(host.dataset.instructionBodyStable==='true'||host.dataset.instructionHeaderStable!=='true');
     dy=reduced.matches||stable?0:(host.dataset.contentPhase==='out'?-5:7)*(1-p);
    }else if(el.matches('.field-success')){
     const p=reduced.matches?1:Math.min(1,age/.42),ease=p*p*(3-2*p)*(el.matches('.route-ready')?Number(el.closest('.journey-zone').dataset.popupPresence??1):1);
     el.dataset.popupReveal=String(ease);
     dy=reduced.matches?0:12*(1-ease)+Math.sin(time*.8)*2;
     s=.98+.02*ease;moving=true;
    }else if(el.matches('.context-popup')&&!reduced.matches){
     const p=Number(el.closest('.journey-zone').dataset.popupPresence??1);
     s=bfmVisual?1:.96+.04*p;
    }else if(el.matches('.mission-card')&&!reduced.matches&&age<.4){
     const t=Math.min(1,age/.4),ease=1-Math.pow(1-t,3);dy=12*(1-ease);s=.96+.04*ease;moving=true;

    }else if(el.matches('.attract-icons>.tile')&&!reduced.matches){dy=Math.sin(time*.7+base.x)*5;}
    // Both hit targets and optical bounds follow precisely the visible group.
    const transform=`translate(${dx}px,${dy}px) scale(${s})`;
    if(el.style.transform!==transform){el.style.transform=transform;moving=true;}
    const r=visual||rect(el);group.position.set(r.x,r.y,0);group.scale.set(r.w/base.w,r.h/base.h,1);
    // The copy box can flex-shrink while its shell is resizing, but its text
    // children keep their font metrics. Follow the box's position, never stretch
    // retained glyphs from that temporary height to the settled card height.
    if(el.matches('.task-dialog .instruction-copy'))group.scale.set(1,1,1);
    if(el.matches('.task-dialog .instruction')){
     // Resize the SDF surface itself, never scale its text, radius or halo.
     group.scale.set(1,1,1);
     for(const mesh of group.children)if(mesh.material?.uniforms?.size){
      mesh.position.set(r.w/2,r.h/2,0);mesh.scale.set(r.w+24,r.h+24,1);
      mesh.material.uniforms.size.value.set(r.w,r.h);
      mesh.material.uniforms.radius.value=parseFloat(getComputedStyle(el).borderTopLeftRadius)*(r.w/el.offsetWidth);
     }
    }
    fade*=Number(el.dataset.pathPresence??1);
    el.dataset.uiFade=String(fade);
    group.traverse(mesh=>{if(!mesh.material)return;mesh.material.userData.fade=fade;if(mesh.material.uniforms?.energy)mesh.material.uniforms.energy.value=item.hover;});
   }
   // Suppress a covered object's entire caption rather than leaving a stray line
   // below the frosted result. Use the same current pose as the optical mask.
   for(const host of root.children){
    const popup=host.querySelector('.field-success');if(!popup)continue;
    const p=rect(popup);
    for(const object of host.querySelectorAll('[data-object]')){
     const r=rect(object.querySelector('.tile'));
     object.dataset.completionCovered=String(r.x<p.x+p.w&&r.x+r.w>p.x&&r.y<p.y+p.h&&r.y+r.h>p.y);
    }
   }
   for(const m of materials){
    const el=m.userData.el,host=el?.closest('.journey-zone');
    if(m.uniforms?.contentActive){
     const transition=contentTransitions.get(host),phase=transition?.phase;
     const phoneFrame=el?.matches('.route-phone .demo-app');
     m.uniforms.contentProgress.value=transition?.sweepProgress??0;
     m.uniforms.contentActive.value=phoneFrame&&(phase==='out'||phase==='in')?1:0;
    }
    if(m.uniforms?.scanProgress)m.uniforms.scanProgress.value=Number(el.closest('[data-palm]')?.dataset.progress||0);
    const retained=host?.dataset.uiRetained&&el.closest('[data-object]')?.dataset.object===host.dataset.uiRetained;
    let presence=el?.closest('[hidden]')?0:retained?1:Number(host?.dataset.uiPresence??1);
    if(el?.closest('.context-popup,.picker'))presence*=Number(host?.dataset.popupPresence??1);
    const routePhone=el?.closest('.route-phone');
    // Nested content/button groups are scene siblings, so inherit the world
    // phone's presence explicitly. Its own surface already uses that fade.
    if(routePhone&&el.closest(movingSelector)!==routePhone)presence*=Number(routePhone.dataset.pathPresence??1);
    presence*=objectContextPresence(el);
    const instructionCopy=el?.closest('.instruction-copy'),instructionBody=el?.closest('[data-instruction-body]');
    const retainedInstruction=instructionCopy&&(instructionBody?host?.dataset.instructionBodyStable==='true':host?.dataset.instructionHeaderStable==='true');
    presence*=retainedInstruction?1:taskContentPresence(el);
    presence*=Number(el?.closest('.field-success')?.dataset.popupReveal??1);
    if(el?.closest('.phone-loading'))presence*=.78+.22*Math.sin(time*4);
    const motion=groups.get(el?.closest('[data-orbit-index],[data-object],[data-route-next]'))?.motion;
    if(motion&&el.closest('.icon-caption'))presence*=motion.label.value;
    if(motion&&el.closest('.badge'))presence*=motion.badge.value;
    if(motion&&el.matches('.route-brand'))presence*=motion.logo;
    if(el?.closest('.route-intro-plus'))presence*=1-(motion?.logo??1);
    const feedback=el?.closest('.tap-feedback');
    if(feedback){const age=time-feedbacks.get(feedback),t=Math.max(0,Math.min(1,Math.min(age/.08,(1-age)/.2)));presence*=t*t*(3-2*t);}
    const alpha=m.userData.baseOpacity*(m.userData.fade??1)*presence;
    if(m.uniforms?.alpha)m.uniforms.alpha.value=alpha;else m.opacity=alpha;
   }
   scene.traverse(mesh=>{if(!mesh.material)return;const el=mesh.material.userData.el,host=el?.closest('.journey-zone');
    const shared=host?.dataset.bigWindow!=='true'&&host?.dataset.sharedTask&&el.closest('[data-object]')?.dataset.object===host.dataset.sharedTask&&!el.closest('.icon-caption');
    mesh.layers.set(shared?2:el?.closest('.context-popup,.picker,.field-success')?1:0);
   });
   for(const [host,gate]of reconnections){
    gate.prepared(connectionsMoving(host));
    if(!host.isConnected||!gate.active)reconnections.delete(host);
    moving=true;
   }
   publishGlassFrame(document,readGlassControls(document,{prepare:true,poses}));
   if(moving)onMotion();
  },
  render(renderer){
   if(disposed)return;
   // At most one next-step upload per frame, before that screen is needed.
   for(const [key,tex]of warmPhoneUploads){
    warmPhoneUploads.delete(key);
    if(!warmPhoneKeys.has(key)||cache.get(key)!==tex)continue;
    try{renderer.initTexture(tex);uploadedPhoneTextures.add(tex);}
    catch(error){console.warn('MAX phone prewarm failed',error);}
    break;
   }
   // CanvasTexture is lazy: creating a material does not upload its pixels.
   // Upload decoded phone images with the existing renderer before the first
   // visible device frame, so the shell and screenshot appear together.
   for(const material of materials){
    const image=material.userData.el;
    if(image?.tagName!=='IMG'||!image.closest('.route-phone')||!material.map||uploadedPhoneTextures.has(material.map)||failedPhoneTextures.has(material.map))continue;
    const phone=image.closest('.route-phone');
    if(phone.dataset.mediaReadyKey!==phone.dataset.sceneVersion)continue;
    try{renderer.initTexture(material.map);uploadedPhoneTextures.add(material.map);}
    catch(error){
     failedPhoneTextures.add(material.map);phone.dataset.gpuUploadError=String(error?.message||error);console.error('MAX phone texture upload failed',error);
     queueMicrotask(()=>{if(!image.isConnected)return;const message=document.createElement('p');message.className='phone-media-error';message.textContent='Кадр задания не загрузился. Перезапустите миссию.';image.replaceWith(message);pendingParts.add(phone);partsDirty=true;onMotion();});
    }
   }
   const panes=[...root.querySelectorAll('.context-popup .instruction,.context-popup .demo-app,.field-success')].filter(el=>!el.closest('[hidden]')).map(el=>({...rect(el),radius:parseFloat(getComputedStyle(el).borderTopLeftRadius),opacity:glassControlPresence(el,document)}));
   contextGlass.render(renderer,scene,camera,panes,getSize());
   for(const phone of root.querySelectorAll('.route-phone[data-media-ready-key]')){
    const key=phone.dataset.sceneVersion;
    if(phone.dataset.gpuReadyKey===key||phone.dataset.mediaReadyKey!==key)continue;
    const screen=phone.querySelector('.demo-app');
    const visibleImages=[...screen.querySelectorAll('img')].filter(image=>{const r=rect(image);return r.w>0&&r.h>0;});
    if(materials.some(m=>m.userData.el===screen&&m.userData.deviceShell)&&visibleImages.every(image=>materials.some(m=>m.userData.el===image&&m.map&&uploadedPhoneTextures.has(m.map))))phone.dataset.gpuReadyKey=key;
   }
   for(const material of retiredMaterials)material.dispose();retiredMaterials.length=0;
   document.documentElement.dataset.webglUi='true';
   for(const [picker,flight]of finished){queueMicrotask(()=>{if(flights.get(picker)!==flight||!picker.isConnected)return;flights.delete(picker);flight.complete();});}
  },
  dispose(){disposed=true;rotatingMaps.forEach(t=>t.dispose());rotatingMaps.clear();warmPhoneImages.clear();warmPhoneUploads.clear();warmPhoneKeys.clear();startupTextureKeys.clear();startupProgramPins.forEach(m=>m.dispose());startupProgramPins.length=0;reconnections.clear();clearGlassFrame(document);introBurst.dispose();for(const m of contentTransitions.values())m.cancel();contentTransitions.clear();instructionMotions.clear();for(const m of transitions.values())m.cancel();transitions.clear();feedbacks.clear();motions.clear();for(const shapes of vectorCache.values())for(const shape of shapes)shape.dispose();vectorCache.clear();fiberGlass.dispose();contextGlass.dispose();flights.clear();materials.forEach(m=>m.dispose());retiredMaterials.forEach(m=>m.dispose());retiredMaterials.length=0;geometry.forEach(g=>g.dispose());cache.forEach(t=>t.dispose());plane.dispose();scene.clear();}
 };
}
