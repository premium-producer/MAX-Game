const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-business-phone-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w;setTimeout(()=>app.exit(2),30000);
app.whenReady().then(async()=>{try{
 const {createKdwCatalog}=await import('./client/src/kdw-interactions-model.mjs');
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(__dirname,'client/src/reviewed-content/mission-catalog.json'))));
 const task=catalog.tasks['business.channel'];
 assert.equal(task.screens['business.channel.setup'].assetId,'kdw.native.business-channel-phone');
 assert.equal(task.screens['business.channel.details'].assetId,'figma.296-17821');
 const files=['assets/figma-20261003/296-17801.png','assets/figma-20261003/296-17821.png','assets/kdw-native/business-channel-phone.svg'];
 const sources=files.map(f=>'data:image/'+(f.endsWith('.svg')?'svg+xml':'png')+';base64,'+fs.readFileSync(path.join(root,'www',f)).toString('base64'));
 w=new BrowserWindow({width:800,height:900,useContentSize:true,show:false,webPreferences:{offscreen:true,sandbox:true}});
 await w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<html><body style="margin:0;background:#16092c;display:flex;gap:20px;justify-content:center;padding:20px"></body></html>'));
 const pixels=await w.webContents.executeJavaScript(`(async()=>{
 const sources=${JSON.stringify(sources)},load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 const imgs=await Promise.all(sources.map(load));const c=document.createElement('canvas');c.width=720;c.height=1588;const ctx=c.getContext('2d',{willReadFrequently:true});
 const data=imgs.map(i=>{ctx.clearRect(0,0,720,1588);ctx.drawImage(i,0,0);return ctx.getImageData(0,0,720,1588).data;});let outside=0,changed=0,numberMismatch=0;
 for(let y=0;y<1588;y++)for(let x=0;x<720;x++){const p=(y*720+x)*4,inside=x>=30&&x<310&&y>=1188&&y<1220;for(let k=0;k<4;k++){if(data[0][p+k]!==data[2][p+k]){if(inside)changed++;else outside++;}if(inside&&data[1][((y-776)*720+x)*4+k]!==data[2][p+k])numberMismatch++;}}
 for(const i of [imgs[2],imgs[1]]){i.style.width='360px';i.style.height='794px';document.body.append(i);}return {outside,changed,numberMismatch};})()`);
 assert.equal(pixels.outside,0);assert.equal(pixels.numberMismatch,0);assert.ok(pixels.changed>500);
 fs.writeFileSync(path.join(report,'numbers.png'),(await w.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,number:'+7 912 000-00-00',pixels,catalogBindings:{setup:task.screens['business.channel.setup'].assetId,details:task.screens['business.channel.details'].assetId}},null,2));w.destroy();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack},null,2));w?.destroy();app.exit(1);}});
