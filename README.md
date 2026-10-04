# MAX — игра и инструменты разработки

Самостоятельный приватный репозиторий MAX. Срез разработки от 4 октября 2026 года: исходники всех версий, backend, редактор разметки, исходные ассеты, исследования, проверки и последняя опубликованная клиентская версия.

## Быстрый запуск

Нужны Git LFS и Node.js. Проверено на Node 25.9.0 / npm 11.12.1; два транзитивных пакета редактора (`nanoid`, `nanoevents`) предупреждают о неподдерживаемой нечётной версии Node. Переход на чётную LTS требует отдельной проверки, зависимости здесь не обновлялись.

```sh
git lfs install
git clone https://github.com/premium-producer/MAX-Game.git
cd MAX-Game
git lfs pull
npm ci --prefix artifacts/max-game
node apps/max-game/start.mjs --no-open
```

Открыть **http://localhost:8785/webgl-v5/client.html**. Это клиентский режим 1920×1080 с пропорциональным масштабированием. Стендовая версия: http://localhost:8785/webgl-v5/index.html?backend=local&layout=wall . Порт можно изменить переменной `MAX_GAME_PORT`. Сервер отдаёт только `apps/max-game`, не корень репозитория.

## Карта репозитория

| Путь | Назначение |
|---|---|
| `artifacts/max-game/` | Главные исходники, package-lock, тесты и сборщики всех версий |
| `apps/max-game/` | Готовый runtime; не править вручную, обновлять сборщиками |
| `apps/max-game/docs/TODO.md` | Рабочий список задач, результаты и открытая приёмка |
| `artifacts/service/max-game/` | Серверные адаптеры и тесты |
| `artifacts/DESIGN/` | MAX brand/UI, оригинальные Figma SVG/JSON/PDF, плагины экспорта |
| `artifacts/ribbon/`, `artifacts/service/public/` | Зафиксированные зависимости MAX: LumiCells, фон, оптика |
| `docs/Research/` | Исследования готовых решений и ссылки на документацию |
| `artifacts/reports/` | Реальные проверки, диагностика, снимки и результаты |
| `releases/client-1080/20261004T101343Z/` | Точная копия последнего опубликованного релиза с SHA256SUMS |
| `integration/master-snapshot/` | Отдельный снимок принятого MAX из F; контекст интеграции, не замена основному source |
| `docs/transfer/` | Происхождение файлов и проверка переноса |
| `WORKLOG.md`, `docs/{BACKLOG,ARCHITECTURE,DESIGN_DOCUMENT}.md` | Исторический контекст общего проекта; содержит также записи о других компонентах |

Начать продолжение разработки с [контекста и ограничений](docs/DEVELOPMENT_CONTEXT.md) и [AGENTS.md](AGENTS.md).

## Сборка и проверки

```sh
python artifacts/web/tools/check_project_duplicates.py
node artifacts/max-game/scripts/build-webgl-v5-runtime.mjs
node --test --test-isolation=none artifacts/max-game/test/annotated-gameplay.test.mjs artifacts/max-game/test/webgl-v5-final-backend.test.mjs artifacts/max-game/test/asset-audit-card-locks.test.mjs artifacts/max-game/test/asset-audit-cloud.test.mjs
```

Для обновления общего backend runtime: `node artifacts/max-game/scripts/build.mjs --shared-only`.
Полный исторический набор профилей: `node artifacts/max-game/scripts/build.mjs`. Сборщики защищают изменённый runtime; при конфликте сравнить источник и manifest, не обходить защиту удалением пользовательских файлов.
Полная CPU-проверка: `npm test --prefix artifacts/max-game` (результат передачи относится только к перечисленным профильным тестам).
Python нужен для дополнительных экспортов/ассетов; скрипты используют Pillow и ReportLab. Уже готовые ассеты входят в репозиторий.

## Редактор разметки с локальным сохранением

После `npm ci`, в PowerShell:

```powershell
New-Item -ItemType Directory -Force artifacts/workspace/tests/flow-editor
node artifacts/max-game/scripts/serve-asset-audit-fixture.mjs artifacts/workspace/tests/flow-editor 19439
```

Открыть http://127.0.0.1:19439/editor/ . Это отдельные локальные данные с автосохранением и блокировками карточек. Статический игровой сервер не является API редактора. Серверная авторизация и живые данные не копируются автоматически.

## Клиентский релиз и публикация

Релиз `20261004T101343Z`, контент `missions-reviewed-20261003-abe878cfed89` опубликован на:
- https://futuronika.pro/df/max-game-client/
- https://vidrs.ru/df/max-game-client/

Повторная упаковка текущего runtime: `node artifacts/max-game/scripts/package-client-1080.mjs`. Скрипты `deploy-client-1080*.py` и `activate-*.sh` сохранены; пути серверов и SSH-профили относятся к исходной инфраструктуре. Для новой среды настроить собственный доступ вне репозитория. Запуск или сборка ничего не публикуют.

Секреты, пароли, приватные ключи, живые БД и профили браузеров не включены. `node_modules` восстанавливается из lockfile. История разработки передана документами и отчётами; Git-история этого репозитория начинается с отдельного проверенного снимка, без полной истории сторонних частей монорепозитория.

Материалы клиента и бренда остаются собственностью правообладателей. Лицензии библиотек сохранены рядом с vendor/runtime; публичная лицензия на весь комплект не предоставляется.
