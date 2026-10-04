import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {makeTestDirectory} from './test-workspace.mjs';
import {createStandService} from './server.mjs';

test('audit HTTP uses master auth, persists config, rejects conflicts without activating game backend',async t=>{
 const dir=makeTestDirectory('max-audit-http');
 const service=await createStandService({projectRoot:path.resolve(import.meta.dirname,'../..'),port:0,watch:false,stateFile:path.join(dir,'state.json'),spawnWorker(){return {stop(){}};}});
 t.after(async()=>{await service.close();await fs.rm(dir,{recursive:true,force:true});});
 const get=async()=>{const r=await fetch(service.origin+'/api/max-asset-audit');assert.equal(r.status,200);return r.json();};
 const original=await get();assert.equal(original.revision,'0');assert.equal(original.schemaVersion,2);
 const post=(headers={})=>fetch(service.origin+'/api/max-asset-audit',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({expectedRevision:'0',document:original})});
 assert.equal((await post()).status,403);
 const {csrf}=await(await fetch(service.origin+'/api/state')).json();
 assert.equal((await post({'X-VK-Token':csrf,Origin:'http://example.invalid'})).status,403);
 const response=await post({'X-VK-Token':csrf});assert.equal(response.status,200);const saved=await response.json();assert.notEqual(saved.revision,'0');
 assert.deepEqual(await get(),saved);
 assert.equal(JSON.parse(await fs.readFile(path.join(dir,'max-asset-audit.json'))).schemaVersion,2);
 assert.equal((await post({'X-VK-Token':csrf})).status,409);
 assert.deepEqual(await get(),saved);
});
