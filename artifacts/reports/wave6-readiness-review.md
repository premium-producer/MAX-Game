# WAVE-06: independent readiness / MAX launch binding review

2026-10-04. Candidate: `../master-candidate`. Scope: actual `readiness_api.py` and `max_api.py`, real MAX models/config readers and read-only pin inspection. Runtime sources unchanged by reviewer. No server, live port, hardware, DB or F mutation; no new dependencies. Test starts with inherited canonical URL/token removed, config root pinned to this candidate, then explicitly mocks all network access.

## Result

**Final: 16 module/route tests PASS** (0.154s, after root fixes). `check.py` imports actual route functions/models; workflow dispatch and persistence are inert boundaries. This is **not actual HTTP, DBOS replay, process/restart or physical-output evidence**.

Verified:

- Matching ready/mode/catalog freezes canonical launchVersion4 with the exact profile; disabled canonical mode returns explicit technicalVersion3 and makes no health request.
- Not-ready rejects both fresh quiz admission and wall entry; catalog/mode mismatch, offline through the actual call adapter, invalid loopback URL and missing token reject before `start_workflow` or admission polling.
- Non-object health JSON and non-boolean `ready` fail closed. Root fixed the discovered AttributeError before this passing run; the correction is covered by null/list/string/number/bool health cases and the readiness response path.
- `/api/readiness` calls actual VK/legacy config validation and actual pin inspection. Instrumented persistence accepts only SELECT; repeated calls issue no datasource transaction/workflow, configs' SHA remain unchanged, Cache-Control is no-store, physicalOutput.ready is false. This does not prove a real database trace; it proves the executed call path and statements against the instrumented connection.
- Old admission envelopes versions1–4 and existing wall selection v4 bypass new binding/config reads and dispatch to their original workflow version, preserving saved canonical profile even if the new profile differs. A reused admission ID with different input is rejected. This is router dispatch compatibility, not a new full persisted DBOS replay test.
- Malformed settings/quiz/launch config each returns typed `ADMISSION_PREFLIGHT_FAILED`503 before any workflow dispatch, for both fresh quiz admission and direct wall entry.

## Findings

1. **Closed by root:** `verified_max_binding` previously called `.get` on arbitrary health JSON and could crash `/api/readiness`. Current source checks `isinstance(health,dict)` before reading readiness. Covered in this suite.
2. **Closed by root:** malformed settings/quiz/launch originally raised raw validation errors during envelope construction. Root added `new_launch_configuration`, retaining the frozen envelope schema and mapping those failures to typed503. The first repair exposed a missing global `HTTPException` import; the targeted regression found that NameError and root added the import. Final tests cover both admission entrypoints and all three malformed config files. No unresolved finding remains within these tested cases.

## Run

```powershell
& 'F:/project/VK_DigitalProducts_Stand/artifacts/backend-probes/quiz-panel/.venv/Scripts/python.exe' -B artifacts/workspace/tests/parallel-wave6/readiness-tests/check.py
```

An initial attempt to use installed FastAPI TestClient failed before test collection because this Starlette installation requires absent `httpx2`. Nothing was installed. The final harness invokes route functions directly with real Pydantic request validation and inspects JSONResponse/HTTPException results. Existing Pydantic warning about the Stella Definition `copy` field appeared; it did not fail tests and was not introduced here.

## Reviewed SHA256

```text
readiness_api.py 2cd94c887343d0db23f49709a6a7c3f3d411eaac9b8b2b6c69da9951bb4a1bf0
max_api.py ad5ffab408a49c309586201320f2dd340d49f3b9e2e3da082772758d82bba8a1
check.py 5a0ca209bb25abaa77c00ea97761f2f714a9ecfa0dd83855f05a35432d360073
```
