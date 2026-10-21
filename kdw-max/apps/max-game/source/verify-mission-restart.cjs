const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-mission-restart-20261020');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=40000){for(let i=0;i<ms/25;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
async function click(selector){await wait(`!!document.querySelector(${JSON.stringify(selector)})`);const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(25);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
setTimeout(()=>app.exit(2),180000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'posts-landing',version:'test',port:18886,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'post-landing-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('http://127.0.0.1:18886/webgl-v5/client.html?backend=local&view=game&test=memory');

 await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission="business"]');
 const ready="document.querySelector('[data-skip-task]')&&!document.querySelector('[data-skip-task]').hidden&&!document.querySelector('[data-skip-task]').disabled";
 await wait(ready);const first=await js("document.querySelector('[data-skip-task]').dataset.skipTask");
 await click('[data-skip-task]');await wait(ready+"&&document.querySelector('[data-skip-task]').dataset.skipTask!=="+JSON.stringify(first));
 await wait("document.querySelector('.journey-zone').dataset.contentPhase==='idle'&&Number(document.querySelector('.journey-zone').dataset.contentPresence)>.99");await delay(1500);await click('[data-object="open-max"] .tile');
 await wait(ready+"&&document.querySelector('[data-skip-task]').dataset.skipTask==="+JSON.stringify(first));
 checks.push('physical click on first MAX icon restarts business from first task after advancing');await shot('icon-restarted');
 for(let i=0;i<12;i++){
  await wait(ready+"||!!document.querySelector('.v5-mission-qr')");
  if(await js("!!document.querySelector('.v5-mission-qr')"))break;
  const previous=await js("document.querySelector('[data-skip-task]').dataset.skipTask");await click('[data-skip-task]');
  await wait("!!document.querySelector('.v5-mission-qr')||("+ready+"&&document.querySelector('[data-skip-task]').dataset.skipTask!=="+JSON.stringify(previous)+")");
 }
 await wait("!!document.querySelector('.v5-qr-restart')&&Number(document.querySelector('.journey-zone').dataset.finalGamePresence)<.005");await delay(700);await shot('qr-restart');
 const geometry=await js("(()=>{const b=document.querySelector('.v5-qr-restart'),q=document.querySelector('.v5-mission-qr'),r=b.getBoundingClientRect(),c=q.getBoundingClientRect();return {label:b.textContent,below:r.top>=c.bottom,inside:r.bottom<=innerHeight&&!b.closest('[inert]'),width:r.width,height:r.height};})()");
 assert.equal(geometry.label,'Запустить заново');assert.ok(geometry.below&&geometry.inside);checks.push('QR restart visible below card, inside viewport and interactive');
 await click('.v5-qr-restart');await wait(ready+"&&document.querySelector('[data-skip-task]').dataset.skipTask==="+JSON.stringify(first));
 assert.equal(await js("!!document.querySelector('.v5-mission-qr')"),false);await shot('qr-restarted');checks.push('physical QR button click clears finale and restarts same mission at first task');
 // A second run must also be restartable, without a latched transition.
 await delay(1000);await click('[data-object="open-max"]');await wait("document.querySelector('[data-skip-task]').hidden");await wait(ready);checks.push('repeat restart completes without a stuck transition');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,geometry},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,checks,errors},null,2));if(w){await shot('failure');fs.writeFileSync(path.join(report,'failure.html'),await js('document.documentElement.outerHTML'));w.destroy();}await server?.close();app.exit(1);});
