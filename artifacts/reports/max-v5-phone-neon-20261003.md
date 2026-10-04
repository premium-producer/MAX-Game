# MAX v5 — тонкие поля и свет телефона, 03.10.2026

Запрос пользователя: аккуратные тонкие поля, лёгкое неоновое свечение кромки и свет за телефоном. Только demo-app[data-device=phone] профиля v5 получает padding12px10px вместо36px20px26px; исходный screenshot сохраняет aspect, hotspots остаются в том же media-canvas. Внешние размер/положение устройства и PC сохранены.

Корпус: готовые native Canvas2D roundRect/stroke/shadowBlur → существующий кешируемый Three CanvasTexture/MeshBasicMaterial. Тёмный #0D001A, кромка1.5 логического пикселя с #00BFFF/#471AFF/#9500FF; тень #471AFF66, blur56×rasterScale, локальный свет кромки #6E1AFF88 blur10×scale, pad72. ShadowBlur не физические пиксели. Всё в том же moving group/fade, без отдельного RAF/render target/bloom. GPU readiness корпуса теперь проверяет deviceShell marker вместо специфичного наличия shader size; изображение по-прежнему требует реального upload. cache/dispose сохраняются.

PASS:2 JS syntax,9 media CPU-тестов (исходные SHA/aspect, сценарии/декодирование), duplicate guard, scoped v5 CSS/build (168 модулей,1447384 байт), HTTP/runtime SHA7/7. [Машинный отчёт](max-v5-phone-neon-20261003.json), [исследование/ограничения](../../docs/Research/max-webgl-v5-bfm-theme-20261003.md). Проверки не подтверждают GPU вид/эстетику/FPS. Визуальная самопроверка после правки не выполнялась; пользовательская приёмка открыта.

Проверить: открыть v5 с v=phone-neon-1; открыть телефон — поля тоньше, кромка мягкая, подсветка сзади; перейти к следующему экрану — screenshot/hotspots и подсветка следуют вместе. Мастер/TD/другие runtime не переключались. Правила max.naming.service и проектная палитра соблюдены; оттенки/яркость по текущему прямому запросу.
