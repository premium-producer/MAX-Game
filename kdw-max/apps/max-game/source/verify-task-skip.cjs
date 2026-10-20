const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-task-skip-20261020');fs.mkdirSync(report,{recursive:true});
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

 const url='http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&session=skip-test-'+Date.now();
 await w.loadURL(url);await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");
 assert.equal(await js("document.querySelector('[data-skip-task]:not([hidden])')===null"),true);
 await click('[data-idle-mission=business]');
 await wait("document.querySelector('[data-skip-task=\"business.platform\"]:not([hidden])')");
 const placement=await js("(()=>{const b=document.querySelector('[data-skip-task]'),n=document.querySelector('[data-object=\"business.platform\"]'),r=b.getBoundingClientRect(),c=n.querySelector('.object-label').getBoundingClientRect(),t=n.querySelector('.tile').getBoundingClientRect();return {below:r.top>=c.bottom,center:Math.abs(r.left+r.width/2-t.left-t.width/2),nested:!!b.closest('[data-object]')}})()");
 assert.ok(placement.below&&placement.center<2&&!placement.nested);await shot('skip-under-icon');checks.push('one separate skip button below current task caption, centered and outside icon button');
 await click('[data-skip-task]');
 await wait("document.documentElement.dataset.kdwScreen==='business.channel.create'&&document.querySelector('[data-skip-task=\"business.channel\"]:not([hidden])')");
 await shot('skipped-to-channel');checks.push('real skip pointer advances registration to channel');
 await w.loadURL(url);await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission=business]');
 await wait("document.documentElement.dataset.kdwScreen==='business.channel.create'&&document.querySelector('[data-skip-task=\"business.channel\"]:not([hidden])')");checks.push('skip survives IndexedDB reload');
 w.setContentSize(1280,720);await delay(600);await shot('resized');
 const resized=await js("(()=>{const b=document.querySelector('[data-skip-task]').getBoundingClientRect(),c=document.querySelector('[data-object=\"business.channel\"] .object-label').getBoundingClientRect();return b.top>=c.bottom&&b.bottom<innerHeight})()");assert.ok(resized);checks.push('button stays below caption after resize');
 await click('[data-object="business.platform"]');await wait("document.querySelector('[data-skip-task=\"business.platform\"]:not([hidden])')");checks.push('skipped icon remains restartable');
 await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&interaction=posts');await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");assert.equal(await js("document.querySelector('.kdw-task-skip').hidden"),true);checks.push('skip hidden with task icons during post activity');
 await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&test=memory&dev=0');await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission=business]');await wait("document.documentElement.dataset.kdwScreen==='business.platform.business-type'");await delay(2000);assert.equal(await js("document.querySelector('.kdw-task-skip').hidden"),true);checks.push('ordinary dev=0 mode has no authoring skip button');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await Promise.race([Promise.all([shot('failure'),js('document.documentElement.outerHTML').then(html=>fs.writeFileSync(path.join(report,'failure.html'),html))]),delay(3000)]);w.destroy();}if(server)await server.close();app.exit(1);});
