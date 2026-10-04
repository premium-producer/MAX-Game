import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { isCanvasTap, steppedAltitude, TAP_SLOP_PX } from "../src/placement-input.mjs";
import { createMissionRun, reduceMission, availableCount, altitudeSettingsFor } from "../src/mission-game.mjs";
import "./config-fixture.mjs";

const webgl = readFileSync(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const block = (source, from, to) => source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from)));
const rect = { left: 0, top: 0, right: 500, bottom: 500 };
function placedRun() {
  return reduceMission(createMissionRun(3), { type: "PLACE", item: "satellite", latitude: 55, longitude: 50, altitude: .9, now: 10 });
}

test("selecting existing equipment never moves, wakes, duplicates or consumes it; cards select new instances", () => {
  const run = placedRun(), original = run.placements, stock = availableCount(run, "satellite");
  const selected = reduceMission(run, { type: "SELECT_PLACEMENT", id: 1 });
  assert.equal(selected.selectedPlacementId, 1); assert.equal(selected.selected, null);
  assert.equal(selected.placements, original); assert.equal(selected.placements[0].droppedAt, 10);
  assert.equal(availableCount(selected, "satellite"), stock);
  assert.equal(reduceMission(selected, { type: "SELECT_PLACEMENT", id: 999 }), selected);
  assert.equal(reduceMission(selected, { type: "SELECT_PLACEMENT", id: 1 }).selectedPlacementId, null);
  const newSelection = reduceMission(selected, { type: "SELECT", item: "satellite" });
  assert.equal(newSelection.selected, "satellite"); assert.equal(newSelection.selectedPlacementId, null);
  assert.equal(reduceMission(newSelection, { type: "SELECT_PLACEMENT", id: 1 }).selected, null);
  assert.equal(reduceMission(selected, { type: "RESTART" }).selectedPlacementId, null);
});

test("move preserves existing ID, stock and selected object; invalid move retains state and delete returns stock", () => {
  const run = reduceMission(placedRun(), { type: "SELECT_PLACEMENT", id: 1 });
  const moved = reduceMission(run, { type: "MOVE", id: 1, latitude: 60, longitude: 80, altitude: .9, now: 200 });
  assert.equal(moved.placements.length, 1); assert.equal(moved.placements[0].id, 1);
  assert.equal(moved.placements[0].droppedAt, 200); assert.equal(moved.selectedPlacementId, 1);
  assert.equal(availableCount(moved, "satellite"), availableCount(run, "satellite"));
  assert.equal(reduceMission(moved, { type: "MOVE", id: 1, latitude: NaN, longitude: 10 }), moved);
  const deleted = reduceMission(moved, { type: "REMOVE", id: 1 });
  assert.equal(deleted.selectedPlacementId, null);
  assert.equal(availableCount(deleted, "satellite"), availableCount(run, "satellite") + 1);
  for (const status of ["complete", "timeout"]) {
    const locked = { ...run, status };
    assert.equal(reduceMission(locked, { type: "SELECT_PLACEMENT", id: 1 }), locked);
    assert.equal(reduceMission(locked, { type: "REMOVE", id: 1 }), locked);
  }
});

function canvasHarness() {
  const actions = [], canvas = { style: {}, getBoundingClientRect: () => rect, setPointerCapture() {}, hasPointerCapture: () => false };
  const node = { ...placedRun().placements[0], group: {} };
  const ctx = vm.createContext({ tapControls: true, selectedPlacementId: null, currentSelectedItem: null,
    pointerStart: null, draggedNode: null, moved: false, freeOrbit: false, hitId: 1,
    renderer: { domElement: canvas }, document: { elementFromPoint: () => canvas }, controls: { enabled: true },
    updatePointer: () => rect, nodeMeshes: [], nodesById: new Map([[1, { userData: { placement: node } }]]),
    raycaster: { intersectObjects: () => ctx.hitId == null ? [] : [{ object: { userData: { placement: { id: ctx.hitId } } } }] },
    isCanvasTap, TAP_SLOP_PX,
    geoFromPointer: (x, y, type, ref, altitude) => ({ latitude: y / 4, longitude: x / 4, altitude: altitude ?? .72 }),
    onSelectPlacement: (id) => { actions.push(["select", id]); ctx.selectedPlacementId = id; ctx.currentSelectedItem = null; },
    onMove: (id, geo) => actions.push(["move", id, geo]), onPlace: (type, geo) => actions.push(["place", type, geo]),
    onRemove: () => actions.push(["delete"]),
  });
  vm.runInContext(block(webgl, "  const onPointerDown =", "  const dragGeoFromPointer =")
    + block(webgl, "  const onPointerMove =", "  const onPointerLeave =")
    + block(webgl, "  const onDoubleClick =", '  renderer.domElement.addEventListener("pointerdown"'), ctx);
  const event = (x = 100, y = 100) => ({ pointerId: 1, button: 0, isPrimary: true, clientX: x, clientY: y,
    stopImmediatePropagation() { this.blocked = true; }, preventDefault() {} });
  const down = () => { ctx.event = event(); vm.runInContext("onPointerDown(event)", ctx); };
  const up = () => vm.runInContext("onPointerUp(event)", ctx);
  return { ctx, actions, event, down, up, node };
}

test("game callbacks clear selection after one accepted placement or move and retain it on rejection", () => {
  const h = canvasHarness();
  const ctx = vm.createContext({ missionRun: createMissionRun(3), placementMode: "tap",
    updateMission(action) {
      ctx.missionRun = reduceMission(ctx.missionRun, action);
      h.ctx.currentSelectedItem = ctx.missionRun.selected;
      h.ctx.selectedPlacementId = ctx.missionRun.selectedPlacementId;
    },
  });
  const callbacks = main.split("\n").filter((line) => /^\s+on(?:Place|Move):/.test(line)).join("\n");
  vm.runInContext(`globalThis.callbacks = { ${callbacks} };`, ctx);
  h.ctx.onPlace = ctx.callbacks.onPlace; h.ctx.onMove = ctx.callbacks.onMove;
  h.ctx.hitId = null;
  ctx.updateMission({ type: "SELECT", item: "satellite" });
  const beforeInvalidPlace = ctx.missionRun;
  ctx.callbacks.onPlace("satellite", { latitude: NaN, longitude: 0 });
  assert.equal(ctx.missionRun, beforeInvalidPlace);
  h.down(); h.up();
  assert.equal(ctx.missionRun.placements.length, 1);
  assert.equal(ctx.missionRun.selected, null);
  assert.equal(ctx.missionRun.selectedPlacementId, null);
  assert.ok(availableCount(ctx.missionRun, "satellite") > 0, "clear even when the inventory has more copies");
  const placed = ctx.missionRun;
  h.down(); h.up(); assert.equal(ctx.missionRun, placed, "next empty tap does not place another object");
  ctx.updateMission({ type: "SELECT_PLACEMENT", id: 1 });
  const beforeInvalidMove = ctx.missionRun;
  ctx.callbacks.onMove(1, { latitude: NaN, longitude: 0 });
  assert.equal(ctx.missionRun, beforeInvalidMove);
  h.down(); h.up();
  assert.equal(ctx.missionRun.selectedPlacementId, null);
  assert.equal(ctx.missionRun.placements[0].id, 1);
  const moved = ctx.missionRun;
  h.down(); h.up(); assert.equal(ctx.missionRun, moved, "next empty tap does not move the object again");
});

test("actual tap handlers select a world icon then move it at its existing altitude; menu selection creates a new object", () => {
  const h = canvasHarness();
  h.down(); assert.equal(h.ctx.draggedNode, null); h.up();
  assert.notEqual(h.ctx.event.blocked, true, "Earth orbit receives the gesture even when it starts on an object");
  assert.deepEqual(h.actions, [["select", 1]]);
  h.ctx.hitId = null; h.down(); h.up();
  assert.deepEqual(h.actions[1], ["move", 1, { latitude: 25, longitude: 25, altitude: .9 }]);
  h.ctx.selectedPlacementId = null; h.ctx.currentSelectedItem = "satellite";
  h.down(); h.up();
  assert.equal(h.actions[2][0], "place");
  vm.runInContext("onDoubleClick(event)", h.ctx);
  assert.equal(h.actions.length, 3, "double click never deletes in tap mode");
});

test("dragging a node or empty field, cancel and changing selection mid-gesture have no effect in tap mode", () => {
  for (const scenario of ["node-drag", "field-drag", "cancel", "changed"]) {
    const h = canvasHarness();
    if (scenario === "field-drag") h.ctx.hitId = null;
    h.down();
    if (scenario.endsWith("drag")) {
      h.ctx.moveEvent = h.event(140, 140);
      vm.runInContext("onPointerMove(moveEvent)", h.ctx);
      assert.equal(h.ctx.draggedNode, null);
    }
    if (scenario === "changed") h.ctx.currentSelectedItem = "terminal";
    if (scenario === "cancel") vm.runInContext("onPointerCancel(event)", h.ctx); else h.up();
    assert.equal(h.actions.length, 0, scenario);
    assert.equal(h.node.altitude, .9);
    assert.equal(h.ctx.controls.enabled, true);
  }
});

test("altitude buttons use the object's bounds and reach both endpoints without overshoot", () => {
  const settings = { minAltitude: .34, maxAltitude: 1.4 };
  let value = .9;
  for (let i = 0; i < 40; i++) value = steppedAltitude(value, settings, 1);
  assert.equal(value, 1.4);
  for (let i = 0; i < 40; i++) value = steppedAltitude(value, settings, -1);
  assert.equal(value, .34);
});

test("actual panel actions change altitude through MOVE without exposing delete or clear", () => {
  const actions = [], selected = { ...placedRun().placements[0] };
  const ctx = vm.createContext({ placementMode: "tap", state: { screen: "play" }, STATES: { MISSION_PLAY: "play" },
    missionRun: { mission: 3, placements: [selected], selectedPlacementId: selected.id }, MISSIONS: { 3: {} },
    isOrbitalType: () => true, usesScreenConnections: () => false, altitudeSettingsFor, steppedAltitude,
    updateMission: (action) => actions.push(action) });
  vm.runInContext(block(main, "function applyTapNodeAction(", "function syncAudioControl("), ctx);
  ctx.applyTapNodeAction("raise"); ctx.applyTapNodeAction("delete"); ctx.applyTapNodeAction("clear");
  assert.equal(actions[0].type, "MOVE"); assert.equal(actions[0].id, 1);
  assert.equal(actions[0].latitude, selected.latitude); assert.equal(actions[0].longitude, selected.longitude);
  assert.ok(actions[0].altitude > selected.altitude);
  assert.equal(actions.length, 1);
});

test("tap mode disables object drag handles while preserving Earth swipe controls, including mode switches", () => {
  const handle = { group: { visible: true } };
  const ctx = vm.createContext({ tapControls: false, selectedPlacementId: null, pointerStart: null, screenConnections: false,
    controls: { enabled: true, pointerId: null }, nodesById: new Map([[1, { userData: { altitudeHandle: handle } }]]),
    rebuildNodeHitTargets() {}, setHoveredHitTarget() {}, hoveredHitTarget: null });
  vm.runInContext(`const api = { ${block(webgl, "    setTapControls({", "    setCameraDistance(")} }; globalThis.api = api;`, ctx);
  ctx.api.setTapControls({ enabled: true, selectedId: 1 });
  assert.equal(ctx.controls.enabled, true); assert.equal(handle.group.visible, false);
  assert.equal(ctx.selectedPlacementId, 1);
  ctx.api.setTapControls({ enabled: false });
  assert.equal(ctx.controls.enabled, true); assert.equal(handle.group.visible, true);
  assert.equal(ctx.selectedPlacementId, null);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /data-camera-step|data-tap-camera/);
});
