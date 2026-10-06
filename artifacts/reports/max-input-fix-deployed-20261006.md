# MAX: исправления QR и LiDAR установлены 06.10.2026

После уточнения пользователя «я про те правки которые ты сейчас внес» установлен только подготовленный MAX-PHONE-PAUSE-LIDAR-OWNER-20261006 на MAX_RIGHT: UUID `6a8a4e42-437b-4fd4-a363-d2fb155db83b`, DESKTOP-64J4BMN/10.0.0.13. Это игра правой стены; интерфейс и ПК STELLA не изменялись.

Время успешного применения13:53:10МСК. Root — ранее назначенный пользователем владелец MAX и его установки. Свежий Producer Kit registry/pinned OpenSSH, маршрут Selectel. Только два файла: `app/max-adapter/local-server.mjs`, `app/render/output-host.mjs`; ZIP14803байта, SHA256 `8de7aca7afa46520a647c2fc1b88dd73d86025ea7f7f988e2f6468787760efc0`.

## Что установлено

Мобильный QR входа и broker/input owner отключены единым флагом; обычное физическое управление не блокируется phone-профилем. Финальный QR не менялся. Полная составная идентичность native LiDAR owner переводится в64символа SHA256; fence и отмена старого контакта сохраняются.

Исходники, exact SHA, CAS plan, preflight, receipt и verification: `artifacts/workspace/tasks/max-lidar-attempt-20261006/deployment/`. Исторический candidate-manifest сохраняет прежнее состояние «не установлен» на момент подготовки; разрешение и факт применения находятся в новом apply-plan/apply-result/verify-result. Source SHA: local-server `aab1390b374100d37e2aa37043a1a592c6d725b5ce044ee3bd5bd12dff520771`, output-host `99ee4a23e3421c145880dee11f33c6984adb33c740f92c016d4386f7c24f92bc`.

## Применение и проверка

Свежие исходные SHA совпали, MAX/очередь/автомиссии/Стелла свободны. CAS boot/config/manifests и повторная проверка отсутствия назначения непосредственно перед owned stop. Создан точный резерв двух файлов и manifests; штатный launcher stop и Interactive scheduled start только MAX_RIGHT. Изменены root manifest и renderer component manifest. Firewall/MASTER/STELLA/F/TD, медиа, игровой bundle, PIN accepted-source, секреты, базы, разметки и калибровка не переносились.

Резерв: `C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT/data/max-input-fix-20261006-r1/backup-before`. Откат предусмотрен только для двух файлов и изменённых manifests; пользовательские данные не восстанавливаются поверх текущих.

PASS: installed SHA/root+component manifests; protected gamebundle/PIN/settings SHA; launcher check0; новый boot `0a4d7cd7-453e-4b3b-8c3a-546cae5b060a`, node8668, Electron14752 вSession1; HTTP200; phoneHTMLflag отсутствует, mobile projection/pairing/binding null; launchlogger healthy/writeErrors0. UDP9001 bound новымnode. Presentation assets/active с новым rendererBootId/ack; `assetsSettings` полностью совпали с preflight, settingsRevision32→32, staticWait120с, iconSize600px, cycleEnabledtrue.

19 CPU/HTTP-тестов кандидата PASS ранее; source не изменялся после проверки. Duplicates и PowerShell parser PASS. Независимый review обнаружил до применения ошибочное использование live launchercheck в stoppedphase; исправлено на отдельную проверку послеstart. Также receipt пишется после start-request и при rollback имеетappliedfalse. Фактическое применение успешно, rollback не понадобился.

## Граница результата

Браузер не запускался. Физическое прохождение, native click/hold и Spout/TD не проверены этой установкой. Сохранённый LiDAR enabledfalse и режим assets оставлены как у оператора; для игры касаниями выбрать стандартный режим и включить курсор в MASTER → «MAX · LiDAR». Калибровка сохранена; повторять её установка не требует. Новая установка не является подтверждением физической приёмки.

F не обновлялся. Следующая сборка интегратора должна сохранить эту двухфайловую дельту поверх принятого Layers/boot-shell/LiDAR комплекта, сверив актуальные SHA. [Предыдущая диагностика](max-lidar-attempt-20261006.md), [эксплуатация](../../apps/stand-service/docs/MAX_LIDAR.md).

Трафик задачи описан в WORKLOG и `deployment/traffic-estimate.json`; размеры payload/ответов — оценка, не операторский счётчик.
