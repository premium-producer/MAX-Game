# MAX client: память текстур и Safari iOS

04.10.2026. Действующий Three.js0.185.1/MIT, без новой библиотеки или собственного cache manager.

## Источники

- [Three.js Textures: Memory Usage](https://threejs.org/manual/pages/textures.html): память текстур зависит от pixel dimensions, а не PNG/JPEG размера; обычная оценка width×height×4×1.33 учитывает mipmaps.
- [Three.js disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) и [Texture](https://threejs.org/docs/pages/Texture.html): готовый Texture.dispose освобождает GPU-ресурсы; JS/DOM источники имеют собственный lifecycle.
- [Описанный опыт iOS](https://discourse.threejs.org/t/issues-with-complex-scene-on-ios/46356): та же системная формулировка Safari у тяжёлой Three-сцены, обсуждение с maintainer donmccurdy о различии объёма загрузки и расхода памяти. Исторический случай не доказывает причину текущего падения или единый лимит iPhone.
- [WebKit Canvas Debugging](https://webkit.org/blog/8452/canvas-debugging/): Safari Web Inspector показывает canvas dimensions/memory/context; подтверждать точный fault надо на реальном WebKit.

## Применение

Не проектировать отдельный самописный менеджер памяти. В игре уже есть загрузка текущего view/prepareNext и освобождение неиспользуемых texture cache entries. All-screen startup pinning обходит эту очистку. Для мобильного scope следует подключить существующий bounded-in-time путь и штатный Three lifecycle; compressed HTTP preload отделить от residency декодированных images/canvas/GPU. Конкретный размер окна Chromium не является тестом iOS.

Реализация пока не выбрана: пользователь уточняет, требуется ли мобильное прохождение или desktop-only entry. [Фактические измерения](../../artifacts/reports/max-client-ios-crash-20261004.md).
