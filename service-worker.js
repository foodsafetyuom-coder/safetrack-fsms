/* ============================================================
   SafeTrack FSMS — Service Worker v1.0
   Stratégie : Cache-first pour assets, Network-first pour API
   ============================================================ */

const CACHE_NAME = 'safetrack-v1';
const OFFLINE_PAGE = '/offline.html';

/* Fichiers mis en cache au premier chargement */
const PRECACHE_ASSETS = [
  '/',
  '/sensibilis.html',
  '/admin.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/* Domaines considérés comme API (pas mis en cache) */
const API_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com'
];

/* ── Installation : précache des assets statiques ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activation : nettoyage des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch : stratégie hybride ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* 1. Requêtes API Apps Script → Network-first (pas de cache) */
  if (API_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Hors ligne — données non disponibles.' }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  /* 2. Assets statiques → Cache-first, fallback offline */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          /* Mettre en cache les nouvelles ressources GET valides */
          if (
            event.request.method === 'GET' &&
            response.status === 200 &&
            response.type !== 'opaque'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
        .catch(() =>
          /* Fallback page hors ligne pour les navigations HTML */
          event.request.mode === 'navigate'
            ? caches.match(OFFLINE_PAGE)
            : new Response('', { status: 503 })
        );
    })
  );
});

/* ── Message : forcer la mise à jour du cache ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
