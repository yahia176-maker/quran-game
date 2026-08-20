/* رحلة القرآن — Service Worker: يفتح بدون إنترنت بعد أول زيارة */
const C = 'qg-v10';
const CORE = ['./', 'index.html', 'guide.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    /* الصفحة نفسها: الشبكة أولًا (عشان التحديثات) والكاش عند انقطاع النت */
    e.respondWith(fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(e.request)
      .then(r => r || fetch(e.request).then(f => { const cp = f.clone(); caches.open(C).then(c => c.put(e.request, cp)); return f; })));
  }
});
