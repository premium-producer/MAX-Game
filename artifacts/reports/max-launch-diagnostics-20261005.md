# MAX: неподтверждённый запуск и постоянная диагностика

05.10.2026. Исправление и журнал установлены на STELLA и MAX_RIGHT через свежий Producer Kit Selectel/pinned SSH. MASTER не изменялся. Браузерные проверки не выполнялись.

## Что подтверждено

На фото текст «Запуск MAX не подтверждён» принадлежит MasterMaxSlice Стеллы. Это ветка `canStart && launchRequested`: станция свободна, а UI хранит попытку запуска. Надпись сама по себе не означает падение MAX_RIGHT.

В установленном коде `state.show.protocol === max-show-v1` включал автоматическое представление даже для сохранённой отменённой сессии, уже не принадлежащей станции. При выключенном showMode нормальный квиз скрывался, а автоматический запуск не выполнялся. Дефект воспроизведён на точных условиях: отменённая история, свободная станция, showMode=false.

Снимок read-only SQLite/HTTP около14:50UTC: showMode.enabled=0, revision7, active_session=null; станция свободна; последние пять MAX состояний cancelled/audience/show.cancelled. Последняя MAX admission около14:11UTC, нового запроса возле времени фотографии в прочитанном журнале нет. Это согласуется с найденным дефектом, но точное состояние браузера в момент фото не записывалось; историческая причинная цепочка целиком не доказана.

## Исправление

Отменённая/историческая show-сессия без текущего владения не используется для выбора экранного режима. Актуальная show-сессия остаётся видимой до штатной отмены, даже если оператор выключил режим. История обычной миссии, квиз, отмена, lease и серверные данные сохранены. Коды gateway-ошибок теперь читаются также из `error`.

Сборка выполнена из последнего handoff STELLA, совпадавшего с установленным app.js a5273757…, с сохранением камеры/поворота/аудио/VK/кнопки отмены MAX. Новый app.js SHA256 `d640f5fe50f5f10f4d6308eb2d56c58fdfd74262c4c4f102a1449351fd3b93f4`; остальные100 UI-runtime файлов идентичны. Обновлены обе manifest pin-копии и stella-package.mjs.

## Диагностика

Установлен electron-log5.4.4/MIT: отдельные фиксированные JSONL для STELLA, STELLA_KIOSK и MAX_RIGHT, по8MiB и одной старой копии. Записываются корреляционные IDs, запросы/ответы admission, смена состояния, коды отказа, binding/game-ready, ошибки renderer/киоска. Вход ограничен4KiB и10событиями/с; файловая ошибка не изменяет игру. POST запуска не дедуплицируется; повторные одинаковые GET-отказы группируются на30с. Loopback-страница и API читают последние100событий и здоровье записи. Нет публичного DevTools, QR/токенов/тел HTTP/DOM в новом журнале.

При первом live-read выявлена ошибочная классификация page-loaded как kiosk-error; отдельное уточнение r2 исправляет её. Старая запись сохранена как история, после r2 приходит kiosk-event/page-loaded. Журналы не очищались.

## Установка и проверка

Пакеты относительно `artifacts/workspace/tasks/max-mobile-control-20261005/launch-incident/`:

| Роль | Основной ZIP / SHA256 | r2 ZIP / SHA256 |
|---|---|---|
| STELLA |379511байт / b8fe6ba0ea7748770d4fb6af98396c85991885e01e3c346ae5217cbee9bc54fd|4971байт /31817066dccef4c0da60d6efdd54312614564851c4ed086d840e02f6f218f567|
| MAX_RIGHT |59005байт /9f490784c706b099896bcc3f1c9b7cebca89f8c1cd844ddfe43c94514d5a490a|7607байт /3e295039c8df5b5fe8afc3f880a68444e4cd02a1afae2c88f9882bd3472cfc30|

Применение15:13–15:21UTC, роли/UUID по STAND_ACCESS. Перед каждым stop станция проверена свободной, MAX active=false. CAS всех заменяемых файлов и root manifest, backup, штатный restart, postapply SHA/check PASS. На каждом ПК backup `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>/config/max-launch-diagnostics-before-20261005` и `…-r2`. Резерв содержит исходные файлы и план для точечного отката.

24 Node/HTTP/protocol/logger tests +6 refinement tests PASS; отдельно25 React tests, TypeScript/Vite build PASS. Проверены настоящая ротация библиотеки и перезапуск дочернего процесса, отсутствие package.json у launcher, недоступный диск, origin/host/body guards, сохранение кодов/ID. Sandbox запрещал два child-process tests; повтор с разрешением spawn PASS. Duplicate guard и JS/PS syntax PASS. Интеграционный тест фактического Stella adapter записал409/STAND_BUSY с request/session ID без тела/секрета.

Фактическая запись журналов на обоих ПК healthy=true/writeErrors=0. STELLA_KIOSK подтвердил portrait-ready,visible=true,kiosk=true1080×1920. MAX написал game-ready; Spout около60FPS,dropped0. `/bridge/context` active=false/backgroundOnly=false, `/mobile-wall/control` пустой в ожидании назначения. Это программная проверка, не визуальная приёмка.

## Осталось и передача

- Полный физический проход посетителем после исправления не выполнялся. Запрещённые браузерные проверки не запускались; пользователь проверяет обычный выбор MAX на Стелле.
- Новые логи выявили повторные POST `/other` с MAX_BINDING_UNAVAILABLE в idle. Они не доказывают срыв запуска; точный отправитель ещё не установлен. POST намеренно не скрываются дедупом. Не утверждаем отсутствие всех отказов. Будущая узкая диагностика должна конкретизировать endpoint без ослабления binding guard.
- Generic renderer-state/preparing на Стелле означает отсутствие MAX data-game-ready, а не измерение зависания; для Стеллы использовать kiosk portrait-ready и launch/session events.
- Полная телеметрия MASTER readiness/lease stages ещё не добавлена. Синхронизация часов между ПК не измерялась; UTC+monoTime и PID помогают анализу, но не заменяют её.
- F не изменён. Для интегратора source: `stella-fix/code`, delta source manifest/overlay; адаптеры: `candidate/<ROLE>/app`, patch-adapters.py; diagnostics lock/LICENSE; receipts: `delivery` и `delivery-r2`. r2 заменяет только kiosk main и MAX adapter, остальные основные файлы сохраняются. Доступные на стенде manifest не подменять прежней сборкой F.

Исходные свидетельства: `MASTER.json`, `STELLA.json`, `MAX_RIGHT.json`, `db-probe.json`, `baseline`, receipts `*-result.json`. [Эксплуатация](../../apps/max-game/docs/LAUNCH_DIAGNOSTICS.md), [исследование](../../docs/Research/max-launch-diagnostics-20261005.md).

Трафик SIM: RX ≥0.451094 МБ ZIP payload плюс малые установочные PS/probe; TX не измерено; всего не измерено; учёт: оценка; основание: четыре подтверждённых SFTP ZIP379511+59005+4971+7607байт, чтение исходников/БД/status через SSH без WAN-счётчика, накладные расходы и расширенный ответ PS metadata не измерены; остаток: неизвестен. Ресерч/npm на соединении разработчика отдельно, локальная сборка/тесты SIM не расходуют. Прежняя доставка mobile3.034073МБ повторно не списана.
