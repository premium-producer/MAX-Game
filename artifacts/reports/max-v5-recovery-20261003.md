# MAX v5 — восстановление, 03.10.2026

Изменено: native recovery dialog, inactive startup ownership для standalone local v5, продолжение через существующий renderer resume; focus/visibility защищены до выбора и готовности GPU. Backend rules, сохранения и ответы не изменялись.

Root реализовал и проверил browser/runtime; restore_review выполнил независимый аудит (его замечание о фокусе исправлено), restore_tests создал пять интеграционных тестов на установленном backend с receipt replay.

PASS:19/19 recovery+device-morph+completion, node --check3JS, duplicate guard, scoped build28/201, HTTP SHA28/source SHA201.

Внутренний браузер, отдельная session=review-recovery-20261003: меню→Digital ID/ладонь→reload→native выбор; Continue→прежняя ладонь; reload→Restart→загрузка/новая миссия; следующая reload→выбор; Escape→подтверждённый RETURN_MENU→видимое меню. Финальная сборка повторно открыта, компактный заголовок проверен снимком. Обычная пользовательская сессия не сбрасывалась. [Снимок](max-v5-recovery-20261003.png).

CPU подтверждает именно task restore: тот же screenId/answers, остановленное время, resume→trace→phone-enter→task после settled gate; scan без synthetic hold; result и QR; другая миссия сохраняется при restart. Фактическое восстановление устройства посреди task в браузере остаётся пользовательской проверкой: browser-инструмент не предоставляет длительный hold0.8s. Художественная приёмка OPEN.

Console: прежнее отдельное сообщение «MAX background: Ожидается живая маска стенда». Новых ошибок recovery не замечено. Мастер, публикация, тяжёлый GPU и запись видео не выполнялись.

[Обоснование](../../docs/Research/max-v5-recovery-20261003.md).
