# Independent startup gate audit

Read-only source audit of installed MAX-UI-COPY-20261006-R1 stand donor. No browser, network, F or live file changes.

## Finding

The hidden-next-icon change exposes an existing all-node settlement assumption. In `journey-guided-main.js:197`, the startup renderer omits every node with `controller.presence(o) === 0`. V5 route presence is zero for all future task icons (`journey-v5-route-layout.mjs:42–50,173–179`). Therefore only `open-max` and the current task have live GPU motion objects after the introductory row has formed.

At `journey-guided-main.js:459`, `controller.nodes.every(o => foreground?.isSettled(host, o.step))` still includes the hidden future nodes. `journey-webgl-ui.mjs:495` deliberately returns false when a node has no retained motion (`!!m`). This leaves `settled` false indefinitely. `V5RevealJourney.tickStartup` row→trace requires `paths.done`, `options.settled` and `deviceReady` at line 161; thus it remains in the row stage. Row suppresses all links (route-layout lines 109–110), matching the provided photo: two icons, MAX splash, no links or task screen.

This is a presentation deadlock, independent of LiDAR input. The selected mission and palm confirmation have already happened if row and device splash are shown.

## Minimal fix

For **bfmVisual only**, exclude intentionally zero-presence icons from settlement. Preserve original all-node semantics for other reveal profiles and the non-reveal path. For example:

```js
const iconsSettled = controller.nodes.every(o =>
  bfmVisual && controller.presence(o) === 0 || foreground?.isSettled(host, o.step));
```

Then use `iconsSettled` in the existing reveal-mode `settled` expression without modifying its phone-coordinate, phone-opacity, phone-readiness or camera gates. A standalone CPU-testable helper is acceptable if imported into this exact location. Do not change `isSettled` globally to return true for missing motions: that would conceal accidentally missing admitted objects in every visual profile.

## Transition review

* Shell: all icons intentionally absent; shell→row already checks only deviceShown and deviceReady. Filtering does not alter that contract.
* Row: temporary zero-presence current icons at animation start may make the icon-only predicate vacuously true. Row→trace still cannot occur before `paths.done`; by that point the admitted icons have nonzero presence. Every admitted icon with nonzero presence must still return true from `isSettled`, so missing or moving visible objects continue blocking.
* Trace/fan/content: current and previous icons remain admitted. Device-ready, GPU upload-key, phone geometry, camera and busy gates remain authoritative. Content cannot leave the splash until its device is prepared.
* Handoff exit→pack: display task admission changes at pack, not when backend first advances. Path previous-frame guard (`wasDone`/advance at route-layout lines 118–122) and phone hide/show readiness remain unchanged. Future zero-presence icons cannot deadlock repacking; the new current icon becomes visible and must settle before pack completes.
* Pause, dragging, busy or nonpositive dt: route-layout guards remain unchanged; readiness helper cannot move lifecycle while these block.
* Reduced motion: paths become done on their tick but transition consumes previous-frame settlement. Current presence becomes positive and uses the normal admitted object requirement.
* Missing optional `foreground`: visible icons continue returning false/undefined; hidden zero-presence future nodes alone are exempt.

## Regression test requirement

Existing UI-copy tests inject `settled:true` into controller ticks, so they cannot catch renderer/controller contract failures. New tests must compute settlement from an **incomplete set of live motion IDs** matching what startup render emits, rather than declaring all-node settlement true. Assert legacy predicate remains false and fixed predicate completes startup, across missions, normal/reduced motion, paused/busy/not-ready states; also assert a missing nonzero-presence current icon still blocks. Handoff tests should use the same visibility-aware gate with future icons omitted. No browser is required to exercise this contract, but physical visual acceptance remains open.

Technical audit: PASS for the root cause and proposed narrow scope. Runtime/fix tests are owned by root. Visual verification: NOT RUN under user prohibition. User acceptance: OPEN.

Traffic SIM: RX 0 MB file transfers; TX 0 MB file transfers; total 0 MB file transfers; overall internet traffic unmeasured. Local source reads only; no stand network usage. Calculated remaining balance unknown due earlier accounting gaps.

## Implemented fix review and package approval

Root implemented the stronger admission-based version: `V5RevealJourney.settlingNodes` filters `nodes` by the existing `nodeAdmitted` predicate, while `journey-guided-main` selects that list only when `bfmVisual` is true. This is preferable to the initial opacity-only proposal: the admitted current object must still block progression while its opacity is zero or its live group has not yet been created. Completed, skipped and reached icons also remain in the required list. Intentionally hidden future icons alone are exempted.

Both stand and client source diffs inspected against MAX-UI-COPY donor: main only adds the profile-specific node-list selection and substitutes it into the existing predicate; route adds the comment and getter. All phone geometry, opacity, readiness and phase checks are retained. Camera alignment and `controller.tick` busy/dragging/active/media upload-key gates are untouched. No changes to global renderer settlement.

The root startup regression extracts the actual main `settled` expression and actual renderer `isSettled` method, builds retained motion IDs only for icons emitted by visibility-based render, and reproduces the old all-node deadlock. It checks all four missions at 30/60/120 Hz with reduced motion on/off (48 lifecycle combinations), plus blocking admitted opacity, moving/intro state, phone position/readiness, pause and busy cases. The fixture uses the native engine with the same reviewed catalog, rather than enabling local gameplay in the managed-only stand profile.

Independent additional regression at `audit/handoff-gate.test.mjs` executed: **2/2 PASS**, stand and client. It uses the actual main/renderer predicate through startup and a confirmed first-task completion. Immediately after exit→pack, the new current object is admitted at zero opacity but absent from the motion map, and correctly blocks. Completed previous task stays admitted. Rendering the current task releases packing and completes the full handoff; untouched future task remains absent. This closes the real-gate coverage gap in the former handoff tests that injected settlement.

Deployment review: `delivery/MAX_RIGHT.zip` contains exactly the three allowed files. ZIP SHA `58fdd909d6a547b991a9feb272862804d1c7f818463b01758875946810989c4b` matches plan. Target app baseline `c5e0cdbac632519c5f71454a6d2edfd26baaada5575299dbb0db6be0837256a0` and replacement `1eb4fa93076257f2eae21871db1669c9dc1a826e27d88334470e18294e6c57f8` are pinned. `accepted-source.json` retains every old field and overlay, including UI-copy, and changes the app hash/source suffix while adding `startupVisibleGate`. The original UI-copy build receipt remains protected.

`apply.ps1` retains the accepted workflow: exact host/root identity; allowlist; archive/payload/baseline/protected-file hashes; canonical boot/task identity; idle checks both before backup and immediately before stop; owned-process tree stop/wait; post-stop CAS; backup and rollback; two root/component manifest ledger updates; unchanged protected settings/receiver/calibration/CSS/UI-copy receipt; scheduled interactive start; fresh boot and launcher health verification. It does not cancel an active assignment or write MASTER/F. Root alone owns live application.

Blocking findings: **none**. Limitations: CPU motion fixture exercises the renderer/controller predicate but does not instantiate WebGL or measure physical frame timing. Browser/GPU/physical visual acceptance is still OPEN and must not be inferred from these tests. No network or deployment actions performed by this audit agent.
