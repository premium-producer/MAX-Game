import { ROUTE_FADE_MS } from '../src/route-view.mjs';
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PerspectiveCamera, Vector3 } from "three";
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from "../src/mission-config.mjs";
import { evaluateMission } from "../src/mission-evaluation.mjs";
import { configureMissions, createMissionRun, reduceMission, deriveNetwork, orderedPlacements } from "../src/mission-game.mjs";
import { screenParameters, screenReady } from "../src/screen-connectivity.mjs";
import { ConnectionProjector } from "../src/connection-projection.mjs";
import { toEditableCatalog } from "../src/editor-state.mjs";
import { changeSystemField, renderTopology } from "../src/editor-mission-system.js";
import { deriveMissionFeedback } from "../src/mission-feedback.mjs";
import { buildRouteLayout } from "../src/route-layout.mjs";
import { updateRouteTrack, disposeRouteTrack } from "../src/route-view.mjs";
import { routeDom } from "./route-dom-fixture.mjs";

const root = resolve(import.meta.dirname, "../public");
const catalog = await loadMissionCatalog("./config/missions/index.json", async (p) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(root, p), "utf8")) }));
function fixture(number = 1) {
  const raw = serializeMissionCatalog(catalog);
  for (const mission of raw.missions) for (const path of mission.topology.paths) path.connection.policy = "screenProjected";
  const parsed = parseMissionCatalog(raw), mission = parsed.missions[number - 1], path = mission.topology.paths[0];
  const placements = path.steps.map((step, i) => ({ id: i + 1, type: step.type, latitude: 0, longitude: i % 2 ? 150 : -150, altitude: .34, droppedAt: 0 }));
  const nodes = {};
  ["endpoint:" + path.from, ...placements.map((p) => p.id), "endpoint:" + path.to].forEach((id, i) => {
    nodes[id] = { x: 200 + 85 * i, y: 500, radius: 50, iconRadius: 20, eligible: true };
  });
  const snapshot = { mission: number, placements, nodes, timestamp: 1000, revision: 1, interacting: false, hidden: false };
  const run = { ...createMissionRun(number), placements, connectionProjection: snapshot };
  return { parsed, mission, path, placements, snapshot, run,
    evaluate: (view = snapshot, now = 1000) => evaluateMission(mission, placements, parsed.objectSettings, now, 700, view) };
}

test("all three authored inventories can complete in projected topology while identical world geometry fails", () => {
  configureMissions(catalog);
  for (const number of [1, 2, 3]) {
    const f = fixture(number);
    assert.equal(f.evaluate().complete, true, f.mission.id);
    assert.equal(evaluateMission(catalog.missions[number - 1], f.placements, catalog.objectSettings, 1000).complete, false);
    assert.ok(f.evaluate().links.every((l) => l.screen));
    for (const p of f.placements) {
      const view = structuredClone(f.snapshot); view.nodes[p.id].eligible = false;
      assert.equal(f.evaluate(view).complete, false, `hidden required ${p.type}`);
    }
  }
});

test("screen ordering follows the endpoint axis including vertical and reversed views", () => {
  const f = fixture();
  for (const p of Object.values(f.snapshot.nodes)) { const x = p.x; p.x = 800; p.y = 1000 - x; }
  assert.equal(f.evaluate().complete, true);
  assert.deepEqual(f.evaluate().paths[f.path.id].ordered.map((p) => p.id), f.placements.map((p) => p.id));
});

test("missing view, endpoint clipping, icon overlap, ambiguous order, gaps, wake delay and blocked drags cannot win", () => {
  const f = fixture();
  assert.equal(f.evaluate(null).complete, false);
  assert.equal(f.evaluate(f.snapshot, 699).complete, false);
  for (const mutate of [
    (v) => { v.nodes['endpoint:' + f.path.from].eligible = false; },
    (v) => { v.nodes[2].x = v.nodes[1].x + 10; },
    (v) => { v.nodes[2].x = v.nodes[1].x; },
    (v) => { v.nodes[2].radius = 1; },
    (v) => { v.nodes['endpoint:' + f.path.to].x = v.nodes['endpoint:' + f.path.from].x; },
  ]) { const view = structuredClone(f.snapshot); mutate(view); assert.equal(f.evaluate(view).complete, false); }
  f.placements[1].placementBlocked = 'water'; assert.equal(f.evaluate().complete, false);
});

test("reducer requires a fresh stable view and resets hold after movement, stale frame, hidden tab, or restart", () => {
  const f = fixture(); configureMissions(f.parsed);
  try {
    let run = reduceMission(f.run, { type: 'CONNECTION_VIEW', snapshot: f.snapshot, now: 1000 });
    assert.equal(deriveNetwork(run, 1000).complete, true);
    assert.equal(reduceMission(run, { type: 'CHECK', now: 1000 }).status, 'disconnected');
    assert.deepEqual(orderedPlacements(run).map((p) => p.id), f.placements.map((p) => p.id));
    assert.equal(deriveMissionFeedback({ mission: f.mission, run, network: deriveNetwork(run, 1000) }).some((e) => e.action === 'complete'), false);
    f.snapshot.timestamp = 1300;
    assert.equal(screenReady(f.mission, run, 1300), true);
    assert.equal(reduceMission(run, { type: 'CHECK', now: 1300 }).status, 'complete');
    assert.notEqual(reduceMission(run, { type: 'CHECK', now: 1500 }).status, 'complete');
    for (const field of ['interacting', 'hidden']) {
      f.snapshot[field] = true;
      const moving = reduceMission(run, { type: 'CONNECTION_VIEW', snapshot: f.snapshot, now: 1300 });
      assert.equal(moving.connectionHold, null);
      assert.notEqual(reduceMission(moving, { type: 'CHECK', now: 1300 }).status, 'complete');
      f.snapshot[field] = false;
    }
    f.snapshot.revision++;
    run = reduceMission(run, { type: 'CONNECTION_VIEW', snapshot: f.snapshot, now: 1300 });
    assert.equal(run.connectionHold.since, 1300);
    const moved = reduceMission(run, { type: 'MOVE', id: 2, latitude: 10, longitude: 0, now: 1300 });
    assert.notEqual(reduceMission(moved, { type: 'CHECK', now: 1300 }).status, 'complete');
    const restarted = reduceMission(run, { type: 'RESTART' });
    assert.equal(deriveNetwork(restarted, 1300).complete, false);
  } finally { configureMissions(catalog); }
});

test("screen parameters round-trip through editor and parser; default remains geographic", () => {
  assert.ok(catalog.missions.every((m) => m.topology.paths.every((p) => p.connection.policy === 'geographicCorridor')));
  const editable = toEditableCatalog(catalog);
  const field = ['missions', 0, 'topology', 'paths', 0, 'connection', 'policy'];
  changeSystemField(editable, field, 'screenProjected');
  changeSystemField(editable, [...field.slice(0, -1), 'screen', 'stableHoldMs'], 450);
  const parsed = parseMissionCatalog(editable);
  assert.deepEqual(parseMissionCatalog(serializeMissionCatalog(parsed)).missions, parsed.missions);
  assert.equal(screenParameters(parsed.missions[0].topology.paths[0].connection).stableHoldMs, 450);
  assert.match(renderTopology(editable, 0), /По ракурсу/);
  for (const invalid of [NaN, Infinity, -1, 0, 99, 5001]) {
    const copy = structuredClone(editable); copy.missions[0].topology.paths[0].connection.screen.stableHoldMs = invalid;
    assert.throws(() => parseMissionCatalog(copy));
  }
});

function project(yaw = 0, zoom = 1, width = 1920, height = 1080, bounds = null) {
  const camera = new PerspectiveCamera(42, width / height, .1, 60);
  camera.position.set(8 * Math.sin(yaw), 0, 8 * Math.cos(yaw)); camera.lookAt(0, 0, 0);
  camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  const projector = new ConnectionProjector();
  const points = [new Vector3(-.35, 1, 3), new Vector3(.35, 1, 4.3)];
  projector.begin(camera, width, height, bounds, 1, points, 1000, false);
  points.forEach((p, i) => projector.add(i, p, 0, .4, .04));
  const view = projector.finish();
  const a = view.nodes[0], b = view.nodes[1];
  return { camera, projector, points, view, ratio: Math.hypot(a.x - b.x, a.y - b.y) / (a.radius + b.radius) };
}

test("real camera rotation changes overlap without moving objects; viewport scale and projection zoom preserve the ratio", () => {
  const front = project(), rotated = project(-.35), resized = project(0, 1, 3840, 2160), zoom = project(0, 1.5);
  assert.ok(front.points[0].distanceTo(front.points[1]) > .8);
  assert.ok(front.ratio < 1); assert.ok(rotated.ratio > 1);
  assert.ok(Object.values(front.view.nodes).every((p) => p.eligible));
  assert.ok(Math.abs(front.ratio - resized.ratio) < 1e-10);
  assert.ok(Math.abs(front.ratio - zoom.ratio) < 1e-10);
});

test("projector rejects Earth and camera occlusion, ignores UI masks and honors final viewOffset and stable stems", () => {
  const { camera, projector, points, view } = project();
  const oldX = view.nodes[0].x;
  camera.setViewOffset(1920, 1080, -100, -30, 1920, 1080);
  projector.begin(camera, 1920, 1080, null, 1, points, 2000, false);
  projector.add(0, points[0], 0, .4, .04);
  projector.add('back', new Vector3(0, 0, -3.012), .23, .4, .04);
  projector.add('behind', new Vector3(0, 0, 10), 0, .4, .04);
  projector.add('stem', points[0], .23, .4, .04);
  const shifted = projector.finish();
  assert.ok(Math.abs(shifted.nodes[0].x - oldX - 100) < 1e-6);
  assert.equal(shifted.nodes.back.eligible, false); assert.equal(shifted.nodes.behind.eligible, false);
  assert.ok(shifted.nodes.stem.y < shifted.nodes[0].y);
  const clipped = project(0, 1, 1920, 1080, { left: 960, right: 1920, top: 0, bottom: 1080 });
  assert.equal(clipped.view.nodes[0].eligible, true);
  const panel = project(0, 1, 1920, 1080, { occluders: [{ left: 0, right: 1920, top: 0, bottom: 1080 }] });
  assert.equal(panel.view.nodes[0].eligible, true);
  assert.equal(panel.view.nodes[0].reason, '');
});

test("changing any panel or UI frame cannot change game projection or its stable revision", () => {
  const { camera, projector, points, view } = project();
  const original = structuredClone(view.nodes), revision = view.revision;
  for (let frame = 1; frame <= 8; frame++) {
    const ui = { left: frame * 10000, right: -1, top: 5000, bottom: -1,
      occluders: [{ left: -10000, right: 10000, top: -10000, bottom: 10000 }] };
    projector.begin(camera, 1920, 1080, ui, 1, points, 1000 + frame * 60, false);
    points.forEach((p, i) => projector.add(i, p, 0, .4, .04));
    const next = projector.finish();
    assert.equal(next.revision, revision);
    for (const id of [0, 1]) {
      const { generation: _before, ...before } = original[id];
      const { generation: _after, ...after } = next.nodes[id];
      assert.deepEqual(after, before);
    }
  }
});

test("projector reuses unchanged records and invalidates revisions on actual geometry and input changes", () => {
  const { camera, projector, points, view } = project();
  const revision = view.revision, record = view.nodes[0];
  projector.begin(camera, 1920, 1080, null, 1, points, 1033, false);
  points.forEach((p, i) => projector.add(i, p, 0, .4, .04));
  assert.equal(projector.finish().revision, revision);
  assert.equal(view.nodes[0], record);
  projector.begin(camera, 1920, 1080, null, 1, points, 1066, true);
  points.forEach((p, i) => projector.add(i, p, 0, .4, .04));
  assert.equal(projector.finish().revision, revision + 1);
});

test("real shipped routes pass PLACE and held CHECK with land mask and permitted camera angles", async () => {
  const { screenCatalog, cameraFor, capture } = await import('./screen-route-fixture.mjs');
  const { configurePlacementSurface, getPlacementRejection, altitudeSettingsFor, isOrbitalType } = await import('../src/mission-game.mjs');
  const { createSurfaceMap } = await import('../src/surface-map.mjs');
  const { testLandSurface } = await import('./config-fixture.mjs');
  const witnesses = JSON.parse(await readFile(resolve(import.meta.dirname, '../DOCS/research/screen-space-connectivity/route-probe.json'), 'utf8'));
  const mask = createSurfaceMap(JSON.parse(await readFile(resolve(root, 'earth/Earth_Surface_4K.json'), 'utf8')), new Uint8Array(await readFile(resolve(root, 'earth/Earth_Surface_4K.bin'))));
  configureMissions(screenCatalog); configurePlacementSurface(mask);
  try {
    for (const witness of witnesses.results) {
      const mission = screenCatalog.missions.find((m) => m.id === witness.mission);
      let run = createMissionRun(mission.number);
      for (const p of witness.placements) {
        assert.equal(getPlacementRejection(p.type, p), null);
        if (isOrbitalType(p.type)) assert.equal(p.altitude, altitudeSettingsFor(p.type).defaultAltitude);
        const next = reduceMission(run, { ...p, type: 'PLACE', item: p.type, now: 0 });
        assert.equal(next.placements.length, run.placements.length + 1); run = next;
      }
      assert.ok(Math.abs(witness.yawOffsetDegrees) <= 25 && Math.abs(witness.pitchOffsetDegrees) <= 12);
      const camera = cameraFor(mission, witness.yawOffsetDegrees * Math.PI / 180, witness.pitchOffsetDegrees * Math.PI / 180);
      const snapshot = capture(mission, run.placements, camera);
      run = reduceMission(run, { type: 'CONNECTION_VIEW', snapshot, now: 1000 });
      assert.equal(deriveNetwork(run, 1000).complete, true, mission.id);
      assert.notEqual(reduceMission(run, { type: 'CHECK', now: 1000 }).status, 'complete');
      snapshot.timestamp = 1400;
      assert.equal(reduceMission(run, { type: 'CHECK', now: 1400 }).status, 'complete', mission.id);
      for (const satellite of run.placements.filter((p) => p.type === 'satellite')) {
        let removed = reduceMission(run, { type: 'REMOVE', id: satellite.id });
        removed = reduceMission(removed, { type: 'CONNECTION_VIEW', snapshot: capture(mission, removed.placements, camera), now: 1000 });
        assert.equal(deriveNetwork(removed, 1000).complete, false);
      }
    }
  } finally { configureMissions(catalog); configurePlacementSurface(testLandSurface); }
});

test("main frame loop completes a stationary route automatically, without an extra input or stopping its timer early", async () => {
  const { createContext, runInContext } = await import('node:vm');
  const { usesScreenConnections } = await import('../src/screen-connectivity.mjs');
  const { applyMissionFeedback } = await import('../src/mission-feedback.mjs');
  const f = fixture(); configureMissions(f.parsed);
  const source = await readFile(resolve(import.meta.dirname, '../src/main.js'), 'utf8');
  let now = 1000, stopped = 0, outcomes = 0;
  const ctx = createContext({
    appReady: true, missionRun: f.run, state: {screen: 'MISSION_PLAY'}, STATES: {MISSION_PLAY: 'MISSION_PLAY'},
    MISSIONS: f.parsed.byNumber, ITEM_TYPES: {terminal:{}, satellite:{}, core:{}, gateway:{}, internet:{}},
    usesScreenConnections, screenReady, reduceMission, deriveNetwork, deriveMissionFeedback, applyMissionFeedback,
    connectionPreview: null, connectionBoundsDirty: false, connectionBounds: {}, connectionRevision: -1,
    connectionFrameAt: 0, connectionUiSignature: '', activeScreenTransition: null, document: {hidden:false},
    Date: {now:()=>now}, webglMission: 1, timerId: 123, audioAdapter: null,
    withProjectedLayout: (r)=>r, t: (s)=>s, scheduleNodeWakeup:()=>{}, renderMissionStatus:()=>{},
    clearInterval:()=>{stopped++}, renderOutcomePopup:()=>{if(ctx.missionRun.status==='complete')outcomes++},
    missionLayer: {querySelector:()=>({textContent:''})},
    webglField: {captureConnections:()=>{f.snapshot.timestamp=now;return f.snapshot},update:()=>{}},
  });
  const fn = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
  try {
    runInContext(fn('renderMission','renderMissionShell') + fn('updateConnectionView','startTimer'),ctx);
    for(now=1000;now<1300;now+=16)ctx.updateConnectionView();
    assert.notEqual(ctx.missionRun.status,'complete'); assert.equal(stopped,0); assert.equal(outcomes,0);
    for(;now<1360;now+=16)ctx.updateConnectionView();
    assert.equal(ctx.missionRun.status,'complete'); assert.equal(stopped,1); assert.equal(outcomes,1);
  } finally {configureMissions(catalog)}
});

test("screen satellites hide altitude handles and remove their picking targets, restoring both in world mode", async () => {
  const { BufferGeometry } = await import('three');
  const { createNode, setNodeScreenConnections } = await import('../src/webgl-field.js');
  configureMissions(catalog); createMissionRun(1);
  const geometry = new BufferGeometry();
  const satellite = createNode({ id: 1, type: 'satellite', latitude: 60, longitude: 80, altitude: .34 }, 'base', geometry);
  const ground = createNode({ id: 2, type: 'terminal', latitude: 60, longitude: 80, altitude: .08 }, 'base', geometry);
  const originalPosition = satellite.position.clone(), radius = satellite.userData.signalRadius;
  const handle = satellite.userData.altitudeHandle;
  setNodeScreenConnections(satellite, true);
  assert.equal(handle.group.visible, false);
  assert.ok(!satellite.userData.hitTargets.includes(handle.hitTarget));
  assert.ok(satellite.userData.hitTargets.includes(satellite.userData.hitTarget));
  assert.ok(satellite.position.equals(originalPosition));
  assert.equal(satellite.userData.signalRadius, radius * catalog.system.screenAppearance.fieldScale);
  setNodeScreenConnections(ground, true);
  assert.equal(ground.userData.anchor.group.visible, true);
  setNodeScreenConnections(satellite, false);
  assert.equal(handle.group.visible, true);
  assert.equal(satellite.userData.signalRadius, radius);
  assert.ok(satellite.userData.hitTargets.includes(handle.hitTarget));
  for (const node of [satellite, ground]) node.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
});

test("screen satellite drag wheel cannot mutate height; world wheel still works and guide is suppressed on screen pickup", async () => {
  const vm = await import('node:vm');
  const { MathUtils } = await import('three');
  const source = await readFile(resolve(import.meta.dirname, '../src/webgl-field.js'), 'utf8');
  const start = source.indexOf('  const onWheel = (event) => {', source.indexOf('  const finishNodeDrag ='));
  const end = source.indexOf('  const onDoubleClick =', start);
  let transforms = 0, guides = 0;
  const ctx = vm.createContext({screenConnections: true, draggedNode: {type:'satellite',altitude:.5,dragStartGeo:{altitude:.5,latitude:60,longitude:80},group:{}},
    isOrbitalType:()=>true, THREE:{MathUtils}, ORBIT_ALTITUDE:.5, altitudeSettingsFor:()=>({minAltitude:.1,maxAltitude:1.4}),
    movePreviewPending:false, updateNodeTransform:()=>{transforms++}, updateSatelliteDragGuide:()=>{guides++}, satelliteDragGuide:{}});
  vm.runInContext(source.slice(start,end)+'\nglobalThis.wheel = onWheel;',ctx);
  ctx.wheel({deltaY:100,preventDefault(){}});
  assert.equal(ctx.draggedNode.dragStartGeo.altitude,.5); assert.equal(transforms,0); assert.equal(guides,0);
  ctx.screenConnections=false; ctx.wheel({deltaY:100,preventDefault(){}});
  assert.equal(ctx.draggedNode.dragStartGeo.altitude,.35); assert.equal(transforms,1); assert.equal(guides,1);
  const pickupStart=source.indexOf('    if (isOrbitalType(draggedNode.type) && !screenConnections) {');
  const pickup=source.slice(pickupStart,source.indexOf('    setHoveredHitTarget(hit.object);',pickupStart));
  assert.ok(pickupStart>0);
  ctx.screenConnections=true; ctx.satelliteDragGuide={group:{visible:false}};
  vm.runInContext(pickup,ctx); assert.equal(ctx.satelliteDragGuide.group.visible,false); assert.equal(guides,1);
  ctx.screenConnections=false;vm.runInContext(pickup,ctx); assert.equal(ctx.satelliteDragGuide.group.visible,true); assert.equal(guides,2);
});

test("confirmed screen victory retains its route, objectives and success event after the view expires or is reused", () => {
  const f = fixture(3); configureMissions(f.parsed);
  try {
    let run = reduceMission(f.run, {type:'CONNECTION_VIEW', snapshot:f.snapshot, now:1000});
    f.snapshot.timestamp=1300;
    run=reduceMission(run,{type:'CHECK',now:1300});
    assert.equal(run.status,'complete');
    const success=deriveNetwork(run,1300);
    for(const now of [1421,5000]) {
      const network=deriveNetwork(run,now);
      assert.equal(network.complete,true);
      assert.deepEqual(network.objectives,success.objectives);
      assert.deepEqual(network.links,success.links);
      assert.deepEqual(network.paths[f.path.id].ordered.map(p=>p.id),f.placements.map(p=>p.id));
      assert.ok(deriveMissionFeedback({mission:f.mission,run,network}).some(e=>e.action==='complete'));
    }
    // The renderer's projection buffer belongs to later frames, not the victory.
    f.snapshot.nodes={}; f.snapshot.revision++; f.snapshot.placements=[];
    assert.equal(deriveNetwork(run,6000).complete,true);
    const restart=reduceMission(run,{type:'RESTART'});
    assert.equal(deriveNetwork(restart,6000).complete,false);
    const playing={...run,status:'playing'};
    assert.equal(deriveNetwork(playing,6000).complete,false);
  } finally {configureMissions(catalog)}
});

test("late completed renders keep all eleven footer icons, objective checks and completion popup together", async () => {
  const vm = await import('node:vm');
  const { usesScreenConnections } = await import('../src/screen-connectivity.mjs');
  const { applyMissionFeedback } = await import('../src/mission-feedback.mjs');
  const f=fixture(3);configureMissions(f.parsed);
  let run=reduceMission(f.run,{type:'CONNECTION_VIEW',snapshot:f.snapshot,now:1000});
  f.snapshot.timestamp=1300;run=reduceMission(run,{type:'CHECK',now:1300});
  const {route,track}=routeDom(1100);
  route.dataset.structureKey=`3:${f.path.id}:${f.path.steps.length}`;
  const list={dataset:{},children:[],innerHTML:''},hint={hidden:false,textContent:'Сохрани ракурс'},popup={hidden:true};
  let lastNetwork=null;
  const ctx=vm.createContext({missionRun:run,MISSIONS:f.parsed.byNumber,selectedPathId:f.path.id,webglMission:3,
    connectionPreview:null,connectionRevision:-1,connectionBoundsDirty:false,usesScreenConnections,screenReady,reduceMission,deriveNetwork,orderedPlacements,
    deriveMissionFeedback,applyMissionFeedback,buildRouteLayout,updateRouteTrack,disposeRouteTrack,ROUTE_FADE_MS,ITEM_TYPES:{terminal:{},satellite:{},gateway:{},core:{},internet:{}},
    withProjectedLayout:r=>r,Date:{now:()=>5000},audioAdapter:null,timerId:1,clearInterval(){},scheduleNodeWakeup(){},
    escapeHtml:s=>s,t:s=>s,deviceIcon:type=>`<i>${type}</i>`,animateElement(){},motionOptions:()=>({}),
    shellFooterContent:{querySelector:()=>route},missionLayer:{querySelector:s=>s==='[data-objectives]'?list:s==='[data-connection-hint]'?hint:popup},
    webglField:{update:({network})=>{lastNetwork=network}},
    renderMissionStatus:(m,p,_items,_message,n)=>ctx.updateMissionNetworkPanels(m,p,n),
    clearPendingMissionFeedback(){},placementError:null,activeMissionFeedback:null,
    showOutcomePopup:(_p,_m,outcome)=>{popup.hidden=false;popup.action=outcome.action},hideOutcomePopup:()=>{popup.hidden=true},
  });
  const source=await readFile(resolve(import.meta.dirname,'../src/main.js'),'utf8');
  const fn=(name,next)=>source.slice(source.indexOf(`function ${name}(`),source.indexOf(`function ${next}(`));
  try {
    vm.runInContext(fn('renderMission','renderMissionShell')+fn('updateMissionNetworkPanels','renderMissionStatus')+
      fn('updateObjectives','updateInventory')+fn('updateRouteSequence','motionOptions')+fn('renderOutcomePopup','showOutcomePopup'),ctx);
    ctx.renderMission();
    assert.equal(lastNetwork.complete,true);
    assert.equal(list.innerHTML.match(/class="is-done"/g)?.length,4);
    const slots=[...track.routeNodes.values()];
    assert.deepEqual(slots.map(slot=>Number(slot.dataset.placementId)),f.placements.map(p=>p.id));
    assert.ok(slots.every(slot=>slot.routeContent.innerHTML.includes('<i>')));
    assert.equal(hint.hidden,true); assert.equal(ctx.connectionBoundsDirty,false); assert.equal(popup.hidden,false); assert.equal(popup.action,'complete');
    // Delayed render after the projector buffer was cleared must stay identical.
    f.snapshot.nodes={};ctx.renderMission();
    assert.equal(list.innerHTML.match(/class="is-done"/g)?.length,4);
    assert.ok(slots.every(slot=>slot.routeContent.innerHTML.includes('<i>')));assert.equal(popup.hidden,false);
  } finally {configureMissions(catalog)}
});

test("screen drag preview sends its current ordering to footer and objectives without completing the run", async () => {
  const vm=await import('node:vm');
  const {usesScreenConnections}=await import('../src/screen-connectivity.mjs');
  const {applyMissionFeedback}=await import('../src/mission-feedback.mjs');
  const f=fixture();configureMissions(f.parsed);
  const preview={...f.run,placements:[...f.placements]};
  const snapshot={...f.snapshot,placements:preview.placements,interacting:true};
  let rendered=null,sceneNetwork=null;
  const ctx=vm.createContext({appReady:true,missionRun:f.run,state:{screen:'MISSION_PLAY'},STATES:{MISSION_PLAY:'MISSION_PLAY'},
    MISSIONS:f.parsed.byNumber,usesScreenConnections,screenReady,deriveNetwork,deriveMissionFeedback,applyMissionFeedback,
    connectionPreview:preview,connectionBoundsDirty:false,connectionBounds:{},connectionRevision:-1,connectionFrameAt:0,
    activeScreenTransition:null,document:{hidden:false},Date:{now:()=>1000},
    webglField:{captureConnections:()=>snapshot,update:({network})=>{sceneNetwork=network}},
    updateMissionNetworkPanels:(_mission,progress,network)=>{rendered={progress,network}},
  });
  const source=await readFile(resolve(import.meta.dirname,'../src/main.js'),'utf8');
  try {
    vm.runInContext(source.slice(source.indexOf('function updateConnectionView('),source.indexOf('function startTimer()')),ctx);
    ctx.updateConnectionView();
    assert.equal(rendered.network,sceneNetwork);
    assert.deepEqual(rendered.network.paths[f.path.id].ordered.map(p=>p.id),f.placements.map(p=>p.id));
    assert.notEqual(ctx.missionRun.status,'complete');
  } finally {configureMissions(catalog)}
});
