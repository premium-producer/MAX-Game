const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-post-corners-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<900;i++){if(await js(s))return;await delay(30);}throw Error('Timeout '+s);}
async function click(s){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return n&&!n.hidden&&!n.disabled&&!n.closest('[inert]')})()`);await js(`document.querySelector(${JSON.stringify(s)}).click()`);}
async function active(id){await wait(`document.querySelector('[data-bn-screen="${id}"]')&&!document.querySelector('[data-bn-screen="${id}"]').inert`);await delay(350);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'post-corners',version:'test',port:18906,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1450,height:900,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 for(const type of ['flowers','cafe']){
  if(type==='flowers'){
   await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await click('[data-idle-mission=business]');
   await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
   const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
   w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
   await active('business.platform.business-type');await click('[data-bn-action="business.platform.choose-flowers"]');await active('business.platform.login');await click('.kdw-task-skip:not([hidden])');
   for(const id of ['business.channel.create','business.channel.continue','business.channel.open','business.channel.setup','business.channel.details','business.channel.description','business.channel.type','business.channel.publish']){await active(id);await click('.bn-surface [data-bn-action]');}
  }else await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction=posts');
  await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
  await wait("[...document.querySelectorAll('.kdw-falling-post')].some(n=>!n.disabled&&n.getBoundingClientRect().top>50&&n.getBoundingClientRect().bottom<innerHeight)");
  await js(`window.cornerFrames=[];window.sampleCorners=true;function sample(){if(!window.sampleCorners)return;const f=document.querySelector('#kdw-posts .kdw-product-flight'),p=document.querySelector('.kdw-feed-photo');if(f&&p){const names=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'],rect=p.getBoundingClientRect(),scale=rect.width/p.offsetWidth,style=getComputedStyle(f);window.cornerFrames.push({phase:f.dataset.flightPhase,docked:!!f.dataset.docked,corners:names.map(k=>parseFloat(style[k])*(f.dataset.docked?scale:1)),target:names.map(k=>parseFloat(getComputedStyle(p)[k])*scale),native:names.map(k=>parseFloat(getComputedStyle(p)[k])),scale});}requestAnimationFrame(sample)}sample();[...document.querySelectorAll('.kdw-falling-post')].find(n=>!n.disabled&&n.getBoundingClientRect().top>50&&n.getBoundingClientRect().bottom<innerHeight).click();`);
  await wait("!!document.querySelector('#kdw-posts .kdw-product-flight[data-docked]')");
  fs.writeFileSync(path.join(report,type+'-landing.png'),(await w.webContents.capturePage()).toPNG());
  await wait("!document.querySelector('#kdw-posts .kdw-product-flight')");await js('window.sampleCorners=false');
  const frames=await js('window.cornerFrames'),landing=frames.find(f=>f.docked),last=frames.filter(f=>!f.docked).at(-1);
  assert.ok(last&&landing,'both flight and landing sampled');assert.deepEqual(landing.native,[18,18,0,0]);
  const jump=Math.max(...landing.corners.map((r,i)=>Math.abs(r-last.corners[i])));assert.ok(jump<.2,'corner jump at docking: '+jump);
  for(const f of frames.filter(f=>f.docked))assert.ok(f.corners.every((r,i)=>Math.abs(r-f.target[i])<.01),'landed clone matches native corners');
  assert.ok(frames.every(f=>f.corners.slice(0,2).every(r=>r>0)),'upper corners must never become square');
  fs.writeFileSync(path.join(report,type+'-frames.json'),JSON.stringify(frames));
  fs.writeFileSync(path.join(report,type+'-settled.png'),(await w.webContents.capturePage()).toPNG());checks.push({type,frames:frames.length,scale:landing.scale,dockingCornerJump:jump,native:landing.native});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));
 w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w)w.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),180000);
