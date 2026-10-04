import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { isPlacementTap, loadPlacementMode, TAP_SLOP_PX } from "../src/placement-input.mjs";
import { availableCount, createMissionRun, reduceMission } from "../src/mission-game.mjs";
import "./config-fixture.mjs";

test("tap mode defaults on, stored drag mode and explicit URL overrides remain available", () => {
  assert.equal(loadPlacementMode(""), "tap");
  assert.equal(loadPlacementMode("", { getItem: () => "drag" }), "drag");
  assert.equal(loadPlacementMode("?placement=tap", { getItem: () => "drag" }), "tap");
  assert.equal(loadPlacementMode("?placement=drag"), "drag");
  assert.equal(loadPlacementMode("", { getItem() { throw Error("blocked"); } }), "tap");
});

test("selected equipment remains armed for repeated taps until stock runs out in every mission", () => {
  for (const mission of [1, 2, 3]) {
    let run = reduceMission(createMissionRun(mission), { type: "SELECT", item: "satellite" });
    const count = availableCount(run, "satellite");
    assert.ok(count > 0);
    for (let index = 0; index < count; index++) {
      run = reduceMission(run, { type: "PLACE", latitude: 55, longitude: 40 + index * 4, keepSelection: true, now: index });
      assert.equal(run.placements.length, index + 1);
      assert.equal(run.selected, index < count - 1 ? "satellite" : null);
    }
    assert.equal(reduceMission(run, { type: "PLACE", item: "satellite", latitude: 55, longitude: 40, keepSelection: true }), run);
  }
});

test("switch card, deselect, invalid attempt, legacy drop and restart retain their distinct meanings", () => {
  let run = reduceMission(createMissionRun(3), { type: "SELECT", item: "satellite" });
  run = reduceMission(run, { type: "SELECT", item: "terminal" });
  assert.equal(run.selected, "terminal");
  assert.equal(reduceMission(run, { type: "PLACE", latitude: NaN, longitude: 40, keepSelection: true }), run);
  assert.equal(reduceMission(run, { type: "SELECT", item: "terminal" }).selected, null);
  assert.equal(reduceMission(run, { type: "PLACE", latitude: 55, longitude: 40 }).selected, null);
  assert.equal(reduceMission(run, { type: "RESTART" }).selected, null);
  assert.equal(reduceMission({ ...run, status: "timeout" }, { type: "PLACE", latitude: 55, longitude: 40, keepSelection: true }).placements.length, 0);
});

const rect = { left: 0, top: 0, right: 500, bottom: 500 };
const start = { x: 100, y: 100, pointerId: 1, item: "satellite" };
const release = { clientX: 103, clientY: 100, pointerId: 1, button: 0 };
test("a placement tap rejects orbit, release-only movement, multitouch, cancellation and stale selection", () => {
  const options = { item: "satellite", rect };
  assert.equal(isPlacementTap(start, release, options), true);
  for (const extra of [{ moved: true }, { cancelled: true }, { item: "terminal" }, { item: null }]) {
    assert.equal(isPlacementTap(start, release, { ...options, ...extra }), false);
  }
  for (const extra of [{ pointerId: 2 }, { button: 2 }, { clientX: 100 + TAP_SLOP_PX + 1 }, { clientX: -1 }]) {
    assert.equal(isPlacementTap(start, { ...release, ...extra }, options), false);
  }
  assert.equal(isPlacementTap({ ...start, multitouch: true }, release, options), false);
});

const webgl = readFileSync(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
function block(source, from, to) { return source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from))); }

test("actual canvas release places once at the tapped coordinate and ignores UI or cancelled releases", () => {
  for (const planar of [false,true]) for (const scenario of ["tap", "overlay", "cancel", "other-finger", "orbit", "outside"]) {
    const placed = [], canvas = { getBoundingClientRect: () => rect };
    const context = vm.createContext({ planar, tapControls: false, pointerStart: { ...start }, draggedNode: null, moved: scenario === "orbit",
      movePreviewPending: false, currentSelectedItem: "satellite", renderer: { domElement: canvas }, controls: {},
      document: { elementFromPoint: () => scenario === "overlay" ? {} : canvas }, isPlacementTap,
      geoFromPointer: (x, y) => ({ latitude: y, longitude: x }), onPlace: (item, geo) => placed.push({ item, geo }),
      satelliteDragGuide: { group: {} }, setHoveredHitTarget() {} });
    vm.runInContext(block(webgl, "  const finishNodeDrag =", "  const onPointerLeave ="), context);
    context.event = { ...release, ...(scenario === "other-finger" ? { pointerId: 2 } : {}), ...(scenario === "outside" ? { clientX: 700 } : {}) };
    const method = scenario === "cancel" ? "onPointerCancel" : "onPointerUp";
    vm.runInContext(`${method}(event); ${method}(event);`, context);
    assert.equal(placed.length, scenario === "tap" ? 1 : 0, scenario);
    if (scenario === "tap") assert.deepEqual(placed, [{ item: "satellite", geo: { latitude: 100, longitude: 103 } }]);
  }
});

test("inventory pointerdown starts a drag only in drag mode; card clicks select in both modes", () => {
  for (const mode of ["tap", "drag"]) {
    let drags = 0;
    const actions = [], card = { dataset: { item: "satellite" }, disabled: false };
    const context = vm.createContext({ debugEnabled: true, placementMode: mode, languageTransitionPromise: null, suppressPointerClick: false,
      beginPointerDrag: () => drags++, updateMission: (action) => actions.push(action) });
    vm.runInContext(block(main, "function onMissionLayerClick(", "function beginOutcomePopupDrag("), context);
    const event = { target: { closest: (selector) => selector === "[data-item].inventory-item" ? card : null } };
    context.onMissionLayerPointerDown(event);
    context.onMissionLayerClick(event);
    assert.equal(drags, mode === "drag" ? 1 : 0);
    assert.equal(actions.length, 1); assert.equal(actions[0].item, "satellite");
    card.disabled = true; context.onMissionLayerClick(event);
    assert.equal(actions.length, 1);
  }
});

test("canvas pointerdown keeps ownership of the first finger and invalidates a two-finger tap", () => {
  const context = vm.createContext({ tapControls: false, pointerStart: null, moved: false, freeOrbit: false, currentSelectedItem: "satellite",
    updatePointer: () => rect, raycaster: { intersectObjects: () => [] }, nodeMeshes: [] });
  vm.runInContext(block(webgl, "  const onPointerDown =", "  const dragGeoFromPointer ="), context);
  vm.runInContext("onPointerDown({button:0,pointerId:2,isPrimary:false,clientX:100,clientY:100})", context);
  assert.equal(context.pointerStart, null);
  vm.runInContext("onPointerDown({button:0,pointerId:1,isPrimary:true,clientX:100,clientY:100})", context);
  vm.runInContext("onPointerDown({button:0,pointerId:2,isPrimary:false,clientX:102,clientY:100})", context);
  assert.equal(context.pointerStart.pointerId, 1);
  assert.equal(context.pointerStart.multitouch, true);
  assert.equal(isPlacementTap(context.pointerStart, release, { item: "satellite", rect }), false);
});
