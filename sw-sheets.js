// sw-sheets.js - Service Worker for PWA Test Version

const CACHE_NAME = 'tidsregistrering-sheets-cache-v1';
const urlsToCache = [
  'tidsregistrering-sheets.html', // Din test HTML-fil
  // Andre filer som før...
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('tidsregistrering-sheets-cache-') && cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== location.origin && !urlsToCache.includes(requestUrl.href)) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
