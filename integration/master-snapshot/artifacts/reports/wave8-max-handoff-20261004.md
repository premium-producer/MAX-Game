# WAVE08 C / MX-1 — MAX presentation, no-op integration

04.10.2026. Результат: **полезных новых изменений wall-визуала для переноса нет**. F не менялся, серверы не запускались. Root не требуется применять пересобранный app.js.

## Snapshot и сверка

Из F/artifacts/canonical-max/{presentation,public} создан отдельный `D/artifacts/workspace/tests/parallel-wave8/max-candidate`:351 файлов без node_modules. Source baseline SHA каждого файла — baseline.json; итог handoff.json; разделение изменений — comparison.json.

Актуальный D donor: artifacts/workspace/tasks/max-flow-editor-v3-worktree/artifacts/max-game. Все общие визуальные исходники F presentation/src равны текущему D donor. Различаются только четыре файла с намеренными managed-адаптациями: journey-guided-main.js, journey-v5-backend.mjs, application/server-session-port.mjs, application/webgl-session.mjs. Они сохранены побайтно. Новый journey-v5-client.mjs и изменения main относятся исключительно к отдельной client1080 странице; к wall-профилю неприменимы. F v5.css равен текущему D public source. Public index отличается managed profile/style и сохраняется.

Каталог D и F семантически равен: missions-reviewed-20261003-abe878cfed89,4миссии/15заданий/70экранов/75действий. Core/host/catalog не копировались и не менялись.

## Выявленный source/runtime drift

Donor worktree runtime build.json проверен по331 entries. Шесть input hashes не соответствуют текущим исходникам: journey-v5-device-morph, journey-v5-backend, core/mission-core, application/mission-session, application/webgl-session, journey-guided-main. Runtime v5.css также старее source: в нём ещё внутренние action buttons и отсутствует recovery CSS. Копирование готового D bundle/CSS дало бы регрессию. Это передаётся component owner для штатного rebuild его runtime; здесь его файлы не менялись.

В F build-manifest.json один input stamp journey-guided-main.js устарел, но фактический accepted app.js соответствует новой изолированной сборке **полностью после нормализации только комментариев путей wave2→wave8**. Семантического расхождения runtime/source не найдено; provenance stamp стоит обновить при следующей реальной сборке, не менять сейчас рабочую игру ради комментариев.

## Проверки

- SHA snapshot351, исходники/ассеты сохранены, catalog equality PASS.
- Переиспользован существующий WAVE05 esbuild build.mjs, зависимости только read-only из D/artifacts/max-game/node_modules. Изолированная сборка194inputs PASS. Первый запуск sandbox не позволил esbuild дочерний процесс; разрешённый повтор сборки PASS, сервер не запускался.
- Accepted/candidate bundle equality после нормализации только source-path comments PASS.
- `node --check` rebuilt app.js PASS.
- Повторные lifecycle/HTTP/browser тесты не запускались: изменений игрового поведения нет. Сохранённые source guards остаются exact F: managed assignment/auth/no-create/no-select/presented/terminal/release.

## Передача

`applyFiles:[]`; кандидат — доказательство сверки и воспроизводимой сборки, **не новая установленная версия**. Все SHA/расхождения: `artifacts/workspace/tests/parallel-wave8/max-candidate/handoff.json`.

Остаются отдельными: произвольный runtime редакторского v3-графа, BE04 checkpoint/pending durability, настоящий SYS07 business adapter и physical rear output/input. Работу component owner/editor здесь не дублировали. Root может продолжать VK renderer integration без переноса MAX.
