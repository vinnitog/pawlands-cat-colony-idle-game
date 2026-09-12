const CACHE_PREFIX = 'catvolution-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v7`;
const APP_ROOT = self.registration.scope;
const CORE_ASSETS = [
  APP_ROOT,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('icons/catvolution-192.png', APP_ROOT).href,
  new URL('icons/catvolution-512.png', APP_ROOT).href,
  new URL('icons/catvolution-maskable-512.png', APP_ROOT).href,
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch(APP_ROOT, { cache: 'reload' });
  if (!indexResponse.ok) throw new Error('Não foi possível preparar o app shell.');

  await cache.put(APP_ROOT, indexResponse.clone());
  const html = await indexResponse.text();
  const scopeUrl = new URL(APP_ROOT);
  const discoveredAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], APP_ROOT))
    .filter((url) => url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname))
    .map((url) => url.href);

  const assets = [...new Set([...CORE_ASSETS.slice(1), ...discoveredAssets])];
  await Promise.all(assets.map(async (asset) => {
    const response = await fetch(asset, { cache: 'reload' });
    if (response.ok) await cache.put(asset, response);
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const scopeUrl = new URL(APP_ROOT);
  if (request.method !== 'GET' || url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) (await caches.open(CACHE_NAME)).put(APP_ROOT, response.clone());
          return response;
        })
        .catch(() => caches.match(APP_ROOT)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    })),
  );
});
