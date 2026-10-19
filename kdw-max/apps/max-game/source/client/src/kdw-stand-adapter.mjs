import {createGradientController} from './bfm-gradient-controller.mjs';
import {FLAT_SCREEN,WALL} from './circle-model.mjs';

export const BROWSER_ROUTE_GAP=128;
export function browserSceneSize(width,height,{deviceWidth=392}={}){return {width:Math.ceil(Math.max(2480,1280*width/height,2*(256+BROWSER_ROUTE_GAP)+deviceWidth+968)/64)*64,height:1280};}
// One common scale for the entire catalog, including the mission menu. Reserve
// the widest device, full copy and two initial left icons before first paint.
// Later route history may extend off the left edge; never zoom out to fit it.
export function createBrowserScenePlan(catalog,measureDevice){
 const taskIds=Object.values(catalog.missions).flatMap(mission=>mission.taskIds);
 const screens=taskIds.flatMap(taskId=>Object.values(catalog.tasks[taskId]?.screens??{}));
 const deviceWidth=Math.max(392,...screens.map(screen=>measureDevice({kind:screen.deviceKind,asset:catalog.assets[screen.assetId]}).width));
 // Reserve the native 4096px standby composition in the same projection used
 // by every mission. Entering a task must not cause another global fit.
 return (width,height)=>{const scene=browserSceneSize(width,height,{deviceWidth});return {...scene,width:Math.max(4096,scene.width)};};
}
export function browserDeviceCenter(hostWidth,deviceWidth){return Math.min(hostWidth/2,hostWidth-32-760-64-deviceWidth/2);}

// Only host concerns: viewport projection, local admission and browser navigation.
// Authored stand geometry, motion, assets and game transitions are unchanged.
export function createStandBrowserHost({arena,params,onMenu}){
 const gradients=createGradientController(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const configure=()=>gradients.configure({speed:30,spread:.15,phaseSpread:360,paused:document.hidden||reduced.matches});
 configure();document.addEventListener('visibilitychange',configure);reduced.addEventListener('change',configure);
 const back=document.createElement('button');back.className='kdw-browser-back';back.textContent='Назад';back.hidden=true;back.addEventListener('click',onMenu);document.body.append(back);
 return {gradients,
  fit(width,height){
   const zone=params.get('view')==='wall'?{left:0,top:0,w:WALL.width,h:WALL.height}:{left:0,top:0,w:parseFloat(arena.style.width)||2480,h:parseFloat(arena.style.height)||1280};
   const scale=Math.min(width/zone.w,height/zone.h),x=width/2-(zone.left+zone.w/2)*scale,y=height/2-(zone.top+zone.h/2)*scale;
   Object.assign(arena.style,{left:'0',top:'0',transformOrigin:'0 0',transform:`translate(${x}px,${y}px) scale(${scale})`});
   const brand=arena.querySelector('.v5-brand');if(brand){if(params.get('view')==='wall'){brand.style.removeProperty('left');brand.style.removeProperty('right');brand.style.removeProperty('top');}else Object.assign(brand.style,{left:'auto',right:'64px',top:'32px'});}
   const ambient=document.querySelector('#ambient');if(ambient)Object.assign(ambient.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100vh',transform:'none'});
  },
  update(snapshot){back.hidden=!snapshot||snapshot.state.status==='menu';},
  dispose(){back.remove();gradients.dispose();document.removeEventListener('visibilitychange',configure);reduced.removeEventListener('change',configure);}
 };
}

// Stand admission comes from its host. The portable host confirms the same scan
// through the existing input contract, without asking the visitor to hold a palm.
export class LocalStandAdmission{
 constructor({active=()=>true,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){this.active=active;this.wait=wait;this.pending=null;this.disposed=false;}
 update(session){
  if(this.pending||this.disposed||!this.active()||session?.busy||session?.snapshot?.state.status!=='scan')return;
  const run=session.snapshot.state.runId;
  this.pending=(async()=>{
   await session.owner(true);
   if(!this.active()||this.disposed||session.snapshot.state.runId!==run)return;
   await session.contact('portable-admission','down',true);await this.wait(825);
   const current=session.snapshot.state;
   await session.contact('portable-admission',!this.disposed&&this.active()&&current.runId===run&&current.status==='scan'?'up':'cancel',true);
  })().finally(()=>{this.pending=null;});
  return this.pending;
 }
 dispose(){this.disposed=true;}
}
