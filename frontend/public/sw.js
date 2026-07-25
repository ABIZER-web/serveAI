// ServeAI service worker — caches the app shell (HTML/CSS/JS/icons) so the
// menu still opens with a weak signal at the truck. It never touches API
// calls (orders must always hit the network, not a stale cache).

const CACHE_NAME = 'serveai-shell-v1'
const SHELL_ASSETS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests — this leaves the orders API
  // (a different origin in production) and every non-GET request
  // completely untouched, so orders are always live.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API calls proxied through the same origin during local dev — still skip.
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
