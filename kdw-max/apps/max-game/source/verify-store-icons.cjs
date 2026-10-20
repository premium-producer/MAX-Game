const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs',process.env.KDW_STORE_VISUAL_REPORT||'verification-store-icons-20261020');
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
  await js(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await wait("!!document.querySelector('.kdw-product-flight')",2000);
  const samples=[];for(let i=0;i<36;i++){
   const s=await js(`(()=>{const e=document.querySelector('.kdw-product-flight');if(!e)return null;const c=getComputedStyle(e);return {width:parseFloat(e.style.width),height:parseFloat(e.style.height),font:parseFloat(c.fontSize),display:c.display,overflow:c.overflow,emoji:e.classList.contains('kdw-product-emoji'),hidden:getComputedStyle(document.querySelector('.kdw-slot[data-arriving] .kdw-slot-content')).visibility}})()`);
   if(!s)break;if(s.height>0)samples.push(s);
   if(i===9)await shot(id+'-flight');
   await delay(16);
  }
  assert.ok(samples.length>3);assert.ok(samples.every(s=>s.overflow==='hidden'&&s.hidden==='hidden'));
  if(id!=='ethiopia'){
   assert.ok(samples.every(s=>s.display==='grid'&&s.font/s.height>.4&&s.font/s.height<.65));
   assert.ok(samples.at(-1).font<samples[0].font);checks.push(id+': glyph centred, scales with flight throughout animation, fits card');
  }else checks.push('photographic product retains flight and hidden destination');
  flights[id]=samples;await wait("!document.querySelector('.kdw-product-flight')",2000);await delay(400);
  assert.ok(await js("[...document.querySelectorAll('.kdw-slot-content')].every(e=>getComputedStyle(e).visibility==='visible')"));
  if(id==='engine-oil'){w.setContentSize(1200,800);await delay(400);}
 }
 await shot('landed');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,flights},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors,checks,flights},null,2));if(w){await shot('failure');w.destroy();}if(server)await server.close();app.exit(1);});
