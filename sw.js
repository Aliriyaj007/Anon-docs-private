const CACHE_NAME = 'anon-docs-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/styles/themes.css',
  '/styles/animations.css',
  '/js/utils.js',
  '/js/storage.js',
  '/js/encryption.js',
  '/js/analytics.js',
  '/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});