const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-links-docking-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-links'));app.on('window-all-closed',()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],runs=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await sleep(50);}throw Error('Timeout '+s);}
async function click(selector){const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseMove',...p});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(70);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'entry-links',version:'test',port:18777,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'entry-links-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 for(const mode of ['preview','standby','resume']){
  await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&test=link-motion'+(mode==='preview'?'&interaction=store':''));
  await wait("document.documentElement.dataset.gameReady==='true'");
  if(mode!=='preview'){await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission="business"]');}
  await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");
  await sleep(600);
  const frames=await js("window.__kdwLinkFrames"),jumps=[];let prior=null;
  for(const f of frames){const link=f.links.find(l=>l.lane===0&&l.b===199998);if(link&&prior){const dt=(f.time-prior.time)/1000,diff=Math.abs(link.reveal-prior.link.reveal);if(link.visibility>.1&&prior.link.visibility>.1&&diff>Math.max(.10,dt*3))jumps.push({from:prior,to:{...f,links:[link]},diff});}prior=link?{time:f.time,phase:f.phase,link}:null;}
  runs.push({mode,frames,jumps});fs.writeFileSync(path.join(report,mode+'.png'),(await w.webContents.capturePage()).toPNG());
 }
 const baseline=process.env.KDW_LINK_BASELINE==='1';
 fs.writeFileSync(path.join(report,baseline?'links-before.json':'links-after.json'),JSON.stringify({runs,errors},null,2));
 if(!baseline){assert.deepEqual(errors,[]);assert.ok(runs.every(r=>r.jumps.length===0));assert.ok(runs.every(r=>r.frames.some(f=>f.links.some(l=>l.lane===0&&l.reveal>.1&&l.reveal<.9&&l.visibility>.1))));assert.ok(runs.find(r=>r.mode==='standby').frames.some(f=>f.startup==='fan'));}
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'links-failure.json'),JSON.stringify({error:e.stack,errors,runs},null,2));w?.destroy();await server?.close();app.exit(1);});
