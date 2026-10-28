'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{RecoveryBudget}=require('./runtime-policy.cjs'),{rpcPeer}=require('./runtime-ipc.cjs'),{createRuntimeJournal}=require('./runtime-journal.cjs');
const atomic=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(value));fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}};
function run({root}){
 const role=process.argv.find(a=>a.startsWith('--runtime-role='))?.split('=')[1]||'supervisor';
 const {app,screen}=require('electron'),config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')),journal=createRuntimeJournal({root,role});
 require('./runtime-crashes.cjs').startCrashCapture({root,role});
 process.on('uncaughtException',e=>{journal.fault('UNCAUGHT_EXCEPTION',{message:e.message,stack:e.stack});app.exit(1);});
 process.on('unhandledRejection',e=>{journal.fault('UNHANDLED_REJECTION',{message:e?.message||String(e),stack:e?.stack});app.exit(1);});
 if(role==='output'){require(path.join(root,'launcher/display-worker.cjs'));return;}
 app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'data',role+'-profile'));app.setAppUserModelId('pro.futuronika.kdw.'+config.id+'.'+role);
 if(role==='api'){void api({app,screen,root,config,journal}).catch(e=>{journal.fault('API_START_FAILED',{message:e.message});app.exit(1);});return;}
 if(!app.requestSingleInstanceLock()){app.quit();return;}
 void supervise({app,root,config,journal}).catch(e=>{journal.fault('SUPERVISOR_FAILED',{message:e.message,stack:e.stack});app.exit(1);});
}
async function api({app,screen,root,config,journal}){
 const peer=rpcPeer(process),runtimeFile=path.join(root,'data/runtime.json');let state=null,stamp=0,closing=false,host;
 peer.handle(async(method,value)=>{if(method==='state'){state=value;stamp=performance.now();return true;}if(method==='reset-game-for-output'&&config.id==='kdw-max-game'&&host?.resetForStartup)return host.resetForStartup();if(method==='shutdown'){setImmediate(()=>shutdown());return true;}throw Error('UNKNOWN_API_COMMAND');});
 const snapshot=()=>{if(!state||performance.now()-stamp>3500)return null;return state.output?.status==='ready'||state.output?.output?state.output.output:null;};
 const proxy={operatorStatus:()=>snapshot(),...Object.fromEntries(['setArmed','configureLidar','beginCalibration','cancelCalibration','saveCalibration','captureCalibration','setCursor','gameControl'].map(method=>[method,value=>peer.request('output',{method,value})]))};
 await app.whenReady();
 host=require(path.join(root,'launcher/portable-server.cjs')).createPortableServer({root,config,onStop:()=>void peer.request('stop').catch(()=>shutdown()),getOutput:()=>snapshot()?proxy:null,getDisplays:()=>screen.getAllDisplays().map(d=>({id:d.id,bounds:d.bounds,scaleFactor:d.scaleFactor})),runtimeControl:action=>peer.request(action),runtimeState:()=>state});
 await host.listen();journal.record('api.ready',{application:config.id,port:config.port,supervisorPid:process.ppid});atomic(runtimeFile,{...host.health,token:host.token,supervisorPid:process.ppid});process.send?.({runtimeEvent:'ready',health:host.health},()=>{});
 const heartbeat=setInterval(()=>{process.send?.({runtimeEvent:'heartbeat',memory:process.memoryUsage().rss},()=>{});if(stamp&&performance.now()-stamp>6000)void shutdown();},1000);heartbeat.unref();
 async function shutdown(){if(closing)return;closing=true;clearInterval(heartbeat);const killer=setTimeout(()=>app.exit(1),5000);killer.unref();try{await host.close();const r=JSON.parse(fs.readFileSync(runtimeFile));if(r.pid===process.pid)fs.unlinkSync(runtimeFile);}catch(e){journal.fault('API_STOP_FAILED',{message:e.message});}app.exit(0);}
 process.once('disconnect',()=>void shutdown());app.on('before-quit',e=>{if(!closing){e.preventDefault();void peer.request('stop').catch(()=>shutdown());}});
}
async function supervise({app,root,config,journal}){
 const desiredFile=path.join(root,'data/runtime-desired.json'),runtimeFile=path.join(root,'data/supervisor.json'),bootId=crypto.randomUUID();
 let desired;try{desired=JSON.parse(fs.readFileSync(desiredFile));}catch{desired={state:'stopped',outputEnabled:false};}
 const watchdog=process.argv.includes('--runtime-watchdog'),verify=process.argv.includes('--verify');
 if(watchdog&&desired.state!=='running'){app.exit(0);return;}
 let outputEnabled=watchdog?desired.outputEnabled:!process.argv.includes('--serve-only'),stopping=false,generation=0;
 atomic(desiredFile,{state:'running',outputEnabled});
 const slots={api:{status:'stopped',budget:new RecoveryBudget(),manual:new RecoveryBudget({limit:1,windowMs:60000,delays:[0]})},output:{status:'stopped',budget:new RecoveryBudget(),manual:new RecoveryBudget({limit:1,windowMs:60000,delays:[0]})}};
 function faultBundle(reason){try{const dir=path.join(root,'data/runtime-faults');fs.mkdirSync(dir,{recursive:true});const files=fs.readdirSync(dir).filter(n=>/^[0-9]+-[a-f0-9-]+\.json$/.test(n)).sort();while(files.length>=10)fs.unlinkSync(path.join(dir,files.shift()));atomic(path.join(dir,Date.now()+'-'+crypto.randomUUID()+'.json'),{reason,state:snapshot(),logs:require('./runtime-journal.cjs').runtimeLogTail(root)});}catch(e){journal.fault('FAULT_BUNDLE_WRITE_FAILED',{code:e.code});}}
 const publicSlot=s=>({pid:s.child?.pid??null,generation:s.generation??0,status:s.status,memoryBytes:s.memory??null,lastHeartbeatAgeMs:s.lastSeen?Math.round(performance.now()-s.lastSeen):null,error:s.error??null,attempts:s.budget.snapshot(),output:s.status==='ready'&&s.lastSeen&&performance.now()-s.lastSeen<3500?s.output??null:null});
 const snapshot=()=>({application:config.id,version:config.version,bootId,supervisorPid:process.pid,state:stopping?'stopped':Object.values(slots).some(s=>s.status==='degraded')?'degraded':slots.api.status==='ready'?'running':'starting',outputEnabled,api:publicSlot(slots.api),output:publicSlot(slots.output),logWriteError:journal.status().writeError});
 async function stopSlot(name){const s=slots[name];if(s.timer){clearTimeout(s.timer);s.timer=null;}const child=s.child;if(!child)return;s.expected=true;s.status='stopping';await new Promise(resolve=>{let complete=false;const done=()=>{if(complete)return;complete=true;clearTimeout(timer);resolve();};const timer=setTimeout(()=>{child.kill();},2500);child.once('exit',done);void s.peer.request('shutdown').catch(()=>{});if(child.exitCode!==null)done();});}
 async function launch(name){const s=slots[name];if(stopping||s.child||s.resetting||name==='output'&&(!outputEnabled||slots.api.status!=='ready'))return;
  if(name==='output'&&config.id==='kdw-max-game'){s.resetting=true;try{const reset=await slots.api.peer.request('reset-game-for-output');journal.record('game.startup-reset',reset);}finally{s.resetting=false;}if(stopping||s.child)return;}
  s.status='starting';s.expected=false;s.lastSeen=performance.now();s.started=s.lastSeen;s.generation=++generation;s.output=null;s.error=null;
  const env={...process.env,KDW_RUNTIME_GENERATION:String(s.generation)};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(process.execPath,[path.join(root,'launcher/desktop-main.cjs'),'--runtime-role='+name],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});s.child=child;s.peer=rpcPeer(child,{timeout:3500});
  child.stdout.on('data',()=>{});child.stderr.on('data',b=>journal.fault(name+'_STDERR',{message:b.toString().slice(0,1400)}));
  s.peer.handle(async(method,value)=>{if(s.child!==child)throw Error('STALE_WORKER');if(method==='output'){const w=slots.output;if(w.status!=='ready'||!w.child)throw Error('OUTPUT_NOT_READY');return w.peer.request('output',value);}return control(method);});
  child.on('message',m=>{if(s.child!==child||!m)return;if(m.runtimeEvent==='heartbeat'){s.lastSeen=performance.now();s.memory=m.memory;}if(m.runtimeEvent==='ready'){s.lastSeen=performance.now();s.status='ready';journal.record(name+'.ready',{generation:s.generation,workerPid:child.pid});if(name==='api'){void s.peer.request('state',snapshot()).catch(()=>{});void launch('output');}}if(m.runtimeEvent==='output'){s.lastSeen=performance.now();s.output=m.value;s.status='ready';}if(m.runtimeEvent==='fault')journal.fault(name+'.fault',{code:m.code,generation:s.generation});});
  child.once('error',e=>{journal.fault('CHILD_SPAWN_FAILED',{role:name,message:e.message});if(!child.pid&&s.child===child){s.peer.close();s.child=null;s.status='stopped';schedule(name);}});
  child.once('exit',(code,signal)=>{if(s.child!==child)return;const expected=s.expected;s.peer.close();s.child=null;s.output=null;s.status='stopped';journal.record(name+'.exit',{code,signal,expected,generation:s.generation});if(stopping||expected)return;s.error='PROCESS_EXIT_'+code;faultBundle(s.error);if(name==='api')void stopSlot('output');schedule(name);});
 }
 function schedule(name){const s=slots[name];if(stopping||s.timer)return;const delay=s.budget.take();if(delay===null){s.status='degraded';journal.fault('RECOVERY_BUDGET_EXHAUSTED',{role:name});return;}s.status='recovering';s.timer=setTimeout(()=>{s.timer=null;void(async()=>{if(name==='api')await stopSlot('output');await launch(name);})().catch(e=>journal.fault('RESTART_FAILED',{message:e.message}));},delay);}
 function restart(name){const s=slots[name];if(s.restarting)throw Error('RECOVERY_ALREADY_RUNNING');if(s.manual.take()===null)throw Error('RETRY_RATE_LIMIT_ONE_PER_MINUTE');s.restarting=true;setTimeout(()=>{void(async()=>{if(name==='api')await stopSlot('output');await stopSlot(name);await launch(name);})().catch(e=>journal.fault('MANUAL_RESTART_FAILED',{role:name,message:e.message})).finally(()=>{s.restarting=false;});},100);}
 async function shutdown(exitCode=0){if(stopping)return;stopping=true;atomic(desiredFile,{state:'stopped',outputEnabled});journal.record('stop.requested');const kill=setTimeout(()=>{for(const s of Object.values(slots))s.child?.kill();app.exit(1);},9000);kill.unref();await Promise.allSettled([stopSlot('output'),stopSlot('api')]);try{fs.unlinkSync(runtimeFile);}catch{}await new Promise(r=>server.close(r));app.exit(exitCode);}
 async function control(action){if(action==='state')return snapshot();if(action==='diagnostics')return{state:snapshot(),diagnostics:journal.status(),logs:require('./runtime-journal.cjs').runtimeLogTail(root),platform:process.platform,versions:process.versions};if(action==='stop'){setImmediate(()=>void shutdown());return{stopping:true};}if(action==='start-output'){if(slots.output.status==='degraded')throw Error('MANUAL_RETRY_REQUIRED');outputEnabled=true;atomic(desiredFile,{state:'running',outputEnabled});if(config.id==='kdw-max-game'&&slots.output.child)await restart('output');else await launch('output');return snapshot();}if(action==='restart-output'){outputEnabled=true;atomic(desiredFile,{state:'running',outputEnabled});await restart('output');return snapshot();}if(action==='restart-api'){await restart('api');return snapshot();}throw Error('UNKNOWN_RUNTIME_COMMAND');}
 const fallbackOrigin='http://127.0.0.1:'+(config.port+100),handler=require('./runtime-http.cjs').runtimeHandler({origin:fallbackOrigin,control});
 const server=http.createServer((req,res)=>{if(!handler(req,res)){res.writeHead(404);res.end();}});
 await app.whenReady();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port+100,'127.0.0.1',resolve);});
 atomic(runtimeFile,{pid:process.pid,bootId,origin:fallbackOrigin,application:config.id,startedAt:new Date().toISOString()});
 app.on('second-instance',(_e,args)=>{if(!args.includes('--serve-only')&&!args.includes('--runtime-watchdog'))void control('start-output').catch(e=>journal.fault('START_OUTPUT_FAILED',{message:e.message}));});
 app.on('before-quit',e=>{if(!stopping){e.preventDefault();void shutdown();}});
 let lastSample=0;const timer=setInterval(()=>{if(stopping)return;const state=snapshot();if(performance.now()-lastSample>15000){lastSample=performance.now();journal.record('runtime.sample',{api:state.api,output:state.output});}for(const [name,s]of Object.entries(slots)){if(!s.child)continue;if(performance.now()-s.lastSeen>5000){journal.fault('CHILD_HEARTBEAT_TIMEOUT',{role:name,generation:s.generation});s.child.kill();continue;}void s.peer.request(name==='api'?'state':'heartbeat',name==='api'?state:null).catch(()=>{});} },1000);timer.unref();
 await launch('api');
 if(verify){const deadline=performance.now()+45000,check=setInterval(()=>{const ready=slots.api.status==='ready'&&(!outputEnabled||slots.output.output?.contentReady&&slots.output.output?.backgroundReady);if(ready||performance.now()>deadline){clearInterval(check);atomic(path.join(root,'data/verification.json'),{application:config.id,ready,state:snapshot()});void shutdown(ready?0:1);}},250);}
}
module.exports={run};
