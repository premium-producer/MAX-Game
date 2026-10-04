# MAX: интеграция пользовательских звуков — 04.10.2026

Локальный кандидат самостоятельного MAX-Game, codex/automatic-mission-copies. Root владеет source/assets/build/docs; sfx_review выполнил независимое исследование и read-only аудит. F, production/backup серверы, разметка, backend и сохранения не изменены. Commit/push/deploy не выполнялись.

## Реализовано

Howler 2.2.4 (MIT) и 16 звуков пользователя. Библиотека управляет playback/decode/loop/fade/unlock. Mapping по именам файлов и v5 startup/handoff/ready/gesture состояниям; отдельный старый AudioEngine не запускается. Управление звуком находится справа внизу. До первого жеста звуки не играют. При смене local manual/auto остаётся один контроллер и загруженный набор; затухание громкости loop выполняет Howler.

Исходные 48kHz stereo 24-bit WAV сохранены с SHA в audio-source/20261004/manifest.json. MP4 из архива не включён. Для сети один выбранный формат: Ogg 847929 bytes или MP3 1058256 bytes; оба в комплекте 1906185 bytes. WebAudio decoded Float32 оценка 23.88 MiB на 65.2125 s. Это фиксированная добавка к памяти игры, не полный расход процесса.

Read-only review обнаружил и помог исправить: обрезание принятого UI click на первом кадре смены run; очередь устаревших звуков при suspended AudioContext. Текущий ctx должен быть running перед play, неподготовленные one-shot пропускаются; после unlock восстанавливаются только актуальные loops. UI click может закончить короткий хвост между режимами. Одновременно максимум пять SFX плюс ambience/hold. Mute/blur/hidden отменяют эффекты; pagehide unload. Unmute/focus возвращают ранее активированный context через публичный resume.

## Проверки

- 6 целевых audio tests PASS: gesture gate, один ambience при mission switches, дедупликация screen/phase, release/hidden/mute/dispose, пропуск unloaded, лимит voices, короткий click tail, suspended context без очереди.
- Вместе с autoplay-presentation и startup: 21/21 PASS. Syntax changed modules/server/builder, duplicate guard, git diff --check PASS.
- Scoped build: 63 files, 236 input records, app.js 2111826 bytes. HTTP SHA63/63 и source SHA236/236 совпадают. Аудиофайлы возвращают audio/ogg и audio/mpeg. Старый start.mjs заменяется сборщиком только после проверки owning manifest.
- IAB: до жеста loaded16/16, played0, activated=false, running=false, errors0. После «Включить звук» running=true, played1, loops=[ambience].
- Автоматическая communication: фактические onplay события увеличились до31/35, ошибок0; прошла до QR. После mute loops=[] и played35 не изменялось при дальнейшем прохождении. Возврат в меню сохранил loaded16 и muted состояние в том же документе.
- Финальный runtime повторно открыт: activation → mute → unmute дал played1 →1 →2, loops=[ambience] →[] →[ambience], ошибок консоли0.
- В браузерной проверке исправлена обнаруженная кодировка русской аудиокнопки.

Техническая проверка PASS, видимая кнопка/состояния PASS. Факт onplay и running подтверждён; субъективное прослушивание, громкость, синхронизация с авторским MP4 и акустика стенда остаются пользовательской приёмкой OPEN. На физическом iPhone и при длительных системных interruptions не проверено. Service режим не создаёт звук самостоятельно, чтобы не наложить его на мастер.

![Аудиоуправление в игре](max-game-sfx-20261004.png)

[Контракт](../../apps/max-game/docs/AUDIO_V5.md) · [Исследование](../../docs/Research/max-game-sfx-20261004.md).

## Точные SHA для интегратора

Runtime app.js: `8552895563f44616c9b4330c17c6ce48cbb295a029d818d339a97f434ec79f17`.

- `artifacts/max-game/src/journey-v5-audio.mjs`: `431d097886d9aee7658d22f99ebfe23deb6d934458409309df973088d5c1507b`
- `artifacts/max-game/src/journey-guided-main.js`: `13447301091c7783e6f7ee4e69fb837dcbcfc520d51287325238c24c112f65f3`
- `artifacts/max-game/start.mjs`: `865e916da2e7e6920b5e3fcbd438c808120debbe7d9165a2ff351c79da4400e5`
- `artifacts/max-game/scripts/build-webgl-v5-runtime.mjs`: `657fa06c65f0a91809e6bfaefd9b1914e520a0c561984f76d411498dbae061ed`
- `artifacts/max-game/package.json`: `c1bb23c9aeeb3573a10510255c7f19ab00c4ef1c1fc5f470c6563b312a1b0fc7`
- `artifacts/max-game/package-lock.json`: `8db5f9ee1874beacc82c2b17cd92b4d5eac1fbf4a42535beb44eaa6e85df32bc`
