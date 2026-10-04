# MX-LOCAL-01 — интеграция технического MAX в local master

04.10.2026. **Применено на 8782; пользовательская приёмка открыта.** Это TechnicalMaxPort, без canonical игрового core, реального ввода и GPU. Архитектура: `docs/MAX_LOCAL_MASTER_ARCHITECTURE.md` мастер-проекта F.

## Что принято

`/max` — тонкий технический интерфейс: два вопроса реального квиза MAX, четыре миссии, общий атомарный допуск Стеллы с VK, прямой вход у стены, durable FIFO, доставка/presented/contact/finish, pause/resume/cancel текущего назначения, 20 секунд бездействия квиза и 60 секунд ожидания руки после presented. Настройки и определение квиза — JSON, snapshot для каждого допуска. Браузер не управляет временем и выбором следующей миссии.

При занятой игре Стелла освобождается после durable enqueue. При свободной — после presented. Очередь не имеет продуктового лимита; страница по50 строк — только пагинация. Назначение связано с исходной сессией для аудита, но любой посетитель может начать его касанием.

16 файлов перенесено по exact manifest из изолированного D-кандидата. Новый backend добавлен отдельными versioned workflows; 41 историческое decorated тело сопоставлено с F без изменений. Registry расширена тремя таблицами MAX; имеющиеся таблицы/данные не заменялись. DBOS3.2.0 использует готовые control/assignment Queue с concurrency1, send/recv и datasource transactions. Исследование DBOS API, MIT, реальных issues и ограничения FIFO сохранено отдельно.

## Подтверждённые проверки

| Проверка | Результат и доказательство |
|---|---|
| Backend, реальный HTTP/DBOS | 5 групп PASS: общий допуск/доставка/presented/FIFO/повтор, pause+restart, срок ожидания после presented, поздний assignment/direct entry, quiz idle, frozen definition после изменения конфига и рестарта. `max-local-20261004/backend-evidence.json` |
| Соответствие исходному квизу | 6/6 комбинаций audience/goal через строгий loader/routing: business→business; personal→digital-id/communication/blogger |
| Тонкий клиент с реальным HTTP | 7 сценариев PASS, `max-local-20261004/ui-http-smoke.log`. Первоначальная ошибка теста business→result исправлена: исходная Стелла всегда задаёт второй вопрос |
| Клиент MAX CPU/DOM | 11/11 PASS: stable pending/точный ACK/instanceKey/отказ допуска/два входа/frozen definition/page lifecycle; `node --check` PASS |
| Существующий клиент VK | 7/7 PASS; JS syntax PASS; MAX actions заблокированы в VK UI |
| Независимое review | Исправлены падение VK render на object answers и гонка cancel между intent/enqueue. SQLite probe защищает terminal activation; tiny actual-client/render probe PASS. `max-local-review-20261004.md` |
| Root HTTP guards | Старые VK command/package-options/session-close для MAX:409. Ожидающее назначение немедленно получает durable `QUEUED_ASSIGNMENT_NOT_ACTIVE`; точный повтор возвращает тот же ACK; иной payload того же ID:409 `COMMAND_ID_REUSED`. `max-local-20261004/root-probe.json` |
| Внутренний браузер, отдельная БД8824 | Квиз personal/connection → доставка → presented освобождает Стеллу → contact; второй business/visibility → очередь1 и свободная Стелла; finish первого → автоматически следующий; reload сохраняет assignment; pause; новый MAX-квиз виден и защищён на `/`; отмена квиза не отменяет paused миссию. Console error/warn:0 |
| Проверка установленного8782 | Read-only `/max`: defaults20/60, пустой MAX slot/queue, существующая активная VK-сессия удерживает общую Стеллу. Console error/warn:0. Синтетический квиз на живой БД не запускался |
| Перенос | F baseline SHA до/после остановки;16 candidateSHA;4 HTTP staticSHA; обе backupSQLite integrity ok; lifecycle stop/start/check PASS; instanceKey сохранён; все прежние business rows равны snapshot |
| Чистота D | `check_project_duplicates.py`: PASS |

Browser fixture использовал120/120 секунд только в собственной копии configs, чтобы действия агента не истекали между наблюдениями. Истечение20/60-политик проверялось HTTP-suite с уменьшенными тестовыми бюджетами; production defaults не менялись. Первый browser проход с default20 секунд корректно истёк между действиями; тест был продолжен в отдельной БД, не путём сброса пользовательской сессии.

## Применение и сохранность

Backup: `artifacts/workspace/backups/max-local-20261004-102553` в F; source, обе БД, sidecars и manifest. Старый PID67408 остановлен проверенным lifecycle, новый PID79588. Сохранены20 sessions,20 admissions,1 station,16 content packages,23 execution states,9 wall entries,0 item arrivals. Источник runtime — `F:/project/VK_DigitalProducts_Stand/artifacts/local-master`. Applied SHA и точные результаты: `max-local-20261004/apply.json`.

Во время read-only приёмки на8782 Стелла занята пользовательским VK-квизом `69177e7a-69d8-4afb-b4d2-74fa2479887f`, фаза active/answer-reveal. Поэтому новый MAX-квиз заблокирован до завершения/отмены этого VK-квиза; прямой вход MAX доступен независимо. Эта сессия не отменялась проверяющим.

Root — существующие API/UI guards, wiring, архитектура, browser и перенос. Backend-агент — новые MAX модули/configs и HTTP/recovery. UI-агент — три новых UI файла и проверки клиента. Review-агент — research, read-only review и независимые узкие probes. Владение файлами не пересекалось; F менял только root. Git commit/push не выполнялись.

## Осталось вне среза

- Реальная игра/canonical adapter, повторный release игрового слота, renderer-ready после потери связи и физическое касание. Технический finish не является результатом реального прохождения.
- Отмена/перестановка произвольных ожидающих назначений и общая AV-пауза. Сейчас доступны действия текущего назначения и отдельного квиза; queued command явно отвергается.
- TTL прямого выбора/доставки, operational reconciliation неисправимого workflow, backup/retention и production auth. Read-only очередь не означает проверку неограниченной нагрузки.
- Исчерпание DBOS priority2147483647 — явная ошибка, rollover не реализован. Тесты одновременного ingress и аварии питания/всех точек submit не проведены; восстановление проверено в указанных сценариях.
- Existing VK BE-14/BE-13 и прочий долг из AUD-02 не закрываются этим MAX-срезом.

Полная художественная и пользовательская приёмка ещё не выполнялась. Тяжёлые GPU/нагрузочные проверки, камеры, TD, Spout и сеть оборудования не запускались.
