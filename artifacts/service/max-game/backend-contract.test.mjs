import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createMaxGameApi, MAX_API_PREFIX} from './http-api.mjs';
import {mkdirSync, mkdtempSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {createSqlitePersistencePort} from './sqlite-persistence.mjs';

function response() {
  const res = new Readable({read(){}});
  res.statusCode = null; res.headersSent = false; res.body = ''; res.writableLength = 0;
  res.writeHead = (status, headers) => {res.statusCode = status;res.headers = headers;res.headersSent = true;};
  res.write = chunk => {res.body += chunk;return true;};
  res.end = chunk => {if(chunk)res.body += chunk;res.finished = true;};
  return res;
}
function fixture(t) {
  let time = 0, failCancel = false;
  const ownership = [], snapshots = new Map();
  const application = {
    async createSession(input) {snapshots.set(input.sessionId, input);return input;},
    async getSnapshot(id) {if(!snapshots.has(id))throw Object.assign(new Error(), {code:'SESSION_NOT_FOUND'});return snapshots.get(id);},
    async sendCommand(input) {return {reply:{ok:true}, command:input};},
    async subscribe(id, callback) {callback({snapshot:await this.getSnapshot(id), effects:[]});return ()=>{};},
    async inputOwnerChanged(id, input) {
      if (!input.active && failCancel) throw Object.assign(new Error(), {code:'STORAGE_UNAVAILABLE'});
      ownership.push({id, active:input.active});
    },
    async close() {},
  };
  const api = createMaxGameApi({application,catalog:{schemaVersion:1},authorize:()=>true,now:()=>time});
  t.after(async()=>{failCancel=false;await api.close();});
  async function request(route, body, {chunks, method='POST'}={}) {
    const bytes = Buffer.from(JSON.stringify(body));
    const req = Readable.from(chunks ?? [bytes]);
    req.method = method;req.headers = {'content-type':'application/json'};
    const res = response();
    await api.handle(req, res, new URL(MAX_API_PREFIX+route,'http://localhost'));
    return {status:res.statusCode, data:JSON.parse(res.body)};
  }
  return {api,request,ownership,setTime:value=>{time=value;},failCancel:value=>{failCancel=value;}};
}

test('failed owner release must not make a still-active input domain available to a new owner', async t => {
  const f=fixture(t);
  await f.request('/sessions',{sessionId:'one'});
  const owner=(await f.request('/sessions/one/input-owner',{action:'acquire',ownerId:'old',acquisitionId:'old-acquire'})).data;
  f.failCancel(true);
  const released=await f.request('/sessions/one/input-owner',{action:'release',owner});
  assert.equal(released.status,503);
  const replacement=await f.request('/sessions/one/input-owner',{action:'acquire',ownerId:'new',acquisitionId:'new-acquire'});
  assert.equal(replacement.status,409);
  assert.equal(replacement.data.error.code,'OWNER_BUSY');
  assert.deepEqual(f.ownership,[{id:'one',active:true}]);
});

test('JSON parsing preserves Unicode even when UTF-8 bytes arrive in separate chunks', async t => {
  const f=fixture(t), body={sessionId:'unicode', label:'Ёлка'};
  const bytes=Buffer.from(JSON.stringify(body)), at=bytes.indexOf(Buffer.from('Ё'))+1;
  const result=await f.request('/sessions',body,{chunks:[bytes.subarray(0,at),bytes.subarray(at)]});
  assert.equal(result.status,201);
  assert.equal(result.data.label,body.label);
});

test('lease expires exactly at boundary and ownership is cancelled before a new holder receives input', async t => {
  const f=fixture(t);
  await f.request('/sessions',{sessionId:'one'});
  const owner=(await f.request('/sessions/one/input-owner',{action:'acquire',ownerId:'old',acquisitionId:'old-acquire'})).data;
  f.setTime(owner.expiresAt);
  const next=await f.request('/sessions/one/input-owner',{action:'acquire',ownerId:'new',acquisitionId:'new-acquire'});
  assert.equal(next.status,200);
  assert.deepEqual(f.ownership,[{id:'one',active:true},{id:'one',active:false},{id:'one',active:true}]);
  assert.equal(next.data.generation,owner.generation+1);
  const stale=await f.request('/sessions/one/commands',{owner,command:{sessionId:'one'}});
  assert.equal(stale.status,403);
});

test('actual mission Application uses SQLite and restores paused confirmed task without rescanning', async () => {
  const [{MISSION_CATALOG:catalog},{createMissionSessionApplication}]=await Promise.all([
    import('../../max-game/src/content/mission-catalog.mjs'),import('../../max-game/src/application/mission-session.mjs'),
  ]);
  const root=resolve('artifacts/workspace/tests/max-shared-sqlite-20261002');mkdirSync(root,{recursive:true});
  const db=join(mkdtempSync(join(root,'mission-smoke-')),'mission.sqlite');
  let time=0,storage=await createSqlitePersistencePort({databasePath:db});
  let application=createMissionSessionApplication({catalog,persistence:storage,now:()=>time});
  let paused;
  try {
    const initial=await application.createSession({sessionId:'one'});
    await application.inputOwnerChanged('one',{active:true});
    const owned=await application.getSnapshot('one');
    await application.sendCommand({schemaVersion:1,type:'SELECT_MISSION',commandId:'select-blogger',sessionId:'one',contentRevision:catalog.contentRevision,expectedRevision:owned.state.revision,missionId:'blogger'});
    await application.handleContact('one',{contactId:'pointer',sequence:0,type:'down',inside:true});
    time=800;await application.pollTime('one');
    const current=await application.getSnapshot('one');
    assert.equal(current.state.status,'task');assert.equal(current.state.taskId,'blogger.channel');
    time=1000;await application.inputOwnerChanged('one',{active:false});
    paused=await application.getSnapshot('one');
    assert.equal(paused.state.ownerActive,false);
    assert.equal(initial.state.status,'menu');
  } finally {await application.close();await storage.close();}
  time=5000;storage=await createSqlitePersistencePort({databasePath:db});
  application=createMissionSessionApplication({catalog,persistence:storage,now:()=>time});
  try {
    const restored=await application.getSnapshot('one');
    assert.deepEqual(restored.state,paused.state);
    assert.equal(restored.view.remainingMs,paused.view.remainingMs);
    assert.equal(restored.view.resumeRequired,true);
    await application.inputOwnerChanged('one',{active:true});
    const resumed=await application.getSnapshot('one');
    assert.equal(resumed.view.remainingMs,paused.view.remainingMs);
    assert.equal(resumed.state.screenId,paused.state.screenId);
  } finally {await application.close();await storage.close();}
});

test('fresh input owner can restart contact sequence using the same physical contact ID', async () => {
  const [{MISSION_CATALOG:catalog},{createMissionSessionApplication},{createMemoryPersistencePort}]=await Promise.all([
    import('../../max-game/src/content/mission-catalog.mjs'),import('../../max-game/src/application/mission-session.mjs'),import('../../max-game/src/application/memory-persistence.mjs'),
  ]);
  let time=0;const app=createMissionSessionApplication({catalog,persistence:createMemoryPersistencePort(),now:()=>time});
  try {
    await app.createSession({sessionId:'handoff'});await app.inputOwnerChanged('handoff',{active:true});
    const current=await app.getSnapshot('handoff');
    await app.sendCommand({schemaVersion:1,type:'SELECT_MISSION',commandId:'select',sessionId:'handoff',contentRevision:catalog.contentRevision,expectedRevision:current.state.revision,missionId:'blogger'});
    await app.handleContact('handoff',{contactId:'pointer',sequence:0,type:'down',inside:true});
    time=100;await app.handleContact('handoff',{contactId:'pointer',sequence:1,type:'up',inside:true});
    await app.inputOwnerChanged('handoff',{active:false});await app.inputOwnerChanged('handoff',{active:true});
    await app.handleContact('handoff',{contactId:'pointer',sequence:0,type:'down',inside:true});
    time=900;await app.pollTime('handoff');
    assert.equal((await app.getSnapshot('handoff')).state.status,'task');
  } finally {await app.close();}
});
