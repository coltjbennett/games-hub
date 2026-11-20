/*
 * Games Hub root service worker  (scope: the folder this file is served from)
 *
 * One worker per scope is allowed, so this file does two jobs:
 *   1. Scramjet: requests under <scope>scramjet/ are handed to the Scramjet proxy engine.
 *   2. Everything else falls through, untouched, to the site's existing offline/PWA worker
 *      (service-worker.js), which is loaded below with importScripts.
 *
 * If the Scramjet files have not been generated yet (see scripts/setup-proxy.js) the
 * site keeps working exactly as before; only the proxy browser is unavailable.
 */
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const SJ_PREFIX = SCOPE_PATH + 'scramjet/';   // must match "prefix" in the applet's ScramjetController
let sj = null;
const SW_BUILD = 'proxy-2026-11-20a';   // bump to force browsers to install a fresh copy of this worker

try {
  importScripts('./scram/scramjet.all.js');
  const { ScramjetServiceWorker } = $scramjetLoadWorker();
  sj = new ScramjetServiceWorker();
} catch (err) {
  console.warn('[sw.js] Scramjet not available; proxy disabled:', err && err.message);
}

// This listener is registered BEFORE the site worker's own fetch listener, so proxied
// requests are answered here and stopImmediatePropagation() keeps the cache worker from
// also trying to answer them.
self.addEventListener('fetch', event => {
  if (!sj) return;
  let url;
  try { url = new URL(event.request.url); } catch (_) { return; }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SJ_PREFIX)) return;
  event.stopImmediatePropagation();
  event.respondWith((async () => {
    await sj.loadConfig();
    if (sj.route(event)) return sj.fetch(event);
    return fetch(event.request);
  })());
});

// Lets the applet ask whether the proxy engine actually loaded in this worker.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SJ_STATUS' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ sj: !!sj, build: SW_BUILD });
  }
});

// The existing offline/PWA worker (install, activate, caching, messages).
importScripts('./service-worker.js');
