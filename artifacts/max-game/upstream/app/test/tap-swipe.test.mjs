import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { ORBIT_MOTION } from "../src/webgl-field.js";
import { isCanvasTap, TAP_SLOP_PX } from "../src/placement-input.mjs";

const source = readFileSync(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const block = (from, to) => source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from)));

// Run both actual listener sets in DOM registration order. Fixed picking and
// projection isolate gesture ownership from terrain eligibility and rendering.
function harness(operation = "new", pointerType = "touch") {
  const commits = [], rect = { left: 0, top: 0, right: 1280, bottom: 720 };
  const canvas = { clientHeight: 720, setPointerCapture() {}, releasePointerCapture() {},
    hasPointerCapture: () => true, getBoundingClientRect: () => rect };
  let announcements = 0;
  const controls = { enabled: true, pointerId: null, freeOrbit: false, preciseOrbit: false,
    yaw: .2, pitch: .1, roll: 0, radius: 7.2, velocityYaw: 2, velocityPitch: 1,
    target: new THREE.Vector3(), targetTarget: new THREE.Vector3(), domElement: canvas,
    yawBoundaryFactor: () => 1, pitchBoundaryFactor: () => 1, clampYaw: (v) => v, clampPitch: (v) => v,
    onOrbitGestureStart: () => announcements++ };
  const ctx = vm.createContext({ THREE, ORBIT_MOTION, controls, isCanvasTap, TAP_SLOP_PX,
    tapControls: true, currentSelectedItem: operation === "new" ? "satellite" : null,
    selectedPlacementId: operation === "move" ? 1 : null, pointerStart: null, moved: false, draggedNode: null,
    freeOrbit: false, renderer: { domElement: canvas }, document: { elementFromPoint: () => canvas },
    updatePointer: () => rect, raycaster: { intersectObjects: () => operation === "select"
      ? [{ object: { userData: { placement: { id: 1 } } } }] : [] }, nodeMeshes: [],
    nodesById: new Map([[1, { userData: { placement: { id: 1, type: "satellite", altitude: .9 } } }]]),
    geoFromPointer: () => ({ latitude: 50, longitude: 60, altitude: .9 }),
    onPlace: () => commits.push("PLACE"), onMove: () => commits.push("MOVE"),
    onSelectPlacement: () => commits.push("SELECT") });
  vm.runInContext(`(function() { ${block("    this.onPointerDown =", "    this.onWheel =")} }).call(controls);`, ctx);
  vm.runInContext(block("  const onPointerDown =", "  const dragGeoFromPointer =")
    + block("  const onPointerMove =", "  const onPointerLeave =")
    + "\nglobalThis.gameDown=onPointerDown; globalThis.gameMove=onPointerMove; globalThis.gameUp=onPointerUp; globalThis.gameCancel=onPointerCancel;", ctx);
  let time = 0;
  function dispatch(type, dx = 0, dy = 0, extra = {}) {
    const event = { type, pointerType, pointerId: 1, isPrimary: true, button: 0,
      clientX: 400 + dx, clientY: 300 + dy, timeStamp: (time += 16),
      preventDefault() {}, stopImmediatePropagation() { throw Error("Tap mode must not start node drag"); }, ...extra };
    if (type === "pointerdown") { ctx.gameDown(event); controls.onPointerDown(event); }
    if (type === "pointermove") { ctx.gameMove(event); controls.onPointerMove(event); }
    if (type === "pointerup") { ctx.gameUp(event); controls.onPointerUp(event); }
    if (type === "pointercancel") { ctx.gameCancel(event); controls.onPointerUp(event); }
  }
  return { ctx, controls, commits, dispatch, get announcements() { return announcements; } };
}

for (const operation of ["new", "move", "select", "none"]) {
  test(`tap/swipe arbitration with ${operation}: jitter commits only a tap, swipes only rotate`, () => {
    const expected = { new: ["PLACE"], move: ["MOVE"], select: ["SELECT"], none: [] }[operation];
    for (const pointerType of ["mouse", "touch", "pen"]) {
      const slop = pointerType === "mouse" ? 8 : 16;
      for (const offset of [0, 3, slop]) {
        const h = harness(operation, pointerType);
        h.dispatch("pointerdown"); h.dispatch("pointermove", offset);
        assert.equal(h.controls.targetYaw, .2); assert.equal(h.controls.targetPitch, .1);
        h.dispatch("pointerup", offset);
        assert.deepEqual(h.commits, expected, `${pointerType} ${offset}px`);
        assert.equal(h.controls.velocityYaw, 0); assert.equal(h.controls.velocityPitch, 0);
        assert.equal(h.announcements, 0); assert.equal(h.controls.tapGesture, null);
      }
      for (const returnToStart of [false, true]) {
        const h = harness(operation, pointerType);
        h.dispatch("pointerdown"); h.dispatch("pointermove", slop + 1);
        const onePixelAngle = Math.PI * 2 * ORBIT_MOTION.sensitivity / 720;
        assert.ok(Math.abs(h.controls.targetYaw - (.2 - onePixelAngle)) < 1e-10, "no dead-zone jump");
        if (returnToStart) h.dispatch("pointermove", 0);
        h.dispatch("pointerup", returnToStart ? 0 : slop + 1);
        assert.deepEqual(h.commits, []); assert.equal(h.announcements, 1);
        assert.equal(h.ctx.draggedNode, null);
        assert.equal(h.ctx.currentSelectedItem, operation === "new" ? "satellite" : null);
        assert.equal(h.ctx.selectedPlacementId, operation === "move" ? 1 : null);
      }
    }
  });
}

test("diagonal displacement and release-only displacement cannot bypass the tap threshold", () => {
  const h = harness(); h.dispatch("pointerdown"); h.dispatch("pointermove", 12, 12);
  assert.notEqual(h.controls.targetYaw, .2); assert.notEqual(h.controls.targetPitch, .1);
  h.dispatch("pointerup", 12, 12); assert.deepEqual(h.commits, []);
  const release = harness(); release.dispatch("pointerdown"); release.dispatch("pointerup", 17);
  assert.deepEqual(release.commits, []); assert.equal(release.controls.targetYaw, .2);
});

test("cancel, multiple fingers, changing selection and overlays never commit a tap", () => {
  for (const scenario of ["cancel", "multitouch", "changed", "overlay", "outside"]) {
    const h = harness("move"); h.dispatch("pointerdown");
    if (scenario === "multitouch") h.dispatch("pointerdown", 0, 0, { pointerId: 2, isPrimary: false });
    if (scenario === "changed") h.ctx.selectedPlacementId = null;
    if (scenario === "overlay") h.ctx.document.elementFromPoint = () => ({});
    h.dispatch(scenario === "cancel" ? "pointercancel" : "pointerup", scenario === "outside" ? 1000 : 3);
    assert.deepEqual(h.commits, [], scenario); assert.equal(h.controls.pointerId, null);
    assert.equal(h.controls.tapGesture, null);
    h.ctx.selectedPlacementId = 1; h.ctx.document.elementFromPoint = () => h.controls.domElement;
    h.dispatch("pointerdown"); h.dispatch("pointerup");
    assert.deepEqual(h.commits, ["MOVE"], "next gesture starts fresh");
  }
});

test("cancelled swipe drops inertia and a later tap does not inherit swipe ownership", () => {
  const h = harness(); h.dispatch("pointerdown"); h.dispatch("pointermove", 40);
  assert.notEqual(h.controls.velocityYaw, 0);
  h.dispatch("pointercancel", 40); assert.equal(h.controls.velocityYaw, 0);
  h.dispatch("pointerdown"); h.dispatch("pointerup"); assert.deepEqual(h.commits, ["PLACE"]);
});

test("legacy camera input has no tap dead zone", () => {
  const h = harness(); h.ctx.tapControls = false;
  const event = { pointerId: 1, button: 0, clientX: 0, clientY: 0, timeStamp: 0, preventDefault() {} };
  h.controls.onPointerDown(event);
  h.controls.onPointerMove({ ...event, clientX: 3, timeStamp: 16 });
  assert.notEqual(h.controls.targetYaw, .2);
});
