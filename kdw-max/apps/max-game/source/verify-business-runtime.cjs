const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-fidelity-20261021');
const visualOnly=process.argv.includes('--cafe'),resultFile=visualOnly?'visual-checks.json':'checks.json';
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s,ms=45000){for(let i=0;i<ms/50;i++){if(await js(s))return;await delay(50);}fs.writeFileSync(path.join(report,'timeout-state.json'),JSON.stringify(await js("({screen:document.documentElement.dataset.kdwScreen,phase:document.querySelector('.journey-zone')?.dataset.revealPhase,native:document.querySelector('.bn-surface')?.outerHTML,phone:document.querySelector('.route-phone')?.dataset})"),null,2));throw Error('Timeout '+s);}
async function shot(n){for(let i=0;i<5;i++){try{fs.writeFileSync(path.join(report,n+'.png'),(await w.webContents.capturePage()).toPNG());break;}catch(e){if(i===4)throw e;await delay(250);}}if(n.includes('business.')){const size=await js("(()=>{const n=document.querySelector('.bn-surface');return{width:parseInt(n.style.width),height:parseInt(n.style.height)}})()");await js("(()=>{const s=document.createElement('style');s.id='pixel-capture';s.textContent='#kdw-business-native .bn-surface{left:0!important;top:0!important;transform:scale(1)!important;opacity:1!important}';document.head.append(s)})()");await delay(100);fs.writeFileSync(path.join(report,'native-'+n+'.png'),(await w.webContents.capturePage({x:0,y:0,...size})).toPNG());await js("document.getElementById('pixel-capture').remove()");}}
async function click(selector){await wait(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e&&!e.disabled&&!e.closest('[inert]')})()`);await js(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function active(id){await wait(`document.querySelector('[data-bn-screen="${id}"]')&&!document.querySelector('[data-bn-screen="${id}"]').inert`);await delay(500);console.log(id);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'business-native',version:'test',port:18897,entry:'/'}});await server.listen();
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 for(const type of visualOnly?['cafe']:['cafe','sports','flowers']){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
  await click('[data-idle-mission=business]');
  await active('business.platform.business-type');
  assert.equal(await js("document.querySelectorAll('.bn-choice-card').length"),3);
  if(type==='cafe')await shot('choice');
  await js(`document.querySelector('[data-bn-action="business.platform.choose-${type}"]').click()`);
  for(const id of ['business.platform.login','business.platform.profile','business.platform.verification','business.channel.create','business.channel.continue','business.channel.open','business.channel.setup','business.channel.details','business.channel.description','business.channel.type','business.channel.publish']){
   await active(id);const state=await js(`(()=>{const r=document.querySelector('.bn-surface'),b=document.querySelector('.task-media-image');return {id:r.dataset.bnScreen,type:r.dataset.business,nativeText:r.innerText,asset:b?.getAttribute('src'),emptyImages:[...r.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),buttons:[...r.querySelectorAll('button')].map(b=>b.textContent),rect:(()=>{let q=r.getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height}})()}})()`);
   assert.equal(state.type,type);assert.ok(state.asset.includes('business-components/'),'Transparent device canvas expected');assert.deepEqual(state.emptyImages,[]);assert.ok(!state.nativeText.includes('Сатурн'));
   assert.ok(await js("[...document.querySelectorAll('.bn-original')].every(i=>getComputedStyle(i).borderRadius==='0px'&&getComputedStyle(i).filter==='none')"));
   if(id==='business.channel.setup')assert.ok(state.nativeText.includes('+7 912 000-00-00'));
   if(type==='cafe'||['business.channel.create','business.channel.type'].includes(id))await shot(type+'-'+id);
   checks.push({type,...state});
   await click('.bn-surface [data-bn-action]');
  }
  await wait("document.querySelector('.kdw-post-phone')&&!document.querySelector('.kdw-post-phone').inert");
  assert.ok(await js(`document.querySelector('.kdw-post-identity').innerText.includes('${type==='cafe'?'Кофейня':type==='sports'?'Спортивный магазин':'Цветочный магазин'}')`));
  if(type==='cafe')await shot('cafe-posts');
  // Skip only the already independently tested scoring activity in this route
  // audit; the bot/store below still use the real session and task transitions.
  await wait("!!document.querySelector('.kdw-task-skip:not([hidden])')");await js("document.querySelector('.kdw-task-skip').click()");
  for(const id of ['business.bot.create','business.bot.filled','business.bot.ready','business.bot.result']){
   await active(id);assert.equal(await js("document.querySelector('.bn-surface').dataset.business"),type);
   if(type==='cafe'||id==='business.bot.filled')await shot(type+'-'+id);
   checks.push({type,id,content:await js("document.querySelector('.bn-surface').innerText")});
   await click('.bn-surface [data-bn-action]');
  }
  await wait("document.querySelector('.kdw-store-editor')&&!document.querySelector('.kdw-store-editor').inert");
  checks.push({type,store:true});
  if(type==='flowers'){
   await w.setContentSize(1280,720);await delay(300);await wait("document.querySelector('.kdw-store-editor')&&!document.querySelector('.kdw-store-editor').inert");await delay(300);await shot('flowers-store-1280');
   await w.setContentSize(1920,1080);await delay(1000);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,resultFile),JSON.stringify({passed:true,bundle,cssSha256:JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).cssSha256,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,resultFile),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);}});
setTimeout(()=>{fs.writeFileSync(path.join(report,'watchdog.json'),JSON.stringify({checks,errors}));app.exit(2);},480000);
