/* KVB Inspection Portal — No-op service worker */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', (event) => {
  /* Pass-through for all requests */
});
