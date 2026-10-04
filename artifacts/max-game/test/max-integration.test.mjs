import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadMissionCatalog,parseMissionCatalog,serializeMissionCatalog} from '../src/mission-config.mjs';
import {evaluateMission} from '../src/mission-evaluation.mjs';
import {screenHold,screenReady} from '../src/screen-connectivity.mjs';
import {collectAssetSources,GAME_FONTS} from '../src/asset-preparation.mjs';
import {loadEarthContours} from '../src/earth-contours.mjs';
import {loadUiShellConfig} from '../src/ui-shell-config.mjs';
import {createGameServer} from '../start.mjs';
const root=new URL('../public/',import.meta.url);
const read=async name=>JSON.parse(await fs.readFile(new URL(name,root),'utf8'));
const fetchLocal=async name=>({ok:true,json:()=>read(name)});
const raw=serializeMissionCatalog(await loadMissionCatalog(undefined,fetchLocal));
for(const m of raw.missions)for(const p of m.topology.paths)p.connection.policy='hybridProjected';
const catalog=parseMissionCatalog(raw);

function route(mission){
 const path=mission.topology.paths[0],vector=({latitude,longitude})=>{const a=latitude*Math.PI/180,b=longitude*Math.PI/180;return [Math.cos(a)*Math.cos(b),Math.sin(a),Math.cos(a)*Math.sin(b)];};
 const a=vector(mission.endpoints[path.from]),b=vector(mission.endpoints[path.to]),angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((v,n,i)=>v+n*b[i],0))));
 return path.steps.map((step,i)=>{const t=(i+1)/(path.steps.length+1),v=a.map((n,j)=>(n*Math.sin((1-t)*angle)+b[j]*Math.sin(t*angle))/Math.sin(angle));return {id:i+1,type:step.type,latitude:Math.asin(v[1])*180/Math.PI,longitude:Math.atan2(v[2],v[0])*180/Math.PI,altitude:step.type==='satellite'?.34:.08,droppedAt:0};});
}
function fixture(mission){const placements=route(mission),path=mission.topology.paths[0],nodes={};[`endpoint:${path.from}`,...placements.map(p=>p.id),`endpoint:${path.to}`].forEach((id,i)=>nodes[id]={x:200+85*i,y:500,radius:60,iconRadius:20,eligible:true});return {placements,nodes,mission:mission.number,timestamp:1000,revision:1,interacting:false,hidden:false};}

for(const mission of catalog.missions)test(`shipped hybrid mission ${mission.number}: valid route succeeds, broken coverage/order never succeeds`,()=>{
 const snapshot=fixture(mission),evaluate=()=>evaluateMission(mission,snapshot.placements,catalog.objectSettings,1000,350,snapshot);
 assert.equal(evaluate().complete,true);
 const satellite=snapshot.placements.find(p=>p.type==='satellite');snapshot.nodes[satellite.id].y+=800;
 assert.equal(evaluate().complete,false);snapshot.nodes[satellite.id].y-=800;
 snapshot.placements[0]={...snapshot.placements[0],type:'internet'};assert.equal(evaluate().complete,false);
});
test('success hold rejects dragging, hidden state and stale projection',()=>{
 const mission=catalog.missions[0],s=fixture(mission),evaluation=evaluateMission(mission,s.placements,catalog.objectSettings,1000,350,s);
 const hold=screenHold(mission,null,s,evaluation,1000);assert.ok(hold);
 const run={mission:mission.number,placements:s.placements,connectionProjection:{...s,timestamp:1500},connectionHold:hold};
 assert.equal(screenReady(mission,run,1500),true);
 assert.equal(screenReady(mission,run,1900),false);
 assert.equal(screenHold(mission,hold,{...s,interacting:true},evaluation,1000),null);
 assert.equal(screenHold(mission,hold,{...s,hidden:true},evaluation,1000),null);
});
test('all boot assets are local and present; MAX fonts and validated shell config load',async()=>{
 const contours=await loadEarthContours(fetchLocal),shell=await loadUiShellConfig(undefined,fetchLocal);
 const sources=collectAssetSources(catalog,{},contours,shell.rendering.earth.russiaContour);
 for(const name of new Set([...sources.images,...sources.vectorSources])){if(name.startsWith('data:image/svg+xml;'))continue;assert.ok(name.startsWith('./'),name);assert.ok((await fs.stat(new URL(name,root))).size>0,name);}
 assert.ok(GAME_FONTS.every(f=>f.includes('Max Sans')));assert.ok(GAME_FONTS.some(f=>f.startsWith('600 ')));
 const css=await fs.readFile(new URL('brand/tokens/brand.css',root),'utf8');assert.ok(!css.includes('--max-blue:'));
 const surface=await read('earth/Earth_Surface_4K.json');assert.ok(surface);
});
test('standalone server restricts public paths and exposes a unique identity',async t=>{
 const server=createGameServer();await new Promise(r=>server.listen(0,'localhost',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://localhost:${server.address().port}`;
 assert.equal((await(await fetch(base+'/health')).json()).application,'max-space-game');
 assert.equal((await fetch(base+'/.git/config')).status,404);
 assert.equal((await fetch(base+'/%2e%2e%5cpackage.json')).status,404);
 assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
});
test('runtime manifest matches every emitted byte and contains no external project dependency',async()=>{
 const runtime=new URL('../../../apps/max-game/',import.meta.url),manifest=JSON.parse(await fs.readFile(new URL('build-manifest.json',runtime),'utf8'));
 for(const [name,sha] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await fs.readFile(new URL(name,runtime))).digest('hex'),sha,name);
 const bundle=await fs.readFile(new URL('app.js',runtime),'utf8');
 assert.ok(!bundle.includes('D:/job/'));assert.ok(!bundle.includes('Bureau 1440'));assert.ok(!bundle.includes('assets/qr/'));
});
