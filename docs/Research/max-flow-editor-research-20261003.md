# MAX: готовые механизмы редактора переходов

03.10.2026. Исследование для [архитектуры](../MAX_FLOW_EDITOR_ARCHITECTURE.md). Root и flow_ready_research сверили официальные источники и реальные issues; flow_contract_audit отдельно проверил существующий backend. Установка пакетов и исполняемый прототип этой задачей не выполнялись.

## Выбор

| Компонент | Версия / лицензия | Применение и подтверждение |
| --- | --- | --- |
| Annotorious | установленная3.9.3 / BSD-3-Clause | Несколько аннотаций, add/update/remove/filter; [API](https://annotorious.dev/api-reference/image-annotator/), [events](https://annotorious.dev/api-reference/events/), [лицензия](https://github.com/annotorious/annotorious/blob/main/LICENSE). Реально выполняет геометрическое редактирование, сохраняем существующий pin |
| XState | кандидат5.20.2 / MIT | Pure transition вычисляет snapshot и список действий без выполнения side effects: [versioned source](https://raw.githubusercontent.com/statelyai/xstate/xstate@5.20.2/packages/core/src/transition.ts), [релиз](https://github.com/statelyai/xstate/releases/tag/xstate@5.20.2), [лицензия](https://raw.githubusercontent.com/statelyai/xstate/xstate@5.20.2/LICENSE). Выбирает разрешённую ветвь внутри backend transaction |
| Ajv | кандидат8.17.1 / MIT | [Versioned package](https://raw.githubusercontent.com/ajv-validator/ajv/v8.17.1/package.json), [strict mode](https://ajv.js.org/strict-mode), [schema](https://ajv.js.org/json-schema). Доверенная фиксированная JSON Schema draft-07 проверяет пользовательские данные, не исполняет их как схему |
| @dagrejs/graphlib | кандидат2.2.4 / MIT | [Versioned package](https://raw.githubusercontent.com/dagrejs/graphlib/v2.2.4/package.json), [API](https://github.com/dagrejs/graphlib/wiki/API-Reference). Directed multigraph, dijkstra/tarjan для достижимости и циклов; не пишем новые обходы. Требует Node>17 |
| atomically / idb | установленные2.1.1 /8.0.3, MIT / ISC | Существующий серверный durable JSON и аварийный черновик сохраняются; новое хранилище или multiwriter JSON не вводится. Pins/license сверяются с package-lock при реализации |

Кандидаты указаны как конкретная исследованная база, не как «последние версии». Перед установкой — проверка их совместимости и фиксация lockfile; не брать prerelease автоматически. Текущие страницы Stately могут включать v6 alpha; для v5 опираться на versioned API.

## Реальный опыт и ограничения

- [Annotorious issue605](https://github.com/annotorious/annotorious/issues/605): описано снятие selection и лишние lifecycle-события при bulk replace. Issue закрыт, но это не доказывает такое поведение установленного3.9.3. Решение для интеграции: адресные изменения по ID, setAnnotations при открытии, отдельный явный autosave модели. Проверка drag→save→reload и переключения выбранных зон обязательна.
- [XState issue5331](https://github.com/statelyai/xstate/issues/5331): пользовательский отчёт о потере after-delay после восстановления snapshot; это upstream-сообщение, не наш воспроизведённый тест. Поэтому архитектура не обещает durable after. Pure evaluator выбирает переход, существующий доверенный host-time тракт доставляет AUTO_SCREEN. CAS остаётся в MAX, нового независимого actor-authority нет.
- [Документация delayed transitions](https://stately.ai/docs/delayed-transitions) полезна для жизненного цикла задержки, но не доказывает совместимость persistent after с нашим replay. [MDN visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) описывает ограничения фоновых таймеров; время игры не определяется числом frontend callbacks.
- [Ajv security](https://github.com/ajv-validator/ajv/blob/master/docs/security.md): неограниченные структуры и дорогая валидация несут ресурсный риск. Сохраняем действующий лимит HTTP JSON1MiB, задаём явные пределы массивов/текстов до реализации, запрещаем пользовательские схемы/$ref-сеть. Структурная проверка не доказывает достижимость финала.
- Graphlib проверяет графовые свойства, но не знает семантику incorrect/choose-tool/answer MAX. Политика и compiler adapter остаются предметным кодом и требуют интеграционных проверок.

## Отвергнутые варианты

ReactFlow не нужен для первого списка зон/кнопок: он добавил бы framework/UI-перенос без решения исполнения. Граф можно позднее отображать только для обзора. Новый handwritten reducer для маршрутов не предлагается. XState actor рядом с существующим авторитетным MissionSessionApplication создавал бы два владельца состояния; выбран pure transition внутри общей транзакции. Обычный frontend setTimeout с прямым nextScreen нарушал бы commit/receipts/owner.

## Что ещё нужно доказать

До полноценного UI — малый интеграционный срез XState5+MAX: сериализуемое состояние, детерминированный replay, semantic effects, CAS click/auto, A→B→A, pause/restore и presented readiness. Только после этого выбор зависимости считается проверенным для данной игры. Существующая проверка unit-тестами самописного адаптера не заменяет работающий library-integration и браузерный сценарий. [Статический аудит](../../artifacts/reports/max-flow-editor-architecture-20261003.md) отдельно фиксирует нынешний код.


## 04.10.2026 — проверенные pins первого среза

Установлены XState5.20.2, Graphlib2.2.4 и Ajv8.20.0 (MIT). Кандидат Ajv8.17.1 заменён: npm audit сообщил GHSA-2g4f-4pwh-qvx6; текущий audit0. [Официальный релиз Ajv8.20.0](https://github.com/ajv-validator/ajv/releases/tag/v8.20.0). [Интеграционный отчёт](../../artifacts/reports/max-flow-fe01-foundation-20261004.md): schema/migration и pure XState внутри существующего CAS/replay проверены; mixed timer/presentation и браузер ещё не доказаны.

## 04.10.2026 — узкая совместимость принятого экспорта

Фактический файл содержит только исходные ручные действия на активных экранах. Поэтому новый маршрутизатор не требуется: переиспользован существующий backend и компилятор отключённых экранов; несовместимые v3 функции отклоняются. Сверены [Ajv guide](https://ajv.js.org/guide/getting-started.html) и [Graphlib API](https://github.com/dagrejs/graphlib/wiki/API-Reference); установленные MIT pins8.20.0/2.2.4 выполняют schema/graph проверки, не служат декоративной зависимостью. Ограничения и реальный опыт timer/replay выше сохраняются, активные таймеры не включались. [Фактическая проверка](../../artifacts/reports/max-flow-apply-20261004.md).
