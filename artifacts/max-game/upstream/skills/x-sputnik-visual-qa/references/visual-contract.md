# Visual contract

## Five screens

| Screen | Earth | Shell |
|---|---|---|
| CTA | Fullscreen, live | Hidden |
| Onboarding | Live, blurred/dimmed, clipped to frame | Header/frame/footer revealed |
| Mission selection | Live, clipped to frame | Header/frame/footer; geographic mission cards |
| Game | Same Earth scale, clipped to narrowed frame | Header, narrowed frame/footer, right inventory |
| End | Live, blurred/dimmed, clipped to frame | Full shell and end controls |

## Stable composition

- The Earth is one continuous scene across all screens.
- Russia framing follows the approved reference, not an abstract center such as the Urals.
- The mission screen and game use the same accepted Earth zoom unless configuration explicitly changes.
- Frame/footer/header gaps derive from one layout system.
- Earth, backdrop blur and dim never leak outside the frame except on CTA.

## Markers and nodes

- Mission cards and A/Б are geographically anchored to the rotating globe.
- Surface bases visually touch the Earth; the stem meets the base and the icon remains readable.
- Node state changes preserve center, grab offset and screen scale.
- Waves grow from each node's own radius and are not decorative evidence of a nonexistent link.
- Links exist only for accepted nearest left/right neighbors whose radii reach.
- Footer order mirrors current projected left-to-right placement and updates after rearrangement.

## Motion checkpoints

Review `dropped`, early/mid/late `waking`, `active`, `linked`, `wrong`, route reorder, success pulse, popup entry and return to mission selection. A transition is correct only if its intermediate frames preserve geometry and interaction, not merely its endpoint.

## Severity

- Blocking: gameplay meaning, drag, visibility, masking, anchoring, route or mission status is wrong.
- Major: transition jumps, clips, flickers or causes composition to contradict the reference.
- Polish: timing, glow intensity, easing or small alignment needs refinement without changing meaning.
