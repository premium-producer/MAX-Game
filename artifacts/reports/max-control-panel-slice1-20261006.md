# MAX control panel — первый рабочий этап

06.10.2026. **Реализован и технически проверен изолированный кандидат. На стенд и в F не установлен.** Полный четырёхрежимный план этим этапом не завершён.

## Результат

В существующий operator UI добавлен выбор standard/background. MASTER хранит желаемый и подтверждённый режим, revision/epoch, историческую отметку ACK и неизменяемые receipts. Действуют CAS, повтор потерянной команды с прежним ID и запрет автоотправки выбора при открытии панели. Активные/ожидающие задания, занятая Стелла и незавершённый сценарий защищены от неявного переключения; очередь не удаляется.

MAX_RIGHT читает режим через действующий защищённый gateway, сохраняет подготовленную игровую оболочку на фоне и подтверждает применение после fade/следующего кадра. Проверки привязаны к dataset/node/host/lease/generation и renderer boot. MASTER restart сохраняет выбор, но сбрасывает старое подтверждение до нового attach/ACK. Клиент умеет восстановиться после такого сброса, не перехватывая чужой renderer.

Сохранены прежний show workflow, управление скоростью, мобильное управление, диагностика, аудио и общий фон. В review исправлены: невозможность возврата auto→idle, преждевременный ACK от about:blank, зависшее ожидание RAF, ACK из предыдущего boot MASTER и гонка выбора старого show с обычным admission. Изменение скорости/show в standard не удалено; background запрещает запуск show. Старый show не становится новым прямым операторским режимом ID→видео — это отдельный последующий этап.

## Источник и владение

Ветка `codex/max-control-panel-20261006`, отдельный worktree:
`artifacts/workspace/tasks/max-control-panel-20261006/code`.

Свежие read-only SSH baseline сняты с закреплённых MASTER DESKTOP-27LJLV6 и MAX_RIGHT DESKTOP-64J4BMN через Selectel. Manifest SHA:

- MASTER `b6ba17fa9aee28c25ad5a22edd9061a6eb4901662f70709e1201d17371eac4bc`.
- MAX_RIGHT `611e560f3a80abb2eb23968e98a430399584cd106863bb44ec7077faa5e706ff`.
- Accepted UI PIN `66f7f3d1130dd44f1643eb9b8d17a3c0f8b93210cf8c715a2a5cb6a8b3a3af5d`.

Все 10 изменяемых существующих Python-исходников F совпали с SHA живого MASTER; контрольный gateway взят из свежего baseline. Исходный host.mjs сверен с live manifest. Новые файлы изолированы в D. Root владел gateway/сборки/интеграции; три субагента разделили MASTER, MAX adapter/host и UI, затем выполнили независимый review. Конкурентных правок одного файла не было. Общие данные/конфиги F не изменялись.

## Проверки

| Проверка | Результат и предел |
|---|---|
| Python DBOS 3.2 + SQLite + HTTP API | 15/15 PASS: миграция, gate четырёх версий intent, очередь, VK отдельно, CAS/receipts, параллельные writers, legacy show, boot fence |
| Node gateway/operator/UI/MAX adapter/host/client | 29/29 PASS: Host/Origin/CSRF, lease, bound renderer ID, exact POST allowlist, lost response, HTTP adapter, stale async, кеш shell, auto→idle, about:blank, RAF abort, MASTER reset |
| Полный app.py/server.py | PASS: три запуска, два принудительных завершения, сохранены режим и receipts, старый ACK отклонён, до нового ACK pending |
| Сквозная интеграция | PASS: UI controller → fleet HTTP → настоящий app/DBOS/SQLite → MaxAuthority → настоящий local adapter HTTP → presentation client; standard→background→standard, потерянный ответ после commit, повтор ID, смена renderer |
| Комплект | 25 файлов / 274375 байт; 23 syntax checks; импорты разрешаются по live manifest; изменены только два UI PIN, остальные игровые медиа сохранены |
| Duplicate guard | PASS |
| Браузер / GPU / Spout / TD / физический LED | Не запускались. Пользователь запретил браузерные проверки; визуальная и аппаратная приёмка не заявляются |

Сквозной тест использует фактический MASTER app и реальные loopback HTTP-пути. Canonical child/provider выключены в изолированном тестовом конфиге; посторонние audio/mobile/logger transports в Node fixture заменены заглушками. DOM/RAF — CPU fixture. Эти проверки не доказывают реальное выполнение миссии, звук или физическое изображение. Указанные ограничения сохранены в evidence.

## Комплект и доказательства

База относительных ссылок ниже — этот отчёт:

- [Точечный комплект ZIP](../workspace/tasks/max-control-panel-20261006/max-control-panel-slice1.zip), 88921 байт, SHA256 `4c910e2793fe1f4241ca463e4b750f19ff07768e3f0909b0c7415eb1fd437c10`.
- [Allowlist, новые и ожидаемые прежние SHA](../workspace/tasks/max-control-panel-20261006/delta-manifest.json).
- [Проверка комплекта](../workspace/tasks/max-control-panel-20261006/package-check.json).
- [Сквозной результат](../workspace/tasks/max-control-panel-20261006/integration-result.json).
- [Node logs](../workspace/tasks/max-control-panel-20261006/node-tests.log).
- [Python logs](../workspace/tasks/max-control-panel-20261006/code/master/test-results.log), [полный restart smoke](../workspace/tasks/max-control-panel-20261006/code/master/full-smoke-result.json).
- [Renderer review и ограничения](../workspace/tasks/max-control-panel-20261006/code/max-right/REPORT.md), [независимый review](../workspace/tasks/max-control-panel-20261006/code/master-control/test/INDEPENDENT-REVIEW.md).
- [Инструкция приложения](../../apps/max-game/docs/CONTROL_PANEL.md).

Комплект содержит 20 файлов MASTER и 5 MAX_RIGHT. Секреты, БД, разметки, игровые картинки/ролики и тестовые данные не входят. Сборщик не устанавливает файлы. Перенос в F/на площадку — единым согласованным применением назначенного интегратора с повторной сверкой baseline и резервом. Совпадение старого manifest не заменяет проверку фактических файлов непосредственно перед применением.

## Осталось

Пользовательская приёмка первого этапа и согласованная интеграция. Далее по плану: независимое устройство/ассеты, иконки и загрузчик, прямой ID→циклические ролики с управлением, все 12 переходов четырёх режимов. Нет заглушек, выдаваемых за эти готовые функции. Pending при недоступном renderer остаётся видимым; lastAckAt не является heartbeat.

Трафик SIM: RX не измерено; TX ≈1,106 МБ известных base64-ответов; всего не измерено; учёт: оценка части payload; основание: read-only SSH чтение 829803 байт исходников/manifest/PIN, увеличение base64 4/3, без точного WAN-счётчика и без накладных расходов SSH/TLS/реестра. Файлы на стенд не передавались, пакеты не скачивались; все тесты — localhost. Трафик других задач/подключений не списан повторно; остаток: неизвестен.
