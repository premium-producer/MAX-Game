# MAX v5 — восстановление через native dialog

03.10.2026. Причина: фасад сразу активировал владельца до preload, а renderer первоначальный task переводил в paused, скрывая устройство. Прогресс корректно сохранялся, но UX и активация таймера расходились.

Использован готовый браузерный HTMLDialogElement.showModal(), а не самописный modal/focus trap. Native top layer находится вне масштабируемого WebGL root. SessionPort и существующий backend OWNER_CHANGED отвечают за паузу, receipt replay и resume; новый state machine/таймер не добавляется.

Источники:
- [W3C H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102) — native dialog и порядок фокуса.
- [MDN showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) — top layer/inert, baseline March2022.
- [WHATWG #8339](https://github.com/whatwg/html/issues/8339) — реальное ограничение модальности: возможен переход к browser chrome. Поэтому backend ownership отдельно учитывает blur/focus и visibility.
- [WHATWG #12347](https://github.com/whatwg/html/issues/12347) — проблемы вложенных requestClose в cancel. Здесь cancel предотвращается и RETURN_MENU подтверждается до обычного close(), requestClose не используется.

Версия: встроенный Chromium, используются стабильные showModal/close без новых CloseWatcher API. Новых npm-зависимостей/лицензий нет; сторонний код не копируется.

Контракт ограничен standalone v5 backend=local. initialOwnerActive=false; выбор и GPU preload не расходуют время. Continue возобновляет имеющийся task/result через trace→phone-enter и существующие readiness gates. Scan остаётся ладонью, completed/incomplete — QR, expired/нулевой остаток — Restart/Menu. Restart сбрасывает только текущую миссию. Escape возвращает меню через backend, ошибки не закрывают диалог. Остальные renderer/server/service сохраняют прежнее поведение.

Ограничения: падение процесса до checkpoint подчиняется прежнему backend recovery, не меняем сохранения/lease. Полное прохождение и художественная приёмка не заменяются CPU-тестами.

[Проверка](../../artifacts/reports/max-v5-recovery-20261003.md).
