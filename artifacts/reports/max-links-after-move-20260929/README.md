# MAX: связи после завершения движения

29.09.2026. Связи игровой зоны полностью скрываются при drag, программном переносе/swap, intro и перелёте выбранной иконки. IconMotion отслеживает retarget и фактическую скорость/остаточную ошибку. После успокоения120мс (без задержки при reduced motion) связи пересчитываются и проявляются с нуля. Idle bob/hover не запускают скрытие. Зоны имеют независимые scope.

Renderer скрывает всю группу ленты, включая частицы и retiring edges, обнуляет opacity и пропускает обновление скрытой геометрии. После движения TileEdgeMotion сразу принимает актуальные порты; старый изгиб не интерполируется к новой паре. Новых RAF/targets нет.

Проверено:

- Syntax5JS;256/256Node-тестов — tests.log. Добавлены drag/settle/idle/cancel-retarget, placement/reduced-motion, скрытие retiring edges и сброс старых портов.
- Штатная сборка MAX206files/79modules; check-local PASS.
- Одна вкладка клиентской игры: перенос канала в блогере. Во время движения connectionsMoving=true/visibleLinks=0, послеfalse/3; сохранены [движение](moving.png) и [остановка](settled.png). На снимке движения нет волокон или частиц.
- В бизнесе выполнен swap канала и аккаунта: неверный порядок стал ready, во время перестановки visibleLinks=0 — [swap-moving.png](swap-moving.png). Старые красные пары скрыты полностью. Console ошибок нет.
- Локально перезапущен только max-wall-right; HTTP bundle совпадает с runtime, generation изменена — runtime.json. Check.bat:5running/Spout sending, MAX25.7FPS.

После swap проверено connectionsMoving=false/visibleLinks=2/wrongLinks=0: [новые пары](swap-settled.png). Статические снимки не доказывают FPS. Общая производительность стенда остаётся открытой; приём TD отдельно не проверялся. Без тяжёлых прогонов, видео, Selectel и Git-публикации.
