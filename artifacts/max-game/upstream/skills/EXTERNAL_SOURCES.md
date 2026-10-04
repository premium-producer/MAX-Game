# External agent skills

Installed into this project on 2026-09-04. These are instruction packages for agents; their presence does not install runtime npm dependencies.

| Local directory | Source repository and path | Intended use |
|---|---|---|
| `gsap-core` | `greensock/gsap-skills:skills/gsap-core` | GSAP tweens, easing, reduced motion |
| `gsap-timeline` | `greensock/gsap-skills:skills/gsap-timeline` | Coordinated and interruptible sequences |
| `gsap-plugins` | `greensock/gsap-skills:skills/gsap-plugins` | FLIP, Draggable, Inertia and other plugins |
| `gsap-utils` | `greensock/gsap-skills:skills/gsap-utils` | Clamp, mapping, interpolation and snapping |
| `gsap-performance` | `greensock/gsap-skills:skills/gsap-performance` | GSAP/DOM animation performance |
| `web-design-guidelines` | `vercel-labs/agent-skills:skills/web-design-guidelines` | Explicit UI/UX/accessibility audits |
| `web-animation-design` | `vercel-labs/open-agents:.agents/skills/web-animation-design` | Motion design, timing and accessibility |
| `threejs` | `MengTo/Skills:agent-skills/web-design/threejs` | General Three.js implementation guidance |
| `phase` | `vercel-labs/phase:skills/phase` | Production animation/render-loop audits |

## Audit note

The installed trees were inspected after download. The only executable file is `phase/scripts/scan.mjs`. It scans source text, invokes Git only when explicitly called with `--diff`, writes a baseline only with explicit `--write-baseline`, and can append a GitHub Actions summary when that environment variable is present. It is not automatically executed.

Before refreshing an external skill, compare its current source and executable files. Do not overwrite the project-specific `x-sputnik-*` skills with generic upstream content.
