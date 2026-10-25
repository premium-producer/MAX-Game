const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {app,BrowserWindow}=require('electron');
const root=path.resolve(__dirname,'..'),label=process.argv.includes('--before')?'before':'after',reports=path.resolve(root,'../../docs/verification-layout-motion-20261018');fs.mkdirSync(reports,{recursive:true});
app.setPath('userData',path.join(reports,'test-runtime-'+label));
for(const key of ['disable-renderer-backgrounding','disable-background-timer-throttling','disable-backgrounding-occluded-windows'])app.commandLine.appendSwitch(key);
app.commandLine.appendSwitch('force-device-scale-factor','1');app.on('window-all-closed',()=>{});
const {createPortableServer}=require('../launcher/portable-server.cjs');let host,win;const errors=[],missing=[],results=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>win.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<600;i++){if(await js(s))return;await sleep(80);}throw Error('Timeout '+s);}
async function probe(){await js(`{window.samples=[];window.recording=true;const frame=()=>{if(!window.recording)return;const host=document.querySelector('.journey-zone'),p=document.querySelector('.route-phone'),a=document.querySelector('#arena');if(p){const scale=a.getBoundingClientRect().width/parseFloat(a.style.width),r=p.getBoundingClientRect(),tiles=[...document.querySelectorAll('[data-object]')].filter(e=>Number(e.dataset.pathPresence)>.95).map(e=>e.querySelector('.tile').getBoundingClientRect()).sort((a,b)=>a.left-b.left);if(tiles.length&&Number(p.dataset.pathPresence)>.95)window.samples.push({t:performance.now(),phase:host?.dataset.revealPhase,content:host?.dataset.contentPhase,width:r.width/scale,gap:(r.left-tiles.at(-1).right)/scale,iconGap:tiles.length>1?(tiles.at(-1).left-tiles.at(-2).right)/scale:null,scale,screen:document.documentElement.dataset.kdwScreen});}requestAnimationFrame(frame)};requestAnimationFrame(frame);}`);}
async function finish(name){const frames=await js('window.recording=false;window.samples');fs.writeFileSync(path.join(reports,label+'-'+name+'.json'),JSON.stringify(frames,null,2));assert.ok(frames.length>20);const result={name,frames:frames.length,minGap:Math.min(...frames.map(f=>f.gap)),maxGap:Math.max(...frames.map(f=>f.gap)),minIconGap:Math.min(...frames.filter(f=>f.iconGap!==null).map(f=>f.iconGap))};results.push(result);fs.writeFileSync(path.join(reports,label+'-'+name+'.png'),(await win.webContents.capturePage()).toPNG());}
app.whenReady().then(async()=>{
 host=createPortableServer({root,config:{id:'layout-motion-test',port:18765,entry:'/'},onMissing:u=>missing.push(u)});await host.listen();
 win=new BrowserWindow({width:1390,height:751,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true}});
 win.webContents.on('console-message',(_e,d)=>{if(d?.level==='error')errors.push(d.message)});
 for(const mission of ['business','blogger']){
  await win.loadURL(host.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait(`document.documentElement.dataset.gameReady==='true'`);await probe();
  await js(`document.querySelector('[data-mission="${mission}"]').click()`);await wait(`document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);await sleep(800);await finish(mission+'-startup');
  await probe();for(const [w,h]of [[1920,600],[2450,1077],[800,1000],[1390,751]]){win.setContentSize(w,h);await sleep(250);}await sleep(900);await finish(mission+'-resize');
  if(mission==='business'){
   await probe();const catalog=JSON.parse(fs.readFileSync(path.join(root,'source/client/src/reviewed-content/mission-catalog.json'))),task=catalog.tasks[catalog.missions.business.taskIds[0]];
   for(const screen of Object.values(task.screens)){
    await wait(`document.documentElement.dataset.kdwScreen===${JSON.stringify(screen.screenId)}&&document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);
    for(let i=0;i<30;i++){await sleep(200);await js(`document.querySelector('.route-phone [data-answer="${screen.actions[0].actionId}"]')?.click()`);if(await js(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(screen.screenId)}`))break;}
   }
   await wait(`document.documentElement.dataset.kdwScreen?.startsWith('business.channel.')&&document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);await sleep(800);await finish('business-screens-handoff');
  }
 }
 const passed=results.every(r=>r.minGap>=124&&r.minIconGap>=124)&&!errors.length&&!missing.length;
 fs.writeFileSync(path.join(reports,label+'-results.json'),JSON.stringify({passed,bundleSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'www/webgl-v5/app.js'))).digest('hex'),results,errors,missing},null,2));
 win.destroy();await host.close();app.exit(label==='before'||passed?0:1);
}).catch(async e=>{fs.writeFileSync(path.join(reports,label+'-error.txt'),e.stack);win?.destroy();await host?.close();app.exit(1);});
