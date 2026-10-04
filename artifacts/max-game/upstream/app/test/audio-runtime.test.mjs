import assert from "node:assert/strict";
import test from "node:test";
import { AudioAppAdapter } from "../src/audio/audio-app-adapter.mjs";
import { validateAudioManifest } from "../src/audio/audio-manifest.mjs";
import { audioFixture, deferred, manifest, rawManifest } from "./audio-runtime-fixture.mjs";

async function until(predicate) {
  for (let turn = 0; turn < 50 && !predicate(); turn++) await Promise.resolve();
  assert.equal(Boolean(predicate()), true, "Expected asynchronous audio operation to begin");
}

test("prepared audio starts synchronously before UI render work and still respects CTA priority", async () => {
  const f = await audioFixture();
  for (const asset of manifest.assets) f.engine.decodedBuffers.set(asset.id, f.buffer(asset.id));
  f.director.enterScreen("MISSION_PLAY");
  assert.equal(f.director.trigger("game.node.place_or_move"), true);
  assert.deepEqual(f.ids(), ["node-place-or-move"]); // No await before checking source.start.
  f.director.enterScreen("CTA");
  assert.deepEqual(f.ids(), ["node-place-or-move", "cta-screen-enter"]);
  assert.equal(f.director.trigger("ui.cta.primary"), false);
  await f.drain();
  await f.director.dispose();
});

test("CTA cancels pending shots even with cached buffers, stops active tails and blocks new calls", async () => {
  const f = await audioFixture();
  f.director.enterScreen("ONBOARDING");
  f.director.trigger("ui.navigation.back");
  await f.drain();
  const active = f.shots()[0];
  f.director.trigger("ui.navigation.back");
  f.director.enterScreen("CTA");
  assert.equal(f.director.trigger("ui.cta.camera_orbit"), false);
  const results = await f.drain();
  assert.equal(results[1].reason, "cancelled");
  assert.deepEqual(f.ids(), ["navigation-back", "cta-screen-enter"]);
  assert.equal(active.stopAt, 0.08);
  assert.equal(f.engine.isOneShotBlocked(manifest.eventById.get("ui.cta.primary")), true);
  f.context.advance(0.08);
  assert.equal(active.ended, true);
  // Ending an older stopped voice must not release the new CTA lock.
  assert.equal(f.director.trigger("ui.cta.primary"), false);
  await f.director.dispose();
});

test("CTA priority lasts until source end despite delayed start and wall-clock changes", async () => {
  const f = await audioFixture();
  f.director.enterScreen("CTA");
  f.advanceWall(500); // Mandatory CTA must survive the former 350 ms cutoff.
  await f.drain();
  assert.deepEqual(f.ids(), ["cta-screen-enter"]);
  f.advanceWall(10000);
  f.context.advance(6.6);
  assert.equal(f.director.trigger("ui.cta.camera_orbit"), false);
  f.context.advance(0.08);
  assert.equal(f.director.trigger("ui.cta.camera_orbit"), true);
  await f.drain();
  assert.deepEqual(f.ids(), ["cta-screen-enter", "camera-orbit-01"]);
  await f.director.dispose();
});

test("CTA lock follows paused audio across hidden/visible and preserves background loop", async () => {
  const f = await audioFixture();
  f.director.enterScreen("CTA");
  await f.drain();
  f.context.advance(1);
  await f.director.handleVisibility(true);
  f.advanceWall(10000);
  f.context.advance(10);
  assert.equal(f.context.currentTime, 1);
  await f.director.handleVisibility(false);
  assert.equal(f.director.trigger("ui.cta.camera_orbit"), false);
  assert.equal(f.context.sources.filter((source) => source.loop).length, 1);
  f.context.advance(5.7);
  assert.equal(f.director.trigger("ui.cta.camera_orbit"), true);
  await f.drain();
  await f.director.dispose();
});

test("required clicks, placement and popup sounds survive 351 ms delay", async () => {
  for (const [screen, id] of [["MISSION_PLAY", "game.node.place_or_move"], ["MISSION_PLAY", "game.popup.error"], ["MISSION_SELECT", "ui.mission_select.launch"]]) {
    const f = await audioFixture();
    f.director.enterScreen(screen);
    assert.equal(f.director.trigger(id), true);
    f.advanceWall(351);
    await f.drain();
    assert.equal(f.shots().length, 1, id);
    assert.equal(f.director.lastPlaybackResults.get(id).status, "started");
    await f.director.dispose();
  }
});

test("stale hover is dropped with a reason and does not consume cooldown or variant", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_SELECT");
  const id = "ui.mission_select.card_hover";
  f.director.trigger(id);
  f.advanceWall(351);
  await f.drain();
  assert.deepEqual(f.director.lastPlaybackResults.get(id), { status: "skipped", reason: "late" });
  assert.equal(f.director.lastTriggeredAt.has(id), false);
  assert.equal(f.director.lastVariant.has(id), false);
  assert.equal(f.director.trigger(id), true);
  await f.drain();
  assert.equal(f.shots().length, 1);
  assert.equal(f.director.trigger(id), false);
  assert.equal(f.director.lastPlaybackResults.get(id).reason, "cooldown");
  await f.director.dispose();
});

test("failed CTA decoding releases priority and permits immediate retry", async () => {
  const f = await audioFixture();
  const loading = deferred();
  f.engine.buffers.set("cta-screen-enter", loading.promise);
  f.director.enterScreen("CTA");
  assert.equal(f.director.trigger("ui.cta.primary"), false);
  loading.reject(new Error("decode failed"));
  await f.drain();
  assert.equal(f.director.lastPlaybackResults.get("ui.cta.screen_enter").status, "failed");
  assert.equal(f.director.trigger("ui.cta.primary"), true);
  await f.drain();
  f.engine.buffers.set("cta-screen-enter", Promise.resolve(f.buffer("cta-screen-enter")));
  assert.equal(f.director.trigger("ui.cta.screen_enter"), true);
  await f.drain();
  assert.equal(f.ids().at(-1), "cta-screen-enter");
  await f.director.dispose();
});

test("source.start failure releases CTA and disconnects its voice", async () => {
  const f = await audioFixture();
  f.context.failStart = "cta-screen-enter";
  f.director.enterScreen("CTA");
  await f.drain();
  assert.equal(f.engine.voices.has("ui.cta.screen_enter"), false);
  assert.equal(f.engine.exclusiveOneShot, null);
  assert.equal(f.director.trigger("ui.cta.primary"), true);
  await f.drain();
  await f.director.dispose();
});

test("first key transition waits for unlock and plays primary instead of obsolete CTA entry", async () => {
  const f = await audioFixture({ unlocked: false });
  f.director.enterScreen("CTA");
  const unlocking = f.director.unlock();
  assert.equal(f.director.unlock(), unlocking);
  new AudioAppAdapter(f.director).afterShellTransition({ screen: "CTA" }, { screen: "ONBOARDING" }, { type: "PRIMARY" });
  await unlocking;
  await f.drain();
  assert.deepEqual(f.ids(), ["cta-primary"]);
  assert.equal(f.context.resumes, 1);
  await f.director.dispose();
});

test("first gesture without transition plays CTA once and keeps priority on later screens", async () => {
  const f = await audioFixture({ unlocked: false });
  f.director.enterScreen("CTA");
  await f.director.unlock();
  await f.drain();
  await f.director.unlock();
  assert.deepEqual(f.ids(), ["cta-screen-enter"]);
  new AudioAppAdapter(f.director).afterShellTransition({ screen: "CTA" }, { screen: "ONBOARDING" }, { type: "PRIMARY" });
  assert.equal(f.director.trigger("ui.onboarding.to_mission_select"), false);
  f.context.advance(6.7);
  assert.equal(f.director.trigger("ui.onboarding.to_mission_select"), true);
  await f.drain();
  await f.director.dispose();
});

test("hidden lifecycle cancels pending shots and never resumes from new shot or loop", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_PLAY");
  f.director.trigger("game.node.place_or_move");
  await f.director.handleVisibility(true);
  const resumes = f.context.resumes;
  assert.equal(f.director.trigger("game.popup.error"), false);
  const result = await f.engine.playOneShot(manifest.eventById.get("game.popup.error"), "popup-error");
  assert.equal(result.reason, "hidden");
  f.director.syncNetwork({ blue: 1, green: 0, red: 0 });
  await f.drain();
  assert.deepEqual(f.ids(), []);
  assert.equal(f.context.state, "suspended");
  assert.equal(f.context.resumes, resumes);
  await f.director.handleVisibility(false);
  assert.equal(f.engine.loops.has("game.link.blue_loop"), true);
  assert.equal(f.director.trigger("game.popup.error"), true);
  await f.drain();
  assert.deepEqual(f.ids(), ["popup-error"]);
  await f.director.dispose();
});

test("mute cancels pending and active CTA without replaying silent actions on unmute", async () => {
  const f = await audioFixture();
  f.director.enterScreen("CTA");
  f.director.setMuted(true);
  await f.drain();
  assert.deepEqual(f.ids(), []);
  assert.equal(f.director.trigger("ui.cta.primary"), false);
  f.director.setMuted(false);
  await f.director.unlock();
  assert.equal(f.director.trigger("ui.cta.primary"), true);
  await f.drain();
  f.director.trigger("ui.cta.screen_enter");
  await f.drain();
  f.director.setMuted(true);
  assert.equal(f.engine.exclusiveOneShot, null);
  f.context.advance(0.05);
  assert.equal(f.shots().at(-1).ended, true);
  await f.director.dispose();
});

test("obsolete pending hover is cancelled, accepted transition tail is retained", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_SELECT");
  f.director.trigger("ui.mission_select.card_hover");
  new AudioAppAdapter(f.director).afterShellTransition({ screen: "MISSION_SELECT" }, { screen: "MISSION_PLAY" }, { type: "PRIMARY" });
  await f.drain();
  assert.deepEqual(f.ids(), ["mission-launch"]);
  assert.equal(f.director.lastPlaybackResults.get("ui.mission_select.card_hover").reason, "obsolete");
  await f.director.dispose();
});

test("reordered loading keeps only latest single voice and honours maxInstances for tails", async () => {
  const f = await audioFixture();
  const slow = deferred();
  f.engine.buffers.set("camera-orbit-01", slow.promise);
  const event = manifest.eventById.get("ui.cta.camera_orbit");
  const first = f.engine.playOneShot(event, "camera-orbit-01");
  const second = await f.engine.playOneShot(event, "camera-orbit-02");
  slow.resolve(f.buffer("camera-orbit-01"));
  assert.equal((await first).reason, "superseded");
  assert.equal(second.status, "started");
  const tail = manifest.eventById.get("ui.navigation.back");
  const voices = await Promise.all(Array.from({ length: 3 }, () => f.engine.playOneShot(tail, "navigation-back")));
  assert.equal(voices.every((result) => result.status === "started"), true);
  assert.equal(f.engine.voices.get(tail.id).length, 2);
  f.context.advance(0.08);
  assert.equal(voices[0].voice.forgotten, true);
  await f.director.dispose();
});

test("final all-missions popup plays on mission selection", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_SELECT");
  new AudioAppAdapter(f.director).onFeedbackShown({ kind: "success", action: "finish" });
  await f.drain();
  assert.deepEqual(f.ids(), ["popup-success"]);
  await f.director.dispose();
});

test("dispose and loop cancellation invalidate pending async starts", async () => {
  const f = await audioFixture();
  const slow = deferred();
  f.engine.buffers.set("link-blue-loop", slow.promise);
  f.director.enterScreen("MISSION_PLAY");
  f.director.syncNetwork({ blue: 1, green: 0, red: 0 });
  f.director.enterScreen("CTA");
  await f.director.dispose();
  slow.resolve(f.buffer("link-blue-loop"));
  await f.drain();
  assert.deepEqual(f.ids(), []);
  assert.equal(f.engine.loops.size, 0);
  assert.equal(f.engine.voices.size, 0);
  assert.equal(f.context.state, "closed");
});

test("manifest validates late policy and exclusivity, including old numeric CTA configuration", () => {
  for (const [field, value] of [["lateStartPolicy", "unknown"], ["exclusive", 1]]) {
    const invalid = structuredClone(rawManifest);
    invalid.events[1][field] = value;
    assert.throws(() => validateAudioManifest(invalid));
  }
  const legacy = structuredClone(rawManifest);
  delete legacy.events[1].exclusive;
  legacy.events[1].blockOneShotsMs = 6800;
  assert.equal(validateAudioManifest(legacy).events[1].exclusive, true);
});

test("new action waits for in-flight resume even after a previous unlock", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_SELECT");
  f.context.state = "suspended";
  const gate = f.context.resumeGate = deferred();
  const unlocking = f.director.unlock();
  await until(() => f.context.resumes === 1);
  new AudioAppAdapter(f.director).afterShellTransition({ screen: "MISSION_SELECT" }, { screen: "MISSION_PLAY" }, { type: "PRIMARY" });
  assert.deepEqual(f.ids(), []);
  gate.resolve();
  await unlocking;
  await f.drain();
  assert.deepEqual(f.ids(), ["mission-launch"]);
  await f.director.dispose();
});

test("hide during pending resume wins and no sound can escape lifecycle cancellation", async () => {
  const f = await audioFixture();
  f.director.enterScreen("MISSION_SELECT");
  f.context.state = "suspended";
  const gate = f.context.resumeGate = deferred();
  const unlocking = f.director.unlock();
  await until(() => f.context.resumes === 1);
  f.director.trigger("ui.mission_select.launch");
  const hiding = f.director.handleVisibility(true);
  assert.equal(f.director.trigger("ui.mission_select.card_press"), false);
  gate.resolve();
  await Promise.all([unlocking, hiding]);
  await f.drain();
  assert.equal(f.context.state, "suspended");
  assert.deepEqual(f.ids(), []);
  await f.director.handleVisibility(false);
  assert.equal(f.context.state, "running");
  assert.deepEqual(f.ids(), []);
  await f.director.dispose();
});

test("show during pending suspend leaves the context running after both operations settle", async () => {
  const f = await audioFixture();
  const gate = f.context.suspendGate = deferred();
  const hiding = f.director.handleVisibility(true);
  await until(() => f.context.suspends === 1);
  const showing = f.director.handleVisibility(false);
  gate.resolve();
  await Promise.all([hiding, showing]);
  assert.equal(f.context.state, "running");
  assert.equal(f.director.hidden, false);
  assert.equal(f.context.sources.filter((source) => source.loop).length, 1);
  await f.director.dispose();
});

test("failed loop start releases its reservation so a later restore can retry", async () => {
  const f = await audioFixture();
  f.context.failStart = "link-blue-loop";
  const event = manifest.eventById.get("game.link.blue_loop");
  assert.equal(await f.engine.startLoop(event, "link-blue-loop"), null);
  assert.equal(f.engine.loops.has(event.id), false);
  f.context.failStart = null;
  const voice = await f.engine.startLoop(event, "link-blue-loop");
  assert.ok(voice);
  assert.equal(await f.engine.startLoop(event, "link-blue-loop"), voice);
  await f.director.dispose();
});
