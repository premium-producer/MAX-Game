# Stable activity completion button lifecycle

Local fix only; production has not been updated in this task.

The previous settled-geometry checks missed appearance/exit: the activity frame revealed the button after composition had finished, exposing its under-phone position for a frame. Its shared footer continued following the phone during the handoff. Press styling ended on immediate disable/release.

WebGL posts/store completion now has a dedicated parent owned by composition. The activity renderer only controls its presence and input eligibility, not its position. Initial opacity and input stay off until the first complete layout; stale motion corrections reset for this first placement. Entry is a 180 ms opacity fade at the computed position. Width remains equal to reference width.

An accepted press immediately hides/disables the original and creates one inert, aria-hidden, fixed optical snapshot at the last painted rectangle. Brightness/glow pulse and fade last 320 ms (160 ms reduced motion), without postponing the command or moving the hit target. Snapshot is excluded from layout, removed after the animation, and cleaned on disposal. Failed commands allow the original control to retry. Existing command guards and native touch duplicate suppression remain in place.

Validation: button-motion-browser.mjs records every visible entry/exit frame, clicks posts with mouse and store with trusted touch, asserts no visible unpositioned frame, no entry displacement above 3 px, fixed feedback bounds, no original control flashing during handoff, cleanup and successful next-screen navigation. Actual entry displacement is below 0.001 px. Press screenshots inspected. Eight live-admin scale/width/offset cases pass in button-centering-browser.mjs; 15 focused composition/native-touch tests and generated-source check pass. Final local build succeeds.

Scope: local Chromium, normal motion. The isolated activity preview does not render the reference surface; reference geometry is measured from its live layout. No claim of production wall/Spout verification until explicit deployment.


Deployment: explicitly requested and completed as BUTTON-MOTION-MAX-20261028-1 at 10:48:05 Moscow, 28 October 2026. See ../stand-patches/BUTTON-MOTION-MAX-20261028-1 for checksums and runtime verification.
