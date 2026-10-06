# Медиа независимого устройства MAX

Используется установленный Three.js 0.185.1 (MIT), класс [VideoTexture](https://threejs.org/docs/pages/VideoTexture.html), [исходник r185](https://github.com/mrdoob/three.js/blob/r185/src/textures/VideoTexture.js). Он обновляет текстуру по видеокадрам в существующем renderer; второй canvas/RAF не нужен. HTMLMediaElement обеспечивает декодирование, muted loop и pause. Смена источника создаёт новую текстуру: размер используемой текстуры не меняется.

[Опыт с чёрной VideoTexture](https://discourse.threejs.org/t/having-problem-with-videotexture/8478) указывает на готовность источника/воспроизведения как причину пустого результата. Здесь ожидается loadeddata, проверяются размеры; первый приостановленный кадр принудительно отмечается needsUpdate. [Рекомендации Three по освобождению ресурсов](https://github.com/mrdoob/three.js/blob/dev/manual/pages/how-to-dispose-of-objects.html) требуют отдельного dispose текстуры. Очистка также останавливает HTMLVideoElement и удаляет src.

Существующий Video.js 8.24.1/playlist 5.2.0 остаётся в финале игры: его контролы и плейлист не требуются для одиночной текстуры устройства. Зависимости не устанавливались. Ограничения: autoplay зависит от браузера; muted снижает ограничения, отказ play обрабатывается; реальные GPU/декодер и вид проверяются пользователем. CPU-тесты этого не доказывают.

SVG подготовлен существующим prepare-id-svg.py: Figma foreignObject переведены в SVG blur и встроенные растровые conic paints. Оригинал сохранён. [Фактическая проверка](../../artifacts/reports/max-device-media-20261006.md).
