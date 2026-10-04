import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseObjectSettings, resolveSignalRadius, SATELLITE_MIN_ALTITUDE, SATELLITE_MAX_ALTITUDE } from "../src/node-settings.mjs";
import { parseMissionCatalog } from "../src/mission-config.mjs";
import { toEditableCatalog, serializableCatalog } from "../src/editor-state.mjs";
import { configureMissions, createMissionRun, reduceMission, deriveNetwork, routeIsConnected, signalRadiusFor, NODE_WAKE_DELAY_MS } from "../src/mission-game.mjs";
import { createNode, updateNodeTransform, GROUND_NODE_STEM_HEIGHT } from "../src/webgl-field.js";
import { missionCatalog, rawMissionCatalog } from "./config-fixture.mjs";

test("signal radius interpolates at both altitude limits and midpoint, with clamping", () => {
  const settings = parseObjectSettings({ satellite: { radiusAtMinAltitude: 0.4, radiusAtMaxAltitude: 1.2 } });
  const radius = (altitude) => resolveSignalRadius({ type: "satellite", altitude }, settings);
  assert.equal(radius(SATELLITE_MIN_ALTITUDE), 0.4);
  assert.equal(radius(SATELLITE_MAX_ALTITUDE), 1.2);
  assert.ok(Math.abs(radius((SATELLITE_MIN_ALTITUDE + SATELLITE_MAX_ALTITUDE) / 2) - 0.8) < 1e-10);
  assert.equal(radius(-10), 0.4);
  assert.equal(radius(10), 1.2);
  const descending = parseObjectSettings({ satellite: { radiusAtMinAltitude: 1.2, radiusAtMaxAltitude: 0.4 } });
  assert.ok(resolveSignalRadius({ type: "satellite", altitude: 1.3 }, descending) < resolveSignalRadius({ type: "satellite", altitude: 0.4 }, descending));
});

test("settings migrate legacy catalogs and survive editor and serialization", () => {
  const raw = structuredClone(rawMissionCatalog);
  delete raw.objectSettings;
  assert.equal(parseMissionCatalog(raw).objectSettings.terminal.size, 1);
  raw.objectSettings = { terminal: { size: 2, signalRadius: 0.9 }, satellite: { signalRadius: 0.6 }, "endpoint:A": { size: 0.5 } };
  const parsed = parseMissionCatalog(raw);
  assert.equal(parsed.objectSettings.satellite.radiusAtMinAltitude, 0.6);
  assert.equal(parsed.objectSettings.satellite.radiusAtMaxAltitude, 0.6);
  assert.deepEqual(serializableCatalog(toEditableCatalog(parsed)).objectSettings, parsed.objectSettings);
  for (const invalid of [{ terminal: { size: 0 } }, { satellite: { radiusAtMaxAltitude: -1 } }, { core: { signalRadius: null } }, { terminal: null }, { typo: {} }]) {
    assert.throws(() => parseObjectSettings(invalid), /objectSettings/);
  }
});

test("altitude-dependent coverage changes actual network connections", () => {
  const raw = structuredClone(rawMissionCatalog);
  raw.objectSettings.satellite.radiusAtMinAltitude = 0.01;
  raw.objectSettings.satellite.radiusAtMaxAltitude = 2;
  configureMissions(parseMissionCatalog(raw));
  try {
    let run = reduceMission(createMissionRun(2), { type: "PLACE", item: "terminal", latitude: 45, longitude: 0, now: 0 });
    run = reduceMission(run, { type: "PLACE", item: "satellite", latitude: 45, longitude: 20, altitude: SATELLITE_MIN_ALTITUDE, now: 0 });
    assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.length, 0);
    run = reduceMission(run, { type: "MOVE", id: 2, latitude: 45, longitude: 20, altitude: SATELLITE_MAX_ALTITUDE, now: 0 });
    assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.length, 1);
  } finally { configureMissions(missionCatalog); }
});

test("endpoint radius can prevent completion and its closing links", () => {
  const raw = structuredClone(rawMissionCatalog);
  raw.objectSettings["endpoint:A"].signalRadius = 0.01;
  configureMissions(parseMissionCatalog(raw));
  try {
    let run = createMissionRun(1);
    for (const [index, item] of raw.missions[0].route.entries()) run = reduceMission(run, { type: "PLACE", item, latitude: -45, longitude: -30 + index * 10, now: 0 });
    assert.equal(routeIsConnected(run, NODE_WAKE_DELAY_MS), false);
    assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.some((link) => link.endpoint), false);
  } finally { configureMissions(missionCatalog); }
});

test("node sizes scale marker and hit area but not coverage; altitude updates reuse geometry", () => {
  const raw = structuredClone(rawMissionCatalog);
  raw.objectSettings.terminal.size = 2;
  raw.objectSettings.satellite.size = 1.5;
  raw.objectSettings.satellite.radiusAtMinAltitude = 0.3;
  raw.objectSettings.satellite.radiusAtMaxAltitude = 1.2;
  configureMissions(parseMissionCatalog(raw));
  const geometry = new THREE.PlaneGeometry(0.1, 0.1);
  const groups = [];
  try {
    const ground = createNode({ id: 1, type: "terminal", latitude: 45, longitude: 40, altitude: 0.08 }, "base", geometry);
    groups.push(ground);
    assert.equal(ground.scale.x, 2);
    assert.equal(ground.userData.stemHeight, 2 * GROUND_NODE_STEM_HEIGHT);
    assert.equal(ground.userData.iconBackdrop.material.blending, THREE.NormalBlending);
    assert.equal(ground.userData.iconBackdrop.material.opacity, 0.9);
    assert.ok(ground.userData.iconBackdrop.renderOrder < ground.userData.icon.renderOrder);
    const satellite = { id: 2, type: "satellite", latitude: 45, longitude: 50, altitude: SATELLITE_MIN_ALTITUDE };
    const group = createNode(satellite, "base", geometry);
    groups.push(group);
    const plate = group.userData.plate;
    const originalGeometry = plate.geometry;
    const visibleRadius = () => plate.scale.x * group.scale.x * group.userData.material.uniforms.uWaveEnd.value;
    assert.ok(Math.abs(visibleRadius() - signalRadiusFor(satellite)) < 1e-10);
    satellite.altitude = SATELLITE_MAX_ALTITUDE;
    updateNodeTransform(group, satellite);
    assert.equal(plate.geometry, originalGeometry);
    assert.ok(Math.abs(visibleRadius() - 1.2) < 1e-10);
    assert.equal(group.scale.x, 1.5);
    updateNodeTransform(group, { latitude: 45, longitude: 50, altitude: SATELLITE_MIN_ALTITUDE });
    assert.ok(Math.abs(visibleRadius() - 0.3) < 1e-10, "Drag preview без type сохраняет высотный радиус спутника");
  } finally {
    for (const group of groups) group.traverse((object) => { if (object.geometry !== geometry) object.geometry?.dispose(); object.material?.dispose(); });
    geometry.dispose();
    configureMissions(missionCatalog);
  }
});
