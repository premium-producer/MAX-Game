const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {app,BrowserWindow}=require('electron');
const styleReview=process.argv.includes('--style-review');
const root=path.resolve(__dirname,'..'),reports=path.resolve(root,styleReview?'../../docs/verification-link-style-20261018':'../../docs/verification-links-20261018');fs.mkdirSync(reports,{recursive:true});
app.setPath('userData',path.join(reports,'test-runtime'));
for(const name of ['disable-renderer-backgrounding','disable-background-timer-throttling','disable-backgrounding-occluded-windows'])app.commandLine.appendSwitch(name);
app.commandLine.appendSwitch('force-device-scale-factor','1');app.on('window-all-closed',()=>{});
const {createPortableServer}=require('../launcher/portable-server.cjs');let host,window;const errors=[],missing=[],checks=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>window.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await sleep(100);}throw Error('Timeout: '+s);}
async function capture(name){fs.writeFileSync(path.join(reports,name+'.png'),(await window.webContents.capturePage()).toPNG());}
app.whenReady().then(async()=>{
 host=createPortableServer({root,config:{id:'kdw-links-test',version:'links-test',port:18764,entry:'/'},onMissing:url=>missing.push(url)});await host.listen();
 window=new BrowserWindow({width:1435,height:697,useContentSize:true,show:false,backgroundColor:'#0D001A',webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true}});
 window.webContents.on('console-message',(event,details,message)=>{const row=details&&typeof details==='object'?details:typeof event?.message==='string'?event:{level:details,message};if(row.level===3||row.level==='error')errors.push(row.message);});
 for(const mission of ['business','blogger']){
  await window.loadURL(host.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait(`document.documentElement.dataset.gameReady==='true'`);
  await js(`document.querySelector('[data-mission="${mission}"]').click()`);await wait(`document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);await sleep(700);
  for(const [w,h]of (styleReview?[[1435,697],[2450,1077]]:[[1435,697],[2450,1077],[1920,600],[800,1000],[1435,697]])){
   window.setContentSize(w,h);await sleep(180);await capture(`${mission}-${w}x${h}-early`);await sleep(650);
   const state=await js(`(()=>{const host=document.querySelector('.journey-zone'),r=document.querySelector('.route-phone .demo-app').getBoundingClientRect();return {links:Number(host.dataset.phoneInputLinks),phone:r.toJSON(),width:innerWidth,height:innerHeight}})()`);
   assert.equal(state.links,5);assert.ok(state.phone.left>=-1&&state.phone.right<=w+1);checks.push({mission,w,h,...state});await capture(`${mission}-${w}x${h}`);
  }
  if(!styleReview){for(const [w,h]of [[1000,700],[2000,800],[1300,600],[2450,1077]]){window.setContentSize(w,h);await sleep(35);}
  await capture(mission+'-rapid-early');await sleep(900);await capture(mission+'-rapid-settled');}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 fs.writeFileSync(path.join(reports,'results.json'),JSON.stringify({passed:true,bundleSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'www/webgl-v5/app.js'))).digest('hex'),checks,rapidResize:!styleReview,errors,missing},null,2));
 window.destroy();await host.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(reports,'error.txt'),e.stack);window?.destroy();await host?.close();app.exit(1);});
