# Colton's Project Launcher

**A Windows 95-inspired browser desktop, game launcher, utility suite, and social gaming hub.**

Live site: <https://coltjbennett.github.io/games-hub/>  
Source repository: <https://github.com/coltjbennett/games-hub>

Games Hub brings a collection of original browser games, classic arcade remakes, third-party games, desktop-style utilities, and an integrated chatroom into one retro-styled interface. It is built primarily with HTML, CSS, and JavaScript and is deployed as a static site with GitHub Pages.

## What is included?

### Desktop and launcher

- A Windows 95-inspired interface with a taskbar, Start-style menu, draggable and resizable application windows, minimize/restore/fullscreen controls, and multiple visual themes.
- A project catalogue with search, tags, favorites, recent projects, featured projects, and status labels.
- A command palette, preferences/control panel, network/status UI, and performance-oriented low-power behavior.
- PWA metadata and a service worker that precaches the shipped local pages/assets and selected CDN dependencies, then falls back to cached resources when offline.

### Original games and experiments

The main catalogue includes Asphalt Rush, Pixel Ops, Ghengis Khan Simulator, MEGALITH, City Striker, Chronostrike, Labyrinthine, Goblin Hut Clicker, Legacy Racing Sim, Royal Clash, Engine Sim, Warzone, Gang Wars, Racing Sim, the FPS multiplayer beta, and Fieldkit 3D Engine.

Projects have different levels of polish. The catalogue's status labels distinguish completed games from betas, legacy projects, abandoned prototypes, and games that remain in progress. The multiplayer FPS is an experimental engine test, not a finished commercial-style game. Pixel Ops is a separate single-player FPS project in the supplied source.

### Classic games

The `games/classics/` folder contains Alien Invaders, Break Through, Meteors, Neon Pong, Pellet Muncher, and Snake.

### Applets

The `applets/` folder contains the chatroom, scientific calculator, clock/stopwatch/alarm, control panel, project-snippet generator, notes, Paint-style canvas editor, system monitor/storage manager, timer, weather dashboard, and experimental proxy-browser applet.

### Third-party arcade

`games.html` loads a browsable catalogue from a separate GitHub repository. It can show HTML games and SWF content through Ruffle. Because this listing and many individual game dependencies come from other hosts, their availability depends on those services and on network access.

## Repository layout

```text
index.html                         Main desktop/launcher page
main.js                            Desktop logic, catalogue, windows, shortcuts, integration
styles.css                         Shared desktop theme and layout
data.js                            Site metadata, announcements, game catalogue, classics
service-worker.js                  Offline caching and cache-version management
manifest.webmanifest               Installable web-app metadata
offline.html                       Minimal offline navigation fallback
games.html                         Third-party games arcade
applets/                           Desktop utility applications and chatroom
games/                             Original games and experiments
games/classics/                    Small classic arcade remakes
images/                            App icons, screenshots, fonts, cursors, and backgrounds
sitemap.xml                        Search-engine URL inventory
llms.txt                           Human/machine-readable project index
changelog.txt                      Release notes
TODO.txt                           Known follow-ups and future ideas
package.json                       Dependency/version inventory for CDN libraries
```

The project is intentionally built from directly served static files; there is no frontend bundling/build step. Many games are self-contained HTML pages, while several use external rendering, physics, input, or utility libraries. The codebase retains more than one library version where different games rely on different APIs. In particular, the supplied pages use Three.js r128/0.128.0, 0.160.0, and 0.186.1; Cannon.js 0.6.2 and cannon-es 0.20.0; and NippleJS 0.9.0 and 0.10.1.

## Running locally

1. Download or clone the repository.
2. Serve the repository root with a local HTTP server (rather than opening `index.html` as a `file://` URL), because service workers, modules, storage behavior, and some browser APIs require an HTTP(S) origin.
3. Open the local site's `index.html` in a modern browser.

For example, if Python is installed, run this command from the repository root:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000/>. Some features will still require an internet connection, including live weather data, the remote arcade catalogue, external CDN libraries not already cached, and MQTT chat/multiplayer transport.

## Deployment

The site is deployed as a static GitHub Pages project. The workflow in `.github/workflows/static.yml` publishes the repository without compiling a bundle. The public site uses the repository subpath `/games-hub/`; local asset and service-worker URL handling should remain relative to the deployment scope rather than assuming the domain root.

When changing the offline manifest, update `VERSION` in `service-worker.js` so browsers install a fresh cache. The worker's local precache list should contain only paths that exist in the repository. External dependencies should be pinned where possible, and every version that is actually referenced by a page should be considered separately when updating the worker or dependency inventory.

## Offline behavior and limitations

The service worker precaches local pages and image assets and attempts to save the specified libraries from static CDN hosts. It also caches successful same-origin responses at runtime and uses cached pages as a fallback when navigation fails. External static libraries and fonts can be reused after they have been cached.

Offline support is best-effort, not a guarantee that every application works without the network. Live APIs (such as geocoding, weather, and repository contents), YouTube embeds, MQTT connections, proxy requests, and third-party sites continue to require network access. A cached HTML file can still depend on an uncached external asset. Browser storage quotas, privacy modes, and cache policies may also limit what can be retained.

## Chat, privacy, and storage

The integrated chat uses MQTT over WebSockets and browser-side persistence/synchronization. It includes global chat, DM-style tabs, replies, reactions, mentions, attachments, and presence/activity information. The site's exported history and local browser data have their own retention and backup behavior.

**Do not use the chat for sensitive or confidential information.** Treat messages and exported chat archives as potentially public. A DM tab in the current client should not be assumed to provide end-to-end encryption or transport-level confidentiality. Administrative and message-filtering behavior is implemented in client code and should not be treated as a secure authentication boundary.

The System Monitor includes browser-local data export/import functionality. This is a migration/backup aid, not a complete backup of every browser subsystem or external service. It cannot export data stored on another origin or on a remote service, and not every storage category (for example, browser cache/session data) is necessarily included. Back up important data separately before clearing storage or importing an archive, and inspect the import scope before restoring.

## Dependency notes

The pages load CDN assets directly. `package.json` is an inventory of the library versions and aliases used by the site, not a build manifest that must be installed to serve the static pages. Important libraries include:

- Three.js for 3D rendering, with multiple versions retained for compatibility with individual games.
- Cannon.js and cannon-es for physics.
- NippleJS for touch joysticks.
- MQTT.js for chat and experimental multiplayer networking.
- localForage and LZ-String for chat persistence/compression.
- Chart.js for weather graphs and JSZip for export/import.
- Ruffle for SWF playback in the arcade.
- x-frame-bypass for the experimental proxy-browser applet.

Some existing page URLs are unversioned CDN endpoints (notably Chart.js in the weather applet and Ruffle in the arcade). Those exact URLs are cached as best-effort resources, but the most reproducible long-term approach is to pin each such page reference to a specific version in a future source update.

## Contributing and reporting issues

Feature suggestions and bug reports can be filed through the GitHub issue templates. A useful bug report includes the exact page/game, browser and device, expected result, what actually happened, and steps to reproduce. Multiplayer or performance reports should mention whether the issue occurs on one device or across multiple devices.

See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md` for the current project guidance. The project is copyrighted and all rights are reserved under `LICENSE.txt`; public availability of the repository does not grant a general right to redistribute or reuse its code/assets.

## Project documentation

- [Changelog](changelog.txt)
- [Current task list](TODO.txt)
- [Site index for tools and assistants](llms.txt)
- [Sitemap](sitemap.xml)
