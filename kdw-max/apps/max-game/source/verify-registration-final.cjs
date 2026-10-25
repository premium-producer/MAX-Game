const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-registration-snack-auto-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(30);}throw Error('Timeout '+s);}
async function click(s){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return n&&!n.hidden&&!n.disabled&&!n.closest('[inert]')})()`);await js(`document.querySelector(${JSON.stringify(s)}).click()`);}
async function active(id){await wait(`document.querySelector('[data-bn-screen="${id}"]')&&!document.querySelector('[data-bn-screen="${id}"]').inert`);await delay(350);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'registration-final',version:'test',port:18907,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 const runs=[];
 for(const mode of ['auto','click']){
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await click('[data-idle-mission=business]');
 await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
 const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
 w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
 await js("window.registrationScreens=[];window.watchRegistration=true;function sample(){if(!window.watchRegistration)return;const id=document.querySelector('[data-bn-screen]')?.dataset.bnScreen;if(id&&!window.registrationScreens.includes(id))window.registrationScreens.push(id);requestAnimationFrame(sample)}sample()");
 await active('business.platform.business-type');await click('[data-bn-action="business.platform.choose-cafe"]');
 for(const id of ['business.platform.login','business.platform.profile']){await active(id);await click('.bn-surface [data-bn-action]');}
 await active('business.platform.verification');fs.writeFileSync(path.join(report,'registration-final.png'),(await w.webContents.capturePage()).toPNG());
 await click('.bn-surface [data-bn-action]');
 await wait(`(()=>{const n=document.querySelector('[data-bn-screen="business.platform.ready"]');return n&&!n.inert&&Number(getComputedStyle(n).opacity)>.99})()`);
 const appeared=Date.now();
 const panel=await js(`(()=>{const n=document.querySelector('[data-bn-screen="business.platform.ready"]'),images=[...n.querySelectorAll('[data-bn-source]')];return {sources:images.map(i=>i.dataset.bnSource),loaded:images.every(i=>i.complete&&i.naturalWidth>0),opacity:getComputedStyle(n).opacity}})()`);
 assert.deepEqual(panel.sources,['kdw.business-confirmation.snack-body']);assert.equal(panel.loaded,true);
 assert.equal(await js("document.querySelectorAll('[data-bn-screen=\"business.platform.ready\"] .bn-source-forward').length"),0);
 fs.writeFileSync(path.join(report,'confirmation-'+mode+'.png'),(await w.webContents.capturePage()).toPNG());
 if(mode==='click')await click('[data-bn-screen="business.platform.ready"] .bn-original-action');
 await active('business.channel.create');await js('window.watchRegistration=false');
 const screens=await js('window.registrationScreens');assert.ok(screens.includes('business.platform.ready'));assert.ok(screens.includes('business.platform.verification')&&screens.includes('business.channel.create'));assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'channel-next.png'),(await w.webContents.capturePage()).toPNG());
 runs.push({mode,screens,panel,toNextMs:Date.now()-appeared});
 }
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,runs,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));if(w)w.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),120000);
