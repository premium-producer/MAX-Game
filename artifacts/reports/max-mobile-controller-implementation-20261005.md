# MAX mobile — реализация первого этапа

05.10.2026. Статус: локальный рабочий кандидат, не установлен на сервер/стенд.

Исходник: `artifacts/workspace/tasks/max-mobile-control-20261005/worktree/artifacts/max-mobile-control/`, отдельный sparse worktree/ветка `codex/max-mobile-control`. Root — сборка и интеграция; три субагента — broker/projection, relay/companion, phone UI. Независимые перекрёстные проверки: transport/broker authorization, wall readiness, pending ACK.

Реализованы QR claim/lease, одна canonical-сессия, Socket.IO 4.8.4, лёгкий телефонный UI с существующими ассетами и разметкой, hold, finish, reconnect/dedupe, readonly wall facade и патч v5 presenter. Скопированы только 14 исходных canonical-файлов/catalog с provenance SHA; живые данные не менялись. SQLite изолирована в candidate/data.

## Фактические проверки

- `node --test --test-isolation=none --test-timeout=10000 test/*.test.mjs`: **42 PASS, 0 FAIL**, около 3,1 с. Изоляция subprocess отключена из-за sandbox spawn EPERM; это Node-тесты, не браузер.
- Настоящие canonical/SQLite прохождения communication, digital-id, business основной ветки, blogger public/private.
- Полный сетевой путь HTTP cookie → Socket.IO → outbound companion → broker → canonical SQLite для communication и durable release.
- Потеря ACK claim/action/finish, повтор exact payload, чужой/второй телефон, неверный Origin, поддельная cookie, смена stand, stale screen, истечение wall readiness, удержание 800 мс и отмена.
- Модель мобильного UI: intrinsic hotspots, несколько кнопок, image readiness, запрет double tap/offline, сохранение pending.
- `check_project_duplicates.py`: PASS.
- `scripts/prepare-wall-patch.mjs` и esbuild: PASS, изолированный bundle 1 835 606 байт. Источники и bundle SHA в candidate-wall/*manifest.json. Сборка требует subprocess, выполнена с разрешённой эскалацией; браузер не запускался.
- HTTP smoke запущенного локального пилота: `/max/game/` 200 (2245 байт), WebGL app.js 200, QR SVG 200, snapshot 200, первый ассет communication 200 после SHA-проверки.

Найденные и исправленные в ходе интеграции расхождения: canonical числовой runId/null screenId; отсутствие assignment в обычных publish; потерянный claim ACK; stale broadcast при замене broker; повтор завершения после durable release; неопределённые ошибки backend в phone pending; владельческий конфликт; отсутствие wall liveness. Тестовый маршрут blogger исправлен с учётом легальных self-loop/back действий, не путём изменения игрового каталога.

## Границы приёмки

Сервер futuronika.pro, MASTER/F и MAX_RIGHT не менялись. Публичный QR ещё не работает с этим кандидатом. Браузерная/визуальная/физическая проверка не проводилась. Production binding/master FIFO и перенос актуальных AUDIO/background-only адаптаций остаются интеграционным этапом; запущенный loopback пилот их не подменяет.

Для медленного мобильного канала остаётся явный phone-media-ready gate серверного autoAdvance: сейчас ожидание собственного asset блокирует клики в phone UI, а automatic screens ждут только wall-ready. Не считать этот этап готовым production-прохождением на любых сетях. Перезапуск broker требует повторного QR; полная durable recovery зависит от production SessionPort.

[Инструкция и следующий этап](../workspace/tasks/max-mobile-control-20261005/worktree/artifacts/max-mobile-control/README.md). [Архитектура](../../docs/Research/max-mobile-controller-20261005.md).

Трафик SIM: RX не измерено; TX не измерено; всего не измерено; учёт: не измерено; основание: npm установил 53 пакета на рабочем ПК, cache 19,54 МБ не является сетевым замером, маршрут через SIM не подтверждён; локальные чтение D/F, сборки, тесты и loopback HTTP без SIM; 0 МБ передачи файлов на стенд; остаток: неизвестен. Исторические около150ГБ не принимаются за актуальный баланс.
