/*
 * Games Hub service worker — v4.1.6
 *
 * The local manifest below is generated from files that actually exist in the
 * repository. Missing/deprecated placeholder paths are intentionally omitted.
 * URLs are resolved against this worker's directory so GitHub Pages repository
 * deployments (for example /games-hub/) work the same as root deployments.
 */
const VERSION = '4.1.7';
const CACHE_PREFIX = 'games-hub-';
const CACHE = CACHE_PREFIX + VERSION;
const APP_BASE = new URL('./', self.location.href);
const APP_SCOPE_PATH = new URL(self.registration.scope).pathname;

const CORE = [
  "./CODE_OF_CONDUCT.md",
  "./CONTRIBUTING.md",
  "./LICENSE.txt",
  "./README.md",
  "./SECURITY.md",
  "./TODO.txt",
  "./applets/calculator.html",
  "./applets/chatroom.html",
  "./applets/clock.html",
  "./applets/control-panel.html",
  "./applets/makedata.html",
  "./applets/notes.html",
  "./applets/paint.html",
  "./applets/system-monitor.html",
  "./applets/timer.html",
  "./applets/weather.html",
  "./applets/web_proxy_browser_applet.html",
  "./changelog.txt",
  "./chat_export_global.txt",
  "./data.js",
  "./games/asphalt-rush.html",
  "./games/badracingsim.html",
  "./games/chronostrike.html",
  "./games/city-striker.html",
  "./games/clash.html",
  "./games/classics/alieninvaders.html",
  "./games/classics/breakthrough.html",
  "./games/classics/classicinfo.txt",
  "./games/classics/meteors.html",
  "./games/classics/neonpong.html",
  "./games/classics/pelletmuncher.html",
  "./games/classics/snake.html",
  "./games/enginesim.html",
  "./games/fieldkit_3d_engine.html",
  "./games/fps.html",
  "./games/gangwars.html",
  "./games/gh-clicker.html",
  "./games/ghengis.html",
  "./games/labyrinthine.html",
  "./games/legacysim.html",
  "./games/megalith.html",
  "./games/pixel-ops.html",
  "./games/warzone.html",
  "./games.html",
  "./index.html",
  "./links.txt",
  "./llms.txt",
  "./main.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./package.json",
  "./robots.txt",
  "./service-worker.js",
  "./sitemap.xml",
  "./styles.css",
  "./boot.js"
];

const IMAGES = [
  "./images/Beam.cur",
  "./images/Cursor_15.cur",
  "./images/IMG_1002.jpeg",
  "./images/IMG_1604.jpeg",
  "./images/IMG_1605.jpeg",
  "./images/IMG_1625.jpeg",
  "./images/IMG_1632.jpg",
  "./images/IMG_1669.jpeg",
  "./images/IMG_1671.jpeg",
  "./images/IMG_1677.jpeg",
  "./images/IMG_1691.jpeg",
  "./images/IMG_1723.jpeg",
  "./images/IMG_1802.jpeg",
  "./images/IMG_1803.jpeg",
  "./images/IMG_1804.jpeg",
  "./images/IMG_1806.jpeg",
  "./images/IMG_1808.jpeg",
  "./images/IMG_1891.jpeg",
  "./images/IMG_1922.jpeg",
  "./images/IMG_1923.jpeg",
  "./images/IMG_1941.jpeg",
  "./images/IMG_1987.jpeg",
  "./images/IMG_2376.jpeg",
  "./images/arrow.cur",
  "./images/construction.GIF",
  "./images/icon.JPG",
  "./images/icons/calculator.png",
  "./images/icons/chatroom.png",
  "./images/icons/clock.png",
  "./images/icons/notes.png",
  "./images/icons/paint.png",
  "./images/icons/weather.png",
  "./images/missing.png",
  "./images/tile.GIF",
  "./images/w95f.woff",
  "./images/w95f.woff2",
  "./images/windows.png",
  "./images/bootscreen.PNG",
  "./images/win95.mp3"
];

const PRECACHE = CORE.concat(IMAGES);

// Exact third-party URLs directly referenced by the HTML pages. Keep every
// version because different games intentionally use different library builds.
const EXTERNAL_DEPENDENCIES = [
  { url: "https://unpkg.com/@ruffle-rs/ruffle", mode: "no-cors" },
  { url: "https://unpkg.com/@ruffle-rs/ruffle@0.6.0", mode: "no-cors" },
  { url: "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/core.ruffle.c80159b526e567babaf5.js", mode: "no-cors" },
  { url: "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/core.ruffle.f000070ea72f8ae4fe3a.js", mode: "no-cors" },
  { url: "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/72a20ef1c0b8ceb37720.wasm", mode: "cors" },
  { url: "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/826bb0938097485a2c9d.wasm", mode: "cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/math/ConvexHull.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/geometries/ConvexGeometry.js", mode: "no-cors" },
  { url: "https://unpkg.com/three@0.160.0/build/three.module.js", mode: "cors" },
  { url: "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js", mode: "cors" },
  { url: "https://unpkg.com/three@0.186.1/build/three.module.js", mode: "cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js", mode: "cors" },
  { url: "https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js", mode: "cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.9.0/nipplejs.min.js", mode: "no-cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js", mode: "no-cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js", mode: "no-cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js", mode: "no-cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js", mode: "no-cors" },
  { url: "https://cdn.jsdelivr.net/npm/chart.js", mode: "no-cors" },
  { url: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", mode: "no-cors" },
  { url: "https://unpkg.com/x-frame-bypass@1.0.2", mode: "no-cors" },
  { url: "https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Roboto:wght@400;700&display=swap", mode: "no-cors" },
  { url: "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap", mode: "no-cors" }
 ];
// Hosts that serve static libraries, CSS, and font files used by this site.
// Dynamic APIs and proxy endpoints are intentionally excluded from runtime
// caching so changing weather, geolocation, or arbitrary proxied pages go live.
const STATIC_EXTERNAL_HOSTS = new Set([
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  // Analytics is fetched only if the page's consent flow opts in; it is not precached.
  'www.googletagmanager.com'
]);

function isInAppScope(url) {
  return url.origin === self.location.origin && url.pathname.startsWith(APP_SCOPE_PATH);
}

function isStaticExternalAsset(url) {
  return url.origin !== self.location.origin && STATIC_EXTERNAL_HOSTS.has(url.hostname);
}

function resolveLocal(path) {
  return new URL(path, APP_BASE).href;
}

async function cacheResponse(cache, request, response) {
  if (!response || (response.status !== 200 && response.type !== 'opaque')) return false;
  try {
    await cache.put(request, response.clone());
    return true;
  } catch (_) {
    // Quota, opaque-response restrictions, or browser storage policy must not
    // prevent the site from installing or serving the current network response.
    return false;
  }
}

async function precacheLocalFiles() {
  const cache = await caches.open(CACHE);
  await Promise.all(PRECACHE.map(async asset => {
    const url = resolveLocal(asset);
    try {
      const request = new Request(url, { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
      const response = await fetch(request);
      if (response.status === 200) await cache.put(request, response.clone());
    } catch (_) {
      // One missing/offline local resource should not make all the others fail.
    }
  }));
}

async function precacheExternalDependencies() {
  const cache = await caches.open(CACHE);
  await Promise.all(EXTERNAL_DEPENDENCIES.map(async ({ url, mode }) => {
    try {
      const request = new Request(url, { method: 'GET', cache: 'no-store', mode });
      const response = await fetch(request);
      await cacheResponse(cache, request, response);
    } catch (_) {
      // Offline installation or an unavailable CDN is non-fatal. Runtime fetches
      // will still retry the network and use a cached copy when one exists.
    }
  }));
}

async function precacheCore() {
  await Promise.all([precacheLocalFiles(), precacheExternalDependencies()]);
}

self.addEventListener('install', event => {
  event.waitUntil(precacheCore().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  } else if (event.data.type === 'REFRESH_CORE') {
    event.waitUntil(refreshCoreCache());
  }
});

async function refreshCoreCache() {
  await precacheCore();
  const cache = await caches.open(CACHE);
  const keep = new Set(PRECACHE.map(resolveLocal).concat(EXTERNAL_DEPENDENCIES.map(d => d.url)));
  const requests = await cache.keys();
  await Promise.all(requests.filter(request => {
    const url = new URL(request.url);
    if (isInAppScope(url)) {
      // Keep only manifested same-origin resources. This prunes deleted files,
      // stale query-string variants, and old placeholder paths from this cache.
      return !keep.has(url.href);
    }
    // Runtime-cached external static files (especially Google Fonts' generated
    // font URLs) stay cached; non-static external APIs are never added here.
    return !isStaticExternalAsset(url) && !keep.has(url.href);
  }).map(request => cache.delete(request)));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (isInAppScope(url)) {
    event.respondWith((async () => {
      try {
        // Network-first keeps pages fresh on deployment; a successful response
        // replaces the old cached version for the exact request URL.
        const response = await fetch(request, { cache: request.mode === 'navigate' ? 'no-store' : 'no-cache' });
        if (response.status === 200) {
          const cache = await caches.open(CACHE);
          await cacheResponse(cache, request, response.clone());
        }
        return response;
      } catch (_) {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Requests with cache-busting/query parameters can reuse the canonical
        // precached file when the network is unavailable.
        const canonicalURL = new URL(url.pathname, url.origin).href;
        const canonicalCached = await caches.match(canonicalURL);
        if (canonicalCached) return canonicalCached;
        if (request.mode === 'navigate') {
          return (await caches.match(resolveLocal('./index.html')))
            || (await caches.match(resolveLocal('./offline.html')))
            || Response.error();
        }
        return Response.error();
      }
    })());
    return;
  }

  if (isStaticExternalAsset(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      try {
        const response = await fetch(request);
        await cacheResponse(await caches.open(CACHE), request, response);
        return response;
      } catch (_) {
        if (cached) return cached;
        return Response.error();
      }
    })());
  }
  // Live APIs (weather/geocoding/GitHub/proxies), YouTube embeds, MQTT sockets,
  // and other external content remain network-controlled rather than cached.
});
