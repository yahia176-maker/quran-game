/* اختبار العمل بدون نت: نثبّت الـ Service Worker من index.html، نقطع النت، ونعيد الفتح */
const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await ctx.route('**/firebasejs/**', r => r.abort());
  await pg.goto((process.env.BASE_URL || 'http://127.0.0.1:8765') + '/index.html'); await pg.waitForTimeout(800);
  const reg = await pg.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no-sw-api';
    const r = await navigator.serviceWorker.ready; return r.active ? r.active.state : 'none';
  });
  await pg.waitForTimeout(2500);
  const cached = await pg.evaluate(async () => {
    const ks = await caches.keys(); const c = await caches.open(ks[0]); const reqs = await c.keys();
    return { caches: ks, n: reqs.length, art: reqs.filter(r => r.url.includes('/art/')).length };
  });
  console.log('SW state:', reg, JSON.stringify(cached));
  await ctx.setOffline(true);
  await pg.reload({ waitUntil: 'load' }).catch(e => console.log('reload error', String(e).split('\n')[0]));
  await pg.waitForTimeout(1500);
  const off1 = await pg.evaluate(() => ({ start: !!document.querySelector('.startScreen'),
    broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')) }));
  console.log('offline reload → start screen:', off1.start, 'broken imgs:', JSON.stringify(off1.broken));
  await pg.fill('#npName', 'ليلى'); await pg.click('#chRow [data-c="girl"]'); await pg.click('[data-ag="small"]'); await pg.click('#mk');
  await pg.waitForTimeout(1500);
  const visit = async (sel, name) => {
    await pg.evaluate(() => { document.querySelectorAll('body > div[style*="fixed"]').forEach(d => d.remove()); screenHome(); });
    await pg.waitForTimeout(300); await pg.click(sel).catch(() => {}); await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth && !i.src.startsWith('data:')).map(i => i.getAttribute('src')));
    console.log('offline', name, 'broken:', JSON.stringify(r));
  };
  await visit('#mProg', 'تقدّمي'); await visit('#mAlb', 'ألبومي'); await visit('#mDress', 'شكلي'); await visit('#mHal', 'حلقتي'); await visit('#cog', 'الإعدادات');
  await pg.evaluate(() => { screenHome(); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => startDaily()); await pg.waitForTimeout(700);
  console.log('offline daily challenge opts:', await pg.evaluate(() => document.querySelectorAll('.opt').length));
  const bg = await pg.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage.slice(0, 120));
  console.log('bg layer:', bg);
  console.log('toasts/errs:', JSON.stringify(errs));
  // صفحات الأدلة أوفلاين
  for (const g of ['guide.html', 'guide-child.html', 'guide-quick.html', 'guide-manager.html']) {
    const r = await pg.goto((process.env.BASE_URL || 'http://127.0.0.1:8765') + '/' + g).then(x => x.status()).catch(e => 'FAIL ' + String(e).split('\n')[0]);
    console.log('offline', g, r);
  }
  await b.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
