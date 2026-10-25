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
function publicGame(r){if(!r)return null;return{schemaVersion:1,gameId:r.gameId,sessionId:r.gameId,voiceSessionId:r.voiceSessionId,missionId:r.missionId,gameMissionId:r.missionId==='business-promotion'?'business':r.missionId,audience:r.audience,goal:r.goal,hasPhoto:!!r.photo,photoSha256:r.photo?.sha256??null,createdAt:r.createdAt,updatedAt:r.updatedAt,status:r.status,progress:r.progress??null,...(r.standPolicy?{standPolicy:r.standPolicy,source:r.source??'stella'}:{})};}
const NEUTRAL='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><path fill="#251444" d="M0 0h1080v1920H0z"/><circle cx="540" cy="430" r="200" fill="#8674a6"/><ellipse cx="540" cy="990" rx="400" ry="330" fill="#8674a6"/></svg>').toString('base64');
function createGameHub({root,origin,now=()=>Date.now(),production=false}){
 const settings=require('./stand-settings.cjs').createSettings({root,enabled:production});
 const assetCache=new Map();
 const directory=path.join(root,'data/link'),games=path.join(directory,'games'),keyFile=path.join(directory,'key.json');fs.mkdirSync(games,{recursive:true});
 if(!fs.existsSync(keyFile))atomic(keyFile,{key:crypto.randomBytes(32).toString('hex')});
 const key=read(keyFile).key;if(!/^[a-f0-9]{64}$/.test(key))throw fail('INVALID_PAIRING_KEY');
 const file=id=>{if(!UUID.test(id))throw fail('INVALID_GAME_ID');return path.join(games,id+'.json');};
 const get=id=>{const r=read(file(id));if(!r)throw fail('GAME_NOT_FOUND',404);if(r.photo&&now()-Date.parse(r.createdAt)>DAY){r.photo=null;r.photoExpired=true;atomic(file(id),r);}return r;};
 function records(){return fs.readdirSync(games).filter(n=>UUID.test(n.slice(0,-5))&&n.endsWith('.json')).map(n=>publicGame(get(n.slice(0,-5)))).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));}
 function active(){let a=read(path.join(directory,'active.json')),r=a?.gameId?get(a.gameId):null;
  if(r&&(!production&&['completed','incomplete','expired'].includes(r.status)&&now()-Date.parse(r.updatedAt)>=30000||r.status==='released'))r=null;
  if(production&&!r&&a?.cooldownUntil>now())return null;
  if(production&&r&&!r.standPolicy){r.standPolicy=settings.snapshot();atomic(file(r.gameId),r);}
  if(!r){const pending=records().find(g=>g.status==='queued');r=pending?get(pending.gameId):null;if(r){r.status='assigned';if(production)r.standPolicy=settings.snapshot();r.updatedAt=new Date(now()).toISOString();atomic(file(r.gameId),r);}atomic(path.join(directory,'active.json'),{gameId:r?.gameId??null});}return r;
 }
 function ingest(input,{manual=false}={}){if(production&&!manual&&settings.snapshot().value.max.entryMode==='manual')throw fail('HANDOFF_DISABLED',409);const value=validate(input),previous=read(file(value.gameId)),signature=hash(JSON.stringify(value));if(previous){if(previous.signature!==signature)throw fail('GAME_ID_CONFLICT',409);return{...publicGame(get(value.gameId)),duplicate:true};}
  // Bound persistent visitor data. Expired records are pruned; live records are never evicted.
  const all=records();for(const r of all)if(now()-Date.parse(r.createdAt)>30*DAY&&r.gameId!==read(path.join(directory,'active.json'))?.gameId)fs.unlinkSync(file(r.gameId));
  if(records().filter(g=>['queued','assigned','playing'].includes(g.status)).length>=200)throw fail('QUEUE_FULL',503);
  const stamp=new Date(now()).toISOString(),r={...value,signature,source:manual?'manual':'stella',status:'queued',createdAt:stamp,updatedAt:stamp,progress:null};atomic(file(r.gameId),r);active();return publicGame(get(r.gameId));
 }
 function assets(r){const cacheKey=r.gameId+':'+(r.photo?.sha256??'none');if(assetCache.has(cacheKey))return assetCache.get(cacheKey);for(const k of assetCache.keys())if(k.startsWith(r.gameId+':'))assetCache.delete(k);const result=[];for(const dir of ['conversation','visitor-details']){const directory=path.join(root,'www/assets/kdw-native',dir);if(!fs.existsSync(directory))continue;for(const name of fs.readdirSync(directory)){if(!name.endsWith('.svg'))continue;const original=`assets/kdw-native/${dir}/${name}`,text=fs.readFileSync(path.join(directory,name),'utf8');if(!text.includes('data-visitor-photo="true"')&&!['visitor-avatar.svg','visitor-placeholder.svg'].includes(name))continue;const dataUri=r.photo?'data:image/jpeg;base64,'+r.photo.base64:NEUTRAL;
   const svg=text.includes('data-visitor-photo="true"')?text.replace(/<image data-visitor-photo="true"[^>]*\/>/g,`<image data-visitor-photo="true" width="1080" height="1920" href="${dataUri}"/>`):`<svg xmlns="http://www.w3.org/2000/svg" width="${name==='visitor-avatar.svg'?880:1080}" height="${name==='visitor-avatar.svg'?880:1920}" viewBox="${name==='visitor-avatar.svg'?'100 100 880 880':'0 0 1080 1920'}"><image width="1080" height="1920" href="${dataUri}"/></svg>`;
   const bytes=Buffer.from(svg),linkedPath=`assets/kdw-linked/${r.gameId}/${dir}/${name}`;result.push({original,path:linkedPath,sha256:hash(bytes),bytes});}}
  assetCache.set(cacheKey,result);while(assetCache.size>3)assetCache.delete(assetCache.keys().next().value);return result;
 }
 let tail=Promise.resolve();const queue=fn=>{const work=tail.then(fn);tail=work.catch(()=>{});return work;};
 return{key,ingest,get,active,settings:()=>settings.snapshot(),handle(req,res){
  const url=new URL(req.url,origin),asset=/^\/assets\/kdw-linked\/([^/]+)\/(conversation|visitor-details)\/([a-z0-9_-]+\.svg)$/.exec(url.pathname);
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
   if(asset){if(!['GET','HEAD'].includes(req.method))throw fail('METHOD_NOT_ALLOWED',405);const r=get(asset[1]),a=assets(r).find(a=>a.path===url.pathname.slice(1));if(!a)throw fail('ASSET_NOT_FOUND',404);res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':a.bytes.length});res.end(req.method==='HEAD'?undefined:a.bytes);return;}
   if(req.method==='POST'&&url.pathname==='/__kdw/link/ingest'){if(req.headers.origin||req.headers['x-kdw-relay-key']!==key)throw fail('UNAUTHORIZED',403);json(res,200,ingest(await body(req)));return;}
   if(req.method==='GET'&&url.pathname==='/__kdw/link/active'){json(res,200,{game:publicGame(active())});return;}
   const m=/^\/__kdw\/link\/games\/([^/]+)(\/assets|\/progress)?$/.exec(url.pathname);if(!m)throw fail('NOT_FOUND',404);const r=get(m[1]);
   if(req.method==='GET'){if(m[2]==='/assets')json(res,200,{gameId:r.gameId,assets:assets(r).map(({bytes,...a})=>a)});else if(!m[2])json(res,200,{game:publicGame(r)});else throw fail('NOT_FOUND',404);return;}
   if(req.method==='POST'&&m[2]==='/progress'){
    if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_ORIGIN',403);
    if(read(path.join(directory,'active.json'))?.gameId!==r.gameId)throw fail('GAME_NO_LONGER_ACTIVE',409);
    const b=await body(req);if(b.gameId!==r.gameId||!Number.isSafeInteger(b.revision)||b.revision<0||!['menu','scan','task','result','completed','incomplete','expired'].includes(b.status)||typeof b.contentRevision!=='string'||b.contentRevision.length>160||!Number.isSafeInteger(b.runId)||b.runId<0)throw fail('INVALID_PROGRESS');
    if(r.progress&&b.revision<r.progress.revision)throw fail('STALE_PROGRESS',409);
    if(r.progress&&b.revision===r.progress.revision){json(res,200,{game:publicGame(r)});return;}
    const safeToken=v=>v===null||typeof v==='string'&&/^[a-z0-9.-]{1,100}$/.test(v);
    if(!safeToken(b.taskId)||!safeToken(b.screenId)||b.missionId!==(r.missionId==='business-promotion'?'business':r.missionId)&&b.status!=='menu')throw fail('INVALID_PROGRESS_CONTEXT');
    r.progress={revision:b.revision,runId:b.runId,status:b.status,missionId:b.missionId,taskId:b.taskId,screenId:b.screenId,contentRevision:b.contentRevision};
    if(production&&b.status==='menu'&&b.endReason==='inactivity')atomic(path.join(directory,'active.json'),{gameId:r.gameId,cooldownUntil:now()+r.standPolicy.value.max.timings.standbyAfterIdleSeconds*1000});
    const next=b.status==='menu'?'released':['completed','incomplete','expired'].includes(b.status)?b.status:'playing';if(r.status!==next)r.updatedAt=new Date(now()).toISOString();r.status=next;atomic(file(r.gameId),r);json(res,200,{game:publicGame(r)});return;
   }throw fail('METHOD_NOT_ALLOWED',405);
  }).catch(e=>json(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}
function createStelaRelay({root,origin,authorize,now=()=>Date.now(),transport=fetch}){
 let policyCache=null;const policyFile=path.join(root,'data/stand-settings.remote.json');try{policyCache=read(policyFile);}catch{}
 async function policy(){try{const c=config(),response=await(c.certificatePem?((u,o)=>require('./game-link-network.cjs').pinnedFetch(u,o,c.certificatePem)):transport)(c.origin+'/__kdw/settings',{headers:{'x-kdw-relay-key':c.key},signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('SETTINGS_UNAVAILABLE');const p=await response.json();require('./stand-settings.cjs').validate(p.value);policyCache=p;atomic(policyFile,p);return p;}catch{if(policyCache)return{...policyCache,offline:true};return{production:true,error:'MAX недоступен; ожидаем настройки стенда',value:require('./stand-settings.cjs').DEFAULTS,revision:'offline-default'};}}

 const directory=path.join(root,'data/link/outbox');fs.mkdirSync(directory,{recursive:true});let closed=false,working=false;
 const config=()=>{const c=read(path.join(root,'data/game-link.local.json'));if(c){const u=new URL(c.gameOrigin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||u.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw fail('INVALID_GAME_ORIGIN');if(!/^[a-f0-9]{64}$/.test(c.key))throw fail('INVALID_PAIRING_KEY');return{origin:u.origin,key:c.key,certificatePem:c.certificatePem};}
  const sibling=path.join(root,'../max-game'),manifest=read(path.join(sibling,'app.json')),k=read(path.join(sibling,'data/link/key.json'));if(!manifest||!k)throw fail('GAME_NOT_STARTED',503);return{origin:'http://127.0.0.1:'+manifest.port,key:k.key};};
 async function flush(){if(closed||working)return;working=true;try{const pending=fs.readdirSync(directory).filter(n=>UUID.test(n.slice(0,-5))&&n.endsWith('.json')).map(n=>({f:path.join(directory,n),r:read(path.join(directory,n))})).filter(({r})=>!r.deliveredAt&&!r.failure).sort((a,b)=>Date.parse(a.r.queuedAt)-Date.parse(b.r.queuedAt));for(const {f,r} of pending){if(closed)break;if(now()-Date.parse(r.queuedAt)>DAY){r.payload.photo=null;r.failure='HANDOFF_EXPIRED';atomic(f,r);continue;}
    try{const c=config(),response=await (c.certificatePem?((url,options)=>require('./game-link-network.cjs').pinnedFetch(url,options,c.certificatePem)):transport)(c.origin+'/__kdw/link/ingest',{method:'POST',headers:{'Content-Type':'application/json','x-kdw-relay-key':c.key},body:JSON.stringify(r.payload),signal:AbortSignal.timeout(6000)});const result=await response.json();if(!response.ok)throw fail(result.error||'GAME_UNAVAILABLE',response.status);if(result.gameId!==r.payload.gameId||result.photoSha256!==(r.payload.photo?.sha256??null))throw fail('INVALID_GAME_ACK');r.deliveredAt=new Date(now()).toISOString();r.receipt=result;r.payload.photo=null;atomic(f,r);
    }catch(e){r.lastError=e.code||'GAME_UNAVAILABLE';if([400,409].includes(e.status)&&e.code!=='HANDOFF_DISABLED'){r.failure=r.lastError;r.payload.photo=null;}atomic(f,r);if(!r.failure)break;}}
  }finally{working=false;}}
 const timer=setInterval(()=>void flush().catch(()=>{}),2000);timer.unref();void flush().catch(()=>{});
 return{flush,close(){closed=true;clearInterval(timer);},handle(req,res){
  if(req.method==='GET'&&req.url==='/__kdw/settings'){void policy().then(p=>json(res,200,p)).catch(()=>json(res,503,{error:'SETTINGS_UNAVAILABLE'}));return true;}
  if(!req.url.startsWith('/__kdw/link/'))return false;
  void(async()=>{if(req.method!=='POST'||req.url!=='/__kdw/link/submit'||req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('INVALID_REQUEST',403);
   const b=await body(req),state=authorize(req.headers['x-kdw-session-token'],b.gameId,b.revision);if(!state)throw fail('INVALID_SESSION',403);
   const value=validate({schemaVersion:1,gameId:state.gameId,voiceSessionId:state.sessionId,missionId:state.missionId,audience:state.audience,goal:state.goal,photo:b.photo});if(!!value.photo!==!!state.hasPhoto)throw fail('PHOTO_STATE_CONFLICT',409);
   const f=path.join(directory,value.gameId+'.json'),signature=hash(JSON.stringify(value)),previous=read(f);
   if(previous&&previous.signature!==signature)throw fail('GAME_ID_CONFLICT',409);
   if(!previous)atomic(f,{signature,queuedAt:new Date(now()).toISOString(),payload:value});
   const r=read(f);json(res,200,{gameId:value.gameId,status:r.deliveredAt?'delivered':r.failure?'failed':'queued',error:r.failure,receipt:r.receipt??null});void flush().catch(()=>{});
  })().catch(e=>json(res,e.status||500,{error:e.code||'LINK_FAILED'}));return true;
 }};
}
module.exports={createGameHub,createStelaRelay,validate,jpegSize,publicGame};
