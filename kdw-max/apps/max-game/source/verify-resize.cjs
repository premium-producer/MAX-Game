const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {app,BrowserWindow}=require('electron');
const root=path.resolve(__dirname,'..'),reports=path.resolve(root,'../../docs/verification-resize-20261018');fs.mkdirSync(reports,{recursive:true});
app.setPath('userData',path.join(reports,'test-runtime'));
for(const name of ['disable-renderer-backgrounding','disable-background-timer-throttling','disable-backgrounding-occluded-windows'])app.commandLine.appendSwitch(name);
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.on('window-all-closed',()=>{});
const {createPortableServer}=require('../launcher/portable-server.cjs');let host,window;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>window.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await sleep(100);}throw Error('Timeout: '+s);}
app.whenReady().then(async()=>{
 host=createPortableServer({root,config:{id:'kdw-resize-test',version:'resize-test',port:18763,entry:'/'}});await host.listen();
 window=new BrowserWindow({width:1280,height:720,useContentSize:true,show:false,backgroundColor:'#0D001A',webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true}});
 await window.loadURL(host.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
 await wait(`document.documentElement.dataset.gameReady==='true'`);
 await js(`document.querySelector('[data-mission="blogger"]').click()`);
 await wait(`document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);await sleep(800);
 // Keep a retained black shell so image pixels cannot disguise the corner shape.
 await js(`{const style=document.createElement('style');style.textContent='.route-phone .phone-content,.route-phone .phone-camera{visibility:hidden!important}';document.head.append(style);window.dispatchEvent(new Event('resize'));}`);await sleep(500);
 const corners=[];
 for(const [w,h]of [[369.46,800],[700,800],[250,1000],[369.46,800]]){
  await js(`{let style=document.querySelector('#resize-test');if(!style){style=document.createElement('style');style.id='resize-test';document.head.append(style);}style.textContent='.route-phone{width:${w}px!important;height:${h}px!important}';}`);await sleep(350);
  const r=await js(`document.querySelector('.route-phone .demo-app').getBoundingClientRect().toJSON()`);
  const capture=await window.webContents.capturePage({x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)});
  fs.writeFileSync(path.join(reports,'corners-'+w+'x'+h+'.png'),capture.toPNG());
  const image=capture.getBitmap(),size=capture.getSize(),black=(x,y)=>{const i=(y*size.width+x)*4;return image[i]<48&&image[i+1]<15&&image[i+2]<28;};
  const range=(n)=>Array.from({length:n},(_,i)=>i),inset=3;
  const left=range(50).find(x=>black(x,Math.floor(size.height*.7)));
  const top=range(50).find(y=>black(Math.floor(size.width*.3),y));
  const row=range(70).find(x=>black(x,top+inset))-left;
  const col=range(70).find(y=>black(left+inset,y))-top;
  corners.push({w,h,left,top,row,col,rect:r});
  assert.ok(Number.isFinite(row)&&Number.isFinite(col)&&Math.abs(row-col)<=4,'corner stretched at '+w+'x'+h+': '+JSON.stringify({left,top,row,col}));
 }
 fs.writeFileSync(path.join(reports,'corners.json'),JSON.stringify(corners,null,2));
 await js(`document.querySelector('#resize-test').remove()`);
 const results=[];
 const sizes=[[1280,720],[2453,1171],[800,1000],[1920,600],[700,500],[1280,720]];
 for(let i=0;i<sizes.length;i++){
  const [w,h]=sizes[i];window.setContentSize(w,h);await sleep(1200);
  const layout=await js(`(()=>{const e=document.querySelector('.route-phone .demo-app'),r=e.getBoundingClientRect();return {rect:r.toJSON(),radius:getComputedStyle(e).borderTopLeftRadius,phone:document.querySelector('.route-phone').outerHTML.slice(0,1000),arena:document.querySelector('#arena').getBoundingClientRect().toJSON()}})()`);
  fs.writeFileSync(path.join(reports,'resize-'+i+'.png'),(await window.webContents.capturePage()).toPNG());results.push({w,h,...layout});
 }
 for(const [w,h]of [[1300,800],[900,700],[1700,900],[1100,600],[1280,720]]){window.setContentSize(w,h);await sleep(45);}
 await sleep(1200);fs.writeFileSync(path.join(reports,'rapid-final.png'),(await window.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(reports,'results.json'),JSON.stringify({passed:true,bundleSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'www/webgl-v5/app.js'))).digest('hex'),windowResizeCases:results,retainedCornerCases:corners,rapidResize:true},null,2));
 window.destroy();await host.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(reports,'error.txt'),e.stack);window?.destroy();await host?.close();app.exit(1);});
