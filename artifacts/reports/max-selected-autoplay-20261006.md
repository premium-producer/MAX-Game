# MAX-SELECTED-AUTOPLAY-20261006: установленное автопрохождение

06.10.2026. MASTER обновлён в 15:34:18 МСК, MAX_RIGHT — в 15:34:43 МСК. По запросу пользователя сохранена отдельная политика `enabled=true`, `screenDelayMs=1000`, `revision=1`. Она автоматически проходит выбранные обычные миссии, используя существующий V5AutoplayPresentation и маршруты createV5AutomaticCatalog. ID → ролики и его отдельные настройки сохраняются.

Последнее указание пользователя: оставить независимые ассеты. Последний read-only ответ MAX_RIGHT от 15:39:25 МСК подтверждает `desiredMode=assets`, `effectiveMode=assets`, `phase=active`, presentation revision57; политика автопрохождения дошла до `/bridge/context` и остаётся включённой на 1000 мс. Устройство, цикл и иконки управляются текущими серверными настройками. Промежуточная команда выбора standard сохранена в receipt; после уточнения пользователя стандартный режим не включается. На момент проверки текущая игровая миссия отсутствует; новые посетительские сессии проверкой не создавались.

Добавлен блок стандартной игры «Автопрохождение выбранной миссии»: выключатель, время 0,5–10 секунд с шагом 0,1 и сохранение. Live policy переключается в текущем assignment без перезапуска миссии. Clock приостанавливается до готовности media/переходов; смена времени сбрасывает только clock, выключение возвращает ручной ввод. Уже отправленное допустимое действие не откатывается. Канонические server ACT/native-presented/input-owner gates сохранены, fake-presented не применяется.

## Поставка и подтверждение

7 файлов MASTER: presentation store/API, gateway, Fleet, public app/index и новый selected-autoplay.mjs. 4 файла MAX_RIGHT: local-server, accepted-source, новый selected-autoplay-build и игровой bundle. Bundle SHA256: `6fb8600be76612dc8b84b8f18af38c1bfc034e958883200f7f18b5ebbec7cddd`. Донор сверялся с реально установленной игрой; прежнее исправление exact VKStand sender names сохранено.

Использованы свежий реестр Producer Kit, закреплённые UUID/host keys, live SHA/CAS, idle guards и штатный owned stop/Interactive start. Резерв на каждом ПК: `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>/data/max-selected-autoplay-20261006-r1/backup-before`. Подтверждены все установленные SHA/root и component manifests, launcher check0 и запуск служб. MASTER node21588, MAX node3944, Electron5776 Session1, UDP9001 принадлежит3944; отдельный observer5840 сохранён. Во время последней проверки Layers зарегистрированы, Spout sending/error null. Предстартовые CONTEXT_UNAVAILABLE в startup log не выдаются за текущий отказ: после запуска context читается успешно.

Разметка, ассеты, калибровка, audio/settings/config сохранены; медиа не передавались. F/TD не менялись. Исторический candidate manifest оставлен неизменным; статус фактической установки отражают apply/verify receipts и этот отчёт.

Материалы находятся в [папке задачи](../workspace/tasks/max-selected-autoplay-20261006): `delivery/candidate-manifest.json`, `deployment/MASTER` и `deployment/MAX_RIGHT` с preflight/apply/verify/live receipts, `deployment/enable-result.json`, `deployment/assets-before.json`, source `code`, backend-tests, tests и forwarding-tests. [Исследование](../../docs/Research/max-selected-autoplay-20261006.md), [инструкция оператору](../../apps/stand-service/docs/MAX_SELECTED_AUTOPLAY.md).

## Проверки

41/41: 10 actual DBOS3.2/SQLite/FastAPI проверок, 8 UI-controller/real Fleet HTTP, 18 MAX HTTP/canonical SQLite/native-presented forwarding, 5 actual V5 clock/catalog/graph. Отдельно проверен replay receipt после перезапуска двух свежих OS-процессов. CAS, immutable command retry, диапазон/типы, additive migration, сохранение show/assignment, Origin/CSRF/body guards, live toggle, время и готовность media — PASS. Сборка esbuild из имеющегося кэша, syntax/AST и duplicate guard — PASS. Зависимости не скачивались.

Браузерные проверки запрещены пользователем и не выполнялись. Полное физическое удержание/выбор/автоматическое завершение реальной миссии после этой установки — OPEN; подтверждены установка, сохранение политики и доставка до игрового проигрывателя. В выбранном сейчас режиме assets игровые миссии не запускаются.

Трафик SIM (со стороны стенда): RX≈0,587453 МБ передачи файлов; TX не измерено; всего не измерено; учёт: частичная оценка; основание: MASTER40061 + MAX547392 байт ZIP/план/installer через Selectel по одному staging, без медиатеки; SSH команды/ответы/реестр/framing/WAN и параллельный расход не измерены; остаток: неизвестен. Payload не операторский счётчик; прежние передачи повторно не списаны.
