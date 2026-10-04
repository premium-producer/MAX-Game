# Локальный контекст разработки MAX

03.10.2026 — journey-v5-recovery.mjs использует native dialog. Local standalone v5 не активирует owner до выбора и GPU-ready; recoveryBlocked защищает focus/visibility. Continue вызывает renderer.resume(activeId), сохраняя screenId. Restart/Menu ждут reply.ok, ошибки оставляют диалог. [Проверка](../../../artifacts/reports/max-v5-recovery-20261003.md).

03.10.2026 — Внешние v5 action-кнопки radius48/H96, flex center + text-align center. WebGL использует computed radius и DOM Range; отдельный текстовый offset не добавлять. [Проверка](../../../artifacts/reports/max-v5-pill-actions-20261003.md).

03.10.2026 — v5 external-actions заменяет внутренний footer из asset-fit: viewportH776 независимо от actions. CSS top=100%+30 от inner viewport даёт18 после shell, ширинаmin(100%,392px), центр50%/translateX(-50%). Не выносить actions из phone-content без переноса fade/inert/loading ownership. [Проверка](../../../artifacts/reports/max-v5-external-actions-20261003.md).

03.10.2026 — MAX v5 local хранит прогресс в IndexedDB через idb8.0.3. createIndexedDBPersistence импортирует точный record/version из прежнего localStorage только при отсутствии IDB записи; localStorage не писать и не удалять. Ключи включают contentRevision и sessionId. Состояние/receipts не обрезать: backend restore использует replay. Ошибки хранилища раскрывает startup-error.mjs. После обновления старые вкладки v5 перезагрузить. [Проверка](../../../artifacts/reports/max-indexeddb-local-profile-20261003.md).

03.10.2026 — BFM_COLOR_MANAGED в surface shader: sRGBTransferEOTF → colorspace_fragment. Нельзя передавать дисплейный RGB напрямую в линейный JourneyContextGlass target: появление instruction тогда высветляет даже таймер. [Проверка](../../../artifacts/reports/max-v5-ui-color-space-20261003.md).

03.10.2026 — createBfmGradientMap централизует native Three UV coverage для вращающихся карт. Не удалять repeat=1/√2: при диагональном угле иначе появляются растянутые края. Rounded alphaMap не масштабировать вместе с цветом. [Проверка](../../../artifacts/reports/max-v5-gradient-cover-20261003.md).

03.10.2026 — v5 asset-fit: source journey-v5-device-morph.mjs V5_DEVICE_FRAME согласован с локальными правилами v5.css: H800/inset12×10/action96/gap10/contentGap18. При изменении этих tokens менять CSS и warmup integration проверки вместе. Для реальныхscreens передаватьasset+actions; splash вызыватьбезasset. [Отчёт](../../../artifacts/reports/max-v5-asset-fit-20261003.md).

03.10.2026 — V5 hold-shell-logo: down больше не создаёт preview. accept(scanned) создаёт shell с logo0; tick ждёт deviceShown+deviceReady без iconssettled. updateTargets публикует startupContentPresence в splash data-task-content.dataset.pathPresence, включая первый markup. Далее штатный maath/stagger/trace/fan/morph. Предыдущие записи о телефоне во время holding исторические. [Проверка](../../../artifacts/reports/max-v5-hold-shell-logo-20261003.md).

03.10.2026 — Уточнение v5 phone-first: rowMetrics удалён. phoneLayout использует phoneMetrics текущего отображения, ключ native Flexbox уже зависит от width. Существующий morph.resize обновляет presentedDevice и updateTargets. Предварительное резервирование PC ниже — историческое. [Проверка](../../../artifacts/reports/max-v5-visible-device-width-20261003.md).

03.10.2026 — V5 phone-first: V5RevealJourney.startup (row→trace→fan→content, cancel) создаёт presentation nodes/device во время holding, не меняя scanned. Main displayPhoneKey различает logo/task; syncLinePhone сохраняет shell и demo-app. previewDevice берётся из первого экрана каталога, rowMetrics резервирует PC; presentedDevice фиксируется по deviceReady. При confirmed startup снимается palm gesture, иначе держание блокировало бы arrange. v5SplashWarmup392/360 добавлен в существующий прогрев. [Ресерч](../../../docs/Research/max-v5-phone-first-20261003.md), [проверка](../../../artifacts/reports/max-v5-phone-first-20261003.md).

03.10.2026 — v5 curved-stagger: journey-v5-path.mjs — Three QuadraticBezierCurve + maath sine.inOut; настройки introPath/repackPath в V5_MOTION. arrange/pack выдают промежуточные цели, updateTargets вызывается после tick, trace ждёт done предыдущего кадра и реальный settled. readObjectOffset не меняет drag. Одинаковый configure не перезапускает пути; новый размер перенаправляет от фактической позы. [Ресерч](../../../docs/Research/max-v5-curved-stagger-20261003.md), [проверка](../../../artifacts/reports/max-v5-curved-stagger-20261003.md).

03.10.2026 — `journey-v5-mission-continuation.mjs` координирует QR→fade→SELECT_MISSION/RESTART_MISSION→fade ладони через существующий maath и общий tick. V5RevealJourney хранит completionPoses только в presentation; Core и сохранения не изменены. Профильные проверки — `test/webgl-v5-completion.test.mjs`. [Контракт/ограничения](../../../artifacts/reports/max-v5-completion-20261003.md).

03.10.2026 — v5 startup: `V5StartupAssets.getImage(src)` возвращает общий декодированный HTMLImageElement для Canvas/Three. Несколько markup-узлов одного URL могут рисоваться одновременно; GPU warmup не должен вызывать takeImage для каждого потребителя. `takeImage` остаётся только необязательным переносом свободного DOM-узла, его отказ из-за isConnected не означает отсутствие пикселей. [Регрессия](../../../artifacts/reports/max-v5-svg-warmup-20261003.md).

MAX v5 (03.10.2026): захват использует difference actualMotion/measuredLayoutTarget плюс controller.pose, учитывая вложенную guided-field. journey-v5-tools держит панели вне #circles; карта внутри arena. Layout wall/lidar сохраняет4096×1280 и меняет CSS viewport фон/игра/map без configure/focus/render сценария. Native WAAPI v4 angle → Three Texture.rotation; alphaMap скругления неподвижна. [Контракт и проверки](../../../artifacts/reports/max-v5-drag-tools-20261003.md).

MAX v5 (03.10.2026): pointerdown получает retained IconMotion centre через captureObject, inverse guided geometry переводит его в world; delta указателя учитывает arena scale. До порога7px pose/size фиксированы; captured drag подавляет bob/hover и выполняется тем же maath damp14, что телефон. Release/cancel/lostcapture очищают dragAnchor без velocity reset. Свободный v5 drag не использует старый reveal clamp; старые profiles сохраняют прежнюю политику. [Исследование](../../../docs/Research/max-v5-drag-anchor-20261003.md), [проверка](../../../artifacts/reports/max-v5-drag-20261003.md).

V5 startup (03.10.2026): journey-v5-startup-assets.mjs перечисляет весь используемый каталог/QR/logos, Three ImageLoader + native decode, adoption готового Image без замены src/crossorigin. Boot передаёт в JourneyWebGLUI startup plan: тот же visit/cache, initTexture/compileAsync/pre-render на существующем ContextGlass target; материалы pin до dispose, cache keys сохраняются. root.inert/assetPreparation/startup loading до field.prepareGPU await. Диагностика #circles.dataset.startupAssets после runtime warm. Backend-команд нет, missing не подменяется; старые renderer ветки сохранены. [Исследование](../../../docs/Research/max-v5-startup-assets-20261003.md), [проверка/ограничения](../../../artifacts/reports/max-v5-startup-assets-20261003.md).

V5 inertia (03.10.2026): journey-v5-inertia.mjs адаптирует настоящий maath0.10.8 damp к существующим value/velocity/at; только x/y и только visual=webgl-bfm-v5. Указатель меняет phone goal, clock фильтрует; повторный захват использует actual pose. Справка использует actual phoneX/camera/width и --guided-device-center-y, InstructionMotion меняет height без фиксации top. Existing GPU/readiness остаётся. Scoped builder включает MIT notice HTML; package lock фиксирует готовую зависимость. [Проверка](../../../artifacts/reports/max-v5-inertia-20261003.md), [ресерч](../../../docs/Research/max-webgl-v5-bfm-theme-20261003.md).

V5 route (03.10.2026): journey-v5-route-layout.mjs использует native Flexbox measurement, кэш по составу/активному узлу/метрикам. V5RevealJourney хранит временный run phoneAnchor, передаёт offsets/nodeY в прежнюю motion систему. После ручного phone drag focusCurrent сохраняет camera; inverse node drag не вычитает уже применённые offsets, учитывает Y-100. Ответ снимает node overrides. Width корпуса равен width wrapper. [Проверка и ограничения](../../../artifacts/reports/max-v5-anchored-row-20261003.md).

V5 phone (03.10.2026): journey-bfm-device-paint.mjs задаёт cached bezel/light CanvasTexture, pad72; native shadowBlur масштабируется rasterScale вручную. Поля12×10, PC не затронут. surface material помечает userData.deviceShell; gpuReadyKey требует корпус и upload изображений. [Проверка](../../../artifacts/reports/max-v5-phone-neon-20261003.md).

Game background Frost (03.10.2026): iframe передаёт window.frameElement; маски parent.document переводятся в его локальную систему координат по DOMRect. После изменения frost выполнять scoped viewer build_bundle.py --sync-game-background (включает frost). Проверка v5: /max-game/webgl-v5/?backend=local&layout=wall&v=frost-origin-1. [Отчёт](../../../artifacts/reports/max-v5-frost-origin-20261003.md).

V5 link paint (03.10.2026): route/device styles передают gradient:[start,end], intensity, particleOpacity, pulseStrength, additive:false в существующий webgl-field. Готовые Three vertex colors интерполируют линии; ошибки отключают градиент и сохраняют статусный красный цвет. Default других профилей неизменен. Проверенный комплект: /max-game/webgl-v5/?backend=local&layout=wall&v=purple-links-1. [Проверка](../../../artifacts/reports/max-webgl-v5-purple-links-20261003.md).

03.10.2026 — **V5 radial correction:** для tile/medallion включена paintBfmTile native CanvasGradient + существующий sRGB CanvasTexture cache/MeshBasicMaterial; referenceRole tile shader с белым halo больше не применяется в v5. Селекторы v5 geometry сильнее старого reveal CSS, подпись top278 располагается ниже256px плитки. Движок/input/backend/фон прежние. Собирается только build-webgl-v5-runtime.mjs; контроллер вращения ещё не перенесён. [Ограничения проверки](../../../artifacts/reports/max-webgl-v5-radial-20261003.md).

03.10.2026 — **Пятая визуализация:** /max-game/webgl-v5/?backend=local&layout=wall. Основа journey-guided-main.js, обычный SharedRevealJourney и journey-webgl-ui.mjs; data-visual=webgl-bfm-v5 выбирает материал, не reference solver. Сборка: node artifacts/max-game/scripts/build-webgl-v5-runtime.mjs из корня; общий контент заранее установлен. Scoped builder сохраняет остальные runtime и проверяет asset SHA. Локальный профиль имеет собственный ключ/сессию webgl-v5; серверный общий session ID задаётся явно. Первая итерация сохраняет исходную геометрию: LiDAR viewport и панель градиента BFM пока отсутствуют. [Ресерч](../../../docs/Research/max-webgl-v5-bfm-theme-20261003.md), [проверка и ограничения](../../../artifacts/reports/max-webgl-v5-20261003.md).

03.10.2026 — `.gradient-clip` сохраняет inherited32px radius/overflow и явно clip-path:border-box; clipping относится только к вращающейся заливке. Тени/глиф/подпись/scale не затронуты. [Обоснование/проверка](../../../artifacts/reports/max-bfm-rounded-gradient-20261003.md).

03.10.2026 — Уточнение: task-only DOM fit отменён. `BFM_UI_REFERENCE_HEIGHT=540` задаёт общий постоянный scale0,750976 для всех фаз до session.start. Native update не пишет transform stage; CSS task translate95px статичен. Фон/viewport не меняются. [Проверка/границы](../../../artifacts/reports/max-bfm-fixed-ui-20261003.md).

03.10.2026 — Phone task измеряется после DOM commit до native snapshot; `bfmStagePlacement({top,height})` масштабирует весь stage по высоте устройства и центрирует его в полосе1–1,8м. wall/lidar отличаются только viewport. PC/прочие фазы используют прежний fit. [Проверка](../../../artifacts/reports/max-bfm-phone-height-20261003.md).

03.10.2026 — `/max-game/bfm-design/?backend=local&layout=lidar` приближает только BFM_PLAY_AREA. «Вид» переключает wall/lidar через history.replaceState и native CSS transform; сессия прежняя. Фон после замены canvas на iframe получает ту же геометрию. Полная стена доступна с layout=wall; физические размеры/координаты неизменны. Проверки/границы: [отчёт](../../../artifacts/reports/max-bfm-lidar-viewport-20261003.md).

03.10.2026 — обязательный native порядок BFM: root0 (opaque page fill), background1, stage2, HUD/debug100+. Не ставить root над GPU background. Обычный локальный переход проверен без сброса. [Данные](../../../artifacts/reports/max-bfm-background-layer-20261003.json).

03.10.2026 — постоянные BFM overlays имеют собственные named View Transition groups над фоном/сценой. При добавлении debug UI сохранять этот explicit порядок: обычный DOM z-index не заменяет group z-index. [Проверка/открытая приёмка](../../../artifacts/reports/max-bfm-persistent-ui-20261003.md).

03.10.2026 — read-only TD control route активен после разрешённого штатного restart. BFM standMask:true получает MainRight250×65 RGBA8 из существующего native receiver. Live HTTP/schema/bytes/sequence проверены; параметры MAX backend/игровой логики не менялись. Перезагрузить BFM для загрузки новых модулей. Визуальное совпадение и FPS браузера ещё не приняты.

03.10.2026 — подготовлен BFM standMask:true → iframe mask=stand → TDControlFeed /api/td/control-frame?atlas=MainRight → общий TDControlTexture. Server/main/host должны быть применены одним штатным restart; сейчас новый маршрут ещё405. При потере свежего атласа сохраняется последний реальный кадр, procedural fallback для BFM отключён. Runtime/SHA проверены; активация и пользовательская оценка ожидаются. [Отчёт](../../../artifacts/reports/max-bfm-live-mask-gap-20261003.md).

03.10.2026 — **Уточнение фактического подключения фона:** common-map-game-background использует настройки мастера, но не получает native vk-control-frame. Его локальная процедурная маска не является реальной TD-маской стенда. HTTP-потока TD atlas сейчас нет. Обычная перезагрузка BFM этого не исправляет. [Диагностика](../../../artifacts/reports/max-bfm-live-mask-gap-20261003.md).

03.10.2026 — BFM_PLAY_AREA: пользовательская граница LiDAR/игры совпадает с полосой1–1,8м в плоском участке. Stage вписан через native CSS transform и центрирован3144/818px; источник разметки тот же. Масштаб0,42687 сохраняет пропорции, читабельность пока не принята. Физический датчик не калибровался.

03.10.2026 — BFM: «Пиксельная карта и зоны» включена по умолчанию, флажок скрывает overlay. Сетка256px, углы локального MAX4096×1280 и общая карта7168×1280. Комфортная полоса1–1,8м от пола по circle-model; LiDAR — только проектная плоская область, без подтверждённой калибровки. Фон вписан в тот же aspect экрана. Разметка не ограничивает ввод/раскладку. [Проверка](../../../artifacts/reports/max-bfm-pixel-map-guides-20261003.md).

03.10.2026 — BFM показывает границы #stage («Комфортная игровая зона») и palm120×120 («Зона сканера», только scan). Рамки не ограничивают перемещение и не перехватывают ввод; физической калибровки датчика не заменяют.

03.10.2026 — BFM по прежнему URL теперь использует /viewer/common-map-game-background.html?output=1 через existing commonMapBackground. GPU-отрисовка по актуальным commonMapVisual/clock Stand Service, правый crop общего домена, без видео/WebRTC. Требуются ресурсы viewer/ribbon/service; отдельный автономный статический bundle недостаточен. Локальный reference-фон больше не импортируется в BFM. [Проверка](../../../artifacts/reports/max-bfm-stand-background-20261003.md).

03.10.2026 — уточнение BFM: вместо общего сдвига — «Разброс фаз»0–360° (default360). При0 фазы выравниваются; для постоянной синхронности также поставить разброс скорости0. Работает на паузе, seed каждой кнопки сохраняется.

03.10.2026 — BFM «Градиент кнопок»: добавлен «Сдвиг фазы»0–360°, применяемый к текущим углам с сохранением случайной разницы. Работает на паузе; настройки до перезагрузки. [Проверка](../../../artifacts/reports/max-bfm-gradient-motion-20261003.md).

03.10.2026 — BFM: перед decode template.content импортируется в активный document через importNode. Поддерживаются явные backend=local/server и session=. Local сохраняет max-bfm-preview:v1; server использует общий SessionPort с X-VK-Token и default session=site-shared. Переноса local progress автоматически нет. Live API пока503 MAX_BACKEND_DISABLED; мастер не включали. [Проверка](../../../artifacts/reports/max-bfm-decode-fix-20261003.md).

03.10.2026 — **BFM v4: прохождение подключено.** Тот же URL `/max-game/bfm-design/?backend=local&layout=wall` и local профиль. `bfm-mission-screen.mjs` проецирует общий descriptor через sharedTaskMarkup; `bfm-main.mjs` соединяет подготовку DOM/media, BFM transition и SessionPort. Состояния task/result/completed/incomplete/expired обслуживаются; автоэкраны ждут видимости, при hidden владелец освобождается. Сборщик теперь сверяет общие runtime-ассеты по каталогу. Пауза после раскрытия из первой итерации отменена. [Проверка/ограничения](../../../artifacts/reports/max-bfm-missions-20261003.md).

03.10.2026 — BFM v4: `src/bfm-gradient-controller.mjs` управляет только заливкой квадратных `.tile`. Панель «Градиент кнопок» справа внизу:5…90°/с, разброс0…35%, пауза; defaults30°/с ±15%. Настройки временные, backend не затрагивается. [Исследование](../../../docs/Research/max-bfm-gradient-motion-20261003.md) · [Проверка](../../../artifacts/reports/max-bfm-gradient-motion-20261003.md).

03.10.2026 — **BFM v4, итерация старта.** Адрес `http://localhost:8770/max-game/bfm-design/?backend=local&layout=wall`. Source `src/bfm-main.mjs`, native BFM adapter `vendor/bfm-native/`, сборка `node artifacts/max-game/scripts/build-bfm-runtime.mjs`. Только меню, backend hold и раскрытие; далее preview приостанавливает таймер. Отдельное local сохранение, остальные страницы не меняются. [Ресерч](../../../docs/Research/max-bfm-presentation-20261003.md) · [Проверка и ограничения](../../../artifacts/reports/max-bfm-start-20261003.md).

02.10.2026 — MR-01: подготовка reference frame извлечена в `journey-reference-frame.mjs`. Renderer измеряет DOM и передаёт записи owner/id/role/layout/motion/parts; общий модуль возвращает подготовленные позы. Правила прежние, это не замена collision solver. Параметр `motion-debug=1` пишет в console.debug смены фаз/контакта с координатами, alpha, run и числом подтверждений сканирования; хранится не более180 кадров. В обычном режиме trace выключен. CPU fixture использует реальный Session application и IconMotion, но не доказывает фактическую DOM-разметку/GPU. [Проверка](../../../artifacts/reports/max-reference-frame-extraction-20261002.md).

<a id="reference-change-gate"></a>
## Чек-лист короткой итерации MAX reference — 02.10.2026

Текущий статус: **не принято пользователем, старт считается открытым дефектом**. [Единый план/to-do](TODO.md), [аудит](../../../artifacts/reports/max-reference-recovery-audit-20261002.md). Списки ниже — шаблон обязательной проверки итерации, не заявления о выполнении.

Перед правкой:

- [ ] Выбрано готовое решение на основе репозитория, официальной документации и реального описанного опыта. Исследование содержит ссылки, версию, лицензию, ограничения и применимость; прежний план самописного механизма пересмотрен.

- [ ] Назван один defect ID, точный URL, миссия и исходное состояние (новый run или restore).
- [ ] Зафиксированы шаги воспроизведения, ожидаемое поведение и фактическое доказательство. Гипотеза отмечена как гипотеза.
- [ ] Прочитаны владельцы backend-state, presentation-state, motion, DOM input и WebGL frame; определена одна граница изменения.
- [ ] Для дефекта есть падающая проверка затронутого пути, а не только отдельно переписанная формула. Если это только визуальная проблема — отмечено, чего CPU не докажет.
- [ ] Определены изменяемые файлы и способ обратного изменения без затрагивания чужой работы/сохранений. Старый вариант не объявляется рабочим без проверки.

После правки, до сборки:

- [ ] Старт: hold0.8с, отпуск раньше срока, повтор, уход указателя/отмена, один commit. Ладонь не выталкивает себя и не уходит из-под контакта.
- [ ] Frame: каждый semantic ID один раз; finite poses; порядок создания/rebuild не меняет владельца; tile/text/hit-target/links согласованы.
- [ ] Motion: проверены промежуточные кадры, displacement/velocity, вход/выход препятствий и captions, пауза/reduced motion; нет наложений, popup исключён. Отсутствие пересечений само по себе не PASS плавности.
- [ ] Task: media readiness не подменяет spatial readiness; повтор/неверный ответ/поздний callback не продвигают другой экран; restart не воскрешает старую сцену.
- [ ] Запущены только относящиеся CPU-тесты и syntax; оставшиеся пробелы названы явно. Нет тяжёлого GPU-прогона/видео без отдельного согласия.

Перед передачей пользователю:

- [ ] Duplicate guard → одна необходимая сборка → сверка HTTP с runtime для точного адреса.
- [ ] WORKLOG и статус строки общего бэклога обновлены; «исправлено в коде», «собрано», «визуально принято» разделены.
- [ ] Даны максимум три конкретных действия для проверки. Визуальную оценку выполняет пользователь по действующему правилу; неизвестное не помечается PASS.
- [ ] Получен отзыв до следующего изменения поведения. Возврат дефекта вновь открывает строку, даже если CPU-тесты зелёные.

02.10.2026: reference scan-target участвует в collision frame ровно один раз как fixed-владелец; его нельзя одновременно добавлять в moving objects и obstacles из прошлого DOM-кадра. Коррекция и carry для ладони всегда нулевые. Это исправляет самоотталкивание на старте.

02.10.2026: в третьем WebGL reference введена покадровая защита плиток и их подписей от взаимных пересечений и устройства (18px). Справка может перекрывать объекты. Drift добавляется к единой подготовленной позе, не участвует в ожидании завершения стадий. Телефон начинает вход вместе с trace; backend и media-readiness прежние. Reduced motion отключает парение. Детали/границы проверки: [аудит](../../../artifacts/reports/max-reference-motion-20261002.md).

02.10.2026: третья WebGL-визуализация доступна отдельно: `/max-game/webgl-reference/?backend=local&layout=wall`. Профиль reference, координаты3591×1113 из семи пользовательских SVG; общий backend и фон прежние. Исходники journey-reference-presentation.mjs / journey-reference.css / journey-reference-icons.mjs; старые Site/Guided сохраняются. Проверка внешнего вида пользователем ещё не завершена.

02.10.2026: journey-lumi-reference-profile.mjs теперь реэкспортирует общий профиль artifacts/ribbon/max-reference-profile.js; фон игры и новый пространственный слой общего задника имеют один источник. Внешний вид/clock локальной игры не менялись.

02.10.2026 — pixels-03: по референсу шаг35 единиц SVG теперь масштабируется только шириной окна: ~103 столбца сохраняются при любом aspect, вместо увеличения/обрезки cover. Фон вертикально центрирован. Эмиссия клеток откалибрована под голубые края, синий переход и розово-сиреневый центр исходного pattern; энергия×1.25, смешение20% сохранено. Анимация и подложка неизменны. [Измерения и ограничения](../../../artifacts/reports/max-lumi-reference-pixels-20261002.md). Итоговая цветопередача ждёт кадра пользователя.

02.10.2026 — диагностика жалобы «по ссылке ничего не меняется»: адрес `/guided-reveal/?backend=local&layout=wall` правильный, HTTP entry и bundle сверены. В native background обнаружена полная остановка по системному reduced-motion, противоречащая явно запрошенной анимации. Для фонового профиля теперь default — движение независимо от системной настройки; `background-motion=auto` возвращает её учёт. Игровые переходы сохраняют reduced motion. Это выявленное условие, а не доказанная причина на компьютере пользователя. `background-debug=1` показывает motion-02, число успешных кадров, clock и ошибки; без параметра плашки нет. Паузы hidden/service сохранены.

02.10.2026 — по отзыву пользователя темп локального LumiCells-фона ускорен ×4: яркостная волна4с, движение основных пиков8с, центральный пик и градиенты16с. Амплитуды, палитра, паузы и reduced motion сохранены; новые периоды по-прежнему делят clock4096 без шва.

02.10.2026 — нативный фон оживлён: пики клеточной волны плавно смещаются и меняют ширину, по клеткам проходит мягкая яркостная волна; фоновые градиенты дрейфуют на ±105/52 единицы исходного SVG. Периоды 16/32/64 секунды согласованы с wrap4096 LumiCells. Сетка и статичный зернистый рисунок закреплены, мерцания случайных значений нет. Общий callback foreground `tick` вызывает фон; отдельный RAF удалён. Hidden/service pause/reduced-motion останавливают clock в текущей фазе, возобновление без догоняющего скачка; dt≤50мс. Новых GPU passes/RT нет, но существующий фон теперь рисуется каждый активный кадр. PASS CPU30/60/120Hz, pause/resume/reduced/wrap, viewport/DPR4; FPS и художественный темп оценивает пользователь.

02.10.2026 — следующий шаг: фон Guided Reveal по умолчанию нативный LumiCells. `journey-lumi-reference-background.mjs` подключает локальный Controller/Engine; профиль `journey-lumi-reference-profile.mjs` задаёт процедурное поле мелких клеток и GLSL композицию. Штатные field/stamp/halo/bloom рисуют клетки, пять radial-слоёв сохраняют stops и координаты SVG. Три размытых conic-диска восстановлены аналитическим приближением Gaussian coverage, волновая огибающая растрового pattern — процедурным приближением; пиксельная идентичность не заявлена. Без SVG/PNG, iframe, SSE и WebRTC в этом режиме. Один canvas, native DPR, кадр после warmup/resize; постоянной анимации нет. Palm/links остаются в прежнем foreground. `background=svg` — извлечённый оригинал для сравнения; `background=live` — общая карта. Opt-in `EngineOptions.sceneProfile` действует только при передаче локального профиля, прежние стендовые bundles не пересобраны. CPU-проверка: `node artifacts/max-game/scripts/check-lumi-reference.mjs` (esbuild, без GPU). Внешний вид, GLSL на фактическом GPU и начальная стоимость ожидают пользовательской проверки.

02.10.2026 — локальный Guided Reveal по умолчанию использует фон из пользовательского `Frame 2131329387.svg` (3591×1113). Извлечены только 9 фоновых слоёв и 15 definitions: #0D001A, три conic-слоя с blur sigma1591.16/662.985/1325.97 (последний color-dodge, opacity0.5), зеркальный растровый pattern opacity0.2 и пять radial-градиентов. Точные stops/матрицы/SHA — `artifacts/max-game/public/assets/backgrounds/figma-game-background.json`; рядом SVG. Оригинал — `artifacts/DESIGN/figma-exports/max-game-reference-20261002.svg`; воспроизведение — `artifacts/max-game/scripts/extract-reference-background.py <original.svg>`. Неинтерактивный sandbox iframe сохраняет Figma foreignObject/conic, которые требуют document context вместо img. Масштабирование xMidYMid slice сохраняет пропорции, обрезая края при другом aspect. Фон статичный, без SSE/WebRTC/RAF; `background=live` возвращает прежний common-map фон. Service-режим и стенд не менялись. Внешний вид и стоимость первого отображения больших blur-фильтров ожидают пользовательской проверки; FPS не заявлен.

30.09.2026 — у Guided Reveal подготовка телефонного кадра отделена от факта рендера: `decode()` → `mediaReadyKey` позволяет начать вход; `initTexture` на том же renderer готовит GPU-кадр до отрисовки. `gpuReadyKey` не является условием прогресса. На decode/посадку действуют ограниченные интервалы, а поздний commit сверяется с актуальным ключом. [Контракт](GUIDED_REVEAL.md), [исследование](../../../docs/Research/max-phone-render-pipeline-20260930.md).

30.09.2026 — для Guided Reveal раскрытие иконок и сканирование ладони используют общий clock существующего WebGL-слоя: упорядоченный веер → индивидуальные дуги в ряд, радиальный световой отклик на hold. Исследование: [choreography](../../../docs/Research/max-guided-reveal-choreography-20260930.md); точные фазы и проверка: [GUIDED_REVEAL](GUIDED_REVEAL.md).

30.09.2026 — короткий цикл правки только игры: проверить конфликтующие копии, синтаксис изменённых JS и относящиеся к изменению CPU-тесты; один раз собрать `node artifacts/max-game/scripts/build.mjs` и выполнить `node artifacts/max-game/scripts/check-local.mjs`. Stand Service не пересобирать, если его исходники не менялись. Для уже запущенного мастера перезапускать только `max-wall-right`, сверять новую generation/status/frame. В браузере проводить одну короткую проверку затронутого пути после финальной сборки, без многократных повторов и обхода всех миссий; дальнейшую матрицу покрывать CPU-тестами. Тяжёлые GPU-прогоны — только по правилам AGENTS. [Аудит фактического цикла](../../../artifacts/reports/max-task-actions-20260930/README.md).

30.09.2026 — Guided Reveal подключён к локальному мастеру как источник `max-wall-right`: `/max-game/guided-reveal/?surface=right&service=1&layout=single`. В service-режиме сцена имеет размер 4096×1280, игровая зона размещается в правой доступной области, собственный полноэкранный фон не рисуется: за ней виден общий фон задней стены мастера. Сообщение `max-service-state` управляет паузой игры; самостоятельная страница `/max-game/guided-reveal/` сохранена. [Проверка на экране](../../../artifacts/reports/max-guided-master-20260930/README.md).

30.09.2026 — прежнее ограничение «только заглушки сцен» заменено новым указанием пользователя: интегрирован весь подходящий доступный контент; пропуски отмечены в заданиях и меню. [CONTENT_MEDIA](CONTENT_MEDIA.md) описывает registry, исходники, ветки и ограничения. Не возвращать прежнюю героиню/ночные сцены и не выдавать статичные кадры за видео.

29.09.2026 — [MAX Guided](GUIDED.md): отдельный локальный /max-game/guided/, чистый контроллер, прежние клиентские задания и WebGL. Исходники journey-guided.mjs / journey-guided-main.js / journey-guided.css; сборщик создаёт собственный entry/bundle. Основной клиент и мастер сохраняют прежнюю механику. Дальнейшие изменения guided сверять с GUIDED.md.


29.09.2026 — выбор портов связей учитывает реальное направление между точками подключения, а не расстояние до центров плиток. Почти перпендикулярная пара уступает удобной грани; при равнозначности сохраняется исходная сторона источника. TileEdgeMotion продолжает скользить по контуру с сохранением угловой скорости, handles/bow сокращаются плавно при неудобном направлении. Обычное перемещение не гасит связи. [Проверка и ограничения](../../../artifacts/reports/max-link-port-bends-20260929/README.md).

29.09.2026 — восстановлена подключённая к entry реализация адаптивных плюсов и крупной редакции: прежние правки обнаружены только в копиях `(2)`, основные файлы содержали старую логику. Причина расхождения не установлена; копии сохранены, состояние основных до восстановления — в `artifacts/workspace/backups/max-slot-recovery-20260929`. `check-local` теперь требует фактического включения slot-placement и large-blocks в source-manifest. Для крупных горизонтальных контролов envelope padding/gap равны 2px, наружные точки учитывают эту рамку; избыточные отступы обычного профиля больше не занимают следующий ряд. Новый запрос уменьшил эксперимент в 1,5 раза до ×1,67; CSS, metrics, picker и окна согласованы. [Отчёт](../../../artifacts/reports/max-plus-runtime-recovery-20260929/README.md).

29.09.2026 — адаптивные плюсы: чистый `journey-slot-placement.mjs` проверяет полную геометрию контрола и при конфликте ищет ниже/выше, затем справа/слева. `planningLayout` резервирует свободные места, `refreshRouteSlots` обновляет существующие цели IconMotion в текущем preview RAF и после MOVE. Координаты выбранной и финальной иконки сохраняются через PLACE/freePosition. Полоса Stand Service 1–1,8 м, обычный drag сохраняет более широкую область. [Контракт](SCENARIO_LAYOUT.md), [проверка](../../../artifacts/reports/max-adaptive-plus-20260929/README.md).

## Эксперимент ×2,5 — 29.09.2026

`large-blocks/index.html` генерируется штатным build. `journey-large-blocks.mjs` задаёт раскладку и вписывание окон, `objectMetrics` учитывает смещённый центр плитки относительно горизонтальной подписи. CSS ограничен `data-experiment=large-blocks`. Пикер, полёт, drag и геометрия связей используют фактический размер плитки. Окна уменьшаются отдельно при переполнении; общий renderer, retained scene и motion clock сохранены. Подробности — [EDITIONS](EDITIONS.md).


29.09.2026 — уточнён триггер гашения путей: только изменение назначений существующих иконок (замена/обмен слотов). `changesExistingRoute` сравнивает routeAssignments до/после принятого reducer-действия; `RouteReconnect` удерживает скрытие до подготовленного кадра и окончания движения. `connectionsMoving` остаётся диагностикой/условием завершения, а `connectionsSuspended` отдельно разрешает гашение. MOVE, полёт новой иконки, REVEAL и добавление не скрывают сеть, edgeCurve пересчитывается из текущих поз со сглаживанием портов. Это заменяет широкое скрытие во время любого движения в предыдущих записях.

29.09.2026 — согласование motion/state: профиль MAX [max-interaction-motion](../../../artifacts/max-game/skills/max-interaction-motion/SKILL.md) обязателен вместе с профилем MAX. `JourneyIntent` хранит один последний запрос на зону; навигация имеет приоритет, контекстный запрос действует только для исходного session-state. Вход/выход больше не блокирует всю зону через inert: dispatch подтверждает ожидание, повтор ANSWER во время смены содержимого не отвечает за следующий этап. CLOSE отменяет очередь/контент и прерывает локальный вход с текущими presence/velocity. UI-переходы reset/branches и выбор иконки также проходят очередь. Отмена перелёта удерживает текущую позу до ухода picker, отменяя посадочный callback. `stepSignalLinkPresence` гасит замороженную геометрию, даже при коротком drag доводит её до нуля, затем разрешает сброс портов и проявление новой кривой. Тайминги — `TRANSITION_MOTION`; существующий clock/renderer. [Проверки и границы](../../../artifacts/reports/max-motion-coherence-20260929/README.md).

29.09.2026 — сохранённая сцена: `journey-retained-field.mjs` переиспользует владельцев поля, включая picker→field. UI сохраняет неизменившиеся Three.Group/материалы; смена роли обновляет содержимое той же группы. `setTarget(host,id,point)` получает цели из модели и drag, `journey-scene-pose.mjs` проецирует IconMotion в WebGL/input/links. DOM служит первичной раскладкой текста и адаптером ввода. `publishGlassFrame` публикует подготовленный снимок; фон/worker не читают промежуточный DOM. Resize явно инвалидирует layout. При правке общей оптики собирать MAX и затронутый public-модуль Service. [Аудит и ограничения](../../../artifacts/reports/max-retained-scene-20260929/README.md).

29.09.2026 — IconMotion.connectionsMoving отслеживает drag/retarget/placing/intro и фактическое успокоение пружины. UI передаёт по host; network.suspendedScopes из journey-main скрывает все связи конкретной зоны/миссии, включая retiring edges. Пока suspended, opacity0/group.visible=false и геометрия не пересчитывается. Возврат сбрасывает TileEdgeMotion на актуальные порты до проявления. Idle bob/hover не запускают цикл. [Контракт](SCENARIO_LAYOUT.md).

29.09.2026 — BACKDROP_BLUR_GLSL/backdropBlurLod в max-panel-optics.js используются фоном, JourneyFiberGlass и JourneyContextGlass. Матовые контролы без refraction; четыре перекрывающиеся mip-выборки вместо девяти разнесённых. При изменении фильтра собирать MAX и Stand Service, затем обновлять только max-wall-right. [Контракт](LIQUID_GLASS.md).

29.09.2026 — MOVE разрешён в любой фазе клиентской миссии, включая open-max. freePosition сохраняется в runs/starts, restore и замене; planningLayout учитывает эти координаты до preview/arrangeRoute. Пустой drop обновляет существующий DOM, не пересобирает поле и не возвращает пустую подложку к старому месту. Swap до заданий требует попадания в центр фактической плитки. Drag линейный до границы поля. [Контракт](SCENARIO_LAYOUT.md), [253 теста и браузер](../../../artifacts/reports/max-free-drag-20260929/README.md).

29.09.2026 — нажатие на игровую плитку подсвечивает её скруглённый контур (selection spring в IconMotion). Выбранный объект меню замены/задания сохраняет спокойную обводку до закрытия. Центральный tap-beacon удалён из пикера и feedback; подсказки сохраняются. Белые глифы/материал центра не перекрашиваются. Общий clock/renderer, без новых проходов. [Проверка](../../../artifacts/reports/max-selection-outline-20260929/README.md).

29.09.2026 — PlacementFlight в journey-motion.mjs использует один clock для непрерывного маршрута. Старые материалы foreground освобождаются после первого рендера новых, сохраняя shader-program cache при PLACE/rebuild. Новых renderer/RT/RAF нет. [Проверка](../../../artifacts/reports/max-placement-motion-20260929/README.md).

29.09.2026 — journey-dismiss.mjs закрывает открытую task-dialog по короткому нажатию на любую область вне .instruction/.demo-app/.close, включая фон вне journey-zone и промежутки grid. Document capture поглощает pointerup и следующий click, чтобы подлежащая кнопка не активировалась. Внутренние элементы и длинные/cancel-жесты не закрывают окно. [Проверка](../../../artifacts/reports/max-outside-dismiss-20260929/README.md).

29.09.2026 — единая политика ввода обеих редакций: native dragstart отменяется на document в capture, все img создаются с draggable=false, CSS отключает user-drag и случайное выделение текста вне editable-полей. Pointer capture/drag, клавиатура и клики остаются в существующих обработчиках. Новые динамические экраны автоматически защищены общим listener/CSS. [Проверка](../../../artifacts/reports/max-native-drag-20260929/README.md).

29.09.2026 — свободная сборка миссии: выбирать можно любую оставшуюся иконку миссии, ошибочные связи красные, слоты не исправляются автоматически. Замена и swap доступны до заданий; единственный вариант проявляется напрямую. Это заменяет ограничения allowed по ожидаемому шагу. [Контракт](SCENARIO_LAYOUT.md). Обновление только локально.

29.09.2026 — по запросу пользователя исключены все4 экрана ввода/повтора ПИН-кода. Общий ID-путь:9 состояний, источники1–6/11–13. idFlowVersion2 переносит старый прогресс на соответствующий экран, остановку на ПИН — на биометрию. [Контракт](DIGITAL_ID_SCREENS.md).

29.09.2026 — исправлено оставшееся размытие standalone-интерфейса: логический layout1600×900 ошибочно использовался как предел конечного WebGL-кадра. Теперь /max-game/ и /max-game/client/ учитывают размер окна и DPR в штатном бюджете3840×2160. Разрешение мастера4096×1280 не изменено. [Проверка до/после](../../../artifacts/reports/max-ui-native-resolution-20260929/README.md).

29.09.2026 — исправление качества ID: вместо PNG360×800 активны 13 подготовленных SVG, исходные path не переработаны. Figma foreignObject преобразуется офлайн для WebGL; текстуры телефона1600–2048px. [Контракт](DIGITAL_ID_SCREENS.md).

29.09.2026 — создание Цифрового ID во всех игровых редакциях и тестовых миссиях переведено на 13 исходных клиентских экранов с интерактивными зонами, Госуслугами, демо-ПИН и необязательной биометрией. [Контракт, ассеты и миграция сохранений](DIGITAL_ID_SCREENS.md). Прежние описания filler-сцен для создания ID ниже заменены этим контрактом; остальные задания не изменены.

29.09.2026 — [презентационные миссии](PRESENTATION_MISSIONS.md): journey-presentation.mjs добавляет два необязательных сценария в clientContent и build-каталог WebGL. Номера 5/6 и topology должны присутствовать в обоих контрактах. Общий FINAL считает только основные миссии (presentation !== true). QR — локальный PNG официального сайта MAX; реальные Госуслуги не подключены; стела и переход к стенду исключены из игры.

29.09.2026 — последнее указание пользователя: дальнейшие обновления только локально и в локальном мастере; автопубликация отменена. Релиз20260929T110035Z успел выйти до этого сообщения. Следующая публикация только по новому отдельному запросу.

29.09.2026 — клиентская игра использует journey-topology.mjs: квадрат блогера, дерево ID, кольцо общения, один бизнес-инструмент. Постоянные slot ID и отдельные motion-state. Client single зафиксирован; worker мастера открывает client. Первая standalone-редакция остаётся линейной. [Контракт](SCENARIO_LAYOUT.md), [проверка](../../../artifacts/reports/max-topology-20260929/README.md). Записи ниже о правом плюсе/ряде/MST относятся к первой редакции.

29.09.2026 — journey-brand.mjs формирует единый заголовок сервиса для старта и телефонов обеих редакций: оригинальный max-symbol-white.svg и отдельная текстовая подпись MAX. Название не запечено в wordmark, исходные брендовые SVG сохранены. Размеры заданы в journey.css, текст и знак проходят существующий WebGL foreground без нового рендера. [Проверка](../../../artifacts/reports/max-naming-20260929/README.md).

28.09.2026 — выбор иконки летит сразу к целевой позиции итогового ряда (preview через чистый reduce, без сохранения до landing). Остальные узлы заранее получают цели будущего ряда; cancel восстанавливает сохранённый layout. Place omega10.5, planning reflow12. Следующий плюс: position10, reveal7/hide14, hidden size88%; проявление после приближения к новой позиции, caption также7. Общий clock, state/velocity/hit-target/links сохранены.

28.09.2026 — уточнение пользователя: каждый плюс добавления шага сразу открывает picker доступных иконок. Прочтение/закрытие клиентской справки не влияет на PICK. Справка открывается только явным OPEN узла MAX; попапы заданий остаются на этапе выполнения. [Контракт](EDITIONS.md).

28.09.2026 — презентация первого MAX: IconMotion.presentStart сохраняет центр CTA; reveal240ms + hold500ms, затем critical spring omega10 к позиции слева. Logo/plus меняются в одной плитке, original SVG не меняется. Следующий плюс скрыт и inert до посадки. JourneyIntroBurst: пул2 quads,12 расходящихся изогнутых струй,900ms, shader prewarm в prepareGPU, clipping зоны; процедурный эффект, не полноценная симуляция жидкости. Общий foreground clock/renderer, без RT/RAF. Reduced motion сразу завершает intro без всплеска, restore не переигрывает. Смена раскладки очищает transient state. Контракт одинаков для обеих редакций; заглушки клиентских сцен остаются.

28.09.2026 — две редакции: journey-client.mjs содержит справки, расхождения и CLIENT_TASKS; journey-client-ui.mjs — локальные попапы с явными заглушками сцен. Реальные анимированные сцены запрещены текущим указанием пользователя; плавные переходы UI сохранены. Не подменять базовый JSON/TASKS клиентским и не смешивать storage keys. [EDITIONS](EDITIONS.md).

28.09.2026 — safe zones пикера: journey-radial.mjs экспортирует paddedBounds/intersects/revealOrigin, radialLayout принимает obstacles/sizes. Main измеряет реальные подписи после вставки DOM, резервирует старую и новую геометрию поля до WebGL rebuild. Расчёт только при layout; без нового RAF/GPU прохода. При недостатке места fail-closed и transient feedback. Контракт — JOURNEY.md.

28.09.2026 — действующее указание пользователя: обновления MAX после проверки сразу публикуются на Selectel, без повторного запроса на каждый релиз. Прежние записи «только локально / до отдельного запроса» отменены для текущей работы над MAX. Публикация только статического комплекта игры, с SHA-проверкой и сохранением предыдущего релиза.

28.09.2026 — BEGIN_ROUTE теперь записывает starts[mission]={step:'open-max',x,y}, а не реальный task в runs. routeStart отделён от objects/TASKS/completion; PICK требует существующий старт. Main добавляет старт в activeObjects/links под отдельным постоянным id, но OPEN/ANSWER не открывают для него учебный task. MOVE/restore сохраняют координаты старта; прежние сохранения с объектами получают старт без удаления/подмены задач и ответов. routeStartCaption даёт миссионную подпись. Используется brand/assets/logos/max-symbol-white.svg без изменения SVG; decode до запуска GPU исключает первое появление недогруженного знака. Максимальный ряд —6 узлов, адаптивная ширина подписей сохраняется после Continue.

28.09.2026 — пошаговая сборка пути: journey-state хранит plans[mission] = building/ready/playing. BEGIN_ROUTE создаёт только первый шаг; planningSteps проверяет размещённые prerequisites, availableSteps по-прежнему проверяет выполненные prerequisites для OPEN/ANSWER. PLACE последнего шага переводит ready; CONTINUE_ROUTE — playing. Branch можно выбрать и поставить атомарно через PLACE {step,branch}; некорректная пара отклоняется. Старые сессии с выполненными этапами мигрируют в playing, сохраняя координаты/ответы; неполный новый план сохраняет building, готовый — ready.

journey-route-layout.mjs задаёт адаптивный ряд и подпись очередного шага. DOM остаётся деревом layout/input. seedRouteObject передаёт pose CTA в MotionRegistry; route-add сохраняет собственную пружину при открытии/закрытии пикера. В building/ready badgeVisible=false, после Continue плавный reveal. Релэйаут сохраняет скорости; текущие центры участвуют в links уже при движении. Ready-попап использует существующий field-success/Frost/RT и local exit; новых renderer/RAF/RT нет. [Проверки и ограничения](../../../artifacts/reports/max-route-planning-20260928/README.md).

28.09.2026 — [игровые сценарии клиента23.09](CLIENT_WORDING.md) интегрированы в Journey. Новые helpers availableSteps/canChooseBusiness/needsBusinessChoice и taskFor. Исходный DOCX в incoming, без runtime-зависимости от Downloads. Стела/её вординги не переносились.

28.09.2026 — journey-popup-motion.mjs содержит отдельные модели focus, layout и смены текста. journey-main сохраняет instruction/demo-app, заменяет только .instruction-copy и .phone-content в нулевой фазе содержимого; refreshParts не пересоздаёт оболочку и поле. InstructionMotion управляет CSS layout/hit bounds, WebGL обновляет размеры той же SDF-плоскости, не геометрию текста. taskContentPresence общий с Service-оптикой. Состояния отменяются при teardown/layout; новый renderer/RAF/RT не добавлен. [Проверка](../../../artifacts/reports/max-popup-motion-20260928/README.md).

28.09.2026 — «Назад» сохраняет привязку левее левой/выше верхней плитки сети, но весь hit-target и парение ограничены физической UX-полосой1–1.8м. В Service границы пересчитываются из INTERACTION_BAND в локальные координаты host; проверяется и целевая поза, и фактическое состояние пружины после шага. При выходе за границу обнуляется только скорость ограниченной оси. Внутри полосы плавность/скорость сохранены. Standalone ограничен своим viewport без фиктивных метров.

28.09.2026 — «Миссия выполнена» — локальный матовый WebGL-попап поверх поля. `.field-success` включён в foreground layer1 и маску JourneyContextGlass; UI под ним размывается существующим RT, фон/волокна получают context Frost36px. Плавное появление420ms и парение±2px используют прежний clock, reduced-motion даёт неподвижный результат. Остальные игровые объекты приглушаются до45%; подпись объекта, чья плитка перекрыта попапом, скрывается целиком. Нет общего затемнения фона. Кнопка «К миссиям / К финалу» остаётся резкой. Контролы имеют явный приоритет button→popup→world, обе оптические маски выбирают первый покрывающий слой, а не минимальное SDF-расстояние. Полный рефакторинг фильтров всех task-попапов этой правкой не заявляется.

28.09.2026 — активный фон MAX возвращён к композиции VK: насыщенный движущийся градиент, флюидная пиксельная сетка и квадратные буллеты в шести цветах MAX. Прежние широкие silk-волны отключены и сохранены в `artifacts/max-game/design/background-silk-v1/`. На стене используется существующий RibbonEngine/SurfaceField: общая симуляция, координаты, исходная instanced-геометрия и PixelTags; только локальная палитра и оптическая адаптация MAX. Сетка излучает поверх градиента, чувствительность dye ×2.4 не меняет серверную симуляцию. Настройки других экранов не перезаписываются.

Standalone `/max-game/`: тот же GLSL градиента, SharedFluid128×48 (30Hz, максимум2 шага/кадр,8 итераций давления), исходные PixelTags64; адаптивная плоская сетка в шейдере фона, без wall-depth. Это автономная адаптация композиции, не синхронная копия master field. Один прежний RAF/renderer, одна дополнительная R8-текстура6144B, без нового полноэкранного RT; фон/сетка/буллеты проходят через прежний Frost. Пауза/скрытие вкладки/reduced motion останавливают развитие флюида. [Отчёт](../../../artifacts/reports/max-vk-background-20260928/README.md).

28.09.2026 — ANSWER: reducer закрывает task только на последнем этапе. dispatch промежуточных ответов вызывает commit напрямую; renderTask сохраняет оболочку текущего dialog и обновляет содержимое. Не возвращать ANSWER в общий fade-out/fade-in. [Контракт](JOURNEY.md).

28.09.2026 — UX1–1.8м и движение0.8–2.2м разделены. Новые точки изменения: MOVEMENT_BAND/journeyFieldBounds в circle-model, resistedAxis в journey-drag, detached popup в journey-popup. Не возвращать проценты .12…80 как физические границы. Полный контракт — [JOURNEY.md](JOURNEY.md).

28.09.2026 — контекст задания: выбранная плитка остаётся единственным видимым экземпляром и фиксирует текущую позу; скрывается только её подпись. Остальные узлы плавно приглушаются до45%, фон не затемняется. Карточка раскрывается вокруг исходной плитки, скрытый task-icon служит только layout-якорем. objectContextPresence общий для foreground и оптики. Карточка сильнее матовая:36logical px (WEB-калибровка поверх референса Frost56.25). JourneyContextGlass размывает реальный UI под ней/телефоном: один переиспользуемый RGBA8 mipmapped RT, прогретый вместе с шейдером при загрузке в существующем renderer; без открытого задания дополнительного прохода нет. Sharp popup рисуется после фильтра, выбранная плитка — последним слоем. Профили — glass-profiles.json/contextCard.

28.09.2026 — карточка инструкции использует высоту по фактическому тексту: copy + 18px gap + иконка + 18px padding с каждой стороны. Высота не зависит от телефона; иконка сохраняет привязку. instructionLayout выбирает верх/низ по доступному месту. Подложка — существующий frosted-control shader (Frost56.25), без прежней плотной96%заливки; общий фон и волокна матируются до резкого foreground.

28.09.2026 — попап задания привязан центром и размером своей иконки к исходному объекту на поле; transform-origin там же. Телефон зеркалится у правого края. При недостатке места сверху текст располагается ниже неподвижной иконки, сохраняя полосу 1–1.8 м. Активный объект не парит во время задания. Геометрия: anchoredTaskBounds в journey-popup.mjs.

28.09.2026 — задачи и reset теперь локальные context-popup. Не возвращать task-cover/inset:0 на всю зону или исключение поля из WebGL visitor/syncScene при s.task. У локального UI отдельный popupPresence; оптика читает его только у потомков popup/picker. Геометрия — journey-popup.mjs, телефон0.49:1, физическая полоса сохранена. [Контракт](JOURNEY.md).

28.09.2026 — обновлён lifecycle WebGL UI: не удалять старую сцену до выхода JourneyTransition на alpha0. Общая прозрачность должна применяться к статическим надписям, геометрии кнопок, фоновому Frost и волокнам; prepare до расчёта anchors. Контракт — [JOURNEY.md](JOURNEY.md).

28.09.2026 — круговое меню заменило веер: journey-radial.mjs (ring bounds, icon-centred placement), journey-webgl-ui.flyTo (timeline в существующем render loop). Не возвращать close-cross, menu heading и ряд кнопок. При выборе callback проверяет сохранность picker, поэтому закрытое/сменённое меню не размещает объект поздним событием. Исчезнувшие picker удаляются из flight map. Пауза останавливает timeline, reduced-motion пропускает перелёт. Оптические bounds следуют DOM transforms.

28.09.2026 — активный Journey foreground перенесён в journey-webgl-ui.mjs: same-context WebGL, SVG ShapeGeometry, texture-текст, shader-поверхности; DOM только layout/input/accessibility. В webgl-field добавлен setScreenForeground hook после волокон; GPU ресурсы слоя освобождает Journey. journey-drag.mjs отвечает за preview/capture/cancel и MOVE reducer. Не возвращать DOM-иконки поверх WebGL или второй renderer. При динамике обновлять glassRevision и anchors; не писать прогресс каждый pointermove. Задания/финал/миссии сохранены. Подробности — [JOURNEY](JOURNEY.md).

28.09 — стекло Journey исправлено: standalone использует общий PANEL_GLASS_FRAGMENT, отдельный linear HalfFloat фон и оптический проход; CSS больше не перекрывает материал. Кнопки получают собственный Frost, большая панель остаётся clear. Предыдущие указания о действующем CSS fallback заменены. [Проверка](../../../artifacts/reports/max-glass-materials-20260928/README.md).

Актуальная версия — [Journey 1.0](JOURNEY.md). Активный вход src/journey-main.js, стили journey.css, задачи journey-tasks.mjs, reducer journey-state.mjs, SVG journey-icons.mjs. Все описания circular-main/числового маршрута ниже исторические. Сборщик уже выбирает новый вход. Текущий UI — CTA, меню2×2, свободные объекты, контекстный пикер, задания и финал; two/single и физическая полоса сохраняются. [Публикация](DEPLOYMENT.md).

27.09 — новая активная UI-раскладка: физическая полоса реализована, прежняя запись «не адаптирована» ниже историческая. circle-model.mjs: SCREEN_METRES .4881106913…3.0132200718м от STAND_PLINTH0, INTERACTION_BAND615…1020, playBounds и44px hit margin. CSS получает --band-top; исходные размеры glass-панелей не меняются. Menu:2×2/two,4×1/single. Business branches inline, foreground резкий; сохранять glassRevision. Все важные тексты/контролы/loading/pause и объекты целиком в1–1.8м. Аппаратная калибровка отдельно. [Отчёт](../../../artifacts/reports/max-reachable-ui-20260927/README.md).

27.09.2026 — отдельный профиль кнопок: −45°/80%, Depth 33.47, Frost 56.25, Refraction 100, Dispersion/Splay 0. Источники сохранены в `artifacts/max-game/incoming/glass-buttons-*.png`; [профили](../../../artifacts/DESIGN/BRANDS/MAX/glass-profiles.json). `renderZone`/`fit` обновляют `data-glass-revision` для кэширования bounds оптических контролов. Не добавлять transform на hover/active без синхронизации shader bounds. Большая панель и её профиль неизменны. Схема shader/DOM — [MAX_GAME](../../stand-service/docs/MAX_GAME.md); standalone CSS является fallback.

27.09.2026 — после замечаний к стеклу исправлен Service shader: конечный профиль фаски и небольшое увеличение фона без искажения foreground. Разработка игры/ввод/раскладка не менялись. При оценке углов использовать ROI живого потока, не увеличенный preview всей стены. [Исследование библиотек, пользовательских проблем и решения](../../../docs/Research/max-glass-reliability-20260927.md), [актуальный контракт](../../stand-service/docs/MAX_GAME.md). Сильная линза и 60 FPS пока не приняты.

27.09.2026 — стекло панели уточнено по референсу: фиолетовое, Frost/Dispersion/Splay0, свет−68°/70%. Не возвращать голубую авторскую подсветку и matte blur. Код оптики в Service; вёрстка и задача физической полосы1,00–1,80м этой правкой не менялись.

27.09.2026 — новое обязательное требование пользователя: все необходимые интерактивные объекты, кнопки, заголовки, основной текст, инструкции/результаты и их полные hit-target размещаются в диапазоне1,00–1,80м от чистового пола. Действует в обеих раскладках и всех состояниях. Декоративное стекло/фон могут выходить за полосу. Пока зафиксирован контракт; circle-model/circular.css ещё не адаптированы под физический диапазон. Привязать будущую раскладку к фактическим отметкам экрана и полезным1280 строкам, не к высоте окна браузера.

27.09.2026 — новая активная итерация Service: фон всей игровой панели — MaxPanelGlass с blur/refraction, без внутренних сфер. Предыдущий shader сфер сохранён, не переписывать его при доработке панели. Передний план игры не изменён. Возврат реализации описан в [MAX_GAME](../../stand-service/docs/MAX_GAME.md).

27.09.2026 — в мастере two/single теперь маски одного глобального поля из трёх стеклянных сфер, а не отдельные повторяющиеся композиции. Оптика находится в Service max-glass-model/max-liquid-glass, foreground игры не изменён. Не возвращать panel-owner линзам или рескейл при смене режима. В service=1 CSS fallback скрыт. [Исследование и выбор архитектуры](../../../docs/Research/max-liquid-glass-20260927.md).

27.09.2026 — Liquid Glass мастера реализован в service/public/max-liquid-glass.js, оптическая модель — max-glass-model.js. При service=1 circular-main устанавливает data-shader-glass=true: старый CSS #glass скрыт, активен shader фона; DOM и игровой WebGL не участвуют в рефракции и не размываются. Самостоятельная страница вне Stand Service пока использует прежний CSS fallback, поскольку не имеет текстуры общего фона.

27.09.2026 — актуальная 0.5: zonesForLayout в circle-model задаёт two (два квадрата864×864) и single (1760×1024). Обе раскладки целиком на длинной прямой части стены. setZoneLayout меняет активную модель, circular-main хранит отдельные сессии по режимам и перерисовывает контейнеры без создания нового WebGL renderer. Размер сигнального поля масштабируется по ширине зоны; положение/ввод остаются в её безопасной области. glass-orb — CSS-проектная адаптация слоёв с мягким движением, не физическая рефракция. Старые описания трёх кругов ниже исторические.

27.09.2026 — экранные маркеры теперь скруглённые квадраты без stem/anchor/altitude handle; link anchors и hit-test остаются у самих иконок. Связи имеют плавно меняющийся изгиб и пять разнесённых волокон LineSegments2 шириной .006 world units; существующие буферы обновляются без создания геометрии каждый кадр. Частицы интерполируются по волокнам. Конфиг signalLinks: waveAmplitude=.025, waveFrequency=1.4, strandSpacing=.018. Исторический upstream неизменён.

27.09.2026 — версия 0.4: три независимых стеклянных круга на всей стене, один исходный WebGL renderer, локальные световые полосы поверх прежнего фона. circular-main.js / circle-model.mjs / circular.css активны; старые 16:9 и сдвиг отменены. [Текущий контракт](CLIENT_MISSIONS.md).

27.09.2026: запуск/остановка/проверка мастера — только [единый стандарт STARTUP](../../stand-service/docs/STARTUP.md); самостоятельный сервер игры не заменяет мастер и его Spout-источник.
27.09.2026 — получен [клиентский файл о четырёх миссиях MAX](../../../artifacts/max-game/incoming/Пользователь_VK_MAX13.md), сохранён без изменений. [Разбор сценариев и отличий от текущего MVP](../../../docs/Research/max-client-missions-20260927.md). Это входящий материал, не реализованные миссии и не отмена выбранной космической подачи.

27.09.2026: игровой передний план в сервисе прозрачен, фон принадлежит мастеру; walk-ввод и сдвиг вправо описаны в [MAX_GAME](../../stand-service/docs/MAX_GAME.md). Палитра задаётся project-palette.json и max-brand, включая defaults/GLSL/статусы. Сборка применена после запуска мастера; реальный тап в прогулке и прозрачный фон подтверждены. При отказе Pointer Lock работает обычный курсор. Производительность MAX при всех активных источниках пока около 6 FPS.

Интеграция правого экрана реализована: [контракт Stand Service](../../stand-service/docs/MAX_GAME.md). Исходники адаптера — artifacts/service/public/max-game-worker.*, max-game-layout.js, game-page-host.mjs; размещение — src/wall-layout.mjs / wall-mode.mjs. Обновлять игру и Stand Service их отдельными сборщиками.

Весь код, сборка, ассеты, первичные документы, исходные инструменты и web-skills X-Спутника сохранены внутри VK_DigitalProducts. Обращаться к чужому каталогу для дальнейшей разработки MAX не требуется. Исторический путь остался только в метаданных происхождения и неизменённых цитируемых материалах.

## С чего начать

1. [Рабочий контракт и запуск](README.md).
2. [Skill разработки игры](../../../artifacts/skills/max-game-development/SKILL.md), при визуальной работе — [max-brand](../../../artifacts/skills/max-brand/SKILL.md).
3. Исходники `artifacts/max-game/src/`, данные `artifacts/max-game/public/config/`, сборщик `artifacts/max-game/scripts/build.mjs`.
4. [Исследование](../../../docs/Research/x-sputnik-max-game-20260926/README.md) объясняет принятые решения и отличия от X-Спутника.

## Карта материалов

| Задача | Локальное место |
|---|---|
| Развивать MAX | `artifacts/max-game/src`, `public`, `scripts`, `test` |
| Воспроизвести сборку | `package.json`, `package-lock.json`, `scripts/build.mjs`; Three 0.185.1, esbuild 0.28.2 |
| Проверить автономность и целостность | `npm run check:local` |
| Аудио и SVG-контуры | `npm run check:assets` |
| Явно пересоздать водную маску | `scripts/prepare-surface-mask.py` (Python + Pillow), читает только локальный specular; меняет игровые данные, не запускать как обычную сборку |
| Найти исходную реализацию/редактор | `artifacts/max-game/upstream/app/src`, HTML редакторов и `server.mjs` |
| Посмотреть всю исходную логику сборки | `artifacts/max-game/upstream/app/scripts` и исходный package/lock |
| Разобрать исходную регрессию | `artifacts/max-game/upstream/app/test` — полный исходный набор тестов, отдельно от действующего набора MAX |
| Найти исходную текстуру/иконку | `artifacts/max-game/upstream/app/public` — полный исходный public |
| Прочитать исходный GDD, схемы/решения, историю и пользовательские референсы | [Локальные первичные материалы](../../../docs/Research/x-sputnik-max-game-20260926/sources/README.md) |
| Найти исходный skill и references/scripts | `artifacts/max-game/upstream/skills` — 13 web-пакетов |
| Сверить происхождение и полноту переноса | `artifacts/max-game/upstream/manifest.json` — 560 файлов, пути и SHA-256 |

`upstream/app` — сохранённый исходник для разработки и сравнения. Все редакторы и их тесты перенесены как код, но не подключены к интерфейсу MAX. Их добавление в продукт требует адаптации чтения/сохранения конфигов, оформления и запуска. Старый `sync-assets.mjs` сохранён для понимания handoff; у текущего MAX все входы лежат в `public`, поэтому этот скрипт не используется. Исходные Bureau/QR присутствуют только в upstream для полноты первоисточника и не входят в сборку MAX.

## Skills

Активная точка входа — `max-game-development`, привязанная через AGENTS. Исходные пакеты сохранены целиком, включая references, scripts и примеры:

- `x-sputnik-motion-system`, `x-sputnik-performance-budget`, `x-sputnik-three-effects`, `x-sputnik-visual-qa` — проектные контракты.
- `threejs`, `web-animation-design`, `web-design-guidelines` — профильные материалы.
- `gsap-core`, `gsap-performance`, `gsap-plugins`, `gsap-timeline`, `gsap-utils` — для изучения/возможной будущей адаптации; GSAP в игре не установлен.
- `phase` — исходный инструмент аудита и материалы; автоматически не запускается.

Сохранённые требования чужого проекта к бренду, отладочным контролам, браузеру, Git и выпуску относятся к истории. Текущие правила MAX и указания пользователя имеют приоритет. Исходные AGENTS переименованы в `AGENTS.source.md`, чтобы не становиться действующими инструкциями.

## Проверки и перенос

```powershell
cd artifacts/max-game
npm ci
npm run build
npm test
npm run check:assets
npm run check:local
```

Для обычной работы используются только npm-зависимости из registry по lockfile и файлы текущего проекта. `node_modules` не считается переносимым исходником: на другой машине выполняется `npm ci`. Для запуска готовой игры npm не нужен. Для переноса всей среды разработки сохранять `artifacts/max-game`, `artifacts/skills`, `artifacts/DESIGN/BRANDS/MAX`, `apps/max-game/docs`, соответствующее исследование с `sources` и общие документы. Готовый runtime-комплект содержит только игру; исторические материалы и инструменты в него не добавляются.

В snapshot не включены чужие node_modules, dist/runtime/backups, VPS/deploy-инфраструктура, доступы и TouchDesigner-проект. Они не нужны для сборки/развития этой WEB-игры. Полный список исключений записан в manifest. Новых ZIP нет; материалы хранятся обычными файлами.


### 02.10.2026: раскладка shared WebGL после задания
В `guided-reveal/?backend=local` (также server) drag узлов временный в пределах задания. При уходе телефона контроллер после отпускания контакта возвращает все базовые цели и сбрасывает ручное положение устройства. Анимационные владельцы остаются прежними. Shared WebGL больше не записывает drag в SessionPort layout и не применяет прежние сохранённые координаты; записи сохраняются для совместимости других редакций. Site в этой итерации не менялся. Визуальную приёмку выполняет пользователь.


### 02.10.2026: параметры Reveal по образцу Site
Базовый ряд: 400 px между центрами. В wall/service визуальная игровая рамка не обрезает иконки/связи; ширина drag равна ширине сцены 4096 px, вертикальные ограничения сохраняются. При закрытии задания остаётся возврат штатной раскладки. Параметр network.links[].reveal (0–1, по умолчанию 1) задаёт видимую длину связи, visibility по-прежнему задаёт прозрачность. Дробный конец отсекается на CPU, частицы за ним скрываются атрибутом; новое выделение буферов на кадр не требуется. При reduced motion раскрытие сразу полное. Визуальная проверка — пользовательская.


Уточнение 02.10.2026: текущий шаг Reveal — **800 px** между центрами. Правая граница drag снята, ряд может продолжаться за видимый экран; камера сохраняет фокус текущего задания. Предыдущие значения 400 px и ограничение drag справа выше — история предыдущей итерации.


Последнее уточнение 02.10.2026: вместо фиксированного шага 800 px используется зазор **400 px между краями** игровых элементов. Шаг плиток = ширина плитки + 400 (640/656 px). Телефон/ПК получает такой же зазор с обеих сторон; справка сохраняет отдельный отступ. Правый выход за экран разрешён.

## 03.10.2026 — v5: единая оболочка телефона/PC

V5RevealJourney хранит presentedDevice отдельно от targetPhoneMetrics. Высота обоих форматов 800; PC ширина 688×800/560. V5DeviceMorph использует maath V5MotionValue и существующий renderer clock: out → resize → готовность decode/GPU → in. Оболочка DOM сохраняется, обновляются её children; во время resize нет refreshPart. Этот переход применяется внутри одного задания. Между заданиями применяется последовательность, описанная ниже. Старые renderer не меняются. [Проверка и ограничения](../../../artifacts/reports/max-v5-device-morph-20261003.md).

## 03.10.2026 — v5: смена задания отдельно от смены экрана

V5RevealJourney.handoff координирует maath и прежние pose/phone springs: unlink, exit, pack, trace, enter, link. Поля deviceVisibilityTarget/deviceLinkPresence/deviceLinkReveal питают единую сцену. Exit ждёт deviceHidden, pack — settled; enter допускается после deviceReady (decode+GPU). Во время handoff ответы не принимаются, pause не продвигает его, новый run удаляет handoff и pending. При скрытом телефоне syncLinePhone подготавливает следующий экран без дополнительного морфинга. Внутри задания действует V5DeviceMorph. [Проверка](../../../artifacts/reports/max-v5-task-handoff-20261003.md).

## 03.10.2026 — v5: один ряд и motion profile

arrange сразу использует V5.phoneLayout, включая место устройства; trace не меняет цели ряда/камеры. V5_MOTION — общий профиль: travel10/presence12/drag14, popup.45/.45, trace/fan.65. Настройки передаются в прежние IconMotion/JourneyTransition/InstructionMotion, defaults старых renderer сохранены. SharedRevealJourney принимает optional revealTiming; V5 убирает только дополнительные минимальные ожидания, settled сохраняется. Cosmetic popup fade не блокирует handoff; content preparation блокирует. Hidden/pause обнуляет dt v5 foreground. [Проверка](../../../artifacts/reports/max-v5-cadence-20261003.md).

## Reviewed asset replacements (04.10.2026)

`src/reviewed-content/asset-replacements.json` хранит пользовательские замены изображений отдельно от исходного vendor и разметки. `scripts/apply-reviewed-assets.mjs` применяется после applyAssetFlow; проверяет предыдущий SHA, сохраняет ID/contentRevision, масштабирует существующие image-space rect по фактическим новым размерам. `node artifacts/max-game/scripts/apply-asset-flow.mjs` пересобирает reviewed catalog; scoped V5 builder включает файлы из public/assets по новым путям. При изменении структуры экрана требуется новая пользовательская разметка, а не автоматическое предположение. В этой замене компоновка совпала: business.platform.verification,880×550. [Отчёт](../../../artifacts/reports/max-business-screen-3-20261004.md).

Для replacement отключённого экрана указывается assetId; compiler сверяет source task/screen/asset, metadata.disabled и отсутствие активных ссылок. Это обновляет ресурс, но не включает экран. Пример — business.store.ready (04.10.2026).

По следующему запросу пользователя тот же PNG подключён к активному business.store.result (figma.296-19936): asset-only replacement, прежняя below-screen кнопка complete-task. Отключённый ready не включался.
