# WAVE-04/A · MX-06: сохранение MAX-тегов и вращения

04.10.2026. Изолированный кандидат `artifacts/workspace/tests/parallel-wave4/master-candidate`; **в F исполнителем не применён**. Root owns integration/IAB/common docs. Canonical игра не подключалась.

## Что исправлено

- Новые quiz/submit/assignment/port workflows v3 фиксируют тот же полный tagsMax snapshot: ID, labels, visible/opacity и порядок. Невидимые слоты остаются невидимыми при fade.
- Orbit квиза сохраняет angleDegrees/speedDps с прежним DBOS checkpoint. Confirm передаёт эту же пару в frozen launchPlan.orbit. Начальная скорость launch совпадает, затем применяется настраиваемое ускорение.
- Live renderer сохраняет последнюю нарисованную угловую позу только того же sourceSessionId; коррекция плавно сходит к checkpoint. Reload получает воспроизводимый ненулевой угол из server anchor+phaseElapsedMs. Это не обещание побитового восстановления последнего браузерного кадра.
- У quiz-origin plan `tagSource=quiz-snapshot`; object.tagIds ссылаются на принятые ID, прежние связи шаблона доступны как templateTagIds. Direct wall — явно mission-template с исходными тегами миссии.
- WhiteEntity=false. Очередь, markers/presented guards, release, pause/cancel и неприкосновенность другой миссии сохранены.

## Источник и совместимость

Root подготовил текущий F snapshot и `master-candidate.baseline.json`. Изменены max_launch_models.py, max_launch_store.py, max_launch_workflows.py, согласованный max_api.py, max-launch-renderer.mjs; добавлен пример max_launch_defaults.json. max-launch-client.mjs и другие владельцы не менялись.

Сохранён protocol max-launch-v1: добавлены orbit/tagSource в новые plans; assignment.schemaVersion=3, admission/direct wall envelope.launchVersion=3. Старые envelopes продолжают v1/v2, frozen plans не мигрируются. Проверка AST подтвердила неизменность прежних именованных functions/classes в трёх backend-файлах; исключён только read-only _snapshot, расширенный для показа actions schema3. Полный список — max-tests/legacy-body-proof.json. SQL schema и существующие таблицы не меняются.

Опциональная JSON секция orbit: baseSpeedDps40, visibleTagIncrementDps10, launchSpeedMultiplier3. Модель v3 задаёт те же defaults при прежнем конфиге; старый builder/validator defaults не изменены. Root может перенести sample orbit в configs/max-launch.json; существующие сессии сохраняют прежний snapshot.

Готовые зависимости прежние: DBOS3.2.0/MIT, SQLite/SQLAlchemy, Anime.js4.5.0/MIT. [Обоснование и официальные источники](../../docs/Research/max-quiz-launch-handoff-20261004.md). Новый scheduler/игровой reducer/очередь не создавались.

## Проверки

- `max-tests/max_handoff_http_test.py`: **25 assertions PASS**, настоящий HTTP/DBOS/SQLite, отдельные данные/эфемерные порты. V2 quiz → restart → старый plan/markers; V3 quiz одновременно с v2 playing → paused orbit restart → точный frozen handoff → queued activation → launch pause/restart → explicit direct wall template. Финальная fixture `max-tests/run-7eb8fd397e`, лог http-results.txt.
- `max-tests/handoff.test.mjs` + `launch-regression.test.mjs`: **15/15 Node PASS**. Измерены совпадение слотов/позиций/видимости, angle и начальная angular velocity, handoff между разными подтверждёнными checkpoints без сброса, детерминированный reload, прежние marker/ownership/pending/rear-state guards.
- JS syntax, Python syntax/AST, duplicate guard PASS. Собственные серверы после теста остановлены. F/live8782/чужие БД/AI/железо не использовались.

Root выполняет короткую IAB-проверку отдельно. Художественная приёмка пользователем OPEN. Этот отчёт не объявляет ещё не выполненные browser/apply шаги завершёнными.

## Границы

В очереди frozen orbit не продолжает вращение за счёт wall-clock ожидания: после получения слота начинается собственный сохранённый пролог. Непрерывный handoff относится к одному показываемому квизу/назначению. Произвольный последний пиксельный кадр не сохраняется; reload/restart используют durable checkpoint. Общий AV-owner, CanonicalMaxPort, production renderer identity и real input — следующий отдельный срез.

Точные исходные SHA и allowlist — `parallel-wave4/max-tests/handoff.json`. Общие TODO/docs обновляет root. Коммиты и push не выполнялись.
