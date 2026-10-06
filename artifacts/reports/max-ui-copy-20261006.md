# MAX UI: технически готово, локальный preview

06.10.2026, MAX-UI-COPY-20261006-R1. [Передача](../workspace/tasks/max-ui-copy-20261006/HANDOFF.md), [исследование](../../docs/Research/max-ui-copy-20261006.md), [исходники и SHA](../workspace/tasks/max-ui-copy-20261006/release.json). Запрос: «Цифровой ID» не разрывать, будущую иконку убрать, title-only справку скрыть, «видео-сообщение» не обрезать.

| Проверяемая область | Результат |
| --- | --- |
| Неизменённый клиентский baseline | Все209inputs подтверждены; esbuild воспроизвёл исходный appSHA07b84f08679a42111782e4a6fd4a127bb4fa5c2aef686454b5b4f28ffb5db6a2 |
| Новое клиентское приложение | 2051685байт; SHAace063dab2c0e168778a95ee09634285b03bece54b2c94008b59a2f549883c5c |
| Новый managed stand UI | 1922437байт; SHAc5e0cdbac632519c5f71454a6d2edfd26baaada5575299dbb0db6be0837256a0 |
| CPU UI/markup/lifecycle | 16PASS; оба профиля, все4миссии, retained text→empty→text, late next admission, completed node, pause/reduced/restart, escaped strings и action disabled/token/rect |
| Прежний handoff | 4PASS:30/60/120Hz и restart каждого этапа |
| Синтаксис/дубликаты/сборки | 12модулей и duplicate guard PASS; обе esbuild сборки PASS |
| Источники/данные | Client188/stand203 неизменённых файлов клона совпали с baseline; catalogue/flow/corrections/SessionPort SHA сохранены |
| Независимый аудит | PASS после исправления retention/cache старой справки; отчёты audit/client-source.md и implementation-review.md |
| Local delivery | HTML200; HTTP appSHA совпадает с новым client candidate;127.0.0.1:19640, браузер не запускался |
| Визуальная самопроверка | NOT_RUN: прямой запрет браузерных проверок05.10 приоритетнее исторического skill workflow |
| Пользовательская приёмка | OPEN: смотреть Цифровой ID, Канал с пустым body, длинный заголовок видео-сообщения, следующий icon после handoff |
| Публикация/стенд | MAX_RIGHT установлен21:30:54МСК с service/HTTP/SHA verification; сайт не обновлялся. [Установка](max-ui-copy-deployment-20261006.md) |

Все будущие иконки скрыты до визуального начала соответствующего задания, включая начальную расстановку. Скрытые nodes остаются в раскладке, поэтому никаких перестроек бизнес-пути/изменения distances/освобождения узлов нет. Пройденные узлы сохраняются. Следующий появляется плавно существующим maath damp на handoff pack. Пустота справки определяется основным текстом, а не названием: title-only «Канал» не показывает окно; настоящий result message показывает.

Исправлено найденное субагентом расхождение: dirty invalidate не исключал connected GPU owners с тем же sceneVersion. Теперь скрытие/показ инвалидирует именно mounted popup и снимает прежнюю InstructionMotion, устройство/егоactions остаются. CSS-ширина760logicalpx с правым ограничителем32px и авто-высотой. Неразрывный термин сохраняется, но при произвольном ручном перетаскивании устройства вплотную к правому краю визуальный fit не подтверждён. Слова/пиксели внутри SVG ассетов не переписывались; защита относится к игровому UI.

client-delta.zip533410байт, stand-delta.zip573348байт; dependencies/media/БД/калибровка не входят. Для будущего применения использовать разные профили, свежие baseline guards и accepted ledgers. Не брать receiver/control из более раннего donor source: последний topmost LiDAR patch установлен отдельно.

Трафик SIM: RX0МБ передачи файлов; TX0МБ передачи файлов; всего0МБ передачи файлов, общий интернет-трафик не измерен; учёт: частичная оценка; основание: локальные исходники/кэш/localhost, стенд не подключался, web research отдельного инструмента не списан с SIM; остаток: неизвестен из-за прежних пробелов учёта.
