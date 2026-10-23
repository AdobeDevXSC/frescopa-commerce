/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals -- `self` is the service worker global scope */
/*
 * Fréscopa service worker: makes the site installable and resilient, never stale.
 * - pages, fragments and data (HTML, .plain.html, .json): not handled, always network
 * - code (/scripts, /styles, /blocks): network-first, cached copy only when offline,
 *   so a deploy never mixes old and new files
 * - fonts and icons: stale-while-revalidate
 * - media (content-hashed media_ files): cache-first, capped
 */
const VERSION = 'v1';
const CODE_CACHE = `frescopa-code-${VERSION}`;
const ASSET_CACHE = `frescopa-assets-${VERSION}`;
const MEDIA_CACHE = `frescopa-media-${VERSION}`;
const CACHES = [CODE_CACHE, ASSET_CACHE, MEDIA_CACHE];
const MEDIA_LIMIT = 80;

const isCode = (path) => /^\/(scripts|styles|blocks)\//.test(path);
const isAsset = (path) => /^\/(fonts|icons)\//.test(path);
const isMedia = (path) => /\/media_[0-9a-f]+\.[a-z0-9]+$/i.test(path);

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((k) => cache.delete(k)));
}

async function put(cacheName, request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await put(CODE_CACHE, request, await fetch(request));
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const refresh = fetch(request).then((r) => put(ASSET_CACHE, request, r));
  if (cached) {
    event.waitUntil(refresh.catch(() => {}));
    return cached;
  }
  return refresh;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await put(MEDIA_CACHE, request, await fetch(request));
  trim(MEDIA_CACHE, MEDIA_LIMIT);
  return response;
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('frescopa-') && !CACHES.includes(n))
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.mode === 'navigate') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isCode(url.pathname)) event.respondWith(networkFirst(request));
  else if (isAsset(url.pathname)) event.respondWith(staleWhileRevalidate(request, event));
  else if (isMedia(url.pathname)) event.respondWith(cacheFirst(request));
});
