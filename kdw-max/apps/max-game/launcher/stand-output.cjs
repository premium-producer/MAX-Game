'use strict';
const {BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {classifyTexture,RecoveryBudget}=require('./runtime-policy.cjs');

exports.startStandOutput=async function({root,host,config,log,onFatal}){
 const width=3072,height=1536,data=path.join(root,'data');let bootId=randomUUID();
 const bridge=require('./kdw_spout.node'),windows=[],pending=new Map(),frames=[0,0];
 const born=performance.now(),lastGood=[0,0],lastTick={content:born},badFrames=[0,0],rendererBudgets=[new RecoveryBudget(),new RecoveryBudget()],reloadTimers=[],graceUntil=[born+15000,born+15000],quarantined=[];
 let faulting=false,reduced=false,backgroundLoaded=false,ui=null;
 let closed=false,backgroundBusy=false,lastBackgroundAck=performance.now(),delta=0,epoch='',lidar,backgroundReady=false,contentReady=false;
 const {read}=require('./operator-http.cjs');
 let lidarConfig=require('./lidar.cjs').automaticLidarConfig(read(path.join(data,'lidar.local.json'),null)),calibrationConfig=null,cursorVisible=read(path.join(data,'operator.local.json'),{cursorVisible:false}).cursorVisible===true,calibration=null,calibrationAt=0,lastPoint=null;
 const statePath=path.join(data,'output-state.json');
 const fresh=()=>lastGood.every(t=>t>0&&performance.now()-t<1200)&&performance.now()-lastTick.content<1500;
 const presenting=()=>!closed&&!faulting&&!calibration&&!reloadTimers[1];
 const active=()=>presenting()&&contentReady;
 const notify=()=>{for(const w of windows)if(!w.isDestroyed())w.webContents.send('kdw:output-state',{active:active(),presenting:presenting(),inputMode:'automatic'});};
 function drain(){
  for(const token of bridge.poll()){const frame=pending.get(token);if(!frame)throw Error('Unknown GPU completion');frame.texture.release();pending.delete(token);}
  for(const frame of pending.values())if(performance.now()-frame.at>5000)throw Error('GPU completion timeout');
 }
 const fail=error=>{if(!closed&&!faulting){faulting=true;notify();lidar?.reset();log({event:'spout-fatal',message:error.stack??String(error),frames:[...frames],badFrames:[...badFrames],lastGoodFrameAgeMs:lastGood.map(t=>t?Math.round(performance.now()-t):null),bridge:bridge.status()});onFatal(error);}};
 function install(win,channel){
  win.setContentSize(width,height);win.webContents.setFrameRate(60);
  win.webContents.on('did-start-navigation',(_event,_url,isInPlace,isMainFrame)=>{if(isMainFrame&&!isInPlace){frames[channel]=0;if(channel)contentReady=false;else{backgroundReady=false;backgroundLoaded=false;backgroundBusy=false;}lidar?.reset();notify();}});
  win.webContents.on('did-finish-load',()=>{if(channel===0){backgroundLoaded=true;backgroundBusy=false;lastBackgroundAck=performance.now();}notify();});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==host.origin)event.preventDefault();});
  const recover=reason=>{if(closed||faulting||reloadTimers[channel])return;bootId=randomUUID();if(channel)contentReady=false;else backgroundReady=false;notify();const delay=rendererBudgets[channel].take();log({event:'renderer-recovery',channel,reason,delay});if(delay===null){fail(Error('RENDERER_RECOVERY_EXHAUSTED'));return;}lastGood[channel]=0;graceUntil[channel]=performance.now()+delay+15000;reloadTimers[channel]=setTimeout(()=>{reloadTimers[channel]=null;if(!closed){if(channel)lastTick.content=performance.now();else{backgroundBusy=false;lastBackgroundAck=performance.now();}void win.loadURL(channel?new URL(config.entry,host.origin).href:host.origin+'/webgl-v5/stand-background.html').catch(e=>fail(e));}},delay);};
  win.webContents.on('render-process-gone',(_e,details)=>recover(details.reason));
  win.on('unresponsive',()=>recover('unresponsive'));
  win.webContents.on('console-message',(event,details)=>{details=typeof event?.message==='string'?event:details;if(details.level==='error'||details.level===3)log({event:'spout-console-error',channel,message:details.message});});
  win.webContents.on('paint',event=>{
   const texture=event.texture,invalid=classifyTexture(texture,width,height);if(invalid){badFrames[channel]++;log({event:'spout-frame-discarded',channel,...invalid});try{texture?.release();}catch(e){fail(e);}return;}
   let owned=false,submitted=false;
   try{
    if(closed||faulting||texture.textureInfo.widgetType!=='frame')return;
    const info=texture.textureInfo;
    
    drain();submitted=true;const token=bridge.send(channel,info.handle.ntHandle);
    if(token){pending.set(token,{texture,at:performance.now()});owned=true;lastGood[channel]=performance.now();frames[channel]++;if(frames[channel]===1)notify();}
   }catch(error){if(submitted&&!owned){quarantined.push(texture);owned=true;}fail(error);}finally{if(!owned)try{texture.release();}catch(error){fail(error);}}
  });
 }
 for(let channel=0;channel<2;channel++){
  const win=new BrowserWindow({width,height,show:false,frame:false,transparent:channel===1,backgroundColor:channel===1?'#00000000':'#0D001A',enableLargerThanScreen:true,
   webPreferences:{offscreen:{useSharedTexture:true},preload:path.join(__dirname,channel?'stand-preload.cjs':'background-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,devTools:false}});
  windows.push(win);install(win,channel);
 }
 const [background,content]=windows;
 const operatorStatus=()=>({bootId,armed:true,inputMode:'automatic',active:active(),presenting:presenting(),backgroundReady,contentReady,frames:[...frames],lastGoodFrameAgeMs:lastGood.map(t=>t?Math.round(performance.now()-t):null),badFrames:[...badFrames],fresh:fresh(),senders:['KDW_MAX_BACKGROUND','KDW_MAX_CONTENT'],width,height,bridge:bridge.status(),lidar:lidar?.snapshot()??null,cursorVisible,calibration:calibration?.status()??null,ui});
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
 const overlayTimer=setInterval(()=>{if(!closed&&!content.isDestroyed())content.webContents.send('kdw:operator-overlay',{calibration:calibration?.status()??null,cursor:!calibration&&cursorVisible&&active()&&lastPoint&&Date.now()-lastPoint.at<350?lastPoint:null});},33);
 content.webContents.session.webRequest.onBeforeRequest((details,callback)=>{
  const url=new URL(details.url);callback({cancel:!(['data:','blob:'].includes(url.protocol)||url.origin===host.origin)});
 });
 const tick=(event,packet)=>{
  if(event.sender!==content.webContents||!Number.isFinite(packet?.delta)||packet.delta<0||packet.delta>1)return;
  if(contentReady!==(packet.ready===true)){contentReady=packet.ready===true;notify();}
  if(typeof packet.epoch==='string'&&packet.epoch!==epoch){epoch=packet.epoch;lidar?.reset();}
  if(packet.ui&&typeof packet.ui==='object'&&JSON.stringify(packet.ui).length<4096)ui=packet.ui;
  lastTick.content=performance.now();reduced=packet.reduced===true;
 };
 const ack=(event,packet)=>{if(event.sender===background.webContents){backgroundBusy=false;lastBackgroundAck=performance.now();if(packet?.ready==='false'){fail(Error('Background shader failed'));return;}if(backgroundReady!==(packet?.ready==='true')){backgroundReady=packet?.ready==='true';notify();}}};
 ipcMain.on('kdw:background-tick',tick);ipcMain.on('kdw:background-ack',ack);
 let backgroundClock=performance.now();
 const backgroundTimer=setInterval(()=>{if(closed||faulting||!backgroundLoaded)return;const now=performance.now();delta=Math.min(.05,(now-backgroundClock)/1000);backgroundClock=now;if(!backgroundBusy){backgroundBusy=true;lastBackgroundAck=now;background.webContents.send('kdw:background-frame',{delta,reduced});}},250);
 const timer=setInterval(()=>{
  if(closed)return;
  try{drain();if(performance.now()-born>15000){for(let c=0;c<2;c++)if(performance.now()>graceUntil[c]&&!reloadTimers[c]&&(!lastGood[c]||performance.now()-lastGood[c]>2000))throw Error('SPOUT_LAYER_STALE_'+c);if(performance.now()>graceUntil[1]&&performance.now()-lastTick.content>5000)throw Error('CONTENT_RENDERER_STALLED');}if(performance.now()>graceUntil[0]&&backgroundBusy&&performance.now()-lastBackgroundAck>5000)throw Error('Background renderer stalled');}catch(error){fail(error);}
 },4);
 const monitor=setInterval(()=>{
  if(closed||faulting)return;
  try{
   notify();for(const w of windows)if(!w.isDestroyed())w.webContents.invalidate();
   const state={schemaVersion:1,bootId,pid:process.pid,armed:true,inputMode:'automatic',active:active(),presenting:presenting(),backgroundReady,contentReady,width,height,fps:60,senders:['KDW_MAX_BACKGROUND','KDW_MAX_CONTENT'],frames,pending:pending.size,bridge:bridge.status(),lidar:lidar?.snapshot()??null,ui,updatedAt:new Date().toISOString()};
   const tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,statePath);
   if(calibration&&Date.now()-calibrationAt>10*60*1000){calibrationAt=Date.now();void cancelCalibration().catch(fail);}
  }catch(error){log({event:'output-state-write-failed',code:error.code,message:error.message});}
 },500);
 async function close(){
  if(closed)return;closed=true;notify();clearInterval(timer);clearInterval(monitor);clearInterval(overlayTimer);clearInterval(backgroundTimer);for(const timer of reloadTimers)clearTimeout(timer);
  ipcMain.removeListener('kdw:background-tick',tick);ipcMain.removeListener('kdw:background-ack',ack);
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
  return {close,content,background,active,get bootId(){return bootId;},operatorStatus,setArmed,configureLidar,beginCalibration,cancelCalibration,saveCalibration,captureCalibration(){if(!calibration)throw Error('Калибровка не запущена');return calibration.capture();},setCursor(value){cursorVisible=value;}};
 }catch(error){await close();throw error;}
};
