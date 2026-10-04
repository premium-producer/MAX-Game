# MAX BFM — обрезка вращающегося градиента, 03.10.2026

Пользователь прислал переходный кадр с квадратными иконками. В обычном DOM до правки radius плитки и gradient-clip равны32px; clip-path:none, overflow:hidden. Радиус не отсутствует в stylesheet. Рабочая гипотеза — потеря округлого overflow clipping у composited rotating child во время перехода/переноса DOM. Секундный дефект самостоятельно не воспроизведён; конкретный browser bug не объявляется установленной причиной.

Одна CSS-правка на gradient-clip: clip-path:border-box. Готовый браузерный механизм обрезает слой по border-box с имеющимся radius, создаёт отдельный stacking context. Глиф, shadow/feedback родительской плитки, подпись, scale, backend и timing прежние. Опора/реальный описанный опыт: [исследование](../../docs/Research/max-bfm-gradient-motion-20261003.md).

PASS CSS parser esbuild0.28.2/duplicate guard/scoped runtime build/source-runtime-HTTP SHA. После разрешённого browser reload пять task-иконок имеют computed clip-path:border-box и radius32px. [Данные](max-bfm-rounded-gradient-20261003.json), [кадр](max-bfm-rounded-gradient-20261003.jpg). Панель браузера узкая: кадр не доказывает детализацию всех углов и устранение дефекта в течение всего перехода. Пользователь проверяет именно свой исходный переход. Ответы/reset/restart/видео/GPU-нагрузка не выполнялись; master/TD не менялись.
