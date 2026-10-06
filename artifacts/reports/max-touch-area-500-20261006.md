# MAX: зоны500×500 установлены на MAX_RIGHT

06.10.2026 в17:29:20 UTC+3 установлен MAX-TOUCH-AREA-500-20261006. Fresh ProducerKit Selectel/pinned UUID6a8a4e42-437b-4fd4-a363-d2fb155db83b/hostDESKTOP-64J4BMN. MAX был idle, MASTER MAX queue/show guard свободен; финальный native idle guard перед остановкой. F/MASTER/TD не менялись.

## Реализация

Минимальная невидимая область ладони, игровых иконок и кнопок/hotspots —500×500 logicalwall px вокруг текущего центра. Больший control не уменьшается. Точное DOM попадание имеет приоритет над расширенным соседним; в пересечении выбирается ближайший центр. Видимые размеры, оптика, layout и анимации не менялись. Phone drag handle отдельно не расширяется; device drag работает штатно. Managed navigation/game tokens/controller owner и inputActive gates сохранены.

Удержание использует ту же область в down/move/up; move без down не превращён в нажатие. Захват иконки хранит прежнюю видимую позу и actual delta курсора, без скачка к точке расширенного попадания. Второй pointer не перехватывает жест, drag/отмена/смена экрана/disabled/inert блокируют pending click. Для кнопок движение больше7 logicalpx отменяет click. Сам autoplay не менялся: перед ручной проверкой выключить его отдельно.

Logging сохраняет прежний inside/rect как видимую ладонь, добавлены hitInside/hitLeft/Top/Width/Height для расширенной зоны. Лимиты/loopback/safe whitelist/fetch Promise и Response identity сохранены. Видимой отладки на production не добавлено.

## Проверка

20/20:13actual Three.Box2/NodeVM handler checks и7NodeVM/realHTTP/electron-log checks. Минимум/границы/scale/overlap/exactpriority/disabled/inert/fade; actual palm down/move/up, второй pointer, expanded button/cancel/disconnected, capture pose+delta, диагностическая expanded250CSS зона при scale.5. Первое падение теста кнопки было неполной classList заглушкой, исправлена fixture, затем20PASS. Syntax/duplicateguard/accepted donor pin+input checks/build PASS. Browser/headless/GPU не использованы; физическая ручная приёмка и полный ход миссий OPEN.

Исходники: `artifacts/workspace/tasks/max-touch-area-20261006/code/game/`, helper+modified guided-main. Source/фактические SHA всех buildinputs — delivery/build manifest; не запускать общий canonical builder для этого stand overlay. Принятая основа — selected-autoplay20261006, donor appSHA6fb8600… сверён с живой игрой до применения, текущая диагностика сохранена.

Пять runtime файлов: app/max-ui/max-game/webgl-v5/app.js; app/max-adapter/accepted-source.json; app/max-adapter/touch-area-build.json; app/launch-diagnostics/http.mjs; app/launch-diagnostics/launch-logger.mjs. AppSHA8e216c251f04617c6133bb416be881e8a5f1368abae3bfd7966bc68c29cb425b. Архив533660байт/SHA26a47a8b309f0c2350740087fc0978ca9ef9a5ccaff8d6707df4d4498d596c19; полная SFTPпоставка546738байт. Owned stop/task restart Node6220→11916, Electron13864 Session1, новый boot07f6a150-e616-41f0-891f-8a3cc40d0c4f. Installed5SHA/root+component manifests/launcher check0/UDP9001/healthy logger writeErrors0 PASS. Settings и config сохранены SHA; mode/autoplay/user media/annotation/calibration не заменены.

Резерв: `C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT/data/max-touch-area-500-20261006-r1/backup-before`. Receipts: `artifacts/workspace/tasks/max-touch-area-20261006/deployment/MAX_RIGHT/{preflight,apply-plan,global-idle-guard,stage-result,apply-result,verify-result}.json`. Локальный candidate manifest исторически сохраняет LOCAL_CANDIDATE_NOT_INSTALLED; факт применения — apply/verify receipts, не переписанный план.

Трафик SIM: RX≈0,546738МБ файлов; TX не измерено; всего ≥0,546738МБ учтённого payload; учёт: частичная оценка; основание: точечныйzip+plan+installer одномуMAX_RIGHT черезSelectel, источники/SSHответы/реестр/framing/WAN не измерены; остаток: неизвестен. Локальные кэш/сборка/tests не списаны, старые передачи не учитывались повторно.
