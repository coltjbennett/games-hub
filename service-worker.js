const CACHE = 'games-hub-v4-core-v4';
const CORE = [
  './', './index.html', './styles.css', './main.js', './data.js',
  './manifest.webmanifest', './offline.html',
  './images/icon.JPG', './images/icon-192.png', './images/icon-512.png',
  './images/windows.png', './images/icons/chatroom.png', './images/icons/paint.png',
  './images/icons/weather.png', './images/icons/notes.png', './images/icons/calculator.png', './images/icons/clock.png'
];
const MAX_CACHED_BYTES = 768 * 1024;
const CACHEABLE = /\.(?:css|js|json|webmanifest|png|jpe?g|gif|webp|avif|ico|cur|woff2?)$/i;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE && key.startsWith('games-hub-')).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function sameOrigin(url) { return url.origin === self.location.origin; }

function shouldCache(url, response) {
  if (!response || !response.ok) return false;
  if (!CACHEABLE.test(url.pathname)) return false;
  if (/\/images\/previews\//i.test(url.pathname) || /\/games\//i.test(url.pathname)) return false;
  const length = Number(response.headers.get('content-length'));
  return !Number.isFinite(length) || length <= MAX_CACHED_BYTES;
}

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'REFRESH_CORE') return;
  event.waitUntil(refreshCoreCache());
});

async function refreshCoreCache() {
  const cache = await caches.open(CACHE);
  await Promise.all(CORE.map(async asset => {
    try {
      const request = new Request(new URL(asset, self.location.href).href, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
    } catch (_) {
      // Offline or temporarily unavailable: leave the existing cached copy intact.
    }
  }));
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!sameOrigin(url)) return;

  // Always prefer the live site while online. Cache Storage is only a fallback
  // when the network request fails, so site updates are picked up immediately.
  event.respondWith(
    fetch(event.request, {
      cache: event.request.mode === 'navigate' ? 'no-store' : 'no-cache'
    }).then(response => {
      if (shouldCache(url, response)) {
        const copy = response.clone();
        event.waitUntil(
          caches.open(CACHE)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {})
        );
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
