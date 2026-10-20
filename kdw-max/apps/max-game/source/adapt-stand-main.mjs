import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(source,'client/src/journey-guided-main.js');
let text=fs.readFileSync(path.join(source,'stand-base/src/journey-guided-main.js'),'utf8').replaceAll('\r\n','\n');
const replace=(from,to)=>{if(!text.includes(from))throw Error('Stand adapter anchor missing: '+from.slice(0,100));text=text.replace(from,to);};
text=`import {mountKdwInteractions} from './kdw-interactions.mjs';
import {mountTaskSkip} from './kdw-task-skip.mjs';
import {mountPostActivity} from './kdw-posts.mjs';
import {CalmLinkMotion,CALM_LINK_STYLE} from './kdw-link-motion.mjs';
import {prepareInteractionPreview} from './kdw-preview.mjs';
import {createMemoryPersistencePort} from './application/memory-persistence.mjs';
import {createStandBrowserHost,LocalStandAdmission,createBrowserScenePlan,browserDeviceCenter,BROWSER_ROUTE_GAP} from './kdw-stand-adapter.mjs';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';
`+text;
replace('const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;', 'const MISSION_CATALOG=bfmVisual?V5_MISSION_CATALOG:PREVIOUS_MISSION_CATALOG;\nconst browserScenePlan=createBrowserScenePlan(MISSION_CATALOG,v5DeviceMetrics);');
replace("if((!managedShell&&(!managedAssignment||!params.get('session')))||params.get('backend')!=='server')throw Error('Managed MAX requires an explicit assignment and session');","if(params.get('backend')==='server'&&!managedShell&&(!managedAssignment||!params.get('session')))throw Error('Managed MAX requires an explicit assignment and session');");
replace('function managedSnapshot(snapshot){','function managedSnapshot(snapshot){if(params.get(\'backend\')!==\'server\'){managedNotice.hidden=true;return;}');
replace('let sharedSession,v5Tools,missionContinuation',"const interactionPreview=['channel','store','posts'].includes(params.get('interaction'))?params.get('interaction'):null;\nconst portable=params.get('backend')!=='server';\nconst kdwInteractions=mountKdwInteractions({getSession:()=>sharedSession,onMenu:()=>navigate()});\nconst kdwPosts=mountPostActivity({getSession:()=>sharedSession});\nlet standBrowser;\nconst localAdmission=new LocalStandAdmission({active:()=>inputActive()});\nlet sharedSession,v5Tools,missionContinuation");
replace("const portable=params.get('backend')!=='server';", "const portable=params.get('backend')!=='server';\nconst standPresentation=portable&&bfmVisual&&params.get('debug')!=='1';");
replace('(!localRecovery||windowFocused);','(portable||!localRecovery||windowFocused);');
replace("palmVisible=['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);","palmVisible=!(portable&&bfmVisual)&&['palm','holding',...(revealMode?['burst']:[])].includes(controller.phase);");
replace('function tick(delta){',"function tick(delta){\n kdwInteractions.update(controller?.snapshot,controller?.phase);\n kdwPosts.update(controller?.snapshot,controller?.phase);\n if(controller?.snapshot?.state)document.documentElement.dataset.kdwScreen=controller.snapshot.state.screenId??controller.snapshot.state.status;\n standBrowser?.update(controller?.snapshot);\n if(portable)void localAdmission.update(sharedSession)?.catch(error=>console.error('MAX local admission',error));");
replace("if(!managedShell){const initialContext=await readManagedContext();","if(!managedShell&&!portable){const initialContext=await readManagedContext();");
replace("if(bfmVisual&&!service&&!automaticPresentation)v5Tools=createV5Tools", "if(portable)standBrowser=createStandBrowserHost({arena,params,onMenu:()=>{void kdwInteractions.flush().then(()=>navigate()).catch(error=>feedback(error.message));}});\n if(bfmVisual&&!service&&!automaticPresentation&&params.get('debug')==='1')v5Tools=createV5Tools");
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
replace('\n}\nfunction updateScanWaitDisplays', '\n kdwInteractions.align();kdwPosts.align();\n}\nfunction updateScanWaitDisplays');
replace('function updateTargets(){',"function updateTargets(){\n host.dataset.synchronizedRoute=String(portable&&params.get('view')!=='wall'&&controller?.spread&&!gesture);");
replace('const v5LinkPaint=Object.freeze({',"const calmLinks=params.get('backend')!=='server'&&params.get('view')!=='wall'?new CalmLinkMotion():null;\nconst v5LinkPaint=Object.freeze({...(calmLinks?CALM_LINK_STYLE:{}),");
replace('const deviceLinkStyle=bfmVisual?', 'const deviceLinkStyle=calmLinks?routeLinkStyle:bfmVisual?');
replace('function syncScene(){',"function syncScene(){\n if(idleMenu||independent)calmLinks?.update([],1,performance.now()/1000);");
replace('field.update({placements,network,endpoints:{},selectedItem:null});',"calmLinks?.update(network.links,scale,performance.now()/1000,reduced.matches);\n field.update({placements,network,endpoints:{},selectedItem:null});");
// On the stand the common background belongs to the outer GPU host. The portable
// host supplies its existing local MAX grid layer behind the transparent game.
replace('ambient=bfmVisual?commonMapBackground','ambient=bfmVisual?lumiReferenceBackground');
replace('window.addEventListener(\'pagehide\',()=>{',"window.addEventListener('pagehide',()=>{localAdmission.dispose();standBrowser?.dispose();kdwInteractions.dispose();kdwPosts.dispose();");
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
   if(sharedSession.busy)return;
   cancelGesture();screenEpoch++;answerPending=false;pendingResume=null;phonePending='';foreground?.cancelContent(host);
   void sharedSession.command('RESTART_TASK',{taskId:b.dataset.object}).then(result=>{
    if(!result?.reply.ok){feedback('Не удалось перезапустить задание');return;}
    popupPage=0;if(controller.phase==='paused')controller.resume(controller.activeId);focusCurrent();render();
   });return;
  }`);
replace('function tick(delta){', `const taskSkip=mountTaskSkip({host,onSkip:async taskId=>{
 if(!localDevelopment||!inputActive()||sharedSession.busy)return;
 try{
  await kdwInteractions.flush();
  const result=await sharedSession.command('SKIP_TASK',{taskId});
  if(!result?.reply.ok){feedback('Не удалось пропустить задание');return;}
  cancelGesture();screenEpoch++;answerPending=false;pendingResume=null;phonePending='';foreground?.cancelContent(host);
  popupPage=0;if(controller.phase==='paused')controller.resume(controller.activeId);focusCurrent();render();
 }catch(error){feedback('Не удалось сохранить пропуск. Попробуйте ещё раз.');}
}});
function tick(delta){
 taskSkip.update(controller?.snapshot?.state,localDevelopment&&inputActive()&&!sharedSession?.busy&&!controller?.startup&&!controller?.handoff);`);
replace("window.addEventListener('pagehide',()=>{", "window.addEventListener('pagehide',()=>{taskSkip.dispose();");
// An isolated preview builds its command history before the renderer is ready.
// Focus callbacks cannot revoke that temporary owner: recoveryBlocked prevents
// focus from restoring it until boot completes, creating a circular wait.
replace("const portable=params.get('backend')!=='server';", "let preparingInteractionPreview=!!interactionPreview;\nconst portable=params.get('backend')!=='server';");
replace("cancelGesture();sharedSession?.owner(false);});window.addEventListener('focus'", "cancelGesture();if(!preparingInteractionPreview)sharedSession?.owner(portable&&inputActive());});window.addEventListener('focus'");
replace("windowFocused=true;if(inputActive())sharedSession?.owner(true);", "windowFocused=true;if(!preparingInteractionPreview&&inputActive())sharedSession?.owner(true);");
replace("independent?.setActive(presentationActive());sharedSession?.owner(inputActive());", "independent?.setActive(presentationActive());if(!preparingInteractionPreview)sharedSession?.owner(inputActive());");
fs.writeFileSync(file,text);
console.log('Stand main adapted only at local host boundaries');
