const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-stream-density-20261020');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=40000){for(let i=0;i<ms/25;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
async function click(selector){await wait(`!!document.querySelector(${JSON.stringify(selector)})`);const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(25);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
setTimeout(()=>app.exit(2),180000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'posts-landing',version:'test',port:18887,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'post-landing-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});

 const metrics=[];
 for(const kind of ['posts','store']){
  await w.loadURL('http://127.0.0.1:18887/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  const selector=kind==='posts'?'#kdw-posts [data-spawn]':'[data-product-spawn]';
  await wait('document.querySelectorAll('+JSON.stringify(selector)+').length>=3');await delay(1200);
  for(const [width,height] of [[1920,1080],[1000,1200]]){
   w.setContentSize(width,height);await delay(700);
   const samples=await js(`(async()=>{const samples=[];for(let i=0;i<110;i++){
    const nodes=[...document.querySelectorAll(`+JSON.stringify(selector)+`)],rects=nodes.filter(n=>getComputedStyle(n).visibility!=='hidden').map(n=>n.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<innerHeight).sort((a,b)=>a.top-b.top);
    let end=0,gap=0;for(const r of rects){gap=Math.max(gap,r.top-end);end=Math.max(end,r.bottom);}gap=Math.max(gap,innerHeight-end);
    samples.push({count:nodes.length,visible:rects.length,gap:gap/innerHeight});await new Promise(r=>setTimeout(r,80));}return samples;})()`);
   assert.ok(samples.every(r=>r.count<=4&&r.count>=3));assert.ok(samples.every(r=>r.visible>=2));
   const maxGap=Math.max(...samples.map(r=>r.gap));assert.ok(maxGap<.4,kind+' gap '+maxGap);metrics.push({kind,width,height,maxGap,minVisible:Math.min(...samples.map(r=>r.visible))});await shot(kind+'-'+width);
  }
  // Select two visible cards in rapid succession; confirm their departure,
  // authoritative publication, and automatic refill without pausing the stream.
  const selected=await js(`(async()=>{const nodes=[...document.querySelectorAll(`+JSON.stringify(selector)+`)].filter(n=>!n.disabled&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight).slice(0,2);const ids=nodes.map(n=>n.dataset.spawn??n.dataset.productSpawn);for(const n of nodes){n.click();await new Promise(r=>setTimeout(r,220));}return ids;})()`);
  assert.ok(selected.length>=1);await delay(1100);await wait('document.querySelectorAll('+JSON.stringify(selector)+').length>=3');
  assert.ok(await js(`!Array.from(document.querySelectorAll(`+JSON.stringify(selector)+`)).some(n=>`+JSON.stringify(selected)+`.includes(n.dataset.spawn??n.dataset.productSpawn))`));
  await shot(kind+'-refilled');checks.push(kind+': populated entry, bounded gaps at wide/tall viewport, rapid selections replenish');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,metrics},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,checks,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
