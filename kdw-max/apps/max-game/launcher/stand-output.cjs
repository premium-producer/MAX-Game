'use strict';
const {BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {classifyTexture,RecoveryBudget}=require('./runtime-policy.cjs');

exports.startStandOutput=async function({root,host,config,log,onFatal}){
 const width=3072,height=1536,data=path.join(root,'data');let bootId=randomUUID();
 const diagnostics=require('./runtime-performance.cjs').createPerformanceRecorder({root});
 const paintAt=[null,null];let monitorAt=performance.now(),ipcAt=null;
 const bridge=require('./kdw_spout.node'),windows=[],pending=new Map(),frames=[0,0];
 const born=performance.now(),lastGood=[0,0],lastTick={content:born},badFrames=[0,0],rendererBudgets=[new RecoveryBudget(),new RecoveryBudget()],reloadTimers=[],graceUntil=[born+15000,born+15000],quarantined=[];
 let faulting=false,reduced=false,backgroundLoaded=false,ui=null;
 const recovery=[null,null],recoverLayer=[],reloadGenerations=[0,0];
 let closed=false,backgroundBusy=false,lastBackgroundAck=performance.now(),delta=0,epoch='',lidar,backgroundReady=false,contentReady=false;
 const {read}=require('./operator-http.cjs');
 let lidarConfig=require('./lidar.cjs').automaticLidarConfig(read(path.join(data,'lidar.local.json'),null)),calibrationConfig=null,cursorVisible=read(path.join(data,'operator.local.json'),{cursorVisible:false}).cursorVisible===true,calibration=null,calibrationAt=0,lastPoint=null;
 let contactSettings={contactDiameterPx:72,keyboardContactDiameterPx:72,contactEdgeGrowthPercent:0,...read(path.join(data,'operator.local.json'),{})};
 const statePath=path.join(data,'output-state.json');
 const fresh=()=>lastGood.every(t=>t>0&&performance.now()-t<1200)&&performance.now()-lastTick.content<1500;
 const presenting=()=>!closed&&!faulting&&!calibration&&!reloadTimers[1]&&!recovery[1];
 const active=()=>presenting()&&contentReady;
 const notify=()=>{for(const w of windows)if(!w.isDestroyed())w.webContents.send('kdw:output-state',{active:active(),presenting:presenting(),inputMode:'automatic'});};
 function drain(){
  for(const token of bridge.poll()){const frame=pending.get(token);if(!frame)throw Error('Unknown GPU completion');diagnostics.observe('gpuCompletion'+frame.channel,performance.now()-frame.at);frame.texture.release();pending.delete(token);}
  for(const frame of pending.values())if(performance.now()-frame.at>5000)throw Error('GPU completion timeout');
 }
 const fail=error=>{if(!closed&&!faulting){faulting=true;notify();lidar?.reset();log({event:'spout-fatal',stage:'output-process-restart',pending:pending.size,quarantined:quarantined.length,recovery:recovery.map(r=>r?{stage:r.stage,ageMs:Math.round(performance.now()-r.since)}:null),message:error.stack??String(error),frames:[...frames],badFrames:[...badFrames],lastGoodFrameAgeMs:lastGood.map(t=>t?Math.round(performance.now()-t):null),bridge:bridge.status()});onFatal(error);}};
 function install(win,channel){
  win.setContentSize(width,height);win.webContents.setFrameRate(60);
  win.webContents.on('did-start-navigation',(_event,_url,isInPlace,isMainFrame)=>{if(isMainFrame&&!isInPlace){frames[channel]=0;if(channel)contentReady=false;else{backgroundReady=false;backgroundLoaded=false;backgroundBusy=false;}lidar?.reset();notify();}});
  win.webContents.on('did-finish-load',()=>{if(channel===0){backgroundLoaded=true;backgroundBusy=false;lastBackgroundAck=performance.now();}notify();});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==host.origin)event.preventDefault();});
  const recover=reason=>{
   if(closed||faulting||reloadTimers[channel])return;
   const now=performance.now();
   recovery[channel]??={since:now,stage:'reload',rearmed:false,goodSince:null};
   recovery[channel].stage='reload';recovery[channel].goodSince=null;
   bootId=randomUUID();if(channel)contentReady=false;else backgroundReady=false;
   const delay=rendererBudgets[channel].take();
   log({event:'renderer-recovery',channel,reason,delay,attempts:rendererBudgets[channel].snapshot(),preserveSession:true});
   notify();
   if(delay===null){fail(Error('RENDERER_RECOVERY_EXHAUSTED_'+channel));return;}
   // Keep the bridge and its owned lastGood texture alive throughout reload.
   // Borrowed Electron textures remain in pending until GPU completion.
   lastGood[channel]=0;graceUntil[channel]=now+delay+15000;
   reloadTimers[channel]=setTimeout(()=>{
    reloadTimers[channel]=null;if(closed||faulting)return;
    if(channel)lastTick.content=performance.now();else{backgroundBusy=false;lastBackgroundAck=performance.now();}
    const generation=++reloadGenerations[channel];
    void win.loadURL(channel?new URL(config.entry,host.origin).href:host.origin+'/webgl-v5/stand-background.html').catch(e=>{
     if(closed||faulting||generation!==reloadGenerations[channel])return;
     log({event:'renderer-reload-failed',channel,message:e.message});graceUntil[channel]=performance.now();
    });
   },delay);
  };
  recoverLayer[channel]=recover;
  win.webContents.on('render-process-gone',(_e,details)=>recover(details.reason));
  win.on('unresponsive',()=>recover('unresponsive'));
  win.webContents.on('console-message',(event,details)=>{details=typeof event?.message==='string'?event:details;if(details.level==='error'||details.level===3)log({event:'spout-console-error',channel,message:details.message});});
  win.webContents.on('paint',event=>{
   const texture=event.texture,invalid=classifyTexture(texture,width,height);if(invalid){badFrames[channel]++;log({event:'spout-frame-discarded',channel,...invalid});try{texture?.release();}catch(e){fail(e);}return;}
   let owned=false,submitted=false;
   try{
    if(closed||faulting||texture.textureInfo.widgetType!=='frame')return;
    const paintNow=performance.now();if(paintAt[channel]!==null)diagnostics.observe('paint'+channel,paintNow-paintAt[channel]);paintAt[channel]=paintNow;
    const info=texture.textureInfo;
    
    drain();submitted=true;const token=bridge.send(channel,info.handle.ntHandle);
    if(token){pending.set(token,{texture,channel,at:performance.now()});owned=true;lastGood[channel]=performance.now();frames[channel]++;if(frames[channel]===1)notify();}
   }catch(error){if(submitted&&!owned){quarantined.push(texture);owned=true;}fail(error);}finally{if(!owned)try{texture.release();}catch(error){fail(error);}}
  });
 }
 for(let channel=0;channel<2;channel++){
  const win=new BrowserWindow({width,height,show:false,frame:false,transparent:channel===1,backgroundColor:channel===1?'#00000000':'#0D001A',enableLargerThanScreen:true,
   webPreferences:{offscreen:{useSharedTexture:true},preload:path.join(__dirname,channel?'stand-preload.cjs':'background-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,devTools:false}});
  windows.push(win);install(win,channel);
 }
 const [background,content]=windows;
 const operatorPending=new Map();
 const operatorReply=(event,packet)=>{if(event.sender!==content.webContents||typeof packet?.id!=='string')return;const pending=operatorPending.get(packet.id);if(!pending)return;operatorPending.delete(packet.id);clearTimeout(pending.timer);packet.error?pending.reject(Error(packet.error)):pending.resolve(packet.value);};
 ipcMain.on('kdw:game-control-result',operatorReply);
 function gameControl(input){if(!contentReady||closed||calibration||recovery[1])throw Error('OPERATOR_NOT_READY');if(!['next','back'].includes(input?.action)||typeof input.token!=='string'||input.token.length>512)throw Error('INVALID_OPERATOR_ACTION');if(operatorPending.size)throw Error('OPERATOR_BUSY');return new Promise((resolve,reject)=>{const id=randomUUID(),timer=setTimeout(()=>{operatorPending.delete(id);reject(Error('OPERATOR_TIMEOUT'));},2500);operatorPending.set(id,{resolve,reject,timer});log({event:'operator-game-control',action:input.action,id});content.webContents.send('kdw:game-control',{id,input});});}

 const operatorStatus=()=>({bootId,armed:true,inputMode:'automatic',active:active(),presenting:presenting(),backgroundReady,contentReady,frames:[...frames],lastGoodFrameAgeMs:lastGood.map(t=>t?Math.round(performance.now()-t):null),badFrames:[...badFrames],fresh:fresh(),recovery:recoverySnapshot(),senders:['KDW_MAX_BACKGROUND','KDW_MAX_CONTENT'],width,height,bridge:bridge.status(),lidar:lidar?.snapshot()??null,cursorVisible,calibration:calibration?.status()??null,ui});
 // Compatibility for older operator panels/installers: ARM is no longer a latch.
 function setArmed(value){log({event:'legacy-arm-ignored',requested:value,inputMode:'automatic'});notify();}
 const onPoint=event=>{if(calibration)calibration.point(event);lastPoint=event.mapped?.inside&&['down','move'].includes(event.phase)?{x:event.mapped.x,y:event.mapped.y,at:Date.now()}:null;};
 async function configureLidar(value,calibrating=false){if(lidar?.reconfigure?.(value,calibrating)){if(!calibrating)lidarConfig=value;lastPoint=null;return;}const previous=lidarConfig;await lidar?.close();lidar=null;lastPoint=null;const start=(config,raw=false)=>require('./lidar.cjs').startLidar({config,contents:content.webContents,active,log,width,height,calibrating:raw,onPoint});try{lidar=await start(value,calibrating);if(!calibrating)lidarConfig=value;}catch(error){try{lidar=await start(previous);}catch(rollback){log({event:'lidar-rollback-failed',message:rollback.message});}throw error;}}
 async function beginCalibration(value){
  if(calibration)throw Error('Калибровка уже запущена');
  lidar?.reset();calibrationConfig=value.config??value;
  try{
   let previousMapping=null;try{if(calibrationConfig.rawPoints&&calibrationConfig.targetPoints)previousMapping=require('./lidar.cjs').solveCalibration(calibrationConfig.rawPoints,calibrationConfig.targetPoints,[width,height]);}catch(error){log({event:'calibration-previous-map-unavailable',message:error.message});}
   calibration=require('./operator-calibration.cjs').createCalibration(require('./lidar.cjs').solveCalibration,Date.now,{targets:value.targets,autoCapture:value.autoCapture===true,previousMapping});calibrationAt=Date.now();
   await configureLidar(calibrationConfig,true);
  }catch(error){calibration=null;await configureLidar(lidarConfig);notify();throw error;}
  notify();
 }
 async function cancelCalibration(){if(!calibration)return;log({event:'lidar-calibration-cancel'});calibration=null;await configureLidar(lidarConfig);notify();}
 async function saveCalibration(){if(!calibration)throw Error('Калибровка не запущена');const value={...calibrationConfig,...calibration.result(),enabled:true};require('./lidar.cjs').validateLidarConfig(value);await configureLidar(value);calibration=null;log({event:'lidar-calibration-saved'});notify();return value;}
 let lastOverlay='';
 const overlayTimer=setInterval(()=>{
  if(closed||content.isDestroyed())return;
  const value={contactEdgeGrowthPercent:contactSettings.contactEdgeGrowthPercent,contactDiameterPx:contactSettings.contactDiameterPx,keyboardContactDiameterPx:contactSettings.keyboardContactDiameterPx,calibration:calibration?.status()??null,cursor:!calibration&&cursorVisible&&active()&&lastPoint&&Date.now()-lastPoint.at<350?{x:lastPoint.x,y:lastPoint.y}:null};
  const signature=JSON.stringify(value);
  if(signature===lastOverlay)return;
  lastOverlay=signature;content.webContents.send('kdw:operator-overlay',value);
 },33);
 content.webContents.on('did-finish-load',()=>{lastOverlay='';});
 content.webContents.session.webRequest.onBeforeRequest((details,callback)=>{
  const url=new URL(details.url);callback({cancel:!(['data:','blob:'].includes(url.protocol)||url.origin===host.origin)});
 });
 const tick=(event,packet)=>{
  if(event.sender!==content.webContents||!Number.isFinite(packet?.delta)||packet.delta<0||packet.delta>1)return;
  if(contentReady!==(packet.ready===true)){contentReady=packet.ready===true;notify();}
  if(typeof packet.epoch==='string'&&packet.epoch!==epoch){epoch=packet.epoch;lidar?.reset();}
  if(packet.ui&&typeof packet.ui==='object'&&JSON.stringify(packet.ui).length<8192)ui=packet.ui;
  const ipcNow=performance.now();if(ipcAt!==null)diagnostics.observe('contentIpc',ipcNow-ipcAt);ipcAt=ipcNow;
  lastTick.content=ipcNow;reduced=packet.reduced===true;
 };
 const ack=(event,packet)=>{if(event.sender===background.webContents){backgroundBusy=false;lastBackgroundAck=performance.now();if(packet?.ready==='false'){recoverLayer[0]('background-shader-failed');return;}if(backgroundReady!==(packet?.ready==='true')){backgroundReady=packet?.ready==='true';notify();}}};
 ipcMain.on('kdw:background-tick',tick);ipcMain.on('kdw:background-ack',ack);
 let backgroundClock=performance.now();
 const backgroundTimer=setInterval(()=>{if(closed||faulting||!backgroundLoaded)return;const now=performance.now();delta=Math.min(.05,(now-backgroundClock)/1000);backgroundClock=now;if(!backgroundBusy){backgroundBusy=true;lastBackgroundAck=now;background.webContents.send('kdw:background-frame',{delta,reduced});}},250);
 const recoverySnapshot=()=>recovery.map((r,channel)=>r?{channel,stage:r.stage,ageMs:Math.round(performance.now()-r.since),attempts:rendererBudgets[channel].snapshot()}:null);
 function maintainLayers(now){
  for(let channel=0;channel<2;channel++){
   const signalAge=channel?now-lastTick.content:backgroundBusy?now-lastBackgroundAck:0;
   const frameAge=lastGood[channel]?now-lastGood[channel]:now-born;
   let r=recovery[channel];
   // Require a short run of fresh frames AND a live renderer before resuming.
   // One late frame cannot clear a stalled IPC or reset the retry budget.
   if(r&&!reloadTimers[channel]&&lastGood[channel]&&frameAge<500&&signalAge<1500){
    r.goodSince??=now;
    if(now-r.goodSince>=500){
     log({event:'spout-recovered',channel,stage:r.stage,durationMs:Math.round(now-r.since),frames:[...frames],bridge:bridge.status(),preserveSession:true});
     recovery[channel]=null;notify();
    }
    continue;
   }
   if(r)r.goodSince=null;
   if(reloadTimers[channel]||now<graceUntil[channel])continue;
   if(frameAge<2000&&signalAge<5000&&!r)continue;
   if(!r){
    r=recovery[channel]={since:now,stage:'hold',rearmed:false,goodSince:null};
    log({event:'spout-recovery-start',channel,frameAgeMs:frameAge,signalAgeMs:signalAge,pending:pending.size,bridge:bridge.status(),ui,preserveSession:true});
    // Pause gameplay against a frozen content image, keeping the OSC socket open.
    if(channel)lidar?.reset();notify();
   }
   if(r.stage==='reload'){recoverLayer[channel]('reload-no-fresh-frames');continue;}
   if(!r.rearmed&&![...pending.values()].some(f=>f.channel===channel)){
    r.rearmed=true;r.stage='repaint';
    windows[channel].webContents.stopPainting();windows[channel].webContents.startPainting();windows[channel].webContents.invalidate();
    log({event:'spout-recovery-repaint',channel,pending:pending.size});
   }
   // Give compositor recovery four seconds before touching the renderer page.
   if(now-r.since>=4000)recoverLayer[channel](signalAge>=5000?'renderer-heartbeat-stalled':'shared-texture-stalled');
  }
 }
 const timer=setInterval(()=>{
  if(closed||faulting)return;
  // GPU fences have strict ownership guarantees; a hung fence/device loss is
  // unsafe to recycle in process. Only those faults escalate immediately.
  try{drain();}catch(error){fail(error);}
 },4);
 const diagnosticState=()=>({bootId,epoch,active:active(),contentReady,calibrating:!!calibration,ui,frames:[...frames],frameAge:lastGood.map(t=>t?performance.now()-t:null),pending:pending.size,recovery:recoverySnapshot(),bridge:bridge.status(),input:lidar?.snapshot()??null});
 const monitor=setInterval(()=>{
  if(closed||faulting)return;
  try{
   const monitorNow=performance.now();diagnostics.observe('monitorLag',Math.max(0,monitorNow-monitorAt-500));monitorAt=monitorNow;
   try{maintainLayers(monitorNow);}catch(error){fail(error);return;}
   if(faulting)return;diagnostics.sample(diagnosticState());
   notify();for(const [channel,w]of windows.entries())if(!w.isDestroyed()&&(!lastGood[channel]||monitorNow-lastGood[channel]>=500))w.webContents.invalidate();
   const state={schemaVersion:1,bootId,pid:process.pid,armed:true,inputMode:'automatic',active:active(),presenting:presenting(),backgroundReady,contentReady,width,height,fps:60,senders:['KDW_MAX_BACKGROUND','KDW_MAX_CONTENT'],frames,pending:pending.size,recovery:recoverySnapshot(),bridge:bridge.status(),lidar:lidar?.snapshot()??null,ui,updatedAt:new Date().toISOString()};
   const writeAt=performance.now(),tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,statePath);diagnostics.observe('stateWrite',performance.now()-writeAt);
   if(calibration&&Date.now()-calibrationAt>10*60*1000){calibrationAt=Date.now();void cancelCalibration().catch(fail);}
  }catch(error){log({event:'output-state-write-failed',code:error.code,message:error.message});}
 },500);
 async function close(){
  ipcMain.removeListener('kdw:game-control-result',operatorReply);for(const request of operatorPending.values()){clearTimeout(request.timer);request.reject(Error('OUTPUT_CLOSED'));}operatorPending.clear();
  if(closed)return;closed=true;notify();clearInterval(timer);clearInterval(monitor);clearInterval(overlayTimer);clearInterval(backgroundTimer);for(const timer of reloadTimers)clearTimeout(timer);
  ipcMain.removeListener('kdw:background-tick',tick);ipcMain.removeListener('kdw:background-ack',ack);
  await diagnostics.close(diagnosticState());
  await lidar?.close();for(const w of windows)if(!w.isDestroyed())w.webContents.stopPainting();
  const deadline=performance.now()+5000;while(pending.size&&performance.now()<deadline){drain();await new Promise(r=>setTimeout(r,2));}
  if(!pending.size&&!quarantined.length)bridge.close();
  for(const w of windows)if(!w.isDestroyed())w.destroy();
  fs.writeFileSync(statePath,JSON.stringify({bootId,pid:process.pid,armed:false,active:false,stopped:true,pending:pending.size}));
 }
 try{
  await background.loadURL(host.origin+'/webgl-v5/stand-background.html');
  await content.loadURL(new URL(config.entry,host.origin).href);
  await configureLidar(lidarConfig);
  for(const w of windows)w.webContents.startPainting();
  log({event:'spout-started',bootId,width,height});
  return {close,content,background,active,gameControl,get bootId(){return bootId;},operatorStatus,setArmed,configureLidar,beginCalibration,cancelCalibration,saveCalibration,captureCalibration(){if(!calibration)throw Error('Калибровка не запущена');return calibration.capture();},setPresentation(value){cursorVisible=value.cursorVisible;contactSettings={...contactSettings,...value};},setCursor(value){cursorVisible=value;}};
 }catch(error){await close();throw error;}
};
