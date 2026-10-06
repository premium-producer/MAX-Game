// Normal MAX gameplay and authored show timing; background remains independent.
export function createMaxShowOverlay(plan, {document=globalThis.document, window=globalThis.window, childOrigin='http://127.0.0.1:9573', setTimer=setTimeout, clearTimer=clearTimeout, now=()=>performance.now()}={}) {
 const layered=plan?.version===2&&plan.role==='MAX_RIGHT'&&['program','layers'].includes(plan.mode);
 const region=plan?.regions?.[0],rect=layered?[0,plan.mode==='layers'?1282:2,4096,1280]:region?.packedRect;
 if(plan?.logicalSize?.[0]!==4096||plan?.logicalSize?.[1]!==1280||(!layered&&plan.regions?.length!==1)||!Array.isArray(rect)||rect[0]!==0||![0,2,1282].includes(rect[1])||rect[2]!==4096||rect[3]!==1280)throw Error('MAX_MANUAL_OUTPUT_PLAN_UNSUPPORTED');
 const root=document.createElement('div');root.id='max-manual-overlay';
 Object.assign(root.style,{position:'absolute',left:`${rect[0]}px`,top:`${rect[1]}px`,width:`${rect[2]}px`,height:`${rect[3]}px`,overflow:'hidden',zIndex:'2',opacity:'0',pointerEvents:'none',transition:'opacity 300ms ease'});
 const iframe=document.createElement('iframe');iframe.title='MAX';iframe.allow='autoplay';
 Object.assign(iframe.style,{width:'100%',height:'100%',border:'0',display:'block',background:'transparent'});
 iframe.src=childOrigin+'/max-mobile/';root.append(iframe);document.body.append(root);
 let contentEnabled=plan.contentEnabled!==false,childVisible=false;
 let mission=null,missionKey='',missionAt=0,missionSeen=0,visibleAt=0;
 const validMission=value=>value&&Object.keys(value).sort().join(',')==='assignmentId,contentRevision,datasetInstanceKey,sessionId'&&
  [value.assignmentId,value.sessionId].every(v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v))&&
  typeof value.contentRevision==='string'&&value.contentRevision.length>0&&value.contentRevision.length<=256&&/^dataset-v1:[a-f0-9]{64}$/.test(value.datasetInstanceKey);
 function setOutputPlan(outputPlan){
  if(outputPlan?.role!=='MAX_RIGHT'||!['program','layers'].includes(outputPlan.mode)||outputPlan.logicalSize?.[0]!==4096||outputPlan.logicalSize?.[1]!==1280)throw Error('MAX_LAYER_OUTPUT_PLAN_UNSUPPORTED');
  root.style.top=outputPlan.mode==='layers'?'1282px':'2px';
  const enabled=outputPlan.contentEnabled!==false;if(enabled&&!contentEnabled)visibleAt=now();contentEnabled=enabled;visibility(childVisible);
 }
 let disposed=false,closing=false,closeTimer,resolveClose,nativeShow=null,showKey='';
 const lidarRequests=new Map();
 const sendTiming=()=>iframe.contentWindow?.postMessage({type:'max-mobile:show-timing',show:nativeShow},childOrigin);
 iframe.addEventListener('load',sendTiming);
 function visibility(active){if(active&&!childVisible)visibleAt=now();childVisible=active;root.style.opacity=active&&contentEnabled?'1':'0';root.style.pointerEvents=active&&contentEnabled?'auto':'none';if(!active){mission=null;missionKey='';}}
 function message(event){
  if(!disposed&&!closing&&event.origin===childOrigin&&event.source===iframe.contentWindow&&event.data?.type==='max-mobile:mission-ready'){
   const next=event.data.mission;
   if(!validMission(next)){mission=null;missionKey='';return;}
   const key=JSON.stringify(next);if(key!==missionKey){missionAt=now();missionKey=key;}
   missionSeen=now();mission={...next};return;
  }
  if(!disposed&&event.origin===childOrigin&&event.source===iframe.contentWindow&&event.data?.type==='max-lidar:cancelled'){const request=lidarRequests.get(event.data.requestId);if(request){clearTimer(request.timer);lidarRequests.delete(event.data.requestId);request.resolve();}return;}
  if(disposed||closing||event.origin!==childOrigin||event.source!==iframe.contentWindow||event.data?.type!=='max-mobile:visibility'||typeof event.data.active!=='boolean')return;
  visibility(event.data.active);
 }
 window.addEventListener('message',message);
 function finishClose(){if(closeTimer!==undefined)clearTimer(closeTimer);closeTimer=undefined;resolveClose?.();resolveClose=undefined;}
 return {
  setOutputPlan,
  missionEvidence(){const age=now()-missionSeen;return !disposed&&!closing&&childVisible&&contentEnabled&&mission&&age>=0&&age<=1500&&now()-Math.max(visibleAt,missionAt)>=300?{...mission}:null;},
  cancelLidar(requestId){
   if(disposed||closing)return Promise.resolve();
   return new Promise(resolve=>{const timer=setTimer(()=>{lidarRequests.delete(requestId);resolve();},180);lidarRequests.set(requestId,{timer,resolve});iframe.contentWindow?.postMessage({type:'max-lidar:cancel',requestId},childOrigin);});
  },
  update(show){
   if(disposed||closing)return;
   const next=show&&typeof show.runId==='string'&&['tags','ribbon','wall'].includes(show.phase)?{runId:show.runId,phase:show.phase}:null;
   const key=JSON.stringify(next);if(key===showKey)return;showKey=key;nativeShow=next;sendTiming();
  },
  close(){
   if(disposed||closing)return Promise.resolve();closing=true;visibility(false);
   iframe.contentWindow?.postMessage({type:'max-mobile:stop'},childOrigin);
   return new Promise(resolve=>{resolveClose=resolve;closeTimer=setTimer(finishClose,300);});
  },
  dispose(){if(disposed)return;disposed=true;for(const request of lidarRequests.values()){clearTimer(request.timer);request.resolve();}lidarRequests.clear();finishClose();window.removeEventListener('message',message);iframe.contentWindow?.postMessage({type:'max-mobile:stop'},childOrigin);root.remove();}
 };
}
