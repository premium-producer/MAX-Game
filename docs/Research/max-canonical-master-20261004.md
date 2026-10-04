# MAX canonical port behind launch-v3 — reuse research

04.10.2026, WAVE05/A. Scope: local technical integration, not production authorization or new game mechanics.

Existing mechanisms are retained: DBOS3.2.0 (MIT) durable workflow/step/queues; Node25.9.0 built-in HTTP/SQLite; accepted canonical F core + WAVE01 SQLite lifecycle and WAVE02 managed v5. Three0.185.1/maath0.10.8/idb8.0.3 notices stay in the pinned presentation. No scheduler, game reducer or network replay mechanism was recreated.

- [DBOS steps](https://docs.dbos.dev/python/tutorials/step-tutorial): external HTTP is a checkpointed step. An unconfirmed external commit still requires target idempotency; use the immutable assignment ID/payload and GET reconciliation, not a fresh ID. Durable step results do not by themselves create a distributed transaction.
- [Workflow upgrades](https://docs.dbos.dev/python/tutorials/upgrading-workflows): preserve completed step order. Add workflow/transaction names v4 and keep all v1/v2/v3 bodies. Stored admission/assignment version selects the workflow; enabling the adapter affects new admissions only.
- [Node child stdio](https://nodejs.org/api/child_process.html#optionsstdio): an explicit stdin pipe provides a parent-lifetime signal. Host opt-in --parent-stdio closes SQLite/server on EOF. This is verified separately; it is not a PID polling supervisor or a replacement for exact launcher ownership.
- Prior real experience and DBOS issues688/818/759/718 are recorded in [MAX local master research](max-local-master-mvp-20261004.md). Reuse its sequential durable enqueue and concurrency1 queues; no new FIFO.

Pinned catalog missions-reviewed-20261003-abe878cfed89 is an explicit technical integration revision. The independently developed D04.10(1) client is newer; it is not silently substituted. Its owner must hand off a reviewed catalog/presentation delta.

Presentation acknowledgment is emitted by pinned v5 only after gameReady (asset/GPU preparation complete) and two browser frame opportunities. It establishes this local renderer's readiness, not external LED/Spout/hardware presentation proof. Master accepts its bound aid/session/catalog/generation evidence through the local host only. Production renderer identity/global AV ownership remains outside this slice.

[Implementation evidence](../../artifacts/reports/max-canonical-master-20261004.md).
