# MAX-SHOW-02 — установлено на стенде

05.10.2026. Пользователь назначил root владельцем обновления MAX и его настройки MASTER; отдельным подтверждением разрешил принять27файлов в F. Независимый агент проверил SHA, remap, additive migration и installer. Первоначальный отказ автоматической проверки записи F снят этим явным подтверждением; до него F не изменялся.

## Применение

- Producer Kit fresh registry, pinned host keys, Selectel: MAX_RIGHT `6a8a4e42-437b-4fd4-a363-d2fb155db83b` / DESKTOP-64J4BMN /dr7; MASTER `066c1c43-8266-4a86-885e-4d2855d91546` /DESKTOP-27LJLV6 /futuronika-setup.
- Release `C:/VKStand/releases/stand-base-20261005-r1/`:9файлов MAX_RIGHT и6MASTER. Два renderer-файла из source ARCH_RIBBON применены только в MAX_RIGHT. На ARCH/VK_LEFT/STELLA эта задача ничего не устанавливала и не перезапускала.
- Установлены постоянная прогретая оболочка, видеоустройство/плавные переходы, UI frame batching, плавная галочка/AA, удаление подписи и настройка screenDelayMs=1000. Прежнее enabled=true сохранено. Текущая разметка/медиа/БД не заменялись; миграция только добавляет колонку с default1000.
- Сначала остановка была заблокирована проверкой записи execution. Read-only уточнение показало `phase=completed`, свободную Стеллу и пустой MAX; guard уточнён до активных фаз. Штатные stop/apply/start: MASTER04:48:35–04:48:51UTC, MAX_RIGHT04:49:08–04:49:24UTC. CAS всего allowlist до записи, SHA payload, резерв и manifests обновлены штатной схемой предыдущего installer.
- Резервы обеих ролей: `<release>/<role>/config/max-show-device-before-20261005`. Откат возвращает файлы из overlay и manifests; новую SQLite-колонку, receipts и текущие данные не удалять. При неизвестном результате сначала читать apply/verify, не повторять установку.

## Проверки

- Live SHA15/15 и root manifests15/15 PASS. `launcher check` обеих ролей exit0; MASTER `backend-canonical-gateway-ready`, MAX_RIGHT `external-adapter-loaded`.
- MASTER `/health` ready=true; прежний dataset instanceKey сохранён; `/max/show-mode`:enabled=true,revision3,activeSessionId=null,screenDelayMs1000.
- MAX_RIGHT immutable idle shell HTTP200; `/bridge/context` доступен, active=false, тот же dataset. Новые render-frame логи: Spout sending/registered,≈59,97–60,01fps, dropped0, размер4096×1282 с прежними служебными строками. Это счётчик производителя кадров, не доказательство отсутствия редких рывков внутри игры.
- До применения:48целевых CPU-тестов и57ранее выполненных backend/gateway, локальный настоящий managed ID→OFF→ID→ролики, один bootId/count1. [Подробная проверка](max-show-device-20261005/README.md).
- IAB к операторской панели на стенде не открылся: разрешённый SSH-маршрут отказал в port forwarding (`administratively prohibited`), ERR_CONNECTION_RESET. Ограничение не обходили, свой временный tunnel закрыли. Физическая LED/drag/плавность и полный новый стендовый проход после этой установки ожидают пользовательской проверки. Исторический gpu-diagnostic.log не принят за новую ошибку запуска.
- F:27узких файлов приняты CAS в существующий `artifacts/production-source-max-show-20261005` и3исходника `artifacts/local-master/max_show_*`; provenance/README обновлены. Резерв `F:/project/VK_DigitalProducts_Stand/artifacts/workspace/backups/max-show-device-20261005`. Существующий порядок overlays сохранён; без массового копирования D→F. Общий F/TODO.md дополнен одной записью после отдельного подтверждения пользователя; остальные записи сохранены, резерв TODO-before-max-record.md. Финальная SHA27/27 PASS.

## Доказательства и трафик

Все планы, SHA и ответы: [deployment](../workspace/tasks/max-show-device-20261005/deployment/), в том числе `live-audit.json`, `MASTER/verify-result.json`, `MAX_RIGHT/verify-result.json` и `health-result.json`. Candidate app SHA256 `25e37373fa80cebcc6a1b829662dfddd372613a933dc5b7be22b2f8292d5813a`.

Трафик SIM: RX ≥1.128167 МБ файлов; TX не измерено; всего не измерено; учёт: оценка payload / остальное не измерено; основание: два delta ZIP1104715+13784байт и два экземпляра apply.ps14834байт через Selectel; SSH-команды, ответы, накладные расходы, неудачный туннель и общий API-трафик не измерены. F/кеш/локальные файлы не списываются сSIM. Остаток: неизвестен; исходные≈150ГБ не текущий счётчик, прошлые/параллельные передачи повторно не учтены.
