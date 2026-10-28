# Button centering with live admin scaling

Local fix; no production deployment in this task.

Causes: the hidden native client-action remained in composition membership (visibility:hidden was not filtered), preventing the visible completion button from being recognized as the sole reference companion. External footer parents were also realigned after composition, displacing the already positioned child.

Composition now excludes invisible transition buttons, restores external footers to authored device-relative geometry before measurement, and reapplies their absolute target after the activity renderer updates parent placement. Device placement explicitly follows the device center/scale and bottom gap; reference placement centers the combined reference/button block vertically on the device. Existing event ownership, actions, input, saved profiles and live layout API are retained.

Validation: 15 focused geometry/action tests; generated-source check; MAX build; existing relative-layout browser scenario (phone actions, live sizing, save, PC hotspot and native overlay); new browser regression completes posts/store and clicks completion in both reference/device modes. Sixteen measured layouts vary common scale 70/100/120%, device scale 65/100/140%, reference width 90/110/130%, and horizontal offset, including returning to initial settings without reload. Maximum settled center error: 0.000427 viewport pixels. See browser.json and ops/production-build/button-centering-browser.mjs.

Scope: local Chromium geometry and successful button navigation. Activity preview screenshots do not show the reference surface in this preview configuration; reference bounds were measured from live layout, not used as evidence of visible GPU reference rendering. Production Electron/Spout wall verification remains for the next explicitly authorized update.


## Follow-up: full-width navigation buttons

Per user request, reference-attached transition buttons now have exactly the reference panel width, rather than retaining the former smaller button/reference ratio. Height, text and radii scale uniformly with the button; the combined block is recentered vertically using the new height. Device-attached historical mode is unchanged.

Validation: focused geometry tests and generated-source check pass; local build completed. The latest browser.json contains eight full-width cases (posts/store, live common/device/reference size changes and reset). Width and center assertions and successful completion-button clicks pass. Maximum width difference: 0.001099 px. Still local only.


## Production deployment

Installed on logical max-game-pc / DESKTOP-64J4BMN by explicit user request: BUTTON-WIDTH-CENTER-MAX-20261028-1, completed 2026-10-28 07:21:38 UTC (10:21:38 Moscow). Three files, 7,675,206 compressed bytes; transfer 2.50 seconds. Installer preserved 11 settings/data files and restarted MAX only. All three installed hashes match the locally tested build. Both Spout outputs ready and producing frames, inputActive=true, LiDAR enabled/bound without errors, performance history continues without dropped rows or write errors. No contact packets arrived during this short post-restart check; visitor interaction on the wall was not independently exercised. See ../stand-patches/BUTTON-WIDTH-CENTER-MAX-20261028-1/verification.json and stella-status.json. Stella and CHUWI untouched.
