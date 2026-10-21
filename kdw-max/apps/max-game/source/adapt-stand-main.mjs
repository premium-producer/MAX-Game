import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(source,'client/src/journey-guided-main.js');
let text=fs.readFileSync(path.join(source,'stand-base/src/journey-guided-main.js'),'utf8').replaceAll('\r\n','\n');
const replace=(from,to)=>{if(!text.includes(from))throw Error('Stand adapter anchor missing: '+from.slice(0,100));text=text.replace(from,to);};
text=`import {KdwTaskJourney} from './kdw-task-journey.mjs';
import {mountKdwInteractions} from './kdw-interactions.mjs';
import {screenContinuationTarget} from './kdw-screen-continue.mjs';
import {mountPersonalChannel} from './kdw-personal-channel.mjs';
import {mountTaskSkip} from './kdw-task-skip.mjs';
import {mountPostActivity} from './kdw-posts.mjs';
import {CalmLinkMotion,CALM_LINK_STYLE} from './kdw-link-motion.mjs';
import {prepareInteractionPreview} from './kdw-preview.mjs';
import {createMemoryPersistencePort} from './application/memory-persistence.mjs';
import {createStandBrowserHost,LocalStandAdmission,createBrowserScenePlan,browserDeviceCenter,BROWSER_ROUTE_GAP} from './kdw-stand-adapter.mjs';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';
`+text;
replace('new V5RevealJourney(content,sharedSession,v5RouteMeasure)', "new (portable?KdwTaskJourney:V5RevealJourney)(content,sharedSession,v5RouteMeasure)");
replace('controller.snapshot.state.runId}`', '(controller.sceneRunId??controller.snapshot.state.runId)}`');
replace('const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;', 'const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;\nconst browserScenePlan=createBrowserScenePlan(MISSION_CATALOG,v5DeviceMetrics);');
replace("if((!managedShell&&(!managedAssignment||!params.get('session')))||params.get('backend')!=='server')throw Error('Managed MAX requires an explicit assignment and session');","if(params.get('backend')==='server'&&!managedShell&&(!managedAssignment||!params.get('session')))throw Error('Managed MAX requires an explicit assignment and session');");
replace('function managedSnapshot(snapshot){','function managedSnapshot(snapshot){if(params.get(\'backend\')!==\'server\'){managedNotice.hidden=true;return;}');
replace('let sharedSession,v5Tools,missionContinuation',"const interactionPreview=['channel','store','posts'].includes(params.get('interaction'))?params.get('interaction'):null;\nconst portable=params.get('backend')!=='server';\nconst kdwInteractions=mountKdwInteractions({getSession:()=>sharedSession,onMenu:()=>navigate()});\nconst personalChannel=mountPersonalChannel({getSession:()=>sharedSession});\nconst kdwPosts=mountPostActivity({getSession:()=>sharedSession});\nlet standBrowser;\nconst localAdmission=new LocalStandAdmission({active:()=>inputActive()});\nlet sharedSession,v5Tools,missionContinuation");
replace("const portable=params.get('backend')!=='server';", "const portable=params.get('backend')!=='server';\nconst standPresentation=portable&&bfmVisual&&params.get('debug')!=='1';");
replace('(!localRecovery||windowFocused);','(portable||!localRecovery||windowFocused);');
replace("palmVisible=['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);","palmVisible=!(portable&&bfmVisual)&&['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);");
replace('function tick(delta){',"function tick(delta){\n kdwInteractions.update(controller?.displaySnapshot,controller?.phase);\n personalChannel.update(controller?.displaySnapshot,controller?.phase);\n kdwPosts.update(controller?.displaySnapshot,controller?.phase);\n if(controller?.snapshot?.state)document.documentElement.dataset.kdwScreen=controller.snapshot.state.screenId??controller.snapshot.state.status;document.documentElement.dataset.kdwRun=controller?.snapshot?.state.runId??'';\n standBrowser?.update(controller?.snapshot);\n if(portable&&!navigating)void localAdmission.update(sharedSession)?.catch(error=>console.error('MAX local admission',error));");
replace('function phoneContentReady(){', 'function phoneContentReady(){\n if(!personalChannel.ready(controller?.displaySnapshot))return false;');
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
replace('await sharedSession.start();\n  if(pageDisposed)', "await sharedSession.start();\n  if(standPresentation&&!interactionPreview&&sharedSession.snapshot.state.status!=='menu')await sharedSession.command('RETURN_MENU');\n  if(pageDisposed)");
replace("document.documentElement.dataset.sessionStorage=profile==='server'", "if(interactionPreview){loading.textContent='Подготавливаем активность MAX…';try{await prepareInteractionPreview(sharedSession,MISSION_CATALOG,interactionPreview);}finally{preparingInteractionPreview=false;}}\n  document.documentElement.dataset.sessionStorage=profile==='server'");
replace('controller=createController(saved);','controller=createController(saved);\n if(interactionPreview&&controller.phase===\'paused\')controller.resume(controller.activeId);');
text=text.replaceAll('v5Tools?.fit(innerWidth,innerHeight);','v5Tools?.fit(innerWidth,innerHeight);standBrowser?.fit(innerWidth,innerHeight);');
replace('function sceneSize(){',"function sceneSize(){\n if(portable&&params.get('view')!=='wall')return browserScenePlan(innerWidth,innerHeight);");
replace('visible:!!instruction&&!instruction.hidden','visible:portable&&params.get(\'view\')!==\'wall\'||!!instruction&&!instruction.hidden');
replace('host.style.cssText=referenceVisual?',"host.style.cssText=portable&&params.get('view')!=='wall'?`left:32px;top:128px;width:${size.width-64}px;height:${size.height-192}px`:referenceVisual?");
replace('createV5RouteMeasure(arena):null','createV5RouteMeasure(arena,{gap:params.get(\'backend\')!==\'server\'&&params.get(\'view\')!==\'wall\'?BROWSER_ROUTE_GAP:REVEAL_ELEMENT_GAP}):null');
replace('const deviceCenter=()=>referenceVisual?',"const deviceCenter=()=>portable&&params.get('view')!=='wall'?browserDeviceCenter(host.clientWidth,deviceMetrics().width):referenceVisual?");
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
   const reply=await sharedSession.command('SELECT_MISSION',{missionId});
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
replace('<div class="v5-device-timer" data-mission-timer', "<${localDevelopment?'button':'div'} class=\"v5-device-timer\" data-mission-timer");
replace('aria-label="Оставшееся время миссии">${(localDevelopment', 'aria-label="Таймер задания">${(localDevelopment');
replace("revealTimerLabel(controller.secondsLeft))}</div>`:''}", "revealTimerLabel(controller.secondsLeft))}</${localDevelopment?'button':'div'}>`:''}");
replace(" if(!b.classList.contains('media-hotspot'))", " if(localDevelopment&&b.hasAttribute('data-mission-timer')){if(!sharedSession.busy)void sharedSession.command('DEV_TIMER',{active:controller.snapshot.state.devTimerEnabled!==true});return;}\n if(!b.classList.contains('media-hotspot'))");
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

fs.writeFileSync(file,text);
console.log('Stand main adapted only at local host boundaries');
