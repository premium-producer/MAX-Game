# Проверка публикации Стеллы, 22.10.2026

**PASS:** [https://futuronika.pro/df/max-info-panel/](https://futuronika.pro/df/max-info-panel/), release `e32a4f6dde925f37c5b0`, исходная версия `KDW-MAX-STELA-RESULT-SPEECH-20261022`. Пользователь запросил полный Qwen/кнопки и затем отдельно уточнил обязательность VST на сервере. Предварительные варианты без VST не опубликованы.

| Проверка | Результат |
|---|---|
| Исходный Windowshost, CRT,4VST и full states | Совпадение файлов по SHA; все6слотов восстановлены; полная metadata параметров Windows/Wine совпала |
| Микрофонный PCM16,16кГц |128000отсчётов, побайтное совпадение Windows/Wine |
| Выходной PCM16,24кГц |192000отсчётов,4различаются на1LSB, RMS разницы0.00456LSB |
| DSP Wine,400блоков на цепочку | input среднее1.51мс/max5.26; output4.20/max6.08мс; startup<0.8с, reset PASS |
| Публичные две VST-цепочки через WSS |800блоков, побайтное совпадение с directWine; средний RTT19.48мс/p95 23.73/max33.32, все<350мс browser deadline |
| Реальный Qwen через публичный шлюз | Существующий synthetic visitor-begin.wav → серверный inputVST → Qwen → audience → Vasilisa → outputVST,29chunks/453120bytes; решение1.50с, первый audio5.10с, FX RTT max100.31мс |
| Кнопки/контроллер через публичный WSS |4миссии, фото/skip/result/back, single session409, cross-origin403 |
| Firefox, реальный опубликованный UI |4миссии; virtual camera1080×1920, capture/review/retake/cancel/confirm и skip; результата/back; отсутствующих изображений/JS ошибок0 |
| Браузерный аудиоконвейер |Обе serverFX, pinned Silero WASM, RTC connected, manual intro playback.started/ended; без отдельного проигрывателя |
| Развёртывание |155SHA verified,16старыхмаршрутов неизменны, конфиги0600, непривилегированный user,127.0.0.1 listeners, service/caddy/audit active, restart0 |
| Экспорт |Gitleaks8.30.1:0утечек; source syntax PASS; versioned assets immutable, entry/release no-cache |

Отчёты: [DSP](dsp-parity.json), [публичный WSS](public-check.json), [Qwen](qwen-check.json), [экраны/камера](browser-check.json), [аудио браузера](browser-audio.json), [deploy receipt](deployment-receipt.json). Воспроизводящие harness/scripts находятся в `ops/stela-web-20261022`; эталоны PCM/полные metadata не публикуются вместе с сайтом. Существующие тестовые WAV не менялись.

Просмотрены реальные PNG [выбора](audience.png), [фото review](photo-review.png), [итога](result.png). Зелёное изображение — штатная виртуальная камера Firefox, не дефект фото. Browser audio harness использует явную fixture `getSettings` для флагаAEC: Firefox fake microphone его не предоставляет. Реальный RTC transport/VAD/FX не подменялись. Это **не** проверка физического микрофона, звучания комнаты, акустического barge-in или нативных окон плагинов. Реальный paid Qwen turn выполнен отдельным протокольным тестом через обе серверные VST-цепочки.

Первые deploy-попытки откатились на проверке Cache-Control: matcher Caddy должен видеть полный путь до strip_prefix; исправлено и повторно проверено. Первые browser-audio проверки выявили отсутствие AEC-флага у fake microphone и неверный this тестового fetch wrapper; исправлен только harness, боевой код не ослаблялся. Эти неудачи не учитываются как успешная проверка акустики.

Проверка игрового package-manifest выявила уже имеющиеся изменения в `source/client/src/kdw-development.mjs` и `source/client/test/kdw-business-native.test.mjs`; в этой работе они не редактировались/не seal-ились. Desktop-стела до добавления exporter совпадала с исходным manifest; добавлены только3файла web export, затем README и manifest. Desktopwww/host/plugins/private config не менялись.
