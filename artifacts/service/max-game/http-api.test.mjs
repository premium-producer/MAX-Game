import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createMaxGameApi,MAX_API_PREFIX} from './http-api.mjs';
import {createLocalSessionPort} from '../../max-game/src/application/session-port.mjs';
import {CHANNEL_CATALOG} from '../../max-game/src/content/channel-catalog.mjs';

let serial = 0;
async function fixture(t, extra = {}) {
  let time = 0;
  const contacts = [], ownership = [];
  const application = createLocalSessionPort({catalogs:[CHANNEL_CATALOG]});
  const api = createMaxGameApi({application:{...application,
    async handleContact(id,event,trustedNow) { contacts.push({id,event,trustedNow}); return application.getSnapshot(id); },
    async inputOwnerChanged(id,state) { ownership.push({id,state}); },
  },catalog:CHANNEL_CATALOG,authorize:req=>req.headers['x-vk-token']==='fixture-token',now:()=>time,...extra});
  const server = createServer((req,res)=>api.handle(req,res,new URL(req.url,'http://localhost')).then(handled=>{if(!handled){res.writeHead(404);res.end();}}));
  await new Promise(resolve=>server.listen(0,'localhost',resolve));
  const origin=`http://localhost:${server.address().port}${MAX_API_PREFIX}`;
  t.after(async()=>{await api.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  async function request(route,body,method=body?'POST':'GET',auth=true) {
    const response = await fetch(origin+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth?{'X-VK-Token':'fixture-token'}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json()};
  }
  async function create(id='test') {
    const result=await request('/sessions',{sessionId:id,taskId:CHANNEL_CATALOG.taskId,contentRevision:CHANNEL_CATALOG.contentRevision});
    assert.equal(result.status,201); return result.data;
  }
  const acquire=(id='test',ownerId='client-one',acquisitionId='acquisition-one')=>request(`/sessions/${id}/input-owner`,{action:'acquire',ownerId,acquisitionId});
  return {api,request,create,acquire,contacts,ownership,origin,setTime:value=>{time=value;}};
}
function command(snapshot, overrides={}) {
  const s=snapshot.state;
  return {schemaVersion:1,type:'ACT',commandId:`http-command-${++serial}`,sessionId:s.sessionId,contentRevision:s.contentRevision,missionId:s.missionId,taskId:s.taskId,screenId:s.screenId,expectedRevision:s.revision,actionId:'channel.open-create-menu',...overrides};
}

test('MAX API is isolated, versioned, and requires authorization for writes',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/catalog')).data.taskId,CHANNEL_CATALOG.taskId);
  assert.equal((await f.request('/sessions',{sessionId:'unauthorized'},'POST',false)).status,403);
  await f.create();await f.create('other-zone');
  assert.equal((await f.request('/sessions/test')).data.state.revision,0);
  assert.equal((await f.request('/sessions/missing')).status,404);
  assert.equal((await f.request('/sessions',{sessionId:'test',taskId:CHANNEL_CATALOG.taskId,contentRevision:CHANNEL_CATALOG.contentRevision})).status,409);
});

test('lease excludes a second owner and stale generations after expiry',async t=>{
  const f=await fixture(t);const snapshot=await f.create();
  const claimed=await f.acquire(),owner=claimed.data;
  assert.equal(claimed.status,200);
  assert.deepEqual((await f.acquire()).data,owner); // lost lease ACK retry
  assert.equal((await f.acquire('test','client-two','acquisition-two')).status,409);
  assert.equal((await f.request('/sessions/test/commands',{owner:{...owner,token:'invented'},command:command(snapshot)})).status,403);
  f.setTime(15000);await f.api.sweep();
  const next=(await f.acquire('test','client-two','acquisition-two')).data;
  assert.equal(next.generation,2);
  assert.notEqual(next.token,owner.token);
  assert.equal((await f.request('/sessions/test/input-owner',{action:'renew',owner})).status,403);
  assert.equal((await f.request('/sessions/test/commands',{owner,command:command(snapshot)})).status,403);
  assert.ok(f.ownership.some(change=>change.state.active===false));
});

test('concurrent retries commit once; stale commands conflict and zones remain isolated',async t=>{
  const f=await fixture(t),snapshot=await f.create();await f.create('other');
  const owner=(await f.acquire()).data,cmd=command(snapshot);
  const responses=await Promise.all([f.request('/sessions/test/commands',{owner,command:cmd}),f.request('/sessions/test/commands',{owner,command:cmd})]);
  assert.ok(responses.every(response=>response.status===200));
  assert.deepEqual(responses.map(response=>response.data.duplicate),[false,true]);
  assert.equal((await f.request('/sessions/test')).data.state.revision,1);
  const stale=await f.request('/sessions/test/commands',{owner,command:command(snapshot)});
  assert.equal(stale.status,409);assert.equal(stale.data.reply.code,'REVISION_CONFLICT');
  assert.equal((await f.request('/sessions/other')).data.state.revision,0);
  assert.equal((await f.request('/sessions/test/commands',{owner,command:{...cmd,sessionId:'other'}})).status,400);
});

test('normalized contacts reject replay and client timestamps or completion flags',async t=>{
  const f=await fixture(t);await f.create();const owner=(await f.acquire()).data;
  const event={contactId:'finger-one',sequence:0,type:'down',inside:true};
  assert.equal((await f.request('/sessions/test/contacts',{owner,event})).status,200);
  assert.equal((await f.request('/sessions/test/contacts',{owner,event})).status,409);
  assert.equal((await f.request('/sessions/test/contacts',{owner,event:{...event,sequence:1,scanPassed:true}})).status,400);
  assert.equal((await f.request('/sessions/test/contacts',{owner,event:{...event,sequence:1,timestamp:9000}})).status,400);
  f.setTime(800);
  assert.equal((await f.request('/sessions/test/contacts',{owner,event:{...event,sequence:1,type:'move'}})).status,200);
  assert.equal(f.contacts.at(-1).trustedNow,800);
  await f.request('/sessions/test/input-owner',{action:'release',owner});
  assert.equal((await f.request('/sessions/test/contacts',{owner,event:{...event,sequence:2,type:'up'}})).status,403);
});

test('SSE delivers confirmed snapshots; reconnect starts from latest snapshot',async t=>{
  const f=await fixture(t),snapshot=await f.create(),owner=(await f.acquire()).data;
  const abort=new AbortController();t.after(()=>abort.abort());
  const response=await fetch(f.origin+'/sessions/test/events',{signal:abort.signal});
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);
  const reader=response.body.getReader(),first=new TextDecoder().decode((await reader.read()).value);
  assert.match(first,/"revision":0/);
  await f.request('/sessions/test/commands',{owner,command:command(snapshot)});
  const next=new TextDecoder().decode((await reader.read()).value);
  assert.match(next,/"revision":1/);abort.abort();
  assert.equal((await f.request('/sessions/test')).data.state.revision,1);
  assert.equal((await f.request('/sessions/missing/events')).status,404);
});

test('layout endpoint cannot be abused to send an ACT or wrong session',async t=>{
  const f=await fixture(t),snapshot=await f.create(),owner=(await f.acquire()).data;
  assert.equal((await f.request('/sessions/test/layouts/base',{owner,command:command(snapshot)},'PUT')).status,400);
  assert.equal((await f.request('/sessions/test/commands',{command:command(snapshot)})).status,403);
  assert.equal((await f.request('/sessions/test')).data.state.revision,0);
});
