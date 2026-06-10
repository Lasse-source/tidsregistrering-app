const CACHE_NAME = 'tidsregistrering-v1.3.0'; // Nyt versionsnummer tvinger opdatering igennem
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installer - Hent filer og tving øjeblikkelig overtagelse
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Sparker den gamle SW ud med det samme!
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktiver - Ryd op i gammel cache (Sletter v1.1 osv.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Overtager styringen af websiden med det samme
  );
});

// Fetch - Network first (Sikrer at vi altid henter nyeste kode hvis vi er online)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
