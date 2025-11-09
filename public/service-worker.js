// Service Worker for Taxomind Learning Platform
// Version 1.0.0

const CACHE_NAME = 'taxomind-v1.0.0';
const STATIC_CACHE = 'taxomind-static-v1.0.0';
const DYNAMIC_CACHE = 'taxomind-dynamic-v1.0.0';
const VIDEO_CACHE = 'taxomind-videos-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/app-layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/framework.js',
  '/_next/static/chunks/main.js',
];

// Cache strategies
const CACHE_STRATEGIES = {
  networkFirst: [
    '/api/',
    '/courses/',
    '/learn/',
  ],
  cacheFirst: [
    '/static/',
    '/_next/static/',
    '/images/',
    '/fonts/',
    '.css',
    '.js',
    '.woff',
    '.woff2',
  ],
  staleWhileRevalidate: [
    '/sections/',
    '/content/',
    '.json',
  ],
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => {
          // Filter out assets that might not exist
          return !asset.includes('undefined');
        })).catch(err => {
          console.warn('[ServiceWorker] Failed to cache some assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('taxomind-') &&
                   cacheName !== CACHE_NAME &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== VIDEO_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // YouTube videos - special handling
  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline message for YouTube videos
          return new Response('Video content is not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
    return;
  }

  // Determine cache strategy
  let strategy = 'networkFirst'; // default

  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => request.url.includes(pattern))) {
      strategy = strategyName;
      break;
    }
  }

  // Apply cache strategy
  if (strategy === 'cacheFirst') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'networkFirst') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'staleWhileRevalidate') {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Cache strategies implementation

// Cache First - serve from cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    return offlineFallback(request);
  }
}

// Network First - try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return offlineFallback(request);
  }
}

// Stale While Revalidate - serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse || offlineFallback(request));

  return cachedResponse || fetchPromise;
}

// Offline fallback
async function offlineFallback(request) {
  const url = new URL(request.url);

  // For HTML pages, return offline page
  if (request.headers.get('accept').includes('text/html')) {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // For API calls, return offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'You are currently offline. Please check your internet connection.',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }

  // Default offline response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(urlsToCache).catch(err => {
        console.warn('[ServiceWorker] Failed to cache URLs:', err);
      });
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        if (cacheName.startsWith('taxomind-dynamic')) {
          caches.delete(cacheName);
        }
      });
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

// Sync progress data when back online
async function syncProgress() {
  try {
    // Get all pending progress updates from IndexedDB
    const pendingUpdates = await getPendingUpdates();

    if (pendingUpdates.length > 0) {
      // Send updates to server
      const response = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: pendingUpdates })
      });

      if (response.ok) {
        // Clear pending updates
        await clearPendingUpdates();

        // Notify clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              message: 'Progress synced successfully'
            });
          });
        });
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingUpdates() {
  // This would connect to IndexedDB and retrieve pending updates
  // Implementation depends on your IndexedDB schema
  return [];
}

async function clearPendingUpdates() {
  // Clear pending updates from IndexedDB
  return true;
}

// Periodic background sync (for modern browsers)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Update cached content periodically
async function updateContent() {
  try {
    // Fetch latest content metadata
    const response = await fetch('/api/content/updates');
    if (response.ok) {
      const updates = await response.json();

      // Update cached content
      const cache = await caches.open(DYNAMIC_CACHE);
      for (const url of updates.urls) {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Content update failed:', error);
  }
}

// Push notifications for learning reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Continue your learning journey!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Continue Learning',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Later',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Taxomind Learning', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the learning dashboard
    event.waitUntil(
      clients.openWindow('/my-courses')
    );
  }
});

console.log('[ServiceWorker] Service Worker loaded successfully');