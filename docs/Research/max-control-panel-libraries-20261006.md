# MAX control panel — готовые механизмы, 06.10.2026

Статус: исследование кандидатов и план интеграции, не установленное решение. Проверены первичная документация, опубликованные релизы и реальные issues. Браузер, стенд, зависимости и F не изменялись. Файл принадлежит подзадаче control_solution_research; общий документ/WORKLOG сводит root.

## Решение

Сохранить существующую vanilla HTML/JS панель MASTER, FastAPI/SQLite/DBOS и WebGL MAX. Уточнение от аудита master: React используется Стеллой, **не** текущей operator panel; React сюда не добавлять. Панель задаёт желаемое состояние через MASTER; фактический показ подтверждает renderer. Выбранный baseline: Uppy Dashboard + Tus для всех файлов, tusd 2.10.1 Windows amd64 на MASTER, SortableJS 1.15.7 для порядка иконок. Не писать собственный upload protocol и не добавлять вторую машину бизнес-состояний.

| Механизм | Проверенный кандидат | Что реально делает | Ограничение / решение |
| --- | --- | --- | --- |
| Очередь файлов, прогресс, отмена, повтор | Uppy core 6.2.0, Dashboard 6.0.1; MIT | Готовые upload UI и queue/restrictions | Клиентские ограничения не заменяют проверку backend. Скачать один pinned комплект при сборке, не CDN на стенде |
| Альтернатива, не выбрана | Uppy XHR 6.0.1 + имеющийся FastAPI 0.142.2 UploadFile | Multipart, progress; сервер spool memory→disk | После разрыва файл передаётся заново. Не подходит общей гарантии resume; отдельный малый upload не добавлять |
| Все uploads, включая видео | Uppy Tus 6.0.0 + tusd 2.10.1; MIT, tus protocol 1.0.0 | Offset-based pause/resume; локальное дисковое хранилище; hooks | Дополнительный контролируемый процесс на MASTER, health и lifecycle Windows. Единый путь upload; реальный тест обрыва через фактический маршрут |
| Порядок иконок слева/справа | SortableJS 1.15.7, MIT | Два связанных списка, touch, handles, filter, onEnd | Без React; клавиатурные кнопки вверх/вниз/другая сторона остаются отдельными обычными кнопками |
| Рассмотрено, не выбрано | dnd-kit core 6.3.1 + sortable 10.0.0, MIT | Sortable lists, pointer/touch/keyboard, handles | Тянет React в vanilla панель. Также legacy/new API нельзя смешивать |
| Анимация устройства/иконок | Уже установленный maath 0.10.8, MIT + Three 0.185.1 | Действующий V5MotionValue использует maath damp, единый renderer clock | Не внедрять GSAP/Motion/новый timer только ради нового режима. Расширить существующие цели alpha/pose/device morph |
| Команды и восстановление | Уже принятые DBOS 3.2.0 + SQLite | Durable workflow, idempotent workflow IDs/messages, SQL transactions | Не путать DB commit с появлением кадра; отдельно ACK renderer. Не заменять текущую очередь/admission |

Версии Uppy/tusd/dnd-kit выше — опубликованные кандидаты, а не доказанная совместимость с данным стендом. Версии maath/Three прочитаны в D artifacts/max-game/package.json; maath license/version также в установленном package.json. DBOS/FastAPI — F artifacts/production-source-w3a/master/requirements.lock.txt, актуальный live lock до реализации сверить владельцу. Открытый upstream pmndrs/maath сейчас перенаправляет на новое pmndrs/math; это **не** причина мигрировать существующий maath.

## Загрузка и расход трафика

Uppy Dashboard предоставляет выбор нескольких файлов, прогресс, retry и ограничения. Pause/resume работает лишь с транспортом, который это реализует — обычный XHR его не даёт. [Dashboard](https://uppy.io/docs/dashboard/), [выбор uploader](https://uppy.io/docs/guides/choosing-uploader/), [Tus](https://uppy.io/docs/tus/).

FastAPI UploadFile использует SpooledTemporaryFile, поэтому сам multipart не требует держать весь файл в RAM. Однако вызов read() без ограничения всё равно создаст полный bytes-объект. Это серверный приём файла, а не протокол возобновления. [Документация](https://fastapi.tiangolo.com/tutorial/request-files/), [реальное обсуждение больших файлов #8229](https://github.com/fastapi/fastapi/discussions/8229).

Tusd — отдельный поддерживаемый сервер с дисковым storage и hooks. Сохранение offset позволяет продолжить передачу после разрыва; но сама библиотека не выполняет валидацию игрового ассета и не публикует его в renderer. [Репозиторий](https://github.com/tus/tusd), [протокол](https://tus.io/protocols/resumable-upload).

Предлагаемый жизненный цикл ассета: uploading → validating → ready-on-server → transferring-to-MAX_RIGHT → ready-on-device. Только последний статус разрешает «Показать». SHA-256, immutable assetId, проверенные dimensions/duration и manifest revision позволяют не передавать одинаковый файл повторно. Это прикладная интеграция поверх готового транспорта; checksum не заявляется как встроенный глобальный дедупликатор tus. Renderer готовит следующий ассет вне кадрового пути; текущий остаётся до готовности следующего.

При операторе в LAN загружать прямо в локальный контур MASTER/MAX_RIGHT, без облачного разворота. Интернет-маршрут показывать в панели до большой передачи. Не передавать видео через JSON/base64, не хранить бинарные ассеты в SQLite. Удаление ассета, используемого активной или опубликованной сценой, запрещать до снятия ссылок. Временные незавершённые upload отдельно очищать по TTL, не затрагивая применённую разметку.

Для tusd обязательны ограниченный размер и trusted origin/auth hooks, отключённый прямой download staging, fixed storage root. Reverse proxy должен передавать hostname/scheme и **не буферизовать весь request**: иначе resume теряет смысл. Это прямо описано upstream. [Конфигурация](https://tus.github.io/tusd/getting-started/configuration/). Реальный [issue #1106](https://github.com/tus/tusd/issues/1106) описывает резкое падение скорости за nginx/HTTPS; это свидетельство необходимости проверки маршрута, не доказательство проблемы нашего сервера. [Разбор connection locks/timeouts](https://github.com/tus/tusd/wiki/Thoughts-on-handling-connection-issues) исторический, численные defaults оттуда на 2.10.1 не переносить.

## Компоновка и управление

### Выбор Windows upload server

Выбран **tusd 2.10.1 Windows amd64**: upstream публикует готовый ZIP 27,5 МБ и SHA-256 `9573ed55a1f814aac57b84da0552440c4a1c5afedc28b2c34f6a5584dc48b9ad`. [Точный список artifacts](https://github.com/tus/tusd/releases/expanded_assets/v2.10.1). Это опубликованные metadata, архив здесь не скачивался/не исполнялся; downloaded SHA нужно проверить на стадии сборки. Плюсы для стенда — upload/IO отдельно от event loop оператора, не зависит от Node25/native modules. Цена — один дополнительный процесс, health, bounded staging и включение в существующий launcher, без второго MASTER.

Альтернатива **@tus/server + @tus/file-store** тоже официальная MIT реализация: требует Node >=20.19.0 (имеющийся Node25 попадает в диапазон), может встроиться в существующий HTTP server. Не выбрана в baseline: не нужен риск связывать жизненный цикл больших upload с fleet/control; точные package locks и Windows behavior не проверялись. Upstream file-store не заявляет checksum extension; окончательный checksum всё равно прикладной. [Документация](https://github.com/tus/tus-node-server). Технический выбор tusd не означает доказанную интеграцию Windows shutdown/restart — это обязательный протокольный acceptance gate.

Upload endpoint — внутри операторского контура MASTER/LAN, публичный сервер не требуется. Loopback tusd публикуется только через уже авторизованный operator gateway. Если сама operator panel пока доступна лишь на MASTER loopback, доступ с планшета надо отдельно провести через принятый LAN gateway; не просто выставить tusd на 0.0.0.0.

### SVG intake

Произвольный SVG не должен проходить через extractor конкретных Figma exports и не должен попадать inline в DOM. Предлагаемый готовый converter: **@resvg/resvg-js 2.6.2, MPL-2.0**, нормализация в прозрачный PNG + thumb до ready. Он реально растеризует SVG и выдаёт dimensions; это не механизм выделения иконки из подписи. Текст не извлекать автоматически; пользователь загружает отдельную иконку или выбирает crop. [Репозиторий/возможности](https://github.com/thx/resvg-js), [релиз](https://github.com/thx/resvg-js/releases/tag/v2.6.2).

У библиотеки есть external-image support, поэтому network/file resolvers должны быть запрещены в ingest; converter выполнять изолированным worker с ограничениями времени, памяти и pixel dimensions. Шрифты фиксированы, system fonts off. MPL-2.0 требует отдельной фиксации лицензии и условий распространения модификаций библиотечных файлов; не называть её MIT. Точный Windows addon/Node25 lock и hostile SVG checks ещё не проверены. Если этот gate не успевает в первую итерацию, явно ограничить первый upload PNG/WebP/JPEG и MP4, а SVG показывать как неподдержанный формат; не принимать его с молчаливым небезопасным обходом.

Предлагаемый UI: две сортируемые колонки «Слева»/«Справа», центральная карточка устройства, в каждой строке thumb, название, видимость, отдельная ручка перетаскивания и кнопки переместить вверх/вниз/на другую сторону. Порядок хранить в IDs, не координатах экранного DOM. Игровой layout вычисляет отступы от фактической ширины устройства, общую ось Y и ограничение правой стены. Для тонкой подстройки — числовой offset/gap, не свободное перетаскивание игрового renderer в панели.

SortableJS обслуживает сам механизм reorder в существующей vanilla панели: общий group для двух списков, handle, filter для интерактивных элементов, onEnd для сохранения. Не отправлять pointermove в MASTER. [Документация](https://github.com/SortableJS/Sortable), [релиз 1.15.7](https://github.com/SortableJS/Sortable/releases/tag/1.15.7), [MIT](https://github.com/SortableJS/Sortable/blob/master/LICENSE). Реальные [touch/scroll #2426](https://github.com/SortableJS/Sortable/issues/2426) и [iOS shadow-root fallback #2464](https://github.com/SortableJS/Sortable/issues/2464) задают проверку телефона/планшета; Shadow DOM здесь не нужен. Кнопки вверх/вниз/другая сторона обеспечивают доступный способ без drag. Рассмотренный dnd-kit отклонён после аудита фактической панели: внедрение React ради reorder неоправданно; [issue #477](https://github.com/clauderic/dnd-kit/issues/477) также показывает конфликт drag с вложенными inputs.

Панель посылает commandId + expectedRevision + mode/config. MASTER сериализует изменения; конфликт выдаёт свежий snapshot, а не молча затирает состояние другого оператора. Existing DBOS обеспечивает idempotency запуска по workflow ID и доставки сообщений по idempotency_key. [Workflows](https://docs.dbos.dev/python/tutorials/workflow-tutorial), [communication](https://docs.dbos.dev/python/tutorials/workflow-communication). Эти гарантии не дают exactly-once для произвольного внешнего эффекта renderer: нужны generation/revision и повторяемый ACK.

SQLite допускает одного writer; короткая транзакция commit управления не должна содержать upload/hash/decode или ожидание WebGL. Для read-then-write учитывать snapshot conflict и повтор всей транзакции по текущим правилам backend. [Isolation](https://www.sqlite.org/isolation.html), [WAL ограничения](https://www.sqlite.org/wal.html). UI обновляется по уже существующему каналу snapshots; новую WebSocket-платформу без необходимости не вводить. Частота UI-поллинга, если он существующий, не превращается в частоту записи БД.

Переходы: команда принята → подготовка → плавный уход текущего foreground → применение → renderer ACK. При неподготовленном ассете не выдавать «Активен». Для independent assets состояние 1 = foreground скрыт, 2 = устройство, 3 = устройство+иконки; скрытие устройства из 3 последовательно убирает иконки, затем устройство. Фон и постоянный MAX остаются прежним общим трактом. Настройки каждого режима сохраняются отдельно от текущего активного mode. Это предложение протокола, а не уже существующая функция.

## Граница проверок перед принятием

1. Зафиксировать lock/license выбранных dependencies; offline bundle без CDN. Проверить no-op reuse имеющегося assetId.
2. Протокольные тесты: повтор commandId, конфликт двух операторов, старый generation, потеря ACK, reconnect/reset renderer, незавершённый upload, disk-full, неверный MIME/размер, дубликат, используемый ассет нельзя удалить.
3. Для tus — реальный resumable upload через тот же proxy: оборвать после части bytes, вернуть соединение, доказать offset и checksum, считать фактически переданные bytes. Не объявлять готовность по mock tests.
4. Для SortableJS — touch/reorder с чекбоксами, пустой колонкой, отменой drag и альтернативными клавиатурными кнопками; браузерная проверка только при отдельном явном запросе пользователя согласно текущему запрету.
5. Анимации — существующий maath clock, retained objects и кэш; не создавать текстуры/материалы на каждый кадр. Физическая визуальная приёмка пользователем.

## Релизы и лицензии

- [Uppy releases](https://github.com/transloadit/uppy/releases): core 6.2.0, Dashboard/XHR 6.0.1 видны в выпуске 30.09; [Tus 6.0.0](https://github.com/transloadit/uppy/releases/tag/@uppy%2Ftus@6.0.0); [MIT](https://github.com/transloadit/uppy/blob/main/LICENSE).
- [tusd 2.10.1](https://github.com/tus/tusd/releases/tag/v2.10.1), [MIT](https://github.com/tus/tusd/blob/main/LICENSE.txt).
- [dnd-kit core 6.3.1](https://github.com/clauderic/dnd-kit/releases/tag/@dnd-kit%2Fcore@6.3.1), [sortable 10.0.0](https://github.com/clauderic/dnd-kit/releases/tag/@dnd-kit%2Fsortable@10.0.0), [MIT](https://github.com/clauderic/dnd-kit/blob/main/LICENSE).

Трафик подзадачи: 0 МБ передачи файлов на стенд; web research и локальные чтения, маршрут web через SIM не подтверждён, WAN-счётчик недоступен; общий расход не измерен, остаток неизвестен. В общий WORKLOG включить один раз.
