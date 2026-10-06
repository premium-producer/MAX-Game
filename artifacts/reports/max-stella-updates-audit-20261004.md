# Аудит обновлений MAX и Стеллы — 04.10.2026

## Область и результат

Root и три независимых проверяющих изучили свежие standalone исходники, manifests, отчёты авторов и отличия от принятого F и production-кандидата W3B. Это аудит: компоненты, F, процессы и пользовательские данные не изменены. Новые runtime не собирались; повторная браузерная/художественная приёмка не проводилась. Результаты прежних браузерных проверок ниже принадлежат отчётам соответствующих сборок.

**Вывод:** обновления визуала и загрузки ресурсов стоит переносить в мастер, сохраняя его серверное управление, восстановление сессий и адаптеры. Новые standalone сборки не являются заменой master backend. Полное копирование отменит часть уже реализованной интеграции.

## Точные версии

| Компонент | Источник | Версия и состояние |
|---|---|---|
| Новый MAX | `artifacts/workspace/exports/MAX-Game` | Ветка `codex/automatic-mission-copies`, HEAD `8280f703a9ef8d12375fbe9eac1bc7038bc745c7`, существенные **незакоммиченные** обновления. Remote main при read-only проверке совпал с HEAD; новый код нельзя восстановить одним этим commit. |
| MAX runtime | `apps/max-game/webgl-v5` внутри MAX export | `app.js` SHA256 `2353e8bfa35d4bf2a69c037f69ab23da402f3742bf7f5005221b9151141c3335`; build manifest SHA256 `96dced92d04611a10af0e3b0ee29f33835bd4093c4c7658357a37ea521a35243`. Проверяющий сверил 80/80 runtime, 279/279 source и 103/103 content asset SHA. |
| Новая Стелла | `artifacts/workspace/exports/VK_Stella` | Чистая `codex/deploy-0410upd`, commit `1dfa653829b9cff9ca3fadb9f24caa5c765912dc`; remote `0410upd` совпал. Опубликованный standalone релиз `20261004T175632Z`. |
| Принятая Стелла F | `F:/project/VK_DigitalProducts_Stand/artifacts/local-master/stella-ui` | WAVE08-ST1-ST2, manifest SHA256 `4996056bfef49625e321f64372ab7ad98d780628dc2b7689e3dd6cd8634c6014`. |
| Стелла W3B | `artifacts/workspace/tasks/prod-max/artifacts/production-stella-max/runtime` | Manifest SHA256 `1a55b0f485ee9bc7e79efa68efe87e7dce319091d25502a3f41419947e55d0ff`; отдельный master-managed кандидат, не новый standalone. |

## MAX: что изменилось

| Область | Реализовано в свежем доноре | Значение для мастера |
|---|---|---|
| Прогрузка | На старте оболочка, 20 общих изображений и четыре GPU warm-up набора. Остальные ресурсы current/prepareNext; переход не засчитывается до готовности. | Приоритетный перенос поверх существующего server adapter. |
| Память | Неиспользуемые текстуры освобождаются; shell закреплён. Растр устройств ограничен 2048 px, mipmaps отключены для этого тракта. | Ограничение относится к внутренним device-карточкам, не разрешению Spout/поверхностей. |
| Миссии | Renderer и оболочка сохраняются между локальными миссиями; History.replaceState вместо перезагрузки. | Сохранить также смену assignment и очистку состояния, предусмотренные мастером. |
| Автопрохождение | Четыре дополнительные демонстрационные миссии, MemoryPersistence; продвижение после visible-ready, удержание контакта отдельно. | Локальный демонстрационный режим не должен завершать серверную миссию автоматически. |
| Визуал | Белая галочка на прозрачном фоне вместо надписи завершения; обновления удержания ладони и переходов. | Перенос presenters с сохранением серверных состояний. |
| Звук | Howler 2.2.4 (MIT), 16 SFX, unlock первым жестом, mute/blur/lifecycle; один контроллер. | Проверка `!service` недостаточна для managed URL: нужен явный режим владения звуком. |
| Видеофинал | Опциональная локальная подборка 11 роликов, Video.js 8.24.1 и playlist 5.2.0 (Apache-2.0), lazy загрузка и Range. По умолчанию выключен. | Не включать автоматически в production: цикл роликов должен согласоваться с освобождением миссии и очередью. |
| Backend | Сервисные файлы, core/contracts/vendor совпадают с прежним D; каталог `missions-reviewed-20261003-abe878cfed89` прежний. | Нового canonical server ядра в этом обновлении нет. Изменения прежде всего клиентские. |

Авторский single-load отчёт показывает уменьшение закреплённых текстур 322 → 46 и базового RGBA footprint приблизительно 797 → 36,6 MiB. Это расчёт конкретного набора текстур, **не** новое измерение полного расхода памяти процесса или FPS. Audio добавляет отдельную память декодирования. Часовой и аппаратный production-прогон не подтверждён.

### MAX: обнаруженные препятствия переносу

1. **Загрузчик SVG и CSP несовместимы.** `asset-preparation.mjs` вызывает `fetch(source)`, `object-catalog.mjs` даёт пять `data:image/svg+xml` иконок. W3B `max-adapter-v3/local-server.mjs` разрешает `connect-src 'self'`; `img-src data:` не разрешает такой fetch. Загрузчик одинаков в новом доноре и прежних версиях. Это конкретный дефект контракта; привязка к единственному наблюдавшемуся `Failed to fetch` ещё требует короткой проверки после исправления.
2. **Нельзя заменить entrypoint целиком.** В доноре прежний `/api/state → X-VK-Token`; отсутствуют managed assignment, `/bridge/context`, durable pending, historical receipts и ограничение client clock из W3B. Их необходимо сохранить при слиянии.
3. **Новые медиа ещё не включены в production manifest.** В текущем host pin 194 файла, без новых audio/finale. Нужен полный проверенный asset closure, а не одиночная замена app.js.
4. **Видеотракт хоста отстаёт.** Донор использует `?v=<sha>`, HEAD и Range; текущий W3B static host запрещает query, не обслуживает HEAD/Range и не имеет нужных MIME для MP4/OGG/MP3. Это будущий блокер подключения видеофинала; текущая managed ветка его пока не включает.
5. **Lazy preload не означает offline cache.** После cold start поздние экраны ещё могут требовать ресурсы. W3B проверяет актуальный binding перед static GET: при разрыве связи с мастером даже локально упакованный, но ещё не загруженный ассет может быть недоступен. Не менять fail-closed политику молча; отдельно определить допустимость локального чтения ассетов при сохранении запрета игровых команд.

## Стелла: что изменилось

| Область | Свежая standalone версия | Отличие от мастера |
|---|---|---|
| Прогрузка | `ContentReady`, 33 изображения и семь шрифтов; Image.decode/FontFaceSet.load, четыре параллельных загрузки, timeout 20s, повтор только неудачных ресурсов. | В W3B ещё прежний best-effort/fire-and-forget; переносить readiness gate. Это не persistent offline cache. |
| Визуал | Новые иллюстрации Q1/Q2, тексты/переносы VK/MAX, нейтральная белая сущность без человека и активационной надписи в ветке без фото. | Сохранить master presenters и их параметры длительности. |
| Фото и согласие | Реальный клиентский текст согласия: 21 абзац, семь разделов. Фото предлагается только после Q3=`hero`. | F после Q3 всегда открывает photochoice. Это сценарное изменение, требующее серверной реализации. |
| Тайминги | Нейтральный Discovery 7s; возврат с финала через 20 активных секунд. | MasterSlice сохраняет 6s. Нельзя заменить компонент и независимо поменять часы арки/ленты. |
| Звук | 12 SFX, ambience, варианты переходов, студийная озвучка Discovery. Новые записи фото/финала ещё pending. | Нужны pin ресурсов и единое владение проигрыванием. |
| Камера | Один CameraSessionProvider, preview без звука, cleanup/lifecycle и повтор запроса доступа. Provider выше preload gate. | W3B пока честно объявляет camera:false и запрещает камеру/микрофон через Permissions-Policy. |
| Backend | Локальный React-квиз; Vite voice/diagnostics middleware для dev/preview. | Middleware не входит в статическую публикацию. `integrations/master` свежим standalone обновлением не менялся. |

**Камера ещё не равна готовой генерации:** AI_REQUESTS_ENABLED=false; `vk-camera` переходит к scan по таймеру 1800ms. Реальный snapshot/upload/referenceAsset в этой ветке не реализован, используется исходный силуэт. Нельзя считать фото пользователя переданным на генерацию по наличию живого preview.

Standalone выбирает темы локально (`Math.random` при равных весах, `slice(0,3)`). Это нельзя переносить как серверную истину: количество/выбор тем и контента остаются изменяемой политикой мастера.

При переносе обязательно сохранить MasterShell, восстановление station/session, раздельный VK/MAX mount, slice/max-client pending/receipt/revision/dataset fencing, защиту от поздних ответов, отсутствие auto-admission после reload, очередь, same-origin API/mTLS и доверенный QR origin. Новый WhiteEntity не содержит master prop `generationDurationSeconds`; простая замена нарушает текущий контракт.

Отдельная result-страница `stella-result-page` и poster cleanplates существуют как самостоятельные пакеты. Они не считаются автоматически включёнными в эту Стеллу или в F.

## Очерёдность следующей интеграции

1. Зафиксировать точные dirty SHA MAX и чистый commit Стеллы; не терять текущие master-adapters.
2. Независимо переносить MAX bounded loading/один renderer и Stella ContentReady/assets. Интегратор исправляет контракт SVG/CSP и пересобирает полные accepted manifests.
3. Коротко проверить actual managed страницы: cold start, ошибка/повтор загрузки, reload сессии, смена миссии; отдельно outage позднего ассета. Без тяжёлого GPU-прогона.
4. Перенести presenters/audio с явным production scope. Сценарный delta Стеллы (hero/photo, 7s, финал) внести согласованно в master domain/config, а не UI-обходом.
5. Отдельно подключать camera → snapshot → referenceAsset → generation и production video/Range. Они не блокируют первый перенос preload, но остаются самостоятельными незакрытыми работами.

## Основания и проверки

- [MAX single-load](../workspace/exports/MAX-Game/artifacts/reports/max-single-load-20261004.md), [автомиссии](../workspace/exports/MAX-Game/artifacts/reports/max-autoplay-copies-20261004.md), [звук](../workspace/exports/MAX-Game/artifacts/reports/max-game-sfx-20261004.md), [видеофинал](../workspace/exports/MAX-Game/artifacts/reports/max-video-finale-20261004.md).
- [Публикация Стеллы 0410upd](stella-selectel-20261004T175632Z/README.md): авторская сборка, 102 теста, HTTPS SHA 73/73 и IAB; камера/платный AI не приняты.
- [Preload Стеллы](stella-content-preload-20261004.md), [исследование preload](../../docs/Research/stella-startup-content-20261004.md).
- В этом аудите: чтение кода и сравнение контрактов; read-only Git/remote refs; SHA сверка MAX агентом. Нового браузерного теста, тестового пользовательского снимка, GPU/FPS замера и художественной приёмки не было.
