import {V5MotionValue} from './journey-v5-inertia.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {v5IconTile} from './journey-v5-icons.mjs';
import {v5CopyMarkup} from './journey-v5-ui-copy.mjs';
import {createDeviceVideo} from './journey-v5-video-source.mjs';
import {IDLE_VIDEO_ASSET,idleMissionChoices,idleLayout} from './journey-v5-idle-layout.mjs';

export function createIdleMenu({host,foreground,catalog,assetCatalog,reduced,changed,onSelect,onError}){
 const choices=idleMissionChoices(catalog),layout=idleLayout(choices.length),buttons=[],parts=[];
 const reveal=(el,delay,available)=>{el.dataset.idlePart='true';parts.push({el,delay,available,age:0,alpha:new V5MotionValue(0)});};
 let disposed=false,exiting=false,resolveExit,exitTimer,exitPromise,ready=false,selected=false,videoReady=false;
 const document=host.ownerDocument;
 Object.assign(host.style,{left:'0px',top:'0px',width:'4096px',height:'1280px',overflow:'visible'});
 host.dataset.routePhase='planning';host.dataset.uiPresence='1';host.dataset.contentPresence='1';host.dataset.activeTask='';host.dataset.sharedTask='';host.inert=false;
 const place=(el,r)=>Object.assign(el.style,{position:'absolute',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
 const logo=document.createElement('button');logo.className='object';logo.inert=true;logo.dataset.pathPresence='0';logo.setAttribute('aria-hidden','true');
 logo.innerHTML='<img data-independent-artwork="true" data-gpu-decoded="false" draggable="false" alt="MAX" src="./brand/assets/logos/max-primary-white.svg" style="display:block;width:100%;height:100%;object-fit:contain">';place(logo,layout.logo);host.append(logo);
 const image=logo.querySelector('img');void image.decode().then(()=>{if(disposed)return;image.dataset.gpuDecoded='true';foreground.refreshPart(logo);changed();}).catch(onError);
 reveal(logo,0,()=>image.dataset.gpuReady==='true');
 const shell=document.createElement('section');shell.className='route-phone client-task';shell.inert=true;shell.dataset.pathPresence='0';place(shell,layout.video);host.append(shell);
 const app=document.createElement('div');app.className='demo-app';app.dataset.device='pc';Object.assign(app.style,{width:'100%',height:'100%',padding:'12px 10px',boxSizing:'border-box'});
 const content=document.createElement('div');content.className='phone-content';content.dataset.taskContent='';Object.assign(content.style,{width:'100%',height:'100%'});app.append(content);shell.append(app);
 const asset=assetCatalog.devices.find(a=>a.assetId===IDLE_VIDEO_ASSET);if(!asset)throw Error('MAX_IDLE_VIDEO_MISSING');
 const video=createDeviceVideo(document,asset,{loop:true,muted:false,onError});
 content.append(video.element);
 void video.ready.then(()=>{if(disposed)return;videoReady=true;shell.dataset.sceneVersion='idle-video';shell.dataset.mediaReadyKey='idle-video';foreground.refreshPart(shell);changed();}).catch(error=>{if(!disposed)onError(error);});
 reveal(shell,.1,()=>videoReady&&shell.dataset.gpuReadyKey==='idle-video');
 for(const [index,choice]of choices.entries()){
  const el=document.createElement('button');el.className='object';el.dataset.object='idle-'+choice.missionId;el.dataset.idleMission=choice.missionId;el.dataset.planning='true';el.dataset.pathPresence='0';el.inert=true;
  el.setAttribute('aria-label',choice.title);el.innerHTML=v5IconTile(catalog,choice.taskId,layout.iconSize)+'<span class="object-label icon-caption" style="font-size:32px">'+v5CopyMarkup(choice.title)+'</span>';
  Object.assign(el.style,{position:'absolute',left:layout.icons[index].x+'px',top:layout.icons[index].y+'px',width:layout.iconSize+'px'});host.append(el);foreground.setTarget(host,el.dataset.object,{left:layout.icons[index].x,top:layout.icons[index].y});buttons.push(el);
  reveal(el,.2+index*.09,()=>!!el.dataset.sceneId);
 }
 foreground.invalidate();changed();
 function finishExit(){clearTimeout(exitTimer);exitTimer=undefined;resolveExit?.();resolveExit=null;}
 return {tick(dt,active){
  if(disposed)return;
  dt=Math.max(0,Math.min(dt,.05));
  for(const part of parts){
   // A slow decode/upload must not consume the entrance while invisible.
   if(exiting)part.alpha.step(0,dt,V5_MOTION.presenceOmega,reduced.matches);
   else if(active&&part.available()){
    part.age+=dt;
    if(reduced.matches||part.age>=part.delay)part.alpha.step(1,dt,V5_MOTION.presenceOmega,reduced.matches);
   }
   part.el.dataset.pathPresence=String(part.alpha.value);
  }
  ready=buttons.every(el=>Number(el.dataset.pathPresence)>.97);
  for(const el of buttons)el.inert=exiting||selected||!active||!ready;
  video.setPlaying(active&&!exiting&&videoReady&&Number(shell.dataset.pathPresence)>.01);
  const sceneReady=ready&&!exiting&&Number(logo.dataset.pathPresence)>.97&&Number(shell.dataset.pathPresence)>.97&&video.readyForAck(true);
  document.documentElement.dataset.idleMenuReady=sceneReady?document.documentElement.dataset.idleMenuScope??'':'';
  if(exiting&&parts.every(part=>part.alpha.at(0,.005,.05)))finishExit();changed();
 },select(id){if(disposed||exiting||selected||!ready||!choices.some(c=>c.missionId===id))return;selected=true;onSelect(id);},
  exit(){if(exitPromise)return exitPromise;if(disposed||parts.every(part=>part.alpha.at(0,.005,.05)))return Promise.resolve();exiting=true;exitPromise=new Promise(resolve=>{resolveExit=resolve;exitTimer=setTimeout(finishExit,1200);});return exitPromise;},
  restore(){if(disposed)return;exiting=false;selected=false;finishExit();exitPromise=undefined;},
  dispose(){if(disposed)return;disposed=true;finishExit();foreground.releaseVideo?.(video.element);video.dispose();for(const el of buttons)el.remove();logo.remove();shell.remove();foreground.invalidate();}
 };
}
