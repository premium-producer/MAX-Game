# MAX BFM — постоянный UI при переходах

## Следующая короткая итерация: фон, 03.10.2026

Пользователь подтвердил регрессию: теперь исчезает фон. Предыдущий порядок background0/root1 был неверен: opaque page fill root snapshot перекрывал фон. Исправлено только CSS на root0/background1/stage2; постоянные группы100+ сохранены. CSS parser, duplicate guard, сборка и HTTP/source/runtime SHA PASS. JS не менялся, CPU-тесты переходов повторно не запускались без новой причины.

В текущей локальной миссии выполнено учебное действие «Завершить звонок», без restart/reset: DOM подтвердил следующий голосовой этап. На двух фактических browser снимках фон и UI видимы; backgroundReady=true, sourceFrame1091267. [Состояние/SHA](max-bfm-background-layer-20261003.json), [после действия](max-bfm-background-layer-20261003.jpg), [следующий этап](max-bfm-background-layer-next-20261003.jpg). Это не непрерывная запись промежуточных кадров; общий старт scan/reveal и все миссии ещё не приняты. Прежнее ограничение auto-review касалось restart, обычный переход выполнен без обхода этого отказа.

Ниже сохранена история предыдущей итерации; её порядок слоёв заменён описанным выше.

03.10.2026. URL: http://localhost:8770/max-game/bfm-design/?backend=local&layout=wall

Пользователь уточнил: исчезает всё кроме фона. Root snapshot содержит неназванные debug-панели, фон имеет отдельный named snapshot; рамка поля входит в dissolve kiosk-stage. Потерян z-index100 постоянного HUD из vendor/bfm-native/upstream-transition.css. Native pseudo-tree находится выше обычного DOM z-index; высокий z-index самой панели недостаточен.

Одна CSS-правка: фон group0, root1, сцена2; HUD100, рамка120, карта200, версия210, градиенты220, переключатель230. Постоянные панели выделены уникальными именами, группы без анимации, new opacity1/old opacity0. Рамка исключена из snapshot родительской сцены стандартным именованным участником. Команды/контакт/hidden стадий/таймеры/длительности не изменены.

Опора: [BFM и документированный native API](../../docs/Research/max-bfm-persistent-ui-20261003.md). PASS3/3 bfm-start теста (ранний отпуск, повтор/рестарт, устаревший callback, reduced/fallback), CSS parse esbuild, duplicate guard, BFM build4 files/25 modules. Source/runtime/HTTP CSS SHA совпадают. Первые sandbox build/parser вызовы отказали spawn EPERM; штатный esbuild повторно выполнен с разрешением. GPU-нагрузка/видео/рестарт мастера не выполнялись.

По разрешению пользователя проверена страница во внутреннем браузере: reload, finish, раскрытый контроллер. Все постоянные панели hidden=false/opacity1, новые имена применены. [Кадр](max-bfm-persistent-ui-20261003.jpg), [данные/SHA](max-bfm-persistent-ui-20261003.json).

**Приёмка открыта:** переход scan→reveal→task после правки не просмотрен. Auto-review отклонил restart как сброс локального прогресса; разрешение запрошено, обходов не было. Статичный finish/CPU не доказывают промежуточную видимость. Штатная contextual visibility timer в menu/finish сохранена.
