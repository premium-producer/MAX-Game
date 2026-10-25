# Постоянный журнал голосового сервиса стелы MAX

**GRADIENT-SYMBOLS,20.10.2026:** visual.renderer/metrics mode=css-gradient-symbols; count=14 —11 столбиков+3 шарика в DOM, отображаются альтернативно. Состояния выводятся из прежних visual.state; inputPeak/outputPeak/30Гц-наблюдатель/без PCM сохраняются. Backend/whitelist/анализатор не менялись. [Проверки](verification-20261020/stela-gradient-symbols/README.md).

**GRADIENT,20.10.2026:** прежние visual-события сохранены, visual.renderer mode=css-gradient/count=3, visual.metrics mode=css-gradient/influences=0. inputPeak/outputPeak приходят от прежних метромоделей, без PCM. fps/frameMs означают частоту/интервал CSS-наблюдателя около30Гц, а не GPU/compositor FPS. Под скрытой вкладкой/паузой наблюдатель останавливается. Поля whitelist уже поддерживают mode; сервер/анализатор не менялись. [Проверки](verification-20261020/stela-gradient/README.md).

**REACTIONS,19.10.2026:** visual.state фиксирует from/phase/reason/epoch, visual.renderer — создание пула, visual.metrics раз в10с — bounded inputPeak/outputPeak/FPS/frameMs/influences/reducedMotion, visual.error — отказ наблюдателя/рендерера. PCM/спектры/покадровые уровни не записываются. Анализатор добавляет visual со счётчиками состояний, ошибками и диапазонами метрик. Часы playback остаются RTC sender, не физическая акустическая синхронизация. [Проверки](verification-20261019/stela-reactions/README.md).

**FULL,19.10.2026: основной /stella/ и совместимый ?voice=omni используют один журнал, включая кнопочный путь без AI. command.result/snapshot отражают четыре миссии; mission.displayed пишется один раз для каждой новой result revision с missionId/audience/goal. Повторный commandId даёт command.duplicate без повторной отмены/озвучки. provider.event type=tool.resolution.skipped содержит безопасные reason/responseStatus/callStatus/callId; tool.resolution.sent — допустимое подтверждение completed tool. Тексты/секреты/ротация защищаются прежней политикой. Историческое ограничение одной P1-веткой ниже больше не действует.** [Отчёт](verification-20261019/stela-full/README.md).

**SCOPE, 19.10.2026:** command.proposed/provider decision.parsed содержат строгий topic (max/stand/feedback/social/off_topic); voice.plan — фактический topic и причины OFF_TOPIC_REDIRECT/UNCLASSIFIED_REPLY/STAND_REANCHOR/FEEDBACK_REANCHOR/QUESTION_PENDING. command.intent reason=OFF_TOPIC отражает запрет перехода/keyword fallback. Анализатор собирает plans.topics/reasons; старые события без topic — unreported. Исходный reply отличается от фактического заказа TTS; text-off/usage/аудиозащита сохранены. [Проверки](verification-20261019/stela-scope/README.md).

**SCREEN-TTS, 18.10.2026:** voice.plan содержит серверный вопрос/id/revision, текст/hash/длину и причину; command.intent — мета-замечание/связь подтверждения; voice.question_delivery — ordered WS-доставку. voice.submitted и provider speech.submitted сохраняют заказ TTS (не транскрипцию), text-off скрывает text. В памяти/summary submittedText помечен отдельно. provider tts события показывают connection/generation, cancel.drain/discarded/usage.unknown. Реальный TTS usage накопительный: raw сохраняется, usageDelta нормализуется на соединении; synthesis отдельно от Omni providerUsage, неизвестный расход не нулевой. voice.render_check проверяет planned/provider-transcript в Omni-откате. AEC/VAD/duck/метрики и политика хранения сохранены. [Проверки](verification-20261018/stela-screen-tts/README.md).

Дополнение CONTEXTUAL: voice.reply фиксирует источник qwen_decision/contextual_voice, допуск/причину отбрасывания и длину reply; произвольный reply не становится командой. voice.context отражает доступность текущего ASR, размер ограниченного снимка истории, статусы воспроизведения и ожидание. provider context.attached показывает фактически переданный контекст D/S: delta/restored/qwen_reply. При готовом ответе D S получает только этот текст, без дублирования всей истории; дополнительного inference нет. История отдельно не журналируется, тексты остаются в прежних защищённых transcript/decision-полях. playback.duck содержит mode/durationMs, playback.duck_error не прерывает VAD. В summary добавлены conversation/replies, interruptions.gainModes/gainErrors. [Архитектура](STELA_REACTION_ARCHITECTURE.md), [проверки](verification-20261018/stela-contextual/README.md).


Дополнение BARGE-DIALOGUE: playback.duck отражает временное приглушение/возврат; vad.rejected/confirmed — причину, фактическое время probe и накопленную речь; vad.level — echoScore/renderRms и echoRejectedFrames. voice.reply_topic фиксирует серверную тему ответа. Анализатор добавляет interruptions/replyTopics; reference/PCM не сохраняются.

Дополнение FX-FALLBACK: command.fallback фиксирует причину/правило/выбранное действие и ожидание ASR; command.result.source различает voice/keywords/local-clarify/touch. speechEndToModelDecisionMs отделяет ответ модели от speechEndToDecisionMs с резервным выбором. audio.fx.chain_ready/metrics/failed/closed и playback.envelope отражают VST3, задержки и фейды; clientId/attemptId связывают нативный тракт с посетителем. KDW_OMNI_LOG_TEXT=0 скрывает тексты, ASR остаётся включён для fallback. Подробности: [STELA_AUDIO_PIPELINE.md](STELA_AUDIO_PIPELINE.md). Исторические записи ниже описывают политику прежних итераций.

Реализовано 18.10.2026 в `KDW-MAX-STELA-OMNI-P1-LOGGING-20261018`. Запись включена автоматически, без debug-параметра. Область: клиент `?voice=omni`, локальный HTTP/WS-хост, Qwen и Electron-оболочка. Основная локальная анкета не переводилась на сервер: её кнопочные ответы в голосовой журнал не добавлены.

## Где смотреть

- Исходные события: `apps/stela/data/logs/voice/voice-*.jsonl`. Одна строка — одно событие.
- Запустить `apps/stela/Analyze-Voice-Logs.bat`. Используется комплектный Electron в Node-режиме; глобальный Node/Python и интернет для анализа не нужны.
- Результаты: `apps/stela/data/voice-analysis/REPORT.md` и `summary.json`. Повторный запуск обновляет отчёты, исходный журнал не меняет.
- Одна сессия: `Analyze-Voice-Logs.bat --session <sessionId>`. Другие каталоги: `--logs <папка>` и `--out <папка>`; пути с пробелами заключать в кавычки.
- Состояние записи: поле `logging` в `http://127.0.0.1:18751/__kdw/voice/status` и `/__kdw/health`. Содержимое диалогов и ключи через HTTP не выдаются.

## События

Итерация `KDW-MAX-STELA-OMNI-P1-COMMANDS-20261018` добавляет configuration.requested/confirmed: configRevision, ожидаемый и подтверждённый prompt hash, names/count инструментов и turnDetection; неотражённые провайдером поля обозначаются not-reported. decision.text/decision.parsed сохраняют ограниченный обычный текст D, типы output, имя/ID/аргументы вызова и результат строгого разбора tool/text-json. Выбираются только публичные text/output_text и function_call; reasoning-потоки/поля не читаются в журнал. Поля text, в том числе аргументы внутри calls, подчиняются KDW_OMNI_LOG_TEXT=0. Форматный отказ — отдельный command.protocol_error/DECISION_FORMAT_INVALID; он не считается смысловым clarify и не запускает ещё один платный ответ. Операторский отчёт выводит сводку источников/причин разбора. Полная конфигурация с секретами не журналируется.

Периодические клиентские POST отправляются без keepalive, тело ответа читается. Beacon при уходе остаётся отдельным механизмом. client.delivery_failed записывает первый сбой серии, client.delivery_recovered — восстановление той же клиентской попытки и число ошибок; после перезагрузки страницы счётчик серии не сохраняется, сама ограниченная очередь сохраняется. В полном 112-секундном прогоне подтверждены 105 успешных отправок и пустая очередь в конце; события playback/завершения доставлены после минуты, где подготовительные проверки выявили разрыв.

В `KDW-MAX-STELA-OMNI-P1-WARM-512-20261018` журнал дополнен политикой connectionMode/endpointPauseMs/historyLimits, поколением постоянного канала, channel.ready, history.rotation и job.closed. Открытие/прогрев без задания относится к сессии; события ответа и поздняя ASR сохраняют исходный turn. Анализатор считает usage один раз по connectionId+responseId, отдельно текст/аудио входа/выхода, статусы cancelled и число ответов без usage. Отсутствующие поля не становятся нулевыми расходами; это не полный счёт. vad.ended.tailMs проверяет фактически выбранную паузу.

В итерации `KDW-MAX-STELA-OMNI-P1-AEC-20261018` добавлены aec.state/ready/stats, vad.ready/candidate/rejected/confirmed и audio.pipeline_error. VAD использует локальный Silero; threshold — вероятность речи, RMS сохранён отдельно. playback.started использует часы отправителя локального WebRTC и не включает весь принимающий буфер. [Тракт и трактовка метрик](STELA_AEC.md).

| Слой | Что фиксируется |
|---|---|
| Процесс | runId, версия, запуск/остановка, ошибки запуска, необработанное исключение, сбой renderer |
| HTTP/WS | Готовность порта, отклонённый Host/Origin, неверный токен без значения, занятая сессия, подключение/закрытие и код ошибки |
| Сессия | Создание, длительность, причина завершения: посетитель, закрытие WS, лимит, таймаут, остановка сервиса |
| Микрофон/VAD | Разрешение/отказ, sample rate и параметры обработки без deviceId, RMS min/max/average раз в секунду, пороги, начало/конец и длительность реплики, потерянные кадры при backpressure |
| Qwen | Соединения решения/голоса, фазы и протокольные события, request/response/call/connection IDs, modalities/ASR, ошибки/таймауты, байты/чанки без их содержимого, доступные usage |
| Смысл | Входной транскрипт, предложение AI, разбор инструмента, принято/отклонено с причиной, полный или частичный текст ответа |
| Сценарий | Команды голоса/касания, старая/новая revision и stage, отправка экрана, UI-ready/таймаут и подтверждение показа миссии |
| Звук | Первый выходной чанк, запланированное/наблюдаемое начало Web Audio, опустошение очереди, перебивание, размер очереди и ошибки |

`runId + sequence` идентифицируют запись. `sessionId`, `turnId`, `clientTurnId`, `clientId`, `attemptId` и `epoch` связывают цепочку. Микрофонные события до создания сессии привязываются через attemptId; анализатор присоединяет их к сессии, а неудачные попытки без сессии выводит отдельно. Поздние ответы фиксируются с `late:true`, даже если их уже нельзя применять/воспроизводить.

JSONL использует UTC ISO и монотонное `elapsedMs` процесса. У браузера отдельные `clientTimestamp/clientElapsedMs`; доставка может запаздывать. Интервалы шлюза измеряются монотонными часами. `playback.started` означает достижение времени старта часами работающего Web Audio; физическая слышимость колонок этим не подтверждается.

## Тексты и хранение

Тексты включены по умолчанию для разбора ошибок понимания. Входная расшифровка запрашивается через штатный `input_audio_transcription` с `qwen3-asr-flash-realtime`, только для журнала. Решение по-прежнему принимает Omni по аудио. Расшифровка может добавлять расход; usage не является полным биллингом. Если текст не пришёл, записывается `transcript.missing`, частичный ответ маркируется `complete:false`. [Конфигурация](https://www.alibabacloud.com/help/en/model-studio/client-events), [события API](https://www.alibabacloud.com/help/en/model-studio/server-events).

Отключение записи текстов (ASR остаётся для резервного выбора): `KDW_OMNI_LOG_TEXT=0` перед новым запуском сервера. Уже работающий процесс нужно перезапустить. Технические события остаются, поля text/message/stack заменяются `[text disabled]`. Стартовое уведомление отражает режим. Сырое аудио/base64/PCM, SDP, заголовки, ключи и токены исключаются фильтром; известные секреты также маскируются внутри строк.

JSONL: до 5 МиБ на файл, до 100 МиБ суммарно, семь дней; по размеру старые файлы могут удаляться раньше. Обслуживание раз в минуту при работающем сервисе, при ротации и запуске. Пока приложение выключено, очистка ждёт следующего запуска. Удаляются только файлы собственного формата в каталоге журнала, остальные пользовательские данные сохраняются. Сформированные вручную отчёты — отдельные снимки, обновляются при анализе; политика JSONL их не удаляет.

Браузер отправляет метаданные пакетами. До 200 недоставленных событий остаются в ограниченной localStorage-очереди и повторно отправляются при открытии голосового клиента. Аудио и реплики там не хранятся. Дубли clientEventId отбрасываются. Доставка не гарантируется после очистки/недоступности хранилища или переполнения очереди.

## Как разбирать

Отчёт содержит ошибки/отказы, принятые действия, доступный usage, p50/p95/max задержек, тексты ходов и хронологию сессий. Метрика считается один раз на ход по её последнему значению; отсутствие не считается нулём. «Миссия показана» требует `mission.displayed` после UI-ready, одного решения контроллера недостаточно.

Порядок: найти сессию → сравнить входной текст и `command.proposed` → проверить `command.result.reason` → `ui.state_sent/ui.ready` → `audio.output.first` и `playback.started/ended`. `STALE_REVISION` указывает на конкуренцию со сменой экрана, `SCREEN_BUSY/SCREEN_TIMEOUT` — на готовность отображения, provider errors — на модельный/сетевой участок. Постоянные VAD-старты поверх ответа AI и низкий RMS требуют проверки микрофона/эхоподавления. Нет `session.ended` — незавершённая запись (обрыв, авария или граница хранения), не успешное завершение.

При отказе диска сервис продолжает работу, `logging.healthy=false` и `lastError` показывают проблему. В памяти сохраняется до 200 очищенных событий. После восстановления они дописываются, `journal.recovered` сообщает о потерях, переполнение видно в `droppedEvents`. Память не переживает аварийное завершение процесса; запись при недоступном диске не гарантируется. Ошибки и завершение сессии дополнительно синхронизируются с файловой системой. Недописанные/повреждённые строки не ломают анализ и считаются отдельно.

Журнал находится в пользовательском `data/`, вне чистой поставки и SHA-манифеста; при обновлениях data сохранять. [Проверки и границы](verification-20261018/stela-logging/README.md).
