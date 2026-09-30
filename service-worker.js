const CACHE='games-hub-v4-core';
const CORE=['./','./index.html','./styles.css','./main.js','./data.js','./manifest.webmanifest','./offline.html','./images/icon.JPG','./images/icon-192.png','./images/icon-512.png','./images/windows.png','./images/icons/chatroom.png','./images/icons/paint.png','./images/icons/weather.png','./images/icons/notes.png','./images/icons/calculator.png','./images/icons/clock.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function sameOrigin(url){return url.origin===self.location.origin}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(!sameOrigin(url))return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return resp}).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{const network=fetch(event.request).then(resp=>{if(resp.ok)caches.open(CACHE).then(c=>c.put(event.request,resp.clone()));return resp}).catch(()=>cached);return cached||network}));
});
