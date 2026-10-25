const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-store-entry-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],samples=[],checks=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=45000){for(let i=0;i<ms/100;i++){if(await js(s))return;await delay(100);}throw Error('Timeout '+s);}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'store-entry',version:'test',port:18777,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'entry-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 // No focus emulation and no test=memory exemption: use the actual preview route.
 await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&interaction=store');
 await wait("document.documentElement.dataset.gameReady==='true'");
 for(let i=0;i<160;i++){
  samples.push(await js(`(()=>{const p=document.querySelector('.route-phone'),e=document.querySelector('.kdw-store-editor');return {time:performance.now(),screen:document.documentElement.dataset.kdwScreen,phone:p?.dataset.pathPresence,editor:e&&getComputedStyle(e).opacity,inert:e?.inert,copy:document.querySelector('.context-popup')&&getComputedStyle(document.querySelector('.context-popup')).opacity,cards:[...document.querySelectorAll('[data-product-spawn]')].map(n=>({id:n.dataset.productSpawn,top:n.getBoundingClientRect().top,disabled:n.disabled})),focus:document.hasFocus()}})()`));await delay(50);
 }
 await shot(process.env.KDW_ENTRY_BASELINE?'before':'entry');
 if(process.env.KDW_ENTRY_BASELINE){
  await js("dispatchEvent(new Event('blur'))");await delay(300);
  const before=await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)");await delay(700);
  checks.push({blurStops:JSON.stringify(before)===JSON.stringify(await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)"))});
 }
 if(!process.env.KDW_ENTRY_BASELINE){
  assert.ok(samples.some(s=>s.cards.some(c=>!c.disabled)));checks.push('preview starts without focus emulation or extra click');
  assert.ok(!samples.some(s=>Number(s.phone)>.5&&Number(s.editor??0)<.01));checks.push('native storefront present during device entrance');
  await js("dispatchEvent(new Event('blur'))");await delay(600);
  const a=await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)");await delay(700);
  assert.notDeepEqual(await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)"),a);checks.push('visible local preview continues after window blur');
  await wait("[...document.querySelectorAll('[data-product-spawn]')].some(n=>!n.disabled&&n.getBoundingClientRect().top>80&&n.getBoundingClientRect().bottom<900)");
  await js(`(()=>{const b=[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled&&n.getBoundingClientRect().top>80&&n.getBoundingClientRect().bottom<900);b.click()})()`);
  await wait("!!document.querySelector('.kdw-product-flight')",2000);
  await delay(220);
  assert.equal(await js("getComputedStyle(document.querySelector('.kdw-slot-content')).visibility"),'hidden');
  await shot('flight');checks.push('destination content hidden while product flies');
  await wait("!document.querySelector('.kdw-product-flight')",2000);
  assert.equal(await js("getComputedStyle(document.querySelector('.kdw-slot-content')).visibility"),'visible');await shot('landed');checks.push('destination revealed on landing');
  await js("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");await delay(400);
  const paused=await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)");await delay(600);
  assert.deepEqual(await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)"),paused);
  await js("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");await delay(600);
  assert.notDeepEqual(await js("[...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)"),paused);checks.push('visibility pause and resume preserved');
  await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game');
  await wait("document.documentElement.dataset.gameReady==='true'&&document.querySelector('[data-idle-mission]')");
  assert.equal(await js("document.querySelector('.kdw-store-editor')"),null);checks.push('ordinary game URL opens mission standby, not store preview');
  assert.deepEqual(errors,[]);
 }
 fs.writeFileSync(path.join(report,process.env.KDW_ENTRY_BASELINE?'baseline.json':'checks.json'),JSON.stringify({passed:true,checks,errors,samples},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors,samples},null,2));if(w){await shot('failure');w.destroy();}if(server)await server.close();app.exit(1);});
