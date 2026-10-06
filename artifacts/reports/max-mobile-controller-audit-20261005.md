# MAX mobile controller — аудит основы

05.10.2026. Read-only аудит локальных D/F исходников основным агентом и двумя независимыми субагентами: контракт/владение и транспорт/развёртывание. Код, F и живой стенд не изменялись; SSH, браузер и нагрузочные тесты не запускались. Предложение не считается работающей интеграцией.

## Подтверждённые точки интеграции

Корень актуального backend: `F:/project/VK_DigitalProducts_Stand/artifacts/canonical-max/`.

- `artifacts/max-game/src/application/mission-session.mjs`: snapshot, durable command receipts/replay, серверные hold/result/auto-переходы.
- `artifacts/service/max-game/http-api.mjs`: input-owner/contact API, SSE, managed-ограничения create/select/restart/reset/menu. Второй обычный клиент не является безопасным мобильным пультом.
- `artifacts/max-game/src/core/mission-core.mjs`: валидация действий и выбор перехода backend; телефон не получает право задавать outcome.
- `artifacts/max-game/src/contracts/mission-catalog.mjs`: координаты в исходном изображении.
- `presentation/src/application/server-session-port.mjs`: reconciliation pending-команд/восстановление; не создавать второй независимый input owner.
- `managed-host.mjs`: связь canonical с MASTER и действующим назначением.

Корень accepted presentation/gateway: `F:/project/VK_DigitalProducts_Stand/artifacts/production-source-max-show-20261005/`.

- `source/control/max-gateway.mjs`: mTLS роль MAX_RIGHT, authority/context, receipts и quarantine. Ролевой lease около 5 секунд отличается от input-owner lease 15 секунд.
- `source/control/max-adapter-v3/request-policy.mjs`, `local-server.mjs`: политики доверенного адаптера; не превращать в публичный общий proxy.
- `source/max-presentation/src/journey-guided-main.js:441`: локальные признаки readiness — startup/handoff, sceneVersion, media/GPU readiness, устройство/contentBusy. Требуется экспорт конкретного presentation epoch.

MASTER lifecycle: `F:/project/VK_DigitalProducts_Stand/artifacts/local-master/max_api.py` и `max_canonical_workflows.py`: presented ACK, cancel/release/FIFO. Текущий ACK различает `browserPrepared` и `physicalPresented`; это не новый per-screen mobile gate.

Последний прочитанный `F:/project/VK_DigitalProducts_Stand/artifacts/production-source-max-single-loop-20261005/README.md` описывает background-only и отключённый show overlay. Не восстанавливать старый игровой/видеопоказ побочным эффектом новой разработки.

## Найденные обязательные изменения

1. Единый broker ввода: второй ServerSessionPort конфликтует с текущим владельцем. Отдельный controller lease не заменяет роль MAX_RIGHT.
2. Per-screen readiness: committed backend screen может опережать видимую анимацию стены. Нельзя включать телефонные действия только по snapshot.
3. Pairing, публичная проекция и исходящий защищённый канал отсутствуют в подтверждённой текущей реализации.
4. Серверные автоматические переходы нужно согласовать с ready-gate мобильного режима; локальные таймеры телефона недопустимы.
5. Сохранить существующие commandId/receipt semantics и managed lifecycle, не добавлять телефонное меню сброса/создания сессий.

## Ограничения проверки

Проведён исходниковый аудит, не runtime-испытание. Текущая доступность VPS/стенда, TLS route `/max/game`, задержка, расход трафика и физическая синхронизация не проверялись. Версии Socket.IO/ограничения проверены по первичным источникам и реальному maintainer discussion; интеграционный тест ещё требуется.

Следующий проверяемый результат: изолированный срез одной ручной миссии от удержания до результата, с двумя конкурирующими телефонами и восстановлением после потерянного ACK. Браузерный прогон до отдельного прямого запроса запрещён.

[Архитектура и источники](../../docs/Research/max-mobile-controller-20261005.md).
