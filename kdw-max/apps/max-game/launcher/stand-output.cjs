'use strict';
const {BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {performance}=require('node:perf_hooks');

exports.startStandOutput=async function({root,host,config,log,onFatal}){
 const width=3072,height=1536,bootId=randomUUID(),data=path.join(root,'data');
 const bridge=require('./kdw_spout.node'),windows=[],pending=new Map(),frames=[0,0];
 let closed=false,armed=false,backgroundBusy=false,lastBackgroundAck=performance.now(),delta=0,epoch='',lidar,backgroundReady=false,contentReady=false;
 const statePath=path.join(data,'output-state.json'),armPath=path.join(data,'output-arm.json');
 const active=()=>!closed&&armed&&backgroundReady&&contentReady&&frames.every(n=>n>0);
 const notify=()=>{for(const w of windows)if(!w.isDestroyed())w.webContents.send('kdw:output-state',active());};
 function drain(){
  for(const token of bridge.poll()){const frame=pending.get(token);if(!frame)throw Error('Unknown GPU completion');frame.texture.release();pending.delete(token);}
  for(const frame of pending.values())if(performance.now()-frame.at>5000)throw Error('GPU completion timeout');
 }
 const fail=error=>{if(!closed){armed=false;notify();lidar?.reset();log({event:'spout-fatal',message:error.stack??String(error)});onFatal(error);}};
 function install(win,channel){
  win.setContentSize(width,height);win.webContents.setFrameRate(60);
  win.webContents.on('did-start-navigation',(_event,_url,isInPlace,isMainFrame)=>{if(isMainFrame&&!isInPlace){frames[channel]=0;if(channel)contentReady=false;else backgroundReady=false;lidar?.reset();notify();}});
  win.webContents.on('did-finish-load',notify);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==host.origin)event.preventDefault();});
  win.webContents.on('render-process-gone',(_e,details)=>fail(Error('Renderer lost: '+details.reason)));
  win.webContents.on('console-message',(event,details)=>{details=typeof event?.message==='string'?event:details;if(details.level==='error'||details.level===3)log({event:'spout-console-error',channel,message:details.message});});
  win.webContents.on('paint',event=>{
   const texture=event.texture;if(!texture){fail(Error('Shared GPU texture unavailable'));return;}
   let owned=false;
   try{
    if(closed||texture.textureInfo.widgetType!=='frame')return;
    const info=texture.textureInfo;
    if(info.codedSize.width!==width||info.codedSize.height!==height||!info.handle.ntHandle)throw Error('Unexpected shared texture dimensions/handle');
    drain();const token=bridge.send(channel,info.handle.ntHandle);
    if(token){pending.set(token,{texture,at:performance.now()});owned=true;frames[channel]++;if(frames[channel]===1)notify();}
   }catch(error){fail(error);}finally{if(!owned)texture.release();}
  });
 }
 for(let channel=0;channel<2;channel++){
  const win=new BrowserWindow({width,height,show:false,frame:false,transparent:channel===1,backgroundColor:channel===1?'#00000000':'#0D001A',enableLargerThanScreen:true,
   webPreferences:{offscreen:{useSharedTexture:true},preload:path.join(__dirname,channel?'stand-preload.cjs':'background-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,devTools:false}});
  windows.push(win);install(win,channel);
 }
 const [background,content]=windows;
 content.webContents.session.webRequest.onBeforeRequest((details,callback)=>{
  const url=new URL(details.url);callback({cancel:!(['data:','blob:'].includes(url.protocol)||url.origin===host.origin)});
 });
 const tick=(event,packet)=>{
  if(event.sender!==content.webContents||!Number.isFinite(packet?.delta)||packet.delta<0||packet.delta>1)return;
  if(contentReady!==(packet.ready===true)){contentReady=packet.ready===true;notify();}
  if(typeof packet.epoch==='string'&&packet.epoch!==epoch){epoch=packet.epoch;lidar?.reset();}
  delta=Math.min(.05,delta+packet.delta);
  if(!backgroundBusy){backgroundBusy=true;lastBackgroundAck=performance.now();background.webContents.send('kdw:background-frame',{delta,reduced:packet.reduced===true});delta=0;}
 };
 const ack=(event,packet)=>{if(event.sender===background.webContents){backgroundBusy=false;lastBackgroundAck=performance.now();if(packet?.ready==='false'){fail(Error('Background shader failed'));return;}if(backgroundReady!==(packet?.ready==='true')){backgroundReady=packet?.ready==='true';notify();}}};
 ipcMain.on('kdw:background-tick',tick);ipcMain.on('kdw:background-ack',ack);
 const timer=setInterval(()=>{
  if(closed)return;
  try{drain();if(backgroundBusy&&performance.now()-lastBackgroundAck>5000)throw Error('Background renderer stalled');}catch(error){fail(error);}
 },4);
 const monitor=setInterval(()=>{
  if(closed)return;
  try{
   let request;try{request=JSON.parse(fs.readFileSync(armPath,'utf8').replace(/^\uFEFF/,''));}catch{}
   const next=request?.bootId===bootId&&request?.armed===true;
   if(next!==armed){armed=next;lidar?.reset();notify();log({event:'spout-armed',armed,bootId});}
   const state={schemaVersion:1,bootId,pid:process.pid,armed,active:active(),backgroundReady,contentReady,width,height,fps:60,senders:['KDW_MAX_BACKGROUND','KDW_MAX_CONTENT'],frames,pending:pending.size,bridge:bridge.status(),lidar:lidar?.snapshot()??null,updatedAt:new Date().toISOString()};
   const tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,statePath);
  }catch(error){fail(error);}
 },500);
 async function close(){
  if(closed)return;closed=true;armed=false;notify();clearInterval(timer);clearInterval(monitor);
  ipcMain.removeListener('kdw:background-tick',tick);ipcMain.removeListener('kdw:background-ack',ack);
  await lidar?.close();for(const w of windows)if(!w.isDestroyed())w.webContents.stopPainting();
  const deadline=performance.now()+5000;while(pending.size&&performance.now()<deadline){drain();await new Promise(r=>setTimeout(r,2));}
  if(!pending.size)bridge.close();
  for(const w of windows)if(!w.isDestroyed())w.destroy();
  fs.writeFileSync(statePath,JSON.stringify({bootId,pid:process.pid,armed:false,active:false,stopped:true,pending:pending.size}));
 }
 try{
  await background.loadURL(host.origin+'/webgl-v5/stand-background.html');
  await content.loadURL(new URL(config.entry,host.origin).href);
  let input;try{input=JSON.parse(fs.readFileSync(path.join(data,'lidar.local.json'),'utf8').replace(/^\uFEFF/,''));}catch(e){if(e.code!=='ENOENT')throw e;}
  lidar=await require('./lidar.cjs').startLidar({config:input,contents:content.webContents,active,log,width,height});
  for(const w of windows)w.webContents.startPainting();
  log({event:'spout-started',bootId,width,height});
  return {close,content,background,active,bootId};
 }catch(error){await close();throw error;}
};
