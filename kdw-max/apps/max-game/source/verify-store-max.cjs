const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs',process.env.KDW_STORE_REPORT||'verification-store-max-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,server;const checks=[],errors=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'store-max',version:'test',port:18909,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=store');
 const available="[...document.querySelectorAll('.kdw-product-stream [data-product-spawn]')].filter(n=>!n.disabled&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)";
 await wait(available+'.length>0');
 assert.equal(await js("document.querySelector('[data-store-rating]').textContent"),'4,0');
 assert.equal(await js("document.querySelectorAll('.kdw-store-controls,.kdw-store-detail,[data-store-details],.kdw-store-slots button').length"),0);
 assert.equal(await js("document.querySelector('.kdw-store-header img').naturalWidth"),390);
 assert.equal(await js("document.querySelectorAll('.kdw-slot-placeholder').length"),8);
 assert.equal(await js("[...document.querySelectorAll('.kdw-slot-placeholder')].every(n=>!n.textContent.trim()&&!n.querySelector('button,img,svg'))"),true);
 assert.equal(await js("document.querySelector('.kdw-store-scroll').scrollTop"),0);
 checks.push({initialTemplates:8,emptyTemplateContent:true});
 fs.writeFileSync(path.join(report,'empty.png'),(await w.webContents.capturePage()).toPNG());
 await js(`window.storeFlightSamples=[];window.sampleStoreFlight=()=>{
  const f=document.querySelector('.kdw-product-flight');
  if(f){const r=f.getBoundingClientRect(),s=getComputedStyle(f),docked=f.dataset.docked==='true';
   const scale=docked?f.parentElement.getBoundingClientRect().width/f.parentElement.offsetWidth:1;
   storeFlightSamples.push({time:performance.now(),docked,radius:parseFloat(s.borderTopLeftRadius)*scale,width:r.width,height:r.height});
  }requestAnimationFrame(sampleStoreFlight);
 };requestAnimationFrame(sampleStoreFlight);`);
 async function pick(bad){const candidates=available+`.filter(n=>${bad?'':'!'}['engine-oil','drill'].includes(n.dataset.kdwProduct))`;await wait(candidates+'.length>0');await js(`(${candidates})[0].click()`);await delay(180);}
 await pick(true);await wait("document.querySelectorAll('.kdw-store-slots .kdw-slot[data-filled=true]').length===1&&!document.querySelector('.kdw-product-flight')");
 await pick(false);await wait("document.querySelectorAll('.kdw-store-slots .kdw-slot[data-filled=true]').length===2&&!document.querySelector('.kdw-product-flight')");
 const stars=await js("[...document.querySelectorAll('.kdw-store-score')].map(n=>({tone:n.dataset.tone,color:getComputedStyle(n.querySelector('span')).color,text:n.textContent}))");
 assert.deepEqual(stars.map(s=>s.tone),['red','gold']);assert.notEqual(stars[0].color,stars[1].color);
 await js("document.querySelector('.kdw-store-more').click();document.querySelector('.kdw-slot').click()");await delay(150);
 assert.equal(await js("document.querySelectorAll('.kdw-store-slots .kdw-slot[data-filled=true]').length"),2);assert.equal(await js("document.querySelectorAll('.kdw-store-editor [role=dialog]').length"),0);
 assert.equal(await js("document.querySelector('[data-store-rating]').textContent"),'4,0');
 const photos=await js("[...document.querySelectorAll('.kdw-store-slots .kdw-product-photo')].map(p=>({width:p.offsetWidth,height:p.offsetHeight}))");
 for(const p of photos)assert.ok(Math.abs(p.width/p.height-1.6)<.02,JSON.stringify(p));
 const flightSamples=await js('storeFlightSamples');
 const docks=flightSamples.flatMap((s,i)=>s.docked&&i&&!flightSamples[i-1].docked?[{before:flightSamples[i-1],after:s}]:[]);
 assert.equal(docks.length,2);for(const d of docks)assert.ok(Math.abs(d.after.radius-d.before.radius)<.5,JSON.stringify(d));
 assert.ok(flightSamples.filter(s=>!s.docked).length>5);
 checks.push({photos,docks,smoothCorners:true});
 fs.writeFileSync(path.join(report,'flight-samples.json'),JSON.stringify(flightSamples,null,2));
 checks.push({stars,displayOnlyCards:true,headerRating:true});
 assert.equal(await js("document.querySelectorAll('.kdw-slot-placeholder').length"),6);
 assert.equal(await js("document.querySelector('.kdw-store-scroll').scrollTop"),0);
 checks.push({twoFilledSixEmpty:true,noPrematureScroll:true});
 fs.writeFileSync(path.join(report,'two-products.png'),(await w.webContents.capturePage()).toPNG());
 for(let i=0;i<9;i++)await pick(false);
 await wait("!!document.querySelector('[data-kdw-submit]:not([hidden]):not(:disabled)')");
 await wait("!document.querySelector('.kdw-product-flight,[data-card-popping]')");
 assert.equal(await js("document.querySelectorAll('.kdw-store-slots .kdw-slot[data-filled=true]').length"),11);
 assert.equal(await js("document.querySelector('[data-store-rating]').textContent"),'5,0');
 assert.ok(await js("document.querySelector('.kdw-store-scroll').scrollTop>0"));
 assert.ok(await js("(()=>{const s=document.querySelector('.kdw-store-scroll').getBoundingClientRect(),p=[...document.querySelectorAll('.kdw-slot[data-filled=true]')].at(-1).getBoundingClientRect();return p.top>=s.top-1&&p.bottom<=s.bottom+1;})()"));
 checks.push({newestProductVisible:true});
 assert.equal(await js("document.querySelectorAll('.kdw-product-stream [data-product-spawn]').length"),0);
 for(const [width,height]of [[1920,1080],[1366,768],[1080,1920]]){
  w.setContentSize(width,height);await delay(800);await wait("!document.querySelector('.kdw-store-editor').inert");
  const layout=await js("(()=>{const e=document.querySelector('.kdw-store-editor'),r=e.getBoundingClientRect(),a=document.querySelector('.kdw-store-actions').getBoundingClientRect(),scroll=document.querySelector('.kdw-store-scroll');return {x:r.x,y:r.y,right:r.right,bottom:a.bottom,w:innerWidth,h:innerHeight,columns:getComputedStyle(document.querySelector('.kdw-store-slots')).gridTemplateColumns,scroll:scroll.scrollTop,background:getComputedStyle(scroll).backgroundColor}})()");
  assert.ok(layout.x>=0&&layout.y>=0&&layout.right<=width&&layout.bottom<=height,JSON.stringify(layout));assert.equal(layout.background,'rgb(237, 237, 237)');checks.push({layout});
  fs.writeFileSync(path.join(report,`complete-${width}x${height}.png`),(await w.webContents.capturePage()).toPNG());
 }
 await js("document.querySelector('[data-kdw-submit]').click()");await wait("document.querySelector('#kdw-interactions').hidden");checks.push({goalAndPublish:true,scroll:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w)fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w?.destroy();await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),150000);
