const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-original-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],screens=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<1000;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
async function click(s){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return n&&!n.disabled&&!n.closest('[inert],[hidden]')})()`);await js(`document.querySelector(${JSON.stringify(s)}).click()`);}
async function shot(n){fs.writeFileSync(path.join(report,n+'.png'),(await w.webContents.capturePage()).toPNG());}
async function screen(id){
 const selector=`.route-phone [data-screen-id="${id}"][data-answer]`;
 await wait(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}),p=b?.closest('.route-phone'),i=p?.querySelector('.task-media-image');return b&&!b.disabled&&!b.closest('[inert],[hidden]')&&p.dataset.sceneVersion===p.dataset.mediaReadyKey&&i?.complete&&i.naturalWidth>0})()`);
 // Wait for the shared content sweep, which outlives the decoded DOM image.
 await delay(2400);
 const asset=await js(`document.querySelector(${JSON.stringify(selector)}).closest('.route-phone').querySelector('.task-media-image').getAttribute('src')`);
 assert.ok(asset.endsWith('.png'),asset);assert.equal(await js("document.querySelectorAll('[data-bn-screen]').length"),0);
 screens.push({id,asset});await shot(id);await click(selector);
}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'business-original',version:'test',port:18911,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/cafe-original.html?backend=local&view=game&test=memory');await click('[data-idle-mission=business]');
 await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
 const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
 w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
 for(const id of ['business.platform.login','business.platform.profile','business.platform.verification','business.platform.ready','business.channel.create','business.channel.continue','business.channel.open','business.channel.setup','business.channel.details','business.channel.description','business.channel.type','business.channel.publish'])await screen(id);
 await wait("document.querySelector('.kdw-post-phone')&&!document.querySelector('.kdw-post-phone').inert");
 assert.ok(await js("document.querySelector('.kdw-post-identity').innerText.includes('Кофейня')"));await shot('posts');
 await click('.kdw-task-skip:not([hidden])');
 for(const id of ['business.bot.create','business.bot.filled','business.bot.ready','business.bot.result'])await screen(id);
 await wait("document.querySelector('.kdw-store-editor')&&!document.querySelector('.kdw-store-editor').inert");await shot('store');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,screens,posts:true,store:true,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,screens,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),240000);
