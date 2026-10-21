const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-channel-restart-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-links'));app.on('window-all-closed',()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],runs=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await sleep(50);}throw Error('Timeout '+s);}
async function click(selector){const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseMove',...p});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(70);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'entry-links',version:'test',port:18881,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'entry-links-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});

 await w.loadURL('http://127.0.0.1:18881/webgl-v5/client.html?backend=local&view=game&test=link-motion');
 await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission="business"]');
 async function capture(label){await sleep(1500);const data=await js("({screen:document.documentElement.dataset.kdwScreen,phase:document.querySelector('.journey-zone')?.dataset.revealPhase,phone:document.querySelector('.route-phone')?.outerHTML,nodes:[...document.querySelectorAll('[data-object]')].map(e=>({id:e.dataset.object,state:e.dataset.nodeState})),host:{...document.querySelector('.journey-zone')?.dataset},frames:window.__kdwLinkFrames?.slice(-3)})");runs.push({label,data});fs.writeFileSync(path.join(report,label+'.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(report,'runs.json'),JSON.stringify({runs,errors},null,2));}
 await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");await capture('registration');
 await click('[data-skip-task]');await wait("document.documentElement.dataset.kdwScreen==='business.channel.create'");await capture('channel-first');
 await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");await click('[data-skip-task]');await wait("document.documentElement.dataset.kdwScreen.startsWith('business.bot')");await capture('bot');
 await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");await click('[data-skip-task]');await wait("document.documentElement.dataset.kdwScreen==='business.store.start'");await capture('store');
 await click('[data-object="business.channel"]');await capture('channel-restart');await sleep(5000);await capture('channel-wait');
 for(let i=0;i<4;i++){await click('[data-object="business.channel"]');await sleep(180);}
 await capture('rapid-restart');await sleep(5000);await capture('rapid-wait');
 assert.deepEqual(errors,[]);
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'links-failure.json'),JSON.stringify({error:e.stack,errors,runs},null,2));w?.destroy();await server?.close();app.exit(1);});
