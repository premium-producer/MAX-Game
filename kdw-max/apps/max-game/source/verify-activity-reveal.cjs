const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-activity-reveal-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>Promise.race([w.webContents.executeJavaScript(s),delay(5000).then(()=>{throw Error('Renderer timeout')})]);
async function wait(s){for(let i=0;i<450;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
const shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'activity-reveal',version:'test',port:18892,entry:'/'}});await server.listen();
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Page.enable');
 await w.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__reveal=[];function sample(){
 const p=document.querySelector('#kdw-posts:not([hidden]) .kdw-post-phone,#kdw-interactions:not([hidden]) .kdw-store-editor');
 if(p&&p.dataset.activityAligned){const a=Number(getComputedStyle(p).opacity);if(window.__reveal.length<180)window.__reveal.push({t:performance.now(),alpha:a,inert:p.inert,audience:p.querySelector('[data-post-audience]')?.textContent});}
 requestAnimationFrame(sample);
 }requestAnimationFrame(sample);`});
 for(const kind of ['posts','store']){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  await wait('window.__reveal.some(f=>f.alpha>.99)');
  const frames=await js('window.__reveal');assert.ok(frames[0].alpha<.05,'first native frame was opaque');
  assert.ok(frames.filter(f=>f.alpha>.05&&f.alpha<.95).length>=6,'no gradual entry');
  for(let i=1;i<frames.length;i++){assert.ok(frames[i].alpha+0.002>=frames[i-1].alpha);assert.ok(frames[i].alpha-frames[i-1].alpha<.22,'opacity jump');}
  assert.ok(frames.filter(f=>f.alpha<.5).every(f=>f.inert),'entry accepts input too early');
  if(kind==='posts')assert.ok(frames.every(f=>f.audience?.includes('подписчиков')),'header counter appears late');
  checks.push({kind,frames});await shot(kind+'-entered');
  if(kind==='posts'){
   assert.equal(await js("!!document.querySelector('[data-object=\"business.bot\"]')"),false);
   // Complete the activity without advancing the mission; the following icon must stay absent.
   for(let i=0;i<10;i++){
    if(await js("!document.querySelector('[data-post-finish]').hidden"))break;
    await wait("[...document.querySelectorAll('.kdw-falling-post')].some(n=>!n.disabled&&!['spam','promise','unrelated'].includes(n.dataset.post)&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)");
    await js("[...document.querySelectorAll('.kdw-falling-post')].find(n=>!n.disabled&&!['spam','promise','unrelated'].includes(n.dataset.post)&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight).click()");
    await delay(300);
   }
   await wait("!document.querySelector('[data-post-finish]').hidden");
   assert.equal(await js("!!document.querySelector('[data-object=\"business.bot\"]')"),false,'future icon before continue');
   await shot('posts-goal');checks.push({goalReachedWithoutFutureIcon:true});
   await wait("!document.querySelector('[data-post-finish]').disabled");
   await js("document.querySelector('[data-post-finish]').click()");
   await wait("document.querySelector('[data-object=\"business.bot\"]')?.dataset.nodeState==='active'&&document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");
   await shot('next-task');checks.push({nextIconAdmittedAfterContinue:true});
  }
 }
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
