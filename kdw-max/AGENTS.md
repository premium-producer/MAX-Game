# Игра MAX нового стенда

Эта папка содержит актуальную самостоятельную игру KDW-MAX. Пути ниже относительны этой папке; прежние artifacts/max-game и integration/current в корне репозитория — история, не источник для перезаписи этой версии.

- Начинать с README.md, WORKLOG.md, releases/max-game/STABLE-20261019/baseline.json и docs/GAME_STAND_SYNC.md.
- Исходники: apps/max-game/source; исполняемая сборка: apps/max-game/www. Собирать source/build.mjs, main изменять через source/adapt-stand-main.mjs. Не запускать первоначальные import/upgrade поверх локальных правок.
- Frozen source/stand-base сохранять; build проверяет семь разрешённых адаптаций (включая journey-v5-video-source для standby-video readiness). Один renderer и ядро для Electron и браузера, текущие ID/revision и совместимость сохранений сохранять.
- Поддерживать настоящий стендовый standby, общий масштаб миссий, gap 128 logical px browser view, девятичастную рамку устройства и единый стиль связей. Не возвращать основным dev-меню или отдельное автоматическое телефонное приложение.
- apps/max-game переносится вместе с соседней apps/STARTUP. Runtime поставляется полностью, Node.js/npm при запуске не требуются.
- Данные посетителей, профили, ключи и серверные черновики не коммитить. При обновлении сохранять существующий data. Большие/двоичные файлы — Git LFS; до запуска после clone выполнить git lfs pull.
- После правок проверить состав изменений, обновить манифест только max-game через apps/STARTUP/tools/check-package.mjs --app max-game --seal, затем проверить без --seal. Физическую приёмку не подменять браузерными тестами.
- Стабильный тег kdw-max-stable-20261019 не перемещать. Новые изменения вести в ветке kdw-max; обновлять журнал и затронутую документацию.

Уточнения22.10.2026: сохранять текущие эффекты/пресеты и данные при обновлении. Текущая business-all ветка cafe/flowers/auto; исторические sports/hotel/theater не переименовывать. Меню использует kdw-idle-menu, устройство KdwDeviceMorph. Редактор использует отдельные store/catalog по бизнесу, не перезаписывать облачные черновики без CAS/backup. См. docs/kdw-max/CURRENT.md.
