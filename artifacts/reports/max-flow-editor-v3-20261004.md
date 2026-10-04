# MAX: редактор переходов v3 — 04.10.2026

## Выполнено и границы

FE-02/редакторская часть FE-03: несколько зон и внешних кнопок; independent enabled/target/delete, undo; один совместимый таймер (новый выключен, default500мс); тексты кнопок и справка экрана/задания/миссии. Annotorious3.9.3 управляет геометрией; Ajv8.20.0/Graphlib2.2.4 проверяют документ/маршруты; idb8.0.3 recovery; atomically2.1.1 сохраняет с fsync. Основание: [исследование](../../docs/Research/max-flow-editor-research-20261003.md).

Владелец root; UI — flow_editor_v3_ui; store/API — flow_v3_server (также независимый review UI); deployment — root с read-only flow_release_review. Worktree codex/max-flow-editor-v3, base505973ba9da8d9c2f57823e648a90b84cf79c14d; зависимости текущей незакоммиченной реализации перенесены по SHA baseline. 10 адресных файлов интегрированы обратно в D только после совпадения primarySHA с baseline; backup artifacts/workspace/backups/max-flow-editor-v3-20261004. [SHA исходников](max-flow-editor-v3-20261004/source-manifest.json).

F, игра v5, локальный мастер8770 и пользовательские конфиги не изменялись. Игровое исполнение новых смешанных переходов/таймеров, semantic adapter, immutable publication остаются FE-01/04/05. UI явно сообщает о черновике; отдельного игрового preview ещё нет. Приёмка пользователем открыта.

## Хранение

GET/POST /api/max-asset-flow: schema3 плюс revision. Пока нет flow-v3.json, чтение мигрирует текущий annotations.json в памяти, revision=legacy:SHA; GET не пишет. Первый успешный CASPOST создаёт отдельный flow-v3.json, annotations.json остаётся побайтно прежним. После этого legacyPOST возвращает409. Единая очередь защищает гонку legacy/v3; corruptfile/validation failclosed. Существующие исходные действия и флаги мигрируют, новые действия сохраняются с ID; удаление source action отмечается tombstone. Старые indexedDB не очищаются; восстановление явно подтверждается с предупреждением при несовпадении baseRevision. Review исправил также CSS hidden для удалённых полей.

## Проверка

- 55/55 asset-audit Node tests PASS (catalog/editor-model/schema/store/cloud/real HTTP flowserver); syntax4 модулей PASS; duplicate guard PASS.
- Изолированный fixture127.0.0.1:19439: копия реальных серверных73records/33screens. IAB: исходная зона + новая зона, новая внешняя кнопка, timer0.5s; targets соответственно2/3/4/1; drag новой зоны с581,595 на402,710 при226×99; next/back; отключение; редактирование справки; reload сохранил все данные. Удаление/undo восстановило дополнительную зону. Ошибок/предупреждений консоли нет. LegacySHA тесткопии неизменён. Тестовые действия на live не выполнялись.
- Scoped build90files/4missions/15tasks/84screens/103assets PASS; package203files,55508198bytes. Testdata/credentials/разметка в пакет не включены.
- Selectel release20261004T120000Z, previous20261003T234500Z; service active. [HTTPS](max-flow-editor-v3-20261004/https-verification.json): index/app.js/app.css/audit.css/catalog SHA5/5 совпадают; anonymous401; flow schema3,15tasks/84screens, legacy73records/33screens.
- До/после annotations SHA256: fdba1e2d7f5a3c82f51cbee1404e7cbd97939cb1fb6ce1cac71c21772ab24a86. Backup /srv/projects/futuronika/df/max-asset-audit/backups/20261004T120000Z/annotations.json имеет тот жеSHA. data/flow-v3.json после GET не появился. AuthfileSHA до/после совпадает, пароль прежний.
- Активация проверена sh-n и health обоихAPI. Rollback сначала останавливает процесс; если уже есть v3данные, старый legacyservice блокируется ConditionPathExists и disable, данные назад не откатываются.
- IAB liveURL заблокирован ERR_BLOCKED_BY_CLIENT; обход не выполнялся. Проверка видимого поведения liveFirefox остаётся пользователю; функциональная IAB проверка была на изолированной сборке, её статические байты совпадают сHTTPS.

## Проверка пользователем

1. Обновить https://futuronika.pro/df/max-asset-audit/editor/ и открыть экран крупно.
2. Добавить зону/кнопку/автопереход, назначить разные экраны, дождаться «Черновик сохранён на сервере».
3. Перезагрузить и проверить сохранённые поля. Действия пока не применяются автоматически в игру.
