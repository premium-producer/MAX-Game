import test from 'node:test';
import assert from 'node:assert/strict';
import {createCardLeaseClient} from '../src/asset-audit/card-lock-client.mjs';

function fixture(request){
 let time=0,id=0;const timers=new Map(),lost=[];
 const client=createCardLeaseClient({request,onLost:m=>lost.push(m),now:()=>time,schedule:(fn,delay)=>{timers.set(++id,{fn,at:time+delay});return id;},cancel:key=>timers.delete(key)});
 return {client,lost,timers,setTime:n=>{time=n;},async tick(n){time=n;for(const [key,timer] of [...timers])if(timer.at<=time){timers.delete(key);await timer.fn();}}};
}
const grant=(token='A',validForMs=30000)=>({screenId:'screen',token,ttlMs:30000,heartbeatMs:8000,validForMs});
test('card lease expires locally and never keeps writing after missing heartbeat',async()=>{
 const f=fixture(async body=>{if(body.action==='renew')throw Error('offline');return grant();});
 await f.client.acquire('screen');assert.equal(f.client.valid(),true);assert.equal(f.client.headers()['X-MAX-Lock-Token'],'A');
 await f.tick(8000);assert.equal(f.client.valid(),false);assert.deepEqual(f.client.headers(),{});assert.equal(f.lost.length,1);assert.equal(f.timers.size,0);
});
test('slow acquire and short remaining server lifetime cannot grant a fresh 30 seconds',async()=>{
 let f;f=fixture(async()=>{f.setTime(1500);return grant('A',1000);});
 await assert.rejects(f.client.acquire('screen'));assert.equal(f.client.valid(),false);assert.equal(f.lost.length,1);
});
test('late renewal after local expiry cannot reactivate a stale editing form',async()=>{
 let resolve;const f=fixture(async body=>body.action==='renew'?new Promise(r=>resolve=r):grant());
 await f.client.acquire('screen');const pending=f.tick(8000);await Promise.resolve();await f.tick(30001);assert.equal(f.client.valid(),false);
 resolve(grant());await pending;assert.equal(f.client.valid(),false);assert.equal(f.lost.length,1);
});
test('late renewal after release cannot resurrect ownership or its timers',async()=>{
 let resolve;const calls=[];const f=fixture(async body=>{calls.push(body);return body.action==='renew'?new Promise(r=>resolve=r):grant();});
 await f.client.acquire('screen');const pending=f.tick(8000);await Promise.resolve();await f.client.release();resolve(grant());await pending;
 assert.equal(f.client.grant,null);assert.equal(f.timers.size,0);assert.equal(calls.at(-1).action,'release');
});
test('normal renewal extends deadline, release includes original capability',async()=>{
 const calls=[];const f=fixture(async body=>{calls.push(body);return grant();});await f.client.acquire('screen');await f.tick(8000);
 f.setTime(31000);assert.equal(f.client.valid(),true);await f.client.release();assert.deepEqual(calls.at(-1),{action:'release',screenId:'screen',token:'A'});assert.equal(f.client.valid(),false);
});
