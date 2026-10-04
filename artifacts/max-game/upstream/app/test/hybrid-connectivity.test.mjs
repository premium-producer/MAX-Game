import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { BufferGeometry } from 'three';
import { loadMissionCatalog, serializeMissionCatalog, parseMissionCatalog } from '../src/mission-config.mjs';
import { configureMissions, createMissionRun, reduceMission, deriveNetwork } from '../src/mission-game.mjs';
import { evaluateMission } from '../src/mission-evaluation.mjs';
import { connectionMode, usesScreenConnections, screenReady } from '../src/screen-connectivity.mjs';
import { routeCandidates } from './route-fixture.mjs';
import {missionCatalog as legacyFixture,testLandSurface} from './config-fixture.mjs';
import { createNode, setNodeScreenConnections } from '../src/webgl-field.js';
import { renderTopology, changeSystemField } from '../src/editor-mission-system.js';
const root = new URL('../public/', import.meta.url);
const catalog = await loadMissionCatalog('./config/missions/index.json', async p => ({ok:true,json:async()=>JSON.parse(await readFile(new URL(p,root),'utf8'))}));
function fixture(number) {
  const raw=serializeMissionCatalog(catalog);
  for(const m of raw.missions)for(const p of m.topology.paths)p.connection.policy='hybridProjected';
  const parsed=parseMissionCatalog(raw),mission=parsed.byNumber[number],path=mission.topology.paths[0];
  const placements=routeCandidates(mission).map(p=>mission.orbitalTypes.includes(p.type)?{...p,latitude:-50,longitude:170,altitude:.72}:p);
  const nodes={};
  [`endpoint:${path.from}`,...placements.map(p=>p.id),`endpoint:${path.to}`].forEach((id,i)=>{nodes[id]={x:200+85*i,y:500,radius:60,iconRadius:20,eligible:true}});
  const snapshot={mission:number,placements,nodes,timestamp:1000,revision:1,interacting:false,hidden:false};
  return {parsed,mission,path,placements,snapshot,evaluate:()=>evaluateMission(mission,placements,parsed.objectSettings,1000,700,snapshot)};
}

test('hybrid accepts all three authored chains with orbital links by view and ground links by world distance',()=>{
  for(const number of [1,2,3]) {
    const f=fixture(number),network=f.evaluate();
    assert.equal(network.complete,true,f.mission.id);
    assert.ok(network.objectives.every(Boolean));
    assert.deepEqual(network.paths[f.path.id].ordered.map(p=>p.id),f.placements.map(p=>p.id));
    for(const link of network.links.filter(l=>!l.closing)) {
      const orbital=id=>f.mission.orbitalTypes.includes(f.placements.find(p=>p.id===id)?.type);
      assert.equal(Boolean(link.screen),orbital(link.a)||orbital(link.b));
    }
    assert.equal(evaluateMission(catalog.byNumber[number],f.placements,catalog.objectSettings,1000).complete,false,'world cannot bridge remote satellites');
    const terminal=f.placements.find(p=>p.type==='terminal');
    const before={...terminal};terminal.latitude=-60;terminal.longitude=-100;
    assert.equal(f.evaluate().complete,false,'projection cannot rescue a broken ground/endpoint edge');Object.assign(terminal,before);
    const satellite=f.placements.find(p=>f.mission.orbitalTypes.includes(p.type));
    f.snapshot.nodes[satellite.id].y+=800;
    assert.equal(f.evaluate().complete,false,'world geometry cannot rescue a broken flying projection');
  }
});

test('REF-048: complete hybrid ground endpoint connections cannot be vetoed by endpoint screen visibility',()=>{
  const f=fixture(3);configureMissions(f.parsed);
  try {
    for (const id of [`endpoint:${f.path.from}`, `endpoint:${f.path.to}`]) f.snapshot.nodes[id].eligible=false;
    const network=f.evaluate();
    assert.equal(network.complete,true);
    assert.ok(network.objectives.every(Boolean));
    assert.ok(f.placements.every(p=>network.states[p.id]==='link'));
    let run={...createMissionRun(3),placements:f.placements};
    run=reduceMission(run,{type:'CONNECTION_VIEW',snapshot:f.snapshot,now:1000});
    f.snapshot.timestamp=1400;
    assert.equal(reduceMission(run,{type:'CHECK',now:1400}).status,'complete');
    const terminal=f.placements.find(p=>p.type==='terminal');
    terminal.latitude=-60;terminal.longitude=-100;
    assert.equal(f.evaluate().complete,false,'broken ground distance still prevents victory');
  } finally {configureMissions(legacyFixture)}
});

test('hybrid ground links ignore projected radius while flying links require eligible separated icons and a fresh held view',()=>{
  const f=fixture(3);configureMissions(f.parsed);
  try {
    for(const p of f.placements) f.snapshot.nodes[p.id].radius=f.mission.orbitalTypes.includes(p.type)?180:.01;
    assert.equal(f.evaluate().complete,true,'tiny ground screen fields do not break classical ground edges');
    let run={...createMissionRun(3),placements:f.placements};
    run=reduceMission(run,{type:'CONNECTION_VIEW',snapshot:f.snapshot,now:1000});
    assert.notEqual(reduceMission(run,{type:'CHECK',now:1000}).status,'complete');
    f.snapshot.timestamp=1400;
    assert.equal(screenReady(f.mission,run,1400),true);
    const complete=reduceMission(run,{type:'CHECK',now:1400});
    assert.equal(complete.status,'complete');assert.equal(deriveNetwork(complete,9999).complete,true);
    assert.equal(deriveNetwork(reduceMission(complete,{type:'RESTART'}),9999).complete,false);
    assert.equal(deriveNetwork(run,2000).complete,false,'stale view cannot grant victory');
    const id=f.placements.find(p=>p.type==='satellite').id;
    f.snapshot.nodes[id].eligible=false;assert.equal(f.evaluate().complete,false);
    f.snapshot.nodes[id].eligible=true;f.snapshot.nodes[id].x=f.snapshot.nodes[id-1].x;
    assert.equal(f.evaluate().complete,false,'stacking objects is not a route');
  } finally {configureMissions(legacyFixture)}
});

test('hybrid visual policy retains classical ground geometry and restores all controls when switching modes',()=>{
  const raw=serializeMissionCatalog(catalog);raw.system.screenAppearance={fieldScale:1.7,objectScale:1.3,showRangeCircle:true,sizes:{satellite:1.2,terminal:2}};
  configureMissions(parseMissionCatalog(raw));createMissionRun(1);
  const geometry=new BufferGeometry();
  try {
    for(const type of ['satellite','terminal','gateway']) {
      const node=createNode({id:type,type,latitude:60,longitude:80,altitude:.72},'base',geometry);
      const size=node.scale.x,radius=node.userData.signalRadius,stem=node.userData.stemHeight;
      setNodeScreenConnections(node,true,true);
      assert.equal(node.userData.screenConnections,type==='satellite');
      if(type==='satellite') {
        assert.equal(node.userData.signalRadius,radius*1.7);
        assert.equal(node.userData.altitudeHandle.group.visible,false);
        assert.ok(!node.userData.hitTargets.includes(node.userData.altitudeHandle.hitTarget));
      } else {
        assert.equal(node.scale.x,size);assert.equal(node.userData.signalRadius,radius);assert.equal(node.userData.stemHeight,stem);
        assert.equal(node.userData.anchor.group.visible,true);
        setNodeScreenConnections(node,true,false);assert.notEqual(node.scale.x,size);
        setNodeScreenConnections(node,true,true);assert.equal(node.scale.x,size);
      }
      setNodeScreenConnections(node,false);
      assert.equal(node.scale.x,size);assert.equal(node.userData.signalRadius,radius);
      if(type==='satellite')assert.equal(node.userData.altitudeHandle.group.visible,true);
      node.traverse(o=>{if(o.geometry!==geometry)o.geometry?.dispose();o.material?.dispose()});
    }
  } finally {geometry.dispose();configureMissions(legacyFixture)}
});

test('hybrid round-trips editor policy and derives custom orbital behavior from the catalog',()=>{
  const f=fixture(1),raw=serializeMissionCatalog(f.parsed);
  assert.equal(raw.missions[0].orbitalTypes,undefined,'derived behavior must not become authored data');
  const custom=structuredClone(raw.system.objectTypes.satellite);
  raw.system.objectTypes.relay={...custom,label:'Relay'};
  const parsed=parseMissionCatalog(raw);
  assert.ok(parsed.byNumber[1].orbitalTypes.includes('relay'));
  assert.equal(connectionMode(parsed.byNumber[1]),'hybrid');assert.equal(usesScreenConnections(parsed.byNumber[1]),true);
  const path=['missions',0,'topology','paths',0,'connection','policy'];
  changeSystemField(raw,path,'geographicCorridor');changeSystemField(raw,path,'hybridProjected');
  assert.equal(parseMissionCatalog(raw).byNumber[1].topology.paths[0].connection.screen.stableHoldMs,300);
  assert.match(renderTopology(raw,0),/value="hybridProjected" selected/);
});

test('header has three numbered mode links, one selected mode, and hybrid has its own progress key',async()=>{
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const start=source.indexOf('    baseMissionCatalog = missionCatalog;'),end=source.indexOf('    wording = loadedWording;',start);
  const fn=source.slice(source.indexOf('function connectionModesHtml('),source.indexOf('function connectionModeUrl('));
  const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(index.indexOf('data-connection-modes') < index.indexOf('data-game-action="back"'));
  assert.ok(!source.slice(source.indexOf('function renderCta('),source.indexOf('function renderOnboarding(')).includes('connection-modes'));
  for(const mode of ['world','screen','hybrid']) {
    const ctx=vm.createContext({missionCatalog:catalog,connectionOverride:mode,baseMissionCatalog:null,progressStorageKey:'game',serializeMissionCatalog,parseMissionCatalog,connectionMode,usesScreenConnections,
      missionLayer:{innerHTML:''},setShellFooterContent(){},clearInventory(){},t:s=>s,escapeHtml:s=>s,assetUrl:s=>s,connectionModeUrl:m=>`?connection=${m}`});
    vm.runInContext(source.slice(start,end)+fn,ctx);ctx.missionLayer.innerHTML=ctx.connectionModesHtml();
    assert.equal(ctx.missionLayer.innerHTML.match(/aria-current="true"/g)?.length,1);
    assert.equal(ctx.missionLayer.innerHTML.match(/class="audio-toggle connection-mode"/g)?.length,3);
    assert.ok(ctx.missionLayer.innerHTML.includes(`href="?connection=${mode}" aria-current="true"`));
    assert.deepEqual([...ctx.missionLayer.innerHTML.matchAll(/>([123])<\/a>/g)].map(m=>m[1]),['1','2','3']);
    assert.equal(ctx.progressStorageKey,mode==='world'?'game':`game:connections:${[mode,mode,mode].join('-')}`);
  }
});

test('all shipped hybrid missions pass real PLACE, camera projection, current appearance and held CHECK; removing a satellite breaks the route',async()=>{
  const {cameraFor,capture}=await import('./screen-route-fixture.mjs');
  const {createSurfaceMap}=await import('../src/surface-map.mjs');
  const {configurePlacementSurface,altitudeSettingsFor}=await import('../src/mission-game.mjs');
  const report=JSON.parse(await readFile(new URL('../DOCS/research/screen-space-connectivity/hybrid-route-probe.json',import.meta.url),'utf8'));
  const surface=createSurfaceMap(JSON.parse(await readFile(new URL('earth/Earth_Surface_4K.json',root),'utf8')),new Uint8Array(await readFile(new URL('earth/Earth_Surface_4K.bin',root))));
  const {parsed}=fixture(1);configureMissions(parsed);configurePlacementSurface(surface);
  try {
    for(const solution of report.results){
      const mission=parsed.missions.find(m=>m.id===solution.mission);
      let run=createMissionRun(mission.number);
      for(const p of solution.placements) {
        if(mission.orbitalTypes.includes(p.type))assert.equal(p.altitude,altitudeSettingsFor(p.type).defaultAltitude);
        const next=reduceMission(run,{...p,type:'PLACE',item:p.type,now:0});
        assert.equal(next.placements.length,run.placements.length+1,mission.id+' land');run=next;
      }
      const camera=cameraFor(mission,solution.yawOffsetDegrees*Math.PI/180,solution.pitchOffsetDegrees*Math.PI/180);
      const view=capture(mission,run.placements,camera,undefined,true);
      run=reduceMission(run,{type:'CONNECTION_VIEW',snapshot:view,now:1000});
      assert.equal(deriveNetwork(run,1000).complete,true,mission.id);
      assert.notEqual(reduceMission(run,{type:'CHECK',now:1000}).status,'complete');
      view.timestamp=1400;
      assert.equal(reduceMission(run,{type:'CHECK',now:1400}).status,'complete');
      for(const p of run.placements.filter(p=>mission.orbitalTypes.includes(p.type))) {
        const removed=reduceMission(run,{type:'REMOVE',id:p.id});
        const snapshot=capture(mission,removed.placements,camera,undefined,true);
        assert.equal(deriveNetwork(reduceMission(removed,{type:'CONNECTION_VIEW',snapshot,now:1000}),1000).complete,false);
      }
    }
  } finally {configureMissions(legacyFixture);configurePlacementSurface(testLandSurface)}
});

test('hybrid hint changes and completion only update presentation',async()=>{
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const fn=source.slice(source.indexOf('function updateMissionNetworkPanels('),source.indexOf('function renderMissionStatus('));
  const hint={textContent:'',hidden:false},f=fixture(1);
  const ctx=vm.createContext({missionRun:{status:'playing'},connectionBoundsDirty:false,connectionMode,selectedPathId:f.path.id,
    missionLayer:{querySelector:()=>hint},shellFooterContent:{querySelector:()=>({})},updateObjectives(){},updateRouteSequence(){},orderedPlacements:()=>[],t:s=>s});
  vm.runInContext(fn,ctx);
  ctx.updateMissionNetworkPanels(f.mission,[],null);
  assert.equal(hint.textContent,'connection.hybridHint');assert.equal(ctx.connectionBoundsDirty,false);
  ctx.connectionBoundsDirty=false;ctx.missionRun.connectionHold={};ctx.updateMissionNetworkPanels(f.mission,[],null);
  assert.equal(hint.textContent,'connection.hold');assert.equal(ctx.connectionBoundsDirty,false);
  ctx.missionRun.status='complete';ctx.updateMissionNetworkPanels(f.mission,[],null);assert.equal(hint.hidden,true);
});
