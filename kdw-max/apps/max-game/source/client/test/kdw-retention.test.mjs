import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB,IDBKeyRange,IDBRequest,IDBTransaction,IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor} from 'fake-indexeddb';
import {createIndexedDBPersistence} from '../src/application/indexeddb-persistence.mjs';
test('retention prunes only old released visitors and preserves active, recent and legacy sessions',async()=>{
 const names={indexedDB,IDBKeyRange,IDBRequest,IDBTransaction,IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor},prior={};for(const [k,v]of Object.entries(names)){prior[k]=globalThis[k];globalThis[k]=v;}
 let now=1000000;const p=createIndexedDBPersistence({key:'audit',legacyStorage:{getItem:()=>null},databaseName:'retention-'+Date.now(),now:()=>now,retentionMs:1000});
 const record=(status,reason,production=true)=>({schemaVersion:2,clockCheckpointAt:now,mission:{state:{status,standEndReason:reason,...(production?{standPolicy:{}}:{})}}});
 try{
  await p.create('released',record('menu','qr'));await p.create('active',record('task',null));await p.create('legacy',record('menu','qr',false));
  now+=1001;assert.equal(await p.prune('active'),1);assert.equal(await p.load('released'),null);assert.ok(await p.load('active'));assert.ok(await p.load('legacy'));
  await p.create('recent',record('menu','no-show'));assert.equal(await p.prune('active'),0);
 }finally{await p.close();for(const [k,v]of Object.entries(prior)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
