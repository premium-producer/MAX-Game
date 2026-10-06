import {createPresentationClient} from './presentation.mjs';
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHELL='/max-game/webgl-v5/index.html?backend=server&shell=1';
export function manualEntry(context,origin){
 if(context?.schemaVersion!==1||context.apiOrigin!==origin||context.presentation?.backgroundOnly===true||context.active!==true||context.show?.automatic===true||!ID.test(context.assignmentId??'')||!ID.test(context.sessionId??''))return null;
 const expected='/max-game/webgl-v5/index.html?'+new URLSearchParams({backend:'server',assignment:context.assignmentId,session:context.sessionId});
 if(context.entry!==expected)return null;
 return {key:JSON.stringify([context.datasetIdentity?.instanceKey,context.assignmentId,context.sessionId,context.contentRevision]),url:expected};
}
export function brokerMatches(context,control){
 const b=control?.binding,p=control?.projection;
 const validRun=Number.isSafeInteger(p?.runId)&&p.runId>=0||typeof p?.runId==='string'&&p.runId.length>0;
 return !!b&&!!p&&validRun&&b.assignmentId===context.assignmentId&&b.sessionId===context.sessionId&&b.contentRevision===context.contentRevision&&p.contentRevision===context.contentRevision&&b.datasetInstanceKey===context.datasetIdentity?.instanceKey;
}
export function createManualHost({document=globalThis.document,window=globalThis.window,fetchImpl=globalThis.fetch,setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now,origin=window.location.origin,parentOrigin='http://127.0.0.1:9576',rendererBootId=globalThis.crypto.randomUUID(),nextFrame=()=>new Promise(resolve=>window.requestAnimationFrame(resolve))}={}){
 let frame=null,mode=null,pollTimer,fadeTimer,disposed=false,stopping=false,request=null,nativeShow=null,visible=false,desired=null;
 let bootStarted=0,retries=0,retryAt=0,autoResumed=false,lastShellVisible=null,frameLoaded=false;
 let assetsApplied=null;
 const assetsKey=s=>`${s.owner??''}:${s.revision}:${s.modeEpoch}:${s.settingsRevision??0}`;
 const presentation=createPresentationClient({fetchImpl,rendererBootId,nextFrame});
 const settled=()=>new Promise(resolve=>setTimer(resolve,300));
 const acknowledge=(state,signal)=>presentation.applied(state,settled,signal);
 const notify=active=>{if(visible===active)return;visible=active;window.parent?.postMessage({type:'max-mobile:visibility',active},parentOrigin);};
 const missionReady=context=>window.parent?.postMessage({type:'max-mobile:mission-ready',mission:context?{
  assignmentId:context.assignmentId,sessionId:context.sessionId,contentRevision:context.contentRevision,
  datasetInstanceKey:context.datasetIdentity?.instanceKey}:null},parentOrigin);
 const send=(type,extra={})=>frame?.contentWindow?.postMessage({type,...extra},origin);
 function shellVisible(active){if(mode==='manual'&&lastShellVisible!==active){lastShellVisible=active;send('max-managed-visibility',{visible:active});}}
 function hide(){missionReady(null);if(frame)frame.style.opacity='0';shellVisible(false);notify(false);}
 function stopAuto(){if(mode==='auto'&&autoResumed){send('max-show:close',{requestId:'max-mobile-close'});autoResumed=false;}}
 function remove(){frame?.remove();frame=null;mode=null;autoResumed=false;lastShellVisible=null;frameLoaded=false;assetsApplied=null;}
 function ensure(nextMode){
  if(mode===nextMode&&frame)return true;
  if(frame){
   hide();stopAuto();
   if(fadeTimer===undefined)fadeTimer=setTimer(()=>{fadeTimer=undefined;remove();},300);
   return false;
  }
  const item=document.createElement('iframe');item.title='MAX';item.allow='autoplay';item.src=nextMode==='manual'?SHELL:'/max-show/';item.style.opacity='0';
  frame=item;mode=nextMode;bootStarted=now();lastShellVisible=null;autoResumed=nextMode==='auto';frameLoaded=false;
  item.addEventListener('load',()=>{
   if(frame!==item||disposed)return;
   // Initial about:blank may report complete before the actual document loads.
   try{frameLoaded=new URL(item.contentDocument.URL).href===new URL(item.src,origin).href;}catch{frameLoaded=false;}
   lastShellVisible=null;if(mode==='manual')shellVisible(false);
  });
  document.body.append(item);return true;
 }
 function dataset(){try{return frame?.contentDocument?.documentElement?.dataset??{};}catch{return {};}}
 function bootRetry(){
  const data=dataset();
  if(data.gameReady==='true'){retries=0;return false;}
  if(data.assetPreparation!=='failed'&&now()-bootStarted<45000)return false;
  hide();
  if(retryAt&&now()>=retryAt){remove();retryAt=0;}
  else if(!retryAt&&retries<3)retryAt=now()+1000*(++retries);
  return true;
 }
 async function read(path,signal){const r=await fetchImpl(path,{cache:'no-store',signal});if(!r.ok)throw Error('CONTEXT_UNAVAILABLE');return r.json();}
 async function poll(){
  if(disposed||stopping)return;
  const controller=new AbortController();request=controller;const timeout=setTimer(()=>controller.abort(),2500);
  try{
   const context=await read('/bridge/context',controller.signal);if(disposed||stopping)return;
   if(context?.schemaVersion!==1||context.apiOrigin!==origin)throw Error('CONTEXT_UNAVAILABLE');
   context.presentation=await presentation.accept(context.presentation,controller.signal);
   if(disposed||stopping)return;
   if(context.presentation.backgroundOnly===true){
    desired=null;hide();stopAuto();
    // Keep the prepared renderer and its resources for the next standard mode.
    clearTimer(fadeTimer);fadeTimer=undefined;
    await acknowledge(context.presentation,controller.signal);return;
   }
   if(context.presentation.desiredMode==='assets'){
    missionReady(null);
    desired='assets';
    if(!ensure('manual')||bootRetry())return;
    if(dataset().gameReady!=='true'){hide();return;}
    // The game independently reads the same role-bound authority; this message
    // correlates its actual settled frame with this host's attachment epoch.
    send('max-assets:scene',context.presentation);
    // Permit preparation on the existing clock while keeping an old assignment
    // or loading document invisible until this owner has cleared its source scene.
    shellVisible(true);
    if(dataset().independentOwner!==context.presentation.owner){frame.style.opacity='0';notify(false);return;}
    frame.style.opacity='1';notify(true);
    if(assetsApplied===assetsKey(context.presentation))await acknowledge(context.presentation,controller.signal);
    return;
   }
   assetsApplied=null;
   // Standard preserves existing automatic assignments until their dedicated
   // operator mode is introduced; MASTER remains the admission authority.
   if(context.active&&context.show?.automatic===true){
    missionReady(null);
    desired=context.show.runId;
    const wall=nativeShow?.runId===context.show.runId&&nativeShow?.phase==='wall';
    if(!wall){hide();stopAuto();return;}
    if(!ensure('auto'))return;
    if(!autoResumed){send('max-show:resume');autoResumed=true;}
    frame.style.opacity='1';notify(true);
    if(frameLoaded&&frame.contentDocument?.readyState==='complete')await acknowledge(context.presentation,controller.signal);
    return;
   }
   const entry=manualEntry(context,origin);desired=entry?.key??null;
   if(!ensure('manual'))return;
   if(bootRetry())return;
   if(!entry){hide();if(dataset().gameReady==='true')await acknowledge(context.presentation,controller.signal);return;}
   if(context.mobileControl?.enabled===true){
    const control=await read('/mobile-wall/control',controller.signal);if(disposed||stopping)return;
    if(!brokerMatches(context,control)){hide();return;}
   }
   const data=dataset();
   if(data.gameReady!=='true'||data.managedBinding!==context.assignmentId){hide();return;}
   frame.style.opacity='1';shellVisible(true);notify(true);
   await acknowledge(context.presentation,controller.signal);
   if(!disposed&&!stopping&&desired===entry.key&&dataset().managedBinding===context.assignmentId)missionReady(context);
  }catch(error){
   missionReady(null);
   // Losing the authority response does not select a different visible mode.
   // No ACK is sent; existing session/lease guards still govern gameplay input.
   if(!disposed)window.dispatchEvent?.(new CustomEvent('max-launch-diagnostic',{detail:{event:'presentation-error',code:error.message}}));
  }
  finally{clearTimer(timeout);request=null;if(!disposed&&!stopping)pollTimer=setTimer(()=>void poll(),500);}
 }
 function dispose(){if(disposed)return;disposed=true;presentation.close();request?.abort();clearTimer(pollTimer);clearTimer(fadeTimer);hide();stopAuto();remove();window.removeEventListener('message',message);window.removeEventListener('pagehide',dispose);}
 function message(event){
  if(event.origin===origin&&event.source===frame?.contentWindow&&event.data?.type==='max-assets:applied'){
   const data=event.data;if(typeof data.owner==='string'&&Number.isSafeInteger(data.revision)&&Number.isSafeInteger(data.modeEpoch)&&Number.isSafeInteger(data.settingsRevision)&&data.sceneKey===assetsKey(data))assetsApplied=data.sceneKey;
   return;
  }
  if(event.origin===origin&&event.source===frame?.contentWindow&&event.data?.type==='max-assets:error'){
   window.dispatchEvent?.(new CustomEvent('max-launch-diagnostic',{detail:{event:'assets-error',code:String(event.data.code??'ASSET_PREPARATION_FAILED').slice(0,128)}}));return;
  }
  if(event.origin!==parentOrigin||event.source!==window.parent)return;
  if(event.data?.type==='max-lidar:cancel'&&typeof event.data.requestId==='string'&&/^[a-f0-9-]{36}$/.test(event.data.requestId)){
   // This frame and the gameplay frame share the adapter origin. Cancel the
   // actual captured gesture before native mouse release; no game command.
   try{if(mode==='manual'&&frame?.contentWindow)frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('max-service-pointer-cancel'));}
   finally{window.parent?.postMessage({type:'max-lidar:cancelled',requestId:event.data.requestId},parentOrigin);}
   return;
  }
  if(event.data?.type==='max-mobile:stop'){
   if(stopping||disposed)return;stopping=true;request?.abort();clearTimer(pollTimer);clearTimer(fadeTimer);hide();stopAuto();fadeTimer=setTimer(dispose,300);return;
  }
  if(event.data?.type==='max-mobile:show-timing'){
   const value=event.data.show;nativeShow=value&&typeof value.runId==='string'&&['tags','ribbon','wall'].includes(value.phase)?value:null;
   if(mode==='auto'&&(!nativeShow||nativeShow.phase!=='wall')){hide();stopAuto();}
  }
 }
 window.addEventListener('message',message);window.addEventListener('pagehide',dispose);
 window.parent?.postMessage({type:'max-mobile:visibility',active:false},parentOrigin);void poll();
 return {dispose,snapshot:()=>({desired,mode,visible,retries,disposed,presentation:presentation.snapshot()})};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createManualHost();
