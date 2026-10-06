# MAX-STAGE-WATCHDOG-01 — установлен 05.10.2026

MASTER DESKTOP-27LJLV6 / UUID066c1c43-8266-4a86-885e-4d2855d91546. Подтверждён дефект: launch достигал capped timing, затем recv3600 повторял ожидание без дедлайна. Отдельный max_stage_watchdog_v1 использует существующий DBOS3.2.0, не добавляет durable шагов в старый max_assignment_v4.

## Что работает

Для schema4 launch/tags/ribbon/wall: длительность этапа +30секунд запаса; для delivery/presented:30секунд. Настройки MASTER/config/max-stage-watchdog.json, целые1000..600000мс. Это консервативные эксплуатационные defaults, не измеренный SLA. Изменение JSON действует со следующего этапа; некорректный liveJSON оставляет последние рабочие параметры и диагностику. Текущий бюджет сохраняется.

На просрочке выполняется обычный cancel с проверкой dataset/assignment/plan/phase/session/поколения/revision. Паузы и время выключенного процесса не расходуют бюджет. История не удаляется; stageWatchdog/failure содержат причину. Никаких синтетических marker/presented/finish. Подтверждённый incomplete игры теперь приводит к cancelled, completed квиза остаётся фактом передачи управления, а не успехом игры. Станция освобождается после штатной подтверждённой очистки.

## Проверено

- 16 тестов на DBOS3.2.0/SQLite: просрочка, поздний marker, пауза, boot/dataset/plan/session/generation, повтор той же команды, отсутствие ложного успеха, show/legacy исключения, JSON recovery.
- Два реальных subprocess hard-kill/restart: во время дедлайна и во время releasing при canonicalHTTP503. После восстановления cancelled/stationfree, canonical cancel идентичен, completion markers отсутствуют.
- Настоящий сервер/API на изолированных данных: healthready, свободная станция, единственный supervisorPENDING. Первые попытки smoke не запускались из-за неполного тестового копирования static/vendor; исправлен тестовый комплект, финальная проверкаPASS.
- Независимый review. Duplicate guardPASS. MASTER: свежий CAS, резерв, пять точечных файлов, обновлённые manifests, штатный запуск. После установки healthready=true, stationgeneration62/sessionnull, queue0, hashesPASS.
- Read-only SQLite подтверждает живой supervisor: PENDING и durable steps304→312 за2секунды. Диагностический PSwrapper сначала вернул ошибку упаковки объекта, повторное чтение исправлено без повторного применения сборки.

Резерв: C:/VKStand/releases/stand-base-20261005-r1/MASTER/config/max-stage-watchdog-before-20261005. Живые visitor/session/queue данные не заменялись. Полный rolloutZIP не отправлялся. Стелла/MAX_RIGHT/ARCH/VK не перезапускались. MAX_RIGHT остаётся «только фон». Браузерных проверок нет; физическую приёмку проводит пользователь.

## Принятие Стеллы

Уже установленная другим владельцем STELLA-FAILURE-RECOVERY-01 принята в F/artifacts/production-source-stella-failure-recovery-20261005. Сверены223 исходника и точные5 runtimeфайлов, buildSHAe7d96635a61ab18d44cf15edc199ef176f2a06df81c89d8d4bb95e913bc200b2. Сохранены launchdiagnostics/client/helper. UI возвращает Home только по cancelled/expired и подтверждённому stationfree. Повторного deploy нет.

## Открытые границы

Это защита конкретного зависания здорового assignmentworkflow, не всех возможных отказов. MAX show, schema1–3, playing/очередь не изменены. Если DBOSвладелец погиб/ERROR/отсутствует — WATCHDOG_ASSIGNMENT_OWNER_UNAVAILABLE; автоматический захват и восстановление владельца ещё не реализованы. При недоступном canonicalcleanup состояние releasing сохраняется, свободная станция не имитируется. Бесконечная история supervisor требует дальнейшей ротации/retention. Не запускать второй конкурирующий watcher и не удалять историю вручную.

Доказательства: D/artifacts/workspace/tasks/max-stage-watchdog-20261005; принятый инкремент F/artifacts/production-source-max-stage-watchdog-20261005. Основание выбора готового механизма: docs/Research/stella-failure-recovery-20261005.md; официальные DBOS workflowcommunication/upgradingworkflows, лицензияMIT. Сетевой трафик учтён один раз в D/WORKLOG; старый deployСтеллы повторно не списан.
