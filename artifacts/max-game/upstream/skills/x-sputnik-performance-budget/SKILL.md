---
name: x-sputnik-performance-budget
description: Audit or optimize X-SPUTNIK animation and WebGL performance when work involves jank, slow drag, frame drops, shader or particle cost, postprocessing, allocations, DPR, render lifecycle, or production readiness. Do not trigger for early visual ideation unless the user asks for performance work.
---

# X-SPUTNIK performance budget

Protect pointer responsiveness and stable visual state before adding fidelity.

## Before editing

1. Read [references/frame-budget.md](references/frame-budget.md).
2. Inspect the affected hot path and measure or derive the actual work before optimizing.
3. Load `phase` for a production performance audit and `gsap-performance` for GSAP/DOM motion. Load `threejs` and `x-sputnik-three-effects` for WebGL changes.

## Required guarantees

- Target 60 FPS on the primary 1920×1080 installation; treat 16.7 ms as the total frame budget, not an effects-only allowance.
- Preserve direct pointer response. Cosmetic smoothing must not delay authoritative drag coordinates.
- Keep one shared RAF/render loop and frame timestamp.
- Make zero allocations in ordinary frame, pointermove and link-update hot paths.
- Avoid layout reads mixed with writes. Prefer transform/opacity for DOM motion.
- Cap device pixel ratio through configuration and provide a degraded quality preset that never changes gameplay geometry.
- Pause decorative work when the document/scene is not visible and honor reduced motion.

## Audit order

1. Confirm whether the regression is CPU, GPU, layout/paint, shader compilation, texture upload or garbage collection.
2. Check accidental geometry/material/render-target recreation and duplicated listeners/loops.
3. Check draw calls, overdraw, full-resolution post passes, transparent layers and particle counts.
4. Check allocations and state writes in `pointermove` and animation callbacks.
5. Reduce quality only after removing accidental work.

Use the Phase scanner only as a candidate finder; read each finding in context. Do not use its `--diff` mode without the Git workflow required by root `AGENTS.md`, and do not write a baseline unless the task explicitly includes it.

Run deterministic project checks after modifications. Interactive browser profiling or visual checking requires an explicit user request in the current task.
