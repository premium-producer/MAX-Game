# Диагностика запуска MAX на стенде

Установлено05.10.2026: исправление исторической отменённой автомиссии на Стелле и постоянные журналы запуска. Обычная игра остаётся default. Никаких debug-надписей поверх LED.

## Где читать

На самом ПК (доступ только loopback, не публичный сервер):

- STELLA: `http://127.0.0.1:9572/diagnostics/max`.
- MAX_RIGHT: `http://127.0.0.1:9573/diagnostics/max`.
- JSON на соответствующем порту: `/diagnostics/max/status` — status здоров ли журнал и последние100событий. Read-only, без запуска/сброса миссий. В обычной работе читать по SSH/HTTP; браузерные проверки требуют прямого запроса пользователя.

Корень роли: `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>`.

Журналы: `data/logs/launch-STELLA.jsonl`, `launch-STELLA_KIOSK.jsonl`, `launch-MAX_RIGHT.jsonl` на соответствующих ПК. Electron-log5.4.4/MIT хранит текущие8MiB и одну `.old.jsonl` копию на компонент; предел может быть превышен одной записью до4KiB. Существующие stdout/stderr и camera diagnostics не заменены. Фиксированные имена сохраняют события после перезапуска. fsync/защита от внезапного отключения питания не обещаются.

## Как разбирать отказ

По времени и requestId/sessionId сопоставить begin-requested → admission-request → master-request/result → admission-result → session-state. На стене искать binding-change и renderer-state/game-ready, mobile-status; в киоске — startup/load/renderer errors. `status.writeErrors`, `lastErrorCode`, `suppressed` проверять прежде выводов об отсутствии событий. Полная цепочка готовности MASTER пока не журналируется этим пакетом.

Текст «Запуск MAX не подтверждён» означает, что UI запросил запуск, но видит свободную станцию; это не диагноз падения стены. Исправлена найденная причина: историческая отменённая show-сессия больше не включает автоматический экран при выключенном showMode. История сохранена.

MAX_BINDING_UNAVAILABLE требует проверки контекста назначения. В idle после установки зафиксированы повторные POST/other; точный отправитель пока не установлен. Не выдавать их за подтверждённую причину фото и не обходить guard. GET-повторы ограничены одним событием на30с на комбинацию маршрута/кода; POST сохраняются с общим лимитом10/с. Полные URL, query, тела, QR, токены и arbitrary Error.message в новый JSONL не пишутся.

На Стелле generic renderer-state/preparing не означает зависшую загрузку: MAX data-game-ready не установлен в приложении Стеллы. Использовать `stella-kiosk-status.json`/portrait-ready и launch events. В старом boot13660 page-loaded ошибочно записан как kiosk-error; после уточненияr2 это kiosk-event, старый журнал сохранён.

## Продолжение разработки

Принятие F в этой итерации не выполнялось. D source/пакеты/receipts: `artifacts/workspace/tasks/max-mobile-control-20261005/launch-incident`. UI исходник `stella-fix/code`; адаптеры `candidate`; библиотека `diagnostics` с package-lock/LICENSE; основное применение `delivery`, два уточнённых файла `delivery-r2`. Сохранить текущие master-адаптации и перенести через назначенного интегратора, не копировать весь D поверх F.

Backup у каждого ПК: `config/max-launch-diagnostics-before-20261005` и `…-r2`. Откат — только соответствующих плану файлов с остановкой принадлежащей роли, проверкой текущих SHA и восстановлением её manifest. Данные миссий/разметки/медиа/секреты не входят в пакеты и не должны очищаться при диагностике.

[Проверка и ограничения](../../../artifacts/reports/max-launch-diagnostics-20261005.md), [выбор библиотеки](../../../docs/Research/max-launch-diagnostics-20261005.md).
