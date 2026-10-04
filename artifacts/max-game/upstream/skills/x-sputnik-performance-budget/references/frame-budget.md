# Frame budget

## Baseline targets

| Concern | Target |
|---|---|
| Primary presentation | Stable 60 FPS at 1920×1080 |
| Total frame time | About 16.7 ms or less |
| Pixel ratio | Configured cap; current design target no higher than 1.5 without measurement |
| Drag latency | Position follows the current pointer event without a visual catch-up tween |
| Hot-path allocations | Zero during steady state |
| Animation loops | One application/WebGL loop |

Draw-call, triangle, texture and particle limits must be established from a measured baseline on the target machine. Do not invent fixed limits and then optimize toward the wrong bottleneck.

## Quality degradation

Degraded quality may:

- reduce particle pool usage;
- reduce postprocessing resolution or disable chromatic aberration/noise;
- lower DPR to 1;
- update nonessential ambient effects less frequently;
- disable decorative trails.

It must not alter:

- node position, altitude or pickup offset;
- signal radius and link eligibility;
- projected left/right order;
- route correctness or objective timing;
- geographic marker coordinates.

## Hot-path checklist

- Reuse `Vector2`, `Vector3`, `Quaternion`, matrices and arrays.
- Mutate buffer attributes/uniforms in place.
- Rebuild a curve only when its control points change.
- Pool drop particles and packet markers.
- Do not compile shaders or upload textures during drag.
- Do not call DOM geometry reads after style writes in the same frame.
- Avoid broad blur/backdrop-filter changes during pointer movement.
- Clear abandoned timers, tweens, listeners and render resources.
