# MAX: подтверждение текущей миссии через существующий native вывод

06.10.2026. Кандидат `MAX-NATIVE-MISSION-PRESENTED-20261006`, применение пока не выполнено.

Используется уже принятый механизм Electron shared GPU texture → Spout native ACK. Новый renderer, GPU transport, очередь миссий или самостоятельный таймер удержания не создаются. Недостающий шаг — привязка текущей готовой миссии к завершённой публикации кадра и передача существующему canonical `/max/canonical/presented`.

## Готовые механизмы и источники

- [Electron offscreen rendering](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering): GPU shared texture предназначена для native потребителя, DOM readiness/два animation frames не подтверждают физический вывод. Установленный Electron44.4.5 сохраняется; live docs сейчас показывают пример44.5.1, обновление runtime не требуется.
- [Electron44.4.5 OSR source](https://github.com/electron/electron/blob/v44.4.5/shell/browser/osr/osr_render_widget_host_view.cc) и [WebContents source](https://github.com/electron/electron/blob/v44.4.5/shell/browser/api/electron_api_web_contents.cc): предыдущий независимый аудит исключил отсутствие фокуса OSR как доказанную причину. Нет изменения фокуса/видимого окна.
- [Node ChildProcess message](https://nodejs.org/api/child_process.html#event-message): используется существующий IPC конкретного управляемого Electron child; HTTP renderer не получает новый доверенный метод. Документация live26.10, локальная проверка Node25.9; новый API не вводится.
- Реальное принятое использование: `artifacts/workspace/tasks/layered-spout-20261006/rear/host/render-output-runtime-core.mjs`, GPU hub/transport этого кандидата. Его ACK уже подтверждает опубликованный shared texture и settings; прежний путь передаёт только `/production/render/output/presented`, без canonical assignment. Native C++ возвращает `accepted/published/routes` для layers и program; независимый аудит сверил имена sender и форму ACK.

Electron/Node и существующие vendor dependencies сохраняют свои текущие лицензии/notices. Новых зависимостей и установок нет.

## Границы решения

Manual host проверяет gameReady/current managedBinding/видимость и подтверждение стандартного режима. Parent проверяет origin/source, удерживает корреляцию только1500мс и после завершения300мс fade. Эта корреляция сама не является бизнес-ACK. Output host добавляет её только к принятому опубликованному кадру действующего content plan. Старый browser helper прогретой страницы больше не отправляет null assignment/session.

Root Node проверяет конкретный child, permission/generation, свежую role lease и presentation state, коалесцирует запросы и отменяет proof при скрытии/смене миссии. MASTER повторно проверяет authenticated role и текущую canonical mission, берёт generation из backend и вызывает прежний endpoint с серверным control token. Браузер не получает token, generation или обход hold gate.

Это подтверждает публикацию Spout sender, не зрительскую приёмку LED/TD. Фактическое прохождение LiDAR на стенде остаётся открытым до установки и проверки пользователем. [Технический отчёт](../../artifacts/reports/max-native-game-presented-20261006.md).
