# MAX FE-01 — первый технический срез

04.10.2026. Статус: foundation PASS, FE-01 целиком остаётся открытым. [Архитектура](../../docs/MAX_FLOW_EDITOR_ARCHITECTURE.md), [исследование](../../docs/Research/max-flow-editor-research-20261003.md).

## Реализовано

- `artifacts/max-game/src/asset-audit/flow-document.mjs`: строгая схема v3 (Ajv), миграция v1/v2, независимые interactions, прямоугольники/кнопки/таймер, наследуемая справка, tombstones. Draft допускает незавершённый маршрут; publish проверяет назначения, достижимость выхода, неоднозначные пересечения и автоматические циклы через Graphlib. Значение нового таймера по умолчанию экспортируется как 500мс; живой таймер ещё не подключён.
- `src/core/flow-router.mjs`: XState5 pure transition реально выбирает маршрут без actor/start/таймеров или внешних эффектов. Независимые назначения типов hotspot/button/timer проверены на небольшом v3 fixture; это не проверка часов игры.
- Опциональный `routingProfile` проходит через source MissionSessionApplication → create/dispatch/replay/recovery/reset. Профиль допускает только явно выбранные ручные задания с простыми navigate/complete-task. Nested coreCatalog, автоматические экраны и смысловые эффекты отвергаются при построении профиля. Остальные задания используют прежние правила.
- Идентичность профиля: Web Crypto SHA-256 от engine/adapter/rules/contentRevision/sorted task data включён в rulesRevision. Создание профиля асинхронное. Старые сохранения не мигрируют автоматически в новый режим.
- Pins: XState5.20.2, Ajv8.20.0, Graphlib2.2.4; lockfile обновлён. Ajv8.17.1 отклонён после npm audit; установленная версия даёт 0 advisories на момент проверки.

## Проверка

53 CPU tests PASS: `asset-audit-flow-document`, `asset-audit-model`, `flow-routing-integration`, `shared-mission-logic`. `node --check` шести изменённых/новых JS PASS. Duplicate guard PASS.

Миграция реального исходного экспорта: 73 записи, 33 настройки, 84 экрана, 15 заданий; геометрия/флаги/ассеты сохранены, входной объект не изменяется. Экспорт на диске и сервер не перезаписаны.

Через настоящий source SessionApplication пройдено исходное задание `digital-id.hotel` (fixture меняет только начальную последовательность миссии, сохраняя реальные экраны/действия/ассеты). Проверены завершение, две команды на одной ревизии, duplicate receipt, close/recreate/replay, отзыв владельца при восстановлении, отказ чужому профилю с той же пользовательской rulesRevision, STORE_CONFLICT/storage failure без публикации speculative state/effects. Старые шесть миссий и public/private semantics проверены существующими regression tests.

Независимый review: flow_v3_schema владел только schema/tests; flow_contract_audit проверил integration; flow_ready_research проверил schema. Найдены и исправлены: подмена назначения внутренним `__flow_exit__` и отсутствие сохранённой привязки к exact allowlist/graph. На оба дефекта добавлены регрессии.

## Границы и следующий срез

Это проверка исходного Application, **не поставленная версия игры**. v5 импортирует pinned `vendor/backend-figma-v2`; vendor, runtime, серверный editor, актуальная разметка и мастер F не обновлялись. UI/браузерная проверка нового поведения не выполнялась: интерфейс ещё не подключён. Сборка и HTTP parity не заявляются.

Остаются: v3 compiler с проверенными semantic adapters, поддержка нескольких UI действий и live save, presented-generation/clock с гонками click/timer и повторным входом A→B→A, immutable publication registry и пользовательская приёмка. До них смешанные таймеры нельзя включать в production; FE-01 не считать закрытым, FE-02…05 открыты.
