import assert from "node:assert/strict";
import { routeCandidates } from "./route-fixture.mjs";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createSurfaceMap, loadSurfaceMap, SURFACE } from "../src/surface-map.mjs";
import { placementSurfaceFor, surfaceRejection } from "../src/placement-policy.mjs";
import { parseObjectCatalog } from "../src/object-catalog.mjs";
import { loadMissionCatalog } from "../src/mission-config.mjs";
import { configureMissions, configurePlacementSurface, createMissionRun, reduceMission, availableCount, previewPlacementMove, deriveNetwork, getPlacementRejection } from "../src/mission-game.mjs";
import { missionCatalog, testLandSurface } from "./config-fixture.mjs";

const root = new URL("../public/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("earth/Earth_Surface_4K.json", root), "utf8"));
const bytes = new Uint8Array(await readFile(new URL("earth/Earth_Surface_4K.bin", root)));
const map = createSurfaceMap(manifest, bytes);
const digest = (data) => createHash("sha256").update(data).digest();
const land = { latitude: 55.75, longitude: 37.62 };
const water = { latitude: 35, longitude: 160 };
const actualCatalog = await loadMissionCatalog("./config/missions/index.json", async (path) => ({ ok: true, json: async () => JSON.parse(await readFile(new URL(path, root), "utf8")) }));
function useMap(t, catalog = missionCatalog) {
  configureMissions(catalog); configurePlacementSurface(map);
  t.after(() => { configureMissions(missionCatalog); configurePlacementSurface(testLandSurface); });
}

test("shipped mask is independent, intact and classifies land, oceans, lakes and ice", () => {
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.sha256);
  assert.equal(bytes.length, 1024 * 1024);
  for (const [lat, lon] of [[55.75,37.62], [61,93], [74.6876,-37.9307], [43.12,131.89]]) assert.equal(map.sample(lat, lon), SURFACE.LAND);
  for (const [lat, lon] of [[35,160], [80,120], [53.5,108], [42,50]]) assert.equal(map.sample(lat, lon), SURFACE.WATER);
});

test("surface sampling wraps longitude, clamps poles and owns its input bytes", () => {
  for (const latitude of [-90,0,90]) {
    assert.equal(map.sample(latitude, -180), map.sample(latitude, 180));
    assert.equal(map.sample(latitude, -180), map.sample(latitude, 540));
    assert.ok([0,1].includes(map.sample(latitude, 40)));
  }
  assert.equal(map.sample(35, -200), map.sample(35, 160));
  for (const bad of [NaN, Infinity, undefined]) assert.equal(map.sample(bad, 0), SURFACE.UNKNOWN);
  assert.equal(map.sample(91, 0), SURFACE.UNKNOWN);
  const input = bytes.slice(), owned = createSurfaceMap(manifest, input);
  input.fill(255);
  assert.equal(owned.sample(land.latitude, land.longitude), SURFACE.LAND);
  assert.throws(() => createSurfaceMap(manifest, bytes.slice(1)));
  assert.throws(() => createSurfaceMap({ ...manifest, origin: "south-west" }, bytes));
});

test("mask loader checks HTTP and checksum and never follows a manifest URL", async () => {
  const calls = [];
  const fetcher = async (url) => { calls.push(url); return url.endsWith("json")
    ? { ok: true, json: async () => manifest }
    : { ok: true, arrayBuffer: async () => bytes.slice().buffer }; };
  assert.equal((await loadSurfaceMap(fetcher, digest)).sample(35,160), SURFACE.WATER);
  assert.deepEqual(calls, ["./earth/Earth_Surface_4K.json", "./earth/Earth_Surface_4K.bin"]);
  await assert.rejects(loadSurfaceMap(fetcher, () => new Uint8Array(32)), /checksum/);
  await assert.rejects(loadSurfaceMap(async () => ({ ok: false, status: 404 }), digest), /HTTP 404/);
  await assert.rejects(loadSurfaceMap(async (url) => url.endsWith("json") ? { ok: true, json: async () => ({ ...manifest, data: "https://example.com/mask" }) } : { ok: true, arrayBuffer: async () => bytes.buffer }, digest), /Invalid/);
});

test("surface policy follows behavior and supports explicit marine/custom types", () => {
  assert.equal(placementSurfaceFor({ behavior: "orbital" }), "any");
  assert.equal(placementSurfaceFor({ behavior: "ground" }), "land");
  for (const type of [{ behavior: "ground" }, { behavior: "ground", placementSurface: "land" }]) {
    assert.equal(surfaceRejection(type, 35,160,map), "water");
    assert.equal(surfaceRejection(type, 55.75,37.62,map), null);
    assert.equal(surfaceRejection(type, 55.75,37.62,null), "unavailable");
    assert.equal(surfaceRejection(type, 55.75,37.62,{ sample: () => undefined }), "unavailable");
  }
  assert.equal(surfaceRejection({ placementSurface: "water" }, 35,160,map), null);
  assert.equal(surfaceRejection({ placementSurface: "water" }, 55.75,37.62,map), "land");
  assert.equal(surfaceRejection({ behavior: "orbital" },35,160,null), null);
  const catalog = parseObjectCatalog();
  assert.equal(catalog.objectTypes.terminal.placementSurface, "land");
  assert.equal(catalog.objectTypes.satellite.placementSurface, "any");
  catalog.objectTypes.terminal.placementSurface = "lava";
  assert.throws(() => parseObjectCatalog(catalog), /поверхность/);
});

test("PLACE and MOVE on water preserve identity, position, inventory, selection and wake time", (t) => {
  useMap(t);
  let run = reduceMission(createMissionRun(1), { type: "SELECT", item: "terminal" });
  const snapshot = structuredClone(run);
  assert.equal(reduceMission(run, { type: "PLACE", ...water, now: 5000 }), run);
  assert.deepEqual(run, snapshot);
  run = reduceMission(run, { type: "PLACE", ...land, now: 1000 });
  assert.equal(availableCount(run, "terminal"), 0);
  const placed = structuredClone(run);
  assert.equal(reduceMission(run, { type: "MOVE", id: 1, ...water, now: 5000 }), run);
  assert.deepEqual(run, placed);
  assert.equal(run.placements[0].droppedAt, 1000);
  assert.notEqual(reduceMission(run, { type: "MOVE", id: 1, latitude: 61, longitude: 93, now: 5000 }), run);
  const orbital = reduceMission(run, { type: "PLACE", item: "satellite", ...water, now: 5000 });
  assert.equal(orbital.placements.length, 2);
  assert.notEqual(reduceMission(orbital, { type: "MOVE", id: 2, latitude: 80, longitude: 120 }), orbital);
});

test("invalid input and missing mask fail closed for ground equipment", (t) => {
  useMap(t);
  const run = createMissionRun(1);
  for (const latitude of [NaN, Infinity, null, "oops"]) assert.equal(reduceMission(run, { type: "PLACE", item: "terminal", latitude, longitude: 37 }), run);
  configurePlacementSurface(null);
  assert.equal(getPlacementRejection("terminal",land), "unavailable");
  assert.equal(reduceMission(run, { type: "PLACE", item: "terminal", ...land }), run);
  assert.equal(reduceMission(run, { type: "PLACE", item: "satellite", ...water }).placements.length, 1);
});

test("blocked move previews cannot form links in legacy or current mission engines", (t) => {
  useMap(t);
  for (const catalog of [missionCatalog,actualCatalog]) {
    configureMissions(catalog);
    let run = createMissionRun(1);
    for (const item of ["terminal","satellite"]) run = reduceMission(run, { type: "PLACE", item, ...land, now: 0 });
    const original = structuredClone(run);
    // An ocean point close to the second node makes the rejection, rather than
    // distance, the reason no link may touch the moving terrestrial node.
    run.placements[1] = { ...run.placements[1], ...water };
    const preview = previewPlacementMove(run, 1, water);
    assert.equal(preview.placements[0].placementBlocked, "water");
    assert.equal(preview.placements[0].droppedAt, 0);
    assert.ok(deriveNetwork(preview,1000).links.every((link) => link.a !== 1 && link.b !== 1));
    assert.deepEqual(run.placements[0], original.placements[0]);
    assert.equal(previewPlacementMove(run,1,land).placements[0].placementBlocked, undefined);
  }
});

test("all current missions have a valid complete route with ground anchors on the mask", (t) => {
  useMap(t, actualCatalog);
  for (const mission of actualCatalog.missions) {
    let run = createMissionRun(mission.number);
    const path = mission.topology.paths[0];
    const candidates = routeCandidates(mission);
    for (const [i, step] of path.steps.entries()) {
      let geo = { latitude: candidates[i].latitude, longitude: candidates[i].longitude };
      if (getPlacementRejection(step.type, geo)) {
        let found = null;
        for (let radius = .25; radius <= 15 && !found; radius += .25) {
          for (let angle = 0; angle < 360; angle += 15) {
            const candidate = { latitude: geo.latitude+radius*Math.sin(angle*Math.PI/180), longitude: geo.longitude+radius*Math.cos(angle*Math.PI/180) };
            if (Math.abs(candidate.latitude) <= 82 && !getPlacementRejection(step.type,candidate)) { found = candidate; break; }
          }
        }
        assert.ok(found, `${mission.id}/${step.role}: reachable land`); geo = found;
      }
      const next = reduceMission(run, { type: "PLACE", item: step.type, ...geo, altitude: step.type === "satellite" ? .34 : .08, now: 0 });
      assert.equal(next.placements.length, run.placements.length + 1, `${mission.id}/${step.role}: accepted placement`);
      const placed = next.placements.at(-1);
      assert.equal(getPlacementRejection(placed.type, placed), null, `${mission.id}/${step.role}: stored position is permitted`);
      run = next;
    }
    assert.equal(reduceMission(run, { type: "CHECK", now: 1000 }).status, "complete", mission.id);
    const satellite = run.placements.find(node => node.type === "satellite");
    const broken = reduceMission(run, { type: "REMOVE", id: satellite.id });
    assert.equal(broken.placements.length, run.placements.length - 1);
    assert.notEqual(reduceMission(broken, { type: "CHECK", now: 1000 }).status, "complete", `${mission.id}: missing satellite must break completion`);
  }
});
