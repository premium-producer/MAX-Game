const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-posts-max-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));
app.commandLine.appendSwitch('force-device-scale-factor','1');app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let w,server;const checks=[],errors=[];
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<800;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
const available="[...document.querySelectorAll('.kdw-falling-post')].filter(n=>!n.disabled&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)";
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 server=createPortableServer({root,config:{id:'posts-queue',version:'test',port:18904,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 if(process.argv.includes('--store-only')){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=store');
  await wait("[...document.querySelectorAll('[data-product-spawn]')].some(n=>!n.disabled&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)");
  await js("[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight).click()");
  await wait("!!document.querySelector('#kdw-interactions .kdw-product-flight')");
  assert.equal(await js("document.querySelectorAll('#kdw-interactions [data-flight-phase=\"queued\"]').length"),0);
  await wait("!document.querySelector('#kdw-interactions .kdw-product-flight')");
  assert.ok(await js("document.querySelectorAll('.kdw-slot:not([data-arriving]):not([data-landing]) .kdw-product-photo').length>0"));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(report,'store-checks.json'),JSON.stringify({passed:true,bundle,errors,storeAnimationUnqueued:true},null,2));
  w.destroy();await server.close();app.exit(0);return;
 }
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=posts');
 await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
 await wait(available+".length>=5&&"+available+".some(n=>['spam','promise','unrelated'].includes(n.dataset.post))");
 await js(`window.__frames=[];window.__sampling=true;function sample(){if(!window.__sampling)return;const feed=document.querySelector('.kdw-post-feed');window.__frames.push({t:performance.now(),scroll:feed.scrollTop,rows:[...feed.querySelectorAll('[data-published]')].map(n=>({id:n.dataset.published,arriving:n.hasAttribute('data-arriving'),landing:n.hasAttribute('data-landing'),opacity:Number(getComputedStyle(n).opacity)})),flights:[...document.querySelectorAll('#kdw-posts .kdw-product-flight')].map(n=>({phase:n.dataset.flightPhase,docked:!!n.dataset.docked,parent:n.parentElement.className}))});requestAnimationFrame(sample)}sample();`);
 const ids=await js(`(()=>{const list=${available};list.sort((a,b)=>Number(['spam','promise','unrelated'].includes(b.dataset.post))-Number(['spam','promise','unrelated'].includes(a.dataset.post)));return list.slice(0,4).map(n=>n.dataset.spawn)})()`);
 const clicks=[];
 for(const id of ids){
  await wait(`!!document.querySelector('[data-spawn="${id}"]:not(:disabled)')`);
  clicks.push(await js(`(()=>{const n=document.querySelector('[data-spawn="${id}"]'),t=performance.now();n.click();return {id:${JSON.stringify(id)},t}})()`));
  await wait(`!document.querySelector('[data-spawn="${id}"]')`);
 }
 assert.ok(clicks.at(-1).t-clicks[0].t<900,'selection burst must outrun first landing');
 await delay(100);fs.writeFileSync(path.join(report,'queue.png'),(await w.webContents.capturePage()).toPNG());
 await wait("!document.querySelector('#kdw-posts .kdw-product-flight')");
 await delay(60);
 await js('window.__sampling=false');const frames=await js('window.__frames');
 const arrivals=ids.map(id=>({id,insert:frames.find(f=>f.rows.some(r=>r.id===id))?.t,land:frames.find(f=>f.rows.some(r=>r.id===id&&r.landing))?.t,settled:frames.find(f=>f.rows.some(r=>r.id===id&&!r.arriving&&!r.landing))?.t}));
 fs.writeFileSync(path.join(report,'frames.json'),JSON.stringify(frames));
 fs.writeFileSync(path.join(report,'arrival-times.json'),JSON.stringify({clicks,arrivals},null,2));
 for(let i=0;i<ids.length;i++){
  const a=arrivals[i];assert.ok(a.insert&&a.land&&a.settled,'every selection appears and settles');
  assert.ok(a.land-a.insert>=600,'scroll has time before arrival');
  if(i){assert.ok(a.insert-arrivals[i-1].settled>=90,'previous reveal completes before next scroll');assert.ok(a.land-clicks[i].t>arrivals[i-1].land-clicks[i-1].t+500,'later selection flies longer');}
 }
 assert.ok(frames.some(f=>f.flights.filter(x=>x.phase==='queued').length>=2),'queued flights visible');
 assert.ok(frames.every(f=>f.rows.filter(r=>r.arriving||r.landing).length<=1),'only one arriving feed slot');
 for(const a of arrivals){const during=frames.filter(f=>f.t>=a.land&&f.t<=a.settled);assert.ok(Math.max(...during.map(f=>f.scroll))-Math.min(...during.map(f=>f.scroll))<2,'feed still scrolling during reveal');}
 assert.ok(frames.at(-1).scroll>0,'feed actually scrolled');
 assert.deepEqual(await js("[...document.querySelectorAll('[data-published]')].map(n=>n.dataset.published)"),ids);
 checks.push({burstMs:clicks.at(-1).t-clicks[0].t,clicks,arrivals,frames:frames.length});
 fs.writeFileSync(path.join(report,'frames.json'),JSON.stringify(frames));fs.writeFileSync(path.join(report,'settled.png'),(await w.webContents.capturePage()).toPNG());
 const beforeViews=await js("[...document.querySelectorAll('[data-views]')].map(n=>n.textContent)");await delay(3000);
 const native=await js(`(()=>{const p=document.querySelector('.kdw-post-phone'),r=p.getBoundingClientRect(),actions=document.querySelector('.kdw-post-actions').getBoundingClientRect();return {audience:document.querySelector('[data-post-audience]').textContent,views:[...document.querySelectorAll('[data-views]')].map(n=>n.textContent),oldGoal:!!document.querySelector('[data-post-growth],.kdw-post-progress'),reactions:document.querySelectorAll('[data-reaction]').length,images:[...p.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),phone:{x:r.x,y:r.y,w:r.width,h:r.height},actionsBottom:actions.bottom,height:innerHeight,logicalHeight:parseFloat(document.querySelector('.route-phone').style.height)}})()`);
 assert.equal(native.oldGoal,false);assert.equal(native.images,true);assert.equal(native.reactions,ids.length*2);assert.notDeepEqual(native.views,beforeViews);assert.equal(native.logicalHeight,960);assert.ok(native.phone.y>0&&native.actionsBottom<native.height);
 await js("document.querySelector('[data-reaction=heart]').click()");assert.equal(await js("document.querySelector('[data-reaction=heart]').getAttribute('aria-pressed')"),'true');
 checks.push({native});
 fs.writeFileSync(path.join(report,'native-channel.png'),(await w.webContents.capturePage()).toPNG());
 // Reduced motion must not leave reserved invisible posts behind.
 w.webContents.debugger.attach('1.3');
 await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await w.reload();await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");await wait(available+'.length>=1');
 const reducedId=await js(`(()=>{const n=${available}[0];n.click();return n.dataset.spawn})()`);
 await wait(`!!document.querySelector('[data-published="${reducedId}"]')`);
 assert.equal(await js("document.querySelectorAll('#kdw-posts .kdw-product-flight,[data-published][data-arriving]').length"),0);checks.push({reducedMotion:true});
 // Leave while queued: teardown removes all deferred presentation work.
 await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});await w.reload();
 await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");await wait(available+'.length>=3');
 for(let i=0;i<3;i++){await js(`(${available})[0].click()`);await delay(100);}
 await wait("!!document.querySelector('#kdw-posts .kdw-product-flight[data-flight-phase=\"queued\"]')");
 await js("document.querySelector('[data-skip-task]').click()");
 await wait("document.querySelector('#kdw-posts').hidden");await delay(1600);
 assert.equal(await js("document.querySelectorAll('#kdw-posts .kdw-product-flight,#kdw-posts [data-published]').length"),0);checks.push({exitClearsQueue:true});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=posts');
 await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
 for(let i=0;i<3;i++){
  const good=available+".filter(n=>!['spam','promise','unrelated'].includes(n.dataset.post))";
  await wait(good+'.length>0');await js(`(${good})[0].click()`);await delay(250);
 }
 await wait("!!document.querySelector('[data-post-finish]:not([hidden]):not(:disabled)')");
 assert.equal(await js("document.querySelector('[data-post-audience]').textContent.replace(/\\D/g,'')"),'14988');
 for(const [width,height]of [[1366,768],[1080,1920],[1920,1080]]){
  w.setContentSize(width,height);await delay(650);await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
  const rect=await js(`(()=>{const r=document.querySelector('.kdw-post-phone').getBoundingClientRect(),b=document.querySelector('.kdw-post-actions').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:b.bottom,width:innerWidth,height:innerHeight}})()`);
  assert.ok(rect.x>=0&&rect.y>=0&&rect.right<=rect.width&&rect.bottom<=rect.height,JSON.stringify(rect));
  checks.push({viewport:rect});fs.writeFileSync(path.join(report,`goal-${width}x${height}.png`),(await w.webContents.capturePage()).toPNG());
 }
 await wait("!!document.querySelector('[data-post-finish]:not([hidden]):not(:disabled)')");
 await js("document.querySelector('[data-post-finish]').click()");await wait("document.querySelector('#kdw-posts').hidden");checks.push({completion:true});
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);});

