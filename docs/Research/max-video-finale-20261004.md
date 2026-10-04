# MAX: опциональный циклический видеофинал

04.10.2026. Пользователь: 11 роликов после последнего задания автомиссии вместо QR; после последнего ролика первый, без перехода к следующей миссии.

## Готовый механизм

Video.js 8.24.1 + videojs-playlist 5.2.0, Apache-2.0. Используем реальный механизм библиотеки: `playlist(items)`, `repeat(true)`, `autoadvance(0)`; собственный таймер порядка/повтора не создаётся. Нативный HTML5 video декодирует текущий файл. Range-parser 1.2.1, MIT, разбирает HTTP Range для переносимого локального сервера; один диапазон передаётся через Node createReadStream.

- [API именно 5.2.0](https://raw.githubusercontent.com/videojs/videojs-playlist/v5.2.0/docs/api.md): repeat применяется также к auto-advance; вызов autoadvance без аргумента отключает его. `loop` видео остаётся false, иначе повторяется один файл.
- [Issue #263](https://github.com/videojs/videojs-playlist/issues/263): опыт несовпадения main-документации и npm 5.x; закреплены точные версии и проверен установленный source.
- [Video.js lifecycle](https://legacy.videojs.org/guides/player-workflows/): dispose перед удалением SPA player.
- [Autoplay best practices](https://legacy.videojs.org/blog/autoplay-best-practices-with-video-js/): отказ play определяется Promise; доступен ручной Play.
- [Реальный iOS autoplay case #9144](https://github.com/videojs/video.js/issues/9144): в версии 8.12.0 описан отказ unmuted autoplay после нескольких видео. Это ограничение/наблюдение чужой конфигурации, не доказанная ошибка нашей сборки. Подборка использует один player, playsinline, штатные controls и отдельный Play при отказе.
- [Range-parser](https://github.com/jshttp/range-parser): suffix/unsatisfiable/malformed ranges обрабатываются готовым parser; multipart не реализуем, допустимый fallback 200.

## Пакет и загрузка

Архив пользователя 1 022 844 437 B. Самые большие исходные данные — 15 секунд ProRes/PCM. Все 11 исходных кадров 1920×1080/25fps; рабочие копии H.264 yuv420p CRF23/AAC160, faststart, 147 511 760 B суммарно (140.68 MiB), длительность 295 секунд. Это перекодирование с потерями: разрешение/частота сохранены, визуальная приёмка пользователя открыта. Порядок из ZIP; исходные и выходные SHA в публичном manifest. Исходный ZIP не изменён.

Плеер, CSS, manifest и текущий ролик загружаются только после полного завершения автомиссии. Нет preload всех видео, Image decode, GPU texture conversion или video.js в основном app bundle. Browser сам управляет media buffer/cache; обещания полностью бесшовного переключения при медленной сети нет. SHA-query и HTTP cache поддерживают повторное использование файлов. Вход при скрытой вкладке сохраняет намерение Play; явная пауза не отменяется возвратом вкладки.

Обычные миссии и выключенный toggle сохраняют QR. Backend-каталог, пользовательская разметка, 500ms автопрохождение не меняются. UI glue блокирует игру/звук, отменяет поздний import при выходе; список и повтор реализует библиотека.

[Результаты проверки](../../artifacts/reports/max-video-finale-20261004.md).
