# MAX: восстановление независимых ассетов после запуска

06.10.2026. Владелец попросил восстановить цикл двух независимых ассетов MAX и передачу контента и фона всеми поверхностями. Live-изменения выполнял только root. F, TD, медиа, БД и пользовательские настройки не изменялись. Браузерные проверки не выполнялись.

## Причина и правка

До правки MASTER сохранял `desiredMode=assets`, два cycleAssetIds и 90 секунд выдержки, но `effectiveMode=null`, `phase=pending`, revision24/epoch40. Все восемь Spout senders уже были включены; их native ACK не доказывает готовность вложенного MAX renderer.

MAX после запуска PID10020 получил GET503 `/other` в05:38:42, связь с MASTER появилась в05:38:43. Ни нового attach, ни presentation ACK далее не было. Точный URL в старом журнале скрыт как `/other`; связь конкретного503 с boot HTML/module — вывод из порядка запуска и кода. Подтверждён дефект: выдача всей статической оболочки стояла после `await binding()`, поэтому стартовая ошибка оставляла iframe без исполняемого host, способного восстановиться.

В `app/max-adapter/local-server.mjs` только три exact GET перенесены до проверки binding: `/max-mobile/`, `/max-mobile/host.mjs`, `/max-mobile/presentation.mjs`. Они остаются после проверок Host/Origin/path, проходят прежнюю SHA/realpath-проверку и прежний CSP. Context, credentials, attach/ACK, игровые маршруты и медиа по-прежнему требуют binding. Повторный опрос MASTER уже реализован существующим host; новый механизм повторов/таймеров не добавлялся.

Source D: `artifacts/workspace/tasks/max-control-panel-20261006/code/max-right/app/max-adapter/local-server.mjs`. До синхронизации SHA source совпадал с live baseline. Изолированная правка, тест и резерв: `artifacts/workspace/tasks/max-shell-recovery-20261006/`.

SHA до: `605cd1c0f6517c65f6958349ac9cf95a20cb93f4d369b854ba61e18fa32a9525`.
SHA после: `085240bf83367170722ebf4b7121bc0b0a472724274ba5e6a2ae8e3339b22944`.

## Применение и проверка

- Fresh Producer Kit UUID MAX + pinned SSH, CAS файла/metadata/boot, штатный owned stop/start только MAX. Backup: `C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT/data/max-shell-recovery-20261006/backup-before`. Root/component manifests обновлены; config SHA сохранён. Новый host PID2648/boot82414b33-a2ae-4a50-861d-d2b397031c0c.
- Duplicates и parser PASS. Настоящий изолированный HTTP regression PASS: без MASTER оболочка200, защищённые маршруты503, неправильный Host/Origin403, tampered module SHA reject, затем ready context/player/attach200. Diagnostic/audio/mobile hooks в fixture заглушены; game JS не исполнялся. Существующие9 adapter/host tests PASS. Независимый read-only review — PASS.
- Реальный MAX renderer подтвердил assets в05:58:01 UTC: effectiveMode=assets, phase=active, revision26/epoch43/settingsRevision19. Ревизии изменились между снимками; эта правка не посылала команд изменения режима или настроек.
- Сохранены `device.custom.home-photo-no-benefits`, `device.custom.tv-first-30s`, cycleEnabled=true, staticWaitSeconds90 и обе иконки. Реальная телеметрия показала первый READY, через≈91сек выбор второго ассета и `media.playing`; не использовался поддельный ACK.
- MASTER подтвердил Layers/background=true/content=true у ARCH_RIBBON, VK_LEFT, MAX_RIGHT. Всего4 фоновых opaque и4 контентных alpha senders. Кадры растут на всех ролях.

## Ограничения

Физическую картинку/альфу consumer пользователь проверяет сам. В первых выборках MAX с активным assets publish-rate≈30FPS, dropped0; прежние≈60FPS относились к фону без запущенного контента. Это не доказательство60FPS с ассетами. Сохранились POST `/other` MAX_BINDING_UNAVAILABLE при idle: аналогичные записи существовали до этой правки; assets ACK и цикл при этом работают, MAX audio rejections пусты. Классификацию этих legacy idle POST и оптимизацию полного Layers не объявлять выполненными.

Доказательства: `layered-spout-20261006/deployment/MAX_RIGHT/read-max-shell-verify.json`, `.../MASTER/read-max-cycle-live.json`, `max-shell-recovery-20261006/cycle-start.json`, установочный receipt. Новая правка дополняет20-файловый Spout ZIP и не входит в него; при следующей полной сборке брать актуальный D source.

Финальная проверка06:01:01UTC: полный цикл фото→видео→фото, media.ended, ready=true/failed=false; все8senders presented. Точное доказательство: `artifacts/workspace/tasks/max-shell-recovery-20261006/cycle-complete.json`.
