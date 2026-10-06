# MAX: расширенные зоны касания

06.10.2026. Прямой запрос: увеличить поля срабатывания до500px. Уточнение500×500 либо padding500 отправлено асинхронно; ответа к реализации нет. Применена сообщённая пользователю трактовка **минимум500×500 логических пикселей стены**, без увеличения визуала. Большие элементы не уменьшаются.

В текущем Journey v5 используется DOM input mirror, который следует анимированным WebGL группам. Three.Raycaster обслуживает другой, прежний путь webgl-field, поэтому изменение Raycaster не расширяет игровые кнопки. Документированный [Raycaster](https://threejs.org/docs/pages/Raycaster.html) имеет threshold для линий/точек, а не Mesh; [обсуждение разработчиков](https://discourse.threejs.org/t/raycaster-params-not-working-with-mesh/19577) подтверждает ограничение.

Сам механизм прямоугольного попадания реализует уже установленный **Three0.185.1 Box2.containsPoint**, MIT: [официальная документация](https://threejs.org/docs/pages/Box2.html), [лицензия r185](https://github.com/mrdoob/three.js/blob/r185/LICENSE). Vector2.distanceToSquared задаёт выбор ближайшего центра в пересечении. Новый движок picking/таймер/RAF/зависимость не создаётся. Адаптер переводит минимум из logicalwall в CSS через текущий arena scale, берёт текущие getBoundingClientRect только при событиях, фильтрует disabled/inert/hidden/fade.

Точное DOM попадание приоритетно, включая disabled blocker. В свободном месте выбирается один ближайший элемент. Ладонь проверяет одну расширенную область в down/move/up; сохранились controller guards и реальное удержание. Move без down всё ещё не запускает удержание. Родительское inert/hidden, disconnected/cancelled press, второй pointer и pointercancel/blur/service cancel не должны запускать сохранённое действие. CaptureObject/исходная поза/actual hand delta сохранены.

Независимый субагент проверил существующий ввод и кандидат; замечания о втором pointer и stale press исправлены до сборки. Browser/GPU-проверки запрещены пользователем; actualhandler NodeVM+реальный Box2 и HTTP/electron-log проверки не выдаются за физическую приёмку. [Установка и точные ограничения](../../artifacts/reports/max-touch-area-500-20261006.md).
