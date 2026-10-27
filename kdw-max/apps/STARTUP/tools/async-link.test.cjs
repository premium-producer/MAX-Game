const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{randomUUID,createHash}=require('node:crypto'),{Readable}=require('node:stream');
const {createGameHub,createStelaRelay}=require('./game-link.cjs');
const {createAsyncRelay,TTL}=require('./async-link.cjs');
const origin='http://127.0.0.1:1';
function req(h,url,data={},method='POST',headers={}){return new Promise((resolve,reject)=>{const q=Readable.from([Buffer.isBuffer(data)?data:Buffer.from(JSON.stringify(data))]);Object.assign(q,{url,method,headers:Object.fromEntries(Object.entries({'content-type':'application/json',...headers}).map(([k,v])=>[k.toLowerCase(),v]))});const r={writeHead(status){this.status=status;},end(v){resolve({status:this.status,value:JSON.parse(v)});}};try{assert.equal(h.handle(q,r),true);}catch(e){reject(e);}});}
const mission=(session=randomUUID(),revision=1)=>({schemaVersion:2,gameId:randomUUID(),voiceSessionId:session,selectionRevision:revision,missionId:'blogger',audience:'blogger',goal:null,photoExpected:true,remainingTtlMs:TTL});
const jpeg=Buffer.from([255,216,255,192,0,17,8,7,128,4,56,3,1,17,0,2,17,0,3,17,0,255,217]);
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-async-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function network(h){return async(url,o={})=>{const r=await req(h,new URL(url).pathname,o.body?Buffer.isBuffer(o.body)?o.body:JSON.parse(o.body):{},o.method||'GET',{'x-kdw-relay-key':h.key,...o.headers});return{ok:r.status===200,status:r.status,json:async()=>r.value};};}
test('v2 mission starts without photo; delayed photo is idempotent and does not change claim/progress',async t=>{
 const root=fixture(t),hub=createGameHub({root,origin,production:true}),m=mission(),auth={'x-kdw-relay-key':hub.key};
 assert.equal((await req(hub,'/__kdw/link/v2/missions',m,'POST',auth)).status,200);
 assert.equal(hub.get(m.gameId).photo,null);
 const claim=await req(hub,`/__kdw/link/games/${m.gameId}/claim`,{gameId:m.gameId},'POST',{origin});assert.equal(claim.status,200);
 const before=hub.get(m.gameId).claimedAt;
 const headers={...auth,'content-type':'image/jpeg','x-kdw-voice-session':m.voiceSessionId,'x-kdw-photo-sha256':hash(jpeg)};
 const upload=()=>req(hub,`/__kdw/link/v2/missions/${m.gameId}/photo/1`,jpeg,'PUT',headers);
 assert.equal((await upload()).value.photo.status,'stored');assert.equal((await upload()).status,200);
 assert.equal(hub.get(m.gameId).claimedAt,before);assert.equal(hub.get(m.gameId).photo.base64,undefined);
 assert.equal(fs.readFileSync(path.join(root,'data/link/photos',hub.get(m.gameId).photo.blob)).equals(jpeg),true);
 assert.equal((await req(hub,'/__kdw/link/v2/missions',m,'POST',auth)).status,200);
 assert.equal((await req(hub,`/__kdw/link/v2/missions/${m.gameId}/cancel`,{},'POST',auth)).status,409);
});
test('expiry, clock rollback, restart and old selections cannot revive an invitation',async t=>{
 const root=fixture(t);let time=1000000;let hub=createGameHub({root,origin,production:true,now:()=>time});const m=mission(),auth={'x-kdw-relay-key':hub.key};
 await req(hub,'/__kdw/link/v2/missions',m,'POST',auth);time+=TTL+1;
 assert.equal(hub.active(),null);assert.equal(hub.get(m.gameId).status,'handoff-expired');
 hub=createGameHub({root,origin,production:true,now:()=>time});await req(hub,'/__kdw/link/v2/missions',m,'POST',auth);assert.equal(hub.active(),null);
 const newer=mission(m.voiceSessionId,3),older=mission(m.voiceSessionId,2);await req(hub,'/__kdw/link/v2/missions',newer,'POST',auth);
 assert.equal((await req(hub,'/__kdw/link/v2/missions',older,'POST',auth)).status,409);
 time-=100;assert.equal(hub.active(),null);
});
test('unready output is not an invitation; bad photo identity/hash/auth is rejected',async t=>{
 const hub=createGameHub({root:fixture(t),origin,production:true}),m=mission(),auth={'x-kdw-relay-key':hub.key};
 const result=await req(hub,'/__kdw/link/v2/missions',m,'POST',auth);assert.equal(result.value.assignment.status,'unavailable');
 assert.equal((await req(hub,'/__kdw/link/v2/missions',m)).status,403);
 assert.equal((await req(hub,`/__kdw/link/v2/missions/${m.gameId}/photo/1`,jpeg,'PUT',{...auth,'content-type':'image/jpeg','x-kdw-voice-session':randomUUID(),'x-kdw-photo-sha256':hash(jpeg)})).status,409);
 assert.equal(hub.get(m.gameId).photo,null);
});
test('slow network never blocks local submit/status/settings; outbox survives restart and lost ACK',async t=>{
 const root=fixture(t),hub=createGameHub({root:path.join(root,'max'),origin,production:true}),m=mission();let offline=true,lost=true,relay;
 const relayRoot=path.join(root,'stela'),auth=()=>({...m,sessionId:m.voiceSessionId,revision:1,hasPhoto:true});
 const transport=async(...args)=>{if(offline)throw Error('OFFLINE');const result=await network(hub)(...args);if(lost&&args[0].endsWith('/missions')){lost=false;throw Error('LOST_ACK');}return result;};
 const make=()=>createAsyncRelay({root:relayRoot,origin,authorize:auth,transport,config:()=>({origin,key:hub.key})});relay=make();t.after(()=>relay.close());
 const localHeaders={origin,'x-kdw-session-token':'test'},payload={gameId:m.gameId,revision:1};
 assert.equal((await req(relay,'/__kdw/link/v2/submit',payload,'POST',localHeaders)).value.status,'queued');await relay.flush();relay.close();
 offline=false;relay=make();await relay.flush();assert.equal(fs.readdirSync(path.join(root,'max/data/link/games')).length,1);relay.close();relay=make();await relay.flush();
 assert.equal((await req(relay,'/__kdw/link/v2/status',payload,'POST',localHeaders)).value.status,'delivered');
 assert.equal((await req(relay,'/__kdw/link/v2/photo',jpeg,'POST',{...localHeaders,'content-type':'image/jpeg','x-kdw-game-id':m.gameId,'x-kdw-revision':'1'})).status,200);
 await relay.flushPhotos();assert.ok(hub.get(m.gameId).photo,fs.readFileSync(path.join(relayRoot,'data/link/outbox-v2',m.gameId+'.json'),'utf8'));assert.equal(fs.existsSync(path.join(relayRoot,'data/link/outbox-v2/photos',m.gameId+'.jpg')),false);
 const slow=createStelaRelay({root:path.join(root,'slow'),origin,authorize:auth,transport:()=>new Promise(()=>{})});t.after(()=>slow.close());
 const response=await Promise.race([req(slow,'/__kdw/settings',{},'GET'),new Promise((_,reject)=>setTimeout(()=>reject(Error('SETTINGS_BLOCKED')),150))]);assert.equal(response.status,200);
});
test('a blocked control request does not lock the local API or the photo lane',async t=>{
 const root=fixture(t);let release;const m=mission(),relay=createAsyncRelay({root,origin,authorize:()=>({...m,sessionId:m.voiceSessionId,revision:1,hasPhoto:false}),config:()=>({origin,key:'a'.repeat(64)}),transport:()=>new Promise(r=>{release=r;})});t.after(()=>relay.close());
 const h={origin},b={gameId:m.gameId,revision:1};await req(relay,'/__kdw/link/v2/submit',b,'POST',h);const flush=relay.flush();await new Promise(r=>setImmediate(r));
 assert.equal((await Promise.race([req(relay,'/__kdw/link/v2/status',b,'POST',h),new Promise((_,reject)=>setTimeout(()=>reject(Error('LOCAL_API_BLOCKED')),150))])).status,200);
 release({ok:false,status:503,json:async()=>({error:'OFFLINE'})});await flush;
});

test('a claimed game outlives delivery TTL and a slow photo body does not hold the control queue',async t=>{
 const root=fixture(t);let time=1000000;const hub=createGameHub({root,origin,production:true,now:()=>time}),m=mission(),auth={'x-kdw-relay-key':hub.key};
 await req(hub,'/__kdw/link/v2/missions',m,'POST',auth);
 await req(hub,`/__kdw/link/games/${m.gameId}/claim`,{gameId:m.gameId},'POST',{origin});time+=TTL+1;
 assert.equal(hub.active().gameId,m.gameId);
 let finish;const blocked=new Promise(r=>{finish=r;});
 const request=Readable.from((async function*(){await blocked;yield jpeg;})());Object.assign(request,{url:`/__kdw/link/v2/missions/${m.gameId}/photo/1`,method:'PUT',headers:{...auth,'content-type':'image/jpeg','x-kdw-voice-session':m.voiceSessionId,'x-kdw-photo-sha256':hash(jpeg)}});
 let done;const uploaded=new Promise(r=>{done=r;});hub.handle(request,{writeHead(status){this.status=status;},end(value){done({status:this.status,value:JSON.parse(value)});}});
 const next=await Promise.race([req(hub,'/__kdw/link/v2/missions',mission(),'POST',auth),new Promise((_,reject)=>setTimeout(()=>reject(Error('CONTROL_BLOCKED_BY_PHOTO')),150))]);assert.equal(next.status,200);
 finish();assert.equal((await uploaded).status,200);assert.equal(hub.active().gameId,m.gameId);
});
