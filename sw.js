// sw.js - Service Worker for PWA

const CACHE_NAME = 'tidsregistrering-cache-v1';
const urlsToCache = [
  'index.html', // Din hoved HTML-fil
  // Tilføj andre vigtige filer her, hvis du har separate CSS- eller JS-filer,
  // som ikke loades via CDN.
  // F.eks.: 'styles/main.css', 'scripts/app.js'
  // CDN-filer (som Tailwind og FontAwesome) caches typisk godt af browseren selv,
  // men du *kan* tilføje dem her for mere aggressiv offline-kontrol,
  // dog med risiko for at servere forældede versioner, hvis CDN opdateres.
  // 'https://cdn.tailwindcss.com', // Eksempel - overvej nøje
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css' // Eksempel
];

// Install event: Kaldes når service workeren installeres
self.addEventListener('install', function(event) {
  // console.log('Service Worker: Installering...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        // console.log('Service Worker: Åbner cache og tilføjer filer:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('Service Worker: Fejl under cache.addAll():', error);
      })
  );
});

// Activate event: Kaldes når service workeren aktiveres
// Her kan man rydde op i gamle caches, hvis nødvendigt
self.addEventListener('activate', function(event) {
  // console.log('Service Worker: Aktivering...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Returner true for at slette denne cache
          return cacheName.startsWith('tidsregistrering-cache-') && cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          // console.log('Service Worker: Sletter gammel cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Fortæl klienterne (åbne faner) at de skal bruge denne service worker med det samme
  return self.clients.claim();
});

// Fetch event: Kaldes for hver netværksanmodning fra siden
self.addEventListener('fetch', function(event) {
  // Vi bruger en "cache-first" strategi for de cachede URLs
  // For andre requests (f.eks. API-kald, eksterne ressourcer ikke i urlsToCache),
  // vil vi bare gå direkte til netværket.

  const requestUrl = new URL(event.request.url);

  // Hvis det er en anmodning til en ekstern ressource (ikke samme origin)
  // og ikke en af vores cachede CDN'er, så gå direkte til netværket.
  // Dette er for at undgå CORS-problemer med opaque responses, hvis vi cacher dem.
  if (requestUrl.origin !== location.origin && !urlsToCache.includes(requestUrl.href)) {
    // console.log('Service Worker: Fetch (network only for cross-origin):', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For lokale ressourcer eller specificerede CDN'er i urlsToCache:
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Hvis ressourcen findes i cache, returner den
        if (response) {
          // console.log('Service Worker: Fetch (fra cache):', event.request.url);
          return response;
        }
        // Ellers, hent fra netværket
        // console.log('Service Worker: Fetch (fra netværk):', event.request.url);
        return fetch(event.request).then(
          function(networkResponse) {
            // Valgfrit: Cache den nye ressource, hvis den ikke er i den oprindelige cache-liste
            // Dette kan være nyttigt for dynamisk indhold eller filer, der ikke var kendt ved installation.
            // Vær forsigtig med at cache alt, da det kan fylde cachen hurtigt.
            // if (networkResponse && networkResponse.status === 200 && !urlsToCache.includes(event.request.url)) {
            //   const responseToCache = networkResponse.clone();
            //   caches.open(CACHE_NAME).then(function(cache) {
            //     cache.put(event.request, responseToCache);
            //   });
            // }
            return networkResponse;
          }
        ).catch(function(error) {
          console.error("Service Worker: Fejl under fetch fra netværk:", error);
          // Man kunne returnere en offline fallback-side her, hvis man har en.
          // return new Response("Netværksfejl. Du er muligvis offline.", { headers: { 'Content-Type': 'text/plain' }});
        });
      })
  );
});
