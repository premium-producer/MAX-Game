import {v5CopyMarkup,installV5CopyStyles,syncV5InstructionVisibility} from './journey-v5-ui-copy.mjs';
import {touchContains,touchPick,touchEligible,touchBounds} from './journey-v5-touch-area.mjs';
import {createV5AutomaticCatalog,V5AutoplayPresentation} from './journey-v5-autoplay.mjs';
import {synchronizeManagedAutoplay} from './journey-v5-managed-autoplay.mjs';
import {mountV5Audio} from './journey-v5-audio.mjs';
import {showV5Recovery,applyRecoveryChoice} from './journey-v5-recovery.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {startupErrorText} from './startup-error.mjs';
import {v5SplashMarkup,v5SplashWarmup} from './journey-v5-splash.mjs';
import {coverageMarkup,turnMediaPage,preloadTaskMedia,taskDevice} from './journey-media.mjs';
import {createWebGLField,MAX_DRAWING_BUFFER_PIXELS} from './webgl-field.js';
import {loadMissionCatalog,parseMissionCatalog,serializeMissionCatalog} from './mission-config.mjs';
import {configureMissions,ITEM_TYPES} from './mission-game.mjs';
import {PreparedAssets,collectAssetSources,prepareFonts} from './asset-preparation.mjs';
import {loadEarthContours} from './earth-contours.mjs';
import {loadUiShellConfig} from './ui-shell-config.mjs';
import {clientContent} from './journey-client.mjs';
import {clientTaskMarkup} from './journey-client-ui.mjs';
import {taskFor} from './journey-tasks.mjs';
import {ID_IMAGES,IdPlayback,isIdTask} from './journey-id.mjs';
import {icon} from './journey-icons.mjs';
import {background} from './journey-background.mjs';
import {commonMapBackground} from './journey-common-map-background.mjs';
import {referenceBackground} from './journey-reference-background.mjs';
import {lumiReferenceBackground} from './journey-lumi-reference-background.mjs';
import {createJourneyWebGLUI} from './journey-webgl-ui.mjs';
import {MotionValue} from './journey-motion.mjs';
import {installTaskDismiss} from './journey-dismiss.mjs';
import {tileEdgeCurve,JOURNEY_LINK_STYLE} from './journey-links.mjs';
import {GuidedJourney,GUIDED_STORAGE,guidedEdges,guidedCameraTarget} from './journey-guided.mjs';
import {GuidedLineJourney,LINE_STORAGE,LINE_PHONE,LINE_LINK_STYLE,phoneLaneCurves} from './journey-guided-line.mjs';
import {zonesForLayout} from './circle-model.mjs';
import {RevealJourney,REVEAL_STORAGE,REVEAL_TIMING,REVEAL_MOTION,revealTracePresence,revealTimerLabel} from './journey-guided-reveal.mjs';
import {MISSION_CATALOG as PREVIOUS_MISSION_CATALOG} from './content/mission-catalog.mjs';
import {V5_MISSION_CATALOG,createV5MissionSessionApplication} from './journey-v5-backend.mjs';
import {v5IconTile,v5IconImage,v5IconUrls,v5CompletionBadge} from './journey-v5-icons.mjs';
import {createMissionSessionApplication} from './application/mission-session.mjs';
import {createServerSessionPort} from './application/server-session-port.mjs';
import {createMobileWallSessionPort,installMobileWallBridge} from './mobile-control/wall-session-port.mjs';
import {readLocalPlayerHeaders} from './application/local-player-auth.mjs';
import {createBrowserPersistence} from './application/browser-persistence.mjs';
import {createIndexedDBPersistence} from './application/indexeddb-persistence.mjs';
import {createWebGLSession,WEBGL_SHARED_KEY} from './application/webgl-session.mjs';
import {SharedRevealJourney,sharedRevealContent} from './journey-shared-reveal.mjs';
import {sharedTaskMarkup,sharedAssetUrl,warmSharedAssets} from './journey-shared-ui.mjs';
import {guidedIconGeometry,GUIDED_ICON_SIZE} from './journey-icon-scale.mjs';
import {ReferenceRevealJourney,REFERENCE_UI} from './journey-reference-presentation.mjs';
import {referenceIcons} from './journey-reference-icons.mjs';
import {V5RevealJourney,createV5RouteMeasure} from './journey-v5-route-layout.mjs';
import {V5MotionValue,V5_INERTIA,v5InstructionTop,v5InstructionLeft,v5IconWorldPoint} from './journey-v5-inertia.mjs';
import {createV5Tools} from './journey-v5-tools.mjs';
import {V5StartupAssets,v5StartupPlan} from './journey-v5-startup-assets.mjs';
import {V5MissionContinuation,continueV5Mission} from './journey-v5-mission-continuation.mjs';
import {createIndependentAssets,independentKey} from './journey-v5-independent-assets.mjs';
import independentAssetCatalog from './independent-assets-catalog.json' with {type:'json'};

const arena=document.querySelector('#arena'),root=document.querySelector('#circles'),loading=document.querySelector('#loading');
const params=new URLSearchParams(location.search),service=params.get('service')==='1';
let mobileWall=false,mobileBridge=null;
function configureMobile(context){const enabled=context?.active===true&&context?.show?.automatic!==true&&(context?.mobileControl?.enabled===true||params.get('mobile')==='1');mobileWall=enabled;if(enabled&&!mobileBridge)mobileBridge=installMobileWallBridge();if(!enabled&&mobileBridge){mobileBridge.close();mobileBridge=null;}}
const revealMode=document.documentElement.dataset.reveal==='true',inlinePhone=revealMode||document.documentElement.dataset.phoneLayout==='path',storage=revealMode?REVEAL_STORAGE:inlinePhone?LINE_STORAGE:GUIDED_STORAGE;
const referenceVisual=document.documentElement.dataset.visual==='reference';
const bfmVisual=document.documentElement.dataset.visual==='webgl-bfm-v5';
if(bfmVisual)installV5CopyStyles(document);
const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;
const managedAssignment=params.get('assignment'),managedShell=params.get('shell')==='1'&&params.get('backend')==='server';
let bindingGeneration=0,bindingKey='',contextTimer=null,managedVisible=!managedShell;
let independent=null,independentAuthority=null,independentCommand=null,independentApplied=null;
if((!managedShell&&(!managedAssignment||!params.get('session')))||params.get('backend')!=='server')throw Error('Managed MAX requires an explicit assignment and session');
const managedNotice=document.createElement('div');managedNotice.id='managed-status';managedNotice.setAttribute('role','status');document.body.append(managedNotice);
function managedSnapshot(snapshot){const status=snapshot.assignment?.lifecycle.status;document.documentElement.dataset.assignmentStatus=status??'unknown';document.documentElement.dataset.gamePhase=snapshot.state.status;document.documentElement.dataset.gameRevision=String(snapshot.state.revision);if(status!=='active'&&managedShell){managedNotice.hidden=true;arena.inert=true;gameAudio?.setActive(false);field?.setServicePaused(true);return;}if(status!=='active'){managedNotice.textContent='Назначение '+status+'. Ожидаем следующую миссию.';managedNotice.hidden=false;arena.inert=true;arena.hidden=true;}else{const unresolved=sharedSession?.recovery??[];managedNotice.hidden=!unresolved.length;if(unresolved.length)managedNotice.textContent=unresolved.some(item=>item.status==='foreign-context')?'Сохранена неподтверждённая команда другого набора данных. Автоповтор запрещён.':'Сверяем сохранённую команду MAX. Повтор на новой сессии запрещён.';arena.hidden=false;arena.inert=false;}}
const v5RouteMeasure=bfmVisual?createV5RouteMeasure(arena):null;
const v5LinkPaint=Object.freeze({gradient:['#471AFF','#9500FF'],intensity:.7,particleOpacity:.18,pulseStrength:0,additive:false});
const routeLinkStyle=bfmVisual?{...JOURNEY_LINK_STYLE,...v5LinkPaint}:JOURNEY_LINK_STYLE;
const deviceLinkStyle=bfmVisual?{...LINE_LINK_STYLE,...v5LinkPaint}:LINE_LINK_STYLE;
if((referenceVisual||bfmVisual)&&!params.has('backend'))params.set('backend','local');
const referenceTile=referenceVisual?REFERENCE_UI.tile:GUIDED_ICON_SIZE;
const sharedBackend=revealMode&&['local','server'].includes(params.get('backend'));
let sharedSession,v5Tools,missionContinuation,continuationContext,automaticPresentation=null,automaticRoutes=null,showScreenDelayMs=1000;
const localRecovery=bfmVisual&&sharedBackend&&!service&&params.get('backend')==='local';
let recoveryBlocked=localRecovery,recoveryChoice=null,windowFocused=document.hasFocus();
const presentationActive=()=>!document.hidden&&!servicePaused&&(!managedShell||managedVisible&&(!!independent||!!controller&&sharedSession?.snapshot?.assignment?.lifecycle.status==='active'));
const inputActive=()=>!independent&&!mobileWall&&presentationActive()&&!recoveryBlocked&&!document.hidden&&!servicePaused&&(!localRecovery||windowFocused);
let startupAssets,startupPlan;
const adjustableIcons=revealMode&&!service;
const host=document.createElement('section');host.className='circle journey-zone guided-zone';host.dataset.zone='0';root.append(host);
const PhoneMotion=bfmVisual?V5MotionValue:MotionValue;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),camera=new PhoneMotion(0),palmPresence=new PhoneMotion(0),idPlayback=new IdPlayback();
const phoneX=new PhoneMotion(0),phoneY=new PhoneMotion(0),phonePresence=new PhoneMotion(0);
let phoneStep='',phoneToken='',phonePending='';
const PHONE_MEDIA_DEADLINE=2;
const PHONE_LOADING_DELAY=.45;
let phoneLoadingAge=0;
// An explicit, ephemeral visual-review fixture. Never reads/writes player progress.
const reviewMission=new URLSearchParams(location.search).get('review');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,attr='',cls='')=>`<button class="pill ${cls}" ${attr}>${v5CopyMarkup(label)}</button>`;
const palmCopy=bfmVisual?'Открой возможности':'Приложи ладонь, чтобы открыть возможности';
const palmHint=bfmVisual?'':'Удерживай 0,8 секунды';
const palm='<svg class="glyph" viewBox="0 0 64 64" aria-hidden="true"><path d="M16 33V17c0-6 7-6 7 0v14-21c0-6 7-6 7 0v20-24c0-6 7-6 7 0v24-19c0-6 7-6 7 0v23l4-8c3-6 10-2 7 4l-9 22c-3 7-8 11-16 11-8 0-13-4-17-10L5 39c-4-6 2-10 6-6l5 5Z"/></svg>';
let size={width:1600,height:1000},controller,content,catalog,field,assets,foreground,ambient,view='';
let focusTarget=0,history=false,gesture=null,pageDisposed=false,screenEpoch=0,answerPending=false,popupPage=0,popupToken='',palmVisible=false,shownRevision=-1,pendingResume=null,navigating=false,resetPrompt=false;
let servicePaused=false,gameAudio=null;
const createController=value=>sharedBackend?(bfmVisual?new V5RevealJourney(content,sharedSession,v5RouteMeasure):new (referenceVisual?ReferenceRevealJourney:SharedRevealJourney)(content,sharedSession)):new (revealMode?RevealJourney:inlinePhone?GuidedLineJourney:GuidedJourney)(content,value);
const edgePorts=new Map();
const changed=()=>{document.documentElement.dataset.glassRevision=String(Number(document.documentElement.dataset.glassRevision||0)+1);};
function save(){if(!sharedBackend&&controller&&!reviewMission)try{localStorage.setItem(storage,controller.serialize());}catch{}}
function bounds(el){if(!el)return null;const pose=foreground?.bounds(el);if(pose)return pose;const a=arena.getBoundingClientRect(),r=el.getBoundingClientRect(),scale=a.width/size.width;return{x:(r.left-a.left)/scale,y:(r.top-a.top)/scale,w:r.width/scale,h:r.height/scale};}
function fieldDimensions(){return {w:host.clientWidth,h:host.clientHeight-140};}
const routeRow=()=>inlinePhone&&controller?.current?.step ? .68 : .44;
const deviceMetrics=()=>sharedBackend?controller.phoneMetrics:taskDevice(controller?.current);
const displayPhoneKey=()=>bfmVisual&&controller.startupLogo?controller.startupKey:controller.phoneContentKey;
const deviceCenter=()=>referenceVisual?(deviceMetrics().kind==='pc'?520:584):Math.min(host.clientWidth/2,host.clientWidth-540-32-deviceMetrics().width/2);
const revealPresence=o=>controller.presence(o)*((o.step==='business-tool'||o.step.startsWith('business-'))?Number(host.dataset.contentPresence??1):1);
function position(o,palmNode=false){const {w,h}=fieldDimensions(),y=revealMode?host.clientHeight/2-100:h*routeRow();return {x:(o.worldX-camera.value-120)/(w-240),y:(y+o.worldY-(palmNode?80:64))/(h-300)};}
function placeElement(el,o,palmNode=false){
 if(referenceVisual){
  const left=o.worldX-camera.value-60,top=host.clientHeight/2-100+o.worldY-60;
  setStyleValue(el,'left',`${left}px`);setStyleValue(el,'top',`${top}px`);
  foreground?.setTarget(host,palmNode?'route-add:guided-palm':el.dataset.object||o.step,{left,top});return;
 }
 if(adjustableIcons&&!palmNode&&el.hasAttribute('data-object')){
  const p=guidedIconGeometry(o.worldX,o.worldY,camera.value,host.clientHeight);
  setStyleValue(el,'left',`${p.left}px`);setStyleValue(el,'top',`${p.top}px`);
  foreground?.setTarget(host,el.dataset.object,{left:p.left,top:p.top});return;
 }
 const p=position(o,palmNode);setStyleValue(el,'--x',String(p.x));setStyleValue(el,'--y',String(p.y));foreground?.setTarget(host,palmNode?'route-add:guided-palm':el.dataset.object||o.step,p);
}
function focusCurrent(immediate=false){
 if(!controller)return;
 if(bfmVisual&&controller.startup){focusTarget=camera.value;updateTargets();return;}
 if(bfmVisual&&controller.completionPoses){focusTarget=camera.value;camera.velocity=0;updateTargets();return;}
 if(bfmVisual&&controller.spread&&(controller.phoneAnchorManual||controller.presentedDevice&&phonePresence.value>.95)){focusTarget=camera.value;camera.velocity=0;updateTargets();return;}
 history=false;
 focusTarget=revealMode?controller.spread&&controller.phone?controller.phone.x-deviceCenter():['palm','holding','burst','arrange'].includes(controller.phase)?0:Math.max(0,(controller.current?.worldX||0)-host.clientWidth*.45):controller.phase==='intro'||['palm','holding'].includes(controller.phase)?-host.clientWidth*.28:inlinePhone&&controller.phone?controller.phone.x-deviceCenter():guidedCameraTarget(controller.current||controller.nodes[0],host.clientWidth);
 if(immediate){camera.value=focusTarget;camera.velocity=0;}updateTargets();
}
function setStyleValue(el,key,value){if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);}
function updateTargets(){
 if(controller?.session.screen!=='field')return;
 if(referenceVisual){host.dataset.referenceDevice=deviceMetrics().kind;host.dataset.referenceContact=controller.contact??'';host.dataset.referenceRun=controller.snapshot?.state?.runId??'';host.dataset.referenceScanned=String(controller.snapshot?.state?.scanned===true);}
 if(revealMode){host.dataset.revealPhase=controller.phase;if(controller.current)host.style.setProperty('--instruction-left',`${bfmVisual?v5InstructionLeft(phoneX.value,camera.value,deviceMetrics().width):referenceVisual?(deviceMetrics().kind==='pc'?860:820):controller.phoneLayout.side>0?host.clientWidth-540:20}px`);}
 for(const o of controller.nodes){const el=host.querySelector(`[data-object="${o.step}"]`);if(el){placeElement(el,revealMode?controller.pose(o):o);if(revealMode){el.dataset.captionVisible=String(controller.captionVisible(o));el.dataset.pathPresence=String(revealPresence(o));el.inert=revealPresence(o)<.05;}}}
 if(bfmVisual){const logo=host.querySelector('.v5-startup-screen [data-task-content]');if(logo)logo.dataset.pathPresence=String(controller.startupContentPresence);}
 const scan=host.querySelector('[data-palm]');if(scan)placeElement(scan,revealMode?{worldX:referenceVisual?566:host.clientWidth/2,worldY:0}:{worldX:(controller.nodes[0]?.worldX||0)+320,worldY:controller.nodes[0]?.worldY||0},true);
 if(inlinePhone){
  const phone=host.querySelector('.route-phone');if(phone){const metrics=deviceMetrics(),centerY=host.clientHeight/2+phoneY.value;if(bfmVisual){setStyleValue(phone,'width',`${metrics.width}px`);setStyleValue(phone,'height',`${metrics.height}px`);}setStyleValue(phone,'left',`${phoneX.value-camera.value-metrics.width/2}px`);setStyleValue(phone,'top',`${centerY-metrics.height/2}px`);host.style.setProperty('--guided-device-center-y',`${centerY}px`);phone.dataset.pathPresence=String(phonePresence.value);phone.inert=phonePresence.value<.05||bfmVisual&&!!controller.startup;}
  const next=host.querySelector('[data-line-next]');if(next&&controller.continuation)placeElement(next,{...controller.continuation,step:'route-add:line-next'});
 }
}
function nodeMarkup(o){
 const isMax=o.step==='open-max',step=controller.steps.find(v=>v.id===o.step),fullLabel=isMax?'Открыть MAX':step.label;
 const label=adjustableIcons?({'Голосовое / видео-сообщение':'Голосовое / видео','Чат-бот для приема заказов':'Чат-бот'}[fullLabel]||fullLabel):fullLabel;
 if(referenceVisual||bfmVisual)return referenceNodeMarkup(o.step,isMax?'open-max':step.iconId,fullLabel,controller.captionVisible(o));
 return `<button class="object ${isMax?'route-first':''}" data-object="${o.step}" data-planning="true" data-caption-visible="${!revealMode||controller.captionVisible(o)}" aria-label="${esc(fullLabel)}"><span class="tile glass-control">${isMax?`<span class="route-intro-plus">${icon('plus')}</span><img class="route-brand" draggable="false" src="./brand/assets/logos/max-symbol-white.svg" alt="MAX">`:icon(sharedBackend?step.iconId:o.step==='business-tool'?'sector':o.step)}</span><span class="object-label icon-caption">${v5CopyMarkup(label)}<small data-node-status></small></span></button>`;
}
function referenceNodeMarkup(step,key,label,visible=true,status=''){
 const checked=bfmVisual&&status==='Выполнено';
 return `<button class="object ${step==='open-max'?'route-first':''}" data-object="${step}" data-planning="true" data-caption-visible="${visible}" aria-label="${esc(label)}">${bfmVisual?v5IconTile(MISSION_CATALOG,step,256,'tile glass-control',checked):`<span class="tile glass-control">${referenceIcons[key]||icon(key)}</span>`}<span class="object-label icon-caption">${v5CopyMarkup(label)}<small data-node-status>${esc(checked?'':status)}</small></span></button>`;
}
function resultMarkup(result,qr,presentation){
 result??={};
 return `<div class="field-center"><section class="field-success glass-control" role="dialog" aria-label="${esc(result.title)}"><h2>${v5CopyMarkup(result.title)}</h2><p>${v5CopyMarkup(result.text)}</p>${qr?`<img class="presentation-qr" draggable="false" src="${esc(qr.image)}" alt="QR-код: ${esc(qr.url)}"><p>${esc(qr.label)}</p>`:''}${presentation?'<p>Тестовая миссия</p>':''}${button(bfmVisual&&sharedBackend?'Продолжить':'К миссиям',bfmVisual&&sharedBackend?'data-continue-mission':'data-menu')}</section></div>`;
}
function feedback(text){foreground?.showTapFeedback(host,{x:host.clientWidth/2,y:host.clientHeight*.65},text);}
function render(preserveTransition=false){
 if(!controller)return;
 if(referenceVisual){const title=root.querySelector('[data-reference-mission]');if(title)title.textContent=controller.mission?.title||'Открой возможности MAX';}
 const s=controller.session,newView=s.screen==='field'?`field:${s.mission}${sharedBackend?`:${controller.snapshot.state.runId}`:''}`:`${s.screen}:${resetPrompt}`;
 if(sharedBackend&&controller.snapshot){
  const snapshot=controller.snapshot,resources=[snapshot.view.missing?null:snapshot.view.device?.asset,...snapshot.view.prepareNext??[]];
  if(bfmVisual){
   const taskIds=MISSION_CATALOG.missions[snapshot.state.missionId]?.taskIds??[],index=taskIds.indexOf(snapshot.state.taskId);
   const next=index>=0?MISSION_CATALOG.tasks[taskIds[index+1]]:null,first=next?.screens[next.startScreenId];
   if(first&&!first.missing)resources.push(MISSION_CATALOG.assets[first.assetId]);
   foreground?.prewarmDeviceAssets(resources);
  }else void warmSharedAssets(resources);
 }
 if(revealMode&&!sharedBackend&&foreground){
  const current=s.screen==='field'?controller.current:null,idStage=s.screen==='field'&&s.mission==='digital-id'&&(!current||isIdTask(current.step))?Math.min(current?.stage??0,ID_IMAGES.length-1):null;
  foreground.prewarmPhoneImages(idStage===null?[]:ID_IMAGES.slice(idStage,idStage+2));
 }
 if(newView!==view){
  if(!preserveTransition)foreground?.cancelTransitions();view=newView;edgePorts.clear();host.replaceChildren();palmVisible=false;palmPresence.value=0;gesture=null;phoneStep='';phoneToken='';phonePending='';phonePresence.value=0;
  host.dataset.screen=s.screen;host.dataset.routePhase='playing';host.dataset.activeTask='';host.dataset.bigWindow='true';host.dataset.popupPresence='1';host.dataset.uiPresence??='1';
  if(s.screen!=='field'){
   host.innerHTML=`<header class="zone-header"><div><h1>Открой возможности MAX</h1><p>Выбери миссию</p></div>${resetPrompt?'':button('Обнулить миссии','data-reset-progress')}</header>${resetPrompt?`<section class="guided-reset-panel reset-popup" role="dialog" aria-label="Обнулить миссии?"><h2>Обнулить миссии?</h2><p>Задания, ответы и положения иконок этой версии игры будут сброшены.</p>${button('Да, обнулить','data-confirm-reset-progress')}${button('Отмена','data-cancel-reset-progress','primary')}</section>`:`<div class="mission-choices">${content.missions.map(m=>`<button class="mission-card glass-control" data-mission="${m.id}">${bfmVisual?v5IconTile(MISSION_CATALOG,m.id,96,'medallion'):`<span class="medallion">${icon(m.id)}</span>`}<span><strong>${v5CopyMarkup(m.title)}</strong><small>${v5CopyMarkup(m.description)}</small>${sharedBackend?`<small class="media-coverage ${m.missing.length?'media-incomplete':'media-complete'}">${m.missing.length?'Есть заглушки':'Без заглушек'}</small>`:coverageMarkup(m)}</span><span class="card-state">${s.completed.includes(m.id)?'✓':'↗'}</span></button>`).join('')}</div>`}`;
  }else{
   host.innerHTML=`<div class="playfield guided-field"></div><nav class="guided-nav">${revealMode?`${button(revealTimerLabel(controller.secondsLeft),'data-menu data-mission-timer aria-label="Вернуться к миссиям"')}<button class="pill guided-restart" data-restart-mission aria-label="Начать миссию заново">${bfmVisual?v5IconImage(MISSION_CATALOG,'restart'):`<svg class="glyph" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M50 18V7l-7 7A24 24 0 1 0 56 36h-8a16 16 0 1 1-10-15l-9 9h27V18Z"/></svg>`}</button>`:`${button('← К миссиям','data-menu')}${button('К текущему шагу','data-focus')}`}</nav><p class="guided-caption" role="status"></p>`;
   focusCurrent(true);
  }
  foreground?.invalidate();
 }
 if(s.screen==='field'){
  const fieldEl=host.querySelector('.playfield');
  for(const o of controller.nodes)if(!fieldEl.querySelector(`[data-object="${o.step}"]`)){
   if(revealMode&&(controller.phase==='burst'||bfmVisual&&controller.startup)&&controller.presence(o)===0)continue;
   const origin=fieldEl.querySelector('[data-palm] .tile')||fieldEl.querySelector('[data-object]:last-of-type .tile');
   if(o.step!=='open-max'&&controller.phase==='reveal')foreground?.seedReveal(host,o.step,origin);
   if(revealMode&&(['burst','arrange'].includes(controller.phase)||bfmVisual&&controller.startup)){
    const pose=controller.pose(o);
    foreground?.seedReveal(host,o.step,fieldEl.querySelector('[data-palm] .tile'),{x:pose.worldX-camera.value,y:host.clientHeight/2+pose.worldY});
   }
   fieldEl.insertAdjacentHTML('beforeend',nodeMarkup(o));foreground?.invalidate();
  }
  if(revealMode)for(const el of fieldEl.querySelectorAll('[data-object]'))if(!controller.nodes.some(o=>o.step===el.dataset.object)){el.remove();foreground?.invalidate();}
  let cta=host.querySelector('[data-cta]');
  if(controller.phase==='start'&&!cta){host.insertAdjacentHTML('beforeend',`<div class="field-center guided-start"><button class="mission-cta" data-cta><span class="cta-orb glass-control">${icon('plus')}</span><span>Открыть MAX</span></button></div>`);foreground?.invalidate();}
  else if(controller.phase!=='start'&&cta){cta.parentElement.remove();foreground?.invalidate();}
  host.dataset.ctaVisible=String(controller.phase==='start');
  palmVisible=['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);
  if(palmVisible)warmMissionEntry(controller.session.mission);
  if(palmVisible&&!host.querySelector('[data-palm]')){
   fieldEl.insertAdjacentHTML('beforeend',`<button class="object guided-palm" data-route-next="guided-palm" data-palm data-touch-minimum="500" data-planning="true" aria-label="${palmCopy}${palmHint?`. ${palmHint}`:''}">${bfmVisual?v5IconTile(MISSION_CATALOG,'scan',160):`<span class="tile glass-control">${palm}</span>`}<span class="object-label icon-caption">${palmCopy}<small>${palmHint}</small></span></button>`);foreground?.invalidate();
  }
  const palmLabel=host.querySelector('[data-palm] .object-label');
  if(palmLabel&&revealMode){const revealing=controller.phase==='burst',label=bfmVisual?palmCopy:revealing?'Открываем возможности':palmCopy,small=revealing?'':palmHint;
   if(palmLabel.firstChild.textContent!==label){palmLabel.firstChild.textContent=label;palmLabel.querySelector('small').textContent=small;foreground?.refreshPart(palmLabel);}
  }
  for(const o of controller.nodes){const el=host.querySelector(`[data-object="${o.step}"]`);if(!el)continue;const small=el.querySelector('[data-node-status]');
   if(revealMode)el.dataset.nodeState=o===controller.current?'active':o.done?'done':'future';
   const text=o.step==='open-max'?'':o===controller.current&&['paused','branch-paused'].includes(controller.phase)?'Продолжить задание':o.done?'Выполнено':revealMode&&o!==controller.current?'Следующий шаг':'';
   const checked=bfmVisual&&text==='Выполнено',status=checked?'':text,badge=el.querySelector('.v5-completion-check');
   let changed=false;
   if(checked&&!badge){el.querySelector('.tile').insertAdjacentHTML('beforeend',v5CompletionBadge());el.setAttribute('aria-description','Выполнено');changed=true;}
   else if(!checked&&badge){badge.remove();el.removeAttribute('aria-description');changed=true;}
   if(small.textContent!==status){small.textContent=status;changed=true;}
   if(changed)foreground?.refreshPart(el);
  }
  const caption=host.querySelector('.guided-caption'),text=history?'Перетаскивай пустое поле, чтобы просмотреть путь':'';
  if(caption.textContent!==text){caption.textContent=text;foreground?.refreshPart(caption);}
  if(controller.phase==='complete'&&!host.querySelector('.field-success')){
   const qr=sharedBackend?controller.snapshot.view.qr&&{...controller.snapshot.view.qr,image:sharedAssetUrl(controller.snapshot.view.qr.asset)}:controller.mission.qr;
   host.insertAdjacentHTML('beforeend',resultMarkup(sharedBackend?controller.snapshot.view.result:{title:'Миссия выполнена',text:controller.mission.result},qr,controller.mission.presentation));foreground?.invalidate();
  }
  if(pageDisposed)return;
 if(startupAssets)for(const image of host.querySelectorAll('img:not([data-prepared-phone])'))startupAssets.takeImage(image);
  // Building the hidden phone rasterized its first task image during MAX's
  // burst, creating a synchronous WebGL upload on the reveal frame. The phone
  // is only needed when its own entrance starts; decoded assets are preloaded.
  if(inlinePhone&&(!revealMode||controller.phoneVisible))syncLinePhone();
  updateTargets();syncPopup();
 }
 shownRevision=controller.revision;save();changed();
}
function popupMarkup(displayTask=controller.session.task){
 if(sharedBackend){const t=document.createElement('template');t.innerHTML=sharedTaskMarkup(controller.displaySnapshot,{token:controller.token(),title:controller.steps.find(s=>s.id===controller.current?.step)?.label});const popup=t.content.firstElementChild;popup.classList.add('guided-task');if(inlinePhone)popup.querySelector('.demo-app').remove();return popup.outerHTML;}
 const s=displayTask===controller.session.task?controller.session:{...controller.session,task:displayTask};
 if(s.task==='guided-business-choice')return `<section class="task-dialog context-popup guided-choice" role="dialog" aria-label="Выбрать инструмент"><div class="instruction glass-control"><div class="instruction-copy" data-task-content><span class="eyebrow">АККАУНТ ПОДКЛЮЧЁН</span><h2>Выбери инструмент</h2><p>Открой одну возможность для своего бизнеса. Выбери канал, бота или мини-приложение в окне ПК.</p></div></div>${inlinePhone?'':`<div class="demo-app" data-device="pc"><div class="phone-content" data-task-content><h3>Выбери инструмент</h3>${controller.mission.branches.map(b=>button(b.label,`data-branch="${b.id}"`)).join('')}</div></div>`}${revealMode?'':'<button class="close pill" data-close aria-label="Закрыть задание">×</button>'}</section>`;
 const t=document.createElement('template');t.innerHTML=clientTaskMarkup(s,content,{deviceAware:true,guidedReveal:revealMode});const popup=t.content.firstElementChild;if(!popup)return '';
 popup.classList.add('guided-task');
 if(revealMode)popup.querySelectorAll('[data-close]').forEach(el=>el.remove());
 popup.querySelector('.task-icon')?.remove();
 popup.querySelector('.client-difference')?.remove();
 popup.querySelectorAll('.client-next').forEach(el=>el.remove());
 const o=controller.current,task=taskFor(o,content),copy=popup.querySelector('.instruction-copy');
 if(o?.done){copy.querySelector('p').textContent=controller.steps.every(step=>controller.nodes.some(n=>n.step===step.id&&n.done))&&!controller.needsBranch()?'Задание выполнено. Миссия пройдена.':'Задание выполнено. Открываем следующую возможность.';popup.querySelectorAll('[data-close]:not(.close)').forEach(el=>el.remove());}
 else if(task){
  popup.querySelector('h2').textContent=task.title;
 }
 // The same answer token is embedded in both large controls and source hotspots.
 for(const el of popup.querySelectorAll('[data-answer]'))el.dataset.answerToken=controller.token();
 if(inlinePhone)popup.querySelector('.demo-app')?.remove();
 return popup.outerHTML;
}
function syncLinePhone(){
 const generation=bindingGeneration;
 const o=controller.current;if(!o)return;
 let shell=host.querySelector('.route-phone');
 if(!shell){
  const p=controller.phone;phoneX.value=p.x;phoneX.velocity=0;phoneY.value=p.y;phoneY.velocity=0;
  host.insertAdjacentHTML('beforeend',`<section class="route-phone client-task" role="group" aria-label="Смартфон в маршруте">${revealMode?'':'<button class="phone-drag-label" data-phone-drag>↔ Переместить смартфон</button>'}</section>`);
  shell=host.querySelector('.route-phone');foreground?.invalidate();
 }
 // The phone is prepared before session.task is assigned. That assignment
 // changes the answer token, not its visible content: keep the prepared screen.
 const key=revealMode?displayPhoneKey():`${controller.token()}:${o.step}:${o.stage}:${o.done}:${controller.session.notice}:${controller.phase==='paused'}`;
 const commit=()=>{
  if(generation!==bindingGeneration||!controller||!shell.isConnected||controller.current?.step!==o.step||revealMode&&displayPhoneKey()!==key){if(phonePending===key)phonePending='';return;}
  if(bfmVisual&&!controller.startupLogo)controller.presentedDevice={...controller.targetPhoneMetrics};
  let source,next;
  try{
   const t=document.createElement('template');t.innerHTML=bfmVisual&&controller.startupLogo?v5SplashMarkup(controller.startupContentPresence):sharedBackend?sharedTaskMarkup(controller.displaySnapshot,{token:controller.token(),title:controller.steps.find(s=>s.id===o.step)?.label}):o.step==='business-tool'?`<section><div class="demo-app" data-device="pc"><div class="phone-content" data-task-content><h3>Выбери инструмент</h3><p>Одна возможность для своего бизнеса</p>${controller.mission.branches.map(b=>button(b.label,`data-branch="${b.id}"`)).join('')}</div></div></section>`:clientTaskMarkup({...controller.session,task:o.step},content,{deviceAware:true,guidedReveal:revealMode});
   source=t.content.firstElementChild;next=source?.querySelector('.demo-app');
  }catch(error){console.error('MAX phone screen preparation failed',error);}
  if(!next){
   const message=document.createElement('div');message.className='demo-app';
   message.innerHTML='<p class="phone-media-error">Экран задания недоступен. Перезапустите миссию.</p>';
   const metrics=deviceMetrics();shell.dataset.device=metrics.kind;shell.style.width=`${metrics.width}px`;shell.style.height=`${metrics.height}px`;
   shell.querySelector('.demo-app')?.remove();shell.append(message);
   shell.dataset.sceneVersion=key;shell.dataset.mediaReadyKey=key;
   phoneStep=o.step;phoneToken=key;phonePending='';foreground?.refreshPart(shell);changed();return;
  }
  next.querySelectorAll('.client-next').forEach(el=>el.remove());
  next.querySelectorAll('[data-answer]').forEach(b=>b.dataset.answerToken=controller.token());
  if(revealMode)next.querySelectorAll('[data-close]').forEach(el=>el.remove());
  if(revealMode){next.querySelectorAll('[data-answer]').forEach(b=>b.disabled=controller.phase!=='task'||b.dataset.actionDisabled==='true');next.querySelectorAll('[data-branch]').forEach(b=>b.disabled=controller.phase!=='branch');}
  if(controller.phase==='paused')next.insertAdjacentHTML('beforeend',button('Продолжить задание','data-phone-resume','phone-resume'));
  shell.classList.toggle('id-task',source.classList.contains('id-task'));
  shell.classList.toggle('story-task',source.classList.contains('story-task'));
  shell.dataset.device=deviceMetrics().kind;shell.setAttribute('aria-label',deviceMetrics().kind==='pc'?'ПК в маршруте':'Смартфон в маршруте');
  shell.style.width=`${deviceMetrics().width}px`;shell.style.height=`${deviceMetrics().height}px`;
  if(referenceVisual){const m=deviceMetrics();shell.style.setProperty("--reference-device-scale",m.scale);shell.style.setProperty("--reference-device-width",m.original.width+"px");shell.style.setProperty("--reference-device-height",m.original.height+"px");}
  const dragLabel=shell.querySelector('[data-phone-drag]');if(dragLabel)dragLabel.textContent=deviceMetrics().kind==='pc'?'↔ Переместить ПК':'↔ Переместить смартфон';
  if(revealMode&&!sharedBackend&&isIdTask(o.step))for(const image of next.querySelectorAll('.id-screen-image'))foreground?.takePreparedPhoneImage(image);
  const previous=shell.querySelector('.demo-app');
  if(previous&&bfmVisual){
   for(const attr of [...previous.attributes])previous.removeAttribute(attr.name);
   for(const attr of next.attributes)previous.setAttribute(attr.name,attr.value);
   previous.replaceChildren(...next.childNodes);next=previous;
  }else if(previous)previous.replaceWith(next);else shell.append(next);
  if(pageDisposed)return;
 if(startupAssets)for(const image of next.querySelectorAll('img'))startupAssets.takeImage(image);
  const images=[...next.querySelectorAll('img')];
  const phoneContent=next.querySelector('.phone-content');
  if(images.length&&phoneContent){phoneContent.style.opacity='0';phoneContent.inert=true;}
  phoneLoadingAge=0;
  const showContent=()=>{next.querySelector('.phone-loading')?.remove();if(phoneContent){phoneContent.style.opacity='1';phoneContent.inert=false;}};
  const decoded=images.map(image=>{
   if(image.dataset.preparedPhone==='true'&&image.complete&&image.naturalWidth){image.dataset.gpuDecoded='true';return Promise.resolve();}
   image.dataset.gpuDecoded='false';
   const failed=()=>{
    if(generation!==bindingGeneration||!image.isConnected)return;
    const message=document.createElement('p');message.className='phone-media-error';
    message.textContent='Кадр задания не загрузился. Перезапустите миссию.';
    image.replaceWith(message);foreground?.refreshPart(shell);changed();
   };
   image.addEventListener('error',failed,{once:true});
   return image.decode().then(()=>{if(generation===bindingGeneration&&image.isConnected)image.dataset.gpuDecoded='true';}).catch(failed);
  });
  // An adjoining node/popup may request a full rebuild on this same frame.
  // Invalidate this retained owner too, otherwise it would keep detached content.
  shell.dataset.sceneVersion=key;
  delete shell.dataset.mediaReadyKey;delete shell.dataset.gpuReadyKey;
  phoneStep=o.step;phoneToken=key;phonePending='';foreground?.refreshPart(shell);changed();
  // A decoded frame is the entrance boundary. The renderer explicitly uploads
  // its texture before drawing; a renderer acknowledgement is diagnostic only.
  void Promise.all(decoded).then(()=>{
   if(generation!==bindingGeneration||!shell.isConnected||shell.dataset.sceneVersion!==key)return;
   showContent();shell.dataset.mediaReadyKey=key;foreground?.refreshPart(shell);changed();
  });
 };
 if(phoneToken!==key&&phonePending!==key){
  if(bfmVisual&&(controller.handoff?.stage==='pack'||controller.startupLogo)){commit();}
  else if(bfmVisual&&foreground?.contentBusy(host)){phonePending=key;}
  else if(phoneStep&&(phoneStep!==o.step||sharedBackend)&&foreground&&!foreground.busy(host)){
   phonePending=key;const epoch=screenEpoch;
   const target=bfmVisual?controller.targetPhoneMetrics:null;
   const morph=bfmVisual?{from:deviceMetrics().width,to:target.width,
    resize:width=>{if(epoch!==screenEpoch||!shell.isConnected)return;controller.presentedDevice={...target,width};updateTargets();},
    ready:()=>epoch!==screenEpoch||displayPhoneKey()!==key||shell.dataset.sceneVersion===key&&shell.dataset.mediaReadyKey===key&&shell.dataset.gpuReadyKey===key}:undefined;
   if(!foreground.transitionContent(host,()=>{if(epoch===screenEpoch)commit();else if(phonePending===key)phonePending='';},morph))phonePending='';
  }else if(!phonePending)commit();
 }
 if(revealMode){
  for(const b of shell.querySelectorAll('[data-answer]')){b.dataset.answerToken=controller.token();b.disabled=controller.phase!=='task'||b.dataset.actionDisabled==='true';}
  for(const b of shell.querySelectorAll('[data-branch]'))b.disabled=controller.phase!=='branch';
 }
 if(!revealMode&&!host.querySelector('[data-line-next]')){
  host.querySelector('.playfield').insertAdjacentHTML('beforeend',`<button class="object line-next" data-route-next="line-next" data-line-next data-planning="true" aria-label="Продолжение маршрута"><span class="tile glass-control">${icon('plus')}</span><span class="object-label icon-caption" data-continuation-label></span></button>`);foreground?.invalidate();
 }
 const label=host.querySelector('[data-continuation-label]'),text=controller.steps.every(step=>controller.nodes.some(n=>n.step===step.id&&n.done))&&!controller.needsBranch()?'Миссия выполнена':'Следующая возможность';
 if(label&&label.textContent!==text){label.textContent=text;foreground?.refreshPart(label);}
}
function phoneContentReady(){
 const shell=host.querySelector('.route-phone');
 if(!shell?.querySelector('.demo-app')||revealMode&&(shell.dataset.sceneVersion!==displayPhoneKey()||shell.dataset.mediaReadyKey!==displayPhoneKey()))return false;
 return [...shell.querySelectorAll('.demo-app img')].every(image=>image.complete&&image.naturalWidth>0);
}
function recoverPendingPhoneMedia(){
 if(!revealMode||controller.phase!=='phone-enter'||controller.elapsed<PHONE_MEDIA_DEADLINE)return;
 const shell=host.querySelector('.route-phone'),key=controller.phoneContentKey;
 if(!shell||shell.dataset.sceneVersion!==key||shell.dataset.mediaReadyKey===key)return;
 for(const image of shell.querySelectorAll('.demo-app img[data-gpu-decoded="false"]')){
  const message=document.createElement('p');message.className='phone-media-error';
  message.textContent='Кадр задания не загрузился. Перезапустите миссию.';
  image.replaceWith(message);
 }
 shell.querySelector('.phone-loading')?.remove();const content=shell.querySelector('.demo-app .phone-content');if(content){content.style.opacity='1';content.inert=false;}
 shell.dataset.mediaReadyKey=key;foreground?.refreshPart(shell);changed();
 console.warn('MAX phone media decode deadline',key);
}
function syncPopup(){
 const s=controller.session,old=host.querySelector('.task-dialog');
 // Prepare the read-only card while the phone is still settling. Keep this
 // same card when the semantic phase becomes task; only phone controls unlock.
 const preview=revealMode&&!(bfmVisual&&controller.startup)&&controller.phase==='phone-enter'&&phoneContentReady()&&phonePresence.value>.55
  ?controller.current?.step==='business-tool'?'guided-business-choice':controller.current?.step:null;
 const displayTask=s.task||preview;
 if(!displayTask){
  if(old&&!old.dataset.closing){old.dataset.closing='true';const epoch=screenEpoch;foreground?.cancelContent(host);answerPending=false;
   foreground.transition(host,()=>{if(epoch!==screenEpoch)return;old.remove();host.dataset.activeTask='';if(!bfmVisual||!controller.completionPoses)foreground.releaseObject(host);foreground.invalidate();changed();},{local:true,exitOnly:true,interrupt:true});
  }return;
 }
 const token=sharedBackend?`${controller.phoneContentKey}:${popupPage}`:revealMode?`${controller.epoch}:${s.mission}:${displayTask}:${controller.current?.stage}:${controller.current?.done}:${s.notice}:${popupPage}`:controller.token()+':'+controller.current?.done+':'+s.notice+':'+popupPage;
 if(old&&popupToken===token&&!old.dataset.closing)return;
 const commit=()=>{
  if(!controller.session.task&&!preview)return;
  const template=document.createElement('template');template.innerHTML=popupMarkup(displayTask);const fresh=template.content.firstElementChild;if(!fresh)return;
  const current=host.querySelector('.task-dialog');
  const oldInstruction=current?.querySelector('.instruction'),before=oldInstruction?{top:parseFloat(getComputedStyle(oldInstruction).top),height:oldInstruction.getBoundingClientRect().height/(arena.getBoundingClientRect().width/size.width)}:null;
  let mounted=fresh;const parts=[];
  if(current&&current.dataset.task===displayTask){
   mounted=current;for(const selector of ['.instruction-copy','.phone-content']){
    const previous=current.querySelector(selector),next=fresh.querySelector(selector);if(previous&&next){previous.replaceWith(next);parts.push(next);}
   }
  }else if(current)current.replaceWith(fresh);else host.append(fresh);
  popupToken=token;mounted.dataset.task=displayTask;host.dataset.activeTask=inlinePhone?'':controller.session.task;host.dataset.sharedTask='';
  const instruction=mounted.querySelector('.instruction'),copy=instruction.querySelector('.instruction-copy');
  const visibilityChanged=syncV5InstructionVisibility(instruction,fresh.querySelector('.instruction'));
  if(visibilityChanged)foreground?.cancelInstruction(instruction);
  if(instruction.hidden){foreground?.refreshPart(mounted);foreground?.invalidate();changed();return;}
  const padding=parseFloat(getComputedStyle(instruction).paddingTop)+parseFloat(getComputedStyle(instruction).paddingBottom);
  const instructionHeight=Math.max(referenceVisual?500:0,copy.scrollHeight+padding);
  instruction.style.height=`${instructionHeight}px`;
  instruction.style.top=bfmVisual?v5InstructionTop(instructionHeight):`clamp(20px, calc(var(--guided-device-center-y, 50%) - ${instructionHeight/2}px), calc(100% - ${instructionHeight+20}px))`;
  if(before&&!visibilityChanged)foreground?.resizeInstruction(instruction,before);
  if(visibilityChanged){foreground?.refreshPart(mounted);foreground?.invalidate();}
  else if(parts.length)foreground?.refreshParts(parts);else foreground?.invalidate();changed();
 };
 if(old){commit();}else{
  host.dataset.popupPresence='0';if(!inlinePhone)foreground?.holdObject(host,s.task);commit();foreground?.transition(host,()=>{}, {local:true,enterOnly:true});
 }
}
function tick(delta){
 if(independent){independent.tick(presentationActive()?delta:0);return;}
 syncGameAudio();
 if(bfmVisual){root.dataset.presentationPaused=String(!presentationActive());if(!presentationActive())delta=0;}
 v5Tools?.update({phase:controller?.phase,revision:controller?.snapshot?.state.revision,task:controller?.session.task,backend:`${params.get('backend')} · ${MISSION_CATALOG.contentRevision}`});
 ambient?.tick?.(delta,{active:presentationActive(),reduced:reduced.matches});
 if(missionContinuation?.active){
  missionContinuation.tick(delta,{active:presentationActive(),reduced:reduced.matches});
  host.dataset.uiPresence=String(missionContinuation.opacity.value);changed();syncScene();return;
 }
 if(!controller||navigating)return;
 const waitingPhone=host.querySelector('.route-phone');
 if(waitingPhone?.dataset.sceneVersion&&waitingPhone.dataset.mediaReadyKey!==waitingPhone.dataset.sceneVersion){
  if(presentationActive())phoneLoadingAge+=Math.min(delta,.05);
  if(phoneLoadingAge>=PHONE_LOADING_DELAY&&!waitingPhone.querySelector('.phone-loading')){
   waitingPhone.querySelector('.demo-app')?.insertAdjacentHTML('beforeend','<div class="phone-loading" role="status" aria-label="Загрузка экрана"><div class="phone-loading-skeleton" aria-hidden="true"><i class="glass-control"></i><i class="glass-control"></i><i class="glass-control"></i></div></div>');
   foreground?.refreshPart(waitingPhone);changed();
  }
 }
 if(phonePending&&phoneToken!==phonePending&&!foreground?.contentBusy(host)){phonePending='';syncLinePhone();}
 recoverPendingPhoneMedia();
 if(pendingResume&&!foreground?.busy(host)){
  const pending=pendingResume;pendingResume=null;if(pending.epoch===screenEpoch&&controller.resume(pending.step)){popupPage=0;if(controller.phase==='reveal')focusCurrent();render();}
 }
 const before=controller.phase,revision=controller.revision;
 const active=presentationActive();
 if(referenceVisual||bfmVisual)root.dataset.presentationPaused=String(!active);
 const phoneReady=!inlinePhone||phoneContentReady();
 const phoneTarget=bfmVisual?controller.deviceVisibilityTarget:revealMode?Number(controller.phoneVisible&&controller.phase!=='phone-exit'):1;
 if(inlinePhone&&controller.phone&&active){const p=controller.phone;const presenceOmega=bfmVisual?V5_MOTION.presenceOmega:revealMode?REVEAL_MOTION.phoneOmega:12,phoneOmega=bfmVisual?(gesture?.kind==='phone'?V5_MOTION.dragOmega:V5_MOTION.travelOmega):presenceOmega;phoneX.step(p.x,Math.min(delta,.05),phoneOmega,reduced.matches);phoneY.step(p.y,Math.min(delta,.05),phoneOmega,reduced.matches);phonePresence.step(phoneTarget,Math.min(delta,.05),presenceOmega,reduced.matches);}
 if(revealMode&&controller.phase==='phone-enter'&&phoneReady&&phonePresence.value>.55&&!host.querySelector('.task-dialog'))syncPopup();
 if(active&&!gesture)camera.step(focusTarget,Math.min(delta,.05),bfmVisual?V5_MOTION.travelOmega:revealMode?REVEAL_MOTION.cameraOmega:10,reduced.matches);
 if(active)updateTargets();
 const current=before==='intro'?'open-max':controller.current?.step;
 const settlingNodes=bfmVisual?controller.settlingNodes:controller.nodes;
 const settled=revealMode?settlingNodes.every(o=>foreground?.isSettled(host,o.step))&&(!controller.phone||phoneX.at(controller.phone.x)&&phoneY.at(controller.phone.y)&&phonePresence.at(phoneTarget,.005,.05))&&(controller.phase!=='phone-enter'||phoneReady):foreground?.isSettled(host,current)&&(!inlinePhone||!controller.phone||phoneX.at(controller.phone.x)&&phoneY.at(controller.phone.y)&&phonePresence.at(1,.005,.05));
 // Preparing the next device screen runs alongside the route; only a scene
 // transition may block semantic progress. Readiness gates the phone itself.
 const referenceReady=phoneReady&&(controller.phase==='phone-exit'?phonePresence.value<.015:phonePresence.value>.97);
 if(automaticPresentation){
  const snapshot=sharedSession.snapshot,key=displayPhoneKey();
  const ready=active&&!gesture&&!answerPending&&!sharedSession.busy&&!controller.startup&&!controller.handoff
   &&['task','result'].includes(controller.phase)&&snapshot.state.status===controller.phase
   &&phoneReady&&phonePresence.at(1,.005,.05)&&!!controller.phone&&phoneX.at(controller.phone.x)&&phoneY.at(controller.phone.y)
   &&!waitingPhone?.querySelector('.phone-media-error')&&!waitingPhone?.dataset.gpuUploadError
   &&waitingPhone?.dataset.sceneVersion===key&&waitingPhone?.dataset.mediaReadyKey===key&&waitingPhone?.dataset.gpuReadyKey===key
   &&!foreground?.contentBusy(host)&&!foreground?.busy(host,true);
  const gate={...snapshot,view:{...snapshot.view,automaticMs:showScreenDelayMs}};
  automaticPresentation.update(gate,delta,{ready,active});
  if(snapshot.state.status==='task'&&snapshot.view.automaticMs==null&&automaticPresentation.allows(gate)&&!answerPending&&!sharedSession.busy){
   const action=automaticRoutes.tasks[snapshot.state.taskId]?.screens[snapshot.state.screenId]?.actions[0];
   if(action){answerPending=true;const generation=bindingGeneration;void sharedSession.act(snapshot.state.screenId,action.actionId,snapshot.state.revision).finally(()=>{if(generation===bindingGeneration)answerPending=false;});}
  }
  if(active&&controller.phase==='palm'&&palmPresence.value>.97&&!sharedSession.busy&&!foreground?.busy(host,true)){const scan=host.querySelector('[data-palm]');if(scan&&controller.down('autoplay')){render();foreground?.startPalmScan(host,scan.querySelector('.tile'));}}
 }
 controller.tick(delta,{active,deviceShown:phonePresence.at(1,.005,.05)&&!!controller.phone&&phoneX.at(controller.phone.x)&&phoneY.at(controller.phone.y),deviceHidden:phonePresence.at(0,.005,.05),deviceReady:phoneReady&&(!bfmVisual||waitingPhone?.dataset.gpuReadyKey===displayPhoneKey()),dragging:!!gesture,busy:bfmVisual&&(controller.handoff||controller.startup)?foreground?.contentBusy(host):foreground?.busy(host,bfmVisual||!revealMode),reduced:reduced.matches,settled:referenceVisual?referenceReady:camera.at(focusTarget,.1,.5)&&settled});
 if(bfmVisual&&(controller.paths||controller.startup))updateTargets();
 if(revealMode&&controller.expired){controller.expired=false;navigate();return;}
 if(revealMode){const timer=host.querySelector('[data-mission-timer]'),label=revealTimerLabel(controller.secondsLeft);if(timer&&timer.textContent!==label){timer.textContent=label;foreground?.refreshPart(timer);save();changed();}}
 const scan=host.querySelector('[data-palm]');
 if(mobileBridge&&sharedSession?.snapshot){const snap=sharedSession.snapshot,s=snap.state,key=displayPhoneKey();const displayed=controller.displayedState;const ready=displayed?.runId===s.runId&&displayed?.screenId===s.screenId&&displayed?.status===s.status&&presentationActive()&&!gesture&&!answerPending&&!sharedSession.busy&&!waitingPhone?.querySelector('.phone-media-error')&&!waitingPhone?.dataset.gpuUploadError&&!controller.startup&&!controller.handoff&&!foreground?.contentBusy(host)&&!foreground?.busy(host,true)&&(s.status==='scan'?palmPresence.value>.97:['completed','incomplete','expired'].includes(s.status)?true:['task','result'].includes(s.status)&&controller.phase===s.status&&phoneContentReady()&&phonePresence.at(1,.005,.05)&&!!controller.phone&&phoneX.at(controller.phone.x)&&phoneY.at(controller.phone.y)&&waitingPhone?.dataset.sceneVersion===key&&waitingPhone?.dataset.mediaReadyKey===key&&waitingPhone?.dataset.gpuReadyKey===key);mobileBridge.update({snapshot:snap,ready,palm:scan});}
 if(scan){palmPresence.step(palmVisible?1:0,Math.min(delta,.05),bfmVisual?V5_MOTION.presenceOmega:12,reduced.matches);scan.dataset.pathPresence=String(palmPresence.value);scan.dataset.progress=String(controller.phase==='holding'?controller.elapsed/.8:0);
  if(controller.phase==='holding'&&active&&ambient){const r=bounds(scan.querySelector('.tile'));ambient.scanPulse((r.x+r.w/2)/size.width,(r.y+r.h/2)/size.height,controller.elapsed/REVEAL_TIMING.hold);}
  scan.disabled=!['palm','holding'].includes(controller.phase);
  if(!palmVisible&&palmPresence.at(0,.002,.02)){scan.remove();foreground?.invalidate();}
 }
 if(before!==controller.phase){
  if(revealMode)focusCurrent();
  if(revealMode&&(controller.phase==='burst'||bfmVisual&&controller.startup&&controller.snapshot.state.scanned)&&gesture?.kind==='palm')cancelGesture();
  if(controller.phase==='reveal'){if(gesture?.kind==='palm')cancelGesture();focusCurrent();}
  if(controller.phase==='palm')focusCurrent();
  popupPage=0;render();
 }else if(revision!==controller.revision||shownRevision!==controller.revision||revealMode&&(controller.phase==='burst'||bfmVisual&&controller.startup)&&controller.nodes.some(o=>controller.presence(o)>0&&!host.querySelector(`[data-object="${o.step}"]`)))render();
 const o=controller.session.task===controller.current?.step?controller.current:null;
 if(!sharedBackend&&idPlayback.tick(0,o,delta,active&&controller.phase==='task'&&!foreground?.busy(host)&&!answerPending))answer(0,controller.token());
}
function syncGameAudio(){
 if(!gameAudio||!controller)return;
 const visible=controller.session.screen==='field'&&!navigating&&!missionContinuation?.active;
 gameAudio.sync({run:visible?controller.snapshot?.state.runId:'menu',
  stage:visible?(controller.startup?'startup:'+controller.startup.stage:controller.handoff?'handoff:'+controller.handoff.stage:''):'',
  screen:visible&&controller.phase==='task'&&phoneContentReady()?displayPhoneKey():'',
  nodes:visible?controller.nodes.filter(n=>controller.presence(n)>.1).map(n=>n.step):[],
  holding:visible&&(controller.phase==='holding'||['node','phone'].includes(gesture?.kind)),
  active:sharedSession?.connected===true&&sharedSession?.snapshot?.assignment?.lifecycle.status==='active'&&presentationActive()&&(!localRecovery||windowFocused)});
}
function answer(choice,token){
 if(sharedBackend){if(!controller||answerPending||sharedSession.busy||foreground?.contentBusy(host)||controller.phase!=='task')return;answerPending=true;const generation=bindingGeneration;Promise.resolve(controller.answer(choice,token)).catch(error=>{if(generation===bindingGeneration)feedback(error.message);}).finally(()=>{if(generation===bindingGeneration)answerPending=false;});return;}
 if(answerPending||foreground?.busy(host)){feedback('Завершаем переход');return;}
 if(controller.phase!=='task')return;
 answerPending=true;const epoch=screenEpoch;
 foreground.transitionContent(host,()=>{
  answerPending=false;if(epoch!==screenEpoch||!controller.answer(choice,token))return;
  popupPage=0;render();
 });
}
function warmMissionEntry(id){
 if(!bfmVisual||!id)return;
 const mission=MISSION_CATALOG.missions[id],task=MISSION_CATALOG.tasks[mission?.taskIds[0]],first=task?.screens[task.startScreenId];
 if(!first)return;
 const screens=[first,...first.actions.filter(a=>a.outcome.kind==='navigate').slice(0,2).map(a=>task.screens[a.outcome.screenId])];
 foreground?.prewarmDeviceAssets(screens.filter(s=>s&&!s.missing).map(s=>MISSION_CATALOG.assets[s.assetId]));
}
function navigate(id,restart=false){
 if(navigating)return;
 cancelGesture();const epoch=++screenEpoch;answerPending=false;pendingResume=null;foreground?.cancelContent(host);navigating=true;
 const commit=()=>{if(epoch!==screenEpoch)return;resetPrompt=false;if(restart){controller.restart();view='';}else{if(sharedBackend&&id)controller.select(id);else{controller.menu();if(id)controller.select(id);}}popupPage=0;popupToken='';render(true);navigating=false;};
 if(sharedBackend&&restart){
  // Keep the old scene until backend acknowledges the new run. Build the palm
  // once, inside the existing transition, rather than rendering stale state.
  void controller.restart().then(result=>{
   if(epoch!==screenEpoch)return;
   if(!result?.reply.ok){navigating=false;render();feedback('Не удалось перезапустить миссию. Попробуй ещё раз.');return;}
   const confirmed=()=>{if(epoch!==screenEpoch)return;resetPrompt=false;popupPage=0;popupToken='';render(true);navigating=false;};
   if(foreground)foreground.transition(host,confirmed,{interrupt:true});else confirmed();
  });
  return;
 }
 if(foreground)foreground.transition(host,commit,{interrupt:true});else commit();
}
function changeResetPrompt(open,confirm=false){
 if(controller.session.screen==='field'||confirm&&(!resetPrompt||navigating)||!confirm&&open===resetPrompt)return;
 cancelGesture();const epoch=++screenEpoch;answerPending=false;pendingResume=null;phonePending='';foreground?.cancelContent(host);navigating=true;
 resetPrompt=open;
 const commit=()=>{
  if(epoch!==screenEpoch)return;
  if(confirm&&sharedBackend){controller.reset();view='';}
  else if(confirm){controller=createController();controller.session.screen='missions';if(revealMode)controller.configure(host.clientWidth,host.clientHeight,adjustableIcons?referenceTile:240);history=false;focusTarget=0;camera.value=0;camera.velocity=0;}
  popupPage=0;popupToken='';render(true);navigating=false;
 };
 if(foreground)foreground.transition(host,commit,{interrupt:true});else commit();
}
function close(){
 if(navigating||revealMode)return;
 screenEpoch++;answerPending=false;phonePending='';foreground?.cancelContent(host);
 if(controller.close()){render();save();}
}
let tapHand=null;
const touchScale=()=>arena.getBoundingClientRect().width/size.width;
function activateButton(b){
 if(!controller||!inputActive()||!b||b.disabled)return;
 if(bfmVisual&&!touchEligible(root,b))return;
 if((managedAssignment||managedShell)&&(b.dataset.mission||['data-restart-mission','data-menu','data-continue-mission','data-reset-progress','data-confirm-reset-progress'].some(a=>b.hasAttribute(a))))return;
 if(!b.classList.contains('media-hotspot'))foreground?.highlightTile(b);
 if(b.hasAttribute('data-media-page')){void turnMediaPage(b,foreground,host);return;}
 if(b.hasAttribute('data-reset-progress')){changeResetPrompt(true);return;}
 if(b.hasAttribute('data-confirm-reset-progress')){changeResetPrompt(false,true);return;}
 if(b.hasAttribute('data-cancel-reset-progress')){changeResetPrompt(false);return;}
 if(b.hasAttribute('data-continue-mission')){
  if(navigating||!missionContinuation||controller.phase!=='complete')return;
  continuationContext={runId:controller.snapshot.state.runId,missionId:controller.snapshot.state.missionId};
  cancelGesture();screenEpoch++;answerPending=false;pendingResume=null;foreground?.cancelContent(host);
  if(missionContinuation.start()){navigating=true;host.inert=true;}return;
 }
 if(b.dataset.mission){navigate(b.dataset.mission);return;}
 if((managedAssignment||managedShell)&&['data-restart-mission','data-menu','data-continue-mission'].some(a=>b.hasAttribute(a)))return;
 if(b.hasAttribute('data-restart-mission')){if(!navigating)navigate(controller.session.mission,true);return;}
 if(b.hasAttribute('data-menu')){navigate();return;}
 if(navigating){feedback('Переходим к выбранному экрану');return;}
 if(b.hasAttribute('data-focus')){focusCurrent();render();return;}
 if(b.hasAttribute('data-phone-drag'))return;
 if(b.hasAttribute('data-phone-resume')){if(controller.resume(controller.current?.step)){popupPage=0;render();}return;}
 if(b.hasAttribute('data-line-next')){feedback('Следующая возможность откроется после выполнения задания');return;}
 if(b.hasAttribute('data-close')){close();return;}
 if(b.hasAttribute('data-cta')){foreground?.seedRouteObject(host,'open-max',b.querySelector('.cta-orb'));if(controller.start()){focusCurrent();render();}return;}
 if(b.dataset.branch){if(foreground?.busy(host)){feedback('Завершаем переход');return;}if(revealMode){const epoch=screenEpoch;foreground.transitionContent(host,()=>{if(epoch===screenEpoch&&controller.choose(b.dataset.branch)){popupPage=0;render();}});}else if(controller.choose(b.dataset.branch))render();return;}
 if(b.hasAttribute('data-answer')){answer(sharedBackend?b.dataset.answer:Number(b.dataset.answer),b.dataset.answerToken);return;}
 if(b.dataset.object){
  if(['paused','branch-paused'].includes(controller.phase)&&foreground?.busy(host)){pendingResume={step:b.dataset.object,epoch:screenEpoch};feedback('Открываем задание');return;}
  if(controller.resume(b.dataset.object)){popupPage=0;if(controller.phase==='reveal')focusCurrent();render();}
  else feedback(b.dataset.object==='open-max'?'MAX открыт':controller.nodes.find(o=>o.step===b.dataset.object)?.done?'Задание уже выполнено':revealMode?'Откроется после текущего задания':'Задание откроется после появления иконки');
 }
}
root.addEventListener('click',e=>{if(e.detail===0)activateButton(e.target.closest('button'));});
function cancelGesture({keepTouch=false}={}){
 if(!keepTouch)tapHand=null;
 const g=gesture;gesture=null;controller?.cancelContact();
 if(g){if(bfmVisual&&g.kind==='node')foreground?.releaseCapturedObject(host,g.node.step);delete g.el.dataset.dragging;if(g.el.hasPointerCapture?.(g.id))g.el.releasePointerCapture(g.id);}
 if(sharedBackend&&g?.moved&&g.kind==='node')void controller.persistLayout();save();
}
// A real contact enters a target once. A newly rendered screen beneath the
// same stationary hand cannot advance itself: leave this hit area or lift first.
function tapAt(e){
 if(!tapHand||tapHand.id!==e.pointerId||!inputActive()||!controller)return;
 const b=touchPick(root,e.target,e.clientX,e.clientY,touchScale());
 const prior=tapHand.rect,insidePrior=prior&&touchContains(prior,e.clientX,e.clientY,0);
 if(!b||!touchEligible(root,b)){if(!insidePrior)tapHand.rect=null;return;}
 const screen=controller.snapshot?.state?.screenId??controller.session?.screen??'';
 const key=[screen,...['answer','answerToken','object','mission','branch','mediaPage'].map(k=>b.dataset[k]??''),
  ...['palm','phone-resume','focus','menu','cta','close','line-next','continue-mission','restart-mission','reset-progress','confirm-reset-progress','cancel-reset-progress'].filter(k=>b.hasAttribute('data-'+k))].join('|');
 // Different nearby targets can fire without lifting. The spatial24px filter
 // only rearms an overlapping target; no dwell/elapsed-time test is used.
 if(insidePrior&&(key===tapHand.key||Math.hypot(e.clientX-tapHand.x,e.clientY-tapHand.y)<24*touchScale()))return;
 const tile=b.querySelector('.tile'),rect=(tile||b).getBoundingClientRect();
 if(!touchContains(rect,e.clientX,e.clientY,touchScale()))return;
 if(b.hasAttribute('data-phone-drag'))return;
 const latch=()=>Object.assign(tapHand,{rect:touchBounds(rect,touchScale()),key,x:e.clientX,y:e.clientY});
 if(b.hasAttribute('data-palm')){
  if(controller.phase!=='palm'||controller.contact!==null)return;
  if(controller.down(e.pointerId))latch();
  return;
 }
 if(bfmVisual&&controller.startup||foreground?.busy(host)||navigating)return;
 latch();
 activateButton(b);
}
root.addEventListener('pointerdown',e=>{
 if(!inputActive()||e.button!==0||tapHand)return;
 tapHand={id:e.pointerId,rect:null};tapAt(e);
});
root.addEventListener('pointermove',e=>{
 if(tapHand?.id===e.pointerId&&(e.buttons&1)!==0)tapAt(e);
});
root.addEventListener('pointerup',e=>{
 if(tapHand?.id!==e.pointerId)return;
 if(controller?.contact===e.pointerId)controller.up(e.pointerId,true);
 tapHand=null;
});
root.addEventListener('pointercancel',cancelGesture);
// Keyboard and physical touch share the same trusted immediate contact.
root.addEventListener('keydown',e=>{if(!controller||!inputActive())return;if(e.target.closest('[data-palm]')&&[' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat&&controller.down('keyboard')){render();}}});
root.addEventListener('keyup',e=>{if(!controller||!inputActive())return;if([' ','Enter'].includes(e.key))(sharedBackend?controller.up('keyboard'):controller.cancelContact('keyboard'));});
window.addEventListener('blur',()=>{windowFocused=false;gameAudio?.setActive(presentationActive()&&!localRecovery);cancelGesture();sharedSession?.owner(false);});window.addEventListener('focus',()=>{windowFocused=true;if(inputActive())sharedSession?.owner(true);});document.addEventListener('visibilitychange',()=>{cancelGesture();independent?.setActive(presentationActive());sharedSession?.owner(inputActive());});
window.addEventListener('max-service-pointer-cancel',cancelGesture);
window.addEventListener('keydown',e=>{if(!controller||!inputActive())return;if(e.key==='Escape'){if(resetPrompt){changeResetPrompt(false);return;}cancelGesture();close();}});
document.addEventListener('dragstart',e=>e.preventDefault(),true);
installTaskDismiss({root:document,enabled:()=>!revealMode,getOpen:()=>{const popup=host.querySelector('.task-dialog');return popup?[{popup,panels:[...popup.querySelectorAll('.instruction,.demo-app,.close'),...(inlinePhone?[host.querySelector('.route-phone')].filter(Boolean):[])]}]:[];},close});

function syncScene(){
 if(independent){field?.update({placements:[],network:{states:{},links:[]},endpoints:{},selectedItem:null});return;}
 if(!field||!controller)return;
 const worldHeight=18*Math.tan(25*Math.PI/360),scale=worldHeight/size.height,network={states:{},links:[]},placements=[],rects=new Map(),ids=new Map();
 const world=p=>({x:(p.x-size.width/2)*scale,y:(size.height/2-p.y)*scale});
 if(controller.session.screen==='field')for(const [index,o]of controller.nodes.entries()){
  const el=host.querySelector(`[data-object="${o.step}"]`),r=bounds(el?.querySelector('.tile'));if(!r)continue;
  const id=100000+index,mission=catalog.byNumber[controller.mission.number]||catalog.byNumber[1],type=mission.topology.paths[0].steps[Math.min(Math.max(0,index-1),mission.topology.paths[0].steps.length-1)].type;
  ids.set(o.step,id);rects.set(id,{...r,radius:r.w*(o.step==='open-max'?.5:.23)});
  placements.push({id,type,longitude:(r.x+r.w/2-size.width/2)*scale/.03,latitude:(size.height/2-r.y-r.h/2)*scale/.03,altitude:.08,droppedAt:0,signalRadius:.15});network.states[id]='link';
  const h=bounds(host),x=r.x+r.w/2-h.x;
  // BFM always uses the full wall, including the persistent managed shell
  // (which has no layout query). Its icon row may extend outside the host zone.
  el.dataset.pathPresence=String((revealMode&&(bfmVisual||service||params.get('layout')==='wall')?1:Math.max(0,Math.min(1,(x+60)/180,(host.clientWidth+60-x)/180)))*(revealMode?revealPresence(o):1));el.inert=Number(el.dataset.pathPresence)<.05;
 }
 const routeEdges=revealMode?controller.edges():guidedEdges(controller.nodes,controller.session.mission);
 for(const edge of routeEdges){
  const a=ids.get(edge.a),b=ids.get(edge.b);if(a===undefined||b===undefined)continue;
  const key=`${a}:${b}`,curve=tileEdgeCurve(rects.get(a),rects.get(b),edgePorts.get(key));edgePorts.set(key,curve);
  const frames=[a,b].map(id=>{const r=rects.get(id);return {...world({x:r.x+r.w/2,y:r.y+r.h/2}),w:r.w*scale,h:r.h*scale,radius:r.radius*scale};});
  const visibility=Math.min(...[edge.a,edge.b].map(id=>Number(host.querySelector(`[data-object="${id}"]`)?.dataset.pathPresence??0)))*(missionContinuation?.active?missionContinuation.opacity.value:1);
  network.links.push({a,b,screen:inlinePhone,scope:'guided',correct:true,visibility,reveal:edge.reveal??(edge.revealing&&!reduced.matches?revealTracePresence(controller.elapsed/(controller.revealTiming?.trace??REVEAL_TIMING.trace)):1),edgeCurve:{start:world(curve.start),end:world(curve.end),c1:world(curve.c1),c2:world(curve.c2),bowX:curve.bowX*scale,bowY:-curve.bowY*scale,frames,flipBow:true}});
 }
 if(inlinePhone&&controller.current&&controller.session.screen==='field'){
  const current=ids.get(controller.current.step),phone=bounds(host.querySelector('.route-phone .demo-app')),next=revealMode?rects.get(ids.get(controller.next?.id)):bounds(host.querySelector('[data-line-next] .tile'));
  const type=placements.at(-1)?.type;
  const addAnchor=(id,r)=>{rects.set(id,{...r,radius:30});placements.push({id,type,longitude:(r.x+r.w/2-size.width/2)*scale/.03,latitude:(size.height/2-r.y-r.h/2)*scale/.03,altitude:.08,droppedAt:0,signalRadius:.15});network.states[id]='link';};
  if(current!==undefined&&phone&&(next||revealMode)){
   addAnchor(199998,phone);if(next&&!revealMode)addAnchor(199999,next);
   const pairs=[[current,199998],...(!revealMode?[[199998,199999]]:[])];
   for(const [a,b]of pairs){
    const key=`line:${a}:${b}`,lanes=phoneLaneCurves(rects.get(a),rects.get(b),edgePorts.get(key));edgePorts.set(key,lanes.base);
    const frames=[a,b].map(id=>{const r=rects.get(id);return {...world({x:r.x+r.w/2,y:r.y+r.h/2}),w:r.w*scale,h:r.h*scale,radius:r.radius*scale};});
    for(const [lane,curve]of lanes.curves.entries())network.links.push({a,b,lane,style:deviceLinkStyle,screen:true,scope:'guided-line',correct:true,visibility:phonePresence.value*(bfmVisual&&controller.handoff?.stage!=='link'?controller.deviceLinkPresence:1),reveal:bfmVisual&&(controller.handoff||controller.startup)?(controller.deviceLinkReveal??1):referenceVisual?phonePresence.value:revealMode&&controller.phase==='phone-enter'&&!reduced.matches?revealTracePresence((controller.elapsed-lane*(bfmVisual?V5_MOTION.fanStagger:.05))/(bfmVisual?V5_MOTION.fanSeconds:REVEAL_TIMING.phoneEnter-.2)):1,edgeCurve:{start:world(curve.start),end:world(curve.end),c1:world(curve.c1),c2:world(curve.c2),bowX:curve.bowX*scale,bowY:-curve.bowY*scale,frames,flipBow:true}});
   }
  }
  host.dataset.phoneInputLinks=String(network.links.filter(e=>e.b===199998&&e.visibility>.01).length);host.dataset.phoneOutputLinks=String(network.links.filter(e=>e.a===199998&&e.visibility>.01).length);
 }
 field.update({placements,network,endpoints:{},selectedItem:null});
}
function sceneSize(){
 if(referenceVisual)return {width:REFERENCE_UI.width,height:REFERENCE_UI.height};
 if(service||bfmVisual||params.get('layout')==='wall')return {width:4096,height:1280};
 const wall=zonesForLayout('single')[0];
 return new URLSearchParams(location.search).get('geometry')==='wall'?{width:wall.w,height:wall.h}:{width:1600,height:1000};
}
function fit({viewportOnly=false}={}){
 cancelGesture();
 // A wall-geometry preview uses the physical single-zone height without assigning a worker.
 size=sceneSize();
 arena.style.width=size.width+'px';arena.style.height=size.height+'px';arena.style.transform=`translate(-50%,-50%) scale(${Math.min(innerWidth/size.width,innerHeight/size.height)})`;
 v5Tools?.fit(innerWidth,innerHeight);
 if(independent){independent.fit();foreground?.invalidate({layout:true});field?.resize();changed();return;}
 if(viewportOnly){field?.resize();changed();return;}
 const zone=zonesForLayout('single')[0];
 host.style.cssText=referenceVisual?'left:1984px;top:168px;width:1543px;height:804px':service||bfmVisual||params.get('layout')==='wall'?`left:${zone.left}px;top:${zone.top}px;width:${zone.w}px;height:${zone.h}px`:`left:24px;top:24px;width:${size.width-48}px;height:${size.height-48}px`;
 if(revealMode)host.style.overflow='visible';
 if(controller){if(revealMode)controller.configure(host.clientWidth,host.clientHeight,adjustableIcons?referenceTile:240);focusCurrent(true);popupToken='';render();}foreground?.invalidate({layout:true});field?.resize();changed();
}
window.addEventListener('resize',fit);
window.addEventListener('message',e=>{
 if(!service||e.source!==parent||e.origin!==location.origin||e.data?.type!=='max-service-state')return;
 servicePaused=e.data.playing===false;gameAudio?.setActive(inputActive());sharedSession?.owner(inputActive());
 if(servicePaused)cancelGesture();
 field?.setServicePaused(servicePaused);ambient?.pause(servicePaused);
 document.documentElement.dataset.servicePaused=String(servicePaused);
});
async function readManagedContext(){
 const response=await fetch('/bridge/context',{cache:'no-store',signal:AbortSignal.timeout(4500)});
 if(!response.ok)throw Error('Managed context unavailable');
 const context=await response.json();
 if(context.schemaVersion!==1||context.apiOrigin!==location.origin)throw Error('Managed context conflict');
 return context;
}
function configureAutomatic(context){
 const next=synchronizeManagedAutoplay({presentation:automaticPresentation,routes:automaticRoutes,delayMs:showScreenDelayMs},context,MISSION_CATALOG);
 automaticPresentation=next.presentation;automaticRoutes=next.routes;showScreenDelayMs=next.delayMs;
 document.documentElement.dataset.managedAutoplay=String(!!automaticPresentation);
}
async function confirmedManagedRevocation(error,assignmentId,sessionId){
 // OFF/new assignment can revoke the adapter binding before this iframe's next
 // context poll. Only classify these errors as teardown after authority agrees.
 if(!managedShell||!['STALE_MAX_BINDING','MAX_BINDING_UNAVAILABLE'].includes(error?.code))return false;
 try{
  const context=await readManagedContext();
  return context.active!==true||context.assignmentId!==assignmentId||context.sessionId!==sessionId||!!context.show&&context.show.phase!=='id';
 }catch{return false;}
}
function managedSession(assignmentId,sessionId){
 const generation=bindingGeneration;
 const port=mobileWall?createMobileWallSessionPort():createServerSessionPort({managed:true,getContext:readManagedContext,getAuthHeaders:()=>readLocalPlayerHeaders()});
 return createWebGLSession({port,catalog:MISSION_CATALOG,initialOwnerActive:false,assignmentId,sessionId,profile:'server',
  onSnapshot:snapshot=>{
   if(pageDisposed||generation!==bindingGeneration)return;
   managedSnapshot(snapshot);
   if(managedShell)arena.inert=!inputActive();
   if(!controller||snapshot.assignment?.lifecycle.status!=='active')return;
   controller.accept(snapshot);
   if(foreground&&!navigating){if((controller.phase==='burst'||bfmVisual&&controller.startup&&controller.snapshot.state.scanned)&&gesture?.kind==='palm')cancelGesture();if(!gesture)focusCurrent();render();}
  },
  onError:async error=>{if(pageDisposed||generation!==bindingGeneration)return;if(await confirmedManagedRevocation(error,assignmentId,sessionId))return;if(pageDisposed||generation!==bindingGeneration)return;console.error('MAX backend',error);if(foreground)feedback('Нет связи с backend. Экран сохранён.');}
 });
}
function configureController(saved){
 const generation=bindingGeneration;
 controller=createController(saved);
 if((mobileWall||recoveryChoice==='continue')&&controller.phase==='paused')controller.resume(controller.activeId);
 if(controller.session.screen==='cta')controller.session.screen='missions';
 if(bfmVisual&&sharedBackend){
  controller.previewPhoneAnchor=()=>({x:deviceCenter()+camera.value,y:0});
  controller.previewDevice=()=>{const task=MISSION_CATALOG.tasks[controller.steps[0]?.id],screen=task?.screens[task.startScreenId];return {kind:screen?.deviceKind,asset:MISSION_CATALOG.assets[screen?.assetId]};};
  controller.readMotionPose=node=>{
   const goal=controller.pose(node),offset=foreground?.readObjectOffset(host,node.step);
   return offset?{...goal,worldX:goal.worldX+offset.x,worldY:goal.worldY+offset.y}:goal;
  };
  controller.readCompletionPose=node=>{
   const goal=controller.pose(node),offset=foreground?.captureObject(host,node.step);
   foreground?.releaseCapturedObject(host,node.step);foreground?.holdObject(host,node.step);
   return offset?{...goal,worldX:goal.worldX+offset.x,worldY:goal.worldY+offset.y}:goal;
  };
  const revealNext=()=>{
   if(generation!==bindingGeneration||!controller)return;
   resetPrompt=false;popupPage=0;popupToken='';focusCurrent(true);render(true);
   palmPresence.value=1;palmPresence.velocity=0;
   const scan=host.querySelector('[data-palm]');if(scan)scan.dataset.pathPresence='1';
   host.dataset.uiPresence='0';host.inert=true;
  };
  missionContinuation=new V5MissionContinuation({
   commit:()=>generation===bindingGeneration?continueV5Mission(sharedSession,content,continuationContext):null,
   reveal:revealNext,
   done:()=>{if(generation!==bindingGeneration)return;host.inert=false;navigating=false;},
   error:error=>{if(generation!==bindingGeneration)return;console.error('MAX next mission',error);revealNext();feedback('Не удалось перейти к следующей миссии. Попробуй ещё раз.');}
  });
 }

 if(revealMode){const geometry=sceneSize();controller.configure(geometry.width-48,geometry.height-48,adjustableIcons?referenceTile:240);}
 if(!sharedBackend&&reviewMission&&controller.select(reviewMission)){
  controller.start();controller.tick(0,{settled:true});controller.down('fixture');for(let n=0;n<8;n++)controller.tick(.1);
  const label=document.createElement('div');label.className='guided-review-label';label.textContent='Проверка вёрстки · прогресс не сохраняется';document.body.append(label);
 }
}
function applyManagedActivity(){
 const active=presentationActive();
 independent?.setActive(active);
 root.dataset.presentationPaused=String(!active);arena.inert=!!independent||!active;
 gameAudio?.setActive(active&&!independent);field?.setServicePaused(!active);ambient?.pause(!active);
 if(!active)cancelGesture();
 void sharedSession?.owner(inputActive());
}
async function detachManagedSession(){
 ++bindingGeneration;screenEpoch++;document.documentElement.dataset.managedBinding='';bindingKey='';managedVisible=false;
 cancelGesture();missionContinuation?.cancel();missionContinuation=null;continuationContext=null;
 const previous=sharedSession;sharedSession=null;controller=null;automaticPresentation=null;automaticRoutes=null;
 pendingResume=null;answerPending=false;navigating=false;resetPrompt=false;history=false;view='';shownRevision=-1;
 popupToken='';popupPage=0;phoneStep='';phoneToken='';phonePending='';phoneLoadingAge=0;
 // Preserve the last painted scene for the host's exit fade, with no live input/session.
 // Prepared startup textures and the bounded three-screen cache remain reusable.
 managedNotice.hidden=true;arena.hidden=false;applyManagedActivity();
 if(previous)try{await previous.close();}catch(error){const receipt=previous.snapshot?.assignment?.receipt;if(!await confirmedManagedRevocation(error,receipt?.assignmentId,receipt?.sessionId))console.error('MAX session close',error);}
}
function clearManagedScene(){
 foreground?.cancelContent(host);foreground?.cancelTransitions();
 for(const motion of [camera,palmPresence,phoneX,phoneY,phonePresence]){motion.value=0;motion.velocity=0;}
 edgePorts.clear();host.replaceChildren();host.dataset.uiPresence='1';host.inert=false;foreground?.invalidate();
 field?.update({placements:[],network:{states:{},links:[]},endpoints:{},selectedItem:null});changed();
}
async function refreshManagedBinding(){
 try{
  const context=await readManagedContext();
  if(pageDisposed)return;
  if(context.presentation?.desiredMode==='assets'){
   if(independent&&independentAuthority?.owner!==context.presentation.owner){independent.dispose();independent=null;independentApplied=null;independentCommand=null;}
   if(!independent){
    const wasVisible=managedVisible;await detachManagedSession();if(pageDisposed)return;managedVisible=wasVisible;
    clearManagedScene();configureMobile(null);
    const independentCatalog={...MISSION_CATALOG,assets:{...MISSION_CATALOG.assets,...Object.fromEntries([...independentAssetCatalog.devices,...independentAssetCatalog.icons].map(asset=>[asset.assetId,asset]))}};
    independent=createIndependentAssets({host,arena,foreground,catalog:independentCatalog,reduced,changed,
     onApplied:state=>{independentApplied=state;publishIndependentApplied();},
     onError:error=>{const safe=/^[A-Za-z][A-Za-z0-9_.-]{0,95}$/;const code=safe.test(error.code??error.message)?(error.code??error.message):safe.test(`MAX_ASSET_${error.name}`)?`MAX_ASSET_${error.name}`:'MAX_ASSET_PREPARATION_FAILED';document.documentElement.dataset.independentError=code;parent.postMessage({type:'max-assets:error',owner:independentAuthority?.owner,code},location.origin);console.error('MAX independent assets',error);}});
    fit();syncScene();
   }
   independentAuthority=context.presentation;
   independent.accept(context.presentation);document.documentElement.dataset.independentOwner=context.presentation.owner;applyManagedActivity();return;
  }
  if(independent){independent.dispose();independent=null;independentAuthority=null;independentApplied=null;independentCommand=null;delete document.documentElement.dataset.independentOwner;clearManagedScene();fit();}
  const active=context.active===true&&(!context.show||context.show.phase==='id');
  const key=active&&typeof context.assignmentId==='string'&&typeof context.sessionId==='string'?`${context.assignmentId}:${context.sessionId}`:'';
  if(key===bindingKey){
   if(key)configureAutomatic(context);
   return;
  }
  await detachManagedSession();
  if(pageDisposed||!key)return;
  configureMobile(context);
  const generation=bindingGeneration,session=managedSession(context.assignmentId,context.sessionId);
  sharedSession=session;configureAutomatic(context);
  try{
   await session.start();
   if(pageDisposed||generation!==bindingGeneration){await session.close();return;}
   // A fresh authoritative context must still match after opening the session.
   const confirmed=await readManagedContext();
   if(!confirmed.active||confirmed.assignmentId!==context.assignmentId||confirmed.sessionId!==context.sessionId||(confirmed.show&&confirmed.show.phase!=='id')){await detachManagedSession();return;}
   if(pageDisposed||generation!==bindingGeneration){await session.close();return;}
   clearManagedScene();configureController();fit();syncScene();
   // Paint the new static scene while progression/input remain suspended, so
   // the host never fades in the preceding assignment's drawing buffer.
   field.setServicePaused(false);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(pageDisposed||generation!==bindingGeneration)return;
   applyManagedActivity();
   bindingKey=key;document.documentElement.dataset.managedBinding=context.assignmentId;
   document.documentElement.dataset.sessionStorage='server';document.documentElement.dataset.managedConnection='ready';
  }catch(error){await detachManagedSession();throw error;}
 }catch(error){if(!pageDisposed){console.error('MAX managed binding',error);document.documentElement.dataset.managedConnection='retrying';}}
 finally{if(!pageDisposed)contextTimer=setTimeout(refreshManagedBinding,500);}
}
window.addEventListener('message',event=>{
 if(!managedShell||event.source!==parent||event.origin!==location.origin)return;
 if(event.data?.type==='max-assets:scene'){
  independentCommand=event.data;publishIndependentApplied();return;
 }
 if(event.data?.type!=='max-managed-visibility'||typeof event.data.visible!=='boolean')return;
 managedVisible=event.data.visible;applyManagedActivity();
});
function publishIndependentApplied(){
 const state=independentApplied,command=independentCommand;
 if(!state||!command||!independentAuthority||independentKey(state)!==independentKey(command)||independentKey(state)!==independentKey(independentAuthority))return;
 parent.postMessage({type:'max-assets:applied',owner:state.owner,revision:state.revision,modeEpoch:state.modeEpoch,settingsRevision:state.settingsRevision??0,sceneKey:independentKey(state)},location.origin);
}
async function boot(){
 if(!managedShell){const initialContext=await readManagedContext();configureMobile(initialContext);if(initialContext.assignmentId===managedAssignment&&initialContext.sessionId===params.get('session'))configureAutomatic(initialContext);}

 if(bfmVisual&&(globalThis.STAND_AUDIO_MODE==='master'||document.documentElement.dataset.managedAudio==='true'))gameAudio=mountV5Audio();
 document.documentElement.dataset.service=String(service);document.documentElement.dataset.layout='single';
 if(bfmVisual&&!service&&!automaticPresentation)v5Tools=createV5Tools({arena,params,onViewport:()=>fit({viewportOnly:true})});
 const [loaded,shell,client,contours]=await Promise.all([loadMissionCatalog('./config/client-webgl.json'),loadUiShellConfig(),fetch('./config/client-missions.json').then(r=>r.json()),loadEarthContours()]);
 content=sharedBackend?sharedRevealContent(MISSION_CATALOG):clientContent(client);
 if(sharedBackend&&!managedShell){
  const profile=params.get('backend');let port;
  if(profile!=='server'){
   const key=`${WEBGL_SHARED_KEY}${bfmVisual?':v5':''}:${MISSION_CATALOG.contentRevision}`;
   const persistence=bfmVisual?createIndexedDBPersistence({legacyStorage:localStorage,key}):createBrowserPersistence({storage:localStorage,key});
   port=(bfmVisual?createV5MissionSessionApplication:createMissionSessionApplication)({catalog:MISSION_CATALOG,persistence});
  }
  sharedSession=profile==='server'?managedSession(managedAssignment,params.get('session')):createWebGLSession({port,catalog:MISSION_CATALOG,initialOwnerActive:false,assignmentId:managedAssignment,sessionId:params.get('session')||(bfmVisual?'webgl-v5':'site-shared'),profile,onSnapshot:snapshot=>{managedSnapshot(snapshot);if(!controller||snapshot.assignment?.lifecycle.status!=='active')return;controller.accept(snapshot);if(foreground&&!navigating){if((controller.phase==='burst'||bfmVisual&&controller.startup&&controller.snapshot.state.scanned)&&gesture?.kind==='palm')cancelGesture();if(!gesture)focusCurrent();render();}},onError:error=>{console.error('MAX backend',error);if(foreground)feedback('Нет связи с backend. Экран сохранён.');}});
  await sharedSession.start();
  if(pageDisposed){await sharedSession.close();return;}
  if(localRecovery)recoveryChoice=await showV5Recovery({snapshot:sharedSession.snapshot,catalog:MISSION_CATALOG,document,onChoose:choice=>applyRecoveryChoice(sharedSession,choice)});
  document.documentElement.dataset.sessionStorage=profile==='server'?'server':bfmVisual?'indexeddb':'localStorage';
 }
 let saved;if(!sharedBackend&&!reviewMission)try{saved=localStorage.getItem(storage);}catch{}
 if(!managedShell)configureController(saved);
 const raw=serializeMissionCatalog(loaded);for(const value of Object.values(raw.system.objectSettings)){value.size=.42;value.signalRadius=.15;}catalog=parseMissionCatalog(raw);configureMissions(catalog);
 if(referenceVisual){root.insertAdjacentHTML("beforeend",`<div class="reference-brand-left"><img src="./brand/assets/logos/max-primary-white.svg" alt="MAX"><p>Миссия</p><strong data-reference-mission></strong></div><div class="reference-brand-right"><img src="./brand/assets/logos/max-primary-white.svg" alt="MAX"></div>`);}
 if(bfmVisual)root.insertAdjacentHTML('beforeend','<div class="v5-brand"><img src="./brand/assets/logos/max-primary-white.svg" alt="MAX"></div>');
 fit();if(!service&&!managedAssignment&&!managedShell){const mode=new URLSearchParams(location.search).get('background');ambient=bfmVisual?commonMapBackground(document.querySelector('#ambient'),{standMask:true}):(revealMode?(mode==='live'?commonMapBackground:mode==='svg'?referenceBackground:lumiReferenceBackground):background)(document.querySelector('#ambient'));}assets=new PreparedAssets();
 v5Tools?.fit(innerWidth,innerHeight);
 if(bfmVisual&&sharedBackend){
  root.inert=true;document.documentElement.dataset.assetPreparation='loading';
  startupPlan=v5StartupPlan(MISSION_CATALOG,['./brand/assets/logos/max-primary-white.svg','./brand/assets/logos/max-symbol-white.svg',...v5IconUrls()]);
  startupAssets=new V5StartupAssets(document.baseURI);
 }
 await Promise.all([startupAssets?startupAssets.load(startupPlan.urls,(done,total)=>{loading.textContent=`Загрузка ресурсов MAX: ${done} / ${total}`;}):sharedBackend?warmSharedAssets(Object.values(MISSION_CATALOG.tasks).flatMap(t=>Object.values(t.screens).slice(0,2).filter(s=>!s.missing).map(s=>MISSION_CATALOG.assets[s.assetId])).filter(Boolean)):preloadTaskMedia(),prepareFonts(document.fonts),...(!startupAssets?[...((referenceVisual||bfmVisual)?['./brand/assets/logos/max-primary-white.svg']:[]),'./brand/assets/logos/max-symbol-white.svg',...(sharedBackend?[]:ID_IMAGES),...content.missions.flatMap(m=>m.qr?[m.qr.image]:[])].map(src=>{const image=new Image();image.src=src;return image.decode();}):[]),assets.load(collectAssetSources(catalog,ITEM_TYPES,contours,shell.rendering.earth.russiaContour,true))]);
 if(pageDisposed)return;
 document.documentElement.dataset.graphicsBootId=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 document.documentElement.dataset.graphicsBootCount=String(Number(document.documentElement.dataset.graphicsBootCount||0)+1);
 field=await createWebGLField({container:document.querySelector('#world'),planar:true,hideNodes:true,preparedAssets:assets,contourCatalog:contours,startPaused:true,placements:[],network:{states:{},links:[]},itemTypes:ITEM_TYPES,endpoints:{},selectedItem:null,maxDrawingBufferPixels:MAX_DRAWING_BUFFER_PIXELS,earthStyle:shell.rendering.earth,nodeIconBackdropStyle:shell.rendering.nodeIconBackdrop,signalLinkStyle:{...shell.rendering.signalLinks,...routeLinkStyle},onPlace:()=>{},onMove:()=>{},onRemove:()=>{}});
 if(pageDisposed){field.dispose();return;}
 foreground=createJourneyWebGLUI({root,arena,getSize:()=>size,onFrame:tick,gradients:v5Tools?.gradients,onMotion:()=>{changed();syncScene();},startup:startupAssets?{
  assets:startupAssets,host,frames:[v5SplashWarmup(),v5SplashWarmup(360)],
  icons:content.missions.flatMap(m=>m.steps.flatMap(step=>['','Следующий шаг','Выполнено','Продолжить задание'].map(status=>referenceNodeMarkup(step.id,step.iconId,step.label,true,status)))).concat(referenceNodeMarkup('open-max','open-max','Открыть MAX')),
  palm:`<button class="object guided-palm" data-route-next="guided-palm" data-palm data-touch-minimum="500">${bfmVisual?v5IconTile(MISSION_CATALOG,'scan',160):`<span class="tile glass-control">${palm}</span>`}<span class="object-label icon-caption">${palmCopy}<small>${palmHint}</small></span></button>`,
  palmBurst:`<button class="object guided-palm" data-route-next="guided-palm" data-palm data-touch-minimum="500">${bfmVisual?v5IconTile(MISSION_CATALOG,'scan',160):`<span class="tile glass-control">${palm}</span>`}<span class="object-label icon-caption">${bfmVisual?palmCopy:'Открываем возможности'}<small></small></span></button>`,
  finals:[],
  progress:(done,total)=>{loading.textContent=`Подготовка графики MAX: ${done} / ${total}`;}
 }:null});field.setScreenForeground(foreground);field.setScreenConnections(true);field.setTapControls({enabled:false});await field.prepareGPU();
 if(pageDisposed)return;
 if(startupAssets)for(const image of root.querySelectorAll('img'))if(startupAssets.takeImage(image))foreground.refreshPart(image.closest('.route-phone')||image);
 if(localRecovery){recoveryBlocked=false;const active=inputActive(),snapshot=await sharedSession.owner(active);if(!snapshot){recoveryBlocked=true;throw Error('SESSION_UNAVAILABLE');}if(inputActive()!==active&&!await sharedSession.owner(inputActive())){recoveryBlocked=true;throw Error('SESSION_UNAVAILABLE');}}
 fit();syncScene();field.start();field.setServicePaused(servicePaused||managedShell);loading.hidden=true;root.inert=false;document.documentElement.dataset.assetPreparation=startupAssets?'ready':'legacy';document.documentElement.dataset.gameReady='true';
 if(managedShell){document.documentElement.dataset.managedBinding='';managedNotice.hidden=true;applyManagedActivity();void refreshManagedBinding();}
}
boot().catch(e=>{if(pageDisposed)return;console.error(e);startupAssets?.dispose();document.documentElement.dataset.assetPreparation='failed';loading.textContent=startupErrorText(e);document.body.append(loading);Object.assign(loading.style,{position:'fixed',inset:'0',zIndex:'10000',padding:'32px',whiteSpace:'pre-line',fontSize:'clamp(16px,2vw,28px)',lineHeight:'1.5',background:'#10091e',overflow:'auto',transform:'none'});});
window.addEventListener('pagehide',()=>{pageDisposed=true;bindingGeneration++;clearTimeout(contextTimer);screenEpoch++;gameAudio?.dispose();missionContinuation?.cancel();cancelGesture();save();sharedSession?.close();independent?.dispose();field?.dispose();foreground?.dispose();assets?.dispose();startupAssets?.dispose();ambient?.dispose();v5Tools?.dispose();},{once:true});
