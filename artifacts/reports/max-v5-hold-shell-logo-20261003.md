# MAX v5 — удержание перед постоянным телефоном

03.10.2026. Телефон создаётся только после backend scanned (0.8с). Ранний отпуск сохраняет ладонь. После подтверждения отпуск не удаляет устройство. Появление shell отделено от logo/иконок: deviceShown+deviceReady открывают row, на следующем кадре maath плавно проявляет MAX параллельно stagger. Далее icon links→phone links→task, прежняя оболочка сохраняется.

## Проверки

- PASS57 CPU: startup10, intro-rhythm10, curves10, device-morph5, route3, task-handoff4, completion6, inertia5 и shared-reveal4. Контакты, ранний отпуск, повтор, скрытие, подтверждённое отпускание; shell/row/trace/fan/content и рестарт/пауза;30/60/120Гц, ready/busy/settled gates, PC ширина, переходы задания, QR.
- Syntax10 PASS, duplicate guard PASS.
- Scoped v5 build28файлов/197модулей; HTTP28/28SHA, source197/197SHA PASS; serviceMode run. Backend прежний missions-figma-20261003-151916-v2.
- startup_tests независимо обновил и выполнил10контактных тестов. startup_review сверил source→renderer: logo data-path-presence0 присутствует уже в markup, далее GPU groupfade обновляется без растеризации каждого кадра; GPU-ready не зависит отalpha; shell gate не ждёт ещёнесозданные icon groups.

CPU fixtures эмулируют decode/GPU acknowledgements и Flexbox-измерения; это не фактический браузерный тест. Браузер/GPU не запускались, мастер не перезапускался, публикация не выполнялась. Визуальная приёмка открыта.

## Проверка пользователя

1. Коротко нажать и отпустить: остаётся ладонь, телефона нет.
2. Удержать0.8с и отпустить: появляется телефон, после него плавно MAX и поочерёдно иконки; телефон остаётся.
3. Дождаться задания: связи строятся в прежнем порядке, меняется только содержимое, при PC расширяется оболочка.

[Открыть](http://localhost:8770/max-game/webgl-v5/?backend=local&layout=wall&v=hold-shell-logo-1). [JSON](max-v5-hold-shell-logo-20261003.json). [Ресерч](../../docs/Research/max-v5-hold-shell-logo-20261003.md).
