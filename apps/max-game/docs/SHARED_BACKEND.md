# MAX — общий backend: реализация по этапам

## MAX v5/local — подключённый Figma v2 (03.10.2026)

`/max-game/webgl-v5/?backend=local&layout=wall` использует `src/journey-v5-backend.mjs`, экспортирующий готовые каталог и SessionPort из `vendor/backend-figma-v2`. Версия: `missions-figma-20261003-151916-v2`,4миссии/15заданий/84экрана. Старые6миссий сохраняются в прежних редакциях. Browser persistence key:`max-site-shared:v1:v5:missions-figma-20261003-151916-v2`. Прежние ключи не меняются.

Пакет устанавливается из проверенного `artifacts/workspace/dist/max-shared-backend-20261003-151916-v2`; vendor — постоянная входная зависимость сборки. Не редактировать его вручную. Перед обновлением устанавливать согласованный релиз с его manifest и provenance. `py -3 artifacts/max-game/scripts/prepare-v5-icons.py` готовит plain-SVG из исходных значков (без справочных подписей), затем `node artifacts/max-game/scripts/build-webgl-v5-runtime.mjs` проверяет все129SHA пакета, glyph provenance и собирает только v5. Производные значки сохраняют источник и SHA в `webgl-v5/icon-glyphs/manifest.json`. UI использует исходные названия каталога, а не контуры текста SVG. Native градиенты остаются материалом renderer.

Серверный профиль не обновляется этой сборкой и не заявляется совместимым с новым каталогом.33экрана имеют временные below-screen actions до разметки точных hotspots. [Проверка и точный URL](../../../artifacts/reports/max-v5-final-backend-20261003.md).

03.10.2026 — **отдельный релиз v2**: `artifacts/workspace/dist/max-shared-backend-20261003-151916-v2`. Иконки только из `artifacts/DESIGN/UI/max`; назначения в `artifacts/max-game/scripts/max-icon-selection.json`. ViewDescriptor: `nodes[].icon`, `missions[].icon`, `icons` (scan/restart/open-max/fallback). Ресурс с `hasEmbeddedLabel=true` уже содержит подпись: не дублировать её в renderer. Неизвестная роль использует красный вопрос в квадрате. 84 экрана сохранены; текущие страницы не переключены. Сборщик `build-figma-backend.mjs` теперь выпускает v2, v1 сохранён. [Карта и проверки](../../../artifacts/reports/max-backend-icons-20261003.md).

03.10.2026 — собран **отдельный неактивированный** комплект `artifacts/workspace/dist/max-shared-backend-20261003-151916` по финальной выгрузке: 4 миссии/15 заданий/84 экрана/19 иконок + QR. Внутри комплекта `src/application/mission-session.mjs` по умолчанию использует новый каталог `missions-figma-20261003-151916-v1`; нужен явно выбранный PersistencePort и отдельные сессии. Ассеты относительно корня комплекта, происхождение в `content-source.json`. Сборка: `node artifacts/max-game/scripts/build-figma-backend.mjs`; проверка пакета: `node artifacts/max-game/scripts/check-figma-backend.mjs`. Новые неизвестные hotspots пока представлены действием под экраном; иконки доступны в каталоге, renderer-подключение остаётся отдельным шагом. Старые страницы и каталоги не переключены. [Проверки и ограничения](../../../artifacts/reports/max-backend-figma-release-20261003.md).

02.10.2026 — WebGL Guided Reveal подключён opt-in к тому же SessionPort и каталогу v2, что Site. Общий local профиль/session сохраняет смысловое состояние при последовательной смене renderer; каждый renderer имеет собственное координатное пространство в общей записи layout. Старые страницы сохранены, мастер/API не активирован. [Запуск и контракт](WEBGL_BACKEND.md), [CPU/runtime проверка](../../../artifacts/reports/max-webgl-shared-integration-20261002.md). Ниже записи предыдущих итераций.

02.10.2026 — следующий локальный этап завершён: существующая Site подключена к MissionSessionApplication через SessionPort, без отдельного визуального стенда. Каталог обновлён до `missions-20261002-v2`: 6 миссий/16 заданий, последовательный бизнес и общение без группы. Site поддерживает явный local preview с Browser PersistencePort и отдельным key, optional server без fallback; работающий мастер не активирован. WebGL отложен по указанию пользователя. [Сверка и границы](../../../artifacts/reports/max-site-shared-integration-20261002.md), [эксплуатация Site](SITE_GAME.md).


## Текущее состояние: общий backend шести миссий

По поручению 02.10.2026 блоки плана выполнены параллельно с приоритетом логики. Реализованы backend-части этапов 6–12; этапы 1–3 сохраняются. Сначала визуальные этапы были отложены; затем существующая Site подключена локально (запись выше). Отдельная страница/стенд визуала не создавались, WebGL и мастер не переключены. [Сверка плана и проверок](../../../artifacts/reports/max-shared-backend-integration-20261002.md).

[Mission каталог](../../../artifacts/max-game/src/content/mission-catalog.mjs) содержит 6 миссий/16 заданий, последовательные бизнес-инструменты и public/private; [валидатор](../../../artifacts/max-game/src/contracts/mission-catalog.mjs) проверяет ссылки/действия/геометрию. Инструкции и manifest ассетов общие; missing/skip не дают успешного зачёта. [Mission Core](../../../artifacts/max-game/src/core/mission-core.mjs) получает каталог аргументом. [Mission SessionPort](../../../artifacts/max-game/src/application/mission-session.mjs) владеет очередью/clock, подтверждает 800 мс доверенного контакта, таймером и результатом. Один контакт, раннее отпускание/выход/cancel отменяют удержание. ViewDescriptor не выдаёт outcomes/receipts, поддерживает phone/PC, nodes/edges/prepareNext и QR.

Record v2: `schemaVersion`, `mission`, `layouts`, `clockCheckpointAt`. Layout base имеет отдельные revision/receipts; его запись не увеличивает GameState revision. Анимационные позиции не сохраняются. Clock checkpoint пишется не чаще раза в 5 с во время активного отсчёта. При server restart остаток восстанавливается по подтверждённому checkpoint, возможен возврат до 5 с неподтверждённого времени; downtime его не расходует. Новый lease возобновляет игру без повторного сканирования.

[SQLite PersistencePort](../../../artifacts/service/max-game/sqlite-persistence.mjs) исполняет SQL в worker: CAS, snapshot/ledger одной транзакцией, ответ после commit, close/drain, online backup. Одна JSON-запись является authority; отдельные копии processed_commands/completion_receipts не создавались. saveOnce и createImported/getImportTarget сохраняют архив и принадлежность импортированной сессии атомарно. SQLite проверен в фактическом Electron, автоматического fallback нет.

[API](../../../artifacts/service/max-game/http-api.mjs) и [host](../../../artifacts/service/max-game/backend.mjs) встроены в Stand Service отдельно от VK Видео `/api/journey`. Записи требуют существующий X-VK-Token и input lease; стандартные Host/Origin guards сохраняются. Команды/lease/contacts сериализованы на сессию. Contacts не принимают клиентские timestamps/scanPassed. SSE отправляет подтверждённые snapshots и отключает слишком медленного consumer.

[Сетевой SessionPort](../../../artifacts/max-game/src/application/server-session-port.mjs) после reconnect читает snapshot и повторяет неподтверждённый commandId. При обрыве сохраняет экран и приостанавливает ответы; close освобождает lease до передачи следующему renderer. Начальный snapshot обновляется после получения владельца, поэтому его semantic revision пригодна для первого ответа. Никакого переключения на localStorage/memory. [Импорт/расширения](SHARED_EXTENSION_GUIDE.md), fixtures, архитектурный guard и shared manifest включены в комплект. Неизвестные legacy stages не становятся ответами, исходник архивируется; старые координаты без утверждённого mapping не применяются.

### API и включение

Без `apps/stand-service/configs/max-game.json` backend выключен. Возможная конфигурация (в этом проходе **не создавалась**):

```json
{"schema":"max-game-backend/v1","enabled":true,"profile":"sqlite","database":"max-game.sqlite"}
```

DB только в `apps/stand-service/configs/runtime-data/`; сборка её не включает/не перезаписывает, Git игнорирует каталог. Включение мастера — отдельное применение; отключённый API возвращает 503 MAX_BACKEND_DISABLED.

```text
GET  /api/max-game/v1/catalog
POST /api/max-game/v1/sessions
GET  /api/max-game/v1/sessions/:id
POST /api/max-game/v1/sessions/:id/commands
GET  /api/max-game/v1/sessions/:id/events
POST /api/max-game/v1/sessions/:id/input-owner
POST /api/max-game/v1/sessions/:id/contacts
PUT  /api/max-game/v1/sessions/:id/layouts/base
```

Create: `{sessionId}`. Command body `{owner,command}`, где command содержит schemaVersion=1, type, commandId, sessionId, expectedRevision, contentRevision и поля типа. Acquire `{action:"acquire",ownerId,acquisitionId}`, renew/release `{action,owner}`. Lease содержит ownerId/generation/token/expiresAt/serverTime, срок 15 с. Contacts `{owner,event:{contactId,sequence,type,inside}}`; только down/move/up/cancel. Layout body `{owner,command}`, type SET_LAYOUT, layoutId base, expectedLayoutRevision и positions.

CPU/изолированный HTTP transport и headless Electron проверены; работающий мастер/GUI/GPU не запускались. Реальная смена Site↔WebGL, physical readability и Hokuyo ждут подключения существующих визуализаций и стендовой проверки.

### Независимая сборка

`node artifacts/max-game/scripts/build.mjs --shared-only` обновляет только общий backend и его manifest, сохраняет все файлы renderer и пользовательские правки. Service builder включает host/SQLite worker. Полная legacy-сборка в этом проходе остановилась на защите изменённого runtime CSS; backend-комплект выпущен отдельно. Это не активация в работающем мастере.

## История малых этапов

02.10.2026 — параллельный изолированный слой клиентских правок `src/content/client-review.mjs` перечисляет шесть маршрутов, устойчивые task IDs, медиа и явные пробелы. Site читает его для последовательности узлов. Это не новый GameState и не обход SessionPort; остальные задания ещё не исполняются общим backend. При переносе заданий каталог будет развернут в проверяемые TaskCatalog с экранами и командами.

02.10.2026. Основа — [архитектурное решение](../../../docs/Research/max-game-shared-backend-20261002.md) и [аудит](../../../artifacts/reports/max-shared-backend-audit-20261002.md).

Последнее уточнение пользователя: сначала реализовать логику/backend, затем перенести визуал. Отдельный стенд для разработки визуала не создавать. Контракты renderer сохраняются в целевой архитектуре, но страницы/адаптеры отложены; следующие этапы — SessionPort, хранение и API.

## Реализован этап 3: Application / SessionPort

[SessionPort](../../../artifacts/max-game/src/application/session-port.mjs) предоставляет асинхронные createSession, getSnapshot, sendCommand, subscribe и close. Каталоги регистрируются по contentRevision/taskId, копируются и фиксируются; приложение владеет сессией и последовательно исполняет её команды. Очереди разных сессий независимы. Команда копируется до постановки в очередь, поэтому вызывающий код не может изменить ожидающее действие.

`createSessionApplication({catalogs, persistence, onObserverError})` требует явный PersistencePort. Его load возвращает `{version, record}` либо null; create возвращает версию 0, commit с expectedVersion возвращает следующую версию после атомарной замены записи. SessionRecord разделяет GameModel и layouts. Изменение layout и presentation-состояния не реализовано в этом срезе: layouts пока пустой раздел, непустой сохранённый layout отвергается явно до этапа раскладки. Позиции не записываются в GameState. Временные loading/motion/готовность рендера по-прежнему не сохраняются.

Хранилище в памяти [Memory PersistencePort](../../../artifacts/max-game/src/application/memory-persistence.mjs) — только явно выбранный недолговременный профиль. `createLocalSessionPort({catalogs})` создаёт его для headless-разработки логики, не визуальный стенд. Перезапуск Application поверх той же storage-инстанции восстанавливает данные; завершение процесса их теряет. SQLite и физический перенос остаются следующим этапом. Автоматического серверного fallback к memory/localStorage нет.

Принятая команда сначала записывает GameState вместе с receipts. Только после корректного подтверждения commit публикуются snapshot/effects и ответ. Ошибка записи не продвигает локальный state; после неопределённого исхода кеш сбрасывается, повтор читает подтверждённый record. STORE_CONFLICT не перезаписывает чужой результат: возвращается актуальный snapshot, команда автоматически не пересылается на новый этап. Поддерживается один Application-владелец сессии; leases/межпроцессные подписки относятся к серверному этапу. CAS служит дополнительной защитой от второго устаревшего writer.

Ответ sendCommand содержит исторический reply ядра и отдельный актуальный snapshot. Повтор не публикует effects и не откатывает текущий экран. Snapshot — immutable JSON с state/layouts/view, без доступной клиенту таблицы receipts. subscribe асинхронно возвращает unsubscribe и сначала выдаёт актуальный snapshot с пустыми effects; затем только подтверждённые изменения. Ошибка sync/async слушателя передаётся onObserverError и не ломает игру. close отменяет ещё не начатые операции/подписки, ждёт уже начатую запись и не публикует поздние события; ранее начатую запись не откатывает.

[ViewDescriptor](../../../artifacts/max-game/src/application/view-descriptor.mjs) содержит устройство/ассет/аннотации, информационную инструкцию, разрешённые действия и ближайшие ресурсы для подготовки. Действия не раскрывают outcome: renderer отправляет actionId, а переход решает ядро. У завершённого задания нет активных кнопок. Поля graph/node/edge всей миссии появятся вместе с оркестрацией, не выдумываются для текущего среза.

При повторной сверке этапов 1–2 исправлены два дефекта: null answer больше не проходит проверку и shallow-frozen каталог получает deep freeze вложенных данных. PASS: 82/82 CPU-проверки всех трёх этапов (26 каталог, 39 ядро, 17 Application). [Отчёт этапа 3](../../../artifacts/reports/max-shared-backend-stage3-20261002.md).

### Сверка оставшегося плана

Этапы 1–3 реализованы в source, без подключения текущего визуала. Следующие — совместимость host/SQLite worker и отдельный API MAX. Затем scan/timer/оркестрация/reset, остальные задания, импорт и полный комплект. Изменение ручной раскладки относится к этапу 9; input leases к этапу 7. Site/WebGL и клиентский сетевой runtime перенесены после готовности логики по новому указанию пользователя. Ни один из этих будущих этапов не отмечен реализованным.

## Реализован этап 2: чистое ядро действий

[Game Core](../../../artifacts/max-game/src/core/game-core.mjs) работает с переданным TaskCatalog, не импортирует конкретную миссию или renderer. В первом срезе GameState описывает одно активное задание; оркестрация всей миссии/таймер/сканирование появятся последующими этапами. Версии: schemaVersion=1, rulesRevision=task-rules-v1, contentRevision из каталога.

Интерфейс:

- `createGameModel(catalog, {sessionId, scenarioId})` создаёт immutable состояние без ответов и зачёта; scenarioId по умолчанию guided-reveal.
- `dispatchGameCommand(catalog, model, command)` возвращает `{model, reply, effects, duplicate}`. `reply.snapshot` — состояние на момент принятия команды, а `model.state` — актуальное состояние. Старый повтор не должен откатывать клиент на исторический reply.snapshot.
- `restoreGameModel(catalog, raw)` принимает новый JSON-формат, проверяет последовательность смысловых подтверждений и совпадение снимка; возвращает `{ok, model}` либо ошибку с model=null. Это проверка согласованности данных, не криптографическая аттестация действий пользователя. Исторические stage/localStorage в этом формате не импортируются.

[GameCommand](../../../artifacts/max-game/src/contracts/game-command.mjs) v1 содержит ACT, commandId, sessionId, contentRevision, missionId, taskId, screenId, expectedRevision, actionId. Других типов пока нет. nextState/answers/completed от вызывающего кода запрещены. Порядок полей нормализуется; повтор идентичного commandId возвращает прежний reply без effects, повтор ID с изменённой командой отклоняется.

GameModel разделяет GameState и receipts. Новая допустимая команда увеличивает revision и сохраняет подтверждение. Действие выбора на том же экране записывает ответ и не теряется; переход/зачёт определяется каталогом. Приход на created сам по себе не выполняет задание. Единственное событие TASK_COMPLETED появляется при первой принятой команде завершения; повтор после JSON restore не выдаёт второе событие.

Неверные контекст/content/revision/screen, недоступное действие и новая попытка завершить уже выполненное задание возвращают отказ без изменения модели. Snapshot не содержит elapsed, loading, texture, позиции или анимационные фазы. Ядро не использует clock, сеть, браузер, storage или независимые таймеры. Сохранение ответа и receipt одной транзакцией — обязанность будущего PersistencePort; текущий чистый reducer не обещает долговременный commit.

PASS этапа 2: 39 новых CPU-проверок ядра, тогда вместе с этапом 1 — 63/63. [Отчёт этапа 2](../../../artifacts/reports/max-shared-backend-stage2-20261002.md). Application/SessionPort добавлен на этапе 3; текущая игра пока не подключена к ядру.

## Реализован этап 1: контракт и каталог канала

Исходный [контракт](../../../artifacts/max-game/src/contracts/task-catalog.mjs) определяет TaskCatalog, TaskScreen, TaskAction, ActionOutcome, TaskAsset и TextAnnotation. JSDoc-типы дополнены runtime validation. Экспорт — обычные JSON-данные; callbacks, экземпляры классов и циклы отклоняются. Чистое чтение не требует браузера, файловых или сетевых API.

[Каталог](../../../artifacts/max-game/src/content/channel-catalog.mjs) содержит десять экранов задания `blogger.channel` миссии `blogger`, contentRevision `channel-20261002-v1`. Screen IDs имеют префикс `blogger.channel.`, действия — именованные `channel.*`, ассеты — `client.frame-N`. Это первый фрагмент каталога, не каталог всех шести миссий.

Каждый экран содержит `deviceKind`, `mode`, `assetId`, `instruction`, `actions` и `annotations`. Действие указывает размещение hotspot/below-screen и исход в виде перехода к screenId либо завершения задания. Public/private представлен именованным ответом `channel-type`; его принятие реализовано в ядре этапа 2. Действие выбора приватного типа возвращает тот же экран и не исчезает как бессмысленный переход: оно явно задаёт выбранный ответ.

Инструкция информационная. Hotspot и аннотация задаются прямоугольником `[x,y,width,height]` в исходных пикселях. Общий заголовок-коррекция «Публичный канал создан» на двух публичных кадрах имеет тип text-replacement, без CSS-цвета или callback. Renderer будет применять собственный стиль и один transform для изображения/геометрии.

Manifest содержит переносимый путь относительно корня MAX, SHA-256, MIME, размер и происхождение client-frame. Все десять PNG — оригиналы 360×800. Формат ассетов первого среза поддерживает PNG; SVG/другие типы добавляются явно при переносе соответствующих заданий. Файлы не копировались и не изменялись. Renderer разрешает пути относительно asset base, а не текущего адреса вложенной страницы.

Валидатор проверяет ID/версии, уникальность действий/аннотаций, ссылки, геометрию и достижимость каждого экрана/завершения. `freezeTaskCatalog` делает каталог неизменяемым; GameState в нём отсутствует. Версия инструкции/изображения и версия прогресса — разные понятия.

## Проверка и текущее ограничение

Команда: `node --test --test-isolation=none artifacts/max-game/test/shared-channel-catalog.test.mjs`.

24/24 проверки пройдены: public/private, возврат с прежней ссылкой, совпадение текущего контента/кнопок, исходные SHA/размеры, коррекция заголовка, невалидные JSON/references/geometry/graphs и чистота импортов. [Отчёт](../../../artifacts/reports/max-shared-backend-stage1-20261002.md).

Текущие Site/Legacy ещё не импортируют этот каталог. Старые таблицы остаются до подключения адаптеров. Их паритет проверен тестом на момент извлечения. Чистое ядро и SessionPort реализованы; серверный API, SQLite и миграция ещё не реализованы. Сборка и подключение runtime пока не нужны: нет изменённого браузерного entrypoint. Отдельный стенд разработки визуала не создаётся по последнему указанию пользователя.

Следующий отдельный этап — проверка фактического host и транзакционный SQLite PersistencePort. Визуализация и старые сохранения пока прежние.
