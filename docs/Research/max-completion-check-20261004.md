# Значок завершения MAX

Используется готовый Three.js0.185.1 MIT SVGLoader уже подключённого renderer, без нового механизма отрисовки. [Официальный API](https://threejs.org/docs/pages/SVGLoader.html) документирует parse/ShapeGeometry; установленный renderer использует path.toShapes. Пользовательский SVG — один белый compound path с вырезом, градиенты/маски не требуются. Практическая проверка именно этого файла: [кадр и отчёт](../../artifacts/reports/max-completion-check-20261004.md).

Иконка встраивается inline, поэтому startup warmup подготавливает completed-вариант без отдельного fetch. Существующая группа объекта даёт позицию/масштаб/затухание. Старый класс .badge не используется: его alpha управляется отдельным скрываемым motion.badge. Новых зависимостей нет.
