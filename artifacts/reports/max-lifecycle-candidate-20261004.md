# MAX canonical assignment lifecycle — кандидат B

04.10.2026. Первый срез параллельной волны. **Не применён в F**, рабочие данные/процессы/TD/игра D не изменялись. Исполнитель B (`parallel_components_plan`), интегратор root. Источник — snapshot принятого F, а не старый D vendor или визуальный v5.

## Scope и происхождение

Кандидат: `artifacts/workspace/tests/parallel-wave1/max-candidate`. Исходные SHA: соседний `max-candidate.baseline.json`; итоговая передача — `max-tests/handoff.json`. Изменены только четыре файла:

- `artifacts/service/max-game/sqlite-worker.mjs`
- `artifacts/service/max-game/sqlite-persistence.mjs`
- `artifacts/service/max-game/http-api.mjs`
- `artifacts/max-game/src/application/mission-session.mjs`

Новых npm-зависимостей нет. Использованы прежние Node worker, SQLite transaction/constraints и очередь сериализации SessionApplication; новый scheduler, очередь посетителей или игровой reducer не создавались. Прочитаны роль MAX, max-game-development, исследование `docs/Research/max-local-master-mvp-20261004.md`, canonical README/manifest и assignment-v1.

Готовый механизм: SQLite `BEGIN IMMEDIATE` атомарно сохраняет lifecycle, receipt и освобождение слота. Проверено на Node25.9.0/SQLite3.51.3. Node MIT/включённые notices; SQLite public domain; canonical код частного проекта. Основания: [SQLite transactions](https://sqlite.org/lang_transaction.html), [официальная процедура изменения схемы](https://sqlite.org/lang_altertable.html), [Node SQLite](https://nodejs.org/api/sqlite.html). Изменение CHECK выполнено create/copy/drop/rename в транзакции без writable_schema.

## Контракт кандидата

`POST /api/max-game/v1/assignments/:assignmentId/commands`

```json
{"schemaVersion":1,"commandId":"cancel-a1","assignmentId":"a1","expectedGeneration":1,"kind":"cancel"}
```

`kind` — `cancel` либо `release`. Control использует отдельный `authorizeControl`, **default deny**. `release` допустим только когда сохранённый canonical core уже имеет `completed`, `incomplete` либо `expired`. Передать желаемый результат клиента нельзя. `cancel` сохраняет `lifecycle.status=cancelled`, не изобретает новый статус игрового reducer и не переписывает сохранённый игровой snapshot.

Результат: `{receipt:{schemaVersion,commandId,assignmentId,sessionId,generation,status,released:true},duplicate}`. Stable commandId + идентичный canonical payload возвращают исходный receipt даже после нового назначения; иной payload с тем же ID отклоняется. Поздняя новая команда A не освобождает B. Повтор не зависит от загруженного каталога старой сессии.

Прежний `GET /assignments/:id` сохраняет immutable accepted receipt и добавляет `lifecycle:{assignmentId,status,terminalCommandId,generation,gameStatus}`. Accepted по-прежнему означает сохранение, не реальный показ. GET session и initial subscription добавляют `assignment` с lifecycle; terminal notification имеет effect `ASSIGNMENT_RELEASED`. Читатель обязан учитывать lifecycle: исторический game status при отмене может оставаться `scan`/`task`.

HTTP API теперь **managed по умолчанию**: `POST /sessions` запрещён. Предыдущий самостоятельный режим доступен только с `createMaxGameApi({mode:'standalone', ...})`. Это намеренное изменение совместимости; старые standalone host/fixtures при интеграции должны явно указать режим. Даже standalone не разрешает менять миссию/сбрасывать managed-сессию: `SELECT_MISSION`, `RETURN_MENU`, `RESTART_MISSION`, `RESET_PROGRESS` запрещены. После terminal запрещены owner/contact/commands/layout mutations; SQLite повторно проверяет lifecycle при commit, поэтому старый процесс с закэшированным record не воскрешает назначение.

## Миграция

Storage0/1/2 →3. Новый CHECK допускает пустой слот с положительным generation. Generation сохраняется при release, увеличивается при следующем assignment. Добавлены `max_assignment_lifecycle` и immutable `max_assignment_commands`; старые assignment получают `active`. Старые session records, accepted receipts, imports и layouts сохраняются. Повторный startup schema3 идемпотентен. Backup port возвращает schemaVersion3. Старый worker schema2 такую БД не откроет: rollback требует согласованного backup, не запуска старого бинарника поверх schema3.

## Проверка

`node --test --test-isolation=none artifacts/workspace/tests/parallel-wave1/max-tests/lifecycle.test.mjs`: **10/10 PASS**, лог `max-tests/results.txt`.

- cancel сохраняет core и accepted receipt, освобождает слот, второе назначение имеет generation2;
- replay/изменённый payload/stale generation не затрагивают новое назначение;
- release до canonical terminal отклонён, после настоящего EXPIRE разрешён;
- смена миссии/reset и прямой storage commit после terminal закрыты;
- конкурентные terminal-команды получают один исход;
- инъекция SQLite ABORT при записи receipt откатывает также lifecycle и release;
- отдельное SQLite соединение со старым record не воскрешает A;
- terminal GET/subscription показывают отдельный lifecycle;
- настоящая schema2 с прежним CHECK мигрирует с активной сессией без изменений; restart, durable retry, второе назначение, integrity_check и foreign_key_check PASS;
- фактический HTTP: managed/default control deny, explicit standalone, managed SELECT guard, cancel/retry/second assignment.

Синтаксис всех четырёх JS-модулей проверен. Изолированные БД создавались только в `max-tests/run-*`; HTTP использовал loopback с автоматически выбранным портом и остановлен после тестов. Сначала тест выявил неверную часовую конфигурацию fixture (HTTP Date.now против инъецированных часов Application); fixture использует один trusted clock, производственный код под тест не ослаблялся.

## Не входит в срез

Python TechnicalMaxPort/master adapter, renderer-ready/presented, очередь и её отмена, реальные сенсоры, принятие каталога D v5, браузер/художественная игра не подключены. Checkpoint игрового ядра остаётся прежним до5с — долг BE-04 не закрыт. Полное прохождение completed/incomplete в браузере этим backend-срезом не заявляется; terminal release проверен реальным canonical EXPIRE. Root выполняет независимый review и контролируемый перенос только после проверки совместимости вызывающих host с новым managed default.
