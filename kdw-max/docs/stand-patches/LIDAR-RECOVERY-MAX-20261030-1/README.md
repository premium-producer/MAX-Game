# LIDAR-RECOVERY-MAX-20261030-1

30.10.2026 13:38 МСК: установлен только apps/max-game/launcher/lidar.cjs на production MAX DESKTOP-64J4BMN. Атомарная замена с проверкой SHA256; предыдущий файл сохранён. MAX не останавливался: output PID5036, API17660, supervisor7424 не изменились. Патч ожидает следующего полного запуска MAX; работа нового кода на стенде пока не проверена. Стелла и CHUWI не затронуты. Настройки и release-manifest не изменялись; учитывать plan.json этого патча в цепочке последующих delta-обновлений.

Резерв: C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.previous.cjs
Откат: powershell.exe -NoProfile -File C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/rollback.ps1
Скрипт проверяет хост и обе контрольные суммы, возвращает предыдущий модуль без перезапуска. Если новый модуль уже загружен, откат вступит в силу при следующем полном запуске MAX. Откат не выполнялся.

Проверки локально: 40/40 тестов приёмника, калибровки и восстановления ввода. Детали в docs/verification-lidar-recovery-20261030/README.md.
