# MAX v5 — подключение готового Figma backend v2

03.10.2026. Прямой запрос: обновить backend текущей игры до финальных миссий и иконок.

Используем готовый ESM-релиз `max-shared-backend-20261003-151916-v2`, SHA каждого файла сверяется с manifest. Устанавливаем неизменённый комплект в `artifacts/max-game/vendor/backend-figma-v2`. v5 получает его каталог и SessionPort; старые редакции сохраняют прежний каталог. Правила прохождения не переписываются. Версия в ключе browser persistence изолирует прежние сохранения. Сам пакет внутренний проектный, не сторонняя библиотека; источники изображений и SVG указаны в content-source.json и asset.origin, публичная лицензия на клиентские материалы не заявляется.

## Проверенные ограничения и готовые механизмы

- [Figma: SVG exports using foreignObject](https://forum.figma.com/ask-the-community-7/svg-exports-using-foreignobject-38163): реальный описанный случай несовместимости градиентов экспортированных SVG с использованием как изображений/спрайтов.
- [MDN: SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image): в контексте изображения действуют ограничения; SVG-документ и SVG в img не эквивалентны.
- [WHATWG issue 10641](https://github.com/whatwg/html/issues/10641): различия origin-clean для foreignObject при drawImage. Прямой перенос такого изображения в WebGL нельзя считать проверенным.
- [Three.js CanvasTexture](https://threejs.org/docs/#api/en/textures/CanvasTexture), установленная 0.185.1, MIT: существующий renderer использует native Image.decode, Canvas drawImage и Three CanvasTexture. Путь сохраняется. Вращение материала — существующие Texture.rotation и WAAPI, не новый аниматор.
- [Python ElementTree](https://docs.python.org/3/library/xml.etree.elementtree.html), Python 3.14, PSF: подготовка отдельного совместимого SVG-слоя готовым XML-парсером. По уточнению пользователя берём только исходные контуры значка и форму оболочки; подписи, эффекты и foreignObject не переносим. Подложку даёт существующий управляемый градиент v5. Оригинальные SVG остаются в поставке, SHA не меняются. Это адаптация ассетов к существующему материалу, а не заявление о полном воспроизведении Figma backdrop-filter в WebGL.

В 15 карточках область плитки 120×120 с rx31.305; некоторые SVG шире из-за подписи. В производном SVG viewBox равен области плитки с сохранением её исходного X; paths значка не изменяются. Ладонь и restart — обычные SVG24×24. Исходный `hasEmbeddedLabel` остаётся в общем каталоге как описание оригинала. Производный glyph имеет `hasEmbeddedLabel:false`: название и статус renderer выводит отдельно из каталога, согласно уточнению пользователя.

Проверки интеграции и ограничения пользовательской приёмки: [отчёт](../../artifacts/reports/max-v5-final-backend-20261003.md). CPU/SHA не заменяют проверку GPU и пользовательского прохождения. Неизвестные hotspots готового пакета остаются явно below-screen; не выдумываем зоны нажатия.

## Повторное использование SVG при прогреве, 03.10.2026

Фактический пользовательский случай: `Unprepared MAX image` на channel.svg после подключения пакета. В одном batch находятся четыре состояния одной иконки и два задания с одинаковым значком. Прежняя интеграция ошибочно отождествляла подготовленность изображения с возможностью переместить единственный DOM-узел.

[MDN appendChild](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild) описывает перемещение существующего узла: он не может одновременно находиться в двух местах. [Canvas drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) принимает HTMLImageElement как источник пикселей без перемещения; размеры источника определяются naturalWidth/naturalHeight. Используем этот штатный механизм вместе с уже установленным [Three ImageLoader](https://threejs.org/docs/pages/ImageLoader.html)0.185.1/MIT: один decoded source доступен всем состояниям, а DOM-потребители задают геометрию независимо. Новый loader/cache или клонирование с повторным декодированием не вводятся. [Регрессия и проверка сборки](../../artifacts/reports/max-v5-svg-warmup-20261003.md); GPU-приёмка остаётся открытой.
