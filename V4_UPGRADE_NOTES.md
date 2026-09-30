# Games Hub v4.0 Upgrade Notes

## Launcher / UX

- Control Panel applet with three visual themes, CRT toggle, reduced-motion, compact mode, high-contrast mode, local-data maintenance, and PWA installation support.
- System Monitor applet with browser capability diagnostics, live render FPS, storage quota/usage, network status, viewport and device metrics.
- Countdown Timer applet with presets, custom time, pause/reset, and optional completion sound.
- Quick Launch command palette (`Ctrl+K` or `/`) with searchable sections, applets, and every cataloged project.
- Start menu entries for the new utility suite.
- Persistent Favorites and Recent Projects stored in browser-local storage.
- Copy-link buttons on project cards.
- Live network indicator and non-blocking launcher toast notifications.
- Reduced-motion / compact / high-contrast presentation modes.

## Offline / installation

- Added `manifest.webmanifest` for installable standalone launch.
- Added `service-worker.js` with a small core shell cache, runtime same-origin caching, network-first navigation, and offline fallback.
- Added generated 192px/512px launcher icons from the existing site icon.

## Arcade reliability

- The GitHub directory snapshot can now be mirrored into Cache Storage.
- Temporary API/rate-limit/network failures can fall back to the most recent cached directory.
- Existing localStorage daily cache behavior remains intact.

## Chat quality of life

- Added an explicit MQTT state badge for CONNECTING / CONNECTED / RECONNECTING / DISCONNECTED / OFFLINE / ERROR states.
- Existing history/sync logic remains unchanged by this UI enhancement.

## Small fixes

- Fixed the Gang Wars return-home link.
- Updated the site version to v4.0.0 and refreshed the launcher last-updated metadata.

## Verification

- `node --check main.js` — pass
- `node --check service-worker.js` — pass
- `node --check data.js` — pass
- All executable inline `<script>` blocks in the HTML corpus — pass (38 checked; import-map JSON blocks excluded from JavaScript syntax checking)
- Local HTML asset/reference sweep — 0 missing local references
