/**
 * sw.js — RootFacts Service Worker
 *
 * Uses Workbox (via CDN importScripts) to precache core assets so the
 * app works fully offline after the first load.
 *
 * Caching strategy:
 *   - Shell assets (HTML, CSS, JS) → CacheFirst (long-lived)
 *   - Model files (model.json, weights.bin, metadata.json) → CacheFirst
 *   - Google Fonts → StaleWhileRevalidate
 *   - CDN scripts (TF.js, Transformers.js, Lucide) → StaleWhileRevalidate
 */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute }                            = workbox.routing;
const { CacheFirst, StaleWhileRevalidate }         = workbox.strategies;
const { CacheableResponsePlugin }                  = workbox.cacheableResponse;
const { ExpirationPlugin }                         = workbox.expiration;

// ── Precache core shell assets ─────────────────────────────────────────────
// Revision strings ensure the SW detects changes on each deploy.
precacheAndRoute([
  { url: '/',             revision: '2' },
  { url: '/index.html',  revision: '2' },
  { url: '/assets/css/styles.css',               revision: '2' },
  { url: '/assets/js/core/app.js',               revision: '2' },
  { url: '/assets/js/core/config.js',            revision: '2' },
  { url: '/assets/js/core/utils.js',             revision: '2' },
  { url: '/assets/js/services/camera.service.js',    revision: '2' },
  { url: '/assets/js/services/detection.service.js', revision: '2' },
  { url: '/assets/js/services/facts.service.js',     revision: '2' },
  { url: '/assets/js/ui/ui.handler.js',          revision: '2' },
  { url: '/manifest.json',                       revision: '2' },
  { url: '/model/metadata.json',                 revision: '2' },
  { url: '/model/model.json',                    revision: '2' },
  { url: '/model/weights.bin',                   revision: '2' },
  { url: '/assets/icons/icon-192x192.png',       revision: '1' },
  { url: '/assets/icons/icon-512x512.png',       revision: '1' },
  { url: '/assets/icons/apple-touch-icon.png',   revision: '1' },
  { url: '/assets/icons/favicon.ico',            revision: '1' },
]);

cleanupOutdatedCaches();

// ── Model files (large binaries) — CacheFirst, 30-day expiry ──────────────
registerRoute(
  ({ url }) => url.pathname.startsWith('/model/'),
  new CacheFirst({
    cacheName: 'rootfacts-model-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── App icons & static assets ─────────────────────────────────────────────
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/icons/'),
  new CacheFirst({
    cacheName: 'rootfacts-icons-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20 }),
    ],
  })
);

// ── Google Fonts ──────────────────────────────────────────────────────────
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'rootfacts-fonts-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── External CDN scripts (TF.js, Lucide, Transformers.js) ─────────────────
registerRoute(
  ({ url }) =>
    url.origin === 'https://cdn.jsdelivr.net' ||
    url.origin === 'https://unpkg.com'        ||
    url.origin === 'https://storage.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'rootfacts-cdn-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ── Hugging Face model files (Transformers.js ONNX models) ────────────────
registerRoute(
  ({ url }) =>
    url.origin.includes('huggingface.co'),
  new CacheFirst({
    cacheName: 'rootfacts-hf-models-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── Offline fallback ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});

console.log('🔧 RootFacts SW active');
