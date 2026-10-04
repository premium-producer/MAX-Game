# MAX: короткая подпись и эффект удержания — 04.10.2026

На экране ладони v5 оставлено «Открой возможности»: убраны инструкция/секунды, подпись при раскрытии также короткая. Автоматическая техническая приписка скрыта, пока ладонь присутствует. Обновлены live markup, phase update и GPU warmup. Остальные визуализации сохраняют тексты.

Причина отсутствия эффекта в демонстрации: automatic controller.down пропускал startPalmScan. beginPalmContact теперь общий для pointer,keyboard,automatic; запускает существующий JourneyIntroBurst только при принятом down. Это восстановление прежних световых струй, не новый физический fluid solver. Поле LumiCells и его пустой scanPulse не заменялись. Излучённая струя штатно долетает/затухает после отпускания, новый контакт не перематывает старую. Удержание 800мс и backend cancellation неизменны.

Опора: прежние docs/Research/max-guided-reveal-choreography-20260930.md, apps/max-game/docs/GUIDED_REVEAL.md и существующий JourneyIntroBurst/Three.js. Независимый read-only аудит подтвердил причину и разделение фона/струй. Новых механизмов/зависимостей нет.

Проверки: syntax PASS после исправления локальной опечатки до сборки; startup/autoplay-presentation15/15, journey-motion17/17 (включая release/retouch струй) PASS; duplicate guard и scoped build PASS. HTTP31/31, source231/231 SHA PASS. App a210e57f466e2ab0c7bc94dbec9f56dee2454d609523856eb44e5cfcc21e1682.

IAB client autoplay communication: после рестарта зафиксирован реальный кадр внутри удержания, струи и только короткая подпись видны, footer скрыт; console errors0. Транзиентный снимок сразу после reload пропускал800мс интервал, захват выполнен через обычную кнопку рестарта. Ранний отпуск/отмена подтверждены CPU; отдельный manual pointer hold в браузере в этой итерации не выполнен.

![Удержание](max-palm-hold-20261004.png)

Техника PASS, визуальная самопроверка PASS, пользовательская приёмка OPEN. F и серверы не изменялись; только локальный source/runtime MAX-Game.
