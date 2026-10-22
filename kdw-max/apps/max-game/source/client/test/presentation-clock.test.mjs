import test from 'node:test';
import assert from 'node:assert/strict';
import {createPresentationClock} from '../src/kdw-card-clock.mjs';
const snapshot=(time,revision=1,extra={})=>({state:{sessionId:'s',runId:1,taskId:'posts',screenId:'feed',revision,ownerActive:true,...extra.state},view:{clock:{schemaVersion:1,serverTime:time,checkpointAt:time,maxExtrapolationMs:1000,held:false,...extra.clock}}});

test('visual clock absorbs checkpoint jitter without a one-frame position jump',()=>{
 let now=0;const clock=createPresentationClock({now:()=>now,smooth:true});
 clock.accept(snapshot(1000));let last=clock.read().time;
 for(let i=1;i<120;i++){
  now=i*16;
  if(i%6===0)clock.accept(snapshot(1000+now+(i%12===0?-30:30),i));
  const next=clock.read().time;
  assert.ok(next-last>=14.4-1e-8&&next-last<=17.6+1e-8,`frame ${i}: ${next-last}`);last=next;
 }
});
test('visual clock respects hold, disconnect, stale bounds and new runs',()=>{
 let now=0;const clock=createPresentationClock({now:()=>now,smooth:true});
 clock.accept(snapshot(1000));clock.read();now=100;clock.read();
 clock.accept(snapshot(1050,2,{clock:{held:true}}));assert.equal(clock.read().time,1050);
 now=300;assert.equal(clock.read().time,1050);
 clock.accept(snapshot(1050,3));clock.read();now=400;const paused=clock.read(false);assert.equal(paused.time,1050);assert.equal(paused.stale,true);
 clock.accept(snapshot(1400,4));clock.read();now=2000;const stale=clock.read();assert.equal(stale.stale,true);assert.ok(stale.time<=2400);
 clock.accept(snapshot(50,5,{state:{runId:2}}));assert.equal(clock.read().time,50);
 clock.accept({});assert.deepEqual(clock.read(),{time:null,stale:true});
 clock.accept(snapshot(70,6));assert.equal(clock.read().time,70);
});
test('default clock retains immediate authoritative corrections',()=>{
 let now=0;const clock=createPresentationClock({now:()=>now});clock.accept(snapshot(1000));clock.read();now=100;
 assert.equal(clock.read().time,1100);clock.accept(snapshot(1070,2));assert.equal(clock.read().time,1070);
});
