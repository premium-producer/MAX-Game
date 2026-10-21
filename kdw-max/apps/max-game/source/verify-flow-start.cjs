const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-flow-start-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<600;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
async function capture(name){fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'flow-start',version:'test',port:18893,entry:'/'}});await server.listen();
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 w=new BrowserWindow({width:1600,height:1000,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Page.enable');
 let legacy=false;
 await w.webContents.debugger.sendCommand('Fetch.enable',{patterns:[{urlPattern:'*/webgl-v5/app.js'}]});
 w.webContents.debugger.on('message',async(_event,method,p)=>{if(method!=='Fetch.requestPaused')return;try{
  let source=fs.readFileSync(path.join(root,'www/webgl-v5/app.js'),'utf8');
  // Test-only old authoritative schedule; the installed bundle stays untouched.
  if(legacy){assert.ok(source.includes('kdwStoreActivity=6'));assert.ok(source.includes('version:11,initialAudience:14628'));source=source.replace('kdwStoreActivity=6','kdwStoreActivity=5').replace('version:11,initialAudience:14628','version:10,initialAudience:14628');}
  await w.webContents.debugger.sendCommand('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(source).toString('base64')});
 }catch(e){errors.push(e.stack);}});
 await w.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`window.__flow=[];function sample(){const e=document.querySelector('#kdw-interactions:not([hidden]) .kdw-store-editor,#kdw-posts:not([hidden]) .kdw-post-phone');if(e&&window.__flow.length<6000){const all=[...document.querySelectorAll('[data-product-spawn],[data-spawn]')];const rows=all.filter(n=>getComputedStyle(n).visibility!=='hidden').map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.productSpawn??n.dataset.spawn,y:r.top,h:r.height,disabled:n.disabled}});window.__flow.push({t:performance.now(),alpha:Number(getComputedStyle(e).opacity),inert:e.inert,phase:document.querySelector('.journey-zone')?.dataset.revealPhase,screen:document.documentElement.dataset.kdwScreen,run:document.documentElement.dataset.kdwRun,suppressed:all.filter(n=>getComputedStyle(n).visibility==='hidden').length,rows});}requestAnimationFrame(sample);}requestAnimationFrame(sample);`});
 function validate(frames,kind){
  const first=new Map();for(const f of frames)for(const row of f.rows)if(!first.has(row.id))first.set(row.id,{...row,t:f.t});
  assert.ok(first.size>=1);for(const row of first.values())assert.ok(row.y+row.h<=2,'First card already in field: '+kind+' '+JSON.stringify(row));
  const ready=frames.find(f=>f.alpha>.97&&!f.inert);assert.ok(ready);assert.ok(frames.filter(f=>f.t<ready.t).every(f=>f.rows.length===0),'Flow advanced before phone ready');
  return first.size;
 }
 for(const fixture of ['fresh','legacy'])for(const kind of ['store','posts']){
  legacy=fixture==='legacy';
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  await wait('window.__flow.some(f=>f.rows.some(r=>r.y>100))');
  if(legacy)assert.ok(await js('window.__flow.some(f=>f.suppressed>0)'),'Legacy prefill was not exercised');
  await capture(fixture+'-'+kind+'-entry');
  // Simulate a slow renderer, while the authoritative clock keeps advancing.
  await js('(()=>{const end=performance.now()+2500;while(performance.now()<end){};})()');await delay(2200);
  let frames=await js('window.__flow');checks.push({fixture,kind,stage:'entry-and-stall',admitted:validate(frames,kind),frames});
  if(fixture==='fresh'){
   const selector=kind==='store'?'[data-product-spawn]':'[data-spawn]';
   const pick=`[...document.querySelectorAll('${selector}')].find(n=>!n.disabled&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>40&&n.getBoundingClientRect().bottom<innerHeight-40)`;
   await wait(`!!(${pick})`);await js(`(${pick}).click()`);
   await wait("!!document.querySelector('.kdw-product-flight')");
   await wait("!document.querySelector('.kdw-product-flight')");
   assert.ok(await js(kind==='store'?"!!document.querySelector('.kdw-slot-content')":"!!document.querySelector('.kdw-feed-post')"));await capture(kind+'-selected');
   const task=kind==='store'?'business.store':'business.channel';
   await wait("!!document.querySelector('.kdw-task-skip:not([hidden])')");
   const run=Number(await js('document.documentElement.dataset.kdwRun'));
   await js(`document.querySelector('[data-object="${task}"]').click()`);
   await wait(`Number(document.documentElement.dataset.kdwRun)===${run+1}`);
   // The channel task contains authored screens before its falling activity.
   if(kind==='posts')for(let i=0;i<30;i++){
    await wait("!!document.querySelector('.kdw-task-skip:not([hidden])')");
    if(await js("document.documentElement.dataset.kdwScreen==='business.channel.result'"))break;
    await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled)?.click()");await delay(450);
   }
   await wait(`window.__flow.some(f=>f.run==='${run+1}'&&f.rows.some(r=>r.id.startsWith('${run+1}.')&&r.y>100))`);
   frames=await js(`window.__flow.filter(f=>f.run==='${run+1}'&&f.screen==='${kind==='store'?'business.store.start':'business.channel.result'}')`);
   // Old outgoing scene frames intentionally retain their previous flights.
   const incoming=frames.map(f=>({...f,rows:f.rows.filter(r=>r.id.startsWith((run+1)+'.'))}));checks.push({fixture,kind,stage:'replay',admitted:validate(incoming,kind),frames:incoming});await capture(kind+'-replay');
  }
 }
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await capture('failure');w.destroy();}await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),180000);
