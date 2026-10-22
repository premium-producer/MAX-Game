const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('url');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-saved-registration-20261022');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let w,server;const errors=[],js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<800;i++){if(await js(s))return;await delay(30);}throw Error('Timeout '+s);}
const database=`new Promise((resolve,reject)=>{const r=indexedDB.open('max-game-local-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})`;
app.whenReady().then(async()=>{try{
 const mod=async p=>import(pathToFileURL(path.join(__dirname,'client/src',p)));const {createKdwCatalog}=await mod('kdw-interactions-model.mjs'),{createMissionModel,dispatchMissionCommand}=await mod('core/mission-core.mjs');
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(__dirname,'client/src/reviewed-content/mission-catalog.json'))));catalog.kdwDevelopment=true;
 const old=structuredClone(catalog),legacy=old.kdwBusinessPlatformLegacy;old.kdwBusinessConfirmation=null;Object.assign(old.tasks['business.platform'].screens,{'business.platform.verification':legacy.verification,'business.platform.ready':legacy.ready});
 server=createPortableServer({root,config:{id:'saved-registration',version:'test',port:18909,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1450,height:900,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 const url=server.origin+'/webgl-v5/client.html?backend=local&view=game';await w.loadURL(url);await wait("document.querySelectorAll('[data-idle-mission]').length===4");
 const key=await js(`(async()=>{const db=await ${database};return new Promise((resolve,reject)=>{const r=db.transaction('sessions').objectStore('sessions').getAllKeys();r.onsuccess=()=>{db.close();resolve(r.result[0])};r.onerror=()=>reject(r.error)})})()`);assert.ok(key?.[1]);
 await w.loadURL(server.origin+'/app.json');
 let model=createMissionModel(old,{sessionId:key[1],rulesRevision:'mission-rules-task-clock-v2'}),serial=0,now=Date.now()-10000;
 function act(type,extra={},internal=false){const r=dispatchMissionCommand(old,model,{schemaVersion:1,type,commandId:'fixture.'+(++serial),sessionId:key[1],contentRevision:old.contentRevision,expectedRevision:model.state.revision,...extra},{now:now++,internal});assert.equal(r.reply.ok,true,r.reply.code);model=r.model;}
 act('OWNER_CHANGED',{active:true},true);act('SELECT_MISSION',{missionId:'business'});act('HOLD_CONFIRMED',{},true);
 for(let i=0;model.state.status==='task'&&i<10;i++){const s=old.tasks[model.state.taskId].screens[model.state.screenId];act('ACT',{screenId:s.screenId,actionId:s.actions[0].actionId});}
 assert.equal(model.state.screenId,'business.platform.ready');now=model.state.resultReadyAt;act('ADVANCE_RESULT');act('RESTART_TASK',{taskId:'business.platform'});act('OWNER_CHANGED',{active:false},true);
 const saved={version:0,record:{schemaVersion:2,mission:model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:now}};
 await js(`(async()=>{const db=await ${database};await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(${JSON.stringify(saved)},${JSON.stringify(key)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()})()`);
 for(let i=0;i<2;i++){await w.loadURL(url);await wait("document.querySelectorAll('[data-idle-mission]').length===4");assert.equal(await js("document.body.innerText.includes('INVALID_SAVED_SESSION')"),false);}
 const recovered=await js(`(async()=>{const db=await ${database};return new Promise((resolve,reject)=>{const r=db.transaction('sessions').objectStore('sessions').get(${JSON.stringify(key)});r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>reject(r.error)})})()`);
 assert.deepEqual(recovered.record.mission.receipts.slice(0,model.receipts.length),model.receipts,'accepted history preserved');assert.equal(recovered.record.mission.state.progress.business.answers.businessType,'cafe');assert.deepEqual(errors,[]);
 await delay(2500);fs.writeFileSync(path.join(report,'recovered.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,reloads:2,preservedReceipts:model.receipts.length,errors},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:false,error:e.stack,errors},null,2));if(w)w.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),120000);
