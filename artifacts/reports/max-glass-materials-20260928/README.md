# MAX Glass — 28.09.2026

Исправлена фактическая причина: standalone не имел refraction pass, а CSS Journey перекрывал материал кнопок в мастере. Теперь используется один PANEL_GLASS_FRAGMENT с двумя пользовательскими профилями. [Контракт](../../../apps/max-game/docs/JOURNEY.md).

- Панель: Light−68°/70%, Refraction100, Depth116.91, Frost0, Dispersion/Splay0. Преломляется текстура реального фона, включая волны; конечная фаска и линза сохранены.
- Кнопки: Light−45°/80%, Refraction100, Depth33.47, Frost56.25, Dispersion/Splay0. WEB-калибровка9logicalpx, mip-предфильтр LOD≤3 и9 взвешенных выборок. Это адаптация пользовательского референса, не численная эквивалентность Figma. Предфильтр устранил чёткие повторные линии первоначального разреженного blur.
- Standalone: один дополнительный HalfFloat RT с mip-цепочкой; максимум1600px по ширине и2.56Mpx. Мастер использует mip-цепочку уже существующего RT, без дополнительного RT. Цепочка добавляет около1/3 памяти текстуры. Передний план не попадает в blur; вывод sRGB один раз.
- DOM bounds/радиусы учитывают трансформацию и letterbox; открытый диалог исключает перекрытые контролы из лимита20; shader culling использует renderRect с halo.

Проверки: [130 игровых/оптических тестов](tests.txt), [110 Ribbon](ribbon.txt), node --check, check-local (48 compiled inputs,176 runtime files), штатные MAX/Service/viewer/Ribbon сборки. Новые регрессии — viewport/radius и выбор контролов диалога. Предел halo, симметрия/непрерывность нормалей и нулевое преломление при IOR1 проходят прежние проверки.

Одна вкладка: standalone CTA→меню, shader compile без console warn/error, видимый Frost и изгиб волн; [кадр меню](frost-menu.png). Реальный presentation мастера: [кадр](master.png), native down/up принят и CTA сменился меню. Мастер был offline после прошлого выключения; штатный запуск через STARTUP выполнен, затем обновлён только MAX. [Check](master-check.json):5running/Spout;MAX17.6FPS. ПриёмTD/реальныйLiDAR и60FPS не подтверждены. Тяжёлых прогонов/видео не было.

Selectel: https://futuronika.pro/vk/max-game/ — релиз20260928T034241Z. Caddy validate успешен; [162/162 файла совпали поSHA](deployment.json). Предыдущий релиз сохранён для возврата. Художественная приёмка остаётся у пользователя. Git/выключение ПК в этой итерации не выполнялись.
