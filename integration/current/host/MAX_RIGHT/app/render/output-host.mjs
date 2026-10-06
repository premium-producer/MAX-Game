import {createLaunchLogger} from '../launch-diagnostics/launch-logger.mjs';
import {consumeFrameTiming} from './frame-timing-log.mjs';
import {performance} from 'node:perf_hooks';
import {createMotionTrace} from './idle-adapter/motion-trace.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GPUOutputHub} from './layered-transport/gpu-output-hub.mjs';
import {createOutputPolicy,validateOutputEnvelope,matchesPlanOutputSettings} from './layered-transport/output-policy.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {presentationCommand} from './presentation-command.mjs';
import {maxGameFrameEvidence} from './max-game-frame-evidence.mjs';
import {createLidarNativeBridge,lidarContentRect} from './lidar-render-bridge.mjs';
export async function startOutputHost({BrowserWindow,ipcMain,settings,origin,preparedAssets,onFailure=()=>{},onFrame=()=>{},makeHub=()=>new GPUOutputHub()}) {
 const base=path.dirname(fileURLToPath(import.meta.url)),hub=makeHub();
 const rendererBootId=randomUUID();let lidarLogger=null,lidarDiagnosticIdentity={};
 const lidarDiagnostic=(event,fields)=>{try{lidarLogger??=createLaunchLogger({root:path.resolve(base,'../..'),role:'MAX-LIDAR-NATIVE'});lidarLogger.log(event,fields);}catch{}};
 const outputs=[],requests=new Map(),lidarBridges=new Map(),lidarCancellations=new Map();let closing,commandBusy=false,currentBinding=null,resourceStage=null,activeAction=null,outputControl=settings.outputControl??null;
 const trace=createMotionTrace({role:(settings.outputs??[settings]).map(s=>s.output.id).join('+'),component:'output-host'});
 const timed=async(name,fn,details={})=>{const span=trace.begin(name,details);try{const result=await fn();trace.end(span,{ok:true});return result;}catch(error){trace.end(span,{ok:false,error:String(error.code??error.message).slice(0,160)});throw error;}};
 let diagnosticCount=0;const diag=(phase,detail)=>{if(diagnosticCount++<60)console.error(`[output:${phase}] ${String(detail?.stack??detail??"unknown").slice(0,4096)}`);};
 const close=()=>closing??=(async()=>{
  await Promise.allSettled([...lidarBridges.values()].map(bridge=>bridge.close()));lidarBridges.clear();lidarLogger?.close();
  ipcMain.removeListener('lidar-cancel-complete',lidarComplete);
  for(const request of lidarCancellations.values()){clearTimeout(request.timer);request.resolve();}lidarCancellations.clear();
  resourceStage?.store?.discard();resourceStage=null;
  ipcMain.removeHandler('probe-configure');ipcMain.removeHandler('probe-present');ipcMain.removeListener('probe-fault',fault);
  ipcMain.removeHandler('probe-output-control');ipcMain.removeHandler('probe-set-output-plan');
  ipcMain.removeListener('presentation-complete',complete);ipcMain.removeListener('presentation-ready',ready);
  for(const request of requests.values()){clearTimeout(request.timer);trace.end(request.span,{ok:false,error:'PRESENTATION_HOST_CLOSED'});request.reject(Error('PRESENTATION_HOST_CLOSED'));}requests.clear();
  for(const {win} of outputs)if(!win.isDestroyed())win.webContents.stopPainting();
  try {await hub.close();} finally {for(const {win} of outputs)if(!win.isDestroyed())win.destroy();trace.close();}
 })();
 const owner=event=>{const entry=outputs.find(({win})=>event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame);if(!entry||closing)throw Error('Foreign output owner');return entry;};
 const lidarComplete=(event,id)=>{let entry;try{entry=owner(event);}catch{return;}const request=lidarCancellations.get(id);if(!request||request.entry!==entry)return;clearTimeout(request.timer);lidarCancellations.delete(id);request.resolve();};
 const lidarCancelDOM=entry=>new Promise(resolve=>{
  if(entry.win.isDestroyed())return resolve();const requestId=randomUUID();
  const timer=setTimeout(()=>{lidarCancellations.delete(requestId);resolve();},250);
  lidarCancellations.set(requestId,{entry,timer,resolve});entry.win.webContents.send('lidar-cancel',{requestId});
 });
 const lidarBridge=entry=>{let bridge=lidarBridges.get(entry);if(!bridge){bridge=createLidarNativeBridge({onDiagnostic:(event,fields)=>lidarDiagnostic(event,{...fields,...lidarDiagnosticIdentity}),sendInputEvent:event=>{if(!entry.win.isDestroyed())entry.win.webContents.sendInputEvent(event);},onCancel:()=>lidarCancelDOM(entry)});lidarBridges.set(entry,bridge);}return bridge;};
 const lidarCancel=async(reason='host-cancel')=>{await Promise.allSettled([...lidarBridges.values()].map(bridge=>bridge.cancel(reason)));for(const entry of outputs)if(entry.spec.output.id==='MAX_RIGHT'&&!entry.win.isDestroyed())entry.win.webContents.send('lidar-frame',{enabled:false,calibrating:false,cursor:null,rect:{y:entry.rendererPlan?.mode==='layers'?1282:2,enabled:false}});};
 // Digest the complete compound identity; nested JSON can exceed the native bridge limit.
 const lidarOwnerKey=(bindingKey,frameOwnerKey)=>createHash('sha256').update(JSON.stringify([bindingKey,frameOwnerKey])).digest('hex');
 const lidarFrame=async frame=>{lidarDiagnosticIdentity={assignmentId:frame.assignmentId,sessionId:frame.sessionId};
  const entry=outputs.find(e=>e.spec.output.id==='MAX_RIGHT');
  if(closing||!entry?.ready||!currentBinding||!entry.rendererPlan){await lidarCancel('presentation-unavailable');return false;}
  const bridge=lidarBridge(entry),ownerKey=lidarOwnerKey(currentBinding.key,frame.ownerKey);
  await bridge.configure({plan:entry.rendererPlan,enabled:frame.enabled,calibrating:frame.calibrating,ownerKey});
  for(const event of frame.events){if(closing||!currentBinding||lidarOwnerKey(currentBinding.key,frame.ownerKey)!==ownerKey){await bridge.cancel('stale-presentation');return false;}await bridge.contact({...event,ownerKey});}
  await bridge.expire();const snapshot=bridge.snapshot(),rect=lidarContentRect(entry.rendererPlan);
  entry.win.webContents.send('lidar-frame',{enabled:frame.enabled,calibrating:frame.calibrating,revision:frame.revision,calibration:frame.calibration,rawCursor:frame.rawCursor,cursor:frame.cursor??snapshot.point,rect});return true;
 };
 const fault=event=>{try{owner(event);trace.emit('output.fault');diag('fault','Renderer reported probe-fault');onFailure('Fixture render failed');}catch{}};
 const ready=event=>{try{const entry=owner(event);entry.ready=true;entry.resolveReady?.();}catch{}};
 const complete=(event,id,response)=>{
  let entry;try{entry=owner(event);}catch{return;}
  const request=requests.get(id);if(!request||request.entry!==entry)return;
  if(response?.ok!==true&&response?.ok!==false)return;
  if(response.ok===true&&(response.result?.output!==entry.spec.output.id||response.result?.physicalOutput!==false||(request.command==='update'&&response.result?.frameId!==request.frameId))){requests.delete(id);clearTimeout(request.timer);trace.end(request.span,{ok:false,error:'PRESENTATION_RESPONSE_INVALID'});request.reject(Error('PRESENTATION_RESPONSE_INVALID'));return;}
  requests.delete(id);clearTimeout(request.timer);trace.end(request.span,{ok:response.ok,frameId:request.frameId,...(response.ok?{}:{error:String(response.error).slice(0,1024)})});
  if(!response.ok){console.error('[output:presentation-failure]',JSON.stringify({command:request.command,error:response.error,utc:new Date().toISOString()}));diag('presentation-result',`${entry.spec.output.id} ${request.command}: ${response.error}`);request.reject(Error(typeof response.error==='string'&&/^[A-Z0-9_:.-]{1,160}$/.test(response.error)?response.error:'PRESENTATION_FAILED'));return;}
  // Return host-owned identity/evidence; never forward arbitrary renderer data.
  request.resolve({output:entry.spec.output.id,...(request.command==='update'?{frameId:request.frameId}:{}),evidence:request.command==='update'?'WEBGL_SUBMIT':['start','bind','bind-prepare','bind-commit'].includes(request.command)?'PORT_READY':request.command.startsWith('resources')?'RESOURCES_PREPARED':'PORT_STOPPED',physicalOutput:false});
 };
 const dispatch=(entry,command,payload)=>new Promise((resolve,reject)=>{
  const span=trace.begin('host.dispatch',{command,frameId:payload.frameId,output:entry.spec.output.id});
  const requestId=randomUUID(),timer=setTimeout(()=>{requests.delete(requestId);trace.end(span,{ok:false,error:'PRESENTATION_TIMEOUT'});diag('timeout',`${entry.spec.output.id} ${command}`);reject(Error('PRESENTATION_TIMEOUT'));if(!['bind-prepare','resources'].includes(command))onFailure('Presentation timed out');},['start','bind','bind-prepare'].includes(command)?60000:30000);
  requests.set(requestId,{entry,command,frameId:payload.frameId,resolve,reject,timer,span});
  try{entry.win.webContents.send('presentation-command',{requestId,command,payload});}catch(error){clearTimeout(timer);requests.delete(requestId);trace.end(span,{ok:false,error:String(error.message).slice(0,160)});reject(error);}
 });
 const prepareResources=async (payload,kind='resources')=>{
  if(settings.mode!=='role-artistic-external'||closing||resourceStage||(commandBusy&&activeAction!=='update'))throw Error('RESOURCE_STAGE_BUSY');
  const body=presentationCommand(kind+'-prepare',payload,settings.assetBudget);
  if(outputs.some(e=>!e.ready)||currentBinding?.key!==body.bindingKey)throw Error('PRESENTATION_STALE_BINDING');
  let settled;const stage={kind,options:body.options,bindingKey:body.bindingKey,ready:false,store:null,cancelled:false,settled:new Promise(resolve=>{settled=resolve;})};resourceStage=stage;
  try{
   if(preparedAssets){stage.store=await timed('host.assets.prepare',()=>preparedAssets.prepare(body.assetsManifest,kind==='bind'?body.options:currentBinding.options),{assetCount:body.assetsManifest.assets.length});body.preparedResources=stage.store.resources;}
   else if(body.assetsManifest.assets.length)throw Error('RESOURCE_NOT_PREPARED');
   if(closing||resourceStage!==stage)throw Error('RESOURCE_STAGE_INVALID');if(stage.cancelled)throw Error('RESOURCE_STAGE_CANCELLED');
   const results=await Promise.allSettled(outputs.map(entry=>dispatch(entry,kind==='bind'?'bind-prepare':'resources',body)));
   if(results.some(r=>r.status==='rejected'))throw results.find(r=>r.status==='rejected').reason;
   if(closing||resourceStage!==stage)throw Error('RESOURCE_STAGE_INVALID');if(stage.cancelled)throw Error('RESOURCE_STAGE_CANCELLED');
   stage.ready=true;return {outputs:results.map(r=>r.value),physicalOutput:false};
  }catch(error){
   if(!closing&&!stage.cancelled)await Promise.allSettled(outputs.map(e=>dispatch(e,kind+'-abort',{bindingKey:body.bindingKey})));
   stage.store?.discard();if(resourceStage===stage&&!stage.cancelled)resourceStage=null;throw error;
  }finally{settled();}
 };
 const abortResources=async (payload,kind='resources')=>{
  if(settings.mode!=='role-artistic-external'||closing||(commandBusy&&activeAction!=='update'))throw Error('RESOURCE_STAGE_BUSY');
  const body=presentationCommand(kind+'-abort',payload,settings.assetBudget);
  if(outputs.some(e=>!e.ready)||currentBinding?.key!==body.bindingKey)throw Error('PRESENTATION_STALE_BINDING');
  const stage=resourceStage??{kind,bindingKey:body.bindingKey,ready:false,store:null,cancelled:false,settled:Promise.resolve()};
  if(stage.kind!==kind||stage.bindingKey!==body.bindingKey)throw Error('PRESENTATION_STALE_BINDING');
  resourceStage=stage;stage.cancelled=true;
  return stage.aborting??=(async()=>{
   let cleared=false;try{
    const results=await Promise.allSettled(outputs.map(e=>dispatch(e,kind+'-abort',{bindingKey:body.bindingKey})));
    await stage.settled;
    if(results.some(r=>r.status==='rejected'))throw Error('RESOURCE_ABORT_FAILED');
    cleared=true;return {outputs:results.map(r=>r.value),physicalOutput:false};
   }finally{await stage.settled;stage.store?.discard();if(cleared&&resourceStage===stage)resourceStage=null;}
  })();
 };
 const command=async(action,payload)=>{
  if(action==='bind-prepare')return prepareResources(payload,'bind');
  if(action==='bind-abort')return abortResources(payload,'bind');
  if(action==='resources-prepare')return prepareResources(payload);
  if(action==='resources-abort')return abortResources(payload);
  if(settings.mode!=='role-artistic-external'||closing||commandBusy)throw Error('PRESENTATION_UNAVAILABLE');
  const body=presentationCommand(action,payload,settings.assetBudget);if(outputs.some(e=>!e.ready))throw Error('PRESENTATION_NOT_READY');
  if(resourceStage&&!['update','resources-commit','bind-commit'].includes(action))throw Error('RESOURCE_STAGE_BUSY');
  commandBusy=true;activeAction=action;let stage;
  try{
   if(['resources-commit','bind-commit'].includes(action)){
    const kind=action==='bind-commit'?'bind':'resources';
    const prepared=resourceStage;if(prepared?.kind!==kind||!prepared?.ready||prepared.cancelled||prepared.bindingKey!==body.bindingKey||currentBinding?.key!==body.bindingKey)throw Error('RESOURCE_STAGE_INVALID');
    const committed=await Promise.allSettled(outputs.map(e=>dispatch(e,action,{bindingKey:body.bindingKey})));
    if(committed.some(r=>r.status==='rejected')){onFailure('Resource commit failed');throw Error('RESOURCE_COMMIT_FAILED');}
    prepared.store?.activate();if(kind==='bind')currentBinding={key:body.bindingKey,options:prepared.options};resourceStage=null;return {outputs:committed.map(r=>r.value),physicalOutput:false};
   }
   if(['bind','resources'].includes(action)&&currentBinding?.key!==body.bindingKey)throw Error('PRESENTATION_STALE_BINDING');
   if(['start','bind','resources'].includes(action)){
    if(preparedAssets){stage=await timed('host.assets.prepare',()=>preparedAssets.prepare(body.assetsManifest,['start','bind'].includes(action)?body.options:currentBinding.options),{command:action,assetCount:body.assetsManifest.assets.length});body.preparedResources=stage.resources;}
    else if(body.assetsManifest.assets.length)throw Error('RESOURCE_NOT_PREPARED');
   }
   const results=await Promise.allSettled(outputs.map(entry=>dispatch(entry,action,body)));
   if(results.some(r=>r.status==='rejected')){
    if(action==='start')await Promise.allSettled(results.map((r,i)=>r.status==='fulfilled'?dispatch(outputs[i],'stop',{bindingKey:body.bindingKey}):Promise.resolve()));
    if(action==='resources')await Promise.allSettled(outputs.map(e=>dispatch(e,'resources-abort',{bindingKey:body.bindingKey})));
    if(action==='bind')onFailure('Package rebind failed; output must stop');
    throw results.find(r=>r.status==='rejected').reason;
   }
   if(action==='resources'){
    const committed=await Promise.allSettled(outputs.map(e=>dispatch(e,'resources-commit',{bindingKey:body.bindingKey})));
    if(committed.some(r=>r.status==='rejected')){onFailure('Resource commit failed');throw Error('RESOURCE_COMMIT_FAILED');}
   }
   stage?.activate();
   if(['start','bind'].includes(action))currentBinding={key:body.bindingKey,options:body.options};
   if(action==='stop'){await lidarCancel('presentation-stop');currentBinding=null;preparedAssets?.clear();}
   return {outputs:results.map(r=>r.value),physicalOutput:false};
  }finally{stage?.discard();commandBusy=false;activeAction=null;}
 };
 try {
  const configureEntry=async(entry,requested)=>{
   const {record,spec,win,policy}=entry,expected=requested?policy.assertPlan(requested):policy.plan();
   const revision=outputControl?structuredClone(outputControl):null;
   const result=await record.configure(policy.configure(expected));
   if(win.getContentSize().some((n,i)=>n!==result.plan.transportSize[i]))win.setContentSize(...result.plan.transportSize);
   entry.appliedOutputControl=revision;entry.rendererPlan=expected;
   diag('content-size',JSON.stringify({output:spec.output.id,requested:result.plan.transportSize,actual:win.getContentSize(),mode:expected.mode}));
   return {...result,transportPlan:result.plan,plan:expected,outputControl:revision,output:spec.output.id,fps:spec.output.fps,programName:spec.output.sender+'-program',prefix:spec.output.sender.endsWith("-"+spec.output.id)?spec.output.sender.slice(0,-spec.output.id.length-1):spec.output.sender,fixtureOnly:true};
  };
  ipcMain.handle('probe-configure',async event=>configureEntry(owner(event)));
  ipcMain.handle('probe-output-control',event=>{owner(event);return outputControl?structuredClone(outputControl):null;});
  ipcMain.handle('probe-set-output-plan',async(event,requested)=>configureEntry(owner(event),requested));
  ipcMain.handle('probe-present',async(event,id,drawMetadata)=>{const {win,record,spec,appliedOutputControl,rendererPlan}=owner(event);if(!Number.isSafeInteger(id)||id<1)throw Error('Invalid frame id');const metadataValid=drawMetadata&&drawMetadata.planEpoch===record.epoch&&typeof drawMetadata.backgroundDrawn==='boolean'&&typeof drawMetadata.ready==='boolean'&&matchesPlanOutputSettings(drawMetadata.outputSettings,rendererPlan);if(drawMetadata&&!metadataValid)throw Error('OUTPUT_FRAME_METADATA_INVALID');if(metadataValid&&drawMetadata.ready&&drawMetadata.backgroundDrawn!==rendererPlan.backgroundEnabled)throw Error('OUTPUT_BACKGROUND_EVIDENCE_MISMATCH');if(!record.last||record.last.frameId<id)win.webContents.invalidate();const ack=await timed('host.native.present',()=>record.present(id),{frameId:id,output:spec.output.id});const senders=ack.accepted===true?(rendererPlan?.mode==='layers'?(ack.routes??[]).map(r=>({name:r.name,alpha:r.alpha==='premultiplied'})):ack.published?[{name:record.name,alpha:false}]:[]):[];const gameEvidence=metadataValid?maxGameFrameEvidence({output:spec.output.id,metadata:drawMetadata,plan:rendererPlan,epoch:record.epoch,ack,senders}):null;onFrame({...(gameEvidence??{}),rendererBootId,output:spec.output.id,frameId:ack.frameId,accepted:ack.accepted===true,published:ack.published===true,outputControl:appliedOutputControl,senders,outputReady:metadataValid&&drawMetadata.ready===true,backgroundDrawn:metadataValid?drawMetadata.backgroundDrawn:null,fixtureOnly:true,status:record.snapshot()});return {frameId:ack.frameId,accepted:ack.accepted===true,published:ack.published===true,activeSenders:senders.length};});
  ipcMain.on('lidar-cancel-complete',lidarComplete);
  ipcMain.on('probe-fault',fault);
  ipcMain.on('presentation-complete',complete);ipcMain.on('presentation-ready',ready);
  for(const spec of settings.outputs??[settings]){
  const win=new BrowserWindow({show:false,transparent:true,backgroundColor:'#00000000',width:spec.plan.transportSize[0],height:spec.plan.transportSize[1],useContentSize:true,webPreferences:{partition:`w3-${spec.output.id.toLowerCase()}-probe`,preload:path.join(base,'preload.cjs'),offscreen:{useSharedTexture:true,sharedTexturePixelFormat:'argb'},backgroundThrottling:false,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.webContents.setAudioMuted(true);
  // Track window before opening native channel so startup failure still closes it.
  const entry={win,spec,record:null,policy:createOutputPolicy(spec.output,()=>outputControl)};entry.readyPromise=new Promise(resolve=>{entry.resolveReady=resolve;});outputs.push(entry);const record=entry.record=hub.open(spec.output.sender,onFailure);
  win.webContents.setFrameRate(spec.output.fps);win.webContents.setZoomFactor(1);
  let lastPaint=null;win.webContents.on('paint',event=>{if(event.texture){const at=performance.now(),span=trace.begin('host.paint',{output:spec.output.id,gapMs:lastPaint===null?null:at-lastPaint});lastPaint=at;try{record.paint(event.texture);}finally{trace.end(span);}}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  win.webContents.session.setPermissionCheckHandler(()=>false);
  win.webContents.session.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!(details.url.startsWith(origin+'/')||(spec.output.id==='MAX_RIGHT'&&details.url.startsWith('http://127.0.0.1:9573/'))||(details.resourceType==='image'&&details.url.startsWith('data:image/svg+xml')))}));
  win.webContents.on('render-process-gone',(_event,details)=>{trace.emit('output.process-gone',{reason:details.reason,exitCode:details.exitCode});diag('process-gone',JSON.stringify(details));onFailure('Renderer process exited');});
  win.webContents.on('console-message',event=>{const message=String(event.message);if(consumeFrameTiming(message,spec.output.id,trace))return;if(message.startsWith('[native:media-prepare] ')){try{const m=JSON.parse(message.slice(23));trace.emit('media.prepare',{output:spec.output.id,itemId:m.itemId,kind:m.kind,status:m.status,elapsedMs:m.elapsedMs});}catch{}}else if(message.startsWith('[native:media-fallback] '))trace.emit('media.fallback',{output:spec.output.id,detail:message.slice(0,240)});diag('console',`${spec.output.id} ${event.level} ${event.sourceId}:${event.lineNumber} ${event.message}`);if(event.level==='error'&&!(spec.output.id==='MAX_RIGHT'&&String(event.sourceId).startsWith('http://127.0.0.1:9573/')))onFailure('Renderer console error');});
  win.once('closed',()=>{trace.emit('output.closed',{intentional:!!closing});if(!closing)onFailure('Output window closed');});
  await win.loadURL(origin+'/');
  }
  if(settings.mode==='role-artistic-external'){
   let timer;try{await Promise.race([Promise.all(outputs.map(e=>e.readyPromise)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('PRESENTATION_START_TIMEOUT')),12000);})]);}finally{clearTimeout(timer);}
  }
  return {close,command,lidarFrame,lidarCancel,setOutputControl(envelope){const roles=(settings.outputs??[settings]).map(s=>s.output.id);if(roles.length!==1)throw Error('OUTPUT_CONTROL_SINGLE_ROLE_REQUIRED');const next=validateOutputEnvelope(envelope,roles[0]);outputControl=next;for(const {win} of outputs)if(!win.isDestroyed())win.webContents.send('output-control',structuredClone(next));},snapshot:()=>({fixtureOnly:true,physicalOutputVerified:false,outputControl:outputControl?structuredClone(outputControl):null,outputs:outputs.map(({spec,record,ready,appliedOutputControl})=>({output:spec.output.id,presentationReady:ready===true,audioMuted:true,appliedOutputControl,...record.snapshot()}))})};
 } catch(error) {diag('startup',error);await close();throw error;}
}
