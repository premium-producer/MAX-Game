const {app, BrowserWindow, dialog, screen} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {createPortableServer} = require('./portable-server.cjs');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
const spoutMode=config.output==='spout-dual';
if(spoutMode){app.commandLine.appendSwitch('force-color-profile','srgb');app.commandLine.appendSwitch('disable-background-timer-throttling');app.commandLine.appendSwitch('disable-features','CalculateNativeWinOcclusion');}
const pixelMap=config.production===true||process.argv.includes('--pixel-map'),pixelMapDebug=process.argv.includes('--pixel-map-debug');
if(pixelMapDebug)config.production=false;
if(pixelMap){const url=new URL(config.entry,'http://127.0.0.1');url.searchParams.set('view','pixel-map');if(pixelMapDebug)url.searchParams.set('pixel-map-debug','1');config.entry=url.pathname+url.search;app.commandLine.appendSwitch('force-device-scale-factor','1');}
const data = path.join(root,'data');fs.mkdirSync(data,{recursive:true});
const stateFile = path.join(data,'runtime.json');
const smoke = process.argv.includes('--verify');
const serveOnly = process.argv.includes('--serve-only');
app.setPath('userData',path.join(data,'profile'));
app.setAppUserModelId('pro.futuronika.kdw.'+config.id);
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
let window,host,output,closing=false,fatalExit=false;
const errors=[],missing=[];
function log(value){fs.appendFileSync(path.join(data,'desktop.log'),JSON.stringify({time:new Date().toISOString(),...value})+'\n');}
if(!app.requestSingleInstanceLock()){app.quit();}
else {
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
  app.on('window-all-closed',()=>app.quit());
  app.on('before-quit',event=>{
    if(closing)return;
    event.preventDefault();closing=true;
    void (async()=>{try{await output?.close();await host?.close();try{if(JSON.parse(fs.readFileSync(stateFile)).pid===process.pid)fs.unlinkSync(stateFile);}catch{}app.exit(fatalExit?1:0);}catch(error){log({event:'shutdown-error',message:error.message});app.exit(1);}})();
  });
  app.whenReady().then(async()=>{
    host=createPortableServer({root,config,onStop:()=>app.quit(),onMissing:url=>missing.push(url)});
    await host.listen();
    fs.writeFileSync(stateFile,JSON.stringify({...host.health,token:host.token},null,2)+'\n');
    log({event:'ready',...host.health});
    if(serveOnly)return;
    if(spoutMode){
      output=await require('./stand-output.cjs').startStandOutput({root,host,config,log,onFatal:()=>{fatalExit=true;app.quit();}});
      if(smoke){
        const deadline=Date.now()+45000;let ready=false;
        while(Date.now()<deadline&&!ready){ready=await output.content.webContents.executeJavaScript(`!!(${config.verifyExpression})`)&&await output.background.webContents.executeJavaScript("document.documentElement.dataset.backgroundReady==='true'");if(!ready)await new Promise(r=>setTimeout(r,200));}
        fs.writeFileSync(path.join(data,'verification.json'),JSON.stringify({application:config.id,ready,output:'spout-dual',armed:output.active()},null,2));fatalExit=!ready;app.quit();
      }
      return;
    }
    const targetDisplay=pixelMap?screen.getAllDisplays().find(d=>d.size.width===3072&&d.size.height===1536):null;
    window=new BrowserWindow({title:config.title,width:pixelMap?3072:config.window.width,height:pixelMap?1536:config.window.height,...(targetDisplay?{x:targetDisplay.bounds.x,y:targetDisplay.bounds.y}:{}),fullscreen:pixelMap||config.production===true,show:false,backgroundColor:'#0D001A',autoHideMenuBar:true,webPreferences:{devTools:config.production!==true,nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
    const entry=new URL(config.entry,host.origin).href;
    require('./renderer-recovery.cjs').attachRendererRecovery({window,entry,log});
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    window.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==host.origin)event.preventDefault();});
    window.webContents.on('render-process-gone',(_,details)=>log({event:'renderer-gone',details}));
    window.webContents.on('console-message',(event,details,message)=>{const row=details&&typeof details==='object'?details:typeof event?.message==='string'?event:{level:details,message};if(row.level==='error'||row.level===3){errors.push(row.message);log({event:'console-error',message:row.message});}});
    window.webContents.session.webRequest.onBeforeRequest((details,callback)=>{
      const url=new URL(details.url);
      const allow=['data:','blob:','devtools:'].includes(url.protocol)||url.origin===host.origin;
      if(!allow)log({event:'external-request-blocked',url:url.origin+url.pathname});
      callback({cancel:!allow});
    });
    if(config.production)window.setMenu(null);
    window.webContents.on('before-input-event',(event,input)=>{if(config.production){if(input.type==='keyDown'&&input.control&&input.shift&&input.key.toLowerCase()==='q'){app.quit();event.preventDefault();}if(['Escape','F11','F12'].includes(input.key))event.preventDefault();return;}if(input.type==='keyDown'&&input.key==='F11'){window.setFullScreen(!window.isFullScreen());event.preventDefault();}if(input.type==='keyDown'&&input.key==='Escape'&&window.isFullScreen())window.setFullScreen(false);});
    window.webContents.on('did-fail-load',(_,code,description)=>log({event:'load-failed',code,description}));
    let loadTimer;
    try { await Promise.race([window.loadURL(entry),new Promise((_,reject)=>{loadTimer=setTimeout(()=>reject(Error('PAGE_LOAD_TIMEOUT')),30000);})]); }
    finally { clearTimeout(loadTimer); }
    if(!smoke){window.show();window.focus();return;}
    const deadline=Date.now()+45000;let snapshot;
    do {
      snapshot=await window.webContents.executeJavaScript(`({ready:${config.verifyExpression},title:document.title,body:document.body.innerText.slice(0,900),ring:document.documentElement.dataset.stellaRingState,gameReady:document.documentElement.dataset.gameReady})`);
      if(snapshot.ready)break;
      await new Promise(resolve=>setTimeout(resolve,250));
    }while(Date.now()<deadline);
    const result={application:config.id,ready:!!snapshot.ready,snapshot,errors,missing};
    fs.writeFileSync(path.join(data,'verification.json'),JSON.stringify(result,null,2)+'\n');
    log({event:'verification',...result});
    await host.close();try{fs.unlinkSync(stateFile);}catch{}
    app.exit(result.ready&&errors.length===0&&missing.length===0?0:1);
  }).catch(async error=>{log({event:'startup-error',message:error.stack});if(!smoke&&!serveOnly)dialog.showErrorBox(config.title,error.message);await host?.close();try{if(JSON.parse(fs.readFileSync(stateFile)).pid===process.pid)fs.unlinkSync(stateFile);}catch{}app.exit(1);});
}
