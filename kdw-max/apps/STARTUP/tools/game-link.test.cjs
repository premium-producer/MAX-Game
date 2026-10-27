const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto'),{Readable}=require('node:stream'),{EventEmitter}=require('node:events');
const {createGameHub,createStelaRelay}=require('./game-link.cjs');
const {attachRendererRecovery}=require('./renderer-recovery.cjs');
const origin='http://127.0.0.1:1';
const payload=(voiceSessionId=randomUUID())=>({schemaVersion:1,gameId:randomUUID(),voiceSessionId,missionId:'blogger',audience:'blogger',goal:null,photo:null});
function request(handler,url,body={},method='POST',headers={}){return new Promise((resolve,reject)=>{const req=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(req,{url,method,headers:{origin,'content-type':'application/json',...headers}});const res={writeHead(status){this.status=status;},end(value){resolve({status:this.status,value:JSON.parse(value)});}};try{assert.equal(handler.handle(req,res),true);}catch(e){reject(e);}});}
async function release(hub,game,revision=1){const out=await request(hub,`/__kdw/link/games/${game.gameId}/progress`,{gameId:game.gameId,revision,runId:1,status:'menu',missionId:null,taskId:null,screenId:null,contentRevision:'audit',endReason:'qr'});assert.equal(out.status,200);}
test('queue counter excludes the active visitor and follows FIFO releases',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-queue-count-'));
 try{const hub=createGameHub({root,origin,production:true}),a=payload(),b=payload(),c=payload();
  assert.equal((await request(hub,'/__kdw/link/active',{},'GET')).value.queueCount,0);
  hub.ingest(a);hub.ingest(b);hub.ingest(c);
  const first=(await request(hub,'/__kdw/link/active',{},'GET')).value;
  assert.equal(first.game.gameId,a.gameId);assert.equal(first.queueCount,2);
  await release(hub,a);
  const next=(await request(hub,'/__kdw/link/active',{},'GET')).value;
  assert.equal(next.game.gameId,b.gameId);assert.equal(next.queueCount,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('replacement is durable, keeps other visitors FIFO, never revives a superseded ID',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-link-test-'));let time=1000000;
 try{let hub=createGameHub({root,origin,production:true,now:()=>time});const a=payload(),b=payload(),a2=payload(a.voiceSessionId);hub.ingest(a);time++;hub.ingest(b);time++;hub.ingest(a2);
  assert.equal(hub.get(a.gameId).status,'superseded');assert.equal(hub.active().gameId,b.gameId);assert.equal(hub.ingest(a).status,'superseded');
  hub=createGameHub({root,origin,production:true,now:()=>time});assert.equal(hub.get(a.gameId).status,'superseded');await release(hub,b);assert.equal(hub.active().gameId,a2.gameId);
  const denied=await request(hub,`/__kdw/link/games/${a2.gameId}/claim`,{gameId:a2.gameId},'POST',{origin:'http://foreign.invalid'});assert.equal(denied.status,403);
  const claim=await request(hub,`/__kdw/link/games/${a2.gameId}/claim`,{gameId:a2.gameId});assert.equal(claim.status,200);
  assert.throws(()=>hub.ingest(payload(a.voiceSessionId)),{code:'GAME_ALREADY_STARTED'});assert.equal(hub.active().gameId,a2.gameId);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('crash recovery completes an interrupted replacement journal before exposing the queue',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-journal-test-'));
 try{let hub=createGameHub({root,origin,production:true});const a=payload();hub.ingest(a);const b=payload(a.voiceSessionId),stamp=new Date().toISOString();
  const next={...b,signature:'fixture',status:'queued',createdAt:stamp,updatedAt:stamp,progress:null};fs.writeFileSync(path.join(root,'data/link/replacement.json'),JSON.stringify({next,previous:[a.gameId]}));
  hub=createGameHub({root,origin,production:true});assert.equal(hub.get(a.gameId).status,'superseded');assert.equal(hub.active().gameId,b.gameId);assert.equal(fs.existsSync(path.join(root,'data/link/replacement.json')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('relay exposes current assignment separately from immutable delivery receipt',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-relay-test-'));let relay,time=1000000;
 try{const hub=createGameHub({root:path.join(root,'max'),origin,production:true,now:()=>time}),a=payload(),b=payload();hub.ingest(a);time++;
  const relayRoot=path.join(root,'stela');fs.mkdirSync(path.join(relayRoot,'data'),{recursive:true});fs.writeFileSync(path.join(relayRoot,'data/game-link.local.json'),JSON.stringify({gameOrigin:origin,key:'a'.repeat(64)}));
  relay=createStelaRelay({root:relayRoot,origin,now:()=>time,authorize:token=>token==='denied'?null:({...b,sessionId:b.voiceSessionId,hasPhoto:false}),transport:async(url,options)=>{
   if(url.endsWith('/ingest'))return{ok:true,json:async()=>hub.ingest(JSON.parse(options.body))};const response=await request(hub,new URL(url).pathname,{},'GET');return{ok:response.status===200,json:async()=>response.value};
  }});
  await request(relay,'/__kdw/link/submit',{gameId:b.gameId,revision:1,photo:null});await relay.flush();
  const queued=await request(relay,'/__kdw/link/submit',{gameId:b.gameId,revision:1,photo:null});assert.equal(queued.value.receipt.status,'queued');assert.equal(queued.value.assignment.status,'queued');
  await release(hub,a);hub.active();const invited=await request(relay,'/__kdw/link/status',{gameId:b.gameId,revision:1});assert.equal(invited.value.receipt.status,'queued');assert.equal(invited.value.assignment.status,'invited');
  const denied=await request(relay,'/__kdw/link/status',{gameId:b.gameId,revision:1},'POST',{'x-kdw-session-token':'denied'});assert.equal(denied.status,403);
  time+=91000;const unavailable=await request(relay,'/__kdw/link/submit',{gameId:b.gameId,revision:1,photo:null});assert.equal(unavailable.value.assignment.status,'unavailable');
 }finally{relay?.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('offline relay supersedes only pending choices from the same visitor and prunes terminal history',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-outbox-test-'));let relay,time=Date.now(),current=payload();
 try{fs.mkdirSync(path.join(root,'data/link/outbox'),{recursive:true});const old=payload(),oldFile=path.join(root,'data/link/outbox',old.gameId+'.json');fs.writeFileSync(oldFile,JSON.stringify({queuedAt:new Date(time-31*86400000).toISOString(),deliveredAt:new Date(time-31*86400000).toISOString(),payload:old}));
  relay=createStelaRelay({root,origin,now:()=>time,authorize:()=>({...current,sessionId:current.voiceSessionId,hasPhoto:false}),transport:async()=>{throw Error('offline');}});
  const a=current;await request(relay,'/__kdw/link/submit',{gameId:a.gameId,revision:1,photo:null});current=payload(a.voiceSessionId);await request(relay,'/__kdw/link/submit',{gameId:current.gameId,revision:2,photo:null});await relay.flush();
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'data/link/outbox',a.gameId+'.json'))).failure,'SUPERSEDED');assert.equal(JSON.parse(fs.readFileSync(path.join(root,'data/link/outbox',current.gameId+'.json'))).failure,undefined);assert.equal(fs.existsSync(oldFile),false);
 }finally{relay?.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('renderer recovery reloads at most three times then shows an operator retry',async()=>{
 const window=new EventEmitter();window.webContents=new EventEmitter();const loads=[],jobs=[];window.loadURL=async url=>loads.push(url);window.show=()=>{};
 attachRendererRecovery({window,entry:origin+'/game',schedule:fn=>(jobs.push(fn),jobs.length),cancel:()=>{},now:()=>1000});
 for(let i=0;i<4;i++){window.webContents.emit('render-process-gone');jobs.shift()?.();await new Promise(r=>setImmediate(r));}
 assert.equal(loads.filter(x=>x===origin+'/game').length,3);assert.ok(loads.at(-1).startsWith('data:text/html'));assert.match(decodeURIComponent(loads.at(-1)),/Повторить запуск/);window.emit('closed');
});
test('simultaneous palm and replacement have a single winner in either arrival order',async()=>{
 for(const claimFirst of [true,false]){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-claim-race-'));
  try{const hub=createGameHub({root,origin,production:true}),a=payload(),b=payload(a.voiceSessionId);hub.ingest(a);
   const claim=()=>request(hub,`/__kdw/link/games/${a.gameId}/claim`,{gameId:a.gameId});
   const replace=()=>request(hub,'/__kdw/link/ingest',b,'POST',{origin:undefined,'x-kdw-relay-key':hub.key});
   const result=await Promise.all(claimFirst?[claim(),replace()]:[replace(),claim()]);assert.equal(result[0].status,200);assert.equal(result[1].status,409);assert.equal(hub.active().gameId,claimFirst?a.gameId:b.gameId);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
test('unchanged heartbeat refreshes availability without rewriting visitor data',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-heartbeat-'));let time=1000000;
 try{const hub=createGameHub({root,origin,production:true,now:()=>time}),a=payload();hub.ingest(a);
  const progress={gameId:a.gameId,revision:1,runId:1,status:'task',missionId:'blogger',taskId:'blogger.channel',screenId:'blogger.channel.menu',contentRevision:'test'};
  await request(hub,`/__kdw/link/games/${a.gameId}/progress`,progress);const file=path.join(root,'data/link/games',a.gameId+'.json'),before=fs.readFileSync(file);
  time+=91000;await request(hub,`/__kdw/link/games/${a.gameId}/progress`,progress);assert.deepEqual(fs.readFileSync(file),before);const current=await request(hub,`/__kdw/link/games/${a.gameId}/status`,{},'GET');assert.equal(current.value.assignment.status,'playing');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('explicit output startup cancels prior visitors and queue, preserves receipts, and admits a fresh visitor',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-idle-boot-'));
 try{const hub=createGameHub({root,origin,production:true}),a=payload(),b=payload();hub.ingest(a);await request(hub,`/__kdw/link/games/${a.gameId}/claim`,{gameId:a.gameId});hub.ingest(b);
 const file=path.join(root,'data/link/games',a.gameId+'.json'),before=JSON.parse(fs.readFileSync(file));assert.equal(hub.active().gameId,a.gameId);
 assert.equal((await hub.resetForStartup()).cancelled,2);assert.equal(hub.active(),null);const after=JSON.parse(fs.readFileSync(file));assert.equal(after.signature,before.signature);assert.equal(after.claimedAt,before.claimedAt);assert.deepEqual(after.standPolicy,before.standPolicy);assert.equal(after.endReason,'startup-reset');assert.equal(hub.ingest(a).status,'cancelled');assert.equal(hub.active(),null);
 const restarted=createGameHub({root,origin,production:true});assert.equal(restarted.active(),null);const fresh=payload();restarted.ingest(fresh);assert.equal(restarted.active().gameId,fresh.gameId);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
