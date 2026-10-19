import {taskMediaMarkup,coverageMarkup,turnMediaPage,preloadTaskMedia} from './journey-media.mjs';
import {isIdTask,ID_IMAGES,IdPlayback} from './journey-id.mjs';
import {idTaskMarkup} from './journey-id-ui.mjs';
import {serviceBrandMarkup} from './journey-brand.mjs';
import {createWebGLField,MAX_DRAWING_BUFFER_PIXELS} from './webgl-field.js';
import {loadMissionCatalog,parseMissionCatalog,serializeMissionCatalog} from './mission-config.mjs';
import {configureMissions,ITEM_TYPES} from './mission-game.mjs';
import {PreparedAssets,collectAssetSources,prepareFonts} from './asset-preparation.mjs';
import {loadEarthContours} from './earth-contours.mjs';
import {loadUiShellConfig} from './ui-shell-config.mjs';
import {WALL,INTERACTION_BAND,zonesForLayout,journeyFieldBounds} from './circle-model.mjs';
import {freshSession,reduce,restoreSession,objects,stepsFor,isDone,hasAvailableObjects,showMissionCTA,availableSteps,availabilityHint,canChooseBusiness,needsBusinessChoice,planningSteps,routePhase,routeStart} from './journey-state.mjs';
import {TASKS,taskFor} from './journey-tasks.mjs';
import {icon} from './journey-icons.mjs';
import {background} from './journey-background.mjs';
import {createJourneyWebGLUI} from './journey-webgl-ui.mjs';
import {retainField} from './journey-retained-field.mjs';
import {JourneyIntent} from './journey-intent.mjs';
import {changesExistingRoute} from './journey-reconnect.mjs';
import {LARGE_BLOCK_SCALE,enlargeRouteLayout,fitLargeWindows} from './journey-large-blocks.mjs';
import {findFreeSlot,slotBox} from './journey-slot-placement.mjs';
import {installJourneyDrag} from './journey-drag.mjs';
import {installTaskDismiss} from './journey-dismiss.mjs';
import {radialLayout,placementAt,placementAnchor,objectMetrics,paddedBounds,revealOrigin,intersects} from './journey-radial.mjs';
import {nearestLinks,JOURNEY_LINK_STYLE,JOURNEY_LINK_REACH_TILES,linkReachPresence,tileEdgeCurve} from './journey-links.mjs';
import {popupBounds,anchoredTaskBounds,instructionLayout} from './journey-popup.mjs';
import {routeLayout,nextStepLabel,routeStartCaption} from './journey-route-layout.mjs';
import {clientContent,journeyStorageKey} from './journey-client.mjs';
import {clientTaskMarkup} from './journey-client-ui.mjs';
import {scenarioLayout,scenarioLinks,placementFlightPath,routeAssignments,routeChoices,routeValid} from './journey-topology.mjs';

const params=new URLSearchParams(location.search),service=params.get('service')==='1'&&document.documentElement.dataset.experiment!=='large-blocks';
// Pointer gestures belong to the game. Block HTML drag before it can cancel
// pointer capture or create a browser ghost, including dynamically added UI.
document.addEventListener('dragstart',event=>event.preventDefault(),true);
const clientEdition=document.documentElement.dataset.edition==='client';
const largeBlocks=document.documentElement.dataset.experiment==='large-blocks',blockScale=largeBlocks?LARGE_BLOCK_SCALE:1;
if(largeBlocks){document.documentElement.style.setProperty('--large-factor',String(blockScale/2.5));const m=objectMetrics(false,blockScale);for(const [key,value]of Object.entries({width:m.w,height:m.h,tile:m.tile,radius:30*blockScale,orb:104*blockScale}))document.documentElement.style.setProperty('--large-'+key,value+'px');}
const arena=document.querySelector('#arena'),ui=document.querySelector('#circles'),status=document.querySelector('#loading');
let mode=!clientEdition&&params.get('layout')==='two'?'two':'single',content,catalog,field,assets,ambient,foreground,paused=false,hosts=[],sessions=[],size=service?WALL:{width:1600,height:900};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>journeyStorageKey(clientEdition?'client':'current',service,mode)+(largeBlocks?':large-blocks-v2':'');
const saved=new Map(),idPlayback=new IdPlayback(),idPreloads=[];
const intents=new Map();
const slotTargets=new WeakMap();
function motionFeedback(i,message){const h=hosts[i];foreground?.showTapFeedback(h,{x:h.clientWidth/2,y:h.clientHeight*.7},message);}
function tickIntents(){
 for(const [host,intent]of intents){
  if(!host.isConnected){intents.delete(host);continue;}
  if(paused||document.hidden||foreground?.busy(host))continue;
  const i=hosts.indexOf(host),action=intent.take(sessions[i]);
  delete host.dataset.pendingIntent;
  if(action)queueMicrotask(()=>{if(hosts[i]===host)dispatch(i,action);});
 }
}
function tickIdScreens(delta){sessions.forEach((s,i)=>{const o=objects(s).find(o=>o.step===s.task);if(idPlayback.tick(i,o,delta,!paused&&!document.hidden&&!foreground?.busy(hosts[i]))){const expected=o;queueMicrotask(()=>{if(objects(sessions[i]).find(x=>x.step===sessions[i].task)===expected)dispatch(i,{type:'ANSWER',choice:0});});}});}
const button=(text,attr='',cls='')=>`<button class="pill ${cls}" ${attr}>${text}</button>`;
function changed(){document.documentElement.dataset.glassRevision=String(Number(document.documentElement.dataset.glassRevision||0)+1);}
function storeProgress(){saved.set(mode,sessions);try{localStorage.setItem(key(),JSON.stringify(sessions.map(s=>({...s,version:1,task:null,picker:null}))));}catch{/* Kiosk privacy mode can disable storage; session still works in memory. */}}
function changeZone(i,commit,options){
 if(foreground?.busy(hosts[i])&&!options?.interrupt){dispatch(i,{type:'UI',commit,options});return;}
 if(foreground)foreground.transition(hosts[i],commit,options);else commit();
}
function dispatch(i,a){
 if(paused)return;
 if(a.type==='RESET')slotTargets.delete(hosts[i]);
 const host=hosts[i],closing=a.type==='CLOSE'&&(sessions[i].task||sessions[i].picker)&&foreground?.canInterrupt(host);
 if(a.type==='CLOSE'){intents.get(host)?.clear();foreground?.cancelContent(host);}
 if(foreground?.busy(host)&&!closing){
  let intent=intents.get(host);if(!intent){intent=new JourneyIntent();intents.set(host,intent);}
  const disposition=intent.offer(a,sessions[i],{contentBusy:foreground.contentBusy(host)});
  host.dataset.pendingIntent=intent.pending?.action.type||'';
  motionFeedback(i,disposition==='acknowledged'?'Ответ принят':disposition==='superseded'?'Переходим к выбранному экрану':'Действие принято');return;
 }
 if(a.type==='UI'){changeZone(i,a.commit,a.options);return;}
 if(a.type==='CHOOSE'){const button=host.querySelector(`[data-place="${a.step}"]`);if(button)chooseObject(i,button);return;}
 if(['CLOSE','MENU','MISSION','RESET','FINAL','BRANCH'].includes(a.type))foreground?.cancelPlacement(hosts[i],{leaving:true});
 if(a.type==='PICK'&&sessions[i].screen==='field'&&!sessions[i].task&&!hasAvailableObjects(sessions[i],content)){
  const point=placementAnchor(a,fieldRect(i),objectMetrics(service,blockScale));
  foreground?.showTapFeedback(hosts[i],point,availabilityHint(sessions[i],content));return;
 }
 if(!clientEdition&&a.type==='OPEN'&&a.step==='open-max'){const tile=hosts[i].querySelector('[data-object="open-max"] .tile'),h=logicalBounds(hosts[i]),r=logicalBounds(tile);foreground?.showTapFeedback(hosts[i],{x:r.x-h.x+r.w/2,y:r.y+r.h/2-h.y},'MAX открыт');return;}
 if(a.type==='OPEN'&&!(clientEdition&&a.step==='open-max')&&(routePhase(sessions[i])!=='playing'||!availableSteps(sessions[i],content).some(step=>step.id===a.step))){
  const tile=hosts[i].querySelector(`[data-object="${a.step}"] .tile`),h=logicalBounds(hosts[i]),r=tile?logicalBounds(tile):h;
  foreground?.showTapFeedback(hosts[i],{x:r.x-h.x+r.w/2,y:r.y-h.y+r.h/2},routePhase(sessions[i])==='playing'?availabilityHint(sessions[i],content):'Сначала наметь весь путь');return;
 }
 const localTask=['OPEN','ANSWER','BRIEF_DONE'].includes(a.type)||a.type==='CLOSE'&&sessions[i].task;
 const next=reduce(sessions[i],a,content);if(next===sessions[i])return;
 if(a.type==='BEGIN_ROUTE')foreground?.seedRouteObject(hosts[i],'open-max',hosts[i].querySelector('.cta-orb'));
 if(a.type==='REVEAL')foreground?.seedReveal(hosts[i],objects(next).find(o=>!objects(sessions[i]).some(v=>v.step===o.step))?.step,hosts[i].querySelector(`[data-route-next="${a.slot}"] .tile`));
 const reconnect=sessions[i].screen==='field'&&next.screen==='field'&&sessions[i].mission===next.mission&&changesExistingRoute(routeAssignments(sessions[i]),routeAssignments(next));
 const commit=()=>{
  if(reconnect)foreground?.reconnectRoute(hosts[i]);
  sessions[i]=next;
  if(['BEGIN_ROUTE','PLACE','BRANCH','SWAP','REVEAL','EDIT'].includes(a.type)&&routePhase(next)!=='playing')arrangeRoute(i);
  storeProgress();
  if(a.type==='MOVE'){const o=activeObjects(sessions[i]).find(o=>o.step===a.step),el=hosts[i].querySelector(`[data-object="${a.step}"]`);if(o&&el){el.style.setProperty('--x',o.x);el.style.setProperty('--y',o.y);foreground?.setTarget(hosts[i],a.step,o);}refreshRouteSlots(i);changed();syncScene();}
  else if(localTask)renderTask(i);
  else render(i);
 };
 if(a.type==='ANSWER'){
  if(next.task){if(foreground)foreground.transitionContent(hosts[i],commit);else commit();} // Shell stays open; only copy/options change.
  else changeZone(i,commit,{local:true,exitOnly:true,holdFocus:true});
 }else if(a.type==='BRANCH')changeZone(i,commit,{local:true});
 else if(['MOVE','PLACE','BEGIN_ROUTE','SWAP','REVEAL'].includes(a.type)||a.type==='EDIT'&&!next.picker)commit();
 else if(['CONTINUE_ROUTE','BRIEF_DONE'].includes(a.type))changeZone(i,commit,{local:true,exitOnly:true});
 else if(['OPEN','PICK','EDIT'].includes(a.type)||a.type==='CLOSE'&&(sessions[i].task||sessions[i].picker)){
  changeZone(i,commit,{local:true,enterOnly:!sessions[i].task&&!sessions[i].picker,exitOnly:a.type==='CLOSE',interrupt:!!closing});
 }else changeZone(i,commit);
}
function stepList(s){return stepsFor(content,s.mission,s.branch);}
function activeObjects(s){const ids=new Set(stepList(s).map(o=>o.id));return [...(routeStart(s)?[routeStart(s)]:[]),...objects(s).filter(o=>ids.has(o.step))];}
function successMarkup(s){const m=content.missions.find(m=>m.id===s.mission);return `<div class="field-center"><section class="field-success glass-control ${m.presentation?'presentation-success':''}" role="dialog" aria-modal="false" aria-label="Миссия выполнена"><h2>Миссия выполнена</h2><p>${esc(m.result)}</p>${m.qr?`<img draggable="false" class="presentation-qr" src="${esc(m.qr.image)}" alt="QR-код: ${esc(m.qr.url)}"><p class="qr-caption">${esc(m.qr.label)}</p><p class="qr-caption">Учебный путь · Госуслуги без реальной авторизации</p>`:''}${notify(s)}</section></div>`;}
function notify(s){return content.missions.filter(m=>!m.presentation).every(m=>s.completed.includes(m.id))?button('К финалу →','data-final','primary'):button('К миссиям →','data-menu','primary');}
function card(m,s){return `<button class="mission-card glass-control" data-mission="${m.id}"><span class="medallion">${icon(m.id)}</span><span><strong>${esc(m.title)}</strong><small>${esc(m.description)}</small>${coverageMarkup(m)}</span><span class="card-state">${s.completed.includes(m.id)?'✓':'↗'}</span></button>`;}
function objectMarkup(o,s){
 const planning=routePhase(s)!=='playing';
 if(o.step==='open-max')return `<button class="object route-first" data-object="open-max" style="--x:${o.x};--y:${o.y}" aria-label="Открыть MAX — ${esc(routeStartCaption(s.mission))}"><span class="tile glass-control"><span class="route-intro-plus" aria-hidden="true">${icon('plus')}</span><img draggable="false" class="route-brand" src="./brand/assets/logos/max-symbol-white.svg" alt="MAX"></span><span class="object-label icon-caption">Открыть MAX<small>${esc(routeStartCaption(s.mission))}</small></span></button>`;
 const step=stepList(s).find(x=>x.id===o.step);
 return `<button class="object" data-object="${o.step}" data-planning="${planning}" aria-expanded="${s.task===o.step}" style="--x:${o.x};--y:${o.y}" aria-label="${esc(step.label)}${planning?(clientEdition?' — заменить или поменять местами':' — шаг намечен'):o.done?' — выполнено':' — открыть задание'}"><span class="tile glass-control">${icon(o.step)}<i class="badge" data-done="${o.done}">${o.done?icon('check'):'!'}</i></span><span class="object-label icon-caption">${esc(step.label)}</span></button>`;
}
function planningLayout(i,s=sessions[i]){
 const host=hosts[i];if(!clientEdition)return routeLayout(activeObjects(s).length,hasAvailableObjects(s,content),host.clientWidth,host.clientHeight,service);
 const layout=scenarioLayout(s,host.clientWidth,host.clientHeight,service);
 if(largeBlocks)enlargeRouteLayout(layout,host.clientWidth,host.clientHeight,objectMetrics(service,blockScale));
 if(host.querySelector('.playfield'))for(const o of activeObjects(s))if(o.freePosition)layout.positions[o.step]=placementAnchor(o,fieldRect(i),objectMetrics(service,blockScale));
 if(host.querySelector('.playfield'))resolveRouteSlots(i,s,layout);
 return layout;
}
function slotShape(el,captionWidth,extraCaption=0){
 const m=objectMetrics(service,blockScale),cx=m.cx??m.w/2,pad=largeBlocks?2:12;
 const label=el?.querySelector('.object-label');
 const labelHeight=Math.max(extraCaption,label?.offsetHeight||(service?60:90)*blockScale);
 return largeBlocks?{left:cx+pad,right:m.w-cx+pad,top:m.tile/2+pad,bottom:Math.max(m.h,labelHeight)-m.tile/2+pad}:
  {left:Math.max(m.w,captionWidth,label?.offsetWidth||0)/2+pad,right:Math.max(m.w,captionWidth,label?.offsetWidth||0)/2+pad,
   top:m.tile/2+pad,bottom:Math.max(m.h-m.tile/2,m.tile/2+7+labelHeight)+pad};
}
function resolveRouteSlots(i,s,layout){
 const host=hosts[i],field=fieldRect(i),metrics=objectMetrics(service,blockScale),h=logicalBounds(host);
 // The service host is already the physical 1–1.8m interaction band. The wider
 // movement field remains available to placed nodes, never to a new '+' control.
 const bounds={x:field.x,y:Math.max(18,field.y),w:field.w,h:Math.min(host.clientHeight-18,field.y+field.h)-Math.max(18,field.y)};
 const obstacles=[];
 for(const o of activeObjects(s)){
  const el=host.querySelector(`[data-object="${o.step}"]`),shape=slotShape(el,layout.captionWidth);
  let target=layout.positions[o.step];
  if(el?.dataset.dragging==='true')target=placementAnchor({x:Number(el.style.getPropertyValue('--x')),y:Number(el.style.getPropertyValue('--y'))},field,metrics);
  if(target)obstacles.push(slotBox(target,shape));
  if(el&&(o.freePosition||el.dataset.dragging==='true')){
   const r=logicalBounds(el.querySelector('.tile'));
   obstacles.push(slotBox({x:r.x+r.w/2-h.x-host.clientLeft,y:r.y+r.h/2-h.y-host.clientTop},shape));
  }
 }
 const back=host.querySelector('.network-back');if(back){const r=logicalBounds(back);obstacles.push({...r,x:r.x-h.x-host.clientLeft,y:r.y-h.y-host.clientTop});}
 let cache=slotTargets.get(host);if(!cache){cache=new Map();slotTargets.set(host,cache);}
 for(const slot of layout.slots){
  const key=`${s.mission}:${slot.id}`,shape=slotShape(host.querySelector(`[data-route-next="${slot.id}"]`),layout.captionWidth);
  // Large controls already include the wide horizontal caption/hit area.
  // Keep its small template gutter instead of adding 42px and exhausting a row.
  const p=findFreeSlot(cache.get(key)||slot,shape,bounds,obstacles,largeBlocks?2:18);
  slot.available=!!p;
  if(p){Object.assign(slot,p);Object.assign(layout.points[slot.id],p);cache.set(key,p);obstacles.push(slotBox(p,shape));}
 }
}
function refreshRouteSlots(i){
 if(!clientEdition||!hosts[i]?.querySelector('[data-route-next]'))return;
 const layout=planningLayout(i),field=fieldRect(i),metrics=objectMetrics(service,blockScale);
 let blocked=false;
 for(const slot of layout.slots){
  const el=hosts[i].querySelector(`[data-route-next="${slot.id}"]`);if(!el)continue;
  const hidden=slot.available===false;blocked||=hidden;
  if(el.hidden!==hidden){el.hidden=hidden;foreground?.refreshPart(el);}
  if(hidden)continue;
  const p=placementAt(slot.x,slot.y,field,metrics);
  el.style.setProperty('--x',p.x);el.style.setProperty('--y',p.y);
  foreground?.setTarget(hosts[i],`route-add:${slot.id}`,p);
 }
 const notice=hosts[i].querySelector('[data-slot-space]');
 if(blocked&&!notice){const el=document.createElement('p');el.className='route-error';el.dataset.slotSpace='';el.setAttribute('role','status');el.textContent='Освободи немного места для следующего шага';hosts[i].append(el);foreground?.refreshPart(el);}
 else if(!blocked&&notice){notice.remove();foreground?.invalidate();}
}
function routePoint(layout,o,n){return clientEdition?layout.positions[o.step]:layout.centers[n];}
function arrangeRoute(i){
 const s=sessions[i],layout=planningLayout(i),field=fieldRect(i),metrics=objectMetrics(service,blockScale);
 activeObjects(s).forEach((o,n)=>{const p=routePoint(layout,o,n);if(p)Object.assign(o,placementAt(p.x,p.y,field,metrics));});
}
function nextRoutePoint(i,id){const layout=planningLayout(i);return clientEdition?layout.slots.find(slot=>!id||slot.id===id):layout.centers.at(-1);}
function readyMarkup(){return `<div class="field-center"><section class="field-success route-ready glass-control" role="dialog" aria-modal="false" aria-label="Путь намечен"><h2>Отлично, путь намечен!</h2><p>Теперь пройди задание на каждом шаге.</p>${button('Продолжить','data-continue-route','primary')}</section></div>`;}
function contextNavigation(s){return `<nav class="context-navigation" aria-label="Навигация миссии">${button('Миссии','data-menu')}${canChooseBusiness(s,content)?button('Инструменты','data-branches'):''}</nav>`;}
function taskMarkup(s){
 if(clientEdition)return clientTaskMarkup(s,content);
 const o=objects(s).find(x=>x.step===s.task);if(!o)return '';
 if(isIdTask(o.step))return idTaskMarkup(s,o);
 const step=stepList(s).find(x=>x.id===o.step),task=taskFor(o);
 return `<section class="task-dialog context-popup" role="dialog" aria-modal="false" aria-label="${esc(step.label)}"><div class="instruction glass-control"><div class="instruction-copy" data-task-content><span class="eyebrow">${o.done?'ЗАДАНИЕ ВЫПОЛНЕНО':'ВОЗМОЖНОСТИ MAX'}</span><h2>${o.done?'Готово!':esc(step.label)}</h2><p>${o.done?'Попробуй остальные объекты на поле.':esc(task.copy)}</p></div><span class="task-icon tile" aria-hidden="true"></span></div><div class="demo-app"><span class="phone-camera" aria-hidden="true"></span><div class="app-top">${serviceBrandMarkup()}<span>Учебный экран</span></div><div class="phone-content" data-task-content><h3>${o.done?'Возможность открыта':esc(task.title)}</h3>${taskMediaMarkup(o,{client:false})}${o.done?`<div class="task-success">${icon('check')}<p>Задание выполнено</p></div>${button('Вернуться на поле','data-close','primary')}`:`<div class="app-progress" aria-label="Шаг ${o.stage+1} из ${TASKS[o.step].length}">${TASKS[o.step].map((_,i)=>`<i class="${i<=o.stage?'on':''}"></i>`).join('')}</div><div class="task-options">${task.options.map((v,i)=>button(esc(v),`data-answer="${i}"`,'app-option')).join('')}</div><div class="task-notice" role="status">${esc(s.notice||'Выбери действие')}</div>`}${contextNavigation(s)}</div><span class="phone-home" aria-hidden="true"></span></div><button class="close pill" data-close aria-label="Закрыть задание">${icon('close')}</button></section>`;
}
function overlayInput(host){for(const child of host.children)child.inert=false;}
// Task updates keep field DOM, motion states and GPU meshes alive.
function renderTask(i){
 const host=hosts[i],s=sessions[i],old=host.dataset.sharedTask;
 const focused=document.activeElement,answer=focused?.dataset?.answer,restoreFocus=Boolean(focused?.closest('.task-dialog'));
 if(old!==s.task){foreground?.releaseObject(host);if(s.task){foreground?.holdObject(host,s.task);delete host.dataset.contentPresence;delete host.dataset.contentPhase;}}
 host.dataset.activeTask=s.task||'';host.dataset.sharedTask=s.task||'';
 for(const nextControl of host.querySelectorAll('[data-route-next]'))nextControl.disabled=Boolean(s.task||s.picker);
 for(const el of host.querySelectorAll('[data-object]')){
  el.setAttribute('aria-expanded',String(el.dataset.object===s.task));
  const o=objects(s).find(o=>o.step===el.dataset.object),badge=el.querySelector('.badge');
  if(o&&badge.dataset.done!==String(o.done)){
   const step=stepList(s).find(step=>step.id===o.step);el.setAttribute('aria-label',`${step.label}${o.done?' — выполнено':' — открыть задание'}`);
   // Updating a check mark rebuilds only this badge, never the field or its pose.
   badge.dataset.done=String(o.done);
   if(o.done){badge.innerHTML=icon('check');foreground?.refreshPart(el);}
  }
 }
 const existing=host.querySelector('.task-dialog'),keepDialog=existing&&s.task&&old===s.task;
 if(!keepDialog)existing?.remove();
 host.querySelector('.picker')?.remove();
 host.querySelector('.field-success')?.parentElement.remove();
 const added=[];
 if(keepDialog){
  // Retain the dialog, frosted card and phone shell; update their content in place.
  const template=document.createElement('template');template.innerHTML=taskMarkup(s);
  const instruction=existing.querySelector('.instruction');
  const before={top:parseFloat(instruction.style.top),height:parseFloat(instruction.style.height)};
  for(const selector of ['.instruction-copy','.phone-content']){
   const part=existing.querySelector(selector);part.innerHTML=template.content.querySelector(selector).innerHTML;added.push(part);
  }
  if(existing.matches('.id-task'))added.push(existing.querySelector('.close'));
  positionPopup(i);foreground?.resizeInstruction(instruction,before);
 }else if(s.task){host.insertAdjacentHTML('beforeend',taskMarkup(s));positionPopup(i);added.push(host.lastElementChild);}
 else if(isDone(s,content)){
  host.insertAdjacentHTML('beforeend',successMarkup(s));added.push(host.lastElementChild);
 }
 foreground?.refreshParts(added);overlayInput(host);changed();syncScene();
 if(restoreFocus){const target=s.task?(host.querySelector(`[data-answer="${answer}"]`)||host.querySelector('.task-dialog [data-close]')):host.querySelector(`[data-object="${old}"]`);target?.focus({preventScroll:true});}
}
function positionPopup(i,anchorElement){
 const host=hosts[i],popup=host.querySelector('.context-popup');if(!popup)return;
 const source=anchorElement||host.querySelector(`[data-object="${sessions[i].task}"] .tile`);
 const h=logicalBounds(host),r=source?logicalBounds(source):{x:h.x+h.w/2,y:h.y+h.h/2,w:0,h:0};
 const hostStyle=getComputedStyle(host);
 const anchor={x:r.x-h.x+r.w/2-parseFloat(hostStyle.borderLeftWidth),y:r.y-h.y+r.h/2-parseFloat(hostStyle.borderTopWidth),radius:r.w/2};
 const compact=popup.classList.contains('reset-popup');
 const b=compact?popupBounds(anchor,host.clientWidth,host.clientHeight,{compact,scale:blockScale}):anchoredTaskBounds(anchor,host.clientWidth,host.clientHeight,blockScale);
 popup.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;--phone-height:${b.h}px;--popup-scale:${b.h/380};--window-scale:${b.h/(compact?218:520)}`;
 if(!compact){
  host.dataset.bigWindow=String(largeBlocks);popup.dataset.mirrored=String(b.mirrored);popup.dataset.detached=String(b.detached);
  popup.style.transformOrigin=`${b.originX}px ${b.originY}px`;
  const instruction=popup.querySelector('.instruction'),tile=popup.querySelector('.task-icon'),copy=popup.querySelector('.instruction-copy');
  instruction.style.cssText=`left:${b.instructionX}px;top:0;width:${b.copy}px;height:auto`;
  copy.style.cssText='';
  let layout=instructionLayout(b,copy.getBoundingClientRect().height/(arena.getBoundingClientRect().width/size.width));
  // Measure at the final width; remeasure wraps after reachability font fitting.
  let textScale=b.h/380;
  for(let pass=0;pass<5&&copy.scrollHeight>layout.available;pass++){
   textScale*=Math.min(.95,layout.available/Math.max(1,copy.scrollHeight));
   copy.style.setProperty('--popup-scale',String(textScale));
   layout=instructionLayout(b,copy.getBoundingClientRect().height/(arena.getBoundingClientRect().width/size.width));
  }
  instruction.style.top=`${layout.top}px`;instruction.style.height=`${layout.height}px`;
  if(!layout.above)copy.style.marginTop=`${b.tile+18}px`;
  tile.style.cssText=`position:absolute;left:${b.iconX-b.instructionX-b.tile/2}px;top:${layout.iconTop}px;width:${b.tile}px;height:${b.tile}px;border-radius:${getComputedStyle(source).borderTopLeftRadius};margin:0`;

 }

 if(largeBlocks)fitLargeWindows(host);
 popup.dataset.anchorX=anchor.x;popup.dataset.anchorY=anchor.y;
}
function render(i){
 const restoreField=sessions[i].screen==='field'?retainField(hosts[i]):null;
 const priorSafeZones=sessions[i].picker?pickerObstacles(hosts[i]):[];
 foreground?.releaseObject(hosts[i]);delete hosts[i].dataset.sharedTask;
 const s=sessions[i],host=hosts[i];host.dataset.screen=s.screen;host.dataset.routePhase=routePhase(s);host.dataset.activeTask=s.task||'';host.dataset.ctaVisible=String(showMissionCTA(s,content));
 host.dataset.pickerObject=s.picker?.replace||'';
 if(s.screen==='cta')host.innerHTML=`<div class="attract-icons" aria-hidden="true">${['call','channel','id','comments'].map((k,n)=>`<span class="tile float-${n}">${icon(k)}</span>`).join('')}</div><div class="cta-copy">${serviceBrandMarkup('brand-logo')}<h1>Открой возможности MAX</h1><p>Создавай своё пространство<br>и выполняй задания</p>${button('Начать →','data-start','primary')}${!service?`<span class="edition-caption">${largeBlocks?'Эксперимент · Всё ×1,67':clientEdition?'Версия 2 · По требованиям клиента':'Версия 1 · Текущая механика'}</span>${button(largeBlocks?'Обычная клиентская версия':clientEdition?'Открыть версию 1':'Открыть версию 2 — клиент','data-edition-switch','edition-switch')}`:''}</div>`;
 else if(s.screen==='missions')host.innerHTML=`<header class="zone-header"><div><span class="eyebrow">ВОЗМОЖНОСТИ MAX · ${content.missions.filter(m=>!m.presentation&&s.completed.includes(m.id)).length} / 4${clientEdition?' · +2 тестовых':''}</span><h2>Выбери миссию</h2></div>${content.missions.filter(m=>!m.presentation).every(m=>s.completed.includes(m.id))?notify(s):button('Начать заново','data-reset')}</header><div class="mission-choices ${clientEdition?'has-presentations':''}">${content.missions.map(m=>card(m,s)).join('')}</div>`;
 else if(s.screen==='final')host.innerHTML=`<div class="final-copy"><span class="eyebrow">ВОЗМОЖНОСТИ MAX</span><h1>Все миссии выполнены</h1><p>Ты открыл возможности MAX</p><div class="final-icons">${content.missions.filter(m=>!m.presentation).map(m=>`<div><span class="tile">${icon(m.id)}<i class="badge">${icon('check')}</i></span><small>${esc(m.id==='digital-id'?'Цифровой ID':m.id==='blogger'?'Блогер':m.id==='business'?'Бизнес':m.title)}</small></div>`).join('')}</div><div class="final-buttons">${button('Выбрать миссию','data-menu')}${button('Начать заново','data-reset','primary')}</div></div>`;
 else {
 const m=content.missions.find(m=>m.id===s.mission),placed=activeObjects(s),done=isDone(s,content);
 host.innerHTML=`<div class="playfield" aria-label="Игровое поле: собери путь и пройди задания на каждом шаге">${placed.map(o=>objectMarkup(o,s)).join('')}</div>${!placed.length?`<div class="field-center"><button class="mission-cta" data-cta ${s.picker?'disabled aria-hidden="true"':''}><span class="cta-orb glass-control">${icon('plus')}</span><span class="cta-label">${esc(m.cta||m.title)}</span></button></div>`:''}${done&&!s.task?successMarkup(s):''}`;
 layoutField(i);
 if(routePhase(s)!=='playing'){
  arrangeRoute(i);
  for(const o of placed){const el=host.querySelector(`[data-object="${o.step}"]`);el.style.setProperty('--x',o.x);el.style.setProperty('--y',o.y);}
 }
 host.style.setProperty('--route-caption-width',`${planningLayout(i).captionWidth}px`);
 if(placed.length&&hasAvailableObjects(s,content)){
  const slots=clientEdition?planningLayout(i).slots:[{...nextRoutePoint(i),id:'',label:nextStepLabel(placed.length+1)}];
  for(const point of slots){const p=placementAt(point.x,point.y,fieldRect(i),objectMetrics(service,blockScale));
   const last=clientEdition&&point.allowed.length===1,label=last?`Финальный шаг · ${choiceStep(s,point.allowed[0]).label}`:point.label;
   host.querySelector('.playfield').insertAdjacentHTML('beforeend',`<button class="object route-next" data-route-next="${point.id}" aria-label="${esc(label)}${point.id.startsWith('id-')?' '+(Number(point.id.slice(3))+1):''} — ${last?'показать шаг':'выбрать иконку'}" style="--x:${p.x};--y:${p.y}" ${s.picker?'disabled':''}><span class="tile glass-control">${icon('plus')}</span><span class="object-label icon-caption">${esc(label)}</span></button>`);
  }
 }
 if(routePhase(s)==='ready'&&!done&&!s.picker){host.dataset.popupPresence='1';host.insertAdjacentHTML('beforeend',readyMarkup());}
 if(clientEdition&&routePhase(s)==='building'&&!routeValid(s)&&!s.picker)host.insertAdjacentHTML('beforeend','<p class="route-error" role="status">Проверь порядок шагов. Нажми на иконку, чтобы заменить её, или перетащи на другую, чтобы поменять местами.</p>');
 if(placed.length)host.insertAdjacentHTML('beforeend',`<button class="pill network-back" data-menu aria-label="Назад к миссиям">${icon('back')}<span>Назад</span></button>`);
 if(s.picker){
  const remaining=planningSteps(s,content).filter(step=>!placed.some(o=>o.step===step.id));
  const picker=document.createElement('div');picker.className='picker radial-picker';picker.setAttribute('role','dialog');picker.setAttribute('aria-label','Выбери объект. Касание вне иконок закрывает меню.');
  const slot=clientEdition?planningLayout(i).slots.find(slot=>slot.id===s.picker.slot):null;
  const point=pickerAnchor(i),choices=clientEdition?routeChoices(s,s.picker.replace).map(id=>({...choiceStep(s,id),attr:`${s.picker.replace?'data-replace-choice':'data-place'}="${id}"`,swap:placed.some(o=>o.step===id)})):[...(needsBusinessChoice(s,content)?m.branches.map(b=>({id:b.step.id,label:b.step.label,attr:`data-place="${b.step.id}" data-plan-branch="${b.id}"`})):[]),...remaining.map(step=>({...step,attr:`data-place="${step.id}"`}))];
  picker.innerHTML=choices.map((step,n)=>`<button ${step.attr} data-orbit-index="${n}" style="width:${service?100:128}px;--orbit-tile:${service?64:88}px"><span class="tile glass-control">${icon(step.id)}</span><span class="icon-caption">${esc(step.label)}${step.swap?' · поменять местами':''}</span></button>`).join('')||'<p class="radial-empty">Все объекты уже на поле</p>';
  host.append(picker);
  const buttons=[...picker.querySelectorAll('button')],obstacles=[...priorSafeZones,...pickerObstacles(host,false)].map(r=>clientEdition?{x:r.x-18,y:r.y-18,w:r.w+36,h:r.h+36}:r);
  // Measure real wrapped copy, including MAX's subtitle; fixed icon dimensions
  // alone miss the overlap reported on the field. Reserve both current and target
  // field poses when a user opens the picker before the row has finished moving.
  let sizes=buttons.map(el=>({w:el.offsetWidth,h:el.scrollHeight}));
  const tileSize=service?64:88,single=sizes[0]&&{x:point.x-sizes[0].w/2,y:point.y-tileSize/2,w:sizes[0].w,h:Math.max(service?104:142,sizes[0].h),tile:tileSize};
  // A final choice can be inside a pocket surrounded by installed nodes.
  // Reveal in that free pocket instead of offering an unreachable outside flight.
  const centered=clientEdition&&choices.length===1&&single.x>=14&&single.y>=14&&single.x+single.w<=host.clientWidth-14&&single.y+single.h<=host.clientHeight-14&&!obstacles.some(o=>intersects(single,o,6));
  let layout=centered?[single]:radialLayout(point,choices.length,host.clientWidth,host.clientHeight,service,obstacles,sizes);
  if(largeBlocks){
   // Shrink only this menu if the full-size choices cannot fit its safe zones.
   for(const menuScale of [blockScale,1.5,1,.8]){
    for(const el of buttons){el.style.width=`${128*menuScale}px`;el.style.setProperty('--orbit-tile',`${88*menuScale}px`);el.style.fontSize=`${20*menuScale}px`;el.style.lineHeight=`${23*menuScale}px`;el.style.gap=`${12*menuScale}px`;el.querySelector('.tile').style.borderRadius=`${27*menuScale}px`;}
    sizes=buttons.map(el=>({w:el.offsetWidth,h:el.scrollHeight}));
    layout=radialLayout(point,choices.length,host.clientWidth,host.clientHeight,false,obstacles,sizes,menuScale);
    if(layout.length)break;
   }
  }
  if(choices.length&&!layout.length){
   sessions[i]=reduce(s,{type:'CLOSE'},content);render(i);
   foreground?.showTapFeedback(host,point,'Недостаточно свободного места для выбора');return;
  }
  buttons.forEach((el,n)=>{
   const r=layout[n];
   const origin=revealOrigin(point,r,[...obstacles,...layout.filter((_,j)=>j!==n)]);
   el.dataset.originX=origin.x;el.dataset.originY=origin.y;
   el.style.left=`${r.x}px`;el.style.top=`${r.y}px`;el.style.height=`${r.h}px`;
  });
 }

 if(s.task)host.insertAdjacentHTML('beforeend',taskMarkup(s));
 }
 restoreField?.();for(const o of activeObjects(s))foreground?.setTarget(host,o.step,o);
 for(const el of host.querySelectorAll('[data-route-next]'))foreground?.setTarget(host,`route-add${el.dataset.routeNext?':'+el.dataset.routeNext:''}`,{x:Number(el.style.getPropertyValue('--x')),y:Number(el.style.getPropertyValue('--y'))});
 refreshRouteSlots(i);positionPopup(i);if(largeBlocks)fitLargeWindows(host);overlayInput(host);changed();foreground?.invalidate();requestAnimationFrame(syncScene);
}
function pickerObstacles(host,includeBack=true){
 const h=logicalBounds(host),selectors=includeBack?'[data-object],.network-back':'[data-object]';
 return [...host.querySelectorAll(selectors)].map(el=>paddedBounds(
  [el,...el.querySelectorAll('.tile,.icon-caption,.badge')].map(part=>{const r=logicalBounds(part);return{...r,x:r.x-h.x-host.clientLeft,y:r.y-h.y-host.clientTop};}),service?14:20));
}
function choiceStep(s,id){const m=content.missions.find(m=>m.id===s.mission);return [...m.steps,...(m.branches||[]).map(b=>b.step)].find(v=>v.id===id);}
function fieldRect(i){const el=hosts[i].querySelector('.playfield');return{x:el.offsetLeft,y:el.offsetTop,w:el.clientWidth,h:el.clientHeight};}
function layoutField(i){const host=hosts[i],el=host.querySelector('.playfield');if(!el)return;const b=journeyFieldBounds(host.clientWidth,host.clientHeight,service);el.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;right:auto;bottom:auto`;}
function pickerAnchor(i){return placementAnchor(sessions[i].picker,fieldRect(i),objectMetrics(service,blockScale));}
function chooseObject(i,button){
 if(foreground?.busy(hosts[i])){dispatch(i,{type:'CHOOSE',step:button.dataset.place});return;}
 const picker=button.closest('.picker');if(!picker||picker.dataset.selecting)return;
 const step=button.dataset.place,action={type:'PLACE',step,branch:button.dataset.planBranch};
 const future=reduce(sessions[i],action,content);if(future===sessions[i])return;
 const nodes=activeObjects(future),layout=planningLayout(i,future),planning=routePhase(future)!=='playing';
 const p=planning?routePoint(layout,{step},nodes.findIndex(o=>o.step===step)):pickerAnchor(i);
 const h=logicalBounds(hosts[i]),r=logicalBounds(button.querySelector('.tile'));
 const tiles=[...hosts[i].querySelectorAll('[data-object] .tile')].map(el=>{const b=logicalBounds(el);return {...b,x:b.x-h.x-hosts[i].clientLeft,y:b.y-h.y-hosts[i].clientTop};});
 const waypoints=clientEdition?placementFlightPath({x:r.x+r.w/2-h.x-hosts[i].clientLeft,y:r.y+r.h/2-h.y-hosts[i].clientTop},p,pickerObstacles(hosts[i],false),tiles,hosts[i].clientWidth,hosts[i].clientHeight,objectMetrics(service,blockScale).tile/2+17):null;
 // Preview only the final row goals. PLACE still commits once after landing;
 // closing the picker reconstructs the saved row and cancels the pending flight.
 if(planning)nodes.forEach((o,n)=>{
  const el=hosts[i].querySelector(`[data-object="${o.step}"]`);if(!el)return;
  const target=routePoint(layout,o,n),point=placementAt(target.x,target.y,fieldRect(i),objectMetrics(service,blockScale));
  el.style.setProperty('--x',point.x);el.style.setProperty('--y',point.y);
  foreground?.setTarget(hosts[i],o.step,point);
 });
 picker.dataset.selecting='true';for(const el of picker.querySelectorAll('button'))el.setAttribute('aria-disabled','true');
 const host=logicalBounds(hosts[i]);
 foreground.flyTo(button,{x:host.x+hosts[i].clientLeft+p.x,y:host.y+hosts[i].clientTop+p.y,tile:objectMetrics(service,blockScale).tile,radius:(service?22:30)*blockScale,waypoints},()=>{if(hosts[i]?.contains(picker)&&sessions[i].picker)dispatch(i,action);});
}
function renderAll(){sessions.forEach((_,i)=>render(i));}
function logicalBounds(el){const pose=foreground?.bounds(el);if(pose)return pose;const a=arena.getBoundingClientRect(),r=el.getBoundingClientRect(),scale=a.width/size.width;return {x:(r.left-a.left)/scale,y:(r.top-a.top)/scale,w:r.width/scale,h:r.height/scale};}
const edgePorts=new Map();
function syncScene(){
 if(!field)return;const placements=[],network={states:{},links:[],suspendedScopes:[]};const worldHeight=18*Math.tan(25*Math.PI/360);
 const liveEdges=new Set(),worldScale=worldHeight/size.height;
 hosts.forEach((host,i)=>{
  const s=sessions[i];if(s.screen!=='field')return;
  const scope=`${i}:${s.mission}`,moving=foreground?.connectionsMoving(host)||false;
  const suspended=foreground?.connectionsSuspended(host)||false;
  if(suspended)network.suspendedScopes.push(scope);
  host.dataset.connectionsMoving=String(moving);
  host.dataset.connectionsSuspended=String(suspended);
  const nodes=activeObjects(s),list=[],tileBounds=new Map(),preview=foreground?.placingObject(host),hostBounds=logicalBounds(host),assignments=routeAssignments(s);
  if(preview&&!nodes.some(o=>o.step===preview.step))nodes.push(preview);
  let previewId=null;
  for(const o of nodes){const el=o.tile||host.querySelector(`[data-object="${o.step}"] .tile`);if(!el)continue;
   const mission=content.missions.find(m=>m.id===s.mission),knownIndex=stepList(s).findIndex(v=>v.id===o.step);
   const index=o.step==='open-max'?0:knownIndex<0&&mission.branches?.some(b=>b.step.id===o.step)?mission.steps.length:knownIndex;if(index<0)continue;
   const r=logicalBounds(el),id=(i+1)*100000+(o.step==='open-max'?999:index+1),type=catalog.byNumber[mission.number].topology.paths[0].steps[index].type;
   const radius=parseFloat(el.style.borderRadius);
   tileBounds.set(id,{...r,radius:Number.isFinite(radius)&&el.offsetWidth>0?radius*r.w/el.offsetWidth:r.w*(o.step==='open-max'?.5:el.offsetWidth===76?22/76:30/108)});
   placements.push({id,type,longitude:(r.x+r.w/2-size.width/2)*worldHeight/size.height/.03,latitude:(size.height/2-r.y-r.h/2)*worldHeight/size.height/.03,altitude:.08,droppedAt:0,signalRadius:.15});network.states[id]='link';
   // The flight participates immediately under its permanent semantic id.
   // Idle bob does not repeatedly change the nearest-neighbour topology.
   if(o.tile||routePhase(s)!=='playing'){list.push({id,step:o.step,x:r.x+r.w/2,y:r.y+r.h/2});if(o.tile)previewId=id;}
   else {const control=el.closest('.object'),position={x:Number(control.style.getPropertyValue('--x')),y:Number(control.style.getPropertyValue('--y'))},anchor=placementAnchor(position,fieldRect(i),objectMetrics(service,blockScale));list.push({id,step:o.step,x:hostBounds.x+host.clientLeft+anchor.x,y:hostBounds.y+host.clientTop+anchor.y});}
  }
  // Proximity drives the visible network; tasks still decide mission completion.
  const visibility=Number(host.dataset.uiPresence??1);
  const reach=objectMetrics(service,blockScale).tile*(clientEdition?10:JOURNEY_LINK_REACH_TILES);
  for(const n of list)n.slot=assignments[n.step]||(n.step===preview?.step?s.picker?.slot:undefined);
  const links=(clientEdition?scenarioLinks(s.mission,list,reach):nearestLinks(list,reach)).map(link=>({...link,...(clientEdition&&link.correct===false?{error:true}:{}),visibility:visibility*linkReachPresence(link.distance,reach)}));
  for(const link of links){
   link.scope=scope;
   const key=`${scope}:${link.a}:${link.b}`;
   if(suspended){edgePorts.delete(key);continue;}
   const curve=tileEdgeCurve(tileBounds.get(link.a),tileBounds.get(link.b),edgePorts.get(key));
   liveEdges.add(key);edgePorts.set(key,curve);
   const world=p=>({x:(p.x-size.width/2)*worldScale,y:(size.height/2-p.y)*worldScale});
   const frames=[link.a,link.b].map(id=>{const r=tileBounds.get(id);return {...world({x:r.x+r.w/2,y:r.y+r.h/2}),w:r.w*worldScale,h:r.h*worldScale,radius:r.radius*worldScale};});
   link.edgeCurve={start:world(curve.start),end:world(curve.end),c1:world(curve.c1),c2:world(curve.c2),bowX:curve.bowX*worldScale,bowY:-curve.bowY*worldScale,frames,flipBow:true};
  }
  network.links.push(...links);
  host.dataset.networkPreview=preview?.step||'';host.dataset.networkLinks=String(links.length);
  host.dataset.visibleLinks=String(suspended?0:links.length);
  host.dataset.wrongLinks=String(links.filter(l=>!l.correct).length);
  host.dataset.previewLinks=String(links.filter(link=>link.a===previewId||link.b===previewId).length);
 });for(const key of edgePorts.keys())if(!liveEdges.has(key))edgePorts.delete(key);
 field.update({placements,network,endpoints:{},selectedItem:null});
}
function fit(){
 drag.cancel();if(content)sessions.forEach((s,i)=>{if(s.picker)dispatch(i,{type:'CLOSE'});});
 if(!service){size=!largeBlocks&&innerWidth<700?{width:900,height:1000}:{width:1600,height:900};}
 arena.style.width=size.width+'px';arena.style.height=size.height+'px';const scale=Math.min(innerWidth/size.width,innerHeight/size.height);arena.style.transform=`translate(-50%,-50%) scale(${scale})`;
 if(!service&&hosts[0])hosts[0].style.cssText=`left:${largeBlocks?16:40}px;top:${largeBlocks?16:80}px;width:${size.width-(largeBlocks?32:80)}px;height:${size.height-(largeBlocks?32:120)}px`;
 hosts.forEach((_,i)=>{layoutField(i);if(sessions[i].screen==='field'&&routePhase(sessions[i])!=='playing')render(i);else positionPopup(i);});field?.resize();changed();foreground?.invalidate({layout:true});requestAnimationFrame(syncScene);
}
function mount(){
 foreground?.cancelTransitions();
 const rects=service?zonesForLayout(mode):[{left:largeBlocks?16:40,top:largeBlocks?16:80,w:size.width-(largeBlocks?32:80),h:size.height-(largeBlocks?32:120)}];
 let recovered=[];try{recovered=JSON.parse(localStorage.getItem(key())||'[]');}catch{}
 sessions=(saved.get(mode)||rects.map((_,i)=>restoreSession(JSON.stringify(recovered[i]||{}),content))).map(s=>({...s,task:null,picker:null,notice:''}));
 hosts=rects.map((c,i)=>{const el=document.createElement('section');el.className='circle journey-zone';el.dataset.zone=i;el.style.cssText=service?`left:${c.left+24}px;top:${INTERACTION_BAND.top}px;width:${c.w-48}px;height:${INTERACTION_BAND.bottom-INTERACTION_BAND.top}px`:`left:${c.left}px;top:${c.top}px;width:${c.w}px;height:${c.h}px`;el.setAttribute('aria-label',`Игровая зона ${i+1}`);return el;});ui.replaceChildren(...hosts);document.documentElement.dataset.layout=mode;renderAll();fit();
}
let previewPending=false;
const drag=installJourneyDrag({root:ui,
 enabled:el=>!paused&&(clientEdition||routePhase(sessions[Number(el.closest('[data-zone]').dataset.zone)])==='playing')&&!foreground?.busy(el.closest('[data-zone]'))&&!el.closest('[data-zone]').querySelector('.context-popup,.picker'),
 onCommit:(i,step,p)=>{
  blockClick=true;pointer=null;
  if(clientEdition&&step!=='open-max'&&routePhase(sessions[i])!=='playing'){
   const local=placementAnchor(p,fieldRect(i),objectMetrics(service,blockScale)),host=logicalBounds(hosts[i]);
   const point={x:host.x+hosts[i].clientLeft+local.x,y:host.y+hosts[i].clientTop+local.y};
   // Swap only on a deliberate drop into the centre of a real live tile.
   // Empty space and proximity to a scenario slot always remain free movement.
   const target=[...hosts[i].querySelectorAll('[data-object]')].find(el=>{
    if(el.dataset.object===step||el.dataset.object==='open-max')return false;
    const r=logicalBounds(el.querySelector('.tile'));
    return Math.abs(point.x-r.x-r.w/2)<r.w*.3&&Math.abs(point.y-r.y-r.h/2)<r.h*.3;
   });
   if(target){dispatch(i,{type:'SWAP',step,target:target.dataset.object});return;}
  }
  dispatch(i,{type:'MOVE',step,...p});
 },onPreview:(i,step,p)=>{foreground?.setTarget(hosts[i],step,p);changed();if(!previewPending){previewPending=true;requestAnimationFrame(()=>{previewPending=false;hosts.forEach((_,j)=>refreshRouteSlots(j));syncScene();});}}});
let pointer=null,blockClick=false;
installTaskDismiss({root:document,enabled:()=>!paused,
 getOpen:()=>hosts.flatMap((host,i)=>{const popup=host.querySelector('.task-dialog.context-popup');return sessions[i]?.task&&popup?[{i,popup,panels:[...popup.querySelectorAll('.instruction,.demo-app,.close')]}]:[];}),
 close:({i})=>{pointer=null;blockClick=true;dispatch(i,{type:'CLOSE'});},
});
ui.addEventListener('pointerdown',e=>{if(paused)return;const host=e.target.closest('[data-zone]');if(host){blockClick=false;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,zone:host.dataset.zone};}});
function activate(e){const host=e.target.closest('[data-zone]');if(!host||paused)return;const b=e.target.closest('button');if(e.type==='click'&&blockClick&&e.detail!==0){blockClick=false;return;}if(e.type==='pointerup'&&b){blockClick=!pointer||pointer.id!==e.pointerId||Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>18||host.dataset.zone!==pointer.zone;pointer=null;return;}if(e.type==='click'&&!b)return;if(e.type==='pointerup'){if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>18||host.dataset.zone!==p.zone)return;}const i=Number(host.dataset.zone);if(b){
 if(b.hasAttribute('data-media-page')){void turnMediaPage(b,foreground,host);return;}
 if(b.disabled||b.getAttribute('aria-disabled')==='true')return;
 foreground?.highlightTile(b);
 const map=[['start','START'],['menu','MENU'],['final','FINAL'],['close','CLOSE'],['continue-route','CONTINUE_ROUTE'],['brief-done','BRIEF_DONE']];for(const [key,type]of map)if(b.hasAttribute('data-'+key)){dispatch(i,{type});return;}
 if(b.hasAttribute('data-branches')){if(!canChooseBusiness(sessions[i],content))return;const anchor=logicalBounds(b);const savedAnchor=b.cloneNode(false);savedAnchor.style.cssText=`position:absolute;left:${anchor.x-logicalBounds(host).x}px;top:${anchor.y-logicalBounds(host).y}px;width:${anchor.w}px;height:${anchor.h}px`;changeZone(i,()=>{sessions[i]={...sessions[i],picker:null,task:null};render(i);const m=content.missions.find(m=>m.id===sessions[i].mission),overlay=document.createElement('div');overlay.className='context-popup reset-popup branch-popup';overlay.innerHTML=`<div role="dialog" aria-label="Выбрать инструмент бизнеса"><h2>С чего начнёте продвижение?</h2><div class="branch-options">${m.branches.map(v=>button(esc(v.label),`data-branch="${v.id}" aria-pressed="${v.id===sessions[i].branch}"`)).join('')}</div>${button('Готово','data-cancel-reset','primary')}</div>`;host.append(overlay);host.dataset.ctaVisible='false';host.append(savedAnchor);positionPopup(i,savedAnchor);savedAnchor.remove();changed();foreground?.invalidate();},{local:true,enterOnly:true});return;}
 if(b.hasAttribute('data-reset')){changeZone(i,()=>{host.querySelector('.reset-popup')?.remove();const overlay=document.createElement('div');overlay.className='context-popup reset-popup';overlay.innerHTML=`<div role="dialog" aria-label="Начать заново"><h2>Начать заново?</h2><p>Прогресс этой зоны будет сброшен.</p>${button('Да, начать заново','data-confirm-reset')}${button('Продолжить игру','data-cancel-reset','primary')}</div>`;host.append(overlay);positionPopup(i,b);overlayInput(host);changed();foreground?.invalidate();syncScene();},{local:true,enterOnly:true});return;}
 if(b.hasAttribute('data-confirm-reset')){dispatch(i,{type:'RESET'});return;}if(b.hasAttribute('data-cancel-reset')){changeZone(i,()=>{render(i);},{local:true,exitOnly:true});return;}
 if(b.hasAttribute('data-edition-switch')){location.href=new URL(largeBlocks?'./client/':clientEdition?'./':'./client/',document.baseURI).href;return;}
 if(b.dataset.mission)dispatch(i,{type:'MISSION',id:b.dataset.mission});
 else if(b.dataset.branch)dispatch(i,{type:'BRANCH',branch:b.dataset.branch});
 else if(b.dataset.place)chooseObject(i,b);
 else if(b.dataset.replaceChoice){const step=b.dataset.replaceChoice;if(!objects(sessions[i]).some(o=>o.step===step))foreground?.seedReveal(host,step,host.querySelector(`[data-object="${sessions[i].picker.replace}"] .tile`));dispatch(i,{type:'PLACE',step});}
 else if(b.dataset.object)dispatch(i,{type:clientEdition&&routePhase(sessions[i])!=='playing'&&b.dataset.object!=='open-max'?'EDIT':'OPEN',step:b.dataset.object});
 else if(b.hasAttribute('data-answer'))dispatch(i,{type:'ANSWER',choice:Number(b.dataset.answer)});
 else if(b.hasAttribute('data-cta')){
  const tile=logicalBounds(b.querySelector('.cta-orb')),h=logicalBounds(host),p=placementAt(tile.x-h.x+tile.w/2,tile.y-h.y+tile.h/2,fieldRect(i),objectMetrics(service,blockScale));
  dispatch(i,{type:'BEGIN_ROUTE',...p});
 }else if(b.hasAttribute('data-route-next')){
  const point=nextRoutePoint(i,b.dataset.routeNext);if(point&&point.available!==false)dispatch(i,{type:clientEdition&&point.allowed.length===1?'REVEAL':'PICK',...(clientEdition?{slot:point.id}:{}),...placementAt(point.x,point.y,fieldRect(i),objectMetrics(service,blockScale))});
 }return;
 }
 if(e.target.closest('.context-popup'))return;
 if(host.querySelector('.reset-popup')){changeZone(i,()=>{render(i);},{local:true,exitOnly:true});return;}
 if(sessions[i].picker||sessions[i].task){dispatch(i,{type:'CLOSE'});return;}

}
ui.addEventListener('pointerup',activate);
ui.addEventListener('click',activate);
function cancel(){hosts.forEach(host=>foreground?.cancelPlacement(host));drag.cancel();blockClick=true;pointer=null;field?.cancelPointer();}
window.addEventListener('pointercancel',cancel);window.addEventListener('max-service-pointer-cancel',cancel);
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='max-service-state')return;paused=e.data.playing===false;cancel();field?.setServicePaused(paused);ambient?.pause(paused);document.documentElement.dataset.servicePaused=String(paused);if(service&&!clientEdition&&['single','two'].includes(e.data.layoutMode)&&mode!==e.data.layoutMode){storeProgress();mode=e.data.layoutMode;mount();}});
window.addEventListener('resize',fit);document.addEventListener('visibilitychange',cancel);
window.addEventListener('keydown',e=>{if(e.key==='Escape'){cancel();sessions.forEach((s,i)=>{if(s.task||s.picker)dispatch(i,{type:'CLOSE'});else if(hosts[i].querySelector('.reset-popup'))changeZone(i,()=>{render(i);},{local:true,exitOnly:true});});}});
async function boot(){
 document.documentElement.dataset.service=String(service);document.documentElement.dataset.shaderGlass=String(service);document.documentElement.dataset.gameVersion='journey-1.0.0';
 const [loaded,shell,client,contours]=await Promise.all([loadMissionCatalog('./config/client-webgl.json'),loadUiShellConfig(),fetch('./config/client-missions.json').then(r=>{if(!r.ok)throw Error('Не удалось загрузить миссии');return r.json();}),loadEarthContours()]);
 content=clientEdition?clientContent(client):client;const raw=serializeMissionCatalog(loaded);for(const v of Object.values(raw.system.objectSettings)){v.size=.42;v.signalRadius=.15;}catalog=parseMissionCatalog(raw);configureMissions(catalog);mount();
 if(!service)ambient=background(document.querySelector('#ambient'));
 const routeLogo=new Image();routeLogo.src='./brand/assets/logos/max-symbol-white.svg';
 assets=new PreparedAssets();await Promise.all([preloadTaskMedia(),routeLogo.decode(),...ID_IMAGES.map(src=>{const image=new Image();idPreloads.push(image);image.src=src;return image.decode();}),assets.load(collectAssetSources(catalog,ITEM_TYPES,contours,shell.rendering.earth.russiaContour,true)),prepareFonts(document.fonts)]);
 // The 1600×900 layout is logical, not a raster limit: resolveRenderPixelRatio
 // follows the displayed size and DPR, within the existing 4K safety budget.
 field=await createWebGLField({container:document.querySelector('#world'),planar:true,hideNodes:true,preparedAssets:assets,contourCatalog:contours,startPaused:true,placements:[],network:{states:{},links:[]},itemTypes:ITEM_TYPES,endpoints:{},selectedItem:null,maxDrawingBufferPixels:service?4096*1280:MAX_DRAWING_BUFFER_PIXELS,earthStyle:shell.rendering.earth,nodeIconBackdropStyle:shell.rendering.nodeIconBackdrop,signalLinkStyle:{...shell.rendering.signalLinks,...JOURNEY_LINK_STYLE},onPlace:()=>{},onMove:()=>{},onRemove:()=>{}});
 foreground=createJourneyWebGLUI({root:ui,arena,getSize:()=>size,onFrame:delta=>{tickIdScreens(delta);tickIntents();},onMotion:()=>{changed();syncScene();}});field.setScreenForeground(foreground);
 field.setScreenConnections(true);field.setTapControls({enabled:false});await field.prepareGPU();fit();syncScene();field.setServicePaused(paused);field.start();status.hidden=true;document.documentElement.dataset.gameReady='true';
}
boot().catch(e=>{console.error(e);status.textContent=`Не удалось запустить MAX: ${e.message}`;});
window.addEventListener('pagehide',()=>{storeProgress();field?.dispose();assets?.dispose();ambient?.dispose();foreground?.dispose();},{once:true});
