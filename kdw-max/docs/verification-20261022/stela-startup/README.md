# Загрузка стелы — 22.10.2026

Вместо пустого фона до React появляется MAX с исходным logo, градиентом и тремя точками. Готовность UI/ресурсов/renderer снимает overlay через650мс; input открывается после fade. Ошибка/20с дают «Повторить». См. [архитектуру](../../STELA_SCREEN_REVEAL.md).

Проверки: TypeScript/build PASS; [17 Firefox checks](report.json) PASS. Изолированный сервер и профиль, voice=off, без реального Qwen/микрофона. Искусственно отложен главный модуль: первый кадр с logo/точками виден до React; проверены20с timeout и позднее восстановление, pixels/gradient, явный click→intro, ошибка загрузки модуля/retry, reduced-motion, обычный запуск /stella/ без задержки. Снимки loading/ready просмотрены: положение/размер logo совпадают.

[Diff пакета](package-diff.json):7изменённых,0новых/удалённых. Исходный и3готовых HTML, metadata/README; app.js, CSS, голос/камера/плагины не изменены. SHA приватных omni/audio config совпадают с baseline. Seal/check1497файлов PASS.

[Postflight](postflight.json): установлен KDW-MAX-STELA-STARTUP-20261022, PID108900,22.10.2026 11:07:39МСК;33HTTP SHA PASS, Vasilisa/warm-dual/512мс/logging healthy.

Границы: проверка в headless Firefox, физический киоск/другойПК не проверены. Заставка появляется после получения HTML, не покрывает время до открытия браузера/ответа HTTP. Runtime ошибки диагностируются общим retry,20с не являются гарантией сетевого таймаута. Boot state/ms доступны в DOM; существующий журнал голоса не изменён. Новая заставка не вызывает автоматический старт общения.
