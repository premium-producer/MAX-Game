// Recovery belongs outside WebGL: it must remain usable when GPU preparation fails.
export function showRuntimeRecovery(message='Не удалось подготовить игру. Попробуйте ещё раз.',retry=()=>location.reload()){
 let panel=document.getElementById('kdw-runtime-recovery');if(panel)return;
 panel=document.createElement('section');panel.id='kdw-runtime-recovery';panel.setAttribute('role','alert');
 panel.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:#10091e;color:white;text-align:center;font:28px Arial;padding:24px';
 const text=document.createElement('p');text.textContent=message;
 const button=document.createElement('button');button.textContent='Повторить';button.style.cssText='font:inherit;padding:20px 40px;border:0;border-radius:20px;background:#2679ff;color:white';
 button.onclick=()=>{panel.remove();retry();};panel.append(text,button);document.body.append(panel);button.focus();
}
export async function readWithRecovery(read){
 for(;;){
  for(let attempt=0;attempt<3;attempt++)try{return await read();}catch{if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000));}
  await new Promise(resolve=>showRuntimeRecovery('Не удалось подключиться к игре. Проверьте запуск MAX и повторите подключение.',resolve));
 }
}
export function monitorPreparation(getState,{now=()=>performance.now(),timeoutMs=60000,onFailure=showRuntimeRecovery}={}){
 let key=null,since=now(),reported=false;
 const check=()=>{
  const s=getState(),next=s?`${s.sessionId}:${s.runId}:${s.status}:${s.screenId}`:'startup';
  if(next!==key){key=next;since=now();reported=false;}
  const waiting=!s||(['scan','task','completed','incomplete'].includes(s.status)&&!s.standReady);
  if(waiting&&!reported&&now()-since>=timeoutMs){reported=true;onFailure();}
 };
 const timer=setInterval(check,1000);check();return()=>clearInterval(timer);
}
export const gameAudioActive=({connected,assignment,local,presented})=>connected&&presented&&(local||assignment?.lifecycle?.status==='active');
