const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-links-docking-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[],flights={};let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=45000){for(let i=0;i<ms/50;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'store-icons',version:'test',port:18777,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'icons-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&interaction=store');
 for(const id of ['engine-oil','drill','ethiopia']){
  const selector=`[data-product-spawn][data-kdw-product="${id}"]`;
  await wait(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});return b&&!b.disabled&&b.getBoundingClientRect().top>50&&b.getBoundingClientRect().bottom<innerHeight-30})()`);
  const handoff=await js(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}),r=b.querySelector('.kdw-product-photo').getBoundingClientRect();b.click();const f=document.querySelector('.kdw-product-flight'),q=f?.getBoundingClientRect();return {present:!!f,opacity:f&&getComputedStyle(f).opacity,sourceHidden:getComputedStyle(b).visibility,delta:q?Math.max(Math.abs(r.x-q.x),Math.abs(r.y-q.y),Math.abs(r.width-q.width),Math.abs(r.height-q.height)):null}})()`);
  assert.ok(handoff.present&&handoff.opacity==='1'&&handoff.sourceHidden==='hidden'&&handoff.delta<1,JSON.stringify(handoff));
  checks.push(id+': synchronous opaque handoff, identical source bounds');
  await wait("!!document.querySelector('.kdw-slot[data-arriving] .kdw-slot-content')",2000);
  const samples=[];let revealShot=false;for(let i=0;i<90;i++){
   const s=await js(`(()=>{const e=document.querySelector('.kdw-product-flight');if(!e)return null;const c=getComputedStyle(e),slot=document.querySelector('.kdw-slot[data-arriving],.kdw-slot[data-landing]');return {width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,font:parseFloat(c.fontSize)*e.getBoundingClientRect().height/e.offsetHeight,display:c.display,opacity:c.opacity,overflow:c.overflow,emoji:e.classList.contains('kdw-product-emoji'),landing:!!slot?.dataset.landing,slotOpacity:slot&&getComputedStyle(slot).opacity,hidden:slot&&getComputedStyle(slot.querySelector('.kdw-slot-content')).visibility}})()`);
   if(!s)break;if(s.height>0)samples.push(s);
   if(i===9)await shot(id+'-flight');
   if(s.landing&&!revealShot&&Number(s.slotOpacity)>.15&&Number(s.slotOpacity)<.85){await shot(id+'-reveal');revealShot=true;}
   await delay(16);
  }
  const approach=samples.filter(s=>!s.landing),reveal=samples.filter(s=>s.landing);
  assert.ok(approach.length>3);assert.ok(approach.every(s=>s.opacity==='1'&&s.slotOpacity==='0'&&s.overflow==='hidden'&&s.hidden==='hidden'));
  assert.ok(reveal.some(s=>Number(s.slotOpacity)>0&&Number(s.slotOpacity)<.9));
  assert.ok(reveal.every((s,i)=>s.hidden==='visible'&&(!i||Number(s.slotOpacity)>=Number(reveal[i-1].slotOpacity))));
  checks.push(id+': no empty glowing field before landing; gradual monotonic card reveal with image retained');
  if(id!=='ethiopia'){
   assert.ok(samples.every(s=>s.display==='grid'&&s.font/s.height>.4&&s.font/s.height<.65));
   assert.ok(samples.at(-1).font<samples[0].font);checks.push(id+': glyph centred, scales with flight throughout animation, fits card');
  }else checks.push('photographic product retains flight and hidden destination');
  flights[id]=samples;await wait("!document.querySelector('.kdw-product-flight')",2000);await delay(400);
  assert.ok(await js("[...document.querySelectorAll('.kdw-slot-content')].every(e=>getComputedStyle(e).visibility==='visible')"));
  if(id==='engine-oil'){w.setContentSize(1200,800);await delay(400);}
 }
 await shot('landed');
 const motionSource=fs.readFileSync(path.join(__dirname,'client/src/kdw-store-motion.mjs'),'utf8').replace('export function','function');
 const recovery=await js(`(async()=>{${motionSource}
 const r=document.createElement('section');r.id='kdw-interactions';document.body.append(r);
 r.innerHTML='<button class="kdw-product" style="position:fixed;left:40px;top:60px;width:200px"><span class="kdw-product-photo kdw-product-emoji">⚒</span><span>Test</span></button>';
 const b=r.firstElementChild,m=createStoreMotion(r);m.begin(0,b);
 await new Promise(resolve=>setTimeout(resolve,320));
 const pending=!!r.querySelector('.kdw-product-flight')&&getComputedStyle(r.querySelector('.kdw-product-flight')).opacity==='1'&&!r.querySelector('.kdw-product-selection-shell');
 m.cancel(0);const restored=getComputedStyle(b).visibility==='visible'&&!r.querySelector('.kdw-product-flight');
 m.begin(0,b);m.clear();const cleared=!r.querySelector('.kdw-product-flight')&&!r.querySelector('.kdw-product-selection-shell')&&getComputedStyle(b).visibility==='visible';
 r.remove();return {pending,restored,cleared};})()`);
 assert.deepEqual(recovery,{pending:true,restored:true,cleared:true});checks.push('delayed confirmation retains image; rejection and teardown restore source and remove visual clones');
 const docking=await js(`(async()=>{${motionSource}
 const r=document.createElement('section');r.id='kdw-interactions';r.style.background='#0d001a';document.body.append(r);
 r.innerHTML='<button class="kdw-product" style="position:fixed;left:900px;top:300px;width:200px"><span class="kdw-product-photo kdw-product-emoji">⚒</span><span>Test</span></button><div class="kdw-store-scroll" style="position:absolute;left:400px;top:200px;width:260px;height:160px;transform:scale(.8);transform-origin:0 0"><div class="kdw-store-slots"></div></div>';
 const b=r.firstElementChild,scroller=r.querySelector('.kdw-store-scroll'),slots=r.querySelector('.kdw-store-slots');
 const markup=Array.from({length:8},(_,i)=>'<div class="kdw-slot" data-filled="true"><div class="kdw-slot-content" data-kdw-slot="'+i+'"><span class="kdw-product-photo kdw-product-emoji">⚒</span><span>Товар '+i+'</span></div></div>').join('');slots.innerHTML=markup;
 const m=createStoreMotion(r,{duration:120,revealDuration:1800});m.begin(0,b);m.add('drill',0,b);
 const flying=r.querySelector('.kdw-product-flight'),unmasked=flying.parentElement===r&&getComputedStyle(flying).position==='fixed';
 for(let i=0;i<100&&!flying.dataset.docked;i++)await new Promise(resolve=>setTimeout(resolve,10));
 const parent=flying.parentElement===scroller,position=getComputedStyle(flying).position,overflow=getComputedStyle(scroller).overflow;
 const before=flying.getBoundingClientRect();scroller.scrollTop=90;
 const after=flying.getBoundingClientRect(),photo=slots.querySelector('.kdw-product-photo').getBoundingClientRect();
 const followsWithoutRAF=Math.abs(before.top-after.top-72)<1&&Math.abs(after.top-photo.top)<1&&Math.abs(after.left-photo.left)<1;
 slots.innerHTML=markup;m.sync();const q=slots.querySelector('.kdw-product-photo').getBoundingClientRect(),f=flying.getBoundingClientRect(),rebound=Math.abs(f.top-q.top)<1&&flying.parentElement===scroller&&!!slots.querySelector('[data-landing]');
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 scroller.scrollTop=120;m.sync();
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const crossesMask=flying.getBoundingClientRect().top<scroller.getBoundingClientRect().top;
 window.__dockCleanup=()=>{m.clear();r.remove();delete window.__dockCleanup;};return {unmasked,parent,position,overflow,followsWithoutRAF,rebound,crossesMask};})()`);
 assert.deepEqual(docking,{unmasked:true,parent:true,position:'absolute',overflow:'auto',followsWithoutRAF:true,rebound:true,crossesMask:true});
 await shot('native-mask-scroll');await js('window.__dockCleanup()');
 checks.push('flight unmasked; landing reparents into native scroll mask; scroll follows synchronously without RAF; catalogue rerender retains docked position');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,flights},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors,checks,flights},null,2));if(w){await shot('failure');w.destroy();}if(server)await server.close();app.exit(1);});
