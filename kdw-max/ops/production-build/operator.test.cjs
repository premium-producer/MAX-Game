const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {createOperator}=require('../../apps/max-game/launcher/operator.cjs');
const {createOperator:createStella}=require('../../apps/stela/launcher/operator.cjs');
const {createCalibration}=require('../../apps/max-game/launcher/operator-calibration.cjs');
const {validateLidarConfig,solveCalibration,startLidar}=require('../../apps/max-game/launcher/lidar.cjs');
async function fixture(kind='max'){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-operator-'));let operator,busy=false,armed=false,cursor=false;
 const server=http.createServer((req,res)=>{if(!operator.handle(req,res)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const output={operatorStatus:()=>({armed,calibration:null}),setCursor:v=>cursor=v,setArmed:v=>armed=v,configureLidar:async()=>{},beginCalibration:async()=>{}};
 operator=kind==='max'?createOperator({root,origin,link:{settings(){}},getOutput:()=>output}):createStella({root,origin,isBusy:()=>busy,getDisplays:()=>[{id:9}]});
 return{root,origin,output,setBusy:v=>busy=v,cursor:()=>cursor,async request(action,input,headers={}){const response=await fetch(origin+'/__kdw/operator/'+action,input===undefined?{}:{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(input)});return{status:response.status,body:await response.json()};},async close(){server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}};
}
test('settings: CAS, strict validation, backup, hostile Origin and GET mutation blocked',async()=>{
 const f=await fixture();try{let s=(await f.request('state')).body;const value=structuredClone(s.settings);value.max.timings.taskDurationSeconds=75;
 assert.equal((await f.request('settings',{revision:s.settingsRevision,value},{Origin:'https://evil.test'})).status,403);
 assert.equal((await f.request('settings')).status,404);
 assert.equal((await f.request('settings',{revision:s.settingsRevision,value})).status,200);
 assert.equal((await f.request('settings',{revision:s.settingsRevision,value})).status,409);
 s=(await f.request('state')).body;value.max.timings.taskDurationSeconds=80;assert.equal((await f.request('settings',{revision:s.settingsRevision,value})).status,200);
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.root,'settings/stand.json.backup'))).max.timings.taskDurationSeconds,75);
 value.max.timings.taskDurationSeconds=-1;assert.equal((await f.request('settings',{revision:s.settingsRevision,value})).status,400);
 assert.equal((await f.request('presentation',{cursorVisible:true})).status,200);assert.equal(f.cursor(),true);
 }finally{await f.close();}
});
test('enabled input does not block editing lidar settings or calibration targets',async()=>{
 const f=await fixture();try{
  f.output.setArmed(true);const s=(await f.request('state')).body;assert.equal(s.output.armed,true);
  assert.equal((await f.request('lidar',{value:s.lidar,revision:s.lidarRevision})).status,200);
  assert.equal((await f.request('calibration/targets',{targets:s.calibrationTargets,revision:s.calibrationTargetsRevision})).status,200);
 }finally{await f.close();}
});

test('active visitor blocks calibration and lidar changes; missing runtime is explicit',async()=>{
 const f=await fixture();try{const dir=path.join(f.root,'data/link');fs.mkdirSync(path.join(dir,'games'),{recursive:true});fs.writeFileSync(path.join(dir,'active.json'),JSON.stringify({gameId:'fixture'}));fs.writeFileSync(path.join(dir,'games/fixture.json'),JSON.stringify({status:'playing'}));assert.equal((await f.request('calibration/start',{})).status,409);const s=(await f.request('state')).body;assert.equal((await f.request('lidar',{value:s.lidar,revision:s.lidarRevision})).status,409);}finally{await f.close();}
});
test('factory diamond becomes corner targets without rewriting measured calibration or custom targets',async()=>{
 const f=await fixture();try{
  const data=path.join(f.root,'data');fs.mkdirSync(data,{recursive:true});
  const legacy=[[1000,768],[1440,500],[1880,768],[1440,1036],[1440,768]],file=path.join(data,'calibration-targets.local.json');fs.writeFileSync(file,JSON.stringify({targets:legacy}));
  const lidarFile=path.join(data,'lidar.local.json'),saved=JSON.stringify({rawPoints:[[0,0],[1,0],[1,1],[0,1]],targetPoints:legacy.slice(0,4)});fs.writeFileSync(lidarFile,saved);
  let s=(await f.request('state')).body;assert.deepEqual(s.calibrationTargets,[[1000,500],[1880,500],[1880,1036],[1000,1036],[1440,768]]);assert.equal(fs.readFileSync(lidarFile,'utf8'),saved);assert.deepEqual(JSON.parse(fs.readFileSync(file)).targets,legacy);
  const custom=[[1100,600],[1800,600],[1800,1000],[1100,1000],[1450,800]];assert.equal((await f.request('calibration/targets',{targets:custom,revision:s.calibrationTargetsRevision})).status,200);s=(await f.request('state')).body;assert.deepEqual(s.calibrationTargets,custom);assert.equal(fs.readFileSync(lidarFile,'utf8'),saved);
 }finally{await f.close();}
});
test('Stella sound settings and display validation preserve private voice files',async()=>{
 const f=await fixture('stela');try{let s=(await f.request('state')).body;assert.equal(s.renderer,'pixels');assert.equal((await f.request('sound',{value:{...s.sound,musicVolume:2},revision:s.revision})).status,400);assert.equal((await f.request('sound',{value:{...s.sound,musicVolume:.3},revision:s.revision})).status,200);assert.equal((await f.request('sound',{value:s.sound,revision:s.revision})).status,409);assert.equal((await f.request('display',{displayId:10})).status,400);f.setBusy(true);assert.equal((await f.request('display',{displayId:9})).status,409);f.setBusy(false);assert.equal((await f.request('display',{displayId:9})).status,200);assert.equal((await f.request('display',{displayId:null})).status,200);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,'data/display.local.json'))),{});}finally{await f.close();}
});
test('calibration requires fresh stable points and independent center verification',()=>{
 let time=1000;const c=createCalibration(solveCalibration,()=>time);assert.throws(()=>c.capture(),/Удерживайте/);
 function point(x,y){for(let i=0;i<4;i++){time+=50;c.point({phase:'move',sourceContactId:'1',x,y});}}
 for(const [x,y]of [[0,0],[1,0],[1,1],[0,1]]){point(x,y);c.capture();}
 assert.throws(()=>c.result(),/четыре/);point(.1,.1);assert.throws(()=>c.capture(),/центре/);c.point({phase:'up'});point(.5,.5);c.capture();assert.equal(c.status().complete,true);assert.equal(c.result().rawPoints.length,4);
 const stale=createCalibration(solveCalibration,()=>time);for(let i=0;i<4;i++)stale.point({phase:'move',x:0,y:0});time+=500;assert.throws(()=>stale.capture(),/свежие/);
});
test('lidar config rejects bad endpoints, folded quadrilaterals and uncalibrated enable',()=>{
 const value={enabled:false,bindAddress:'127.0.0.1',sourceAddress:'127.0.0.1',port:19001,timeoutMs:350,width:3072,height:1536,rawPoints:null,targetPoints:null};assert.deepEqual(validateLidarConfig(value),value);assert.throws(()=>validateLidarConfig({...value,enabled:true}));assert.throws(()=>validateLidarConfig({...value,sourceAddress:'https://host'}));assert.throws(()=>validateLidarConfig({...value,rawPoints:[[0,0],[1,1],[0,1],[1,0]],targetPoints:[[0,0],[1,0],[1,1],[0,1]]}));
});
test('calibration receiver can bind and close without a measured map or touch injection',async()=>{
 const {createSocket}=require('node:dgram'),socket=createSocket('udp4');await new Promise(r=>socket.bind(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const config={enabled:false,bindAddress:'127.0.0.1',sourceAddress:'127.0.0.1',port,timeoutMs:350,width:3072,height:1536,rawPoints:null,targetPoints:null};const r=await startLidar({config,calibrating:true,log:()=>{},contents:{debugger:{attach(){throw Error('Must not inject')}}},active:()=>false});assert.equal(r.snapshot().bound,true);await r.close();for(let i=0;i<4;i++){const next=await startLidar({config,calibrating:true,log:()=>{},active:()=>false});assert.equal(next.snapshot().bound,true);await next.close();}
});
