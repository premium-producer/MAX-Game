// Shared portable protocol. Copied into each launcher by sync-game-link.mjs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MISSIONS=new Set(['business-promotion','communication','digital-id','blogger']);
const LIMIT=6*1024*1024,DAY=86400000;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=(code,status=400)=>Object.assign(Error(code),{code,status});
function atomic(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(value),{mode:0o600});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function read(file,fallback=null){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
function json(res,status,value){if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>LIMIT)throw fail('PAYLOAD_TOO_LARGE',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail('INVALID_JSON');}}
function jpegSize(b){
 if(b.length<4||b.readUInt16BE(0)!==0xffd8||b.readUInt16BE(b.length-2)!==0xffd9)throw fail('INVALID_JPEG');
 let i=2;while(i+4<=b.length){if(b[i++]!==255)throw fail('INVALID_JPEG');while(b[i]===255)i++;const marker=b[i++];if(marker===0xda||marker===0xd9)break;if(marker===1||marker>=0xd0&&marker<=0xd7)continue;const len=b.readUInt16BE(i);if(len<2||i+len>b.length)break;if([0xc0,0xc1,0xc2].includes(marker)&&len>=8)return{width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};i+=len;}
 throw fail('INVALID_JPEG');
}
function validate(input){
 if(!input||input.schemaVersion!==1||!UUID.test(input.gameId)||!UUID.test(input.voiceSessionId)||!MISSIONS.has(input.missionId)||!['business','personal','blogger'].includes(input.audience)||![null,'access','connection'].includes(input.goal))throw fail('INVALID_HANDOFF');
 const expected=input.missionId==='business-promotion'?['business',null]:input.missionId==='blogger'?['blogger',null]:['personal',input.missionId==='digital-id'?'access':'connection'];
 if(input.audience!==expected[0]||input.goal!==expected[1])throw fail('INVALID_MISSION_CONTEXT');
 let photo=null;if(input.photo!==null){const p=input.photo;if(p?.mimeType!=='image/jpeg'||typeof p.base64!=='string'||p.base64.length>LIMIT-1024||p.base64.length%4!==0||/[^A-Za-z0-9+/=]/.test(p.base64))throw fail('INVALID_PHOTO');const b=Buffer.from(p.base64,'base64');if(b.toString('base64')!==p.base64)throw fail('INVALID_PHOTO');const size=jpegSize(b);if(size.width!==1080||size.height!==1920||b.length>4*1024*1024)throw fail('INVALID_PHOTO_SIZE');photo={mimeType:'image/jpeg',width:1080,height:1920,bytes:b.length,sha256:hash(b),base64:p.base64};}
 return{schemaVersion:1,gameId:input.gameId,voiceSessionId:input.voiceSessionId,missionId:input.missionId,audience:input.audience,goal:input.goal,photo};
}
function photoRevision(r){return r.avatar?hash((r.photo?.sha256??'none')+'|'+r.avatar.sha256):r.photo?.sha256??'none';}
function publicGame(r){if(!r)return null;return{schemaVersion:1,gameId:r.gameId,sessionId:r.gameId,voiceSessionId:r.voiceSessionId,missionId:r.missionId,gameMissionId:r.missionId==='business-promotion'?'business':r.missionId,audience:r.audience,goal:r.goal,hasPhoto:!!r.photo,photoSha256:r.photo?.sha256??null,hasAvatar:!!r.avatar,avatarSha256:r.avatar?.sha256??null,photoRevision:photoRevision(r),createdAt:r.createdAt,updatedAt:r.updatedAt,status:r.status,progress:r.progress??null,...(r.standPolicy?{standPolicy:r.standPolicy,source:r.source??'stella'}:{})};}
function createGameHub({root,origin,now=()=>Date.now(),production=false,getOutput=()=>null,validatePhoto=()=>{}}){
 const settings=require('./stand-settings.cjs').createSettings({root,enabled:production});
 const assetCache=new Map(),heartbeats=new Map();
 const directory=path.join(root,'data/link'),games=path.join(directory,'games'),keyFile=path.join(directory,'key.json');fs.mkdirSync(games,{recursive:true});
 if(!fs.existsSync(keyFile))atomic(keyFile,{key:crypto.randomBytes(32).toString('hex')});
 const key=read(keyFile).key;if(!/^[a-f0-9]{64}$/.test(key))throw fail('INVALID_PAIRING_KEY');
 const file=id=>{if(!UUID.test(id))throw fail('INVALID_GAME_ID');return path.join(games,id+'.json');};
 const transitionFile=path.join(directory,'replacement.json');
 function clearPhoto(r){for(const p of [r.photo,r.avatar])if(p?.blob){const f=path.join(directory,'photos',path.basename(p.blob));if(fs.existsSync(f))fs.unlinkSync(f);}r.photo=null;r.avatar=null;}
 function finishReplacement(){
  const job=read(transitionFile);if(!job)return;
  // Replay an interrupted replacement before exposing the queue. New ID first,
  // then terminal predecessors, then active pointer; every step is idempotent.
  if(!read(file(job.next.gameId)))atomic(file(job.next.gameId),job.next);
  for(const id of job.previous){const old=read(file(id));if(old&&old.status!=='superseded'){old.status='superseded';old.supersededBy=job.next.gameId;old.updatedAt=job.next.createdAt;clearPhoto(old);atomic(file(id),old);}}
  const a=read(path.join(directory,'active.json'));if(job.previous.includes(a?.gameId))atomic(path.join(directory,'active.json'),{gameId:null});
  fs.unlinkSync(transitionFile);
 }
 finishReplacement();
 const deadlines=new Map();
 const get=id=>{const r=read(file(id));if(!r)throw fail('GAME_NOT_FOUND',404);
  if(r.delivery&&!r.claimedAt&&!['task','result','completed','incomplete'].includes(r.progress?.status)&&!['released','superseded','cancelled','handoff-expired'].includes(r.status)){
   let d=deadlines.get(id);if(!d){d={mono:performance.now(),remaining:r.delivery.deadline-now()};deadlines.set(id,d);}
   if(now()<r.delivery.receivedAt||now()>=r.delivery.deadline||performance.now()-d.mono>=d.remaining){r.status='handoff-expired';clearPhoto(r);atomic(file(id),r);}
  }
  if((r.photo||r.avatar)&&now()-Date.parse(r.createdAt)>DAY){clearPhoto(r);r.photoExpired=true;atomic(file(id),r);}return r;};
 function records(){return fs.readdirSync(games).filter(n=>UUID.test(n.slice(0,-5))&&n.endsWith('.json')).map(n=>publicGame(get(n.slice(0,-5)))).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));}
 function active(){finishReplacement();let a=read(path.join(directory,'active.json')),r=a?.gameId?get(a.gameId):null;
  if(r&&(!production&&['completed','incomplete','expired'].includes(r.status)&&now()-Date.parse(r.updatedAt)>=30000||['released','superseded','cancelled','handoff-expired'].includes(r.status)))r=null;
  if(production&&!r&&a?.cooldownUntil>now())return null;
  if(production&&r&&!r.standPolicy){r.standPolicy=settings.snapshot();atomic(file(r.gameId),r);}
  if(!r){const pending=records().find(g=>g.status==='queued');r=pending?get(pending.gameId):null;if(r){r.status='assigned';if(production)r.standPolicy=settings.snapshot();r.updatedAt=new Date(now()).toISOString();atomic(file(r.gameId),r);}atomic(path.join(directory,'active.json'),{gameId:r?.gameId??null});}return r;
 }
 function ingest(input,{manual=false,delivery=null}={}){finishReplacement();if(production&&!manual&&settings.snapshot().value.max.entryMode==='manual')throw fail('HANDOFF_DISABLED',409);const value=validate(input),previous=read(file(value.gameId)),signature=hash(JSON.stringify(value));if(previous){if(previous.signature!==signature)throw fail('GAME_ID_CONFLICT',409);return{...publicGame(get(value.gameId)),duplicate:true};}
  // Bound persistent visitor data. Expired records are pruned; live records are never evicted.
  const all=records();for(const r of all)if(now()-Date.parse(r.createdAt)>30*DAY&&['released','superseded','expired','cancelled','handoff-expired'].includes(r.status)&&r.gameId!==read(path.join(directory,'active.json'))?.gameId)fs.unlinkSync(file(r.gameId));
  const live=records().filter(g=>['queued','assigned','playing','completed','incomplete'].includes(g.status));
  const same=live.filter(g=>g.voiceSessionId===value.voiceSessionId);
  const started=g=>!!get(g.gameId).claimedAt||['task','result','completed','incomplete'].includes(g.progress?.status);
  if(same.some(started))throw fail('GAME_ALREADY_STARTED',409);
  const previousIds=same.map(g=>g.gameId);
  if(live.length-previousIds.length>=200)throw fail('QUEUE_FULL',503);
  const stamp=new Date(now()).toISOString(),r={...value,...(delivery?{delivery}:{}),signature,source:manual?'manual':'stella',status:'queued',createdAt:stamp,updatedAt:stamp,progress:null};atomic(transitionFile,{next:r,previous:previousIds});finishReplacement();active();return publicGame(get(r.gameId));
 }
 function assets(r){const revision=photoRevision(r),cacheKey=r.gameId+':'+revision;if(assetCache.has(cacheKey))return assetCache.get(cacheKey);for(const k of assetCache.keys())if(k.startsWith(r.gameId+':'))assetCache.delete(k);
  const uri=p=>p?'data:image/jpeg;base64,'+(p.blob?fs.readFileSync(path.join(root,'data/link/photos',p.blob)).toString('base64'):p.base64):null,full=uri(r.photo),avatar=uri(r.avatar),result=[];
  for(const dir of ['conversation','visitor-details']){const directory=path.join(root,'www/assets/kdw-native',dir);if(!fs.existsSync(directory))continue;for(const name of fs.readdirSync(directory)){
   if(!name.endsWith('.svg'))continue;const original=`assets/kdw-native/${dir}/${name}`,text=fs.readFileSync(path.join(directory,name),'utf8');if(!text.includes('data-visitor-photo="true"')&&!['visitor-avatar.svg','visitor-placeholder.svg'].includes(name))continue;
   let svg=text,index=0;
   // Replace only explicitly marked circular viewports; full-height slots retain full.
   if(avatar)svg=svg.replace(/<svg([^>]*data-visitor-viewport="circle"[^>]*)>[\s\S]*?<\/svg>/g,(_all,attrs)=>{
    // ID uses the face crop too, but its authored portrait mask is rectangular.
    // An extra circular mask would expose the template portrait underneath.
    if(attrs.includes('data-visitor-mask="portrait"'))return `<svg${attrs.replace(/viewBox="[^"]*"/,'viewBox="0 0 512 512"')}><image width="512" height="512" href="${avatar}"/></svg>`;
    const clip='kdw-visitor-avatar-'+index++;return `<svg${attrs.replace(/viewBox="[^"]*"/,'viewBox="0 0 512 512"')}><defs><clipPath id="${clip}"><circle cx="256" cy="256" r="256"/></clipPath></defs><image width="512" height="512" href="${avatar}" clip-path="url(#${clip})"/></svg>`;
   });
   if(full)svg=svg.replace(/<image data-visitor-photo="true"[^>]*\/>/g,`<image data-visitor-photo="true" width="1080" height="1920" href="${full}"/>`);
   if(name==='visitor-avatar.svg'&&avatar)svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><clipPath id="kdw-avatar"><circle cx="256" cy="256" r="256"/></clipPath></defs><image width="512" height="512" href="${avatar}" clip-path="url(#kdw-avatar)"/></svg>`;
   else if(full&&['visitor-avatar.svg','visitor-placeholder.svg'].includes(name))svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${name==='visitor-avatar.svg'?880:1080}" height="${name==='visitor-avatar.svg'?880:1920}" viewBox="${name==='visitor-avatar.svg'?'100 100 880 880':'0 0 1080 1920'}"><image width="1080" height="1920" href="${full}"/></svg>`;
   const bytes=Buffer.from(svg),linkedPath=`assets/kdw-linked/${r.gameId}/${revision}/${dir}/${name}`;result.push({original,path:linkedPath,sha256:hash(bytes),bytes});
  }}assetCache.set(cacheKey,result);while(assetCache.size>3)assetCache.delete(assetCache.keys().next().value);return result;
 }

 function assignment(r){
  const terminal={'handoff-expired':'no-show',cancelled:'superseded',superseded:'superseded',released:r.progress?.endReason==='no-show'?'no-show':'completed',expired:'completed'};
  let status=terminal[r.status]??(r.status==='queued'?'queued':r.claimedAt||['task','result','completed','incomplete'].includes(r.progress?.status)?'playing':'invited');
  if(['invited','playing'].includes(status)&&now()-(heartbeats.get(r.gameId)??Date.parse(r.lastSeenAt??r.updatedAt))>90000)status='unavailable';
  return{gameId:r.gameId,status,updatedAt:r.updatedAt};
 }
 let tail=Promise.resolve();const queue=fn=>{const work=tail.then(fn);tail=work.catch(()=>{});return work;};
 const asyncHub=require('./async-link.cjs').createAsyncHub({root,origin,now,ingest,get,active,assignment,queue,key,getOutput,clearPhoto,validatePhoto});
 function operatorChange(input){return queue(()=>{
  if(!input||!['start','close'].includes(input.action)||input.gameId!==null&&!UUID.test(input.gameId)||input.action==='start'&&!MISSIONS.has(input.missionId==='business'?'business-promotion':input.missionId))throw fail('INVALID_OPERATOR_ACTION');
  const current=active();if((current?.gameId??null)!==input.gameId)throw fail('Текущая сессия уже изменилась. Обновите состояние',409);
  if(current){current.status='cancelled';current.endReason='operator';current.updatedAt=new Date(now()).toISOString();clearPhoto(current);atomic(file(current.gameId),current);assetCache.clear();}
  atomic(path.join(directory,'active.json'),{gameId:null});
  if(input.action==='close')return{closed:current?.gameId??null};
  const id=input.missionId==='business'?'business-promotion':input.missionId,audience=id==='business-promotion'?'business':id==='blogger'?'blogger':'personal',goal=id==='digital-id'?'access':id==='communication'?'connection':null;
  const game=ingest({schemaVersion:1,gameId:crypto.randomUUID(),voiceSessionId:crypto.randomUUID(),missionId:id,audience,goal,photo:null},{manual:true});
  const promoted=active();if(promoted&&promoted.gameId!==game.gameId){if(promoted.claimedAt)throw fail('Игра уже занята другим посетителем',409);promoted.status='queued';atomic(file(promoted.gameId),promoted);}
  const selected=get(game.gameId);selected.status='assigned';selected.standPolicy=settings.snapshot();selected.source='operator';atomic(file(selected.gameId),selected);atomic(path.join(directory,'active.json'),{gameId:selected.gameId});return{game:publicGame(selected)};
 });}
 return{key,ingest,get,active,operatorChange,resetForStartup:()=>queue(()=>{
  finishReplacement();let cancelled=0;const stamp=new Date(now()).toISOString();
  for(const item of records())if(['queued','assigned','playing','completed','incomplete'].includes(item.status)){const r=get(item.gameId);r.status='cancelled';r.endReason='startup-reset';r.updatedAt=stamp;clearPhoto(r);atomic(file(r.gameId),r);cancelled++;}
  atomic(path.join(directory,'active.json'),{gameId:null});heartbeats.clear();deadlines.clear();assetCache.clear();return{cancelled};
 }),settings:()=>settings.snapshot(),handle(req,res){
  if(asyncHub.handle(req,res))return true;
  const url=new URL(req.url,origin),asset=/^\/assets\/kdw-linked\/([^/]+)\/(?:(?:[a-f0-9]{64}|none)\/)?(conversation|visitor-details)\/([a-z0-9_-]+\.svg)$/.exec(url.pathname);
  if(!url.pathname.startsWith('/__kdw/link/')&&url.pathname!=='/__kdw/settings'&&!asset)return false;
  void queue(async()=>{
   if(req.method==='GET'&&url.pathname==='/__kdw/settings'){json(res,200,settings.snapshot());return;}
   if(req.method==='POST'&&url.pathname==='/__kdw/link/manual'){
    if(!production||req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_ORIGIN',403);
    if(!['manual','combined'].includes(settings.snapshot().value.max.entryMode))throw fail('MANUAL_DISABLED',403);
    if(active())throw fail('GAME_BUSY',409);const b=await body(req),id=b.missionId==='business'?'business-promotion':b.missionId;
    const audience=id==='business-promotion'?'business':id==='blogger'?'blogger':'personal',goal=id==='digital-id'?'access':id==='communication'?'connection':null;
    const game=ingest({schemaVersion:1,gameId:crypto.randomUUID(),voiceSessionId:crypto.randomUUID(),missionId:id,audience,goal,photo:null},{manual:true});json(res,200,{game});return;
   }
   if(asset){if(!['GET','HEAD'].includes(req.method))throw fail('METHOD_NOT_ALLOWED',405);const r=get(asset[1]),a=assets(url.pathname.includes('/none/')?{...r,photo:null,avatar:null}:r).find(a=>a.path.split('?')[0]===url.pathname.slice(1));if(!a)throw fail('ASSET_NOT_FOUND',404);res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':a.bytes.length});res.end(req.method==='HEAD'?undefined:a.bytes);return;}
   if(req.method==='POST'&&url.pathname==='/__kdw/link/ingest'){if(req.headers.origin||req.headers['x-kdw-relay-key']!==key)throw fail('UNAUTHORIZED',403);json(res,200,ingest(await body(req)));return;}
   if(req.method==='GET'&&url.pathname==='/__kdw/link/active'){const game=publicGame(active());json(res,200,{game,queueCount:records().filter(r=>r.status==='queued').length});return;}
   const m=/^\/__kdw\/link\/games\/([^/]+)(\/assets|\/progress|\/claim|\/status)?$/.exec(url.pathname);if(!m)throw fail('NOT_FOUND',404);const r=get(m[1]);
   if(req.method==='GET'&&m[2]==='/status'){json(res,200,{assignment:assignment(r)});return;}
   if(req.method==='POST'&&m[2]==='/claim'){
    if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_ORIGIN',403);
    if(active()?.gameId!==r.gameId||['released','superseded','cancelled','handoff-expired'].includes(r.status))throw fail('GAME_NO_LONGER_ACTIVE',409);
    const b=await body(req);if(b.gameId!==r.gameId)throw fail('INVALID_GAME_ID');
    r.claimedAt??=new Date(now()).toISOString();r.lastSeenAt=new Date(now()).toISOString();atomic(file(r.gameId),r);json(res,200,{assignment:assignment(r)});return;
   }
   if(req.method==='GET'){if(m[2]==='/assets')json(res,200,{gameId:r.gameId,assets:assets(r).map(({bytes,...a})=>a)});else if(!m[2])json(res,200,{game:publicGame(r)});else throw fail('NOT_FOUND',404);return;}
   if(req.method==='POST'&&m[2]==='/progress'){
    if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_ORIGIN',403);
    if(read(path.join(directory,'active.json'))?.gameId!==r.gameId)throw fail('GAME_NO_LONGER_ACTIVE',409);
    const b=await body(req);if(b.gameId!==r.gameId||!Number.isSafeInteger(b.revision)||b.revision<0||!['menu','scan','task','result','completed','incomplete','expired'].includes(b.status)||typeof b.contentRevision!=='string'||b.contentRevision.length>160||!Number.isSafeInteger(b.runId)||b.runId<0)throw fail('INVALID_PROGRESS');
    if(r.progress&&b.revision<r.progress.revision)throw fail('STALE_PROGRESS',409);
    if(r.progress&&b.revision===r.progress.revision){heartbeats.set(r.gameId,now());json(res,200,{game:publicGame(r)});return;}
    const safeToken=v=>v===null||typeof v==='string'&&/^[a-z0-9.-]{1,100}$/.test(v);
    if(!safeToken(b.taskId)||!safeToken(b.screenId)||b.missionId!==(r.missionId==='business-promotion'?'business':r.missionId)&&b.status!=='menu')throw fail('INVALID_PROGRESS_CONTEXT');
    heartbeats.set(r.gameId,now());r.lastSeenAt=new Date(now()).toISOString();r.progress={endReason:['qr','no-show','inactivity'].includes(b.endReason)?b.endReason:null,revision:b.revision,runId:b.runId,status:b.status,missionId:b.missionId,taskId:b.taskId,screenId:b.screenId,contentRevision:b.contentRevision};
    if(production&&b.status==='menu'&&b.endReason==='inactivity')atomic(path.join(directory,'active.json'),{gameId:r.gameId,cooldownUntil:now()+r.standPolicy.value.max.timings.standbyAfterIdleSeconds*1000});
    const next=b.status==='menu'?'released':['completed','incomplete','expired'].includes(b.status)?b.status:'playing';if(r.status!==next)r.updatedAt=new Date(now()).toISOString();r.status=next;if(['released','completed','incomplete','expired'].includes(next))clearPhoto(r);atomic(file(r.gameId),r);json(res,200,{game:publicGame(r)});return;
   }throw fail('METHOD_NOT_ALLOWED',405);
  }).catch(e=>json(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}
function createStelaRelay({root,origin,authorize,now=()=>Date.now(),transport=fetch}){
 let policyCache=null;const policyFile=path.join(root,'data/stand-settings.remote.json');try{policyCache=read(policyFile);}catch{}
 async function refreshPolicy(){try{const c=config(),response=await(c.certificatePem?((u,o)=>require('./game-link-network.cjs').pinnedFetch(u,o,c.certificatePem)):transport)(c.origin+'/__kdw/settings',{headers:{'x-kdw-relay-key':c.key},signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('SETTINGS_UNAVAILABLE');const p=await response.json();require('./stand-settings.cjs').validate(p.value);policyCache=p;atomic(policyFile,p);return p;}catch{if(policyCache)return{...policyCache,offline:true};return{production:true,error:'MAX недоступен; ожидаем настройки стенда',value:require('./stand-settings.cjs').DEFAULTS,revision:'offline-default'};}}

 const directory=path.join(root,'data/link/outbox');fs.mkdirSync(directory,{recursive:true});let closed=false,working=false,pendingFiles=null,lastCleanup=-Infinity;
 let tail=Promise.resolve();const serial=fn=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;};
 function pending(){
  if(pendingFiles===null||now()-lastCleanup>=DAY){
   pendingFiles=new Set();lastCleanup=now();
   for(const n of fs.readdirSync(directory).filter(n=>UUID.test(n.slice(0,-5))&&n.endsWith('.json'))){const f=path.join(directory,n),r=read(f);
    if((r.deliveredAt||r.failure)&&now()-Date.parse(r.deliveredAt??r.queuedAt)>30*DAY){fs.unlinkSync(f);continue;}
    if(!r.deliveredAt&&!r.failure)pendingFiles.add(f);
   }
  }
  return [...pendingFiles].map(f=>({f,r:read(f)})).sort((a,b)=>Date.parse(a.r.queuedAt)-Date.parse(b.r.queuedAt));
 }
 async function currentAssignment(id){const c=config(),response=await(c.certificatePem?((u,o)=>require('./game-link-network.cjs').pinnedFetch(u,o,c.certificatePem)):transport)(c.origin+'/__kdw/link/games/'+id+'/status',{headers:{'x-kdw-relay-key':c.key},signal:AbortSignal.timeout(4000)});if(!response.ok)throw fail('STATUS_UNAVAILABLE');const result=await response.json();if(result.assignment?.gameId!==id)throw fail('INVALID_GAME_ACK');return result.assignment;}

 const config=()=>{const c=read(path.join(root,'data/game-link.local.json'));if(c){const u=new URL(c.gameOrigin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||u.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw fail('INVALID_GAME_ORIGIN');if(!/^[a-f0-9]{64}$/.test(c.key))throw fail('INVALID_PAIRING_KEY');return{origin:u.origin,key:c.key,certificatePem:c.certificatePem};}
  const sibling=path.join(root,'../max-game'),manifest=read(path.join(sibling,'app.json')),k=read(path.join(sibling,'data/link/key.json'));if(!manifest||!k)throw fail('GAME_NOT_STARTED',503);return{origin:'http://127.0.0.1:'+manifest.port,key:k.key};};
 async function flush(){return serial(async()=>{if(closed||working)return;working=true;try{const items=pending();for(const {f,r} of items){if(closed)break;if(now()-Date.parse(r.queuedAt)>DAY){r.payload.photo=null;r.failure='HANDOFF_EXPIRED';atomic(f,r);pendingFiles.delete(f);continue;}
    try{const c=config(),response=await (c.certificatePem?((url,options)=>require('./game-link-network.cjs').pinnedFetch(url,options,c.certificatePem)):transport)(c.origin+'/__kdw/link/ingest',{method:'POST',headers:{'Content-Type':'application/json','x-kdw-relay-key':c.key},body:JSON.stringify(r.payload),signal:AbortSignal.timeout(6000)});const result=await response.json();if(!response.ok)throw fail(result.error||'GAME_UNAVAILABLE',response.status);if(result.gameId!==r.payload.gameId||result.photoSha256!==(r.payload.photo?.sha256??null))throw fail('INVALID_GAME_ACK');r.deliveredAt=new Date(now()).toISOString();r.receipt=result;r.payload.photo=null;atomic(f,r);pendingFiles.delete(f);
    }catch(e){r.lastError=e.code||'GAME_UNAVAILABLE';if([400,409].includes(e.status)&&e.code!=='HANDOFF_DISABLED'){r.failure=r.lastError;r.payload.photo=null;}atomic(f,r);if(r.failure)pendingFiles.delete(f);else break;}}
  }finally{working=false;}});}
 let policyBusy=false;function policy(){if(!policyBusy){policyBusy=true;void refreshPolicy().finally(()=>{policyBusy=false;});}
  const local=read(path.join(root,'settings/stand.json'));return Promise.resolve(local?{production:true,value:local,revision:hash(JSON.stringify(local)),source:'local'}:policyCache?{...policyCache,source:'cache'}:{production:true,value:require('./stand-settings.cjs').DEFAULTS,revision:'local-default',source:'defaults'});}
 const asyncRelay=require('./async-link.cjs').createAsyncRelay({root,origin,authorize,now,transport,config});
 const timer=setInterval(()=>void flush().catch(()=>{}),2000);timer.unref();void flush().catch(()=>{});
 return{flush,close(){closed=true;clearInterval(timer);asyncRelay.close();},handle(req,res){
  if(asyncRelay.handle(req,res))return true;
  if(req.method==='GET'&&req.url==='/__kdw/settings'){void policy().then(p=>json(res,200,p)).catch(()=>json(res,503,{error:'SETTINGS_UNAVAILABLE'}));return true;}
  if(!req.url.startsWith('/__kdw/link/'))return false;
  void serial(async()=>{if(req.method!=='POST'||!['/__kdw/link/submit','/__kdw/link/status'].includes(req.url)||req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_REQUEST',403);
   const b=await body(req),state=authorize(req.headers['x-kdw-session-token'],b.gameId,b.revision);if(!state)throw fail('INVALID_SESSION',403);
   if(req.url==='/__kdw/link/status'){
    if(!UUID.test(state.gameId))throw fail('INVALID_GAME_ID');
    const r=read(path.join(directory,state.gameId+'.json'));if(!r||r.payload.voiceSessionId!==state.sessionId)throw fail('GAME_NOT_FOUND',404);
    let assignment=null;if(r.deliveredAt)try{assignment=await currentAssignment(state.gameId);}catch{}
    json(res,200,{gameId:state.gameId,status:r.deliveredAt?'delivered':r.failure?'failed':'queued',error:r.failure,receipt:r.receipt??null,assignment});return;
   }
   const value=validate({schemaVersion:1,gameId:state.gameId,voiceSessionId:state.sessionId,missionId:state.missionId,audience:state.audience,goal:state.goal,photo:b.photo});if(!!value.photo!==!!state.hasPhoto)throw fail('PHOTO_STATE_CONFLICT',409);
   const f=path.join(directory,value.gameId+'.json'),signature=hash(JSON.stringify(value)),previous=read(f);
   if(previous&&previous.signature!==signature)throw fail('GAME_ID_CONFLICT',409);
   if(!previous){
    // Supersede only this visitor's undelivered choices. A sent choice is replaced
    // atomically by the hub; its receipt remains immutable here.
    for(const old of pending())if(old.r.payload.voiceSessionId===value.voiceSessionId&&old.r.payload.gameId!==value.gameId){old.r.failure='SUPERSEDED';old.r.payload.photo=null;atomic(old.f,old.r);pendingFiles.delete(old.f);}
    atomic(f,{signature,queuedAt:new Date(now()).toISOString(),payload:value});pendingFiles.add(f);
   }
   const r=read(f);let assignment=null;
   if(r.deliveredAt)try{assignment=await currentAssignment(value.gameId);}catch{}
   json(res,200,{gameId:value.gameId,status:r.deliveredAt?'delivered':r.failure?'failed':'queued',error:r.failure,receipt:r.receipt??null,assignment});void flush().catch(()=>{});
  }).catch(e=>json(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}
module.exports={createGameHub,createStelaRelay,validate,jpegSize,publicGame};
