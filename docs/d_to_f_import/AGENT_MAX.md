# Инструкция агенту MAX

Срез исходников: 03.10.2026. Это рабочая инструкция для разработки компонента в D, а не разрешение на применение к мастеру или публикацию. Общий порядок передачи — [AGENT_INTEGRATION_GUIDE.md](AGENT_INTEGRATION_GUIDE.md); корневой AGENTS.md и последнее задание пользователя имеют приоритет.

## Задача и границы ответственности

Агент MAX развивает игровое представление, каталог, игровой backend и адаптеры **в пределах назначенных файлов D**. Мастер F владеет допуском Стеллы, очередью миссий и назначением на поверхность. MAX владеет подтверждённым прогрессом назначенной миссии, проверкой игровых действий, таймером игры и игровым результатом. Очередь команд внутри SessionPort не является очередью посетителей стенда.

Только ведущий интегратор мастер-проекта переносит компонент в `F:/project/VK_DigitalProducts_Stand`, меняет мастерские контракты/БД/TODO и применяет сборку. Агент MAX читает F для совместимости; root отдельного чата не получает права записи. Не создавать второй master admission/queue в D и не освобождать Стеллу локальным таймером анимации.

## Что читать перед правкой

1. Последние записи [WORKLOG](../WORKLOG.md), назначенную задачу общего [BACKLOG](BACKLOG.md), текущую [архитектуру](ARCHITECTURE.md).
2. [Локальный AGENTS](../artifacts/max-game/AGENTS.md), [max-game-development](../artifacts/skills/max-game-development/SKILL.md), актуальные записи [DEVELOPMENT](../apps/max-game/docs/DEVELOPMENT.md).
3. [SHARED_BACKEND](../apps/max-game/docs/SHARED_BACKEND.md), [WEBGL_BACKEND](../apps/max-game/docs/WEBGL_BACKEND.md), [SHARED_EXTENSION_GUIDE](../apps/max-game/docs/SHARED_EXTENSION_GUIDE.md), затем реальные imports выбранного entrypoint.
4. При брендовых изменениях — max-brand и пакет `artifacts/DESIGN/BRANDS/MAX`; при движении — профильные skills из локального AGENTS. Перед работой с общим мастером — vk-master-startup; перед визуальной проверкой — vk-live-verification и применимые reference/neon skills. Чтение документа не разрешает запуск общего мастера.
5. Read-only F: `artifacts/contracts/max-assignment-v1.md`, `artifacts/service/max-game/README.md`, `canonical-source-manifest.json` рядом с ним, актуальные `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `TODO.md`.

Документы содержат исторические записи. Например вводная SHARED_BACKEND ещё описывает 84 экрана исходного Figma v2, тогда как текущий v5 local использует reviewed-каталог на 70 экранов. Не исправлять поведение по устаревшей строке без сверки кода и свежего отчёта.

## Карта исходников и сборок

| Область | Действующий путь / правило |
| --- | --- |
| v5 WebGL entrypoint | `artifacts/max-game/src/journey-guided-main.js`; профиль `data-visual=webgl-bfm-v5`, SharedRevealJourney/V5RevealJourney и общий `journey-webgl-ui.mjs` |
| v5 представление | `src/journey-v5-*.mjs`, `src/journey-bfm-*-paint.mjs`, `public/webgl-v5/`; общий entrypoint/UI обслуживает другие профили, поэтому считается точкой совместного владения |
| Текущий v5 каталог | `src/journey-v5-backend.mjs` импортирует `src/reviewed-content/mission-catalog.json`; исходная пользовательская разметка — `src/reviewed-content/annotations.json` |
| Производный reviewed-контент | `scripts/apply-asset-annotations.mjs`; использует существующие валидаторы. Не редактировать сгенерированный JSON в обход исходной разметки/компилятора |
| Pinned v5 engine | `artifacts/max-game/vendor/backend-figma-v2/`, собственные manifest/provenance; не править vendor вручную |
| Разрабатываемое общее ядро D | `src/core/`, `src/contracts/`, `src/application/`, `src/content/`, `src/migration/`; изменение этого дерева не означает автоматическое обновление pinned v5 vendor |
| Серверный адаптер D | `artifacts/service/max-game/backend.mjs`, `http-api.mjs`, `sqlite-persistence.mjs`, `sqlite-worker.mjs`; назначается отдельно от визуальной задачи |
| Runtime | `apps/max-game/`; изменяется сборщиками, документация приложения — `apps/max-game/docs/` |
| Узкая сборка v5 | `node artifacts/max-game/scripts/build-webgl-v5-runtime.mjs`; проверяет vendor/asset SHA, reviewed-каталог и защищает изменённый runtime |
| Общий backend bundle | `node artifacts/max-game/scripts/build.mjs --shared-only` |
| Полная игра | `node artifacts/max-game/scripts/build.mjs`; не запускать для каждой локальной v5-правки, поскольку затрагивает другие представления |
| Подготовка релиза контента | `scripts/build-figma-backend.mjs`, `check-figma-backend.mjs`, `prepare-v5-icons.py`; выполнять только при задаче обновления релиза, не как рутинный rebuild визуала |
| Исторические реализации | `upstream/`, прежние circular/main и старые visual profiles — сохранённые версии, не второй основной исходник |

Все команды выше даны относительно корня D/worktree. Сборка пишет runtime этого checkout и сама по себе не является приёмкой F. Не запускать `npm start` из package.json как обход штатного запуска. Не публиковать Selectel без нового запроса пользователя.

## Что действительно существует сейчас

Текущий local v5 использует `missions-reviewed-20261003-c8692a4d2698`: 4 миссии, 15 заданий, 70 эффективных экранов, 73 размеченных действия и 33 настройки экранов. Доказательство — [проверка применения разметки](../artifacts/reports/max-annotation-gameplay-20261003.md). Старые каталоги 6 миссий и Figma v2 остаются отдельными редакциями, не должны молча подменяться.

Local v5: `createIndexedDBPersistence` через idb 8.0.3, ключ включает contentRevision и sessionId. Импорт из прежнего localStorage выполняется только при отсутствии записи IndexedDB, старые записи не удаляются. `backend=local` — явный профиль разработки, **не fallback при потере серверного backend**. Server SessionPort сохраняет последний экран/неподтверждённый commandId и приостанавливает ввод при обрыве.

Общие механизмы single/two существуют в прежнем Journey и геометрии `circle-model.mjs`. Это не доказательство готовности v5 двухзонного сценария или нескольких игровых слотов мастера. F `max-assignment/v1` сейчас принимает только `slotId: "main"`. Добавление второй зоны требует отдельного решения по двум sessionId, input owner, координатам, восстановлению и правилам очереди; нельзя просто удвоить визуальный контейнер и объявить масштабирование завершённым.

MAX — учебный сценарий, не клиент настоящего MAX API: не создавать реальные аккаунты, ID, звонки или заказы. Имена сервиса в UI и документации — только MAX.

## Контракт MAX ↔ мастер: сохранять разделение

| Контур | Существующее поведение / ограничение |
| --- | --- |
| Game commands | `schemaVersion:1`, `commandId`, `sessionId`, `contentRevision`, `expectedRevision`; каталог/mission/task/screen/action IDs стабильны внутри версии. `SELECT_MISSION`, `ACT`, `ADVANCE_RESULT`, `RETURN_MENU`, `RESTART_MISSION`, `RESET_PROGRESS` — реальные типы; их допустимость определяется ядром |
| Trusted commands | `HOLD_CONFIRMED`, `OWNER_CHANGED`, `EXPIRE`, `AUTO_SCREEN` присутствуют в общем контракте, но не являются разрешением renderer присылать подтверждённое удержание/время/итог. Ввод проходит доверенный Application/host |
| Player input | D HTTP `/api/max-game/v1/sessions/:id/...`: commands/events/input-owner/contacts/layouts. Контакты down/move/up/cancel, sequence/contactId; без клиентского `scanPassed` и timestamp. Lease и авторизация сохраняются |
| Render view | Snapshot/ViewDescriptor выдаёт устройство, actions, nodes, edges, prepareNext и результат. Renderer не вычисляет ответ по скрытому outcome, не записывает completed/nextState напрямую |
| Layout | Собственная layout revision/receipts. Кадровая анимация не меняет бизнес-revision; сохранение позы не засчитывает задание |
| F control assignment | POST `/api/max-game/v1/assignments`, GET `/assignments/:id`, GET `/slots/main`; control-authorize отдельно от player lease. Receipt `status:"accepted"` означает SQLite commit назначения и scan-миссии |
| Ещё отсутствующие этапы F | accepted не означает renderer-ready, видимый показ или завершение игры. release/cancel назначения, FIFO, второй запуск/слот и связь с готовым UI не реализованы принятым v1 |

При неизвестном исходе назначения мастер читает тот же assignmentId и повторяет тот же payload. Не генерировать новый assignmentId, не обходить generation/CAS и не сбрасывать сессию, чтобы скрыть конфликт версии. События будущих `renderer-ready`, доставки стартовой анимации, release и завершения требуют утверждённого контракта интегратора; приведённые термины — этапы сценария, **не имена существующих API**.

Требуемый сценарий мастера: при занятой игре — FIFO без лимита длины и освобождение Стеллы после постановки; при свободной — после доставки анимации и фактической готовности миссии. Следующая миссия ждёт касания, по умолчанию 60 с, параметр изменяемый; играет тот, кто приложил руку. Эти правила нельзя выдавать за готовую возможность local v5. Визуальный countdown не управляет очередью самостоятельно.

## Особая защита уже перенесённого backend F

F `artifacts/max-game/src/` и `artifacts/service/max-game/` — **canonical subset с мастерскими изменениями**, перенесённый из baseline `artifacts/backend-probes/max-handoff/vendor`. В F добавлены атомарные session + receipt + slot, отдельная control-авторизация и SQLite migration schema 1→2. Исходный vendor, основной D engine и текущий local v5 — разные версии, а не взаимозаменяемые копии.

Перед backend-задачей интегратор фиксирует базовые SHA из F `canonical-source-manifest.json` и целевые контракты. Агент получает ограниченный patch/задачу в D и возвращает delta. Нельзя заменить F каталог/SessionApplication/worker целым каталогом D или pinned v5 vendor. Совместимость нового reviewed-контента с canonical F и перенос мастерских адаптаций в общий компонент — отдельная задача, сейчас не подтверждены.

Требование полного восстановления включает игровой прогресс и таймер. Подтверждённый текущий checkpoint MAX допускает до 5 с отката времени; целевой F BE-04 требует до 1 с и остаётся открытым. Запретить стирание receipts ради уменьшения записи: restore использует replay.

## Файловое владение задачи

До старта получить task ID, worktree/ветку, точный baseline, allowlist файлов, профиль и renderer/session IDs, назначенные тестовый порт и каталог данных. `src/journey-guided-main.js`, `journey-webgl-ui.mjs`, общие CSS, application/contracts, сборщики, package/lock — потенциальные общие точки: не расширять область самостоятельно.

Обычно визуальная задача получает конкретные `journey-v5-*`, `public/webgl-v5/*` и профильные тесты; контентная — annotations/компилятор/каталог/fixtures; backend-задача — отдельный согласованный список core/application/service. Это шаблон разграничения, не автоматическое право править всё перечисленное.

Исключены: F целиком на запись; живые конфиги/DB/профили браузера; корневые AGENTS/WORKLOG/общие docs без владельца интеграции; Stand Service routing/workers; общее клеточное поле/TD-маски/Spout; другая игра, Стелла и assets чужого агента. Задняя стена — общий домен 7168×1280 до crop: игровая задача не вправе создавать независимый фон правой половины. Изменение общего фонового адаптера согласовывается с визуальным агентом.

## Проверка и передача

Перед сборкой — duplicate guard `python artifacts/web/tools/check_project_duplicates.py`; изменённые JS/MJS — `node --check`. Сборка/проверка в выделенном checkout не должна записывать общий рабочий runtime. Лицензии и готовые зависимости сохраняются; актуальные pins — package-lock, не список из старого отчёта. Сейчас основные зависимости: Three 0.185.1, maath 0.10.8, idb 8.0.3; их notices входят в передачу.

Выбирать проверки по затронутому контракту, не гонять весь GPU-стенд:

- Контент: `artifacts/max-game/test/annotated-gameplay.test.mjs`, `webgl-v5-final-backend.test.mjs`; все миссии/ветки, ручные hotspots/автоэкраны, missing/skip не становится успехом, стабильные IDs и другая contentRevision.
- Persistence/recovery: `indexeddb-persistence.test.mjs`, `webgl-v5-recovery.test.mjs`, `shared-migration-bundle.test.mjs`, `shared-layout-restore.test.mjs`; fixtures — `src/development/shared-fixtures.mjs`, изолированная новая БД/сессия, никаких копий данных посетителей.
- Session/API: `shared-session-port.test.mjs`, `shared-server-session.test.mjs`, `shared-mission-logic.test.mjs`, `artifacts/service/max-game/*.test.mjs`; проверка потери ответа после commit, точного повторного commandId, stale revision/content/owner, restart и отсутствия silent fallback.
- Визуал: соответствующий `webgl-v5-*.test.mjs`, затем короткий IAB-проход на отдельной QA-сессии: выбранный профиль → миссия → удержание/действие → видимый результат → reload/recovery; ошибки консоли, сохранение состояния и освобождение ресурсов. Проверки отдельных phase/material не заменяют полный проход.

Node CPU-тесты запускать через `node --test --test-isolation=none <явный список файлов>`. F assignment regression выполняет интегратор против объединённого canonical-кандидата. Тяжёлые GPU/нагрузочные проверки требуют отдельного разрешения по AGENTS; запись видео также. Настройка общего мастера через apps/STARTUP — зона согласованного владельца, не каждого исполнителя.

Передача интегратору включает: task ID/allowlist; commit или SHA каждого изменённого source; базовые F/D SHA; content/schema/rules/record/контракт версии; diff без generated/runtime мусора; manifest ассетов и происхождение/лицензии; defaults и явную миграцию; точные команды и результаты, QA session/URL, консоль и кадр при визуальной правке; совместимость старых сохранений; нерешённые ограничения и способ отката. БД посетителей/токены/секреты в пакет не входят.

Раздельно отмечать: **код проверен**, **runtime собран**, **изолированная интеграция проверена**, **принято/применено в F**, **художественно утверждено пользователем**. Агент компонента не объявляет последние два статуса за интегратора/пользователя.
