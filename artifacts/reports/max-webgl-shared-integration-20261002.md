# MAX: подключение существующего WebGL к общему backend — 02.10.2026

Реализована одна локальная итерация: opt-in `guided-reveal/?backend=local`, весь правый экран `&layout=wall`. Исторический default и страницы сохранены. Серверный профиль подготовлен, работающий мастер/API не активирован. Браузер/видео/GPU/публикация не запускались; художественная приёмка ожидает пользователя.

Два агента отдельно подготовили SessionPort bridge/общий Browser PersistencePort и presentation-проекцию/CPU-тесты. Root подключил entry, descriptor markup и изолированную сборку. Каталог v2 один для Site/WebGL: 6 миссий/16 заданий, обе ветки канала, PC, сюжетные пары, обязательный бизнес, явные пробелы. Старая числовая модель ответов не вызывается в shared режиме.

Логика подтверждения scan/result/progress — backend. Проверены pointer capture во время hold, up800ms до следующего poll, отмена/повтор, stale source/revision/token, единственность ответа и поздний reply после dispose. Сохраняется departing descriptor до выхода телефона. Содержимое и read-only инструкция меняются по screenId. Исправлен прежний Site poll envelope; общий PersistencePort доступен обоим комплектам.

Общий профиль/сессия сохраняют смысловой прогресс при последовательной смене вкладки. Базовые раскладки различаются по renderer: namespace `renderer:<id>:<missionId>:<nodeId>`, проверенная принадлежность узла миссии, Site-позиции не изменяются; временное освобождение места не сохраняется. Отображение одного числового point в разных сценах не выдаётся за корректный перенос координат.

## Малые проверки

- 174 related CPU PASS /705мс (core, catalog, application, migration, Site, bridge, presentation, UI). После добавления проверки namespaces: presentation12/12 PASS /152мс; две новые проверки (namespace и восстановление результата при смене владельца), всего176 различных проверок этой области.
- Шесть миссий через common commands; обе приватности/сохранение public-link/ответов; incorrect/stale/double replies; missing не complete; restore/resume; ID fan edges; drag/settled; hold cancellation/up/capture; late callbacks/lease loss; read-only instructions и canonical hotspots.
- Синтаксис изменённых модулей PASS; shared boundary22 PASS; duplicate guard PASS.
- Изолированная сборка PASS: guided-app.js 1 215 728 байт,98 bundled modules;23 shared files;130 asset IDs/120 путей;123 targeted runtime files.
- SHA22 common files/130 asset IDs PASS. Семь localhost GET —200 и совпадение bytes/SHA (entry, bundle, common application/persistence, Site wrapper/session, первый кадр). [Машинные результаты](../workspace/tests/max-webgl-backend/runtime-verification.json).
- app.js, index.html и текущий runtime journey-guided-reveal.css побайтно совпали с baseline до переноса. Стили пользователя сохранены, полный MAX-builder не использовался.

Сборка esbuild первоначально получила sandbox spawn EPERM, затем выполнена через штатный reviewed escalation. Preflight обнаружил, что Site files принадлежат отдельному build.json; guard исправлен на правильный манифест, пользовательские bytes не обходились. Ни один тест не означает визуальную приёмку; пользователь проверяет телефон/кнопки/анимации по [инструкции](../../apps/max-game/docs/WEBGL_BACKEND.md).
