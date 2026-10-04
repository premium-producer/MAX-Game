# MAX — свечение путей только при смысловой перестройке

Последнее указание пользователя заменяет прежнее скрытие всех связей при движении. Введены отдельные состояния: `connectionsMoving` описывает движение, `connectionsSuspended` — гашение при замене/обмене существующих шагов. `changesExistingRoute` сравнивает назначения узлов до/после принятого действия; добавление и изменение координат не включают gate. `RouteReconnect` переживает первый ещё не подготовленный layout и ждёт окончания перемещения. При обычном движении порты и кривые продолжают обновляться через TileEdgeMotion. Обновлены Motion Skills, контракт MAX и три общих документа.

Проверки: syntax3,283/283 Node-тестов ([лог](tests.log)), build206files/83modules, check-local PASS. Новые CPU-сценарии различают перенос/добавление и замену/обмен, проверяют границу подготовленного кадра и независимость зон.

Одна браузерная вкладка, клиентская миссия общения ([состояния](browser.json)):

- После drag: moving=true, suspended=false, visibleLinks=1.
- В полёте новой иконки: preview=group, moving=true, suspended=false, visibleLinks=2.
- При обмене видеозвонка и группового чата: moving=true, suspended=true, visibleLinks=0.
- После покоя: moving=false, suspended=false, visibleLinks=2.
- Console error/warn отсутствуют. [Поле после обмена](field.png).

Локальный MAX worker обновлён, HTTP bundle соответствует runtime ([проверка](runtime.json)); Check.bat: running/Spout sending. В той же вкладке просмотрен фактический [экран мастера](master.png), console чистая. Производительность не оптимизировалась (краткий Check17.3FPS), тяжёлые тесты/видео не выполнялись; приём TD не проверялся. Только локально, без Selectel и Git-публикации.
