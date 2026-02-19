/**
 * Service Worker Entry Point
 *
 * Provides offline caching, background sync, and push notifications.
 *
 * SETUP REQUIRED:
 * 1. Install dependencies: npm install serwist @serwist/next
 * 2. Add to next.config.js:
 *    const withSerwist = require('@serwist/next').default({ swSrc: 'app/sw.ts', swDest: 'public/sw.js' });
 *    module.exports = withSerwist(nextConfig);
 *
 * Until serwist is installed, this file serves as documentation of the
 * service worker strategy. The offline infrastructure in lib/sam/offline/
 * works independently via IndexedDB and fetch interceptors.
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'sam-offline-v1';
const SYNC_TAG = 'sam-offline-sync';

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/dashboard/user',
  '/offline',
];

// =============================================================================
// INSTALL
// =============================================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// =============================================================================
// ACTIVATE
// =============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// =============================================================================
// FETCH — Caching strategies
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API routes: NetworkFirst with 5s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, 5000));
    return;
  }

  // Static assets: CacheFirst
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: StaleWhileRevalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: NetworkFirst
  event.respondWith(networkFirst(request, 3000));
});

// =============================================================================
// BACKGROUND SYNC
// =============================================================================

// Background Sync API - cast needed as SyncEvent is not in standard TS lib
(self as unknown as { addEventListener(type: 'sync', listener: (event: { tag: string; waitUntil(p: Promise<void>): void }) => void): void })
  .addEventListener('sync', (event) => {
    if (event.tag === SYNC_TAG) {
      event.waitUntil(syncPendingMessages());
    }
  });

async function syncPendingMessages(): Promise<void> {
  // The actual sync is handled by lib/sam/offline/sync-manager.ts
  // This triggers a re-check by notifying the client
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_PENDING' });
  }
}

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

async function networkFirst(request: Request, timeoutMs: number): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }

    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response('Offline', { status: 503 });
}

// =============================================================================
// TYPES
// =============================================================================

interface SyncEvent extends ExtendableEvent {
  tag: string;
}

export {};
