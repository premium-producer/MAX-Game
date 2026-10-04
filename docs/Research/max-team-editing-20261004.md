# MAX — асинхронное редактирование командой

04.10.2026. Root и read-only team_edit_research. Выбор для текущей итерации: optimistic concurrency на уровне полей/взаимодействий, с готовым fast-json-patch3.1.1 (MIT). Существующий atomically2.1.1 сохраняет подтверждённый JSON, Annotorious3.9.3 управляет зонами. GETpolling примерно2с при видимой странице доставляет обновления; это не посимвольный co-editing и не offline-first CRDT.

## Основание и применение

- [RFC6902](https://www.rfc-editor.org/rfc/rfc6902.html): библиотека выполняет операции test/replace, прекращает неуспешное применение. [API](https://github.com/Starcounter-Jack/JSON-Patch#api): compare(base,draft,true), applyPatch(latest,patch,true,false,true). Передаём mutate=false и banPrototypeModifications=true; проверенный результат проходит прежний Ajv и atomicwrite. Сервер получает base/document, сам строит diff; произвольный patch с клиента не принимается.
- [Version3.1.1](https://github.com/Starcounter-Jack/JSON-Patch/releases/tag/3.1.1), [MIT](https://github.com/Starcounter-Jack/JSON-Patch/blob/3.1.1/LICENSE.txt). Версии ниже3.1.1 затронуты [prototypepollution advisory](https://github.com/advisories/GHSA-8gh8-hqwg-xf34). Установка exactpin/lock, npm audit0; движковые warnings существующих nanoevents/nanoid для Node25 учитываются отдельно, не скрываются.
- [Palindrom](https://github.com/Palindrom/Palindrom) использует JSONPatch для синхронизации JSON-моделей через HTTP/WebSocket. Это подтверждённый пример применения механизма, не готовая гарантия нашего адаптера.
- Пользовательский [issue321](https://github.com/Starcounter-Jack/JSON-Patch/issues/321) указывает на низкую активность сопровождения; [issue325](https://github.com/Starcounter-Jack/JSON-Patch/issues/325) сообщает об Date. Здесь используется только JSON после строгой схемы, без Date/custom prototypes. Нужны фактические server/browser проверки.

## Ограничения, определяющие адаптер

compare invertible не ставит test перед add. По RFC add может заменить существующий ключ. Поэтому временная ID-проекция содержит объединение ключей base/local/latest и реальные null slots для отсутствующих сущностей; библиотека сравнивает/проверяет их как существующие значения. Списки адресуются устойчивыми ID, не индексами. Одна зона/кнопка/таймер — атомарное значение: нельзя смешивать x одного автора и width другого, удаление и изменение должны конфликтовать. Неизменные identity/catalog поля не редактируются.

При конфликте сервер ничего не записывает. Клиент сохраняет свой черновик и общую версию, предлагает выбор; независимые правки сохраняются. Полный import/restore остаётся CASreplace, не выглядит как обычная правка. Undo применяет обратное изменение своей операции, а не старый снимок всего документа. Повтор после потерянного ответа: уже присутствующий желаемый результат считается подтверждённым; отличающийся latest конфликтует.

## Альтернатива

[Yjs](https://github.com/yjs/yjs), [Y.Map](https://docs.yjs.dev/api/shared-types/y.map), [y-websocket](https://docs.yjs.dev/ecosystem/connection-provider/y-websocket), MIT: готовые CRDT/sharedtypes/provider для live/offlinefirst. Потребуют другого persistence и правил смысловых конфликтов схемы. Для текущей задачи выбрана ограниченная асинхронная совместная работа с явным конфликтом объекта; буквенные правки одного текста автоматически не сливаются.

## Проверка реализации

Два клиента: разные экраны, разные действия одного экрана, изменения во время POST/poll, одна рамка, delete/edit, addcollision, потерянныйACK, restart, импорт/undo и локальный recovery. До deploy резервировать текущие dataJSON; package не включает разметки. Результат фиксируется отдельно в artifacts/reports/, без утверждения готовности до проверок.
