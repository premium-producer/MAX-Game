import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createMaxGameApi} from '../../service/max-game/http-api.mjs';
import {createLocalSessionPort} from '../src/application/session-port.mjs';
import {createServerSessionPort} from '../src/application/server-session-port.mjs';
import {CHANNEL_CATALOG as catalog} from '../src/content/channel-catalog.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';

async function fixture(t,{fetch:fetchImpl=fetch,eventSourceFactory=null,application=createLocalSessionPort({catalogs:[catalog]}),content=catalog,now=Date.now}={}) {
  const api=createMaxGameApi({application,catalog:content,authorize:()=>true,now});
  const server=createServer((req,res)=>api.handle(req,res,new URL(req.url,'http://localhost')));
  await new Promise(resolve=>server.listen(0,'localhost',resolve));
  const port=createServerSessionPort({baseUrl:`http://localhost:${server.address().port}/api/max-game/v1`,fetch:fetchImpl,eventSourceFactory,ownerId:'client-fixture',heartbeatMs:0});
  t.after(async()=>{await port.close();await api.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const snapshot=await port.createSession({sessionId:'network-test',taskId:catalog.taskId,contentRevision:catalog.contentRevision});
  return {port,snapshot,api,baseUrl:`http://localhost:${server.address().port}/api/max-game/v1`};
}
let serial=0;
const command=(snapshot,actionId='channel.open-create-menu')=>({schemaVersion:1,type:'ACT',commandId:`client-command-${++serial}`,sessionId:snapshot.state.sessionId,contentRevision:snapshot.state.contentRevision,missionId:snapshot.state.missionId,taskId:snapshot.state.taskId,screenId:snapshot.state.screenId,expectedRevision:snapshot.state.revision,actionId});

test('server SessionPort drives the same task without browser storage or renderer',async t=>{
  const {port,snapshot}=await fixture(t);
  const result=await port.sendCommand(command(snapshot));
  assert.equal(result.snapshot.state.screenId,'blogger.channel.menu');
  assert.equal(result.duplicate,false);
  assert.equal((await port.getSnapshot('network-test')).state.revision,1);
  await port.releaseInputOwner('network-test');
});

test('lost response after commit pauses new actions and retries exact command ID on reconnect',async t=>{
  let lose=true;
  const {port,snapshot}=await fixture(t,{fetch:async(...args)=>{const response=await fetch(...args);if(lose&&String(args[0]).endsWith('/commands')){lose=false;await response.json();throw new Error('response lost');}return response;}});
  const cmd=command(snapshot);
  await assert.rejects(port.sendCommand(cmd),{code:'BACKEND_OFFLINE'});
  await assert.rejects(port.sendCommand({...cmd,commandId:'other-intent'}),{code:'BACKEND_OFFLINE'});
  const current=await port.reconnect('network-test');
  assert.equal(current.state.revision,1);
  const duplicate=await port.sendCommand(cmd);
  assert.equal(duplicate.duplicate,true);assert.equal(duplicate.snapshot.state.revision,1);
  const next=await port.sendCommand(command(current,'channel.choose-create'));
  assert.equal(next.snapshot.state.revision,2);
  const older=await port.sendCommand(cmd);
  assert.equal(older.reply.snapshot.revision,1);assert.equal(older.snapshot.state.revision,2);
});

test('SSE error preserves confirmed frame; a stale event cannot roll state back',async t=>{
  const handlers=new Map();let eventClosed=false;
  const {port,snapshot}=await fixture(t,{eventSourceFactory:()=>({addEventListener:(type,callback)=>handlers.set(type,callback),close:()=>{eventClosed=true;}})});
  const observed=[];const unsubscribe=await port.subscribe('network-test',event=>observed.push(event));
  const result=await port.sendCommand(command(snapshot));
  handlers.get('state')({data:JSON.stringify({snapshot})});
  assert.equal(observed.at(-1).snapshot.state.revision,1);
  handlers.get('error')();
  assert.equal(observed.at(-1).connected,false);assert.deepEqual(observed.at(-1).snapshot,result.snapshot);
  await assert.rejects(port.sendCommand(command(result.snapshot,'channel.choose-create')),{code:'BACKEND_OFFLINE'});
  await port.reconnect('network-test');assert.equal(observed.at(-1).connected,true);
  unsubscribe();assert.equal(eventClosed,true);
});

test('invalid action returns backend refusal and does not poison the next command',async t=>{
  const {port,snapshot}=await fixture(t);
  const rejected=await port.sendCommand(command(snapshot,'invented-action'));
  assert.equal(rejected.reply.ok,false);assert.equal(rejected.snapshot.state.revision,0);
  const applied=await port.sendCommand(command(snapshot));assert.equal(applied.snapshot.state.revision,1);
});

test('observer errors do not break ACK and closed port refuses late callbacks',async t=>{
  const {port,snapshot}=await fixture(t);
  await port.subscribe('network-test',()=>{throw new Error('observer');});
  assert.equal((await port.sendCommand(command(snapshot))).snapshot.state.revision,1);
  await port.close();await assert.rejects(port.getSnapshot('network-test'),{code:'PORT_CLOSED'});
  await assert.rejects(port.sendCommand(command(snapshot)),{code:'PORT_CLOSED'});
});

test('closing one network owner allows immediate ownership by the next renderer',async t=>{
  const {port,snapshot,baseUrl}=await fixture(t);
  await port.sendCommand(command(snapshot));await port.close();
  const next=createServerSessionPort({baseUrl,eventSourceFactory:null,ownerId:'next-renderer',heartbeatMs:0});t.after(()=>next.close());
  assert.equal((await next.getSnapshot('network-test')).state.revision,1);
  const lease=await next.acquireInputOwner('network-test');assert.equal(lease.generation,2);
});

test('network mission starts with post-lease revision and confirms hold using server time',async t=>{
  let time=0;const now=()=>time;
  const application=createMissionSessionApplication({catalog:MISSION_CATALOG,persistence:createMemoryPersistencePort(),now});
  const {port,snapshot,api}=await fixture(t,{application,content:MISSION_CATALOG,now});
  assert.equal(snapshot.state.ownerActive,true);
  const selected=await port.sendCommand({schemaVersion:1,type:'SELECT_MISSION',commandId:'select-blogger',sessionId:'network-test',expectedRevision:snapshot.state.revision,contentRevision:MISSION_CATALOG.contentRevision,missionId:'blogger'});
  assert.equal(selected.reply.ok,true);assert.equal(selected.snapshot.state.status,'scan');
  await port.handleContact('network-test',{contactId:'pointer',sequence:0,type:'down',inside:true});time=800;await api.sweep();
  const task=await port.getSnapshot('network-test');assert.equal(task.state.status,'task');
  const answer=await port.sendCommand({schemaVersion:1,type:'ACT',commandId:'tap-native-plus',sessionId:'network-test',expectedRevision:task.state.revision,contentRevision:MISSION_CATALOG.contentRevision,screenId:task.state.screenId,actionId:'channel.open-create-menu'});
  assert.equal(answer.reply.ok,true);assert.equal(answer.snapshot.state.screenId,'blogger.channel.menu');
});
