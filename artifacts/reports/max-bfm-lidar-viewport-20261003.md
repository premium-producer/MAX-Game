# MAX BFM — приближение зоны LiDAR, 03.10.2026

Адрес: http://localhost:8770/max-game/bfm-design/?backend=local&layout=lidar . Та же страница, SessionPort и профиль; новый `layout` меняет только CSS viewport. Переключатель «Вид» возвращает всю стену без перезагрузки и без команд рестарта. Активное удержание отменяется при изменении масштаба, чтобы контакт не оставался в старой геометрии.

Используется существующая BFM_PLAY_AREA: X2192,025…4096, Y614,992…1020,519. Native CSS transform равномерно вписывает область с отступом24px и центрирует её. SVG/игра/iframe фона имеют общий перевод и масштаб. Identity/HUD/loading размещены внутри доступного вида. Параметры backend и положение объектов в физических координатах не изменены.

PASS: node syntax2 модулей;5 CPU-тестов (3 существующих contact/transition,2 viewport); CSS parser esbuild0.28.2; duplicate guard; scoped BFM runtime build (4 файла,25 модулей); SHA source/runtime/HTTP для HTML/CSS, runtime/HTTP для app.js. [Машинные результаты](max-bfm-lidar-viewport-20261003.json).

Browser: BLOCKED. Auto-review отклонил открытие видимой вкладки из-за AGENTS no-browser rule. Запрошено отдельное разрешение на проверку переключателя без сброса миссии. Скриншот, визуальная приёмка и FPS не заявляются. Мастер/TD/конфиги/прогресс не изменялись. Пользователю проверить центрирование, читаемость и возврат «Вся стена» на том же этапе.

[Обоснование native CSS и ограничения](../../docs/Research/max-bfm-pixel-map-guides-20261003.md).
