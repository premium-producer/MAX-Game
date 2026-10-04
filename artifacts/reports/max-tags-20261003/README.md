# MAX — третий вид тегов

03.10.2026. [Ресерч готовых механизмов](../../../docs/Research/max-tags-variant-20261003.md).

## Реализовано

Переключатель LumiCell / Discovery / MAX в общей карте, разделе «Теги». MAX переиспользует DiscoveryTagEngine и инстансированную стеклянную оболочку/кант, но отключает field update, cell coverage и glow draw. Текстовые теги — таблетки с радиусом H/2; emoji — W=H и тот же радиус. Контент emoji стабилен по seed/индексу, регулируется emojiShare (0..1), рисунок штатного системного emoji-шрифта. RGB сохранён через CanvasTexture r180 и premultiplied label pass. Нового renderer/target на объект нет; существующий групповой target сохраняется для переключения обратно в Discovery.

Для текстового MAX использован исходный Max Sans Medium из брендового пакета, побайтно скопирован в portable assets/brands/max/fonts/max-sans-medium.woff2. FontFace загружается до создания арки, в том числе при count=0. Системный emoji-шрифт не распространяется с приложением; внешний вид зависит от ОС.

Настройки сохраняет прежний revision API в apps/stand-service/configs/discovery-tags.json. Старые JSON получают discovery без перезаписи при чтении. MAX/Discovery сохраняют транспорт при смене вида. LumiCell использует прежний TagBatch с его штатной скоростью; отсутствие индивидуального speedSpread явно указано в UI. Параметры MAX не распространялись на отдельный экспериментальный поток Discovery на ленте.

## Техническая проверка — PASS

- node --check изменённых JS; 26/26 профильных CPU-тестов, включая старый JSON, revision safety, seed, пропорции и сохранение центра движения. Старый source-string assertion белого label обновлён для RGB, запрет glow текста сохранён.
- Duplicate guard; build_bundle.py, build_ribbon_mvp.py; штатный build_service_public.py применил только worker.js/discovery-tags-settings.js. Первый повтор worker builder получил transient Errno22; повтор прошёл, SHA проверены. ZIP stand-service этим точечным builder не обновлялся.
- [source/runtime/HTTP SHA](verification.json) совпали для 9 затронутых модулей/ассетов.
- Штатный Stop→StartDemo --no-open для загрузки серверной схемы, затем точечный restart арки для font gate. Run/economy сохранён.
- На работающем источнике: count0→restart→count60 успешно; MAX→Discovery→LumiCell→MAX без смены generation; running/error null. Check.bat: 5 sources running/Spout sending. FPS не является нагрузочной гарантией, TD-приём отдельно не проверялся.

## Короткая браузерная проверка — PASS с ограничением масштаба

Одна внутренняя вкладка: /viewer/common-map.html → раздел тегов → MAX, сервер сохранил; повторное открытие показывает MAX/60/.25. Оболочка заблокирована для MAX, share доступна. /service/presentation.html?instance=vk-arch показывает фактический WebRTC поток: таблетки с текстом, круглые цветные emoji, нет локальной белой сетки MAX. Возврат Discovery показывает клетки, LumiCell — прежние красно-синие плашки. После восстановления MAX внешний вид вновь соответствует нужному варианту. Console error/warn: []. Снимки показаны в ходе браузерной проверки в чате; отдельные файлы кадров не экспортировались.

Это уменьшенный поток, достаточный для проверки типа формы, наличия emoji и переключения. Художественная оценка канта/материала на нативном TD и плавности остаётся пользовательской приёмкой OPEN. Запись видео/нагрузочный GPU-тест не выполнялись.

Финальное состояние: MAX на арке, count60, emojiShare.25, speed1, spread.35. Исходная настройка Discovery доступна для возврата. Арка — единственная подключённая поверхность общего tag transport; фон, маски TD и остальные поверхности не менялись.
