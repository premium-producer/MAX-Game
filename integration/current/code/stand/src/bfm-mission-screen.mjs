import {sharedTaskMarkup,warmSharedAssets} from './journey-shared-ui.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const missionViewKey=s=>[s.missionId,s.runId,s.status,s.taskId,s.screenId].join(':');
export function missionScreenMarkup(snapshot,catalog){
 const {state,view}=snapshot;
 if(['task','result'].includes(state.status))return sharedTaskMarkup(snapshot,{token:missionViewKey(state),title:catalog.tasks[state.taskId].title,resultText:state.progress[state.missionId].skipped.includes(state.taskId)?'Задание пропущено: не хватает материалов.':'Задание выполнено.'});
 if(view.result){
  const qr=view.qr;
  return `<section class="mission-finish"><h1>${escape(view.result.title)}</h1><p>${escape(view.result.text)}</p>${qr?.asset?`<img class="mission-qr" src="./${escape(qr.asset.path)}" alt="${escape(qr.label)}"><p class="qr-label">${escape(qr.label)}</p>`:''}<button class="pill" data-return-menu>К миссиям</button></section>`;
 }
 if(state.status==='expired')return '<section class="mission-finish"><h1>Время миссии истекло</h1><button class="pill" data-restart-mission>Начать заново</button><button class="pill" data-return-menu>К миссиям</button></section>';
 throw Error(`Unsupported mission state: ${state.status}`);
}
export function warmMission(snapshot,catalog){
 const first=snapshot.state.taskId??catalog.missions[snapshot.state.missionId]?.taskIds[0],task=catalog.tasks[first];
 const resources=[snapshot.view.device?.asset,...snapshot.view.prepareNext??[],...Object.values(task?.screens??{}).slice(0,4).map(s=>catalog.assets[s.assetId])];
 void warmSharedAssets(resources);
}
/** Await actual incoming DOM images, not only an earlier cache entry. */
export async function decodeMissionImages(root,signal){
 signal.throwIfAborted();
 let abort;
 const cancelled=new Promise((_,reject)=>{abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});});
 try{await Promise.race([Promise.all([...root.querySelectorAll('img')].map(image=>image.decode())),cancelled]);signal.throwIfAborted();}
 finally{signal.removeEventListener('abort',abort);}
}
// Backend owns advancement. This gate only prevents skipping an unshown frame.
export function presentationAllowsPoll(snapshot,{ready=false,visibleMs=0}={}){
 const s=snapshot?.state;if(!s)return false;
 if(s.status==='scan')return true;
 if(!ready)return false;
 if(s.status==='result')return visibleMs>=800;
 if(s.status==='task')return visibleMs>=Math.max(0,snapshot.view.automaticMs??0);
 return false;
}
