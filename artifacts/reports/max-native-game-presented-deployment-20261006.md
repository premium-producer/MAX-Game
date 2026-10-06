# MAX: native подтверждение миссии установлено

06.10.2026, MASTER14:43:45МСК, MAX_RIGHT14:44:16МСК. **INSTALLED / SERVICE READY**. Пользователь разрешил оба компонента; root применил только согласованные файлы и метаданные манифестов. F, браузер, TouchDesigner и остальные приложения не обновлялись.

## Применение

Установлен `MAX-NATIVE-MISSION-PRESENTED-20261006`: 2 bridge-файла MASTER и12 runtime-файлов MAX_RIGHT из [замороженного кандидата](../workspace/tasks/max-lidar-live-input-20261006/delivery/candidate-manifest.json). Передача маленьких ZIP, без повторной отправки медиа/разметки/зависимостей. В [локальном отчёте](max-native-game-presented-20261006.md) сохранены причина, архитектура и21/21 проверки кандидата.

Перед применением: pinned UUID/host, fresh registry, SHA/CAS каждого файла, неизменные config/игровой bundle/калибровка, задача Interactive и отсутствие активного посетителя/миссии/сценария. В ходе подготовки возникали реальные сессии; установщик ждал завершения, ничего не отменял. MASTER обновлён первым; MAX — после отдельной проверки готовности MASTER. Только собственный launcher stop и штатная Scheduled Task start.

Первая попытка MASTER остановилась **до замены файлов**: проверка ожидания ошибочно включала независимый `stella-cloud-cues/observer.py`, использующий тот же runtime Python. Служба MASTER восстановлена штатным запуском. Для r2 ожидание ограничено захваченным деревом собственного node PID с проверкой PID/CreationDate/ExecutablePath; при откате дерево нового node захватывается заново. Независимый review учтён. Observer PID5840 остался прежним, не останавливался.

Резерв изменяемых файлов и манифестов на каждом ПК: `C:/VKStand/releases/stand-base-20261005-r1/<ROLE>/data/max-native-presented-20261006-r2/backup-before`. Неудачная r1 и её receipt сохранены отдельно; её резерв не перезаписывался.

| Роль | Новый node PID | Новый bootId | Проверка |
|---|---:|---|---|
| MASTER |31012|83122b11-e505-4554-83f3-5611a37e255b|2SHA, manifest, health.ready, launcher check0|
| MAX_RIGHT |7636|c710d04f-84ce-4d19-827c-87ce5fdd3d45|12SHA, root/component manifest, context, launcher check0|

Receipts: [MASTER](../workspace/tasks/max-lidar-live-input-20261006/deployment/MASTER/apply-result.json), [MAX_RIGHT](../workspace/tasks/max-lidar-live-input-20261006/deployment/MAX_RIGHT/apply-result.json). Независимая проверка: [MASTER](../workspace/tasks/max-lidar-live-input-20261006/deployment/MASTER/verify-result.json), [MAX_RIGHT](../workspace/tasks/max-lidar-live-input-20261006/deployment/MAX_RIGHT/verify-result.json).

## Фактическое состояние

- SHA игровых app.js, data/max-lidar/settings.json, обоих config и canonical max_api.py не изменены. Остальные ассеты и разметка отсутствуют в delta и не копировались. QR мобильного прохождения остаётся выключенным; final QR сохранён.
- Electron MAX один, Session1, PID11460. UDP9001 принадлежит **новому node7636**, не постороннему процессу. Launch logger healthy, writeErrors0.
- Реальная native публикация Layers4096×2562 продолжается: frame3263→3564, Spout registered/sending, errornull, dropped0. Это телеметрия действующего вывода, не нагрузочный тест и не визуальная приёмка LED.
- После старта были краткие MASTER_UNAVAILABLE/CONTEXT_UNAVAILABLE, затем binding-change, game-ready14:44:17.146 и presentation-ack standard/active14:44:17.699. Старые GAME_GATE_CLOSED/FOREIGN_PRESENTATION и shutdown-errors остаются в журнале; их нельзя считать ошибками нового idle запуска. [Журнал текущего PID и граница boot](../workspace/tasks/max-lidar-live-input-20261006/deployment/MAX_RIGHT/log-epoch-result.json).
- В14:45 приёмник bound, packetCount0, reason=no_packets; отсутствие нового потока не доказывает отказ курсора. MAX/current null. Реальный запуск миссии, native canonical accepted и непрерывное физическое удержание **ещё требуют проверки пользователем**. Фиктивные mission/presented/contact не отправлялись.

Следующая проверка на стенде: начать новую обычную миссию, положить и удержать ладонь на активации, затем пройти действие на экране. Сопоставить current assignment/session, `native-game-presented accepted:true`, gate/owner и LiDAR lifecycle в launch log. Browser checks не выполнялись по указанию пользователя.

Трафик SIM: RX не измерено (≈0.210224МБ сохранённых JSON/Base64 ответов); TX≈0.160976МБ загрузки файлов, TX команд не измерен; всего не измерено; учёт: частичная оценка; основание: две staging-передачи r1/r2 обоим получателям, включая реальные повторные ZIP/планы/installer, и сохранённые ответы через Selectel; перезаписанные ответы/неуспешные вызовы, framing/WAN/keepalive/реестр не измерены; остаток: неизвестен. Это payload, не счётчик оператора. Прежние2.817772МБ исследования повторно не списаны. [Расчёт](../workspace/tasks/max-lidar-live-input-20261006/deployment/traffic-estimate.json).
