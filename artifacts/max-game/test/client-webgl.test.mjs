import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PerspectiveCamera,Vector3} from 'three';
import {parseMissionCatalog} from '../src/mission-config.mjs';
import {createClientWebglCatalog} from '../src/client-webgl-catalog.mjs';
import {PRESENTATION_MISSIONS} from '../src/journey-presentation.mjs';
import {evaluateMission} from '../src/mission-evaluation.mjs';
import {ConnectionProjector} from '../src/connection-projection.mjs';
import {collectAssetSources} from '../src/asset-preparation.mjs';
const read=async file=>JSON.parse(await fs.readFile(new URL('../public/config/'+file,import.meta.url),'utf8'));
const content=await read('client-missions.json'), raw=await read('client-webgl.json');
const catalog=parseMissionCatalog(raw);
test('compiled WebGL missions derive from current client content and numbered glyphs',()=>{
  assert.deepEqual(raw,createClientWebglCatalog({...content,missions:[...content.missions,...PRESENTATION_MISSIONS]},raw.system.icons));
  assert.equal(catalog.missions.length,6);
  assert.equal(content.missions.length,4);
  assert.ok(Object.values(raw.system.objectTypes).every(t=>/^step-[1-5]$/.test(t.icon)));
});
for(const mission of catalog.missions) test(`client WebGL ${mission.number}: ordered screen route wins; missing/disconnected route fails`,()=>{
  const steps=mission.topology.paths[0].steps;
  const placements=steps.map((step,i)=>({id:i+1,type:step.type,latitude:-5,longitude:-55+110*(i+1)/(steps.length+1),altitude:.08,droppedAt:0}));
  const nodes={}; ['endpoint:A',...placements.map(p=>p.id),'endpoint:B'].forEach((id,i)=>nodes[id]={x:450+90*i,y:500,radius:60,iconRadius:20,eligible:true});
  const snapshot={nodes,placements,mission:mission.number,timestamp:1000,revision:1,interacting:false,hidden:false};
  const evaluate=()=>evaluateMission(mission,snapshot.placements,catalog.objectSettings,1000,350,snapshot);
  assert.equal(evaluate().complete,true);
  nodes[1].y+=600;assert.equal(evaluate().complete,false);nodes[1].y-=600;
  snapshot.placements=placements.slice(1);assert.equal(evaluate().complete,false);
});
test('planar projection does not hide nodes behind the removed Earth',()=>{
  const camera=new PerspectiveCamera(25,16/9,.1,100);camera.position.set(0,0,9);camera.lookAt(0,0,0);
  const p=new ConnectionProjector(0);p.begin(camera,1920,1080,null,1,[],1000,false);
  p.add('center',new Vector3(0,0,0),.23,.5,.08);
  assert.equal(p.finish().nodes.center.eligible,true);
  const globe=new ConnectionProjector(3);globe.begin(camera,1920,1080,null,1,[],1000,false);
  assert.equal(globe.occluded(new Vector3(0,0,0)),true);
});
test('planar preload retains brand/glyphs and omits Earth texture decoding',()=>{
  const assets=collectAssetSources(catalog,{},undefined,undefined,true);
  assert.equal(assets.vectorSources.length,0);
  assert.ok(assets.images.every(name=>!name.includes('/earth/')));
  assert.ok(assets.images.some(name=>name.includes('max-mono-white')));
});
test('active task journey retains original WebGL fibers with new interface',async()=>{
  const root=new URL('../../../apps/max-game/',import.meta.url);
  const sources=JSON.parse(await fs.readFile(new URL('source-manifest.json',root),'utf8'));
  assert.ok(sources['src/journey-main.js']);assert.ok(sources['src/journey-state.mjs']);assert.ok(sources['src/webgl-field.js']);
  assert.ok(!sources['src/planar-main.js']);
  const html=await fs.readFile(new URL('index.html',root),'utf8');
  assert.ok(html.includes('src/journey.css'));assert.ok(html.includes('id="circles"'));
});

test('client entry cannot inherit the legacy geographic startup default',async()=>{
 const main=await fs.readFile(new URL('../src/circular-main.js',import.meta.url),'utf8');
 assert.ok(main.includes("field.setScreenConnections(true)"));assert.ok(!main.includes("startupControls.connection"));
});
