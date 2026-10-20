const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-card-surfaces-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=45000){for(let i=0;i<ms/100;i++){if(await js(s))return;await delay(100);}throw Error('Timeout '+s);}
setTimeout(()=>app.exit(2),120000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'cards',version:'test',port:18777,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'cards-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 for(const kind of ['store','posts']){
  await w.loadURL('http://127.0.0.1:18777/webgl-v5/client.html?backend=local&view=game&interaction='+kind);
  const selector=kind==='store'?'[data-product-spawn]':'[data-spawn]';
  await wait(`[...document.querySelectorAll('${selector}')].filter(n=>!n.disabled&&n.getBoundingClientRect().top>60&&n.getBoundingClientRect().bottom<innerHeight-30).length>=2`);
  await shot(kind+'-scene');
  // Freeze two clones for a reproducible overlap inspection; gameplay stays live.
  const box=await js(`(()=>{
   const source=[...document.querySelectorAll('${selector}')],host=document.querySelector('${kind==='store'?'#kdw-interactions':'#kdw-posts'}');
   const field=document.createElement('div');field.id='card-review';field.className='${kind==='store'?'kdw-product-stream':'kdw-post-cards'}';field.style.zIndex='30';host.append(field);
   for(let i=0;i<2;i++){const n=source[i].cloneNode(true);for(const a of [...n.attributes])if(a.name.startsWith('data-'))n.removeAttribute(a.name);n.disabled=false;n.id='review-'+i;
    n.style.cssText=${JSON.stringify(kind==='store'?"position:absolute;left:80px;top:90px;width:440px;transform:scale(.75);transform-origin:0 0;":"position:absolute;left:80px;top:90px;width:330px;font-size:.75px;--u:.75px;transform:none;")};
    if(i===1){n.style.left='160px';n.style.top='240px';n.style.zIndex='-1';}field.append(n);}
   const n=field.firstElementChild,r=n.getBoundingClientRect(),c=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,border:c.borderTopWidth,background:c.backgroundColor,font:c.fontFamily};
  })()`);
  assert.equal(box.border,'0px');assert.equal(box.background,'rgb(13, 0, 26)');assert.ok(box.font.includes('Max Sans'));
  await delay(200);await shot(kind+'-overlap');
  const point={x:Math.round(box.x+box.width/2),y:Math.floor(box.y+box.height-7),width:1,height:1};
  const before=(await w.webContents.capturePage(point)).toBitmap();
  await js("document.querySelector('#review-1').style.background='#ff0000';document.querySelector('#review-1').style.filter='brightness(2)'");await delay(150);
  const after=(await w.webContents.capturePage(point)).toBitmap();
  assert.deepEqual(after,before);checks.push(kind+': opaque caption masks overlapping card; no hairline border; MAX typography');
  await js("document.querySelector('#card-review').remove()");
  await wait(`[...document.querySelectorAll('${selector}')].some(n=>!n.disabled&&n.getBoundingClientRect().top>60&&n.getBoundingClientRect().bottom<innerHeight-30)`);
  await js(`document.querySelectorAll('${selector}');[...document.querySelectorAll('${selector}')].find(n=>!n.disabled&&n.getBoundingClientRect().top>60&&n.getBoundingClientRect().bottom<innerHeight-30).click()`);
  await wait(kind==='store'?"document.querySelector('.kdw-slot-content')&&!document.querySelector('.kdw-product-flight')":"document.querySelector('.kdw-feed-post')&&!document.querySelector('.kdw-post-flight')");
  await delay(500);await shot(kind+'-selected');checks.push(kind+': selection, flight and phone entry preserved');
  w.setContentSize(1200,800);await delay(600);await shot(kind+'-compact');w.setContentSize(1600,1000);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors,checks},null,2));if(w){await shot('failure');w.destroy();}if(server)await server.close();app.exit(1);});
