# MAX asset editor: загрузка изображений, 03.10.2026

Повтор пользователя после reload в Firefox: ошибочное несовпадение размеров на communication.message.voice-start; ранее blogger.comments.input. Все84 локальных PNG совпадают с каталогом. HTTPS оригинала blogger.comments.input совпал по SHA и682×1792. Первоначальный сбой в Firefox непосредственно не воспроизведён: доступен внутренний Chromium.

Исправление: отдельный native Image на каждое открытие, decode и проверка до замены DOM, прежний epoch защищает от позднего завершения. Annotorious3.9.3 сохраняется. Проверка размеров не ослаблена. Ошибка изображения отделена от статуса сохранения; при новом открытии очищается, mismatch содержит actual/expected/screenId. Mark/Show недоступны до готовности изображения.

Основание: [исследование](../../docs/Research/max-audit-image-dimensions-20261003.md), WHATWG#7680. Это документированный механизм риска, а не доказательство точной причины на пользовательском Firefox.

Проверки:9 catalog/model CPU PASS; node --check PASS; duplicate guard PASS; сборка90файлов PASS. IAB localhost: открыть voice-start → показать сохранённую область → следующий → предыдущий;807×1792,stage.inert=false,image-status пуст,console errors[]. Разметка браузером не редактировалась.

Selectel release20261003T234500Z опубликован штатным deploy. HTTPS app.js/index.html/audit.css/catalog.json побайтово совпали с пакетом. Серверная разметка73действия/33настройки: SHA до/после fdba1e2d7f5a3c82f51cbee1404e7cbd97939cb1fb6ce1cac71c21772ab24a86, изменений нет. Старый release сохранён; пароль/игровой bundle не менялись. Визуальная проверка cloudFirefox и пользовательская приёмка OPEN. Прежняя незавершённая пересборка gameplay ac401 этой итерацией не выполнялась.
