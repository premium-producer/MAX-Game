---
name: x-sputnik-three-effects
description: Build or modify Three.js/WebGL visuals in X-SPUTNIK: the persistent Earth, camera, geographical markers, orbital and ground nodes, waves, links, shaders, particles, postprocessing, and visual state transitions. Use for 3D/FX implementation or debugging; do not use for mission rules that have no rendered behavior.
---

# X-SPUTNIK Three.js effects

Extend the existing scene instead of creating a parallel rendering architecture.

## Before editing

1. Read [references/render-contract.md](references/render-contract.md).
2. Read the relevant GDD and config documentation in `app/DOCS/`.
3. Inspect `app/src/webgl-field.js`, its public API and current disposal/update paths.
4. Load the external `threejs` skill. Also load `x-sputnik-motion-system` when the effect has timed states, and `x-sputnik-performance-budget` for heavy shaders, particles, postprocessing or hot-path work.

## Non-negotiable invariants

- Keep one persistent Earth, one renderer, one camera and one animation loop across all five screens.
- Never replace the Earth with a PNG or create a second canvas for a transition.
- Gameplay data owns positions, radii, neighbors, route order and validity. Rendering may interpolate display values but cannot rewrite those rules.
- Surface objects use the globe projection and surface anchor. Their base follows the Earth; the vertical stem and icon remain screen-up where required by the established marker design.
- Flying objects remain under the pointer within existing altitude/visibility limits. Do not reuse ground-anchor offsets for orbital drag.
- Assets used at runtime live under `app/`; no absolute workstation paths, CDN-only shaders or external texture dependencies.
- Reuse geometry/materials, pool transient objects, update uniforms in place and dispose resources that are genuinely removed.

## FX implementation

- Prefer existing `Points`, `InstancedMesh`, line geometry and shader uniforms before adding another engine.
- Represent node visuals as continuous parameters such as activation, wave opacity, emissive strength and error mix. Interpolate parameters instead of replacing meshes between states.
- Build links only from connections accepted by gameplay logic. Particles may travel along a link but cannot imply a connection that does not exist.
- Postprocessing is a presentation adapter. Use selective, brief effects and keep a no-postprocessing quality path.
- Random visual effects must use stable seeds or be freezable for deterministic capture.
- Add new tunable values to portable effect configuration/schema rather than scattering magic numbers.

## Verification

Run syntax, unit, build and portable checks appropriate to the changed files. Inspect for resource lifecycle and hot-path allocations. Do not perform interactive browser testing when the user has reserved that feedback loop for themselves.
