import {transitionReload} from './kdw-standby-cover.mjs';
import {onActivityContact} from './activity-webgl/activity-runtime.mjs';
import {readWithRecovery,monitorPreparation} from './kdw-runtime-health.mjs';
export async function readStandSettings(params){
 if(params.has('layout-preview')){
  const r=await fetch('/__kdw/layout/preview-settings?token='+encodeURIComponent(params.get('layout-preview')),{cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!r.ok)throw Error('Предпросмотр истёк. Откройте его заново из админки');
  params.set('test','memory');params.set('link','0');params.set('backend','local');params.set('dev','1');
  const style=document.createElement('style');style.textContent='html[data-layout-preview] .v5-brand,html[data-layout-preview] .reference-brand-right{display:none!important}';document.head.append(style);
  document.documentElement.dataset.layoutPreview='true';return null;
 }
 const read=async()=>{const r=await fetch('/__kdw/settings',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('STAND_SETTINGS_UNAVAILABLE');return r.json();};
 let settings;if(['127.0.0.1','localhost','[::1]'].includes(location.hostname))settings=await readWithRecovery(read);else try{settings=await read();}catch{return null;}
 if(!settings.production)return null;
 // The fixed shell watermark is excluded from every production scene/variant.
 const brandingStyle=document.createElement('style');brandingStyle.dataset.standBranding='true';
 brandingStyle.textContent='html[data-production="true"] .v5-brand,html[data-production="true"] .reference-brand-right{display:none!important}';document.head.append(brandingStyle);
 for(const key of ['debug','dev','interaction','test','review','service','mobile','session','link','shell','assignment','pixel-map-debug'])params.delete(key);
 params.set('backend','local');params.set('dev','0');
 document.documentElement.dataset.production='true';document.documentElement.dataset.standEntryMode=settings.value.max.entryMode;document.documentElement.dataset.standSettings=settings.revision;return settings;
}
export function productionCatalog(catalog,policy){return policy?{...catalog,contentRevision:catalog.contentRevision+'.stand-v1.'+policy.revision,kdwProduction:{production:true,revision:policy.revision,value:policy.value}}:catalog;}
export async function selectManualMission(missionId){
 const r=await fetch('/__kdw/link/manual',{method:'POST',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json'},body:JSON.stringify({missionId})});if(!r.ok){const detail=await r.json().catch(()=>null);throw Error('MANUAL_SELECTION_'+r.status+(detail?.error?':'+detail.error:''));}await transitionReload();
}
export function startProduction({getSession,ready,active=()=>true}){
 let busy=false,disposed=false,lastTouch=0;
 const touch=e=>{if(!e.isTrusted)return;const s=getSession()?.snapshot?.state;if(!s?.standPolicy||!['task','result'].includes(s.status)||Date.now()-lastTouch<250)return;lastTouch=Date.now();void getSession().command('STAND_TOUCH').catch(()=>{});};
 // Installed after pixel-map capture filtering. Hover and synthetic events do not count.
 document.addEventListener('pointerdown',touch);document.addEventListener('pointermove',move);
 const stopActivityContact=onActivityContact(touch);
 function move(e){if(e.buttons)touch(e);}
 async function tick(){if(disposed||busy)return;const session=getSession(),s=session?.snapshot?.state;if(!s?.standPolicy)return;busy=true;try{
  if(!s.standReady&&ready(s))await session.command('STAND_READY',{screenId:s.screenId??s.status});
  await session.poll(Date.now(),{pauseResult:true});
 }catch(error){console.error('MAX production clock',error);}finally{busy=false;}}
 const timer=setInterval(()=>void tick(),100),stopHealth=monitorPreparation(()=>getSession()?.snapshot?.state,{active});
 return()=>{disposed=true;clearInterval(timer);stopHealth();stopActivityContact();document.removeEventListener('pointerdown',touch);document.removeEventListener('pointermove',move);};
}
