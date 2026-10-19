// One sequence, advanced by the existing WebGL frame loop. Card entry start is
// supplied by the DOM animation owner; worldCleared means actual removal.
export class MissionMenuReveal {
  constructor() { this.cancel(); }
  begin(baseDurationMs, waveDurationMs, cardLeadMs = 0) {
    this.phase = 'waiting';
    this.cardLead = Math.max(0, cardLeadMs);
    this.waitElapsed = 0;
    this.cardsStarted = false;
    this.bases = 0;
    this.waves = 0;
    this.elapsed = 0;
    this.baseDuration = Math.max(1, baseDurationMs);
    this.waveDuration = Math.max(1, waveDurationMs);
  }
  cancel() {
    this.phase = 'idle';
    this.cardsStarted = false;
    this.bases = 1;
    this.waves = 1;
    this.elapsed = 0;
  }
  update(deltaMs, worldCleared, reducedMotion = false) {
    if (this.phase === 'idle' || this.phase === 'done') return;
    if (this.phase === 'waiting') {
      if (!this.cardsStarted) return;
      this.waitElapsed += Math.max(0, deltaMs);
      if (!worldCleared || (!reducedMotion && this.waitElapsed < this.cardLead)) return;
      this.phase = 'bases';
      this.elapsed = 0;
    }
    if (reducedMotion) { this.bases = this.waves = 1; this.phase = 'done'; return; }
    this.elapsed += Math.max(0, deltaMs);
    const duration = this.phase === 'bases' ? this.baseDuration : this.waveDuration;
    const t = Math.min(1, this.elapsed / duration);
    const eased = t * t * (3 - 2 * t);
    if (this.phase === 'bases') this.bases = eased;
    else this.waves = eased;
    if (t === 1) {
      this.phase = this.phase === 'bases' ? 'waves' : 'done';
      this.elapsed = 0;
    }
  }
}
