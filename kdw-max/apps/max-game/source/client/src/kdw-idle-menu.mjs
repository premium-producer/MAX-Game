import {guardImage,fallbackImageSource} from './kdw-graceful-media.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {v5IconTile} from './journey-v5-icons.mjs';
import {v5CopyMarkup} from './kdw-ui-copy.mjs';
import {createStandbyVideoPlayer} from './kdw-standby-videos.mjs';
import {IDLE_VIDEO_ASSET,idleMissionChoices,idleLayout} from './journey-v5-idle-layout.mjs';

export function createIdleMenu({host,foreground,catalog,assetCatalog,reduced,changed,onSelect,onError,layout:customLayout,hostRect}){
 const choices=idleMissionChoices(catalog),layout=customLayout??idleLayout(choices.length),buttons=[],parts=[];
 if(layout.missionOrder){const rank=id=>{const i=layout.missionOrder.indexOf(id);return i<0?layout.missionOrder.length:i;};choices.sort((a,b)=>rank(a.missionId)-rank(b.missionId));}
 const reveal=(el,delay,available)=>{el.dataset.idlePart='true';parts.push({el,delay,available,age:0,alpha:new V5MotionValue(0)});};
 let disposed=false,exiting=false,resolveExit,exitTimer,exitPromise,ready=false,selected=false,videoReady=false,videoFallback=false;
 const document=host.ownerDocument;
 Object.assign(host.style,{left:(hostRect?.left??0)+'px',top:(hostRect?.top??0)+'px',width:(hostRect?.w??4096)+'px',height:(hostRect?.h??1280)+'px',overflow:'visible'});
 host.dataset.routePhase='planning';host.dataset.uiPresence='1';host.dataset.contentPresence='1';host.dataset.activeTask='';host.dataset.sharedTask='';host.inert=false;
 const place=(el,r)=>Object.assign(el.style,{position:'absolute',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
 const logo=document.createElement('button');logo.className='object';logo.inert=true;logo.dataset.pathPresence='0';logo.setAttribute('aria-hidden','true');
 logo.innerHTML='<img data-independent-artwork="true" data-gpu-decoded="false" draggable="false" alt="MAX" src="./brand/assets/logos/max-primary-white.svg" style="display:block;width:100%;height:100%;object-fit:contain">';place(logo,layout.logo);host.append(logo);
 const image=logo.querySelector('img');void guardImage(image,{fallback:fallbackImageSource({width:500,height:200}),onChange:()=>{if(!disposed){foreground.refreshPart(logo);changed();}}}).ready.then(()=>{if(disposed)return;image.dataset.gpuDecoded='true';foreground.refreshPart(logo);changed();}).catch(onError);
 // GPU preparation may replace the decoded IMG with its cached clone.
 reveal(logo,0,()=>logo.querySelector('img')?.dataset.gpuReady==='true');
 const shell=document.createElement('section');shell.className='route-phone client-task';shell.inert=true;shell.dataset.pathPresence='0';place(shell,layout.video);host.append(shell);
 const app=document.createElement('div');app.className='demo-app';app.dataset.device='pc';Object.assign(app.style,{width:'100%',height:'100%',padding:'12px 10px',boxSizing:'border-box'});
 const content=document.createElement('div');content.className='phone-content';content.dataset.taskContent='';Object.assign(content.style,{width:'100%',height:'100%'});app.append(content);shell.append(app);
 const asset=assetCatalog.devices.find(a=>a.assetId===IDLE_VIDEO_ASSET);if(!asset)throw Error('MAX_IDLE_VIDEO_MISSING');
 let videoKey='idle-video';
 const readyVideo=(key=videoKey)=>{videoKey=key;videoReady=true;shell.dataset.sceneVersion=key;shell.dataset.mediaReadyKey=key;foreground.refreshPart(shell);changed();};
 const video=createStandbyVideoPlayer({document,asset,content,foreground,onChange:key=>{if(disposed)return;videoFallback=false;readyVideo(key);},onError});
 const fallbackVideo=()=>{if(disposed||videoReady)return;videoFallback=true;const still=document.createElement('img');still.style.cssText='display:block;width:100%;height:100%;object-fit:contain';still.src=fallbackImageSource({width:960,height:550});still.alt='MAX';content.replaceChildren(still);void guardImage(still).ready.then(()=>{if(!disposed)readyVideo();});};
 const videoDeadline=setTimeout(fallbackVideo,12000);
 void video.ready.then(()=>{if(disposed||videoFallback)return;clearTimeout(videoDeadline);readyVideo();}).catch(error=>{if(!disposed){fallbackVideo();onError(error);}});
 reveal(shell,.1,()=>videoReady&&shell.dataset.gpuReadyKey===videoKey);
 for(const [index,choice]of choices.entries()){
  const el=document.createElement('button');el.className='object';el.dataset.object='idle-'+choice.missionId;el.dataset.idleMission=choice.missionId;el.dataset.planning='true';el.dataset.pathPresence='0';el.inert=true;
  el.setAttribute('aria-label',choice.title);el.innerHTML=v5IconTile(catalog,choice.taskId,layout.iconSize)+'<span class="object-label icon-caption" style="font-size:32px">'+v5CopyMarkup(choice.title)+'</span>';
  if(customLayout){const caption=el.querySelector('.object-label');Object.assign(caption.style,{top:(layout.iconSize+16)+'px',left:'-30px',right:'auto',width:(layout.iconSize+60)+'px',maxWidth:(layout.iconSize+60)+'px',fontSize:'26px'});}
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
  for(const el of buttons)el.inert=exiting||selected||!active||!ready||document.documentElement.dataset.production==='true'&&document.documentElement.dataset.standEntryMode==='stella';
  video.setPlaying(active&&!exiting&&videoReady&&!videoFallback&&Number(shell.dataset.pathPresence)>.01);
  const sceneReady=ready&&!exiting&&Number(logo.dataset.pathPresence)>.97&&Number(shell.dataset.pathPresence)>.97&&(videoFallback||video.readyForAck(true));
  document.documentElement.dataset.idleMenuReady=sceneReady?document.documentElement.dataset.idleMenuScope??'':'';
  if(exiting&&parts.every(part=>part.alpha.at(0,.005,.05)))finishExit();changed();
 },select(id){if(disposed||exiting||selected||!ready||!choices.some(c=>c.missionId===id))return;selected=true;onSelect(id);},
  exit(){if(exitPromise)return exitPromise;if(disposed||parts.every(part=>part.alpha.at(0,.005,.05)))return Promise.resolve();exiting=true;exitPromise=new Promise(resolve=>{resolveExit=resolve;exitTimer=setTimeout(finishExit,1200);});return exitPromise;},
  restore(){if(disposed)return;exiting=false;selected=false;finishExit();exitPromise=undefined;},
  dispose(){if(disposed)return;disposed=true;clearTimeout(videoDeadline);finishExit();video.dispose();for(const el of buttons)el.remove();logo.remove();shell.remove();foreground.invalidate();}
 };
}
