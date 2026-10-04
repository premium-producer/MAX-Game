# MAX v5: действия вне силуэта устройства

Дата: 03.10.2026. Область: только webgl-v5, below-screen actions.

Решение использует готовый механизм браузера: absolute positioning относительно phone-content, native min(100%,392px), Flexbox column. JS-решатель координат не добавляется. Кнопки остаются в прежнем DOM-владельце для общей анимации, inert, загрузки и маршрутизации действий. Hotspots скриншота сохраняются.

Источники, просмотренные перед/при реализации:
- [MDN containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block): размер и абсолютные координаты зависят от позиционированного предка.
- [MDN min()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/min): относительная ширина с фиксированным максимумом, browser baseline с июля2020.
- [CSSWG #7714](https://github.com/w3c/csswg-drafts/issues/7714): реальный случай взаимодействия overflow и автоматического min-size во flex. Поэтому минимальные размеры заданы явно; overflow разрешён на внешнем контейнере, а изображение сохраняет собственную форму.

Версии: существующий встроенный Chromium; точный номер в этой проверке не фиксировался. Новая зависимость/лицензия не добавлена: используются встроенные стандарты CSS, код сторонних примеров не копируется. Ограничение: native размеры должны быть прочитаны текущим WebGL DOM-адаптером. Это проверено статически независимым агентом, но фактический экран с действиями ещё требует проверки.

Контракт: shell H800, inset10×12, контент H776. Ширина shell=20+776×assetAspect. Actions располагаются ниже shell с зазором18, ширина min(innerWidth,392), высота96 на кнопку, межкнопочный gap10. Центр совпадает с центром устройства; actions не уменьшают изображение. При произвольном перетаскивании вниз выход за viewport остаётся возможным, новые clamp-ограничения не вводились.

[Отчёт интеграции](../../artifacts/reports/max-v5-external-actions-20261003.md).

## Уточнение капсулы и надписи

Пользовательский референс03.10: radius48 приH96; flex align-items/justify-content:center и text-align:center. Нативные механизмы, без новой библиотеки. [MDN border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius), [MDN text-align](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-align). Существующий surface читает computed radius, текст — фактические DOM Range каждой строки. Известное ограничение фиксированной высоты: две строки помещаются, три требуют отдельной проверки длинных названий.
