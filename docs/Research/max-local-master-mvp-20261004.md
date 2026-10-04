# MAX в локальном мастере: технический вертикальный срез

04.10.2026. Владелец исследования: wall_items_review. Только чтение F и исходников D; серверы, БД, оборудование и удалённые доступы не проверялись. Это рекомендация, не отчёт о готовой интеграции. Единственный изменённый файл — данный документ; общий индекс/WORKLOG обновляет координатор.

## Решение малого шага

Первый проверяемый срез — реальный квиз MAX и сценарная очередь в существующем локальном мастере, с явно обозначенным техническим MaxPort. Оператор подтверждает доставку, показ предстартового экрана, касание и техническое завершение. Это позволяет проверять владение Стеллой, два входа, FIFO, таймеры, pause/cancel/restart без второй реализации игровых правил. Кнопка «Технически завершить» не должна создавать canonical результат миссии, прогресс, QR или утверждать, что игровое ядро уже подключено.

Следующий адаптер использует принятые F `artifacts/max-game/src/application/mission-session.mjs` и `artifacts/service/max-game/{http-api,sqlite-worker}.mjs`. Нельзя автоматически подменять их D `vendor/backend-figma-v2` или незавершённым runtime v3 редактора. Уже принятый MAX assignment v1 умеет первый atomic assignment и устойчивый повтор; освобождение слота, второй запуск и renderer-ready в нём ещё отсутствуют. Готовность технического порта не означает готовность этого адаптера.

Прочитаны `docs/d_to_f_import/AGENT_INTEGRATION_GUIDE.md`, `AGENT_MAX.md`, `artifacts/max-game/AGENTS.md`, `artifacts/skills/max-game-development/SKILL.md`, последние WORKLOG. Норматив сценария — F `docs/research/scenario-visual-decoupling-20261003.md:82–99`; техническая игра не меняет его правила.

## Подтверждённый механизм: DBOS 3.2.0

Проверены официальная документация и установленный Python package с `METADATA Version: 3.2.0` в F `artifacts/backend-probes/quiz-panel/.venv/Lib/site-packages/dbos`. DBOS — MIT; официальный релиз3.2.0 от29.09.2026 содержит исправление конфликтов workflow и datasource migrations. [Релиз](https://github.com/dbos-inc/dbos-transact-py/releases/tag/3.2.0), [лицензия](https://github.com/dbos-inc/dbos-transact-py/blob/3.2.0/LICENSE).

`DBOS.register_queue(name, global_concurrency=1)` и `DBOS.enqueue_workflow` есть именно в установленной версии (`_dbos.py:947,1339`), а не только в текущем сайте. Регистрация — после DBOS.launch, до HTTP ready; definitions импортируются до launch/recovery. Queue хранит задания в system DB; global concurrency ограничивает одновременно выполняемые workflow, включая PENDING старых версий. Единственный assignment workflow должен занимать очередь до terminal **и подтверждённого освобождения**. Возврат сразу после принятия назначения освободит ограничение слишком рано. Quiz workflow не должен занимать игровой слот. [Официальное описание очередей](https://docs.dbos.dev/python/tutorials/queue-tutorial).

Встроенные `send/recv` и стабильные workflow IDs дают готовое ожидание сигналов и восстановление; собственные журнал replay, очередь сообщений, dispatcher или механизм retries не нужны. Содержимое повторного commandId проверяет предметный адаптер: deduplication сама не доказывает равенство payload. Аналогично существующий SetWorkflowID не является проверкой равенства новых аргументов старым. [Workflow communication](https://docs.dbos.dev/python/tutorials/workflow-communication), существующий F `docs/research/dbos-finite-sessions-20261003.md`.

### FIFO: существенная граница гарантии

Установленный `_sys_db.py:4903` выбирает задания по `priority ASC, created_at ASC`. При совпадении миллисекунды дополнительного общего tie-breaker здесь нет. Документированного FIFO достаточно для последовательных enqueue, но нельзя объявлять доказанным строгий порядок двух одновременных HTTP-запросов либо порядок отдельного business seq, назначенного до enqueue. Если A получает seq1, зависает до enqueue, а B получает seq2 и успевает enqueue, один лишь worker concurrency1 не восстанавливает порядок A/B.

Минимальный вариант без переноса registry в другую БД: отдельная **готовая DBOS control Queue** concurrency1 для короткого finite submit workflow. Внутри него последовательно: transaction с проверкой входа и выделением server ordinal → deterministic enqueue assignment в игровую Queue → transaction подтверждения enqueue/правила release. Приём для пользователя считается завершённым после этого workflow; одинаковые по времени запросы до него не имеют обещанного порядка браузерных timestamps. Сам submit нельзя завершать до durable enqueue. Это последовательное применение готовых библиотечных очередей, не новый scheduler.

Игровому enqueue задаётся `SetEnqueueOptions(priority=ordinal)`; это публичный API3.2.0 (`_context.py:782–812`), нижнее значение выполняется первым. Тем самым ties внутри уже принятой очереди не переставляют server ordinal. Публичный диапазон —1…2147483647; переполнение нельзя оборачивать или молча сбрасывать. Это ограничение счётчика, не допустимый product cap длины очереди. Конкретное решение перенумерации/новой эпохи при пустой очереди — отдельная эксплуатационная политика, до исчерпания пространства остаётся более2млрд поступлений. [Queue reference](https://docs.dbos.dev/python/reference/queues).

Эта рекомендация требует фактического теста восстановления control workflow между каждым из трёх шагов и проверки одинаковых timestamps. Она **не обещает глобальный порядок сетевого прибытия** нескольких одновременно принимаемых запросов. Если продукт требует именно такой порядок до durable admission, выбранный library contract пока недостаточен: пересмотреть admission механизм, а не добавлять скрытый самописный scheduler.

`DBOSClient.enqueue_in_transaction` существует (`_client.py:346`), но принимает transaction к **DBOS system database**. Отдельная `registry.sqlite` SQLAlchemyDatasource не становится с ней общей транзакцией. Не вызывать enqueue внутри её business transaction с утверждением атомарности. Общая system DB и библиотечный transactional enqueue — возможный отдельный вариант, но он требует явной миграции/исследования архитектуры. Для малого среза durable parent workflow с deterministic child ID и reconciliation сохраняет существующую структуру. [DBOS Client](https://docs.dbos.dev/python/reference/client).

### Реальный опыт и ограничения

- [Issue688](https://github.com/dbos-inc/dbos-transact-py/issues/688): production report DBOS2.22/Cloud Run описывает недетерминированный порядок разных decorated steps в asyncio.gather и ошибки восстановления. Для MAX submit три durable действия выполнять последовательно; параллелить независимые проверки снаружи workflow, не порядок его checkpoint.
- [Issue818](https://github.com/dbos-inc/dbos-transact-py/issues/818): дубли datasource transaction могли продолжать выполнение после checkpoint; исправление связано с PR823. Это подтверждает необходимость проверки lost ACK/повторного входа на установленной3.2, а не доверия одним unit-тестам адаптера.
- [Issue759](https://github.com/dbos-inc/dbos-transact-py/issues/759): наблюдавшаяся на2.25 ошибка пустого workflow ID приводила к ghost duplicates при recovery, исправление PR763. Все внешние ID должны быть непустыми, ограниченными и нормализованными один раз.
- [Issue718](https://github.com/dbos-inc/dbos-transact-py/issues/718): пользователю понадобилось отдельно решать дедупликацию scheduled работ при общей concurrency. Ограничение параллелизма не равно уникальности заявки; для MAX используется immutable requestId/assignmentId, не один deduplication key на весь слот, который мог бы потерять посетителей.

Эти issues показывают реальные классы ошибок; не утверждается, что старые баги воспроизводятся на3.2.0. При изменениях durable кода добавлять новые versioned workflow/transaction функции; старые вызовы и порядок checkpoint не переписывать. [Upgrading workflows](https://docs.dbos.dev/python/tutorials/upgrading-workflows). Ранее исследованные recovery, lifecycle и конечные сессии: F `docs/research/dbos-{lifecycle,finite-sessions}-20261003.md`.

## Реальный квиз: точные источники и перенос

Источник текста — D `artifacts/stella-prototype/src/content/max.ts:4–59`; правила — `artifacts/stella-prototype/src/features/prototype/logic.ts:11–19`. Переносить их как versioned immutable definition в master registry с проверкой всех шести комбинаций, а не копировать React state/старый мастер. Admission фиксирует definition ID/version и содержимое; изменения настройки действуют для новой сессии.

| Поле | Значения |
|---|---|
| Вопрос1 | «Какие возможности ты хочешь освоить?» |
| audience | business: «Для бизнеса»; personal: «Для личного пользования» |
| Вопрос2 | «Какой цели хочешь достичь?» |
| goal | access: «Упростить идентификацию»; connection: «Быть на связи 24/7»; visibility: «Повысить узнаваемость» |
| Переход | «Пройди к правой панели,\nчтобы начать» |
| Финальная кнопка | «спасибо» |

| audience | goal | D mission ID | Canonical F mission ID |
|---|---|---|---|
| business | access / connection / visibility | business-promotion | business |
| personal | access | digital-id | digital-id |
| personal | connection | communication | communication |
| personal | visibility | blogger | blogger |

Метки/описания и metadata тегов тоже находятся в max.ts. Нельзя определять mission ID по русскому label. F canonical каталог включает ещё benefit-test/business-test; технический выбор для посетителя показывает четыре продуктовые миссии, тестовые не смешиваются с реальным квизом. D reviewed content и редактор — отдельные кандидаты, не автоматическая смена contentRevision F.

SHA256 прочитанного `max.ts`: `2c35d1a71e7690fb0be780f9f0b2e9f2ede30485768f90a8884f88dd4f5b10fe`.
SHA256 `logic.ts`: `7ebb61fe5733e0b6eeca3be63671598a68e53f5b5cae484001b49b3ae2b8e5e9`.

## Предметные состояния и инварианты порта

Стелла: idle → question1 → question2 → result → submitting. При занятой стене: durable queued → released. При свободной: delivery_pending → delivery_arrived + wall_presented → released. Binding Стеллы принадлежит session/admission generation; запоздалое событие A не освобождает посетителя B. MAX и VK используют существующий общий station ownership, не два параллельных stella-main.

MAX assignment: queued → offering/presenting → waiting_hand → playing_technical → releasing → completed/cancelled/hand_timeout. Дополнительные атрибуты: paused, awaiting_reconcile, active generation, renderer/port lease epoch, deliveryArrived, presented, last event/receipt и remaining timers. В UI paused/fault не маскируются под idle. После рестарта требуется новое подтверждение текущего экрана/порта, прежде чем снова расходовать active remaining.

Очередь не привязана к человеку у стены: начать подготовленную миссию может другой посетитель. Direct wall выбор доступен только при отсутствии active/ожидающих заданий и проходит тот же control admission. Один запрос выигрывает гонку с поступлением Стеллы; проигравший direct выбор отклоняется с обновлённым snapshot, не создаёт обходную игру. Количество ожидающих едино для UI Стеллы/стены и исключает offered/waiting_hand/playing.

Ожидание руки60с начинается после presented текущего assignment/generation, а не после enqueue или DBOS dequeue. У queued нет TTL. Параметр20с — бездействие квиза (F docs/BACKLOG.md:9), не замена180000мс canonical mission budget. Настройки immutable для начавшейся сессии/assignment; UI показывает значение и оставшееся время. DBOS workflow timeout считает абсолютный deadline и не соответствует исключению downtime; использовать уже существующий master clock_sample/bootId/remaining механизм. После нового boot не вычитать простои из старого monotonic timestamp. Цель checkpoint≤1с проверять отдельно; старый canonical MAX сохраняет active clock раз в5с.

Технические команды: delivery_arrived, presented, contact, finish_technical, pause, resume, cancel. Каждая имеет стабильный commandId и exact payload; ошибки фазы/generation не изменяют очередь. ACK одного события не означает ACK остальных. Pause не освобождает Queue. Активный cancel должен выполнить release до завершения workflow; прямой DBOS.cancel_workflow может снять concurrency slot до cleanup, поэтому не является доменной командой cancel. Ожидающий cancel не должен требовать запуска игры; нельзя возвращать CANCELLED обратно в Queue простым retry HTTP.

## Граница canonical адаптера и порядок реализации

1. Координатор принимает явный технический mode и API/state contract. Backend владеет definition, двумя DBOS queues, конечными workflow, receipts, station admission и timers. UI владеет только техническими действиями и проекциями. Изолированные тесты проверяют реальные HTTP/SQLite/DBOS, не mock scheduler.
2. Проверяемый проход: реальный квиз A → shown/delivery ACK → освобождение Стеллы → B в очередь во время A → contact/finish A → auto offer B →60с no-hand → release. Direct race, stale ACK, pause/reload/restart и lost enqueue ACK обязательны. Порядок принятых ordinal сверяется с DBOS assignment executions, не только с отсортированным UI.
3. Следующий срез подключает F canonical game HTTP/SQLite через MaxPort. Перед этим нужен additive assignment release/cancel contract и миграция слота: нынешний CHECK `max_slots` допускает empty только при generation0 (`sqlite-worker.mjs:69–75`). Возврат generation к0 разрушает fencing. Сохраняются immutable receipts и монотонное поколение; поздний release A не трогает B.
4. Canonical input lease остаётся у MAX приложения. Мастер управляет admission/assignment, ядро — правилами миссий. Старые player `/sessions` и SELECT_MISSION не должны позволять техническому UI обходить мастерскую очередь. `http-api.mjs:61` release освобождает input owner, а не assignment slot. `assignment accepted` не равно `presented`.

Прочитанный F контракт `artifacts/contracts/max-assignment-v1.md` SHA256 `88b4ec67dd5cd8e219a2bf87eb1a861d18d15f33bfbeb1d9d5cc154d4858698c`. F canonical происхождение — `artifacts/service/max-game/canonical-source-manifest.json`; готовность/ограничения — соседний README. Node25.9.0/SQLite3.51.3 — ранее проверенный canonical baseline, не production pin. Node MIT с notices, SQLite public domain; canonical проектный код частный. [Node SQLite](https://nodejs.org/api/sqlite.html), [SQLite transaction](https://sqlite.org/lang_transaction.html).

В этой исследовательской задаче integration tests не запускались. F/source/runtime/production остаются неизменными; технический MVP и canonical adapter должны получить отдельные фактические отчёты и пользовательскую приёмку.
