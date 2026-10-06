# MAX: остановка касаний после неправильного ответа — 06.10.2026

Стенд не изменялся и не перезапускался. Прочитаны свежие MAX_RIGHT/MASTER журналы, receiver/calibration/context и только одна текущая игровая запись через SQLite readOnly=true. БД не копировалась. Принятая версия R2 остаётся установленной; MASTER ready, logger healthy/writeErrors0. Standard/manual: autoplay=false revision7.

## Сопоставление событий

Время таблицы — московское, из MAX_RIGHT wall timestamp. Часы canonical receipt отличаются примерно на1,9с, поэтому серверные now не подменяют эти timestamps; цепочка экранов проверена по command/revision/receipts.

| Время | Координаты MAX_RIGHT | Экран / событие | Результат |
|---|---|---|---|
|18:21:14|Ладонь, реальный down|SCAN_PENDING→SCAN_CONFIRMED|Игра перешла к «Создать Цифровой ID»|
|18:21:21|3127,761|digital-id.create-id.start|ACT APPLIED → documents|
|18:21:55|2999,1021|digital-id.create-id.documents|ACT APPLIED → confirm|
|18:22:05.919–18:22:06.077|3145,1020 (mapped3145.13,1020.46)|confirm, «Подтвердите вход в MAX через Госуслуги»|ACT400 INCORRECT_ANSWER|
|18:22:11–18:25:33|Например3223,1112;3149,1099;2965,1046;3373,1008;3050,965|Тот же confirm|Касания доходили до DOM, новых игровых запросов нет|

После400 в прочитанном интервале:8 renderer-pointerdown,101 renderer-pointermove,9 pointerup,82 mapped events. Это зарегистрированные события с sampling, не полное число OSC updates. Native журнал подтверждает delivered; receiver bound9001/decodeErrors0, packetCount648. На чтении18:27:45 последний пакет был около129с назад; это соответствует завершению последних касаний, а не доказательству поломки приёмника. После ошибки рука считывалась ещё более3минут.

## Экран и зоны

Текущая запись: mission digital-id, task digital-id.create-id, screen digital-id.create-id.confirm, asset figma.296-14904 (807×1792), revision8, ownerActive=false. Последний успешный ACT — documents→confirm; отказ не создал receipt. Падениеlease/OWNER_CHANGED:false произошло позднее и согласуется с прекращением heartbeat при pending.

На confirm есть только два действия:

| Кнопка | Разметка в исходном изображении: x,y,w,h | Исход |
|---|---|---|
|Подтвердить|0.46,1384.18,805.41,175.53|navigate→digital-id.create-id.quick|
|Отклонить|0,1570.96,807,151.82|incorrect|

Из400 INCORRECT_ANSWER и действующего каталога следует, что был вызван action «Отклонить». Фактический actionId отказа в журнале не записан; это вывод по единственному incorrect outcome на подтверждённом экране. При500×500 минимуме соседние кнопки получают пересекающиеся зоны, direct DOM приоритетен, иначе выбирается ближайший центр. Точные DOMRects/selected action на момент касания отсутствуют: нельзя доказать, была ли рука на видимой кнопке «Отклонить» или её расширенной области, нельзя вычислить исторический wall rect из исходного asset rect без pose/scale. Старые inside=false/hitInside=false проверяют только ладонь после её исчезновения, не все игровые кнопки.

## Подтверждённая причина остановки

Canonical core возвращает rejected reply без commandId; application отдаёт его без изменения и сохраняет receipt только при ok=true. Managed ServerSessionPort требует совпадение reply.commandId, получает INVALID_COMMAND_RECEIPT и оставляет durable pending. Facade busy остаётся true; main.answer отбрасывает дальнейшие действия. Транспорт может оставаться connected, поэтому курсор и DOM events продолжают работать. Это соответствует400, последующим новым DOWN без команд и сохранённому confirm.

Независимый source audit и небраузерный воспроизводитель actual SessionPort подтвердили: firstError INVALID_COMMAND_RECEIPT, nextError PENDING_COMMAND, persistent pending=true, connected=true, commandRequests1. Исходники: max-immediate-tap-20261006/backend/mission-session.mjs (dispatch), canonical mission-core.mjs (reject), code/game/src/application/server-session-port.mjs (transmit), application/webgl-session.mjs (busy), journey-guided-main.js (answer guard). Результат/reproducer — artifacts/workspace/tasks/max-tap-incident-20261006/repro/.

Не доказано прямым renderer log: значение pending в момент отказа и экранные rects. Они выводятся из фактической ошибки, неизменной сессии и воспроизведённого accepted code. Дополнительный потенциальный latch-before-activation дефект не объявлен причиной этого случая: здесь были несколько новых DOWN, а permanent pending объясняет их блокировку.

## Следующая техническая правка

Согласовать rejected command settlement с durable contract, сохраняя command identity/точный исход/защиту потерянного ответа; ошибка ответа должна оставлять экран доступным для нового действия. Добавить диагностику general hit test: screen/task/revision, actionId, visible/hit rect/scale, координаты, direct/expanded selection, busy/pending и конкретную причину suppression, а также rejected receipt. Это план исправления, не установленная функция. Неподтверждённые pending и пользовательские данные не очищались. Браузер не использовался.

Сырые материалы: artifacts/workspace/tasks/max-tap-incident-20261006/{MAX_RIGHT,MASTER,session-record}.json. Для передачи публиковать этот отчёт, а не полный operational record.

Трафик SIM: RX не измерено; TX≥0,334471МБ логического payload известных ответов; всего ≥0,334471МБ; учёт: частичная оценка; основание:260324+33633+18241+22273bytes ответов журнала/сессии, плюс небольшие path/config ответы и команды не измерены; Base64/framing/registry/WAN не включены, это не операторский замер; остаток: неизвестен. Передача файлов на стенд0МБ, медиа/БД не скачивались целиком; localhost/локальный воспроизводитель SIM не расходуют. Прежние задачи не списаны повторно.
