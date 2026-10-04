# MAX v5: пользовательский SFX-пакет

04.10.2026. Выбран Howler 2.2.4, MIT, закреплён в package-lock. Библиотека реализует воспроизведение, декодирование/кэш, voices, loop, fade и browser unlock. Адаптер игры только сопоставляет события, ограничивает число одновременных эффектов и отменяет устаревшие cues.

## Документация и реальный опыт

- [Howler 2.2.4 README](https://github.com/goldfire/howler.js/blob/v2.2.4/README.md): Howl, src codec fallback, WebAudio/HTML5, onload/onplayerror/onunlock, loop/fade/unload. Pool — не лимит одновременно играющих voices. Публичный Howler.ctx позволяет проверить state/resume.
- [MIT](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md), полное уведомление включено в runtime third-party-notices.html.
- [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay): пользовательский жест нужен для первого запуска; автопрохождение само по себе его не заменяет.
- [Реальный iOS interrupted #1702](https://github.com/goldfire/howler.js/issues/1702): известны проблемы восстановления AudioContext; библиотека не доказывает совместимость конкретного физического iPhone.

Старый src/audio/audio-engine.mjs является собственным WebAudio engine, а его Director связан с предыдущими экранными режимами. Для v5 он не подключён; параллельных AudioContext engine не создаётся.

## Ресурсы и решение

В пользовательском ZIP 16 WAV stereo 48 kHz/24 bit, суммарно 65.2125 s. Большой MP4 — демонстрация, не runtime. Оригиналы сохранены в artifacts/max-game/audio-source/20261004 с SHA и назначением; никаких инструкций из архива не исполнялось.

WebAudio декодирование всех файлов оценивается в 23.88 MiB Float32 stereo. При таком бюджете выбран общий Howler WebAudio и для фонового loop 38.4 s: единый unlock, точный loop и отсутствие отдельного HTML5 медиаканала. Для длинных будущих дорожек этот выбор нужно пересмотреть в сторону streaming. Это ограниченный фиксированный набор, не загрузка видео или всего каталога игры.

Ogg Vorbis q4: 847929 bytes; MP3 128k fallback: 1058256 bytes. Howler выбирает один поддерживаемый формат. Оба формата в runtime занимают 1906185 bytes. Предзагрузка асинхронная и не блокирует startup игры; неподготовленный/заблокированный короткий cue пропускается, а не откладывается на чужой этап.

Сопоставление основано на названиях пользовательских файлов и реальных фазах v5; художественный микс и покадровая синхронизация с MP4 пока не утверждены. [Контракт](../../apps/max-game/docs/AUDIO_V5.md) · [Проверка](../../artifacts/reports/max-game-sfx-20261004.md).
