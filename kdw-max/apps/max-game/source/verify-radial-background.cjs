const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-radial-background-20261018');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.commandLine.appendSwitch('force-device-scale-factor','1');app.commandLine.appendSwitch('disable-renderer-backgrounding');
let w,server;const errors=[],missing=[],checks=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await delay(100);}throw Error('Timeout '+s);}
const shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'living-background-test',version:'R9',port:18771,entry:'/'},onMissing:url=>missing.push(url)});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');await wait("document.documentElement.dataset.gameReady==='true'&&document.documentElement.dataset.backgroundReady==='true'");checks.push('LumiCells shaders compile and background becomes ready');
 await js("document.querySelector('[data-mission=business]').click()");await wait("document.documentElement.dataset.kdwScreen==='business.platform.business-type'&&document.querySelector('.journey-zone').dataset.revealPhase==='task'");await delay(2000);
 await shot('game');await js("document.querySelector('#arena').style.visibility='hidden'");
 const scale=await js("document.querySelector('#arena').style.transform"),frames=[];
 for(let i=0;i<3;i++){await shot('phase-'+i);frames.push((await w.webContents.capturePage({x:50,y:100,width:1200,height:180})).toBitmap());if(i<2)await delay(2000);}
 const difference=(a,b)=>{let sum=0,n=0;for(let i=0;i<a.length;i+=16){sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);n+=3;}return sum/n;};
 const motion=[difference(frames[0],frames[1]),difference(frames[1],frames[2])];assert.ok(motion.every(n=>n>1),JSON.stringify(motion));assert.equal(await js("document.querySelector('#arena').style.transform"),scale);checks.push('visible background changes over both two-second intervals; foreground scale stays fixed');
 await js("document.querySelector('#arena').style.visibility=''");
 const timing=await js("new Promise(resolve=>{const samples=[];let start,last;function sample(t){start??=t;if(last)samples.push(t-last);last=t;if(t-start<2500)requestAnimationFrame(sample);else resolve(samples)}requestAnimationFrame(sample)})");timing.sort((a,b)=>a-b);
 for(const [width,height] of [[1280,720],[2450,1077]]){w.setContentSize(width,height);await delay(700);assert.equal(await js("document.documentElement.dataset.backgroundReady"),'true');await shot('resize-'+width+'x'+height);checks.push('background remains ready at '+width+'x'+height);}
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundleSha256:JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,checks,motionMeanRgbDelta:motion,frameIntervalMs:{median:timing[Math.floor(timing.length*.5)],p95:timing[Math.floor(timing.length*.95)],samples:timing.length},errors,missing},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors,missing},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
