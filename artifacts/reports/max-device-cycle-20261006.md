# MAX: цикл независимого устройства — 06.10.2026

Установлен и включён на MASTER/MAX_RIGHT: SVG «Главная с фото · Нет льгот» → ролик «Первый TV · 30 секунд» → повтор. Статичный экран по умолчанию показывается5с после готовности устройства; ролик играет целиком со звуком через существующую MASTER/Dante шину MAX5–6. Пульт позволяет выбрать два разных экрана и ожидание0.5–3600с, затем «Применить сцену». Отключение цикла возвращает одиночный выбранный ассет. Существующие два логотипа, видимость и размер600px сохранены.

## Реализация и совместимость

Использован существующий XState5.20.2/MIT: delayed transition для статичного экрана, native media ended для видео, новый actor при изменении параметров цикла. В скрытом режиме таймер отменяется, видео приостанавливается; при показе статичный экран получает полный интервал, видео продолжает позицию. Изменение только иконок не перезапускает цикл. Смена формата проходит через прежнюю оболочку устройства и анимацию; иконки используют общий расчёт геометрии пары. Цикл не отправляет новые команды MASTER на каждом экране.

Optional поля `cycleEnabled`, `cycleAssetIds`, `staticWaitSeconds` сохраняются существующим CAS/API. Старые отсутствующие поля и normalized receipts остаются совместимыми. Backend отклоняет одинаковые/неизвестные ID и нечисловой/вне диапазона интервал. Произвольные URL не принимаются. Local video muted сохраняется: аудио передаётся существующему native observer, а не дублируется в браузере. В режиме цикла video loop=false; вне цикла прежнее loop=true.

[Исследование готового механизма](../../docs/Research/max-device-cycle-20261006.md).

## Проверено

- Renderer/media24/24, backend DBOS/SQLite/HTTP32/32, UI CPU-DOM10/10 PASS; совмещённый renderer/media/UI34/34 PASS. Подготовка bundle, syntax и duplicate guard PASS.
- Независимый аудит второго исполнителя: critical blockers не обнаружены. Владение разделено: renderer и backend/UI; интеграция/стенд root.
- SHA установленных файлов, manifests и accepted-source pin согласованы; launcher check exit0 на обоих ПК. HTTP wrapper200, Spout4096×1282,≈30FPS,dropped0.
- Реальная телеметрия39с: последовательность SVG/video/SVG/video, native media.ended1, presentation active, свежий ACK. Dante hardwareArmed=true,fault=null; MAX nonzero samples1,438,419/1,438,488, native voice loop=false,underruns0,fault=null. Все bus gain/muted/channels совпали с baseline.
- В общем аудиожурнале есть отдельный отказ VK_LEFT `ArgumentException` seq398; MAX отказов нет. Начальная проверка ошибочно требовала пустой общий список и упала; исправлена область проверки, сохранённая телеметрия повторно проверена PASS без нового запуска. VK тракт не изменялся.
- Браузер не использован. Визуальная приёмка и прослушивание физических каналов остаются пользователю; nonzero samples подтверждают программный сигнал, не акустику площадки.

## Установка, источник и возврат

Применены точечно3 файла MASTER (`app/master-backend/max_presentation_assets.py`, `app/control/public/assets-editor.mjs`, `app/control/public/index.html`) и2 MAX_RIGHT (`app/max-ui/max-game/webgl-v5/app.js`, `app/max-adapter/accepted-source.json`). Установка06.10.2026≈06:55МСК, проверена свободная сцена перед остановкой. Сохранены текущие ссылки других панелей, данные/микшер/каталог81аудиоассета; картинки и ролик повторно не передавались.

Стендовый корень: `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>`. Backup изменённых файлов/manifests: `<ROLE>/config/max-device-cycle-before-20261006/`. Поставка и overlay лежат в `<ROLE>/data/max-device-cycle-20261006/`. Возврат выполняется согласованно на двух ролях по backup/SHA, только при свободной сцене. Выключение цикла через пульт доступно без возврата кода.

Bundle SHA256: `0db5f14aa5dbf75bfe501483e723ea001fcf5a8369f7df691d91536df064bc1d` (1,919,688байт).
ZIP MASTER: `29b5cbe4e5a06be6eefd6f199b187061b498a2a533e929ac7be18c35c86a1a15` (10,659байт).
ZIP MAX_RIGHT: `08d56ad91deece3655805ffb4f60aa28f85a6361fb2d98adeefefabf5cf9a11c` (503,184байт).

Основные исходники D: `artifacts/workspace/tasks/max-control-panel-20261006/code/` (game/master/master-control). Новый renderer-модуль `game/src/journey-v5-independent-cycle.mjs`; сборка `game/build.mjs` и `game/dist/build-manifest.json` закрепляют inputs. Локальные copies bundle/pin и pult index приведены к установленным байтам. Старые замороженные slice ZIP и процессы localhost не обновлены. F не менялся: интегратору нужны эти5 overlay файлов и актуальные исходники с SHA из manifests; при следующей master-сборке нельзя возвращать прежнюю версию.

Evidence: `artifacts/workspace/tasks/max-device-cycle-20261006/`: baseline, before snapshots, overlay, apply/ops/configure, `cycle-verification.json`, `verification-summary.json`. Команда повторной проверки сохранённой телеметрии: `python verify-cycle.py --saved`. Полный live запуск без флага выполняет HTTP/аудиотелеметрию, не браузер. `configure-result` содержит aliased before-settings, поэтому исходный baseline берётся из `MASTER-before.json`.

Пульт на MASTER: `http://127.0.0.1:9571/`; после обновления перезагрузить страницу. Это адрес самого MASTER, не рабочей машины пользователя.

## Трафик

Трафик SIM: RX≥0.524293МБ полезной нагрузки; TX не измерено; всего≥0.524293МБ полезной нагрузки; учёт: оценка; основание: ZIP10,659+503,184байта и два apply по5,225байт через Selectel; SSH/реестр/ответы/накладные расходы/WAN не измерены. Ассеты и аудиофайлы переиспользованы; новые зависимости не скачивались. Localhost/LAN/Spout не расходуют SIM. Остаток: неизвестен. Исторические передачи повторно не списаны.
