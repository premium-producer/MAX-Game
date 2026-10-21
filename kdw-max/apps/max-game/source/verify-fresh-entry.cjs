const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
const report=path.resolve(__dirname,'../../../docs/verification-fresh-entry-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'profile'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}});
 const js=s=>w.webContents.executeJavaScript(s),checks=[];
 async function wait(s){for(let i=0;i<250;i++){if(await js(s))return;await sleep(80);}throw Error('Timeout: '+s);}
 async function click(selector,hold=80){
  const p=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
  w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(hold);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
 }
 try{
  await w.loadURL('http://127.0.0.1:18752/webgl-v5/client.html?backend=local&view=game&test=memory');
  await wait("document.querySelectorAll('[data-idle-mission]').length===4 && !document.querySelector('[data-idle-mission]').inert");
  const ids=await js("Array.from(document.querySelectorAll('[data-idle-mission]'),e=>e.dataset.idleMission)");
  for(const id of [...ids,ids[0]]){
   await wait("!!document.querySelector('[data-idle-mission]') && !document.querySelector('[data-idle-mission]').inert");
   await click(`[data-idle-mission="${id}"] .tile`);
   await wait("document.documentElement.dataset.kdwScreen==='scan' && !!document.querySelector('[data-palm]') && Number(document.querySelector('[data-palm]').dataset.pathPresence)>.97");
   await sleep(1200);
   if(await js("document.documentElement.dataset.kdwScreen")!=='scan')throw Error('Automatic admission: '+id);
   fs.writeFileSync(path.join(report,`${id}-palm.png`),(await w.webContents.capturePage()).toPNG());
   await click('[data-palm] .tile',950);
   await wait("document.documentElement.dataset.kdwScreen!=='scan' && !document.querySelector('[data-palm]') && !!document.querySelector('.route-phone')");
   checks.push({missionId:id,firstScreen:await js('document.documentElement.dataset.kdwScreen'),run:await js('document.documentElement.dataset.kdwRun'),palmWaitsForInput:true});
   await sleep(900);await click('.kdw-browser-back');
  }
  fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks},null,2));w.destroy();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'error.txt'),e.stack);fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();app.exit(1);}
});
