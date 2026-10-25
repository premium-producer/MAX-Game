const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
const report=path.resolve(__dirname,'../../../docs/verification-idle-video-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'chromium-profile'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}}),results=[];
 const js=s=>w.webContents.executeJavaScript(s);
 async function wait(s){for(let i=0;i<150;i++){if(await js(s))return;await sleep(80);}throw Error('Timeout: '+s);}
 const state=()=>js(`(()=>{const v=document.querySelector('video'),s=v?.closest('.route-phone');return {ready:document.documentElement.dataset.idleMenuReady,shell:s&&{...s.dataset},video:v&&{ready:v.readyState,time:v.currentTime,paused:v.paused},gap:window.__videoGap}})()`);
 async function click(selector){const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(60);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
 try{
  await w.loadURL('http://127.0.0.1:18752/webgl-v5/client.html?backend=local&view=game&test=memory');
  for(let i=0;i<4;i++){
   await wait("!!document.documentElement.dataset.idleMenuReady && Number(document.querySelector('video').closest('.route-phone').dataset.pathPresence)>.97");
   results.push({kind:i?'return':'cold',...await state()});
   if(i===3)break;
   await click('[data-idle-mission] .tile');await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");await sleep(400);await click('.kdw-browser-back');
  }
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Page.enable');
  await w.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`
   const native=HTMLMediaElement.prototype.load;
   HTMLMediaElement.prototype.load=function(){
    this.addEventListener('loadeddata',()=>queueMicrotask(()=>{
     if(window.__videoGap)return;window.__videoGap='waiting';const el=this;
     Object.defineProperty(el,'readyState',{configurable:true,get:()=>1});
     setTimeout(()=>{delete el.readyState;window.__videoGap='recovered';el.dispatchEvent(new Event('seeked'));},600);
    }),{once:true});return native.call(this);
   };`});
  await w.reload();
  await wait("window.__videoGap==='recovered' && !!document.documentElement.dataset.idleMenuReady && Number(document.querySelector('video').closest('.route-phone').dataset.pathPresence)>.97");
  results.push({kind:'transient-frame-unavailable',...await state()});
  fs.writeFileSync(path.join(report,'chromium.png'),(await w.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.join(report,'chromium.json'),JSON.stringify({passed:true,results},null,2));w.destroy();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'error.txt'),e.stack);fs.writeFileSync(path.join(report,'failure-state.json'),JSON.stringify(await state(),null,2));w.destroy();app.exit(1);}
});
