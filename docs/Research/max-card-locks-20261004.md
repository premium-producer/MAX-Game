# MAX: исключительное редактирование карточки

04.10.2026. Запрос: выделять занятую карточку «СЕЙЧАС РЕДАКТИРУЕТСЯ» и запрещать второму участнику вход. Единица доступа — screenId, а не вся миссия. JSON разметки и текущий merge сохраняются.

## Выбор

`@verrou/core` **0.5.2**, ISC, официальный MemoryStore с `async-mutex`. Сам механизм захвата, TTL, продления и owner-only release выполняет готовая библиотека. Она [документирует](https://verrou.dev/docs/drivers) ограничение одним процессом: это соответствует единственному изолированному Node service редактора. Несколько реплик потребуют общего Redis/Postgres driver; текущая поставка такой режим не поддерживает.

[API](https://verrou.dev/docs/api): acquireImmediately, isExpired, getRemainingTime, extend, release. [Применение](https://verrou.dev/docs/usage). [Репозиторий](https://github.com/Julien-R44/verrou), [релизы](https://github.com/Julien-R44/verrou/releases). npm-пакет закреплён lock-файлом; аудит зависимостей0уязвимостей. Redis на текущем Selectel не установлен, новый сервис для одного процесса не нужен.

## Реальный опыт и ограничение

[Issue12](https://github.com/Julien-R44/verrou/issues/12) описывает E_LOCK_NOT_OWNED при повторном захвате; исправление явного release вошло в0.5.1. Проверка [source0.5.2](https://github.com/Julien-R44/verrou/blob/verrou%400.5.2/packages/verrou/src/drivers/memory.ts) выявляет оставшееся ограничение: неявный takeover истёкшей записи не заменяет её owner, extend самостоятельно не запрещает воскресить истёкший lease. Поэтому сырой driver не принимается как доказательство корректности.

Интеграция сохраняет оригинальные Lock handles; в единой очереди acquire/renew/save/status перед обработкой истёкшего доступа выполняется его обычный library release. Только затем создаётся новый lock. Истёкший token отклоняется до extend/write; forceRelease и переписывание библиотеки не используются. Эта последовательность обхода дефекта ограничена одним серверным процессом и проверяется регрессией A expired → release A → B acquire → stale A reject. Client capability отдельно создаётся через crypto.randomBytes, поскольку внутренний owner библиотеки не является криптографическим секретом.

## Применённый контракт

30с TTL, heartbeat8с, получение списка2с. Сервер сериализует выдачу доступа и проверки перед сохранением. Ни legacyPOST, ни CAS/import, ни merge не обходят чужую занятую карточку. Изменение общих текстов/финала проверяет весь затронутый набор карточек. Публичный список не раскрывает token; renew/release/save требуют подтверждённого владельца.

Клиент получает доступ до открытия модального окна, сохраняет перед закрытием/переходом. При потере heartbeat выключает ввод; позднее подтверждение не восстанавливает право самостоятельно. Закрытие вкладки освобождает доступ best-effort; аварийное исчезновение ограничено TTL. Перезапуск сервера аннулирует старые tokens, не меняя JSON.

## Альтернативы

[proper-lockfile](https://github.com/moxystudio/node-proper-lockfile) управляет process/file heartbeat, не присутствием браузерного редактора; [issue121](https://github.com/moxystudio/node-proper-lockfile/issues/121) описывает stale takeover race. Не выбран.

[redis-semaphore](https://github.com/swarthy/redis-semaphore) поддерживает TTL/renewal для нескольких процессов; [issue9](https://github.com/swarthy/redis-semaphore/issues/9) показывает необходимость обработки потери владения. Потребовал бы отдельный Redis, которого на текущем сервере нет. Вернуться к нему при масштабировании сервиса.

Фактическая проверка реализации и публикации — [отчёт](../../artifacts/reports/max-card-locks-20261004.md).
