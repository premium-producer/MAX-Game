const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-visitor-details-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,server;const errors=[],js=s=>w.webContents.executeJavaScript(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(s){fs.writeFileSync(path.join(report,'stage.txt'),s);for(let i=0;i<450;i++){if(await js(s))return;await delay(100);}throw Error('Timeout: '+s);}
const stable="document.querySelector('.kdw-task-skip:not([hidden])')&&(!document.querySelector('.journey-zone').dataset.contentPhase||document.querySelector('.journey-zone').dataset.contentPhase==='idle')";
async function click(s){await js(`document.querySelector(${JSON.stringify(s)}).click()`);await delay(400);}
app.whenReady().then(async()=>{try{
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 const details=JSON.parse(fs.readFileSync(path.join(__dirname,'client/src/kdw-visitor-details-assets.json')));
 const {createKdwCatalog}=await import('./client/src/kdw-interactions-model.mjs');const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(__dirname,'client/src/reviewed-content/mission-catalog.json'))));
 server=createPortableServer({root,config:{id:'visitor-details-test',version:'test',port:18896,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1500,height:1000,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error'||d.level===3)errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/r9-build.json');
 const rows=Object.entries(details.screens).map(([id,key])=>{const a=details.assets[key],s=catalog.assets[details.sourcePins[id].assetId];return {id,path:a.path,source:s.path,region:details.regions[id]};});
 const pixels=await js(`(async()=>{
 const rows=${JSON.stringify(rows)},load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 document.body.innerHTML='';Object.assign(document.body.style,{margin:'0',padding:'16px',background:'#130b28',display:'flex',flexWrap:'wrap',gap:'16px',fontFamily:'sans-serif',color:'white'});const result=[];
 for(const row of rows){const [before,after]=await Promise.all([load('/'+row.source),load('/'+row.path)]);const c=document.createElement('canvas');c.width=before.naturalWidth;c.height=before.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(before,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(after,0,0,c.width,c.height);const b=ctx.getImageData(0,0,c.width,c.height).data;let outside=0,inside=0;
 const r=row.region,allowed=(x,y)=>r.kind==='avatar'?Math.hypot(x-r.cx,y-r.cy)<=r.r+1&&y>=(r.visibleFrom??0)-1:r.patches.some(p=>x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const p=(y*c.width+x)*4;if(a[p+3]===0&&b[p+3]===0)continue;if([0,1,2,3].some(k=>a[p+k]!==b[p+k])){if(allowed(x+.5,y+.5))inside++;else outside++;}}
 const item=document.createElement('div'),label=document.createElement('p');label.textContent=row.id;item.style.width=r.kind==='avatar'?'300px':'440px';item.append(label);
 if(r.kind==='avatar'){const zoom=document.createElement('canvas');zoom.width=240;zoom.height=160;zoom.getContext('2d').drawImage(c,r.cx-r.r*2,r.cy-r.r*2,r.r*5,r.r*3.5,0,0,240,160);item.append(zoom);}else{after.style.width='440px';item.append(after);}
 document.body.append(item);result.push({id:row.id,outside,inside,rendered:c.toDataURL()});}
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return result;})()`);
 for(const p of pixels){fs.writeFileSync(path.join(report,p.id+'.png'),Buffer.from(p.rendered.split(',')[1],'base64'));delete p.rendered;}fs.writeFileSync(path.join(report,'pixels.json'),JSON.stringify(pixels,null,2));fs.writeFileSync(path.join(report,'gallery.png'),(await w.webContents.capturePage()).toPNG());for(const p of pixels){assert.equal(p.outside,0,p.id);assert.ok(p.inside>10,p.id);}
 const route=[];await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait("!!document.querySelector('[data-idle-mission=\"business\"]')");await delay(1600);await click('[data-idle-mission="business"]');await wait(stable);await delay(600);await click('[data-answer="business.platform.choose-cafe"]');await wait("document.documentElement.dataset.kdwScreen==='business.platform.login'");
 for(let i=0;i<30;i++){
  await wait(stable);await delay(600);const s=await js("({id:document.documentElement.dataset.kdwScreen,src:document.querySelector('.route-phone img')?.getAttribute('src')})");route.push(s);
  if(s.id==='business.bot.ready')break;
  if(s.id==='business.channel.result'){await click('.kdw-task-skip');await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(s.id)}`);continue;}
  const action=await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled)?.dataset.answer");assert.ok(action,s.id);await click(`[data-answer="${action}"]`);await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(s.id)}`);
 }
 for(const row of rows.filter(r=>r.region.kind==='avatar'))assert.ok(route.some(r=>r.id===row.id&&r.src?.includes(row.path)),row.id);
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait("!!document.querySelector('[data-idle-mission=\"communication\"]')");await delay(1600);await click('[data-idle-mission="communication"]');await wait(stable);await delay(700);assert.ok(await js("document.querySelector('.route-phone img')?.getAttribute('src').includes('visitor-details/communication-call-chat.svg')"));fs.writeFileSync(path.join(report,'chat-in-game.png'),(await w.webContents.capturePage()).toPNG());
 assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,pixels,route,times:details.times,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));w?.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),300000);
