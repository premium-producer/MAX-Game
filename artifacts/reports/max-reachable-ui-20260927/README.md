# MAX: интерфейс по guideline overlays и высоте 1–1,8 м

Изменены исходники `artifacts/max-game/src/circle-model.mjs`, `circular-main.js`, `circular.css`, index.html и адаптер DOM bounds `artifacts/service/public/max-panel-optics.js`. Runtime обновлён штатными сборщиками. Входящий референс сохранён в `artifacts/max-game/incoming/guideline-ui-overlays-20260927.png`.

## Интерфейс

- Меню: стеклянные pill-карточки, круглые цифровые badge, белые заголовки. В two две сетки 2×2; в single четыре карточки в ряд.
- Игра: компактный заголовок/описание, скруглённые WebGL-узлы и прежние неоновые волокна, нижний inventory. Успех выводится в той же полосе.
- Business branches: inline-кнопки вместо native select, поэтому popup не выходит за физическую полосу. Shader получает реальные DOM bounds кнопок, в пределах прежнего лимита20.
- Общий фон, glass-панели, шейдеры волокон и их анимация сохранены. Логотип/слоган старого верхнего header скрыт; menu eyebrow сохраняет контекст MAX. Loading/error/pause также перенесены в полосу.

## Измерение и границы

Read-only POSITION/TEXCOORD_0 текущего `artifacts/web/assets/stand.glb`: верх STAND_PLINTH=0; SCREEN_RIGHT Y=.4881106913089752…3.0132200717926025 м. UV V=0 сверху, V=1 снизу. Это тот же datum, который walk-controls использует как пол посетителя.

Формула y=1280*(screenTop-height)/(screenTop-screenBottom). Округление внутрь даёт логический диапазон615…1020, высоты1.7999839…1.0010235 м. Две transport stamp строки не относятся к этим1280. Физическая полоса общая для обоих режимов, CSS получает её смещение относительно контейнера. Декоративные прямоугольники остаются864×864/1760×1024, поэтому их общая геометрия и Service glass mask не изменены.

Центры размещения/drag: Y809…847; полный hit plane (0.4world при scale.65, около84px) с запасом44px остаётся внутри полосы. Горизонтальные границы прямого участка сохранены. Glow/range circles могут выступать: это декоративные поля, а не touch-target. Tests проверяют соответствие реальному GLB, UV, finished floor и обе раскладки, не только проценты CSS.

## Проверено

- node --check изменённых JS; 127 игровых/Service тестов (tests.txt),110 Ribbon тестов (ribbon-tests.txt).
- build MAX:175 runtime-файлов,39 compiled modules; check-local:560 сохранённых upstream-файлов, внешняя X-SPUTNIK папка не нужна.
- Выборочная сборка Service max-panel-optics, HTTP SHA трёх реально отдаваемых файлов совпали (http.json).
- Перезапущен только max-wall-right. Четыре остальных generation не менялись (before.json/after.json).
- Канонический Check.bat: пять running/Spout sending, MAX16.3FPS. Это текущий снимок при общем запуске, не сравнительный GPU benchmark и не60FPS.
- Одна существующая вкладка живого presentation: меню two/single, длинный title ЦифровогоID, business branches. Тапами собран четырёхузловой маршрут до результата; смена business branch обновила третье действие на чат-бот. Console presentation warn/error пустая. Снимки: two-zones-route.png, single-menu.png. После финальной сборки проверен single; вкладка возвращена к общему экрану без ROI, пользовательский single сохранён.

Применены проектная шестицветная палитра, max.type.fast-reading, max.glass.dispersion/highlights и отдельный профиль frosted buttons. Это адаптация communication overlays к игровому UI, не утверждённый владельцем бренда универсальный UI-kit.

## Ограничения

Полные прохождения всех миссий/веток в обоих режимах не выполнялись. Привязка высот подтверждена по модели и UV; монтажные отметки реального LED и LiDAR нужно калибровать на площадке. Приём TD/3D в этом коротком прогоне не проверялся. Художественную оценку делает пользователь. Новых GPU-контекстов для теста, нагрузочных прогонов и записи видео не было. Portable ZIP и Git stage/commit/push не выполнялись.
