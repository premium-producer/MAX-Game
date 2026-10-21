const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const fast=process.argv.includes('--double-speed'),compact=fast||process.argv.includes('--compact-field');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/'+(fast?'verification-double-speed-20261020':compact?'verification-compact-field-20261020':'verification-free-flow-20261020'));
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],metrics=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=40000){for(let i=0;i<ms/25;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
async function sample(selector,duration){
 return js(`(async()=>{
  const start=performance.now(),result={frames:0,minVisible:10,maxCount:0,overlapFrames:0,maxPairOverlap:0,sidewaysJumps:0,outOfField:0,maxFrameMs:0},positions=new Set();
  let previous=new Map(),previousTime=performance.now();
  while(performance.now()-start<${duration}){
   const now=performance.now();result.maxFrameMs=Math.max(result.maxFrameMs,now-previousTime);previousTime=now;
   const rows=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(n=>getComputedStyle(n).visibility!=='hidden').map(n=>({id:n.dataset.spawn??n.dataset.productSpawn,r:n.getBoundingClientRect()}));
   result.frames++;result.maxCount=Math.max(result.maxCount,rows.length);result.minVisible=Math.min(result.minVisible,rows.filter(({r})=>r.bottom>0&&r.top<innerHeight).length);
   let overlap=false;
   const phone=document.querySelector('.route-phone .task-media-canvas').getBoundingClientRect();
   const arena=document.querySelector('#arena'),scale=arena.getBoundingClientRect().width/parseFloat(arena.style.width);
   const fieldLeft=Math.min(innerWidth-20,phone.right+64*scale),available=Math.max(1,innerWidth-20-fieldLeft);
   const nominalWidth=Math.max(1,Math.min(440*scale,available*.43,innerHeight*.25/600*440));
   const fieldRight=${compact}?fieldLeft+Math.min(available,nominalWidth*2.1):innerWidth;
   for(const {id,r} of rows){
    positions.add(Math.round(r.x));
    if(previous.has(id)&&Math.abs(previous.get(id)-r.x)>.5)result.sidewaysJumps++;
    if(r.x<fieldLeft-1||r.right>fieldRight+1)result.outOfField++;
   }
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const a=rows[i].r,b=rows[j].r,area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom,innerHeight)-Math.max(a.top,b.top,0));
    const fraction=area/Math.min(a.width*a.height,b.width*b.height);if(fraction>.01)overlap=true;
    result.maxPairOverlap=Math.max(result.maxPairOverlap,fraction);
   }
   if(overlap)result.overlapFrames++;
   previous=new Map(rows.map(({id,r})=>[id,r.x]));await new Promise(requestAnimationFrame);
  }result.horizontalPositions=positions.size;return result;
 })()`);
}
setTimeout(()=>app.exit(2),240000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'free-flow',version:'test',port:18889,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'free-flow-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 for(const kind of ['posts','store']){
  await w.loadURL('http://127.0.0.1:18889/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  const selector=kind==='posts'?'#kdw-posts [data-spawn]':'[data-product-spawn]';
  await wait(`document.querySelectorAll(${JSON.stringify(selector+'[data-flow="free"]')}).length>=8`);await delay(1000);
  for(const [width,height] of (fast?[[1920,1080],[1280,720]]:[[1920,1080],[1000,1200],[1280,720]])){
   w.setContentSize(width,height);await delay(750);
   const m=await sample(selector,fast?4000:12000);
   assert.ok(m.maxCount<=10&&m.maxCount>4,JSON.stringify(m));assert.equal(m.sidewaysJumps,0);assert.equal(m.outOfField,0);
   assert.ok(m.minVisible>=4,JSON.stringify(m));assert.ok(m.horizontalPositions>4,JSON.stringify(m));
   metrics.push({kind,width,height,...m});await shot(kind+'-'+width);console.log('PASS '+kind+' '+width+' '+JSON.stringify(m));
  }
  for(let i=0;i<4;i++){
   await js(`(()=>{const n=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(n=>!n.disabled&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight).sort((a,b)=>Number(['spam','promise','unrelated'].includes(b.dataset.post))-Number(['spam','promise','unrelated'].includes(a.dataset.post)))[0];n?.click();})()`);
   await delay(450);
  }
  const refill=await sample(selector,6500);assert.ok(refill.maxCount<=10&&refill.maxCount>=8);assert.equal(refill.sidewaysJumps,0);metrics.push({kind,afterPicks:refill});await shot(kind+'-refilled');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,metrics,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,metrics,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
