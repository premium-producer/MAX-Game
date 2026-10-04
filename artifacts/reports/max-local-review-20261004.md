# MAX local technical vertical: независимая проверка

Дополнение интегратора04.10: после snapshot review уточнена подпись panel.js для свободной Стеллы/последнего MAX-квиза. Actual browser cross-VK и итоговое применение прошли; финальные SHA находятся в integration/apply manifest. Остальное содержание ниже — сохранённый независимый отчёт на момент его проверки.

04.10.2026. Проверяющий: wall_items_review. Candidate: `D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/workspace/tests/max-local-candidate`. F использован только для чтения baseline. Код candidate, F, данные и серверы этим агентом не изменялись. HTTP/restart suite выполняет content_entities_backend; браузерную интеграцию — root. Здесь собственный статический аудит и два малых изолированных CPU/SQLite probes; это не повторная полная HTTP-приёмка.

## Итог

После исправлений ниже блокирующих расхождений в проверенном техническом срезе не осталось. Интеграция зависит от прохождения actual HTTP/restart и browser проверки владельцами. Проверка не распространяется на canonical MAX gameplay, production renderer-ready после рестарта и удалённые стенды.

Осталось малое UI-расхождение: `panel.js:56–60` для исторической завершённой MAX сессии при уже свободной станции продолжает писать «На Стелле открыт MAX». Новый VK при этом разрешён правильно. Рекомендация перед сдачей: различать текущего владельца station и последний результат. Root уведомлён.

## Найдено и исправлено владельцами

1. **P1: падение старой панели при MAX admission.** `state.answers` MAX — object, а прежний `panel.js` перебирал его `for...of` как массив. До исправления короткий запуск фактической строки воспроизвёл `TypeError: object is not iterable`. Root добавил Array.isArray guard (`panel.js:47`). Probe фактической render function теперь проходит active/paused/completed MAX, повторный render и свободную station. Это также защищает блокировку чужих legacy кнопок, до которой прежний render не доходил.
2. **P1: cancel между intent и enqueue мог оставить terminal assignment активным.** `create_intent_v1` публикует active до появления child workflow. Ранний command при отсутствии child мог пройти fallback `advance_assignment_v1`, стать terminal; следующий activate снова ставил active_id, затем workflow немедленно завершался. Владелец добавил `ASSIGNMENT_STARTING` до enqueued, скрытие actions и terminal guard в activate (`max_store.py:35–38,131–137,194–206`). Изолированный probe реальных SQL-функций подтверждает durable отказ в промежутке, без terminal occupancy. Полный crash/recovery этого окна данным probe не имитируется.
3. **Зависание команды ожидающему заданию.** Ранее command workflow отправлял сообщение ENQUEUED assignment и ждал его запуска за текущим. Теперь `admit_port_command_v1` немедленно создаёт точный durable отказ `QUEUED_ASSIGNMENT_NOT_ACTIVE`. Это честно ограничивает первый срез управлением текущим assignment; отмена отдельных queued миссий ещё не реализована и не должна отмечаться готовой.
4. **Квиз не был frozen.** Первоначальный workflow использовал глобальные QUESTIONS/mission. Теперь `max_api.py:54` фиксирует validated definition в admission envelope; workflow использует `spec.definition.questions/routing` и передаёт snapshot в state (`max_workflows.py:73,97,103,136`). JSON покрывает2×3 комбинации, business-promotion перенесён как canonical business.
5. **Startup async boundary.** `app.py:231` ожидает initialize_runtime; оба queue registration используют `register_queue_async` после launch (`max_workflows.py:12–14`). Definitions импортированы до FastAPI lifespan/recovery. Sync registration внутри async lifespan больше нет.
6. Устаревшее утверждение главной страницы, что очередь MAX не подключена, исправляется root; техническая маркировка и отсутствие canonical gameplay сохраняются.

## Сверенные инварианты

- **Одна Стелла:** MAX вызывает прежний `business.claim`, использующий запись станции/поколение в общей registry SQLite. Новые таблицы MAX подключены через существующую initialization transaction; отдельной stella-main в MAX нет. Legacy/VK/MAX используют общие admission IDs, но проверяют protocol envelope; чужой requestId не переиспользуется как другой тип квиза.
- **Пути обхода:** root запрещает legacy commands, package options/package creation и session-close для MAX (`app.py:330,422,456,497`, `session_close_api.py:49`). `panel-client.mjs:40–52` отключает foreign actions; free station позволяет новый VK. Новый session-close не может преждевременно освободить MAX delivery.
- **Очередь:** finite control DBOS Queue1 выделяет server ordinal внутри transaction и завершает только после child enqueue+confirm. Assignment Queue1 получает публичный priority=ordinal. Assignment workflow занимает ограничение до domain terminal. Самописного dispatcher нет. Это порядок принятых server ordinal, не гарантия порядка одновременных сетевых запросов до admission; ограничение ms ties у ingress описано в исследовании.
- **Освобождение:** queued Стелла освобождается после подтверждённого DBOS enqueue; свободная — после delivery и presented. `_release` сравнивает station/session/visit/generation. Active cancel/finish/expiry очищают active_id transactionally до возврата assignment workflow. Прямого DBOS.cancel_workflow вместо предметной отмены не найдено. Pause сохраняет занимаемый слот.
- **queueCount:** SQL count по phase=queued не зависит от LIMIT50 и исключает delivery/awaiting_touch/playing. Число UI не используется как scheduler. У queued нет TTL/вытеснения; direct admission отклоняется при current или queued.
- **Таймеры:** quizIdleMs сбрасывается успешным пользовательским действием, pause/resume не сбрасывают бюджет. TouchWaitMs начинается на presented, а не enqueue. Timed шаги используют clock_sample с bootId и не вычитают downtime; pause сохраняет remaining. Настройки snapshot в admission/assignment. По решению root технический порт продолжает после рестарта без нового browser ACK: это допустимая граница MVP, production renderer-ready handshake остаётся долгом.
- **Legacy replay:** AST-сравнение41 прежних top-level функций с DBOS.workflow/DBOS.step/registry.transaction decorators между F и candidate:0 изменённых. Это проверка указанной выборки, не утверждение о всех возможных decorated alias-функциях проекта.

## Собственные проверки

`node artifacts/workspace/tests/max-local-review/panel-probe.mjs` — PASS:

- Реальный createPanelClient, фактическая render function из candidate и лёгкий DOM double.
- Повторный render active/paused MAX не падает; answer/pause/resume/cancel и начало VK на занятой станции заблокированы.
- После освобождения station исторический completed MAX не блокирует canStart; ни один render не посылает POST.
- Художественный результат/браузерная консоль этим CPU probe не проверяются.

`F:/project/VK_DigitalProducts_Stand/artifacts/backend-probes/quiz-panel/.venv/Scripts/python.exe -B artifacts/workspace/tests/max-local-review/intent-gap-probe.py` — PASS:

- Реальные max_store functions выполняются синхронно с изолированной SQLite in-memory; заменён только datasource decorator для контролируемого порядка transaction calls.
- После create_intent и до enqueue/confirm cancel получает `ASSIGNMENT_STARTING`, actions пусты.
- Это проверка SQL/доменных переходов, не тест DBOS recovery или HTTP.

Собственный сервер не запускался: дублирование runtime suite исключено по согласованию с backend owner. CPU probes не меняют candidate, живые данные или F.

## Зафиксированные SHA проверки

Снимок на момент чтения; последующие root/owner правки требуют учитывать новый SHA, а не распространять этот результат автоматически.

| Candidate file | SHA256 |
|---|---|
| app.py | c0495d59b7c735df01b48053187827b91c418fdcf9d890cb5bd59dee7aab1578 |
| registry.py | 31b53a2d95425ced4959ccc2215c43c1966f5bc20cc4cdaea12c647c5a148552 |
| session_close_api.py | 0602617011404a71f20aebb2d5a5c22778f36ac313f23c53a01cf935ca564683 |
| panel.js | 726b659bd2f49d19417e218020511d71418e1aa2112443f1a09ce8ab51ed7f34 |
| panel-client.mjs | fbe59eae086541f8380f05de2cd3c7dd7091554e2783190d0bbe7d977b470a50 |
| max_api.py | fdd3da97c7cda1c2e999599cef00fbb8f926915a8dd2569387cde8dee2645161 |
| max_models.py | a59973d9cfa8b4183bd5df57d563658efa3bc21fadfa5d711a35328ee9c0dc16 |
| max_store.py | f34eea9541312de0ea90d73e6cc857c9a0200e58f666208ef488f1c9244f7303 |
| max_workflows.py | e55ec9db4cd8362e6360311614c901a3276c34e8152526b2a72f3b38251bfcde |

Механизмы/версии/лицензии/первичные источники и реальные DBOS issues: [исследование](../../docs/Research/max-local-master-mvp-20261004.md). DBOS3.2.0 MIT + существующий SQLAlchemyDatasource/SQLite; нового scheduler или второй реализации правил миссий здесь нет. Canonical MAX adapter, slot release migration, полный queued cancellation и production error reconciliation требуют отдельных срезов.
