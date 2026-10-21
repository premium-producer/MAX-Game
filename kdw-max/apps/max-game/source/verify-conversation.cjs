const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-conversation-20261020'),input=path.resolve(root,'../../UI/new_screens/conversation');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,server;const errors=[],js=s=>w.webContents.executeJavaScript(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(s){for(let i=0;i<450;i++){if(await js(s))return;await delay(100);}throw Error('Timeout: '+s);}
const stable="document.querySelector('.kdw-task-skip:not([hidden])')&&(!document.querySelector('.journey-zone').dataset.contentPhase||document.querySelector('.journey-zone').dataset.contentPhase==='idle')";
async function click(s){await js(`document.querySelector(${JSON.stringify(s)}).click()`);await delay(350);}
app.whenReady().then(async()=>{try{
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 server=createPortableServer({root,config:{id:'conversation-photo-test',version:'test',port:18895,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1500,height:940,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/r9-build.json');
 const originals=Array.from({length:7},(_,i)=>'data:image/png;base64,'+fs.readFileSync(path.join(input,`screen_${i+1}@2x.png`)).toString('base64'));
 const map=JSON.parse(fs.readFileSync(path.join(__dirname,'client/public/assets/kdw-native/conversation/manifest.json')));
 const pixels=await js(`(async()=>{
 const originals=${JSON.stringify(originals)},map=${JSON.stringify(map)},load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 document.body.innerHTML='';Object.assign(document.body.style,{margin:'0',padding:'16px',background:'#130b28',display:'flex',gap:'10px',fontFamily:'sans-serif',color:'white'});const result=[];
 for(let n=1;n<=7;n++){
 const [before,after]=await Promise.all([load(originals[n-1]),load('/assets/kdw-native/conversation/screen_'+n+'.svg')]);const s=map.screens[n-1],c=document.createElement('canvas');c.width=before.naturalWidth;c.height=before.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(before,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(after,0,0,c.width,c.height);const b=ctx.getImageData(0,0,c.width,c.height).data;let outside=0,inside=0;const examples=[];
 const [sx,sy,sw,sh]=s.bounds,scale=c.width/360;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const p=(y*c.width+x)*4;if(a[p+3]===0&&b[p+3]===0)continue;const changed=[0,1,2,3].some(k=>a[p+k]!==b[p+k]);if(changed){if(x<Math.floor(sx*scale)-2||x>Math.ceil((sx+sw)*scale)+2||y<sy*scale-2||y>(sy+sh)*scale+2){outside++;if(examples.length<3)examples.push({x,y,a:[...a.slice(p,p+4)],b:[...b.slice(p,p+4)]});}else inside++;}}
 const item=document.createElement('div'),label=document.createElement('p');label.textContent=n+' · '+s.kind;item.style.flex='0 0 196px';after.style.width='196px';after.style.height='auto';item.append(label,after);document.body.append(item);result.push({screen:n,outside,inside,examples,rendered:c.toDataURL()});
 }await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return result;})()`);
 for(const r of pixels){fs.writeFileSync(path.join(report,'screen-'+r.screen+'.png'),Buffer.from(r.rendered.split(',')[1],'base64'));delete r.rendered;}fs.writeFileSync(path.join(report,'pixels.json'),JSON.stringify(pixels,null,2));fs.writeFileSync(path.join(report,'gallery.png'),(await w.webContents.capturePage()).toPNG());for(const r of pixels){assert.equal(r.outside,0,'outside photo area '+r.screen);assert.ok(r.inside>1000);}
 // Verify actual game progression with the new resources; skip only the unaffected reaction task.
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait("!!document.querySelector('[data-idle-mission=\"communication\"]')");await delay(1500);await click('[data-idle-mission="communication"]');await wait(stable);await delay(600);
 const route=[];
 for(let i=0;i<24;i++){
  await wait(stable);await delay(600);const state=await js("({screen:document.documentElement.dataset.kdwScreen,task:document.querySelector('.kdw-task-skip').dataset.skipTask,src:document.querySelector('.route-phone img')?.getAttribute('src')})");route.push(state);
  if(state.screen==='communication.story.ready')break;
  if(state.task==='communication.reaction'){await click('.kdw-task-skip');await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(state.screen)}`);continue;}
  const action=await js("[...document.querySelectorAll('.route-phone [data-answer]')].find(b=>!b.disabled)?.dataset.answer");assert.ok(action,state.screen);await click(`[data-answer="${action}"]`);await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(state.screen)}`);
 }
 assert.equal(route.at(-1).screen,'communication.story.ready');for(let n=1;n<=7;n++)assert.ok(route.some(r=>r.src?.includes('conversation/screen_'+n+'.svg')),'resource missing on route '+n);
 fs.writeFileSync(path.join(report,'story-in-game.png'),(await w.webContents.capturePage()).toPNG());assert.deepEqual(errors,[]);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,pixels,route,errors},null,2));w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));if(w){fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),240000);
