# Звуковая архитектура X-SPUTNIK

Статус: реализовано в runtime; требуется художественная настройка микса

Дата: 2026-09-09
Источник контента: [`workspace/sound/0609.v1/sound-event-map.json`](../../workspace/sound/0609.v1/sound-event-map.json)

## 1. Решение

Актуализация NEW-030 (audio-lifecycle-193): CTA удерживает приоритет в AudioEngine до фактического onended; pending one-shot отменяются поколением, отказ запуска освобождает приоритет. Декодированные buffers запускаются синхронно до UI-render. Лимит 350 мс применяется только к lateStartPolicy=drop (hover/orbit), подтверждения действий используют play; placement больше не имеет cooldown 80 мс. unlock объединяет параллельные запросы и сохраняет принятый переход; hidden/mute/dispose отменяют ожидающие события. Resume/suspend выполняются последовательно, новые события сами контекст не возобновляют. Последний результат каждого события хранится в AudioDirector.lastPlaybackResults как pending/started/skipped/failed с причиной отказа. Регрессии — test/audio-runtime.test.mjs, включая финальный success-popup на MISSION_SELECT.

Для первой версии используется нативный Web Audio API без Howler/Tone и без дополнительной npm-зависимости.

Архитектура строится вокруг пяти правил:

1. Один `AudioContext` на всё приложение.
2. Reducer и mission evaluation не воспроизводят звук и ничего не знают об аудиофайлах.
3. UI и игровой runtime публикуют семантические события только после принятого действия или реального изменения состояния.
4. `AudioDirector` превращает события и state diff в команды воспроизведения, а `AudioEngine` занимается только Web Audio.
5. Имена файлов никогда не используются в игровом коде: код работает со стабильными event/asset id из JSON-манифеста.

Это сохраняет reducer единственным источником истины, не привязывает звук к DOM-перерисовке или Three.js RAF и позволяет тестировать всю логику без аудиоустройства.

## 2. Текущее состояние проекта

- В мастер-наборе 21 WAV-файл, все стерео, `48 kHz`.
- Общая длительность — `129.255 s`.
- Размер WAV на диске — `35.55 MiB`.
- После декодирования в stereo float32 весь набор займёт ориентировочно `47.33 MiB` без учёта служебных объектов.
- Мастер-файлы лежат вне runtime-дерева: `workspace/sound/0609.v1` не попадает в `app/dist`.
- Runtime-набор перекодирован в WebM/Opus VBR `160 kbit/s`: `2.67 MiB` вместо `35.55 MiB` (снижение на `92.5%`).
- `app/server.mjs` объявляет MIME для WAV, WebM и Ogg; текущий манифест использует WebM.
- Runtime использует нативный Web Audio без отдельной аудиобиблиотеки; зависимости — Three.js и esbuild.
- `dispatch()` уже отбрасывает непринятые shell-действия через `nextState === state`.
- `updateMission()` уже имеет удобную границу `previousRun -> nextRun`.
- `renderMission()` вычисляет итоговую сеть и feedback-события, но вызывается повторно, поэтому запускать звуки непосредственно из render-функции нельзя.

## 3. Выводы ресерча

- Web Audio следует создавать или возобновлять из пользовательского жеста; состояние контекста может быть `suspended`, `running` или `closed`. Поэтому первая подтверждённая интеракция должна вызывать `resume()`, а не предполагать доступный autoplay. [MDN: Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- `decodeAudioData()` асинхронно декодирует полный `ArrayBuffer` и возвращает переиспользуемый `AudioBuffer`. Это подходит текущим локальным семплам. [MDN: decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
- Один `AudioBufferSourceNode` запускается только один раз, но декодированный `AudioBuffer` можно переиспользовать. Поэтому кэшируются buffers, а source node создаётся заново на каждый voice. [MDN: AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
- Плавные изменения громкости должны планироваться через `AudioParam`, а не сериями JS-таймеров. `setTargetAtTime()` подходит для fades и ducking. [MDN: setTargetAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime)
- `DynamicsCompressorNode` уместен на master-цепи, потому что одновременное смешивание нескольких SFX и лупов может дать clipping. [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- Для интерактивной игры используется `latencyHint: "interactive"`; браузер может не выполнить hint буквально, поэтому `baseLatency` является диагностикой, а не acceptance gate. [MDN: AudioContext constructor](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext)
- При `visibilitychange` фоновые звуки надо приостанавливать и возвращать только если звук был активен до скрытия. [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- Three.js поддерживает один listener на камере и positional sources, но текущий 21 файл уже стерео и описывает глобальные UI/состояния. В V1 пространственное аудио не используется; его можно добавить отдельным adapter позже. [Three.js: AudioListener](https://threejs.org/docs/pages/AudioListener.html), [Three.js: PositionalAudio](https://threejs.org/docs/pages/PositionalAudio.html)
- WAV остаётся мастер-форматом, а runtime использует Opus/WebM: Opus подходит и речи, и музыке, поддерживает `48 kHz` и существенно уменьшает передачу данных. Конвертация выполняется в content pipeline, а Web Audio получает уже оптимизированные файлы. [MDN: Web audio codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs)

## 4. Целевая схема

```text
DOM / WebGL callbacks / reducers
               │
               │ accepted semantic event or state snapshot
               ▼
        AudioEventAdapter
               │
               ▼
          AudioDirector
       ┌───────┼────────┐
       │       │        │
 one-shots   loops   lifecycle
       │       │        │
       └───────┼────────┘
               ▼
           AudioEngine
     ┌─────────┼──────────┐
 AssetCache  VoicePool  Gain buses
     └─────────┼──────────┘
               ▼
        master compressor
               ▼
          master gain
               ▼
          audio output
```

Обратного потока из `AudioEngine` в gameplay нет. Ошибка загрузки или отсутствие Web Audio переводят приложение в silent degradation и не блокируют миссию.

## 5. Модули и ответственность

### `src/audio/audio-manifest.mjs`

- Загружает `/config/audio.json`.
- Проверяет уникальность `asset.id` и `event.id`.
- Проверяет допустимые `kind`, `bus`, `screens`, `preloadGroup` и instance policy.
- Разрешает event id в asset id.
- Не обращается к `AudioContext`.

### `src/audio/audio-state.mjs`

Чистые функции без DOM и Web Audio:

- `deriveShellAudioEvents(previousState, nextState, action)`;
- `deriveMissionAudioEvents(previousRun, nextRun, action)`;
- `deriveNetworkAudioSnapshot(network)`;
- `diffNetworkAudio(previousSnapshot, nextSnapshot)`;
- `chooseVariant(group, previousVariant, random)`;
- `shouldResumeAfterVisibility(previousLifecycleState)`.

Это основной unit-test seam.

### `src/audio/audio-engine.mjs`

Низкоуровневый Web Audio adapter:

- владеет единственным `AudioContext`;
- создаёт master graph;
- загружает и декодирует assets;
- кэширует `Promise<AudioBuffer>`, чтобы параллельные запросы не декодировали файл дважды;
- создаёт новый `AudioBufferSourceNode` на каждый запуск;
- ведёт registry активных voice по event/instance key;
- реализует `playOneShot`, `startLoop`, `stopLoop`, `fadeBus`, `setMuted`, `suspend`, `resume`, `dispose`;
- никогда не знает о миссиях, карточках, DOM-селекторах и цветах Three.js.

### `src/audio/audio-director.mjs`

Оркестратор presentation-смысла:

- принимает `trigger(eventId, payload)` для discrete events;
- принимает `sync(snapshot)` для loops;
- применяет cooldown, variant selection, voice budget, ducking и screen policy;
- сохраняет desired loop state отдельно от фактически играющих voice;
- после `resume()` восстанавливает только desired loops, а не завершившиеся one-shots;
- не подписывается на RAF.

### `src/audio/audio-app-adapter.mjs`

Единственное место интеграции с текущим `main.js`:

- `afterShellTransition(previousState, nextState, action)`;
- `afterMissionTransition(previousRun, nextRun, action, network)`;
- `onFeedbackShown(feedbackKey, feedback)`;
- `onMissionCardHover(missionNumber, status)`;
- `onEarthOrbitGesture(screen)`;
- `onVisibilityChange(document.hidden)`.

Adapter передаёт семантику, а не DOM node или Three.js object.

### `public/config/audio.json`

Runtime-манифест содержит:

```json
{
  "schemaVersion": 1,
  "buses": {
    "master": { "gain": 0.8 },
    "music": { "gain": 0.3 },
    "ui": { "gain": 0.8 },
    "gameplay": { "gain": 0.75 },
    "signal": { "gain": 0.25 }
  },
  "assets": [
    {
      "id": "background",
      "url": "./audio/background.webm",
      "preloadGroup": "boot"
    }
  ],
  "events": [
    {
      "id": "audio.background.loop",
      "asset": "background",
      "kind": "loop",
      "bus": "music",
      "instancePolicy": "single-global"
    }
  ]
}
```

Gain-значения выше — безопасные стартовые точки, а не утверждённый финальный микс. Они должны настраиваться после прослушивания на целевом ПК и акустике.

## 6. Audio graph

```text
one-shot source ─ voiceGain ─┐
loop source ───── voiceGain ─┼─ busGain(music/ui/gameplay/signal)
                             │
all bus gains ───────────────┴─ DynamicsCompressorNode ─ masterGain ─ destination
```

Правила:

- Master, music, UI, gameplay и signal регулируются независимо.
- Mute плавно меняет `masterGain`, останавливает активные и отменяет ожидающие one-shot; desired loop state сохраняется. События периода mute не воспроизводятся задним числом.
- Каждый старт/стоп loop использует короткий gain fade, чтобы не было щелчков.
- Feedback-popup может временно приглушать music/signal через bus ducking; это конфигурация event, а не ручной `setTimeout` в UI.
- `ui.cta.screen_enter` — эксклюзивный one-shot: при запросе он останавливает активные и отменяет ожидающие one-shot. Новые запрещены до фактического окончания CTA; ошибка запуска освобождает приоритет. Пауза AudioContext сохраняет приоритет. Background и state-driven link loops не затрагиваются правилом CTA.
- Компрессор — safety layer, а не способ сделать весь микс громким.
- В V1 нет reverb, analyser, AudioWorklet и per-frame panner updates.

## 7. Семантические события

Source of truth для всех 21 файлов — `sound-event-map.json`. Архитектурные события группируются так:

| Domain | События | Источник |
|---|---|---|
| Lifecycle | `audio.unlocked`, `audio.hidden`, `audio.visible`, `audio.muted` | pointer/keyboard capture, Page Visibility, control |
| Shell | `ui.cta.screen_enter`, `ui.cta.primary`, `ui.navigation.back`, `ui.onboarding.to_mission_select`, `ui.mission_select.launch`, `ui.mission_select.finish`, `ui.end.finish_game` | Вход на CTA либо только принятый reducer transition |
| Mission UI | `ui.mission_select.card_hover`, `ui.mission_select.card_press`, `ui.mission.success_continue`, `ui.mission.restart` | Делегированные UI events с проверкой статуса |
| Interaction | `ui.cta.camera_orbit`, `game.node.place_or_move` | WebGL drag threshold / принятый `PLACE` или `MOVE` |
| Feedback | `game.popup.success`, `game.popup.error` | Первый реальный показ нового `feedbackKey`; выбор только по успешности outcome |
| Signal | `game.link.blue_loop`, `game.link.green_loop`, `game.link.red_loop` | Diff итогового network audio snapshot |

### Правило accepted-event

Звук действия испускается после вычисления результата:

```js
const previousState = state;
const nextState = reduceGame(previousState, action, MISSION_ORDER);
if (nextState === previousState) return;
audioAdapter.afterShellTransition(previousState, nextState, action);
state = nextState;
```

То же правило применяется к `reduceMission`. Заблокированная карточка, отменённый drop и действие без изменения состояния не звучат.

### Правило feedback-once

`renderOutcomePopup()` нельзя использовать как звуковой триггер напрямую. Звук запускается только когда `popup.dataset.outcomeKey` меняется на новый ключ и popup действительно становится видимым. Повторный render того же popup не воспроизводит звук повторно.

### Правило link-state

Audio snapshot обязан использовать ту же семантику, что `signalLinkColor()`:

- red: хотя бы один конец имеет state `wrong`;
- green: хотя бы один конец имеет state `link` или это успешный closing link;
- blue: остальные отображаемые связи.

Director хранит только три счётчика/boolean состояния. Он не создаёт отдельный loop на каждую линию: максимум один активный слой каждого цвета. Это исключает рост громкости при увеличении числа связей.

## 8. Загрузка и asset pipeline

### Мастер и runtime-копии

- Оригинальные WAV остаются в `workspace/sound/0609.v1` и не переименовываются.
- Runtime-файлы кодируются как WebM/Opus VBR `160 kbit/s` и получают ASCII-имена по asset id в `app/public/audio`.
- `sound-event-map.json` остаётся авторским реестром; `public/config/audio.json` — нормализованный runtime-манифест.
- Build validation проверяет, что каждый event ссылается на существующий asset и каждый runtime-файл учтён.
- `server.mjs` получает MIME `audio/wav`, `audio/webm` и при необходимости `audio/ogg`.

### Preload tiers

| Группа | Когда загружать | Состав |
|---|---|---|
| `boot` | После загрузки manifest, до первого действия | background, CTA screen/primary, universal back, три camera variants |
| `onboarding` | При входе в CTA/ONBOARDING | onboarding back/continue |
| `mission-select` | При входе в ONBOARDING | hover, card press, launch, finish |
| `mission-play` | При входе в MISSION_SELECT | placement, restart, feedback и три link loops |
| `end` | После выполнения третьей миссии | finish game |

Все buffers подготавливаются до готовности игры. Готовый buffer запускается непосредственно в обработчике события, до синхронной перерисовки. При асинхронном ожидании проверяются отмена, hidden/mute, актуальность экрана и CTA-приоритет непосредственно перед source.start. Только hover/orbit с lateStartPolicy=drop отбрасываются после maxLateStartMs; подтверждения действий не теряются по этому таймауту. Принятые переходы сохраняют звуковой хвост на следующем экране.

Полностью декодировать весь набор заранее технически возможно (`~45 MiB` PCM), но tiered preload уменьшает стартовую задержку и сохраняет память для WebGL-текстур.

### Форматы

Опубликованный runtime использует WebM/Opus VBR `160 kbit/s`; WAV остаётся мастер-источником вне публичной сборки. Автоматическая проверка четырёх критических лупов подтверждает одинаковое число декодированных семплов до и после конвертации. Финальный акустический контроль бесшовности и артефактов выполняется на целевом Electron/Chromium компьютере.

## 9. Lifecycle и пользовательский контроль

Состояние аудиосистемы:

```text
UNINITIALIZED -> PRELOADING -> SUSPENDED -> RUNNING
                                      ↕
                                  USER_MUTED
                                      ↓
                                    CLOSED
```

- Контекст можно создать suspended во время bootstrap, чтобы декодировать boot-assets.
- Первый `pointerdown`/`keydown`, признанный user activation, вызывает `resume()`.
- Background loop стартует только после успешного unlock.
- `document.hidden` вызывает `suspend()` и запоминает, был ли звук running.
- Возврат в visible вызывает `resume()` только если контекст ранее был разблокирован, звук не muted и до скрытия был running.
- На `pagehide` прекращаются загрузки, active sources останавливаются, контекст закрывается.
- Глобальный mute сохраняется в `localStorage`; mute-control должен быть доступен с клавиатуры и иметь `role="switch"`/понятный label.
- Ошибка одного файла логируется в debug diagnostics один раз и не вызывает popup поверх игры.

## 10. Voice policy

| Категория | Ограничение |
|---|---|
| Background | 1 persistent voice |
| Link loops | До 3 voices, по одному на цвет; обычно 1–2 одновременно |
| Camera variants | 1 voice, новый жест перезапускает предыдущий |
| Hover | 1 voice + cooldown `300 ms` |
| Placement/move | 1 voice, restart-on-new-drop |
| UI transition tails | Максимум 2 одновременно; старейший мягко гасится |
| Feedback | 1 voice; новый critical feedback вытесняет старый feedback |

Voice registry очищается через `source.onended`. Никаких массивов завершённых source node и никаких новых audio objects в RAF.

## 11. Точки интеграции в текущую сборку

### `main.js`

1. Bootstrap загружает audio manifest параллельно миссиям, shell config и wording.
2. Создаёт один `audioDirector` и capture-listener для unlock.
3. `dispatch()` сообщает только о принятых shell transitions.
4. `updateMission()` сообщает только о принятых `PLACE`, `MOVE`, `RESTART`, `TICK/CHECK` transitions.
5. После получения финального `network` вызывается `audioDirector.syncNetwork(snapshot)` только при изменении signature.
6. Показ нового outcome key вызывает feedback event.
7. `visibilitychange` обслуживает и `fitStage()`, и audio lifecycle.

### `webgl-field.js`

Добавляется только presentation callback `onOrbitGestureStart`, вызываемый один раз после превышения drag threshold. WebGL не импортирует audio modules и не выбирает файлы.

### Build/server

- Добавить нормализованные runtime-assets в `public/audio`.
- Добавить `public/config/audio.json`.
- Расширить `npm run check` новыми audio-модулями.
- Добавить MIME для форматов.
- `portable:check` проверяет отсутствие абсолютных путей и наличие всех audio assets.

## 12. Проверки

### Unit

- Непринятое reducer-действие не создаёт audio event.
- `PLACE` и `MOVE` дают один `game.node.place_or_move`; preview/cancel — ноль.
- Одинаковый feedback key не повторяется.
- Camera variants не повторяются непосредственно.
- Link snapshot идемпотентен; неизменившаяся сеть не перезапускает loop.
- Переход blue -> green использует stop/start fade, а не два вечных голоса.
- `RESTART`, `BACK`, `MISSION_COMPLETE` очищают mission loops.
- Hidden/visible не включает звук, если пользователь ранее его не разблокировал или выключил.
- Ошибка загрузки одного asset не ломает director.

### Manifest/portable

- 21/21 source events разрешаются в runtime assets.
- Нет неизвестных event, bus и screen id.
- URL относительные, ASCII, без локальных абсолютных путей.
- Каждый asset доступен по HTTP с правильным MIME.

### Ручная проверка на целевом ПК

- При первом показе CTA его звук запускается после user activation. Если первый Enter/Space сразу переводит на ONBOARDING до завершения unlock, после unlock звучит primary вместо уже неактуального entry. При возврате на CTA entry запускается при входе и сохраняет приоритет до окончания.
- Пока звучит CTA entry, все остальные one-shot заблокированы. При переходе назад на CTA экранный звук получает приоритет, поэтому универсальный back-звук не запускается.
- Вне CTA-lock любой принятый `BACK` воспроизводит один универсальный back-звук; отклонённый `BACK` на CTA молчит.
- Нет щелчка на старте/остановке лупов.
- Длинные transition SFX доигрывают, но не создают какофонию при быстрых действиях.
- Background не перезапускается между экранами.
- После alt-tab звук замолкает и корректно возвращается.
- Три состояния связи на слух различимы, не маскируют feedback и речь/публичную акустику.
- Все лупы бесшовны на реальной акустике.

## 13. Этапы реализации

1. **Content gate:** прослушать 21 файл, подтвердить `sound-event-map.json`, точки loop и смысл длинных UI-файлов.
2. **Assets:** сформировать ASCII runtime names, добавить `audio.json`, MIME и asset validation.
3. **Core:** реализовать `audio-manifest`, `audio-state`, `audio-engine` с fake-engine тестами.
4. **Director:** реализовать voice policies, fades, ducking, preload tiers и visibility lifecycle.
5. **Integration:** подключить accepted shell/mission transitions, popup key, network snapshot и orbit callback.
6. **Controls:** добавить mute switch и сохранение настройки.
7. **Mix QA:** настроить gain/duck/fade и подтвердить качество Opus/бесшовность лупов на целевом компьютере.

## 14. Acceptance criteria

- Gameplay остаётся полностью работоспособным при выключенном, заблокированном или сломанном аудио.
- В reducer, mission evaluation и Three.js render loop нет вызовов воспроизведения.
- В приложении существует ровно один `AudioContext`.
- Никакой one-shot не запускается из повторного render.
- Никакой state loop не размножается от количества объектов/линий.
- Первый звук запускается после user activation, background сохраняется между экранами.
- Hidden/mute/restart/back/mission complete не оставляют зависших loops.
- Все 21 утверждённых файла доступны через стабильные event id и проверяются автоматически.
- Отсутствующий файл приводит к локальному silent fallback, а не к остановке загрузки приложения.

## 15. Контентные гэпы перед финальным миксом

В текущем наборе нет однозначных отдельных файлов для:

- смены языка;
- закрытия error popup и выхода из timeout;
- универсальных UI click/hover вне экрана выбора миссий;
- зелёной сети между выполненными миссиями на `MISSION_SELECT`.

До прослушивания нельзя автоматически переиспользовать `VPN АКТИВЕН` для других успехов или link-loop «во время раунда» для карты миссий.

## 16. Реализованный результат

- Все 21 runtime-файл перекодирован в WebM/Opus VBR `160 kbit/s`, сохранён под стабильным ASCII-id в `public/audio` и описан в валидируемом `public/config/audio.json`; WAV-мастера остаются в `workspace/sound/0609.v1`.
- Реализованы `audio-manifest`, `audio-state`, `audio-engine`, `audio-director` и единственный `audio-app-adapter`; игровой reducer, evaluation и WebGL render loop не импортируют Web Audio.
- Подключены фон, эксклюзивное появление CTA, универсальный принятый `BACK`, три варианта жеста камеры, остальные принятые shell/mission-действия, placement/move, restart, единый звук всех успешных попапов, единый звук всех неуспешных попапов и три state-driven link loop. CTA entry останавливает и блокирует остальные one-shot на время своей длительности, не затрагивая loops.
- В header добавлен сохраняемый RU/EN mute-switch. Первый capture-жест разблокирует контекст; visibility и pagehide обслуживают suspend/resume/dispose.
- `npm run check` валидирует манифест и соответствие 21 runtime-файлу; unit suite проверяет semantic mapping, CTA entry/unlock, universal back, link-state diff, cooldown, варианты, lifecycle, единственный context и кэш декодирования; portable-check проверяет наличие assets в `dist`.
- Не назначены звуки без однозначного исходника: смена языка и link-линии экрана выбора. Это остаётся контентной задачей, а не скрытым переиспользованием неподходящего файла.
