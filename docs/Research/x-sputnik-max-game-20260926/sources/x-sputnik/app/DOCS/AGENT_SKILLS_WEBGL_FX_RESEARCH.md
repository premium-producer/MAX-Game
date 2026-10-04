# Ресерч: agent skills и WebGL/animation/FX-стек для X‑SPUTNIK

Дата проверки: 2026-09-04  
Статус: исследование завершено; рекомендованные agent skills установлены/созданы в `.agents/skills/`, runtime-зависимости не устанавливались.

## 1. Короткий вывод

Текущий проект уже построен на правильной для этой игры основе: vanilla JavaScript + Three.js + esbuild. Переписывать его на React/React Three Fiber ради анимаций не требуется. Наиболее практичный следующий стек:

1. Репозиторные agent skills в `.agents/skills/`, которые фиксируют правила motion-дизайна, Three.js/FX-архитектуры, производительности и визуальной проверки именно этой игры.
2. [GSAP](https://github.com/greensock/GSAP) для длинных, прерываемых и синхронизированных таймлайнов: смены экранов, onboarding, success/end, раскрытие shell, работа камеры и UI как единая сцена.
3. [GSAP Skills](https://github.com/greensock/gsap-skills) как готовая официальная база знаний для агентов, работающих с этими таймлайнами.
4. [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) поверх текущего `WebGLRenderer` для выборочных GPU-эффектов: bloom, LUT/color grading, vignette, shock wave, glitch/chromatic aberration, outline.
5. Нативные Three.js `Points`, `InstancedMesh`, shader uniforms и object pooling для частиц, бегущих импульсов и волн связи. Отдельный particle engine пока не нужен.
6. [Howler.js](https://github.com/goldfire/howler.js) на втором этапе — для коротких UI-сэмплов, звуков сигнала, spatial/stereo-позиционирования и плавных audio-fades.
7. [Spector.js](https://github.com/BabylonJS/Spector.js) как dev-only инструмент диагностики WebGL-кадра; [Playwright screenshots](https://playwright.dev/docs/screenshots) и [visual comparisons](https://playwright.dev/docs/test-snapshots) — как опциональная автоматическая проверка ключевых кадров, а не как замена ручной оценки игры.

Главное архитектурное решение: игровое состояние не должно напрямую запускать разрозненные `setTimeout`, CSS-классы и GPU-эффекты. Оно должно публиковать семантические события (`node:dropped`, `node:awake`, `link:valid`, `route:wrong`, `mission:success`), а отдельный FX-директор синхронизирует WebGL, DOM, звук и камеру. Тогда усложнение визуала не ломает drag-and-drop, сеть и миссии.

## 2. Что уже есть в проекте

На момент исследования:

- runtime-зависимость только одна: `three@^0.185.1`;
- сборка — esbuild, без React;
- есть постоянная WebGL-Земля для CTA, onboarding, карты миссий, игры и финала;
- используются собственные `ShaderMaterial`, `Points`, линии маршрута и один `requestAnimationFrame`-цикл;
- CSS уже содержит переходы shell и поддержку `prefers-reduced-motion`;
- игровая логика конфигурируется JSON и отделена от WebGL-представления;
- в `.agents/skills/` теперь вместе находятся TouchDesigner/Embody skills, отобранные внешние Web/motion/Three.js skills и четыре проектных `x-sputnik-*` skill.

Это означает, что проекту нужен не новый фреймворк, а три слоя поверх существующей архитектуры: единый motion-runtime, контролируемый postprocessing и локальные инструкции для агентов.

## 3. Как использовать agent skills

По [официальной документации OpenAI о Skills](https://learn.chatgpt.com/docs/build-skills), skill — это папка с обязательным `SKILL.md` и опциональными `references/`, `scripts/`, `assets/` и `agents/openai.yaml`. Codex сначала видит только имя и описание, а полные инструкции загружает при совпадении задачи с описанием. Репозиторные skills можно хранить в `$CWD/.agents/skills` и коммитить вместе с проектом.

Практические следствия для X‑SPUTNIK:

- skill не добавляет эффект в runtime; он учит агента проектировать и реализовывать эффект одинаковым способом;
- один skill должен решать одну понятную задачу;
- повторяемую проверку лучше оформить скриптом, а художественные и архитектурные решения — инструкциями и references;
- описания skills должны содержать реальные trigger-фразы: «анимация перехода», «новый WebGL-эффект», «оптимизация кадра», «визуальная регрессия»;
- сторонние skills нельзя устанавливать пачкой без чтения `SKILL.md`, всех вызываемых scripts и лицензий.

### Рекомендуемые готовые skills и базы

| Приоритет | Источник | Что дает | Решение для проекта |
|---|---|---|---|
| A | [OpenAI Skills guide](https://learn.chatgpt.com/docs/build-skills) | Каноническая структура, progressive disclosure, места установки, правила тестирования | Использовать как стандарт всех новых skills |
| A | [GreenSock GSAP Skills](https://github.com/greensock/gsap-skills) | Официальные skills по core, timelines, plugins, performance и framework integration | Подключать вместе с GSAP; особенно полезны `gsap-core`, `gsap-timeline`, `gsap-performance` |
| A | [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | Web design guidelines, accessibility и frontend best practices | Взять `web-design-guidelines`; React-specific skills не активировать для текущего vanilla-проекта |
| B | [Vercel web-animation-design skill](https://github.com/vercel-labs/open-agents/blob/main/.agents/skills/web-animation-design/SKILL.md) | Хорошие правила длительности, interruptibility, springs, transform/opacity и reduced motion | Не копировать вслепую; адаптировать принципы в локальный motion skill |
| B | [MengTo Three.js skill](https://github.com/MengTo/Skills/blob/main/agent-skills/web-design/threejs/SKILL.md) | Базовый Three.js workflow: сцена, камера, материалы, GLTF, performance | Использовать как справочник; для проекта написать более строгий локальный skill вокруг существующего `webgl-field.js` |
| B | [Vercel Phase](https://github.com/vercel-labs/phase) | Skill и аудит анимаций; помогает выбирать между CSS, небольшим JS и полноценной motion-библиотекой | Полезен как audit/reference, но не обязательная runtime-зависимость |
| C | [Remotion Skills](https://github.com/remotion-dev/skills) | Видео, композиции, audio/effects и программный рендер | Только если понадобятся трейлеры, записанные заставки или pre-rendered cutscenes; не для интерактивного runtime |

### Созданные skills X‑SPUTNIK

```text
.agents/skills/
  x-sputnik-motion-system/
    SKILL.md
    references/motion-contract.md
  x-sputnik-three-effects/
    SKILL.md
    references/render-contract.md
  x-sputnik-performance-budget/
    SKILL.md
    references/frame-budget.md
  x-sputnik-visual-qa/
    SKILL.md
    references/visual-contract.md
```

Назначение:

- `x-sputnik-motion-system`: заставляет агента использовать единые motion tokens, таймлайны, правила появления/ухода, interruptibility и reduced motion;
- `x-sputnik-three-effects`: запрещает создавать второй renderer/animation loop, описывает render order, postprocessing, disposal, pooling, слои Земли, маркеров, линий и particles;
- `x-sputnik-performance-budget`: фиксирует frame budget, DPR, лимиты draw calls, запрет аллокаций и пересоздания геометрии в кадре;
- `x-sputnik-visual-qa`: определяет обязательные контрольные состояния пяти экранов и проверяет, что эффект не меняет географию, hit targets и правила миссии.

Trigger-описания и обязательная маршрутизация этих skills зафиксированы в корневом `AGENTS.md`. Источники внешних skills и результат проверки их исполняемых файлов записаны в `.agents/skills/EXTERNAL_SOURCES.md`.

## 4. Репозитории runtime: оценка применимости

### 4.1. Использовать в ближайшем этапе

#### GSAP + GSAP Skills

[GSAP](https://github.com/greensock/GSAP) анимирует DOM, SVG, canvas/WebGL-объекты и обычные JavaScript-значения. Для текущей игры это важнее, чем набор отдельных CSS transitions: один timeline сможет синхронно двигать shell, менять camera target, вводить карту, гасить фон, раскрывать карточки и завершаться строго в известной точке.

Подходящие задачи:

- переход CTA → onboarding → карта миссий без скачков Земли;
- появление header/frame/footer/inventory как одной хореографии;
- `dropped → waking → transmitting → linked/wrong` без рваных переключений;
- плавный camera settle и инерционная остановка вращения;
- success sequence: свет по маршруту → ударная волна → popup → возврат к карте;
- прерывание и корректный reverse перехода, если пользователь быстро меняет экран.

У GSAP есть отдельный официальный [репозиторий skills](https://github.com/greensock/gsap-skills) в формате agent-skills. Необходимо отдельно зафиксировать используемую версию и проверить актуальные условия лицензии GSAP перед добавлением в распространяемый архив.

#### pmndrs/postprocessing

[pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) работает с vanilla Three.js и не требует React. Его `EffectComposer`/`EffectPass` объединяет совместимые эффекты, уменьшая число лишних полноэкранных проходов.

Подходящие эффекты:

- `BloomEffect`: только эмиссивный контур России, активные узлы и импульсы;
- `LUTEffect`/color grading: единый холодный blue/cyan look вместо ручной коррекции каждого материала;
- `VignetteEffect`: мягкое удержание внимания внутри game-frame;
- `ShockWaveEffect`: drop, пробуждение узла, завершение миссии;
- `ChromaticAberrationEffect` или `GlitchEffect`: очень короткий и слабый wrong-state, не постоянный фильтр;
- `OutlineEffect`: hover/selection без замены материалов модели;
- `SMAAEffect`: аккуратные контуры при разумной цене кадра.

Лицензия репозитория — Zlib. Включать эффекты нужно по пресетам состояния, а не держать все проходы активными постоянно.

#### Native Three.js effects

[Three.js](https://github.com/mrdoob/three.js) уже содержит все базовые примитивы для большинства нужных эффектов, а официальный [postprocessing example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing.html) показывает стандартную схему composer/pass.

Без новой зависимости можно реализовать:

- инстансированные искры drop-impact;
- packet dots, бегущие по Catmull-Rom маршруту;
- мягкие дуги сигнала с shader-driven alpha и dash phase;
- пульсирующие основания маркеров через uniforms;
- star dust и low-density orbital particles через `Points`;
- dissolve/reveal маску карточек и Земли;
- локальную heat/radar distortion на плоскости, ориентированной к камере.

Для текущего WebGL-рендера разумнее сначала развивать эти примитивы. Официальные новые TSL/WebGPU VFX-примеры, включая [linked particles](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_tsl_vfx_linkedparticles.html), полезны как исследовательская ветка, но перевод renderer на WebGPU сейчас создаст отдельный проектный риск.

### 4.2. Добавлять после стабилизации визуального языка

#### Howler.js

[Howler.js](https://github.com/goldfire/howler.js) дает Web Audio с fallback, audio sprites, fades, rate/volume, stereo и spatial audio без дополнительных зависимостей.

Полезная звуковая система:

- тихий ambient hum Земли;
- разный короткий transient для drop/awake/link/wrong;
- тон сигнала, высота которого зависит от качества/длины соединения;
- панорамирование узла по его экранной X-позиции;
- музыкальный слой маршрута, собирающийся по мере правильного подключения.

Звук должен слушать тот же FX event bus, что и визуал, и запускаться только после пользовательского ввода из-за browser autoplay policy.

#### Spector.js

[Spector.js](https://github.com/BabylonJS/Spector.js) захватывает WebGL-кадр, команды и состояния GPU. Его следует использовать только в development для поиска лишних draw calls, больших render targets, неверных blend/depth-настроек и повторной компиляции shader programs. В production bundle его включать не нужно.

#### three-mesh-bvh

[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) ускоряет raycasting и пространственные запросы. Сейчас Земля и несколько узлов не оправдывают новую зависимость. Она станет полезна, если появятся сложные GLTF-объекты, десятки интерактивных мешей, окклюзия курсора рельефом или точная проверка пересечения больших геометрий.

### 4.3. Использовать только как опциональный authoring/research слой

#### Theatre.js

[Theatre.js](https://github.com/theatre-js/theatre) подходит для художественной настройки cinematic-сцен, камеры и параметров Three.js через visual editor. Его можно рассмотреть для onboarding/end или выставочного autoplay-режима. Но это не первый шаг: README проекта указывает отдельные условия лицензирования Core и Studio и продолжающуюся работу над 1.0. Перед применением нужен отдельный license/build audit.

#### Motion

[Motion](https://github.com/motiondivision/motion) — сильная vanilla-compatible альтернатива GSAP со springs, gestures, timelines и использованием browser APIs. Для проекта нужно выбрать одну основную библиотеку хореографии. Motion проще для небольших UI-переходов, GSAP лучше соответствует сложным синхронным сценам этой игры. Одновременное добавление обеих создаст два языка easing/timeline и усложнит поддержку.

#### React Three Fiber ecosystem

[React Three Fiber](https://github.com/pmndrs/react-three-fiber) и его экосистема полезны для нового React/WebGL-продукта, но текущая игра уже имеет живую vanilla Three.js-сцену, собственный state reducer, hit-testing и DOM shell. Миграция не улучшит эффекты автоматически и создаст риск для drag-and-drop, переносимости и производительности. Возвращаться к этому варианту стоит только при отдельном решении переписать UI на React.

#### LYGIA

[LYGIA](https://github.com/patriciogonzalezvivo/lygia) — крупная библиотека повторно используемых GLSL/WGSL-функций. Технически она удобна для noise, SDF, blending и color transforms, но репозиторий использует Prosperity/Patron dual license с ограничениями для коммерческого использования. Для коммерческого проекта библиотеку нельзя включать без отдельной юридической проверки/лицензии. Безопасная альтернатива сейчас — небольшие собственные shaders и официальные Three.js examples.

## 5. Предлагаемый визуальный язык игры

Больше эффектов не должно означать постоянный bloom, glitch и частицы на каждом экране. Эффекты должны объяснять состояние сети.

| Событие | WebGL | UI/DOM | Звук |
|---|---|---|---|
| Взятие объекта | Небольшое увеличение emissive, схлопывание волн | Карточка инвентаря уходит в `dragging` | Короткий pickup transient |
| Drop на Землю | Кольцо удара по касательной поверхности, 6–12 искр | Мягкий settle без изменения точки захвата | Low click + короткий air tail |
| Узел просыпается | Волны нарастают по opacity/scale, а не появляются скачком | Статус проявляется через crossfade | Постепенно открывающийся carrier tone |
| Поиск связи | Радиус волн видим, но линии еще нет | Ближайшие допустимые соседи слегка подсвечены | Едва слышный scan pulse |
| Валидная связь | Дуга вырастает от источника, затем по ней идут packets | В неподвижных слотах footer фейдом меняются иконки | Светлый confirmation tick |
| Неверная связь/порядок | Красный reverse pulse к узлу, краткий локальный aberration | Ошибка без тряски всего экрана | Приглушенный error pulse |
| Разрыв по радиусу | Линия истончается и распадается в 2–3 частицы | Порядок footer обновляется после фактической геометрии | Тихий disconnect |
| Успех миссии | Последовательная подсветка A→…→Б, общая shockwave, camera settle | Popup входит после последнего packet | Собранный аккорд маршрута |

### Экраны

- **CTA:** полноэкранная Земля, редкий звездный drift, один выразительный camera move. Никаких интерфейсных рамок.
- **Onboarding:** Земля остается той же; blur/dim регулируются состоянием. Header/frame/footer раскрываются одним timeline, текст — с небольшим stagger.
- **Выбор миссий:** каждый mission beacon привязан к географии и дает редкий pulse. Hover карточки меняет глубину/контраст, но не сдвигает маркер с Земли.
- **Игра:** визуальные эффекты служат радиусам связи и текущему маршруту; активность концентрируется возле размещенных элементов.
- **End:** собранная сеть превращается в спокойную световую схему; эффекты замедляются, камера заканчивает движение до появления финального CTA.

## 6. Архитектура FX без влияния на игровую логику

### 6.1. Разделение ответственности

```text
Pointer / mission actions
          ↓
Game reducer — единственный источник истины
          ↓ semantic FX events
FxDirector
  ├─ UI timeline adapter (GSAP)
  ├─ Three scene adapter (uniforms, particles, lines, camera)
  ├─ Post FX adapter (composer presets)
  └─ Audio adapter (Howler, опционально)
```

Reducer определяет только факт: объект размещен, проснулся, имеет соседей, связь валидна, миссия выполнена. `FxDirector` определяет, как визуально перейти к новому факту. Обратной зависимости быть не должно: окончание анимации не должно решать, существует ли связь.

### 6.2. Семантические события

Минимальный набор:

```js
node:pickup
node:move
node:dropped
node:waking
node:awake
link:preview
link:connected
link:disconnected
route:changed
route:wrong
mission:success
screen:leaving
screen:entered
```

Каждое событие содержит устойчивые ID, позицию/проекцию, timestamp и причину. Оно не хранит DOM-ноды или Three.js-объекты.

### 6.3. JSON-конфигурация эффектов

Чтобы не переносить hardcode обратно в `main.js`, параметры следует хранить в переносимом `public/config/effects.json`:

```json
{
  "version": 1,
  "motion": {
    "fastMs": 140,
    "normalMs": 320,
    "cinematicMs": 900,
    "easeOut": "power3.out",
    "settle": "power2.out"
  },
  "nodeStates": {
    "dropped": { "waveOpacity": 0.15, "emissive": 0.25 },
    "waking": { "durationMs": 900, "waveOpacity": 0.55, "emissive": 0.7 },
    "linked": { "waveOpacity": 0.75, "emissive": 1.0 },
    "wrong": { "color": "#ff675f", "pulseCount": 2 }
  },
  "postFx": {
    "default": { "bloom": 0.35, "vignette": 0.16 },
    "wrong": { "chromaticAberration": 0.0025, "durationMs": 180 },
    "success": { "bloom": 0.8, "shockWave": true }
  },
  "quality": {
    "maxPixelRatio": 1.5,
    "particleBudget": 1200,
    "maxPostPasses": 4
  }
}
```

Значения выше — стартовая схема, а не утвержденный баланс. К JSON нужен schema/parser по тому же принципу, который уже применяется к missions и UI-shell.

## 7. Производительность и ограничения

Цель для основного стенда: стабильные 60 FPS при 1920×1080, то есть примерно 16,7 мс на кадр. Эффект считается готовым только если не ухудшает drag.

Обязательные правила:

- один `WebGLRenderer`, один animation loop, одна камера Земли;
- pixel ratio ограничен конфигом, ориентир `min(devicePixelRatio, 1.5)`;
- никаких `new Vector3`, новых массивов, геометрий и материалов в горячем кадре/`pointermove`;
- particles и packet dots берутся из pool; повторяющиеся элементы — `InstancedMesh` или одна `Points`-геометрия;
- линии не пересоздаются каждый кадр, если их control points не изменились;
- shader uniforms меняются без замены материала;
- resize render targets выполняется только при реальном изменении viewport;
- bloom применяется к нужным emissive-объектам/слоям, а не высветляет всю Землю;
- offscreen/невидимые эффекты ставятся на паузу;
- `prefers-reduced-motion: reduce` отключает camera fly-through, particles trails, shockwave и stagger, сохраняя мгновенную читаемую смену состояния;
- low-quality preset должен отключать aberration, уменьшать particles и render scale, но не менять игровые радиусы и hit-testing.

Если сцена начинает выходить за budget, сначала измерить draw calls, shader programs, render target resolution и allocations; только затем добавлять worker/offscreen/WebGPU архитектуру.

## 8. Визуальная проверка

Ручная проверка пользователя остается главным критерием ощущения drag, глубины и композиции. Автоматизация полезна для того, что машина проверяет надежнее человека:

- фиксированные кадры пяти экранов в design viewport;
- `dropped`, `waking`, `linked`, `wrong`, `success` в заранее заданные моменты timeline;
- отсутствие Земли за пределами game-frame во всех состояниях, кроме CTA;
- footer показывает пространственный порядок, а не историю drag;
- после cancel/interruption нет зависших inline styles, postprocessing preset или audio loop.

[Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) может сохранять последовательность действий и состояния при редких drag-багax. Screenshot comparisons стоит запускать с отключенными случайными звездами, фиксированным временем shader uniforms и постоянным viewport, иначе тесты будут шумными.

## 9. Рекомендуемый порядок внедрения

### Этап 1 — motion foundation

- создать четыре project-local skills;
- ввести motion tokens и семантический FX event bus;
- вынести текущие переходы state-классов в единый `FxDirector`;
- зафиксировать reduced-motion и interrupt/cancel rules;
- не менять внешний вид игры, пока не стабилизирована архитектура.

### Этап 2 — хореография и state transitions

- добавить GSAP и официальный GSAP skill;
- собрать timeline пяти экранов;
- сделать плавные `dropped → waking → active`, camera settle и fade иконок в неподвижных слотах footer;
- проверить, что drag остается 1:1 с курсором и не зависит от timeline.

### Этап 3 — signal VFX

- добавить `postprocessing` и effects config/schema;
- реализовать selective bloom, packet flow, drop shockwave и локальный wrong feedback;
- все радиусы, соседство и правильность брать только из существующей игровой модели;
- добавить quality presets.

### Этап 4 — sound и cinematic polish

- добавить Howler.js и audio sprites;
- синхронизировать звук с FX event bus;
- отполировать onboarding/success/end;
- Theatre.js рассматривать только если ручное редактирование cinematic camera действительно ускоряет производство.

### Этап 5 — profiling и regression

- захватить тяжелые кадры Spector.js;
- добавить фиксированные visual checkpoints и trace для drag;
- утвердить budgets на draw calls, particles, render targets и frame time;
- после измерений решить, нужен ли BVH или WebGPU-прототип.

## 10. Что не рекомендуется сейчас

- переписывать игру на React/R3F только ради эффектов;
- одновременно ставить GSAP и Motion;
- подключать большой particle engine до исчерпания `Points`/`InstancedMesh`;
- переводить production renderer на WebGPU до отдельного compatibility-прототипа;
- делать gameplay-зависимость от завершения timeline;
- создавать отдельный animation loop для каждого эффекта;
- использовать blur/glitch/bloom как постоянный декоративный слой;
- тянуть shaders с CDN: проект должен оставаться переносимым и работать после архивирования папки `app`;
- включать LYGIA или другой shader pack без проверки коммерческой лицензии;
- массово устанавливать сторонние skills или исполнять их scripts без аудита.

## 11. Итоговый shortlist

**Установить/внедрить первыми:**

1. Собственные `x-sputnik-*` skills.
2. [GSAP Skills](https://github.com/greensock/gsap-skills).
3. [GSAP](https://github.com/greensock/GSAP).
4. [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing).

**Добавить вторым эшелоном:**

5. [Howler.js](https://github.com/goldfire/howler.js).
6. [Spector.js](https://github.com/BabylonJS/Spector.js) — development only.
7. Playwright visual/trace checks — только для фиксированных контрольных состояний.

**Держать как опции, не включать сейчас:**

8. [Theatre.js](https://github.com/theatre-js/theatre).
9. [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh).
10. [React Three Fiber](https://github.com/pmndrs/react-three-fiber).
11. [Three.js TSL/WebGPU VFX](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language).
12. [LYGIA](https://github.com/patriciogonzalezvivo/lygia) — только после проверки лицензии.

Такой план увеличивает сложность и выразительность анимаций, не меняя уже принятую модель одной Земли, переносимой папки `app`, JSON-конфигурации миссий и UI-shell и не возвращая визуальные эффекты внутрь gameplay reducer-а.
