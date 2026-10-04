# WAVE08: independent async prepare review

Scope: root candidate execution-client.mjs and runner-coordinator.mjs. Read-only runtime review, own focused test only; no server/browser/F edits.

## Initial P1 — fixed by root and independently verified

`execution-client.mjs` drive sets `sending=true` before awaiting preparePresentation. `activeEvent` is null during loading, so command's guard `(sending && activeEvent?.kind !== 'checkpoint')` rejects even `cancel`. Actual route: empty execution → client.prepare → sendPending receives new preparing execution → sendPending.finally launches drive → resource loading. Operator cancel produces no request until resource promise settles or 15-second timeout. Existing root initial-preexisting-execution tests use refresh preparation and miss this path.

Reproduction: `artifacts/workspace/tests/parallel-wave8/review-tests/prepare-cancel-review.test.mjs`, actual createExecutionClient with fake transport and deferred asset loader. Expected one cancel POST, actual zero. CPU only, cleanup abort/dispose. Initially FAIL 04.10.2026; root corrected the implementation. The same regression now PASS.

Related polling concern was also addressed: preparation is now a nonblocking side activity. drive/refresh return while assets load; cancellation/replacement invalidates the outstanding task. Completion schedules a new authoritative refresh before readiness. Promise.resolve().then wraps a synchronously throwing loader, keeping the task bookkeeping recoverable.

## Final verification

10/10 targeted CPU tests PASS: five root preparation tests plus five independent review tests. The independent checks prove:

- Operator cancel remains available during the actual new-execution prepare path.
- Polling observes external cancellation before resources resolve; no ready ACK/build follows the late completion.
- Late execution A completion cannot build or ACK replacement B. Only B's own ready assets unlock its build.
- Synchronous loader failure persists visibly and explicit retry succeeds, with one readiness event.
- External owner/fence change during loading permits a paused observer preview only; zero attach/event ACKs are emitted.

Root cases additionally cover decode failure/retry, dataset switch, dispose, disarm, and preparation reuse. Reviewed files: candidate execution-client.mjs and runner-coordinator.mjs. No remaining P1 found in this bounded async preparation gate. This is CPU/client evidence, not a GPU or physical-output acceptance. No runtime/source/F files changed by reviewer; only own tests and this report. No servers started.

Coordinator's optional prepareRenderer pass-through does not itself alter admission policy or add a second owner. MAX no-op handoff is separately documented in wave8-max-handoff-20261004.md.

## Follow-up: historical terminal presentation failure

Root's narrow coordinator correction reviewed: an old completed/cancelled execution's rendererFailure no longer prevents preparation of a different newly accepted package. Active execution and ordinary transport failures still block admission; history and backend atomic slot gates remain.

`review-tests/terminal-presentation-review.test.mjs`: **4/4 PASS** with actual coordinator and fake read transport/client port: completed presentation failure allows new prepare; active failure blocks; HTTP failure without rendererFailure blocks; existing package execution history still prevents replay. No additional P1 identified in this correction. These are isolated CPU checks, no live/server requests. Root alone applies the static hotfix.
