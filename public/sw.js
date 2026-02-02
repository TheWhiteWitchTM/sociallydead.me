// public/sw.js
const CACHE_NAME = 'mirasworld-cache-v1';
const STATIC_ASSETS = [
  '/',                    // root page (shell)
  '/offline',        // we'll create this next
  '/icon.svg',
  '/favicon.svg',
  // Add more: '/_next/static/chunks/main.js' etc. if you know them
  // Or leave minimal — browser will cache on navigation
];

// 1. Install: precache important static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
});

// 2. Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of the page immediately
  self.clients.claim();
});

// 3. Fetch: cache-first for static, network-first for dynamic/API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin, dev stuff, etc.
  if (event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||     // don't cache APIs
    url.pathname.startsWith('/_next/image') // let Next handle images
  ) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Cache hit → return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // Cache miss → fetch from network, then cache the response
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid 200 responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Network failed → fallback to offline page
        return caches.match('/offline.html');
      });
    })
  );
});