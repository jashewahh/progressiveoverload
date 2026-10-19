/* IronSheet service worker — OPTIONAL companion to index.html.
   Browsers refuse to register a service worker from inline code or a data/blob URL,
   so this tiny file sits next to index.html. Without it, IronSheet still works
   (all data lives in localStorage); with it, the app shell launches with zero signal. */
const CACHE = 'ironsheet-v1';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['./index.html']).then(() => c.add('./').catch(() => {})))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Stale-while-revalidate: instant launch from cache (gym basements have bad signal),
// refresh the cached copy in the background when the network is available.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(key, { ignoreSearch: true });
      const network = fetch(req)
        .then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
