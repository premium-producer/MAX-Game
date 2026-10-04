# Импорт снятых экранов в Figma

Готовый комплект: `artifacts/DESIGN/figma-plugins/max-client-screens/`. Исходный набор: `artifacts/reports/max-client-screens-20260928/screens.json` и 84 изображения рядом. Это отдельный импортёр реальных скриншотов; исходный генератор `max-journey` не изменяется.

`node artifacts/DESIGN/figma-plugins/max-client-screens/build.mjs` создаёт `code.js`, `ui.html`, `catalog.json`. Сборщик проверяет 84 уникальных файла, распознаёт PNG/JPEG по заголовку, читает фактический размер и встраивает оригинальные байты в UI. `source/catalog.mjs` задаёт фильтры и геометрию; `source/code.js` размещает секции на текущей странице; `source/ui.html` содержит селекты и очередь передачи изображений. Плагин автономен, networkAccess=none; стандартные HTML-селекты не требуют PropsKit или CDN. Готовый комплект передаётся папкой, без нового архива.

Протокол: UI отправляет start с фильтрами и уникальным id. Sandbox фиксирует currentPage до загрузки Inter Regular; страницы не создаются и не переключаются. Набор размещается справа от общих render bounds существующих детей с отступом 240 px, на пустой странице — у viewport.center. Sandbox запрашивает по одному файлу need-image; UI отвечает image с тем же id/index; после создания кадра запрашивается следующий. Поздние сообщения после отмены игнорируются. Ошибка оставляет уже созданные кадры и отображается в UI. При ручном переходе на другую страницу импорт продолжает использовать исходную страницу и не перехватывает выделение/viewport новой.

Раскладка: шесть миссионных/системных Sections, вложенные Sections по состояниям и заданиям. В задании — последовательные фреймы с одним IMAGE-слоем и подписи отдельным текстом. Максимум 3/4/5 кадров в ряду. Размер — исходный либо ширина 640/1280 при сохранении отношения сторон. В pluginData фрейма сохраняются источник, размеры и тип состояния. Исходные файлы не перекодируются.

Проверка: `node --test --test-isolation=none artifacts/DESIGN/figma-plugins/max-client-screens/source/import.test.mjs`.

Источники API: [Figma Plugin API](https://developers.figma.com/docs/plugins/api/figma/), [SectionNode](https://developers.figma.com/docs/plugins/api/SectionNode/). [Отчёт проверки](../../../artifacts/reports/max-screenshot-plugin-20260928/README.md).
