export const V5_DEVICE_TIMER=Object.freeze({width:360,height:160,radius:64});

// Use the route's two left-hand slots, never the icons' animated poses.
// The device pose already includes its shared motion and camera offset.
export function v5DeviceTimerRect({left,top},nodeWidth,gap){
 return {left:left-nodeWidth-gap*1.5-V5_DEVICE_TIMER.width/2,top,width:V5_DEVICE_TIMER.width,height:V5_DEVICE_TIMER.height};
}

export const V5_SCAN_WAIT_MS=30000;
export function v5PalmWaitRects({left,top,width,height}){
 const centerX=left+width/2,centerY=top+height/2;
 const timer={left:centerX-Math.max(500,width)/2-64-V5_DEVICE_TIMER.width,top:centerY-V5_DEVICE_TIMER.height/2,...V5_DEVICE_TIMER};
 return {timer,queue:{...timer,left:timer.left-48-V5_DEVICE_TIMER.width}};
}
const contextScope=context=>JSON.stringify([context?.assignmentId,context?.sessionId]);
// The host owns deadlines. The renderer only projects its last server timestamp
// using elapsed performance time; waiting and task completion stay authoritative.
export function createV5ScanWaitClock(){
 let context=null,receivedAt=0,lastRead=-1,queue=null,queueAt=-Infinity,lastQueueRead=-1;
 return {
  acceptContext(next,at,read){
   if(read<lastRead)return false;
   if(contextScope(next)!==contextScope(context))queue=null;
   context=next;receivedAt=at;lastRead=read;return true;
  },
  scope:()=>contextScope(context),
  acceptQueue(value,scope,read,at=receivedAt){
   if(scope!==contextScope(context)||read<lastQueueRead)return false;
   lastQueueRead=read;
   queue=value?.game?.assignmentId===context?.assignmentId&&value?.game?.sessionId===context?.sessionId&&value?.monitor?.connection==='connected'&&value.monitor.stale===false&&Array.isArray(value.monitor.queued)?value.monitor.queued.length:null;queueAt=at;
   return true;
  },
  view(snapshot,at){
   const state=snapshot?.state,assignmentId=snapshot?.assignment?.receipt?.assignmentId;
   const visible=!!state&&state.scanned!==true&&state.status==='scan';
   const matches=visible&&assignmentId===context?.assignmentId&&state.sessionId===context?.sessionId;
   const wait=matches?context?.scanWait:null;
   const armed=!!(wait?.protocol==='max-scan-wait-v1'&&wait.runId===state?.runId&&[wait.startedAtMs,wait.untilMs,wait.serverNowMs].every(Number.isFinite)&&wait.untilMs>=wait.startedAtMs);
   return {visible,remainingMs:armed?Math.max(0,Math.min(V5_SCAN_WAIT_MS,wait.untilMs-wait.serverNowMs-Math.max(0,at-receivedAt))):V5_SCAN_WAIT_MS,queueCount:matches&&at-queueAt<=5000?queue:null,armed};
  }
 };
}

export function installV5DeviceTimerStyles(doc){
 if(doc.getElementById('v5-device-timer-style'))return;
 const style=doc.createElement('style');style.id='v5-device-timer-style';
 style.textContent=`html[data-visual=webgl-bfm-v5] #circles .guided-nav{justify-content:flex-end}
 html[data-visual=webgl-bfm-v5] #circles .v5-device-timer{
 position:absolute;left:0;top:0;width:${V5_DEVICE_TIMER.width}px;height:${V5_DEVICE_TIMER.height}px;
 display:flex;align-items:center;justify-content:center;box-sizing:border-box;
 border:1px solid #8e68e06b;border-radius:${V5_DEVICE_TIMER.radius}px;padding:42px 48px;
 background:radial-gradient(ellipse at 80% 10%,#6e1af2,#0f0621 80%);box-shadow:none;
 color:#fff;font-family:inherit;font-size:64px;font-weight:500;font-variant-numeric:tabular-nums;
 line-height:1;white-space:nowrap;text-align:center;pointer-events:none;user-select:none;
 }
 html[data-visual=webgl-bfm-v5] #circles .v5-scan-queue{font-size:40px}
 html[data-visual=webgl-bfm-v5] #circles .v5-scan-wait-timer,
 html[data-visual=webgl-bfm-v5] #circles .v5-scan-queue{
 pointer-events:none;
 }`;
 doc.head.append(style);
}
