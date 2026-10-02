const CACHE = 'games-hub-v4-core-v6';
const VERSION = '4.1.3';
const CORE = [
  './.gitignore',
  './changelog.txt',
  './chat_export_global.txt',
  './data.js',
  './games.html',
  './index.html',
  './LICENSE.txt',
  './llms.txt',
  './main.js',
  './manifest.webmanifest',
  './offline.html',
  './package.json',
  './robots.txt',
  './service-worker.js',
  './sitemap.xml',
  './styles.css',
  './applets/calculator.html',
  './applets/chatroom.html',
  './applets/clock.html',
  './applets/control-panel.html',
  './applets/makedata.html',
  './applets/notes.html',
  './applets/paint.html',
  './applets/placeholder.txt',
  './applets/system-monitor.html',
  './applets/timer.html',
  './applets/weather.html',
  './applets/web_proxy_browser_applet.html',
  './games/asphalt-rush.html',
  './games/badracingsim.html',
  './games/chronostrike.html',
  './games/city-striker.html',
  './games/clash.html',
  './games/classics/alieninvaders.html',
  './games/classics/breakthrough.html',
  './games/classics/classicinfo.txt',
  './games/classics/meteors.html',
  './games/classics/neonpong.html',
  './games/classics/pelletmuncher.html',
  './games/classics/snake.html',
  './games/enginesim.html',
  './games/fps.html',
  './games/gangwars.html',
  './games/gh-clicker.html',
  './games/ghengis.html',
  './games/labyrinthine.html',
  './games/legacysim.html',
  './games/megalith.html',
  './games/pixel-ops.html',
  './games/placeholder.txt',
  './games/warzone.html'
];
const MAX_CACHED_BYTES = 768 * 1024;

async function precacheCore() {
  const cache = await caches.open(CACHE);
  await Promise.all(CORE.map(async asset => {
    try {
      const request = new Request(new URL(asset, self.location.href).href, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (_) {
      // A repo-only or unpublished root file should not block the new worker.
    }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheCore().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE && key.startsWith('games-hub-')).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function sameOrigin(url) { return url.origin === self.location.origin; }

function shouldCache(url, response) {
  if (!response || !response.ok) return false;
  const path = url.pathname.replace(/^\/+/, '');
  if (path.toLowerCase().startsWith('images/')) return false;
  if (path.toLowerCase().endsWith('.md')) return false;

  // Only keep files from the site root, games/, games/classics/, or applets/.
  const allowed = !path.includes('/') || path.startsWith('games/') || path.startsWith('applets/');
  if (!allowed) return false;

  const length = Number(response.headers.get('content-length'));
  return !Number.isFinite(length) || length <= MAX_CACHED_BYTES;
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
