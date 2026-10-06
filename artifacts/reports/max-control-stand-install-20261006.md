# MAX: пульт и независимое устройство установлены на стенде

Применение владельцем этой задачи по прямому запросу пользователя, 06.10.2026, 04:44–04:46 МСК. Штатный Producer Kit, свежий реестр группы VK_DigitalProducts, Selectel, закреплённые host keys.

| ПК | UUID | Изменено |
|---|---|---|
| MASTER / DESKTOP-27LJLV6 | 066c1c43-8266-4a86-885e-4d2855d91546 | 24 файла backend/control, каталог, размер иконок |
| MAX_RIGHT / DESKTOP-64J4BMN | 6a8a4e42-437b-4fd4-a363-d2fb155db83b | 9 файлов: renderer/адаптер, 3 пользовательских ассета, PIN |

Release root: C:/VKStand/releases/stand-base-20261005-r1/{роль}. Source/runtime candidate и точные SHA: artifacts/workspace/tasks/max-control-panel-20261006/stand-deploy/{роль}/overlay.json в D. Основной bundle3ef1f9ad77ae6ce0fd9aff2bb3515c7ea8923a303a4edcc340af283094627e7b,1881099байт. Source candidate code/game, code/master, code/master-control; F не переписывался, принятие исходников в F остаётся интегратору. Не собирать поверх стенда старый F baseline без этого delta.

Сохранена уже установленная новая логика quizAnswerRevealGroupMs: merged max_canonical_workflows.py0d9d218dde7cdb92bae958dcb979cfb529a929dc802e4380cdde4626a1eef417,8/8 дополнительных тестов. Во время staging другая задача обновила8 файлов master-audio. Начальное применение остановилось на preflight: ни один живой файл не был заменён. Повторное чтение подтвердило отсутствие изменений в наших файлах; baseline корневого manifest обновлён только для MASTER, аудио сохранено. Повторно передано только78КБ MASTER ZIP; MAX ZIP не повторялся.

Перед остановкой: MAX active=false, MASTER current=null/queueCount0, show disabled/no session/run, Стелла sessionId=null. Использованы штатный launcher stop и точные scheduled tasks Start-MASTER/Start-MAX_RIGHT. TouchDesigner/маппинг и другие ПК не трогались. Backup исходников/manifest на обоих ПК: config/max-control-panel-before-20261006. Отдельный остановленный backup4 SQLite MASTER: config/max-control-data-before-20261006,792199168байт локального копирования. Базы и разметки не заменялись данными разработки. При откате сначала код/manifest; DB backup нельзя возвращать поверх новых пользовательских записей.

Проверка после запуска: launcher check=0 оба ПК, все33 SHA совпали с файлами и root manifest; backend ready, каталог72/19; пульт HTTP200 на MASTER localhost9571, поле iconSizePx64–1024/default256 присутствует в UI/OpenAPI. MAX wrapper HTTP200, свежий renderer ACK: standard/active. Лог Spout сообщает sending4096×1282; это не художественная проверка LED/TD. Браузерные проверки/скриншоты/прохождение миссии не проводились по запрету пользователя.

Текущая сцена локального пульта сохранена штатным операторским CAS на стенде, без включения режима: device.custom.tv-first-30s, устройство/иконки видимы, iconSizePx512, два icon.custom.max-gosuslugi слева/справа. Видео muted loop, смена ассета на видео начинает его с нуля. Сохранён стандартный режим. Для показа этой сцены оператор выбирает «Независимые ассеты» в пульте. Аппаратное отображение именно этой сцены в ходе установки не проверялось.

Архивы: MASTER77827байт SHA19b5ec6311c779aa1649a9507fcdf66ef7281dd4bc2a2eefec39c8447239a193; MAX22242301байт SHA3f7ca021caee84712c7443c2ca7b27e94648f6cf5c0fbc16ed9515bcb8ecc7a7. Фактические receipts: stand-deploy/{MASTER,MAX_RIGHT}/{stage,stop,apply,start,verify}-result.json, MASTER/rebase-result.json и configure-result.json. Frozenstage1/2 архивы сохранены как исторические кандидаты.

Трафик SIM: RX≈22.5МБ; TX≈6.0МБ; всего≈28.5МБ; учёт: оценка; основание:22408594байта ZIP/скриптов к ПК (включая один повтор маленького MASTER ZIP),3249149байт полученных baseline-файлов с двойным base64≈5.78МБ и небольшие SSH/JSON-команды/ответы. Маршрут внешний Selectel; нет WAN-счётчика, SSH/TCP/retry overhead и параллельные задачи полностью не измерены. DB backup и локальные сборки SIM не расходуют; остаток: неизвестен из-за прежних пробелов учёта. От пользовательской точки≈150ГБ эта задача отдельно уменьшает расчёт на≈0.0285ГБ; это не новый достоверный баланс. Подзадачи учтены здесь один раз.
