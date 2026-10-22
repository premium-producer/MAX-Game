const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-phone-sharing-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(30);}throw Error('Timeout '+s);}
async function click(s){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return n&&!n.hidden&&!n.disabled&&!n.closest('[inert]')})()`);await js(`document.querySelector(${JSON.stringify(s)}).click()`);}
async function active(id){await wait(`document.querySelector('[data-bn-screen="${id}"]')&&!document.querySelector('[data-bn-screen="${id}"]').inert`);await delay(350);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'phone-sharing',version:'test',port:18908,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await click('[data-idle-mission=business]');
 await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
 const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
 w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
 await js("window.registrationScreens=[];window.watchRegistration=true;function sample(){if(!window.watchRegistration)return;const id=document.querySelector('[data-bn-screen]')?.dataset.bnScreen;if(id&&!window.registrationScreens.includes(id))window.registrationScreens.push(id);requestAnimationFrame(sample)}sample()");
 await active('business.platform.business-type');await click('[data-bn-action="business.platform.choose-cafe"]');
 for(const id of ['business.platform.login','business.platform.profile']){await active(id);await click('.bn-surface [data-bn-action]');}
 await active('business.platform.verification');await click('.bn-surface [data-bn-action]');

 for(const id of ['business.channel.create','business.channel.continue','business.channel.open']){await active(id);await click('.bn-surface [data-bn-action]');}
 await active('business.channel.setup');
 assert.equal(await js("document.querySelectorAll('[data-bn-binding=number]').length"),0);
 const before=await js("fetch(document.querySelector('[data-bn-source=\"kdw.business-component.business-channel-setup-1\"]').src).then(r=>r.text())");
 assert.ok(!before.includes('clip10_147_66130')&&!before.includes('mask2_147_66130'),'receipt group must not exist before sharing');
 const authored=fs.readFileSync(path.resolve(root,'../../UI/new_screens/busines_no_sort/4. number.svg'),'utf8');
 const receiptPaths=await js(`(()=>{const doc=new DOMParser().parseFromString(${JSON.stringify(authored)},'image/svg+xml'),nodes=doc.documentElement.querySelectorAll('*');return [53,54].map(i=>nodes[i].getAttribute('d'))})()`);
 for(const d of receiptPaths)assert.ok(d&&!before.includes(d),'receipt text and timestamp must be absent, not just its bubble');
 fs.writeFileSync(path.join(report,'before-sharing.png'),(await w.webContents.capturePage()).toPNG());
 await click('[data-bn-action=\"business.channel.setup.continue\"]');await active('business.channel.details');
 fs.writeFileSync(path.join(report,'after-sharing.png'),(await w.webContents.capturePage()).toPNG());
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,before:'business.channel.setup',after:'business.channel.details',receiptAbsentBefore:true,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));if(w)w.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),120000);
