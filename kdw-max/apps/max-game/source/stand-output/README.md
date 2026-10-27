# Production host input

`lidar.mjs` connects OSC contacts to Chromium's native touch input. No direct mission commands. The explicit local calibration targets the actual 3072×1536 viewport; no default/identity calibration is enabled on a delivered stand.

`hokuyo-osc.mjs` is carried from the installed MAX-LIDAR-TOPMOST-20261006-R1 source (SHA256 `4bcc2fc90a8423d07ea0af75d967f933f8ad756cf75397c2970615c8e4e9c474`): select minimum calibrated screen Y once per OSC packet, stable gesture ID across physical point changes, stale-point quarantine. Both `,iff` and `,iffff` profiles remain accepted. `calibration.mjs` retains the existing guarded perspective-transform solver; its historical default BFM dimensions are never used by the new host, which supplies both target points and dimensions explicitly.

Vendored npm dependencies: osc 2.4.5 (MIT option), perspective-transform 1.1.3 (MIT), long 4.0.0, slip 1.0.2, wolfy87-eventemitter 5.2.9, ws 8.18.0, with original notices. Serial port and optional native WebSocket optimizations are not installed or required. `source/build.mjs` bundles them into launcher/lidar.cjs; the stand does not need npm.

Run `node ops/production-build/test-lidar.mjs`. Actual UDP/native game test: `prepare-test.py` and `test-stand-output.cjs` in ops/production-build, exclusively against `.cache/stand-integration`.
