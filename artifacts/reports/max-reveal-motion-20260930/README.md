# MAX Guided Reveal — motion and empty-phone repair, 30.09.2026

Scope: local Guided Reveal source/runtime and the existing `max-wall-right` source in the development master. No server publication, other source restart, heavy GPU run or video recording.

## Findings and change

- Previously the reveal waited for every icon to finish the centre-to-ring leg before beginning the ring-to-row phase. The ring's angular order differed from the row's X order. There was no scan-triggered radial effect, and standalone fluid received no scan impulse.
- The new ordered fan uses count-dependent overlapping launch times. The first MAX leg ends at the last icon's launch, and each icon enters its own curved row transfer immediately after its first leg. The route edge remains gated by actual final settlement.
- The existing prepared WebGL intro-burst shader now receives palm hold/start/cancel. The hold phase is published even before a route node exists. Standalone also emits bounded radial splats into its existing background solver.
- The user's empty-phone screenshot showed the phone frame and instruction with no rendered screen. The initial phone content was mounted before `session.task` was set, then the answer token changed at task entry and caused the identical content to be destroyed and rebuilt while the shell was appearing. The visual content key now excludes the answer token; token and disabled state update on existing controls. The earlier Guided Line key is unchanged.

## Checks

- Duplicate guard PASS; syntax check PASS for five modified production JS modules and the targeted test file.
- Four targeted background, Guided Line, reveal and motion suites: 50/50 PASS (24/24 in `journey-guided-reveal.test.mjs`). Covers six missions and business branches, 0.8 s hold/cancel, overlapping schedule, first-leg/last-launch coincidence, ordered intermediate X poses, arc/row settlement at 30/60/120 Hz, restore, drag and stale answers. Regression assertions verify that activating the answer token does not change the prepared phone content key and that the local scan burst is visible during hold and stops on cancellation.
- MAX build PASS: 326 files, 91 compiled inputs; `check-local.mjs` PASS.
- Local master: only `max-wall-right` restarted. Final generation `bfb0dedf-6e62-468c-a577-90f4e3bc6e44` was running without error; `Check.bat` passed in dev mode. Spout is disabled by this mode.
- One browser tab at `http://localhost:8770/max-game/guided-reveal/?review=blogger` displayed the route, connected phone, first screenshot and instruction; console error list empty. The fixture does not store player progress.

The browser frame verifies the landed composition and visible phone content, not the quality of every in-between frame. CPU tests verify the planned intermediate poses; the live palm hold was not captured in this short fixture check. Fluid look, pacing and readability on the physical wall remain for user/artistic review; TD reception and a sustained FPS measurement were not run.

[Motion research and primary sources](../../../docs/Research/max-guided-reveal-choreography-20260930.md) · [runtime contract](../../../apps/max-game/docs/GUIDED_REVEAL.md).
