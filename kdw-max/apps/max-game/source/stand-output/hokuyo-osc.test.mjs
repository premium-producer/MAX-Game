import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import osc from 'osc';
import {createSocket} from 'node:dgram';
import {createHokuyoReceiver} from './hokuyo-osc.mjs';
import {solveCalibration,calibrationTargets} from './calibration.mjs';
const source={address:'10.0.0.11'},msg=(address,args)=>({address,args:args.map((value,i)=>({type:typeof value==='string'?'s':i?'f':'i',value}))});
const bundle=(...packets)=>({timeTag:{raw:[0,1]},packets});
const bytes=p=>osc.writePacket(p,{metadata:true});
const feed=(r,p,info=source)=>r.decodePacket(bytes(p),info);
const fixture=options=>{let t=1000;const events=[];const r=createHokuyoReceiver({now:()=>t,onContact:e=>events.push(e),...options});return {r,events,time:value=>t=value};};
test('one bundle chooses uppermost regardless of arrival order; ties prefer incumbent',()=>{
 for(const reverse of [false,true]){const {r,events}=fixture();const points=[msg('/create',[9,.4,.9]),msg('/create',[2,.5,.2])];feed(r,bundle(...(reverse?points.reverse():points)));
 assert.equal(events.length,1);assert.equal(events[0].sourceContactId,'2');assert.equal(events[0].phase,'down');
 feed(r,msg('/update',[9,.4,.2]));assert.equal(events.at(-1).sourceContactId,'2');}
});
test('crossing points switches coordinates but keeps gesture and no repeated down',()=>{
 const {r,events}=fixture();feed(r,bundle(msg('/create',[1,.1,.2]),msg('/create',[2,.8,.6])));
 feed(r,bundle(msg('/update',[2,.8,.1]),msg('/update',[1,.1,.5])));
 assert.deepEqual(events.map(e=>e.phase),['down','move']);assert.deepEqual(events.map(e=>e.id),['1','1']);assert.equal(events[1].sourceContactId,'2');assert.equal(r.snapshot().selectionChanges,1);
});
test('delete winner and create replacement in one bundle is atomic, final release uses last selected XY',()=>{
 const {r,events}=fixture();feed(r,msg('/create',[1,.1,.2]));feed(r,bundle(msg('/delete',[1]),bundle(msg('/create',[2,.8,.3]))));
 assert.deepEqual(events.map(e=>e.phase),['down','move']);feed(r,msg('/delete',[2]));assert.equal(events.at(-1).phase,'up');assert.equal(events.at(-1).id,'1');assert.equal(events.at(-1).sourceContactId,'2');assert.equal(events.at(-1).x,Math.fround(.8));
});
test('delete top selects next highest and only all-gone releases',()=>{
 const {r,events}=fixture();feed(r,bundle(msg('/create',[1,.1,.2]),msg('/create',[2,.8,.6])));feed(r,msg('/delete',[1]));assert.equal(events.at(-1).phase,'move');assert.equal(events.at(-1).sourceContactId,'2');feed(r,msg('/delete',[2]));assert.equal(events.at(-1).phase,'up');
});
test('timeout quarantines stale points; live survivor keeps gesture, all stale cancels',()=>{
 const {r,events,time}=fixture();feed(r,bundle(msg('/create',[1,.1,.2]),msg('/create',[2,.8,.6])));time(1200);feed(r,msg('/update',[2,.8,.6]));time(1400);r.expire();assert.equal(events.at(-1).sourceContactId,'2');assert.equal(events.at(-1).phase,'move');time(1600);r.expire();assert.equal(events.at(-1).phase,'cancel');const n=events.length;feed(r,msg('/update',[1,.2,.1]));feed(r,msg('/update',[2,.2,.1]));assert.equal(events.length,n);feed(r,msg('/create',[2,.2,.1]));assert.equal(events.at(-1).phase,'down');
});
test('reset quarantines every physical contact and never hands retained points to new context',()=>{
 const {r,events}=fixture();feed(r,bundle(msg('/create',[1,.1,.2]),msg('/create',[2,.8,.6])));r.reset();const n=events.length;feed(r,bundle(msg('/update',[1,.1,.1]),msg('/update',[2,.8,.1])));assert.equal(events.length,n);assert.equal(r.snapshot().contactCount,0);feed(r,msg('/delete',[2]));feed(r,msg('/update',[2,.8,.1]));assert.equal(events.at(-1).phase,'down');
});
test('calibrated screen Y can reverse raw order through real perspective-transform',()=>{
 const rawPoints=[[0,1],[1,1],[1,0],[0,0]],targetPoints=[[0,0],[4096,0],[4096,1280],[0,1280]];
 const solver=solveCalibration(rawPoints,targetPoints);const {r,events}=fixture({rankPoint:p=>solver.map(p.x,p.y).y});feed(r,bundle(msg('/create',[1,.1,.2]),msg('/create',[2,.8,.8])));assert.equal(events[0].sourceContactId,'2');assert.ok(events[0].selectedY<300);
});
test('real osc.Port emits osc then child messages: receiver consumes packet once',async()=>{
 const port=new osc.Port({metadata:true});port.open=()=>port.emit('ready');port.close=()=>port.emit('close');const {r,events}=fixture({makePort:()=>port});await r.start();port.emit('data',bytes(bundle(msg('/create',[1,.1,.6]),msg('/create',[2,.8,.1]))),source);assert.equal(events.length,1);assert.equal(events[0].sourceContactId,'2');assert.equal(r.snapshot().acceptedUpdates,2);r.close();assert.equal(events.at(-1).phase,'cancel');
});
test('both compact and captured legacy arities remain accepted, invalid/source-spoof rejected',()=>{
 const {r,events}=fixture();feed(r,msg('/create',[1,.1,.2,0,0]));feed(r,msg('/update',[1,.2,.3]));feed(r,msg('/update',[1,.3,.4,0,0]));feed(r,msg('/delete',[1]));assert.deepEqual(events.map(e=>e.phase),['down','move','move','up']);
 const n=events.length;const bad=[['/update',[1,.1]],['/update',[1,.1,.2,0]],['/update',[1,.1,.2,0,0,0]],['/delete',[1,0]],['/unknown',[1,.1,.2]],['/update',[-1,.1,.2]],['/update',[1,NaN,.2]],['/update',[1,.1,Infinity]],['/update',[1,.1,10001]],['/update',[1,.1,.2,NaN,0]],['/update',[1,'bad',.2]]];for(const [a,v] of bad)feed(r,msg(a,v));feed(r,msg('/create',[5,.1,.1]),{address:'10.0.0.12'});assert.equal(events.length,n);assert.equal(r.snapshot().decodeErrors,bad.length);assert.equal(r.snapshot().rejectedSources,1);
});
test('invalid ranking cancels safely; equal initial Y resolves by ID; closed fixtures cannot emit',()=>{
 let invalid=false;const {r,events}=fixture({rankPoint:p=>invalid?NaN:p.y});feed(r,bundle(msg('/create',[8,.1,.2]),msg('/create',[2,.8,.2])));assert.equal(events[0].sourceContactId,'2');invalid=true;feed(r,msg('/update',[2,.8,.1]));assert.equal(events.at(-1).phase,'cancel');r.close();const n=events.length;feed(r,msg('/create',[3,.8,.1]));assert.equal(events.length,n);
});
test('late create after complete350ms gap is a fresh gesture',()=>{
 const {r,events,time}=fixture();feed(r,msg('/create',[1,.1,.2]));time(1400);feed(r,msg('/create',[2,.2,.1]));assert.deepEqual(events.map(e=>e.phase),['down','cancel','down']);assert.equal(events.at(-1).id,'2');
});
test('reentrant cancel/reset and release/new create commit state before callbacks',()=>{
 let r,resetOnce=false;const events=[];r=createHokuyoReceiver({onContact:e=>{events.push(e);if(e.phase==='cancel'&&!resetOnce){resetOnce=true;r.reset();}}});feed(r,msg('/create',[1,.1,.2]));r.reset();assert.deepEqual(events.map(e=>e.phase),['down','cancel']);
 const next=[];r=createHokuyoReceiver({onContact:e=>{next.push(e);if(e.phase==='up')feed(r,msg('/create',[2,.2,.1]));}});feed(r,msg('/create',[1,.1,.2]));feed(r,msg('/delete',[1]));assert.deepEqual(next.map(e=>e.phase),['down','up','down']);assert.equal(r.snapshot().activeContactId,'2');
});
test('closing in a source-timeout callback prevents late packet from reopening contact',()=>{
 let t=1000,r;const events=[];r=createHokuyoReceiver({now:()=>t,onContact:e=>{events.push(e);if(e.phase==='cancel')r.close();}});feed(r,msg('/create',[1,.1,.2]));t=1400;feed(r,msg('/create',[2,.2,.1]));assert.deepEqual(events.map(e=>e.phase),['down','cancel']);assert.equal(r.snapshot().contactCount,0);
});

function reconnectFixture({initialError=false,throwOnce=false}={}){
 const ports=[],jobs=[],events=[];let cleared=0;
 const r=createHokuyoReceiver({onContact:e=>events.push(e),setRetryTimer:(fn,ms)=>{const job={fn,ms,cancelled:false};jobs.push(job);return job;},clearRetryTimer:job=>{job.cancelled=true;cleared++;},makePort:()=>{
  if(throwOnce){throwOnce=false;throw Object.assign(Error('Socket construction'),{code:'ENOBUFS'});}
  const p=new osc.Port({metadata:true});p.open=()=>{if(initialError){initialError=false;p.emit('error',Object.assign(Error('Address in use'),{code:'EADDRINUSE'}));}else p.emit('ready');};p.close=()=>p.emit('close');ports.push(p);return p;
 }});return{r,ports,jobs,events,cleared:()=>cleared};
}

test('OSC listener retries initial bind failure and resumes without operator intervention',async()=>{
 const f=reconnectFixture({initialError:true});await f.r.start();assert.equal(f.r.snapshot().bound,false);assert.equal(f.r.snapshot().reconnecting,true);assert.equal(f.jobs[0].ms,250);
 f.jobs.shift().fn();assert.equal(f.r.snapshot().bound,true);assert.equal(f.r.snapshot().lastTransportError,null);
 f.ports.at(-1).emit('data',bytes(msg('/create',[3,.5,.5])),source);assert.equal(f.events.at(-1).phase,'down');assert.equal(f.r.snapshot().connectionAttempts,2);await f.r.close();
});

test('unexpected socket close cancels a held gesture and restores the receiver automatically',async()=>{
 const f=reconnectFixture();await f.r.start();f.ports[0].emit('data',bytes(msg('/create',[1,.5,.5])),source);f.ports[0].emit('close');assert.equal(f.events.at(-1).phase,'cancel');assert.equal(f.r.snapshot().reconnecting,true);
 f.jobs.shift().fn();assert.equal(f.r.snapshot().bound,true);const n=f.events.length;
 f.ports[0].emit('data',bytes(msg('/create',[9,.2,.2])),source);assert.equal(f.events.length,n);
 f.ports[1].emit('data',bytes(msg('/create',[2,.3,.3])),source);assert.equal(f.events.at(-1).phase,'down');await f.r.close();
});

test('decoder errors keep a healthy socket; network errors retry; shutdown prevents late reopening',async()=>{
 const f=reconnectFixture();await f.r.start();f.ports[0].emit('error',Object.assign(Error('Malformed packet'),{code:'ERR_OUT_OF_RANGE'}));assert.equal(f.jobs.length,0);assert.equal(f.r.snapshot().bound,true);
 f.ports[0].emit('error',Object.assign(Error('Network down'),{code:'ENETDOWN'}));assert.equal(f.jobs.length,1);const job=f.jobs[0];await f.r.close();assert.equal(f.cleared(),1);
 job.fn();assert.equal(f.ports.length,1);assert.equal(f.r.snapshot().bound,false);assert.equal(f.r.snapshot().reconnecting,false);
});

test('a synchronous socket construction error is retried rather than leaving opening latched',async()=>{
 const f=reconnectFixture({throwOnce:true});await f.r.start();assert.equal(f.r.snapshot().reconnecting,true);f.jobs.shift().fn();assert.equal(f.r.snapshot().bound,true);await f.r.close();
});

test('real UDP port conflict recovers and accepts OSC once the port becomes available',async()=>{
 const busy=createSocket('udp4'),sender=createSocket('udp4');let receiver;
 try{
  await new Promise(resolve=>busy.bind(0,'127.0.0.1',resolve));const port=busy.address().port;const events=[];
  receiver=createHokuyoReceiver({port,address:'127.0.0.1',sourceAddress:'127.0.0.1',onContact:e=>events.push(e)});
  await receiver.start();assert.equal(receiver.snapshot().bound,false);assert.equal(receiver.snapshot().lastTransportError,'EADDRINUSE');
  await new Promise(resolve=>busy.close(resolve));
  const until=Date.now()+3000;while(!receiver.snapshot().bound&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(receiver.snapshot().bound,true);
  await new Promise((resolve,reject)=>sender.send(Buffer.from(bytes(msg('/create',[7,.5,.5]))),port,'127.0.0.1',e=>e?reject(e):resolve()));
  const deadline=Date.now()+1000;while(!events.length&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(events[0]?.phase,'down');assert.equal(events[0]?.sourceContactId,'7');
 }finally{await receiver?.close();try{busy.close();}catch{}try{sender.close();}catch{}}
});
