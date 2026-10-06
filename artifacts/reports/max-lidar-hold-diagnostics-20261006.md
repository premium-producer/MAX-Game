# MAX: почему курсор не означает удержание; установлен диагностический журнал

06.10.2026. Установлен MAX-LIDAR-HOLD-DIAGNOSTICS-20261006 на MAX_RIGHT в16:39:21МСК, когда MAX был idle и queue0. Пользователь просит проверить более раннюю ручную попытку; включённое автопрохождение, наблюдавшееся при первом чтении16:24, не объявляется причиной той попытки. Последнее наблюдение16:41:46: стандартный режим, autoplay выключен/revision3, delay5000; эти настройки оператор изменял самостоятельно, данной установкой они не менялись.

## Что удалось установить

Старые записи подтверждают успешный native-game-presented для нескольких назначений и получение OSC без decodeErrors/rejectedSources. Но ни первый native down, ни palm hit, ни начало/отмена hold не журналировались. Точную причину старой попытки восстановить нельзя. По времени пользователь указал только «более ранние».

В актуальном коде подтверждены два пути отказа:

1. Hokuyo выдаёт down при создании контакта; последующее подведение руки создаёт move. UI начинает удержание только pointerdown внутри ладони. После down вне ладони движение на неё не вызывает нового удержания.
2. Down вне mapped4096×1280 заменяется на cancel. Последующий move внутри области не принимается native bridge без принятого down. Cursor overlay отображает mapped point независимо от принятого игрового нажатия.

Отдельный read-only субагент проверил эти пути и совпадение Y offsets2/1282 у input/overlay. Это доказуемые условия в коде, не доказанная история конкретного старого касания. `gap=true` диагностического чтения after0 означает ограниченный ring и не выдаётся за сбой текущего runtime.

Новый журнал уже записал реальные контакты628–630 с mappedX≈4328–4395, outside/cancel. Для630 в16:41:23 active=true, standard eligible=true, session/assignment записаны. Эти касания находятся за пределом4096; неизвестно, соответствуют ли они наведению пользователя на ладонь. Не переносим это наблюдение на старую попытку.

## Что установлено

Шесть logging-only файлов: launch-diagnostics/http.mjs и launch-logger.mjs, max-lidar/adapter/control.mjs, render/lidar-render-bridge.mjs и output-host.mjs, max-adapter/local-server.mjs. Bundle игры/механика/калибровка/ассеты/разметка/MASTER/F/TD не заменены. Current config и data/max-lidar/settings.json сохранены по SHA. Переходы/принятие native input/request-response остаются прежними; диагностика не запускает fake down/HOLD и не отменяет visitor sessions.

Записывается цепочка mapped contact/gate → native delivered/rejected/cancel → actual DOM pointer/palm bounds/inside/readiness/focus/visibility → progress удержания → canonical response. `SCAN_CONFIRMED` берётся только из совпадающего state.sessionId и state.scanned=true; HTTP200 не используется как подтверждение HOLD. В Node VM/реальном HTTP сохранены исходные event/fetch promise/Response.

Два постоянных журнала с electron-log5.4.4/MIT, лимитом8MiB и ротацией: `data/logs/launch-MAX_RIGHT.jsonl`, `data/logs/launch-MAX-LIDAR-NATIVE.jsonl`. Прежняя loopback `/diagnostics/max/status` и страница `/diagnostics/max/` показывают оба журнала; доступ только с MAX_RIGHT, не публичный relay. Ограничения4096байт/10событий в секунду и явные numeric/identifier allowlists сохранены. Работа logger не выполняет игровые команды. Невидимый диагностический скрипт расположен в head перед body app module, источник/HTTP и реальное появление renderer-input-state проверены без браузерной автоматизации.

## Проверка и поставка

41/41:11 native bridge regression/diagnostic,13 mapped control/persistence/context,6 actual NodeVM/loopbackHTTP/electron-log two-journal и11 actual gatewayHTTP/native-presented/canonical contact-result. Syntax всех файлов и duplicate guard PASS. Runtime6SHA/root+component manifests, launcher check0, UDP9001/node6220, Electron6448 Session1 PASS. Logger healthy/writeErrors0; sparse native и renderer события появились после установки. Полный физический hold на ладони после этой установки OPEN; механическое исправление не заявляется.

Fresh pinned UUID6a8a4e42…/hostDESKTOP-64J4BMN, preflight/liveSHA/CAS/metadata/calibration/config guards, свободное окно и owned stop/Interactive task start. Резерв: `C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT/data/max-lidar-hold-diagnostics-20261006-r1/backup-before`. Новый boot0f3fd7d0…; source/payload exactSHA и receipts — [задача](../workspace/tasks/max-lidar-hold-diagnosis-20261006), delivery/candidate-manifest.json и deployment/MAX_RIGHT/apply-result.json/verify-result.json; deployment/diagnostics-result.json. Архив31693байта SHA38dd33737bc2c4f23e4b19a1ed833719dcf28c856a6a2d459e6ec5011da77485; вся SFTPпоставка45222байта. [Исследование](../../docs/Research/max-lidar-hold-diagnostics-20261006.md).

Следующий проверяемый шаг: реальная ручная попытка и чтение этих журналов по assignment/contactId, затем узкое исправление только подтверждённой причины. Не превращать любое move в down: после смены владельца/назначения held contacts должны оставаться заблокированными до нового lifecycle.

Трафик SIM (со стороны стенда): RX≈0,045222МБ файлов; TX≈95,400172МБ частично учтённых первоначальных диагностических ответов; всего учтено≈95,445394МБ; учёт: частичная оценка; основание: первый SSH log read непреднамеренно сериализовал PowerShell metadata строк и увеличил ответы, оценено по compactJSON/Base64; последующие источники/небольшие ответы/команды/реестр/framing/WAN не учтены; остаток: неизвестен. Для следующих чтений явно приведены строки к string; большой запрос не повторён. Это оценка payload, не операторский счётчик; прошлые задачи повторно не списаны. Расчёт в traffic-estimate.json задачи.
