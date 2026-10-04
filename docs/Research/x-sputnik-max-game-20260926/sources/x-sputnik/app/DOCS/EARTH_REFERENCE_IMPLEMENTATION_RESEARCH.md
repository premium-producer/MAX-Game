# Ресерч реализации Земли по целевому референсу

Дата: 2026-09-06  
Статус: рекомендации перенесены в runtime schema v7; ожидается visual tuning по locked-camera кадрам  
Основа: [`EARTH_CURRENT_VS_REFERENCE.md`](./EARTH_CURRENT_VS_REFERENCE.md), текущий `webgl-field.js`, пользовательские current/reference кадры и первичные материалы Three.js, Khronos и NVIDIA.

## Короткий ответ

Повторить референс в текущей Three.js-архитектуре возможно без замены Земли на видео или PNG, без запекания glow и без второго canvas. Однако закрыть все visual gaps только изменением нескольких intensity-параметров не получится.

Нужны четыре связанных изменения:

1. Перевести сведение поверхности, emissive и bloom в один линейный HDR-пайплайн с единственным tone mapping и sRGB-преобразованием в конце.
2. Пересобрать тональную модель Земли: тёмная стально-синяя база, отдельные средние детали и ограниченные белые акценты вместо общей cyan-заливки.
3. Убрать атмосферный слой из центра диска: surface haze должен начинаться от view-dependent края, а широкий halo — существовать только снаружи силуэта.
4. Дать контуру и городам одну оптическую конструкцию: компактное HDR-ядро, цветной переход и общий realtime bloom. Различаться должны hue, форма и энергия источника, а не принцип композиции.

Рекомендуемая последовательность критична: **сначала linear/HDR и поверхность, затем атмосфера, затем emissive FX**. Если настраивать огни и контур поверх выбеленной базы, после исправления экспозиции их придётся переделывать ещё раз.

## Что показал аудит текущего runtime

### 1. Поверхность уже слишком яркая до атмосферы

Текущий `surfaceLight` вычисляется так:

```glsl
0.48 + ambientIntensity + dayIntensity * (0.16 + 0.84 * lambert)
```

При действующих значениях `ambientIntensity = 0.32` и `dayIntensity = 0.9` диапазон множителя равен примерно `0.944–1.70`. То есть даже участок без прямого Lambert-света почти не затемняется. После этого shader дополнительно добавляет cloud highlight, ocean specular и haze. Получившаяся светлая база оставляет слишком мало динамического диапазона белому контуру и тёплым городам.

Дополнительно `coolSurface` содержит постоянную светлую добавку `0.24`, а haze имеет ненулевую центральную составляющую `0.12`. Обе константы поднимают тени по всей видимой сфере, хотя в референсе голубой свет должен концентрироваться у горизонта и в светлых деталях.

### 2. Финальное сведение выполняется не как единый HDR-кадр

Сейчас основная сцена рендерится напрямую в canvas и получает ACES tone mapping + sRGB conversion внутри материалов. Затем bloom накладывается отдельным fullscreen overlay через custom Screen blending, а белое ядро границы рисуется ещё одним проходом после overlay.

Итог:

- поверхность уже display-referred, когда к ней добавляется halo;
- overlay нормализует цвет через деление на максимальный RGB-канал и обрезает energy в `0–1`;
- Screen blending математически не соответствует сложению световой энергии;
- ядро границы и ядро городов проходят разный путь до дисплея.

Официальное руководство Three.js требует выполнять lighting/compositing в Linear-sRGB и оставлять output conversion на конец. При postprocessing эту роль выполняет `OutputPass`: [Three.js Color Management](https://threejs.org/manual/en/color-management.html), [OutputPass](https://threejs.org/docs/pages/OutputPass.html). То же правило формулирует NVIDIA: промежуточные postprocess-операции должны работать до последней gamma/output-коррекции, желательно во float-буфере: [GPU Gems 3 — The Importance of Being Linear](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-24-importance-being-linear).

### 3. Контур и города используют общий blur, но разные ядра

Контур получает отдельную почти белую `LineSegments2` после рендера Земли. Городское ядро смешивается с `outgoingLight` внутри Earth shader и tone-map'ится вместе с поверхностью. Поэтому общий `UnrealBloomPass` не делает их одним эффектом: core, порядок слоёв и локальный контраст остаются разными.

### 4. Настроенные радиусы bloom сейчас фактически не независимы

В конфигурации существуют `borderGlowRadius` и `cityLightsGlowRadius`, но runtime передаёт в один `UnrealBloomPass` только максимум из двух значений. Это означает, что оба источника всегда получают один blur-kernel. Художник видит два контрола, но не получает двух независимых радиусов.

Для задачи «тот же принцип свечения» это можно превратить в преимущество: оставить **один осознанно общий радиус**, а различие масштаба строить размером/энергией источника. Если после контрольных кадров окажется, что городу и линии принципиально нужны разные пространственные радиусы, только тогда добавлять второй bloom stream.

### 5. Реальное разрешение bright-source ниже заявленного

Runtime ограничивает вход `EffectComposer` значением `960×540`. Но `UnrealBloomPass` внутри создаёт `renderTargetBright` уже в половине входного разрешения и затем строит ещё пять уменьшающихся mip-уровней. Поэтому на Full HD первый реальный bright-source сейчас около `480×270`, а не `960×540`.

Это особенно плохо для городов: один bright texel представляет сразу несколько экранных пикселей и при движении камеры может появляться/исчезать между кадрами. NVIDIA отдельно описывает flicker тонких glow-источников при слишком раннем downsample и рекомендует качественно фильтровать source до blur: [GPU Gems — Real-Time Glow](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-21-real-time-glow). `UnrealBloomPass` действительно использует half-float mip-chain и несколько радиусов blur, но качество зависит от входного разрешения: [Three.js UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html).

### 6. Внешний halo частично лежит внутри глобуса

Камера-ориентированная atmosphere-plane имеет размер `2.36R`. В её локальной радиальной координате проекция Земли находится примерно у `0.847`, тогда как текущий `innerFade` начинается с `0.76` и заканчивается на `0.86`. Значительная часть additive-полосы поэтому физически накладывается поверх поверхности — это прямой источник молочно-голубой вуали у края и справа.

Полное физическое моделирование атмосферы здесь не обязательно. GPU-реализации атмосферного рассеяния действительно интегрируют плотность вдоль camera ray и разделяют Rayleigh/Mie-компоненты, но для данного стилизованного референса достаточно дешёвой view/light-dependent аппроксимации с корректным силуэтом: [GPU Gems 2 — Accurate Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering).

## Рекомендуемая архитектура

```text
sharp color/data textures
        |
        +--> main scene (linear HDR)
        |      Earth surface
        |      city compact core
        |      border compact core
        |      clipped atmosphere
        |
        +--> selective emissive scene (linear HDR, HalfFloat)
               depth-only Earth
               city halo source
               border halo source
                         |
                         v
                  UnrealBloomPass
                         |
                         v
main linear frame + linear bloom (ordinary additive sum)
                         |
                         v
                gameplay foreground pass
                         |
                         v
          OutputPass: tone mapping + sRGB once
                         |
                         v
                       canvas
```

Архитектура повторяет официальный selective-bloom пример Three.js: отдельный bloom composer, linear additive `baseTexture + bloomTexture`, затем `OutputPass`: [Three.js selective Unreal bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html).

Сохраняются проектные инварианты:

- один `WebGLRenderer`;
- одна perspective-camera;
- одна Земля и одна геометрия источников;
- один application RAF;
- отсутствие runtime-загрузок извне;
- foreground не участвует в bloom и остаётся поверх контура.

## Этап 0. Детерминированное сравнение

До художественной настройки нужен режим контрольного кадра:

- фиксированные `state`, camera rotation/target/distance/FOV, viewport и DPR;
- временно нулевая idle-sway добавка без изменения сохранённого camera view;
- одинаковый момент после загрузки texture/shader;
- debug-варианты `surface only`, `atmosphere only`, `city core`, `city bloom source`, `border core`, `border bloom source`, `final`;
- возможность временно выключить каждый слой через уже существующий style update, без пересоздания сцены.

Иначе изменение ракурса будет ошибочно восприниматься как изменение толщины линии, плотности света или детализации текстуры.

## Этап 1. Единый linear HDR composite

### Что изменить

1. Добавить `ShaderPass` и `OutputPass`.
2. Оставить selective-emissive scene и HalfFloat bloom target.
3. Основную сцену рендерить в linear HDR через final composer/target.
4. Заменить текущий `borderGlowOverlayMaterial` с Screen blending на простой линейный composite:

```glsl
vec3 base = texture2D(baseTexture, vUv).rgb;
vec3 bloom = texture2D(bloomTexture, vUv).rgb;
gl_FragColor = vec4(base + bloom * uBloomStrength, 1.0);
```

5. Добавить `OutputPass` строго последним цветовым проходом.
6. Перенести border core до `OutputPass`, чтобы его HDR-white проходил тот же tone mapping, что city hot-core.
7. Foreground отрисовать поверх сведённого linear кадра до `OutputPass` отдельным `RenderPass` с `clear=false` и при необходимости `clearDepth=true`. Это сохраняет правило «контур под иконками».
8. Удалить chroma-normalization, `clamp(source, 0, 1)`, `pow(..., 0.68)` и display-space Screen blend из финального halo-composite.

### Почему это закроет gaps

- bloom перестанет выбеливать всю сцену нелинейным Screen-смешением;
- orange и cyan сохранят энергию и насыщенность до tone mapping;
- border core и city core станут частью одной экспозиции;
- станет возможным затемнить Землю, не превращая белый контур в серый — HDR core можно держать выше `1.0`, а `OutputPass` аккуратно сожмёт highlight.

### Tone mapping

Первый проход следует сделать на текущем `ACESFilmicToneMapping`, но снизить exposure после исправления поверхности. Параллельно полезно проверить `NeutralToneMapping`: официальный selective-bloom пример Three.js использует его, и для графичного холодно-оранжевого референса он может сохранять chroma чище. Это A/B-гейт, а не автоматическая замена: выбирать нужно по одинаковым контрольным кадрам.

## Этап 2. Тёмная, но детальная поверхность

### Почему простого уменьшения `dayIntensity` недостаточно

Текущий shader смешивает исходную текстуру с искусственно поднятым `coolSurface`, содержит высокий постоянный ambient floor и затем добавляет cloud/specular/haze. Одно уменьшение финального exposure затемнит также контур и огни, но не восстановит разделение тонов.

### Предлагаемая модель

Работать с уже декодированным linear-sRGB diffuse:

```glsl
vec3 texel = texture2D(uDayMap, vEarthUv).rgb;
float luma = dot(texel, vec3(0.2126, 0.7152, 0.0722));

vec3 graded = pow(max(texel, vec3(0.0)), vec3(uSurfaceGamma));
float gradedLuma = dot(graded, vec3(0.2126, 0.7152, 0.0722));
graded = mix(vec3(gradedLuma), graded, uSaturation);
graded = (graded - vec3(0.18)) * uSurfaceContrast + vec3(0.18);

vec3 tint = mix(uNightTint, uDayTint, daylight);
float light = uAmbientIntensity + uDayIntensity * mix(0.08, 1.0, lambert);
vec3 surface = max(graded, 0.0) * tint * light * uSurfaceExposure;
```

Ключевые свойства:

- нет постоянной светлой cyan-добавки;
- gamma/contrast меняют средние тона, а не только абсолютную яркость;
- diffuse остаётся color texture в `SRGBColorSpace` и автоматически декодируется в linear;
- normal/specular/city остаются `NoColorSpace`, как числовые data maps. Это соответствует официальной модели Three.js: [Color Management](https://threejs.org/manual/en/color-management.html), [Texture](https://threejs.org/docs/pages/Texture.html).

### Cloud и specular

- Cloud highlight должен быть ограниченным нейтрально-холодным акцентом, а не широкой additive-заливкой.
- Сначала сформировать surface, затем добавить небольшой cloud term и только затем узкий ocean specular.
- Яркость облаков не должна достигать border core; их задача — материал, не emissive.
- `normalStrength` не повышать до настройки тонов: normal map не возвращает контраст, если его уничтожила экспозиция.

### Стартовые диапазоны для A/B, не финальные значения

| Параметр | Текущее | Стартовый диапазон исследования |
|---|---:|---:|
| `toneMappingExposure` | `1.08` | `0.72–0.88` |
| `dayIntensity` | `0.90` | `0.55–0.72` |
| `ambientIntensity` | `0.32` | `0.10–0.18` |
| новый `surfaceExposure` | отсутствует | `0.65–0.85` |
| новый `surfaceGamma` | отсутствует | `1.12–1.32` |
| новый `surfaceContrast` | отсутствует | `1.08–1.24` |
| `cloudHighlights` | `0.42` | `0.12–0.24` |
| `specularIntensity` | `0.26` | `0.12–0.24` |

Финальные числа выбираются только по locked-camera кадрам. Они не являются обещанием pixel-perfect результата сами по себе.

## Этап 3. Атмосфера без голубой плёнки

### Surface haze

Убрать постоянный центральный вклад:

```glsl
float rim = pow(1.0 - viewFacing, uHazePower);
float sunGate = mix(uHazeNightFloor, 1.0, daylight);
float haze = rim * uHazeIntensity * sunGate;
outgoingLight += uHazeColor * haze;
```

В отличие от текущего `mix(outgoingLight, hazeTarget, hazeAmount)`, такой term не заменяет цвет поверхности голубым и строго стремится к нулю в центре диска.

### Внешний halo

Есть два безопасных варианта:

1. **Рекомендуемый:** сохранить дешёвую camera-facing plane, но вычислять её внутренний порог из реального projected globe radius и давать нулевую alpha внутри силуэта. Тогда blur находится только снаружи.
2. Увеличить BackSide atmosphere-shell и использовать две Fresnel-лопасти — узкую яркую и широкую слабую. Это геометрически корректнее, но широкий falloff труднее получить без дополнительного blur.

Для текущего проекта первый вариант дешевле и лучше управляется. Plane должна иметь:

- `uEarthScreenRadius` или эквивалентный локальный порог;
- `innerFeather` порядка нескольких экранных пикселей;
- более широкий `outerFeather`;
- optional `sunGate`, чтобы halo не был одинаковым по всей окружности;
- alpha `0` для уверенно внутренних пикселей.

Полноценная многошаговая Rayleigh/Mie-интеграция из GPU Gems здесь избыточна: референс стилизован и требует контролируемого силуэта, а не физического неба.

## Этап 4. Один визуальный язык контура и огней

### Общая модель

```text
source mask/geometry
   -> compact HDR core
   -> lower-energy colored bloom source
   -> shared multi-mip blur
   -> linear additive composite
   -> one tone mapping/output conversion
```

### Контур

- SVG остаётся единственным источником формы.
- Core остаётся `LineSegments2`, потому что его толщина должна быть screen-space стабильной.
- Core color — холодно-белый HDR, не чистый LDR `#ffffff`; например, artist-параметр `borderCoreIntensity` управляет множителем выше `1.0` до tone mapping.
- Bloom emitter повторяет ту же геометрию, но имеет меньшую энергию и холодный синий tint.
- Не добавлять широких геометрических дублей и raster glow-mask.

### Города

Разделить одну sharp intensity-маску на три диапазона:

```glsl
float source = cityMask(...);                         // география
float warmCore = smoothstep(coreStart, 1.0, source); // маленькая orange-точка
float hotCore = smoothstep(hotStart, 1.0, source);   // почти белый центр
float haloSource = smoothstep(glowStart, 1.0, source);// источник bloom

vec3 emission =
  uCityColor * warmCore * uCityCoreIntensity
  + uCityHotColor * hotCore * hotCore * uCityHotIntensity;
```

- `hotStart` должен быть выше core threshold, чтобы белый центр появлялся только у сильных городов.
- Bloom emitter получает `haloSource`, но не полный слабый фон карты.
- У слабых источников остаётся core без большого halo; плотные города дают hot-core и более заметный bloom.
- Day visibility применяется к core и bloom одинаково.
- Limb fade применяется до threshold/discard в обоих проходах.

Так огни получают ту же оптическую структуру, что контур, не переставая быть точечной географической сетью.

### Общий или раздельный radius

Рекомендуемый первый вариант — один `emissiveBloomRadius` для границы и городов. Он буквально закрепляет общий характер света; различие видимого размера получается из энергии и площади источника.

Если reference QA покажет, что общий radius не позволяет одновременно получить аккуратную линию и компактные города, второй этап — два low-resolution bloom composer:

- border stream с более широким холодным falloff;
- city stream с более коротким тёплым falloff;
- оба складываются в linear final composite до `OutputPass`.

Это дороже по GPU и допускается только после измерения на целевом Full HD-компьютере. MRT/custom dual-blur теоретически может объединить каналы, но усложняет shaders, lifecycle и portable QA; для трёх текущих типов источника такая сложность пока не оправдана.

## Этап 5. Стабильный bloom без фликера

### Исправить фактическое разрешение

Если желаемый первый bright-level равен максимум `960×540`, вход `UnrealBloomPass` должен быть максимум `1920×1080`, потому что pass делит его пополам до `renderTargetBright`.

Практический вариант:

- Full HD: selective composer input `1920×1080`, bright level `960×540`;
- 4K: всё равно cap input на `1920×1080`, чтобы bloom не рос до 4K;
- degraded preset: input `1280×720`, bright level `640×360`;
- не менять основной drawing buffer и игровую геометрию.

### Сохранить текущую устойчивость mask sampling

- `LinearMipmapLinearFilter`;
- mipmaps;
- `NoColorSpace` у intensity-map;
- небольшой положительный LOD bias;
- derivative-aware threshold через `fwidth()`;
- anisotropy только в разумном измеренном диапазоне.

Three.js документирует trilinear minification и anisotropy как механизм качества при уменьшении/наклонном sampling: [Texture](https://threejs.org/docs/pages/Texture.html). Khronos определяет `fwidth()` как сумму экранных производных, используемую для оценки filter width: [GLSL specification](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf).

### Не использовать temporal accumulation

GPU Gems описывает добавление прошлого glow-frame как способ скрыть aliasing, но для X-SPUTNIK это создаст шлейфы при drag и idle sway. Здесь правильнее повысить качество текущего bright-source и фильтрации. Temporal history не рекомендуется.

## Этап 6. Текстурная детализация

Текущие `4096×2048` diffuse/normal/specular достаточны для Full HD-кадра данного масштаба. Переход на runtime 8K не должен быть первым шагом: текущая потеря качества вызвана прежде всего поднятыми тенями и haze, а не нехваткой texel density.

Порядок проверки:

1. убрать cyan veil;
2. восстановить средний контраст;
3. оценить normal/specular в locked camera;
4. только если конкретные детали остаются texel-limited, сравнить 4K и 8K на целевом GPU с учётом startup/upload/memory.

Не повышать anisotropy или normal strength как замену тональной коррекции.

## Предлагаемые artist controls

Минимальное дополнение к `rendering.earth`:

| Параметр | Назначение |
|---|---|
| `surfaceExposure` | локальная экспозиция только материала Земли |
| `surfaceGamma` | положение средних тонов diffuse |
| `surfaceContrast` | разделение теней и светлых деталей вокруг linear pivot |
| `cityLightsHotIntensity` | независимая энергия компактного горячего центра |
| `cityLightsCoreStart` | порог обычного тёплого ядра |
| `cityLightsGlowStart` | порог допуска источника в bloom |
| `borderCoreIntensity` | HDR-энергия белого векторного ядра |
| `emissiveBloomRadius` | общий радиус света вместо двух фиктивно независимых радиусов |
| `emissiveBloomStrength` | общий множитель linear bloom-composite |
| `atmosphereInnerFeather` | ширина перехода непосредственно у силуэта |
| `atmosphereOuterFeather` | длина внешнего затухания |
| `atmosphereSunBias` | неравномерность halo относительно источника света |

Существующие black/white point, gamma, hot point, day visibility и limb fade сохраняются. Новые значения должны пройти parser, JSON Schema, editor controls, migration и статические тесты; нельзя оставлять их shader magic numbers.

## Рекомендуемый порядок реализации по файлам

### Шаг 1 — pipeline

- `app/src/webgl-field.js`: final HDR composer, additive bloom mix, `OutputPass`, порядок core/foreground.
- `app/test/ui-shell.test.mjs`: один output conversion, линейное сложение, порядок foreground.

### Шаг 2 — surface/atmosphere

- `app/src/webgl-field.js`: новая surface grade, zero-center haze, silhouette-clipped outer halo.
- `app/src/ui-shell-config.mjs` и `app/public/config/ui-shell.schema.json`: новые artist controls и migration.
- `app/public/config/ui-shell.json`: initial reference-oriented preset.
- `app/src/editor-main.js`/editor bindings: live tuning новых параметров.

### Шаг 3 — unified emitters

- `app/src/webgl-field.js`: HDR border core, warm/hot city core, thresholded halo source, общий bloom radius.
- Удалить старый Screen overlay и фактически неработающую независимость двух radius controls.

### Шаг 4 — stability/performance

- Поднять selective composer input cap до `1920×1080`, сохранив внутренний first bright mip около `960×540`.
- Добавить quality preset `high/medium` только для post FX.
- Проверить dispose всех новых render targets/passes.

### Шаг 5 — документация и сборка

- GDD, UI Shell Config, TODO и research status.
- `npm run check`.
- `npm test`.
- production build.
- `portable:check`.

## Performance gates

Целевой бюджет проекта — стабильные `16.7 ms` при `1920×1080`. После каждого этапа нужно сравнить:

- GPU frame time: base, base+bloom, final composite;
- draw calls и triangles через `renderer.info` с ручным reset после всех pass текущего кадра;
- число и размеры active render targets;
- отсутствие новых allocations в RAF;
- drag latency;
- отсутствие shader compilation во время первого пользовательского drag.

Обязательные ограничения:

- bloom input не выше `1920×1080` даже на 4K canvas;
- не создавать второй renderer/camera/RAF;
- не пересоздавать composer или materials при live tuning — менять uniforms/properties in place;
- на medium preset снижать только post-FX resolution, не DPR игровой сцены и не геометрию;
- второй независимый bloom stream разрешать только после измерения первого варианта.

## Acceptance matrix

| Gap | Техническая проверка | Визуальная проверка |
|---|---|---|
| Выбеленная Земля | surface-only pass имеет тёмные тени до emissive | центр России глубокий steel/navy, не молочно-cyan |
| Плоская текстура | cloud/spec/haze отключаются независимо; 4K texel density не менялась | рельеф и облака читаются без artificial sharpening |
| Голубая плёнка | haze стремится к нулю при `viewFacing → 1`; outer halo alpha нулевая внутри силуэта | halo виден по краю и плавно исчезает наружу |
| Контур без неона | core находится до финального `OutputPass`, bloom — отдельная linear энергия | тонкое белое ядро окружено холодным мягким halo |
| Розовые пятна городов | weak mask values не допускаются в bloom source | отдельные orange clusters и hot pinpoints без материковых пятен |
| Разные эффекты | border/city проходят core → shared bloom → final output | разные hue, но одинаковый характер falloff и яркого центра |
| Flicker | first bloom bright level около `960×540`; mip/fwidth sampling включён | точки не меняют плотность при idle sway и медленном drag |
| Краевые полосы | city limb fade и depth occlusion совпадают в core/emitter | у горизонта нет вертикальных orange smear и обратной стороны |
| Контур поверх иконок | foreground pass находится после core+bloom и до output либо гарантированно последним | тёмные подложки полностью закрывают линию |
| Framing | compare capture использует одинаковую camera/view/DPR | кривизна и доля космоса сравниваются отдельно от материала |

## Риски и способы контроля

### Риск: после затемнения теряются детали

Не поднимать ambient обратно. Регулировать `surfaceGamma`, `surfaceContrast` и cloud term; проверять surface-only.

### Риск: HDR core становится большим белым пятном

Уменьшать площадь source через thresholds/hot point раньше, чем общую exposure. Яркость ядра и площадь ядра — разные параметры.

### Риск: один bloom radius не подходит двум источникам

Сначала варьировать source energy/threshold. Если locked-camera QA подтверждает конфликт — два capped composer, а не запечённые glow-текстуры.

### Риск: final composer увеличивает память на 4K

Измерить HalfFloat targets и MSAA. Для 4K не включать безусловный `samples: 4`; использовать quality-dependent samples или прямой final fullscreen composite из одного HDR base target.

### Риск: атмосфера снова заливает поверхность

Добавить debug assertion/визуальный режим, в котором outer halo показывается красным: внутри projected globe silhouette красных пикселей быть не должно.

## Итоговая рекомендация

Оптимальный для проекта путь — не «накрутить glow», а исправить порядок представления света:

1. Один linear HDR кадр.
2. Тёмная поверхность без постоянного светлого floor.
3. Атмосфера только у силуэта.
4. Контур и города как HDR core + общий selective bloom.
5. Tone mapping и sRGB один раз в самом конце.
6. Bloom-source достаточно высокого разрешения, чтобы тонкие элементы не мерцали.

Это закрывает все выявленные gaps и остаётся в рамках существующей системы: живые текстуры, SVG-контур, одна сцена/камера/RAF и управляемые параметры без запекания визуального эффекта.

## Источники

- [Three.js: Color Management](https://threejs.org/manual/en/color-management.html)
- [Three.js: OutputPass](https://threejs.org/docs/pages/OutputPass.html)
- [Three.js: UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html)
- [Three.js: selective Unreal bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html)
- [Three.js: Texture](https://threejs.org/docs/pages/Texture.html)
- [Three.js: WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Khronos: WebGL 2 Specification](https://registry.khronos.org/webgl/specs/2.0/)
- [Khronos: GLSL specification](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)
- [NVIDIA GPU Gems: Real-Time Glow](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-21-real-time-glow)
- [NVIDIA GPU Gems 2: Accurate Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering)
- [NVIDIA GPU Gems 3: The Importance of Being Linear](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-24-importance-being-linear)
