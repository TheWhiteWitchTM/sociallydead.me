// SociallyDead Service Worker for Push Notifications

const CACHE_NAME = 'sociallydead-v1';
const NOTIFICATION_ICON = '/icon-192x192.png';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, tag, data: notifData } = data;

  const options = {
    body: body || 'You have a new notification',
    icon: icon || NOTIFICATION_ICON,
    badge: badge || '/badge-72x72.png',
    tag: tag || 'sociallydead-notification',
    vibrate: [100, 50, 100],
    data: notifData || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title || 'SociallyDead', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline posts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  // Get queued posts from IndexedDB and send them
  // This is a placeholder for future offline support
  console.log('[SW] Syncing queued posts...');
}

// Periodic background sync for new notifications (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  // Check for new notifications in the background
  // This requires the app to have a way to check notifications server-side
  console.log('[SW] Checking for new notifications...');
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: NOTIFICATION_ICON,
      tag: tag || 'sociallydead-notification',
      data: { url },
      requireInteraction: false,
    });
  }
});
