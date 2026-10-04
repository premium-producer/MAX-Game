# Публикация MAX

04.10.2026 — **Резерв Full HD на CloudCore:** https://vidrs.ru/df/max-game-client/ , тот же20261004T101343Z,173SHA/HTTPSPASS. Existing file_server, public symlink, без Caddy reload. Прогресс независим от futuronika.pro (разные origin). [Отчёт](../../../artifacts/reports/max-client-1080-cloudcore-20261004.md).


04.10.2026 — **Клиентский Full HD**: https://futuronika.pro/df/max-game-client/ (release20261004T101343Z). Публикация явно разрешена пользователем. Отдельный static root/current, route df-max-game-client.caddy; прежняя /df/max-game/ сохранена. Сборка: build-webgl-v5-runtime.mjs → package-client-1080.mjs → deploy-client-1080.py RELEASE → verify-web.mjs URL. IndexedDB :client1080, локальный прогресс. Никакие JSON редактора при deploy не копируются. [Проверка/ограничения](../../../artifacts/reports/max-client-1080-20261004.md).


30.09.2026 — текущий **CloudCore20260930T090006Z**: все обновления MAX, включая подписи после линка и следующий линк после ухода телефона. https://vidrs.ru/df/max-game/guided-reveal/ . Previous20260930T073539Z сохранён;200/200 серверных и HTTPS SHA PASS, браузерный переход задания PASS, console0. Caddy/порты/другие проекты не менялись, Selectel независим. [Отчёт](../../../artifacts/reports/max-cloudcore-20260930T090006Z/README.md). Публикация по отдельному запросу.

30.09.2026 — та же сборка20260930T073539Z опубликована по отдельному запросу на **CloudCore**: https://vidrs.ru/df/max-game/guided-reveal/ . Публичный каталог `/srv/vidrs.ru/public/df/max-game` ссылается на `/srv/projects/futuronika/df/max-game/current`; релизы в `releases/<UTC>`. Используется существующий file_server vidrs.ru: Caddy/DNS/порты не менялись, restart/reload не выполнялись. Это первая публикация MAX по этому пути; прежнего current нет.200 серверных/HTTPS SHA PASS. [Отчёт](../../../artifacts/reports/max-cloudcore-20260930T073539Z/README.md). Selectel сохранён.

Для CloudCore использовать профиль `secrets/secrets/VPS/CloudCore_VPS/ssh_config`, alias `vidrs-vps`, strict host key. Перед активацией проверить актуальный hostname/маршрут, занятость public/current и SHA неизменного публичного комплекта. Распаковать только в новый `/srv/projects/futuronika/df/max-game/releases/<UTC>`, выполнить `sudo sh activate-cloudcore.sh <UTC>`. Активатор ограничен hostname vm1237.cloudcore.plus и этими двумя MAX-путями, отказывается от чужого current/public. HTTPS проверка: `node artifacts/max-game/scripts/verify-web.mjs https://vidrs.ru/df/max-game/ <report.json>`. Существующие релизы не удалять. Откат последующих публикаций — атомарно вернуть current к previous; отмена первой — убрать только созданную public-ссылку, оставив релиз для восстановления. Новые публикации требуют отдельного запроса.

30.09.2026 — по отдельному запросу опубликован DF20260930T073539Z: последовательное раскрытие260/420ms с перекрытием, дуги в ряд, линейный телефон и исправление целей WebGL. https://futuronika.pro/df/max-game/guided-reveal/ . Previous20260930T064646Z сохранён, сервер/HTTPS200/200 SHA PASS, Caddy PASS. VK и мастер не переключались. [Отчёт](../../../artifacts/reports/max-selectel-20260930T073539Z/README.md). Дальнейшие публикации требуют нового запроса.

30.09.2026 — по новому явному запросу пользователя опубликован DF20260930T064646Z:200 публичных файлов, включая Guided, Guided Line, Guided Reveal и large-blocks. Новый эксперимент: https://futuronika.pro/df/max-game/guided-reveal/ . Previous20260929T110035Z сохранён; серверные/HTTPS SHA200/200 PASS. VK остаётся20260928T123948Z; локальный мастер не переключён. [Отчёт](../../../artifacts/reports/max-selectel-20260930T064646Z/README.md). Это разрешение на текущую публикацию; дальнейшие обновления по умолчанию локальные до отдельного запроса.

29.09.2026 — последнее указание пользователя: **только локальные обновления**, без дальнейшей упаковки, загрузки и активации Selectel до нового запроса. Ранее постоянное разрешение автопубликации отменено.

До получения этого сообщения опубликован DF20260929T110035Z со сценарными схемами, previous20260929T062258Z сохранён, HTTPS164/164 SHA pass. /vk не переключался. [Отчёт](../../../artifacts/reports/max-topology-20260929/README.md).

29.09.2026 — DF20260929T062258Z: MAX заглавными на старте и в шапке телефона обеих редакций; previous20260928T144622Z сохранён, HTTPS164/164 SHA — pass. Старый VK-релиз не переключался. [Проверка](../../../artifacts/reports/max-naming-20260929/README.md).

28.09.2026 — DF20260928T144622Z: плавная посадка иконок сразу в итоговый ряд и медленное проявление нового плюса, обе редакции; previous20260928T143731Z сохранён.164/164 HTTPS SHA. [Проверка](../../../artifacts/reports/max-soft-placement-20260928/README.md).

28.09.2026 — DF20260928T143731Z: плюсы клиента сразу открывают picker без обязательной справки. Previous20260928T133753Z сохранён;164/164 HTTPS SHA. [Проверка](../../../artifacts/reports/max-client-direct-picker-20260928/README.md).

28.09.2026 — DF20260928T133753Z: презентация первого MAX (reveal240ms, hold500ms, spring flight и radial burst), обе редакции; previous20260928T130436Z сохранён.164/164 HTTPS SHA; короткий браузерный проход обеих страниц без ошибок. [Отчёт](../../../artifacts/reports/max-start-presentation-20260928/README.md).

28.09.2026 — новая пара страниц: https://futuronika.pro/df/max-game/ (текущая), https://futuronika.pro/df/max-game/client/ (клиентская). Активен DF20260928T130436Z, previousDF20260928T125916Z сохранён;164/164 HTTPS SHA, обе страницы проверены в браузере. [Отчёт](../../../artifacts/reports/max-two-editions-20260928/README.md). Существующий VK-релиз20260928T123948Z остаётся на прежнем адресе.

Для DF использовать отдельный root `/srv/projects/futuronika/df/max-game/` и `activate-selectel.sh RELEASE df`. Аргумент site допускает только `vk`/`df`, по умолчанию vk для обратной совместимости. Route-файлы и current/previous независимы. Package включает `client/index.html` с base../; verify-web запускается по базовому `/df/max-game/` и проверяет также client/index.html. Не переключать обе площадки без соответствующего запроса; текущая задача направлена на DF. [Контракт редакций](EDITIONS.md).

28.09.2026 — активен20260928T123948Z: safe zones вокруг установленных иконок и подписей при раскрытии picker.163/163 HTTPS SHA, браузерные5/4 вариантов без пересечений. Previous20260928T122634Z сохранён. [Отчёт](../../../artifacts/reports/max-picker-safe-zones-20260928/README.md).

28.09.2026 — актуальный релиз20260928T122634Z с отдельным «Открыть MAX» опубликован:163/163 HTTPS SHA, знак/подпись подтверждены в браузере. Предыдущий20260928T115856Z сохранён. [Отчёт](../../../artifacts/reports/max-selectel-20260928T122634Z/README.md).

28.09.2026 — действующее указание пользователя: обновления MAX после проверки сразу публикуются на Selectel, без повторного запроса на каждый релиз. Прежние записи «только локально / до отдельного запроса» отменены для текущей работы над MAX. Публикация только статического комплекта игры, с SHA-проверкой и сохранением предыдущего релиза.

28.09.2026 — опубликована пошаговая сборка пути, релиз20260928T115856Z.162/162 HTTPS SHA, серверная проверка и короткий браузерный проход план→Continue→задание успешны. Предыдущий20260928T111712Z сохранён. [Отчёт](../../../artifacts/reports/max-selectel-20260928T115856Z/README.md). Публикация разрешена этим запросом; дальнейшие изменения по умолчанию локальные.

28.09.2026 — по новому явному запросу пользователя опубликован релиз20260928T111712Z:162 файла, серверная и HTTPS/SHA-проверка прошли. Предыдущий20260928T085347Z сохранён для отката. Короткая проверка браузером: CTA/миссии/создание ID/попап/следующий шаг, console без warn/error. [Отчёт](../../../artifacts/reports/max-selectel-20260928T111712Z/README.md). Предыдущий запрет публикации снят для этой операции; последующие изменения по умолчанию локальные до нового запроса.

Публичная standalone-игра: https://futuronika.pro/vk/max-game/

Selectel, существующий Caddy на vidrs-prod-01. Игра — статические файлы; отдельный серверный процесс и порт не нужны. Путь `/srv/projects/futuronika/vk/max-game/releases/<UTC>`, активная версия — атомарный symlink `current`. Маршрут `/etc/caddy/sites-enabled/vk-max-game.caddy` изолирован от остальных приложений.

1. Из корня проекта выполнить `node artifacts/max-game/scripts/build.mjs`, игровые тесты и check-local.mjs.
2. `node artifacts/max-game/scripts/package-web.mjs` создаёт новый каталог в artifacts/workspace/dist/max-game и SHA256SUMS. Разрешены только публичные runtime-зависимости; docs, launchers, handoff, исходники и секреты исключены.
3. Передать комплект на существующий SSH-host `selectel-vidrs` через установленный профиль `$USERPROFILE/.ssh/selectel-vidrs.conf`. Не копировать ключи в приложение и не отключать host-key verification.
4. Распаковать в новый releases/<UTC>, передать и выполнить `artifacts/max-game/scripts/activate-selectel.sh <UTC>`. Скрипт проверяет SHA, принадлежность route, валидирует Caddy и переключает current. Старые релизы сохраняются. При проблеме вернуть current на previous из вывода активации. На первой публикации previous отсутствует: для отмены маршрута переместить только vk-max-game.caddy из sites-enabled и reload после validate.
5. `node artifacts/max-game/scripts/verify-web.mjs https://futuronika.pro/vk/max-game/ <report.json>` проверяет все публичные ресурсы по SHA. Коротко открыть опубликованный URL, проверить CTA/миссию/консоль.

Постоянное разрешение публикации отменено29.09.2026; каждый новый релиз требует отдельного запроса. Stand Service остаётся локальным: `apps/STARTUP/Start.bat`, `Check.bat`, `Stop.bat`, http://localhost:8770. Для просмотра standalone через уже работающий мастер — http://localhost:8770/max-game/ . Не запускать независимый Electron или сервер из корня.

Релиз 20260928T084429Z (круглый CTA с плюсом и подписью; навигация в локальных меню): 162 публичных файла, версия 1.0.0. Игра использует localStorage браузера; прогресс не синхронизируется между доменом и стендом. HTTPS-версия не управляет оборудованием стенда.
