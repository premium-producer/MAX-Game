const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),{createGameHub,createStelaRelay,validate}=require(root+'/apps/STARTUP/tools/game-link.cjs');
const {Controller}=require(root+'/apps/stela/launcher/voice/controller.cjs'),{createVoiceGateway}=require(root+'/apps/stela/launcher/voice/gateway.cjs'),WS=require(root+'/apps/stela/launcher/voice/vendor/ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<400;i++){if(await fn())return;await delay(10);}throw Error('TIMEOUT');}
const capture=()=>({mimeType:'image/jpeg',base64:fs.readFileSync(path.join(__dirname,'synthetic-capture.jpg')).toString('base64')});
function payload(missionId='communication',photo=capture()){return{schemaVersion:1,gameId:crypto.randomUUID(),voiceSessionId:crypto.randomUUID(),missionId,audience:missionId==='business-promotion'?'business':missionId==='blogger'?'blogger':'personal',goal:missionId==='communication'?'connection':missionId==='digital-id'?'access':null,photo};}
function temp(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-linked-test-'));return{dir,close(){assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}};}
async function receiver(dir,now){let hub;const server=http.createServer((q,s)=>{if(!hub.handle(q,s)){s.writeHead(404);s.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;hub=createGameHub({root:dir,origin,now});return{hub,origin,close:()=>new Promise(r=>{server.closeAllConnections();server.close(r);})};}
test('durable ID, duplicate/lost ACK, queued visitors, restart, photo expiry and traversal guards',async()=>{
 const t=temp();let stamp=Date.now(),r=await receiver(t.dir,()=>stamp);try{
  const a=payload('business-promotion'),b=payload('digital-id',null);const first=r.hub.ingest(a);assert.equal(first.sessionId,a.gameId);assert.equal(first.gameMissionId,'business');assert.equal(first.hasPhoto,true);assert.equal(r.hub.ingest(a).duplicate,true);
  assert.throws(()=>r.hub.ingest({...a,photo:null}),/GAME_ID_CONFLICT/);r.hub.ingest(b);assert.equal(r.hub.active().gameId,a.gameId);assert.equal(r.hub.get(b.gameId).status,'queued');
  await r.close();r=await receiver(t.dir,()=>stamp);assert.equal(r.hub.active().gameId,a.gameId);assert.equal(r.hub.get(a.gameId).photo.sha256,validate(a).photo.sha256);
  let response=await fetch(r.origin+'/__kdw/link/ingest',{method:'POST',headers:{'Content-Type':'application/json','x-kdw-relay-key':'bad'},body:JSON.stringify(payload())});assert.equal(response.status,403);
  response=await fetch(r.origin+'/__kdw/link/games/'+a.gameId+'/progress',{method:'POST',headers:{Origin:r.origin,'Content-Type':'application/json'},body:JSON.stringify({gameId:a.gameId,revision:8,runId:1,status:'completed',missionId:'business',taskId:null,screenId:null,contentRevision:'test'})});assert.equal(response.status,200);
  stamp+=29000;assert.equal(r.hub.active().gameId,a.gameId);stamp+=1001;assert.equal(r.hub.active().gameId,b.gameId);
  stamp+=86400000;assert.equal(r.hub.get(a.gameId).photo,null);assert.equal(r.hub.get(a.gameId).gameId,a.gameId);
  response=await fetch(r.origin+'/__kdw/link/games/not-a-uuid');assert.equal(response.status,400);
 }finally{await r.close();t.close();}
});
test('real voice gateway: confirmed photo only, server-owned context, stale/token rejection and delivery',async()=>{
 const t=temp(),game=path.join(t.dir,'max-game'),stela=path.join(t.dir,'stela');fs.mkdirSync(game,{recursive:true});let r=await receiver(game);fs.writeFileSync(path.join(game,'app.json'),JSON.stringify({port:Number(new URL(r.origin).port)}));let relay,gateway;const messages=[];
 const server=http.createServer((q,s)=>{if(!relay.handle(q,s)&&!gateway.handle(q,s)){s.writeHead(404);s.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 gateway=createVoiceGateway({server,root:stela,origin,configLoader:()=>null});relay=createStelaRelay({root:stela,origin,authorize:(...a)=>gateway.handoff(...a)});
 let ws;try{
  const lease=await(await fetch(origin+'/__kdw/voice/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({voiceEnabled:false})})).json();ws=new WS(origin.replace('http','ws')+'/__kdw/voice/stream',['kdw-omni',lease.token],{origin});ws.on('message',b=>messages.push(JSON.parse(b)));await until(()=>messages.some(m=>m.type==='state'));
  const state=()=>messages.filter(m=>m.type==='state').at(-1).state;
  async function command(action){const before=state().revision;ws.send(JSON.stringify({type:'ready',revision:before,silent:true}));ws.send(JSON.stringify({type:'command',revision:before,id:crypto.randomUUID(),command:{action}}));await until(()=>state().revision>before);return state();}
  await command('begin');await command('digital-id');const id=state().gameId;assert.ok(id);await command('take-photo');
  const before=state();ws.send(JSON.stringify({type:'photo.captured',revision:before.revision,requestId:before.photoRequestId,width:1080,height:1920}));await until(()=>state().photoPhase==='review');
  async function submit(token=lease.token,revision=state().revision){return fetch(origin+'/__kdw/link/submit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-kdw-session-token':token},body:JSON.stringify({gameId:id,revision,photo:capture(),missionId:'blogger'})});}
  assert.equal((await submit()).status,403);await command('confirm-photo');assert.equal(state().gameId,id);assert.equal((await submit('bad')).status,403);assert.equal((await submit(lease.token,state().revision-1)).status,403);
  let response=await submit();assert.equal(response.status,200);assert.equal((await response.json()).status,'queued');await relay.flush();
  await until(()=>{try{return r.hub.get(id).photo!==null;}catch{return false;}});response=await submit();const delivered=await response.json();assert.equal(delivered.status,'delivered');assert.equal(delivered.receipt.missionId,'digital-id');assert.equal(delivered.receipt.photoSha256,validate(payload('digital-id')).photo.sha256);
  const saved=JSON.parse(fs.readFileSync(path.join(stela,'data/link/outbox',id+'.json')));assert.equal(saved.payload.photo,null);assert.equal(saved.receipt.gameId,id);
 }finally{ws?.terminate();relay.close();gateway.close();server.closeAllConnections();await new Promise(r=>server.close(r));await r.close();t.close();}
});
test('persistent outbox retries after outage and lost acknowledgement without duplicate game',async()=>{
 const t=temp(),stela=path.join(t.dir,'stela'),game=path.join(t.dir,'max-game');fs.mkdirSync(game,{recursive:true});const receiver1=await receiver(game),value=payload('blogger');fs.writeFileSync(path.join(game,'app.json'),JSON.stringify({port:Number(new URL(receiver1.origin).port)}));
 let online=false,lost=true,relay;const authorize=()=>({...value,sessionId:value.voiceSessionId,revision:4,stage:'result',hasPhoto:true});
 const server=http.createServer((q,s)=>relay.handle(q,s));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const transport=async(...args)=>{if(!online)throw Error('offline');const response=await fetch(...args);if(lost){lost=false;throw Error('lost ACK');}return response;};
 try{relay=createStelaRelay({root:stela,origin,authorize,transport});const res=await fetch(origin+'/__kdw/link/submit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({gameId:value.gameId,revision:4,photo:value.photo})});assert.equal(res.status,200);await delay(40);await relay.flush();relay.close();
  online=true;relay=createStelaRelay({root:stela,origin,authorize,transport});await until(()=>{try{return receiver1.hub.get(value.gameId).gameId===value.gameId;}catch{return false;}});await delay(30);await relay.flush();await until(()=>JSON.parse(fs.readFileSync(path.join(stela,'data/link/outbox',value.gameId+'.json'))).deliveredAt);assert.equal(fs.readdirSync(path.join(game,'data/link/games')).length,1);
 }finally{relay.close();server.closeAllConnections();await new Promise(r=>server.close(r));await receiver1.close();t.close();}
});
test('controller rotates game ID on a new mission and preserves it through retake/confirmation',()=>{
 const c=new Controller(),act=a=>{c.ready(c.state.revision);const result=c.apply({action:a},c.state.revision,crypto.randomUUID());assert.ok(result.accepted);return result.state;};act('begin');const a=act('business');act('take-photo');c.completePhoto({requestId:c.state.photoRequestId,width:1080,height:1920},c.state.revision);act('retake-photo');c.completePhoto({requestId:c.state.photoRequestId,width:1080,height:1920},c.state.revision);assert.equal(act('confirm-photo').gameId,a.gameId);assert.equal(act('back').gameId,null);assert.notEqual(act('blogger').gameId,a.gameId);
});
test('offline visitors retain creation order when delivery resumes',async()=>{
 const t=temp();let relay,online=false,stamp=Date.now();const sent=[],states=new Map();
 const server=http.createServer((q,s)=>relay.handle(q,s));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(path.join(t.dir,'data'),{recursive:true});fs.writeFileSync(path.join(t.dir,'data/game-link.local.json'),JSON.stringify({gameOrigin:'http://127.0.0.1:18752',key:'a'.repeat(64)}));
 const transport=async(_url,options)=>{if(!online)throw Error('offline');const p=JSON.parse(options.body);sent.push(p.gameId);return{ok:true,json:async()=>({gameId:p.gameId,photoSha256:null})};};
 relay=createStelaRelay({root:t.dir,origin,now:()=>stamp,authorize:(_token,id)=>states.get(id),transport});
 try{const ids=['ffffffff-ffff-4fff-8fff-ffffffffffff','11111111-1111-4111-8111-111111111111'];for(const gameId of ids){const p={...payload('communication',null),gameId};states.set(gameId,{...p,sessionId:p.voiceSessionId,hasPhoto:false});const response=await fetch(origin+'/__kdw/link/submit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({gameId,revision:1,photo:null})});assert.equal(response.status,200);stamp+=100;await delay(20);}online=true;await relay.flush();await until(()=>sent.length===2);assert.deepEqual(sent,ids);
 }finally{relay.close();server.closeAllConnections();await new Promise(r=>server.close(r));t.close();}
});
