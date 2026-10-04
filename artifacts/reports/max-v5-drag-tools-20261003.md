# MAX v5 — первый drag и постоянные инструменты

03.10.2026. [Исследование](../../docs/Research/max-v5-tools-20261003.md). [HTTP/SHA](max-v5-drag-tools-20261003.json). [Лог49 тестов](max-v5-drag-tools-20261003-tests.txt).

## Исправленная причина

Реальная иерархия: journey-zone → playfield.guided-field (top100px) → object. `guidedIconGeometry` вычитает100, а вложенное поле добавляет100. Предыдущая обратная формула захвата ещё раз прибавляла100 и превращала первое движение в сдвиг вниз. Прежний CPU-тест не учитывал вложенность и был недостаточен.

Renderer теперь возвращает actualMotion - measuredLayoutTarget, main прибавляет эту разницу к controller.pose(node). Убираются догадки про начало контейнера. Порог7px, maath фильтр телефона14 и блокировка bob/размера во время capture сохраняются. Release освобождает retained owner по semantic ID даже после перестроения DOM.

## Восстановленные инструменты

- Панель «Отладка MAX»: фаза, задание, revision, backend, готовность ресурсов/фона.
- Переключатель диагностической пиксельной карты с ранее заданными границами LiDAR/комфортной высоты1–1,8м.
- «Вся стена / Зона LiDAR»: физический viewport из v4, одинаковый transform фона/игры/карты; игровое состояние и камера не перенастраиваются при выборе вида. Логическая стена остаётся4096×1280. Это масштаб области просмотра, не новая раскладка или изменение размеров устройств.
- Градиент кнопок: native WAAPI v4 управляет случайными фазами и темпами; Three вращает только UV цветовой карты. Скругление отдельно в неподвижной alphaMap, глиф/текст неподвижны. Нового RAF, shader solver и постоянного Canvas repaint нет. Цветовые карты/маски прогреваются существующей startup-подготовкой.

Все панели находятся вне #circles, поэтому его innerHTML/inert/переходы ими не владеют. SVG карты вне #circles, внутри arena, pointer-events:none. Градиентный контроллер получает pause при hidden/reduced-motion. При dispose освобождаются Animation и clones текстур.

## Проверки

PASS49 CPU: фактические pointer handlers, извлечённый fit, вложенный inset100 из текущего CSS, первая delta при отстающем движении, отпускание/отмена,30/60/120Гц, одинаковый maath с телефоном, Three UV/неподвижная alphaMap/нет увеличения версии upload при rotation, phase spread/rate/pause, существующие backend/row/preload/viewport проверки. Тест фиксированной высоты из bfm-viewport относится к v4 helper и не является проверкой высоты телефона v5.

PASS syntax8 JS/тестов, duplicate guard, scoped build181 modules/1 472 215 bytes app.js/CSS validation. PASS181 source SHA и8/8 runtime HTTP SHA, no-store; LiDAR URL200 и все маркеры панели в bundle. Собран только apps/max-game/webgl-v5. Браузер и GPU не запускались; тесты Animation используют fixture, это не проверка native clock на экране.

Ссылки для приёмки:

- `http://localhost:8770/max-game/webgl-v5/?backend=local&layout=wall&v=drag-tools-2`
- `http://localhost:8770/max-game/webgl-v5/?backend=local&layout=lidar&v=drag-tools-2`

Проверить захват→первое движение; переключение вида на текущем задании; ползунки/паузу и наличие панели после смены стадии. Статус: технически проверено, видимая приёмка открыта. Отдельный новый Figma-backend этим исправлением не активирован; мастер/TD/остальные runtime не переключались.
