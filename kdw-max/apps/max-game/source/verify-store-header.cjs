const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
const report=path.resolve(__dirname,'../../../docs/verification-store-header-20261021');
fs.mkdirSync(report,{recursive:true});
app.setPath('userData',path.join(report,'profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}});
 try {
  await w.loadURL('http://127.0.0.1:18752/webgl-v5/client.html?backend=local&view=game&interaction=store');
  for(let i=0;i<200;i++){
   if(await w.webContents.executeJavaScript("!!document.querySelector('.kdw-max-store') && !document.querySelector('.kdw-max-store').inert"))break;
   await new Promise(r=>setTimeout(r,50));
  }
  await new Promise(r=>setTimeout(r,600));
  const result=await w.webContents.executeJavaScript(`(()=>{
   const e=document.querySelector('.kdw-max-store'),h=e.querySelector('.kdw-store-header'),s=e.querySelector('.kdw-store-scroll');
   const p=getComputedStyle(e,'::before'),r=e.getBoundingClientRect();
   return {surface:p.backgroundColor,top:p.top,radius:p.borderRadius,headerBottom:h.getBoundingClientRect().bottom,catalogTop:s.getBoundingClientRect().top,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
  })()`);
  if(result.surface!=='rgb(37, 38, 45)' || Math.abs(result.headerBottom-result.catalogTop)>1)throw Error(JSON.stringify(result));
  fs.writeFileSync(path.join(report,'phone.png'),(await w.webContents.capturePage({x:Math.floor(result.rect.x),y:Math.floor(result.rect.y),width:Math.ceil(result.rect.width),height:Math.ceil(result.rect.height)})).toPNG());
  fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,...result},null,2));
  w.destroy();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'error.txt'),e.stack);w.destroy();app.exit(1);}
});
