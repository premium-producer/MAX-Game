const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-native-20261021');
app.setPath('userData',path.join(report,'test-edge-runtime'));app.on('window-all-closed',()=>{});
let w,server;const errors=[],checks=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
async function screen(id){await wait(`document.querySelector('[data-bn-screen="${id}"]')&&!document.querySelector('[data-bn-screen="${id}"]').inert`);await delay(450);}
async function click(s){await wait(`(()=>{const b=document.querySelector(${JSON.stringify(s)});return b&&!b.closest('[inert]')&&!b.disabled})()`);await js(`document.querySelector(${JSON.stringify(s)}).click()`);}
const next=()=>click('.bn-surface [data-bn-action]');
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'native-edge',version:'test',port:18898,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 const url=server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory';
 await w.loadURL(url);await click('[data-idle-mission=business]');await screen('business.platform.business-type');
 await js("document.querySelector('[data-bn-action=\"business.platform.choose-flowers\"]').click();document.querySelector('[data-bn-action=\"business.platform.choose-flowers\"]').click()");
 await screen('business.platform.login');await delay(600);assert.equal(await js('document.documentElement.dataset.kdwScreen'),'business.platform.login');checks.push('double choice commits once');
 await next();for(const id of ['business.platform.profile','business.platform.verification','business.channel.create','business.channel.continue','business.channel.open','business.channel.setup','business.channel.details','business.channel.description']){await screen(id);if(id==='business.channel.description')break;await next();}
 assert.equal(await js("document.querySelector('.bn-composer input').value"),'Цветочный магазин');await next();await screen('business.channel.type');
 const run=await js('document.documentElement.dataset.kdwRun');await click('[data-object="business.channel"]');await screen('business.channel.create');
 assert.notEqual(await js('document.documentElement.dataset.kdwRun'),run);assert.equal(await js("document.querySelector('.bn-surface').dataset.business"),'flowers');checks.push('replay returns to first task screen with same business');
 for(const [width,height] of [[1366,768],[2560,1080]]){w.setContentSize(width,height);await screen('business.channel.create');const geometry=await js("(()=>{const n=document.querySelector('.bn-surface'),r=n.getBoundingClientRect(),c=document.querySelector('.task-media-canvas').getBoundingClientRect();return {dx:Math.abs(r.left-c.left),dy:Math.abs(r.top-c.top),dw:Math.abs(r.width-c.width),dh:Math.abs(r.height-c.height),font:getComputedStyle(n).fontFamily}})()");assert.ok(Object.values(geometry).filter(v=>typeof v==='number').every(v=>v<.1));assert.ok(geometry.font.includes('Arial'));checks.push({viewport:[width,height],geometry});}
 assert.deepEqual(errors,[]);checks.push('normal navigation has no console errors');
 // Fault injection is scoped to this disposable browser session.
 let blocked=0;w.webContents.session.webRequest.onBeforeRequest({urls:[server.origin+'/assets/kdw-native/business-ui/channel-bot.webp']},(_d,done)=>{blocked++;done({cancel:true});});await w.webContents.session.clearCache();
 w.setContentSize(1920,1080);await w.loadURL(url);await click('[data-idle-mission=business]');await screen('business.platform.business-type');await click('[data-bn-action="business.platform.choose-cafe"]');await screen('business.platform.login');
 assert.ok(blocked>0,'Fault was not injected');checks.push({missingImageRequestsBlocked:blocked,readinessAndNavigation:true});
 fs.writeFileSync(path.join(report,'edge-checks.json'),JSON.stringify({passed:true,checks,expectedFaultErrors:errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'edge-checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){fs.writeFileSync(path.join(report,'edge-failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),150000);
