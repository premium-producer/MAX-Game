import {paintBfmPhone,BFM_PHONE_LIGHT_PAD} from './journey-bfm-device-paint.mjs';
import {v5DeviceMetrics,V5_DEVICE_FRAME,V5DeviceMorph} from './journey-v5-device-morph.mjs';

// The mission's actual bezel painter, asset geometry and maath morph are shared.
// Video.js retains the decoder/playlist; this component only presents its surface.
export function createShowDevice(host){
 const frame=document.createElement('div');frame.className='show-device';
 const canvas=document.createElement('canvas');canvas.className='show-device-bezel';
 const content=document.createElement('div');content.className='show-device-content';
 frame.append(canvas,content);host.replaceChildren(frame);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),morph=new V5DeviceMorph();
 let width=392,disposed=false,raf=0,last=0,revision=0,settle=null;
 const draw=()=>{
  const h=V5_DEVICE_FRAME.height,pad=BFM_PHONE_LIGHT_PAD;
  // Size the logical device uniformly, including very wide or portrait media.
  const scale=Math.min(host.clientWidth*.88/(width+pad*2),host.clientHeight*.82/(h+pad*2));
  frame.style.width=`${width}px`;frame.style.height=`${h}px`;frame.style.scale=String(scale);
  const raster=2,logicalWidth=Math.ceil(width+pad*2),logicalHeight=h+pad*2;
  canvas.width=logicalWidth*raster;canvas.height=logicalHeight*raster;
  canvas.style.width=`${logicalWidth}px`;canvas.style.height=`${logicalHeight}px`;
  const ctx=canvas.getContext('2d');ctx.scale(raster,raster);paintBfmPhone(ctx,width,h,38,raster);
 };
 const tick=now=>{
  if(disposed)return;
  morph.tick(last?Math.min((now-last)/1000,.05):0);last=now;
  content.style.opacity=String(morph.value);
  if(!morph.busy&&settle){const done=settle;settle=null;done(true);}
  if(morph.busy&&(morph.phase!=='ready'||settle))raf=requestAnimationFrame(tick);else{raf=0;last=0;}
 };
 const resize=()=>draw();addEventListener('resize',resize);draw();
 return {frame,content,
  freeze(){revision++;settle?.(false);settle=null;cancelAnimationFrame(raf);raf=0;last=0;morph.cancel();},
  hideContent(){this.freeze();content.style.opacity='0';},
  fadeContentOut(){
   this.freeze();
   const done=new Promise(resolve=>settle=resolve);
   morph.start(()=>{const resolve=settle;settle=null;resolve?.(true);},reduced.matches,{from:width,to:width,ready:()=>false});
   morph.alpha.value=Number(getComputedStyle(content).opacity);
   raf=requestAnimationFrame(tick);return done;
  },
  async mediaSize(w,h){
   const id=++revision;settle?.(false);settle=null;morph.cancel();
   const target=v5DeviceMetrics({asset:{width:w,height:h}}).width;
   // A playlist source can publish new dimensions while the old morph is active.
   // Replace its destination; never let stale metadata restore old content.
   morph.start(()=>{},reduced.matches,{from:width,to:target,resize:value=>{width=value;draw();}});
   morph.alpha.value=0;morph.phase='resize';
   const done=new Promise(resolve=>settle=resolve);if(!raf)raf=requestAnimationFrame(tick);
   return (await done)&&id===revision&&!disposed;
  },
  dispose(){disposed=true;revision++;settle?.(false);cancelAnimationFrame(raf);removeEventListener('resize',resize);morph.cancel();frame.remove();}
 };
}
