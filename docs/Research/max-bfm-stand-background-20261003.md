# BFM MAX — повторное использование фона стенда

## Исправление пути живой маски, 03.10.2026

Для обычного браузера выбран стандартный Fetch/ArrayBuffer → Three.js DataTexture. Получатель Spout остаётся существующим MaskInputHub; HTTP читает только его последний свежий атомарный кадр, не запускает новый native receiver. Shader externalMask и обработка offset/color/morph уже реализованы LumiCells/SurfaceField; существующая обработка вынесена в TDControlTexture и используется обоими потребителями. Нового алгоритма маски/движка/формата пикселей нет. TDControlFeed — ограниченная интеграция стандартного Fetch с готовым атласным контрактом, по существующему проектному подходу DepthMaskFeed.

Проверенные источники и опыт:
- [Electron sharedTexture](https://www.electronjs.org/docs/latest/api/shared-texture) — импорт OS shared handles доступен Electron main, не обычному web iframe. Альтернативный нативный путь требует другого host-контекста; для текущего браузерного URL не выбран. Electron проекта44.4.5, MIT.
- [Three.js DataTexture](https://threejs.org/docs/pages/DataTexture.html) и [Texture.needsUpdate](https://threejs.org/docs/pages/Texture.html) — готовая загрузка TypedArray в GPU, явное обновление, NearestFilter/NoColorSpace. Используется поставленная revision180, MIT; новые библиотеки не устанавливались.
- [Реальный issue23783](https://github.com/mrdoob/three.js/issues/23783) — конструктор DataTexture не гарантирует автоматического needsUpdate. В общей обработке это установлено при создании и каждом новом кадре.
- [MDN Response.arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer) — бинарный ответ целиком, отмена через AbortSignal. Это платформенный Fetch, без нового транспортного пакета.
- Проектный опыт: MaskInputHub/SurfaceField уже работают на native стенде; диагностикой подтверждены live=true и продвижение sourceFrame/sequence. DepthMaskFeed использует ограниченный binary HTTP. Это опора интеграции, но не доказательство FPS нового потребителя.

MainRight250×65 RGBA8 =65000 байт/снимок, все physical/color страницы сохраняются. Передаётся малая управляющая текстура; фоновая композиция остаётся локальной GPU. Это не zero-copy из GPU: CPU-копия и upload присутствуют. FPS/полное совпадение композиционных слоёв не обещаются до проверки. Один запрос в полёте, timeout2с, свежесть1500мс; скрытие/пауза существующего renderer ограничивают опрос. Прерывание/повреждение не заменяет подтверждённый кадр, процедурная подмена отключена только в BFM opt-in mask=stand. Для старых renderer режим не меняется.

[Фактическая проверка](../../artifacts/reports/max-bfm-live-mask-gap-20261003.md). Применение маршрута требует перезапуска сервера; пока запрошено разрешение из-за прежнего прямого запрета пользователя менять работающий мастер.

**Опровержение полноты интеграции, 03.10.2026:** повторная проверка показала, что готовый browser adapter не получает TD control atlas, хотя native стенд уже использует его. Выбор этого адаптера обеспечил общие настройки, но не требуемую идентичность живой маски. Это незавершённая интеграция, а не подтверждённое решение задачи. [Фактическая проверка](../../artifacts/reports/max-bfm-live-mask-gap-20261003.md). Дальнейший транспорт должен переиспользовать полученные кадры и быть проверен отдельно; zero-copy/FPS не подтверждены.

Выбран существующий journey-common-map-background.mjs, уже подключаемый в Guided Reveal через background=live. Он открывает /viewer/common-map-game-background.html?output=1 с собственным import map и тем же CommonMapBackground, что использует общая карта. Своего шейдера/симуляции в BFM больше нет.

Проверены исходники common-map-game-background.js, common-map-background.js, common-map-game-layout.js. Настройки берутся из Stand Service commonMapVisual/visual/background/pixelMap; время — из clock ribbon-up с serverTime offset. Из единого домена7168×1280 выводится правый участок4096×1280 (началоX3072); viewport/DPR учитывает готовый layout. SSE передаёт настройки, video() не вызывается: это локальная GPU-отрисовка, не копирование видеопотока или GPU-текстуры из другого процесса.

Используется внутренний существующий код текущего репозитория и его Three.js/LumiCells runtime без новых внешних пакетов и изменения лицензий. Это повторное подключение готового механизма, не новый движок. Практическая опора — уже существующий Guided Reveal adapter и CPU-проверки layout. Снимки прошлой пользовательской проверки показывали общий клеточный фон; точное совпадение текущего кадра и FPS в BFM не заявляются без визуального отзыва. Общий просмотрщик и стендовые настройки здесь не меняются.

Наблюдаемая конфигурация: mode=run, style=cubes, dualScale=true, fill/flow доступны. Ограничения: нужен работающий Stand Service и его viewer/ribbon/service ресурсы; автономный статический BFM bundle без них недостаточен. Live style, который не запускает локальный CommonMapBackground, не выбран; текущий cubes поддерживается. При hidden используется существующий pause API, при закрытии dispose. Старое локальное оформление в исходниках других версий сохраняется.

[Проверка](../../artifacts/reports/max-bfm-stand-background-20261003.md).
