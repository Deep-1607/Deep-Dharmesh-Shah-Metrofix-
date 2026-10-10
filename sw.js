/* ============================================================
   MetroFix — sw.js
   Service Worker v2 — Cache-First, Offline-First Strategy
   ============================================================

   HOW THE SERVICE WORKER ENABLES OFFLINE USE
   -------------------------------------------
   A service worker is a background script that the browser
   runs separately from the web page.  It intercepts every
   network request the page makes.

   First visit (online):
     1. Browser downloads index.html, style.css, app.js, etc.
     2. SW's "install" event fires → pre-caches every listed
        asset into the browser's CacheStorage.
     3. SW's "activate" event fires → takes control of the page.

   Every subsequent visit (online OR offline):
     1. Page requests a file.
     2. SW intercepts the request.
     3. SW returns the file from CacheStorage instantly —
        no network needed.

   IMPORTANT — Service Workers only register from:
     • http://localhost  (any port)  ← development server
     • https://          (any domain) ← production / GitHub Pages
   They do NOT work from file:// URLs (double-click open).
   Always use `python -m http.server 5500` or equivalent.

   CACHE VERSIONING
   ----------------
   Bump CACHE_VERSION whenever you deploy a code change.
   The activate handler deletes all caches that don't match
   the current version, forcing a fresh download.
   ============================================================ */

const CACHE_VERSION = 'metrofix-v4';

/* List every file the app needs to work offline.
   Each entry must be a URL path relative to the SW's scope.  */
const PRECACHE_ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

/* ── Install ──────────────────────────────────────────────────
   Pre-cache all assets before the SW takes control.
   event.waitUntil() keeps the install phase alive until
   every asset has been written to the cache.             */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())   /* activate immediately */
  );
});

/* ── Activate ─────────────────────────────────────────────────
   Delete any old versioned caches so stale files are removed. */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())   /* take control now */
  );
});

/* ── Fetch ────────────────────────────────────────────────────
   Cache-First strategy:
     1. Return cached copy if available.
     2. Otherwise attempt a network fetch and cache the result.
     3. If the network is unreachable, return the cached shell.

   Only intercepts same-origin GET requests.
   Non-GET requests (e.g. localStorage writes) are not requests
   to the SW at all — they go directly to the browser API.  */
self.addEventListener('fetch', event => {
  /* Ignore non-GET and cross-origin requests */
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cached => {
        /* Cache hit — return immediately (offline works here) */
        if (cached) return cached;

        /* Cache miss — try the network */
        return fetch(event.request)
          .then(networkResponse => {
            /* Only cache valid, same-origin responses */
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const toCache = networkResponse.clone();
              caches.open(CACHE_VERSION)
                .then(cache => cache.put(event.request, toCache));
            }
            return networkResponse;
          })
          .catch(() => {
            /* Network failed and cache missed — serve the app shell */
            return caches.match('./index.html');
          });
      })
  );
});
