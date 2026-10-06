# MAX control panel — локальный аудит исходников

06.10.2026. Техническая проверка существующего кода для плана, без запуска/изменения runtime. Два независимых read-only отчёта; предложения явно отделены от фактов. Сегодняшний live baseline не проверялся.

# MAX control panel — MASTER contract audit

06.10.2026. Read-only audit by control_master_audit. No SSH, browser, F/source/runtime writes. Only this report. Facts below are local accepted source/report evidence, not a fresh live probe.

## Existing mechanisms (verified code)

- F `artifacts/local-master/max_show_api.py`: GET `/max/show-mode`, POST `/max/show-mode`, GET `/max/show/state`. POST schema `{commandId,expectedRevision,enabled,screenDelayMs?}`; screenDelayMs 500–10000, step100, default1000. ADMISSION lock + DBOS durable workflow (`max-show-mode:<commandId>`). Different payload for reused ID conflicts.
- F `artifacts/local-master/max_show_store.py`: SQLite/SQLAlchemy additive settings table + immutable command receipts. Revision CAS. Enabling checks MAX current, queue, stella-main owner, all unfinished executions, active show session. Returns STAND_BUSY or REVISION_CONFLICT. OFF changes desired flag immediately; cleanup is asynchronous.
- **Enabling show mode does not start ID.** `configure_max_show_v1` merely calls store.configure. Start trigger remains `POST /stella/max/admissions`, request fields `requestId,sessionId,visitId,stationId:'stella-main'` (max_models.py / max_api.py). If enabled, admission selects admit_max_show_v1. Therefore four radio buttons cannot be implemented merely as existing show flag + local background boolean.
- `max_show_workflows.py`: admit_max_show_v1 calls business.claim and occupies real Stella station. max_show_session_v1 then prepares/assigns canonical digital-id independently of quiz answers, publishes tags→ribbon→wall, observes real canonical completed before gamePhase=videos. OFF/session cancel performs canonical terminate(cancel), retries ambiguous assign using the same request, then releases station and show binding. No fake completion.
- The existing operator gateway `artifacts/production-source-max-show-20261005/roles/MASTER/app/control/fleet.mjs` serves loopback control and GET/POST `/fleet/v1/max-show` proxy. Host+Origin+CSRF guards. Actual accepted runtime UI in adjacent `public/app.js,index.html` has speed form and says settings apply on next Stella run. The historical sibling `source/control/public/app.js` is older and lacks speed UI: do not use it as baseline without comparison.
- `artifacts/production-source-vk-scenario-20261005/source/control/max-gateway.mjs`: MaxAuthority role lease, 5000ms, SQLite generation/lease/boot/dataset fencing, canonical-operation quarantine, async-mutex. Projects active canonical manual assignment OR active show. No operator independent-asset role exists yet.
- F `artifacts/local-master/max_api.py` `/max/commands` blocks while show enabled or activeSessionId retained; normal source routes preserve queue and canonical assignments. `max_canonical_workflows.py` phase releasing requires canonical terminate success before finish_release_v4. This is the cleanup pattern to reuse.
- `max_stage_watchdog_store.py` installed MAX-STAGE-WATCHDOG-01 protects schema4 enqueued launch/delivery only. Explicitly excludes show IDs/mode, queued/playing and other schemas. New operator mode transitions need their own bounded recovery; current watchdog is not a universal safety net.
- Latest D mobile/diagnostics accepted-on-stand source has `MAX_RIGHT/app/max-adapter/local-server.mjs`, `mobilePresentation()`: reads `config/max-mobile.json` containing only `{backgroundOnly:boolean}`, missing file defaults false. This is a **local presentation setting**, separate from master admission. It does not cancel canonical game or queue. Public phone enabled only for active non-auto assignment; independent assets must not accidentally enable phone actions.

## Provenance / actual current state limitation

D `artifacts/reports/max-mobile-controller-deployment-20261005.md` and `max-launch-diagnostics-20261005.md` record restored normal default, backgroundOnly=false at ~15:21 UTC 05.10, new mobile controller and diagnostics; F not synchronized for those changes. Later F/TODO and `artifacts/reports/max-stage-watchdog-20261005.md` state MAX_RIGHT remains background-only although that task says MAX_RIGHT was not restarted/changed. Local history is inconsistent about current presentation. Before implementation/deploy root must freshly compare live role manifest, adapter, overlay, config/bridge context against both accepted packages. This audit cannot choose a current live mode. Do not overwrite latest MAX with F's older background-only overlay. STELLA failure recovery is newer and accepted separately; keep it.

## Proposed architecture (not existing endpoints)

One durable MASTER-owned MAX presentation mode, enum `standard | id_video | assets | background`. Four controls are mutually exclusive, not four independent booleans. Each mode retains its own settings document; changing tabs is not an activation. Switch is an explicit command with commandId, expectedRevision, desiredMode and immutable settings revision. State exposes desiredMode, effectiveMode, transition phase, revision, epoch, rendererAck and error. Mode label becomes active only after target readiness ACK.

Use existing DBOS3.2/SQLite mechanisms for durable transition and receipts; retain shared Master ADMISSION guard for concurrency and current registry transactions. Do not add a second master or direct browser writes to config/max-mobile.json. New mode DB row + receipt table are additive. All wall/Stella admission gates must consult the same mode atomically; a UI-only disabled button cannot prevent racing visitors.

Transition: validate latest revision/media readiness → close new MAX admissions → reserve transition generation → stop old mode via existing cancel/release semantics → wait canonical cleanup and any scoped lease release → prepare target → ask persistent renderer to apply exact modeEpoch/configRevision → await actual prepared/presented ACK → commit effectiveMode. Offline/timeout shows pending or blocked with reason, never false active or fake success. Cancellation/cleanup retries preserve IDs. No cross-network ACID claim; this is durable staged transition with fenced ACKs.

For standard→other while visitor/queue exists, default explicit BUSY rejection with visible current visitor/queue explanation. Provide separate operator action “Finish current run and switch” only if intentionally approved; queue policy must be explicit (drain/retain/cancel with ordinary receipts), never silently purge. Switching idle modes should be immediate + smooth visual transition.

**Direct ID start from panel** needs new operator-start/ID workflow or a versioned `max_operator_show_v1`, not synthetic Stella visit/admission or fake answers. Reuse canonical prepare_assignment/assign/observe/terminate, immutable run identity and terminal receipts. Own operator run separate from stella-main; reserve MAX slot and gate MAX admissions, while policy for other VK/Stella activities follows shared execution conflicts. Preserve exact old workflow implementation for DBOS replay; new semantics go to new workflow/version. Panel selection should start real ID→video loop; this differs from current “arm next Stella start”. Whether global tags/ribbon launch should run is a new explicit product choice; direct wall-only route should not fabricate old phase ACKs.

Background mode is foreground suppression after safe cleanup, not stopping GPU background. Assets mode owns presentation only, does not create canonical game success/session. It has scene state `background | device | device_and_icons`, assetId, deviceVisible, left/right ordered icon IDs and relative transforms; presentation ACK, no progression commands. Same central device renderer and common rear-wall domain must be used. Asset readiness before target activation avoids black content.

Standard is initial default for new configuration. Migration from old flags must not infer current live state from historical docs: snapshot old show enabled/run and local backgroundOnly first, import with provenance; preserve explicit existing operation until operator selects target. Remove dual authority after new state is accepted, with old flag compatibility adapter only, never competing writers.

## Integration ownership / parallelization

1. Root/integrator pins live/F/D SHA and mode contract + switch/queue policy. No independent agent touches live.
2. MASTER agent owns new mode models/store/workflows/API + admission gates + transition tests in isolated D candidate against accepted F subset. Does not replace whole canonical backend/vendor or change existing durable history.
3. Renderer agent owns versioned control projection and device/icon asset scene in MAX source; reuse device morph/timing, one persistent WebGL, no background ownership.
4. Operator UI/media agent owns panel + upload/catalog staging (disjoint files), consumes fixed contract. Existing fleet gateway security preserved; public `/max/game` remains visitor controller, never upload/admin endpoint.
5. Independent reviewer audits races, cleanup, stale snapshots, browser refresh/retry, boot/dataset fence, old mode migration. Root integrates sequentially, applies only scoped MASTER/MAX_RIGHT deltas and records F acceptance to prevent rollback by next build.

## Required tests / acceptance

- Pairwise 4×3 transitions, plus duplicate same mode/no-op, before/after ACK; settings persist per mode.
- Concurrent operators and Stella/wall admission; expectedRevision conflicts and byte-equivalent retry of lost response; queue policy checked.
- Process kill/restart during reserve/cleanup/prepare/ACK; network loss cannot free busy station or show target as active.
- Canonical cleanup 503 leaves releasing; renderer stale epoch/boot/dataset ACK rejected; missing/invalid media doesn't hide working mode.
- ID really reaches canonical completed then loops playlist; OFF cancels without completed fabrication; direct operator run creates no false visitor answers/session.
- Standard local/phone input restored; assets/background revoke player lease and QR action scope. Phone cannot advance independent presentation.
- Existing watchdog, Stella recovery, mobile control, logging and readiness regressions preserved.
- Integration source SHA/build/PIN/manifests checked; browser/LED verification only with explicit new user request. No “all modes work” claim from unit tests alone.

Traffic SIM: not measured; no SSH/network/file transfer to stand, local read-only audit and this Markdown. Current balance unknown. Root consolidates into WORKLOG without double counting.


# MAX control panel: renderer and media audit

06.10.2026. Read-only local inspection for planning. No browser, SSH, runtime changes, builds, or F writes. Documents read: current WORKLOG, D→F guide, AGENT_MAX, STAND_ACCESS, MAX development skill. No live version claimed from local evidence alone.

## Provenance warning before implementation

There are multiple layers, not a single authoritative historical D tree. F `artifacts/production-source-max-show-20261005/source/max-presentation/src` contains the accepted show/device integration. AUDIO03 added audio producer imports. The newer D `artifacts/workspace/tasks/max-mobile-control-20261005/accepted-source/src` includes those and managed mobile/game shell changes; its `candidate-role` and `stand-deploy` record normal gameplay restoration on 05.10. Launch diagnostics report records installed r2 adapter changes, explicitly not integrated into F. Later general WORKLOG entries describe background-only as preserved, which is inconsistent with earlier normal-default receipts. Thus implementation starts with integrator-selected merged source plus fresh deployed manifest/SHA and config reconciliation. Do not copy F's old no-op overlay or forced video07 override over today's version.

## Confirmed reusable implementation

All following paths are relative to project root unless marked F.

| Mechanism | Existing implementation | Reuse and caveat |
|---|---|---|
| Composition over shared wall background | D mobile task `candidate-role/app/render/public/max-show-overlay.js` | Transparent overlay in native output, strict 4096×1280 packed rectangle, preserves stamp rows. Underlying rear-wall renderer independent. Never replace with a new right-wall background. |
| Normal/auto/background selection | D mobile task `MANUAL_OVERLAY_NOTES.md`, wrapper source in mobile task, `candidate-role/app/max-ui/max-show/show.mjs` | Existing managed shell warmed once, assignment identity/readiness gates, explicit backgroundOnly. Current auto/manual switch can unmount one GPU-bearing frame before mounting another; ordinary manual missions retain cache. New four-mode authority should replace scattered toggles, not layer another forced override. |
| Device dimensions/morph | `accepted-source/src/journey-v5-device-morph.mjs` and F show source same module | Height 800 logical, inset 10/12, width from actual asset ratio (fallback392). maath-powered fade-out→resize→ready→fade-in. Constant height and one persistent shell. |
| Standalone video device | F show source `journey-v5-show-device.mjs`, bundled `/max-show/device.js` | Uses exact mission bezel painter, raster2, scales uniformly to 88% host width/82% height. `mediaSize`, `fadeContentOut`, `hideContent`, `freeze`, `dispose`; revision guards for stale async metadata. This component can be generalized for independent media, not reimplemented. |
| Finale sequencing | D mobile `candidate-role/app/max-ui/max-show/show.mjs` | 450ms native Web Animations; game fades, device center appears, video dimensions morph, then content shows. Close fades content then shrinks device. Trusted parent source/origin and generation guards. |
| Playlist/decoder | D mobile `accepted-source/src/journey-v5-finale-player.mjs` | Video.js + videojs-playlist, metadata preload, repeat, before-item fade hook, media-ready gate, visibility pause, errors, disposal. Existing special native-loop fix for one-item playlist must be preserved/ported into final reusable player. |
| Audio | Same finale module + `journey-v5-audio.mjs` | Uses `observeMediaAudio`, `openAudioPort`, `masterAudioEnabled`; max-finale producer, SHA video asset IDs, 250ms audio observer. Playback remains muted in wall browser because MASTER owns Dante. Independent assets must use same producer contract and register imported audio; do not create local audible duplicate. |
| Icon glyphs/shell | `accepted-source/src/journey-v5-icons.mjs`, D `artifacts/max-game/scripts/prepare-v5-icons.py` | Verified source SHA and glyph manifest, separate labels, radiusRatio shell, supplied completion check. Extractor is tailored to known Figma SVG structure: not a safe general upload parser. Custom icon support needs validated normalized glyph manifest. |
| Icon row relative to device | `accepted-source/src/journey-v5-route-layout.mjs` | CSS Flexbox measured row, centered Y, gap REVEAL_ELEMENT_GAP, device width changes repack. `V5PathBatch`, `V5MotionValue`, motion profiles preserve inertia/cadence. Presentation-only descriptor with explicit left/right ordered icon arrays can share these primitives without faking task IDs/completion. |
| Timing | `journey-v5-motion-profile.mjs` | travelOmega10, drag14, presence12; startup .85s/stagger.28; repack1.3s/stagger.08; popup .45s. Reuse defaults and reduced-motion handling. |
| Asset readiness/memory | `journey-v5-startup-assets.mjs`, `journey-webgl-ui.mjs` | Shell assets resident, task images current/prepareNext rather than catalog-wide GPU pinning. Raster capped at2048 longest dimension and density≤2. Prepared-device cache, warm upload path, resourceResidency/preparationStats already exist. Extend this pool rather than decode/upload every new item in draw. |
| Managed auto screen delay | `accepted-source/src/journey-guided-main.js` around configureAutomatic/readManagedContext | Reads context.show.screenDelayMs 500–10000ms, fallback1000. Local `journey-v5-autoplay.mjs` still constant500ms demo copies; do not confuse this with accepted stand authority. |

## What does not exist yet

- General independent-media mode with no mission backend; its three explicit steps and operator-owned icon layout.
- One operator API selecting exactly one of four modes, with desired/preparing/visible/failed acknowledgements and stale revision rejection.
- General-purpose operator file uploader, validated manifest, standby transfer/readiness, deletion/reference protection and imported audio mapping. F `artifacts/local-master/local_media_store.py` has transactional commandId/CAS tracking, but its `local_media_provider.py` is a fixed technical fixture provider. Existing photo upload is visitor data, not a reusable MAX asset-upload API.
- Arbitrary icon upload: known SVG extraction alone is not general sanitation.

## Proposed renderer delta (not implemented)

1. Keep the current native overlay/background and one presentation host. Consume an authenticated operator `presentationRevision` and finite mode enum from MASTER; existing assignment guards continue to own standard/auto gameplay.
2. Add independent presentation adapter producing only a presentation descriptor: `{sceneId, revision, stage: background|device|icons, device:{visible,assetRef}, icons:{left:[...],right:[...]}}`. Each icon has stable instanceId, assetRef, order, enabled, label optional. Side/order are relative to device, not world coordinates. No hidden fake mission, answer, assignment completion, or badge creation.
3. Split preparation from display. Validate metadata, load/decode resource offscreen, warm GPU, then atomically commit matching revision; retain old visible asset if new one fails. Superseded preparation releases resources. Status distinguishes uploaded, validated, transferred, prepared, actually visible. Rapid requests cannot resurrect stale assets.
4. Reuse existing device morph and icon row. Independent state1: game foreground gone, shared background persists. State2: center device enters with selected asset, icons hidden. State3: enabled left/right ordered icons enter with same easing/stagger. Hiding device first hides icons; show/hide requests animate. Changing aspect resizes same shell and repacks icon offsets; overflow fits the whole composition inside right-wall safe bounds without clipping. Operator chooses states directly; transition path resolves intermediate hide/show order.
5. Background-only stops game/video interactions and audio while retaining shared background. Standard restores managed shell, hand/QR/gameplay and canonical assignment policy. ID-auto uses canonical show admission and then looped playlist; no new local autoreducer.
6. Switching modes is two-phase: prepare target, orderly leave current visual/audio, commit target. If active standard visitor owns assignment, MASTER must cancel/release or defer per explicit policy; never hide an active mission and leave an orphaned lease. Emergency background follows existing panic authority but should report cleanup state.

## Upload/performance requirements

Proposed defaults need device qualification, not asserted as measured limits. Small PNG/WebP/JPEG and sanitized/rasterized SVG for icons; images and compatible MP4 for device. Validate magic/type, byte limit, dimensions/aspect, duration, codec/audio via existing FFmpeg tooling or approved ready-made ingest tooling. Reject external SVG references/scripts/foreignObject; normalize to safe local representation. Content-addressed SHA immutable files, original retained, validated derivative manifest; never arbitrary remote URLs or user filesystem paths in renderer. Range serving for videos, current+next bounded preload; no whole-playlist decoded residency. SHA dedup and LAN-only necessary deltas minimize SIM usage. Deleting in-use assets disabled, replacement creates new reference. Errors operator-only, no debug UI on LED.

Device raster must remain capped for pathological wide SVG/video; same800-height metrics can otherwise make huge intermediate widths before fit. Generalized createShowDevice draw must avoid recreating canvas each animation frame unnecessarily. Use accepted device prep/cache to prevent icon stalls at morph/commit. Add per-stage time/retained resource counters to existing logging, not frame spam.

## Verification and agent split

- Renderer agent exclusively owns new independent adapter + narrow device/layout hooks; root merges shared entrypoint. Fixtures: all3stages, rapidcommands, stale metadata, order/sides/disabledicons, portrait/wide aspect, hide during morph, error retains old, dispose cache/audio.
- Backend/control agent owns mode schema/CAS/receipts and existing admission cleanup integration; no renderer/entrypoint edits. Matrix4×4 transitions, restart/reconnect, uncertain commit samecommandId, busyvisitor, no fake success.
- Media agent owns importer/manifest/normalization and catalog adapter; no live media mutation. Test badtype/oversize/pathtraversal/SVGexternalrefs/badcodec/SHAreuse/currentdeletion/canceltransfer, decoded budget.
- OperatorUI agent owns panel with four mutually exclusive switches and per-mode controls, progress/error/currentvisible status. Uses API contract only, no direct ports/files or master state mutation.
- Independent reviewer checks provenance/audio/lease/readiness contracts after root merge. Physical/browser visual verification only on explicit user request; current task is research/plan, so none run.

Traffic SIM: RX not measured; TX not measured; total not measured. This subtask did only local reads and this report; 0 MB files transferred to stand. No WAN counter used, remaining balance unknown. Root records aggregate task accounting once.
