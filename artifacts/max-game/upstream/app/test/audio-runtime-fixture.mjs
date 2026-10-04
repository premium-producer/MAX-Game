import { readFile } from "node:fs/promises";
import { AudioEngine } from "../src/audio/audio-engine.mjs";
import { AudioDirector } from "../src/audio/audio-director.mjs";
import { validateAudioManifest } from "../src/audio/audio-manifest.mjs";

export const rawManifest = JSON.parse(await readFile(new URL("../public/config/audio.json", import.meta.url), "utf8"));
export const manifest = validateAudioManifest(rawManifest);
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

export async function audioFixture({ unlocked = true } = {}) {
  let wallTime = 1000;
  const now = () => wallTime;
  const parameter = () => ({ value: 1, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } });
  const node = () => ({ connected: true, connect() {}, disconnect() { this.connected = false; }, gain: parameter() });
  const context = {
    state: unlocked ? "running" : "suspended", currentTime: 0, destination: {}, sources: [], resumes: 0, suspends: 0,
    resumeGate: null, suspendGate: null, failStart: null,
    createGain: node,
    createDynamicsCompressor: () => ({ ...node(), threshold: parameter(), knee: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }),
    createBufferSource() {
      const source = { ...node(), buffer: null, loop: false, onended: null, ended: false, stopAt: Infinity,
        start() {
          if (context.failStart === this.buffer.id) throw new Error("injected source.start failure");
          this.startAt = context.currentTime;
          this.naturalEnd = this.loop ? Infinity : this.startAt + this.buffer.duration;
          context.sources.push(this);
        },
        stop(at = context.currentTime) { this.stopAt = at; if (at <= context.currentTime) this.finish(); },
        finish() { if (!this.ended) { this.ended = true; this.onended?.(); } },
      };
      return source;
    },
    async resume() { this.resumes++; if (this.resumeGate) await this.resumeGate.promise; if (this.state !== "closed") this.state = "running"; },
    async suspend() { this.suspends++; if (this.suspendGate) await this.suspendGate.promise; if (this.state !== "closed") this.state = "suspended"; },
    async close() { this.state = "closed"; },
    advance(seconds) {
      if (this.state !== "running") return;
      this.currentTime += seconds;
      for (const source of this.sources) if (Math.min(source.naturalEnd, source.stopAt) <= this.currentTime) source.finish();
    },
  };
  const engine = new AudioEngine(manifest, { contextFactory: () => context, storage: null, logger: null, now });
  await engine.initialize();
  const buffer = (id) => ({ id, duration: id === "cta-screen-enter" ? 6.679 : 2 });
  for (const asset of manifest.assets) engine.buffers.set(asset.id, Promise.resolve(buffer(asset.id)));
  const pending = [];
  const play = engine.playOneShot.bind(engine);
  engine.playOneShot = (...args) => { const p = play(...args); pending.push(p); return p; };
  const director = new AudioDirector(manifest, { engine, now, random: () => 0 });
  director.fullyPrepared = true;
  if (unlocked) await director.unlock();
  return {
    context, engine, director, pending, buffer,
    advanceWall(ms) { wallTime += ms; },
    shots: () => context.sources.filter((source) => !source.loop),
    ids: () => context.sources.filter((source) => !source.loop).map((source) => source.buffer.id),
    drain: () => Promise.all(pending),
  };
}
