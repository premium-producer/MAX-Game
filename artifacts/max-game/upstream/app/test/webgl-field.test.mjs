import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { DEFAULT_SIGNAL_LINK_STYLE, EARTH_RADIUS, EMISSIVE_BLOOM_HIGH_MAX_HEIGHT, EMISSIVE_BLOOM_HIGH_MAX_WIDTH, EMISSIVE_BLOOM_MEDIUM_MAX_HEIGHT, EMISSIVE_BLOOM_MEDIUM_MAX_WIDTH, GROUND_ALTITUDE, GROUND_NODE_STEM_HEIGHT, MAP_CAMERA_DISTANCE, MAX_DRAWING_BUFFER_PIXELS, NODE_SURFACE_ALTITUDE, NODE_TRANSITION_RATE, ORBIT_ALTITUDE, ORBIT_MOTION, REFERENCE_CAMERA, RUSSIA_VIEW, SATELLITE_MAX_ALTITUDE, SATELLITE_MIN_ALTITUDE, SURFACE_LINK_ALTITUDE, WORLD_HDR_MSAA_FULL_RES_PIXELS, cameraIdleSway, cameraSettleProgress, constrainSatellitePosition, createConnectionCurve, dragAnchorPointer, geoToVector, iconLinkAnchor, intersectSphereContinuously, intersectVisibleSphereContinuously, missionMarkerFrame, nearestEquivalentAngle, nodeMarkerFrame, nodeStemHeight, nodeVisualTarget, projectedEarthDiscRadius, resolveEarthOrbitPreferences, resolveEmissiveBloomSize, resolveRenderPixelRatio, resolveWorldMsaaSamples, satelliteAltitudeFromPointer, signalLinkColor, softBoundaryFactor, verticalCenteringOffset } from "../src/webgl-field.js";

test("drawing buffer resolves clean Full HD and 4K output without exceeding the 4K budget", () => {
  assert.equal(resolveRenderPixelRatio(1920, 1080, 1920, 1080, 1), 1);
  assert.equal(resolveRenderPixelRatio(1920, 1080, 3840, 2160, 1), 2);
  assert.equal(resolveRenderPixelRatio(1920, 1080, 1920, 1080, 2), 2);
  assert.equal(resolveRenderPixelRatio(1920, 1080, 960, 540, 1), 0.5);
  assert.equal(resolveRenderPixelRatio(1920, 1080, 7680, 4320, 2), 2);
  assert.equal(MAX_DRAWING_BUFFER_PIXELS, 3840 * 2160);
});

test("shared emissive bloom has deterministic high, medium and off quality budgets", () => {
  assert.deepEqual(resolveEmissiveBloomSize(1920, 1080, "high"), { width: 1920, height: 1080 });
  assert.deepEqual(resolveEmissiveBloomSize(3840, 2160, "high"), { width: 1920, height: 1080 });
  assert.deepEqual(resolveEmissiveBloomSize(3840, 2160, "medium"), { width: 1280, height: 720 });
  assert.deepEqual(resolveEmissiveBloomSize(640, 640, "high"), { width: 640, height: 640 });
  assert.deepEqual(resolveEmissiveBloomSize(640, 640, "off"), { width: 1, height: 1 });
  assert.equal(EMISSIVE_BLOOM_HIGH_MAX_WIDTH, 1920);
  assert.equal(EMISSIVE_BLOOM_HIGH_MAX_HEIGHT, 1080);
  assert.equal(EMISSIVE_BLOOM_MEDIUM_MAX_WIDTH, 1280);
  assert.equal(EMISSIVE_BLOOM_MEDIUM_MAX_HEIGHT, 720);
});

test("world HDR target keeps adaptive MSAA without multiplying the 4K budget by four", () => {
  assert.equal(resolveWorldMsaaSamples(1920, 1080, 8), 4);
  assert.equal(resolveWorldMsaaSamples(3840, 2160, 8), 2);
  assert.equal(resolveWorldMsaaSamples(1920, 1080, 2), 2);
  assert.equal(resolveWorldMsaaSamples(1920, 1080, 1), 0);
  assert.equal(WORLD_HDR_MSAA_FULL_RES_PIXELS, 1920 * 1080);
});

test("atmosphere disc radius follows perspective silhouette instead of fixed UV thresholds", () => {
  const near = projectedEarthDiscRadius(6);
  const far = projectedEarthDiscRadius(12);
  const offAxisDistance = Math.hypot(7.2, 2.31);
  const offAxis = projectedEarthDiscRadius(offAxisDistance, EARTH_RADIUS, EARTH_RADIUS * 1.4, 7.2);
  const incorrectEuclideanDepth = projectedEarthDiscRadius(offAxisDistance);
  assert.ok(near > far);
  assert.ok(near > 0 && near < 1);
  assert.ok(far > 0 && far < 1);
  assert.ok(offAxis < incorrectEuclideanDepth);
});

test("ground nodes are projected onto the Earth surface", () => {
  const position = geoToVector({ latitude: 45, longitude: 60, altitude: GROUND_ALTITUDE });
  assert.ok(Math.abs(position.length() - (EARTH_RADIUS + GROUND_ALTITUDE)) < 1e-9);
});

test("satellites are projected onto an outer orbital shell", () => {
  const ground = geoToVector({ latitude: 0, longitude: 0, altitude: GROUND_ALTITUDE });
  const satellite = geoToVector({ latitude: 0, longitude: 0, altitude: ORBIT_ALTITUDE });
  assert.ok(satellite.length() > ground.length());
  assert.ok(Math.abs(satellite.length() - (EARTH_RADIUS + ORBIT_ALTITUDE)) < 1e-9);
});

test("ground nodes use a raised marker while satellites remain orbital", () => {
  assert.ok(GROUND_NODE_STEM_HEIGHT > 0);
  assert.equal(nodeStemHeight("terminal"), GROUND_NODE_STEM_HEIGHT);
  assert.equal(nodeStemHeight("gateway"), GROUND_NODE_STEM_HEIGHT);
  assert.equal(nodeStemHeight("core"), GROUND_NODE_STEM_HEIGHT);
  assert.equal(nodeStemHeight("internet"), GROUND_NODE_STEM_HEIGHT);
  assert.equal(nodeStemHeight("satellite"), 0);
});

test("network links terminate at icon height rather than the ground anchor", () => {
  const root = new THREE.Vector3(1, 2, 3);
  const identity = new THREE.Quaternion();
  assert.deepEqual(iconLinkAnchor(root, GROUND_NODE_STEM_HEIGHT, identity).toArray(), [1, 2 + GROUND_NODE_STEM_HEIGHT, 3]);
  assert.deepEqual(iconLinkAnchor(root, 0, identity).toArray(), root.toArray());
  assert.equal(DEFAULT_SIGNAL_LINK_STYLE.strandCount, 5);
  assert.equal(DEFAULT_SIGNAL_LINK_STYLE.segmentCount, 80);
  assert.equal(DEFAULT_SIGNAL_LINK_STYLE.particleCount, 32);
  assert.equal(DEFAULT_SIGNAL_LINK_STYLE.strandSpacing, 0.0045);
});

test("endpoint closing link follows the Earth surface", () => {
  const curve = createConnectionCurve(RUSSIA_VIEW.endpoints.B, RUSSIA_VIEW.endpoints.A, true);
  for (const point of curve.getPoints(16)) {
    assert.ok(Math.abs(point.length() - (EARTH_RADIUS + SURFACE_LINK_ALTITUDE)) < 1e-6);
  }
});

test("node drag preserves the original grab point relative to its anchor", () => {
  const offset = { x: 18, y: -42 };
  assert.deepEqual(dragAnchorPointer(400, 300, offset), { x: 382, y: 342 });
  assert.deepEqual(dragAnchorPointer(420, 315, offset), { x: 402, y: 357 });
  assert.deepEqual(dragAnchorPointer(400, 300), { x: 400, y: 300 });
});

test("satellite drag keeps the continuous side of the orbital shell", () => {
  const radius = EARTH_RADIUS + ORBIT_ALTITUDE;
  const ray = new THREE.Ray(new THREE.Vector3(0, 0, 6), new THREE.Vector3(0, 0, -1));
  const near = intersectSphereContinuously(ray, radius);
  const farReference = new THREE.Vector3(0, 0, -radius);
  const far = intersectSphereContinuously(ray, radius, farReference);
  assert.ok(Math.abs(near.z - radius) < 1e-9);
  assert.ok(Math.abs(far.z + radius) < 1e-9);
});

test("satellite drag preview without a type remains on the orbital shell", () => {
  const preview = { latitude: 64, longitude: 105, altitude: ORBIT_ALTITUDE };
  const frame = nodeMarkerFrame(preview, "satellite");
  assert.ok(Math.abs(frame.anchorPosition.length() - (EARTH_RADIUS + ORBIT_ALTITUDE)) < 1e-9);
});

test("free satellite position is clamped by altitude and Earth visibility", () => {
  const camera = new THREE.Vector3(0, 0, 6);
  const tooLow = constrainSatellitePosition(new THREE.Vector3(0, 0, EARTH_RADIUS + 0.05), camera);
  const tooHigh = constrainSatellitePosition(new THREE.Vector3(0, 0, EARTH_RADIUS + 5), camera);
  const behindEarth = constrainSatellitePosition(new THREE.Vector3(0, 0, -(EARTH_RADIUS + ORBIT_ALTITUDE)), camera);
  assert.ok(Math.abs(tooLow.length() - (EARTH_RADIUS + SATELLITE_MIN_ALTITUDE)) < 1e-9);
  assert.ok(Math.abs(tooHigh.length() - (EARTH_RADIUS + SATELLITE_MAX_ALTITUDE)) < 1e-9);
  assert.ok(behindEarth.z > 0);
  assert.ok(Math.abs(behindEarth.length() - (EARTH_RADIUS + SATELLITE_MIN_ALTITUDE)) < 1e-9);
});

test("satellite surface drag rejects an occluded branch instead of switching sides", () => {
  const camera = new THREE.Vector3(0, 0, 6);
  const radius = EARTH_RADIUS + ORBIT_ALTITUDE;
  const ray = new THREE.Ray(camera.clone(), new THREE.Vector3(0, 0, -1));
  const hiddenReference = new THREE.Vector3(0, 0, -radius);
  assert.equal(intersectVisibleSphereContinuously(ray, radius, camera, hiddenReference), null);
  const hit = intersectVisibleSphereContinuously(ray, radius, camera);
  assert.ok(Math.abs(hit.length() - radius) < 1e-9);
  assert.ok(hit.z > 0);
});

test("satellite altitude handle changes only height and clamps its range", () => {
  const middle = satelliteAltitudeFromPointer(ORBIT_ALTITUDE, 400, 300, 800);
  const minimum = satelliteAltitudeFromPointer(ORBIT_ALTITUDE, 400, 5000, 800);
  const maximum = satelliteAltitudeFromPointer(ORBIT_ALTITUDE, 400, -5000, 800);
  assert.ok(middle > ORBIT_ALTITUDE);
  assert.equal(minimum, SATELLITE_MIN_ALTITUDE);
  assert.equal(maximum, SATELLITE_MAX_ALTITUDE);
});

test("ground marker base hugs Earth while preserving the local surface normal", () => {
  const frame = nodeMarkerFrame({ type: "terminal", latitude: 62, longitude: 90, altitude: GROUND_ALTITUDE });
  assert.ok(Math.abs(frame.anchorPosition.length() - (EARTH_RADIUS + NODE_SURFACE_ALTITUDE)) < 1e-9);
  assert.ok(NODE_SURFACE_ALTITUDE < GROUND_ALTITUDE);
  assert.ok(frame.anchorPosition.clone().normalize().dot(frame.surfaceNormal) > 0.999999);
});

test("mission platform uses the same Earth surface frame as ground objects", () => {
  const position = { latitude: 55.75, longitude: 37.62 };
  const missionFrame = missionMarkerFrame(position);
  const objectFrame = nodeMarkerFrame({ ...position, type: "terminal" });
  assert.ok(missionFrame.anchorPosition.distanceTo(objectFrame.anchorPosition) < 1e-9);
  assert.ok(missionFrame.surfaceNormal.dot(objectFrame.surfaceNormal) > 0.999999);
});

test("reference camera keeps the large Earth horizon below the interface", () => {
  assert.deepEqual(REFERENCE_CAMERA.position, [0, 2.31, MAP_CAMERA_DISTANCE]);
  assert.deepEqual(REFERENCE_CAMERA.target, [0, 2.31, 0]);
  assert.equal(REFERENCE_CAMERA.minDistance, REFERENCE_CAMERA.maxDistance);
});

test("Russia view extends west by 30 percent and north by 20 percent", () => {
  assert.equal(Math.round(RUSSIA_VIEW.maxWestAngle * 180 / Math.PI), 13);
  assert.equal(Math.round(RUSSIA_VIEW.maxEastAngle * 180 / Math.PI), 10);
  assert.equal(Math.round(RUSSIA_VIEW.maxNorthAngle * 180 / Math.PI), 12);
  assert.equal(Math.round(RUSSIA_VIEW.maxSouthAngle * 180 / Math.PI), 10);
  assert.deepEqual(RUSSIA_VIEW.endpoints.A, { latitude: 55.75, longitude: 37.62 });
  assert.deepEqual(RUSSIA_VIEW.endpoints.B, { latitude: 58, longitude: 120 });
  assert.deepEqual(RUSSIA_VIEW.rotation, [0.38, -3.31, -0.02]);
});

test("turning toward either pole preserves space above Earth with a bounded downward offset", () => {
  assert.equal(verticalCenteringOffset(0), 0);
  assert.equal(verticalCenteringOffset(-RUSSIA_VIEW.maxSouthAngle), RUSSIA_VIEW.verticalCenteringPx);
  assert.equal(verticalCenteringOffset(RUSSIA_VIEW.maxNorthAngle), RUSSIA_VIEW.verticalCenteringPx);
  assert.equal(verticalCenteringOffset(RUSSIA_VIEW.maxNorthAngle * 2), RUSSIA_VIEW.verticalCenteringPx);
  assert.equal(verticalCenteringOffset(-1, 0, 1, 140), 0);
  assert.equal(verticalCenteringOffset(-0.1, 0.2, 0.4, 140), 70);
  assert.equal(verticalCenteringOffset(0.1, 0.2, 0.4, 140), 35);
  assert.equal(verticalCenteringOffset(-0.1, 0.2, 0.4, 0), 0);
  let previous = 0;
  for (let degrees = 0; degrees <= 12; degrees += 0.25) {
    const offset = verticalCenteringOffset(-THREE.MathUtils.degToRad(degrees), THREE.MathUtils.degToRad(12), THREE.MathUtils.degToRad(12), 140);
    assert.ok(offset >= previous && offset - previous < 3);
    previous = offset;
  }
});

test("northward framing moves the scene down while ray picking still reaches the same satellite", () => {
  const camera = new THREE.PerspectiveCamera(25, 1920 / 1080, 0.1, 60);
  camera.position.set(0, 4.6, 9);
  camera.lookAt(0, 2, 0);
  camera.updateMatrixWorld(true);
  const satellite = new THREE.Vector3(0, 3.5, 1.2).setLength(EARTH_RADIUS + 0.72);
  const initial = satellite.clone().project(camera);
  const offset = verticalCenteringOffset(-0.2, 0.2, 0.2, 140);
  camera.setViewOffset(1920, 1080, 0, -offset, 1920, 1080);
  const framed = satellite.clone().project(camera);
  assert.ok(Math.abs((initial.y - framed.y) * 540 - 140) < 1e-9);
  assert.equal(framed.x, initial.x);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(framed.x, framed.y), camera);
  const hit = intersectVisibleSphereContinuously(raycaster.ray, satellite.length(), camera.position, satellite);
  assert.ok(hit && hit.distanceTo(satellite) < 1e-8);
});

test("JSON earth limits convert from degrees and Russia centering can be disabled", () => {
  const preferences = resolveEarthOrbitPreferences({ limitsDegrees: { west: 40, east: 30, north: 20, south: 15 }, centerRussia: false, verticalCenteringPx: 64 });
  assert.equal(Math.round(preferences.west * 180 / Math.PI), 40);
  assert.equal(Math.round(preferences.east * 180 / Math.PI), 30);
  assert.equal(Math.round(preferences.north * 180 / Math.PI), 20);
  assert.equal(Math.round(preferences.south * 180 / Math.PI), 15);
  assert.equal(preferences.centerRussia, false);
  assert.equal(preferences.verticalCenteringPx, 64);
});

test("node states map to independent smooth transition channels", () => {
  assert.ok(NODE_TRANSITION_RATE > 0);
  assert.deepEqual(nodeVisualTarget("drop"), { signal: 0, linked: 0, wrong: 0 });
  assert.deepEqual(nodeVisualTarget("base"), { signal: 1, linked: 0, wrong: 0 });
  assert.deepEqual(nodeVisualTarget("link"), { signal: 1, linked: 1, wrong: 0 });
  assert.deepEqual(nodeVisualTarget("wrong"), { signal: 1, linked: 0, wrong: 1 });
});

test("a link is colored only when it touches a fully resolved node", () => {
  assert.equal(signalLinkColor("base", "base"), 0x659dfc);
  assert.equal(signalLinkColor(undefined, "base"), 0x659dfc);
  assert.equal(signalLinkColor("link", "base"), 0x5ce6ae);
  assert.equal(signalLinkColor(undefined, "link"), 0x5ce6ae);
  assert.equal(signalLinkColor("wrong", "base"), 0xf55257);
  assert.equal(signalLinkColor("link", "wrong"), 0xf55257);
  assert.equal(signalLinkColor(undefined, undefined, true), 0x5ce6ae);
});

test("orbit resistance eases into the limit and stays free away from it", () => {
  const westLimit = RUSSIA_VIEW.maxWestAngle;
  const eastLimit = RUSSIA_VIEW.maxEastAngle;
  const nearWestLimit = westLimit - ORBIT_MOTION.softZone / 4;
  const nearEastLimit = -eastLimit + ORBIT_MOTION.softZone / 4;
  assert.equal(softBoundaryFactor(0, 0.01, eastLimit, westLimit), 1);
  assert.ok(softBoundaryFactor(nearWestLimit, 0.01, eastLimit, westLimit) < 1);
  assert.ok(softBoundaryFactor(nearEastLimit, -0.01, eastLimit, westLimit) < 1);
  assert.equal(softBoundaryFactor(nearWestLimit, -0.01, eastLimit, westLimit), 1);
  assert.equal(softBoundaryFactor(westLimit, 0.01, eastLimit, westLimit), 0);
});

test("editor free orbit can cross an axis seam without a full-turn jump", () => {
  const reference = Math.PI * 2 + 0.2;
  assert.ok(Math.abs(nearestEquivalentAngle(-Math.PI * 2 + 0.2, reference) - reference) < 1e-9);
});

test("camera state settle uses a complete cubic ease-in-out instead of the orbit follow rate", () => {
  assert.equal(cameraSettleProgress(-1), 0);
  assert.equal(cameraSettleProgress(0), 0);
  assert.equal(cameraSettleProgress(0.5), 0.5);
  assert.equal(cameraSettleProgress(1), 1);
  assert.equal(cameraSettleProgress(2), 1);
  assert.ok(cameraSettleProgress(0.1) < 0.01);
  assert.ok(cameraSettleProgress(0.9) > 0.99);
});

test("idle camera sway fades from zero and stays within its configured amplitudes", () => {
  const offset = new THREE.Vector2();
  cameraIdleSway(offset, 1.7, 0, 0.01, 0.005);
  assert.deepEqual(offset.toArray(), [0, 0]);
  for (let phase = 0; phase < Math.PI * 2; phase += 0.05) {
    cameraIdleSway(offset, phase, 1, 0.01, 0.005);
    assert.ok(Math.abs(offset.x) <= 0.01);
    assert.ok(Math.abs(offset.y) <= 0.005);
  }
});


test("far orbital drag approaches Earth occlusion without jumping to the near intersection", () => {
  const camera = new THREE.Vector3(0, 0, 9), radius = 3.72;
  let reference = null, held = 0, accepted = 0;
  for (let y = 3.65; y > 2; y -= 0.001) {
    const ray = new THREE.Ray(camera, new THREE.Vector3(0, y, -9).normalize());
    reference ||= intersectSphereContinuously(ray, radius, new THREE.Vector3(0, 0, -radius));
    if (!reference) continue;
    const hit = intersectVisibleSphereContinuously(ray, radius, camera, reference);
    if (!hit) { held++; continue; }
    assert.ok(hit.distanceTo(reference) < 0.1, "small pointer step must not switch orbit branch");
    reference = hit;
    accepted++;
  }
  assert.ok(held > 0 && accepted > 0);
  const miss = new THREE.Ray(camera, new THREE.Vector3(0, 1, 0));
  assert.equal(intersectVisibleSphereContinuously(miss, radius, camera, reference), null);
  const returnRay = new THREE.Ray(camera, reference.clone().sub(camera).normalize());
  assert.ok(intersectVisibleSphereContinuously(returnRay, radius, camera, reference).distanceTo(reference) < 1e-8);
});
