# MAX: LiDAR cursor and calibration

06.10.2026. Research for the requested input at `10.0.0.13:9001`. This document describes a proposed integration; it does not certify live packet capture, calibration, stand installation or physical accuracy. Research agent performed local read-only source inspection and official web documentation/issue reads. No stand mutation, F writes, browser QA or dependency download.

## Evidence boundary

The user reports that LiDAR arrives at port 9001 on 10.0.0.13. A port number does not identify UDP/TCP, OSC/TUIO, raw scans or a proprietary tracker. No active 9001/TUIO receiver was found in the scoped current MAX source slice or `artifacts/service`. Historical [LiDAR research](max-lidar-touch-20261001/README.md) describes Hokuyo UST-10LX / SCIP2.2 at TCP10940 on the former subnet; its measured identity is useful hardware history, but does not identify this new stream. Do not implement a guessed `/lidar/x` schema or reconnect directly to the sensor over an already functioning tracker.

Root should inspect the current owner's listener/process and capture a bounded packet sample without stealing an occupied socket. Save transport, sender, OSC addresses/type tags or JSON schema, range, timestamps and contact IDs. Empty traffic means unknown protocol, not proof that the tracker is broken. Read-only registration can identify which stand role owns 10.0.0.13; an IP must not replace the fixed role/UUID map.

### Live confirmation received from root later in this iteration

Root's explicitly authorized bounded capture confirmed UDP sender10.0.0.11:59947, owner`HokuyoTracker2.exe` at`C:/App/Lidar/43HokuyoTracker/HokuyoTracker2/HokuyoTracker2.exe`, OSC`/create` and`/update` with type tag`,iffff` (intID+fourfloats), and`/delete` with intID. An initial36-byte update includedID9,XY≈0.0312/0.2411 and two0floats. This is an observed tracker OSC profile, **not TUIO**; this agent did not independently capture it. Root stores the exact packet fixtures and lifecycle evidence under its technical report/task.

Only ID and XY semantics are established sufficiently for a cursor by observed lifecycle. Meanings of the two remaining floats are unknown; do not call them depth, pressure or width or use them to decide clicks. Public searches for exactHokuyoTracker2 protocol/source returned no usable upstream documentation. Existing disk settings referring tolocalhost3000 were reported stale by root; observed traffic9001 is the live authority. Cursor-contact creation/update/deletion uses the observed addresses; the conditional TUIO discussion below is an alternative specification and must not drive this integration. Use stable application+senderIP+profile identity, not ephemeralUDPport59947.

## Ready mechanisms

| Mechanism | Candidate/pin/license | Fit and limitation |
|---|---|---|
| OSC binary decode and transport | `osc` 2.4.5, MIT OR GPL-2.0; choose MIT notice | Node UDP/TCP transports and OSC bundles are ready mechanisms. Do not write a binary parser. Not presently installed in inspected MAX node_modules. Optional serialport is unnecessary; install with optional dependencies omitted if the integrator chooses this package. |
| Four-point projective solve and mapping | `perspective-transform` 1.1.3, MIT | Implements actual solve and transform/inverseTransform for two quadrilaterals. Small runtime, adequate if packets already contain planar XY. Not currently installed. Supports four point pairs, not general robust multi-point estimation. |
| Robust homography and perspective point mapping | OpenCV 4.10.0 / `opencv-python-headless==4.10.0.84`, Apache-2.0 | Existing F depth source pins this and NumPy1.26.4. Ready `getPerspectiveTransform`, `findHomography`, `perspectiveTransform`; prefer if the process already owns this runtime. Presence in depth requirements does not prove availability on MAX_RIGHT or MASTER. Avoid copying the full camera runtime for four points alone. |
| Visible motion damping | Existing `maath` 0.10.8, MIT | Current MAX `journey-v5-inertia.mjs` calls maath damp for icon/device motion. Retain that engine for visible cursor/drag smoothing; do not add a competing animation clock or filter chain. Measurement capture for calibration should retain raw coordinates. |

Sources: [osc.js API/transport](https://github.com/colinbdclark/osc.js), [exact upstream package version/license](https://github.com/colinbdclark/osc.js/blob/main/package.json), [perspective-transform API](https://github.com/jlouthan/perspective-transform), [version/license](https://github.com/jlouthan/perspective-transform/blob/master/package.json), [OpenCV transforms](https://docs.opencv.org/4.13.0/da/d54/group__imgproc__transform.html), [OpenCV4.10 point transformation](https://docs.opencv.org/4.10.0/d2/de8/group__core__array.html), [OpenCV license](https://github.com/opencv/opencv/blob/4.10.0/LICENSE). The generic `/4.x` docs redirected to4.13.0 during this research; local camera pin remains4.10.0 and must not silently upgrade. The [maath repository](https://github.com/pmndrs/maath) now redirects to `pmndrs/math`; this is not permission to migrate installed0.10.8 APIs.

## If capture confirms TUIO1.1

The official [TUIO1.1 specification](https://www.tuio.org/?specification) defines OSC bundles and `/tuio/2Dcur` `source`, `set`, `alive`, `fseq`. XY are normalized0…1. Session ID lasts for a contact; additions/removals derive from `alive`, not invented release messages. `fseq` permits dropping out-of-order frames; -1 marks redundant data. The default port3333 is configurable, so9001 neither proves nor excludes TUIO. Treat source/profile as part of identity. Commit complete frame updates, then derive game down/move/up from accepted contact lifetimes. Datagram receipt alone is not accepted game input.

Preserve one primary contact for the whole gesture if the downstream native/game input is single-pointer. Do not let a second hand steal the drag. On source loss, disable, calibration revision change or presentation/session change, send cancel and wait for a fresh contact before another down. Track heartbeat separately from motion: stationary contacts can remain alive with infrequent set updates. A silence timeout must match observed heartbeat cadence, not merely assumed40Hz.

## Reported operational limitations

[osc.js issue217](https://github.com/colinbdclark/osc.js/issues/217) reports incomplete delivery in a UDP→WebSocket relay burst of about1000messages. This is user experience, not a controlled MAX benchmark or confirmed library root cause. Use bounded latest-frame delivery for moves, preserve lifecycle edges and expose dropped/stale frame counts. Avoid relaying every raw packet to every browser client. [Issue list](https://github.com/colinbdclark/osc.js/issues) includes218 UDP relay close binding,179 Electron dgram context,220 TCP encoding. Run receiver in the Node host/service, not a browser bundle; use controlled shutdown and test actual transport if TCP is detected.

[perspective-transform issue list](https://github.com/jlouthan/perspective-transform/issues) includes degenerate quadrilateral width0 (#3), confusing results (#5), more than four pairs (#6) and alternative implementation request (#8). Detailed issue pages were not consistently retrievable; titles alone do not establish root causes. Reject duplicate/near-collinear/nonconvex corners, nonfinite coefficients and projective denominator near0. Verify corner mapping plus an independently captured center/test point. Such guards supplement the ready solver; they are not a new hand-written homography solver.

## Proposed first implementation

1. Keep current standard game and presentation settings unchanged by default. Add a MASTER operator section for LiDAR enabled/status, calibration start/cancel, reset/retry and save. Calibration is an operator overlay/input state, not a fifth persistent game content mode that accidentally replaces standard/assets/background/autoplay.
2. Choose four accessible points in the actual playable right-wall region, in fixed order TL→TR→BR→BL. Show a target on the wall and collect multiple raw readings of the same contact while the operator confirms the point. Require release between captures; do not accept one held hand as all four points. Fit with the selected ready solver. Then show mapped cursor and an independent center target before saving.
3. Maintain pending calibration separate from saved good calibration. Cancel restores the saved transform. Save atomically with revision/CAS, source identity, destination logical dimensions and target rectangle. A stale operator must not overwrite another calibration.
4. Map to the current game coordinate contract once. MAX logical content is4096×1280; global rear X offset3072 and native service rows are separate output concerns. Do not add3072 twice, calibrate against1282 service height or rescale logical texture to1920×1080.
5. Reuse current trusted pointer/owner/session path and native input bridge. Do not emit direct ACT or HOLD_CONFIRMED from OSC or bypass phone input-owner gating. Cursor display, hover, hold and drag must all consume the same accepted mapped contact coordinates.
6. During calibration suspend game input, cancel the old gesture and render raw/mapped diagnostic marker only in the explicit overlay. Production default retains no debug panels. Exit calibration must require a fresh gesture; it must not turn the calibration confirmation touch into a game click.

Diagnostics should distinguish packets→decoded frames→contacts→mapped cursor→game accepted input. Include receiver bind address/transport, sender/profile, frame/contact age, decode errors, sequence drops, activeID, calibration revision/error, delivery/cancel reason, bounded logs. Physical accuracy, hand jitter, minimum tap target, mount geometry and downstream accepted gestures remain hardware acceptance work; CPU fixtures cannot prove them.

## Local anchors and handoff

- `artifacts/service/input-router.mjs`, `game-page-host.mjs`: historical registered input with gesture phases and single Electron mouse contact; native mapping adds2service rows. These are evidence of existing semantics, not automatically current stand sources.
- `artifacts/workspace/tasks/max-control-panel-20261006/code/game/src/journey-v5-inertia.mjs`: current visible pose damping through maath.
- `F:/project/VK_DigitalProducts_Stand/artifacts/production-source-player-index-20261005/source/depth-silhouette/requirements-console.txt`: existing OpenCV/NumPy pins, read-only.

Following root's separate implementation assignment, this agent created only the protocol-independent calibration module, CPU tests, exact`perspective-transform`1.1.3MITpackage/lock and notice under`artifacts/workspace/tasks/max-lidar-20261006/code/calibration/`. TwelveCPU tests passed. It does not decodeUDP, infer the tracker float meanings, connect game input or install tostand/F. Root owns live protocol confirmation and final integration evidence. See its componentREADME for API, source identity, defaults, persistence and unresolved physical acceptance.

Traffic:0MB file transmission to stand by this agent; one dependency downloaded into isolated localworkspace cache (not known to traverse standSIM), internetdocumentation/API reads not measured. SIM remainder unknown. Local source searches/tests are not SIM traffic.
