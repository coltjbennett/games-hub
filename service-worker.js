const CACHE = 'games-hub-v4-core-v3';
const CORE = [
  './', './index.html', './styles.css', './main.js', './data.js',
  './manifest.webmanifest', './offline.html',
  './images/icon.JPG', './games.html',
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!sameOrigin(url)) return;

  // Navigation responses are no longer re-put on every page open. The previous
  // behavior caused avoidable persistent Cache Storage churn.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')).then(r => r || caches.match('./offline.html')));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (shouldCache(url, response)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}));
      }
      return response;
    });
  }));
});
