const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-card-pop-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,server;const checks=[],errors=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<800;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'card-pop',version:'test',port:18908,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 for(const mode of ['posts','store']){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction='+mode);
  const selector=mode==='posts'?'.kdw-falling-post':'.kdw-product-stream [data-product-spawn]';
  const rows=mode==='posts'?'[data-published]':'.kdw-store-slots .kdw-slot';
  const available=`[...document.querySelectorAll('${selector}')].filter(n=>!n.disabled&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)`;
  const good=available+`.filter(n=>!['spam','promise','unrelated','engine-oil','drill'].includes(n.dataset.post??n.dataset.kdwProduct))`;
  await wait(good+'.length>0');
  await js(`window.frames=[];window.sampling=true;function sample(){if(!window.sampling)return;const pops=[...document.querySelectorAll('[data-card-popping]')];window.frames.push({t:performance.now(),pops:pops.map(n=>({order:+n.dataset.cardPopping,disabled:n.disabled,inert:n.inert,opacity:+getComputedStyle(n).opacity,delay:n.getAnimations()[0]?.effect.getTiming().delay})),rows:document.querySelectorAll('${rows}').length,flights:document.querySelectorAll('.kdw-product-flight').length});for(const n of pops)n.click();requestAnimationFrame(sample)}sample();`);
  for(let i=0;i<(mode==='posts'?3:9);i++){
   await wait(good+'.length>0&&'+available+'.length>=3');
   await js(`(${good})[0].click()`);await delay(150);
  }
  await wait('window.frames.some(f=>f.pops.length>=2)');
  await delay(130);fs.writeFileSync(path.join(report,mode+'-popping.png'),(await w.webContents.capturePage()).toPNG());
  await wait("!document.querySelector('[data-card-popping]')");
  await wait("!document.querySelector('.kdw-product-flight')");await delay(900);
  await js('window.sampling=false');const frames=await js('window.frames'),first=frames.find(f=>f.pops.length),last=frames.at(-1);
  assert.ok(first.pops.every(p=>p.disabled&&p.inert));assert.ok(frames.some(f=>f.pops.some(p=>p.opacity<.9)&&f.pops.some(p=>p.opacity>.99)),'staggered visual removal');
  assert.ok(first.pops.every(p=>p.delay===p.order*90),'90ms sequence');assert.ok(frames.some(f=>f.pops.length>0&&f.flights>0),'phone flight continues during pop');
  assert.equal(last.rows,mode==='posts'?3:9,'clicking popping cards adds nothing');
  assert.equal(await js(`document.querySelectorAll('${selector}').length`),0);
  if(mode==='posts')await wait("!!document.querySelector('[data-post-finish]:not([hidden]):not(:disabled)')");
  else assert.equal(await js("document.querySelector('[data-kdw-submit]').textContent"),'Опубликовать витрину');
  checks.push({mode,count:first.pops.length,rows:last.rows,sequence:first.pops.map(p=>p.delay)});
  fs.writeFileSync(path.join(report,mode+'-frames.json'),JSON.stringify(frames));fs.writeFileSync(path.join(report,mode+'-final.png'),(await w.webContents.capturePage()).toPNG());
 }
 // Exercise cancellation/restart with real browser animations, then reduced motion.
 const helper=fs.readFileSync(path.join(__dirname,'client/src/kdw-card-pop.mjs'),'utf8').replace('export function','function');
 await js(`(()=>{${helper};window.popTest=createCardPop();window.popNodes=()=>Array.from({length:10},(_,i)=>{const n=document.createElement('button');n.dataset.popTest='true';n.textContent='Card';Object.assign(n.style,{position:'fixed',left:'10px',top:(i*40)+'px',width:'100px',height:'35px'});document.body.append(n);return n;});popTest.start(popNodes());})()`);
 assert.equal(await js("document.querySelectorAll('[data-pop-test][data-card-popping]').length"),10);
 await js('popTest.clear()');await delay(20);assert.equal(await js("document.querySelectorAll('[data-pop-test]').length"),0);
 await js('popTest.start(popNodes())');await delay(1150);assert.equal(await js("document.querySelectorAll('[data-pop-test]').length"),0);
 w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await js('popTest.clear();popTest.start(popNodes())');assert.equal(await js("document.querySelectorAll('[data-pop-test]').length"),0);
 checks.push({cancelAndRestart:true,tenCardsFinishWithin1150ms:true,reducedMotion:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w)fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w?.destroy();await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),150000);
