const CACHE = 'komunalni-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local assets, network-first for API
self.addEventListener('fetch', e => {
  // Never intercept Anthropic API calls
  if (e.request.url.includes('api.anthropic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid GET responses
        if (e.request.method === 'GET' && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return response;
      }).catch(() => cached || new Response('Офлайн', { status: 503 }));
    })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'Комунальні платежі', {
    body: data.body || 'Час подати показники!',
    icon: './icon-192.png',
    badge: './icon-192.png'
  });
});
