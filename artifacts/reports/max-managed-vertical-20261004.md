# WAVE-02/B — managed MAX v5: первый вертикальный кандидат

04.10.2026. Исполнитель B, интегратор root. **Изолированный кандидат D, не применён в F.** Настоящие canonical core и v5 renderer связаны без подмены мастера или создания второй очереди.

## Источники и границы

`artifacts/workspace/tests/parallel-wave2/max-candidate`:

- `artifacts/max-game/src` и `artifacts/service/max-game` — snapshot принятого F плюс WAVE-01/B. Перед копированием четыре SHA проверены по `parallel-wave1/max-tests/handoff.json`.
- `presentation/src` — копия текущего D MAX presentation; изменены только managed entry, ServerSessionPort, WebGL facade и v5 catalog entry.
- `catalog.json` — D reviewed content `missions-reviewed-20261003-abe878cfed89`: 4 миссии/15 заданий/70 экранов/75 действий. Предыдущие игровые записи не интерпретируются по новому каталогу: fixture использует отдельную БД.
- `public/max-game` — необходимые прежние runtime CSS/шрифты/иконки/ассеты и новый изолированный bundle. Все ассеты каталога сверены с SHA. Никаких секретов, данных посетителей и node_modules.
- `host.mjs` — отдельный loopback managed host, `driver.html` — явно обозначенный **технический драйвер назначений**, без квиза, FIFO и бизнес-оркестратора.

`max-candidate.baseline.json` закрепляет исходную копию. `build-manifest.json` фиксирует194 входа bundle и итоговый app SHA. Готовые визуальные модули D service/ribbon читаются сборщиком без изменения; часть зависимостей пока не скопирована в автономный source-пакет. Итоговый bundle/static работает самостоятельно, пересборка пока требует существующие D dependencies. Переносимое окружение — отдельная работа.

Сборка использует существующий esbuild0.28.2 и прежние Three0.185.1/maath0.10.8/idb8.0.3; notices сохранены. Node25.9.0/SQLite3.51.3. Новых пакетов, solver, scheduler и собственной игровой механики нет. Исследовательская основа — `docs/Research/max-local-master-mvp-20261004.md`, официальный Node HTTP/SQLite и сохранённые SessionPort/SQLite механизмы.

## Реальная совместимость каталога

Первая проверка выявила несовместимость F validator с происхождением новых Figma PNG. Дельта F против pinned v5 показала одинаковый `mission-core.mjs` и `mission-catalog.mjs`; отличие `task-catalog.mjs` — поддержка `origin.kind=figma-content-export` с nodeId, exportFolder и относительным безопасным sourcePath. Перенесена только эта существующая проверенная дельта; F reducer и мастерские lifecycle-изменения сохранены. Исходный `client-frame` по-прежнему допустим. Прямые/абсолютные/родительские пути проверены негативными тестами во вложенном coreCatalog.

## Managed contract

Экран получает `?backend=server&assignment=<id>&session=<id>`. Он проверяет assignmentId/sessionId/catalog revision и читает заранее назначенную сессию. Неизвестная сессия — ошибка, `POST /sessions` и локальный fallback запрещены. Серверные endpoints — прежний `/api/max-game/v1`, включая assignment lifecycle из WAVE-01/B.

Host слушает только127.0.0.1; проверяет точный Host и Origin. Player/control токены разные, создаются для этого запуска. `/fixture/player` и `/fixture/control` — same-origin loopback bootstrap только **технического fixture**, не production устройство/операторская авторизация. Контрольные commands не доступны по player token. В F вместо этих bootstrap нужны согласованные host credentials и lifecycle.

Видимый lifecycle учитывается отдельно от game revision. Терминальный assignment обновляет UI даже при неизменном canonical game snapshot: поле скрывается, ввод закрывается, показывается статус «Назначение cancelled…». Повторное назначение открывает новый точный session URL. Статус cancelled не добавлен в game reducer.

При startup, subscription reconnect и focus до первого контакта lease не приобретается, game timer остаётся paused. Первый контакт активирует прежний trusted owner/hold800мс. После reload прогресс сохраняется, игра остаётся paused до явного ввода. Возобновление ACT учитывает единственную ожидаемую OWNER_CHANGED revision; другие изменения контекста приводят к revision conflict, не к слепому переназначению команды. Самостоятельные menu/restart/reset/continuation в managed UI закрыты. Очередь и следующий выбор принадлежат мастеру.

Этот standalone fixture оставляет тёмную однотонную подложку. Общая rear-композиция, worker, Spout и TD не менялись; полноценный фон должен подключаться отдельно поверх общего домена.

## Проверки

`node --test --test-isolation=none artifacts/workspace/tests/parallel-wave2/max-tests/managed.test.mjs`: **5/5 PASS**, `max-tests/results.txt`.

1. Реальный reviewed catalog работает на F canonical core: bound start →120с без расхода бюджета → реальный contact/hold → ACT на настоящем экране → reload сохраняет screen и paused → следующий ACT возобновляет lease и меняет screen → cancel → новое assignment.
2. Missing session не создаётся; wrong assignment/catalog context не принимается; managed create запрещён.
3. Фактический HTTP Host/Origin и player/control separation; static HTML действительно v5 managed.
4. Figma provenance validator отвергает опасные исходные пути.
5. Terminal lifecycle обновляет facade при неизменном game revision.

Синтаксис host/client/entry и сборка PASS; duplicate guard PASS. Тесты создавали только новые изолированные SQLite/порты в собственном `max-tests`, HTTP после тестов закрыт. Проверка всех70 экранов и художественная приёмка этим срезом не заявляются.

Root выполняет отдельную короткую IAB-проверку на `http://127.0.0.1:62193/`. На момент подготовки отчёта root подтвердил назначение «Общение» и видимый настоящий v5. Browser API не предоставляет длительное удержание: по конкретному разрешению root для единственной указанной тестовой сессии выполнен реальный backend contact down→900мс→up→release; получен `communication.call.chat`, действие «Позвонить по видео». Это **backend-проверка удержания**, не аппаратный/браузерный hold. Видимые ACT/reload/cancel/следующее назначение root фиксирует отдельно.

При первом IAB ACT root получил `REVISION_CONFLICT`. Read-only сверка единственной browser-session показала: ACT не применён, последние receipts — только HOLD_CONFIRMED/OWNER_CHANGED. На момент первого открытия вкладки bundle ещё предшествовал исправлению CAS при возобновлении ownership; старый bundle — вероятная причина, но конкретный источник первого конфликта по исходному запросу браузера не доказан. После загрузки итоговой сборки проблема в проверяемом сценарии устранена. Отдельный HTTP regression дополнен реальным ACT после reload/owner=false: 5/5 PASS. Итоговый manifest повторно проверен: 383 файла, 0 SHA-расхождений.

**Итоговая короткая IAB-проверка root: PASS.** После reload: продолжить «Видеозвонок» → нажать «Позвонить по видео» → видна «Завершить звонок». Повторный reload → продолжить тот же «Видеозвонок» → снова видна «Завершить звонок», прогресс сохранён. Cancel в техническом драйвере → видимый `Назначение cancelled`, `released=true`. Новое назначение generation2 → начальная ладонь/удержание0.8с, без автоматического перехода. Подтверждение: `artifacts/reports/wave2-max-browser.png`. Физическое удержание, аппаратные датчики и художественная приёмка этим результатом не заявляются.

## Осталось

- Python CanonicalMaxPort v2, durable presented/ready/contact/result coordination и очередь мастера.
- Production auth/identity, восстановление host credentials; localhost fixture tokens после restart меняются.
- Правило timer handoff мастера/core, owner/reconnect и AV pause должны быть приняты общим контрактом. В этом срезе startup не расходует игровой бюджет, но полной production pause-семантики нет.
- Durable pending клиентских команд между полной перезагрузкой браузера — отдельный долг исходного ServerSessionPort; нельзя выдавать RAM pending за гарантированное восстановление потерянного ответа.
- Переносимое окружение/самостоятельная сборка, каталог/asset публикация и proof фактически загруженной версии.
- Общий rear/output/Spout, физические контакты/Hokuyo и калибровка. Checkpoint5с canonical game пока прежний.

F, пользовательские БД, живые MAX/Стелла D, hardware/TD/AI не менялись. Commit/push не выполнялись.
