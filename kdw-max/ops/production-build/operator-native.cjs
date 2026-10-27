// Disposable Electron fixture only: real UDP, native Spout and preload overlay.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fixture=path.resolve(process.argv[2]);assert(fixture.endsWith('operator-integration-rc4'));
process.env.NODE_PATH=path.resolve(__dirname,'../../apps/max-game/source/stand-output/vendor');require('module').Module._initPaths();
const osc=require('osc'),udp=require('node:dgram').createSocket('udp4'),origin='http://127.0.0.1:18854';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){const end=Date.now()+45000;while(Date.now()<end){try{const v=await fn();if(v)return v;}catch{}await wait(100);}throw Error('Timed out');}
async function api(action,value){const r=await fetch(origin+'/__kdw/operator/'+action,value===undefined?{}:{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(value)});const v=await r.json();assert(r.ok,JSON.stringify(v));return v;}
const packet=(address,id,x=0,y=0)=>udp.send(Buffer.from(osc.writePacket({address,args:[{type:'i',value:id},...(address==='/delete'?[]:[x,y].map(value=>({type:'f',value})))]},{metadata:true})),19004,'127.0.0.1');
require(path.join(fixture,'launcher/desktop-main.cjs'));
app.whenReady().then(async()=>{try{
 await until(async()=>{const s=await api('state');return s.output?.contentReady&&s.output.backgroundReady;});
 const content=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('client.html'));assert(content);
 const before=fs.readFileSync(path.join(fixture,'data/lidar.local.json'),'utf8');let s=await api('calibration/start',{});assert.equal(s.output.active,false);assert(s.output.lidar.bound);
 await until(()=>content.webContents.executeJavaScript("[...document.querySelectorAll('canvas')].some(c=>c.style.zIndex==='2147483647'&&c.getContext('2d').getImageData(10,10,1,1).data[3]===255)"));
 await api('calibration/cancel',{});assert.equal(fs.readFileSync(path.join(fixture,'data/lidar.local.json'),'utf8'),before);
 s=await api('calibration/start',{});
 let id=10;for(const [x,y] of [[0,0],[1,0],[1,1],[0,1],[.5,.5]]){id++;packet('/create',id,x,y);for(let i=0;i<5;i++){await wait(55);packet('/update',id,x,y);}await wait(30);s=await api('calibration/capture',{});packet('/delete',id);await wait(60);}
 assert(s.output.calibration.complete);s=await api('calibration/save',{revision:s.lidarRevision});assert.equal(s.lidar.enabled,true);assert.equal(s.output.armed,false);assert.equal(s.output.calibration,null);
 await api('presentation',{cursorVisible:true});await api('arm',{armed:true});await wait(200);packet('/create',99,.5,.5);await wait(100);
 const pixel=await content.webContents.executeJavaScript("(()=>{const c=[...document.querySelectorAll('canvas')].find(c=>c.style.zIndex==='2147483647');return [...c.getContext('2d').getImageData(1440,768,1,1).data]})()");assert(pixel[3]>0&&pixel[1]>100);
 packet('/delete',99);await api('arm',{armed:false});await api('presentation',{cursorVisible:false});
 await until(()=>content.webContents.executeJavaScript("(()=>{const c=[...document.querySelectorAll('canvas')].find(c=>c.style.zIndex==='2147483647');return c.getContext('2d').getImageData(1440,768,1,1).data[3]===0})()"));
 fs.writeFileSync(path.join(fixture,'native-test.json'),JSON.stringify({passed:true,calibrationOverlay:true,cancelPreserved:true,fiveOscPoints:true,saveDisarmed:true,cursorPixel:pixel,cleared:true,frames:(await api('state')).output.frames},null,2));udp.close();app.quit();
}catch(e){fs.writeFileSync(path.join(fixture,'native-test.json'),JSON.stringify({passed:false,error:e.stack}));udp.close();app.exit(1);}});
