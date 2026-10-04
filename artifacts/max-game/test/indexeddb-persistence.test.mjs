import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import 'fake-indexeddb/auto';
import {createIndexedDBPersistence} from '../src/application/indexeddb-persistence.mjs';
import {createBrowserPersistence} from '../src/application/browser-persistence.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';

function fixture(t,records={}){
 const key='max-v5-test',data=new Map([[key,JSON.stringify(records)]]),calls={writes:0,removes:0,clears:0};
 const legacyStorage={
  getItem:k=>data.get(k)??null,
  setItem(){calls.writes++;throw new DOMException('test legacy quota','QuotaExceededError');},
  removeItem(){calls.removes++;throw new Error('Legacy source must survive');},
  clear(){calls.clears++;throw new Error('Legacy source must survive');},
 };
 const databaseName=`max-idb-test-${randomUUID()}`,ports=[];
 const open=(options={})=>{const port=createIndexedDBPersistence({key,legacyStorage,databaseName,...options});ports.push(port);return port;};
 t.after(async()=>{
  for(const port of ports)await port.close();
  await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(databaseName);request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Test database still open'));});
  assert.deepEqual(calls,{writes:0,removes:0,clears:0},'migration never modifies localStorage');
 });
 return {key,data,calls,open};
}

test('imports a quota-blocked legacy save without rewriting it; IndexedDB wins after reopen',async t=>{
 const record={schemaVersion:2,mission:{receipts:[{commandId:'old'}]},layouts:{positions:{}}};
 const f=fixture(t,{saved:{version:7,record}}),source=f.data.get(f.key),port=f.open();
 assert.deepEqual(await port.load('saved'),{version:7,record});
 const next={...record,mission:{receipts:[...record.mission.receipts,{commandId:'new'}]}};
 assert.equal(await port.commit('saved',7,next),8);
 assert.equal(f.data.get(f.key),source);
 await port.close();
 // A stale or malformed backup must not supersede the durable migrated row.
 f.data.set(f.key,'malformed legacy backup');
 assert.deepEqual(await f.open().load('saved'),{version:8,record:next});
});

test('independent IndexedDB connections serialize competing CAS commits with exactly one winner',async t=>{
 const f=fixture(t),a=f.open(),b=f.open();
 assert.equal(await a.create('shared',{value:'initial',receipts:[]}),0);
 assert.deepEqual(await b.load('shared'),{version:0,record:{value:'initial',receipts:[]}});
 const contenders=[{value:'a',receipts:['a']},{value:'b',receipts:['b']}];
 const results=await Promise.allSettled([a.commit('shared',0,contenders[0]),b.commit('shared',0,contenders[1])]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.find(r=>r.status==='fulfilled').value,1);
 assert.equal(results.find(r=>r.status==='rejected').reason.code,'STORE_CONFLICT');
 const winner=results.findIndex(r=>r.status==='fulfilled');
 assert.deepEqual(await a.load('shared'),{version:1,record:contenders[winner]});
 await assert.rejects(b.commit('shared',0,{value:'stale'}),{code:'STORE_CONFLICT'});
});

test('concurrent creates cannot overwrite each other and sessions remain isolated',async t=>{
 const f=fixture(t),a=f.open(),b=f.open();
 const results=await Promise.allSettled([a.create('same',{owner:'a'}),b.create('same',{owner:'b'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.find(r=>r.status==='rejected').reason.code,'STORE_CONFLICT');
 const record={owner:results[0].status==='fulfilled'?'a':'b'};
 await a.create('other',{value:'separate'});
 await a.close();await b.close();
 const reopened=f.open();
 assert.deepEqual(await reopened.load('same'),{version:0,record});
 assert.deepEqual(await reopened.load('other'),{version:0,record:{value:'separate'}});
 assert.equal(await reopened.load('missing'),null);
});

test('a failed structured clone keeps both snapshot and receipts at their prior version',async t=>{
 const f=fixture(t),port=f.open(),record={snapshot:{step:1},receipts:[{id:'confirmed'}]};
 await port.create('atomic',record);
 await assert.rejects(port.commit('atomic',0,{snapshot:{step:2},receipts:[{id:'invalid',callback(){}}]}),{name:'DataCloneError'});
 assert.deepEqual(await port.load('atomic'),{version:0,record});
 await assert.rejects(port.create('failed-create',{callback(){}}),{name:'DataCloneError'});
 assert.equal(await port.load('failed-create'),null);
 assert.equal(await port.commit('atomic',0,{snapshot:{step:2},receipts:[{id:'confirmed'},{id:'next'}]}),1);
 await port.close();
 assert.deepEqual(await f.open().load('atomic'),{version:1,record:{snapshot:{step:2},receipts:[{id:'confirmed'},{id:'next'}]}});
});

test('malformed legacy records are rejected without replacement or cleanup',async t=>{
 const f=fixture(t,{bad:{version:-1,record:{}}}),before=f.data.get(f.key);
 await assert.rejects(f.open().load('bad'),{code:'INVALID_SAVED_SESSION'});
 assert.equal(f.data.get(f.key),before);
});

test('storage keys isolate editions sharing the same database and session id',async t=>{
 const f=fixture(t),a=f.open(),b=f.open({key:'another-edition'});
 await a.create('session',{edition:'v5'});await b.create('session',{edition:'other'});
 assert.deepEqual(await a.load('session'),{version:0,record:{edition:'v5'}});
 assert.deepEqual(await b.load('session'),{version:0,record:{edition:'other'}});
});

test('two first boots import a legacy session once and reject recreation',async t=>{
 const saved={version:4,record:{snapshot:{step:2},receipts:['a','b']}};
 const f=fixture(t,{existing:saved}),a=f.open(),b=f.open(),source=f.data.get(f.key);
 assert.deepEqual(await Promise.all([a.load('existing'),b.load('existing')]),[saved,saved]);
 await assert.rejects(a.create('existing',{snapshot:{step:0}}),{code:'STORE_CONFLICT'});
 assert.deepEqual(await b.load('existing'),saved);
 assert.equal(f.data.get(f.key),source);
});

test('v5 boot recovery commits its owner pause despite a full legacy localStorage',async t=>{
 const f=fixture(t),id='active-v5',seedStorage={getItem:k=>f.data.get(k)??null,setItem:(k,v)=>f.data.set(k,v)};
 const oldApp=createApp({now:()=>1000,persistence:createBrowserPersistence({storage:seedStorage,key:f.key})});
 await oldApp.createSession({sessionId:id});await oldApp.inputOwnerChanged(id,{active:true});await oldApp.close();
 const source=f.data.get(f.key),legacy=JSON.parse(source)[id],port=f.open(),app=createApp({now:()=>1100,persistence:port});
 t.after(()=>app.close());
 const restored=await app.getSnapshot(id);
 assert.equal(restored.state.ownerActive,false);
 const migrated=await port.load(id);
 assert.equal(migrated.version,legacy.version+1);
 assert.equal(migrated.record.mission.receipts.length,legacy.record.mission.receipts.length+1);
 assert.deepEqual(migrated.record.mission.receipts.slice(0,-1),legacy.record.mission.receipts);
 assert.equal(f.data.get(f.key),source);
});

test('real v5 session migrates answers, layouts and receipts and deduplicates commands after cold reopen',async t=>{
 let now=1000,serial=0;
 const id='v5-migrated',f=fixture(t),seedStorage={getItem:k=>f.data.get(k)??null,setItem:(k,v)=>f.data.set(k,v)};
 let app=createApp({now:()=>now,persistence:createBrowserPersistence({storage:seedStorage,key:f.key})});
 t.after(()=>app.close());
 await app.createSession({sessionId:id});await app.inputOwnerChanged(id,{active:true});
 const commands=[];
 async function command(type,fields={}){
  const snapshot=await app.getSnapshot(id),input={schemaVersion:1,type,commandId:`migration.${++serial}`,sessionId:id,contentRevision:catalog.contentRevision,expectedRevision:snapshot.state.revision,...fields};
  const result=await app.sendCommand(input);assert.equal(result.reply.ok,true,result.reply.code);commands.push({input,reply:result.reply});return result.snapshot;
 }
 await command('SELECT_MISSION',{missionId:'blogger'});
 await app.handleContact(id,{contactId:'hand',sequence:1,type:'down',inside:true});now+=800;
 await app.handleContact(id,{contactId:'hand',sequence:2,type:'up',inside:true});
 let snapshot=await app.getSnapshot(id);
 for(let i=0;snapshot.state.screenId!=='blogger.channel.public-link'&&i<20;i++){
  const action=snapshot.view.actions.find(a=>a.actionId==='channel.choose-public')??snapshot.view.actions.find(a=>a.actionId==='channel.use-new-link')??snapshot.view.actions[0];
  assert.ok(action,'public-link path must expose an action');
  snapshot=await command('ACT',{taskId:snapshot.state.taskId,screenId:snapshot.state.screenId,actionId:action.actionId});
 }
 assert.equal(snapshot.state.screenId,'blogger.channel.public-link');
 assert.equal(snapshot.state.progress.blogger.answers['channel-type'],'public');
 const positions={'blogger.channel':{x:2800,y:815},'renderer:webgl:blogger:blogger.channel':{x:600,y:40}};
 await command('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:0,positions});
 const before=await app.inputOwnerChanged(id,{active:false}),source=f.data.get(f.key),legacy=JSON.parse(source)[id];
 await app.close();
 let port=f.open();app=createApp({now:()=>now,persistence:port});
 assert.deepEqual(await app.getSnapshot(id),before);
 assert.deepEqual(await port.load(id),legacy,'import preserves the complete record and version');
 await app.inputOwnerChanged(id,{active:true});
 await app.inputOwnerChanged(id,{active:false});
 const committed=await port.load(id);
 assert.equal(committed.version,legacy.version+2,'ownership commits succeed with legacy quota blocked');
 assert.equal(f.data.get(f.key),source,'legacy source bytes survive migration and continued play');
 await app.close();await port.close();
 now+=100;
 port=f.open();app=createApp({now:()=>now,persistence:port});
 const reopened=await app.getSnapshot(id);
 assert.equal(reopened.state.screenId,'blogger.channel.public-link');
 assert.equal(reopened.state.progress.blogger.answers['channel-type'],'public');
 assert.deepEqual(reopened.layouts.positions,positions);
 for(const {input,reply} of commands){
  const replay=await app.sendCommand(input);
  assert.equal(replay.duplicate,true,input.commandId);assert.deepEqual(replay.reply,reply);
  assert.deepEqual(replay.snapshot,reopened,'retry must not apply a command twice');
 }
 assert.deepEqual(await port.load(id),committed,'deduplication does not add a receipt or write');
 assert.equal(f.data.get(f.key),source);
});
