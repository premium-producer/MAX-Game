# Архитектура Earth-render для повторения целевого референса

Дата: 2026-09-06  
Статус: реализована в runtime; ожидается locked-camera visual QA  
Область: `app/src/webgl-field.js`, Earth-style config/editor, postprocessing и visual QA  
Основание: [`EARTH_CURRENT_VS_REFERENCE.md`](./EARTH_CURRENT_VS_REFERENCE.md), [`EARTH_REFERENCE_IMPLEMENTATION_RESEARCH.md`](./EARTH_REFERENCE_IMPLEMENTATION_RESEARCH.md), [`CITY_LIGHTS_REALTIME_RESEARCH.md`](./CITY_LIGHTS_REALTIME_RESEARCH.md)

## 1. Цель документа

Документ фиксирует не отдельный набор «красивых значений», а систему рендера, в которой референс достижим и остаётся управляемым:

- тёмная детальная steel/navy-поверхность без молочно-голубой плёнки;
- атмосфера только у силуэта и с плавным уходом в космос;
- тонкое холодно-белое ядро SVG-контура России с контролируемым bloom;
- дискретные контрастные оранжевые города с горячими центрами;
- одинаковая оптическая конструкция света у контура и городов;
- отсутствие flicker, UV-smear, запечённого glow и прохождения контура через игровые иконки.

Архитектура является контрактом для дальнейших правок. Значения интенсивностей остаются предметом locked-camera настройки, но порядок проходов, пространства цвета, владение слоями и performance-гейты менять без отдельного решения нельзя.

## 2. Ограничения текущей сборки

Сохраняются обязательные инварианты X-SPUTNIK:

- один `WebGLRenderer`, одна perspective-camera и один application RAF;
- одна постоянная Земля между `CTA`, `ONBOARDING`, `MISSION_SELECT`, `MISSION_PLAY` и `END`;
- та же 3D-география, camera/orbit controls, frame mask и presentation offset;
- gameplay определяет координаты, радиусы, соседей и валидность маршрута; FX не меняет правила;
- runtime использует только локальные assets из `app/`;
- в steady-state RAF, pointermove и link-update не создаются новые объекты;
- foreground с нодами, A/Б, маркерами, связями и drag-guide не участвует в bloom и всегда закрывает контур;
- целевой бюджет — стабильные `16.7 ms` на основном Full HD-стенде.

Не входят в задачу:

- замена Земли видео, PNG или вторым canvas;
- физически полная Rayleigh/Mie-атмосфера;
- переход на WebGPU, React/R3F или новый render engine;
- процедурное восстановление географии огней без intensity-map;
- 8K-текстуры как первый способ вернуть детализацию.

## 3. Зафиксированное текущее состояние

| Узел | Сейчас | Архитектурная проблема |
|---|---|---|
| Renderer | ACES, exposure `1.08`, sRGB output | основная сцена tone-map'ится до наложения halo |
| Surface | высокий постоянный light floor, `coolSurface + 0.24` | тени уже светлые до cloud/spec/haze |
| Surface haze | содержит центральный вклад `0.12` и заменяет цвет через `mix` | cyan распространяется по центру диска |
| Atmosphere plane | фиксированные пороги `0.76–1.0` | часть additive halo физически лежит внутри силуэта |
| City core | часть Earth fragment shader | проходит surface tone mapping до текущего overlay |
| Border core | отдельная `borderCoreScene`, рисуется после overlay | не проходит тот же путь, что city core |
| Halo | selective HalfFloat composer + display-space Screen overlay | source clamp/chroma normalization разрушают HDR-энергию |
| Bloom size | composer cap `960×540` | первый bright mip `UnrealBloomPass` фактически около `480×270` |
| Radius controls | city `18`, border `22`, runtime берёт `max()` | два UI-контрола не дают двух независимых радиусов |
| Foreground | последний прямой render | корректно закрывает контур; это поведение нужно сохранить |

## 4. Архитектурные решения

### ADR-01. Сохраняем текущую runtime-топологию

Мы расширяем `createWebGLField()`, а не создаём параллельный renderer. Earth, camera controls, resize, state transitions и public API остаются прежними. Новые ресурсы создаются один раз при инициализации и освобождаются в существующем `dispose()`.

### ADR-02. Мир рендерится в одном linear HDR target

Основная Земля, звёзды, атмосфера и border core рендерятся в один полноразмерный `HalfFloat` target с depth-buffer. До финального вывода в нём нет tone mapping и sRGB-transfer.

Причина выбора одного ручного target вместо второго полноразмерного `EffectComposer`:

- не нужен второй ping-pong target на 4K;
- depth основной Земли сохраняется во время линейного добавления bloom;
- border core можно глубинно окклюдировать той же сферой;
- lifecycle и resize остаются явными.

### ADR-03. Bloom складывается как световая энергия

Selective composer сохраняется только как генератор multi-mip blur. Его RGB texture складывается в world-target обычным linear addition:

```glsl
vec3 bloom = texture2D(uBloomMap, vUv).rgb;
gl_FragColor = vec4(bloom * uEmissiveBloomStrength, 1.0);
```

Fullscreen material использует `AdditiveBlending`, не очищает target, не пишет depth и не содержит:

- Screen blending;
- `clamp(source, 0.0, 1.0)`;
- деления RGB на максимальный канал;
- искусственного `pow(..., 0.68)`;
- `colorspace_fragment` или `tonemapping_fragment`.

### ADR-04. Цветовой output для мира выполняется один раз

После сведения surface + core + bloom вызывается один `OutputPass`, использующий настройки renderer для tone mapping и sRGB transfer. На первом проходе сохраняется `ACESFilmicToneMapping`; `NeutralToneMapping` допускается только как locked-camera A/B-гейт.

Gameplay foreground остаётся display-referred overlay после `OutputPass`, как в текущей сборке. Его материалы с `toneMapped: false` сохраняют UI-палитру и не попадают в bloom. Это осознанное разделение:

- HDR world получает один общий output transform;
- функциональный foreground получает только обычный canvas color-space output своих материалов.

### ADR-05. Foreground гарантированно последний и снова получает depth

После fullscreen `OutputPass` depth default framebuffer очищается. Перед gameplay foreground в отдельном минимальном occlusion-pass рендерится depth-only сфера Земли с той же геометрией и rotation. Затем рисуется `gameplayForegroundScene`.

Это одновременно обеспечивает:

- border core и halo не видны через тёмные подложки иконок;
- маркеры обратной стороны не проступают через Землю;
- UI не подвергается bloom/tone mapping мира;
- не требуется копировать depth между render targets.

### ADR-06. Контур и города используют общий оптический pipeline

Для обоих источников действует один порядок:

```text
sharp source -> compact HDR core -> lower-energy colored emitter
             -> shared multi-mip bloom -> linear add -> world output
```

Общими являются pipeline, bloom radius и характер falloff. Различаются:

- источник формы: SVG geometry у контура, scalar data-map у городов;
- hue: холодно-белый/голубой против orange/warm-white;
- площадь и пороги source;
- энергия core и emitter.

### ADR-07. Текстуры хранят данные, а не готовый эффект

- `Earth_Diffuse_4K.jpg` — color texture, `SRGBColorSpace`;
- illumination/specular/normal — data textures, `NoColorSpace`;
- `Earth_Illumination_Core_4K.webp` остаётся sharp scalar mask;
- размытой city glow-map и увеличенной прозрачной sphere нет;
- SVG остаётся единственным источником формы контура.

### ADR-08. Новый контракт конфигурации — schema v7

Новые параметры становятся частью portable config, parser, JSON Schema и editor. Shader magic numbers для новых систем не допускаются. Старые v1–v6 читаются через defaults/migration; при сохранении editor пишет v7.

## 5. Целевой render graph

```text
                         sharp city mask
                              |
Russia SVG -------------------+-------------------------+
   |                                                    |
   |        selectiveEmissiveScene (HalfFloat)          |
   |        - depth-only Earth                          |
   +------> - cold border emitter                       |
            - orange city emitter                       |
                         |                              |
                         v                              |
                  UnrealBloomPass                       |
                  capped mip chain                      |
                         |                              |
                         v                              |
scene ----------------> earthHdrTarget <--- linear additive overlay
- stars                  HalfFloat + depth
- Earth surface                 |
- city compact core             v
- clipped atmosphere        OutputPass
- border compact core            |
                                v
                              canvas
                                |
                         clear depth only
                                |
                   foreground depth-only Earth
                                |
                                v
                    gameplayForegroundScene
                    links / mission markers /
                    nodes / A-Б / drag guide
```

### Порядок одного кадра

1. Обновить controls, camera, scene uniforms, node/link state без allocations.
2. Если emissive bloom активен — отрендерить `selectiveEmissiveScene` в capped composer.
3. Установить `earthHdrTarget`, очистить color/depth и отрендерить `scene`.
4. Не очищая target, линейно добавить bloom texture fullscreen-проходом.
5. Выполнить `OutputPass` из `earthHdrTarget` в canvas.
6. Очистить только depth default framebuffer.
7. Записать depth-only Earth для окклюзии gameplay.
8. Последним отрендерить `gameplayForegroundScene`.

Если bloom выключен, шаги 2 и 4 пропускаются; core, поверхность, атмосфера и foreground продолжают работать.

## 6. Владение сценами и слоями

| Сцена/ресурс | Содержимое | Depth | Bloom | Output |
|---|---|---|---|---|
| `scene` | stars, Earth surface, atmosphere, border core | общий world depth | нет | через `OutputPass` |
| `selectiveEmissiveScene` | depth-only Earth, city emitter, border emitter | собственный depth | да | только texture |
| `earthHdrTarget` | сведённый linear HDR world | сохраняется до world output | принимает linear add | источник `OutputPass` |
| `foregroundOcclusionScene` | только Earth depth sphere | пишет depth canvas | нет | color write off |
| `gameplayForegroundScene` | links, mission markers, nodes, endpoints, drag guide | проверяет свежий Earth depth | нет | прямой UI output |

Объекты не дублируются между смысловыми сценами, кроме дешёвых depth-only Earth meshes, которые переиспользуют `earth.geometry`.

## 7. Surface shading contract

### 7.1. Тональная модель

Surface строится из уже декодированного linear diffuse без постоянной cyan-добавки:

```glsl
vec3 texel = texture2D(uDayMap, vEarthUv).rgb;
vec3 graded = pow(max(texel, vec3(0.0)), vec3(uSurfaceGamma));
float luma = dot(graded, vec3(0.2126, 0.7152, 0.0722));
graded = mix(vec3(luma), graded, uSaturation);
graded = max((graded - 0.18) * uSurfaceContrast + 0.18, 0.0);

float light = uAmbientIntensity
  + uDayIntensity * mix(0.08, 1.0, lambert);
vec3 surface = graded
  * mix(uNightTint, uDayTint, daylight)
  * light
  * uSurfaceExposure;
```

Запрещено возвращать старые константы `0.48`, `0.24` или иной глобальный light floor для визуального «спасения» деталей.

### 7.2. Детали

- cloud term — ограниченный нейтрально-холодный accent, слабее emissive core;
- specular — узкий ocean highlight, отдельно управляемый;
- normal map меняет направление света, но не компенсирует экспозицию;
- surface haze добавляет энергию только у края и стремится к нулю при `viewFacing -> 1`;
- fog применяется в linear world до финального output.

### 7.3. Начальная область настройки

| Параметр | Стартовая область |
|---|---:|
| `surfaceExposure` | `0.65–0.85` |
| `surfaceGamma` | `1.12–1.32` |
| `surfaceContrast` | `1.08–1.24` |
| `dayIntensity` | `0.55–0.72` |
| `ambientIntensity` | `0.10–0.18` |
| `cloudHighlights` | `0.12–0.24` |
| `specularIntensity` | `0.12–0.24` |

Это диапазоны первого locked-camera A/B, а не финальные обещанные числа.

## 8. Atmosphere contract

### 8.1. Surface rim

Внутренний haze не заменяет diffuse голубым цветом:

```glsl
float rim = pow(1.0 - viewFacing, uHazePower);
float haze = rim * uHazeIntensity * mix(uHazeNightFloor, 1.0, daylight);
outgoingLight += uHazeColor * haze;
```

В центре диска вклад обязан сходиться к нулю.

### 8.2. Outer halo

Camera-facing plane сохраняется, но её внутренний порог вычисляется из текущей геометрии камеры, а не задан константой. Для plane half-size `P`, Earth radius `R` и расстояния от camera до центра `d` радиус касательного силуэта в координатах plane:

```text
discRadius = (R * d / sqrt(d^2 - R^2)) / P
```

Значение обновляется in-place при движении камеры. Shader использует:

```glsl
float inner = smoothstep(uDiscRadius, uDiscRadius + uInnerFeather, radius);
float outer = 1.0 - smoothstep(
  uDiscRadius + uInnerFeather,
  uDiscRadius + uOuterFeather,
  radius
);
float halo = inner * outer;
```

Условия:

- alpha равна нулю внутри silhouette;
- `innerFeather < outerFeather`;
- halo мягко уходит в фон и не образует сплошную голубую дугу;
- optional `sunBias` модулирует интенсивность, но не нарушает silhouette clip.

## 9. Emissive contract

### 9.1. Общая city-mask функция

Одинаковое вычисление `citySource`, daylight visibility и limb fade должно использоваться в Earth core shader и selective emitter shader. Оно оформляется одним JS GLSL-snippet/helper, чтобы два прохода не разошлись после следующих правок.

Сохраняются:

- `NoColorSpace`;
- mipmaps + `LinearMipmapLinearFilter`;
- anisotropy в пределах текущего cap;
- LOD bias `0.75`;
- derivative-aware AA `max(fwidth(raw) * 1.5, 2.0 / 255.0)`;
- одинаковые day visibility и limb limits в обоих проходах.

### 9.2. Города

```glsl
float warmCore = smoothstep(uCityCoreStart, 1.0, citySource);
float hotCore = smoothstep(uCityHotPoint, 1.0, citySource);
float haloSource = smoothstep(uCityGlowStart, 1.0, citySource);

vec3 cityEmission =
    uCityColor * warmCore * uCityIntensity
  + uCityHotColor * hotCore * hotCore * uCityHotIntensity;
```

Selective emitter получает `haloSource`, а не весь слабый фон mask. Площадь пятна регулируется threshold, энергия — intensity; эти параметры нельзя подменять друг другом.

### 9.3. Контур

- `LineSegments2` остаётся full-resolution screen-space core;
- его color — холодный white tint с linear RGB multiplier `borderCoreIntensity > 1`;
- emitter использует ту же geometry, немного большую linewidth и меньшую холодно-синюю энергию;
- raster glow texture, геометрические «толстые копии» и внутренняя тень не используются.

### 9.4. Общий bloom

В schema v7 остаются осознанные общие параметры:

- `emissiveBloomRadius`;
- `emissiveBloomStrength`;
- `emissiveBloomQuality`.

Старые `cityLightsGlowRadius` и `borderGlowRadius` читаются только при миграции v6; v7 их не сохраняет. Первый migrated radius равен `max(oldCityRadius, oldBorderRadius)`.

Два независимых bloom stream допускаются только если locked-camera QA и GPU-замер докажут, что общий radius не позволяет одновременно сохранить тонкую линию и дискретные города.

## 10. Bloom quality contract

`UnrealBloomPass` начинает bright target с половины входного размера. Поэтому quality задаёт размер входа selective composer, а не желаемого первого mip:

| Preset | Composer input cap | Первый bright mip | Назначение |
|---|---:|---:|---|
| `high` | `1920×1080` | около `960×540` | основной Full HD-стенд и 4K canvas |
| `medium` | `1280×720` | около `640×360` | degraded GPU path |
| `off` | не рендерится | нет | core-only fallback |

Основной drawing buffer и gameplay geometry от preset не меняются. Resize происходит только при изменении viewport/DPR/preset, не в RAF.

## 11. Schema v7: целевой набор artist controls

### Новые поля

| Поле | Диапазон/тип | Назначение |
|---|---|---|
| `surfaceExposure` | `0–2` | локальная экспозиция поверхности |
| `surfaceGamma` | `0.5–3` | положение средних тонов |
| `surfaceContrast` | `0.5–2` | separation вокруг linear pivot |
| `cityLightsHotIntensity` | `0–6` | энергия малого warm-white центра |
| `cityLightsCoreStart` | `0–1` | порог обычного orange core |
| `cityLightsGlowStart` | `0–1` | порог допуска в bloom source |
| `borderCoreIntensity` | `0–6` | HDR-энергия белого core |
| `emissiveBloomRadius` | `0–64` | общий multi-mip radius |
| `emissiveBloomStrength` | `0–2` | linear composite multiplier |
| `emissiveBloomQuality` | `high/medium/off` | resolution budget |
| `atmosphereInnerFeather` | `0.001–0.25` | узкий переход у silhouette |
| `atmosphereOuterFeather` | `0.01–0.5` | внешний falloff |
| `atmosphereSunBias` | `0–1` | light-side modulation |

### Сохраняемые поля

Текущие tint, day/ambient/saturation, city colors/intensities/black-white/gamma/hot/day/limb, terminator, specular, normal, cloud, haze, border color/intensity/width и atmosphere color/intensity/power сохраняются.

### Удаляемые из v7 поля

- `cityLightsGlowRadius`;
- `borderGlowRadius`.

`cityLightsGlowIntensity` и `borderGlowIntensity` остаются как независимая энергия двух emitter sources; общий `emissiveBloomStrength` управляет итоговым сложением.

## 12. Debug и deterministic comparison

Архитектура предусматривает внутренний debug mode без второго RAF или пересоздания материалов:

- `final`;
- `surfaceOnly`;
- `atmosphereOnly`;
- `cityCore`;
- `cityBloomSource`;
- `borderCore`;
- `borderBloomSource`;
- `bloomCombined`;
- `haloSilhouetteGuard` — outer halo красный, внутри globe не должно быть красного.

Для контрольного сравнения фиксируются state, camera rotation/target/distance/FOV, viewport, DPR и idle sway. Debug mode не обязан входить в production UI; достаточно dev-query/config hook и uniform visibility switches.

## 13. Lifecycle и public API

Сохраняются текущие `setEarthStyle()`, `setViewState()`, `setEarthOrbitPreferences()`, resize и `dispose()`.

Новые ресурсы:

- `earthHdrTarget`;
- `OutputPass`;
- linear additive fullscreen geometry/material/scene;
- `foregroundOcclusionScene` и depth-only Earth mesh;
- переименованные selective composer/pass/material variables.

Требования:

- `setEarthStyle()` меняет uniforms/pass properties in-place;
- quality resize выполняется только при style/viewport change;
- target, pass, fullscreen geometry/material и новые depth materials освобождаются;
- shared Earth/border geometry не dispose'ится дважды;
- при `document.hidden` сохраняется текущая политика остановки декоративной работы;
- shader compilation и texture upload не происходят во время первого drag.

## 14. Performance budget

Обязательные гейты:

- Full HD total frame `<=16.7 ms` на целевой машине;
- bloom input `<=1920×1080` даже при 4K canvas;
- один full-resolution HalfFloat world target, без второго full-resolution ping-pong composer;
- не включать MSAA у HalfFloat target без измерения;
- нулевые allocations в обычном RAF/pointermove;
- `medium` снижает только bloom resolution;
- `off` сохраняет core и gameplay;
- второй bloom composer запрещён до отдельного профиля.

При performance-регрессии порядок действий: устранить пересоздания/overdraw/лишние passes, затем перейти `high -> medium -> off`; не снижать географическую точность, радиусы gameplay или drag responsiveness.

## 15. Запрещённые обходные решения

- pre-blurred city glow texture;
- Screen/overlay blending после tone mapping;
- normalizing bloom chroma и clamp HDR-source в `0–1`;
- temporal accumulation, создающий trails при drag/idle sway;
- широкий cyan layer поверх всего диска;
- несколько расширенных border geometries вместо screen-space core + bloom;
- усиление ambient, normal или artificial sharpening вместо восстановления тонов;
- второй renderer/canvas/RAF;
- отдельные radius controls, которые runtime снова сводит к `max()` без явного контракта.

## 16. Definition of Done

Архитектура считается реализованной, когда одновременно выполнено следующее:

1. Surface-only кадр имеет глубокие navy/steel тени и читаемые средние детали.
2. Центральный atmosphere contribution стремится к нулю; outer halo не пересекает силуэт.
3. Border core — тонкий холодно-белый HDR, halo — мягкий синий без утолщения формы.
4. City core — дискретный orange, сильные точки имеют warm-white center, слабый фон не попадает в bloom.
5. Border и cities воспринимаются одним классом света при разных hue/масштабе.
6. Огни не flicker при idle sway и медленном drag; на горизонте нет orange smear.
7. Контур и его halo не видны через mission/node/endpoints backdrops.
8. `high`, `medium`, `off` не меняют gameplay и не пересоздают renderer.
9. Parser принимает v1–v7, editor сохраняет v7, portable build содержит schema/config/assets.
10. Syntax, unit, build и portable checks проходят; lifecycle не оставляет WebGL resources.
