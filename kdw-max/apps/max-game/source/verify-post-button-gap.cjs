const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-post-button-gap-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],runs=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<1500;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'post-reference',version:'test',port:18912,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 for(const page of ['cafe-original','client']){
  await w.loadURL(server.origin+`/webgl-v5/${page}.html?backend=local&view=game&interaction=posts&test=memory`);
  await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
  await delay(800);
  assert.equal(await js("getComputedStyle(document.querySelector('.context-popup')).opacity"),'0');
  for(let n=0;n<4;n++){
   await wait("[...document.querySelectorAll('.kdw-falling-post')].some(n=>!n.disabled&&['coffee-duo','hours','menu','breakfast','space'].includes(n.dataset.post))");
   await js("[...document.querySelectorAll('.kdw-falling-post')].find(n=>!n.disabled&&['coffee-duo','hours','menu','breakfast','space'].includes(n.dataset.post)).click()");
   await delay(600);
   if(await js("document.documentElement.dataset.kdwPostsComplete==='true'"))break;
  }
  await wait("document.documentElement.dataset.kdwPostsComplete==='true'&&!document.querySelector('[data-post-finish]').disabled");
  await delay(800);
  const state=await js("(()=>{const p=document.querySelector('.context-popup'),i=p.querySelector('.instruction');return{opacity:getComputedStyle(p).opacity,hidden:i.hidden,text:i.innerText,notice:!!document.querySelector('.kdw-post-notice'),finishVisible:!document.querySelector('[data-post-finish]').hidden,gap:document.querySelector('[data-post-finish]').getBoundingClientRect().top-document.querySelector('.kdw-post-phone').getBoundingClientRect().bottom,phoneWidth:document.querySelector('.kdw-post-phone').getBoundingClientRect().width,hint:document.querySelector('[data-post-hint]').textContent}})()");
  assert.ok(Number(state.opacity)>.99);assert.equal(state.hidden,false);assert.match(state.text,/Канал создан, теперь можно поделиться новостями вашего бизнеса/);assert.equal(state.notice,false);assert.equal(state.finishVisible,true);assert.equal(state.hint,'');assert.ok(state.gap>state.phoneWidth*.075);
  fs.writeFileSync(path.join(report,page+'.png'),(await w.webContents.capturePage()).toPNG());runs.push({page,...state});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,runs,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,runs,errors},null,2));if(w){fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),240000);
