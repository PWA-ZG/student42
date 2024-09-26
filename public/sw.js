import { del, entries } from './idb-keyval.js';

const SYNC_POST_ID = 'sync-post';
const cacheName = 'cache-v1';
const precachedFiles = [
  '/',
  '/photo',
  'manifest.json',
  'offline.html',
  '/assets/notification.svg',
  '404.html',
  '/styles/main.css',
  '/styles/photo.css',
  '/scripts/main.js',
  '/scripts/photo.js',
];

self.addEventListener('activate', (event) => {
  console.log('Activating new service worker.');
  event.waitUntil(deletePrevCaches());
});

const deletePrevCaches = async () => {
  const cacheWhitelist = [cacheName];
  const keyList = await caches.keys();
  const deleteCaches = keyList.filter((key) => !cacheWhitelist.includes(key));
  return Promise.all(deleteCaches.map((key) => caches.delete(key)));
};

self.addEventListener('install', (event) => {
  console.log('Installing service worker and caching.');
  event.waitUntil(precache());
});

const precache = async () => {
  const cache = await caches.open(cacheName);
  return cache.addAll(precachedFiles);
};

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const method = event.request.method;
  if (
    !url.startsWith('chrome-extension') &&
    method === 'GET' &&
    !url.endsWith('/posts')
  ) {
    event.respondWith(interceptFetch(event.request));
  }
});

// Network first (Network falling back to cache)
const interceptFetch = async (request) => {
  const cache = await caches.open(cacheName);
  try {
    const fetchedResponse = await fetch(request);
    if (fetchedResponse.status === 404) {
      return cache.match('404.html');
    }

    cache.put(request.url, fetchedResponse.clone());
    return fetchedResponse;
  } catch (e) {
    console.log(`Cannot fetch ${request.url} from server.`);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return await cache.match('offline.html');
  }
};

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_POST_ID) {
    console.log('Post sent to server.');
    event.waitUntil(sendPost());
  }
});

const sendPost = async () => {
  const entriesDB = await entries();

  for (const [id, post] of entriesDB) {
    try {
      const req = new Request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      const res = await fetch(req);
      if (res.ok) {
        del(id);
      }
    } catch {
      console.log('Cannot send post:', post);
    }
  }
};

self.addEventListener('push', (event) => {
  if (event.data) {
    console.log('Push event', event);
    showNotification(event, JSON.parse(event.data.text()));
  }
});

const showNotification = (event, { title, body, redirectUrl }) => {
  const options = {
    title,
    body,
    icon: 'assets/android/android-launchericon-96-96.png',
    badge: 'assets/android/android-launchericon-96-96.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'post-notification',
    data: {
      redirectUrl,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
};

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();
  event.waitUntil(openWindow(notification.data.redirectUrl));
});

const openWindow = async (redirectUrl) => {
  const clientList = await clients.matchAll({
    type: 'window',
  });
  if (clientList && clientList.length > 0) {
    for (const client of clientList) {
      await client.navigate(redirectUrl);
      return client.focus();
    }
  } else if (clients.openWindow) {
    const windowClient = await clients.openWindow(redirectUrl);
    return windowClient ? windowClient.focus() : null;
  }
};
