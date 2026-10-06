# MAX-SHOW-02: устройство для видео и темп автопрохождения

05.10.2026. Исходная система — принятый MAX-SHOW-01 из `F:/project/VK_DigitalProducts_Stand/artifacts/production-source-max-show-20261005`; самостоятельный MAX-Game не заменяет эту managed-версию.

## Решение на существующих компонентах

- Video.js 8.24.1 (Apache-2.0) и videojs-playlist 5.2.0 (Apache-2.0) сохраняют декодирование, порядок и бесконечное повторение. [Player API/source](https://docs.videojs.com/player.js.html): `loadedmetadata`, `videoWidth`, `videoHeight`, `pause`, `dispose`. Размер берётся после metadata каждого элемента, не из предыдущего ролика. Один плеер, preload metadata, без новой загрузки всего плейлиста.
- maath 0.10.8 (MIT), уже внутри V5MotionValue/V5DeviceMorph, управляет изменением ширины. [README](https://github.com/pmndrs/maath): damping допускает прерывание/смену цели и не привязан к частоте кадров. [Реальный issue33](https://github.com/pmndrs/maath/issues/33) описывает скачки при подстановке обычной easing-кривой вместо ожидаемого decay: оставлен библиотечный damping по умолчанию.
- Рамка — именно существующий `paintBfmPhone`, метрики `V5_DEVICE_FRAME` и `v5DeviceMetrics`: высота800, поля10×12, пропорции от ассета. Canvas позади Video.js использует ту же рамку и неоновую подсветку, не второй CSS-дизайн.
- Native Web Animations API обеспечивает конечные fade/scale последовательности; [Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished) показывает ожидание окончания перед удалением DOM. Отмена старой анимации сохраняет текущую видимую позу. Отдельные свойства: maath — ширина/контент устройства, WAAPI — его внешний вход/выход; перед закрытием morph остановлен.
- Настройка сохраняется существующими DBOS3.2/SQLite/CAS/receipt. [DBOS transactions](https://docs.dbos.dev/python/tutorials/transaction-tutorial), [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html). Только добавление `screen_delay_ms DEFAULT1000`, старые receipts не переписываются. Значение фиксируется на запуск в имеющейся bind-транзакции; новые workflow-шаги в историю не вставлены.

## Ограничения и проверка

Iframe нельзя удалять до завершения выхода. Внешний native overlay ждёт адресное сообщение закрытия с проверкой source/origin/requestId, максимум2500мс. При pagehide/аварийном завершении процесса гарантировать видимую анимацию невозможно. Краткая потеря HTTP-связи сохраняет здоровый плеер; это не добавляет HA.

Библиотечные возможности выше подтверждают механизм, но не стендовый результат. CPU, браузерная проверка и ограничения: [отчёт](../../artifacts/reports/max-show-device-20261005/README.md). Физическая LED/Spout-приёмка и применение F остаются открыты.

## Уточнение05.10: непрерывный фон, переходы роликов, галочка и AA

Пользователь уточнил: фон остаётся тем же живым общим фоном правой стены. MAX wrapper прозрачен, самостоятельный фон в managed game выключен. Сохраняется свежая принятая правка прозрачности managed index (`:root{color-scheme:normal}`), а accepted-source pin строится от текущего F, чтобы не откатить её.

Видео: плеер больше не меняет source немедленно на ended. Через публичные `playlist.autoadvance()`/`playlist.next()` Video.js playlist5.2.0 порядок и repeat остаются библиотечными; before-item callback ждёт существующий maath fade контента, затем metadata нового ролика меняет размер и проявляет картинку. Frame/фон не заменяются. Официальный Player API: https://docs.videojs.com/player.js.html; установленный исходник plugin `dist/videojs-playlist.es.js` next()/nextIndex()/repeat(), описание api на https://github.com/videojs/videojs-playlist/blob/main/docs/api.md неполное(TODO), поэтому поведение дополнительно сверено с закреплённым package5.2.0, а не выведено из текущей документации.

Галочка: подтверждено, `.v5-completion-check` не относится к `.badge`, поэтому прежний badge MotionValue на неё не действовал. Отдельное состояние maath на существующем clock; нет CSS-перехода, который не попал бы в WebGL.

AA: https://threejs.org/docs/pages/RenderTarget.html — samples0 по умолчанию, MSAA default framebuffer не переносится в промежуточный render target; реальный опыт https://discourse.threejs.org/t/what-aa-method-does-antialias-true-use/15146. Three0.185.1/MIT уже в проекте. Context-glass target получает4samples до1080p и2выше с clamp GPUcapabilities, DPR не повышается. https://threejs.org/docs/pages/ShapeGeometry.html — curveSegments; SVG галочки24 вместо10. Это исправляет подтверждённый путь, но не доказывает устранение любой лесенки без визуальной проверки.

Подготовка изображений: https://threejs.org/docs/pages/WebGLRenderer.html описывает initTexture для исключения first-use stall. Реальный CanvasTexture случай и ответ сопровождающего: https://discourse.threejs.org/t/how-to-improve-texture-first-render-performance/10436. Нельзя заменять boundedcurrent/next на предварительное декодирование всего каталога. Сам факт использования API не доказывает отсутствие задержек; нужны данные фактического перехода.

## Уточнение05.10: загрузка при открытии и остаточные рывки

Фактическая причина повторной подготовки — удаление `iframe.src` на OFF/смене run и перед видео. `pagehide` освобождал Three renderer, программы и все тёплые текстуры. HTTP-кеш или скрытая надпись этого не исправляют. Используем уже установленный Three0.185.1/MIT: один renderer и его подготовленные ресурсы живут до закрытия хоста; между назначениями меняются только SessionPort/контроллер с проверкой свежего trusted context. `compileAsync` и `initTexture` реализуют сам механизм подготовки GPU; отдельного собственного кеша шейдеров или новой библиотеки загрузки не добавляем. CPU/session-обвязка не получает права мастера.

Официальный API: https://threejs.org/docs/pages/WebGLRenderer.html. Реальный описанный опыт первого кадра и `KHR_parallel_shader_compile`: https://discourse.threejs.org/t/reducing-shader-compile-time-on-scene-initialization/56572. Ограничение: асинхронная компиляция зависит от расширения; перезапуск процесса/потеря WebGL context всё равно требует новой подготовки. Нельзя обещать отсутствие любого GPU stall только по Promise readiness.

Дополнительно найдены перемежающиеся DOM writes(transform/radius) и reads(bounds) для каждого объекта. Рекомендация команды Chrome https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing объясняет forced synchronous layout и пакетирование чтений/записей. Сохраняем существующие maath/Three координаты и группируем операции; это применение браузерного механизма layout, не новый движок анимаций. Опциональная диагностика раздельно измеряет callback/rebuild/pose/optics/links/render CPU, чтобы следующие правки опирались на наблюдение. Эти значения не равны времени GPU.
