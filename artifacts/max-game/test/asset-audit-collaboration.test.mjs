import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mergeFlowDocuments,flowDocumentsEqual} from '../src/asset-audit/collaboration.mjs';
import {migrateFlowDocument,validateFlowDocument} from '../src/asset-audit/flow-document.mjs';
import {createAssetAuditStore} from '../src/asset-audit/server-store.mjs';
import {createAssetAuditServer} from '../scripts/asset-audit-server.mjs';

const hash='a'.repeat(64);
const catalog={contentRevision:'collaboration-fixture',missions:[{missionId:'mission',tasks:[{taskId:'task',startScreenId:'a',screens:['a','b','c'].map((id,index)=>({
 screenId:id,assetId:id,asset:{sha256:hash,width:100,height:200},instruction:id,automaticMs:null,
 actions:[{actionId:`${id}.go`,label:'Далее',placement:'hotspot',rect:[1,2,30,40],outcome:index<2?{kind:'navigate',screenId:['b','c'][index]}:{kind:'complete-task'}}]
}))}]}]};
const legacy={schemaVersion:2,contentRevision:catalog.contentRevision,records:[],screens:[]};
const base=()=>migrateFlowDocument(legacy,catalog);
const screen=(document,index=0)=>document.tasks[0].screens[index];
const change=mutate=>{const document=base();mutate(document);return document;};
const button=id=>({interactionId:id,kind:'button',enabled:true,target:{kind:'screen',screenId:'b'},label:id,order:1});
const timer=id=>({interactionId:id,kind:'timer',enabled:true,target:{kind:'screen',screenId:'b'},delayMs:500});
const removeOriginal=document=>{screen(document).interactions=[];screen(document).deletedSourceActionIds=['a.go'];};

test('independent screens, fields and interactions merge without changing inputs or display order',()=>{
 const b=base(),local=change(d=>{screen(d).help.text='Моя справка';screen(d).interactions.push(button('local'));}),remote=change(d=>{
  screen(d).enabled=false;screen(d,1).interactions[0].rect=[5,6,20,30];screen(d).interactions.push(button('remote'));
 });
 const before=JSON.stringify([b,local,remote]),result=mergeFlowDocuments(b,local,remote);
 assert.deepEqual(result.conflicts,[]);assert.equal(screen(result.document).help.text,'Моя справка');assert.equal(screen(result.document).enabled,false);
 assert.deepEqual(screen(result.document,1).interactions[0].rect,[5,6,20,30]);
 assert.deepEqual(screen(result.document).interactions.map(i=>i.interactionId),['a.go','remote','local']);
 assert.equal(JSON.stringify([b,local,remote]),before);validateFlowDocument(result.document,catalog);
 assert.ok(flowDocumentsEqual(mergeFlowDocuments(b,b,b).document,b));
});

test('whole interaction conflicts protect rect and target, explicit choice preserves independent edits',()=>{
 const b=base(),local=change(d=>{screen(d).interactions[0].rect=[4,5,20,30];d.tasks[0].helpText='local';}),remote=change(d=>{
  screen(d).interactions[0].target={kind:'screen',screenId:'c'};screen(d,1).help.text='remote';
 });
 const merged=mergeFlowDocuments(b,local,remote);assert.equal(merged.conflicts.length,1);
 assert.deepEqual(screen(merged.document).interactions[0],screen(local).interactions[0]);
 for(const resolution of ['local','remote']){
  const r=mergeFlowDocuments(b,local,remote,{resolution});assert.equal(r.conflicts.length,0);
  assert.deepEqual(screen(r.document).interactions[0],screen(resolution==='local'?local:remote).interactions[0]);
  assert.equal(r.document.tasks[0].helpText,'local');assert.equal(screen(r.document,1).help.text,'remote');validateFlowDocument(r.document,catalog);
 }
});

test('same ID additions conflict, identical additions and retries are idempotent',()=>{
 const b=base(),local=change(d=>screen(d).interactions.push(button('same'))),remote=structuredClone(local);
 assert.deepEqual(mergeFlowDocuments(b,local,remote).conflicts,[]);
 screen(remote).interactions[1].label='different';assert.equal(mergeFlowDocuments(b,local,remote).conflicts.length,1);
 assert.deepEqual(mergeFlowDocuments(b,local,local).document,mergeFlowDocuments(b,local,local).document);
});

test('delete/edit, edit/delete and source-copy additions resolve atomically without orphan tombstones',()=>{
 const b=base(),deleted=change(removeOriginal);
 for(const edited of [change(d=>{screen(d).interactions[0].rect=[5,6,20,30];}),change(d=>{
  screen(d).interactions.push({...screen(d).interactions[0],interactionId:'copy'});
 })])for(const [local,remote] of [[edited,deleted],[deleted,edited]]){
  const merged=mergeFlowDocuments(b,local,remote);assert.ok(merged.conflicts.length>0);validateFlowDocument(merged.document,catalog);
  for(const resolution of ['local','remote']){
   const resolved=mergeFlowDocuments(b,local,remote,{resolution});assert.equal(resolved.conflicts.length,0);validateFlowDocument(resolved.document,catalog);
   assert.deepEqual(screen(resolved.document).interactions,screen(resolution==='local'?local:remote).interactions.map(item=>Object.fromEntries(Object.entries(item).sort())));
   assert.deepEqual(screen(resolved.document).deletedSourceActionIds,screen(resolution==='local'?local:remote).deletedSourceActionIds);
  }
 }
});

test('single final and timer slots catch cross-ID conflicts and allow either valid choice',()=>{
 for(const [local,remote] of [
  [change(d=>{screen(d).final=true;}),change(d=>{screen(d,1).final=true;})],
  [change(d=>screen(d).interactions.push(timer('timer-one'))),change(d=>screen(d).interactions.push(timer('timer-two')))]
 ]){
  assert.equal(mergeFlowDocuments(base(),local,remote).conflicts.length,1);
  for(const resolution of ['local','remote'])validateFlowDocument(mergeFlowDocuments(base(),local,remote,{resolution}).document,catalog);
 }
});

test('interaction kind conversion cannot duplicate an ID or silently replace another participant edit',()=>{
 const b=base(),local=change(d=>{screen(d).interactions[0]={...timer('a.go'),sourceActionId:'a.go'};}),remote=change(d=>{screen(d).interactions[0].rect=[3,4,20,30];});
 assert.equal(mergeFlowDocuments(b,local,remote).conflicts.length,1);
 for(const resolution of ['local','remote']){
  const document=mergeFlowDocuments(b,local,remote,{resolution}).document;validateFlowDocument(document,catalog);
  assert.equal(screen(document).interactions.length,1);assert.equal(screen(document).interactions[0].kind,resolution==='local'?'timer':'hotspot');
 }
});

test('different identity cannot be merged and metadata is not an editable slot',()=>{
 const other=base();screen(other).assetSha256='b'.repeat(64);
 assert.throws(()=>mergeFlowDocuments(base(),base(),other),{code:'FLOW_MERGE_IDENTITY'});
});

async function fixture(t){
 const root=fileURLToPath(new URL('../../workspace/tests/',import.meta.url));await fs.mkdir(root,{recursive:true});
 const directory=await fs.mkdtemp(path.join(root,'flow-collaboration-'));
 t.after(async()=>{const relative=path.relative(root,directory);assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));await fs.rm(directory,{recursive:true,force:true});});
 const file=path.join(directory,'annotations.json'),catalogFile=path.join(directory,'catalog.json'),flowFile=path.join(directory,'flow-v3.json');
 await fs.writeFile(file,JSON.stringify(legacy));await fs.writeFile(catalogFile,JSON.stringify(catalog));
 const store=createAssetAuditStore({file,catalogFile});t.after(()=>store.close());
 return {file,flowFile,store};
}

test('serialized store merges stale independent edits, retains legacy, no write on no-op or lost-ACK retry',async t=>{
 const f=await fixture(t),original=await fs.readFile(f.file),initial=await f.store.readFlow();
 assert.deepEqual(await f.store.saveMergedFlow({baseDocument:base(),document:base()}),initial);await assert.rejects(fs.stat(f.flowFile),{code:'ENOENT'});
 const local=change(d=>{screen(d).help.text='first';}),remote=change(d=>{screen(d,1).enabled=false;});
 const results=await Promise.all([local,remote].map(document=>f.store.saveMergedFlow({baseDocument:base(),document})));
 const current=await f.store.readFlow();assert.equal(screen(current).help.text,'first');assert.equal(screen(current,1).enabled,false);
 assert.notEqual(results[0].revision,results[1].revision);const bytes=await fs.readFile(f.flowFile);
 assert.deepEqual(await f.store.saveMergedFlow({baseDocument:base(),document:local}),current);
 assert.deepEqual(await fs.readFile(f.flowFile),bytes);assert.deepEqual(await fs.readFile(f.file),original);
});

test('conflicts do not partially save independent changes and schema/protected mutations are rejected',async t=>{
 const f=await fixture(t),remote=change(d=>{screen(d).interactions[0].name='Remote';});
 const current=await f.store.saveMergedFlow({baseDocument:base(),document:remote}),bytes=await fs.readFile(f.flowFile);
 const local=change(d=>{screen(d).interactions[0].name='Local';screen(d,1).help.text='must not partially save';});
 await assert.rejects(f.store.saveMergedFlow({baseDocument:base(),document:local}),error=>{
  assert.equal(error.code,'FLOW_MERGE_CONFLICT');assert.equal(error.status,409);assert.equal(error.conflicts.length,1);assert.deepEqual(error.currentDocument,current);return true;
 });
 for(const document of [change(d=>{d.extra='unexpected';}),change(d=>{screen(d).interactions[0].semanticRef='unknown';})])await assert.rejects(f.store.saveMergedFlow({baseDocument:base(),document}),{status:400});
 assert.deepEqual(await fs.readFile(f.flowFile),bytes);
});

test('HTTP merge contract authenticates requests, returns actionable 409 snapshot, rejects GET and bad schema',async t=>{
 const f=await fixture(t),server=createAssetAuditServer({store:f.store});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/api/max-asset-flow/merge';
 const {csrf}=await(await fetch(origin+'/api/state')).json();
 const headers={'Content-Type':'application/json',Origin:'https://futuronika.pro','X-VK-Token':csrf};
 const post=(document,extra={})=>fetch(url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify({baseDocument:base(),document})});
 assert.equal((await fetch(url)).status,405);assert.equal((await post(base(),{Origin:'https://bad.example'})).status,403);
 const local=change(d=>{d.tasks[0].helpText='local';}),remote=change(d=>{d.tasks[0].helpText='remote';});
 assert.equal((await post(local)).status,200);const response=await post(remote),body=await response.json();
 assert.equal(response.status,409);assert.equal(body.code,'FLOW_MERGE_CONFLICT');assert.equal(body.conflicts.length,1);assert.ok(body.currentDocument.revision);
 assert.equal(body.currentDocument.tasks[0].helpText,'local');
 assert.equal((await post({...base(),secret:'invalid'})).status,400);
 assert.equal((await post(base(),{'X-VK-Token':'bad'})).status,403);
});
