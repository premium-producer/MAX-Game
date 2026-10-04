# MAX shared backend — сведение параллельных этапов

02.10.2026. Поручение: продолжить архитектурный план, после уточнения пользователя распределить между агентами самостоятельные блоки плана. Приоритет — логика/backend; отдельного стенда визуала не создавать. Авторитетные старые страницы/пользовательские данные сохраняются.

## Закрытые backend-блоки

| Этап исходного плана | Фактический результат |
|---|---|
| 1–3 | Ранее реализованные TaskCatalog, Game Core, Application/SessionPort сохранены. |
| 6 | SQLite PersistencePort в worker, CAS, атомарный snapshot/receipt ledger, commit ACK, close/drain, online backup; native host проверен. |
| 7 | Отдельный `/api/max-game/v1` в source Stand Service: catalog/session/commands/SSE, lease acquire/renew/release, contacts, base layout. Lazy opt-in, по умолчанию disabled. |
| 8 | Общий сетевой SessionPort: подтверждённый snapshot, reconnect/повтор commandId, запрет новых ответов при обрыве, отсутствие fallback, освобождение lease при close. Подключение renderer ещё впереди. |
| 9 | Mission Core/Application: выбор миссии, trusted hold, результат/следующий шаг/QR, таймер, menu/restart/reset, layout revision отдельно. Presentation-анимации пока прежние. |
| 10 | Общий каталог 6 миссий/17 заданий, public/private, 3 business tools, voice→video внутри узла; missing/skip не даёт успешного зачёта. |
| 11 | Явный экспорт/импорт, проверка semantic receipts/версий, archive-first, атомарный session+target claim. Неизвестный legacy только архивируется; исходные ключи не переписываются. |
| 12 | Версии/manifest/asset hashes, scoped dependency guard, fixtures, документация расширений, сборочные зависимости. Visual adapter integration не отмечена готовой. |

SQLite ledger находится в одной атомарной JSON-записи, без дублирования authority отдельными таблицами processed_commands/completion_receipts. Для импорта добавлены отдельные immutable archives и target claims; session/claim создаются одной транзакцией.

## Исправленные стыки

- SQLite поддерживает mission record v2, включая clockCheckpointAt.
- API сохраняет Unicode при разбиении UTF-8 на сетевые chunks.
- Lease удаляется после подтверждённой паузы; старый generation/token не получает ввод. Контактный sequence сбрасывается при смене владельца.
- Sweep coalesced: медленная запись не создаёт бесконечную очередь 100-мс тиков; SSE heartbeat реже, backpressure ограничен.
- Первое получение владельца меняет revision; клиент читает post-lease snapshot перед первым действием.
- Client close освобождает владельца; поздний/исторический snapshot не откатывает состояние. Observer failure не ломает commit.
- Timer checkpoint сохраняется раз в 5 с без увеличения GameState revision. Server downtime не расходует подтверждённый остаток; до 5 с неподтверждённого времени может вернуться.
- Чужая идентичная пустая сессия не становится «успешным импортом» после второго retry: требуется атомарный target claim, проверенный после worker restart.

## Проверки

PASS:

- `node --test --test-isolation=none artifacts/max-game/test/shared-*.test.mjs artifacts/service/max-game/*.test.mjs`: **160/160**, примерно 1,69 с.
- Actual Electron **44.4.5**, Node **24.21.0**, SQLite **3.53.4**: **22/22** SQLite/cross-contract tests, exit 0, примерно 0,79 с, `ELECTRON_RUN_AS_NODE=1`, без GUI.
- Node syntax: 33 затронутых/общих source/script модулей.
- Dependency guard: 20 модулей, violations=[]; duplicate guard PASS.
- Scoped `git diff --check` PASS. Общий tree имеет сторонние whitespace-замечания в визуальных файлах; они в эту работу не включались.
- Isolated HTTP transport: revisions/deduplication, session isolation, owner conflicts/expiry, contact replay, SSE/reconnect.
- Собранный **run** backend импортирован из runtime shared в тестовый projectRoot и прошёл catalog → create → owner → select → hold → первый task с настоящим SQLite worker. База только внутри `artifacts/workspace/tests/`.

Расширенная fixture самого Stand Service не является приёмкой: неверное ожидание GET `/api/journey` и зависший teardown остановлены. Для этой работы используются изолированные HTTP/factory проверки; работающий пользовательский мастер не проверялся/не запускался.

## Сборка и сохранность

- Service: `py -3 artifacts/web/tools/build_service.py --preserve-native`, **128 files**, без изменения native binaries; архив локальный, не публикация.
- MAX: `node artifacts/max-game/scripts/build.mjs --shared-only`, **21 shared files**, 6 missions, 18 task descriptors (17 mission tasks + отдельный versioned canonical channel).
- Shared runtime/source parity: **20 ESM modules**, **130 asset IDs**, mismatches=[]. SQLite/API host source/runtime parity также проверена.
- Обычная полная MAX-сборка остановлена user-edit guard на `src/journey-guided-reveal.css`; изменённый runtime CSS сохранён. Отдельный shared-only профиль выпускает backend независимо от визуала и не перезаписывает эти файлы. Site canonical content согласован с отдельным Site-builder.
- DB в `apps/stand-service/configs/runtime-data/` исключена из Git и релиза. Реальная пользовательская DB не создавалась; `max-game.json` не добавлялся. Стандартный disabled режим возвращает 503 MAX_BACKEND_DISABLED после явного применения серверной сборки.

## Что остаётся

Этапы 4–5, визуальная часть 8–9 и реальное переключение Site↔WebGL: подключить существующие визуализации к SessionPort/presentation-runtime, проверить изображение/GPU readiness и пользовательские сценарии. Исходная страница `/max-game/shared/index.html` не создавалась согласно последующему указанию не делать отдельный visual stand. Неутверждённые legacy layout mappings, недостающий контент, физическая читаемость и Hokuyo сохраняются отдельными открытыми пунктами.

Backend собран, **не активирован в работающем мастере**. Браузер/визуальная/GPU оценка не проводилась; действующая игра остаётся прежней. Публикации и Git-операций записи не было.

[Текущий контракт](../../apps/max-game/docs/SHARED_BACKEND.md), [SQLite](max-shared-sqlite-20261002.md), [миссии](max-shared-missions-20261002.md), [импорт/комплект](max-shared-migration-bundle-20261002.md), [добавление заданий/renderer](../../apps/max-game/docs/SHARED_EXTENSION_GUIDE.md).
