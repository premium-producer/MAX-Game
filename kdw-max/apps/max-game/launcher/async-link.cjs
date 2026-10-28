'use strict';
// V2 control messages and photographs have separate durable delivery lanes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TTL=120000,PHOTO_LIMIT=4*1024*1024,DAY=86400000;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const error=(code,status=400)=>Object.assign(Error(code),{code,status});
const read=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
function atomic(f,value){fs.mkdirSync(path.dirname(f),{recursive:true});const tmp=f+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,Buffer.isBuffer(value)?value:JSON.stringify(value),{flag:'wx',mode:0o600});fs.renameSync(tmp,f);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function reply(res,status,value){if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function bytes(req,limit){let size=0;const list=[];for await(const b of req){size+=b.length;if(size>limit)throw error('PAYLOAD_TOO_LARGE',413);list.push(b);}return Buffer.concat(list);}
async function body(req){try{return JSON.parse((await bytes(req,65536)).toString());}catch(e){if(e.code)throw e;throw error('INVALID_JSON');}}
const VARIANTS=['full','avatar'];
function photoVariant(headers){const v=headers['x-kdw-photo-variant']??'full';if(!VARIANTS.includes(v))throw error('INVALID_PHOTO_VARIANT');return v;}
function photoCheck(b,variant='full'){const size=require('./game-link.cjs').jpegSize(b),[w,h]=variant==='avatar'?[512,512]:[1080,1920];if(size.width!==w||size.height!==h||b.length>PHOTO_LIMIT)throw error('INVALID_PHOTO_SIZE');return sha(b);}
function lane(r,v){return v==='full'?{status:r.photoStatus,sha256:r.photoSha256??null,error:r.photoError??null}:r.avatarDelivery??{status:'none',sha256:null,error:null};}
function setLane(r,v,value){if(v==='full'){r.photoStatus=value.status;r.photoSha256=value.sha256;r.photoError=value.error;}else r.avatarDelivery=value;}
const terminal=r=>['released','superseded','cancelled','handoff-expired','expired'].includes(r.status);
function createAsyncHub({root,origin,now,ingest,get,active,assignment,queue,key,getOutput=()=>null,clearPhoto=r=>{r.photo=null;},validatePhoto=()=>{}}){
 const instanceId=crypto.randomUUID(),dir=path.join(root,'data/link/games'),photoDir=path.join(root,'data/link/photos');let revision=0;
 const file=id=>path.join(dir,id+'.json');
 function ready(){const o=getOutput();return{apiReachable:true,acceptingMissions:true,rendererReady:!!o?.contentReady,outputReady:!!(o?.backgroundReady&&o?.contentReady&&o.frames?.every(n=>n>0)),inputReady:!!o?.lidar?.enabled,armed:!!o?.armed,ready:!!o?.active,observedAt:now(),validForMs:4000};}
 function status(id){const r=get(id),a=assignment(r),readiness=ready();if(a.status==='invited'&&(!readiness.ready||r.progress?.status!=='scan'))a.status='unavailable';return{protocolVersion:2,receiverInstanceId:instanceId,stateRevision:++revision,gameId:id,assignment:a,readiness,photo:{status:r.photo?'stored':r.delivery?.photoExpected?'expected':'none',sha256:r.photo?.sha256??null},photos:Object.fromEntries(VARIANTS.map(v=>{const p=v==='full'?r.photo:r.avatar;return[v,{status:p?'stored':v==='full'&&r.delivery?.photoExpected?'expected':'none',sha256:p?.sha256??null}]}))};}
 function mission(b){
  if(b.schemaVersion!==2||!Number.isSafeInteger(b.selectionRevision)||b.selectionRevision<0||typeof b.photoExpected!=='boolean'||!Number.isFinite(b.remainingTtlMs)||b.remainingTtlMs<=0||b.remainingTtlMs>TTL)throw error('INVALID_V2_MISSION');
  const v=require('./game-link.cjs').validate({...b,schemaVersion:1,photo:null});
  const digest=sha(JSON.stringify({...v,selectionRevision:b.selectionRevision,photoExpected:b.photoExpected}));const previous=read(file(v.gameId));
  if(previous){if(previous.delivery?.digest!==digest)throw error('GAME_ID_CONFLICT',409);return status(v.gameId);}
  const same=fs.readdirSync(dir).filter(n=>UUID.test(n.slice(0,-5))).map(n=>read(path.join(dir,n))).filter(r=>r.voiceSessionId===v.voiceSessionId);
  if(same.some(r=>(r.delivery?.selectionRevision??-1)>=b.selectionRevision))throw error('STALE_SELECTION',409);
  ingest(v,{delivery:{protocol:2,digest,selectionRevision:b.selectionRevision,photoExpected:b.photoExpected,receivedAt:now(),deadline:now()+b.remainingTtlMs}});
  return status(v.gameId);
 }
 function storePhoto(id,revision,buffer,headers){
  const r=get(id);if(!r.delivery?.photoExpected||terminal(r)||['completed','incomplete'].includes(r.status))throw error('PHOTO_NO_LONGER_NEEDED',410);
  if(revision!=='1'||headers['x-kdw-voice-session']!==r.voiceSessionId)throw error('PHOTO_CONTEXT_CONFLICT',409);
  const variant=photoVariant(headers),field=variant==='full'?'photo':'avatar';const digest=photoCheck(buffer,variant);validatePhoto(buffer,variant);if(digest!==headers['x-kdw-photo-sha256'])throw error('PHOTO_HASH_MISMATCH');
  if(r[field]){if(r[field].sha256!==digest)throw error('PHOTO_REVISION_CONFLICT',409);return status(id);}
  const blob=id+'-'+variant+'-'+digest+'.jpg';atomic(path.join(photoDir,blob),buffer);
  r[field]={mimeType:'image/jpeg',width:variant==='avatar'?512:1080,height:variant==='avatar'?512:1920,bytes:buffer.length,sha256:digest,blob};r.updatedAt=new Date(now()).toISOString();atomic(file(id),r);return status(id);
 }
 return{status,handle(req,res){
  const url=new URL(req.url,origin);if(!url.pathname.startsWith('/__kdw/link/v2/'))return false;
  if(req.headers.origin||req.headers['x-kdw-relay-key']!==key){reply(res,403,{error:'UNAUTHORIZED'});return true;}
  const suffix=url.pathname.slice('/__kdw/link/v2/'.length),m=/^missions\/([a-f0-9-]{36})(?:\/(photo)\/(\d+)|\/(cancel))?$/.exec(suffix);
  // Slow uploads are read outside the hub's control transaction queue.
  void(async()=>{
   if(req.method==='GET'&&suffix==='capabilities')return{protocolVersion:2,latePhoto:true,photoVariants:VARIANTS,maxPhotoBytes:PHOTO_LIMIT};
   if(req.method==='GET'&&suffix==='readiness')return ready();
   if(req.method==='POST'&&suffix==='missions'){const b=await body(req);return queue(()=>mission(b));}
   if(!m||!UUID.test(m[1]))throw error('NOT_FOUND',404);
   if(req.method==='GET'&&!m[2]&&!m[4])return queue(()=>status(m[1]));
   if(req.method==='PUT'&&m[2]&&req.headers['content-type']==='image/jpeg'){const b=await bytes(req,PHOTO_LIMIT);return queue(()=>storePhoto(m[1],m[3],b,req.headers));}
   if(req.method==='POST'&&m[4])return queue(()=>{const r=get(m[1]);if(r.claimedAt)throw error('GAME_ALREADY_STARTED',409);if(!terminal(r)){r.status='cancelled';clearPhoto(r);atomic(file(m[1]),r);}active();return status(m[1]);});
   throw error('METHOD_NOT_ALLOWED',405);
  })().then(v=>reply(res,200,v)).catch(e=>reply(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}

function createAsyncRelay({root,origin,authorize,now=()=>Date.now(),transport=fetch,config}){
 const dir=path.join(root,'data/link/outbox-v2'),photos=path.join(dir,'photos');fs.mkdirSync(dir,{recursive:true});
 let closed=false,controlBusy=false,photoBusy=false;const statusCache=new Map(),polling=new Set(),nextTry=new Map(),attempts=new Map();
 const monotonic=new Map(),file=id=>{if(!UUID.test(id))throw error('INVALID_GAME_ID');return path.join(dir,id+'.json');};
 let cleaned=0;
 function rows(){const records=fs.readdirSync(dir).filter(n=>n.endsWith('.json')&&UUID.test(n.slice(0,-5))).map(n=>read(path.join(dir,n)));
  if(now()-cleaned>60000){cleaned=now();for(const r of records){if(now()-r.createdAt>DAY){endPhotos(r,'expired');atomic(file(r.gameId),r);}if(now()-r.createdAt>30*DAY){fs.unlinkSync(file(r.gameId));statusCache.delete(r.gameId);monotonic.delete(r.gameId);nextTry.delete(r.gameId);attempts.delete(r.gameId);}}}
  return records.filter(r=>now()-r.createdAt<=30*DAY);
 }
 function remaining(r){let start=monotonic.get(r.gameId);if(!start){start={wall:now(),mono:performance.now()};monotonic.set(r.gameId,start);}const elapsed=Math.max(now()-r.createdAt,performance.now()-start.mono+start.wall-r.createdAt);return now()<r.createdAt?0:Math.max(0,TTL-elapsed);}
 async function send(suffix,options={}){const c=config(),fn=c.certificatePem?((u,o)=>require('./game-link-network.cjs').pinnedFetch(u,o,c.certificatePem)):transport;const res=await fn(c.origin+'/__kdw/link/v2/'+suffix,{...options,headers:{'x-kdw-relay-key':c.key,...options.headers},signal:AbortSignal.timeout(options.method==='PUT'?6000:3000)});const b=await res.json();if(!res.ok)throw error(b.error||'GAME_UNAVAILABLE',res.status);return b;}
 function backoff(id){const n=(attempts.get(id)||0)+1;attempts.set(id,n);nextTry.set(id,now()+Math.min(10000,1000*2**Math.min(n-1,4))*(.9+Math.random()*.2));}
 function photoFile(r,v){return path.join(photos,r.gameId+(v==='full'?'':'-avatar')+'.jpg');}
 function removePhoto(r,variant){for(const v of variant?[variant]:VARIANTS){const f=photoFile(r,v);if(fs.existsSync(f))fs.unlinkSync(f);}}
 function endPhotos(r,status){for(const v of VARIANTS){const p=lane(r,v);if(['pending','expected'].includes(p.status))setLane(r,v,{...p,status});}removePhoto(r);}
 function expire(r){r.failure='HANDOFF_EXPIRED';endPhotos(r,'expired');atomic(file(r.gameId),r);}
 async function poll(id){if(polling.has(id)||closed)return;polling.add(id);try{const s=await send('missions/'+id);if(s.gameId!==id)throw error('INVALID_GAME_ACK');if(!closed)statusCache.set(id,{...s,at:now()});}catch{statusCache.delete(id);}finally{polling.delete(id);}}
 function local(r){const s=statusCache.get(r.gameId),fresh=s&&now()-s.at<5000;return{protocolVersion:2,gameId:r.gameId,status:r.failure?'failed':r.acceptedAt?'delivered':'queued',error:r.failure??null,assignment:fresh?s.assignment:null,readiness:fresh?s.readiness:null,photoStatus:r.photoStatus,photos:Object.fromEntries(VARIANTS.map(v=>[v,lane(r,v)]))};}
 async function flush(){if(closed||controlBusy)return;controlBusy=true;try{
  for(const item of rows()){
   if(closed)break;let r=read(file(item.gameId));
   if(r.cancelRequested&&!r.cancelDone){try{await send('missions/'+r.gameId+'/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});r.cancelDone=true;atomic(file(r.gameId),r);}catch(e){if([404,409,410].includes(e.status)){r.cancelDone=true;atomic(file(r.gameId),r);}}continue;}
   if(r.failure)continue;
   if(r.acceptedAt){if(VARIANTS.some(v=>lane(r,v).status==='pending'))void poll(r.gameId);continue;}
   const ttl=remaining(r);if(ttl<=0){expire(r);continue;}if(now()<(nextTry.get(r.gameId)||0))continue;
   try{const s=await send('missions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...r.mission,remainingTtlMs:ttl})});if(closed)return;if(s.gameId!==r.gameId)throw error('INVALID_GAME_ACK');
    r=read(file(r.gameId));if(r.failure)continue;r.acceptedAt=now();atomic(file(r.gameId),r);statusCache.set(r.gameId,{...s,at:now()});nextTry.delete(r.gameId);
   }catch(e){if(closed)return;r=read(file(r.gameId));if(!r.failure){r.lastError=e.code||'GAME_UNAVAILABLE';if([400,409,410].includes(e.status)&&!['HANDOFF_DISABLED','QUEUE_FULL'].includes(e.code)){r.failure=e.code;endPhotos(r,'failed');}atomic(file(r.gameId),r);backoff(r.gameId);}}
  }
 }finally{controlBusy=false;}}
 async function flushPhotos(){if(closed||photoBusy)return;photoBusy=true;try{for(const item of rows())for(const variant of VARIANTS){
  if(closed)break;let r=read(file(item.gameId));let p=lane(r,variant);if(r.failure||!r.acceptedAt||p.status!=='pending')continue;
  const s=statusCache.get(r.gameId);if(remaining(r)<=0&&!(s&&now()-s.at<5000&&s.assignment?.status==='playing')){setLane(r,variant,{...p,status:'expired'});removePhoto(r,variant);atomic(file(r.gameId),r);continue;}
  const retryKey='photo:'+r.gameId+':'+variant;if(now()<(nextTry.get(retryKey)||0))continue;
  try{const b=fs.readFileSync(photoFile(r,variant));const result=await send('missions/'+r.gameId+'/photo/1',{method:'PUT',headers:{'Content-Type':'image/jpeg','x-kdw-voice-session':r.mission.voiceSessionId,'x-kdw-photo-sha256':p.sha256,'x-kdw-photo-variant':variant},body:b});if(closed)return;
   const ack=result.photos?.[variant]??(variant==='full'?result.photo:null);if(result.gameId!==r.gameId||ack?.sha256!==p.sha256||ack.status!=='stored')throw error('INVALID_PHOTO_ACK');
   r=read(file(r.gameId));if(r.failure)continue;setLane(r,variant,{...lane(r,variant),status:'stored',error:null});removePhoto(r,variant);atomic(file(r.gameId),r);statusCache.set(r.gameId,{...result,at:now()});nextTry.delete(retryKey);attempts.delete(retryKey);
  }catch(e){if(closed)return;r=read(file(r.gameId));if(!r.failure){p=lane(r,variant);setLane(r,variant,{...p,error:e.code||'PHOTO_UNAVAILABLE',status:[400,409,410].includes(e.status)?'failed':p.status});if(lane(r,variant).status==='failed')removePhoto(r,variant);atomic(file(r.gameId),r);backoff(retryKey);}}
 }}finally{photoBusy=false;}}
 const timer=setInterval(()=>{void flush().catch(()=>{});void flushPhotos().catch(()=>{});},1000);timer.unref();
 function submit(b,state){const id=state.gameId,previous=read(file(id));const mission={schemaVersion:2,gameId:id,voiceSessionId:state.sessionId,selectionRevision:state.revision??b.revision,missionId:state.missionId,audience:state.audience,goal:state.goal,photoExpected:!!state.hasPhoto};require('./game-link.cjs').validate({...mission,schemaVersion:1,photo:null});
  if(previous){if(previous.mission.voiceSessionId!==state.sessionId)throw error('GAME_ID_CONFLICT',409);return local(previous);}
  const existing=rows();if(existing.filter(r=>!r.failure&&!r.acceptedAt&&remaining(r)>0).length>=200)throw error('QUEUE_FULL',503);
  for(const old of existing)if(old.mission.voiceSessionId===state.sessionId&&!old.failure){old.failure='SUPERSEDED';old.cancelRequested=true;endPhotos(old,'expired');atomic(file(old.gameId),old);}
  const r={gameId:id,createdAt:now(),mission,photoExpected:mission.photoExpected,photoStatus:mission.photoExpected?'expected':'none'};atomic(file(id),r);return local(r);
 }
 return{flush,flushPhotos,close(){closed=true;clearInterval(timer);},handle(req,res){
  if(!req.url.startsWith('/__kdw/link/v2/'))return false;
  void(async()=>{
   if(req.method!=='POST'||req.headers.origin!==origin)throw error('INVALID_REQUEST',403);
   const kind=req.url.slice('/__kdw/link/v2/'.length);
   if(kind==='photo'){
    const id=req.headers['x-kdw-game-id'],rev=Number(req.headers['x-kdw-revision']);const state=authorize(req.headers['x-kdw-session-token'],id,rev);if(!state||!state.hasPhoto||req.headers['content-type']!=='image/jpeg')throw error('INVALID_SESSION',403);
    const variant=photoVariant(req.headers),buffer=await bytes(req,PHOTO_LIMIT),digest=photoCheck(buffer,variant);if(!authorize(req.headers['x-kdw-session-token'],id,rev))throw error('INVALID_SESSION',403);
    const r=read(file(id));if(!r||r.mission.voiceSessionId!==state.sessionId||r.failure||remaining(r)<=0)throw error('PHOTO_NO_LONGER_NEEDED',410);
    const p=lane(r,variant);if(p.sha256&&p.sha256!==digest)throw error('PHOTO_REVISION_CONFLICT',409);
    if(!p.sha256){atomic(photoFile(r,variant),buffer);setLane(r,variant,{status:'pending',sha256:digest,error:null});atomic(file(id),r);}return local(r);
   }
   const b=await body(req),state=authorize(req.headers['x-kdw-session-token'],b.gameId,b.revision);if(!state)throw error('INVALID_SESSION',403);
   if(kind==='submit'){const result=submit(b,state);setImmediate(()=>void flush().catch(()=>{}));return result;}
   if(kind==='status'){const r=read(file(b.gameId));if(!r||r.mission.voiceSessionId!==state.sessionId)throw error('GAME_NOT_FOUND',404);if(r.acceptedAt)void poll(r.gameId);return local(r);}
   throw error('NOT_FOUND',404);
  })().then(v=>reply(res,200,v)).catch(e=>reply(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}
module.exports={createAsyncHub,createAsyncRelay,TTL};
