import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(source,'client/src/journey-guided-main.js');
let text=fs.readFileSync(path.join(source,'stand-base/src/journey-guided-main.js'),'utf8').replaceAll('\r\n','\n');
const replace=(from,to)=>{if(!text.includes(from))throw Error('Stand adapter anchor missing: '+from.slice(0,100));text=text.replace(from,to);};
text=`import {createTransitionLayout} from './kdw-transition-layout.mjs';
import {createPixelMapPlan,pixelMapEnabled,pixelIdleLayout,installPixelMapInput,installPixelMapDebug} from './kdw-pixel-map.mjs';
import {loadGameLink,linkedCatalog,resumeLinkedMission,watchGameLink} from './kdw-game-link.mjs';
import {KdwTaskJourney} from './kdw-task-journey.mjs';
import {mountKdwInteractions} from './kdw-interactions.mjs';
import {screenContinuationTarget} from './kdw-screen-continue.mjs';
import {mountPersonalChannel} from './kdw-personal-channel.mjs';
import {mountBusinessNative} from './kdw-business-native.mjs';
import {mountTaskSkip} from './kdw-task-skip.mjs';
import {mountPostActivity} from './kdw-posts.mjs';
import {CalmLinkMotion,CALM_LINK_STYLE} from './kdw-link-motion.mjs';
import {businessDeviceLinkRect} from './kdw-business-native-model.mjs';
import {BUSINESS_ORIGINAL} from './kdw-business-original.mjs';
import {prepareInteractionPreview} from './kdw-preview.mjs';
import {createMemoryPersistencePort} from './application/memory-persistence.mjs';
import {createStandBrowserHost,LocalStandAdmission,createBrowserScenePlan,browserDeviceCenter,BROWSER_ROUTE_GAP} from './kdw-stand-adapter.mjs';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';
`+text;
replace('onFrame:tick,','onFrame:tick,onLayout:createTransitionLayout({document,params}),');
replace("phone=bounds(host.querySelector('.route-phone .demo-app'))","phone=businessDeviceLinkRect(bounds(host.querySelector('.route-phone .demo-app')),{screenId:controller.displayedState?.screenId,original:BUSINESS_ORIGINAL,mediaRect:bounds(host.querySelector('.route-phone .task-media-image'))})");
replace('new V5RevealJourney(content,sharedSession,v5RouteMeasure)', "new (portable?KdwTaskJourney:V5RevealJourney)(content,sharedSession,v5RouteMeasure)");
replace("from './journey-v5-idle-menu.mjs'", "from './kdw-idle-menu.mjs'");
replace("from './journey-v5-audio.mjs'", "from './kdw-event-audio.mjs'");
replace('controller.snapshot.state.runId}`', '(controller.sceneRunId??controller.snapshot.state.runId)}`');
replace('const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;', 'const gameLink=await loadGameLink(params);let stopGameLink=()=>{};\nconst MISSION_CATALOG=linkedCatalog(bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG,gameLink);\nconst browserScenePlan=createBrowserScenePlan(MISSION_CATALOG,v5DeviceMetrics);');
replace("if((!managedShell&&(!managedAssignment||!params.get('session')))||params.get('backend')!=='server')throw Error('Managed MAX requires an explicit assignment and session');","if(params.get('backend')==='server'&&!managedShell&&(!managedAssignment||!params.get('session')))throw Error('Managed MAX requires an explicit assignment and session');");
replace('function managedSnapshot(snapshot){','function managedSnapshot(snapshot){if(params.get(\'backend\')!==\'server\'){managedNotice.hidden=true;return;}');
replace('let sharedSession,v5Tools,missionContinuation',"const interactionPreview=['channel','store','posts'].includes(params.get('interaction'))?params.get('interaction'):null;\nconst portable=params.get('backend')!=='server';\nconst kdwInteractions=mountKdwInteractions({getSession:()=>sharedSession,onMenu:()=>navigate()});\nconst personalChannel=mountPersonalChannel({getSession:()=>sharedSession});\nconst kdwPosts=mountPostActivity({getSession:()=>sharedSession});\nlet standBrowser;\nconst localAdmission=new LocalStandAdmission({active:()=>inputActive()});\nlet sharedSession,v5Tools,missionContinuation");
replace("const portable=params.get('backend')!=='server';", "const portable=params.get('backend')!=='server';\nconst standPresentation=portable&&bfmVisual&&params.get('debug')!=='1';");
replace('(!localRecovery||windowFocused);','(portable||!localRecovery||windowFocused);');
replace("palmVisible=['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);","palmVisible=!(portable&&bfmVisual&&!standPresentation)&&['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);");
replace('function tick(delta){',"function tick(delta){\n kdwInteractions.update(controller?.displaySnapshot,controller?.phase);\n personalChannel.update(controller?.displaySnapshot,controller?.phase);\n kdwPosts.update(controller?.displaySnapshot,controller?.phase);\n if(controller?.snapshot?.state)document.documentElement.dataset.kdwScreen=controller.snapshot.state.screenId??controller.snapshot.state.status;document.documentElement.dataset.kdwRun=controller?.snapshot?.state.runId??'';\n standBrowser?.update(controller?.snapshot);\n if(portable&&!standPresentation&&!navigating)void localAdmission.update(sharedSession)?.catch(error=>console.error('MAX local admission',error));");
replace('function phoneContentReady(){', 'function phoneContentReady(){\n if(kdwPosts.gpuActivity&&!kdwPosts.ready(controller?.displaySnapshot))return false;\n if(kdwInteractions.gpuActivity&&!kdwInteractions.ready(controller?.displaySnapshot))return false;\n if(!personalChannel.ready(controller?.displaySnapshot))return false;');
replace("old.dataset.closing='true';const epoch=screenEpoch;foreground?.cancelContent(host);",
 "old.dataset.closing='true';const epoch=screenEpoch;foreground?.cancelContent(host,{departing:portable});");
replace("if(bfmVisual&&(controller.handoff?.stage==='pack'||controller.startupLogo)){commit();}",
 "if(bfmVisual&&(controller.handoff?.stage==='pack'||controller.startupLogo)){if(portable){host.dataset.contentPresence='1';host.dataset.contentPhase='idle';}commit();}");
replace('shell.dataset.mediaReadyKey===key&&shell.dataset.gpuReadyKey===key}:undefined;', 'shell.dataset.mediaReadyKey===key&&shell.dataset.gpuReadyKey===key&&personalChannel.ready(controller.displaySnapshot)}:undefined;');
replace("if(!managedShell){const initialContext=await readManagedContext();","if(!managedShell&&!portable){const initialContext=await readManagedContext();");
replace("if(bfmVisual&&!service&&!automaticPresentation)v5Tools=createV5Tools", "if(portable)standBrowser=createStandBrowserHost({arena,params,onMenu:()=>{void Promise.all([kdwInteractions.flush(),personalChannel.flush()]).then(()=>navigate()).catch(error=>feedback(error.message));}});\n if(bfmVisual&&!service&&!automaticPresentation&&params.get('debug')==='1')v5Tools=createV5Tools");
replace('const persistence=bfmVisual?createIndexedDBPersistence',"const persistence=interactionPreview||params.get('test')==='memory'?createMemoryPersistencePort():bfmVisual?createIndexedDBPersistence");
replace("if(!controller||snapshot.assignment?.lifecycle.status!=='active')return;controller.accept(snapshot);", "if(!controller||!portable&&snapshot.assignment?.lifecycle.status!=='active')return;controller.accept(snapshot);");
replace("if(localRecovery)recoveryChoice=await showV5Recovery", "if(localRecovery&&!standPresentation&&!interactionPreview&&params.get('test')!=='memory')recoveryChoice=await showV5Recovery");
replace('await sharedSession.start();\n  if(pageDisposed)', "await sharedSession.start();\n  await resumeLinkedMission(sharedSession,gameLink);\n  if(!gameLink?.game&&standPresentation&&!interactionPreview&&sharedSession.snapshot.state.status!=='menu')await sharedSession.command('RETURN_MENU');\n  if(pageDisposed)");
replace("document.documentElement.dataset.sessionStorage=profile==='server'", "if(interactionPreview){loading.textContent='Подготавливаем активность MAX…';try{await prepareInteractionPreview(sharedSession,MISSION_CATALOG,interactionPreview,params.get('preview-business')??'cafe');}finally{preparingInteractionPreview=false;}}\n  document.documentElement.dataset.sessionStorage=profile==='server'");
replace('controller=createController(saved);','controller=createController(saved);\n if(interactionPreview&&controller.phase===\'paused\')controller.resume(controller.activeId);');
text=text.replaceAll('v5Tools?.fit(innerWidth,innerHeight);','v5Tools?.fit(innerWidth,innerHeight);standBrowser?.fit(innerWidth,innerHeight);');

replace('function sceneSize(){',"function sceneSize(){\n if(portable&&params.get('view')!=='wall')return browserScenePlan(innerWidth,innerHeight);");
replace('visible:!!instruction&&!instruction.hidden','visible:portable&&params.get(\'view\')!==\'wall\'||!!instruction&&!instruction.hidden');
replace('host.style.cssText=referenceVisual?',"host.style.cssText=portable&&params.get('view')!=='wall'?`left:32px;top:128px;width:${size.width-64}px;height:${size.height-192}px`:referenceVisual?");
replace('createV5RouteMeasure(arena):null','createV5RouteMeasure(arena,{gap:params.get(\'backend\')!==\'server\'&&params.get(\'view\')!==\'wall\'?BROWSER_ROUTE_GAP:REVEAL_ELEMENT_GAP}):null');
replace('const deviceCenter=()=>referenceVisual?',"const deviceCenter=()=>pixelPlan?host.clientWidth/2:portable&&params.get('view')!=='wall'?browserDeviceCenter(host.clientWidth,deviceMetrics().width):referenceVisual?");
replace('controller.nodeWidth??240,REVEAL_ELEMENT_GAP);setStyleValue(timer',"controller.nodeWidth??240,portable&&params.get('view')!=='wall'?BROWSER_ROUTE_GAP:REVEAL_ELEMENT_GAP);setStyleValue(timer");
replace('function render(preserveTransition=false){',"function render(preserveTransition=false){\n if(portable&&params.get('view')!=='wall'){const geometry=sceneSize();if(geometry.width!==size.width||geometry.height!==size.height){fit();return;}}");
replace(' if(!controller)return;\n if(referenceVisual)', " if(!controller)return;\n if(standPresentation&&controller.snapshot?.state.status==='menu'){renderLocalStandby();return;}\n if(referenceVisual)");
replace('async function selectIdleMission(missionId){', `function renderLocalStandby(){
 if(idleMenu)return;
 if(!foreground){host.replaceChildren();return;}
 clearManagedScene();view='';host.dataset.screen='standby';
 idleContext={scope:'kdw-local-standby'};document.documentElement.dataset.idleMenuScope=idleContext.scope;
 idleMenu=createIdleMenu({host,foreground,catalog:MISSION_CATALOG,assetCatalog:independentAssetCatalog,reduced,changed,onSelect:selectIdleMission,onError:error=>console.error('MAX standby media',error)});
 fit();syncScene();
}
async function selectIdleMission(missionId){
 if(standPresentation){
  if(!idleMenu||idleSelecting||!inputActive())return;
  const menu=idleMenu;idleSelecting=true;navigating=true;
  try{
   await menu.exit();if(idleMenu!==menu)return;
   const reply=await sharedSession.command('SELECT_MISSION',{missionId,fresh:true});
   if(!reply?.reply.ok)throw Error('MAX_LOCAL_IDLE_SELECTION_REJECTED');
   if(controller.phase==='paused')controller.resume(controller.activeId);
   await disposeIdleMenu();clearManagedScene();view='';navigating=false;fit();render();syncScene();
  }catch(error){console.error('MAX standby selection',error);if(idleMenu===menu)menu.restore();}
  finally{navigating=false;idleSelecting=false;}
  return;
 }`);
replace('if(idleMenu){idleMenu.tick(delta,presentationActive());return;}', 'if(idleMenu){ambient?.tick?.(delta,{active:presentationActive(),reduced:reduced.matches});idleMenu.tick(delta,presentationActive());return;}');
replace('gradients:v5Tools?.gradients,','gradients:standBrowser?.gradients??v5Tools?.gradients,');
replace('\n}\nfunction updateScanWaitDisplays', '\n kdwInteractions.align();personalChannel.align();kdwPosts.align();\n}\nfunction updateScanWaitDisplays');
replace('function updateTargets(){',"function updateTargets(){\n host.dataset.synchronizedRoute=String(portable&&params.get('view')!=='wall'&&controller?.spread&&!gesture);");
// Geometry can settle before the fan's .65s trace ends (notably preview/resume).
// Keep the entry phase until that trace is complete rather than snapping reveal to 1.
replace('settled:referenceVisual?referenceReady:camera.at(focusTarget,.1,.5)&&settled',
 "settled:referenceVisual?referenceReady:camera.at(focusTarget,.1,.5)&&settled&&(!calmLinks||reduced.matches||controller.startup||controller.handoff||controller.phase!=='phone-enter'||controller.elapsed>=V5_MOTION.fanSeconds)");
replace('const v5LinkPaint=Object.freeze({',"const calmLinks=params.get('backend')!=='server'&&params.get('view')!=='wall'?new CalmLinkMotion():null;\nconst v5LinkPaint=Object.freeze({...(calmLinks?CALM_LINK_STYLE:{}),");
replace('const deviceLinkStyle=bfmVisual?', 'const deviceLinkStyle=calmLinks?routeLinkStyle:bfmVisual?');
replace('function syncScene(){',"function syncScene(){\n if(idleMenu||independent)calmLinks?.update([],1,performance.now()/1000);");
replace('field.update({placements,network,endpoints:{},selectedItem:null});',"calmLinks?.update(network.links,scale,performance.now()/1000,reduced.matches);\n field.update({placements,network,endpoints:{},selectedItem:null});");
replace('calmLinks?.update(network.links,scale,performance.now()/1000,reduced.matches);',`calmLinks?.update(network.links,scale,performance.now()/1000,reduced.matches);
 if(params.get('test')==='link-motion'){const frames=window.__kdwLinkFrames??=[];frames.push({time:performance.now(),phase:controller.phase,elapsed:controller.elapsed,startup:controller.startup?.stage,handoff:controller.handoff?.stage,links:network.links.map(({a,b,lane,reveal,visibility})=>({a,b,lane,reveal,visibility}))});if(frames.length>1200)frames.shift();}`);
// The supplied QR contains its own destination; do not label it with legacy URL metadata.
replace('alt="QR-код MAX с логотипом: ${esc(qr.url)}"','alt="QR-код MAX"');
// On the stand the common background belongs to the outer GPU host. The portable
// host supplies its existing local MAX grid layer behind the transparent game.
replace('ambient=bfmVisual?commonMapBackground','ambient=bfmVisual?lumiReferenceBackground');
replace('window.addEventListener(\'pagehide\',()=>{',"window.addEventListener('pagehide',()=>{localAdmission.dispose();standBrowser?.dispose();kdwInteractions.dispose();personalChannel.dispose();kdwPosts.dispose();");
// Local development controls use the same authority and native route targets.
replace("const standPresentation=portable&&bfmVisual&&params.get('debug')!=='1';", "const standPresentation=portable&&bfmVisual&&params.get('debug')!=='1';\nconst localDevelopment=portable&&params.get('dev')!=='0'&&(params.get('dev')==='1'||['127.0.0.1','localhost','[::1]'].includes(location.hostname));\nif(localDevelopment)document.documentElement.dataset.kdwDevelopment='true';");
replace('({catalog:MISSION_CATALOG,persistence});','({catalog:MISSION_CATALOG,persistence,development:localDevelopment});');
replace("(bfmVisual?'webgl-v5':'site-shared')", "(bfmVisual?(localDevelopment?'webgl-v5-development':'webgl-v5'):'site-shared')");
replace('await sharedSession.start();', "await sharedSession.start();\n  if(localDevelopment&&sharedSession.snapshot.state.devTimerEnabled===undefined)await sharedSession.command('DEV_TIMER',{active:false});");
text=text.replaceAll('revealTimerLabel(controller.secondsLeft)', "(localDevelopment&&controller.snapshot?.state.devTimerEnabled!==true?'--:--':revealTimerLabel(controller.secondsLeft))");
replace('<div class="v5-device-timer" data-mission-timer', '<button type="button" class="v5-device-timer" data-mission-timer');
replace('role="timer" aria-live="off" aria-label="Оставшееся время миссии"', 'aria-live="off" aria-label="Завершить миссию"');
replace('data-menu data-mission-timer aria-label="Вернуться к миссиям"', 'data-mission-timer aria-label="Завершить миссию"');
replace("revealTimerLabel(controller.secondsLeft))}</div>`:''}", "revealTimerLabel(controller.secondsLeft))}</button>`:''}");
replace(" if(!b.classList.contains('media-hotspot'))", " if(b.hasAttribute('data-mission-timer')){const s=sharedSession?.snapshot?.state;if(!navigating&&!answerPending&&!sharedSession?.busy&&s?.missionId&&['task','result'].includes(s.status)){cancelGesture();personalChannel.dismissKeyboard();void sharedSession.command('FINISH_MISSION',{missionId:s.missionId});}return;}\n if(!b.classList.contains('media-hotspot'))");
replace(' if(b.dataset.object){', ` if(b.dataset.object){
  if(localDevelopment&&b.dataset.object!=='open-max'){
   void changeLocalTask('RESTART_TASK',b.dataset.object);return;
  }`);
replace('function tick(delta){', `async function changeLocalTask(type,taskId){
 if(!localDevelopment||!inputActive()||sharedSession.busy||navigating||foreground?.busy(host,true)||foreground?.contentBusy(host)||controller.handoff||controller.startup||!['task','result'].includes(controller.phase))return;
 navigating=true;taskSkip.suspend();personalChannel.dismissKeyboard();cancelGesture();
 try{
  await kdwInteractions.flush();await personalChannel.flush();
  if(!controller.prepareTaskChange(type,taskId))return;
  const result=await sharedSession.command(type,{taskId});
  if(!result?.reply.ok){controller.cancelTaskChange();feedback('Не удалось переключить задание');return;}
  screenEpoch++;answerPending=false;pendingResume=null;phonePending='';foreground?.cancelContent(host);
  popupPage=0;focusCurrent();render();
 }catch(error){controller.cancelTaskChange();feedback('Не удалось сохранить переход. Попробуйте ещё раз.');}
 finally{navigating=false;}
}
const taskSkip=mountTaskSkip({host,onSkip:taskId=>changeLocalTask('SKIP_TASK',taskId)});
function tick(delta){
 const skipState=controller?.snapshot?.state,skipShown=controller?.displayedState;
 taskSkip.update(skipState,localDevelopment&&inputActive()&&!navigating&&!sharedSession?.busy&&!controller?.startup&&!controller?.handoff&&controller?.phase==='task'&&!foreground?.busy(host,true)&&!foreground?.contentBusy(host)&&skipState?.runId===skipShown?.runId&&skipState?.taskId===skipShown?.taskId&&skipState?.screenId===skipShown?.screenId);`);
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{taskSkip.dispose();");
// An isolated preview builds its command history before the renderer is ready.
// Focus callbacks cannot revoke that temporary owner: recoveryBlocked prevents
// focus from restoring it until boot completes, creating a circular wait.
replace("const portable=params.get('backend')!=='server';", "let preparingInteractionPreview=!!interactionPreview;\nconst portable=params.get('backend')!=='server';");
replace("cancelGesture();sharedSession?.owner(false);});window.addEventListener('focus'", "cancelGesture();if(!preparingInteractionPreview)sharedSession?.owner(portable&&inputActive());});window.addEventListener('focus'");
replace("windowFocused=true;if(inputActive())sharedSession?.owner(true);", "windowFocused=true;if(!preparingInteractionPreview&&inputActive())sharedSession?.owner(true);");
replace("independent?.setActive(presentationActive());sharedSession?.owner(inputActive());", "independent?.setActive(presentationActive());if(!preparingInteractionPreview)sharedSession?.owner(inputActive());");
// A whole-mission restart commits its new presentation only after the old scene
// has faded out. Persist outgoing drafts first; failed commands leave it intact.
replace('void controller.restart().then(result=>{', "controller.prepareMissionRestart?.();personalChannel.dismissKeyboard();taskSkip.suspend();\n  void Promise.all([kdwInteractions.flush(),personalChannel.flush()]).then(()=>controller.restart()).then(result=>{");
replace("if(!result?.reply.ok){navigating=false;render();feedback('Не удалось перезапустить миссию.", "if(!result?.reply.ok){controller.cancelMissionRestart?.();navigating=false;render();feedback('Не удалось перезапустить миссию.");
replace('const confirmed=()=>{if(epoch!==screenEpoch)return;resetPrompt=false;', 'const confirmed=()=>{if(epoch!==screenEpoch)return;controller.commitMissionRestart?.();resetPrompt=false;');
replace('if(foreground)foreground.transition(host,confirmed,{interrupt:true});else confirmed();\n  });', "if(foreground)foreground.transition(host,confirmed,{interrupt:true});else confirmed();\n  }).catch(error=>{if(epoch!==screenEpoch)return;controller.cancelMissionRestart?.();navigating=false;feedback('Не удалось сохранить перезапуск. Попробуйте ещё раз.');});");
// Portable mission restart is available from the first route icon and QR finale.
// Keep the server-managed finale's admission/assignment contract unchanged.
replace("!host.querySelector('.v5-mission-qr')&&presentationActive()", "(portable||!host.querySelector('.v5-mission-qr'))&&presentationActive()");
replace("host.dataset.finalGamePresence=String(finalGamePresence.value);host.inert=true;", "host.dataset.finalGamePresence=String(finalGamePresence.value);host.inert=!portable;");
replace("<p class=\"v5-qr-caption\">${V5_QR_CAPTION}</p></section>","<p class=\"v5-qr-caption\">${V5_QR_CAPTION}</p>${portable?'<button class=\"pill v5-qr-restart\" data-restart-mission>Запустить заново</button>':''}</section>");
replace(" if(bfmVisual&&!touchEligible(root,b))return;", " if(bfmVisual&&!touchEligible(root,b))return;\n if(portable&&host.querySelector('.v5-mission-qr')&&!b.hasAttribute('data-restart-mission'))return;");
replace(' if(b.dataset.object){', " if(b.dataset.object){\n  if(portable&&b.dataset.object==='open-max'){if(!sharedSession.busy)navigate(controller.session.mission,true);return;}");

// Route a device-surface tap through the same action and contact latch as the
// existing footer button. A held contact cannot advance successive screens.
replace(' const b=touchPick(root,e.target,e.clientX,e.clientY,touchScale());',
 ` const screenTap=portable&&sharedBackend?screenContinuationTarget(root,e.target,e.clientX,e.clientY,controller?.snapshot?.state?.screenId):null;
 const b=screenTap?.button??touchPick(root,e.target,e.clientX,e.clientY,touchScale());`);
replace(' const prior=tapHand.rect,insidePrior=prior&&touchContains(prior,e.clientX,e.clientY,0);',
 ` const prior=tapHand.rect,insidePrior=prior&&touchContains(prior,e.clientX,e.clientY,0);
 if(screenTap&&insidePrior)return;`);
replace(" const tile=b.querySelector('.tile'),rect=(tile||b).getBoundingClientRect();",
 " const tile=b.querySelector('.tile'),rect=screenTap?.rect??(tile||b).getBoundingClientRect();");

text=text.replace('const personalChannel=mountPersonalChannel({getSession:()=>sharedSession});','const personalChannel=mountPersonalChannel({getSession:()=>sharedSession});\nconst businessNative=mountBusinessNative({getSession:()=>sharedSession});');
text=text.replace('personalChannel.update(controller?.displaySnapshot,controller?.phase);','personalChannel.update(controller?.displaySnapshot,controller?.phase);\n businessNative.update(controller?.displaySnapshot,controller?.phase);');
text=text.replace('if(!personalChannel.ready(controller?.displaySnapshot))return false;','if(!personalChannel.ready(controller?.displaySnapshot)||!businessNative.ready(controller?.displaySnapshot))return false;');
text=text.replace('&&personalChannel.ready(controller.displaySnapshot)}:undefined;','&&personalChannel.ready(controller.displaySnapshot)&&businessNative.ready(controller.displaySnapshot)}:undefined;');
text=text.replace('personalChannel.align();','personalChannel.align();businessNative.align();');
text=text.replace('personalChannel.dispose();','personalChannel.dispose();businessNative.dispose();');
replace("document.documentElement.dataset.gameReady='true';", "document.documentElement.dataset.gameReady='true';\n stopGameLink=watchGameLink({link:gameLink,getSession:()=>sharedSession,onPhotoChange:()=>foreground?.invalidate()});");
replace('if(portable&&!standPresentation&&!navigating)', 'if(portable&&(gameLink?.game||!standPresentation)&&!navigating)');
replace('function navigate(id,restart=false){', 'function navigate(id,restart=false){\n if(gameLink?.game&&id&&!restart)return;');
replace('async function selectIdleMission(missionId){', 'async function selectIdleMission(missionId){\n if(gameLink?.game)return;');
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{stopGameLink();");
replace('const browserScenePlan=createBrowserScenePlan(MISSION_CATALOG,v5DeviceMetrics);',`const browserScenePlan=createBrowserScenePlan(MISSION_CATALOG,v5DeviceMetrics);
const pixelPlan=pixelMapEnabled(params)&&params.get('backend')!=='server'?createPixelMapPlan(MISSION_CATALOG,v5DeviceMetrics):null;
const clearPixelInput=pixelPlan?installPixelMapInput():()=>{};
const clearPixelDebug=pixelPlan&&params.get('pixel-map-debug')==='1'?installPixelMapDebug():()=>{};`);
replace('const target=v5InstructionShift({','const target=pixelPlan?0:v5InstructionShift({');
replace('function sceneSize(){', 'function sceneSize(){\n if(pixelPlan)return pixelPlan;');
replace('host.style.cssText=portable', "host.style.cssText=pixelPlan?`left:${pixelPlan.zone.left}px;top:${pixelPlan.zone.top}px;width:${pixelPlan.zone.w}px;height:${pixelPlan.zone.h}px`:portable");
replace('createStandBrowserHost({arena,params,onMenu:', 'createStandBrowserHost({arena,params,pixelPlan,onMenu:');
text=text.replaceAll('createIdleMenu({host,foreground,catalog:MISSION_CATALOG,','createIdleMenu({host,foreground,catalog:MISSION_CATALOG,layout:pixelPlan?pixelIdleLayout(pixelPlan.zone):undefined,hostRect:pixelPlan?.zone,');
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{clearPixelInput();clearPixelDebug();");
// Production host policy is supplied by the local server, never by a query flag.
text="import {readStandSettings,productionCatalog,startProduction,selectManualMission} from './kdw-production.mjs';\n"+text;
replace("const params=new URLSearchParams(location.search),service=params.get('service')==='1';", "const params=new URLSearchParams(location.search);const standSettings=await readStandSettings(params),productionMode=!!standSettings;const service=params.get('service')==='1';let stopProduction=()=>{};");
replace('const MISSION_CATALOG=linkedCatalog(bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG,gameLink);','const productionPolicy=gameLink?.game?.standPolicy??standSettings;const MISSION_CATALOG=productionCatalog(linkedCatalog(bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG,gameLink),productionPolicy);');
replace("const localDevelopment=portable&&", "const localDevelopment=!productionMode&&portable&&");
replace('if(portable&&(gameLink?.game||!standPresentation)&&!navigating)', 'if(!productionMode&&portable&&(gameLink?.game||!standPresentation)&&!navigating)');
replace('createStandBrowserHost({arena,params,pixelPlan,onMenu:', 'createStandBrowserHost({arena,params,pixelPlan,production:productionMode,onMenu:');
replace("const palmCopy=bfmVisual?'Открой возможности'", "const palmCopy=bfmVisual?(productionMode?'Приложи ладонь, чтобы начать':'Открой возможности')");
replace("const wait=scanWaitClock.view(controller?.snapshot,performance.now()),scan=", "const state=controller?.snapshot?.state;const wait=productionMode?{visible:state?.status==='scan',remainingMs:state?.deadlineAt?Math.max(0,state.deadlineAt-Date.now()):productionPolicy.value.max.timings.palmWaitSeconds*1000,queueCount:null}:scanWaitClock.view(controller?.snapshot,performance.now()),scan=");
replace("const labels=[revealTimerLabel(wait.remainingMs/1000)", "if(productionMode)queue.hidden=true;const labels=[revealTimerLabel(wait.remainingMs/1000)");
replace("if(portable&&b.dataset.object==='open-max')", "if(portable&&!productionMode&&b.dataset.object==='open-max')");
replace("if(b.hasAttribute('data-restart-mission'))", "if(productionMode&&['data-menu','data-restart-mission','data-reset-progress','data-confirm-reset-progress'].some(a=>b.hasAttribute(a)))return;\n if(b.hasAttribute('data-restart-mission'))");
replace("if(e.key==='Escape'){if(resetPrompt)", "if(!productionMode&&e.key==='Escape'){if(resetPrompt)");
replace("${portable?'<button class=\"pill v5-qr-restart\"", "${portable&&!productionMode?'<button class=\"pill v5-qr-restart\"");
replace("if(bfmVisual)root.insertAdjacentHTML('beforeend','<div class=\"v5-brand\"", "if(bfmVisual&&!productionMode)root.insertAdjacentHTML('beforeend','<div class=\"v5-brand\"");
replace('if(referenceVisual){root.insertAdjacentHTML(', 'if(referenceVisual&&!productionMode){root.insertAdjacentHTML(');
replace("if(!gameLink?.game&&standPresentation", "if(!productionMode&&!gameLink?.game&&standPresentation");
replace("const menu=idleMenu;idleSelecting=true;navigating=true;", "if(productionMode){if(!['manual','combined'].includes(standSettings.value.max.entryMode))return;idleSelecting=true;document.documentElement.dataset.idleSelection='submitting';delete document.documentElement.dataset.idleSelectionError;try{await selectManualMission(missionId);}catch(error){idleSelecting=false;idleMenu?.restore();document.documentElement.dataset.idleSelection='error';document.documentElement.dataset.idleSelectionError=String(error.message).slice(0,160);console.error('MAX manual mission selection',error);feedback('Не удалось открыть миссию. Нажмите ещё раз.');}return;}\n  const menu=idleMenu;idleSelecting=true;navigating=true;");
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{stopProduction();");
// A readiness acknowledgement starts each budget after the corresponding pixels can be used.
replace("if(!managedShell)configureController(saved);", "if(!managedShell)configureController(saved);if(productionMode)stopProduction=startProduction({getSession:()=>sharedSession,active:()=>presentationActive(),ready:s=>{if(s.status==='scan')return ['palm','holding'].includes(controller?.phase)&&palmPresence.value>.95;if(s.status==='task')return controller?.phase==='task'&&controller.displayedState?.screenId===s.screenId&&phoneContentReady()&&phonePresence.value>.97;if(['completed','incomplete'].includes(s.status)){const image=host.querySelector('.v5-mission-qr img');return image?.complete&&image.naturalWidth>0&&foreground?.qrReady(image.closest('.v5-mission-qr'))===true&&Number(host.dataset.finalGamePresence??1)<.005;}return false;}});");

// Typography is a presentation adapter; keep the authored stand modules intact.
text=text.replace("from './journey-v5-ui-copy.mjs';","from './kdw-ui-copy.mjs';").replace("from './journey-shared-ui.mjs';","from './kdw-shared-ui.mjs';");
// Fixed production palm caption; accessibility copy stays a normal sentence.
text=text.replace('const palmCopy=', "const palmLabelCopy=productionMode?'Приложи ладонь,\\nчтобы начать':null;\nconst palmCopy=")
 .replaceAll('${palmCopy}<small>','${palmLabelCopy??palmCopy}<small>')
 .replace('label=bfmVisual?palmCopy:','label=bfmVisual?(palmLabelCopy??palmCopy):')
 .replace('${bfmVisual?palmCopy:','${bfmVisual?(palmLabelCopy??palmCopy):');
// All accepted contact sources must emit the original scan jets, not just autoplay.
replace('function tapAt(e){', `function beginPalmContact(id){
 const scan=host.querySelector('[data-palm]');if(!scan||!controller.down(id))return false;
 render();foreground?.startPalmScan(host,scan.querySelector('.tile'));return true;
}
function tapAt(e){`);
replace("if(active&&controller.phase==='palm'&&palmPresence.value>.97&&!sharedSession.busy&&!foreground?.busy(host,true)){const scan=host.querySelector('[data-palm]');if(scan&&controller.down('autoplay')){render();foreground?.startPalmScan(host,scan.querySelector('.tile'));}}", "if(active&&controller.phase==='palm'&&palmPresence.value>.97&&!sharedSession.busy&&!foreground?.busy(host,true))beginPalmContact('autoplay');");
replace('if(controller.down(e.pointerId))latch();','if(beginPalmContact(e.pointerId))latch();');
replace("if(!e.repeat&&controller.down('keyboard')){render();}","if(!e.repeat)beginPalmContact('keyboard');");
// Keep both axes and the native overlays on the renderer's one morph clock.
replace('from:deviceMetrics().width,to:target.width,', 'from:deviceMetrics().width,to:target.width,fromHeight:deviceMetrics().height,toHeight:target.height,');
replace('resize:width=>{if(epoch!==screenEpoch||!shell.isConnected)return;controller.presentedDevice={...target,width};updateTargets();}', 'resize:(width,height)=>{if(epoch!==screenEpoch||!shell.isConnected)return;controller.presentedDevice={...target,width,height};updateTargets();}');
replace('onMotion:()=>{changed();syncScene();}', 'onMotion:()=>{kdwInteractions.align();personalChannel.align();businessNative.align();kdwPosts.align();changed();syncScene();}');
// Confirmation has no device links; fade the previous anchor instead of
// re-targeting a visible fan to the short registration snack.
replace("import {businessDeviceLinkRect} from './kdw-business-native-model.mjs';", "import {RegistrationLinks} from './kdw-registration-links.mjs';");
replace('function syncScene(){', 'const registrationLinks=new RegistrationLinks();\nfunction syncScene(){');
replace("phone=businessDeviceLinkRect(bounds(host.querySelector('.route-phone .demo-app')),{screenId:controller.displayedState?.screenId,original:BUSINESS_ORIGINAL,mediaRect:bounds(host.querySelector('.route-phone .task-media-image'))})", "linkPose=registrationLinks.update(bounds(host.querySelector('.route-phone .demo-app')),{screenId:controller.displayedState?.screenId,runKey:`${controller.snapshot?.state.sessionId}:${controller.snapshot?.state.runId}`,time:performance.now()/1000,reduced:reduced.matches,original:BUSINESS_ORIGINAL}),phone=linkPose.rect");
replace('visibility:phonePresence.value*(bfmVisual', 'visibility:linkPose.opacity*phonePresence.value*(bfmVisual');
replace('handoff:controller.handoff?.stage,links:network.links.map', 'handoff:controller.handoff?.stage,screenId:controller.displayedState?.screenId,phoneRect:rects.get(199998),links:network.links.map');
// Local host lifecycle hooks remain in modules, outside the frozen stand scene.
text="import {gameAudioActive,showRuntimeRecovery,monitorPreparation} from './kdw-runtime-health.mjs';\n"+text;
replace('resumeLinkedMission,watchGameLink}', 'resumeLinkedMission,watchGameLink,claimLinkedMission}');
replace('({catalog:MISSION_CATALOG,persistence,development:localDevelopment})', '({catalog:MISSION_CATALOG,persistence,development:localDevelopment,admit:()=>claimLinkedMission(gameLink)})');
replace("if(bfmVisual&&(globalThis.STAND_AUDIO_MODE==='master'||document.documentElement.dataset.managedAudio==='true'))gameAudio=mountV5Audio();", "if(bfmVisual&&(portable||globalThis.STAND_AUDIO_MODE==='master'||document.documentElement.dataset.managedAudio==='true')){if(portable)document.documentElement.dataset.localAudio='true';gameAudio=mountV5Audio();}");
replace("if(!gameAudio||!controller)return;", "if(!gameAudio)return;if(idleMenu||!controller){gameAudio.sync({musicScene:'standby',run:'menu',active:false,musicAvailable:presentationActive()&&(!localRecovery||windowFocused)});return;}");
replace("if(idleMenu){ambient?.tick?.", "if(idleMenu)syncGameAudio();if(idleMenu){ambient?.tick?.");
replace("gameAudio.sync({run:", "gameAudio.sync({musicScene:controller.session.screen==='field'?'mission':'standby',musicAvailable:presentationActive()&&(!localRecovery||windowFocused),run:");
replace("active:sharedSession?.connected===true&&sharedSession?.snapshot?.assignment?.lifecycle.status==='active'&&presentationActive()&&(!localRecovery||windowFocused)", "active:gameAudioActive({connected:sharedSession?.connected===true,assignment:sharedSession?.snapshot?.assignment,local:portable,presented:visible&&presentationActive()&&(!localRecovery||windowFocused)})");
replace("boot().catch(e=>{if(pageDisposed)return;", "boot().catch(e=>{if(pageDisposed)return;showRuntimeRecovery();");
replace('async function boot(){', "const stopBootHealth=monitorPreparation(()=>document.documentElement.dataset.gameReady==='true'?{status:'menu'}:null);\nwindow.addEventListener('pagehide',stopBootHealth,{once:true});\nwindow.render_game_to_text=()=>JSON.stringify({coordinates:'viewport pixels, origin top-left, x right, y down',input:{active:inputActive(),contactHeld:!!tapHand,foregroundBusy:!!foreground?.busy(host),starting:!!controller?.startup,sessionBusy:sharedSession?.busy,answerPending,navigating,startup:controller?.startup?.stage,answersCurrent:[...host.querySelectorAll('[data-answer]')].every(b=>b.dataset.answerToken===controller?.token?.())},phase:controller?.phase??'loading',status:sharedSession?.snapshot?.state.status??'loading',mission:sharedSession?.snapshot?.state.missionId,screen:sharedSession?.snapshot?.state.screenId,ready:sharedSession?.snapshot?.state.standReady,remainingMs:sharedSession?.snapshot?.view.remainingMs,connected:sharedSession?.connected??false,presentation:{startup:controller?.startup?.stage,pathsDone:controller?.paths?.done,pathTime:[controller?.paths?.elapsed,controller?.paths?.duration],gesture:gesture?.kind,geometry:controller?.geometry,deviceReady:phoneContentReady(),presence:phonePresence.value,position:[phoneX.value,phoneY.value],target:controller?.phone,settled:controller?.settlingNodes?.map(n=>[n.step,foreground?.isSettled(host,n.step)]),camera:[camera.value,focusTarget],busy:foreground?.contentBusy(host),phoneData:host.querySelector('.route-phone')?.dataset}});\nasync function boot(){");
// Production OSR remains one game owner. Visibility comes from the desktop
// output gate, not focus of its hidden offscreen window.
text="import {standOutput,outputHidden,remoteBackground} from './kdw-stand-output.mjs';\n"+text;
text=text.replace('const inputActive=()=>', 'const inputActive=()=>(!standOutput||standOutput.active())&&');
text=text.replaceAll('document.hidden','outputHidden()').replaceAll('document.hasFocus()','(standOutput?true:document.hasFocus())');
// The standby picture must be visible before ARM. Input admission and all
// mission clocks retain the original presentationActive/outputHidden gates.
replace('idleMenu.tick(delta,presentationActive());', 'idleMenu.tick(delta,standOutput?!servicePaused:presentationActive());');
replace('ambient=bfmVisual?lumiReferenceBackground', 'ambient=standOutput?remoteBackground(document.querySelector(\'#ambient\')):bfmVisual?lumiReferenceBackground');
replace("window.addEventListener('blur',()=>{windowFocused=false;", "window.addEventListener('blur',()=>{if(standOutput)return;windowFocused=false;");
replace("window.addEventListener('max-service-pointer-cancel',cancelGesture);", "window.addEventListener('max-service-pointer-cancel',cancelGesture);\nwindow.addEventListener('kdw-output-state',()=>{cancelGesture();windowFocused=standOutput?.active()===true;if(!preparingInteractionPreview)sharedSession?.owner(inputActive());});");
replace('ready:s=>{if(s.status', 'ready:s=>{if(!presentationActive())return false;if(s.status');
replace("root.addEventListener('pointerup',e=>{\n if(tapHand?.id!==e.pointerId)return;\n if(controller?.contact===e.pointerId)controller.up(e.pointerId,true);\n tapHand=null;\n});", "function finishPointerContact(e){\n if(tapHand?.id!==e.pointerId)return;\n if(controller?.contact===e.pointerId)controller.up(e.pointerId,true);\n tapHand=null;\n}\nroot.addEventListener('pointerup',finishPointerContact);\nwindow.addEventListener('pointerup',finishPointerContact,{capture:true});\nwindow.addEventListener('pointercancel',e=>{if(tapHand?.id===e.pointerId)cancelGesture();},{capture:true});");
text=text.replace("import {createTransitionLayout} from './kdw-transition-layout.mjs';","import {createCompositionLayout} from './kdw-composition-layout.mjs';");
replace('foreground=createJourneyWebGLUI({', 'const compositionLayout=createCompositionLayout({document,params,arena,getSize:()=>size,getHost:()=>host,getPresentation:()=>{\n  if(!controller)return null;const shown=controller.displayedState,p=controller.current?controller.phone:null,icons={};\n  if(controller.current&&controller.rowPose)for(const node of controller.nodes){const end=controller.rowPose(node),now=controller.pose(node);icons[node.step]={x:end.worldX-now.worldX,y:end.worldY-now.worldY};}\n  const metrics=deviceMetrics();return{screen:shown?.screenId??shown?.status,kind:metrics.kind,device:p?{x:p.x-phoneX.value,y:p.y-phoneY.value}:null,deviceRect:p?{x:p.x-layoutCamera()-metrics.width/2,y:host.clientHeight/2+p.y-metrics.height/2,width:metrics.width,height:metrics.height}:null,icons};\n }});await compositionLayout.ready;\n foreground=createJourneyWebGLUI({');
replace('onLayout:createTransitionLayout({document,params})','onLayout:compositionLayout');
replace('pixelPlan,production:productionMode,onMenu:', "pixelPlan,production:productionMode||document.documentElement.dataset.layoutPreview==='true',onMenu:");
replace('  await resumeLinkedMission(sharedSession,gameLink);',`  if(document.documentElement.dataset.layoutPreview==='true'){
   const mission=params.get('layout-scene');
   if(MISSION_CATALOG.missions[mission]){
    await sharedSession.owner(true);await sharedSession.command('SELECT_MISSION',{missionId:mission,fresh:true});
    await sharedSession.contact('layout-preview','down',true);await new Promise(r=>setTimeout(r,850));await sharedSession.contact('layout-preview','up',true);
   }
  }
  await resumeLinkedMission(sharedSession,gameLink);`);
replace("if(interactionPreview&&controller.phase==='paused')", "if((interactionPreview||document.documentElement.dataset.layoutPreview==='true')&&controller.phase==='paused')");
replace("if(!productionMode&&!gameLink?.game&&standPresentation&&!interactionPreview&&", "if(document.documentElement.dataset.layoutPreview!=='true'&&!productionMode&&!gameLink?.game&&standPresentation&&!interactionPreview&&");
replace("if(bfmVisual&&(portable||globalThis.STAND_AUDIO_MODE", "if(document.documentElement.dataset.layoutPreview!=='true'&&bfmVisual&&(portable||globalThis.STAND_AUDIO_MODE");
text="import {contactRadius} from './kdw-contact-area.mjs';\n"+text;
replace("controller?.snapshot?.state?.screenId):null;", "controller?.snapshot?.state?.screenId,contactRadius(e)):null;");
replace("touchPick(root,e.target,e.clientX,e.clientY,touchScale());", "touchPick(root,e.target,e.clientX,e.clientY,touchScale(),contactRadius(e));");
replace("touchContains(prior,e.clientX,e.clientY,0);", "touchContains(prior,e.clientX,e.clientY,0,contactRadius(e));");
replace("touchContains(rect,e.clientX,e.clientY,touchScale())", "touchContains(rect,e.clientX,e.clientY,touchScale(),contactRadius(e))");
text="import {installNativeTouch} from './kdw-native-touch.mjs';\n"+text;
replace('const localAdmission=new LocalStandAdmission({active:()=>inputActive()});', 'const localAdmission=new LocalStandAdmission({active:()=>inputActive()});\nconst stopNativeTouch=installNativeTouch({document,active:()=>inputActive()});');
replace("window.addEventListener('pagehide',()=>{stopProduction();", "window.addEventListener('pagehide',()=>{stopNativeTouch();stopProduction();");
// Native activities consume the final device pose exactly once per rendered frame.
replace('mountKdwInteractions({getSession:()=>sharedSession,onMenu:', 'mountKdwInteractions({getSession:()=>sharedSession,deferAlignment:true,onMenu:');
replace('mountPersonalChannel({getSession:()=>sharedSession})', 'mountPersonalChannel({getSession:()=>sharedSession,deferAlignment:true})');
replace('mountBusinessNative({getSession:()=>sharedSession})', 'mountBusinessNative({getSession:()=>sharedSession,deferAlignment:true})');
replace('onMotion:()=>{kdwInteractions.align();personalChannel.align();businessNative.align();kdwPosts.align();changed();syncScene();}', 'onActivityFrame:()=>{kdwInteractions.align();personalChannel.align();businessNative.align();kdwPosts.align();},onMotion:()=>{changed();syncScene();}');
// Visitor surfaces never expose preparation counters or technical failure panels.
text="import {guardImage,fallbackForImage,fallbackImageSource,useImageFallback,retireDetachedMedia,visitorMessage} from './kdw-graceful-media.mjs';\nimport {showStandbyCover,dismissStandbyCover} from './kdw-standby-cover.mjs';\n"+text;
replace("  const decoded=images.map(image=>{\n   if(image.dataset.preparedPhone==='true'&&image.complete&&image.naturalWidth){image.dataset.gpuDecoded='true';return Promise.resolve();}\n   image.dataset.gpuDecoded='false';\n   const failed=()=>{\n    if(generation!==bindingGeneration||!image.isConnected)return;\n    const message=document.createElement('p');message.className='phone-media-error';\n    message.textContent='Кадр задания не загрузился. Перезапустите миссию.';\n    image.replaceWith(message);foreground?.refreshPart(shell);changed();\n   };\n   image.addEventListener('error',failed,{once:true});\n   return image.decode().then(()=>{if(generation===bindingGeneration&&image.isConnected)image.dataset.gpuDecoded='true';}).catch(failed);\n  });\n","  const decoded=images.filter(image=>!image.dataset.mediaGhost).map(image=>guardImage(image,{\n   fallback:fallbackForImage(image,controller.displaySnapshot),\n   onChange:()=>{if(generation!==bindingGeneration||!shell.isConnected||shell.dataset.sceneVersion!==key)return;delete shell.dataset.gpuUploadError;delete shell.dataset.gpuReadyKey;foreground?.refreshPart(shell);changed();},\n   onFault:details=>console.error('MAX_SCREEN_MEDIA_FALLBACK',JSON.stringify({key,...details}))\n  }).ready);\n");
replace("function recoverPendingPhoneMedia(){\n if(!revealMode||controller.phase!=='phone-enter'||controller.elapsed<PHONE_MEDIA_DEADLINE)return;\n const shell=host.querySelector('.route-phone'),key=controller.phoneContentKey;\n if(!shell||shell.dataset.sceneVersion!==key||shell.dataset.mediaReadyKey===key)return;\n for(const image of shell.querySelectorAll('.demo-app img[data-gpu-decoded=\"false\"]')){\n  const message=document.createElement('p');message.className='phone-media-error';\n  message.textContent='Кадр задания не загрузился. Перезапустите миссию.';\n  image.replaceWith(message);\n }\n shell.querySelector('.phone-loading')?.remove();const content=shell.querySelector('.demo-app .phone-content');if(content){content.style.opacity='1';content.inert=false;}\n shell.dataset.mediaReadyKey=key;foreground?.refreshPart(shell);changed();\n console.warn('MAX phone media decode deadline',key);\n}\n","function recoverPendingPhoneMedia(){\n retireDetachedMedia();\n if(!revealMode||controller.phase!=='phone-enter'||controller.elapsed<PHONE_MEDIA_DEADLINE)return;\n const shell=host.querySelector('.route-phone');if(!shell)return;\n for(const image of shell.querySelectorAll('.demo-app img[data-gpu-decoded=\"false\"]'))void useImageFallback(image,'preparation-deadline');\n}\n");
replace('async function boot(){', 'async function boot(){\n showStandbyCover();');
replace('loading.hidden=true;root.inert=false;', 'dismissStandbyCover(loading);root.inert=false;');
text=text.replace(/loading\.textContent=`Загрузка ресурсов MAX: \$\{done\} \/ \$\{total\}`/g, 'loading.dataset.progress=String(done)+\"/\"+String(total)');
text=text.replace(/loading\.textContent=`Подготовка графики MAX: \$\{done\} \/ \$\{total\}`/g, 'loading.dataset.progress=String(done)+\"/\"+String(total)');
text=text.replace("loading.textContent='Подготавливаем активность MAX…';", "loading.dataset.preparing='activity';");
text=text.replace(/boot\(\)\.catch\(e=>\{if\(pageDisposed\)return;[\s\S]*?\}\);\nwindow\.addEventListener\('pagehide'/, "boot().catch(e=>{if(pageDisposed)return;console.error('MAX_BOOT_RECOVERY',e);startupAssets?.dispose();document.documentElement.dataset.assetPreparation='failed';showRuntimeRecovery();});\nwindow.addEventListener('pagehide'");
text=text.replace("message.innerHTML='<p class=\"phone-media-error\">Экран задания недоступен. Перезапустите миссию.</p>';", "message.innerHTML='<div class=\"phone-content\"><img alt=\"MAX\" class=\"task-media-image\" src=\"'+fallbackImageSource()+'\"></div>';console.error('MAX_SCREEN_MARKUP_FALLBACK',key);");
text=text.replace("feedback('Нет связи с backend. Экран сохранён.');", "console.error('MAX_BACKEND_RETRY');");
text=text.replace("feedback('Не удалось открыть миссию. Нажмите ещё раз.');", "console.error('MAX_MANUAL_RETRY');");
// Tap/status chatter belongs in diagnostics, never as floating text over the game.
replace('function feedback(text){foreground?.showTapFeedback(host,{x:host.clientWidth/2,y:host.clientHeight*.65},text);}', "function feedback(text){text=visitorMessage(text);if(text)console.debug('MAX_INTERACTION_NOTICE',text);}");
// Keep the running GPU scene while exchanging the portable visitor/session.
// Only foreground elements retire; no loading page and no background restart.
replace('import {showStandbyCover,dismissStandbyCover}', 'import {showStandbyCover,dismissStandbyCover,installSceneTransition,transitionReload}');
replace('const gameLink=await loadGameLink(params);', 'let gameLink=await loadGameLink(params);');
replace('const productionPolicy=gameLink?.game?.standPolicy??standSettings;const MISSION_CATALOG=', 'let productionPolicy=gameLink?.game?.standPolicy??standSettings;let MISSION_CATALOG=');
const sessionStart=text.indexOf(' if(sharedBackend&&!managedShell){',text.indexOf('async function boot(){'));
const sessionEnd=text.indexOf('\n let saved;',sessionStart);
if(sessionStart<0||sessionEnd<0)throw Error('Portable session preparation anchor missing');
const sessionBlock=text.slice(sessionStart,sessionEnd);
text=text.slice(0,sessionStart)+' await preparePortableSession();'+text.slice(sessionEnd);
const sessionFunction=`async function preparePortableSession(){
 const generation=bindingGeneration;
${sessionBlock.replace('onSnapshot:snapshot=>{managedSnapshot(snapshot);','onSnapshot:snapshot=>{if(generation!==bindingGeneration||pageDisposed)return;managedSnapshot(snapshot);')}
}
async function transitionPortableSession(){
 if(!portable||!productionMode)return location.reload();
 // A terminal snapshot may already have revealed standby before the link poll
 // acknowledges release. Rebinding that idle session must not retire it again.
 const shownStandby=idleMenu&&gameLink?.game&&sharedSession?.snapshot?.state.status==='menu'?idleMenu:null;
 stopGameLink();stopGameLink=()=>{};cancelGesture();navigating=true;idleSelecting=true;
 document.documentElement.dataset.sceneTransition='retiring';
 try{
  if(idleMenu){if(idleMenu!==shownStandby)await idleMenu.exit();}
  else if(foreground)await new Promise(resolve=>foreground.transition(host,resolve,{interrupt:true,exitOnly:true}));
  document.documentElement.dataset.sceneTransition='preparing';
  const nextLink=await loadGameLink(params);
  const nextPolicy=nextLink?.game?.standPolicy??await readStandSettings(params)??standSettings;
  const retainStandby=!!shownStandby&&idleMenu===shownStandby&&!nextLink?.game;
  if(shownStandby&&!retainStandby&&idleMenu===shownStandby)await shownStandby.exit();
  // Refresh the parameter binding after readStandSettings strips old link data.
  if(nextLink?.game){params.set('session',nextLink.game.gameId);params.set('link','1');}
  else params.set('session','idle.'+crypto.randomUUID());
  ++bindingGeneration;screenEpoch++;missionContinuation?.cancel();missionContinuation=null;
  const previous=sharedSession;sharedSession=null;controller=null;
  await previous?.close();
  if(pageDisposed)return;
  if(!retainStandby){await disposeIdleMenu();clearManagedScene();}
  gameLink=nextLink;productionPolicy=nextPolicy;
  MISSION_CATALOG=productionCatalog(linkedCatalog(bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG,gameLink),productionPolicy);
  content=sharedRevealContent(MISSION_CATALOG);
  await preparePortableSession();if(pageDisposed)return;
  if(localRecovery&&!await sharedSession.owner(inputActive()))throw Error('SESSION_UNAVAILABLE');
  configureController();popupPage=0;popupToken='';view='';phoneStep='';phoneToken='';phonePending='';answerPending=false;pendingResume=null;
  navigating=false;idleSelecting=false;fit();render();syncScene();
  document.documentElement.dataset.sceneTransition='revealing';
 }catch(error){
  console.error('MAX_SCENE_TRANSITION_RETRY',error);idleMenu?.restore();
  document.documentElement.dataset.sceneTransition='retrying';
  if(!pageDisposed)setTimeout(()=>void transitionReload(),1500);
 }finally{
  navigating=false;idleSelecting=false;
  if(!pageDisposed)stopGameLink=watchGameLink({link:gameLink,getSession:()=>sharedSession,onPhotoChange:()=>foreground?.invalidate()});
 }
}
`;
replace('async function boot(){',sessionFunction+'async function boot(){');
replace("document.documentElement.dataset.gameReady='true';", "document.documentElement.dataset.gameReady='true';\n installSceneTransition(transitionPortableSession);");
replace("try{await selectManualMission(missionId);}", "try{await idleMenu.exit();await selectManualMission(missionId);}");
replace("['manual','combined'].includes(standSettings.value.max.entryMode)","['manual','combined'].includes(productionPolicy.value.max.entryMode)");
// Trusted operator controls arrive only through the existing desktop preload.
text="import {mountOperatorGame} from './kdw-operator-game.mjs';\nimport {operatorScope} from './kdw-operator-model.mjs';\n"+text;
replace('admit:()=>claimLinkedMission(gameLink)', 'admit:()=>claimLinkedMission(gameLink),operatorControls:!!globalThis.kdwStandOutput?.onGameControl,outputRecovery:!!globalThis.kdwStandOutput');
replace('function tick(delta){', 'function tick(delta){\n operatorGame.tick();');
replace('deviceReady:phoneContentReady(),', 'deviceReady:!!controller&&phoneContentReady(),');
replace('const stopBootHealth=', `const operatorGame=mountOperatorGame({bridge:globalThis.kdwStandOutput,getSession:()=>sharedSession,getCatalog:()=>MISSION_CATALOG,getPhase:()=>controller?.phase,isBusy:()=>navigating||!!sharedSession?.busy||!!controller?.startup||!!controller?.handoff||!!foreground?.busy(host,true),goto:async(target,token)=>{
 const session=sharedSession;if(operatorScope(session.snapshot.state)!==token)throw Error('OPERATOR_STATE_CHANGED');
 if(gameLink?.game&&session.snapshot.state.status==='scan'&&target.screenId!=='operator.scan')await claimLinkedMission(gameLink);
 if(session!==sharedSession||operatorScope(session.snapshot.state)!==token)throw Error('OPERATOR_STATE_CHANGED');
 navigating=true;cancelGesture();personalChannel.dismissKeyboard();taskSkip.suspend();controller.prepareMissionRestart?.();
 try{await session.operatorGoto({missionId:target.missionId,taskId:target.taskId,screenId:target.screenId});
  const commit=()=>{controller.commitMissionRestart?.();controller.startup=null;controller.paths=null;controller.handoff=null;controller.presentedDevice=null;if(controller.phase==='paused')controller.resume(controller.activeId);phonePresence.value=0;phonePresence.velocity=0;resetPrompt=false;popupPage=0;popupToken='';view='';render(true);navigating=false;fit();syncScene();};
  if(!foreground?.transition(host,commit,{interrupt:true}))commit();
 }catch(error){controller.cancelMissionRestart?.();navigating=false;throw error;}
}});
const stopBootHealth=`);
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{operatorGame.dispose();");
// Reuse the existing timer material and queue feed; one non-interactive sibling.
replace('resumeLinkedMission,watchGameLink,claimLinkedMission}', 'resumeLinkedMission,watchGameLink,claimLinkedMission,linkedQueueCount}');
replace('function updateTargets(){', `function updateMissionQueue(timer,rect){
 let queue=host.querySelector('[data-mission-queue-count]');
 if(!queue){timer.insertAdjacentHTML('afterend','<div class="v5-device-timer v5-scan-queue" data-mission-queue-count data-path-presence="0" aria-live="off" aria-label="Очередь">очередь: —</div>');queue=host.querySelector('[data-mission-queue-count]');foreground?.invalidate();}
 setStyleValue(queue,'left',String(rect.left-rect.width-48)+'px');setStyleValue(queue,'top',String(rect.top)+'px');
 queue.dataset.pathPresence=timer.dataset.pathPresence;
 const count=productionMode?linkedQueueCount():scanWaitClock.view(controller?.snapshot,performance.now()).queueCount,label='очередь: '+(count??'—');
 if(queue.textContent!==label){queue.textContent=label;foreground?.refreshPart(queue);changed();}
}
function updateTargets(){`);
replace("timer.dataset.pathPresence=String(phonePresence.value*(controller.snapshot?.state.scanned===false?0:1));", "timer.dataset.pathPresence=String(phonePresence.value*(controller.snapshot?.state.scanned===false?0:1));updateMissionQueue(timer,r);");
replace('queueCount:null}:scanWaitClock.view', 'queueCount:linkedQueueCount()}:scanWaitClock.view');
replace('if(productionMode)queue.hidden=true;const labels=', 'const labels=');
replace('`Ожидают: ${wait.queueCount??\'—\'}`', '`очередь: ${wait.queueCount??\'—\'}`');
replace('aria-label="Миссии в очереди">Ожидают: —', 'aria-label="Очередь">очередь: —');
replace("if(!b.classList.contains('media-hotspot'))foreground?.highlightTile(b);","if(!b.classList.contains('media-hotspot')&&!b.hasAttribute('data-transition-source'))foreground?.highlightTile(b);");
// Screen telemetry is independent of the game-link and contains no visitor data.
text="import {startScreenPublication} from './kdw-screen-publication.mjs';\n"+text;
replace('const stopBootHealth=', `const stopScreenPublication=startScreenPublication(()=>{
 const state=idleMenu?{status:'menu'}:controller?.displayedState??sharedSession?.snapshot?.state;
 const phase=controller?.phase??'loading',booted=document.documentElement.dataset.gameReady==='true';
 const menuReady=!!idleMenu&&document.documentElement.dataset.idleMenuReady===document.documentElement.dataset.idleMenuScope;
 const phoneReady=['task','result'].includes(state?.status)&&phoneContentReady()&&phonePresence.value>.97;
 const qr=host.querySelector('.v5-mission-qr');
 const ready=booted&&(state?.status==='menu'?menuReady:state?.status==='scan'?palmPresence.value>.97:['completed','incomplete','expired'].includes(state?.status)?!!qr&&foreground?.qrReady(qr)===true:phoneReady);
 return {state,phase,active:presentationActive(),ready,transitioning:state?.status!=='menu'&&(!!controller?.startup||!!controller?.handoff||!['palm','holding','task','result','complete','paused'].includes(phase)||!!foreground?.busy(host,true)||!!foreground?.contentBusy(host))};
});
window.addEventListener('pagehide',stopScreenPublication,{once:true});
const stopBootHealth=`);
text="import {createDeviceBrightness} from './kdw-device-brightness.mjs';\n"+text;
replace('function tick(delta){',"const deviceBrightnessControl=createDeviceBrightness({document,getScreen:()=>controller?.displayedState?.screenId});\nfunction tick(delta){\n deviceBrightnessControl.update();");
replace('foreground=createJourneyWebGLUI({', 'await deviceBrightnessControl.ready;\n foreground=createJourneyWebGLUI({');
replace('await sharedSession.start();', 'await sharedSession.start();\n  if(standOutput)await sharedSession.outputRecovery(!standOutput.active());');
// Keep production timers paused during output recovery, independently of ownership.
replace("window.addEventListener('kdw-output-state',()=>{cancelGesture();windowFocused=standOutput?.active()===true;if(!preparingInteractionPreview)sharedSession?.owner(inputActive());});", "window.addEventListener('kdw-output-state',()=>{cancelGesture();windowFocused=standOutput?.active()===true;if(!preparingInteractionPreview&&sharedSession)void sharedSession.outputRecovery(!inputActive(),true).catch(error=>console.error('MAX_OUTPUT_RECOVERY_FAILED',error));});");
// A production output reload has already admitted this visitor. Resume the
// saved task's presentation automatically instead of waiting on an icon click.
replace("if((mobileWall||recoveryChoice==='continue')&&controller.phase==='paused')", "if((mobileWall||recoveryChoice==='continue'||productionMode&&standOutput)&&controller.phase==='paused')");
// Match selection and contact latch to the same expanded in-device hotspot.
replace("import {contactRadius} from './kdw-contact-area.mjs';", "import {contactRadius,missionHitRect} from './kdw-contact-area.mjs';");
replace("rect=screenTap?.rect??(tile||b).getBoundingClientRect();", "rect=screenTap?.rect??(tile?tile.getBoundingClientRect():missionHitRect(b));");
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==text.replaceAll('\r\n','\n'))throw Error('Generated stand main differs; run the adapter and review its diff.');}
else fs.writeFileSync(file,text);
console.log('Stand main adapted only at local host boundaries');
