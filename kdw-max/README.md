# Игра MAX — KDW-MAX, 25.10.2026

Текущая база — проверенный экспорт от 24 октября. История прежнего стенда сохранена в остальных каталогах репозитория. [Состояние поставки](docs/kdw-max/SYNC-20261025.md).

```sh
git lfs pull --include="kdw-max/**" --exclude=""
node kdw-max/docs/kdw-max/verify-source.mjs
```

Команды выше выполняются из корня репозитория. Исходники: apps/max-game/source; общий запуск: apps/STARTUP/Start-Game.bat. Полный Windows Electron44.4.5 x64 нужно добавить отдельно в runtime/electron, сохранив местные data/ключи. Для разработки Node24+: npm --prefix apps/max-game/source/client ci --ignore-scripts; node apps/max-game/source/build.mjs.

Общий STARTUP совместим с соседней apps/stela из VK_Stella/kdw-max. Полные package manifests относятся к переносимому комплекту; очищенный Git-срез проверяется SOURCE_MANIFEST. Теги stable19.10 неизменны; новый аппаратный stable не объявляется.
