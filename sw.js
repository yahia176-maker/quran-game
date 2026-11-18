/* رحلة القرآن — Service Worker: يفتح بدون إنترنت بعد أول زيارة */
const C = 'qg-v68';
const CORE = ['./', 'index.html', 'guide.html', 'guide-child.html', 'guide-quick.html', 'guide-manager.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'art/hero-m.webp', 'art/garden.webp', 'art/bg-home-m.webp', 'art/bg-win-m.webp', 'art/bg-night-m.webp', 'art/bg-teacher-w.webp', 'art/boy.webp', 'art/girl.webp', 'art/hijab.webp',
  'art/nour-happy.webp', 'art/nour-talk.webp', 'art/nour-think.webp', 'art/nour-cheer.webp', 'art/nour-sleep.webp',
  'art/teacher-man.webp', 'art/teacher-woman.webp',
  'art/s81.webp', 'art/s82.webp', 'art/s84.webp', 'art/s89.webp', 'art/s90.webp', 'art/s54.webp', 'art/s88.webp', 'art/s110.webp', 'art/s91.webp', 'art/s92.webp', 'art/s95.webp', 'art/s93.webp', 'art/s96.webp', 'art/s97.webp', 'art/s99.webp', 'art/s100.webp', 'art/s105.webp', 'art/s106.webp', 'art/s108.webp', 'art/s111.webp', 'art/s112.webp', 'art/s113.webp', 'art/s114.webp',
  'art/ic-pick.webp', 'art/ic-halaqa.webp', 'art/ic-progress.webp', 'art/ic-race.webp', 'art/ic-dress.webp', 'art/ic-listen.webp', 'art/ic-recite.webp', 'art/ic-daily.webp', 'art/ic-review.webp',
  'art/lv-1.webp', 'art/lv-2.webp', 'art/lv-3.webp', 'art/lv-4.webp', 'art/lv-5.webp', 'art/bd-shield.webp', 'art/lv-6.webp', 'art/bd-bronze.webp', 'art/bd-silver.webp', 'art/bd-gold.webp', 'art/bd-streak.webp',
  'art/gear-taqiyah.webp', 'art/gear-crown.webp', 'art/gear-wreath.webp', 'art/gear-star.webp', 'art/gear-glasses.webp',
  'art/boy-happy.webp', 'art/boy-think.webp', 'art/boy-sad.webp', 'art/boy-wave.webp', 'art/girl-happy.webp', 'art/girl-think.webp', 'art/girl-sad.webp', 'art/girl-wave.webp', 'art/hijab-happy.webp', 'art/hijab-think.webp', 'art/hijab-sad.webp', 'art/hijab-wave.webp'];
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
