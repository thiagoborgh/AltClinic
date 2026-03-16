// Limpar todos os caches e service workers
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Removendo cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ Todos os caches removidos');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Não fazer cache de nada, sempre buscar da rede
  event.respondWith(fetch(event.request));
});
