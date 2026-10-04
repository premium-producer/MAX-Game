import { prepareTasks, withTimeout } from "../asset-preparation.mjs";

export class AudioEngine {
  constructor(manifest, {
    contextFactory = defaultContextFactory,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    storage = globalThis.localStorage,
    logger = console,
    now = Date.now,
  } = {}) {
    this.manifest = manifest;
    this.contextFactory = contextFactory;
    this.fetchImpl = fetchImpl;
    this.storage = storage;
    this.logger = logger;
    this.now = now;
    this.context = null;
    this.compressor = null;
    this.masterGain = null;
    this.busGains = new Map();
    this.buffers = new Map();
    this.decodedBuffers = new Map();
    this.voices = new Map();
    this.loops = new Map();
    this.loopGenerations = new Map();
    this.oneShotGeneration = 0;
    this.eventGenerations = new Map();
    this.exclusiveOneShot = null;
    this.hidden = false;
    this.contextShouldRun = false;
    this.contextOperation = Promise.resolve();
    this.loggedErrors = new Set();
    this.unlocked = false;
    this.disposed = false;
    this.supported = true;
    this.muted = readMuted(storage, manifest.settings.storageKey);
  }

  async initialize() {
    if (this.context || this.disposed || !this.supported) return this.context;
    try {
      this.context = this.contextFactory();
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 16;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.16;
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.manifest.buses.master.gain;
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      for (const bus of ["music", "ui", "gameplay", "signal"]) {
        const node = this.context.createGain();
        node.gain.value = this.manifest.buses[bus].gain;
        node.connect(this.compressor);
        this.busGains.set(bus, node);
      }
      return this.context;
    } catch (error) {
      this.supported = false;
      this.reportOnce("audio-context", error);
      return null;
    }
  }

  async preloadAll(onProgress) {
    const context = await this.initialize();
    if (!context) { onProgress?.(0, 0); return false; }
    await prepareTasks(this.manifest.assets.map((asset) => () => this.loadAsset(asset.id)), onProgress, 3);
    return true;
  }

  async preloadGroup(group) {
    if (this.disposed || !this.supported) return [];
    await this.initialize();
    const assets = this.manifest.assets.filter((asset) => asset.preloadGroup === group);
    return Promise.allSettled(assets.map((asset) => this.loadAsset(asset.id)));
  }

  async loadAsset(assetId) {
    if (this.buffers.has(assetId)) return this.buffers.get(assetId);
    const promise = this.loadAssetBuffer(assetId).then((buffer) => {
      if (!this.disposed) this.decodedBuffers.set(assetId, buffer);
      return buffer;
    }).catch((error) => {
      this.buffers.delete(assetId);
      this.reportOnce(`asset:${assetId}`, error);
      throw error;
    });
    this.buffers.set(assetId, promise);
    return promise;
  }

  async loadAssetBuffer(assetId) {
    const context = await this.initialize();
    const asset = this.manifest.assetById.get(assetId);
    if (!context || !asset || !this.fetchImpl) throw new Error(`Audio asset unavailable: ${assetId}`);
    return withTimeout(async (signal) => {
      const response = await this.fetchImpl(asset.url, { cache: "no-cache", signal });
      if (!response.ok) throw new Error(`${asset.url}: HTTP ${response.status}`);
      return context.decodeAudioData(await response.arrayBuffer());
    }, 60000, asset.url);
  }

  isOneShotBlocked(event) {
    return Boolean(this.exclusiveOneShot && !event.exclusive);
  }

  playbackUnavailable() {
    if (this.disposed) return "disposed";
    if (!this.supported) return "unsupported";
    if (this.hidden) return "hidden";
    if (this.muted) return "muted";
    if (!this.unlocked) return "locked";
    return null;
  }

  isRunning() {
    return !this.playbackUnavailable() && this.context?.state === "running";
  }

  async playOneShot(event, assetId, requestedAt = this.now(), { canPlay = () => true } = {}) {
    const unavailable = this.playbackUnavailable();
    if (unavailable) return { status: "skipped", reason: unavailable };
    if (this.isOneShotBlocked(event)) return { status: "skipped", reason: "exclusive" };
    let exclusive = null;
    if (event.exclusive) {
      this.stopAllOneShots();
      exclusive = { voice: null };
      this.exclusiveOneShot = exclusive;
    }
    const generation = this.oneShotGeneration;
    const eventGeneration = (this.eventGenerations.get(event.id) || 0) + 1;
    this.eventGenerations.set(event.id, eventGeneration);
    let voice = null;
    let started = false;
    try {
      let context = this.context;
      let buffer = this.decodedBuffers.get(assetId);
      // Prepared feedback starts in the input handler, before synchronous UI work.
      if (!context || !buffer) [context, buffer] = await Promise.all([this.initialize(), this.loadAsset(assetId)]);
      const reason = this.playbackUnavailable()
        || (generation !== this.oneShotGeneration ? "cancelled" : null)
        || (!canPlay() ? "obsolete" : null)
        || (this.exclusiveOneShot && this.exclusiveOneShot !== exclusive ? "exclusive" : null)
        || (!context || context.state !== "running" ? "not-running" : null)
        || ((event.maxInstances || 1) === 1 && this.eventGenerations.get(event.id) !== eventGeneration ? "superseded" : null)
        || (event.lateStartPolicy === "drop" && this.now() - requestedAt > this.manifest.settings.maxLateStartMs ? "late" : null);
      if (reason) return { status: "skipped", reason };
      const current = (this.voices.get(event.id) || []).filter((candidate) => !candidate.stopped);
      const limit = Math.max(1, event.maxInstances || 1);
      while (current.length >= limit) this.stopVoice(current.shift(), this.manifest.settings.stopFadeMs);

      voice = this.createVoice(event, buffer, false);
      if (exclusive) exclusive.voice = voice;
      current.push(voice);
      this.voices.set(event.id, current);
      voice.source.start();
      started = true;
      return { status: "started", voice, startedAt: this.now() };
    } catch (error) {
      if (voice) this.stopVoice(voice, 0);
      this.reportOnce(`play:${event.id}`, error);
      return { status: "failed", reason: "playback-error" };
    } finally {
      if (!started && exclusive && this.exclusiveOneShot === exclusive) this.exclusiveOneShot = null;
    }
  }

  async startLoop(event, assetId) {
    if (this.playbackUnavailable() || this.loops.has(event.id)) return this.loops.get(event.id) || null;
    const generation = (this.loopGenerations.get(event.id) || 0) + 1;
    this.loopGenerations.set(event.id, generation);
    let voice = null;
    try {
      let context = this.context;
      let buffer = this.decodedBuffers.get(assetId);
      if (!context || !buffer) [context, buffer] = await Promise.all([this.initialize(), this.loadAsset(assetId)]);
      if (!context || this.playbackUnavailable() || this.loopGenerations.get(event.id) !== generation) return null;
      if (context.state !== "running") return null;
      voice = this.createVoice(event, buffer, true);
      this.loops.set(event.id, voice);
      const now = context.currentTime;
      voice.gain.gain.setValueAtTime(0.0001, now);
      voice.gain.gain.setTargetAtTime(event.gain, now, fadeTimeConstant(this.manifest.settings.loopFadeMs));
      voice.source.start();
      return voice;
    } catch (error) {
      if (voice) this.stopVoice(voice, 0);
      this.reportOnce(`loop:${event.id}`, error);
      return null;
    }
  }

  stopLoop(eventId, fadeMs = this.manifest.settings.stopFadeMs) {
    this.loopGenerations.set(eventId, (this.loopGenerations.get(eventId) || 0) + 1);
    const voice = this.loops.get(eventId);
    if (!voice) return;
    this.loops.delete(eventId);
    this.stopVoice(voice, fadeMs);
  }

  stopAllOneShots(fadeMs = this.manifest.settings.stopFadeMs) {
    this.cancelPendingOneShots();
    this.exclusiveOneShot = null;
    for (const voices of [...this.voices.values()]) for (const voice of [...voices]) this.stopVoice(voice, fadeMs);
  }

  cancelPendingOneShots() {
    this.oneShotGeneration += 1;
    if (this.exclusiveOneShot && !this.exclusiveOneShot.voice) this.exclusiveOneShot = null;
  }

  setHidden(hidden) {
    this.hidden = Boolean(hidden);
    if (!this.hidden) return;
    this.contextShouldRun = false;
    this.cancelPendingOneShots();
    for (const [id, generation] of this.loopGenerations) this.loopGenerations.set(id, generation + 1);
  }

  async resume() {
    if (this.hidden || this.disposed) return false;
    const context = await this.initialize();
    if (!context || this.disposed || this.hidden) return false;
    this.unlocked = true;
    this.contextShouldRun = true;
    return this.syncContextState();
  }

  async suspend() {
    this.contextShouldRun = false;
    await this.syncContextState();
    return this.context?.state === "suspended";
  }

  syncContextState() {
    // Serialize lifecycle operations so a late suspend/resume cannot win over newer intent.
    this.contextOperation = this.contextOperation.then(async () => {
      if (!this.context || this.disposed) return false;
      try {
        const running = this.contextShouldRun && !this.hidden;
        if (running && this.context.state === "suspended") await this.context.resume();
        else if (!running && this.context.state === "running") await this.context.suspend();
        return this.context.state === "running" && this.contextShouldRun && !this.hidden && !this.disposed;
      } catch (error) {
        this.reportOnce("lifecycle", error);
        return false;
      }
    });
    return this.contextOperation;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) this.stopAllOneShots(50);
    try { this.storage?.setItem(this.manifest.settings.storageKey, this.muted ? "1" : "0"); } catch (_) { /* Keep the in-memory setting. */ }
    if (this.context && this.masterGain) smoothGain(this.masterGain.gain, this.muted ? 0 : this.manifest.buses.master.gain, this.context.currentTime, 50);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAllOneShots(0);
    for (const eventId of [...this.loops.keys()]) this.stopLoop(eventId, 0);
    for (const voices of this.voices.values()) for (const voice of [...voices]) this.stopVoice(voice, 0);
    this.voices.clear();
    this.buffers.clear();
    this.decodedBuffers.clear();
    if (this.context && this.context.state !== "closed") {
      try { await this.context.close(); } catch (_) { /* Page teardown is best-effort. */ }
    }
  }

  createVoice(event, buffer, loop) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = event.gain;
    source.connect(gain);
    gain.connect(this.busGains.get(event.bus));
    const voice = { eventId: event.id, source, gain, stopped: false };
    voice.ended = new Promise((resolve) => { voice.resolveEnded = resolve; });
    source.onended = () => this.forgetVoice(voice);
    return voice;
  }

  stopVoice(voice, fadeMs = 0) {
    if (!voice || !this.context) return;
    if (voice.stopped) {
      if (fadeMs <= 0) {
        try { voice.source.stop(); } catch (_) { /* Already stopped. */ }
        this.forgetVoice(voice);
      }
      return;
    }
    voice.stopped = true;
    const now = this.context.currentTime;
    if (fadeMs > 0) smoothGain(voice.gain.gain, 0, now, fadeMs);
    try { voice.source.stop(now + Math.max(0, fadeMs) / 1000); } catch (_) { /* A source may already have ended. */ }
    if (!fadeMs) this.forgetVoice(voice);
  }

  forgetVoice(voice) {
    if (!voice || voice.forgotten) return;
    voice.forgotten = true;
    if (this.exclusiveOneShot?.voice === voice) this.exclusiveOneShot = null;
    voice.resolveEnded();
    if (this.loops.get(voice.eventId) === voice) this.loops.delete(voice.eventId);
    const current = this.voices.get(voice.eventId);
    if (current) {
      const next = current.filter((candidate) => candidate !== voice);
      if (next.length) this.voices.set(voice.eventId, next);
      else this.voices.delete(voice.eventId);
    }
    try { voice.source.disconnect(); } catch (_) { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch (_) { /* Already disconnected. */ }
  }

  reportOnce(key, error) {
    if (this.loggedErrors.has(key)) return;
    this.loggedErrors.add(key);
    this.logger?.warn?.(`[audio] ${key}`, error);
  }
}

function defaultContextFactory() {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Context) throw new Error("Web Audio API is not supported");
  return new Context({ latencyHint: "interactive" });
}

function readMuted(storage, key) {
  try { return storage?.getItem(key) === "1"; } catch (_) { return false; }
}

function fadeTimeConstant(milliseconds) {
  return Math.max(0.005, milliseconds / 1000 / 3);
}

function smoothGain(parameter, value, now, milliseconds) {
  parameter.cancelScheduledValues(now);
  parameter.setValueAtTime(Math.max(0, parameter.value || 0), now);
  if (milliseconds <= 0) parameter.setValueAtTime(Math.max(0, value), now);
  else parameter.linearRampToValueAtTime(Math.max(0, value), now + milliseconds / 1000);
}
