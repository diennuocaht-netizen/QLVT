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
  const body = data.body || data.message || 'Bạn có thông báo mới từ hệ thống.';
  const url = data.url || data.link || '/';

  const options = {
    body: body,
    icon: data.icon || '/logo.jpg',
    data: {
      url: url,
      timestamp: Date.now()
    },
    tag: data.tag || `dnct-${Date.now()}`,
    renotify: true
  };

  // Safe execution with fallback for iOS WebKit
  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn('⚠️ [SW] showNotification with options failed, retrying minimal:', err);
      return self.registration.showNotification(title, { body: body });
    })
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
