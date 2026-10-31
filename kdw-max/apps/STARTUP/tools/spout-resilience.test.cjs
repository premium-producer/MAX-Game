const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{EventEmitter}=require('node:events');
async function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-spout-'));fs.mkdirSync(path.join(root,'data'));let recorder;t.after(async()=>{await recorder?.close();fs.rmSync(root,{recursive:true,force:true});});
 let now=0,token=0,pointCallback;const lidarCalls=[],windows=[],intervals=[],timeouts=[],errors=[],logs=[],completed=[],ipcMain=new EventEmitter();
 class Window extends EventEmitter{
  constructor(){super();this.webContents=new EventEmitter();Object.assign(this.webContents,{setFrameRate(){},setWindowOpenHandler(){},sent:[],send(...args){this.sent.push(args);},invalidations:0,invalidate(){this.invalidations++;},startPainting(){},stopPainting(){},stop(){},session:{webRequest:{onBeforeRequest(){}}}});windows.push(this);}
  loads=0;setContentSize(){}isDestroyed(){return false;}async loadURL(){this.loads++;this.webContents.emit('did-start-navigation',{},'',false,true);}destroy(){}
 }
 const bridge={send:()=>++token,poll:()=>completed.splice(0),status:()=>({}),close(){}};
 const exports={};const context={exports,__dirname:root,Buffer,URL,performance:{now:()=>now},setInterval:(f,ms)=>{intervals.push({f,ms});return f;},clearInterval(){},setTimeout:(f,ms)=>{timeouts.push({f,ms});return f;},clearTimeout(){},process:{pid:process.pid},require(name){if(name==='./runtime-performance.cjs')return{createPerformanceRecorder:options=>(recorder=require('./runtime-performance.cjs').createPerformanceRecorder(options))};if(name==='node:perf_hooks')return{performance:{now:()=>now}};if(name==='electron')return{BrowserWindow:Window,ipcMain};if(name==='./runtime-policy.cjs')return require('./runtime-policy.cjs');if(name==='./kdw_spout.node')return bridge;if(name==='./operator-http.cjs')return require('./operator-http.cjs');if(name==='./operator-calibration.cjs')return{createCalibration:()=>({point(){},status:()=>({}),result:()=>({rawPoints:[[0,0],[1,0],[1,1],[0,1]],targetPoints:[[560,0],[2320,0],[2320,1536],[560,1536]]})})};if(name==='./lidar.cjs')return{automaticLidarConfig:v=>v,validateLidarConfig:v=>v,solveCalibration(){},startLidar:async options=>{pointCallback=options.onPoint;lidarCalls.push('open');return{reset(){},snapshot:()=>null,reconfigure(value,raw){lidarCalls.push(raw?'calibration':'normal');return true;},close:async()=>{lidarCalls.push('close')}}}};return require(name);}};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../max-game/launcher/stand-output.cjs'),'utf8'),context);
 const output=await exports.startStandOutput({root,host:{origin:'http://127.0.0.1:19252'},config:{entry:'/'},log:v=>logs.push(v),onFatal:e=>errors.push(e)});
 const texture=(channel=0,info={})=>{let releases=0;const value={textureInfo:{widgetType:'frame',codedSize:{width:3072,height:1536},handle:{ntHandle:Buffer.alloc(8)},...info},release(){releases++;}};windows[channel].webContents.emit('paint',{texture:value});return()=>releases;};
 return{point:value=>pointCallback(value),root,output,bridge,ipcMain,lidarCalls,windows,intervals,timeouts,errors,logs,completed,texture,at:t=>{now=t;},contentReady(){ipcMain.emit('kdw:background-tick',{sender:windows[1].webContents},{delta:.016,ready:true,epoch:'test'});},ready(){ipcMain.emit('kdw:background-tick',{sender:windows[1].webContents},{delta:.016,ready:true,epoch:'test'});ipcMain.emit('kdw:background-ack',{sender:windows[0].webContents},{ready:'true'});}};
}
test('bad paint is discarded; a valid borrowed texture is released only at GPU completion',async t=>{const f=await fixture(t);const bad=f.texture(0,{codedSize:{width:1,height:1}});assert.equal(bad(),1);assert.equal(f.errors.length,0);const valid=f.texture();assert.equal(valid(),0);f.completed.push(1);f.intervals.find(x=>x.ms===4).f();assert.equal(valid(),1);});
test('native submission failure quarantines the borrowed texture until worker termination',async t=>{const f=await fixture(t);f.bridge.send=()=>{throw Error('GPU_FAILURE_AFTER_COPY');};const releases=f.texture();assert.equal(releases(),0);assert.equal(f.errors.length,1);assert.equal(f.texture()(),1);assert.equal(f.errors.length,1);});
test('content recovers automatic input without manual ARM or a new enable file',async t=>{
 const f=await fixture(t);f.at(20000);f.ready();f.texture(0);f.texture(1);assert.equal(f.output.active(),true);
 const old=f.output.bootId;f.windows[1].webContents.emit('render-process-gone',{}, {reason:'crashed'});
 assert.notEqual(f.output.bootId,old);assert.equal(f.output.active(),false);
 fs.writeFileSync(path.join(f.root,'data/output-arm.json'),JSON.stringify({bootId:old,armed:false}));
 f.intervals.find(x=>x.ms===500).f();assert.equal(f.output.operatorStatus().armed,true);
 f.at(21000);f.timeouts[0].f();f.contentReady();assert.equal(f.output.active(),false);
 f.texture(1);f.intervals.find(x=>x.ms===500).f();f.at(21500);f.contentReady();f.texture(1);f.intervals.find(x=>x.ms===500).f();assert.equal(f.output.active(),true);
 f.completed.push(1,2,3,4);
 f.texture(0);f.intervals.find(x=>x.ms===4).f();assert.equal(f.errors.length,0);
});

test('presentation starts before input readiness and background never gates input',async t=>{
 const f=await fixture(t);assert.equal(f.output.operatorStatus().presenting,true);assert.equal(f.output.active(),false);
 f.contentReady();assert.equal(f.output.active(),true);assert.equal(f.output.operatorStatus().backgroundReady,false);
 f.output.setArmed(false);assert.equal(f.output.active(),true);
 fs.writeFileSync(path.join(f.root,'data/output-arm.json'),JSON.stringify({bootId:f.output.bootId,armed:false}));
 f.intervals.find(x=>x.ms===500).f();assert.equal(f.output.active(),true);
 f.windows[0].webContents.emit('render-process-gone',{}, {reason:'crashed'});assert.equal(f.output.active(),true);
});

test('background clock waits for its page, and does not depend on content ticks',async t=>{const f=await fixture(t),clock=f.intervals.find(x=>x.ms===250);clock.f();assert.equal(f.windows[0].webContents.sent.filter(x=>x[0]==='kdw:background-frame').length,0);f.windows[0].webContents.emit('did-finish-load');clock.f();assert.equal(f.windows[0].webContents.sent.filter(x=>x[0]==='kdw:background-frame').length,1);});

test('calibration retains OSC transport and resumes input automatically on save or cancel',async t=>{
 const f=await fixture(t),value={port:8000,sourceAddress:'127.0.0.1'};f.contentReady();assert.equal(f.output.active(),true);
 for(const finish of ['cancelCalibration','saveCalibration','cancelCalibration']){
  await f.output.beginCalibration(value);assert.equal(f.output.active(),false);assert.equal(f.output.operatorStatus().armed,true);
  await f.output[finish]();assert.equal(f.output.active(),true);
 }
 assert.equal(f.lidarCalls.filter(x=>x==='open').length,1);assert.equal(f.lidarCalls.includes('close'),false);
 assert.equal(fs.existsSync(path.join(f.root,'data/output-arm.json')),false);
});

test('renderer recovery during calibration also resumes without ARM after exit',async t=>{
 const f=await fixture(t);f.contentReady();await f.output.beginCalibration({port:3000});
 f.windows[1].webContents.emit('render-process-gone',{}, {reason:'crashed'});f.timeouts[0].f();f.at(100);f.contentReady();f.texture(1);f.intervals.find(x=>x.ms===500).f();f.at(600);f.contentReady();f.texture(1);f.intervals.find(x=>x.ms===500).f();
 assert.equal(f.output.active(),false);await f.output.saveCalibration();assert.equal(f.output.active(),true);
});

test('operator bridge accepts only the content renderer reply and coalesces no duplicate request',async t=>{
 const f=await fixture(t);f.contentReady();const work=f.output.gameControl({action:'next',token:'scope'});
 const packet=f.windows[1].webContents.sent.find(v=>v[0]==='kdw:game-control')[1];
 assert.throws(()=>f.output.gameControl({action:'back',token:'scope'}),/OPERATOR_BUSY/);
 f.ipcMain.emit('kdw:game-control-result',{sender:f.windows[0].webContents},{id:packet.id,value:'spoof'});
 f.ipcMain.emit('kdw:game-control-result',{sender:f.windows[1].webContents},{id:packet.id,value:{screenId:'next'}});
 assert.equal((await work).screenId,'next');
 const pending=f.output.gameControl({action:'back',token:'scope'});f.timeouts.filter(v=>v.ms===2500).at(-1).f();await assert.rejects(pending,/OPERATOR_TIMEOUT/);
 assert.throws(()=>f.output.gameControl({action:'execute',token:'scope'}),/INVALID_OPERATOR_ACTION/);
});

test('healthy continuous Spout frames are not invalidated by the monitor; stale layers still are',async t=>{
 const f=await fixture(t),monitor=f.intervals.find(x=>x.ms===500).f;
 f.at(100);f.ready();f.texture(0);f.texture(1);f.completed.push(1,2);f.intervals.find(x=>x.ms===4).f();
 f.at(500);monitor();assert.deepEqual(f.windows.map(w=>w.webContents.invalidations),[0,0]);
 f.at(700);f.texture(1);monitor();assert.deepEqual(f.windows.map(w=>w.webContents.invalidations),[1,0]);
 assert.equal(f.output.active(),true);assert.equal(f.errors.length,0);
});

test('overlay sends changes and one clear, preserves moving cursor and restores after reload',async t=>{
 const f=await fixture(t),tick=f.intervals.find(x=>x.ms===33).f,packets=()=>f.windows[1].webContents.sent.filter(v=>v[0]==='kdw:operator-overlay').map(v=>v[1]);
 f.ready();for(let i=0;i<100;i++)tick();assert.equal(packets().length,1);
 f.output.setCursor(true);f.point({phase:'move',mapped:{inside:true,x:100,y:200}});tick();assert.equal(packets().at(-1).cursor.y,200);
 for(let i=0;i<100;i++){f.point({phase:'move',mapped:{inside:true,x:100,y:200}});tick();}assert.equal(packets().length,2);
 f.point({phase:'move',mapped:{inside:true,x:100,y:220}});tick();assert.equal(packets().at(-1).cursor.y,220);
 f.output.setCursor(false);tick();assert.equal(packets().at(-1).cursor,null);for(let i=0;i<100;i++)tick();assert.equal(packets().length,4);
 f.windows[1].webContents.emit('did-finish-load');tick();assert.equal(packets().length,5);
 await f.output.beginCalibration({port:8000});tick();assert(packets().at(-1).calibration);await f.output.cancelCalibration();tick();assert.equal(packets().at(-1).calibration,null);assert.equal(f.output.active(),true);assert.equal(f.lidarCalls.filter(x=>x==='open').length,1);
});

// A simulated compositor/IPC fault drives the real worker orchestration.
const monitor=f=>f.intervals.find(x=>x.ms===500).f();
const good=(f,time,channels=[0,1])=>{f.at(time);f.ready();for(const c of channels)f.texture(c);f.completed.push(...Array.from({length:channels.length},()=>++f.sequence));f.intervals.find(x=>x.ms===4).f();};

test('two-second texture gap holds the sender and rearms paint without restarting output or OSC',async t=>{
 const f=await fixture(t);f.sequence=0;good(f,20000);f.at(22100);f.ready();monitor(f);
 assert.equal(f.errors.length,0);assert.equal(f.output.active(),false);
 assert.deepEqual(f.windows.map(w=>w.loads),[1,1]);assert.equal(f.logs.filter(v=>v.event==='spout-recovery-repaint').length,2);
 good(f,22200);monitor(f);good(f,22700);monitor(f);
 assert.equal(f.output.active(),true);assert.equal(f.output.operatorStatus().recovery.every(v=>v===null),true);
 assert.equal(f.logs.filter(v=>v.event==='spout-recovered').length,2);assert.deepEqual(f.lidarCalls,['open']);
});

test('a brief invalid paint is discarded without recovery or changing active input',async t=>{
 const f=await fixture(t);f.sequence=0;good(f,20000);f.windows[0].webContents.emit('paint',{});f.at(20700);monitor(f);
 assert.equal(f.errors.length,0);assert.equal(f.output.active(),true);assert.equal(f.logs.some(v=>v.event==='spout-recovery-start'),false);
 good(f,20800);monitor(f);assert.deepEqual(f.windows.map(w=>w.loads),[1,1]);
});

test('persistent background gap reloads only that page; healthy content and LiDAR stay active',async t=>{
 const f=await fixture(t);f.sequence=0;good(f,20000);good(f,22100,[1]);monitor(f);assert.equal(f.output.active(),true);
 good(f,26100,[1]);monitor(f);assert.equal(f.timeouts.length,1);f.timeouts[0].f();
 assert.deepEqual(f.windows.map(w=>w.loads),[2,1]);assert.equal(f.output.active(),true);
 good(f,26200);monitor(f);good(f,26700);monitor(f);
 assert.equal(f.errors.length,0);assert.deepEqual(f.lidarCalls,['open']);assert.equal(f.output.operatorStatus().recovery[0],null);
});

test('fresh texture alone cannot hide dead content IPC; reload attempts are bounded',async t=>{
 const f=await fixture(t);f.sequence=0;good(f,20000);
 const contentFrame=(at)=>{f.at(at);f.texture(1);f.completed.push(++f.sequence);f.intervals.find(x=>x.ms===4).f();};
 contentFrame(25100);monitor(f);assert.equal(f.output.active(),false);
 // Keep background healthy separately, so only content exhausts its budget.
 const step=at=>{good(f,at,[0]);f.at(at+5100);monitor(f);};
 step(25100);f.timeouts.at(-1).f();
 step(46200);f.timeouts.at(-1).f();
 step(69200);f.timeouts.at(-1).f();
 step(99200);
 assert.equal(f.errors.length,1);assert.match(f.errors[0].message,/RENDERER_RECOVERY_EXHAUSTED/);
 assert.equal(f.lidarCalls.includes('close'),false);
});

test('hung GPU fence still escalates without releasing a borrowed texture early',async t=>{
 const f=await fixture(t);f.at(20000);const releases=f.texture(1);f.at(25001);f.intervals.find(x=>x.ms===4).f();
 assert.equal(f.errors.length,1);assert.match(f.errors[0].message,/GPU completion timeout/);assert.equal(releases(),0);
});
