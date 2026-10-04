import { AudioEngine } from "./audio-engine.mjs";
import { chooseVariant, diffNetworkAudio, shouldResumeAfterVisibility } from "./audio-state.mjs";

const NETWORK_EVENTS = Object.freeze({
  blue: "game.link.blue_loop",
  green: "game.link.green_loop",
  red: "game.link.red_loop",
});

const PRELOAD_AHEAD = Object.freeze({
  CTA: "onboarding",
  ONBOARDING: "mission-select",
  MISSION_SELECT: "mission-play",
  MISSION_PLAY: "end",
  END: "boot",
});

const SCREEN_GROUP = Object.freeze({
  CTA: "boot",
  ONBOARDING: "onboarding",
  MISSION_SELECT: "mission-select",
  MISSION_PLAY: "mission-play",
  END: "end",
});

export class AudioDirector {
  constructor(manifest, { engine = new AudioEngine(manifest), random = Math.random, now = Date.now } = {}) {
    this.manifest = manifest;
    this.engine = engine;
    this.random = random;
    this.now = now;
    this.screen = null;
    this.unlocked = false;
    this.hidden = Boolean(globalThis.document?.hidden);
    this.engine.setHidden(this.hidden);
    this.disposed = false;
    this.unlockPromise = null;
    this.wasRunningBeforeHidden = false;
    this.lastTriggeredAt = new Map();
    this.lastVariant = new Map();
    this.pendingTriggers = new Map();
    this.deferredOneShots = new Map();
    this.lastPlaybackResults = new Map();
    this.desiredLoops = new Set(["audio.background.loop"]);
    this.networkSnapshot = Object.freeze({ blue: 0, green: 0, red: 0 });
    this.pendingScreenEntry = null;
  }

  async initialize() {
    await this.engine.initialize();
    void this.engine.preloadGroup("boot");
  }

  async prepare(onProgress) {
    await this.engine.preloadAll(onProgress);
    this.fullyPrepared = true;
  }

  unlock() {
    if (this.hidden || this.disposed) return Promise.resolve(false);
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.resumePlayback().finally(() => { this.unlockPromise = null; });
    return this.unlockPromise;
  }

  async resumePlayback() {
    const running = await this.engine.resume();
    if (!running || this.hidden || this.disposed) {
      this.cancelDeferredOneShots("not-running");
      return false;
    }
    this.unlocked = true;
    if (this.engine.isMuted()) {
      this.cancelDeferredOneShots("muted");
      return true;
    }
    const pendingScreenEntry = this.pendingScreenEntry;
    this.pendingScreenEntry = null;
    if (pendingScreenEntry && this.screen === "CTA") this.trigger(pendingScreenEntry);
    const deferred = [...this.deferredOneShots.values()];
    this.deferredOneShots.clear();
    for (const request of deferred) this.submitOneShot(request);
    await this.restoreDesiredLoops();
    return true;
  }

  enterScreen(screen) {
    if (this.disposed) return;
    const changed = this.screen !== screen;
    this.screen = screen;
    if (screen !== "CTA") this.pendingScreenEntry = null;
    if (screen !== "MISSION_PLAY") this.clearNetworkLoops();
    const currentGroup = SCREEN_GROUP[screen];
    if (currentGroup && !this.fullyPrepared) void this.engine.preloadGroup(currentGroup);
    const preloadGroup = PRELOAD_AHEAD[screen];
    if (preloadGroup && !this.fullyPrepared) void this.engine.preloadGroup(preloadGroup);
    if (changed && screen === "CTA") {
      this.cancelDeferredOneShots("exclusive");
      if (this.unlocked && !this.hidden && !this.engine.isMuted()) this.trigger("ui.cta.screen_enter");
      else if (!this.engine.isMuted()) this.pendingScreenEntry = "ui.cta.screen_enter";
    }
  }

  trigger(eventId) {
    const event = this.manifest.eventById.get(eventId);
    if (!event || event.kind !== "one-shot") return false;
    const reject = (reason) => { this.lastPlaybackResults.set(eventId, { status: "skipped", reason }); return false; };
    if (!event.screens.includes(this.screen)) return reject("screen");
    if (this.disposed) return reject("disposed");
    if (this.hidden) return reject("hidden");
    if (this.engine.isMuted()) return reject("muted");
    const now = this.now();
    if (this.pendingScreenEntry && eventId !== this.pendingScreenEntry) {
      // If the first gesture immediately leaves CTA, acknowledge that action after unlock.
      // An entry that has actually been submitted still keeps its exclusive priority.
      if (eventId === "ui.cta.primary" && this.unlockPromise) this.pendingScreenEntry = null;
      else return reject("pending-entry");
    }
    if (this.engine.isOneShotBlocked(event)) return reject("exclusive");
    const previousAt = this.pendingTriggers.get(eventId)?.requestedAt ?? this.lastTriggeredAt.get(eventId) ?? -Infinity;
    if (now - previousAt < event.cooldownMs) return reject("cooldown");
    const needsUnlock = !this.unlocked || !this.engine.isRunning();
    if (needsUnlock && !this.unlockPromise) return reject("locked");
    const assetId = chooseVariant(event.assets, this.lastVariant.get(eventId), this.random);
    const request = { event, assetId, requestedAt: now };
    this.pendingTriggers.set(eventId, request);
    this.lastPlaybackResults.set(eventId, { status: "pending" });
    if (needsUnlock) {
      this.deferredOneShots.set(eventId, request);
    } else {
      this.submitOneShot(request);
    }
    return true;
  }

  submitOneShot(request) {
    const { event, assetId, requestedAt } = request;
    const canPlay = () => !this.disposed && !this.hidden && !this.engine.isMuted()
      && (event.exclusive || event.instancePolicy === "allow-tail-across-transition" || event.screens.includes(this.screen));
    const playback = canPlay()
      ? this.engine.playOneShot(event, assetId, requestedAt, { canPlay })
      : Promise.resolve({ status: "skipped", reason: "obsolete" });
    void playback.then((result) => {
      if (this.pendingTriggers.get(event.id) === request) {
        this.pendingTriggers.delete(event.id);
        this.lastPlaybackResults.set(event.id, { status: result.status, ...(result.reason ? { reason: result.reason } : {}) });
      }
      if (result.status === "started") {
        this.lastTriggeredAt.set(event.id, result.startedAt ?? this.now());
        this.lastVariant.set(event.id, assetId);
      }
    });
  }

  cancelDeferredOneShots(reason) {
    for (const [eventId, request] of this.deferredOneShots) {
      if (this.pendingTriggers.get(eventId) === request) this.pendingTriggers.delete(eventId);
      this.lastPlaybackResults.set(eventId, { status: "skipped", reason });
    }
    this.deferredOneShots.clear();
  }

  syncNetwork(nextSnapshot) {
    if (this.screen !== "MISSION_PLAY") return;
    const diff = diffNetworkAudio(this.networkSnapshot, nextSnapshot);
    this.networkSnapshot = nextSnapshot;
    for (const [color, change] of Object.entries(diff)) {
      const eventId = NETWORK_EVENTS[color];
      if (change.started) this.setLoopDesired(eventId, true);
      else if (change.stopped) this.setLoopDesired(eventId, false);
    }
  }

  clearNetworkLoops() {
    for (const eventId of Object.values(NETWORK_EVENTS)) this.setLoopDesired(eventId, false);
    this.networkSnapshot = Object.freeze({ blue: 0, green: 0, red: 0 });
  }

  setLoopDesired(eventId, active) {
    const event = this.manifest.eventById.get(eventId);
    if (!event || event.kind !== "loop") return;
    if (active) {
      this.desiredLoops.add(eventId);
      if (this.unlocked && !this.hidden && !this.engine.isMuted()) void this.engine.startLoop(event, event.assets[0]);
    } else {
      this.desiredLoops.delete(eventId);
      this.engine.stopLoop(eventId);
    }
  }

  async restoreDesiredLoops() {
    for (const eventId of this.desiredLoops) {
      if (this.disposed || this.hidden || this.engine.isMuted()) return;
      const event = this.manifest.eventById.get(eventId);
      if (event && event.kind === "loop") await this.engine.startLoop(event, event.assets[0]);
    }
  }

  setMuted(muted) {
    const value = this.engine.setMuted(muted);
    if (value) {
      this.pendingScreenEntry = null;
      this.cancelDeferredOneShots("muted");
    } else if (this.unlocked && !this.hidden) {
      void this.unlock();
    }
    return value;
  }

  toggleMuted() {
    return this.setMuted(!this.engine.isMuted());
  }

  isMuted() {
    return this.engine.isMuted();
  }

  async handleVisibility(hidden) {
    if (this.disposed) return;
    this.hidden = Boolean(hidden);
    this.engine.setHidden(this.hidden);
    if (this.hidden) {
      this.wasRunningBeforeHidden = this.unlocked;
      this.cancelDeferredOneShots("hidden");
      await this.engine.suspend();
      return;
    }
    if (shouldResumeAfterVisibility({ unlocked: this.unlocked, muted: this.engine.isMuted(), wasRunningBeforeHidden: this.wasRunningBeforeHidden })) {
      // A previous unlock may still be finishing while visibility changes.
      if (this.unlockPromise) await this.unlockPromise;
      if (!this.hidden && !this.disposed) await this.unlock();
    }
    this.wasRunningBeforeHidden = false;
  }

  dispose() {
    this.disposed = true;
    this.pendingScreenEntry = null;
    this.cancelDeferredOneShots("disposed");
    return this.engine.dispose();
  }
}

export { NETWORK_EVENTS };
