import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PreparedAssets, collectAssetSources, prepareTasks, prepareFonts, withTimeout, EARTH_TEXTURES, EARTH_BORDER } from "../src/asset-preparation.mjs";
import { waitForGpu } from "../src/gpu-preparation.mjs";
import { loadMissionCatalog } from "../src/mission-config.mjs";
import { runtimeObjectTypes, iconSource } from "../src/object-catalog.mjs";

const defer = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test("preparation limits concurrency and counts finished tasks, preserving result order", async () => {
  let active = 0, peak = 0;
  const progress = [];
  const result = await prepareTasks(Array.from({ length: 7 }, (_, i) => async () => {
    peak = Math.max(peak, ++active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active--; return i;
  }), (done, total) => progress.push([done, total]), 2);
  assert.equal(peak, 2);
  assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(progress, Array.from({ length: 8 }, (_, i) => [i, 7]));
});

test("failure drains active tasks and does not start queued tasks", async () => {
  const gate = defer(); let settled = false, queuedStarted = false;
  const result = prepareTasks([
    async () => { throw new Error("offline"); },
    async () => { await gate.promise; settled = true; },
    async () => { queuedStarted = true; },
  ], undefined, 2);
  gate.resolve();
  await assert.rejects(result, /offline/);
  assert.equal(settled, true);
  assert.equal(queuedStarted, false);
});

test("timeout aborts the underlying operation", async () => {
  let signal;
  await assert.rejects(withTimeout((next) => { signal = next; return new Promise(() => {}); }, 5, "test"), /timeout/);
  assert.equal(signal.aborted, true);
});

test("image readiness waits for decode and reuses one resident Blob URL", async () => {
  const gate = defer(); let fetches = 0, completed = 0;
  const assets = new PreparedAssets();
  const loading = assets.load({ icons: ["./test.svg"], images: ["./test.svg"] }, (done) => { completed = done; }, {
    fetchImpl: async () => { fetches++; return new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', { headers: { "content-type": "image/svg+xml" } }); },
    imageFactory: () => ({ decode: () => gate.promise }),
  });
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(completed, 0);
  gate.resolve(); await loading;
  assert.equal(completed, 1);
  assert.match(assets.get("./test.svg").text, /<svg/);
  assert.match(assets.url("./test.svg"), /^blob:/);
  for (let i = 0; i < 5; i++) assets.url("./test.svg");
  assert.equal(fetches, 1);
  assert.throws(() => assets.url("./missing.png"), /not prepared/);
  const url = assets.url("./test.svg");
  assets.dispose();
  await assert.rejects(fetch(url));
});

test("failed images and missing fonts cannot report ready", async () => {
  const assets = new PreparedAssets();
  await assert.rejects(assets.load({ icons: [], images: ["./missing.png"] }, undefined, {
    fetchImpl: async () => new Response("missing", { status: 404 }),
  }), /HTTP 404/);
  await assert.rejects(prepareFonts({ load: async () => [] }), /Font unavailable/);
});

test("catalog manifest covers current mission object and endpoint icons plus all Earth textures", async () => {
  const catalog = await loadMissionCatalog("./config/missions/index.json", async (source) => new Response(await readFile(new URL(`../public/${source}`, import.meta.url))));
  const sources = collectAssetSources(catalog, runtimeObjectTypes(catalog.system));
  assert.equal(new Set(sources.images).size, sources.images.length);
  for (const source of [...EARTH_TEXTURES, EARTH_BORDER]) assert.ok(sources.images.includes(source));
  for (const mission of catalog.missions) for (const endpoint of Object.values(mission.endpoints)) {
    const source = iconSource(catalog.system.icons[endpoint.icon]);
    assert.ok(sources.icons.includes(source));
  }
  for (const source of sources.images) if (!source.startsWith("data:")) {
    assert.ok((await readFile(new URL(`../public/${source}`, import.meta.url))).length > 0, source);
  }
});

test("GPU fence waits for queued work and is released on success and context loss", async () => {
  let waits = 0, deleted = 0;
  const gl = { SYNC_GPU_COMMANDS_COMPLETE: 1, WAIT_FAILED: 2, ALREADY_SIGNALED: 3, CONDITION_SATISFIED: 4,
    fenceSync: () => ({}), flush() {}, isContextLost: () => false,
    clientWaitSync: () => ++waits > 1 ? 4 : 0, deleteSync: () => { deleted++; } };
  await waitForGpu(gl);
  assert.equal(waits, 2); assert.equal(deleted, 1);
  gl.isContextLost = () => true;
  await assert.rejects(waitForGpu(gl), /context lost/);
  assert.equal(deleted, 2);
});

test("startup gates input, retains the five game states and prepares GPU before revealing the game", async () => {
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const shell = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(shell, /id="stage"[^>]*inert/);
  assert.match(main, /await preparedAssets.load[\s\S]*await prepareFonts[\s\S]*await audioDirector\?\.prepare[\s\S]*await webglField.prepareGPU[\s\S]*await render[\s\S]*webglField.start\(\)[\s\S]*stage.inert = false[\s\S]*bootScreen.finish/);
  assert.match(main, /function dispatch\(action\) \{\s*if \(!appReady\) return/);
  assert.doesNotMatch(main, /function preloadAssets/);
});
