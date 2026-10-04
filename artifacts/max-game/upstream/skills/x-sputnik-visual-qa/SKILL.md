---
name: x-sputnik-visual-qa
description: Review X-SPUTNIK visuals against references and established contracts: five screen states, persistent shell geometry, Earth framing and masking, geographic markers, node states, route order, drag continuity, transitions, and FX readability. Use for screenshot/reference comparison or visual regression review; do not open an interactive browser unless the user asks.
---

# X-SPUTNIK visual QA

Judge the implementation against the supplied reference and current product contracts, not generic visual taste.

## Before reviewing

1. Read [references/visual-contract.md](references/visual-contract.md).
2. Read the relevant sections of `app/DOCS/GDD.md`, `UI_SHELL_CONFIG.md` and mission documentation.
3. Inspect every reference image supplied in the current task at original detail when possible.
4. Load `x-sputnik-motion-system` for transition review, `x-sputnik-three-effects` for Earth/node/FX review, and `web-design-guidelines` only when the request includes UI/UX/accessibility best-practice auditing.

## Review rules

- Distinguish a mismatch in geography/camera from a mismatch in CSS overlay placement.
- Treat A/Б, mission markers and placed nodes as surface-anchored systems: base, stem and icon must be evaluated together.
- Confirm that the game-frame is the Earth mask on every non-CTA screen.
- Review the five shell states as variants of one persistent element; flag jumps caused by different coordinate systems.
- For drag, compare the exact grab point before and after motion begins. A change in icon, stem or base anchor is a functional defect.
- For network display, verify only nearest immediate left/right neighbors, individual signal radii and current projected route order.
- Separate blocking functional mismatches from polish observations.

## Browser boundary

Use supplied screenshots, local files and static/code checks by default. The project owner has reserved interactive feel testing and will report whether drag and motion work. Use browser automation, screenshots or performance traces only when explicitly requested in the current task.

When delivering a review, lead with the visible mismatch and cite the relevant file/contract. Do not change code unless the user asked for implementation.
