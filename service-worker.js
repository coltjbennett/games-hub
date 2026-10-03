// Bump VERSION on every release. The cache name is derived from it, so each
// release gets a brand-new cache and the activate step deletes all old ones.
const VERSION = '4.1.6';
const CACHE_PREFIX = 'games-hub-';
const CACHE = CACHE_PREFIX + VERSION;
const CORE = [
  './.gitignore', './changelog.txt', './chat_export_global.txt', './data.js',
  './dependencies.js', './games.html', './index.html', './LICENSE.txt', './llms.txt',
  './main.js', './manifest.webmanifest', './offline.html', './package.json', './robots.txt',
  './service-worker.js', './sitemap.xml', './styles.css',
  './applets/calculator.html', './applets/chatroom.html', './applets/clock.html',
  './applets/control-panel.html', './applets/makedata.html', './applets/notes.html',
  './applets/paint.html', './applets/placeholder.txt', './applets/system-monitor.html',
  './applets/timer.html', './applets/weather.html', './applets/web_proxy_browser_applet.html',
  './games/asphalt-rush.html', './games/badracingsim.html', './games/chronostrike.html',
  './games/city-striker.html', './games/clash.html', './games/classics/alieninvaders.html',
  './games/classics/breakthrough.html', './games/classics/classicinfo.txt',
  './games/classics/meteors.html', './games/classics/neonpong.html',
  './games/classics/pelletmuncher.html', './games/classics/snake.html', './games/enginesim.html',
  './games/fps.html', './games/gangwars.html', './games/gh-clicker.html', './games/ghengis.html',
  './games/labyrinthine.html', './games/legacysim.html', './games/megalith.html',
  './games/pixel-ops.html', './games/placeholder.txt', './games/warzone.html'
];

// Every file in /images and its subfolders.
const IMAGES = [
  './images/Beam.cur', './images/Cursor_15.cur', './images/IMG_1002.jpeg', './images/IMG_1604.jpeg',
  './images/IMG_1605.jpeg', './images/IMG_1625.jpeg', './images/IMG_1632.jpg', './images/IMG_1669.jpeg',
  './images/IMG_1671.jpeg', './images/IMG_1677.jpeg', './images/IMG_1691.jpeg', './images/IMG_1723.jpeg',
  './images/IMG_1802.jpeg', './images/IMG_1803.jpeg', './images/IMG_1804.jpeg', './images/IMG_1806.jpeg',
  './images/IMG_1808.jpeg', './images/IMG_1891.jpeg', './images/IMG_1922.jpeg', './images/IMG_1923.jpeg',
  './images/IMG_1941.jpeg', './images/IMG_1987.jpeg', './images/IMG_2376.jpeg', './images/arrow.cur',
  './images/construction.GIF', './images/icon.JPG', './images/missing.png', './images/tile.GIF',
  './images/tile2.GIF', './images/w95f.woff', './images/w95f.woff2', './images/windows.png',
  './images/icons/blank.txt', './images/icons/calculator.png', './images/icons/chatroom.png',
  './images/icons/clock.png', './images/icons/notes.png', './images/icons/paint.png',
  './images/icons/weather.png',
  './images/previews/placeholder.txt', './images/previews/preview1.PNG', './images/previews/preview2.PNG',
  './images/previews/preview3.PNG', './images/previews/preview4.PNG', './images/previews/preview5.PNG'
];
const PRECACHE = CORE.concat(IMAGES);

// Exact external library URLs used by the site.
// Classic scripts use no-cors because that is how the browser loads ordinary
// cross-origin <script> resources; the response can still be stored opaquely.
// Modules/WASM are fetched with CORS and must retain their readable response.
const EXTERNAL_DEPENDENCIES = [
  { url: 'https://unpkg.com/@ruffle-rs/ruffle@0.6.0', mode: 'no-cors' },
  { url: 'https://unpkg.com/@ruffle-rs/ruffle@0.6.0/core.ruffle.c80159b526e567babaf5.js', mode: 'cors' },
  { url: 'https://unpkg.com/@ruffle-rs/ruffle@0.6.0/core.ruffle.f000070ea72f8ae4fe3a.js', mode: 'cors' },
  { url: 'https://unpkg.com/@ruffle-rs/ruffle@0.6.0/72a20ef1c0b8ceb37720.wasm', mode: 'cors' },
  { url: 'https://unpkg.com/@ruffle-rs/ruffle@0.6.0/826bb0938097485a2c9d.wasm', mode: 'cors' },
  { url: 'https://unpkg.com/three@0.160.0/build/three.module.js', mode: 'cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/math/ConvexHull.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/geometries/ConvexGeometry.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.9.0/nipplejs.min.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js', mode: 'no-cors' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js', mode: 'no-cors' },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js', mode: 'no-cors' },
  { url: 'https://unpkg.com/x-frame-bypass@1.0.2', mode: 'cors' }
];
const EXTERNAL_DEPENDENCY_URLS = new Set(EXTERNAL_DEPENDENCIES.map(dep => dep.url));

async function cacheResponse(cache, request, response) {
  if (!response) return false;
  // Opaque no-cors responses have status 0 / ok=false, but they are valid
  // Cache Storage entries and are exactly what ordinary CDN <script> loads use.
  if (!response.ok && response.type !== 'opaque') return false;
  try {
    await cache.put(request, response.clone());
    return true;
  } catch (_) {
    return false;
  }
}

async function precacheCore() {
  const cache = await caches.open(CACHE);
  await Promise.all(PRECACHE.map(async asset => {
    try {
      const request = new Request(new URL(asset, self.location.href).href, { cache: 'no-store', credentials: 'same-origin' });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
    } catch (_) {}
  }));

  await Promise.all(EXTERNAL_DEPENDENCIES.map(async ({ url, mode }) => {
    try {
      const request = new Request(url, { cache: 'no-store', mode });
      const response = await fetch(request);
      await cacheResponse(cache, request, response);
    } catch (_) {
      // A CDN being temporarily unavailable must not prevent the worker from installing.
    }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheCore().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE && key.startsWith(CACHE_PREFIX)).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function isExternalDependency(url) {
  return EXTERNAL_DEPENDENCY_URLS.has(url.href);
}

function shouldCache(url, response) {
  // Only full 200 responses (cache.put rejects 206 partial responses anyway).
  if (!response || !response.ok || response.status !== 200) return false;
  const path = url.pathname.replace(/^\/+/, '');
  if (path.toLowerCase().endsWith('.md')) return false;
  return !path.includes('/') || path.startsWith('games/') || path.startsWith('applets/') || path.startsWith('images/');
}

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data.type === 'REFRESH_CORE') {
    event.waitUntil(refreshCoreCache());
  }
});

async function refreshCoreCache() {
  await precacheCore();
  // Drop anything cached at runtime that is no longer part of the precache set
  // (renamed/deleted files, old query-string variants) so storage can't balloon.
  const cache = await caches.open(CACHE);
  const keep = new Set(PRECACHE.map(a => new URL(a, self.location.href).href).concat(EXTERNAL_DEPENDENCIES.map(d => d.url)));
  const requests = await cache.keys();
  await Promise.all(requests.filter(r => !keep.has(r.url)).map(r => cache.delete(r)));
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isExternalDependency(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE);
        await cacheResponse(cache, event.request, response);
        return response;
      } catch (_) {
        if (cached) return cached;
        throw new Error('External dependency unavailable and no cached copy exists.');
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: event.request.mode === 'navigate' ? 'no-store' : 'no-cache' }).then(response => {
      if (shouldCache(url, response)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await caches.match('./index.html')) || (await caches.match('./offline.html')) || Response.error();
      }
      throw new Error('Network request failed and no cached response is available.');
    })
  );
});
