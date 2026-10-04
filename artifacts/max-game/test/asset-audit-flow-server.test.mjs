import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createAssetAuditStore} from '../src/asset-audit/server-store.mjs';
import {createAssetAuditServer} from '../scripts/asset-audit-server.mjs';

const fixtureRoot=fileURLToPath(new URL('../../workspace/tests/',import.meta.url));
const hash='a'.repeat(64);
const screen=(id,outcome)=>({screenId:id,assetId:`asset-${id}`,asset:{sha256:hash,width:100,height:200},instruction:`Справка ${id}`,automaticMs:null,
 actions:[{actionId:`${id}.go`,label:`Далее ${id}`,placement:'hotspot',rect:[1,2,30,40],outcome}]});
const catalog={contentRevision:'source-v1',missions:[{missionId:'mission',tasks:[{taskId:'task',startScreenId:'a',screens:[
 screen('a',{kind:'navigate',screenId:'b'}),screen('b',{kind:'navigate',screenId:'c'}),screen('c',{kind:'complete-task'})]}]}]};
const legacy={schemaVersion:2,contentRevision:'source-v1',records:[
 {screenId:'a',assetId:'asset-a',assetSha256:hash,actionId:'a.go',label:'Далее a',placement:'hotspot',rect:[8,9,30,40],reviewed:true},
 {screenId:'b',assetId:'asset-b',assetSha256:hash,actionId:'b.go',label:'Далее b',placement:'below-screen',reviewed:true}],
 screens:[{taskId:'task',screenId:'b',assetId:'asset-b',assetSha256:hash,enabled:false,final:false},
 {taskId:'task',screenId:'c',assetId:'asset-c',assetSha256:hash,enabled:true,final:true}]};
for(const item of [...legacy.records,...legacy.screens])item.updatedAt='2026-10-04T00:00:00.000Z';
const withoutRevision=({revision,...document})=>document;
const edit=(current,text)=>{const document=withoutRevision(structuredClone(current));document.tasks[0].helpText=text;return document;};

async function fixture(t,{persistLegacy=true}={}){
 await fs.mkdir(fixtureRoot,{recursive:true});
 const directory=await fs.mkdtemp(path.join(fixtureRoot,'max-flow-store-'));
 t.after(async()=>{const relative=path.relative(fixtureRoot,directory);assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));await fs.rm(directory,{recursive:true,force:true});});
 const file=path.join(directory,'annotations.json'),flowFile=path.join(directory,'flow-v3.json'),catalogFile=path.join(directory,'catalog.json');
 await fs.writeFile(catalogFile,JSON.stringify(catalog));
 if(persistLegacy)await fs.writeFile(file,JSON.stringify(legacy,null,3)+'\n');
 const open=extra=>createAssetAuditStore({file,catalogFile,...extra});
 return {directory,file,flowFile,catalogFile,open,store:open()};
}
async function httpFixture(t,store){
 const server=createAssetAuditServer({store});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base=`http://127.0.0.1:${server.address().port}`;
 const {csrf}=await (await fetch(base+'/api/state')).json();
 const headers={'Content-Type':'application/json',Origin:'https://futuronika.pro','X-VK-Token':csrf};
 return {base,headers,post:input=>fetch(base+'/api/max-asset-flow',{method:'POST',headers,body:JSON.stringify(input)})};
}

test('v3 reads migrate current legacy bytes without writes, retaining every zone, label and flag',async t=>{
 const f=await fixture(t),before=await fs.readFile(f.file),loaded=await f.store.readFlow();
 assert.equal(loaded.revision,'legacy:'+createHash('sha256').update(before).digest('hex'));
 assert.equal(loaded.schemaVersion,3);
 assert.deepEqual(loaded.tasks[0].screens[0].interactions[0].rect,[8,9,30,40]);
 assert.equal(loaded.tasks[0].screens[1].interactions[0].label,'Далее b');
 assert.equal(loaded.tasks[0].screens[1].enabled,false);
 assert.equal(loaded.tasks[0].screens[2].final,true);
 assert.deepEqual(await f.store.readFlow(),loaded);
 assert.deepEqual(await fs.readFile(f.file),before);
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 const v1={...legacy,schemaVersion:1};delete v1.screens;await fs.writeFile(f.file,JSON.stringify(v1));
 assert.equal((await f.store.readFlow()).tasks[0].screens[1].enabled,true);
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('absent legacy reads stay side-effect free and cannot be overwritten by a stale migrated draft',async t=>{
 const f=await fixture(t,{persistLegacy:false}),initial=await f.store.readFlow();
 assert.equal(initial.revision,'legacy:0');
 await assert.rejects(fs.stat(f.file),{code:'ENOENT'});await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 await f.store.save({expectedRevision:'0',document:legacy});
 await assert.rejects(f.store.saveFlow({expectedRevision:initial.revision,document:edit(initial,'Stale')}),{status:409});
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('durable v3 save preserves legacy bytes; restart reads exact edits and blocks legacy writes',async t=>{
 const f=await fixture(t),before=await fs.readFile(f.file),old=await f.store.read(),initial=await f.store.readFlow();
 const document=edit(initial,'Новая справка');
 const s=document.tasks[0].screens[0];
 s.interactions.push({interactionId:'button-new',kind:'button',enabled:false,target:{kind:'screen',screenId:'c'},label:'Ещё вариант',order:1});
 s.interactions.push({interactionId:'timer-new',kind:'timer',enabled:true,target:{kind:'screen',screenId:'b'},delayMs:500});
 const saved=await f.store.saveFlow({expectedRevision:initial.revision,document});
 assert.match(saved.revision,/^[a-f0-9]{64}$/);assert.deepEqual(await f.open().readFlow(),saved);
 assert.deepEqual(JSON.parse(await fs.readFile(f.flowFile)),document);
 assert.deepEqual(await f.store.read(),old);assert.deepEqual(await fs.readFile(f.file),before);
 await assert.rejects(f.store.save({expectedRevision:old.revision,document:legacy}),{status:409});
 assert.deepEqual(await fs.readFile(f.file),before);
 // Legacy file can be read for recovery, but is never overlaid onto authoritative v3.
 await fs.writeFile(f.file,'{external corruption');
 assert.deepEqual(await f.open().readFlow(),saved);
});

test('shared queue serializes legacy save before v3 CAS, and v3 save before blocked legacy save',async t=>{
 const f=await fixture(t),old=await f.store.read(),initial=await f.store.readFlow();
 const changed=structuredClone(legacy);changed.records[0].rect=[10,11,30,40];
 const first=await Promise.allSettled([f.store.save({expectedRevision:old.revision,document:changed}),f.store.saveFlow({expectedRevision:initial.revision,document:edit(initial,'stale')})]);
 assert.equal(first[0].status,'fulfilled');assert.equal(first[1].reason.status,409);
 const fresh=await f.store.readFlow(),second=await Promise.allSettled([f.store.saveFlow({expectedRevision:fresh.revision,document:edit(fresh,'accepted')}),f.store.save({expectedRevision:first[0].value.revision,document:legacy})]);
 assert.equal(second[0].status,'fulfilled');assert.equal(second[1].reason.status,409);
 assert.deepEqual((await f.store.readFlow()).tasks[0].screens[0].interactions[0].rect,[10,11,30,40]);
});

test('failed atomic replacement preserves both files and revision, with successful retry after recovery',async t=>{
 const f=await fixture(t),initial=await f.store.readFlow(),original=await fs.readFile(f.file);
 let failedPath;
 const broken=f.open({write:async filename=>{failedPath=filename;throw Object.assign(Error('disk full'),{code:'ENOSPC'});}});
 await assert.rejects(broken.saveFlow({expectedRevision:initial.revision,document:edit(initial,'fail')}),{code:'ENOSPC'});
 assert.equal(failedPath,f.flowFile);assert.deepEqual(await broken.readFlow(),initial);
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 const saved=await f.store.saveFlow({expectedRevision:initial.revision,document:edit(initial,'saved')}),flowBytes=await fs.readFile(f.flowFile);
 await assert.rejects(broken.saveFlow({expectedRevision:saved.revision,document:edit(saved,'fail again')}),{code:'ENOSPC'});
 assert.deepEqual(await fs.readFile(f.flowFile),flowBytes);assert.deepEqual(await fs.readFile(f.file),original);
 assert.deepEqual(await f.store.readFlow(),saved);
 assert.equal((await f.store.saveFlow({expectedRevision:saved.revision,document:edit(saved,'recovered')})).tasks[0].helpText,'recovered');
});

test('malformed v3 inputs and corrupt stored documents fail closed without falling back or erasing evidence',async t=>{
 const f=await fixture(t),initial=await f.store.readFlow(),before=await fs.readFile(f.file);
 for(const mutate of [d=>{d.schemaVersion=2;},d=>{d.tasks[0].screens.pop();},d=>{d.tasks[0].screens[0].assetSha256='b'.repeat(64);},d=>{d.extra='unknown';}]){
  const document=edit(initial,'');mutate(document);await assert.rejects(f.store.saveFlow({expectedRevision:initial.revision,document}),{status:400});
 }
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 for(const content of ['', '{broken',JSON.stringify({...withoutRevision(initial),sourceContentRevision:'wrong'})]){
  await fs.writeFile(f.flowFile,content);
  await assert.rejects(f.store.readFlow(),{status:409});
  await assert.rejects(f.store.saveFlow({expectedRevision:initial.revision,document:edit(initial,'')}),{status:409});
  await assert.rejects(f.store.save({expectedRevision:initial.revision,document:legacy}),{status:409});
  assert.equal(await fs.readFile(f.flowFile,'utf8'),content);
 }
 assert.deepEqual(await fs.readFile(f.file),before);
});

test('corrupt legacy and invalid migration remain errors before the first v3 save',async t=>{
 const f=await fixture(t);await fs.writeFile(f.file,'{bad');
 await assert.rejects(f.store.readFlow(),{status:409});
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 await fs.writeFile(f.file,JSON.stringify(legacy));
 const badCatalog=structuredClone(catalog);delete badCatalog.missions[0].tasks[0].screens[0].actions[0].outcome;
 await fs.writeFile(f.catalogFile,JSON.stringify(badCatalog));
 await assert.rejects(f.store.readFlow(),{status:409});
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('flow destination cannot overwrite legacy or catalog; explicit distinct flow path is supported',async t=>{
 const f=await fixture(t);
 for(const flowFile of [f.file,f.catalogFile])assert.throws(()=>f.open({flowFile}),/separate/);
 const alternate=path.join(f.directory,'drafts','scenario.json'),store=f.open({flowFile:alternate}),initial=await store.readFlow();
 await store.saveFlow({expectedRevision:initial.revision,document:edit(initial,'Explicit path')});
 assert.equal(JSON.parse(await fs.readFile(alternate)).tasks[0].helpText,'Explicit path');
 await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
});

test('real HTTP GET is flat v3 and read-only; racing POSTs acknowledge only one revision and legacy is preserved',async t=>{
 const f=await fixture(t),h=await httpFixture(t,f.store),before=await fs.readFile(f.file);
 const response=await fetch(h.base+'/api/max-asset-flow'),initial=await response.json();
 assert.equal(response.status,200);assert.equal(initial.schemaVersion,3);assert.equal(typeof initial.revision,'string');
 assert.equal(response.headers.get('cache-control'),'no-store');await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 const responses=await Promise.all(['first','second'].map(text=>h.post({expectedRevision:initial.revision,document:edit(initial,text)})));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const accepted=await responses.find(r=>r.status===200).json();
 assert.deepEqual(await (await fetch(h.base+'/api/max-asset-flow')).json(),accepted);
 const old=await (await fetch(h.base+'/api/max-asset-audit')).json();
 assert.equal((await fetch(h.base+'/api/max-asset-audit',{method:'POST',headers:h.headers,body:JSON.stringify({expectedRevision:old.revision,document:legacy})})).status,409);
 assert.deepEqual(await fs.readFile(f.file),before);
});

test('flow POST requires same origin, token and JSON, with safe errors and unsupported methods rejected',async t=>{
 const f=await fixture(t),h=await httpFixture(t,f.store);
 for(const headers of [{...h.headers,Origin:'https://foreign.example'},{...h.headers,'X-VK-Token':''},{...h.headers,Origin:''}]){
  assert.equal((await fetch(h.base+'/api/max-asset-flow',{method:'POST',headers,body:'{}'})).status,403);
 }
 assert.equal((await fetch(h.base+'/api/max-asset-flow',{method:'DELETE'})).status,405);
 assert.equal((await fetch(h.base+'/api/max-asset-flow',{method:'POST',headers:{...h.headers,'Content-Type':'text/plain'},body:'{}'})).status,415);
 assert.equal((await fetch(h.base+'/api/max-asset-flow',{method:'POST',headers:h.headers,body:'{bad'})).status,400);
 await fs.writeFile(f.flowFile,'{private');
 const failed=await fetch(h.base+'/api/max-asset-flow');assert.equal(failed.status,409);assert.doesNotMatch(await failed.text(),/private|scenario|flow-v3|[A-Z]:/);
 assert.deepEqual(await fs.readFile(f.file,'utf8'),JSON.stringify(legacy,null,3)+'\n');
});

test('HTTP fixture option accepts only explicit loopback HTTP; production default remains HTTPS',()=>{
 const store={read:async()=>({}),save:async()=>({})};
 for(const origin of ['http://localhost:1234','http://127.0.0.1:1234']){
  assert.throws(()=>createAssetAuditServer({store,origin}),/HTTPS/);
  const server=createAssetAuditServer({store,origin,allowLoopbackHttp:true});server.close();
 }
 for(const origin of ['http://example.com','http://127.0.0.1.evil.example:1234','http://0.0.0.0:1234','http://127.0.0.1:1234/path']){
  assert.throws(()=>createAssetAuditServer({store,origin,allowLoopbackHttp:true}),/HTTPS/);
 }
});
