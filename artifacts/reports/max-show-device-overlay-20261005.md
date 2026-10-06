# MAX show outer overlay exit — 05.10.2026

Read-only research followed by an isolated candidate patch assigned by the root agent. No F or live role writes, no build or stand restart.

Candidate: `artifacts/workspace/tasks/max-show-device-20261005/candidate/roles/ARCH_RIBBON/app/render/public/` (these native files also implement the MAX_RIGHT branch).

Changed only `max-show-overlay.js` and `native-external.js`. Baselines copied from accepted `F:/project/VK_DigitalProducts_Stand/artifacts/production-source-max-show-20261005/roles/ARCH_RIBBON/app/render/public/`; exact source paths and SHA256 are in `artifacts/workspace/tasks/max-show-device-20261005/overlay-baseline.json`.

The outer overlay retains its iframe during close. It sends `{type:'max-show:close',requestId}` to `http://127.0.0.1:9573` and accepts `{type:'max-show:closed',requestId}` only from the matching iframe window and origin. Matching acknowledgement or a 2500ms timeout performs removal. Repeated idle frames do not restart the timeout. A replacement run waits for the current exit; only the latest desired run mounts afterwards. Old acknowledgements cannot remove a new run. Dispose resolves pending close and removes listener/timer immediately.

Normal native stop awaits this close before disposing the rendering port. Pagehide remains immediate cleanup: actual page/process destruction cannot guarantee a visible exit. Child close animation and acknowledgement are implemented separately by the root agent; native Spout publication throughout a stop needs integration verification.

## Verification

- `node --test --test-isolation=none artifacts/workspace/tasks/max-show-device-20261005/overlay-close.test.mjs`: 7 PASS.
- Both changed JavaScript files pass `node --check`.
- Tests cover visible retention, matching acknowledgement, invalid origin/source/id/type, repeated OFF, timeout, run replacement, stale acknowledgement, pending replacement cancellation, disposal and native stop wiring.
- No independent browser/native/GPU test run by this agent; root owns the integrated verification. Duplicate guard/build belong to the combined candidate.

## Research basis

Existing mission-device painting and maath damping were located and reported to root. Installed maath0.10.8 is MIT; Video.js8.24.1 is Apache-2.0. [maath README](https://github.com/pmndrs/maath) describes interruptible refresh-rate-independent damping. [Issue33](https://github.com/pmndrs/maath/issues/33) records jumping when ordinary easing functions are inserted into its damping slot; preserve the current damping defaults. [Video.js Player source documentation](https://docs.videojs.com/player.js.html) provides metadata/dimension/lifecycle events. [WAAPI finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished) documents waiting for animation completion before DOM removal. This outer patch changes lifecycle coordination only, not animation interpolation.

Трафик SIM: RX — не измерено; TX — не измерено; всего — не измерено; учёт: не измерено; основание: 0 МБ передачи файлов на стенд, локальное чтение F и правка D/тесты; небольшие web-запросы документации и их маршрут через SIM не измерены; остаток: неизвестен. Не суммировать повторно с общей записью текущей задачи.
