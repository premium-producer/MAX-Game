import {transitionReload} from './kdw-standby-cover.mjs';
import {imageSource,requestImageSource} from './kdw-graceful-media.mjs';
import {readWithRecovery} from './kdw-runtime-health.mjs';
// Portable host boundary: the mission core remains the sole game state machine.
let binding=null;
let queueCount=null,queueReadAt=-Infinity;
const acceptQueue=value=>{queueCount=Number.isSafeInteger(value)&&value>=0?value:null;queueReadAt=performance.now();};
export function linkedQueueCount(){return performance.now()-queueReadAt<=5000?queueCount:null;}
export function linkedVisitorAvatar(){return binding?.avatar??'./assets/kdw-native/conversation/visitor-avatar.svg';}
const api=async(url,options={})=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(4000),cache:'no-store'});if(!r.ok)throw Error('GAME_LINK_'+r.status);return r.json();};
export async function loadGameLink(params){
 if(params.get('backend')==='server'||params.get('test')==='memory'||params.has('interaction')||params.get('link')==='0'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&params.get('link')!=='1')return null;
 let game;try{const active=await (document.documentElement.dataset.production==='true'?readWithRecovery(()=>api('/__kdw/link/active')):api('/__kdw/link/active'));game=active.game;acceptQueue(active.queueCount);}catch{if(params.get('link')==='1'){const message='Нет связи с сохранённой игрой. Перезапустите MAX.';console.error('MAX_LINK_PREPARATION_RETRY');throw Error('MAX_LINK_PREPARATION_RETRY');}return null;}
 if(!game){binding=null;delete document.documentElement.dataset.gameId;delete document.documentElement.dataset.voiceSessionId;if(params.get('link')==='1'){params.delete('session');params.delete('link');const u=new URL(location.href);u.search=params.toString();history.replaceState(null,'',u);}if(document.documentElement.dataset.production==='true')params.set('session','idle.'+crypto.randomUUID());return{game:null,assets:[],enabled:true};}
 const manifest=await readWithRecovery(()=>api(`/__kdw/link/games/${game.gameId}/assets`));
 if(manifest.gameId!==game.gameId)throw Error('GAME_LINK_CONTEXT_CONFLICT');
 params.set('session',game.gameId);params.set('link','1');
 const u=new URL(location.href);u.search=params.toString();history.replaceState(null,'',u);
 const avatar=manifest.assets.find(a=>a.original.endsWith('/visitor-avatar.svg'));if(!avatar)throw Error('GAME_LINK_AVATAR_MISSING');
 binding={game,assets:manifest.assets,enabled:true,avatar:'./'+avatar.path};
 document.documentElement.dataset.gameId=game.gameId;document.documentElement.dataset.voiceSessionId=game.voiceSessionId;
 return binding;
}
export function linkedCatalog(catalog,link){
 if(!link?.game)return catalog;
 const copy=structuredClone(catalog),byPath=new Map(link.assets.map(a=>[a.original,a]));
 for(const a of Object.values(copy.assets)){const replacement=byPath.get(a.path);if(replacement){a.path=replacement.path;a.sha256=replacement.sha256;}}
 return copy;
}
export async function resumeLinkedMission(session,link){
 if(!link?.game)return;
 if(session.snapshot.state.sessionId!==link.game.gameId)throw Error('GAME_LINK_SESSION_CONFLICT');
 if(session.snapshot.state.status==='menu'&&!session.snapshot.state.missionId){const result=await session.command('SELECT_MISSION',{missionId:link.game.gameMissionId});if(!result?.reply.ok)throw Error('GAME_LINK_SELECTION_FAILED');}
}
export function watchGameLink({link,getSession,onPhotoChange=()=>{},onChange=()=>void transitionReload()}){
 if(!link?.enabled)return()=>{};
 let stopped=false,running=false,photoLoading=false;
 const replacements=new Map();
 const photoKey=src=>{try{const u=new URL(src,document.baseURI);return u.origin===location.origin&&u.pathname.includes('/kdw-linked/'+link.game?.gameId+'/')?u.pathname.replace(/\/(?:[a-f0-9]{64}|none)\/(conversation|visitor-details)\//,'/$1/'):null;}catch{return null;}};
 const applyPhotos=()=>{if(stopped||binding!==link)return;for(const el of document.querySelectorAll('img')){if(el.dataset.mediaGhost)continue;const next=replacements.get(photoKey(imageSource(el)));if(next&&imageSource(el)!==next){requestImageSource(el,next);onPhotoChange();}}};
 const observer=new MutationObserver(applyPhotos);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
 async function refreshPhoto(game){
  const revision=game?.photoRevision??game?.photoSha256;
  if(photoLoading||!revision||revision==='none'||revision===(link.game?.photoRevision??link.game?.photoSha256))return;photoLoading=true;
  try{const manifest=await api(`/__kdw/link/games/${game.gameId}/assets`);if(manifest.gameId!==game.gameId)throw Error('GAME_LINK_CONTEXT_CONFLICT');
   const decoded=new Map();let cursor=0;
   await Promise.all(Array.from({length:2},async()=>{while(cursor<manifest.assets.length){const a=manifest.assets[cursor++],image=new Image();image.src='./'+a.path;let timeout;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('PHOTO_DECODE_TIMEOUT')),4000);})]);}finally{clearTimeout(timeout);}decoded.set(photoKey(image.src),image.src);}}));
   if(stopped||binding!==link||link.game.gameId!==game.gameId)return;
   for(const [key,value]of decoded)if(key)replacements.set(key,value);
   link.game.photoSha256=game.photoSha256;link.game.hasPhoto=game.hasPhoto;link.game.avatarSha256=game.avatarSha256;link.game.hasAvatar=game.hasAvatar;link.game.photoRevision=revision;link.assets=manifest.assets;
   const avatar=manifest.assets.find(a=>a.original.endsWith('/visitor-avatar.svg'));if(avatar)link.avatar='./'+avatar.path;
   applyPhotos();
  }catch{/* Keep the neutral resources; retry while this same visitor is active. */}finally{photoLoading=false;}
 }

 async function tick(){if(stopped||running)return;running=true;try{
  const session=getSession(),state=session?.snapshot?.state;
  if(!link.game&&state&&state.status!=='menu')return;
  if(link.game&&state&&state.sessionId===link.game.gameId){
   try{await api(`/__kdw/link/games/${link.game.gameId}/progress`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gameId:state.sessionId,revision:state.revision,runId:state.runId,status:state.status,missionId:state.missionId,taskId:state.taskId,screenId:state.screenId,contentRevision:state.contentRevision,endReason:state.standEndReason??null})});}catch(error){if(error.message!=='GAME_LINK_409')throw error;}
  }
  const active=await api('/__kdw/link/active'),{game}=active;if(stopped)return;acceptQueue(active.queueCount);if((game?.gameId??null)!==(link.game?.gameId??null)){stopped=true;onChange();}
  if(!stopped&&game?.gameId===link.game?.gameId)void refreshPhoto(game);
  if(!stopped&&!game&&document.documentElement.dataset.production==='true'){const policy=await api('/__kdw/settings');if(policy.revision!==document.documentElement.dataset.standSettings){stopped=true;onChange();}}
 }catch{/* Durable game state and pending delivery survive temporary outages. */}finally{running=false;}}
 const timer=setInterval(()=>void tick(),1200);void tick();return()=>{stopped=true;clearInterval(timer);observer.disconnect();replacements.clear();if(binding===link)binding=null;};
}

export async function claimLinkedMission(link){if(!link?.game)return;try{await api(`/__kdw/link/games/${link.game.gameId}/claim`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gameId:link.game.gameId})});}catch(error){if(error.message==='GAME_LINK_409')void transitionReload();throw error;}}
