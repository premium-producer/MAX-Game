const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-unmasked-flights-20261020/approach');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[],flights={};let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=45000){for(let i=0;i<ms/50;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'store-icons',version:'test',port:18885,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'icons-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('http://127.0.0.1:18885/webgl-v5/client.html?backend=local&view=game&interaction=store');
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
 await js(`(()=>{${motionSource}
 const r=document.createElement('section');r.id='kdw-interactions';r.style.background='#000';document.body.append(r);
 r.innerHTML='<div class="kdw-store-editor" style="left:300px;top:200px;width:300px;height:500px;transform:none;background:rgb(20,30,40);opacity:1"><div class="kdw-store-scroll" style="position:absolute;left:0;top:80px;width:300px;height:300px"></div></div><button class="kdw-product" style="position:fixed;left:530px;top:180px;width:180px"><span class="kdw-product-photo" style="height:210px;flex-basis:210px;background:#ff00ff"></span><span>Test</span></button>';
 const scroller=r.querySelector('.kdw-store-scroll');
 scroller.innerHTML='<div class="kdw-slot" style="position:absolute;left:230px;top:-100px;width:180px;height:300px"><div class="kdw-slot-content" data-kdw-slot="0" style="padding:0"><span class="kdw-product-photo" style="height:210px;flex-shrink:0;background:#ff00ff"></span></div></div>';
 const m=createStoreMotion(r,{duration:4000,revealDuration:300}),b=r.querySelector('button');m.begin(0,b);m.add('test',0,b);
 window.__approachCleanup=()=>{m.clear();r.remove();delete window.__approachCleanup;};
 })()`);
 await delay(250);
 const inspect=()=>js("(()=>{const f=[...document.querySelectorAll('.kdw-product-flight')].at(-1);return {parent:f?.parentElement.id,clip:f&&getComputedStyle(f).clipPath,maskCount:document.querySelectorAll('.kdw-product-flight-mask').length}})()");
 assert.deepEqual(await inspect(),{parent:'kdw-interactions',clip:'none',maskCount:0});
 await delay(2900);
 assert.deepEqual(await inspect(),{parent:'kdw-interactions',clip:'none',maskCount:0});
 const captured=await w.webContents.capturePage(),bitmap=captured.toBitmap(),size=captured.getSize();
 const rgb=(x,y)=>{const i=(y*size.width+x)*4;return [bitmap[i+2],bitmap[i+1],bitmap[i]];};
 for(const [x,y] of [[560,230],[640,230],[560,290]]){const c=rgb(x,y);assert.ok(c[0]>220&&c[1]<30&&c[2]>220,'flight stays visible above header, beyond device, and over catalogue');}
 await shot('unmasked-approach');await js('window.__approachCleanup()');
 checks.push('early and late flight unmasked; pixels visible over header and outside device; native mask applies only after landing');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,flights},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors,checks,flights},null,2));if(w){await shot('failure');w.destroy();}if(server)await server.close();app.exit(1);});
