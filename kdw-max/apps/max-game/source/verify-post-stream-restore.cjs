const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-post-stream-20261020');fs.mkdirSync(report,{recursive:true});
fs.mkdirSync(path.join(report,'test-runtime'),{recursive:true});
process.on('uncaughtException',e=>{fs.writeFileSync(path.join(report,'startup-error.txt'),e.stack);app.exit(1);});
app.setPath('userData',path.join(report,'test-runtime'));app.commandLine.appendSwitch('force-device-scale-factor','1');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');app.on('window-all-closed',()=>{});
let w,server;const errors=[],checks=[],delay=ms=>new Promise(r=>setTimeout(r,ms));const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
const mark=stage=>fs.writeFileSync(path.join(report,'progress.json'),JSON.stringify({stage,checks,errors}));
setTimeout(()=>{mark('watchdog');app.exit(2);},150000);
async function wait(s,ms=45000){for(let i=0;i<ms/100;i++){if(await js(s))return;await delay(100);}throw Error('Timeout: '+s);}
async function click(selector){const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(30);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
app.whenReady().then(async()=>{
 mark('ready');
 server=createPortableServer({root,config:{id:'posts-test',version:'posts-v1',port:18777,entry:'/'},onMissing:url=>errors.push(url)});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{sandbox:true,contextIsolation:true,offscreen:true,backgroundThrottling:false,partition:'posts-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled',{enabled:true});
 const allowed="b=>!b.disabled&&b.getBoundingClientRect().top>50&&b.getBoundingClientRect().bottom<1000";
 const fixture=JSON.parse(fs.readFileSync(path.resolve(root,'../../docs/verification-post-stream-20261020/test-save.json')));
 await w.loadURL('http://127.0.0.1:18777/__kdw/health');await js(`localStorage.setItem(${JSON.stringify(fixture.key)},${JSON.stringify(JSON.stringify(fixture.entries))})`);
 const durable='http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&session='+fixture.id;
 await w.loadURL(durable);await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission=business]');
 await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'&&document.querySelectorAll('[data-published]').length===1");
 assert.equal(await js("document.documentElement.dataset.sessionStorage"),'indexeddb');
 assert.equal(await js("document.querySelector('[data-post-audience]').textContent.match(/[0-9]/g).join('')"),String(fixture.expected.audience));
 await wait(`[...document.querySelectorAll('[data-spawn]')].some(${allowed})`);const durableId=await js(`[...document.querySelectorAll('[data-spawn]')].find(${allowed}).dataset.spawn`);await click(`[data-spawn="${durableId}"]`);await wait("document.querySelectorAll('[data-published]').length===2");const audienceSaved=await js("document.querySelector('[data-post-audience]').textContent");
 await w.loadURL(durable);await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission=business]');await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'&&document.querySelectorAll('[data-published]').length===2");assert.equal(await js("document.querySelector('[data-post-audience]').textContent"),audienceSaved);await shot('restored');checks.push('normal standby route restores accepted history through IndexedDB; real selection survives reload without duplicate audience');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'restore-checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'restore-checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await Promise.race([Promise.all([shot('failure'),js('document.documentElement.outerHTML').then(html=>fs.writeFileSync(path.join(report,'failure.html'),html))]),delay(3000)]);w.destroy();}if(server)await server.close();app.exit(1);});
