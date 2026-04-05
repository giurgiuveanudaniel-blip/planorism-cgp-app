// ===============================
// SERVICE WORKER – Planorism CGP PWA
// Versiune: v3
// Strategie: Cache-first pentru toate asset-urile
// (fără audio – eliminat din proiect)
// ===============================

const CACHE_NAME = 'planorism-cgp-v3';

// Toate fișierele care trebuie să fie disponibile offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Imagini capitole
  './images/cap1_hartamintala.png',
  './images/cap1_infografic.png',
  './images/cap2_hartamintala.png',
  './images/cap2_infografic.png',
  './images/cap3_hartamintala.png',
  './images/cap3_infografic1.png',
  './images/cap3_infografic2.png',
  './images/cap4_hartamintala.png',
  './images/cap4_infografic.png',
  './images/cap5_hartamintala.png',
  './images/cap5_infografic.png'
];

// ─────────────────────────────
// INSTALL – pre-cache toate asset-urile
// ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching core assets...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] All assets cached. Skipping waiting.');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] Cache install error:', err))
  );
});

// ─────────────────────────────
// ACTIVATE – șterge cache-urile vechi
// ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      console.log('[SW] Activated. Claiming clients.');
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────
// FETCH – Cache First cu fallback la rețea
// ─────────────────────────────
self.addEventListener('fetch', event => {

  // Ignoră requesturi non-HTTP (chrome-extension://, etc.)
  if (!event.request.url.startsWith('http')) return;

  // Ignoră requesturi POST/PUT
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {

      // Returnează din cache dacă există
      if (cached) {
        return cached;
      }

      // Altfel, fetch de la rețea și salvează în cache
      return fetch(event.request).then(response => {

        // Cache doar răspunsuri valide și de tip basic (same-origin)
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;

      }).catch(() => {

        // Fallback offline: returnează index.html pentru cereri HTML
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }

        // Pentru imagini lipsă, returnează răspuns gol
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          return new Response('', {
            status: 404,
            headers: { 'Content-Type': 'image/png' }
          });
        }

        // Generic offline response
        return new Response('Offline – Conținut indisponibil', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

      });

    })
  );
});
