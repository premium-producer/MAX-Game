# MAX v5: перенос переполненного localStorage в IndexedDB

03.10.2026. Пользователь прислал диагностический QuotaExceededError, вложенный в STORAGE_UNAVAILABLE. Это подтверждает отказ записи прежнего localStorage-профиля; удалять прогресс не требуется.

## Выбранное готовое решение

`idb` 8.0.3, ISC, автор Jake Archibald. Установлен точно зафиксированный npm-пакет; runtime содержит лицензию. Библиотека предоставляет promise-интерфейс настоящих IndexedDB транзакций: именно база браузера сериализует readwrite, выполняет commit и rollback. Адаптер PersistencePort отображает ключи и версии, собственного механизма транзакций нет.

- [Репозиторий и документация idb](https://github.com/jakearchibald/idb): tx.done подтверждает commit; внутри транзакции нельзя ждать внешнюю сеть. В адаптере ожидаются только IDB requests, чтение legacy выполняется до неё.
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB): object stores, транзакции и versionchange.
- [MDN квоты](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria): IndexedDB имеет иной бюджет, но тоже может отказать. Нельзя обещать бесконечное хранение.
- [Практика Firefox: отклонённый cached open promise](https://bugzilla.mozilla.org/show_bug.cgi?id=1470213): ошибка открытия может отравить последующие попытки. Адаптер сбрасывает отклонённый connection promise, закрывает blocking connection и допускает повторное открытие.
- [Реальные сбои и потеря данных при нехватке места](https://github.com/CherryHQ/cherry-studio/issues/15423): пользовательский отчёт, не доказательство конкретной причины MAX. Применимый вывод — не удалять исходное сохранение при ошибке миграции/записи.

Для CPU-тестов: fake-indexeddb 6.2.4, Apache-2.0, [репозиторий](https://github.com/dumbmatter/fakeIndexedDB). Это реализация IDB в памяти только для тестов, не fallback игры и не проверка реальной дисковой квоты.

## Границы интеграции

Только локальный v5-профиль. БД `max-game-local-v1`, store `sessions`, ключ `[старый ключ профиля, sessionId]`. Импортируется точная запись запрошенной сессии вместе с version, состоянием, layouts и receipts. Исходный localStorage не изменяется. Повторный запуск использует уже созданную IDB запись; конкурентная миграция повторно проверяет наличие внутри readwrite. Commit сравнивает revision хранилища и пишет запись целиком одной транзакцией.

Ни новые ответы, ни завершения не вычисляются миграцией; валидатор backend остаётся прежним. Нет silent fallback, удаления receipts или смены правил/каталога. Старые вкладки прежней сборки нужно обновить: они продолжают работать со старым localStorage. Рост журнала receipts остаётся отдельной задачей; нельзя просто обрезать журнал, используемый restore для проверки истории.

[Фактическая проверка](../../artifacts/reports/max-indexeddb-local-profile-20261003.md).
