const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const registrationOnly=process.argv.includes('--registration-only');
const motionOnly=process.argv.includes('--motion-only');
const storeButton=process.argv.includes('--store-button');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-all-20261022',registrationOnly?'registration':motionOnly?'motion':storeButton?'store-button':'');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],screens=[],games=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<1200;i++){if(await js(s))return;await delay(50);}throw Error('Timeout '+s);}
async function click(selector){await wait(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});return n&&!n.disabled&&!n.closest('[inert],[hidden]')})()`);const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);w.webContents.sendInputEvent({type:'mouseMove',...p});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
async function shot(name){fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());}
async function screen(sector,id){const selector=`[data-bn-screen="${id}"]`;
 await wait(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),img=n?.querySelector('[data-business-asset]');return n&&!n.inert&&Number(n.style.opacity)>.97&&img?.complete&&img.naturalWidth>0&&!n.querySelector('.bn-error').textContent})()`);
 await delay(650);const info=await js(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});return{step:Number(n.querySelector('[data-business-step]').dataset.businessStep),business:n.dataset.business,asset:n.querySelector('[data-business-asset]').dataset.businessAsset,buttons:[...n.querySelectorAll('[data-bn-action]')].map(b=>({label:b.ariaLabel,rect:b.getBoundingClientRect().toJSON()}))}})()`);
 assert.equal(info.business,sector);screens.push({sector,id,...info});await shot(sector+'-'+info.step);
 if(motionOnly&&info.step===12)await js(`window.motionFrames=[];window.motionStart=performance.now();function sample(){const p=document.querySelector('.route-phone'),h=p?.closest('.journey-zone'),a=document.querySelector('.kdw-post-phone'),r=p?.getBoundingClientRect(),c=p?.querySelector('.task-media-canvas')?.getBoundingClientRect();motionFrames.push({t:performance.now()-motionStart,key:p?.dataset.sceneVersion,w:r?.width,h:r?.height,cw:c?.width,alpha:h?.dataset.contentPresence,phase:h?.dataset.contentPhase,overlay:a?.style.opacity,hidden:document.querySelector('#kdw-posts')?.hidden,aw:a?.getBoundingClientRect().width});if(performance.now()-motionStart<6500)requestAnimationFrame(sample)}requestAnimationFrame(sample)`);
 await click(selector+' [data-bn-action]');
}
async function game(sector,kind){
 const finish=kind==='posts'?'[data-post-finish]':'.kdw-store-actions [data-kdw-submit]';await wait(`document.querySelector('${finish}')`);
 if(kind==='posts'){const name={cafe:'Кофейня',flowers:'Цветочный магазин',auto:'Автомастерская'}[sector];await wait(`document.querySelector('.kdw-post-identity')?.innerText.includes(${JSON.stringify(name)})`);}
 const goodPosts={cafe:['coffee-duo','hours','menu','breakfast','space'],flowers:['bouquet','hours','care','delivery','florist'],auto:['service','hours','care','oil','parts']}[sector];
 const good=kind==='posts'?`[...document.querySelectorAll('.kdw-falling-post')].find(n=>!n.disabled&&${JSON.stringify(goodPosts)}.includes(n.dataset.post)&&n.dataset.flowEntry==='admitted')`:`[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled&&!${JSON.stringify(sector==='auto'?['bouquet','coffee']:['engine-oil','drill'])}.includes(n.dataset.kdwProduct)&&n.dataset.flowEntry==='admitted')`;
 await delay(2500);await shot(sector+'-'+kind+'-playing');
 for(let i=0;i<30;i++){if(await js(`!document.querySelector('${finish}').hidden`))break;await wait(`!!(${good})`);await js(`(${good}).click()`);await delay(1200);}
 await wait(`!document.querySelector('${finish}').hidden&&!document.querySelector('${finish}').disabled&&!document.querySelector('${finish}').closest('[inert],[hidden]')`);await delay(500);await shot(sector+'-'+kind+'-complete');games.push({sector,kind,completed:true});await click(finish);
}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'business-all',version:'test',port:18915,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 for(const sector of (registrationOnly||motionOnly||storeButton?['auto']:['cafe','flowers','auto'])){
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await click('[data-idle-mission=business]');
  await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
  await click('[data-bn-action="business.platform.choose-'+sector+'"]');
  for(const id of ['business.platform.login','business.platform.profile','business.platform.verification'])await screen(sector,id);
  if(registrationOnly)break;
  // The confirmation retires automatically after its normal visible result.
  await wait("document.querySelector('[data-business-step="+'"4"'+"]')");await shot(sector+'-4');
  for(const id of ['business.channel.create','business.channel.continue','business.channel.open','business.channel.setup','business.channel.details','business.channel.description','business.channel.type','business.channel.publish'])await screen(sector,id);
  if(motionOnly){
   await delay(7000);const frames=await js('motionFrames');fs.writeFileSync(path.join(report,'motion-frames.json'),JSON.stringify(frames));await shot('motion-final');
   const heightChange=Math.abs(frames.at(-1).h-frames[0].h),steps=frames.slice(1).map((f,i)=>Math.abs(f.h-frames[i].h));
   assert.ok(heightChange>50,'The 20% height change was exercised');assert.ok(Math.max(...steps)<heightChange*.3,'No one-frame resize jump');
   assert.ok(frames.some(f=>Number(f.overlay)>.1&&Number(f.overlay)<.9),'Header fade was sampled');
   assert.ok(frames.filter(f=>!f.hidden).every(f=>Math.abs(Number(f.overlay)-Number(f.alpha))<.001),'Overlay shares the screen opacity');
   await game(sector,'posts');await screen(sector,'business.bot.create');break;
  }
  await game(sector,'posts');
  for(const id of ['business.bot.create','business.bot.filled','business.bot.ready','business.bot.result','business.store.dashboard','business.store.settings'])await screen(sector,id);
  await game(sector,'store');await wait("document.querySelector('[data-kdw-restart]')||document.querySelector('.v5-mission-qr')||document.querySelector('[data-restart-mission]')");
  fs.writeFileSync(path.join(report,'progress.json'),JSON.stringify({sector,screens,games,errors},null,2));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,screens,games,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,screens,games,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),900000);

