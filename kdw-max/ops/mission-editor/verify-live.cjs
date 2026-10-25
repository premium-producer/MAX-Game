const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const report=path.resolve(__dirname,'../../docs/verification-editor-20261018');
app.setPath('userData',path.join(report,'live-test-profile'));
const credentials=JSON.parse(fs.readFileSync(require('node:path').resolve(__dirname,'../../private/deployment/max-asset-audit-selectel.json')));
const url='https://futuronika.pro/df/max-asset-audit/editor/';let w;const errors=[];
app.on('login',(event,_web,details,_auth,callback)=>{if(new URL(details.url).origin===new URL(url).origin){event.preventDefault();callback(credentials.username,credentials.password);}});
app.whenReady().then(async()=>{
 const headers={Authorization:'Basic '+Buffer.from(credentials.username+':'+credentials.password).toString('base64')};
 const unauth=await fetch(url);assert.equal(unauth.status,401);
 const catalog=await (await fetch(url+'catalog.json',{headers})).json();assert.equal(catalog.counts.screens,70);
 const bytes=Buffer.from(await (await fetch(url+'app.js',{headers})).arrayBuffer());assert.deepEqual(bytes,fs.readFileSync(path.join(__dirname,'dist/public/editor/app.js')));
 const flow=await (await fetch(url+'api/max-asset-flow',{headers})).json();assert.equal(flow.sourceContentRevision,catalog.contentRevision);assert.equal(flow.tasks.find(t=>t.taskId==='business.store').screens[0].help.text,'Подключим витрину товаров и услуг, чтобы клиенты могли совершать покупки, не выходя из мессенджера');
 w=new BrowserWindow({width:1440,height:1000,show:false,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});await w.loadURL(url);
 for(let i=0;i<150;i++){if(await w.webContents.executeJavaScript("document.documentElement.dataset.auditReady==='true'"))break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(await w.webContents.executeJavaScript("document.documentElement.dataset.auditReady"),'true');assert.equal(await w.webContents.executeJavaScript("document.querySelectorAll('.card').length"),70);assert.match(await w.webContents.executeJavaScript('document.body.innerText'),/Регистрация/);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'live-vps.png'),(await w.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(report,'live-checks.json'),JSON.stringify({passed:true,url,revision:catalog.contentRevision,counts:catalog.counts,resourceCounts:catalog.resourceCounts,appSha256:crypto.createHash('sha256').update(bytes).digest('hex'),unauthenticatedStatus:unauth.status,browserReady:true,errors},null,2));w.destroy();app.exit(0);
}).catch(e=>{fs.writeFileSync(path.join(report,'live-checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));w?.destroy();app.exit(1);});
