# MAX mobile — публикация 05.10.2026

## Фактический статус

Пользователь поручил реализовать систему на сервере и стенде. Публичная часть и MAX_RIGHT установлены. 05.10.2026 в14:41UTC подтверждено authenticated Socket.IO соединение фактического ПК с relay. Полный пользовательский проход телефоном перед стеной остаётся OPEN. Никаких браузерных проверок не запускалось.

## Установка MAX_RIGHT — текущий результат

Доступ восстановился через штатный Selectel, pinned host key; UUID6a8a4e42-437b-4fd4-a363-d2fb155db83b, DESKTOP-64J4BMN, dr7, LAN10.0.0.13. Пользователь уточнил: нормальная игра приоритетна; режим «только фон» редкий и выключен по умолчанию.

Установлен пакет923файла/3034073байта, ZIP SHA `3763928b3913aeb8992747a395b3b1188f8f54028d1dc70057bd5edd2b5a9434`. Медиа не передавались. Baseline rootmanifest `0b8a8cee44e5db116e773bc43aa5574c31cf8423a05ba623274f8ac96e6249c4`; все baseline/payload/postapply SHA проверены. Backup: `C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT/config/max-mobile-control-before-20261005`. Receipts: `artifacts/workspace/tasks/max-mobile-control-20261005/stand-deploy/`.

Изменён фактически используемый app/max-adapter, а не исторический app/control/max-adapter-v3. Renderer пересобран из production-clean candidate/source + принятого AUDIO03; устаревший первичный helper-base отвергнут до установки. Внешний /bridge/audio-client.mjs сохранён. Сохранены master-audio, output-host, asset-server, component.json и пользовательские данные. Root/renderer/accepted-source manifests обновлены. Secret64байта доставлен отдельно с ACL, проверен hash; значение не выводилось, в пакет не включено.

Убрано безусловное отключение overlay. Persistent shell сохраняет прогрузку между ручными миссиями, ждёт фактические gameReady/managedBinding и совпадающий broker scope. Числовой canonical runId поддерживается. Автоматическое представление ждёт wall-фазы, сохраняется между ID/видео; forced operatorVideo=false. backgroundOnly по умолчанию false, отдельный конфиг opt-in. QR+readonly wall facade включаются для ручного назначения, единственный input owner у companion. Idle без назначения: enabled=false/projection=null — ожидаемо.

В14:35перед stop9573 уже оказался недоступен. Диагностика: все node/electron/vk-output процессы и порты9573/9576 отсутствовали, остался PID23124/boot7d58e7e9…; запись сохранена в data/max-mobile-control-20261005/stale-node-process.json после повторной проверки. Причина предшествующей остановки неизвестна. Apply14:38:54UTC, штатная task VKStand-r1-Start-MAX_RIGHT14:39:17UTC. Другие роли не перезапускались.

Проверки:65/65 тестов без SKIP, canonical/SQLite всехмиссий, Socket.IO/HTTP/SSE, wrapper7/7 и независимыйreview. Node25 test fork передавал Worker несовместимыеexecArgv; повтор с --test-isolation=none успешен, backend не патчился. Duplicateguard/build/syntax PASS. Launcher checkExit0, application idle-running, wrapper200, все923файла+preserved без SHAрасхождений. Spout4096×1282≈60FPS/dropped0. Старое сообщение gpu-diagnostic «Render startup timed out» имеетmtime04.10 23:05UTC, не относится к текущему запуску. Relay probe authenticated=true/connected=true/publishedState=false; искусственная миссия не создавалась. Физический LED/QR/телефон и игровой ввод на стенде ещё не приняты пользователем.

F не изменялся: принятие исходников/manifest в master-project остаётся интеграционной задачей; комплект D сохраняет точные payload, source и receipts. При следующей общей сборке нельзя заменить установленный MAX старым background-only кандидатом. Откат стенда: остановить только MAX_RIGHT, восстановить изменённые файлы и manifests из указанного backup, новые файлы убирать только по overlay.json; сохранить secret/pending/userdata.

Трафик SIM: RX ≥3.034137МБ полезных данных (ZIP3034073+token64байта), плюс малые PS/relay-probe; TX не измерено; всего не измерено; учёт: оценка; основание: подтверждённая точечная SFTPпередача, source/status/registry/SSH/TLS ответов и накладных расходов безWANсчётчика; остаток: неизвестен. Старый publicgzip2.958724МБ повторно не списан. ЛокальныеD/F/CPUтесты безSIM. Payload не операторский расход.

Ниже сохранён первоначальный этап публикации до восстановления доступа.

## Selectel

- Узел `vidrs-prod-01`, штатный профиль `selectel-vidrs`, host pin сохранён.
- URL https://futuronika.pro/max/game, отдельный Caddy route, service `max-mobile`, enabled/active.
- Применён релиз `20261005T135500Z`, активация около13:56UTC. Каталог `missions-reviewed-20261003-abe878cfed89`, source SHA `9365ca419fe6839efe6df2053948527f9640914c694c67e1d1194d4bdba85a65`.
- gzip2,958,724байта, SHA `9b0abb5378e4d65d47f22c5c0f04c6f3e035f23535b056c11c6534fd5b29ea19`.
- SHA918 файлов пакета проверены. 102 уникальных медиа /54,104,746байт проверены по каталогу:100 подключены к неизменяемому прежнему релизу,2 новых файла948,490байт включены в gzip. Старые ассеты/разметки/БД не переписывались.
- До применения current/route/unit отсутствовали; SHA главного Caddyfile `7610eb1ad0c2f39240cbd020f744f4fa85cd7f9c27b882c96e56189ddedd8bd0`. Caddy validate PASS; исходный Caddyfile не редактировался.
- Установленный route SHA `4e148ad3f1e5f6783843bb0d1b68a79b91cd9cd32c91523e42d74f7600bc7351`; unit SHA `83bcffadd50886b5167c8151bd60e423ecb7890690a0aa4de116781964b8326f`.
- Ключи созданы сервером в `/etc/max-mobile/relay.env`, права640root:max-mobile. Значения не читались/не журналировались/не переносились в Git. Stand token ещё не установлен на MAX_RIGHT.
- Публичные протокольные проверки: HTML200/2245байт; app.mjs200/SHA71886e76…; session401 с HttpOnly/Secure/SameSite=Strict; SVG200 с точнымSHA98d2a448…; Socket.IO namespace stand отвергает неверный token как AUTH_REQUIRED.

## MAX_RIGHT и ограничения

UUID `6a8a4e42-437b-4fd4-a363-d2fb155db83b`, DESKTOP-64J4BMN, аккаунтdr7. Оба штатных шлюза сообщают fresh registry, но host_key_verified=false. Туннельный listener есть, ssh-keyscan не получает ключ. Повтор fleet после подтверждения включённого ПК также неуспешен. Проверка с доступного MASTER (`066c1c43-8266-4a86-885e-4d2855d91546`) по последнему LAN10.0.0.13:22/9573/9576 — все недоступны. Адрес исторический; не утверждается, что текущий адрес тот же. Пользователю задан вопрос о сети/текущем IP.

Не обходились host key, реестр, роли, закрытые маршруты. На стенд ничего не загружалось и процессы не перезапускались; F не изменялся. Необходимо восстановить штатный доступ, сверить live SHA и сохранить audio/background-only и master-адаптации перед установкой. Offline adapter не равен установленной интеграции.

## Проверки кандидата

Финальная проверка кандидата:57/57PASS,0SKIP с явным `MAX_PRODUCTION_PORT_MODULE=file:///F:/project/VK_DigitalProducts_Stand/artifacts/canonical-max/presentation/src/application/server-session-port.mjs`. Canonical/SQLite все4миссии и blogger public/private, реальный HTTPcookie/Socket.IO/companion, exact receipts/ACK, reconnect, wall+phone media gate, Origin/auth, официальный EventSource, отзыв wall SSE и10секунд read-only terminal grace после MASTER release. Duplicate guard PASS. GPU/браузер/физический LED не проверены.

`production-entry.mjs` монтирует facade в действующий9573 либо запускает companion на loopback19449 для узкого same-origin proxy. `vendor/managed-session-port/provenance.json` содержит SHA неизменённых ServerSessionPort/pending-store/idb и MIT-лицензию; проверяется перед импортом. Это подготовленный интеграционный компонент: монтаж в действующую версию адаптера/launcher и rebase wall entry по live SHA ещё не выполнены из-за отсутствия доступа. Не заменять текущий адаптер историческим целиком.

## Откат

Отдельные route/unit/current и backup находятся под `/srv/projects/futuronika/max-mobile`. Активатор содержит CAS и автоматический rollback при ошибке. Для ручного отката этого первого релиза остановить/отключить только max-mobile, сохранить route/unit в backup, убрать только его route из include и после caddy validate reload. Не изменять прежнюю клиентскую игру, редактор или медиа. Секретный файл сохранять для повторного развёртывания.

## Трафик

Трафик SIM: RX не измерено; TX не измерено; всего не измерено; учёт: не измерено; основание: штатные SSH registry/status и небольшая LAN-диагностика через внешние шлюзы без WAN-счётчика,0МБ передачи файлов на MAX_RIGHT. На Selectel отправлен gzip2.958724МБ плюс каталог/инвентаризатор и команды; маршрут управляющего подключения через SIM стенда не подтверждён, с SIM не списан. HTTPпроверки и npm EventSource2пакета — отдельно на управляющем ПК; payload не операторский расход. Остаток: неизвестен, около150ГБ — историческая оценка; локальный D/F/loopback не учитывается, прошлые передачи не списаны повторно.
