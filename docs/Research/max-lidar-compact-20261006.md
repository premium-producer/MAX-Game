# MAX: совместимость нового OSC-профиля LiDAR

06.10.2026. Причина подтверждена реальным passiveUDPcapture из предыдущей задачи:10.0.0.11:65478→10.0.0.13:9001,185bundles/935сообщений; create/update теперь3args [ID,X,Y],delete1. Existing receiver требовал5args и отклонял918координатных сообщений. Это ошибка прикладной проверки формы, не decoder osc.js.

Готовый механизм бинарного разбора и UDP остаётся [osc.js](https://github.com/colinbdclark/osc.js#how-oscjs-works), установленная версия2.4.5, лицензия MIT OR GPL-2.0 — используется вариантMIT. README описывает UDPPort, metadata type/value и вложенные bundle/message события. Ограничения Node/Electron native serialport ABI сохраняются; зависимости из существующего кэша, не обновлялись/не устанавливались. Новый decoder/UDP listener/engine не создавался. Реальный опыт данной интеграции — предыдущий захват и replay: artifacts/workspace/tasks/max-disabled-actions-20261006/lidar-audit/new-producer-confirmed.md.

Узкая правка: принимать строго arity3 или5 у прежних /create и /update; XY по-прежнему args1/2, старые хвостовые значения валидируются как раньше. ID safeinteger/неотрицательный/int32, конечные числа≤10000, source10.0.0.11, delete1, ownership/second-hand suppression,350ms expiry/quarantine сохранены. Ничего не выводится из произвольной неизвестной формы. Комментарий источника перечисляет оба наблюдённых профиля.

Проверки:5новых CPU/node:test,2прежнихlegacytests; реальные185пакетов→935messages,918acceptedUpdates,0decodeErrors,3down/149move/3up. Независимая проверка21invalid/IDs/source cases и lifecycle/quarantine/legacy PASS.766ignoredContacts при replay — ожидаемое ограничение единственной primaryруки, не ошибка декодирования или потеря пакетов.

Старая калибровка не мигрируется автоматически: валидная новая форма не доказывает совпадение координатных осей/физического места. Сохранённые calibration/config/input authority не меняются; physicalacceptance отдельно. Backend/игровойbundle/MASTER/F этой задачей не правятся. Браузер запрещён и не используется.
