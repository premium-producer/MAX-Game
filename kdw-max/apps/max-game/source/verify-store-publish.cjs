const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-store-publish-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s,ms=40000){for(let i=0;i<ms/40;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
const shot=async n=>fs.writeFileSync(path.join(report,n+'.png'),(await w.webContents.capturePage()).toPNG());
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'store-publish',version:'test',port:18894,entry:'/'}});await server.listen();
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=store');
 await wait("document.querySelector('.kdw-store-editor')&&!document.querySelector('.kdw-store-editor').inert");
 await js(`window.__storeEditor=document.querySelector('.kdw-store-editor');window.__phone=document.querySelector('.route-phone');window.__frames=[];window.__sampling=true;function sample(){if(!window.__sampling)return;const editor=document.querySelector('.kdw-store-editor'),field=document.querySelector('.kdw-product-stream'),copy=document.querySelector('.context-popup');window.__frames.push({t:performance.now(),screen:document.documentElement.dataset.kdwScreen,phase:document.querySelector('.journey-zone')?.dataset.revealPhase,sameEditor:editor===window.__storeEditor,samePhone:document.querySelector('.route-phone')===window.__phone,alpha:editor?Number(getComputedStyle(editor).opacity):0,fieldAlpha:field?Number(getComputedStyle(field).opacity):0,cards:field?.querySelectorAll('[data-product-spawn]').length??0,copyAlpha:copy?Number(getComputedStyle(copy).opacity):0,playing:document.documentElement.dataset.kdwStorePlaying,button:editor?.querySelector('[data-kdw-submit]').textContent});requestAnimationFrame(sample);}requestAnimationFrame(sample);`);
 const pick=`[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled&&!['engine-oil','drill'].includes(n.dataset.kdwProduct)&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>40&&n.getBoundingClientRect().bottom<innerHeight-40)`;
 for(let i=0;i<12;i++){
  if(await js("document.documentElement.dataset.kdwStorePlaying==='false'"))break;
  await wait(`!!(${pick})`);await js(`(${pick}).click()`);
  await wait("!!document.querySelector('.kdw-product-flight')");await wait("!document.querySelector('.kdw-product-flight')");
 }
 await wait("document.documentElement.dataset.kdwStorePlaying==='false'&&!document.querySelector('[data-kdw-submit]').disabled");
 await wait("Number(getComputedStyle(document.querySelector('.context-popup')).opacity)>.95&&Number(getComputedStyle(document.querySelector('.kdw-product-stream')).opacity)<.01");
 assert.equal(await js("document.querySelector('[data-kdw-submit]').textContent"),'Опубликовать витрину');
 assert.equal(await js('document.documentElement.dataset.kdwScreen'),'business.store.start');
 assert.equal(await js("document.querySelector('.kdw-product-stream').inert"),true);
 await shot('ready-to-publish');await delay(1200);
 const helpRect=await js("(()=>{const r=document.querySelector('.context-popup .instruction').getBoundingClientRect();return {x:Math.ceil(r.x),y:Math.ceil(r.y),width:Math.floor(r.width),height:Math.floor(r.height)}})()");
 const help=await w.webContents.capturePage(helpRect),pixels=help.toBitmap();let bright=0;
 for(let i=0;i<pixels.length;i+=4)if(pixels[i]>175&&pixels[i+1]>175&&pixels[i+2]>175)bright++;
 fs.writeFileSync(path.join(report,'help.png'),help.toPNG());assert.ok(bright>150,'Help DOM is visible but GPU text is absent');
 checks.push({helpPixels:bright});
 const readyFrames=await js('window.__frames');
 assert.ok(readyFrames.every(f=>f.sameEditor&&f.samePhone&&f.alpha>.97),'Goal re-created or faded the phone');
 assert.ok(readyFrames.some(f=>f.playing==='false'&&f.fieldAlpha>.02&&f.fieldAlpha<.98&&f.cards>0),'Cards did not fade');
 assert.ok(readyFrames.every(f=>f.screen==='business.store.start'),'Navigated before publish');
 checks.push({oneContinuousScreen:true,helpReturned:true,fieldFaded:true,goalWaitsForPublish:true});
 await js("document.querySelector('[data-kdw-submit]').click();document.querySelector('[data-kdw-submit]').click()");
 await wait("!!document.querySelector('.v5-mission-qr')");await delay(600);await shot('qr');
 const frames=await js('(window.__sampling=false,window.__frames)');
 assert.ok(!frames.some(f=>['business.store.publish','business.store.result'].includes(f.screen)),'Duplicate storefront screen');
 const exit=frames.filter(f=>f.phase==='phone-exit'&&f.sameEditor);for(let i=1;i<exit.length;i++)assert.ok(exit[i].alpha<=exit[i-1].alpha+.002,'Exiting phone reappeared');
 assert.ok(exit.length>0);checks.push({onePublishToQr:true,exitFrames:exit.length,noRepeatedScreen:true});
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,frames,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,frames:w?await js('window.__frames??[]'):[],errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),150000);
