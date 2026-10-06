# MAX: касание доходит, canonical gate не открыт

06.10.2026. Статус: **LOCAL CANDIDATE, NOT INSTALLED**. Браузер не запускался; F и стенд не изменялись этой итерацией.

Фото пользователя «Нет связи с backend. Экран сохранён» сопоставлено с реальными журналами MAX_RIGHT через fresh pinned Selectel route.

## Подтверждённая причина

Native console содержит `MAX backend Error: MASTER_GAME_GATE_CLOSED`. Сервер доступен; это отказ игрового допуска, а не установленный сетевой разрыв. В14:04:45.619–14:05:16.267МСК active assignment существовал около30.6с. Adapter каждые~0.53с выдавал `FOREIGN_PRESENTATION409`.

Прогретый game entry `backend=server&shell=1` подключает старый `managed-presented.mjs`; тот навсегда сохранял null assignment/session из URL и ожидал accepted:true. Browser preparation endpoint намеренно отвечает accepted:false/browserPrepared:true. Это отдельный доказанный дефект и источник409.

Главная отсутствующая связь: фактический native ACK шёл только в `/production/render/output/presented`, подтверждая настройки вывода. Ни idle client, ни manual host, ни browser-prepared endpoint не передавали current canonical `/max/canonical/presented`. MASTER поэтому оставлял `presented=false` и не разрешал owner/contact. Интервал согласуется с delivery watchdog30с; точный terminal receipt последней миссии не извлекался, код отмены не выдаётся за факт.

## Кандидат

12 файлов MAX_RIGHT и2 файла MASTER. ZIP46506+6484=52990байт. Полный список before/after SHA: [manifest](../workspace/tasks/max-lidar-live-input-20261006/delivery/candidate-manifest.json).

Передаётся корреляция current assignment/session/content/dataset из готовой видимой manual mission в существующий actual GPU ACK. Node-only IPC → root handle → mTLS role route → прежний canonical endpoint. Никаких fake presented, HOLD_CONFIRMED из renderer, скрытого сброса сессии или изменения таймера. Свежесть proof1500мс, fade300мс, retry не чаще500мс; pending proof отменяется при скрытии/смене binding. Сервер сам берёт canonical generation и проверяет стандартный режим.

Legacy helper не делает запросов для warm shell и отличает browser preparation от physical ACK. Связанные host/helper SHA обновлены в accepted-source pin; content revision прежняя. Новый sparse log содержит assignment/session/native boot, safe upstream code и HTTP status. Старый общий текст игрового onError в bundle не изменён; классификация его сообщения описана выше, а не скрыта косметическим исправлением.

Сохранены QR pause, финальный QR, gameplay bundle, медиа/иконки/разметка, LiDAR calibration/settings, другие режимы и master бизнес-контракты. F не изменён. Установка требует согласованного окна MAX_RIGHT + MASTER, backup/CAS/owned stop-start и дальнейшей физической проверки пользователем.

## Проверки

- **21/21 CPU/SQLite/HTTP/IPC PASS**: реальный Node HTTP, SQLite lease/gateway, точный control transport, actual callback chain с изолированным child fixture, публикация layers/program, source/origin, stale/null/background/auto/paused, owner replacement, неизвестный ответ, throttle, cancel/close, безопасные логи.
- Syntax всех13 JS/MJS runtime файлов PASS; immutable entry pin2SHA проверены. Duplicate guard PASS.
- Независимые агенты реализовали отдельные стороны; отдельный итоговый review не обнаружил блокеров и сверил реальную native форму ACK/sender и source pins. Проверка реального GPU/TD/LED, визуальная приёмка и LiDAR gameplay **OPEN**. Browser checks запрещены пользователем.

Точная команда: `node --test --test-isolation=none artifacts/workspace/tasks/max-lidar-live-input-20261006/candidate/frame-evidence.test.mjs artifacts/workspace/tasks/max-lidar-live-input-20261006/candidate/MASTER/app/control/game-presented.test.mjs artifacts/workspace/tasks/max-lidar-live-input-20261006/forwarding-tests/local-server-native.test.mjs artifacts/workspace/tasks/max-lidar-live-input-20261006/forwarding-tests/native-ipc-chain.test.mjs`.

Источники и ограничения готового механизма: [исследование](../../docs/Research/max-native-game-presented-20261006.md). Read-only diagnostic snapshots/source сохраняются в task; они не публикуются в GitHub и не содержат скопированных credentials/visitor DB.

Трафик SIM: RX≈2.817772МБ; TX не измерено (0МБ загрузки файлов на стенд); всего не измерено, учтён только RX payload; учёт: частичная оценка; основание: каждый сохранённый SSH JSON/Base64 ответ учтён один раз, включая read-only pull агентов и восстановленный прежний root-read; SSH/WAN framing, TX команд, реестр/cloud API и маршруты документационного web-трафика не измерены; остаток: неизвестен. [Расчёт](../workspace/tasks/max-lidar-live-input-20261006/traffic-estimate.json). Предыдущие передачи повторно не списывались; будущий delta52990байт ещё не отправлен.
