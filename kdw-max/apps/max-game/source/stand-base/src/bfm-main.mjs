import {MISSION_CATALOG} from './content/mission-catalog.mjs';
import {createMissionSessionApplication} from './application/mission-session.mjs';
import {createBrowserPersistence} from './application/browser-persistence.mjs';
import {createServerSessionPort} from './application/server-session-port.mjs';
import {createWebGLSession} from './application/webgl-session.mjs';
import {createBFMTransition} from '../vendor/bfm-native/screen-transition.mjs';
import {bindBFMPalm} from './bfm-start-contact.mjs';
import {commonMapBackground} from './journey-common-map-background.mjs';
import {referenceIcons} from './journey-reference-icons.mjs';
import {icon} from './journey-icons.mjs';
import {createGradientController} from './bfm-gradient-controller.mjs';
import {pixelMapMarkup} from './bfm-pixel-map.mjs';
import {bfmStagePlacement,bfmViewportPlacement} from './bfm-play-area.mjs';
import {missionViewKey,missionScreenMarkup,warmMission,decodeMissionImages,presentationAllowsPoll} from './bfm-mission-screen.mjs';

// Presentation only: the existing SessionPort owns every answer and completion.
const $=selector=>document.querySelector(selector),stage=$('#stage'),palm=$('#palm');
const screens=[...stage.querySelectorAll('[data-screen]')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
const animations=new Set(); let key='',epoch=0,snapshot=null,session,contact,background,frame=0,last=0,closed=false;
const gradients=createGradientController();
let ready=false,visibleMs=0,revealingRun=null,loadController=null,loadingTimer=0,displayedTask=null,navigating=false,pressToken=null;
function updateGradients(){
 const speed=Number($('#gradient-speed').value),spread=Number($('#gradient-spread').value),phaseSpread=Number($('#gradient-phase').value);
 $('#gradient-speed-value').value=`${speed}°/с`;
 $('#gradient-spread-value').value=`±${spread}%`;
 $('#gradient-phase-value').value=`${phaseSpread}°`;
 gradients.configure({speed,spread:spread/100,phaseSpread,paused:document.hidden||reduced.matches||$('#gradient-pause').checked});
}
const error=e=>{console.error('MAX BFM',e);$('#error').hidden=false;$('#error').textContent=e.code==='MAX_BACKEND_DISABLED'?'Серверный backend MAX выключен в Stand Service.':e.code==='INCORRECT_ANSWER'?'Ответ неверный. Попробуйте ещё раз.':`Не удалось продолжить: ${e.code||e.message}`;};
const cancelAnimations=()=>{for(const a of animations)a.cancel();animations.clear();};
const enter=async(screen,{immediate})=>{
 const run=epoch;
 const pending=[...screen.querySelectorAll('[data-enter]')].map((element,i)=>{
  if(immediate)return Promise.resolve();
  // BFM WAAPI: browser timing, cancellation and completion. Ambient lives on a
  // child, so it never overwrites the main transform or delays completion.
  const reveal=screen.dataset.screen==='reveal';
  const delay=reveal?(i===0?0:600+(i-1)*250):i*110;
  const a=element.animate([{opacity:0,translate:`0 ${reveal?36:22}px`},{opacity:1,translate:'0 0'}],{duration:820,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
  if(document.hidden)a.pause();
  animations.add(a);
  return a.finished.catch(e=>{if(e.name!=='AbortError')throw e;}).finally(()=>animations.delete(a));
 });
 await Promise.all(pending);
 if(run!==epoch)return;
 document.documentElement.dataset.bfmPhase=screen.dataset.screen==='reveal'?'reveal-ready':screen.dataset.screen;

};
const transition=createBFMTransition({document,app:stage,screens,reduced:()=>reduced.matches,entrance:enter});
const glyph=id=>{const part=id.split('.').at(-1),key=({'create-id':'id',platform:'id'})[part]||part;return referenceIcons[key]||icon(key);};
function fillNodes(nodes){
 const fragment=document.createDocumentFragment();
 for(const [i,node] of nodes.entries()){
  const element=document.createElement('div');element.className='node';element.dataset.enter='';element.dataset.nodeId=node.nodeId;
  // Authored MAX ring endpoints only; browser owns interpolation. MAX is top.
  const angle=-Math.PI/2+i*2*Math.PI/nodes.length;
  element.style.transform=`translate(${Math.cos(angle)*410}px,${Math.sin(angle)*310}px)`;
  element.innerHTML=`<div class="node-inner"><div class="tile">${glyph(node.nodeId)}</div><p class="node-label"></p></div>`;
  element.querySelector('.node-label').textContent=node.title;
  element.style.setProperty('--float-delay',`${-i*430}ms`);fragment.append(element);
 }
 $('#nodes').replaceChildren(fragment);
 gradients.sync(stage);
}
function updateRoute(next){
 const route=$('#task-route'),nodes=next.view.nodes;
 const pool=new Map([...$('#nodes').children,...route.children].map(n=>[n.dataset.nodeId,n]));
 const active=Math.max(0,nodes.findIndex(n=>n.nodeId===next.state.taskId));
 for(const [i,node] of nodes.entries()){
  let element=pool.get(node.nodeId);
  if(!element){element=document.createElement('div');element.className='node';element.dataset.nodeId=node.nodeId;element.innerHTML=`<div class="node-inner"><div class="tile">${glyph(node.nodeId)}</div><p class="node-label"></p></div>`;}
  element.querySelector('.node-label').textContent=node.title;
  element.classList.toggle('node-complete',node.completed);element.classList.toggle('node-current',i===active);
  delete element.dataset.enter;element.style.transform='none';
  element.style.left=`${i<=active?160+(i-active)*260:1400+(i-active-1)*260}px`;
  route.append(element);pool.delete(node.nodeId);
 }
 for(const node of pool.values())node.remove();
 gradients.sync(stage);
}
function commitTask(incoming,next){
 const holder=$('#mission-content'),old=holder.querySelector('.task-dialog'),fresh=incoming.querySelector('.task-dialog');
 // Preserve the device shell and instruction card while replacing decoded content.
 if(old&&fresh&&old.querySelector('.demo-app').dataset.device===fresh.querySelector('.demo-app').dataset.device){
  for(const selector of ['.phone-content','.instruction-copy'])old.querySelector(selector).replaceChildren(...fresh.querySelector(selector).childNodes);
  old.setAttribute('aria-label',fresh.getAttribute('aria-label'));
 }else holder.replaceChildren(...incoming.childNodes);
 holder.dataset.kind=next.view.device?.kind??'phone';
 updateRoute(next);
 $('#task-links').hidden=!next.view.device;
}
async function present(next,phase,{first=false}={}){
 const ticket=++epoch;ready=false;visibleMs=0;contact?.cancel();cancelAnimations();transition.cancel();
 loadController?.abort();clearTimeout(loadingTimer);$('#media-status').hidden=true;stage.inert=true;
 const current=()=>ticket===epoch&&!closed;
 let update=()=>{},componentEntry=phase!=='task'||displayedTask!==`${next.state.runId}:${next.state.taskId}`;
 if(phase==='reveal'){$('#task-route').replaceChildren();fillNodes(next.view.nodes);}
 if(phase==='task'||phase==='finish'){
  loadController=new AbortController();
  const signal=AbortSignal.any([loadController.signal,AbortSignal.timeout(12000)]);
  const template=document.createElement('template');template.innerHTML=missionScreenMarkup(next,MISSION_CATALOG);
  // Template contents belong to an inert document: decode() rejects there.
  // Import into the active page before loading, while keeping it off screen.
  const incoming=document.importNode(template.content,true);
  loadingTimer=setTimeout(()=>{if(current()){$('#media-status').hidden=false;$('#media-message').textContent='Загружаем экран…';$('#media-retry').hidden=true;}},800);
  try{await decodeMissionImages(incoming,signal);}catch(e){
   if(!current()||e.name==='AbortError')return;
   console.error('MAX BFM screen preparation failed',{screenId:next.state.screenId,name:e.name,message:e.message});
   clearTimeout(loadingTimer);$('#media-status').hidden=false;$('#media-message').textContent='Экран не загрузился';$('#media-retry').hidden=false;
   return;
  }
  if(!current())return;
  clearTimeout(loadingTimer);$('#media-status').hidden=true;
  update=()=>{if(phase==='task')commitTask(incoming,next);else $('#mission-finish').replaceChildren(...incoming.childNodes);};
 }
 try{
  const applied=await transition.show(phase,{immediate:first||document.hidden,refresh:true,componentEntry,update});
  if(!current()||!applied)return;
  if(phase==='reveal'){
   revealingRun=null;key='';accept(snapshot);return;
  }
  displayedTask=phase==='task'?`${next.state.runId}:${next.state.taskId}`:null;
  ready=true;visibleMs=0;
 }catch(e){if(current()){error(e);ready=false;stage.inert=true;}}
}
function accept(next){
 const previous=snapshot;snapshot=next;
 const run=`${next.state.missionId}:${next.state.runId}`;
 if(previous?.state.status==='scan'&&next.state.scanned&&previous.state.runId===next.state.runId)revealingRun=run;
 if(!next.state.scanned)revealingRun=null;
 const phase=next.state.status==='menu'?'menu':next.state.status==='scan'?'scan':revealingRun===run?'reveal':['task','result'].includes(next.state.status)?'task':'finish';
 const nextKey=`${missionViewKey(next.state)}:${phase}`;
 $('#mission-title').textContent=MISSION_CATALOG.missions[next.state.missionId]?.title||'';
 $('#restart').hidden=phase==='menu';$('#menu-button').hidden=phase==='menu';
 $('#timer').hidden=['menu','finish'].includes(phase);
 for(const button of $('#missions').children){const p=next.state.progress[button.dataset.missionId];button.classList.toggle('mission-complete',!!p&&p.finished.length===MISSION_CATALOG.missions[button.dataset.missionId].taskIds.length&&!p.skipped.length);}
 if(nextKey===key)return;
 const first=!key&&previous===null;key=nextKey;
 $('#error').hidden=true;document.documentElement.dataset.bfmPhase=`${phase}-enter`;
 warmMission(next,MISSION_CATALOG);
 void present(next,phase,{first}).catch(error);
}
async function navigate(type,fields){
 if(navigating)return;navigating=true;
 try{
  contact.cancel();epoch++;ready=false;loadController?.abort();clearTimeout(loadingTimer);$('#media-status').hidden=true;cancelAnimations();transition.cancel();revealingRun=null;
  await session.owner(true);
  const result=type==='RESTART_MISSION'?await session.restart():await session.command(type,fields);
  if(!result?.reply.ok){key='';accept(session.snapshot);}
 }finally{navigating=false;}
}
async function answer(button){
 const token=button.dataset.answerToken;
 if(!ready||stage.inert||document.hidden||session.busy||token!==missionViewKey(snapshot.state))return;
 ready=false;stage.inert=true;
 const result=await session.act(button.dataset.screenId,button.dataset.answer,snapshot.state.revision);
 if(token===missionViewKey(snapshot.state)){
  ready=true;stage.inert=false;
  if(!result?.reply.ok&&result?.reply.code!=='INCORRECT_ANSWER')error(new Error('Действие не принято. Повторите попытку.'));
 }
}
function fitStage(){
 const placement=bfmStagePlacement();
 stage.style.left=`${placement.x}px`;stage.style.top=`${placement.y}px`;
 stage.style.transform=`translate(-50%,-50%) scale(${placement.scale})`;
}
function fit(){
 contact?.cancel();
 fitStage();
 const layout=$('#viewport-layout').value,{scale,x,y,backgroundWidth,backgroundHeight}=bfmViewportPlacement(innerWidth,innerHeight,layout);
 document.documentElement.dataset.bfmViewport=layout;
 $('#wall').style.transform=`translate(${x}px,${y}px) scale(${scale})`;
 // Keep the same physical pixels below the SVG/game, including the LiDAR crop.
 Object.assign($('#ambient').style,{left:`${x}px`,top:`${y}px`,width:`${backgroundWidth}px`,height:`${backgroundHeight}px`,transform:'none'});
 const identity=$('#identity'),hud=$('#hud'),status=$('#media-status');
 if(layout==='lidar'){
  Object.assign(identity.style,{left:`${(24-x)/scale}px`,top:`${(68-y)/scale}px`});
  Object.assign(hud.style,{right:`${4096-(innerWidth-24-x)/scale}px`,top:`${(68-y)/scale}px`});
  const centre=bfmStagePlacement();Object.assign(status.style,{left:`${centre.x-175}px`,top:`${centre.y-120}px`});
 }else{
  for(const [element,names] of [[identity,['left','top']],[hud,['right','top']],[status,['left','top']]])for(const name of names)element.style.removeProperty(name);
 }
}
async function boot(){
 fitStage();
 $('#pixel-map-overlay').innerHTML=pixelMapMarkup();
 $('#pixel-map-toggle').addEventListener('change',event=>{$('#pixel-map-overlay').hidden=!event.target.checked;});
 const query=new URLSearchParams(location.search);
 $('#viewport-layout').value=query.get('layout')==='lidar'?'lidar':'wall';
 $('#viewport-layout').addEventListener('change',()=>{
  const url=new URL(location.href);url.searchParams.set('layout',$('#viewport-layout').value);history.replaceState(null,'',url);fit();
 });
 const profile=query.get('backend')??'local';
 if(!['local','server'].includes(profile))throw Error('Неизвестный профиль backend');
 const port=profile==='local'?createMissionSessionApplication({persistence:createBrowserPersistence({storage:localStorage,key:'max-bfm-preview:v1'})}):createServerSessionPort({getAuthHeaders:async()=>{
  const response=await fetch('/api/state',{cache:'no-store'});
  if(!response.ok)throw Error('STAND_AUTH_UNAVAILABLE');
  const state=await response.json();
  if(typeof state.csrf!=='string')throw Error('STAND_AUTH_UNAVAILABLE');
  return {'X-VK-Token':state.csrf};
 }});
 session=createWebGLSession({port,catalog:MISSION_CATALOG,sessionId:query.get('session')??(profile==='server'?'site-shared':'bfm-start-preview'),profile,onSnapshot:accept,onError:error});
 $('#iteration').textContent=`MAX · BFM · версия 4 · backend: ${profile}`;
 for(const mission of Object.values(MISSION_CATALOG.missions)){
  const button=document.createElement('button');button.className='mission';button.dataset.enter='';button.dataset.missionId=mission.missionId;button.textContent=mission.title;
  if(mission.missing.length){const note=document.createElement('small');note.textContent='Есть недостающие материалы';button.append(note);}
  button.addEventListener('click',()=>void navigate('SELECT_MISSION',{missionId:mission.missionId}).catch(error));$('#missions').append(button);
 }
 contact=bindBFMPalm({button:palm,session,enabled:()=>snapshot?.state.status==='scan'&&!stage.inert&&!document.hidden,onHeld:held=>palm.classList.toggle('held',held)});
 $('#media-retry').addEventListener('click',()=>{key='';accept(snapshot);});
 stage.addEventListener('pointerdown',e=>{pressToken=e.target.closest('[data-answer]')?.dataset.answerToken??null;});
 stage.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.hasAttribute('data-answer')){if(e.detail===0||pressToken===button.dataset.answerToken)void answer(button).catch(error);pressToken=null;}else if(button.hasAttribute('data-return-menu'))void navigate('RETURN_MENU').catch(error);else if(button.hasAttribute('data-restart-mission'))void navigate('RESTART_MISSION').catch(error);});
 $('#restart').addEventListener('click',()=>void navigate('RESTART_MISSION').catch(error));
 $('#menu-button').addEventListener('click',()=>void navigate('RETURN_MENU').catch(error));
 addEventListener('resize',fit);
 gradients.sync(stage);updateGradients();
 $('#gradient-controls').addEventListener('input',updateGradients);
 background=commonMapBackground($('#ambient'),{standMask:true});
 fit();
 background.pause(document.hidden);
 await session.start();
 const tick=time=>{
  if(closed)return;
  const dt=last?Math.min((time-last)/1000,.05):0;last=time;
  if(!document.hidden){if(ready)visibleMs+=dt*1000;if(presentationAllowsPoll(snapshot,{ready,visibleMs}))void session.poll(Date.now());
   const s=snapshot?.state,remaining=s?.deadlineAt===null?null:Math.max(0,(s?.deadlineAt??0)-(s?.pausedAt??Date.now())),seconds=Math.ceil((remaining??0)/1000);$('#timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
  frame=requestAnimationFrame(tick);
 };frame=requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{
 background?.pause(document.hidden);
 updateGradients();
 last=0;stage.classList.toggle('motion-paused',document.hidden);
 for(const a of animations)document.hidden?a.pause():a.play();
 if(document.hidden){contact?.cancel();void session?.owner(false);}else if(snapshot?.state.missionId)void session?.owner(true);
});
addEventListener('blur',()=>contact?.cancel());
reduced.addEventListener('change',()=>{updateGradients();if(reduced.matches)for(const a of animations)a.finish();});
addEventListener('pagehide',()=>{closed=true;epoch++;loadController?.abort();clearTimeout(loadingTimer);cancelAnimationFrame(frame);contact?.dispose();cancelAnimations();gradients.dispose();transition.dispose();background?.dispose();void session?.close();});
void boot().catch(error);
