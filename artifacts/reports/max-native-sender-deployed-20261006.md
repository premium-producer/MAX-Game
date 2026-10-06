# MAX: точное имя native выхода исправлено на стенде

06.10.2026. **INSTALLED / SERVICE READY**: MASTER15:12:14МСК, MAX_RIGHT15:12:39МСК. Пользователь ранее разрешил установку обоих компонентов и подтвердил продолжение после перезапуска зависшего LiDAR. Браузерные проверки не выполнялись; F не изменён.

## Причина и исправление

Повторные реальные назначения после предыдущего обновления переходили в `game-ready`, но native подтверждение не приходило и доставка завершалась примерно через30секунд. Наблюдённое имя опубликованного Content — `VKStand-max-right-MAX_RIGHT-content`. Предыдущий allowlist MAX и MASTER допускал только `VK-PROD-MAX_RIGHT-content/program`. Это ошибка предыдущей реализации и её проверки.

Кандидат `MAX-NATIVE-SENDER-20261006` добавляет **два точных имени** установленного Content/Program к прежним двум. Wildcard, авторизация, корреляция assignment/session/revision/dataset, свежесть proof и запрет чужих выходов не меняются. Один изменённый файл на каждом ПК; медиа, разметка и зависимости не передаются. [Замороженный комплект](../workspace/tasks/max-lidar-retry-20261006/delivery/candidate-manifest.json).

Событие ECONNRESET примерно через15секунд отдельно сопоставлено с закрытием canonical SSE-подписки `/events`; это не доказательство ошибки первоначальной загрузки snapshot. Транспорт SSE в этой итерации не изменялся.

## Проверка кандидата

17/17 CPU/HTTP/SQLite тестов PASS, включая actual MAX handle → actual MASTER MaxAuthority → real canonical HTTP endpoint; наблюдённые Layers/Program имена приняты, чужие и похожие имена отклонены. Проверены обе parser-команды и duplicate guard. Root повторил17тестов и сверил diff: по одной allowlist-строке на файл. Это проверка механизма, не физическое прохождение на LED.

| Роль / файл | Before SHA256 | Installed SHA256 |
|---|---|---|
| MASTER `app/control/max-gateway.mjs` | `50ba7845e03b3f45b2c725edd67c334a4a0ebd049d2700287514021c9eaa411d` | `f36d53c8f989c8d40958a4cad01c9a5ef7ffbefdfbc82a5a7d002a372277a564` |
| MAX_RIGHT `app/max-adapter/local-server.mjs` | `8e80d2ab5ffd04b854f513537348921d7ddfa111083dc448dda66ce20ba78fe8` | `9e76f20568f66c0f92f33848a05fb62b622fa48775c150cb54d81a06333a67a0` |

## Применение и состояние

Fresh pinned UUID/host и file/config/preserved SHA, Interactive task, global idle guard. Несколько попыток остановлены guard **до обращения к установщику** из-за новых посетительских сессий; ни одну сессию не отменяли. После свободного окна MASTER обновлён и независимо проверен, затем MAX. Собственный launcher stop / Scheduled Task start с PID/CreationDate/ExecutablePath; независимый observer5840 не остановлен.

Резерв на каждом ПК: `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>/data/max-native-sender-20261006-r1/backup-before`. Содержит изменяемый файл и прежние манифесты. Резервы предыдущих итераций сохранены.

- MASTER: node33124, boot`84538769-9bd9-428a-9ceb-9ba0334c9611`, backend health.ready, launcher check0.
- MAX_RIGHT: node8500, boot`c3b97875-8f50-4181-a469-0d4cf9be79fd`, Electron8532 Session1, launcher check0. UDP9001 принадлежит8500.
- Независимые installed SHA/root+component manifest и сохранённые game app.js/calibration/settings/config/canonical max_api.py SHA PASS. Мобильный QR остаётся выключенным.
- Launch logger healthy/writeErrors0. Краткие стартовые context503 завершились `game-ready`15:12:40.635 и `presentation-ack standard/active`15:12:41.210. Это подтверждение режима, **не canonical подтверждение реальной новой миссии**.
- Реальная публикация Layers4096×2562 frame569→870, Spout registered/sending,errornull,dropped0; телеметрия, не визуальная приёмка.
- До установки, после перезапуска tracker пользователем:479LiDAR пакетов,448acceptedUpdates,decodeErrors0,rejectedSources0. В15:09:17 последний пакет был~74секунды назад. После рестарта MAX счётчик начинается с0. В15:14:14 **49новых пакетов,45acceptedUpdates,decodeErrors0,rejectedSources0**: приход реальных OSC lifecycle после установки подтверждён. Последний пакет~34секунды назад, current mission отсутствует; effective input=false в idle ожидаем. Native кадры продолжаются frame5376→5676.

Receipts и независимые проверки: [MASTER apply](../workspace/tasks/max-lidar-retry-20261006/deployment/MASTER/apply-result.json), [MAX apply](../workspace/tasks/max-lidar-retry-20261006/deployment/MAX_RIGHT/apply-result.json), [MASTER verify](../workspace/tasks/max-lidar-retry-20261006/deployment/MASTER/verify-result.json), [MAX verify](../workspace/tasks/max-lidar-retry-20261006/deployment/MAX_RIGHT/verify-result.json), [текущий PID/вывод/LiDAR](../workspace/tasks/max-lidar-retry-20261006/deployment/MAX_RIGHT/live-result.json).

**Физическая приёмка OPEN**: выбрать новую обычную миссию, убрать руку и вновь удержать на активации; сопоставить `native-game-presented accepted:true`, текущие assignment/session и LiDAR lifecycle. Фиктивные presented/миссии/контакты не отправлялись. F не обновлён; следующая интеграция должна перенести оба точных файла и сохранить предыдущий native overlay.

Трафик SIM: RX не измерено; TX≈0.039533МБ загрузки файлов, TX команд не измерен; всего не измерено; учёт: частичная оценка; основание: два SFTP staging черезSelectel, MASTER17480+MAX22053байт (ZIP/план/installer), без повторной отправки медиа; SSH audit/реестр/ответы/framing/WAN не измерены; остаток: неизвестен. Payload не равен операторскому расходу, прежние передачи повторно не списаны.
