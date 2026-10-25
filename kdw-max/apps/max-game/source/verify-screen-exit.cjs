const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-screen-exit-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
app.commandLine.appendSwitch('force-device-scale-factor','1');
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>Promise.race([w.webContents.executeJavaScript(s),delay(5000).then(()=>{throw Error('Renderer timeout')})]);
async function wait(s){for(let i=0;i<450;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
const shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
setTimeout(()=>app.exit(2),240000);
async function watch(){
 await js(`window.__exit=[];window.__watch=true;function sampleExit(){if(!window.__watch)return;const h=document.querySelector('.journey-zone'),p=document.querySelector('.route-phone'),n=document.querySelector('#kdw-posts:not([hidden]) .kdw-post-phone,#kdw-interactions:not([hidden]) .kdw-store-editor');window.__exit.push({t:performance.now(),phase:h?.dataset.revealPhase,content:Number(h?.dataset.contentPresence??1),cp:h?.dataset.contentPhase,path:Number(p?.dataset.pathPresence??0),key:p?.dataset.sceneVersion,native:n?Number(getComputedStyle(n).opacity):null,ghost:document.querySelectorAll('[data-activity-ghost]').length});requestAnimationFrame(sampleExit)}sampleExit();`);
}
async function verifyExit(name){
 await js('window.__watch=false');const frames=await js('window.__exit'),key=frames[0].key;
 const outgoing=frames.filter(f=>f.key===key);
 assert.ok(outgoing.some(f=>f.path<.1),'old phone never left');
 for(let i=1;i<outgoing.length;i++){
  const a=outgoing[i-1],b=outgoing[i];
  assert.ok(Math.min(b.path,b.content)<=Math.min(a.path,a.content)+.003,name+': screen reappeared');
  if(a.native!==null&&b.native!==null)assert.ok(b.native<=a.native+.003,name+': native screen reappeared');
 }
 assert.ok(outgoing.every(f=>f.cp!=='in'),name+': old content recovered during exit');
 fs.writeFileSync(path.join(report,name+'-frames.json'),JSON.stringify(frames,null,2));
 checks.push({name,frames:frames.length,monotonicExit:true});await shot(name);
}
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
 for(const kind of ['posts']){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  await wait('window.__reveal.some(f=>f.alpha>.99)');
  const frames=await js('window.__reveal');assert.ok(frames[0].alpha<.05,'first native frame was opaque');
  assert.ok(frames.filter(f=>f.alpha>.05&&f.alpha<.95).length>=3,'no gradual entry');
  for(let i=1;i<frames.length;i++)assert.ok(frames[i].alpha+0.002>=frames[i-1].alpha);
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
   await watch();await js("document.querySelector('[data-post-finish]').click()");
   await wait("document.querySelector('[data-object=\"business.bot\"]')?.dataset.nodeState==='active'&&document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");
   await verifyExit('posts-complete');checks.push({nextIconAdmittedAfterContinue:true});
  }
 }
 // Advance ordinary screenshot screens, then complete one without a second fade.
 for(let i=0;i<12;i++){
  await wait("document.querySelector('.kdw-task-skip:not([hidden])')&&[...document.querySelectorAll('.route-phone [data-answer]')].some(b=>!b.disabled)");
  const screen=await js("document.documentElement.dataset.kdwScreen");
  if(screen==='business.bot.result')break;
  await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled).click()");
  await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(screen)}`);
 }
 await wait("document.documentElement.dataset.kdwScreen==='business.bot.result'&&!!document.querySelector('.kdw-task-skip:not([hidden])')");
 await watch();await js("document.querySelector('.route-phone [data-answer]').click()");
 await wait("document.querySelector('.kdw-task-skip:not([hidden])')?.dataset.skipTask==='business.store'");
 await verifyExit('screenshot-complete');
 // Store replay: same task, new run, old native layer must fade once.
 await wait("document.querySelector('.kdw-store-editor')?.dataset.activityAligned==='true'&&getComputedStyle(document.querySelector('.kdw-store-editor')).opacity==='1'");
 const run=await js("document.documentElement.dataset.kdwRun");
 await watch();await js("document.querySelector('[data-object=\"business.store\"]').click()");
 await wait(`document.documentElement.dataset.kdwRun!==${JSON.stringify(run)}&&!!document.querySelector('.kdw-task-skip:not([hidden])')&&getComputedStyle(document.querySelector('.kdw-store-editor')).opacity==='1'`);
 await verifyExit('store-replay');
 // Final skip reaches QR without resurrecting native content.
 await watch();await js("document.querySelector('.kdw-task-skip').click()");
 await wait("!!document.querySelector('.v5-mission-qr')");
 await verifyExit('store-finale');
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
