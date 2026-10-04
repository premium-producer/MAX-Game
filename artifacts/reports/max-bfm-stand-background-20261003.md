# BFM MAX — подключение общего GPU-фона

03.10.2026. В bfm-main импорт и создание локального lumiReferenceBackground заменены существующим commonMapBackground. Удалён вызов background.tick из игрового RAF: общий фон владеет своим штатным render loop. Visibility передаётся через pause, dispose сохранён. iframe не перехватывает указатель. Меню/миссии/градиенты кнопок/раскладка не изменены.

- PASS syntax, duplicate guard, профильные CPU layout-тесты.
- Собрано22 модуля/145366байт JS; manifest включает common-map adapter и не содержит journey-lumi-reference.
- HTTP/SHA4/4 файлов BFM совпадают с runtime. Пять ресурсов /viewer/common-map-game-background.{html,js}, common-map-background.js, common-map-game-layout.js, common-map-game-frost.js доступны200.
- Read-only api/state: run, cubes, dualScale=true, fill/flow присутствуют. Токены и полный state не сохранены.
- GPU/браузер не запускались: кадровое совпадение, GLSL и FPS не подтверждены. Визуальная приёмка ожидается.

Открыть прежний адрес /max-game/bfm-design/?backend=local&layout=wall и обновить. Проверить фон, затем старт миссии и доступность кнопок. Мастер/TD/настройки стенда не менялись и не перезапускались. [Обоснование](../../docs/Research/max-bfm-stand-background-20261003.md).
