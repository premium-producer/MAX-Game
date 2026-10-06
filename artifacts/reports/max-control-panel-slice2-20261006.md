# MAX control panel — независимые ассеты, этап 2

06.10.2026. Изолированный кандидат в `artifacts/workspace/tasks/max-control-panel-20261006/code`, ветка `codex/max-control-panel-20261006`. Стенд/F не изменялись. Браузерные проверки не проводились по прямому запрету пользователя. Это продолжение этапа 1, не завершение всего четырёхрежимного плана.

## Реализация

- MASTER: режим assets, сохраняемая сцена, CAS, неизменяемые квитанции команд, allowlist каталога, транзакционная миграция SQLite. Существующие admissions, очередь, show и canonical game сохраняются.
- Панель: каталог 70 изображений устройства и 18 иконок, независимые переключатели видимости устройства/группы иконок, до восьми экземпляров, enabled/side/порядок/удаление. Черновик с явным применением; конфликт оператора не стирает его. HTTP422/413 — определённый отказ, timeout/5xx — ручной повтор исходной команды.
- MAX_RIGHT: независимая сцена в существующем game tick и WebGL foreground. Центр устройства2048,640; текущие оболочка/иконки/инерция maath. Линки отсутствуют; скрытое устройство сохраняет виртуальные bounds. Перестроение относительно пропорций ассета и пропорциональное уменьшение при переполнении.
- При смене ассета сохраняются готовность ресурсов и последовательный morph. Независимый review обнаружил гонку A→B→C во время перехода; исправление ожидает освобождения morph перед стартом подготовленного последнего перехода.
- Новая сцена не создаёт фиктивные сессии и не изменяет разметку. Загрузка новых файлов и прямой операторский ID→видео остаются следующими короткими этапами.

## Источник и границы

MASTER/control/MAX adapter продолжают закреплённый baseline этапа1. Live game bundle SHA `9a9ee6d05464f6d699610f741cf5271c591fd7a0c61bf1a062838f669a119bb7` соответствует `max-mobile-control-20261005/worktree/artifacts/max-mobile-control/candidate-wall/app.js`. Игровой donor использует именно исправленный mobile entry candidate-wall/journey-guided-main.js; старый accepted-source entry не заменяет его.

Каталог сформирован из принятого mission-catalog; SHA всех70 raw screens и18 icons совпали с закреплённым MAX_RIGHT accepted-source. Все18 icons имеют glyph manifest с соответствующим sourceSha256. Новые зависимости не устанавливались: используются прежние Three/maath, DBOS/SQLAlchemy/SQLite и панель vanilla JS. Исследовательское основание — [библиотеки](../../docs/Research/max-control-panel-libraries-20261006.md), [план](../../docs/Research/max-control-panel-plan-20261006.md).

Три субагента владели раздельно MASTER, renderer и UI; root интегрировал gateway/каталог/комплект. После реализации выполнены перекрёстные read-only review. Общие runtime/F/live-файлы не редактировались.

## Проверка

- MASTER25/25 DBOS/SQLite/HTTP tests PASS, включая все15 первого этапа; CAS, конкуренция, общий namespace receipts, independent visibility, busy/admission, реальная stage1 schema migration и rollback при инъекции ошибки.
- Полный app.py/server.py: два hard kill и три boot PASS; настройки и receipts сохраняются, прежний ACK отвергается. QA runtime/data изолированы; canonical child и media providers выключены.
- UI18/18 CPU/DOM-model tests PASS, без браузера. Защита endpoint через Host/Origin/CSRF и fenced role:4/4 HTTP tests PASS.
- Сквозная проверка `code/integration-assets.mjs`: UI controller → реальный fleet HTTP → полный MASTER/DBOS/SQLite → role gateway → реальный local adapter HTTP → presentation client PASS. Подтверждены режим assets, независимые флаги, сохранение неактивной сцены, lost-response retry без повторного изменения, stale CAS/ACK. Несвязанные audio/media handlers изолированы заглушками. Применение GPU в этом тесте не моделирует физическую стену.
- QA backend65320 остановлен, слушателей на порту нет.
- MAX adapter/host18/18 и независимая сцена7/7 PASS. Проверены empty scene/render-ready, независимая видимость, порядок от устройства,8-instance fit, rapid morph replacement, отмена decode, reversal во время fade, восстановление после decode/GPU ошибки, owner fence и запрет преждевременного показа. Scene-тест использует jsdom/CSS-flex модель и заглушку GPU/settling; реальный WebGL не исполнялся.
- Итоговый Node набор47/47 PASS (`node-assets-tests.log`), вместе с Python25/25 — **72/72**. Полные restart smoke и сквозной HTTP тест идут отдельно. Первому запуску Node sandbox запретил дочерний esbuild (`spawn EPERM`); повтор после штатной автоматической проверки разрешения прошёл, браузер не использовался.
- Duplicate guard PASS. Bundle1846994байта, SHA256 `72eb01ed0a9880ea2a7d402b71bda66c13919442817dbc879be9ff2fc65a2413`. Перед сборкой все неизменённые входы сверены с accepted donor manifest, включая общие D ribbon/service и F glyph manifest; расхождений нет. Точные входы и разрешённые изменения — `code/game/dist/build-manifest.json`.

Доказательства внутри каталога задачи: `code/master/ASSETS_REPORT.md`, `code/master/assets-test-results.log`, `code/master/full-assets-smoke-result.json`, `code/master-control/test/UI-REPORT.md`, `code/master-control/test/INDEPENDENT-REVIEW.md`, `code/game/REPORT.md`, `integration-assets-result.json`. Замеры GPU/Spout/TD, визуальная самопроверка и пользовательская приёмка не выполнены.

## Поставка

`build-assets-delta.py` и `verify-assets-delta.py` собирают отдельные `delta-assets/`, `assets-delta-manifest.json`, `max-control-panel-slice2.zip`. Комплект совокупный: содержит оба этапа. Первый `delta/` и архив этапа1 сохранены. Рабочие исходники code продолжают этап2; старый build-delta.py не использовать для воспроизведения исторического архива.

Итог:29 файлов,2174250байт; ZIP569864байта, SHA256 `c4303cd2e10eb71cfc0019654c0535240e97fda575d8ab7973df6ea8dc1eff24`. Syntax26 файлов, импорты и SHA всех29 файлов PASS; изменены только три asset PIN (`app.js`, `host.mjs`, `presentation.mjs`), остальные media PIN сохранены. Отчёт проверки — `assets-package-check.json`. Архив не передавался на стенд; payload будущей однократной передачи около0,570МБ без накладных расходов.

Каждый файл имеет expectedPreviousSHA256 исходного baseline. За время работы MASTER/F обновлялись другой задачей: будущий интегратор обязан свежей сверкой и адресным merge сохранить её изменения. Этот архив нельзя массово накладывать поверх новой MASTER-сборки. Пользовательские базы, разметки, медиа, секреты и глобальный фон не входят в поставку.

Трафик SIM: RX не измерено; TX не измерено; всего не измерено; учёт: не измерено; основание: 0 МБ передачи файлов на стенд, локальные исходники/кэш/localhost; общий WAN и облачные вызовы не измерены. Чтение baseline этапа1 уже учтено и повторно не списывается; остаток: неизвестен.
