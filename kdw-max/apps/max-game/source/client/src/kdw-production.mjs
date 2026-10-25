export async function readStandSettings(params){
 let settings;try{const r=await fetch('/__kdw/settings',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('STAND_SETTINGS_UNAVAILABLE');settings=await r.json();}catch(error){if(['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw error;return null;}
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
 const r=await fetch('/__kdw/link/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({missionId})});if(!r.ok)throw Error('MANUAL_SELECTION_'+r.status);location.reload();
}
export function startProduction({getSession,ready}){
 let busy=false,disposed=false,lastTouch=0;
 const touch=e=>{if(!e.isTrusted)return;const s=getSession()?.snapshot?.state;if(!s?.standPolicy||!['task','result'].includes(s.status)||Date.now()-lastTouch<250)return;lastTouch=Date.now();void getSession().command('STAND_TOUCH').catch(()=>{});};
 // Installed after pixel-map capture filtering. Hover and synthetic events do not count.
 document.addEventListener('pointerdown',touch);document.addEventListener('pointermove',move);
 function move(e){if(e.buttons)touch(e);}
 async function tick(){if(disposed||busy)return;const session=getSession(),s=session?.snapshot?.state;if(!s?.standPolicy)return;busy=true;try{
  if(!s.standReady&&ready(s))await session.command('STAND_READY',{screenId:s.screenId??s.status});
  await session.poll(Date.now());
 }catch(error){console.error('MAX production clock',error);}finally{busy=false;}}
 const timer=setInterval(()=>void tick(),100);
 return()=>{disposed=true;clearInterval(timer);document.removeEventListener('pointerdown',touch);document.removeEventListener('pointermove',move);};
}
