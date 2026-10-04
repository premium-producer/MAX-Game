# MAX — проверка явного импорта и комплекта backend

02.10.2026. Backend-части этапов 11–12; существующие страницы/мастер не переключались.

## Изменения

- `src/migration/explicit-import.mjs`: выбранный JSON-экспорт, проверка semantic receipts, совместимых версий, замена sessionId через реальные команды ядра. Неподтверждённые старые stages/answers/completed полностью архивируются; безопасный новый state не получает ответов/зачёта/сканирования.
- `src/migration/mission-import-codec.mjs`: адаптер проверки и повторного применения подтверждённой истории всех шести миссий. Восстановление использует recorded now/internal, не анимационные фазы.
- `applyExplicitImport`: повторная проверка артефакта, обязательный долговременный ArchivePort.saveOnce перед create-only PersistencePort. Ошибка архива не создаёт сессию; ошибка после архива допускает повтор. Другой существующий профиль не перезаписывается. Активация требует атомарный `createImported` (session + import claim); повтор подтверждается через `getImportTarget`, а не совпадением record/существованием архива. Две попытки с чужим fresh target обе получают конфликт.
- `src/development/shared-fixtures.mjs`: синтетические public/private сценарии и все шесть миссий до/после сканирования. Нет чтения/изменения пользовательских профилей и отдельного UI-стенда.
- Guards проверяют запрещённые imports/browser/storage/clock чистых слоёв и обход SessionPort новыми адаптерами. Исторические renderer в этот gate не включены.
- `scripts/build-shared-backend.mjs`: общий ESM/manifest, проверка ресурсов SHA-256, смысловых ссылок и дубликатов версий. В manifest хешируются инструкции вместе с каталогом, а не только картинки. Общие пакеты включены в штатный `build.mjs` без изменения entrypoints renderer.

## Проверка

PASS `node --test --test-isolation=none artifacts/max-game/test/shared-migration-bundle.test.mjs`: 14/14, около 0,18 секунды. Проверены:

- архив недоказанного прогресса и сохранение исходника;
- current public-link и выполненные public/private, подтверждённые receipts после смены sessionId;
- tampered/incompatible exports, ошибочный JSON, явность выбора профиля;
- детерминированность/immutability импорта, отсутствие переноса неизвестных координат;
- archive-first, повтор create-only, занятый target, восстановление после ошибки записи;
- реальные fixtures всех шести миссий и safe-menu импорт;
- нарушения архитектурных границ на отдельных отрицательных fixtures;
- manifest всех шести миссий/веток, оригинальные ресурсы и оба assetBase.

PASS `node --check` изменённых модулей и сборщиков. PASS duplicate guard. PASS shared-boundaries: на момент проверки 16 модулей, 0 нарушений.

Дополнительная проверка SQLite-агентом после аудита принадлежности target: `createImported` записывает session и import claim одной транзакцией. Подтверждённый импорт переживает worker restart и возвращает duplicate; чужой идентичный fresh target отвергается при двух попытках и после перезапуска. Эти интеграционные сценарии входят в `artifacts/service/max-game/sqlite-persistence.test.mjs`.

PASS standalone-комплект `artifacts/workspace/dist/max-shared-backend`: 136 файлов на момент проверки, 6 миссий, 18 task/version descriptors (включая первоначальный канал с отдельной contentRevision), 130 asset IDs. Число asset IDs не равно числу уникальных изображений: общие оригиналы переиспользуются. Штатный runtime build выполняет координатор после согласования остальных backend-модулей.

## Границы

Старые Site/Legacy profiles не имеют утверждённой доказуемой таблицы соответствия полной истории новым правилам: их результат сохраняется в архиве, не объявляется новым completion. Перенос координат отключён до известного соответствия layoutVersion/nodeId/единиц. Это безопасный импорт, а не обещание точной миграции каждого исторического stage.

Публичного HTTP-маршрута импорта нет: хост явно предоставляет источник, PersistencePort и долговременный ArchivePort. Новые renderer и их переключение не реализованы этой работой. Статический guard не заменяет общий анализ JavaScript/динамических зависимостей. Браузер, GPU, мастер и публикация не запускались.

[Контракт развития и запуска](../../apps/max-game/docs/SHARED_EXTENSION_GUIDE.md).
