# MAX — optional looping video finale, 04.10.2026

## Scope / provenance

Independent repository `artifacts/workspace/exports/MAX-Game`, branch `codex/automatic-mission-copies`, base `8280f703a9ef8d12375fbe9eac1bc7038bc745c7` plus preserved prior uncommitted MAX work. No commit/push/deployment, no master F writes, no changes to reviewed gameplay markup/catalog. Player source, main integration, portable server, scoped/full builders, package lock, prepared video files, runtime and local copied documentation changed.

User input: `Ролики_Битва роботов.zip`, 11 media members. Order retained, source/output SHA in finale-videos/manifest.json. No startup preloading of the collection. Output 147511760 B, 295 seconds, 1080p25 H.264/AAC; originals preserved in user archive.

## Checks

- 31 CPU tests PASS: final eligibility matrix, every file SHA/faststart/order, actual HTTP server HEAD/206/suffix/416/malformed fallback/cancel/traversal, four complete automatic backend scenarios with QR still present, presentation gating, audio and bounded startup assets.
- `node --check`: guided-main, finale modules, start, both builders/helper and generated runtime server PASS.
- Duplicate guard and Git whitespace diff check PASS.
- Scoped builder PASS: 80 output files, 279 source inputs; Video.js separate bundle is lazy.
- HTTP SHA comparison 80/80; source input hashes 279/279. Every output MP4 probed: H.264 1920×1080 + AAC. Full results [JSON](max-video-finale-20261004.json).
- app.js SHA256 `2353e8bfa35d4bf2a69c037f69ab23da402f3742bf7f5005221b9151141c3335`.
- finale-player.js SHA256 `b0f4447d81a654806b931b7d3ff21cfd6e47d416385879d3def656a7868231a0`.

## Actual in-app browser

One local MAX page at 19446. Menu option initially off; enabled and selected automatic communication. Completion reached player instead of QR; next video advanced. Selected clip11 via visible selector, observed automatic wrap to clip1 then clip2 without mission navigation. One video element; audio diagnostics active=false/loops=[]/errors=0. Exit removed video and returned normal eight-card menu, same game instance and no startup reload.

Final rebuild: direct automatic+finale URL reached player. Browser refused initial unmuted autoplay without gesture; explicit Russian Play fallback displayed and started playback. Selected final clip again; observed clip1 selected after natural clip11 end. Pause exposed Play button. Browser error/warning logs empty. [Screenshot](max-video-finale-20261004.png).

Independent read-only review found hidden initial start not resumed and incomplete Play fallback for plugin-originated autoplay rejection; fixed pending-play intent, pause and playlistitem visibility. Review confirms actual repeat/autoadvance library mechanism and epoch/dispose cancellation. These exceptional hidden-start/error/cancel races are code-reviewed, not all fault-injected in a physical browser.

## Status / limits

Technical check PASS. Visual self-check: video retains aspect ratio, no QR/next-mission underneath overlay, player controls/exit visible. User acceptance OPEN. Encoded image/sound quality requires user evaluation. All11 files codec/hash-checked, not watched end to end. Physical iPhone, slow/error networks, hours-long cycling and production hosts not tested. No recording or GPU load test. Full builder syntax/wiring checked; only scoped V5 build executed to preserve current runtime editions.

For master integration: dependencies Video.js8.24.1/playlist5.2.0 Apache-2.0, range-parser1.2.1 MIT; notices/licenses included. Defaults off, local preview preference only, no DB migrations. Service mode excluded. Use exact current build.json and these hashes; preserve master adapters. [Contract](../../apps/max-game/docs/VIDEO_FINALE.md) · [Research](../../docs/Research/max-video-finale-20261004.md).
