# Проверка оснований исследования MAX → VK Видео

Дата: 29.09.2026. Проверяемый результат — [исследование](../../../docs/Research/max-motion-for-vk-video-20260929.md), а не новый релиз приложения.

## Исходники и CPU-тесты

- Десять изученных исходных модулей совпадают по SHA-256 с `apps/max-game/source-manifest.json`: [provenance.json](provenance.json). Работающий worker отдельно по SHA не идентифицировался.
- Команда: `node --test --test-isolation=none artifacts/max-game/test/journey-motion.test.mjs artifacts/max-game/test/journey-intro.test.mjs artifacts/max-game/test/journey-links.test.mjs artifacts/max-game/test/journey-popup-motion.test.mjs artifacts/max-game/test/journey-background.test.mjs artifacts/max-game/test/journey-fiber-glass.test.mjs artifacts/max-game/test/route-layout.test.mjs`.
- Результат: **51 pass, 0 fail**, [вывод](tests.txt). Проверялись существующие контракты; приложения не изменялись. Время этого запуска тестов не является замером производительности рендера.

## Текущий мастер и браузер

После чтения vk-master-startup выполнен штатный `apps/STARTUP/Check.bat` с `VK_LAUNCH_NONINTERACTIVE=1`: exit 0, run, `http://localhost:8770`; max-wall-right running/Spout, показание 30,0 FPS. Это моментальный статус, не профиль нагрузки. Приём в TouchDesigner не проверялся.

В одной временной фоновой вкладке открыта `http://localhost:8770/service/presentation.html?instance=max-wall-right`. После начала воспроизведения визуально виден текущий старт: фон MAX с пикселями, панель и стартовые элементы. При чтении console warn/error возвращён пустой список. Вкладка закрыта после просмотра. Скриншот просмотрен в инструменте, отдельный файл не сохранялся.

Кнопки игры, переключатели ввода, сохранённый прогресс и число зон не менялись. Последовательность intro/первых карточек не проигрывалась в живой проверке; она изучена по исходникам и CPU-тестам. Мастер/worker не перезапускались. Видео и тяжёлые GPU-прогоны не запускались. Полная художественная приёмка не заявляется.

## Открытые проверки для будущего переноса

Визуальный пилот VK Видео, стоимость обновления буферов связей при реальном числе карточек, задержка за движущимся посетителем, плотность композиции и работа трёх владельцев. Анализ кода сам по себе этих результатов не подтверждает.
