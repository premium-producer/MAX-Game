import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AudioAppAdapter } from "../src/audio/audio-app-adapter.mjs";
import { AudioDirector } from "../src/audio/audio-director.mjs";
import { AudioEngine } from "../src/audio/audio-engine.mjs";
import { validateAudioManifest } from "../src/audio/audio-manifest.mjs";
import { chooseVariant, deriveFeedbackAudioEvent, deriveMissionAudioEvents, deriveNetworkAudioSnapshot, deriveShellAudioEvents, diffNetworkAudio, shouldResumeAfterVisibility } from "../src/audio/audio-state.mjs";

const rawManifest = JSON.parse(await readFile(new URL("../public/config/audio.json", import.meta.url), "utf8"));
const manifest = validateAudioManifest(rawManifest);

const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const serverSource = await readFile(new URL("../server.mjs", import.meta.url), "utf8");

test("runtime audio manifest resolves all 21 portable assets and semantic events", () => {
  assert.equal(manifest.assets.length, 21);
  assert.equal(manifest.events.length, 19);
  for (const event of manifest.events) for (const assetId of event.assets) assert.ok(manifest.assetById.has(assetId));
  for (const asset of manifest.assets) assert.match(asset.url, /^\.\/audio\/[a-z0-9-]+\.webm$/);
});

test("player shell wires unlock, mute, lifecycle, accepted state and WebM MIME", () => {
  assert.match(indexSource, /class="audio-toggle"[^>]*role="switch"[^>]*data-audio-toggle/);
  assert.match(mainSource, /window\.addEventListener\("pointerdown", unlockAudio, \{ capture: true, passive: true \}\)/);
  assert.match(mainSource, /audioAdapter\?\.afterShellTransition\(previousState, nextState, action\)/);
  assert.match(mainSource, /audioAdapter\?\.afterMissionTransition\(previousRun, next, action\)/);
  assert.match(mainSource, /audioAdapter\?\.syncNetwork\(network\)/);
  assert.match(mainSource, /audioAdapter\?\.onFeedbackShown\(outcome\)/);
  assert.match(serverSource, /"\.webm": "audio\/webm"/);
});

test("audio engine owns one context and deduplicates concurrent buffer decoding", async () => {
  let contextCount = 0;
  let fetchCount = 0;
  const context = fakeAudioContext();
  const engine = new AudioEngine(manifest, {
    contextFactory: () => { contextCount += 1; return context; },
    fetchImpl: async () => { fetchCount += 1; return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; },
    storage: null,
    logger: null,
  });
  await Promise.all([engine.initialize(), engine.initialize()]);
  await Promise.all([engine.loadAsset("background"), engine.loadAsset("background")]);
  assert.equal(contextCount, 1);
  assert.equal(fetchCount, 1);
  assert.equal(context.decodeCount, 1);
  await engine.dispose();
});

test("shell audio emits only after accepted transitions", () => {
  const cta = { screen: "CTA" };
  const onboarding = { screen: "ONBOARDING" };
  const missionSelect = { screen: "MISSION_SELECT" };
  assert.deepEqual(deriveShellAudioEvents(cta, cta, { type: "PRIMARY" }), []);
  assert.deepEqual(deriveShellAudioEvents(cta, onboarding, { type: "PRIMARY" }), ["ui.cta.primary"]);
  assert.deepEqual(deriveShellAudioEvents(onboarding, cta, { type: "BACK" }), ["ui.navigation.back"]);
  assert.deepEqual(deriveShellAudioEvents(missionSelect, onboarding, { type: "BACK" }), ["ui.navigation.back"]);
  assert.deepEqual(deriveShellAudioEvents({ screen: "MISSION_PLAY" }, missionSelect, { type: "BACK" }), ["ui.navigation.back"]);
  assert.deepEqual(deriveShellAudioEvents({ screen: "END" }, missionSelect, { type: "BACK" }), ["ui.navigation.back"]);
  assert.deepEqual(deriveShellAudioEvents({ screen: "MISSION_PLAY" }, { screen: "MISSION_SELECT" }, { type: "MISSION_COMPLETE" }), ["ui.mission.success_continue"]);
});

test("mission audio ignores preview/cancel and maps accepted placement and restart", () => {
  const previous = { revision: 1 };
  const next = { revision: 2 };
  assert.deepEqual(deriveMissionAudioEvents(previous, previous, { type: "PLACE" }), []);
  assert.deepEqual(deriveMissionAudioEvents(previous, next, { type: "PLACE" }), ["game.node.place_or_move"]);
  assert.deepEqual(deriveMissionAudioEvents(previous, next, { type: "MOVE" }), ["game.node.place_or_move"]);
  assert.deepEqual(deriveMissionAudioEvents(previous, next, { type: "RESTART" }), ["ui.mission.restart"]);
  assert.deepEqual(deriveMissionAudioEvents(previous, next, { type: "SELECT" }), []);
});

test("every successful popup shares one sound and every unsuccessful popup shares another", () => {
  assert.equal(deriveFeedbackAudioEvent({ kind: "success", action: "complete" }), "game.popup.success");
  assert.equal(deriveFeedbackAudioEvent({ kind: "success", action: "inform" }), "game.popup.success");
  assert.equal(deriveFeedbackAudioEvent({ id: "invalid-connection", kind: "error" }), "game.popup.error");
  assert.equal(deriveFeedbackAudioEvent({ id: "satellite-too-high", kind: "error" }), "game.popup.error");
  assert.equal(deriveFeedbackAudioEvent({ kind: "error", action: "timeout" }), "game.popup.error");
  assert.equal(deriveFeedbackAudioEvent(null), null);
});

test("network snapshot follows the exact link color priority", () => {
  const snapshot = deriveNetworkAudioSnapshot({
    states: { a: "base", b: "base", c: "link", d: "wrong" },
    links: [
      { a: "a", b: "b" },
      { a: "a", b: "c" },
      { a: "c", b: "d" },
      { a: "x", b: "y", closing: true, correct: true },
    ],
  });
  assert.deepEqual(snapshot, { blue: 1, green: 2, red: 1 });
  assert.deepEqual(diffNetworkAudio({ blue: 1, green: 0, red: 0 }, { blue: 0, green: 2, red: 0 }), {
    blue: { started: false, stopped: true, active: false },
    green: { started: true, stopped: false, active: true },
    red: { started: false, stopped: false, active: false },
  });
});

test("variant selection never immediately repeats when alternatives exist", () => {
  assert.equal(chooseVariant(["a", "b", "c"], "a", () => 0), "b");
  assert.equal(chooseVariant(["a", "b", "c"], "b", () => 0.999), "c");
  assert.equal(chooseVariant(["a"], "a", () => 0), "a");
});

test("visibility resume requires prior unlock, running state and sound enabled", () => {
  assert.equal(shouldResumeAfterVisibility({ unlocked: true, muted: false, wasRunningBeforeHidden: true }), true);
  assert.equal(shouldResumeAfterVisibility({ unlocked: false, muted: false, wasRunningBeforeHidden: true }), false);
  assert.equal(shouldResumeAfterVisibility({ unlocked: true, muted: true, wasRunningBeforeHidden: true }), false);
});

test("director diffs network loops, applies cooldown and preserves one global background", async () => {
  const engine = new FakeEngine();
  let now = 1000;
  const director = new AudioDirector(manifest, { engine, now: () => now, random: () => 0 });
  await director.initialize();
  director.enterScreen("MISSION_PLAY");
  await director.unlock();
  assert.equal(engine.started.filter((id) => id === "audio.background.loop").length, 1);
  director.syncNetwork({ blue: 1, green: 0, red: 0 });
  director.syncNetwork({ blue: 3, green: 0, red: 0 });
  assert.equal(engine.started.filter((id) => id === "game.link.blue_loop").length, 1);
  director.syncNetwork({ blue: 0, green: 1, red: 0 });
  assert.ok(engine.stopped.includes("game.link.blue_loop"));
  assert.ok(engine.started.includes("game.link.green_loop"));

  director.enterScreen("MISSION_SELECT");
  assert.ok(engine.stopped.includes("game.link.green_loop"));
  assert.equal(director.trigger("ui.mission_select.card_hover"), true);
  now += 100;
  assert.equal(director.trigger("ui.mission_select.card_hover"), false);
  now += 300;
  assert.equal(director.trigger("ui.mission_select.card_hover"), true);
});

test("CTA screen sound waits for unlock and exclusively blocks every other one-shot", async () => {
  const engine = new FakeEngine();
  let now = 1000;
  const director = new AudioDirector(manifest, { engine, now: () => now, random: () => 0 });
  await director.initialize();
  director.enterScreen("CTA");
  assert.deepEqual(engine.played, []);
  assert.equal(director.trigger("ui.cta.primary"), false);
  await director.unlock();
  assert.deepEqual(engine.played, [["ui.cta.screen_enter", "cta-screen-enter"]]);
  assert.equal(engine.stoppedOneShots, 1);
  assert.equal(director.trigger("ui.cta.camera_orbit"), false);
  await director.unlock();
  assert.equal(engine.played.length, 1);
  now += 6801;
  assert.equal(director.trigger("ui.cta.camera_orbit"), false);
  engine.exclusive = false; // The engine reports natural source completion, not a wall-clock deadline.
  assert.equal(director.trigger("ui.cta.camera_orbit"), true);
  director.enterScreen("ONBOARDING");
  new AudioAppAdapter(director).afterShellTransition({ screen: "ONBOARDING" }, { screen: "CTA" }, { type: "BACK" });
  assert.deepEqual(engine.played.at(-1), ["ui.cta.screen_enter", "cta-screen-enter"]);
  assert.equal(engine.played.some(([eventId]) => eventId === "ui.navigation.back"), false);
  assert.equal(engine.stoppedOneShots, 2);
});

test("app adapter forwards accepted semantic state without owning playback", () => {
  const calls = [];
  const director = {
    trigger: (id) => calls.push(["trigger", id]),
    enterScreen: (screen) => calls.push(["screen", screen]),
    clearNetworkLoops: () => calls.push(["clear"]),
    syncNetwork: (snapshot) => calls.push(["network", snapshot]),
    handleVisibility: () => undefined,
  };
  const adapter = new AudioAppAdapter(director);
  adapter.afterShellTransition({ screen: "CTA" }, { screen: "ONBOARDING" }, { type: "PRIMARY" });
  adapter.afterMissionTransition({ revision: 1 }, { revision: 2 }, { type: "RESTART" });
  assert.deepEqual(calls.slice(0, 4), [["trigger", "ui.cta.primary"], ["screen", "ONBOARDING"], ["trigger", "ui.mission.restart"], ["clear"]]);
  calls.length = 0;
  adapter.afterShellTransition({ screen: "ONBOARDING" }, { screen: "CTA" }, { type: "BACK" });
  assert.deepEqual(calls, [["screen", "CTA"], ["trigger", "ui.navigation.back"]]);
});

class FakeEngine {
  constructor() {
    this.started = [];
    this.stopped = [];
    this.played = [];
    this.stoppedOneShots = 0;
    this.muted = false;
  }
  async initialize() { return {}; }
  async preloadGroup() { return []; }
  async resume() { return true; }
  async suspend() { return true; }
  setHidden(value) { this.hidden = value; }
  isRunning() { return true; }
  isOneShotBlocked(event) { return Boolean(this.exclusive && !event.exclusive); }
  async startLoop(event) { if (!this.started.includes(event.id)) this.started.push(event.id); return {}; }
  stopLoop(eventId) { this.stopped.push(eventId); }
  stopAllOneShots() { this.stoppedOneShots += 1; }
  async playOneShot(event, assetId) {
    if (event.exclusive) { this.stopAllOneShots(); this.exclusive = true; }
    this.played.push([event.id, assetId]);
    return { status: "started" };
  }
  setMuted(value) { this.muted = value; return value; }
  isMuted() { return this.muted; }
  async dispose() {}
}

function fakeAudioContext() {
  const makeParam = (initial = 1) => ({
    value: initial,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
  });
  const makeNode = () => ({ connect() {}, disconnect() {}, gain: makeParam() });
  return {
    state: "running",
    currentTime: 0,
    destination: {},
    decodeCount: 0,
    createDynamicsCompressor() {
      return { ...makeNode(), threshold: makeParam(), knee: makeParam(), ratio: makeParam(), attack: makeParam(), release: makeParam() };
    },
    createGain: makeNode,
    createBufferSource() { return { connect() {}, disconnect() {}, start() {}, stop() { this.onended?.(); }, loop: false, buffer: null, onended: null }; },
    async decodeAudioData() { this.decodeCount += 1; return {}; },
    async resume() { this.state = "running"; },
    async suspend() { this.state = "suspended"; },
    async close() { this.state = "closed"; },
  };
}


test("full startup audio preparation decodes every asset once without unlocking playback", async () => {
  const context = fakeAudioContext(); let fetches = 0;
  const engine = new AudioEngine(manifest, {
    contextFactory: () => context, storage: null, logger: null,
    fetchImpl: async () => { fetches++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; },
  });
  const director = new AudioDirector(manifest, { engine });
  await director.prepare();
  assert.equal(fetches, manifest.assets.length);
  assert.equal(context.decodeCount, manifest.assets.length);
  assert.equal(engine.unlocked, false);
  for (const screen of ["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"]) director.enterScreen(screen);
  await engine.preloadAll();
  assert.equal(fetches, manifest.assets.length);
  await engine.dispose();
});

test("startup audio reports missing files, but unsupported Web Audio permits silent startup", async () => {
  const failed = new AudioEngine(manifest, {
    contextFactory: fakeAudioContext, storage: null, logger: null,
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });
  await assert.rejects(failed.preloadAll(), /HTTP 404/);
  await failed.dispose();
  const unsupported = new AudioEngine(manifest, {
    contextFactory: () => { throw new Error("unsupported"); }, storage: null, logger: null,
    fetchImpl: () => { throw new Error("must not fetch"); },
  });
  assert.equal(await unsupported.preloadAll(), false);
});
