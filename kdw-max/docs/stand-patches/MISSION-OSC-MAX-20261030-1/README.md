# MISSION-OSC-MAX-20261030-1

30.10.2026 13:43 МСК установлен на диск production MAX DESKTOP-64J4BMN без остановки и перезапуска. Изменён только apps/max-game/launcher/game-state-osc.cjs (3138 байт). Новый OSC /max/mission активируется после полного запуска MAX/API. /max/state сохранён. Протокол и таблица ID: docs/MAX_OSC_MISSION.md.

SHA256 установленного и резервного файлов проверены. PID API17660/output5036/supervisor7424 до и после совпадают. Стелла и CHUWI не затронуты. Настройки и release-manifest не изменены; учитывать plan.json при подготовке следующих delta-обновлений. Проверка нового канала на работающем стенде отложена до запуска.

Резерв: C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.previous.cjs
Откат: powershell.exe -NoProfile -File C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/rollback.ps1
Скрипт проверяет хост и SHA256, возвращает прежний файл без перезапуска. Откат не выполнялся.

Ранее установленный LIDAR-RECOVERY-MAX-20261030-1 не менялся и также ожидает полного запуска MAX.
