# MAX Full HD: резервная публикация CloudCore

04.10.2026. По прямому запросу пользователя опубликован **тот же** release `20261004T101343Z`:
https://vidrs.ru/df/max-game-client/

Пакет не пересобирался; приложение и разметка не менялись. SHA256 архива `eef02e4da35cf10697776431159482f2b528335159e002a9f28b3a2151401c16`. Read-only субагент reserve_package_audit подтвердил 173 runtime-файла, два манифеста и побайтовое совпадение архива. Рабочие данные редактора и секреты отсутствуют.

Использован существующий Caddy file_server vidrs.ru и тот же способ статической публикации, который зафиксирован в CloudCore ALLOCATIONS для MAX30.09. Ни нового route/Caddy reload, ни backend/порта/БД не потребовалось.

- canonical: `/srv/projects/futuronika/df/max-game-client/releases/20261004T101343Z`
- current: `/srv/projects/futuronika/df/max-game-client/current`
- public symlink: `/srv/vidrs.ru/public/df/max-game-client` → current
- прежний MAX current остался `20260930T090006Z`; Selectel не менялся.

До применения проверены hostname, pinned SSH, sudo, диск (150GB свободно), память, Caddy/Docker/SSH active и контейнеры. Выделенные пути отсутствовали. Deploy проверил архив SHA, 173 server SHA и создал ссылки без перезаписи существующих путей. Сервисы после применения active, PostgreSQL healthy, uptime контейнеров не изменился.

[HTTPS-проверка](max-client-1080-cloudcore-20261004-http.json): 173/173 SHA PASS, errors=[].
IAB1920×1080: меню четырёх миссий, переход к ладони, error/warn отсутствуют. Полное удержание/прохождение до QR в этой публикационной итерации не проверялось; ограничения основной Full HD проверки сохраняются.

Повторяемый инструмент: `artifacts/max-game/scripts/deploy-client-1080-cloudcore.py RELEASE`, подготовлен в codex/max-flow-editor-v3; initial-only guards, синтаксис и duplicate guard PASS. Для следующего обновления нужен отдельный переход current с сохранением previous — текущий скрипт откажется при существующей публикации. Откат первой публикации: убрать только public symlink (unlink после проверки readlink); сам release и upload сохранять.

Пользовательский прогресс хранится на origin браузера: vidrs.ru и futuronika.pro имеют независимые сохранения. Межсерверная синхронизация прогресса не добавлялась.
