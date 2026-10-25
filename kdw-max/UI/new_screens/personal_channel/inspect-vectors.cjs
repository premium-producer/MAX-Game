const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData',path.join(__dirname,'prepared/.inspection-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}}),out={};
 await w.loadURL('about:blank');
 for(const n of [2,3,5,10,11,13]){
  const svg=fs.readFileSync(path.join(__dirname,`svg/screen_${n}.svg`),'utf8');
  out[n]=await w.webContents.executeJavaScript(`(()=>{document.body.innerHTML='';const svg=new DOMParser().parseFromString(${JSON.stringify(svg)},'image/svg+xml').documentElement;document.body.append(document.importNode(svg,true));return [...document.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')].filter(e=>!e.closest('defs,clipPath,mask,pattern')).map((e,index)=>{const r=e.getBBox(),m=e.getCTM(),a=new DOMPoint(r.x,r.y).matrixTransform(m),b=new DOMPoint(r.x+r.width,r.y+r.height).matrixTransform(m);return {index,tag:e.tagName,x:a.x,y:a.y,w:b.x-a.x,h:b.y-a.y,fill:getComputedStyle(e).fill};}).filter(r=>r.w>1&&r.h>1);})()`);
 }
 fs.mkdirSync(path.join(__dirname,'prepared'),{recursive:true});fs.writeFileSync(path.join(__dirname,'prepared/vector-inspection.json'),JSON.stringify(out,null,2));w.destroy();app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
