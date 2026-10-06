# MAX: управление со смартфона

05.10.2026, 14:41 UTC — **публичный relay и интеграция MAX_RIGHT установлены**. Сайт: https://futuronika.pro/max/game. Защищённое соединение стенда подтверждено; полный проход телефоном перед физической стеной ещё требует пользовательской проверки.

Архитектура: одна canonical-сессия, стеновое представление и лёгкий мобильный интерфейс; QR под ладонью привязывает телефон к текущему запуску. Публичный целевой путь — `https://futuronika.pro/max/game`.

Исходник находится в отдельном D worktree: `artifacts/workspace/tasks/max-mobile-control-20261005/worktree/artifacts/max-mobile-control/`. Разделение владельцев/ветки, запуск пилота, feature flag, конфигурация relay и требования D→F описаны в [README кандидата](../../../artifacts/workspace/tasks/max-mobile-control-20261005/worktree/artifacts/max-mobile-control/README.md).

Локальные адреса при запущенном `node src/pilot.mjs`: стена `http://127.0.0.1:19448/`, мобильный UI на том же ПК `http://127.0.0.1:19447/max/game/`. Они не доступны телефону через интернет. Проверка браузером автоматически не запускалась.

Реализованы broker ввода, Socket.IO relay/companion, QR/cookie claim, экранные fences, ready lease стены, hold, annotations/buttons/instructions, exact command retry, результат. 42 небраузерные проверки PASS, включая реальные canonical/SQLite и HTTP/Socket.IO.

Relay на Selectel: `max-mobile.service`, loopback19447, Caddy `/max/game`, релиз `20261005T135500Z` в `/srv/projects/futuronika/max-mobile/releases/`. 102 уникальных медиа проверены по SHA; 100 переиспользованы из прежнего клиентского релиза. Секреты генерируются на сервере, `/etc/max-mobile/relay.env`, root:max-mobile0640; в Git и отчёты не включаются. HTTPS/ассет/cookie/Socket.IO auth проверены протокольно, без браузера.

Добавлен phone-media-ready: canonical input owner и автоэкраны ждут готовность обоих представлений. Production adapter использует принятый ServerSessionPort, loopback9573, существующую авторизацию и отдельный SQLite-журнал неопределённых команд. MASTER завершает canonical-миссию сам; пульт не вызывает запрещённый master finish.

MAX_RIGHT: действующий `app/max-adapter/local-server.mjs` включает production companion, SQLite pending и readonly wall facade. Dedicated relay token находится только в `secrets/max-mobile.token` с ограниченным ACL. В отсутствие назначения mobileControl.enabled=false и QR отсутствует; при ручном назначении включается привязка к единственной canonical-сессии. Авторизация MASTER и его lifecycle сохранены.

Обычная игра — режим по умолчанию. Опциональный `config/max-mobile.json` со значением `{"backgroundOnly":true}` включает редкий режим «только фон»; отсутствие файла либо false возвращает нормальную игру. Постоянная manual shell готовит ассеты и сохраняется между ручными миссиями; показ ждёт gameReady, managedBinding и готовый broker scope. Автоматическое представление следует штатным фазам сценария и сохраняется при ID→ролики. Старый принудительный показ ролика отключён.

Применён пакет `max-mobile-control-20261005`, 923 файла, ZIP3.034073МБ без медиа. Live source сверён с production-clean + AUDIO03; аудиомост, фон, packed stamp rows и текущая разметка сохранены. Проверки:65/65, CAS/SHA, штатный launcher, HTTP и authenticated relay PASS; Spout≈60FPS/dropped0. F в этой итерации не изменялся; кандидат и receipts находятся в D для принятия интегратором. Детали и rollback — в отчёте публикации.

[Отчёт публикации](../../../artifacts/reports/max-mobile-controller-deployment-20261005.md).

[Исследование](../../../docs/Research/max-mobile-controller-20261005.md) · [Отчёт проверки](../../../artifacts/reports/max-mobile-controller-implementation-20261005.md).
