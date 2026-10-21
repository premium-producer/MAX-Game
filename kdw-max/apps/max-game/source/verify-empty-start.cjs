const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-empty-start-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let w,server;
const bounded=(promise,label,ms=15000)=>Promise.race([promise,delay(ms).then(()=>{throw Error('Timeout '+label);})]);
const stage=s=>fs.writeFileSync(path.join(report,'stage.txt'),s);
setTimeout(()=>app.exit(2),90000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'empty-start',version:'test',port:18891,entry:'/'}});await server.listen();
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256;
 for(const kind of ['posts','store']){
  w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
  w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
  const js=s=>bounded(w.webContents.executeJavaScript(s),'script',5000);
  await bounded(w.loadURL('about:blank'),'initial renderer');
  stage(kind+' debugger');w.webContents.debugger.attach('1.3');
  await bounded(w.webContents.debugger.sendCommand('Page.enable'),'Page.enable');
  await bounded(w.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__entry={first:[],frames:0,emptyFrames:0,max:0};const seen=new Set();
   function sample(){
    const out=window.__entry,field=document.querySelector('${kind==='posts'?'.kdw-post-cards':'.kdw-product-stream'}');
    const rows=[...document.querySelectorAll('${kind==='posts'?'#kdw-posts [data-spawn]':'[data-product-spawn]'}')];
    if(field){out.frames++;if(!rows.length)out.emptyFrames++;out.max=Math.max(out.max,rows.length);}
    for(const n of rows){const id=n.dataset.spawn??n.dataset.productSpawn;if(!seen.has(id)){seen.add(id);const r=n.getBoundingClientRect();out.first.push({id,time:performance.now(),top:r.top,bottom:r.bottom,count:rows.length});}}
    requestAnimationFrame(sample);
   }requestAnimationFrame(sample);`}), 'addScript');
  stage(kind+' load');await bounded(w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&interaction='+kind),'load');
  stage(kind+' sampling');
  for(let i=0;i<500;i++){if(await js('window.__entry.first.length>=10'))break;await delay(30);}
  const result=await js('window.__entry');
  assert.ok(result.emptyFrames>0,kind+' never empty');
  assert.ok(result.first.length>=10,JSON.stringify(result));
  assert.equal(result.first[0].count,1);
  assert.ok(result.max<=10);
  for(const row of result.first)assert.ok(row.bottom<=30,'card appeared inside viewport: '+JSON.stringify(row));
  for(let i=1;i<10;i++)assert.ok(result.first[i].time-result.first[i-1].time>250,'startup burst');
  checks.push({kind,...result});
  fs.writeFileSync(path.join(report,kind+'.png'),(await w.webContents.capturePage()).toPNG());w.destroy();w=null;
 }
 assert.deepEqual(errors,[]);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json'))).bundleSha256,bundle);
 fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,bundle,checks,errors},null,2));await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,checks,errors},null,2));if(w)w.destroy();await server?.close();app.exit(1);});
