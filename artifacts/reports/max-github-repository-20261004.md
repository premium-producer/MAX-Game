# Отдельный репозиторий MAX — 04.10.2026

По прямому запросу пользователя создан и заполнен **private** репозиторий https://github.com/premium-producer/MAX-Game . Ветка main, начальный commit `8280f703a9ef8d12375fbe9eac1bc7038bc745c7`; GitHub API подтверждает тот же SHA и isPrivate:true.

Локальная независимая копия: `artifacts/workspace/exports/MAX-Game`. Родительский Git index/ветка не изменялись. Серверы и F не менялись.

Передано9769файлов: исходники всех MAX-профилей, runtime, backend, редактор разметки, ассеты/оригиналы Figma/плагины, зависимости LumiCells/оптики, исследования, технические отчёты, контекст и TODO. Последний клиентский релиз20261004T101343Z отдельно,175/175SHA совпадают. Принятый F canonical/backend/assignment срез сохранён в integration/master-snapshot, отдельно от основного D source. Новые README/AGENTS/DEVELOPMENT_CONTEXT объясняют запуск, границы и открытые задачи.

Серверные черновики annotations/flow-v3 не копировались: после автоматического отказа в их экспорте пользователь прямо выбрал оставить только уже имеющуюся игровую разметку. Секреты/пароли/ключи/liveDB/browserprofiles и установленные node_modules исключены. История монорепозитория не публиковалась; контекст передан текущими source, журналом, исследованиями и отчётами, новая Git-история начинается с проверенного снимка.

Проверки:
- Независимый read-only аудит:1504/1504 donorMAXsourceSHAсовпадения, dependency closure дополнен;16source/design roots без пропусков;438Research/969MAXreports файлов сохранены.
- Чистый npm ci —59packages; предупреждения engines Node25.9.0/nanoevents/nanoid записаны, lockfile не менялся.
- Duplicate guardPASS; scopedv5buildPASS (31files,209modules);34/34 профильных CPUtestsPASS.
- IABlocalhost19445:preload→4миссии→Статьблогером→удержание ладони, consoleerrors0. Временная вкладка и сервер закрыты. Полный hold→QR и реальный iPhone этим переносом не проверялись.
- Gitleaks8.30.1:~2.23GB dirscan с archive/decode depth2,0необработанных findings после узких исключений FigmaID/hash; initialcommit scan --all --no-textconv:224.87MB,0findings. Не является гарантией обнаружения произвольных секретов.
-9768записей финального manifest (сам manifest исключён) SHA verified,0mismatches; GitLFSfsckOK.
-3910LFSfiles,1848uniqueobjects,3710508322bytes. Push подтвердил100%1848/1848; main→origin/main success. RemoteSHA совпал.

Продолжение: https://github.com/premium-producer/MAX-Game/blob/main/README.md . Открытый Safari/iPhone crash и ограничения flow-v3 сохранены, исправленными не объявлены.
