---
name: x-sputnik-motion-system
description: Design or change motion in the X-SPUTNIK web game: screen transitions, persistent UI-shell choreography, node-state animation, drag feedback, route reordering, camera settling, easing, timing, and GSAP/CSS/WAAPI choices. Use for implementation and review of motion; do not use for static copy or unrelated gameplay rules.
---

# X-SPUTNIK motion system

Preserve the feeling of one continuous application built around one persistent Earth and UI shell. Motion explains a state change; it never decides gameplay state.

## Before editing

1. Read [references/motion-contract.md](references/motion-contract.md).
2. Read the relevant sections of `app/DOCS/GDD.md` and `app/DOCS/UI_SHELL_CONFIG.md`.
3. Inspect the current state transition and its JSON configuration before proposing new constants.
4. Load the applicable external skills: `web-animation-design`; `gsap-core` and `gsap-timeline` for choreography; `gsap-plugins` for FLIP/Draggable; `gsap-performance` when smoothness is part of the task.

## Required architecture

- The reducer remains the source of truth. Animation completion must not establish links, validate routes, complete objectives, or move an object in gameplay state.
- Translate reducer changes into semantic FX events, then let one owner coordinate DOM, Three.js uniforms/camera and optional post effects.
- Give each target/property one active animation owner. On interruption, kill, overwrite, reverse, or continue from the rendered value; never stack unknown tweens.
- Keep motion values in portable JSON/config or shared tokens. Do not add machine-local paths or CDN dependencies.
- Preserve `prefers-reduced-motion`: replace spatial/camera spectacle with an immediate or short non-spatial state change while retaining information.

## Interaction invariants

- Pointer drag is direct: the grabbed point stays under the pointer. Do not tween the dragged object's gameplay position behind the cursor.
- Animate pickup/drop decoration around the authoritative position, not the position itself.
- `dropped → waking → active → linked/wrong` must crossfade or interpolate; avoid replacing the whole node or resetting its transform.
- The persistent shell changes geometry as one coordinated transition. Header, frame, footer, mask and inventory must not use conflicting durations.
- Footer route reordering reflects current projected left-to-right positions. Animate its visual reorder with FLIP only after the order has been computed by gameplay logic.

## Implementation choice

Use the cheapest mechanism that preserves interruption and synchronization:

- CSS transition/animation for isolated predetermined transform/opacity changes.
- WAAPI for a small imperative sequence owned by the browser.
- GSAP timeline for multi-part screen, camera, node, or success choreography.
- Existing Three.js animation loop for continuous uniforms and geometry updates; do not create another RAF loop.

After editing, run the project's deterministic checks. Do not initiate interactive browser QA when the user has asked to provide visual feedback themselves.
