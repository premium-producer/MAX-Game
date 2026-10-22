const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-activity-buttons-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<1200;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'activity-buttons',version:'test',port:18914,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 for(const kind of ['posts','store']){
  await w.loadURL(server.origin+`/webgl-v5/cafe-original.html?backend=local&view=game&interaction=${kind}&test=memory`);
  const finish=kind==='posts'?'[data-post-finish]':'.kdw-store-actions [data-kdw-submit]';
  await wait(`document.querySelector('${finish}')`);
  const good=kind==='posts'?"[...document.querySelectorAll('.kdw-falling-post')].find(n=>!n.disabled&&['coffee-duo','hours','menu','breakfast','space'].includes(n.dataset.post))":"[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled&&!['engine-oil','drill'].includes(n.dataset.kdwProduct)&&n.dataset.flowEntry==='admitted')";
  for(let i=0;i<18;i++){
   if(await js(`!document.querySelector('${finish}').hidden`))break;
   await wait(`!!(${good})`);await js(`(${good}).click()`);await delay(900);
  }
  await wait(`!document.querySelector('${finish}').hidden&&!document.querySelector('${finish}').disabled`);await delay(800);
  const data=await js(`(()=>{const b=document.querySelector('${finish}'),s=getComputedStyle(b),p=document.querySelector('${kind==='posts'?'.kdw-post-phone':'.kdw-store-editor'}').getBoundingClientRect();return {style:Object.fromEntries(['backgroundImage','borderRadius','padding','fontSize','fontWeight','lineHeight','height','boxShadow'].map(k=>[k,s[k]])),gap:(b.getBoundingClientRect().top-p.bottom)/p.width}})()`);
  assert.ok(Math.abs(data.gap-32/390)<.001);results.push({kind,...data});fs.writeFileSync(path.join(report,kind+'.png'),(await w.webContents.capturePage()).toPNG());
 }
 assert.deepEqual(results[0].style,results[1].style);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,results,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,results,errors},null,2));w?.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),180000);
