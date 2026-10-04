import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { TAP_SLOP_PX } from "../src/placement-input.mjs";

// Execute the actual event handlers with deterministic DOM/renderer adapters.
// No browser or GPU is required to verify transaction ordering and cancellation.
const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const webgl = await readFile(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const editor = await readFile(new URL("../src/editor-main.js", import.meta.url), "utf8");
function block(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from); return source.slice(from,to);
}

test("node release restores the original mesh before validation and uses release coordinates", () => {
  const events = [], origin = { latitude: 55, longitude: 37 }, release = { latitude: 35, longitude: 160 };
  const node = { id: 7, group: { userData: { icon: { material: { color: { setHex() {} } } } } }, preview: { latitude: 60, longitude: 80 }, dragOriginGeo: origin };
  const context = vm.createContext({ tapControls: false, pointerStart: { pointerId: 1 }, draggedNode: node, moved: true, movePreviewPending: true,
    renderer: { domElement: { hasPointerCapture: () => true, releasePointerCapture: () => events.push("release-capture") } }, controls: { enabled: false },
    dragGeoFromPointer: (event) => { assert.equal(event.clientX, 333); return release; },
    updateNodeTransform: (_group, geo) => { assert.equal(geo,origin); events.push("restore"); },
    onMove: (id,geo) => { assert.equal(id,7); assert.equal(geo,release); events.push("validate"); },
    onMoveCancel: () => events.push("cancel"), satelliteDragGuide: { group: {} }, setHoveredHitTarget() {}, currentSelectedItem: null });
  vm.runInContext(block(webgl,"  const finishNodeDrag =", "  const onPointerLeave ="),context);
  vm.runInContext("onPointerUp({ pointerId: 1, clientX: 333 })",context);
  assert.deepEqual(events,["release-capture","restore","validate"]);
  assert.equal(context.controls.enabled,true);
  assert.equal(context.draggedNode,null);
  assert.equal(node.preview,null);
  assert.equal(context.movePreviewPending,false);
  vm.runInContext("onPointerUp({ pointerId: 1, clientX: 333 })",context);
  assert.equal(events.length,3, "duplicate release has no effect");
});

test("pointercancel and release outside Earth roll back without committing or reporting water", () => {
  for (const cancelled of [true,false]) {
    const events = [], context = vm.createContext({ tapControls: false, pointerStart: {}, moved: true, movePreviewPending: true,
      draggedNode: { id: 1, preview: {}, dragOriginGeo: {}, group: { userData: { icon: { material: { color: { setHex() {} } } } } } },
      renderer: { domElement: {} }, controls: {}, dragGeoFromPointer: () => null,
      updateNodeTransform: () => events.push("restore"), onMove: () => events.push("commit"), onMoveCancel: () => events.push("cancel"),
      satelliteDragGuide: { group: {} }, setHoveredHitTarget() {}, currentSelectedItem: null });
    vm.runInContext(block(webgl,"  const finishNodeDrag =", "  const onPointerLeave ="),context);
    vm.runInContext(cancelled ? "onPointerCancel({})" : "onPointerUp({})",context);
    assert.deepEqual(events,["restore","cancel"]);
  }
});

function inventoryHarness() {
  const events = [], listeners = new Map(); let resolveSettle;
  const classes = { add() {}, remove() {}, toggle() {} };
  const ghost = { classList: classes, dataset: {}, remove: () => events.push("ghost-removed") };
  const context = vm.createContext({ missionRun: { status: "playing" }, state: { screen: "play" }, STATES: { MISSION_PLAY: "play" }, placementSession: 1,
    performance: { now: () => 10 }, window: { addEventListener: (type, fn) => listeners.set(type,fn), removeEventListener: (type) => listeners.delete(type) },
    document: { createElement: () => ghost, body: { append() {} } }, objectCard: () => "card", moveGhost() {},
    worldLayer: { getBoundingClientRect: () => ({ left: 0, top: 0, right: 500, bottom: 500 }) },
    webglField: { projectDrop: (x,y) => { events.push(["project",x,y]); return { latitude: 35, longitude: 160 }; } },
    getPlacementRejection: () => "water", placementErrorReason: (x) => x, t: (x) => x,
    clamp: (n,a,b) => Math.min(b,Math.max(a,n)), setTimeout() {},
    settleGhost: () => { events.push("settling"); return new Promise((resolve) => { resolveSettle = resolve; }); },
    showPlacementError: (reason) => events.push(["error",reason]), updateMission: () => events.push("commit") });
  vm.runInContext(block(main,"function beginPointerDrag(","function moveGhost("),context);
  const source = { dataset: { item: "terminal" }, matches: () => false, classList: classes };
  context.source = source;
  vm.runInContext("beginPointerDrag({ button: 0, clientX: 10, clientY: 10 },source)",context);
  listeners.get("pointermove")({ clientX: 100, clientY: 100 });
  return { context,events,listeners,settled: () => resolveSettle() };
}

test("valid inventory drop commits on release before its decorative settle finishes", async () => {
  const h = inventoryHarness();
  h.context.getPlacementRejection = () => null;
  const finished = h.listeners.get("pointerup")({ clientX: 100, clientY: 100 });
  assert.deepEqual(h.events.slice(-2), ["commit", "settling"]);
  h.settled(); await finished;
  assert.equal(h.events.filter(event => event === "commit").length, 1);
});

test("water inventory drop uses inertia and shows exactly one error after rollback finishes", async () => {
  const h = inventoryHarness();
  assert.equal(h.events.some((event) => event[0] === "error"),false);
  const finished = h.listeners.get("pointerup")({ clientX: 100, clientY: 100 });
  assert.deepEqual(h.events.at(-2),["project",144,144]);
  assert.equal(h.events.at(-1),"settling");
  assert.equal(h.listeners.size,0);
  h.settled(); await finished;
  assert.deepEqual(h.events.slice(-2),["ghost-removed",["error","water"]]);
  assert.equal(h.events.includes("commit"),false);
});

test("cancel and mission changes suppress stale inventory errors", async () => {
  const cancelled = inventoryHarness(); cancelled.listeners.get("pointercancel")();
  assert.equal(cancelled.listeners.size,0);
  assert.equal(cancelled.events.at(-1),"ghost-removed");
  assert.equal(cancelled.events.includes("settling"),false);
  const changed = inventoryHarness();
  const finished = changed.listeners.get("pointerup")({ clientX: 100, clientY: 100 });
  changed.context.placementSession++; changed.settled(); await finished;
  assert.equal(changed.events.some((event) => event[0] === "error"),false);
  assert.equal(changed.events.includes("commit"),false);
});

test("reducer refusal restores the preview network before requesting the player popup", () => {
  const events = [], run = { placements: [{ id: 1, type: "terminal" }] };
  const context = vm.createContext({ missionRun: run, state: { screen: "play" }, STATES: { MISSION_PLAY: "play" },
    reduceMission: (run) => run, getPlacementRejection: () => "water", renderMission: () => events.push("restore-network"), showPlacementError: () => events.push("error") });
  vm.runInContext(block(main,"function updateMission(","function placementErrorReason("),context);
  vm.runInContext('updateMission({ type: "MOVE", id: 1, latitude: 35, longitude: 160 })',context);
  assert.deepEqual(events,["restore-network","error"]);
  assert.equal(context.missionRun,run);
});

test("editor test mode restores the renderer before showing the translated error toast", () => {
  const events = [], context = vm.createContext({ testMode: true, testRun: { placements: [{ id: 1, type: "terminal" }] },
    availableCount: () => 1, reduceMission: (run) => run, syncWebGL: () => events.push("restore"),
    getPlacementRejection: () => "water", placementText: (key) => key, showToast: (text,error) => events.push([text,error]) });
  vm.runInContext(block(editor,"function testAction(","function previewTestMove("),context);
  vm.runInContext('testAction({ type: "MOVE", id: 1, latitude: 35, longitude: 160 })',context);
  assert.deepEqual(events,["restore",["placement.water.message",true]]);
});

test("placement popup animates once per attempt and respects reduced motion", () => {
  for (const reduced of [false,true]) {
    const events = [], popup = { dataset: {}, setAttribute() {}, getAnimations: () => [], animate: () => events.push("slide") };
    const context = vm.createContext({ popup, t: (x) => x, escapeHtml: (x) => x, audioAdapter: { onFeedbackShown: () => events.push("sound") },
      positionOutcomePopup() {}, window: { matchMedia: () => ({ matches: reduced }) }, shellConfig: { motion: { microDurationMs: 200 } } });
    vm.runInContext(block(main,"function showOutcomePopup(","function hideOutcomePopup("),context);
    for (const key of ["attempt-1","attempt-1","attempt-2"]) {
      context.outcome = { key, kind: "error", action: "placement", title: "НЕЛЬЗЯ УСТАНОВИТЬ НА ВОДУ", message: "Разместите объект на суше." };
      vm.runInContext("showOutcomePopup(popup,{},outcome)",context);
    }
    assert.equal(events.filter((event) => event === "sound").length,2);
    assert.equal(events.filter((event) => event === "slide").length,reduced ? 0 : 2);
    assert.match(popup.innerHTML,/dismiss-outcome/);
  }
});


test("leaving the drag field keeps the last preview as the orbit branch reference", () => {
  const preview = { latitude: 86.1, longitude: 50, altitude: 0.72 };
  const node = { id: 7, preview };
  const context = vm.createContext({ tapControls: false, pointerStart: { x: 10, y: 10 }, moved: false, TAP_SLOP_PX,
    draggedNode: node, dragGeoFromPointer: () => null,
    renderer: { domElement: { style: {} } }, placementRejection: () => null });
  vm.runInContext(block(webgl, "  const onPointerMove =", "  const finishNodeDrag ="), context);
  vm.runInContext("onPointerMove({clientX: 900, clientY: 900})", context);
  assert.equal(node.preview, preview);
  assert.equal(node.placementBlocked, "outside");
});
