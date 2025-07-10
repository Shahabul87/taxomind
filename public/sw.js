// Service Worker for PWA Offline Support
// ====================================

const CACHE_NAME = 'alam-lms-v1';
const STATIC_CACHE_NAME = 'alam-lms-static-v1';
const DYNAMIC_CACHE_NAME = 'alam-lms-dynamic-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/_next/static/css/app.css',
  '/_next/static/js/app.js'
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/dashboard/user',
  '/my-courses',
  '/profile',
  '/settings',
  '/offline'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/user',
  '/api/courses',
  '/api/progress',
  '/api/settings'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticResource(request.url)) {
      event.respondWith(handleStaticResource(request));
    } else if (isAPIRequest(request.url)) {
      event.respondWith(handleAPIRequest(request));
    } else if (isPageRequest(request)) {
      event.respondWith(handlePageRequest(request));
    } else {
      event.respondWith(handleOtherRequest(request));
    }
  } else if (request.method === 'POST') {
    event.respondWith(handlePostRequest(request));
  }
});

// Check if request is for static resources
function isStaticResource(url) {
  return url.includes('/_next/static/') || 
         url.includes('/icons/') || 
         url.includes('/images/') ||
         url.includes('/fonts/') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.jpeg') ||
         url.endsWith('.svg') ||
         url.endsWith('.ico');
}

// Check if request is for API
function isAPIRequest(url) {
  return url.includes('/api/') || CACHEABLE_APIS.some(api => url.includes(api));
}

// Check if request is for a page
function isPageRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Handle static resources - cache first strategy
async function handleStaticResource(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static resource error:', error);
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Handle API requests - network first, then cache
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('API network error, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline API response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle page requests - network first, then cache, then offline page
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Page network error, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Other request error:', error);
    return new Response('Service unavailable', { status: 503 });
  }
}

// Handle POST requests - store for background sync
async function handlePostRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('POST request failed, storing for background sync:', error);
    
    // Store failed request for background sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    await storeFailedRequest(requestData);
    
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Request will be sent when online'
    }), {
      status: 202,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Store failed requests for background sync
async function storeFailedRequest(requestData) {
  const db = await openDB();
  const transaction = db.transaction(['requests'], 'readwrite');
  const store = transaction.objectStore('requests');
  await store.add(requestData);
}

// Open IndexedDB for storing offline data
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('alam-lms-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('requests')) {
        const requestStore = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
        requestStore.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('userData')) {
        const userStore = db.createObjectStore('userData', { keyPath: 'id' });
        userStore.createIndex('lastUpdated', 'lastUpdated');
      }
      
      if (!db.objectStoreNames.contains('courses')) {
        const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
        courseStore.createIndex('lastAccessed', 'lastAccessed');
      }
    };
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests when online
async function syncFailedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove successful request from store
          const deleteTransaction = db.transaction(['requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('requests');
          await deleteStore.delete(requestData.id);
          
          console.log('Background sync successful for:', requestData.url);
        }
      } catch (error) {
        console.error('Background sync failed for:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Handle different notification actions
  let url = '/';
  
  if (data) {
    if (data.type === 'course') {
      url = `/courses/${data.courseId}`;
    } else if (data.type === 'message') {
      url = `/messages/${data.messageId}`;
    } else if (data.type === 'assignment') {
      url = `/assignments/${data.assignmentId}`;
    }
  }
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_COURSE':
      cacheCourseData(data);
      break;
    case 'CACHE_USER_DATA':
      cacheUserData(data);
      break;
    case 'CLEAR_CACHE':
      clearCache();
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache course data for offline access
async function cacheCourseData(courseData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['courses'], 'readwrite');
    const store = transaction.objectStore('courses');
    
    const cacheData = {
      ...courseData,
      lastAccessed: Date.now(),
      cachedAt: Date.now()
    };
    
    await store.put(cacheData);
    console.log('Course data cached:', courseData.id);
  } catch (error) {
    console.error('Error caching course data:', error);
  }
}

// Cache user data for offline access
async function cacheUserData(userData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');
    
    const cacheData = {
      ...userData,
      lastUpdated: Date.now()
    };
    
    await store.put(cacheData);
    console.log('User data cached');
  } catch (error) {
    console.error('Error caching user data:', error);
  }
}

// Clear all caches
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    const db = await openDB();
    const transaction = db.transaction(['requests', 'userData', 'courses'], 'readwrite');
    
    await Promise.all([
      transaction.objectStore('requests').clear(),
      transaction.objectStore('userData').clear(),
      transaction.objectStore('courses').clear()
    ]);
    
    console.log('All caches cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Periodic background sync for updating cached data
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data in background
async function updateCachedData() {
  try {
    // Update frequently accessed data
    const db = await openDB();
    const transaction = db.transaction(['courses', 'userData'], 'readonly');
    const courseStore = transaction.objectStore('courses');
    const userStore = transaction.objectStore('userData');
    
    const courses = await courseStore.getAll();
    const userData = await userStore.getAll();
    
    // Update course data
    for (const course of courses) {
      const daysSinceUpdate = (Date.now() - course.lastAccessed) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 7) { // Update if accessed within last 7 days
        try {
          const response = await fetch(`/api/courses/${course.id}`);
          if (response.ok) {
            const updatedCourse = await response.json();
            await cacheCourseData(updatedCourse);
          }
        } catch (error) {
          console.error('Error updating course:', course.id, error);
        }
      }
    }
    
    // Update user data
    for (const user of userData) {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const updatedUser = await response.json();
          await cacheUserData(updatedUser);
        }
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
    
    console.log('Cached data updated');
  } catch (error) {
    console.error('Error updating cached data:', error);
  }
}

// Cleanup old cache entries
setInterval(async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['requests', 'courses'], 'readwrite');
    const requestStore = transaction.objectStore('requests');
    const courseStore = transaction.objectStore('courses');
    
    const oldRequests = await requestStore.index('timestamp').getAll(
      IDBKeyRange.upperBound(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    );
    
    for (const request of oldRequests) {
      await requestStore.delete(request.id);
    }
    
    const oldCourses = await courseStore.index('lastAccessed').getAll(
      IDBKeyRange.upperBound(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    );
    
    for (const course of oldCourses) {
      await courseStore.delete(course.id);
    }
    
    console.log('Old cache entries cleaned up');
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily