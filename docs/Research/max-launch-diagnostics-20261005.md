# Постоянный журнал запуска MAX — исследование и выбранное решение

05.10.2026. Принято electron-log5.4.4/MIT. Реализация ограничивает записи4KiB, sliding-window10/с без burst20; suppressed count переносится в следующую запись, фиксированного10-секундного таймера нет. Это уточняет первоначальные предложения ниже. Реальные тесты и ограничения — в [отчёте](../../artifacts/reports/max-launch-diagnostics-20261005.md).

# MAX launch incident: persistent logging selection

Research 2026-10-05. Scope: read-only local/F inspection and primary-source documentation; no live writes, browser execution, package installation or performance claim. This is a task handoff note; root should incorporate it into docs/Research and its index if the design is adopted.

## Existing infrastructure and gap

F/artifacts/production-source-stand-motion-trace-20261005/roles/VK_LEFT/app/render/idle-adapter/motion-trace.mjs already supplies asynchronous JSONL with one in-flight write, 4 MiB pending queue, 16 MiB files and eight rotations. It preserves UTC wallTimeMs plus monotonic time and records dropped/writeErrors. It is useful for diagnostic capture, not an always-on launch journal: createMotionTrace closes at a bounded duration (maximum one hour), configuration currently requests 30 minutes, and file names include PID. Therefore aggregate disk usage can grow over restarts even though each process's files are bounded. README says MASTER/STELLA semantic collectors were prepared but not installed in that increment. This is not evidence that the screenshot's failed launch has complete correlation logs.

Search of current artifacts/service and artifacts/max-game package/lock manifests found no Pino, electron-log or rotating-file-stream dependency. Do not assume those libraries are already deployed. Existing collector/correlate.py can consume UTC records to build a timeline and Perfetto trace, but it must not mistake a software acknowledgement for physical presentation.

## Recommended minimal increment

Use pinned **electron-log 5.4.4**, MIT, `electron-log/node`, in the MAX adapter (Node 25 stand runtime). Its actual file transport implements rotation. This is an upstream mechanism, not a new rotation implementation. It has no production dependencies and supports Node >=14. Configure a fixed per-component filename under role `data/logs`, one writer per file, maxSize 8 MiB and default `.old` rotation. Use JSON format with application-selected primitive fields and bounded strings. Disable console, IPC and remote transports for this logger. Keep current operational stderr as fallback if file logger fails; make logging health inspectable.

For low-frequency launch/control events retain sync file writes, which avoid an unbounded async write queue. Never send frame-by-frame events into this sink. Guard the intake with a small explicit maximum event size and event rate; these limits are application protocol validation, while persistence/rotation belongs to electron-log. Proposed starting budget: 4 KiB record, 10 accepted events/sec per authenticated process, 20 burst, one summary of suppressed events each 10 seconds. These are design proposals, not measured safe performance limits. Error/failure stages should not be suppressed by redundant health samples. A write can exceed file maxSize by one bounded record because rotation is checked before the next write.

[Upstream version, engine and license](https://raw.githubusercontent.com/megahertz/electron-log/master/package.json), [file transport documentation](https://github.com/megahertz/electron-log/blob/master/docs/transports/file.md), [implementation: sync default and rotation fallback](https://raw.githubusercontent.com/megahertz/electron-log/master/src/node/transports/file/index.js).

Real documented deployment: Teams for Linux exposes electron-log configuration including file maxSize, format and levels. This supports practical suitability for Electron application diagnostics, not proof of performance on this stand. [Project logging guide](https://ismaelmartinez.github.io/teams-for-linux/development/log-config/).

## Alternative for higher event rates

Pino 10.4.0 + pino-roll 4.0.0 (MIT) provides structured records plus ready-made asynchronous rotation. Direct in-process build avoids a new worker-thread bootstrap. pino-roll accepts SonicBoom maxLength/periodicFlush options, supports size and retention count, and must explicitly enable removeOtherLogFiles to bound old runs. Use a dedicated directory, fixed filename and single writer; no symlink on Windows. Set maxLength and track drop/error events. Pino alone does not implement rotation.

[Pino API](https://github.com/pinojs/pino/blob/main/docs/api.md), [rotation guidance](https://github.com/pinojs/pino/blob/main/docs/help.md), [pino-roll options/limitations](https://github.com/mcollina/pino-roll), [SonicBoom buffer/drop behavior](https://github.com/pinojs/sonic-boom).

Upstream experience includes historical UTF-8 byte-counting/buffering problems, so actual Cyrillic records, forced flush, rotation and restart retention must be integration-tested; a successful ASCII unit test is insufficient. This is an old issue, not a claim that current releases retain its bug. [Pino issue 1497](https://github.com/pinojs/pino/issues/1497).

## Required events and debugging view

Record a correlation chain keyed by bootId, assignmentId, sessionId, contentRevision and request/command id: assignment observed â†’ canonical binding received â†’ companion ready â†’ game iframe loaded â†’ gameReady â†’ managedBinding matches â†’ visibility requested â†’ wall readiness submitted â†’ acknowledgement accepted/rejected â†’ launch confirmed or timed out. On timeout persist which exact gates were false, elapsed milliseconds and last safe error code. Preserve action/result revision and lease owner changes. Log disconnect/reconnect plus one state-change event, not every poll. Provide a read-only loopback diagnostic status with current gates and recent bounded event summaries; production LED stays clean. No open remote DevTools port is required.

Privacy: never log QR URL/token, Authorization/cookies, stand secret, full HTTP bodies, environment variables, raw snapshots or personal asset text. Log asset id/path without query, stable internal ids, known codes and status numbers. Redact error strings before storing because arbitrary messages can contain URLs or secrets. Keep logging independent of business state; logger failure must not acknowledge readiness or alter mission result.

Verification before applying: executable tests against the installed library for parseable Cyrillic JSONL, rollover+restart retention, unwritable/full destination behavior, event-size/rate limits, no secrets in records, and correct correlation of one simulated startup timeout and recovery. No browser is needed. Logs prove protocol progress only; user physical acceptance remains separate.

Traffic SIM: 0 MB file transfer by this subagent; total Internet traffic not measured. Official documentation retrieval used tooling outside the stand connection; no SIM debit asserted. Current stand balance unknown.
