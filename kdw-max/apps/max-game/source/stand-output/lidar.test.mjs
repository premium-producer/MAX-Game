import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startLidar} from './lidar.mjs';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const config={enabled:true,bindAddress:'127.0.0.1',sourceAddress:'127.0.0.1',port:8000,timeoutMs:350,width:3072,height:1536,rawPoints:[[0,0],[1,0],[1,1],[0,1]],targetPoints:[[560,0],[2320,0],[2320,1536],[560,1536]]};
function fixture(){let options,opens=0,closes=0,resets=0,attached=false;const touches=[],points=[];
 return {touches,points,get opens(){return opens},get closes(){return closes},get resets(){return resets},emit(phase,x=.5,y=.5){options.onContact({id:'1',sourceContactId:'1',phase,x,y})},rank(p){return options.rankPoint(p)},
 options:{config,active:()=>true,log(){},onPoint:p=>points.push(p),contents:{debugger:{isAttached:()=>attached,attach(){attached=true},async sendCommand(_,event){touches.push(event)}}},makeReceiver:o=>{options=o;return{async start(){opens++},snapshot:()=>({bound:true}),reset(){resets++},async close(){closes++}}}}};}
test('calibration enter/save/cancel reuses UDP receiver and suppresses gameplay touch',async()=>{
 const f=fixture(),r=await startLidar(f.options);f.emit('down');await flush();assert.ok(Math.abs(f.touches[0].touchPoints[0].x-1440)<.001);
 assert.equal(r.reconfigure(config,true),true);await flush();assert.equal(f.touches.at(-1).type,'touchCancel');const n=f.touches.length;
 f.emit('down',.2,.3);await flush();assert.equal(f.touches.length,n);assert.equal(f.points.at(-1).x,.2);assert.equal(r.snapshot().calibrating,true);assert.equal(f.rank({x:.2,y:.3}),.3);
 assert.equal(r.reconfigure(config,false),true);f.emit('down');await flush();assert.equal(f.touches.at(-1).type,'touchStart');
 assert.equal(r.reconfigure(config,true),true);assert.equal(r.reconfigure({...config,targetPoints:[[600,0],[2280,0],[2280,1536],[600,1536]]},false),true);
 assert.equal(f.opens,1);assert.equal(f.closes,0);assert.equal(r.snapshot().calibrating,false);await r.close();assert.equal(f.closes,1);
});
test('initial calibration can return to disabled without closing mapper destination; invalid update is transactional',async()=>{
 const f=fixture(),disabled={...config,enabled:false,rawPoints:null,targetPoints:null},r=await startLidar({...f.options,config:disabled,calibrating:true});
 assert.equal(r.reconfigure(disabled,false),true);f.emit('down');await flush();assert.equal(f.touches.length,0);assert.equal(r.snapshot().enabled,false);assert.equal(f.closes,0);
 assert.throws(()=>r.reconfigure({...config,rawPoints:[[0,0],[0,0],[0,0],[0,0]]},false));assert.equal(r.snapshot().enabled,false);
 assert.equal(r.reconfigure({...config,port:8001},false),false);assert.equal(f.opens,1);assert.equal(f.closes,0);await r.close();
});

test('temporary renderer input errors retry on the next contact without disabling OSC',async()=>{
 const f=fixture(),send=f.options.contents.debugger.sendCommand;let reject=true;
 f.options.contents.debugger.sendCommand=async(...args)=>{if(reject){reject=false;throw Error('Target closed')};return send(...args);};
 const r=await startLidar(f.options);f.emit('down');await flush();assert.equal(f.touches.length,0);
 f.emit('move');await flush();assert.equal(f.touches.at(-1).type,'touchStart');assert.equal(r.snapshot().bound,true);assert.equal(f.closes,0);
 await r.close();
});

test('a queued touch cannot leak through a calibration or lifecycle reset',async()=>{
 const f=fixture(),r=await startLidar(f.options);f.emit('down');r.reconfigure(config,true);await flush();
 assert.equal(f.touches.some(t=>t.type==='touchStart'),false);assert.equal(f.touches.at(-1).type,'touchCancel');await r.close();
});

test('a legacy disabled flag cannot switch off a calibrated primary lidar input',async()=>{
 const f=fixture(),r=await startLidar({...f.options,config:{...config,enabled:false}});f.emit('down');await flush();assert.equal(f.touches.at(-1).type,'touchStart');assert.equal(r.snapshot().enabled,true);
 r.reconfigure({...config,enabled:false});f.emit('down');await flush();assert.equal(r.snapshot().enabled,true);assert.equal(f.touches.at(-1).type,'touchStart');await r.close();
});

function chromiumTouchState(f){
 let touching=false;
 const original=f.options.contents.debugger.sendCommand;
 f.options.contents.debugger.sendCommand=async(command,event)=>{
  if(event.type==='touchStart')touching=true;
  else if(!touching)throw Error('Must send a TouchStart first to start a new touch.');
  if(['touchEnd','touchCancel'].includes(event.type))touching=false;
  return original(command,event);
 };
 return{release:()=>{touching=false}};
}

test('reset before a queued start cannot trap all later contacts in an empty cancellation loop',async()=>{
 const f=fixture();chromiumTouchState(f);const r=await startLidar(f.options);
 f.emit('down');r.reset();await flush();
 f.emit('down');await flush();assert.equal(f.touches.at(-1)?.type,'touchStart');
 f.emit('up');await flush();assert.equal(f.touches.at(-1)?.type,'touchEnd');
 f.emit('down');await flush();assert.equal(f.touches.at(-1)?.type,'touchStart');
 assert.equal(r.snapshot().bound,true);assert.equal(f.opens,1);assert.equal(f.closes,0);await r.close();
});

test('a contact lost by Chromium recovers on the next mapper update without restart',async()=>{
 const f=fixture(),chrome=chromiumTouchState(f),logs=[];f.options.log=e=>logs.push(e);
 const r=await startLidar(f.options);f.emit('down');await flush();chrome.release();
 f.emit('move');await flush();await flush();
 f.emit('move');await flush();assert.equal(f.touches.filter(t=>t.type==='touchStart').length,2);
 f.emit('up');await flush();assert.equal(f.touches.at(-1).type,'touchEnd');
 assert.equal(logs.filter(e=>e.event==='lidar-input-error').length,1);
 assert.equal(r.snapshot().bound,true);assert.equal(f.closes,0);await r.close();
});

test('an already released touchEnd is harmless; unrelated cancellation errors remain visible',async()=>{
 const f=fixture(),chrome=chromiumTouchState(f),logs=[];f.options.log=e=>logs.push(e);
 const r=await startLidar(f.options);f.emit('down');await flush();chrome.release();
 f.emit('up');await flush();f.emit('down');await flush();
 assert.equal(f.touches.filter(t=>t.type==='touchStart').length,2);
 assert.equal(logs.filter(e=>e.event==='lidar-input-error').length,0);
 f.options.contents.debugger.sendCommand=async()=>{throw Error('Target closed')};r.reset();await flush();
 assert.equal(logs.at(-1).event,'lidar-input-error');assert.equal(logs.at(-1).message,'Target closed');
 await r.close();
});
