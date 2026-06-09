const CACHE = 'tcghub-v1';
const URLS = ['/', '/comprar', '/mercado', '/colecao', '/colecoes'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
