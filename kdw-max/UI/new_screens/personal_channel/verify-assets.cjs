const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out=path.join(__dirname,'prepared'),report=path.resolve(__dirname,'../../../docs/verification-personal-channel-assets-20261020'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-profile'));app.on('window-all-closed',()=>{});
let w;const errors=[];
app.whenReady().then(async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
 for(const s of m.sources)assert.equal(sha(fs.readFileSync(path.resolve(out,s.path))),s.sha256);
 for(const a of m.assets){const b=fs.readFileSync(path.join(out,a.path));assert.equal(b.length,a.bytes);assert.equal(sha(b),a.sha256);}
 w=new BrowserWindow({width:1600,height:1100,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message)});
 await w.loadFile(path.join(out,'preview.html'));
 const result=await w.webContents.executeJavaScript(`(async()=>{const images=[...document.querySelectorAll('.picture img,.channel-header img')];await Promise.all(images.map(i=>i.decode()));const bad=images.filter(i=>!i.naturalWidth).map(i=>i.src);const icons=[...document.querySelectorAll('.icon svg')].map(i=>{const b=i.querySelector('use').getBBox();return {id:i.getAttribute('aria-label'),w:b.width,h:b.height}});document.getElementById('channel-name').value='Кино & <моё> название';document.getElementById('channel-name').dispatchEvent(new Event('input'));const names=[...document.querySelectorAll('[data-name]')].map(e=>e.textContent);return {decoded:images.length,bad,icons,names,insertedHtml:document.querySelectorAll('[data-name] *').length};})()`);
 assert.deepEqual(result.bad,[]);assert.equal(result.decoded,38);assert.equal(result.icons.length,m.totals.vectorIconCount);assert.ok(result.icons.every(i=>i.w>0&&i.h>0));assert.ok(result.names.every(n=>n==='Кино & <моё> название'));assert.equal(result.insertedHtml,0);
 await new Promise(r=>setTimeout(r,100));fs.writeFileSync(path.join(report,'preview-top.png'),(await w.webContents.capturePage()).toPNG());
 await w.webContents.executeJavaScript("document.querySelector('.icon').scrollIntoView({block:'start'})");await new Promise(r=>setTimeout(r,100));fs.writeFileSync(path.join(report,'preview-icons.png'),(await w.webContents.capturePage()).toPNG());
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,sourceHashes:m.sources.length,assetHashes:m.assets.length,totals:m.totals,...result,errors},null,2));
 w.destroy();app.exit(0);
}).catch(e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors},null,2));w?.destroy();app.exit(1)});
