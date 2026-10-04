# MAX v5: загрузка сценарных ресурсов при запуске

Адрес: http://localhost:8770/max-game/webgl-v5/?backend=local&layout=wall&v=preload-1

Пользователь сообщает задержки появления, постановки в ряд и связи с телефоном. Код подтверждает отложенную работу: прежняя предзагрузка — только первые2 screens/task, Canvas/SVG paint и texture upload выполнялись при первом появлении; UI prepareGPU прогревал лишь contextGlass/introBurst. GPU-профиль именно пользовательского зависания не снимался; единственной причиной это не объявляется.

Реализация только для v5/shared backend:

- Three.js0.185.1 ImageLoader/LoadingManager + native decode загружают60 URI:57 разных изображений актуальных сценариев, официальный QR,2 логотипа.65 экранов16 заданий всех6 миссий;8 missing не получают фиктивного контента. Все URI обязательны: ошибка/таймаут блокируют готовность вместо allSettled fallback.
- Декодированный Image переносится в реальный DOM без нового src/decode; crossorigin сохранён, чтобы изменение атрибута не перезапускало загрузку. Старый on-demand warmSharedAssets отключён только в этом режиме.
- При prepareGPU тот же renderer visit/paint/text/SVG cache готовит иконки/статусы,2 состояния ладони, active/paused экранные варианты,12 вариантов финала.144 подготовительных batch; backend-команд и отдельного стенда нет. Используются renderer.initTexture, compileAsync и render на уже существующем contextGlass.target; новых RAF/RT нет.
- Cache keys закреплены, материалы держат shader-program references до dispose. Размерные ключи v5 округлены до1/64px, чтобы ошибка float от CSS масштаба не уничтожала попадание в cache; геометрия не меняется. Перед включением ввода ожидается полная подготовка field/UI GPU. root.inert и стартовый loading снимаются после await; позднее decode после dispose не заселяют cache.
- Диагностика runtime: html[data-asset-preparation=ready/failed], #circles.dataset.startupAssets содержит batches/images/textures/pixels после реального прогрева. Эти значения агентом из браузера не считывались.

[Исследование и ограничения](../../docs/Research/max-v5-startup-assets-20261003.md). ThreeMIT используется фактически для проблемного механизма, собственного loader/compiler нет. Дизайн, фон, правила, сохранения и предыдущие runtime не переключались.

Техническая проверка PASS:

-38 Node-тестов:5 новых (полнота сценариев/веток/QR, source copy/metadata без изменения каталога, настоящий Three ImageLoader/LoadingManager на минимальном host shim, ожидание decode, adoption без повторного запроса, failure/dispose) +33 v5 route/inertia/shared reveal/popup. Shim не декодирует реальные пиксели и не исполняет WebGL.
-Syntax3 изменённых модулей, duplicate guard, scoped build/CSS:177 modules,1458715 bytes,8 файлов.
-HTTP SHA8/8 конечной сборки, cache-control:no-store. Статические60 ресурсы23,754,119 bytes проверены HTTP/локальныеSHA; каталоговые57+QR также совпали с catalog SHA. mode=run; назначения/процессы master не менялись. [Данные](max-v5-startup-assets-20261003.json).

Визуальная/GPU проверка и исчезновение stutter остаются открытыми по запрету самостоятельного браузерного обхода. GPU startup path реализован, но не исполнялся агентом; фактические time/VRAM/FPS не измерены. Инициализация более длительная и cache использует больше памяти. Динамический таймер/feedback/новый viewport могут создавать дополнительные строки/размеры; runtime создание связей и DOM measurements не устранены этим шагом. Нельзя утверждать, что любая задержка устранена.

Пользователь: открыть ссылку/дождаться подготовки → выбрать миссию и удержать ладонь → оценить выстраивание ряда и появление связи с первым телефоном, затем следующий экран.
