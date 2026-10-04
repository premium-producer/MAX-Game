# MAX BFM — установленное расхождение маски

03.10.2026. Пользователь сообщает, что фон не повторяет реальную маску стенда. Изменения рендера/мастера в этой диагностической итерации не выполнялись.

## Причина

BFM → journey-common-map-background → viewer/common-map-game-background → CommonMapBackground подписывается на state через connectService. Это настройки, не кадры маски TD. CommonMapBackground создаёт облегчённый field без externalMask/receiveControl и не назначает externalMaskKind у двух LumicellsBackground. Он вычисляет процедурный рисунок, даже когда мастер уже получает маску TD.

Настоящий стенд: MaskInputHub → vk-control-frame IPC → native-preload.onControlFrame → max-game-worker → MaxSharedBackground.receiveControl → SurfaceField.receiveControl/externalMask → LumicellsBackground.inputs. Это другая цепочка. В браузере локальной игры native-preload отсутствует; доступного read-only HTTP-маршрута для бинарных TD control frames сейчас нет. /api/state содержит только метаданные tdMasks, не пиксели.

## Доказательства

- source/HTTP SHA совпадают для common-map-background.js, common-map-game-background.js, common-map.js. Это не установленная проблема старого HTTP-файла.
- /api/state: оба rear worker running, error=null, large/fine live=true. MAX MainRight sequence330327, sourceFrame791348; повторный запрос: MAX sequence334310, sourceFrame798705, worker frame440599. Продвижение подтверждено.
- Код native worker получает кадры через window.vkNativeOutput.onControlFrame. Общий просмотрщик/browser adapter этот API не использует.
- У SurfaceField задан таймаут1500мс; после него procedural fallback. Browser adapter не получает TD-картину изначально.

Предыдущая формулировка «актуальный фон стенда подключён» была неверной: подключены настройки и общий renderer, но не фактические входные текстуры. Browser/GPU не запускались; кадр в конечном браузере не проверен.

## Кандидат для следующей интеграции — ещё не выбран и не проверен

Обязательное ограничение: переиспользовать существующий MaskInputHub и атомарный RGBA atlas MainRight, не запускать второй Spout receiver. Кандидат для проверки: предоставить браузеру read-only доставку последнего полного кадра по тому же ограниченному бинарному HTTP-подходу, который уже используется DepthMaskFeed. В рендере переиспользовать SurfaceField-обработку atlas/offset/color/morph и существующий shader input externalMask. Показывать потерю TD-потока явно, не выдавать процедурный fallback за реальный стенд. Проверить номера sequence/sourceFrame, целостность/свежесть и фактический кадр после интеграции.

Это требует кода host/server и применения с перезапуском Stand Service; одним обновлением BFM JS цепочку не подключить. При текущем запрете трогать работающий мастер эта активация не выполнялась. Нового транспорта/сервиса/симуляции/видеопотока как обхода не создавали.

Перед реализацией требуется исследование ограничений готового способа доставки. Бинарный HTTP-путь — существующий проектный прецедент для DepthMaskFeed, но не доказанная интеграция TD atlas. Это CPU-копирование малой управляющей текстуры, не zero-copy GPU; задержка и нагрузка не измерены. Совпадение остальных композиционных слоёв также не доказано.

## Подготовленная реализация, 03.10.2026

Добавлены read-only /api/td/control-frame?atlas=MainRight и GPU-host.getControlFrame → MaskInputHub.snapshot. Получатель остаётся один; HTTP не создаёт подписчиков Spout. SurfaceField и browser CommonMapBackground используют один TDControlTexture. BFM включает mask=stand; другие варианты сохраняют свой режим. Обе LumiCells ветки получают externalMaskKind large/fine. Применяется исходный атомарный RGBA8 без ресэмплинга/видео. При истечении1500мс browser сохраняет последний реальный кадр и сообщает ошибку существующему adapter; синтетическая подмена не рисуется.

PASS20 CPU-тестов:9 MaskInputHub,5 новых интеграционных native packet → реальный isolated HTTP → Fetch → Three180 DataTexture,3 BFM start,3 layout. Проверены RGB/bytes целиком, sourceFrame/sequence, morph и offsets44/89, reuse texture + needsUpdate.version, отсутствие второго receiver, stale/missing/unknown/origin, усечённый payload и late callback/dispose. Syntax11 файлов и duplicate guard PASS. Первый sandbox-запуск тестового сервера отказал spawn EPERM в существующей nvidia-smi telemetry; остановлены только два моих test PID, повтор изолированных CPU-тестов с разрешением прошёл. Браузер/видеозапись/GPU-render не запускались.

Runtime: scoped build_service --sync-td-control-preview (7 файлов), build_bundle --sync-game-background (2 файла), build-bfm-runtime (25 модулей,151427bytes). Scoped builders сохраняют остальные runtime-файлы, проверяют установленный manifest перед заменой и обновляют SHA; ZIP не пересобран. Пользовательские JSON/TD/нативные бинарники не изменялись.

HTTP/source SHA совпадают6/6: BFM app,2 viewer JS,shared texture/feed,SurfaceField. Однако живой сервер всё ещё возвращает405 на новый маршрут: он загружен до изменения server/main. mode=run; MAX running/error=null, sequence365967/sourceFrame857307; native маска продолжает жить. Новая доставка до конечного браузера ещё НЕ активирована. Для одного штатного перезапуска запросили разрешение пользователя. Это открытая граница приёмки, не закрытый дефект.

Исследование: [готовые платформенные механизмы и ограничения](../../docs/Research/max-bfm-stand-background-20261003.md).

## Активация по разрешению пользователя

Stop.bat → подтверждённый offline → StartDemo.bat --no-open. Прежний run сохранён; штатный health-check PASS всех5 источников, generation обновлены, Spout sending, ошибок нет. Config JSON SHA и назначения сохранены. Фон игровой версии на стенд не включался; TD не изменялся.

Настоящий маршрут200:250×65 RGBA8/65000bytes, валидная MSK255/schema1/MainRight подпись, sourceFrame совпадает с header atlas bytes. Sequence1006→1016/sourceFrame919713→919731, age16→12мс. Реальные модули TDControlFeed/TDControlTexture получили живые HTTP snapshots на CPU:sequence2164→2169/sourceFrame921851→921860, offset44/morph=true. BFM app HTTP/runtime SHA совпадают. [Точное состояние до/после](max-bfm-mask-restart-20261003.json).

**Активировано и технически проверено.** В браузере agent не открывал страницу; GPU upload/final render/FPS/полное визуальное совпадение не проверены, ожидается кадр пользователя.
