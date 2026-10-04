# WAVE08 VIS-1/2 · художественный VK render port

04.10.2026. Владелец B (`content_entities_backend`). Кандидат: `D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/workspace/tests/parallel-wave8/visual-candidate`. Авторский worktree, F,8816 runtime, БД и общие документы не менялись. Browser/HTTP/runtime проверку выполняет root; в этом handoff нет заявления о завершённой художественной или физической приёмке.

## Источник и область

Зафиксирован latest на момент начала `native-mask-provider-worktree/artifacts/native-masks`: smooth fades1500/900мс, soft text protection и нейтральное белое Discovery уже включены. `source-snapshot.json` хранит SHA230 файлов, включая115 inputs исходного scenario-manifest. Donor dependencies скопированы в frozen-upstream; работающий bundle собирается только из этих копий. Авторский source уже после pin начал добавлять silhouette; эта новая работа **не включена** автоматически.

Новые owned source: `native-masks/artistic-render-port.js`, `artistic-port-core.mjs`, `artistic-model.mjs`, `artistic-content.js`, `artistic-surfaces.js`, `artistic-ready.mjs`, `artistic-raster.mjs`, `build-artistic.mjs`, `tests/artistic.test.mjs`. ArtisticSurfaces — ограниченная производная captured renderer, без fixture catalog/clock/старого executor. Исходный scenario-renderer восстановлен до точного captured SHA и остаётся только reference.

Сохранены Native fields, CUBES/dual LumiCells/общий rear domain, frozen gradient underlay, EntityEngine/procedural envelope, белый Discovery material и soft text protection. Реальные typed items заменяют15 synthetic fixture members; dynamic ordinal layout, произвольные itemId, same-origin QR. Декоративные fixture frames/фейковые photo crops не добавляются к настоящему пакету.

## Передача и SHA

- **Deploy:** только `dist/artistic-render-port.js`; `.map` опционален для диагностики. JSON CUBES art встроен в bundle. Runtime frame-main.svg/cluster-reference.png/cubes-art.json не требуются.
- Bundle SHA256: `52ffc95e6d0843c12fe9134851f5d6cc699b03b9ab4203ff3bcfc37781605773` (retry + QR raster + independent arch binding reset).
- Source snapshot SHA256: `f581846ffc5e9e7ef5e639686008265013c52bbec8d66a496ffcd93f4841d0c7`.
- `build-manifest.json`:106 входов с SHA, протокол, exact deployment files, build transformation. Root интегрирует bundle своим allowlist, не копирует весь candidate.
- Использован текущий F executor через injection. Его SHA при проверках: `a250b24045ae03fd3dac3fcb5645bd0a39f6cd25cea42c4b729cb3774548f870`. В bundle нет определения createExecutionRenderer или createScenarioModel.

Build использует установленный esbuild из авторского node_modules, но **не** его текущие visual sources. Замена ровно одной checked строки frozen LumicellsBackground: top-level `await loadCubesArtDocument()` → static JSON import. Значения art/рендер не меняются; это устраняет зависимость импортируемого bundle от неразвёрнутого cubes-art.json. Root IAB выявил404 у первой сборки; текущий SHA устраняет причину. Изменение build needle при donor drift вызывает ошибку, не тихий fallback.

## API / root wiring

```js
// Dynamic import must be inside root try/catch: network/import errors precede factory.
const {createArtisticRenderPort} = await import('/artistic/artistic-render-port.js');
const port = await createArtisticRenderPort({
  arch, ribbon, wall, // THREE-owned canvas elements, NOT host divs
  createExecutionRenderer, preflightContentEntities,
  requireContentEntity, createResultQrDataUrl, // imports from current F modules
  onFault: error => stopAndReport(error),
});
// Existing execution-client/coordinator root hook, awaiting before synchronous build:
await port.prepare({items, profile, packageId, contentEntityProtocol, origin, signal});
const executor = port.create({...exactOptions, onUpdate: frame => port.present(frame),
  onMarker, onComplete, onError});
// With coordinator, use rendererFactory:port.create and onFrame:port.present.
// Do NOT also wrap onUpdate to present twice.
```

`prepare` кеширует exact immutable items/profile/package/protocol/origin. Signal не входит в идентичность; abort или superseded epoch никогда не выставляет ready поздно. `create` синхронно отклоняет неподготовленный/другой пакет, вызывает injected current executor и читает его getTiming; labels/duration не придумываются. Root отвечает за session/execution/control/dataset/boot/owner fences вокруг async hook. Port не отправляет запросы master API/markers, не пишет storage и не имеет RAF.

Повторный `prepare` того же snapshot кешируется только при здоровом port. После ошибки explicit root retry выполняет clear/rebind/resources заново; cached fault больше не блокирует его навсегда. Потерянный контекст или permanent shader fault проверяется до/после rebind и выдаёт `ARTISTIC_PORT_RECREATE_REQUIRED` без ready; это требует dispose и создания нового port, не бесконечного retry на старом GPU context.

`present(frame)` синхронный, проверяет полный distinct item set, конечные x/opacity/position/discovery и вызывает реальные draws. false от любого Surface.draw, shader error или context loss превращается в throw/fault и паузу; текущий F executor ловит это до marker callback. Capability `presentationEvidence:'WEBGL_SUBMIT',physicalOutput:false,fixtureOnly:true,mediaPlayback:false`. Успешная WebGL submission **не равна** представленному кадру downstream/Spout/TD. Shader warmup/compile bounded15с, image/video decode12с; timeout — failure, не fallback ready.

`clear()` освобождает привязку/resources/executor; `dispose()` также удаляет surfaces/contexts. После context loss нужен новый port. Root владеет visibility/pageshow и повторной async подготовкой; исходный demo pagehide bug не переносится, т.к. demo driver не включён.

## Арка и overlay

До исполнения доступны:

```js
await port.updateArchFrame({
  bindingId: 'session:<id>', revision: 17, seconds: 2.4,
  tags: [{id:'server-tag-id',label:'Серверный текст',x:.1,y:.14,width:.12,height:.72,opacity:.5}],
  answerCues: [], // optional accepted cue positions; no local answer inference
});
port.presentIdle(externalDecorativeSeconds);
```

Нормированные x/y — левый верх, не центр. До32 видимых тегов. Revision относится ко всему input frame, включая time/poses; root локально увеличивает его, точная повторная доставка разрешена. Root отфильтровывает opacity0 из полного51-кандидатного каталога, сохраняя индексы/позиции исходного набора. Stale/conflicting revision отвергается. updateArchFrame рисует арку до execution; presentIdle — все фоны и текущие poses, запрещён после create (clock владеет executor).

При авторитетной смене sessionId root вызывает `await port.resetArchBinding(newSessionId)` до новых frames. Метод синхронно меняет отдельный archEpoch и очищает archFrame, затем очищает/готовит только arch atlas и показывает пустую арку. Старые queued/in-flight arch updates проверяют epoch до/после await и отклоняются `ARCH_UPDATE_SUPERSEDED`; root игнорирует этот ожидаемый ответ устаревшего update. Повтор того же binding идемпотентен. Assets, executor, package и wall не очищаются. Сброс разрешён до execution либо после его реально представленного final frame; пока есть незавершённый execution — `ARCH_EXECUTION_ACTIVE`. Это последовательный новый квиз G1, не разрешение concurrent tails G2. Полный clear/dispose по-прежнему очищает всё.

G1 root использует существующую arc-tags projection/renderer. Она сама задаёт opacity/motion и handoff_pending. Поэтому точный authored prequiz orbit и contact-based900мс exit **не заявлены перенесёнными**; author source сохранён, shader/white/soft protection переиспользованы, но semantic cues и alpha приходят снаружи. Scoring/photo intent локально не вычисляются.

`await port.updateResources(snapshot)` принимает existing `GET /api/assets/packages/{packageId}` целиком: `{protocol:'asset-resources-v1',packageId,technicalOnly:true,resources:{[itemId]:resource},untrackedItemIds}`. Root поллит и сериализует вызовы; concurrent update отклоняется. Exact package/item/kind, revision и same-revision payload проверяются; older revision не откатывает текущую. Late decode после clear/dispose не подменяет новый пакет. Membership/executor не пересоздаются.

Поддержка ресурсов только текущего result allowlist: technical SVG placeholder-v1 и Lulu MP4 local-video-fixture-v1 с declared SHA/byteLength/MIME/path/approval flags. Arbitrary URL/path не принимаются. Pending/failed/unknown/untracked рисуют явные подписи. Generation — честная позиция/technical SVG, никаких fabricated references/AI вызовов. VideoTexture содержит реальный **декодированный paused frame**, не playback; root согласовал mediaPlayback=false для G1. Политика media clock/play/pause/seek — следующий малый срез.

## Время и границы G1

Семантика текущего executor сохраняется: entity_reveal_presented, emission_complete (начало последнего item), ribbon_items_visible, entity_hidden, ribbon_center_crossed (release у backend), item_arrived:N, all_arrived. Художественный fade не меняет marker position или duration. Root согласовал endpoint fallback: на финальном all_arrived кадре wall alpha всех items=1, поскольку у master нет20с demo postroll. Ранние arrival имеют1200мс fade; последний появляется сразу. Presentation-only postroll отдельно, второй clock не добавлен.

Это один VK execution, максимум256items/32tags. Dynamic layout — техническая проекция реального набора, не обещание совпадения с15-member collage. Для большого набора читаемость в уменьшенном canvas требует отдельной художественной проверки. Нет production business compositor/concurrent VK/MAX bindings, настоящего physical output, playback, новых генераций или silhouette import.

## Проверки и приёмка

- `node --test --test-isolation=none .../tests/artistic.test.mjs`: **23/23 PASS**. Реальные текущие F executor/preflight/QR encoder; GPU/assets stub, поэтому это не WebGL proof. Проверены identity/prepare cache/abort/supersede/dispose, wrong QR/unknown kind/capacity, exact frame, error→onError без markers, arbitrary layout1/4/19/256, resource binding/revision/allowlist/late overlay, arch binding и bounded preparation failure. Добавлены same-snapshot retry после transient draw failure и запрет ready после fatal GPU rebind failure; QR dimensions/body preservation с настоящим F encoder и отказ для прозрачного/пустого растра. Ещё3 проверки: independent arch reset сохраняет completed wall/assets/executor; in-flight и queued updates старого epoch не применяются; idempotent reset и запрет active-tail takeover.
- Syntax новых modules и финального bundle PASS. Project duplicate guard PASS.
- Scoped build PASS,106 source inputs из frozen donor и новых adapters. Первый sandbox esbuild spawn EPERM потребовал разрешённой сборки вне sandbox; приложение/серверы не запускались.
- Root IAB нашёл missing artJSON в начальной сборке; исправление проверено новым bundle и отсутствием top-level art fetch. Финальная IAB проверка visuals/resource decode/cycle/console принадлежит root и ещё не объявляется этим отчётом PASS.
- Художественная приёмка OPEN; native-detail/physical/Spout/TD не проверялись.

Готовые механизмы прежние: Three.js (MIT), Anime4.5.0 (MIT, текущий F executor), simplex-noise4.0.3/alea1.0.1 (MIT), esbuild0.25.10 (MIT), существующий авторский LumiCells/Discovery. License/provenance копии в candidate/native-masks/licenses и source snapshot; права авторского контента не расширяются. Основные research anchors — `docs/Research/vk-tag-flight-20261004.md`, `vk-content-cluster-20261004.md`, `vk-brand-underlay-20261004.md`; этот срез не вводит новый scheduler/transport/physics.

Миграций JSON/DB/defaults нет. Rollback — root возвращает прежний rendererFactory/route; durable workflows и snapshots не изменены. Новый порт нельзя выдавать за production ready на основании этих CPU checks.

## G1 blocker: невидимый QR на wall completed

Root IAB прошёл весь квиз19items, но [кадр](wave8-wall-arrived-20261004.png) показал6 media placeholders и12tags без QR. B просмотрел этот screenshot и read-only `/api/results/...`8850: result_qr с exact resultPath присутствует; endpoint alpha1/позиция положительны. Current F encoder возвращает scalable SVG с viewBox, без root width/height. Прежний loader признавал image.onload успешной подготовкой и передавал HTMLImageElement прямо в THREE.Texture, не проверяя пиксели.

Новая ограниченная адаптация устанавливает явные width/height из viewBox доверенного pinned encoder, не меняя path/quiet zone. Нативный Canvas2D рисует decoded image, проверяет ненулевой alpha и наличие тёмных/светлых QR pixels; готовый CanvasTexture загружается с nearest filtering. То же raster readiness применяется к technical image resource, а VideoTexture не изменён. Невидимый/пустой raster теперь блокирует prepare вместо ложного ACK.

Это готовый механизм [Three.js CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html); проблема dimensionless SVG/image texture и готовый canvas workaround описаны в [официальном Three.js forum](https://discourse.threejs.org/t/any-ideas-why-svg-texture-does-not-show-in-firefox/33361). Code/API/screenshot подтверждают дефект и небезопасный loader; root после замены bundle сообщил **IAB QR виден PASS**. B отдельный browser не открывал. Это подтверждение QR, не общая художественная приёмка.
