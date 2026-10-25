const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-sidebar-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.on('window-all-closed',()=>{});const delay=ms=>new Promise(r=>setTimeout(r,ms));let w,server;
const checks=[],errors=[],js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<350;i++){if(await js(s))return;await delay(80);}throw Error('Timeout: '+s);}
const ready="document.querySelector('.journey-zone')?.dataset.revealPhase==='task'&&Number(document.querySelector('.journey-zone').dataset.contentPresence??1)>.97&&!document.querySelector('.route-phone')?.inert";
async function click(selector){
 await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(250);
}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 server=createPortableServer({root,config:{id:'business-sidebar-test',version:'test',port:18893,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
 await wait("document.documentElement.dataset.gameReady==='true'&&!!document.querySelector('[data-idle-mission=\"business\"]')");await delay(1800);
 await click('[data-idle-mission="business"]');await wait("document.documentElement.dataset.kdwScreen==='business.platform.business-type'&&"+ready);await delay(900);
 await click('[data-answer="business.platform.choose-cafe"]');
 await wait("document.documentElement.dataset.kdwScreen==='business.platform.login'&&"+ready);
 for(let i=0;i<20;i++){
  await wait(ready);await delay(250);
  const s=await js("document.documentElement.dataset.kdwScreen");
  if(s==='business.channel.continue')break;
  const id=await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled)?.dataset.answer");
  assert.ok(id,'missing action on '+s);await click(`[data-answer="${id}"]`);
  await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(s)}`);
 }
 await wait("document.documentElement.dataset.kdwScreen==='business.channel.continue'&&"+ready);await delay(600);
 assert.ok(await js("!!document.querySelector('.route-phone img[src*=\"business-channel-menu.svg\"]')"),'corrected asset not used in actual route');
 const pixels=await js(`(async()=>{
 const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 const [before,after]=await Promise.all([load('/assets/figma-20261003/296-17579.png'),load('/assets/kdw-native/business-channel-menu.svg')]);
 const canvas=document.createElement('canvas');canvas.width=before.naturalWidth;canvas.height=before.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});
 c.drawImage(before,0,0);const a=c.getImageData(0,0,canvas.width,canvas.height).data;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(after,0,0);const b=c.getImageData(0,0,canvas.width,canvas.height).data;
 const ys=[156,222,288,354,861,928],changed=ys.map(()=>0);let outside=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const p=(y*canvas.width+x)*4;if(a[p]===b[p]&&a[p+1]===b[p+1]&&a[p+2]===b[p+2]&&a[p+3]===b[p+3])continue;const n=ys.findIndex(v=>x>=48&&x<99&&y>=v-24&&y<v+24);if(n<0)outside++;else changed[n]++;}
 return {width:canvas.width,height:canvas.height,outside,changed};
 })()`);
 assert.equal(pixels.outside,0,'changed pixels outside six menu glyphs');assert.ok(pixels.changed.every(n=>n>500));checks.push(pixels);
 fs.writeFileSync(path.join(report,'screen.png'),(await w.webContents.capturePage()).toPNG());
 const id=await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled)?.dataset.answer");
 await click(`[data-answer="${id}"]`);await wait("document.documentElement.dataset.kdwScreen!=='business.channel.continue'&&"+ready);
 checks.push({originalActionWorks:true,nextScreen:await js("document.documentElement.dataset.kdwScreen")});
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));
 w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w){fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);});
