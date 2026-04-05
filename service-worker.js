const CACHE_NAME = 'planorism-cgp-v4';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',

  './images/cap1_hartamintala.jpg',
  './images/cap1_infografic.jpg',
  './images/cap2_hartamintala.jpg',
  './images/cap2_infografic.jpg',
  './images/cap3_hartamintala.jpg',
  './images/cap3_infografic1.jpg',
  './images/cap3_infografic2.jpg',
  './images/cap4_hartamintala.jpg',
  './images/cap4_infografic.jpg',
  './images/cap5_hartamintala.jpg',
  './images/cap5_infografic.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }

        if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          return new Response('', {
            status: 404,
            headers: { 'Content-Type': 'image/jpeg' }
          });
        }

        return new Response('Offline – Conținut indisponibil', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
