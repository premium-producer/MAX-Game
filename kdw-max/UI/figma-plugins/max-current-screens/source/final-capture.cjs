// Capture the final renderer, without CSS/text/opacity substitutions.
const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const legacyLayout=process.argv.includes('--layout=device');
const dir=__dirname,plugin=path.resolve(dir,'..'),root=path.resolve(dir,'../../../..'),web=root+'/apps/max-game/www',report=root+'/docs/verification-figma-final-20261023'+(legacyLayout?'/transition-layout-v1':''),W=3072,H=1536;
const assetDir=legacyLayout?report+'/screens':plugin+'/final-assets';
fs.mkdirSync(report,{recursive:true});fs.mkdirSync(assetDir,{recursive:true});
app.setPath('userData',report+'/profile-'+process.pid+'-'+Date.now());app.commandLine.appendSwitch('force-device-scale-factor','1');app.on('window-all-closed',()=>{});
const shardArg=process.argv.find(a=>a.startsWith('--shard='))?.slice(8),shard=shardArg===undefined?null:Number(shardArg),suffix=shard===null?'':'-shard'+shard,inventory=legacyLayout?report+'/captures.json':dir+'/final-captures'+suffix+'.json';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7),probe=process.argv.includes('--probe'),resume=process.argv.includes('--resume'),data=JSON.parse(fs.readFileSync(dir+'/final-fixtures.json')),delay=ms=>new Promise(r=>setTimeout(r,ms)),results=(resume||only)&&fs.existsSync(inventory)?JSON.parse(fs.readFileSync(inventory)):[],errors=[];let win,server;
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4'};
app.whenReady().then(async()=>{try{
 server=http.createServer((q,r)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(q.url,'http://localhost').pathname)}catch{r.writeHead(400).end();return;}
  if(pathname==='/__kdw/settings'){r.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(fs.readFileSync(dir+'/final-policy.json'));return;}if(pathname==='/__kdw/link/active'){r.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"game":null}');return;}
  const filename=pathname==='/webgl-v5/app.js'?dir+'/final-capture-app.js':path.resolve(web,'.'+pathname);
  if(!filename.startsWith(path.resolve(web)+path.sep)&&filename!==dir+'/final-capture-app.js'){r.writeHead(403).end();return;}
  if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()){r.writeHead(404).end();return;}
  const size=fs.statSync(filename).size,range=q.headers.range?.match(/^bytes=(\d+)-(\d*)$/),headers={'Content-Type':mime[path.extname(filename)]??'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
  if(range){const start=Number(range[1]),end=range[2]?Math.min(size-1,Number(range[2])):size-1;if(start> end){r.writeHead(416,{'Content-Range':'bytes */'+size}).end();return;}r.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(filename,{start,end}).pipe(r);}else{r.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(filename).pipe(r);}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 win=new BrowserWindow({width:W,height:H,useContentSize:true,frame:false,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 win.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message)});
 win.webContents.on('render-process-gone',(_e,d)=>fs.writeFileSync(report+'/crash.json',JSON.stringify(d)));
 const js=s=>win.webContents.executeJavaScript(s),wait=async(s,ms=30000)=>{const start=Date.now();while(Date.now()-start<ms){if(await js(s))return;await delay(90);}throw Error('Timeout '+s+' '+JSON.stringify(await js('globalThis.__figmaCapture?.state()')));};
 await win.loadURL(`http://127.0.0.1:${server.address().port}/webgl-v5/client.html?backend=local&view=pixel-map&v=stand-production-v1${legacyLayout?'&transitionLayout=device':''}`);
 win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:false,screenWidth:W,screenHeight:H});await win.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled',{enabled:true});
 await wait('globalThis.__figmaCapture?.ready()');await wait("document.documentElement.dataset.gameReady==='true'&&[...document.querySelectorAll('[data-idle-mission]')].every(n=>Number(n.dataset.pathPresence)>.995)");await delay(1200);
 const shot=async()=>Buffer.from((await win.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:W,height:H,scale:1}})).data,'base64');
 const save=(f,bytes)=>{const image=f.id+'.png';if(bytes.readUInt32BE(16)!==W||bytes.readUInt32BE(20)!==H)throw Error('Capture size mismatch '+f.id);fs.writeFileSync(assetDir+'/'+image,bytes);const row={...f,width:W,height:H,image,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};const old=results.findIndex(r=>r.id===f.id);if(old>=0)results.splice(old,1);results.push(row);fs.writeFileSync(inventory,JSON.stringify(results,null,2));};
 if(!only&&(shard===null||shard===0)&&(!resume||!results.some(f=>f.id==='shared.standby')))save({id:'shared.standby',screenId:'shared.standby',variant:'standby',missionId:null,taskId:null,sector:null},await shot());
 let selected=only?data.fixtures.filter(f=>only.split(',').some(part=>f.id.includes(part))):data.fixtures;if(shard!==null)selected=selected.filter(f=>data.fixtures.indexOf(f)%3===shard);if(resume)selected=selected.filter(f=>!results.some(r=>r.id===f.id));if(probe)selected=selected.slice(0,3);
 for(const [index,original]of selected.entries()){
  const f=structuredClone(original),shift=Date.now()-f.snapshot.view.clock.serverTime;const rebase=o=>{for(const k of Object.keys(o)){const v=o[k];if(typeof v==='number'&&v>1e12&&v<1e13)o[k]=v+shift;else if(v&&typeof v==='object')rebase(v);}};rebase(f.snapshot);if(f.warmupSnapshot)rebase(f.warmupSnapshot);const clock=f.snapshot.view.clock.serverTime;
  if(f.variant==='activity'){f.snapshot.view.clock.serverTime=clock-4500;f.snapshot.view.clock.checkpointAt=clock-4500;}
  fs.writeFileSync(report+'/progress'+suffix+'.json',JSON.stringify({index,total:selected.length,id:f.id}));await js(`__figmaCapture.show(${JSON.stringify(f.snapshot)},${JSON.stringify(f.warmupSnapshot??null)})`);
  const terminal=['completed','incomplete'].includes(f.screenId),palm=f.variant==='palm',snack=f.screenId==='business.platform.ready';
  if(terminal)await wait("__figmaCapture.state().phase==='complete'");
  else if(palm)await wait("__figmaCapture.state().phase==='palm'&&Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.995");
  else await wait(`(()=>{const s=__figmaCapture.state(),p=document.querySelector('.route-phone');return ['task','result'].includes(s.phase)&&!s.startup&&!s.handoff&&!s.contentBusy&&s.contentPresence>.995&&${snack?'true':"s.phonePresence>.995&&p?.dataset.mediaReadyKey===p?.dataset.sceneVersion&&p?.dataset.gpuReadyKey===p?.dataset.sceneVersion"}})()`);
  // Settle the real transition; no replacement text, hidden copy or forced alpha.
  await wait('__figmaCapture.state().contentPresence>.995');await delay(f.variant==='result'?30:900);
  if(f.variant==='activity'){
   await wait(`document.querySelector(${JSON.stringify(f.taskId==='business.channel'?'#kdw-posts':'.kdw-store-editor')})&&!document.querySelector(${JSON.stringify(f.taskId==='business.channel'?'.kdw-post-phone':'.kdw-store-editor')}).inert`);
   for(let i=0;i<=60;i++){await js(`__figmaCapture.clock(${clock-4500+i*100})`);await delay(35);}
   await delay(100);const count=await js(`Array.from(document.querySelectorAll('.kdw-falling-post,.kdw-product-stream [data-kdw-product]')).filter(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).visibility!=='hidden'&&r.top<${H}&&r.bottom>0}).length`);if(!count)throw Error('No visible cards '+f.id);
  }
  if(f.variant==='success')await delay(700);
  if(f.variant==='keyboard'){await js(`document.querySelector('[data-pc-field="${f.taskId==='blogger.channel'?'name':'reply'}"]').click()`);await delay(800);}
  if(process.argv.includes('--check-reply')&&f.screenId==='blogger.comments.input'&&f.variant==='keyboard')await require('./check-single-line.cjs')(win,report);
  const media=await js(`Promise.all([...document.images].filter(e=>!e.closest('[hidden]')&&e.getBoundingClientRect().width>0).map(async e=>{try{await e.decode();return null}catch{return e.currentSrc||e.src}})).then(a=>a.filter(Boolean))`);if(media.length)throw Error('Image decode failure '+JSON.stringify(media));
  await js('document.fonts.ready');
  // A static fixture has no transport polling. Refresh its authoritative clock
  // checkpoint as a normal poll would, so completed activities are not captured
  // with controls disabled merely because resource loading exceeded the lease.
  if(f.variant==='success'){
   await js(`__figmaCapture.clock(${Date.now()})`);
   await wait(`(()=>{const b=document.querySelector(${JSON.stringify(f.taskId==='business.channel'?'[data-post-finish]':'[data-kdw-submit]')});return b&&!b.hidden&&!b.disabled&&!b.closest('[inert]')})()`);
  }
  const diagnostics=await js(`({state:__figmaCapture.state(),canvas:[...document.querySelectorAll('canvas')].filter(c=>c.width&&c.height).map(c=>({width:c.width,height:c.height})),device:(()=>{const p=document.querySelector('.route-phone');return p?{rect:p.getBoundingClientRect().toJSON(),media:p.dataset.mediaReadyKey,gpu:p.dataset.gpuReadyKey}:null})(),reference:(()=>{const e=document.querySelector('.task-dialog .instruction');return e&&!e.hidden?e.getBoundingClientRect().toJSON():null})(),pixelMap:document.documentElement.dataset.pixelMap,forbidden:[...document.querySelectorAll('.kdw-browser-back,.v5-brand,#v5-tools,.v5-qr-restart,.kdw-task-skip')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.className),timer:document.querySelector('[data-mission-timer]')?.textContent,keyboard:${f.variant==='keyboard'}?!!document.querySelector('.kdw-keyboard'):false})`);
  if(!diagnostics.state.pixelMap||!diagnostics.state.production||diagnostics.state.development||diagnostics.forbidden.length)throw Error('Not a clean production frame: '+JSON.stringify(diagnostics));
  diagnostics.typography=await require('./check-typography.cjs')(win);
  if(palm)diagnostics.palmCaption=await require('./check-palm-caption.cjs')(win);
  diagnostics.actionButtons=await require('./check-action-buttons.cjs')(win);
  diagnostics.transitionLayout=await require('./check-transition-layout.cjs')(win);
  if(legacyLayout){
   if(diagnostics.transitionLayout.length)throw Error('Legacy layout moved a transition '+f.id);
   diagnostics.legacyTransitions=await js(`(()=>{const d=document.querySelector('.route-phone').getBoundingClientRect();return [...document.querySelectorAll('.kdw-transition-button')].filter(e=>e.getBoundingClientRect().width&&!e.closest('[hidden]')).map(e=>({label:e.textContent.trim(),belowDevice:e.getBoundingClientRect().top>=d.bottom-1}));})()`);
   if(diagnostics.legacyTransitions.some(b=>!b.belowDevice))throw Error('Legacy transition no longer below device '+f.id);
  }else if(diagnostics.actionButtons.some(b=>b.transition)&&diagnostics.transitionLayout.length!==1)throw Error('Missing reference transition layout '+f.id);
  const {snapshot,warmupSnapshot,...metadata}=f;save({...metadata,diagnostics},await shot());
  if(f.variant==='activity'&&process.argv.includes('--audit-business'))await require('./check-business-stream.cjs')(win,f,clock,report);
 }
 results.sort((a,b)=>a.id==='shared.standby'?-1:b.id==='shared.standby'?1:data.fixtures.findIndex(f=>f.id===a.id)-data.fixtures.findIndex(f=>f.id===b.id));fs.writeFileSync(inventory,JSON.stringify(results,null,2));
 fs.writeFileSync(report+'/capture-checks'+suffix+'.json',JSON.stringify({passed:!errors.length,revision:data.revision,width:W,height:H,count:results.length,expected:data.fixtures.length+1,complete:results.length===data.fixtures.length+1,errors},null,2));win.destroy();server.close();app.exit(errors.length?1:0);
 }catch(e){fs.writeFileSync(report+'/failure'+suffix+'.txt',e.stack);if(win&&!win.isDestroyed()){fs.writeFileSync(report+'/failure'+suffix+'.png',(await win.webContents.capturePage()).toPNG());fs.writeFileSync(report+'/failure-state'+suffix+'.json',JSON.stringify(await win.webContents.executeJavaScript('globalThis.__figmaCapture?.state()')));win.destroy();}server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),1800000);

