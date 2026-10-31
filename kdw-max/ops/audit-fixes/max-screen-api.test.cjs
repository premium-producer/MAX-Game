const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto');
const {createScreenState}=require('../../apps/max-game/launcher/screen-state.cjs');
const {allowedPath}=require('../../apps/max-game/launcher/lan-admin.cjs');
test('independent screen snapshot, SSE, CSV, ordering, ownership, expiry and recovery',async()=>{
 let now=10000,api;const server=http.createServer((req,res)=>api.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;api=createScreenState({origin,now:()=>now});
 const get=async path=>(await fetch(origin+'/__kdw/screen/'+path)).json();
 const publisherId=crypto.randomUUID();let sequence=0;
 const post=async (data={},headers={})=>fetch(origin+'/__kdw/screen/publish',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify({publisherId,sequence:++sequence,stage:'menu',screenId:'max-menu',missionId:null,taskId:null,phase:'menu',presentation:'visible',ready:true,...data})});
 try{
  assert.equal((await get('state')).online,false);
  const stream=await fetch(origin+'/__kdw/screen/events'),reader=stream.body.getReader();let received='';
  const next=async()=>{while(!received.includes('\nevent: screen\ndata:'))received+=new TextDecoder().decode((await reader.read()).value);while(!received.slice(received.indexOf('data: ')).includes('\n\n'))received+=new TextDecoder().decode((await reader.read()).value);const start=received.indexOf('data: ')+6,end=received.indexOf('\n\n',start),v=JSON.parse(received.slice(start,end));received=received.slice(end+2);return v;};
  assert.equal((await next()).stage,null);
  assert.equal((await post()).status,200);assert.equal((await next()).screenId,'max-menu');
  const initial=await get('state');now+=1000;await post();assert.equal((await get('state')).revision,initial.revision);
  assert.equal((await post({sequence:0})).status,409);
  assert.equal((await post({publisherId:crypto.randomUUID()})).status,409);
  assert.equal((await post({}, {Origin:'https://outside.example'})).status,403);
  assert.equal((await post({stage:'bad state'})).status,400);
  await post({stage:'task',screenId:'digital-id.create',taskId:'digital-id.create-id',phase:'phone-enter',missionId:'digital-id',presentation:'transitioning'});
  const photo=await next();assert.equal(photo.phase,'phone-enter');assert.equal(photo.visible,false);assert.equal(photo.transitioning,true);
  const csv=await (await fetch(origin+'/__kdw/screen/state.csv')).text();assert.equal(csv.trim().split('\r\n').length,2);assert.match(csv,/"digital-id.create"/);assert.match(csv,/"phone-enter"/);
  assert.ok(!('publisherId' in photo));assert.ok(!('sessionId' in photo));
  now+=6001;const stale=await get('state');assert.equal(stale.stale,true);assert.equal(stale.visible,false);assert.equal((await next()).presentation,'unavailable');
  await post({publisherId:crypto.randomUUID(),sequence:0});assert.equal((await next()).online,true);
  const reconnect=await fetch(origin+'/__kdw/screen/events',{headers:{'Last-Event-ID':'old:0'}});const rr=reconnect.body.getReader();const first=new TextDecoder().decode((await rr.read()).value);assert.match(first,/max-menu/);void rr.cancel();void reader.cancel();
  for(const route of ['state','state.csv','events']){assert.equal(allowedPath('max','/__kdw/screen/'+route,'GET'),true);assert.equal(allowedPath('max','/__kdw/screen/'+route,'POST'),false);}
  assert.equal(allowedPath('max','/__kdw/screen/publish','POST'),false);
 }finally{api.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
