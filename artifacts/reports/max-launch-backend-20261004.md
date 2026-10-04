# WAVE-03/B — запуск MAX через арку и ленту

04.10.2026. Изолированный кандидат D; **не применён в F**. Backend технического сценария готов к совместной проверке с renderer C. Настоящая canonical игра MAX в этот срез не подключалась.

## Источник и передача

- Candidate: `artifacts/workspace/tests/parallel-wave3/max-master-candidate`, подготовленный root snapshot принятого F.
- Baseline: соседний `max-master-candidate.baseline.json`; SHA старых `max_store.py` и `max_workflows.py` совпадают с ним полностью.
- Allowlist/SHA: `parallel-wave3/max-tests/handoff.json`: изменены `max_models.py`, `max_api.py`, добавлены `max_launch_models.py`, `max_launch_store.py`, `max_launch_workflows.py`, пример `max_launch_defaults.json`.
- Root копирует пример в `configs/max-launch.json`, владеет `app.py`/static/config wiring и общими документами. C владеет MAX UI/renderer. Fixture-only `max_launch_test_server.py` не включён в production allowlist.
- Git commit/push не выполнялись. F, порт8782, живые данные, TD/Spout, AI и оборудование не менялись.

## Контракт

Новые admission envelopes и wall-select specs содержат `launchVersion:2`; новая запись назначения — `schemaVersion:2`. Ранее сохранённые envelopes/assignments продолжают выбирать v1 workflow. Старые durable тела функций и порядок их шагов не изменены, не заменены псевдонимами.

`current.launchPlan` фиксирует `version:max-launch-v1`, planId, assignmentId, missionId, definitionId/revision, `destination:SCREEN_RIGHT`, `whiteEntity:false`, массивы tags/objects и timingsMs `{tags,ribbon,wall}`. Число элементов задаётся JSON; технический поддержанный kind объекта — `mission-object`, неизвестный kind отвергается моделью. ID объектов/тегов уникальны внутри коллекции, ссылки tagIds проверяются. Definition и plan сохраняются в SQLite и не меняются после правки настройки. Для выбора на стене definition фиксируется при wall_select, plan — при wall_start.

Перед confirm `quiz.state.tagsMax` содержит `{id,label,visible,opacity}` из frozen tagBindings. Только принятые ответы делают соответствующие теги непрозрачными; back убирает прежний выбор. Это readonly projection, renderer не принимает решение о тегах. Все ссылки questionId/answerId валидируются по MAX definition.

`current.launch` содержит phase, planId, completedMarkers и phaseElapsedMs. Строгий порядок: tags → ribbon → wall → presented. Assignment находится в `phase:launch` до доставки на стену. Команда `POST /max/commands`:

```json
{"commandId":"marker-1","expectedRevision":5,"assignmentId":"max:...","kind":"launch_marker","planId":"max-launch:...","marker":"tags_complete"}
```

Дальше — `ribbon_complete`, `wall_arrived`. Проверяются assignment/world revision, planId, следующий marker и достижение длительности. Ошибки: LAUNCH_PLAN_MISMATCH, LAUNCH_MARKER_OUT_OF_ORDER, LAUNCH_TOO_EARLY; pause закрывает маркеры. Receipt/retry использует существующие `/max/commands/{commandId}` и immutable command payload.

После wall_arrived сохраняется финальная поза wall с elapsed=duration; assignment становится delivery/delivered=true. Только отдельный presented переводит в awaiting_touch и освобождает активную Стеллу. До этого delivery/presented/contact/finish не обходят запуск. Cancel завершает назначение и освобождает ресурс по прежним правилам. Белая сущность отсутствует.

Queued задания сохраняют собственный plan, но не запускают его до получения слота. Стелла освобождается сразу после durable enqueue занятой миссии. Следующее назначение проходит собственные tags/ribbon/wall. Direct wall сохраняет выбор миссии и не обходит занятую игру/FIFO.

## Готовый механизм и восстановление

Используются существующие DBOS3.2.0 (MIT), SQLAlchemyDatasource/SQLite, очереди `max-control-v1` и `max-assignments-v1`, durable send/recv и clock_sample. Нового scheduler/журнала replay нет. Предметные launch guards добавлены в новые versioned transactions/workflows. Исследование: [MAX local master](../../docs/Research/max-local-master-mvp-20261004.md), включая реальные issues688/818/759 и ограничения idempotency/concurrency. Перед реализацией повторно сверены официальные [workflows](https://docs.dbos.dev/python/tutorials/workflow-tutorial), [queues](https://docs.dbos.dev/python/tutorials/queue-tutorial), [communication](https://docs.dbos.dev/python/tutorials/workflow-communication).

Во время активной анимации elapsed сохраняется каждые0.2с существующим DBOS recv timeout + transaction. Pause и смена bootId не расходуют бюджет. Revision меняется только при смысловом переходе, не каждый checkpoint. При достижении duration частые checkpoints прекращаются; workflow ждёт marker без автоматического перехода. После crash возможен откат до последнего checkpoint; это технический интервал, не доказанная жёсткая real-time гарантия0.2с на нагруженном оборудовании.

SQL migration не требуется: новые поля находятся в versioned state/spec JSON существующих таблиц, старая registry schema5 сохраняется. Старые v1 записи не дополняются новым plan задним числом.

## Фактические проверки

`max-tests/max_launch_http_test.py`: **64 assertions PASS** на настоящем HTTP/DBOS/SQLite с отдельными автоматически выбранными портами, новыми данными и принудительным завершением/повторным запуском только своих процессов. Лог: `max-tests/results.txt`; финальная fixture `max-tests/run-d41ef2ea8d`.

- Реальный квиз → постепенные accepted tags → frozen plan → строгие три markers → отдельный presented → contact.
- Преждевременные delivery/presented/contact/finish отвергнуты; wrong plan/order и ранний marker отвергнуты.
- Повтор того же marker возвращает исходный receipt без повторного перехода.
- Pause, restart paused, resume и restart неприостановленной анимации сохраняют phase/elapsed без расхода downtime.
- После duration SQLite clock перестаёт обновляться, фаза сама не переключается. Финальная wall pose сохраняется до presented.
- Изменение JSON не меняет уже созданный plan.
- Два ожидающих назначения освобождают Стеллу после enqueue, сохраняют FIFO; следующее начинает собственный prelude. Direct wall не обходит очередь.
- Старый активный v1 workflow переживает restart с v2-кодом, продолжает прежний delivery/presented. Новый v2 ждёт его в **той же DBOS assignment queue**, затем получает слот и начинает tags.
- Python syntax/AST PASS; duplicate guard PASS. Старые v1 files byte-for-byte совпадают с baseline.

Собственные процессы после тестов остановлены. Короткая совместная IAB-проверка root/C на8844 проводится отдельно; этот отчёт не объявляет её результат заранее.

## Оставшиеся границы

- Общий production-владелец арки/ленты VK и MAX ещё не определён; здесь технический раздельный preview.
- Marker подтверждает прохождение технической анимации, но не доказывает физический вывод экрана/Spout. Нужны production renderer identity/ownership/ready правила; локальный мастер остаётся техническим.
- Canonical game assignment/terminal adapter, реальные датчики и полный game timer handoff — отдельная интеграция.
- Queue не имеет продуктового лимита длины; остаётся унаследованная защита DBOS priority range2147483647 и фактические ресурсы SQLite. Это не нагрузочная приёмка безграничной очереди.
- В v2 snapshot по-прежнему используется protocol technical-max-v1 ради совместимости transport; launch schema и assignment.schemaVersion различают новую семантику.
- Настройка поставляет технические тексты/объекты. Продуктовые палитры/ассеты и художественная приёмка остаются отдельной работой.
