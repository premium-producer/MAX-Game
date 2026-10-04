# MAX: галочка завершённого задания — 04.10.2026

Запрос: заменить видимую подпись «Выполнено» значком из Subtract.svg, как на референсе. Название задания сохраняется. Изменение только WebGL v5, включая автоматические копии.

## Критерии сравнения

- Белый круг с прозрачным вырезом галочки: PASS, исходный path перенесён без изменения геометрии.
- Верхний правый угол плитки, диаметр около трети её стороны, выступ за край: PASS (86/256, top/right −28 logical px).
- Нет видимого «Выполнено», название сохранено: PASS, проверено DOM и кадром; aria-description хранит состояние для доступности.
- Привязка к той же движущейся плитке, без обрезки: PASS на кадре перехода communication.message → reaction. SVG входит в прежнюю группу Three.js; дополнительных координатных анимаций нет.

Референс: max-completion-check-reference.png, SHA256 858fb0d6771e491db5df269787613864961b7eecea08828f6a237893d0de7889. Оригинал SVG: max-completion-check-source.svg, SHA256 af8808bb9008388163651baa9daa5aa07b74f03e6b12c2339b0ee79b765a2b67. Роль: форма и пропорции накладки; не изменение фона/градиента/шрифта.

## Проверка

Syntax PASS; существующие completion/startup 16/16 PASS; duplicate guard PASS. Scoped builder:31files/231inputs. HTTP31/31 и source231/231 SHA совпали. App SHA256: 588f6b9f677f63092aad4eb1ce023ccb18a8420e8df4d9ff1d27019b216dd7c1.

IAB на localhost19446, client.html?backend=local&autoplay=communication, viewport673×764: видна галочка на завершённом голосовом задании во время появления стикеров; далее DOM подтверждает три завершённых задания с badge и пустым status. Console errors:0. SVG hole корректно отрисован установленным Three.js0.185.1 SVGLoader. Независимый read-only review учтён: отдельный класс вместо старого .badge, startup warmup, наследование motion. Проверяющий предложил IMG как более консервативный вариант; текущий inline path подтверждён реальным кадром, дополнительная загрузка ассета не требуется.

![Результат](max-completion-check-20261004.png)

Техника PASS; визуальная самопроверка формы/положения PASS; художественная приёмка пользователя OPEN. FPS не измерялся. F/серверы не обновлялись. Исходники: journey-v5-icons.mjs и journey-guided-main.js; runtime через штатный scoped builder. Backend и разметка неизменны.
