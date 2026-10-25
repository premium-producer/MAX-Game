const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-idle-reveal-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let win,server;const errors=[],checks=[];
const js=s=>win.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(40);}throw Error('Timeout: '+s);}
async function click(s){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return n&&!n.disabled&&!n.closest('[inert],[hidden]')})()`);const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(s)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseDown','mouseUp'])win.webContents.sendInputEvent({type,button:'left',clickCount:1,...p});}
const sampler=`window.idleSamples=[];window.menuIds=new WeakMap();window.menuSerial=0;function sample(){const parts=[...document.querySelectorAll('[data-idle-part]')];if(parts.length){const first=parts[0];if(!menuIds.has(first))menuIds.set(first,++menuSerial);idleSamples.push({t:performance.now(),visit:menuIds.get(first),parts:parts.map(n=>({key:n.dataset.idleMission|| (n.matches('.route-phone')?'video':'logo'),alpha:Number(n.dataset.pathPresence),top:n.getBoundingClientRect().top,ready:n.dataset.gpuReadyKey||n.querySelector('img')?.dataset.gpuReady||'',inert:n.inert}))});}requestAnimationFrame(sample)}requestAnimationFrame(sample);`;
async function ready(){await wait("!!document.documentElement.dataset.idleMenuReady");await delay(250);}
function validate(samples,visit){const rows=samples.filter(r=>r.visit===visit),keys=rows[0].parts.map(p=>p.key),result={visit,parts:[]};for(const key of keys){const values=rows.map(r=>({t:r.t,...r.parts.find(p=>p.key===key)}));assert.ok(values.some(p=>p.alpha===0),key+' starts hidden');assert.ok(values.some(p=>p.alpha>.05&&p.alpha<.95),key+' has intermediate fade');assert.ok(values.some(p=>p.alpha>.97),key+' completes');const first=values.find(p=>p.alpha>0);assert.ok(first.alpha<.15,key+' does not pop after readiness');result.parts.push({key,first:first.alpha,started:first.t,frames:values.filter(p=>p.alpha>0&&p.alpha<.97).length});}const icons=result.parts.filter(p=>!['video','logo'].includes(p.key));assert.ok(icons.at(-1).started-icons[0].started>150,'icons are staggered');return result;}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'idle-reveal',version:'test',port:18916,entry:'/'}});await server.listen();
 win=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 win.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 win.webContents.session.webRequest.onBeforeRequest({urls:[server.origin+'/*']},(d,cb)=>{setTimeout(()=>cb({}),/max-primary-white\.svg|\.mp4/.test(d.url)?1800:0);});
 win.webContents.on('dom-ready',()=>void js(sampler));
 await win.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await ready();
 checks.push(validate(await js('idleSamples'),1));await click('[data-idle-mission=business]');await wait("!!document.querySelector('[data-palm]')");await click('.kdw-browser-back');await ready();
 const samples=await js('idleSamples');checks.push(validate(samples,2));fs.writeFileSync(path.join(report,'frames.json'),JSON.stringify(samples));fs.writeFileSync(path.join(report,'menu.png'),(await win.webContents.capturePage()).toPNG());
 win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await win.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await ready();
 assert.equal(await js("matchMedia('(prefers-reduced-motion: reduce)').matches"),true);assert.ok((await js('idleSamples')).every(r=>r.parts.every(p=>p.alpha===0||p.alpha===1)));checks.push({reducedMotion:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));win.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));win?.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),120000);
