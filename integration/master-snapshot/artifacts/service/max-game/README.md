# MAX: перенесённый backend-компонент

Это редактируемый canonical subset нового проекта на F:, а не полный runtime. Core/каталог/контракты — artifacts/max-game/src; HTTP и SQLite worker — здесь. Исходные13 модулей перенесены из неизменённого baseline backend-probes/max-handoff/vendor. [Происхождение и текущие SHA](canonical-source-manifest.json). Прежний vendor не обновлять под изменённый код.

[Управляющий контракт](../../contracts/max-assignment-v1.md): POST assignments, GET assignments/:id, GET slots/main. Доступ задаётся отдельным authorizeControl; default deny. Player input и его lease остаются отдельными. Session, immutable receipt и slot фиксируются одним BEGIN IMMEDIATE; схема0/1→2 сохраняет данные.

Реализован один слот, первое назначение и устойчивый повтор. Освобождение, очередь, отмена назначения, второй запуск и подключение к UI ещё не реализованы. Accepted не заменяет renderer-ready. Старый checkpoint MAX до5с не обеспечивает требование отката до1с; это задача BE-04. Проверено на Node25.9.0/SQLite3.51.3, production runtime pin ещё не утверждён.

[Независимые проверки](../../reports/max-assignment-check-20261003.md), [интеграция DBOS](../../reports/parallel-assignment-20261003.md). SQLite транзакция — готовый механизм: https://sqlite.org/lang_transaction.html ; node:sqlite: https://nodejs.org/api/sqlite.html . SQLite public domain; Node MIT и включённые notices; перенесённый код — частный проект, не сторонняя лицензия.
