const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-choice-20261018');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));
app.commandLine.appendSwitch('force-device-scale-factor','1');app.commandLine.appendSwitch('disable-renderer-backgrounding');app.on('window-all-closed',()=>{});
const checks=[],errors=[],missing=[];let w,server;
const delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>Promise.race([w.webContents.executeJavaScript(s),delay(5000).then(()=>{throw Error('Renderer timeout: '+s)})]);
async function wait(s,limit=45000){const until=Date.now()+limit;while(Date.now()<until){if(await js(s))return;await delay(100);}throw Error('Timeout: '+s);}
async function click(selector){const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);const p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseMove',...p});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(100);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
const screenshot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
const ready="document.querySelector('.journey-zone')?.dataset.revealPhase==='task' && Number(document.querySelector('.journey-zone').dataset.contentPresence??1)>.97 && !document.querySelector('.route-phone').inert";
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'business-choice-test',version:'R9',port:18769,entry:'/'},onMissing:url=>missing.push(url)});await server.listen();
 for(const [index,type] of ['cafe','hotel','theater'].entries()){
  w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
  w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
  fs.writeFileSync(path.join(report,'stage.txt'),'loading '+type);await Promise.race([w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game'+'&test=memory'),delay(20000).then(()=>{throw Error('Load timeout: '+type)})]);fs.writeFileSync(path.join(report,'stage.txt'),'loaded '+type);await wait("document.documentElement.dataset.gameReady==='true'");
  await click('[data-mission="business"]');
  await wait("document.documentElement.dataset.kdwScreen==='business.platform.business-type' && "+ready);await delay(800);
  assert.deepEqual(await js("Array.from(document.querySelectorAll('.route-phone [data-answer]'),b=>b.dataset.answer)"),['business.platform.choose-cafe','business.platform.choose-hotel','business.platform.choose-theater']);
  checks.push('normal business entry opens choice before login: '+type);
  if(!index)for(const [width,height] of [[1920,1080],[1280,720],[2450,1077]]){
   w.setContentSize(width,height);await delay(500);
   const r=await js("Array.from(document.querySelectorAll('.route-phone [data-answer]'),b=>b.getBoundingClientRect().toJSON())");
   for(const rect of r)assert.ok(rect.left>=0&&rect.right<=width&&rect.top>=0&&rect.bottom<=height,JSON.stringify(r));
   await screenshot('choice-'+width+'x'+height);checks.push('all three pointer targets fit '+width+'x'+height);
  }
  const before=await js("document.querySelector('#arena').style.transform");
  await js(`window.__events=[];for(const t of ['pointerdown','pointerup'])document.addEventListener(t,e=>window.__events.push({type:t,x:e.clientX,y:e.clientY,target:e.target.outerHTML.slice(0,500)}),true)`);
  for(let attempt=0;attempt<10;attempt++){await click('.route-phone [data-answer="business.platform.choose-'+type+'"]');await delay(500);if(await js("document.documentElement.dataset.kdwScreen==='business.platform.login'"))break;}
  await delay(500);fs.writeFileSync(path.join(report,'pointer-'+type+'.json'),JSON.stringify(await js(`({events:window.__events,hidden:document.hidden,buttons:Array.from(document.querySelectorAll('.route-phone [data-answer]'),b=>({rect:b.getBoundingClientRect().toJSON(),visibility:getComputedStyle(b).visibility,pointer:getComputedStyle(b).pointerEvents}))})`),null,2));
  await wait("document.documentElement.dataset.kdwScreen==='business.platform.login' && "+ready);await delay(700);
  assert.equal(await js("document.querySelector('#arena').style.transform"),before);assert.match(await js("document.querySelector('[data-mission-timer]').textContent"),/^\d+:\d{2}$/);
  checks.push('real pointer chooses '+type+'; login, timer and common scale retained');await screenshot('login-'+type);w.destroy();w=null;
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundleSha256:JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,checks,errors,missing},null,2));await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors,missing},null,2));if(w){await screenshot('failure');fs.writeFileSync(path.join(report,'failure.html'),await js('document.documentElement.outerHTML'));w.destroy();}await server?.close();app.exit(1);});
