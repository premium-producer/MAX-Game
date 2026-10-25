const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-lane-flow-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[],metrics=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=40000){for(let i=0;i<ms/25;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
async function sample(selector,duration){
 return js(`(async()=>{
  const start=performance.now(),result={frames:0,overlaps:0,minVisible:4,maxPerColumn:0,maxGap:0,maxGlobalGap:0,maxEnvelope:0};
  while(performance.now()-start<${duration}){
   const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(n=>getComputedStyle(n).visibility!=='hidden');
   const rows=nodes.map(n=>({column:Number(n.dataset.column),r:n.getBoundingClientRect(),n}));
   let globalEnd=0,globalGap=0;
   for(const {r} of [...rows].sort((a,b)=>a.r.top-b.r.top)){
    if(r.bottom<=0||r.top>=innerHeight)continue;globalGap=Math.max(globalGap,r.top-globalEnd);globalEnd=Math.max(globalEnd,r.bottom);
   }
   result.maxGlobalGap=Math.max(result.maxGlobalGap,globalGap/innerHeight,(innerHeight-globalEnd)/innerHeight);
   result.frames++;result.minVisible=Math.min(result.minVisible,rows.filter(({r})=>r.bottom>0&&r.top<innerHeight).length);
   for(const {r,n} of rows)result.maxEnvelope=Math.max(result.maxEnvelope,r.height/(r.width/440));
   for(const column of [0,1]){
    const lane=rows.filter(r=>r.column===column).sort((a,b)=>a.r.top-b.r.top);result.maxPerColumn=Math.max(result.maxPerColumn,lane.length);
    for(let i=1;i<lane.length;i++)if(lane[i-1].r.bottom>lane[i].r.top+.5)result.overlaps++;
    let end=0,gap=0;for(const {r} of lane){if(r.bottom<=0||r.top>=innerHeight)continue;gap=Math.max(gap,r.top-end);end=Math.max(end,r.bottom);}
    result.maxGap=Math.max(result.maxGap,gap/innerHeight,(innerHeight-end)/innerHeight);
   }
   await new Promise(requestAnimationFrame);
  }return result;
 })()`);
}
function validate(m){assert.equal(m.overlaps,0);assert.ok(m.maxPerColumn<=2);assert.ok(m.maxEnvelope<=600,JSON.stringify(m));}
setTimeout(()=>app.exit(2),210000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'lane-flow',version:'test',port:18888,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'lane-flow-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 for(const kind of ['posts','store']){
  await w.loadURL('http://127.0.0.1:18888/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  const selector=kind==='posts'?'#kdw-posts [data-spawn]':'[data-product-spawn]';
  await wait(`document.querySelectorAll(${JSON.stringify(selector+'[data-flow="lanes"]')}).length===4`);await delay(500);
  for(const [width,height] of [[1920,1080],[1000,1200],[1280,720]]){
   w.setContentSize(width,height);
   const m=await sample(selector,10000);validate(m);assert.ok(m.minVisible>=2);assert.ok(m.maxGap<.8);assert.ok(m.maxGlobalGap<.42,JSON.stringify(m));metrics.push({kind,width,height,...m});
   await shot(kind+'-'+width);
  }
  // Measure every authored title/body in the real card styles, including hotel
  // and theater, without truncating copy or adding permanent test DOM.
  const {postBank}=await import(pathToFileURL(path.join(__dirname,'client/src/kdw-posts-model.mjs')));
  const {storeBank}=await import(pathToFileURL(path.join(__dirname,'client/src/kdw-store-rating.mjs')));
  const bank=['cafe','hotel','theater'].flatMap(t=>kind==='posts'?postBank(t):storeBank(t));
  const heights=await js(`(()=>{const original=document.querySelector(${JSON.stringify(selector)}),rows=[];
   for(const data of ${JSON.stringify(bank)}){
    const n=original.cloneNode(true);n.style.visibility='hidden';original.parentElement.append(n);
    if(${JSON.stringify(kind)}==='posts'){n.querySelector('.kdw-fall-title').textContent=data.title;n.querySelector('.kdw-fall-body').textContent=data.body;}
    else {n.querySelector('span:not(.kdw-product-photo)').textContent=data.name;}
    const r=n.getBoundingClientRect();rows.push({id:data.id,height:r.height/(r.width/440)});n.remove();
   }return rows;})()`);
  assert.ok(heights.every(r=>r.height<=600),JSON.stringify(heights));metrics.push({kind,allCopyEnvelope:heights});
  // A held pointer must not pin the DOM while the authoritative lane moves.
  const held=await js(`(()=>{const n=[...document.querySelectorAll(${JSON.stringify(selector)})].find(n=>!n.disabled&&n.getBoundingClientRect().top>0&&n.getBoundingClientRect().bottom<innerHeight-100),r=n.getBoundingClientRect();return {id:n.dataset.spawn??n.dataset.productSpawn,x:r.x+r.width/2,y:r.y+r.height/2,top:r.top};})()`);
  w.webContents.sendInputEvent({type:'mouseDown',button:'left',x:Math.round(held.x),y:Math.round(held.y)});
  await delay(600);
  const top=await js(`(()=>{const n=[...document.querySelectorAll(${JSON.stringify(selector)})].find(n=>(n.dataset.spawn??n.dataset.productSpawn)===${JSON.stringify(held.id)});return n?.getBoundingClientRect().top;})()`);
  assert.ok(top>held.top+5,'held card continues falling');
  // Cancel instead of publishing, then rapid accepted picks in a single lane.
  await js(`document.querySelector('[data-held]')?.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}))`);
  w.webContents.sendInputEvent({type:'mouseUp',button:'left',x:Math.round(held.x+50),y:Math.round(held.y)});
  for(let i=0;i<3;i++){
   await js(`(()=>{const n=[...document.querySelectorAll(${JSON.stringify(selector)})].find(n=>!n.disabled&&n.dataset.column==='0'&&n.getBoundingClientRect().bottom>0);n?.click();})()`);
   await delay(250);
  }
  const refill=await sample(selector,5500);validate(refill);metrics.push({kind,afterPicks:refill});
  assert.equal(await js(`document.querySelectorAll(${JSON.stringify(selector)}).length`),4);
  await shot(kind+'-refilled');checks.push(kind+': geometry, resize, all copy, held pointer, repeated picks and refill');
  console.log('PASS '+kind);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,metrics,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,checks,metrics,errors},null,2));if(w){await shot('failure');w.destroy();}await server?.close();app.exit(1);});
