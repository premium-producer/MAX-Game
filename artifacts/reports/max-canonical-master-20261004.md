# WAVE05/A — Canonical MAX behind launch-v3

04.10.2026. **Isolated candidate D; root owns F application and browser acceptance.**

## Result and source

New schema/workflow4 preserves the accepted launch-v3 plan, exact quiz tag IDs/visibility/orbit and whiteEntity=false. The existing DBOS control/assignment queues remain the only queues. Canonical game is allocated after wall_arrived; actual Node game state drives playing/terminal. Technical presented/contact/finish cannot drive schema4.

- Master candidate: `artifacts/workspace/tests/parallel-wave5/master-candidate`.
- Node candidate: `artifacts/workspace/tests/parallel-wave5/max-candidate`.
- Exact allowlist/SHA/provenance: `artifacts/workspace/tests/parallel-wave5/max-tests/handoff.json`: **5 master files, 385 Node files, 6 Node deltas against WAVE02**.
- Canonical baseline is accepted F plus WAVE01 lifecycle. WAVE02 pinned v5/catalog is preserved: `missions-reviewed-20261003-abe878cfed89` (4 missions/15 tasks/70 screens/75 actions). This is a technical integration pin, not the newer D04.10(1) client.
- Node deltas: managed-host.mjs; API suspendSession reuses the existing serialized lease deactivation; presentation auth URL moves /fixture/player→/bridge/player in matching source and bundle; separate readiness module loaded from HTML. Game reducer/catalog/mission-session/SQLite worker are unchanged against WAVE02.
- The inherited build-manifest.json describes the original WAVE02 build. WAVE05 handoff records the exact source/bundle auth-URL transformation and new wrapper modules. No rebuild against drifting D visual dependencies was performed or claimed. Rebuilding remains dependent on the inherited D source inputs; the pinned static runtime is self-contained.

[Research and library mechanisms](../../docs/Research/max-canonical-master-20261004.md). No new packages, scheduler or game rules. Existing notices retained. No commits/push, live8782/F writes, TD/hardware/AI or video recording.

## Wiring

Root launcher supplies `LOCAL_MASTER_MAX_CANONICAL_URL=http://127.0.0.1:<nodePort>` and `LOCAL_MASTER_MAX_CONTROL_TOKEN`. Credentials are never logged, placed in URLs, or persisted in workflow arguments. Root owns protected credential-file creation. Without URL, new admissions remain technical v3. Stored v1/v2/v3 envelopes remain on their original workflows even when v4 is enabled.

Start:

```text
node managed-host.mjs --port <nodePort> --data <canonicalData> --master http://127.0.0.1:<masterPort> --parent-stdio
```

The master may not yet be listening at host startup. /health includes ready/mode/catalog/processId. Optional stdin EOF closes API, server and SQLite; this binds the child to root's pipe lifetime. No PID polling supervisor. Exact-child startup/shutdown remains root-owned.

`GET /max/state.current.canonical` appears in **delivery** after assignment commit and contains mode, assignmentId, sessionId, generation, source, contentRevision, receipt and viewUrl. Mount this stable viewUrl once per assignment and retain it through delivery/awaiting_touch/playing. CSP permits self and exact master origin. No CORS or player token in URL.

Pinned v5 reports gameReady after asset/GPU preparation; after two frame opportunities `/bridge/presented` validates its assignment/session and forwards exact aid/session/catalog/generation through the control boundary to `/max/canonical/presented`. This is a local rendering acknowledgment, not external LED/Spout proof. Failure/retry leaves Stella occupied. Node mutation gate reads current master state and rejects early/stale/paused inputs. No standalone session fallback or renderer mission selection.

## Durability and release

Every external call is a DBOS step. The assignment request is frozen before its HTTP POST. Unknown accepted response is reconciled by the same assignment ID and immutable payload. Cancellation and expiry enter persisted releasing; the DBOS assignment queue remains held until canonical cancel/release receipt succeeds. Only then is the master slot cleared and the next FIFO assignment admitted. An unknown release response retries the same command ID.

Canonical completed/incomplete/expired are observed from the real core. Waiting-touch expiry cancels an unplayed canonical assignment and records master expired; it does not fabricate a completed game. No white entity is introduced.

## Verification

**66 actual HTTP checks PASS**, log `parallel-wave5/max-tests/http-results.txt`, evidence/data `max-tests/run-6bf404e7f5`.

- Direct wall → selected mission → full tags/ribbon/wall markers → actual canonical assignment.
- No owner/timer before renderer evidence; technical presented/contact/finish denied.
- Actual trusted hold and real ACT; read/reload keeps the same game screen.
- Hard master restart and canonical process restart preserve exact IDs/state; game restores paused.
- Second Stella quiz enqueues, frees Stella on enqueue; cancel commits canonical release before FIFO generation2. Old-session commands cannot mutate the new game.
- Pause rejects actual player input; resume/cancel operate on the same assignment.
- Technical v3 created with opt-in disabled survives restart with v4 enabled; new v4 queues behind it on the same DBOS queue.
- Actual canonical expiry exercised using a **test-only injected clock** and extended test lease; no forged finish command. Master observes expired and releases. Separate awaiting-touch expiry releases the unplayed canonical assignment.
- Actual HTTP proxy discards POST response after Node commit. Port reconciles exact persisted assignment, subsequent retry is idempotent.
- stdin EOF graceful shutdown PASS. All own fixture processes stopped.

28 legacy durable function bodies AST-identical to F (`max-tests/legacy-proof.json`). Changed Python compile, JS checks and duplicate guard PASS. Previous WAVE01 schema2→3/terminal receipt migration evidence is inherited; it was not rerun or relabelled as a new test here.

Extended restart testing exposed a SQLite hot-journal issue in the concurrent identity module. B fixed its owner-locked startup recovery and added its own regression; the final66-check run includes that fix. No identity files edited by A.

**Browser/GPU check:** root pending for this new wrapper; WAVE02 prior IAB is provenance, not WAVE05 acceptance. HTTP presented in tests is explicitly technical evidence and does not claim pixels were observed.

## Limits kept explicit

Local explicit same-origin token separation is not production device authentication. Canonical game checkpoint remains5s; pending game commands remain RAM-only. Startup/readiness bounds, lease pause latency, global AV ownership, hardware contacts, portable rebuild, coordinated three-DB restore and new D client content are separate work. Production final-game end-screen dwell is not added here: master observes the canonical terminal result and releases the slot; no new cinematic timing is inferred. Operator-facing current canonicalError persists transport failure; fail-closed input remains the local safety behavior.
