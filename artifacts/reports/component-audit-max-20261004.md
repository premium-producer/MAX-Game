# MAX: read-only аудит компонента после WAVE07

04.10.2026. Проверены файлы и предыдущие отчёты; новые серверы/тесты/браузер/оборудование не запускались, процессы и пользовательские данные не изменялись. F только чтение. Браузерная проверка — root. URL ниже подтверждены конфигами/прежними отчётами, их текущая доступность здесь не проверена.

## Актуальные источники

| Контур | Источник / runtime / вход | Фактический статус |
|---|---|---|
| Разработка MAX v5 и редактора | `D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/workspace/tasks/max-flow-editor-v3-worktree`, branch `codex/max-flow-editor-v3` | Worktree path/branch прочитаны из `.git/worktrees/max-flow-editor-v3-worktree`; git worktree list заблокирован dubious ownership, настройки Git не менялись |
| Игра v5 | В worktree `artifacts/max-game/src/journey-guided-main.js`, `journey-v5-*.mjs`, `src/reviewed-content/`; runtime `apps/max-game/webgl-v5/` | Реальные Three/maath визуалы и pinned MissionSessionApplication; `journey-v5-backend.mjs:1–6` импортирует reviewed catalog и vendor backend |
| Локальное визуальное превью | `http://127.0.0.1:19441/webgl-v5/?backend=local&layout=wall` | Последний проверенный порт из max-flow-apply отчёта; 8770 тогда был недоступен. Это самостоятельная игра, не управляемое назначение F |
| Клиентский Full HD | `https://futuronika.pro/df/max-game-client/`, зеркало `https://vidrs.ru/df/max-game-client/` | Предыдущая публикация release20261004T101343Z:1920×1080, local IndexedDB, отдельный client1080 namespace; не мастер |
| Редактор | `artifacts/max-game/src/asset-audit/`, scripts/asset-audit-server.mjs; `https://futuronika.pro/df/max-asset-audit/editor/` | v3 черновики, несколько hotspots/buttons, таймер/справки, совместная работа и блокировки карточек |
| Действующий canonical F | `F:/project/VK_DigitalProducts_Stand/artifacts/canonical-max/` | `managed-host.mjs`, `catalog.json`, canonical `artifacts/`, адаптированный `presentation/src/`, собранный `public/`; именно этот каталог указан max-runtime.json, port8783 enabled |
| Мастер F | `F:/project/VK_DigitalProducts_Stand/artifacts/local-master/`; `http://127.0.0.1:8782/max` | max_canonical_port/store/workflows + max_launch_*; schema/workflow4 уже принят WAVE05. WAVE07 surface-lab остаётся отдельным fixture-контуром |

В основном D и worktree совпадают текущие `journey-guided-main.js` и reviewed catalog. **Runtime app.js различается**: worktree `87ed293…`, основной D `07b84f…`; оба имеют соответствующий собственный build.json. Не выбирать runtime только по похожему имени. Для нового переноса фиксировать worktree/build manifest и переносить дельту в F presentation, сохраняя managed-адаптации.

## Что действительно работает

- Один актуальный reviewed-каталог: `missions-reviewed-20261003-abe878cfed89`, **4 миссии / 15 заданий / 70 экранов / 75 действий**. JSON D и F canonical семантически полностью равны; SHA отличаются только сериализацией. Миссии: business, digital-id, communication, blogger.
- Источник принятой разметки: `src/reviewed-content/flow.json`, экспорт 04.10(1), SHA06cdec…; `scripts/apply-asset-flow.mjs` — узкий lossless compatibility adapter. Отключённые экраны и исправление overlap фиксированы. Редакторские изменения не попадают в игру автоматически.
- Ядро: menu → scan → task → result → следующий task / completed; incomplete при пропущенных заданиях и expired отдельно, owner pause и remaining time. Проверка действия по actionId/screenId/revision/contentRevision, неверные ответы не засчитываются. `vendor/backend-figma-v2/src/core/mission-core.mjs:9,15,39–43,51,66–86`.
- Представление имеет дополнительные фазы palm/holding/burst/arrange/reveal/phone-enter/task/phone-exit/paused/branch/complete. Это визуальные фазы, не новые состояния очереди мастера. `journey-guided-main.js:180–190,403–432`.
- Готовые эффекты ядра: MISSION_SELECTED, MISSION_SCANNED, MISSION_EXPIRED, MISSION_RESTARTED, SCREEN_CHANGED, TASK_COMPLETED, TASK_SKIPPED. Application подписка несёт snapshot+effects; отдельно LAYOUT_CHANGED и managed ASSIGNMENT_RELEASED. Это локальные игровые эффекты, не surface composition ACK.
- F managed host уже назначает существующую sessionId, сохраняет игру в SQLite, закрывает player мутации до exact assignment/presented, сообщает реальный presented через `/bridge/presented` → `/max/canonical/presented`. Мастер: tags → ribbon → SCREEN_RIGHT → canonical delivery → awaiting_touch → playing → releasing → terminal/FIFO. `whiteEntity:false` закреплено в max-launch.json.
- F поддерживает cancel/release/status и следующую миссию; неизвестный ACK сверяется по прежнему assignmentId. Это уже реализовано, старый раздел «ещё отсутствует» в AGENT_MAX.md описывает прежний v1 и **не актуален для WAVE07 F**.

## Редактор: готово и предел

`src/asset-audit/main.mjs`, flow-document.mjs, server-store.mjs — schema3, CAS revision, графовая валидация, восстановление IndexedDB. `card-locks.mjs:1–8` использует Verrou MemoryStore, TTL30с/heartbeat8с; это редакторский single-process lock, не owner сцен стенда. Collaboration поддерживает совместную работу, changed-card scope и конфликтные изменения.

Полный игровой исполнитель произвольного v3-графа **не реализован**. Узкий apply-asset-flow отбрасывает неподдержанный экспорт с ошибкой; не надо объявлять любой новый таймер/действие из редактора готовым в игре. FE-01/04/05 и immutable publication остаются отдельной работой по предыдущему отчёту. Не дублировать её в мастерском адаптере.

## Главные gaps для следующего переноса

1. **Не копировать D standalone entrypoint поверх F.** D `journey-guided-main.js:640–647` server profile получает `/api/state` и X-VK-Token, default session `webgl-v5`. F presentation требует assignment/session binding, local player auth, no-create/no-SELECT_MISSION guards, lifecycle terminal и real presented. Сохранять F `presentation/src/application/webgl-session.mjs:5–46` и server-session-port.mjs. Обновлять визуальную дельту с отдельной совместимостью.
2. **SYS07 пока не подключён к настоящим назначениям MAX.** `/surface-lab` имеет fixtureOnly IDs и не освобождает Стеллу. Нужен новый versioned business/surface adapter: exact assignment/plan/session, arch claim не вытесняет нового игрока, ribbon MAX сосуществует с VK, physical composition ACK отдельно. Старые v4 histories не переключать на новые side effects.
3. **BE04 остаётся:** F canonical `mission-session.mjs:77–80` — hold800мс и clock checkpoint5000мс; до5с отката времени при recovery. Pending player commands в server port RAM; durable business receipts не заменяют сохранение неизвестного клиентского запроса. Требуется отдельный bounded recovery-срез, без стирания старых receipts.
4. **Физический ввод/общая стена:** существующие contacts/input-owner/layouts не доказывают LiDAR/TD ввод и кадр на Spout. Single main slot реален; две v5 игровые зоны/два назначения не подтверждены. D автономный/встроенный фон не переносить как независимый SCREEN_RIGHT background — задняя стена один домен.
5. **Стоимость прогрева:** main:690+ прогревает все экраны и pin GPU textures; прежний iPhone audit измерил ~797MiB canvas RGBA +384.76MiB decoded assets, OOM только гипотеза. Для целевого desktop нужен отдельный разумный ресурсный бюджет/визуальная приёмка; новое аппаратное измерение здесь не выполнялось.

## SHA256 ключевых файлов

Относительно worktree MAX:

| Файл | SHA256 |
|---|---|
| artifacts/max-game/src/journey-guided-main.js | e324e3b3b14164fd183ac4661a6d4bfdf91af6ccd3642ae58ac1ae8f5f58f57b |
| artifacts/max-game/src/journey-v5-backend.mjs | 74e38dd5f07e7a5bac099bf8a550b3d58d581f42493486d5f14af4bd0fa4820f |
| artifacts/max-game/src/reviewed-content/mission-catalog.json | 328688c4bff0a6fd0306571a78fd1e8b5d278d3b85d20724900df737bf377409 |
| artifacts/max-game/src/reviewed-content/flow.json | 06cdec0e64dd518230e8439e2092c282f24d73d4ee741005e4710318d8609b08 |
| artifacts/max-game/src/asset-audit/flow-document.mjs | 7f1988d1bb20951cedd4f607ca728476b62ad67ab130e8420718f258716d5519 |
| artifacts/max-game/src/asset-audit/server-store.mjs | 24c5049f912a02ef8995b4ad44801253a4d1efe85359ea32426d9315d72e921d |
| apps/max-game/webgl-v5/app.js | 87ed293c3dc12b67f2e7d317f0c89ef3193998d0110316e5802341f5881e82ab |

Относительно F/artifacts/canonical-max:

| Файл | SHA256 |
|---|---|
| catalog.json | 28f1194f5bf4fd23676cd00aa91bfa41bb206d0e60bfcee98d2f0470e54c43b1 |
| managed-host.mjs | 2817150f80a293cb9f14db41aad489b99fd7f41f8f92fb936ff3fd696a529f6f |
| presentation/src/journey-guided-main.js | 32b84418acbf5cb17722f09ab2181bc8bc1e3f4968621b6ee9256658e2387c25 |
| presentation/src/application/webgl-session.mjs | 347331998e60f4089f82819fda60d809cd224e9fb78b4dfbd04c851833bb5eeb |
| artifacts/max-game/src/application/mission-session.mjs | 43cb10489d23660af7c2274641eb0129923b9f0ba59c03f798b44ee336e3b12b |

Старый `F/artifacts/service/max-game/canonical-source-manifest.json` — историческая передача v1, не единственный источник истины текущего `F/artifacts/canonical-max`; актуальную поставку сверять по WAVE05 handoff/build-manifest и текущим SHA. Новых функциональных PASS этим аудитом не заявляется.
