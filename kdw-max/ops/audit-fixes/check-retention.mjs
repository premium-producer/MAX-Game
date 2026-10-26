import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';import {performance} from 'node:perf_hooks';
import {createIndexedDBPersistence} from '../../apps/max-game/source/client/src/application/indexeddb-persistence.mjs';
const require=createRequire(new URL('../../apps/max-game/source/client/package.json',import.meta.url));const fake=require('fake-indexeddb');Object.assign(globalThis,fake);
const {createStelaRelay}=createRequire(import.meta.url)('../../apps/STARTUP/tools/game-link.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-retention-')),count=5000,now=Date.now(),old=now-31*86400000,databaseName='audit-load-'+randomUUID(),report={synthetic:true,indexedDBEngine:'fake-indexeddb; not a browser disk benchmark',count};
let relay,p;
const measure=async fn=>{const t=performance.now();const result=await fn();return{ms:Math.round((performance.now()-t)*100)/100,result};};
try{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName,1);r.onupgradeneeded=()=>r.result.createObjectStore('sessions');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const record={schemaVersion:2,clockCheckpointAt:old,mission:{state:{status:'menu',standEndReason:'qr',standPolicy:{}},receipts:Array.from({length:20},(_,i)=>({commandId:'synthetic-'+i,reply:{ok:true}}))}};
 report.serializedFixtureBytes=Buffer.byteLength(JSON.stringify({version:0,record}))*count;
 await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');for(let i=0;i<count;i++)tx.objectStore('sessions').add({version:0,record},['audit','visitor-'+i]);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
 p=createIndexedDBPersistence({key:'audit',legacyStorage:{getItem:()=>null},databaseName,now:()=>now});report.idbPrune=await measure(()=>p.prune('live'));assert.equal(report.idbPrune.result,count);
 const live={...record,clockCheckpointAt:now,mission:{state:{status:'task',standPolicy:{}},receipts:[]}};
 report.create=await measure(()=>p.create('live',live));report.commit=await measure(()=>p.commit('live',0,{...live,clockCheckpointAt:now+1}));report.restore=await measure(async()=>{const saved=await p.load('live');assert.equal(saved.version,1);return saved.record.mission.state.status;});
 const directory=path.join(temp,'data/link/outbox');fs.mkdirSync(directory,{recursive:true});let bytes=0;
 for(let i=0;i<count;i++){const gameId=randomUUID(),text=JSON.stringify({queuedAt:new Date(old).toISOString(),deliveredAt:new Date(old).toISOString(),payload:{gameId,voiceSessionId:randomUUID(),photo:null}});bytes+=Buffer.byteLength(text);fs.writeFileSync(path.join(directory,gameId+'.json'),text);}
 report.outboxBytesBefore=bytes;report.filesBefore=fs.readdirSync(directory).length;
 report.relayStartupAndCleanup=await measure(async()=>{relay=createStelaRelay({root:temp,origin:'http://127.0.0.1:1',authorize:()=>null,now:()=>now});await relay.flush();return fs.readdirSync(directory).length;});assert.equal(report.relayStartupAndCleanup.result,0);
 report.steadyFlush=await measure(async()=>{for(let i=0;i<100;i++)await relay.flush();return 100;});report.passed=true;
 fs.writeFileSync('docs/verification-audit-fixes-20261026/retention-load.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{relay?.close();await p?.close();indexedDB.deleteDatabase(databaseName);fs.rmSync(temp,{recursive:true,force:true});}
