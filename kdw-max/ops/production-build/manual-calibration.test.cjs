const test=require('node:test'),assert=require('node:assert/strict');
const {createCalibration,validateTargets,DEFAULT_TARGETS,readTargets}=require('../../apps/max-game/launcher/operator-calibration.cjs');
const {solveCalibration}=require('../../apps/max-game/launcher/lidar.cjs');
test('identical output heartbeats never cancel an in-progress touch',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),listeners={},events=[];let exposed;
 vm.runInNewContext(fs.readFileSync(require.resolve('../../apps/max-game/launcher/stand-preload.cjs'),'utf8'),{require:()=>({ipcRenderer:{on:(event,fn)=>listeners[event]=fn},contextBridge:{exposeInMainWorld:(_name,value)=>{exposed=value;}}}),document:{addEventListener(){}},window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type;}}});
 const notify=v=>listeners['kdw:output-state'](null,v);notify(true);for(let i=0;i<10;i++)notify(true);assert.equal(events.length,1);assert.equal(exposed.active(),true);notify(false);notify(false);assert.equal(events.length,2);assert.equal(exposed.active(),false);
});
test('presentation continues while input initializes and identical automatic packets preserve contacts',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),listeners={},events=[];let exposed;
 vm.runInNewContext(fs.readFileSync(require.resolve('../../apps/max-game/launcher/stand-preload.cjs'),'utf8'),{require:()=>({ipcRenderer:{on:(event,fn)=>listeners[event]=fn},contextBridge:{exposeInMainWorld:(_name,value)=>{exposed=value;}}}),document:{addEventListener(){}},window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type;}}});
 const notify=v=>listeners['kdw:output-state'](null,v);
 notify({active:false,presenting:true});assert.equal(exposed.active(),false);assert.equal(exposed.presenting(),true);
 notify({active:true,presenting:true});for(let i=0;i<10;i++)notify({active:true,presenting:true});assert.equal(events.length,1);
 notify({active:false,presenting:false});assert.equal(exposed.presenting(),false);assert.equal(events.length,2);
});

test('reachable corner targets validate independently of the saved raw mapping',()=>{
 assert.deepEqual(DEFAULT_TARGETS,[[1000,500],[1880,500],[1880,1036],[1000,1036],[1440,768]]);
 assert.deepEqual(readTargets([[1000,768],[1440,500],[1880,768],[1440,1036],[1440,768]]),DEFAULT_TARGETS);
 const custom=[[1100,600],[1800,600],[1800,1000],[1100,1000],[1450,800]];assert.deepEqual(readTargets(custom),custom);
 assert.deepEqual(validateTargets(DEFAULT_TARGETS),DEFAULT_TARGETS);
 for(const mutate of [p=>p[0][0]=500,p=>p[1][1]=10,p=>p[2]=p[0],p=>p[4]=[2200,100],p=>[p[0],p[2],p[1],p[3],p[4]]]){let p=structuredClone(DEFAULT_TARGETS);const result=mutate(p);if(Array.isArray(result))p=result;assert.throws(()=>validateTargets(p));}
});
test('five automatic captures require release; custom center is independently checked',()=>{
 let now=1000;const targets=[[1100,600],[1780,600],[1780,936],[1100,936],[1440,768]],c=createCalibration(solveCalibration,()=>now,{targets,autoCapture:true});
 const hold=(x,y)=>{for(let i=0;i<22;i++){now+=50;c.point({phase:i?'move':'down',sourceContactId:'hand',x,y});}};
 for(const [i,p]of [[0,0],[1,0],[1,1],[0,1],[.5,.5]].entries()){hold(...p);assert.equal(c.status().step,Math.min(i+1,4));const before=c.status().points.length;hold(...p);assert.equal(c.status().points.length,before);c.point({phase:'up'});}
 assert.equal(c.status().complete,true);assert.ok(c.status().centerError<1e-5);assert.deepEqual(c.result().targetPoints,targets.slice(0,4));
});
test('live cursor uses saved mapping then solved corners; release and timeout clear it',()=>{
 let now=1000;const previousMapping=solveCalibration([[0,0],[1,0],[1,1],[0,1]],[[600,0],[2200,0],[2200,1500],[600,1500]],[3072,1536]);
 const c=createCalibration(solveCalibration,()=>now,{previousMapping});
 const point=(x,y)=>{for(let i=0;i<4;i++){now+=50;c.point({phase:'move',sourceContactId:'hand',x,y});}};
 point(.5,.5);assert.equal(c.status().cursor.source,'previous');assert.ok(Math.abs(c.status().cursor.x-1400)<.001);
 now+=350;assert.equal(c.status().cursor,null);assert.equal(c.status().latest,null);
 for(const p of [[0,0],[1,0],[1,1],[0,1]]){point(...p);c.capture();c.point({phase:'up'});assert.equal(c.status().cursor,null);}
 point(.5,.5);assert.equal(c.status().cursor.source,'preview');assert.ok(Math.abs(c.status().cursor.x-1440)<.001);assert.ok(Math.abs(c.status().cursor.y-768)<.001);c.capture();assert.equal(c.status().complete,true);assert.ok(c.status().cursor);c.point({phase:'cancel'});assert.equal(c.status().cursor,null);
 const fresh=createCalibration(solveCalibration,()=>now);fresh.point({phase:'down',sourceContactId:'hand',x:.2,y:.3});assert.equal(fresh.status().cursorMapping,'unavailable');assert.equal(fresh.status().cursor,null);assert.equal(fresh.status().latest.x,.2);
});
test('Spout calibration overlay draws contact cursor even when gameplay cursor is absent',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),listeners={},arcs=[],texts=[];
 const context=new Proxy({arc:(...args)=>arcs.push(args),fillText:text=>texts.push(text)},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={style:{},setAttribute(){},getContext:()=>context};
 vm.runInNewContext(fs.readFileSync(require.resolve('../../apps/max-game/launcher/stand-preload.cjs'),'utf8'),{require:()=>({ipcRenderer:{on:(event,fn)=>listeners[event]=fn},contextBridge:{exposeInMainWorld(){}}}),document:{addEventListener(){},body:{append(){}},createElement:()=>canvas}});
 const state=createCalibration(solveCalibration).status();listeners['kdw:operator-overlay'](null,{calibration:{...state,cursor:{x:1200,y:750,source:'previous'}}});assert.ok(arcs.some(([x,y,r])=>x===1200&&y===750&&r===26));assert.ok(texts.some(t=>t.includes('Касание: 1200, 750')));
 arcs.length=0;listeners['kdw:operator-overlay'](null,{calibration:state});assert.equal(arcs.some(a=>a[2]===26),false);
});
test('wrong center and a jittering hand never save a calibration',()=>{
 let now=1000;const c=createCalibration(solveCalibration,()=>now,{autoCapture:true});const hold=(x,y)=>{for(let i=0;i<22;i++){now+=50;c.point({phase:'move',sourceContactId:'1',x,y});}c.point({phase:'up'});};for(const p of [[0,0],[1,0],[1,1],[0,1]])hold(...p);hold(.1,.1);assert.equal(c.status().complete,false);assert.match(c.status().autoError,/Ошибка в центре/);assert.throws(()=>c.result());
 const jitter=createCalibration(solveCalibration,()=>now,{autoCapture:true});for(let i=0;i<80;i++){now+=50;jitter.point({phase:'move',sourceContactId:'1',x:i%2*.1,y:0});}assert.equal(jitter.status().points.length,0);
});
