// =========================================================================
// SW-PUSH.JS: Service Worker Web Push Listener for DNCT Hub PWA
// =========================================================================

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'DNCT Hub';
  const options = {
    body: data.message || data.body || 'Bạn có thông báo mới từ hệ thống.',
    icon: data.icon || '/logo.jpg',
    badge: data.badge || '/icon.svg',
    data: {
      url: data.link || data.url || '/',
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200],
    tag: data.tag || `dnct-${Date.now()}`,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window tab is already open on this origin, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
