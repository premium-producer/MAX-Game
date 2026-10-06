# MAX LiDAR — применение 06.10.2026

Root — назначенный пользователем владелец MAX и его управления в MASTER. Изменены MAX_RIGHT184 и MASTER5 файлов, точечные ZIP591995/14758байт. Source, exact SHA/CAS планы, backups receipts и результаты в `artifacts/workspace/tasks/max-lidar-20261006/`. Стендовые backups: MAX `data/max-lidar-deploy-20261006-r2/backup-before`, MASTER `data/max-lidar-deploy-20261006/backup-before`. Не переносились F, секреты, каталог/медиа, игровой bundle, пользовательские JSON/разметка/БД, TD. Зависимости/лицензии включены, npm cache исключён.

## Подтверждено

- Пользователь разрешил препятствие убрать и вернуть; lifecycle capture подтвердил `/create`→`/update`→`/delete`, OSC ,iffff/,i. Отправитель10.0.0.11:59947 — HokuyoTracker2.exe. Исходные bytes/addresses/тип/ID в udp-lifecycle-confirm.json. Неизвестные два float игнорируются.
- Пакеты обнаружены только после временного узкого LAN firewall probe. Все временные правила удалены. Установлено постоянное правило по senderIP/program/port/localIP, UDP9001 занимает MAX root process.
- 57 CPU tests +5 real NodeHTTP tests PASS; duplicates и PowerShell parser PASS; независимые protocol/renderer/master/package reviews. ready osc.js и perspective-transform выполняют parser/solver.
- После применения189/189 SHA/rootmanifest PASS, launcher check0 на обоих ПК. MAX `/bridge/lidar/frame?after=0`200, receiver.boundtrue, revision0/enabledfalse; MASTER `/fleet/v1/max-lidar`200 по закреплённому mTLS. Panel module и overlay200.
- MAX Layers4096×2562, оба background/content sender зарегистрированы, frames1→140, dropped0/errornull. Это техническая телеметрия, не физическая оценка плавности. Presentation assets/active после обновления. Последний снимок settingsRevision26/staticWaitSeconds10; installer не меняет настройки, исходный preflight ранее отражал24/150 — операторские изменения не откатывались.

## Возникшие ошибки и исправления

Первое применение MAX прервалось на Firewall -Program: Windows не принял forward-slash path. Резерв автоматически восстановил прежние исходники/manifest; подтверждены source085240…2944, новый старый host работал, rule отсутствовал. Исправлен GetFullPath; второе применение успешно. Ответ secondapply не декодировался из-за попытки helper поставить ok в PSCustomObject; successreceipt и фактические SHA проверены отдельно, применение не повторялось.

MASTER guard сначала остановил установку на существующей execution. Read-only уточнение: phasecompleted, все26arrived, updatedAt предыдущего дня. Guard уточнён по существующему контракту terminal completed/cancelled, без удаления execution. Повторный preflight не прошёл из-за уже распакованного stage; включён Force только для собственного SHA-проверенного unpacked каталога до backup. Затем owned stop/start успешен. Активные execution/миссии/queue/Стелла запрещают перезапуск. Config — CAS-only, не автоматически восстанавливается rollback.

## Границы проверки

Браузер не использовался. Настоящая калибровка/включение курсора не выполнялись с фиктивными точками. Последний receiver packetCount0: препятствие к этому моменту отсутствовало либо tracker не отправлял; не выдавать это за подтверждение live hold. Физическое неподвижное удержание и watchdog350мс, точность/ориентация/активация native Electron UI остаются OPEN. Требуется операторская калибровка четыре точки +центр и ручная приёмка. [Инструкция](../../apps/stand-service/docs/MAX_LIDAR.md).

Исследование/калибровка и independent root review: lidar_protocol_research; MASTERpanel: lidar_master_ui; Electron/input и localserver/HTTP: lidar_input_audit; пакет: deployment_review. Владение файлами разделено, итоговая сборка/применение — root.

Трафик SIM: RX≈1.3659МБ; TX≈2.2375МБ; всего≈3.6035МБ; учёт: оценка; основание: два MAX ZIP из-за rollback, один MASTER ZIP, планы/скрипты по финальным размерам и source Base64 чтения, каждый поток учтён один раз. SSH/WAN framing, registry, команды/ответы/ранние capture uploads/облачный трафик не измерены; payload не операторский счётчик. Остаток: неизвестен. Npm/research на рабочей машине не списаны с SIM стенда; LANOSC/loopback/Spout безSIM; предыдущие задачи повторно не списаны. Расчёт: task/traffic-estimate.json.
