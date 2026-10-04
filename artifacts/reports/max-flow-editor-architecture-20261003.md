# MAX flow editor — архитектурная сверка

03.10.2026. Только документационная задача. Root интеграция, flow_contract_audit read-only код/контракты, flow_ready_research готовые зависимости/источники.

## Подтверждённые ограничения

- artifacts/max-game/src/asset-audit/model.mjs:14–32 — один override на существующий screenId/actionId; свободный label подменяется исходным, новые IDs/targets не принимаются.
- vendor/backend-figma-v2/src/core/mission-core.mjs:71 — manual ACT запрещён при automaticMs. application/mission-session.mjs:37 скрывает действия, :72 выбирает для AUTO_SCREEN только actions[0].
- src/journey-shared-ui.mjs:7–15 уже умеет массив hotspots и below-screen кнопок, справка берётся из screen.instruction.
- screenEnteredAt устанавливается раньше видимого показа; presented ACK в contracts/mission-command.mjs отсутствует. 500мс может истечь до картинки.
- core/mission-core.mjs:73–88 — семантика шире navigate: answer, incorrect, choose-tool, complete/skip. Нельзя потерять при новой редактуре.
- apply-asset-annotations.mjs:25–28 переписывает final navigate/skip на complete; :33–45 обходит лишь однозначные disabled; :48–52 копирует nested channel graph.
- src/asset-audit/server-store.mjs — CAS и atomically fsync, schema2. Публикация редактора не меняет игровой каталог.
- docs/AGENT_MAX.md: canonical F содержит master adaptations, перенос только интегратором. Read-only агент подтвердил аналогичные auto/manual ограничения в F, assignment accepted не является renderer-ready.

## Сопоставление с запросом

В [предложении](../../docs/MAX_FLOW_EDITOR_ARCHITECTURE.md) есть: отдельные зоны/кнопки/timer, одновременное существование, разные target одного задания,0,5с default, добавить/удалить/disabled/undo, редактирование справки и label, совместимость v2, проверка графа, autosave draft отдельно от immutable gameplay release. Подготовлен порядок FE-01…05; единственный статус задач — docs/BACKLOG.md.

Не выполнялись: изменения кода/зависимостей/runtime, тесты исполнения, браузер, GPU, серверная публикация, изменение пользовательской разметки, запись в F. Архитектура не является реализованной функциональностью. XState/persistence/ready500мс и приёмка пользовательского UI остаются gates реализации; проверка ссылок документов выполняется отдельно.

Итог document review: учтены3существенных замечания независимого агента (renderer generation, version registry, effects/единственный target authority). Проверены 6 локальных ссылок новых документов.
