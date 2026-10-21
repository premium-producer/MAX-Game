const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-reaction-tempo-20261021');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,server;const errors=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<600;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'reaction-tempo',version:'test',port:18907,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=posts');
 const available="[...document.querySelectorAll('.kdw-falling-post')].filter(n=>!n.disabled&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight)";
 await wait(available+".filter(n=>!['spam','promise','unrelated'].includes(n.dataset.post)).length>=2");
 await js(`window.frames=[];window.sampling=true;function sample(){if(!window.sampling)return;window.frames.push({t:performance.now(),rows:[...document.querySelectorAll('[data-published]')].map(n=>({id:n.dataset.published,arriving:n.hasAttribute('data-arriving'),landing:n.hasAttribute('data-landing'),heart:n.querySelector('[data-count=heart]').textContent,fire:n.querySelector('[data-count=fire]').textContent}))});requestAnimationFrame(sample)}sample();`);
 const ids=await js(`(${available}).filter(n=>!['spam','promise','unrelated'].includes(n.dataset.post)).slice(0,2).map(n=>n.dataset.spawn)`);
 for(const id of ids){await js(`document.querySelector('[data-spawn="${id}"]').click()`);await delay(150);}
 await wait("document.querySelectorAll('[data-published]').length===2&&!document.querySelector('#kdw-posts .kdw-product-flight')");await delay(1600);
 await js('window.sampling=false');const frames=await js('window.frames'),checks=[];
 for(const id of ids){const rows=frames.flatMap(f=>f.rows.filter(r=>r.id===id).map(r=>({...r,t:f.t}))),land=rows.find(r=>r.landing),final=rows.at(-1);
  assert.ok(land);assert.ok(rows.filter(r=>r.arriving).every(r=>r.heart==='0'&&r.fire==='0'));
  assert.ok(rows.some(r=>Number(r.heart)>0&&Number(r.heart)<Number(final.heart)),'visible intermediate count');
  assert.ok(rows.filter(r=>r.t>=land.t+800).every(r=>r.heart===final.heart&&r.fire===final.fire),'settled by 800ms');
  checks.push({id,land:land.t,finalHeart:final.heart,finalFire:final.fire});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));fs.writeFileSync(path.join(report,'frames.json'),JSON.stringify(frames));
 fs.writeFileSync(path.join(report,'settled.png'),(await w.webContents.capturePage()).toPNG());w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));w?.destroy();await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),90000);
