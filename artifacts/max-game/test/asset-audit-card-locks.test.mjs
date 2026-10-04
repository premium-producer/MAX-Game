import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {createCardLocks,changedCardIds} from '../src/asset-audit/card-locks.mjs';
import {createAssetAuditStore} from '../src/asset-audit/server-store.mjs';
import {createAssetAuditServer} from '../scripts/asset-audit-server.mjs';
import {migrateFlowDocument} from '../src/asset-audit/flow-document.mjs';

const hash='a'.repeat(64),alice='editor-alice',bob='editor-bobby';
const catalog={contentRevision:'locks-fixture',missions:[{missionId:'m1',tasks:['task-one','task-two'].map((taskId,index)=>({taskId,startScreenId:`${index}a`,screens:['a','b'].map(id=>({
 screenId:`${index}${id}`,assetId:`${index}${id}`,asset:{sha256:hash,width:100,height:200},instruction:id,automaticMs:null,
 actions:[{actionId:`${index}${id}.go`,label:'Далее',placement:'hotspot',rect:[1,2,30,40],outcome:id==='a'?{kind:'navigate',screenId:`${index}b`}:{kind:'complete-task'}}]
}))}))}]};
const legacy={schemaVersion:2,contentRevision:catalog.contentRevision,records:[],screens:[]};
const clean=({revision,...document})=>structuredClone(document);
const initial=()=>migrateFlowDocument(legacy,catalog);
const changed=mutate=>{const document=initial();mutate(document);return document;};
const first=document=>document.tasks[0].screens[0];
async function fixture(t,cardLockOptions){
 const root=fileURLToPath(new URL('../../workspace/tests/',import.meta.url));await fs.mkdir(root,{recursive:true});
 const directory=await fs.mkdtemp(path.join(root,'card-locks-'));
 t.after(async()=>{const relative=path.relative(root,directory);assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));await fs.rm(directory,{recursive:true,force:true});});
 const file=path.join(directory,'annotations.json'),catalogFile=path.join(directory,'catalog.json'),flowFile=path.join(directory,'flow-v3.json');
 await fs.writeFile(file,JSON.stringify(legacy));await fs.writeFile(catalogFile,JSON.stringify(catalog));
 const open=()=>createAssetAuditStore({file,catalogFile,cardLockOptions});const store=open();t.after(()=>store.close());
 return {file,flowFile,store,open};
}
const assertLocked=(promise,code='CARD_LOCKED')=>assert.rejects(promise,{status:423,code});

test('library leases have private tokens, renewable ownership and explicit safe release',async()=>{
 const locks=createCardLocks(),grant=await locks.mutate({action:'acquire',screenId:'a'},alice);
 assert.match(grant.token,/^[a-f0-9]{64}$/);assert.equal(grant.ttlMs,30000);assert.equal(grant.heartbeatMs,8000);
 assert.deepEqual((await locks.list(alice)).locks.map(l=>({id:l.screenId,owned:l.owned})),[{id:'a',owned:true}]);
 assert.equal((await locks.list(bob)).locks[0].owned,false);assert.doesNotMatch(JSON.stringify(await locks.list(bob)),new RegExp(grant.token));
 await assertLocked(locks.mutate({action:'acquire',screenId:'a'},bob));
 for(const action of ['renew','release']){
  await assertLocked(locks.mutate({action,screenId:'a',token:grant.token},bob),'CARD_LEASE_LOST');
  await assertLocked(locks.mutate({action,screenId:'a',token:'wrong'},alice),'CARD_LEASE_LOST');
 }
 const renewed=await locks.mutate({action:'renew',screenId:'a',token:grant.token},alice);assert.equal(renewed.token,grant.token);assert.ok(renewed.expiresAt>=grant.expiresAt);
 assert.deepEqual(await locks.mutate({action:'release',screenId:'a',token:grant.token},alice),{released:true});
 const next=await locks.mutate({action:'acquire',screenId:'a'},bob);assert.notEqual(next.token,grant.token);
 await assertLocked(locks.mutate({action:'release',screenId:'a',token:grant.token},alice),'CARD_LEASE_LOST');
});

test('one card per editor; busy next card preserves current card and successful switch releases it',async()=>{
 const locks=createCardLocks();await locks.mutate({action:'acquire',screenId:'a'},alice);await locks.mutate({action:'acquire',screenId:'b'},bob);
 await assertLocked(locks.mutate({action:'acquire',screenId:'b'},alice));assert.equal((await locks.list(alice)).locks.find(l=>l.screenId==='a').owned,true);
 await locks.mutate({action:'acquire',screenId:'c'},alice);assert.deepEqual((await locks.list(alice)).locks.map(l=>l.screenId).sort(),['b','c']);
 await locks.mutate({action:'acquire',screenId:'a'},bob);assert.deepEqual((await locks.list(bob)).locks.map(l=>l.screenId).sort(),['a','c']);
});

test('idempotent acquire reports remaining lease duration, never resets client deadline to full TTL',async()=>{
 const locks=createCardLocks({ttlMs:200,heartbeatMs:50}),first=await locks.mutate({action:'acquire',screenId:'a'},alice);
 await delay(35);const repeated=await locks.mutate({action:'acquire',screenId:'a'},alice);
 assert.equal(repeated.token,first.token);assert.ok(repeated.validForMs<=first.validForMs-25);assert.equal(repeated.expiresAt,first.expiresAt);
});

test('expired MemoryStore lease is explicitly released before takeover, never revived by late renew',async()=>{
 const locks=createCardLocks({ttlMs:25,heartbeatMs:5}),old=await locks.mutate({action:'acquire',screenId:'a'},alice);
 await delay(60);
 await assertLocked(locks.mutate({action:'renew',screenId:'a',token:old.token},alice),'CARD_LEASE_LOST');
 const next=await locks.mutate({action:'acquire',screenId:'a'},bob);assert.notEqual(next.token,old.token);
 await assertLocked(locks.guard(['a'],{clientId:alice,screenId:'a',token:old.token}),'CARD_LEASE_LOST');
 await assertLocked(locks.mutate({action:'release',screenId:'a',token:old.token},alice),'CARD_LEASE_LOST');
 await locks.mutate({action:'renew',screenId:'a',token:next.token},bob);await locks.mutate({action:'release',screenId:'a',token:next.token},bob);
 assert.deepEqual((await locks.list(bob)).locks,[]);
});

test('shared text, task start and final changes enumerate every affected card',()=>{
 const before=initial();
 assert.deepEqual(changedCardIds(before,changed(d=>{first(d).help.text='one';}),catalog),['0a']);
 for(const mutate of [d=>{d.tasks[0].helpText='task';},d=>{d.tasks[0].startScreenId='0b';},d=>{first(d).final=true;}]){
  assert.deepEqual(changedCardIds(before,changed(mutate),catalog).sort(),['0a','0b']);
 }
 assert.deepEqual(changedCardIds(before,changed(d=>{d.missions[0].helpText='mission';}),catalog).sort(),['0a','0b','1a','1b']);
});

test('serialized simultaneous acquisition has one winner; list/startup never writes annotation files',async t=>{
 const f=await fixture(t),original=await fs.readFile(f.file);await f.store.readFlow();await f.store.readCardLocks(alice);
 const results=await Promise.allSettled([alice,bob].map(id=>f.store.mutateCardLock({action:'acquire',screenId:'0a'},id)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'CARD_LOCKED');
 await assert.rejects(f.store.mutateCardLock({action:'acquire',screenId:'unknown'},alice),{status:400});
 await assert.rejects(f.store.readCardLocks(''),{status:400});assert.deepEqual(await fs.readFile(f.file),original);await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('merge, CAS and legacy writes cannot bypass busy cards or shared scopes; no partial save',async t=>{
 const f=await fixture(t),original=await fs.readFile(f.file),base=await f.store.readFlow();
 const grant=await f.store.mutateCardLock({action:'acquire',screenId:'0a'},alice);
 const local=changed(d=>{first(d).help.text='blocked';d.tasks[1].helpText='must not partially save';});
 for(const context of [undefined,{clientId:bob}]){
  await assertLocked(f.store.saveMergedFlow({baseDocument:initial(),document:local},context));
  await assertLocked(f.store.saveFlow({expectedRevision:base.revision,document:local},context));
 }
 await assertLocked(f.store.saveMergedFlow({baseDocument:initial(),document:local},{clientId:alice}),'CARD_LEASE_LOST');
 await assertLocked(f.store.saveFlow({expectedRevision:base.revision,document:local},{clientId:alice}),'CARD_LEASE_LOST');
 const record={screenId:'0a',assetId:'0a',assetSha256:hash,actionId:'0a.go',label:'Далее',placement:'hotspot',rect:[8,9,20,30],reviewed:true,updatedAt:'2026-10-04T00:00:00Z'};
 await assertLocked(f.store.save({expectedRevision:(await f.store.read()).revision,document:{...legacy,records:[record]}}));
 await assertLocked(f.store.saveMergedFlow({baseDocument:initial(),document:changed(d=>{d.tasks[0].helpText='shared';})},{clientId:bob}));
 await assertLocked(f.store.saveMergedFlow({baseDocument:initial(),document:changed(d=>{d.missions[0].helpText='shared';})},{clientId:bob}));
 assert.deepEqual(await fs.readFile(f.file),original);await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 const own=await f.store.saveMergedFlow({baseDocument:initial(),document:local},{clientId:alice,screenId:'0a',token:grant.token});assert.equal(first(own).help.text,'blocked');
 const independent=clean(own);independent.tasks[1].screens[0].help.text='other card';
 assert.equal((await f.store.saveMergedFlow({baseDocument:clean(own),document:independent},{clientId:bob})).tasks[1].screens[0].help.text,'other card');
});

test('expired tokens reject even no-op writes; restart discards leases without modifying data',async t=>{
 const f=await fixture(t,{ttlMs:25,heartbeatMs:5}),grant=await f.store.mutateCardLock({action:'acquire',screenId:'0a'},alice);
 await delay(60);const context={clientId:alice,screenId:'0a',token:grant.token};
 await assertLocked(f.store.saveMergedFlow({baseDocument:initial(),document:initial()},context),'CARD_LEASE_LOST');
 const reopened=f.open();assert.deepEqual((await reopened.readCardLocks(alice)).locks,[]);
 await assertLocked(reopened.saveFlow({expectedRevision:(await reopened.readFlow()).revision,document:initial()},context),'CARD_LEASE_LOST');
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('actual HTTP locks require CSRF and client ID; flow headers enforce lease and 423 safe response',async t=>{
 const f=await fixture(t),server=createAssetAuditServer({store:f.store});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/api/max-asset-locks';
 const {csrf}=await(await fetch(origin+'/api/state')).json(),headers={'Content-Type':'application/json',Origin:'https://futuronika.pro','X-VK-Token':csrf,'X-MAX-Editor-Id':alice};
 const post=(body,extra={})=>fetch(url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
 assert.equal((await fetch(url)).status,400);assert.equal((await post({action:'acquire',screenId:'0a'},{'X-VK-Token':'bad'})).status,403);
 const response=await post({action:'acquire',screenId:'0a'});assert.equal(response.status,200);const grant=await response.json();
 const list=await(await fetch(url,{headers:{'X-MAX-Editor-Id':bob}})).json();assert.equal(list.locks[0].owned,false);assert.equal(list.locks[0].token,undefined);
 const busy=await post({action:'acquire',screenId:'0a'},{'X-MAX-Editor-Id':bob});assert.equal(busy.status,423);assert.deepEqual((await busy.json()).screenIds,['0a']);
 const body=JSON.stringify({baseDocument:initial(),document:changed(d=>{first(d).help.text='test';})});
 const blocked=await fetch(origin+'/api/max-asset-flow/merge',{method:'POST',headers:{...headers,'X-MAX-Editor-Id':bob},body});assert.equal(blocked.status,423);
 const saved=await fetch(origin+'/api/max-asset-flow/merge',{method:'POST',headers:{...headers,'X-MAX-Card-Id':'0a','X-MAX-Lock-Token':grant.token},body});assert.equal(saved.status,200);
 const stale=await post({action:'release',screenId:'0a',token:'wrong'});assert.equal(stale.status,423);assert.equal((await stale.json()).code,'CARD_LEASE_LOST');
});
