import {showStandbyCover,dismissStandbyCover,recoverBehindCover} from './kdw-standby-cover.mjs';
// Fault details stay in diagnostics. The visitor keeps a usable branded scene.
export function showRuntimeRecovery(message='MAX_PREPARATION_RETRY',retry=()=>location.reload()){
 console.error('MAX_RUNTIME_RECOVERY',String(message).slice(0,200));recoverBehindCover(retry);
}
export async function readWithRecovery(read){
 let attempt=0;
 for(;;)try{const value=await read();if(globalThis.document?.documentElement?.dataset.gameReady==='true')dismissStandbyCover();return value;}catch(error){
  if(++attempt>=3){console.error('MAX_CONNECTION_RETRY',error?.name??'Error');showStandbyCover();}
  await new Promise(resolve=>setTimeout(resolve,Math.min(5000,500*2**Math.min(attempt,4))));
 }
}
export function monitorPreparation(getState,{now=()=>performance.now(),timeoutMs=60000,onFailure=showRuntimeRecovery,active=()=>true}={}){
 let key=null,since=now(),reported=false;
 const check=()=>{
  const s=getState(),next=s?`${s.sessionId}:${s.runId}:${s.status}:${s.screenId}`:'startup';
  if(next!==key){key=next;since=now();reported=false;}
  // A paused output also pauses the reveal. It is not a failed preparation;
  // allow a complete preparation budget when presentation resumes.
  if(!active()){since=now();return;}
  const waiting=!s||(['scan','task','completed','incomplete'].includes(s.status)&&!s.standReady);
  if(waiting&&!reported&&now()-since>=timeoutMs){reported=true;onFailure();}
 };
 const timer=setInterval(check,1000);check();return()=>clearInterval(timer);
}
export const gameAudioActive=({connected,assignment,local,presented})=>connected&&presented&&(local||assignment?.lifecycle?.status==='active');
