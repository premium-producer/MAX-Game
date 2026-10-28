# Unified transition button presentation

Local implementation, not deployed in this task.

Ordinary mission buttons used GPU groups inside the moving phone, whereas the last correction covered only the external posts/store controls. Native buttons could still inherit the phone exit trajectory after activation.

All visible task/mission transition controls now use kdw-transition-action.mjs: stationary composition-owned parent, placement before reveal/input, full reference width, opacity entry and fixed press/fade snapshot. kdw-transition-controls.mjs adapts authored client-actions/pc-forward/bn-source-forward to this presenter; WebGL posts/store mount the same presenter directly. The former activity-only presenter file is removed.

Authored sources retain their original command handlers and current tokens. While proxied, they are hidden in DOM and GPU/optical rendering, excluded from composition, pointer targeting and tab order; teardown restores their attributes. The proxy forwards exactly one click with existing disabled/inert/session/revision checks; native touch uses the existing down/entry and release suppression. The source's extra GPU highlight is suppressed to avoid an under-phone feedback duplicate. On accepted transitions the inert fixed feedback survives source removal for its short fade; rejected actions may retry.

Verification: digital-transition-browser.mjs follows create QR -> documents -> confirm -> biometry -> ready, taps the common control, and reaches digital-id.hotel.arrival. Every visible appearance frame is placed, entry movement <0.001 px, press feedback fixed, no live control after press; see digital-result.json/digital-trace.json. Digital-ready.png inspected. button-motion-browser.mjs separately passed posts/store entry/exit and mouse/touch after sharing the presenter. Composition/native-touch tests: 15 passed; generated main checked; local build succeeds. Electron/Spout wall testing is not claimed.

Live admin regression also passed: independent device/reference sizing, spacing/center changes, common transition click, profile save, and PC native-overlay alignment/navigation (ops/production-build/relative-layout-browser.mjs). Final local bundle SHA256: 8e0f046e583c7ccedc5d23eef97498d9da8a2172a9dd09798b06648033465319.
