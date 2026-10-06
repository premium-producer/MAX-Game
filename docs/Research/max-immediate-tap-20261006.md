# MAX: мгновенное касание вместо удержания, 06.10.2026

Запрос: настоящее касание руки в зоне минимум500×500 logical wall px сразу активирует ладонь, иконку или действие. Перетаскивание устройства/иконок отключается. Это изменение игрового поведения, а не обход авторизации или эмуляция завершённого удержания.

Использованы существующие механизмы:

- DOM Pointer Events: [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event), [click](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event). Down означает физическое начало контакта, move при нажатой кнопке позволяет войти в зону уже существующей рукой. Hover без down не активирует действия. Pointer Events — встроенный браузерный API, отдельной зависимости нет. MDN описывает implicit capture у сенсорного ввода; стендовый Electron получает LiDAR как нативный mouse input, проверка touchscreen отдельно OPEN.
- Three.js0.185.1/MIT [Box2](https://threejs.org/docs/pages/Box2.html): прежний installed helper touchBounds/touchContains/touchPick сохранён. Не добавлены новый hit testing engine, кадровый picking или библиотека жестов.
- Действующие OSC parser, calibration perspective transform и source reset quarantine остаются прежними. Control bridge только превращает первый допустимый move после outside-cancel в down для той же фактической руки/владельца. После смены owner/reset/timeout требуется новый source lifecycle.
- Canonical game Application/SQLite уже хранит реальный contact down и вызывает poll с доверенным временем сервера. По независимому аудиту достаточна смена двух порогов800→0 в этой application. Internal HOLD_CONFIRMED остаётся совместимым receipt; renderer не присылает scanPassed/HOLD_CONFIRMED и не изменяет серверное время.

Локальная политика повторов: активированная область и semantic key запоминаются. Для другой кнопки в пересекающейся области достаточно движения руки на24 logical px от предыдущего срабатывания; отпускание и выход из прежних500×500 не нужны. Это пространственная защита от дрожания, не задержка удержания. Та же кнопка внутри прежней области повторно не нажимается; новая картинка под неподвижной рукой не запускает каскад действий. В пересечениях сохраняются точное DOM попадание и выбор ближайшего центра. Это адаптер маршрутизации существующих событий, не новый физический input parser.

Источник серверного delta подтверждён SHA10d16389… в D donor, read-only F canonical и live MASTER. Исторические presentation/application и D vendor не заменяют этот source. Кандидат изолирован в artifacts/workspace/tasks/max-immediate-tap-20261006; F не изменяется.

Фактические проверки:19 NodeVM tests реальных UI handlers,14 control/calibration tests,15 SQLite/HTTP integration assertions — всего48; build/parser/duplicates PASS. Дополнительные проверки подтверждают движение между соседними зонами без отпускания и повторную активацию после осознанного движения на новом экране. R2 установлен на MASTER и MAX_RIGHT; SHA/launcher/health/UDP/logger проверены. Это не доказательство приёмки рукой на физическом стенде. Браузерные проверки запрещены пользователем и не запускались.
