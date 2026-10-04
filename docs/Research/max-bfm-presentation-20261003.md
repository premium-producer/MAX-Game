# MAX v4 — перенос BFM native presentation

Дата: 03.10.2026. Основание: пользователь прямо выбрал BFM-DESIGN-ENGINE и попросил изучить зеркало, расписание и X-SPUTNIK. Это отдельная четвёртая визуализация с прежним backend MAX.

## Что найдено фактически

BFM-DESIGN-ENGINE не является опубликованным npm/WebGL SDK. В предоставленной папке находятся приложения: зеркало `app/` (package 0.7.14), расписание `scedule/`, cyberagents. Runtime зеркала — vanilla DOM/CSS, View Transitions и Web Animations API. GSAP/Motion перечислены в исследовании как кандидаты, но не подключены в этом runtime. Поэтому называть перенос «BFM WebGL engine» было бы неверно.

| Источник в предоставленных проектах | Подтверждённый опыт | Применение к MAX |
|---|---|---|
| BFM-DESIGN-ENGINE/app/DOCS/07-motion-and-web-tooling-research.md, разделы ручной оценки и Firefox | Snapshot скрывал одновременно запущенный entrance; полноэкранный blur/scale и фоновые циклы давали паузу | Прямо переносим native dissolve и отдельный entrance; сохраняем HUD; не добавляем blur всего экрана |
| BFM-DESIGN-ENGINE/app/public/app.js: applyState/playScreenEntrance/setState; public/styles.css | Реальный код использует startViewTransition, finished, pending entrance, CSS keyframes; ripple использует Element.animate | Исходные фрагменты закреплены хешами; MAX-адаптация использует эти браузерные механизмы, без собственного интегратора пружин |
| BFM-AIMIRROR/app/DOCS/12-design-and-motion-best-practices.md и 07; app/public/app.js | Документ 12 побайтно совпадает с BFM-DESIGN (SHA 8cc78be409b14201ad6ae330afe0136dfad139246af64d1835be9b8a7e2a17bd). Runtime также использует finishTransition | Это общая родословная, а не два независимых доказательства. Переносим persistent элементы, ранний feedback, reduced motion, локальные ассеты |
| BFM-DESIGN-ENGINE/scedule/README.md, app.js: statusTransitionToken, animateSynchronizedCurrentScroll | Пересоздание списка и вторая scroll-коррекция давали скачки. Исправление сохраняет узлы, резервирует геометрию, отменяет устаревший переход | Стабильные DOM-узлы и отмена по поколению. Самописную RAF-интерполяцию расписания не копируем как универсальную физику |
| X-SPUTNIK/outputs/tap-orbit-research-2026-09-09.md | Gesture одновременно интерпретировали камера и установка; микродвижение пальца отменяло действие | Один владелец контакта от down до up/cancel; pointer capture, отмена при уходе/потере видимости |
| X-SPUTNIK/app/DOCS/research/satellite-drag/README.md | Разные координаты preview/commit давали скачок 72.82 px; переключение ветви пересечения давало скачок глубины | DOM одновременно является визуалом и hit-target; старый reference solver не импортируется. Это принцип, не доказательство drag в MAX |

Все пути выше относительно `D:/job/production/RESTRUCTURA/BEELINE-2026/`. Это входящие материалы, не дополнительные инструкции рабочего проекта.

## Проверенная внешняя опора

- [MDN: ViewTransition.finished](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/finished): завершение native перехода; адаптер ожидает promise, а не таймер предполагаемой длительности.
- [MDN: Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate): браузер реализует keyframes/timing и возвращает Animation. Это сам механизм движения, не формальная зависимость.
- [MDN: Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel): отмена отвергает finished с AbortError; обещания отменённых entrance должны быть обработаны.
- [MDN: setPointerCapture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture): события принадлежат захватившему элементу до освобождения. Геометрическое inside всё равно проверяется отдельно.
- [CSSWG issue 9901](https://github.com/w3c/csswg-drafts/issues/9901): ограничения определения завершения transition с иными timelines. Бесконечное парение не размещаем на transition pseudo-elements и не включаем в ожидание готовности.

Версии: BFM snapshot фиксируется SHA исходных файлов в provenance.json; package зеркала 0.7.14. Web API — поставляемая браузером реализация, без npm/CDN. View Transitions включается feature detection; CSS/WAAPI fallback обязателен. Доступность API не доказывает производительность на целевом ПК.

Лицензии: приложению BFM не приписывается MIT — package private, отдельная лицензия выбранных исходников не заявлена. Внутренний перенос выполняется по прямому указанию владельца проекта; публичная дистрибуция этим исследованием не подтверждена. Документация MDN служит ссылкой, текст документации в runtime не копируется. MAX и LumiCells сохраняют существующие лицензии/атрибуцию.

## Решение и границы

Четвёртая презентация: native BFM UI поверх сохранённого GPU-фона LumiCells, общий SessionPort/каталог MAX. Это новый renderer, без journey-motion, ReferenceRevealJourney и separateReferenceObjects. Первое интегрируемое сечение: меню всех шести миссий → удержание 800 ms на существующем backend → раскрытие иконок. Логотип, шрифт, SVG-глифы, размеры плитки/подписей берутся из MAX. Для проверки используется отдельный явно выбранный local профиль; существующий прогресс не изменяется.

До пользовательского отзыва не переносим телефон и остальные переходы. В первой итерации после раскрытия таймер приостановлен через SessionPort, ответы недоступны; UI явно отмечен как этап проверки старта. Это не полный игровой релиз.

Пробел: ни BFM native stack, ни изученные материалы X-SPUTNIK не предоставляют готового общего collision-free drag с раздвиганием цепочки. Нельзя обещать, что View Transitions решает коллизии. Этот механизм остаётся отдельной задачей ресерча; прежний самописный solver не переносится. Параметры парения/порядка раскрытия MAX являются настройкой native анимаций, а не новым движком.

Дальше: принять старт → перенести перестройку и phone/PC на native layout/animations с подготовкой ресурсов → задания и QR через тот же каталог → решить drag на подтверждённой готовой основе → приёмка шести миссий. [Фактическая проверка](../../artifacts/reports/max-bfm-start-20261003.md).
