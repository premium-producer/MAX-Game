# Ресерч: управляемые realtime-огни Земли без запечённого glow

Дата: 2026-09-05  
Статус обновлён 2026-09-06: система реализована. Runtime использует одну sharp intensity-карту для core в Earth shader и цветного selective bloom; старая увеличенная emissive-сфера и предразмытая glow-карта исключены из исполнения и production-сборки. Artist controls вынесены в `ui-shell.json` и живой редактор. После проверки в движении оба city-pass используют положительный mip LOD bias и расширенный derivative-aware порог, а depth-only окклюдер отделён от копланарного emitter через polygon offset: это стабилизирует субпиксельные точки без запекания нового glow.

## Короткий ответ

Да, нужный эффект можно строить в реальном времени и полностью отказаться от заранее размытой карты `Earth_Illumination_Glow_4K.webp`.

Но важно разделить два понятия:

- **географическая карта интенсивности** отвечает на вопрос, где действительно находятся огни;
- **визуальный эффект** задаёт цвет, контраст, размер горячего ядра, затухание у горизонта и экранный bloom.

Точные города невозможно восстановить одним процедурным noise или shader без исходных географических данных. Поэтому одна одноканальная intensity-карта нужна. Это не запечённый glow, а такой же data-source, как normal/specular map. Запекать в неё цветные пятна и размытие не нужно: все художественные свойства можно вычислять на GPU из одной резкой карты.

Для X-SPUTNIK рекомендуется схема:

> **одна резкая линейная intensity-карта → emissive-ядро в основном Earth shader → light-only screen-space bloom → цветосохраняющее сведение**

Она повторяет удачный принцип нового контура России: данные задают форму источника, а мягкий свет строится из актуального экранного изображения.

## Что видно на текущем кадре

На восточном краю Земли огни превращаются в широкую оранжевую вертикальную полосу, частично выходящую за географию суши. В центральной части они остаются мелкими точками, но в плотных районах объединяются в бесформенные светлые области.

Это не дефект камеры или границы России. По коду и исходным картам причина находится в текущем city-light pipeline:

1. `Earth_Illumination_Glow_4K.webp` уже содержит широкий blur в UV-пространстве и крупные пересвеченные области.
2. Glow рисуется на отдельной прозрачной сфере радиуса `EARTH_RADIUS * 1.0015`.
3. На касательной к глобусу даже небольшой физический зазор между сферами превращается в видимую экранную полосу.
4. Предварительный UV-blur при сильном перспективном сжатии проецируется неравномерно: круглый texel-ореол становится вытянутым вдоль края.
5. `pow(glowSource, 0.72)` повышает слабые значения запечённой маски, поэтому остаточный фон и дальний halo становятся заметнее.
6. Затем Screen blending, `cityLightsIntensity = 2.6` и дневная видимость `0.22` дополнительно проявляют широкую область на светлой поверхности.

Это вывод из предоставленного кадра и текущей реализации в [`webgl-field.js`](../src/webgl-field.js), а не предположение о положении географии.

## Почему текущую glow-карту нельзя нормально «докрутить»

В проекте сейчас используются три разные версии одних данных:

| Файл | Роль | Проблема |
|---|---|---|
| `Earth_Illumination_4K.jpg` | исходная цветная карта ночных огней | JPEG содержит цвет и слабый компрессионный фон, но сохраняет наиболее естественное распределение |
| `Earth_Illumination_Core_4K.webp` | контрастная чёрно-белая core-маска | пригодна как data-mask, хотя её contrast curve уже зафиксирована офлайн |
| `Earth_Illumination_Glow_4K.webp` | заранее размытый halo | плотные города уже объединены в белые материковые пятна; вернуть отдельные источники после этого невозможно |

Предразмытая карта смешивает форму источника и вид свечения в одном asset. Она не знает текущую камеру, размер Земли на экране, угол к поверхности и фактический DPR. Поэтому один и тот же blur одновременно слишком мал в центре диска и слишком широк у горизонта.

## Что должно остаться в текстуре

### Минимальный корректный источник

Нужна одна equirectangular-карта `L(u, v)` со скалярной интенсивностью:

- один канал вместо готового RGB-цвета;
- чёрный фон и резкие исходные источники без halo;
- `NoColorSpace`, потому что это числовые данные, а не цвет интерфейса;
- lossless или GPU-friendly формат без JPEG-блоков около чёрного;
- горизонтальный `RepeatWrapping`, чтобы карта не рвалась на шве долготы;
- mipmaps для устойчивого уменьшения.

Официальная документация Three.js относит normal/roughness и аналогичные числовые карты к non-color data и рекомендует для них `NoColorSpace`; расчёты света должны выполняться в linear working space: [Three.js Color Management](https://threejs.org/manual/en/color-management.html), [Texture](https://threejs.org/docs/pages/Texture.html).

### Откуда взять данные

NASA публикует Black Marble как grayscale и color карты, включая GeoTIFF/JPEG с разрешениями от `3600×1800` до глобальных 500-метровых тайлов: [NASA Earth at Night / Black Marble flat maps](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/).

Для production разумно один раз подготовить из grayscale GeoTIFF одноканальную `4096×2048` data-текстуру. Это подготовка геоданных, а не запекание визуального эффекта: ни цвет, ни bloom, ни размер ореола в файл не записываются.

Если принципиально не делать даже такую конверсию, shader может читать текущий `Earth_Illumination_4K.jpg`, вычислять luminance и фильтровать black level в реальном времени. Это возможно, но JPEG-шум ограничит чистоту самых слабых огней. Поэтому лучший компромисс — **одна чистая data-маска, ноль glow-масок**.

## Рекомендуемая runtime-архитектура

### 1. Резкое ядро внутри основного Earth shader

Горячие точки нужно вычислять на той же сфере и в том же fragment shader, что поверхность Земли. Тогда:

- отсутствует параллакс между surface и lights;
- глубина и силуэт совпадают автоматически;
- огни не образуют отдельную прозрачную оболочку;
- цвет сводится до tone mapping в одном linear-space pipeline;
- при выключенном bloom ядро остаётся чистым и читаемым.

Базовый алгоритм:

```glsl
float raw = texture2D(uCityMask, vEarthUv).r;
float aa = max(fwidth(raw) * uCityAntialias, 1.0 / 255.0);
float source = smoothstep(uCityBlackPoint - aa, uCityWhitePoint + aa, raw);
source = pow(source, uCityGamma);

float night = 1.0 - smoothstep(
  -uTerminatorSoftness,
  uTerminatorSoftness,
  dot(baseNormal, sunDirection)
);

float viewFacing = clamp(dot(baseNormal, viewDirection), 0.0, 1.0);
float limbFade = smoothstep(uCityLimbStart, uCityLimbEnd, viewFacing);
float visibility = mix(uCityDayVisibility, 1.0, night) * limbFade;

float hot = smoothstep(uCityHotPoint, 1.0, source);
vec3 cityColor = mix(uCityColor, uCityHotColor, hot);
outgoingLight += cityColor * source * visibility * uCityCoreIntensity;
```

`fwidth()` делает порог устойчивее при изменении масштаба. `limbFade` — принципиальный контроль для текущего дефекта: источник начинает мягко затухать до того, как поверхность становится почти касательной. Это не маскирует целый регион и не двигает географию, а предотвращает накопление sub-pixel огней в один яркий экранный столб.

### 2. Отдельный realtime emitter вместо glow texture

Для мягкого света тот же резкий `uCityMask` второй раз читается в light-only сцене:

- используется та же Earth geometry и та же transform;
- radius не увеличивается;
- fragment shader повторяет `blackPoint/gamma/night/limbFade`;
- тёмные fragments отбрасываются через `discard`;
- источник выводит только управляемый orange/amber HDR-color;
- transparent Screen-сфера и UV-blur отсутствуют.

Дальше источник рендерится во временный GPU target и размывается в экранном пространстве. Официальный `UnrealBloomPass` строит mip-chain и размывает уровни с разными радиусами, что даёт более равномерный результат, чем ручные широкие texel-смещения: [UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html). Классический realtime glow также строится как render-to-texture и последовательный blur по осям: [NVIDIA GPU Gems, Chapter 21: Real-Time Glow](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-21-real-time-glow).

### 3. Переиспользовать selective-bloom контура

Самый рациональный вариант для текущего проекта — обобщить уже существующий border-only composer до **selective-emissive composer**:

```text
single sharp city intensity map
          |
          +--> Earth shader: orange core at exact surface depth
          |
          +--> selective-emissive scene
                    + depth-only Earth
                    + orange city emitter
                    + blue/white border emitter
                    -> HalfFloat target <= 960x540
                    -> UnrealBloomPass mip blur
                    -> RGB-preserving controlled composite

base Earth + city core
          -> realtime orange/blue halo
          -> final white Russia core
```

Three.js показывает отдельный composer и последующее объединение base/bloom в официальном [selective bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html). `RenderTarget` является временным GPU-буфером, а не сохраняемой картинкой; он поддерживает resize/dispose и несколько attachments при необходимости: [Three.js RenderTarget](https://threejs.org/docs/pages/RenderTarget.html).

Чтобы города и граница не смешались в один оттенок, текущий compositor нельзя оставлять скалярным `max(rgb) → borderColor`. Он должен сохранять RGB результата:

- city emitter записывает orange/amber;
- border emitter записывает cold blue/white;
- blur работает с цветным HDR-source;
- финальный shader отдельно регулирует глобальную opacity и насыщенность результата.

Так сохраняется один bloom target и одна mip-chain вместо второго полного postprocessing-комплекта. Ограничение — общий радиус blur для границы и городов. Для первого production-прохода это приемлемо; если после визуального теста понадобятся принципиально разные радиусы, следует измерить отдельный city composer либо использовать два канала одного MRT и собственный dual-radius blur. `RenderTarget` в актуальном Three.js поддерживает несколько color attachments через `count`, но MRT-вариант заметно сложнее и не нужен до подтверждённой необходимости.

### 4. Цветосохраняющее сведение

Текущая Screen-сфера смешивает цвет и alpha уже на геометрии. В новой схеме роли разделяются:

- **core** добавляется как emissive в linear Earth shader до tone mapping;
- **halo** накладывается после blur контролируемым color-preserving composite;
- яркость halo не должна менять black point или размер ядра;
- border core по-прежнему рисуется последним.

Полноэкранный bloom всей сцены использовать нельзя: облака, лёд, белый контур и UI-маркеры тоже начнут светиться. NVIDIA отдельно предупреждает, что additive glow легко переэкспонирует сцену; для X-SPUTNIK источник должен оставаться selective: [GPU Gems 2, post-processing glow](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-1-toward-photorealism-virtual-botany).

## Почему не процедурные точки без карты

Есть три альтернативы, но ни одна не заменяет intensity-map полностью:

| Подход | Плюсы | Минусы | Решение |
|---|---|---|---|
| Fragment shader + sharp data-map + selective bloom | точная география, минимум геометрии, полный realtime-контроль | остаётся одна data-текстура | **рекомендуется** |
| `InstancedMesh`/`Points` из списка городов | независимые размеры, мерцание, цвет каждой точки | нужен отдельный географический dataset; дороги и плотность теряются; много sub-pixel primitives у края | только как редкий декоративный верхний слой |
| Процедурный noise/Voronoi без данных | вообще нет карты | огни появляются в океане/пустынях и не соответствуют реальным городам | не подходит для этой Земли |
| Несколько UV-выборок вокруг source-map | просто, без render target | blur остаётся в UV, деформируется у горизонта и требует много texture fetches | только очень короткий локальный core halo |
| Полноэкранный bloom всей сцены | простая сцепка | неконтролируемо засвечивает всю Землю и интерфейс | не использовать |

Опционально поверх базовой карты можно добавить небольшой стабильный `Points`-слой для отдельных пульсирующих мегаполисов. Его координаты должны быть детерминированы, пул — создан один раз, а эффект не должен заменять основную карту света.

## Параметры, которые действительно нужны художнику

Стартовый набор для editor/config:

```json
{
  "cityLightsColor": "#ff7a21",
  "cityLightsHotColor": "#ffd09a",
  "cityLightsCoreIntensity": 1.35,
  "cityLightsBlackPoint": 0.018,
  "cityLightsWhitePoint": 0.34,
  "cityLightsGamma": 1.1,
  "cityLightsHotPoint": 0.58,
  "cityLightsDayVisibility": 0.12,
  "cityLightsLimbStart": 0.035,
  "cityLightsLimbEnd": 0.2,
  "cityLightsBloomStrength": 0.75,
  "cityLightsBloomOpacity": 0.3,
  "cityLightsBloomMaxWidth": 960,
  "cityLightsBloomMaxHeight": 540
}
```

Это не утверждённый пресет. Настраивать следует в фиксированном порядке:

1. `blackPoint/whitePoint` — отделить реальные огни от фона;
2. `gamma/hotPoint` — сохранить структуру плотных городов;
3. `limbStart/limbEnd` — убрать яркий столб у горизонта;
4. `coreIntensity` — получить читаемое оранжевое ядро;
5. `bloomStrength/opacity` — добавить мягкий свет, не меняя источник;
6. `dayVisibility` — определить художественную видимость на освещённой стороне.

Если начинать со strength, снова появится яркая масса, скрывающая ошибку source-mask.

## Performance-профиль

Рекомендуемый вариант не добавляет новый canvas, camera или RAF:

- одна постоянная intensity texture вместо двух runtime-масок;
- core добавляется несколькими ALU-операциями и одной texture sample в существующий Earth fragment;
- city emitter добавляет один draw общей Earth geometry в уже существующий selective composer;
- bloom target остаётся максимум `960×540`;
- uniforms обновляются in-place;
- render targets, passes и materials создаются один раз и освобождаются в `dispose()`;
- при hidden document decorative bloom можно пропускать вместе с текущим loop policy.

Quality fallback:

| Режим | Core | Bloom |
|---|---|---|
| High | full-resolution Earth shader | общий selective target до `960×540` |
| Medium | тот же | target до `640×360`, меньшая opacity |
| Low | тот же | отключён полностью |

Нельзя считать систему принятой только по числу draw calls. Нужно измерить одинаковый стабильный ракурс на целевом Full HD-компьютере: baseline, border bloom и combined border+city bloom. Общий бюджет приложения — около `16.7 ms`; drag не должен получать задержку.

## План безопасной реализации

1. Подключить одну резкую intensity-карту и добавить city core непосредственно в `earthMaterial`.
2. Отключить старую увеличенную transparent city sphere, но временно оставить код как fallback до первого пользовательского кадра.
3. Добавить city emitter с `night`, `blackPoint` и `limbFade` в существующую selective-emissive сцену.
4. Сделать bloom composite RGB-aware, чтобы orange city halo и blue border halo сохраняли независимые цвета.
5. После подтверждения удалить `Earth_Illumination_Glow_4K.webp`, второй texture sample и старое Screen blending.
6. Вынести параметры в `ui-shell.json`, parser, JSON Schema и live editor; добавить миграционные defaults.
7. Проверить resize/dispose, отсутствие per-frame allocations и core-only fallback.
8. Прогнать syntax/unit/build/portable checks и только затем заменить fallback окончательно.

## Визуальная приёмка

Обязательные ракурсы:

- Дальний Восток на самом краю сферы: нет вертикального оранжевого столба и отдельной светящейся оболочки.
- Европейская часть России: плотность читается сетью, а не сплошным бело-персиковым материком.
- Сибирь: отдельные цепочки огней остаются мелкими и контрастными.
- Светлая дневная поверхность: огни остаются оранжевыми, но не выглядят выбеленными пятнами.
- Ночная сторона: hot core не клипуется в бесформенный белый массив.
- Вращение и idle sway: нет мерцания threshold, UV-шва и скачка размера halo.
- Bloom off: географически точное core-свечение остаётся на поверхности.
- Контур России: его холодно-белое ядро и бело-голубой halo не получают оранжевую примесь от city pass.

## Итоговое решение

Полностью процедурные и одновременно географически точные огни без какого-либо источника данных невозможны. Но **полностью realtime-визуал без запечённого glow возможен и предпочтителен**.

Для X-SPUTNIK нужно оставить одну резкую одноканальную карту как географические данные, удалить заранее размытую glow-карту, встроить orange core в Earth shader и строить мягкий свет из актуального screen-space emitter в уже существующем selective bloom pipeline. Именно это устраняет текущую касательную полосу, отделяет форму от художественных настроек и даёт контролируемые параметры без повторного экспорта ассетов после каждой правки.

## Первичные источники

- [NASA Earth at Night / Black Marble — flat maps and GeoTIFF data](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/)
- [Three.js Color Management](https://threejs.org/manual/en/color-management.html)
- [Three.js Texture](https://threejs.org/docs/pages/Texture.html)
- [Three.js RenderTarget](https://threejs.org/docs/pages/RenderTarget.html)
- [Three.js UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html)
- [Three.js selective Unreal bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html)
- [Three.js WebGL multiple render targets example](https://threejs.org/examples/webgl_multiple_rendertargets.html)
- [NVIDIA GPU Gems, Chapter 21: Real-Time Glow](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-21-real-time-glow)
- [NVIDIA GPU Gems 2: post-processing glow and overexposure caveat](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-1-toward-photorealism-virtual-botany)
