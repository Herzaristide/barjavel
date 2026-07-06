/* Barjavel service worker — offline support for the static docs site.
 *
 * Strategy:
 *  - App shell (index.html) : network-first, fallback to cache when offline.
 *  - Hashed build assets & icons : stale-while-revalidate (fast + auto-updated).
 *  - Old cache versions are purged on activation.
 */

const VERSION = "barjavel-v1"
const APP_SHELL = "./"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache.addAll([APP_SHELL, "./index.html", "./manifest.webmanifest"]).catch(() => {}),
      ),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations / HTML : network-first with offline fallback.
  const isNavigation =
    request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./index.html")),
        ),
    )
    return
  }

  // Static assets : stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
