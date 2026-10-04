# План реализации Earth-render по целевому референсу

Дата: 2026-09-06  
Статус: runtime-фазы реализованы; deterministic checks пройдены, visual QA остаётся пользовательским gate  
Архитектурный контракт: [`EARTH_REFERENCE_RENDER_ARCHITECTURE.md`](./EARTH_REFERENCE_RENDER_ARCHITECTURE.md)  
Visual-gap контракт: [`EARTH_CURRENT_VS_REFERENCE.md`](./EARTH_CURRENT_VS_REFERENCE.md)  
Техническое обоснование: [`EARTH_REFERENCE_IMPLEMENTATION_RESEARCH.md`](./EARTH_REFERENCE_IMPLEMENTATION_RESEARCH.md)

## 1. Принцип выполнения

> Реализация 2026-09-06: linear HalfFloat world target, единый selective emissive bloom, `OutputPass`, depth-only foreground occluder, тёмная surface-модель, silhouette-aware atmosphere и schema v7 внедрены. Чекбоксы ниже сохранены как исходный пофазный контракт; фактические проверки и отклонения зафиксированы в `worklog.md`.

Работы выполняются последовательно: pipeline → surface → atmosphere → emissive → stability/performance → финальная настройка. Перескакивать сразу к росту glow нельзя: световая иерархия зависит от уже исправленной поверхности и color pipeline.

Каждая фаза заканчивается детерминированной проверкой. Следующая начинается только после прохождения stop-gate предыдущей. Художественные значения настраиваются по одному locked-camera кадру; camera/framing не меняются ради маскировки проблем материала.

## 2. Карта затрагиваемых файлов

| Файл | Планируемая роль |
|---|---|
| `app/src/webgl-field.js` | render graph, targets/passes, Earth/atmosphere/emissive shaders, resize/dispose/debug |
| `app/src/ui-shell-config.mjs` | schema v7 defaults, parser, migration и semantic validation |
| `app/public/config/ui-shell.json` | стартовый reference-oriented preset |
| `app/public/config/ui-shell.schema.json` | переносимый v7 contract |
| `app/editor.html` | новые artist controls, удаление фиктивных radius inputs |
| `app/src/editor-main.js` | generic live binding уже подходит; изменения только если нужен select/debug control |
| `app/test/ui-shell.test.mjs` | статические WebGL/render-order/lifecycle contracts |
| `app/test/ui-shell-config.test.mjs` | v7 parsing и v1–v6 migration |
| `app/test/editor-ui.test.mjs` | наличие новых и отсутствие старых controls |
| `app/DOCS/GDD.md` | итоговый visual/render contract продукта |
| `app/DOCS/UI_SHELL_CONFIG.md` | описание v7 controls и migration |
| `app/DOCS/TODO.md` | закрытие visual gaps и оставшиеся QA-пункты |
| `app/index.html`, `app/editor.html` | cache tag только после готового runtime |
| `worklog.md` | фактический результат каждой существенной фазы |

`app/dist/` вручную не редактируется: он обновляется production build.

## 3. Фаза 0 — baseline и защитные контракты

Цель: сделать будущие изменения проверяемыми и не потерять уже исправленные свойства.

### Изменения

- [ ] Переименовать в плане/тестах `borderBloom*` в нейтральное `selectiveEmissive*` там, где ресурс уже обслуживает и border, и city.
- [ ] Добавить pure helper `resolveSelectiveBloomSize(width, height, quality)` с контрактами `high/medium/off`.
- [ ] Добавить pure helper для projected halo disc radius; покрыть крайние camera distance.
- [ ] Зафиксировать тестом текущие инварианты: один renderer, один camera, один RAF, foreground после world FX.
- [ ] Зафиксировать отсутствие `Earth_Illumination_Glow_4K.webp`, border glow texture и второго canvas.
- [ ] Подготовить dev-only debug-mode enumeration без production-кнопок.

### Тесты

- unit: размеры `1920×1080`, `3840×2160`, portrait и минимальный viewport для всех quality;
- unit: projected disc radius finite, монотонен и не меньше orthographic lower bound;
- static: no duplicated renderer/RAF/assets.

### Stop-gate 0

- Runtime-визуал ещё не меняется.
- `npm run check` и `npm test` проходят.
- Новые helpers не аллоцируют в RAF: scratch values — числа или созданные один раз vectors.

## 4. Фаза 1 — linear HDR world pipeline

Цель: убрать display-space Screen overlay и свести world-light до tone mapping.

### `app/src/webgl-field.js`

- [ ] Импортировать `OutputPass`.
- [ ] Создать один `earthHdrTarget`:
  - `HalfFloatType`;
  - linear filters;
  - depth buffer on;
  - stencil off;
  - без MSAA на первом проходе.
- [ ] Перенести `borderCore` из `borderCoreScene` в основную `scene` после Earth.
- [ ] Заменить `borderGlowOverlayMaterial` на linear additive fullscreen material:
  - direct RGB texture sample;
  - `uEmissiveBloomStrength`;
  - `AdditiveBlending`;
  - no clamp/chroma/pow/colorspace/tone chunks;
  - depth test/write off.
- [ ] Рендерить world в `earthHdrTarget`, не напрямую в canvas.
- [ ] Добавить bloom в тот же target без очистки, сохранив world depth.
- [ ] Выполнить `OutputPass` из `earthHdrTarget` в canvas.
- [ ] Создать `foregroundOcclusionScene` с depth-only Earth mesh на shared geometry.
- [ ] После world output очистить только canvas depth, затем отрендерить occluder и `gameplayForegroundScene`.
- [ ] Удалить `borderCoreScene`, старый Screen overlay и overlay opacity `0.42`.
- [ ] Resize: менять `earthHdrTarget` по реальному drawing buffer только при resize.
- [ ] Dispose: освободить target, output pass, additive quad/material и foreground depth material; shared geometry не освобождать повторно.

### Контракт render order

```text
selective composer (optional)
-> scene into earthHdrTarget
-> additive bloom into same target
-> OutputPass to canvas
-> clearDepth
-> foreground Earth occluder
-> gameplayForegroundScene
```

### Тесты

- static: присутствует один `OutputPass`;
- static: отсутствуют `CustomBlending`, `OneMinusDstColorFactor`, chroma normalization и `pow(...0.68)`;
- static: border core находится в `scene`;
- static: foreground вызывается после `OutputPass` и после depth occluder;
- static: dispose покрывает каждый новый GPU-resource;
- unit/syntax/build/portable.

### Stop-gate 1

- Кадр компилируется без WebGL shader errors.
- Border/city hue не нормализуются в white/cyan fullscreen overlay.
- Контур по-прежнему закрывается всеми gameplay backdrops.
- Core остаётся видимым при `emissiveBloomQuality=off` или нулевой glow energy.

## 5. Фаза 2 — schema v7 и surface grade

Цель: вернуть тёмную базу и динамический диапазон, не теряя texture detail.

### Конфигурация

- [ ] Поднять `CURRENT_UI_SHELL_SCHEMA_VERSION` и JSON Schema const до `7`.
- [ ] Добавить все поля v7 из архитектурного документа одним schema bump.
- [ ] Для v1–v6 подставлять новые defaults.
- [ ] При миграции общего radius использовать `max(cityLightsGlowRadius, borderGlowRadius)`; для старых файлов без полей — default.
- [ ] Валидировать:
  - `cityLightsBlackPoint < cityLightsWhitePoint`;
  - `cityLightsCoreStart <= cityLightsHotPoint`;
  - `cityLightsGlowStart` в `0–1`;
  - `cityLightsLimbStart < cityLightsLimbEnd`;
  - `atmosphereInnerFeather < atmosphereOuterFeather`;
  - quality входит в `high/medium/off`.
- [ ] Обновить `ui-shell.json` и `ui-shell.schema.json` синхронно.

### Editor

- [ ] Добавить inputs `surfaceExposure`, `surfaceGamma`, `surfaceContrast`.
- [ ] Добавить остальные v7 artist controls для последующих фаз.
- [ ] Заменить два radius inputs одним `emissiveBloomRadius`.
- [ ] Добавить `<select>` для `emissiveBloomQuality`; расширить generic binding, если текущая number/color логика select не обслуживает.
- [ ] Сохранять editor draft и project config только как v7.

### Earth shader

- [ ] Добавить `uSurfaceExposure`, `uSurfaceGamma`, `uSurfaceContrast`.
- [ ] Удалить постоянные `coolSurface * 0.24` и `surfaceLight 0.48`.
- [ ] Построить linear grade → saturation → contrast pivot → tint → light.
- [ ] Ограничить cloud/specular как отдельные акценты.
- [ ] Сохранить diffuse `SRGBColorSpace`, data maps `NoColorSpace`.
- [ ] Убедиться, что intermediate shader не выполняет display transfer сам.

### Стартовый preset

- `surfaceExposure`: начать с `0.75`;
- `surfaceGamma`: `1.20`;
- `surfaceContrast`: `1.16`;
- `dayIntensity`: `0.64`;
- `ambientIntensity`: `0.14`;
- `cloudHighlights`: `0.18`;
- `specularIntensity`: `0.18`.

Значения корректируются только после surface-only locked-camera кадра.

### Тесты

- parser v7 valid/invalid boundaries;
- migration v1–v6 → v7, отдельно v6 radius merge;
- editor fields contract;
- static shader contract: новые uniforms присутствуют, старые light-floor выражения отсутствуют;
- syntax/unit/build/portable.

### Stop-gate 2

- Surface-only центр России — navy/steel, не milk/cyan.
- Снег/облака/суша разделены по value.
- Отключение cloud/spec/haze показывает, что diffuse detail не потерян.
- Яркость не возвращается повышением ambient/normal strength.

## 6. Фаза 3 — silhouette-clipped atmosphere

Цель: оставить лёгкую голубую дымку и мягкий внешний ореол без заливки диска.

### Surface haze

- [ ] Заменить `mix(outgoingLight, hazeTarget, hazeAmount)` на additive rim term.
- [ ] Удалить центральный множитель `0.12`.
- [ ] Проверить нулевой вклад при `viewFacing -> 1`.
- [ ] Сохранить daylight/night modulation без минимальной голубой плёнки.

### Outer halo

- [ ] Добавить uniforms `uDiscRadius`, `uInnerFeather`, `uOuterFeather`, `uSunBias`.
- [ ] Обновлять `uDiscRadius` из camera distance и plane half-size in-place в существующем RAF.
- [ ] Установить alpha `0` внутри projected silhouette.
- [ ] Разделить narrow edge и wide outer falloff в одном analytic shader.
- [ ] Удалить `colorspace_fragment` из intermediate halo shader.
- [ ] Добавить debug mode `haloSilhouetteGuard`.

### Тесты

- pure helper projected radius;
- static: нет старых `smoothstep(0.76, 0.86)`/`0.82–1.0`;
- static: center contribution не содержит constant floor;
- validation feather order;
- syntax/unit/build/portable.

### Stop-gate 3

- В `haloSilhouetteGuard` внутри диска нет красного.
- Центр Земли не меняет экспозицию при включении/выключении outer halo.
- Край имеет узкую читаемую линию и мягкий прозрачный falloff наружу.
- Справа нет широкой равномерной голубой дуги.

## 7. Фаза 4 — единый emissive pipeline контура и городов

Цель: дать обоим эффектам одинаковую структуру core → colored halo.

### Shared city source

- [ ] Вынести GLSL вычисление city source/visibility/limb в общий snippet.
- [ ] Подключить snippet в Earth core и selective emitter fragments.
- [ ] Сохранить LOD bias, `fwidth`, mipmaps, data color space и polygon offset occluder.

### City core и emitter

- [ ] Разделить `warmCore`, `hotCore`, `haloSource` независимыми thresholds.
- [ ] Добавить `cityLightsHotIntensity`.
- [ ] Не подавать weak background mask в bloom.
- [ ] Применять day visibility и limb fade до energy/discard одинаково в обоих проходах.
- [ ] Убедиться, что emitter находится на той же Earth geometry/radius без transparent shell.

### Border core и emitter

- [ ] Установить core color как cold white tint × `borderCoreIntensity` в linear HDR.
- [ ] Сохранить full-resolution `LineSegments2` и screen-space width.
- [ ] Оставить emitter на той же SVG line geometry с небольшой controlled linewidth difference.
- [ ] Удалить hardcoded `lerp(...0.92)`, `lerp(...0.55)` и opacity-derived псевдо-HDR.

### Shared bloom controls

- [ ] Один `emissiveBloomRadius` управляет `UnrealBloomPass.radius`.
- [ ] `emissiveBloomStrength` управляет linear additive composite.
- [ ] City/border glow intensity управляют только энергией своих emitter.
- [ ] Не вычислять общий radius через runtime `max()`.

### Тесты

- static: core/emitter содержат общий city GLSL source;
- static: отсутствуют два runtime radius и их `Math.max()`;
- static: border core проходит world HDR target до OutputPass;
- static: city/border selective sources делят один composer;
- city limb/day thresholds validation;
- syntax/unit/build/portable.

### Stop-gate 4

- Контур: тонкий почти белый core, холодный halo, форма SVG не толстеет.
- Города: orange clusters, сильные warm-white pinpoints, нет рыхлых материковых пятен.
- При нулевом bloom оба core остаются резкими и географически корректными.
- При включении bloom оба эффекта воспринимаются одним типом света.

## 8. Фаза 5 — bloom resolution, stability и quality fallback

Цель: убрать sub-pixel flicker без чрезмерного GPU-cost.

### Изменения

- [ ] Переименовать `BORDER_BLOOM_MAX_*`/`resolveBorderBloomSize` в selective-emissive terminology.
- [ ] `high`: composer input cap `1920×1080`.
- [ ] `medium`: composer input cap `1280×720`.
- [ ] `off`: не вызывать composer и additive pass.
- [ ] Resize composer только при drawing buffer или quality change.
- [ ] Убедиться, что `UnrealBloomPass` bright mip для Full HD high около `960×540`.
- [ ] Не добавлять temporal history/accumulation.
- [ ] Не включать второй bloom stream до измерения.

### Performance inspection

- размеры всех active render targets;
- draw calls/triangles по полному кадру;
- GPU frame time base, base+bloom и full frame;
- отсутствие material/target recreation при editor live tuning;
- отсутствие allocations в RAF и pointermove;
- отсутствие shader compile/texture upload при первом drag.

Интерактивный browser/performance прогон проводится только по явному запросу пользователя; до этого выполняются code/lifecycle/static проверки и фиксируется необходимость пользовательского стенда.

### Stop-gate 5

- На целевом Full HD high полный кадр укладывается примерно в `16.7 ms`.
- Огни не меняют плотность при idle sway и медленном drag.
- На горизонте нет вертикальных orange bands или огней обратной стороны.
- Medium отличается мягкостью halo, но не core, географией и gameplay.
- Off оставляет полностью рабочую игру и читаемые core.

## 9. Фаза 6 — locked-camera tuning и visual-gap closure

Цель: подобрать финальный preset после исправления архитектуры, а не скрывать gaps новыми слоями.

### Порядок настройки

1. `surfaceOnly`: exposure → gamma → contrast → saturation.
2. Clouds/specular: вернуть материал, не поднимая общий white floor.
3. `atmosphereOnly`: inner edge → outer feather → intensity → sun bias.
4. `borderCore`: width → core intensity → tint.
5. `cityCore`: black/white → core start → hot point/intensity → day/limb.
6. `bloomCombined`: emitter energies → shared radius → shared strength.
7. `final`: проверить value hierarchy и warm/cool contrast.
8. Только после material match отдельно сравнить framing.

### Обязательные контрольные области

- центр и север России — surface detail без cyan veil;
- запад России/Европа — плотные города остаются дискретными;
- Сибирь — слабые огни не образуют региональные маски;
- Дальний Восток/горизонт — нет smear и flicker;
- северная и южная SVG-границы — одинаковый core/falloff;
- A/Б, миссии и размещённые ноды — полностью закрывают contour/halo.

### Запрещённые способы закрыть gap

- менять camera zoom вместо материала;
- поднимать ambient, чтобы вернуть детали;
- расширять border core вместо настройки bloom;
- снижать threshold городов до появления слабого фонового ковра;
- делать atmosphere ярче, чтобы имитировать референсную глубину;
- подключать 8K до доказанного texel-limit.

### Stop-gate 6

Все строки acceptance matrix в архитектурном документе и `EARTH_CURRENT_VS_REFERENCE.md` закрыты на одинаковых camera/DPR кадрах либо явно отмечены как оставшийся измеряемый gap.

## 10. Фаза 7 — документация, сборка и handoff

- [ ] Обновить `GDD.md` фактическим render order и light language.
- [ ] Обновить `UI_SHELL_CONFIG.md` schema v7, migration и control meanings.
- [ ] Обновить `TODO.md`: закрытые gaps, performance/visual QA остатки.
- [ ] Перевести research status из proposal в implemented с фактическими отклонениями от первоначальной схемы.
- [ ] Обновить cache tags только после завершения runtime.
- [ ] Обновить `worklog.md` реальными файлами, проверками, рисками и следующими шагами.
- [ ] Не редактировать `dist` вручную; пересобрать его.

Финальные deterministic commands из `app/`:

```powershell
npm run check
npm test
npm run build
npm run portable:check
```

Если sandboxed build получает известный Windows `spawn EPERM`, повтор выполняется только разрешённым способом; результат не считается пройденным до успешного production build.

## 11. Матрица зависимостей

```text
Phase 0 baseline
      |
      v
Phase 1 linear HDR pipeline
      |
      v
Phase 2 schema v7 + dark surface
      |
      +-------------------+
      v                   v
Phase 3 atmosphere    Phase 4 emissive unity
      |                   |
      +---------+---------+
                v
Phase 5 stability/performance
                |
                v
Phase 6 locked-camera tuning
                |
                v
Phase 7 docs/build/handoff
```

Фазы 3 и 4 технически могут разрабатываться независимо после Phase 2, но итоговая настройка и оценка выполняются только после обеих.

## 12. Риски и rollback-границы

| Риск | Ранний сигнал | Действие |
|---|---|---|
| HalfFloat world target слишком дорог на 4K | memory/frame spike после Phase 1 | сохранить один target, проверить format/size; не добавлять composer ping-pong/MSAA |
| UI меняет цвет или depth | foreground становится тусклым/виден сквозь globe | оставить foreground после OutputPass и проверить dedicated depth occluder |
| Тёмная база теряет detail | surface-only становится чёрным | корректировать gamma/contrast/cloud, не ambient floor |
| HDR border превращается в белое пятно | core визуально толстеет | уменьшить core width/source intensity до роста bloom radius |
| Cities снова становятся маской региона | glow есть у слабых texels | повысить `cityLightsGlowStart`, отдельно настроить core threshold |
| Halo залезает на поверхность | guard показывает пиксели внутри silhouette | исправить projected radius/feathers, не снижать opacity как маскировку |
| Один radius не подходит обоим FX | line аккуратна только при smeared cities или наоборот | сначала energy/threshold; второй stream только после GPU-profile |
| Flicker сохраняется на high | точки прыгают при fixed exposure | проверить фактический composer size, mip/fwidth/LOD и source threshold |

Каждая фаза должна оставаться отдельно обратимой. Нельзя одновременно переписывать pipeline, camera/framing и gameplay: это уничтожит диагностическую границу.

## 13. Финальный критерий начала работ

Этот план готов к исполнению без дополнительного архитектурного выбора. Перед непосредственным изменением runtime нужно лишь подтвердить начало реализации; дальше порядок и stop-gates определены этим документом.
