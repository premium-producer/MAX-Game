---
name: vk-webgl-neon
description: Implement or tune selective bloom, luminous pixel grids and neon in VK Ribbon's Three.js renderer. Use for flat emissive blobs, washed-out colors, glow seams, aliasing and postprocessing budgets; keep simulation, geometry and content behavior separate from optical effects.
---

# VK WebGL neon

30.09.2026 — **последнее прямое указание пользователя заменяет исторические требования ниже для текущего фона**: начинать от чистого плоского шейдера NlK3Wt. `nlk3wt-native-v1` использует аналитические фаски/внутренний свет, без настоящей геометрии плиток, стекла, transmission, DOF, общей подложки, фонового bloom и художественного tone mapping. Брендовый цвет не должен обнулять канал так, чтобы ядра исходника навсегда теряли свет: сохраняется диапазон BC исходного материала. Использовать явные волновые/ветвящиеся функции расстояния вместо пороговых шумовых островов. Физический solver/локальный halo не отключать. Не возвращать эти старые слои автоматически ради «объёма» или «неона». [Действующий контракт](../../../apps/stand-service/docs/NATIVE_BACKGROUND.md), [исходник и фактические проверки](../../reports/native-plane-20260930/README.md).

29.09.2026 — перед настройкой под референс обязателен [vk-visual-reference-gate](../vk-visual-reference-gate/SKILL.md). Сначала форма и материал без bloom, затем поле и ореол; сохранение screenshot и прохождение тестов не означают визуального совпадения. Ниже сохранены исторические оптические соглашения разных версий: описание двух targets/Perlin не считать текущим трактом без чтения кода. Тонкие объёмные плитки и внутренние переливы — последняя цель. Проверять канонический источник: аудит обнаружил расходящиеся основные файлы и копии `(2)`; их автоматически не удалять и не объединять.

29.09.2026 — прямое указание пользователя для MAX: ошибочные связи собранного пути красные (#FF334D). Это узкое исключение из шестицветной палитры, только link.error в Journey; фон, остальные связи и материалы не перекрашивать.

Последнее уточнение28.09.2026: для фона MAX снова нужны градиент, флюидная пиксельная сетка и буллеты как у VK, в палитре MAX. Старый запрет фоновой сетки и требование silk-полос отменены. Silk сохранён как предыдущая версия, не включать его поверх нового фона. [Контракт](../../../apps/max-game/docs/DEVELOPMENT.md).

Use the existing renderer, RAF and resource lifecycle. The applicable patterns were studied in X-SPUTNIK's x-sputnik-three-effects, visual-qa and performance-budget skills and app/src/webgl-field.js. Transfer principles, not its Earth geometry, Full-HD numbers or ACES defaults. See the self-contained [audit and source map](../../../apps/ribbon-mvp/docs/REFERENCE_NEON_AUDIT.md).

**30.09.2026 — последнее требование:** фон мастера полностью на LumiCells, без прежних материалов/шейдеров. Для lumicells-v1 сохранять авторские field/stamp/composite/bloom/haze/tonemap; нижеследующие рецепты старого NeonBloom/3D-grid не добавлять в этот профиль. [Действующий контракт](../../../apps/stand-service/docs/LUMICELLS_BACKGROUND.md). Проверять цвет через реальный linear program atlas и один sRGB output.

## Optical contract

Keep an unblurred cell core and a separately blurred emission signal. A selective source must identify emissive cells before blur, not select all pixels merely because their text or background is bright. Perlin controls the quiet background alpha; its zero must not suppress fluid. Apply gap and coverage once on the fixed grid. The user's 0.20 correction explicitly requires real extruded cells moving in Z, with perspective enlargement. Keep projected centers on grid using camera-ray anchors; do not substitute a flat fragment mask for this geometry.

Do not solve saturation by clipping. Inspect density → presence → alpha → color independently. Rational shoulders retain more internal variation than an exponential that has already reached 0.99. Bloom cannot recover detail discarded upstream.

Work in linear intermediate targets when adding light. Decode authored sRGB once, accumulate the sharp image and halo before display conversion, and output to sRGB once. Choose tone mapping consciously: per-channel ACES can shift a brand hue. The current variant uses a max-channel shoulder. Exact #0077FF under every glow level is not a valid claim once red light mixes into it.

## Current pipeline and controls

artifacts/ribbon/neon-bloom.js uses two half-native HalfFloat targets and two separable blur passes. field.js packs fluid-only emission weight in the scene alpha. The final pass adds bloom and applies one shoulder. sceneTarget is HalfFloat only for continuous mode; main showreel remains on its previous path. This is a compact adaptation of selective bloom, not UnrealBloomPass or a full mip chain.

Radius is expressed in native output pixels, independent of preview zoom and supersampling. Downsample from the sharp source with filtering; excessive downsampling can make small emitters flicker. Keep core at full render resolution. Strength zero skips both blur passes; it must not leave last-frame glow. Dispose every RT/material/geometry and resize only on a size change.

Expose meaningful parameters in validated portable JSON: strength, radius, red accent, response knee, cell radius. Legacy records without the new section must normalize without losing unrelated settings. Offer a named reference look instead of silently rewriting custom gap/rows.

## Verification

Check CPU/GPU transfer-function agreement, black-noise fluid independence, off-path pass count, ping-pong feedback, render-state restoration, bounded memory and resize/disposal. Budget with actual ribbon dimensions (including quality 2×), not generic “4K”. Current extra bloom textures total about 2.8 MB at 3884×179; the 2× HalfFloat base costs about 22.2 MB by itself. These are memory estimates, not performance measurements.

Use only a short one-tab compile/console/visible-result check under root AGENTS. The user performs detailed motion/art review. Never call a simulation physically exact or promise 60 FPS without target-machine measurements.

For reference compositions, composite background bloom before drawing opaque tags/cards. Adding the halo after opaque content makes the underlying grid shine through it. Ribbon 0.14 renders filtered tag-atlas sprites at native output resolution after the lit background; do not claim they are supersampled with that background.

Ribbon 0.15: keep animated underlay separate from cell alpha and fluid presence. Check zoom backing resolution before increasing bloom or blur. Editor presentation can be 2× while clean output remains native; report logical output and preview dimensions separately. Far tags no longer use reduced opacity by default, and focus blur is user-controlled.

Ribbon 0.16: fluid density must illuminate the existing grid material rather than replace its opacity and hue. Diffuse the transported density field before cell shading, sample illumination at the same cell centers, and keep sharp cell coverage. Expose spread in cell units independently from optical bloom. Low-strength spill can light the underlay; do not blur the final canvas. Keep color authoring/saturation in sRGB before decoding, then accumulate energy in linear space: mixing white into a linear color directly can cause unintended pastel wash.

Ribbon 0.17 correction after user rejection of 0.16: smoothing density must not average away the luminous core. Preserve its energy and use a weaker diffuse term to extend its neighborhood. Audit the dark-value budget in gaps and quiet cells: a bright cyan underlay plus diffuse spill can erase contrast even with saturated emitters. Test saturation alongside dark regions, not in isolation. New preset colors should not silently overwrite authored settings.

Ribbon 0.20: continuous cells are actual extruded GPU instances. Their apparent size comes from changing view Z; screen-grid centers are compensated along camera rays. Use depth-derived DOF on the background before content overlay; do not blur the final canvas or nearby tag text. Budget the extra depth texture (~11.1 MB at 2× upper ribbon), vertex texture fetches and one instanced draw. A batch reduces draw calls, not vertex cost. Retain exact-zero alpha and independent fluid emergence.

Latest 0.21 override: the user removed Perlin entirely from the continuous variant, including underlay. Only fluid reveals grid cells. Keep physical XY dimensions fixed independently of near/far Z; projected size changes by perspective only. Alpha must reach zero without fluid even at depth amount=0. Earlier Perlin-background notes are historical for this variant.

0.22: user restored moving gradient, not Perlin-driven cell emergence. Use a separate broad animated underlay. Derive peak emission from raw density, not diffuse spill or whole-cell brightness. Peak HDR gain and cyan must not change geometry/opacity. Avoid applying two strong thresholds to emission. Keep foreground tags outside background bloom; compare hue and dark-value budget before increasing gain.

Для MAX соблюдать шесть цветов из [project-palette.json](../../DESIGN/BRANDS/MAX/project-palette.json), в том числе emissive, GLSL и цвета статусов. Белое ядро, прозрачность и светотень допустимы; добавлять сторонние цветные ореолы нельзя. Это ограничение MAX, а не запрет оригинальной красной рамки VK Видео.

MAX, уточнение28.09.2026: фон — широкие горизонтальные световые течения, не тонкие непрерывные неоновые линии. Оптический блик должен принадлежать движущейся широкой полосе; использовать перенос огибающих, плавное изменение ширины и мягкий halo. Это правило фона, не замена WebGL-волокон между игровыми объектами.
