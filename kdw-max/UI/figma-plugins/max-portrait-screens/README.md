# MAX — вертикальный стенд 1080×1920 (вариант C)

134 кадров, как в наборе max-current-screens, но на вертикальном экране 1080×1920: главное меню, ладонь, все экраны четырёх миссий, поля, клавиатура, игры с постами и витриной, итоги и финальный QR.

1. Figma Desktop → Plugins → Development → Import plugin from manifest… → manifest.json из этой папки.
2. В плагине выберите screens.maxscreens из этой же папки.
3. Выберите миссии и бизнесы → «Собрать фреймы со скриншотами».

Кадры сняты из готовой сборки app.js с правками ветки portrait-layout-c (ops/portrait-preview), в headless Chrome. Видео меню и фото посетителя со стелы в кадры не попадают.

Состав папки: плагин (manifest.json, code.js, ui.html), пакет screens.maxscreens, отдельные PNG в final-assets/ и список кадров captures.json. Пересборка: из kdw-max `node ops/portrait-preview/capture-figma.mjs <папка>`, затем `node ops/portrait-preview/package-figma.mjs <папка>`, после чего скопировать результат сюда.
