const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-screen-continue-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));
app.commandLine.appendSwitch('force-device-scale-factor','1');app.on('window-all-closed',()=>{});
let w,server,bundle;const checks=[],errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let n=0;n<250;n++){if(await js(s))return;await delay(100);}throw Error('Timeout: '+s);}
const ready="document.querySelector('.journey-zone')?.dataset.revealPhase==='task'&&Number(document.querySelector('.journey-zone').dataset.contentPresence??1)>.97&&!document.querySelector('.route-phone')?.inert";
async function point(selector){return js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);}
function mouse(type,p){w.webContents.sendInputEvent({type,button:'left',clickCount:1,...p});}
async function click(selector){const p=await point(selector);mouse('mouseMove',p);mouse('mouseDown',p);mouse('mouseUp',p);await delay(200);}
async function state(){return js("({screen:document.documentElement.dataset.kdwScreen,actions:[...document.querySelectorAll('.route-phone [data-answer]')].map(b=>({id:b.dataset.answer,disabled:b.disabled,footer:!!b.closest('.client-actions')}))})");}
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'screen-continue-test',version:'R9',port:18890,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
 await wait("document.documentElement.dataset.gameReady==='true'");
 await wait("!!document.querySelector('[data-idle-mission=\"business\"]')");
 await delay(1800);
 await click('[data-idle-mission="business"]');await wait(ready+"&&document.documentElement.dataset.kdwScreen==='business.platform.business-type'");
 await delay(900);await click('.route-phone [data-answer="business.platform.choose-cafe"]');await wait(ready+"&&document.documentElement.dataset.kdwScreen==='business.platform.login'");
 checks.push('normal business choice works');
 // Follow the real route; use image taps for footer actions and original controls for hotspots.
 let heldChecked=false,touchChecked=false,buttonChecked=false;
 for(let step=0;step<24;step++){
  await wait(ready);await delay(250);const before=await state();fs.writeFileSync(path.join(report,'stage.json'),JSON.stringify({step,before,checks},null,2));
  if(await js("!!document.querySelector('#kdw-posts .kdw-post-phone')")){checks.push('channel activity starts without extra input');break;}
  if(before.screen==='business.channel.posts')break;
  const footer=before.actions.filter(a=>a.footer&&!a.disabled);
  if(footer.length===1){
   const p=await point('.route-phone .task-media-canvas');
   if(!heldChecked){
    mouse('mouseMove',p);mouse('mouseDown',p);
    await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before.screen)}&&`+ready);
    const after=(await state()).screen;
    mouse('mouseMove',{x:p.x+25,y:p.y+10});await delay(800);
    assert.equal((await state()).screen,after,'held contact advanced twice');
    mouse('mouseUp',p);heldChecked=true;checks.push('image tap advances once; held/moved pointer does not cascade: '+before.screen);
   }else if(!touchChecked){
    w.webContents.debugger.attach('1.3');
    await w.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:1,radiusY:1}]});
    await w.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before.screen)}`);
    touchChecked=true;checks.push('real touch on image advances: '+before.screen);
   }else if(!buttonChecked){
    await click(`[data-answer="${footer[0].id}"]`);buttonChecked=true;
    await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before.screen)}`);checks.push('original footer button still advances');
   }else{
    mouse('mouseDown',p);mouse('mouseUp',p);
    await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before.screen)}||!!document.querySelector('#kdw-posts .kdw-post-phone')`);checks.push('image continuation: '+before.screen);
   }
  }else{
   const a=before.actions.find(a=>!a.disabled);
   if(!a)break;
   await click(`[data-answer="${a.id}"]`);await delay(650);checks.push('original hotspot/choice: '+a.id);
  }
 }
 assert.ok(heldChecked&&touchChecked&&buttonChecked,'must exercise all continuation input paths');
 // Real DOM geometry exercises the common selector for every mission, without changing authority state.
 const helper=fs.readFileSync(path.join(__dirname,'client/src/kdw-screen-continue.mjs'),'utf8').replace('export function','function');
 const gates=await js(`(()=>{${helper}
 const host=document.createElement('div');document.body.append(host);
 host.innerHTML='<section class="route-phone" data-scene-version="current" data-media-ready-key="current"><div class="task-media-canvas" style="position:fixed;left:10px;top:10px;width:200px;height:300px"></div><div class="client-actions"><button data-answer="go" data-screen-id="current">Продолжить</button></div></section>';
 const shell=host.firstElementChild,canvas=host.querySelector('.task-media-canvas'),b=host.querySelector('button'),out={};
 const pick=(target=canvas,screen='current')=>screenContinuationTarget(host,target,80,80,screen)?.button===b;
 try{
 out.single=pick();out.stale=!pick(canvas,'new');
 b.disabled=true;out.disabled=!pick();b.disabled=false;
 shell.inert=true;out.inert=!pick();shell.inert=false;
 shell.dataset.mediaReadyKey='loading';out.loading=!pick();shell.dataset.mediaReadyKey='current';
 const second=b.cloneNode(true);b.after(second);out.choices=!pick();second.remove();
 const field=document.createElement('input');canvas.append(field);out.field=!pick(field);field.remove();
 const hotspot=document.createElement('button');hotspot.style.cssText='position:fixed;left:50px;top:50px;width:80px;height:80px';canvas.append(hotspot);
 out.hotspot=!pick();hotspot.disabled=true;out.disabledHotspot=!pick();hotspot.remove();
 out.outside=!screenContinuationTarget(host,host,300,300,'current');
 return out;
 }finally{host.remove();}
 })()`);
 for(const [name,passed]of Object.entries(gates))assert.equal(passed,true,name);
 checks.push({commonDeviceActionGuards:gates});
 assert.deepEqual(errors,[]);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle,'build changed during verification');
 fs.writeFileSync(path.join(report,'result.png'),(await w.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,bundle},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){fs.writeFileSync(path.join(report,'failure.html'),await js('document.documentElement.outerHTML'));fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);});
