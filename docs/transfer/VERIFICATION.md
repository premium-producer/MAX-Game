# Проверка самостоятельного комплекта — 04.10.2026

Назначение: private GitHub `premium-producer/MAX-Game`. Передача игры и контекста по прямому запросу пользователя, без изменения её поведения.

## Состав и происхождение

- D исходник: VK_DigitalProducts, ветка `codex/project-structure`, HEAD `505973ba9da8d9c2f57823e648a90b84cf79c14d`; передан рабочий файловый снимок, включая незакоммиченные разработки MAX.
- Независимая read-only сверка donor `codex/max-flow-editor-v3`: 1504/1504 MAX source файла совпали по SHA256, уникальных donor delta нет.
- Все версии runtime, редактор, backend, assets и исходные Figma/design файлы сохранены. Manifest-owned зависимости из ribbon/service включены с исходными относительными путями.
- Принятые F canonical/backend/assignment файлы сохранены отдельно в integration/master-snapshot. Мастер не менялся.
- Релиз `20261004T101343Z`:175/175 файлов совпали SHA с опубликованным локальным пакетом. Точная копия сохранена отдельно от пересобираемого runtime.
- Исходный `SOURCE_MANIFEST.json` фиксирует первый этап копирования; дополнительные зависимости, документация передачи и пересборка учтены в `REPOSITORY_MANIFEST.json`.
- Серверные черновики разметки исключены по прямому ответу пользователя. Применённая игровая разметка остаётся в source/release. Живые БД, browser profiles, credentials, keys, secrets и node_modules не переданы; lockfile сохранён.

## Выполнено

1. Чистая установка `npm ci --prefix artifacts/max-game --no-audit --no-fund` внутри экспортного каталога — PASS,59 packages. Node25.9.0 выдаёт engine warnings для nanoevents/nanoid; lockfile не менялся.
2. `check_project_duplicates.py` — PASS.
3. `build-webgl-v5-runtime.mjs` — PASS,31 runtime files,209 modules,2049156 bytes.
4. `annotated-gameplay`, `webgl-v5-final-backend`, `asset-audit-card-locks`, `asset-audit-cloud`:34/34 CPU tests PASS. Миссии public/private, восстановление, flow guard, CAS/leases и HTTP API редактора.
5. Внутренний браузер, изолированный origin localhost:19445: загрузка ресурсов →4 миссии →«Стать блогером» →экран удержания ладони. Ошибок/предупреждений консоли не обнаружено. Полный hold→QR не проверялся этим переносом.
6. Gitleaks8.30.1 default rules + узкие исключения идентификаторов Figma/контрольных сумм; dir scan с archive/decode depth2:~2.23GB проверено,0 необработанных findings. Двоичные изображения не интерпретируются как текст. Gitleaks не является математической гарантией отсутствия любых секретов.

## Инструменты

- [Gitleaks](https://github.com/gitleaks/gitleaks),MIT,8.30.1. SHA256 Windows ZIP: `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`.
- [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage): бинарные ассеты и большие исходные документы. `.gitattributes` сохраняет их точные байты. Требуется `git lfs pull` после clone.

## Не заявляется

Полная художественная приёмка, исправление Safari/iPhone, исполнение произвольного flow-v3, полная сборка всего стенда F и новая серверная публикация в эту работу не входили. Открытые задачи сохранены в TODO и docs/DEVELOPMENT_CONTEXT.md.
