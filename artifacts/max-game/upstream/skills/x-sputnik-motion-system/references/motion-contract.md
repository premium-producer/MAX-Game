# Motion contract

## State choreography

| State change | Required continuity |
|---|---|
| CTA → onboarding | Keep the same Earth/camera object; settle toward the configured state view while revealing the shell |
| Onboarding → missions | Remove blur/dim and settle toward the configured state view without rebuilding Earth |
| Missions → game | Keep the persistent scene; coordinate the configured camera view, narrower frame/footer and inventory as one transition |
| Game → success | Illuminate the authoritative route before showing the popup |
| Success → missions | Return shell geometry cleanly and expose the newly unlocked mission |
| Any → end | Keep Earth inside the frame, use state blur/dim, and settle motion before final controls |

## Motion language

- Micro feedback: fast, restrained, no bounce unless it communicates elastic drag limits.
- Enter/exit: responsive ease-out; existing on-screen movement: ease-in-out; constant signal travel: linear.
- Large shell/camera transitions may be cinematic but must remain interruptible.
- Repeated pulses should vary phase, not layout geometry.
- Paired elements share timing: frame/mask, modal/backdrop, icon/stem/base, link/packet flow.

## Semantic FX events

Prefer events such as `screen:leaving`, `screen:entered`, `node:pickup`, `node:dropped`, `node:waking`, `node:awake`, `link:connected`, `link:disconnected`, `route:changed`, `route:wrong`, and `mission:success`. Payloads contain stable IDs and values, never DOM nodes or Three.js instances.

## Failure patterns to prevent

- Teleport on drag start from mixing icon/stem/base anchors.
- A delayed state transition writing an obsolete position after a new drag begins.
- Multiple tweens fighting over the same transform.
- Recreating markup or WebGL objects to display a new visual state.
- CSS transitions on `top`, `left`, `width`, or `height` during pointer movement.
- Visual route animation changing the actual route order.
