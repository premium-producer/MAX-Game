# API текущего экрана MAX

## CSV для TouchDesigner без сертификатов

Установлено 28.10.2026. Используйте `http://10.0.0.13:18772/__kdw/screen/state.csv` (именно HTTP). JSON: `http://10.0.0.13:18772/__kdw/screen/state`. Эти два GET-пути доступны через отдельный вход только из локальной сети; Windows Firewall ограничен LocalSubnet. Админка остаётся на прежнем HTTPS-порту. Никакая подписка не требуется. Проверено чтение обоих CSV с production-ПК MAX, включая сеть до Стеллы.


28.10.2026. Установлено на production-ПК MAX (DESKTOP-64J4BMN, 10.0.0.13), патч SCREEN-API-MAX-20261028-1. Проверены локальные JSON/CSV/SSE и CSV через LAN HTTPS, оба Spout-слоя готовы.

| Где запущен клиент | CSV |
| --- | --- |
| На ПК MAX | `http://127.0.0.1:18752/__kdw/screen/state.csv` |
| В сети площадки | `https://10.0.0.13:18762/__kdw/screen/state.csv` |

LAN использует уже настроенный HTTPS-вход с сертификатом стенда. Клиент должен доверять сертификату. Порт 18752 слушает только loopback. Адрес зависит от IP ПК; текущие роли: MAX — 10.0.0.13, Стелла — 10.0.0.12.

Аналогичные пути на том же базовом адресе:

- `/__kdw/screen/state` — JSON
- `/__kdw/screen/state.csv` — заголовки и одна строка CSV
- `/__kdw/screen/events` — SSE, событие `screen`, полный снимок сразу и при изменении

CSV: UTF-8 без BOM, запятые, CRLF, все ячейки в двойных кавычках, null — пустая ячейка, boolean — `true`/`false`. Для Table DAT достаточно опроса 2–5 раз/с.

## Поля

Общие со Стеллой: `schemaVersion`, `instanceId`, `revision`, `online`, `stale`, `updatedAt`, `lastSeenAt`, `validForMs`, `screenId`, `stage`, `missionId`, `presentation`, `ready`, `visible`, `transitioning`. Дополнительно MAX публикует `taskId` и `phase` анимации. Поля Стеллы `photoPhase`/`screenRevision` здесь отсутствуют.

`stage` — статус игры, например `menu`, `scan`, `task`, `result`, `completed`, `incomplete`. `screenId` — идентификатор отображаемого экрана каталога; если его нет, `max-<stage>`. В меню это `max-menu`, перед ладонью `max-scan`. `missionId` принимает внутренние идентификаторы MAX: `digital-id`, `business`, `blogger`, `communication`. В меню миссия и задание пусты.

Источник — `controller.displayedState`: во время перехода идентификатор соответствует отображаемой сцене, а не уже продвинувшейся логике сценария. `presentation` различает `loading`, `transitioning`, `visible`, `paused`, `unavailable`. Готовность учитывает ресурсы телефона, появление меню/ладони и готовность QR. Offscreen Spout учитывает состояние вывода вместо `document.hidden`.

Для переключения внешней сцены проверять `online && visible`, затем `stage`/`screenId`. API отражает renderer и не подтверждает исправность физического экрана или приёмника Spout.

Наблюдатель не создаёт сессию и не управляет игрой. Данные посетителя, фотографии, токены, ответы и sessionId не передаются. Поля хранятся только в памяти. Публикация максимум 5 раз/с, heartbeat каждые 2 секунды. Через 6 секунд без публикации `online=false`, `stale=true`, `visible=false`, `ready=false`: прежние идентификаторы остаются только для диагностики.

SSE сохраняет контракт Стеллы: `id=<instanceId>:<revision>`, переподключение через 2 секунды, новый полный снимок без воспроизведения истории; максимум 32 наблюдателя, медленные клиенты отключаются. `revision` меняется при изменении состояния, не при каждом heartbeat. LAN разрешает только три GET-пути чтения; `/publish` доступен лишь локальному same-origin renderer. Несколько вкладок не могут одновременно перехватывать публикацию.

## Проверки

`node --test --test-isolation=none ops/audit-fixes/max-screen-api.test.cjs ops/audit-fixes/stela-screen-api.test.cjs`

`node ops/audit-fixes/run-browser.mjs ops/audit-fixes/max-screen-api.mjs`

Проверены JSON/CSV/SSE, ownership/sequence, origin, LAN allowlist, stale/recovery и собранная игра: меню → ладонь → первое задание цифрового ID → закрытие renderer. Результат: `docs/verification-max-screen-api-20261028/browser.json`.
