const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const report=path.resolve(__dirname,'../../../docs/verification-id-photo-20261022');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'profile'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const server=createPortableServer({root:path.resolve(__dirname,'..'),config:{id:'id-photo-check',version:'test',port:18898,entry:'/'}});await server.listen();
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)errors.push(e.message);});
 const js=s=>w.webContents.executeJavaScript(s);
 async function wait(s){for(let i=0;i<400;i++){if(await js(s))return;await sleep(50);}throw Error('Timeout '+s);}
 try{
  const base=require('./client/src/reviewed-content/mission-catalog.json'),details=require('./client/src/kdw-visitor-details-assets.json'),id='digital-id.create-id.ready',asset=details.assets[details.screens[id]],old=base.assets[base.tasks['digital-id.create-id'].screens[id].assetId];
  const svg=fs.readFileSync(path.join(__dirname,'client/public',asset.path),'utf8'),photo=fs.readFileSync(path.join(__dirname,'client/public/assets/kdw-native/conversation/visitor-placeholder.webp')).toString('base64');
  assert.ok(svg.includes('data:image/webp;base64,'+photo));assert.equal((svg.match(/data-visitor-photo="true"/g)||[]).length,1);
  await w.loadURL(server.origin+'/webgl-v5/r9-build.json');
  const pixels=await js(`(async()=>{const paths=${JSON.stringify([old.path,asset.path])},images=[];
   for(const p of paths){const im=new Image();im.src='/'+p;await im.decode();images.push(im);}
   const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1600;const c=canvas.getContext('2d'),data=images.map(im=>{c.clearRect(0,0,720,1600);c.drawImage(im,0,0,720,1600);return c.getImageData(0,0,720,1600).data});
   let outside=0,inside=0,maxOutsideDelta=0;for(let y=0;y<1600;y++)for(let x=0;x<720;x++){const i=(y*720+x)*4,diff=[0,1,2,3].some(k=>data[0][i+k]!==data[1][i+k]);if(!diff)continue;if(x>=136&&x<=584&&y>=256&&y<=704)inside++;else {outside++;maxOutsideDelta=Math.max(maxOutsideDelta,...[0,1,2,3].map(k=>Math.abs(data[0][i+k]-data[1][i+k])));}}
   document.open();document.write('<html><body></body></html>');document.close();document.body.style.cssText='margin:0;background:#222;display:flex;gap:20px';images.forEach(im=>{im.style.cssText='width:360px;height:800px';document.body.append(im)});return{outside,inside,maxOutsideDelta};})()`);
  assert.ok(pixels.maxOutsideDelta<=1,JSON.stringify(pixels));assert.ok(pixels.inside>10000);
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
  await wait("!!document.querySelector('[data-idle-mission=digital-id]') && !document.querySelector('[data-idle-mission=digital-id]').inert");
  await js("document.querySelector('[data-idle-mission=digital-id]').click()");
  await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
  const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
  w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
  for(const s of ['start','documents','confirm','quick','biometry']){
   const a=`digital-id.create-id.${s}.action-1`;
   await wait(`document.documentElement.dataset.kdwScreen==='digital-id.create-id.${s}' && !!document.querySelector('[data-answer="${a}"]:not(:disabled)') && document.querySelector('.route-phone')?.dataset.gpuReadyKey===document.querySelector('.route-phone')?.dataset.sceneVersion`);
   await sleep(700);await js(`document.querySelector('[data-answer="${a}"]').click()`);
  }
  await wait(`!!document.querySelector('.route-phone img[src*="digital-id-create-id-ready.svg"]') && !document.querySelector('[data-answer="${id}.action-1"]')?.disabled && document.querySelector('.route-phone')?.dataset.gpuReadyKey===document.querySelector('.route-phone')?.dataset.sceneVersion`);
  await sleep(1000);fs.writeFileSync(path.join(report,'game.png'),(await w.webContents.capturePage()).toPNG());
  await js(`document.querySelector('[data-answer="${id}.action-1"]').click()`);
  await wait("document.documentElement.dataset.kdwScreen?.startsWith('digital-id.hotel.')");
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,pixels,asset,errors,continuedTo:await js('document.documentElement.dataset.kdwScreen')},null,2));w.destroy();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'error.txt'),e.stack);fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();app.exit(1);}
});
