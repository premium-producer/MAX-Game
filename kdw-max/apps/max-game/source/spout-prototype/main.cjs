'use strict';
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.split('=').slice(1).join('=') ?? fallback;
const width = Number(arg('width',3072)), height = Number(arg('height',1536));
const seconds = Number(arg('seconds',180));
if (![1920,3072].includes(width) || height!==width/2 || seconds<10 || seconds>14400) throw Error('Invalid probe dimensions/duration');
const output = path.resolve(arg('out',path.join(__dirname,'results')));
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(output,'electron-profile'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.commandLine.appendSwitch('force-color-profile','srgb');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-features','CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
const bridge = require('./kdw_spout.node');
const pending=new Map(), windows=[], rows=[];
const stats=[0,1].map(()=>({paint:0,sent:0,dropped:0,released:0,formats:{}}));
let started=performance.now(), stopping=false, pollTimer, monitorTimer, fatal=null;
const events=fs.createWriteStream(path.join(output,'events.jsonl'));
function event(type,detail={}) { events.write(JSON.stringify({time:new Date().toISOString(),type,...detail})+'\n'); }
function drain() {
  for(const token of bridge.poll()) {
    const frame=pending.get(token); if(!frame) throw Error(`Unknown completion ${token}`);
    frame.texture.release(); stats[frame.channel].released++; pending.delete(token);
  }
  for(const frame of pending.values()) if(performance.now()-frame.at>5000) throw Error('GPU completion timeout');
}
async function stop(error) {
  if(stopping) return; stopping=true; fatal=error?.stack ?? null;
  event('stopping',{fatal}); clearInterval(pollTimer); clearInterval(monitorTimer);
  for(const win of windows) if(!win.isDestroyed()) win.webContents.stopPainting();
  const deadline=performance.now()+5000;
  while(pending.size && performance.now()<deadline) {
    try { drain(); } catch(e) { fatal ??= e.stack; break; }
    await new Promise(resolve=>setTimeout(resolve,2));
  }
  if(!pending.size) bridge.close(); else fatal ??= 'Outstanding GPU frames on shutdown';
  fs.writeFileSync(path.join(output,'sender-summary.json'),JSON.stringify({versions:process.versions,width,height,seconds,stats,pending:pending.size,fatal},null,2));
  fs.writeFileSync(path.join(output,'sender.csv'),'elapsedMs,channel,textureTimestamp,frameCount,pending,submitMs\n'+rows.join('\n')+'\n');
  events.end(); app.exit(fatal?1:0);
}
process.on('uncaughtException',e=>stop(e)); process.on('unhandledRejection',e=>stop(e instanceof Error?e:Error(String(e))));
app.whenReady().then(async()=>{
  event('gpu',{info:await app.getGPUInfo('complete'),features:app.getGPUFeatureStatus()});
  const epoch=Date.now(); started=performance.now();
  for(let channel=0;channel<2;channel++) {
    if(stopping) return;
    const win=new BrowserWindow({width,height,show:false,frame:false,transparent:channel===1,backgroundColor:channel===1?'#00000000':'#0D001A',enableLargerThanScreen:true,
      webPreferences:{offscreen:{useSharedTexture:true},nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
    windows.push(win); win.setContentSize(width,height); win.webContents.setFrameRate(60);
    win.webContents.on('render-process-gone',(_e,detail)=>stop(Error(JSON.stringify(detail))));
    win.webContents.on('console-message',(_e,details)=>event('renderer-console',{channel,details}));
    win.webContents.on('paint',(e)=>{
      const texture=e.texture;
      if(!texture) { stop(Error('Expected shared GPU texture; bitmap fallback prohibited')); return; }
      stats[channel].paint++;
      if(stopping || texture.textureInfo.widgetType!=='frame') { texture.release(); stats[channel].released++; return; }
      const info=texture.textureInfo;
      if(stats[channel].paint===1) event('first-texture',{channel,info:{...info,handle:Object.keys(info.handle)},bounds:win.getBounds(),contentBounds:win.getContentBounds()});
      const key=`${info.pixelFormat}:${info.codedSize.width}x${info.codedSize.height}`; stats[channel].formats[key]=(stats[channel].formats[key]||0)+1;
      if(info.codedSize.width!==width || info.codedSize.height!==height || !info.handle.ntHandle) { texture.release(); stats[channel].released++; stop(Error('Unexpected OSR texture size/handle')); return; }
      let owned=false;
      try {
        drain(); const before=performance.now(); const token=bridge.send(channel,info.handle.ntHandle); const cost=performance.now()-before;
        if(token) { pending.set(token,{texture,channel,at:performance.now()}); owned=true; stats[channel].sent++; }
        else stats[channel].dropped++;
        rows.push([performance.now()-started,channel,info.timestamp,info.metadata?.frameCount??'',pending.size,cost].join(','));
      } catch(error) { stop(error); }
      finally { if(!owned) { texture.release(); stats[channel].released++; } }
    });
    await win.loadFile(path.join(__dirname,'scene.html'),{query:{layer:channel===0?'background':'content',epoch:String(epoch)}});
    win.webContents.startPainting();
  }
  pollTimer=setInterval(()=>{try {drain();} catch(e){stop(e);}},2);
  monitorTimer=setInterval(()=>event('health',{bridge:bridge.status(),stats,pending:pending.size,memory:process.memoryUsage()}),1000);
  setTimeout(()=>stop(),seconds*1000);
});
app.on('window-all-closed',()=>stop());
