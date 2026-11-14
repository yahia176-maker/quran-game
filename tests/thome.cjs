/* لقطات لوحة المعلم: فاضية (زي لقطة المستخدم) ومليانة، على كذا مقاس */
const { boot, dump, toasts, closeDialogs } = require('./lib.cjs');
(async () => {
  const T = await boot();
  const sizes = [['w1905', 1905, 870], ['w1366', 1366, 650], ['m390', 390, 844], ['m360', 360, 640]];
  for (const [name, w, h] of sizes) {
    const t = await T.device('t-' + name, { w, h }); const tp = t.pg;
    await tp.goto(T.BASE); await tp.waitForTimeout(1100);
    await tp.fill('#npName', 'يحيى'); await tp.click('[data-role="teacher"]'); await tp.click('#mk'); await tp.waitForTimeout(600);
    await tp.click('#k2y'); await tp.waitForTimeout(500);
    await tp.fill('#acEmail', name + '@test.com'); await tp.fill('#acPass', 'secret12'); await tp.click('#acGo'); await tp.waitForTimeout(900);
    await closeDialogs(tp); await tp.click('#hm'); await tp.waitForTimeout(600);
    await tp.fill('#tgrp', 'حلقة السبت'); await tp.click('#reg'); await tp.waitForTimeout(1300); await closeDialogs(tp);
    // حالة ١: حلقة واحدة (بعد التسجيل) — نرجع للوحة
    await tp.evaluate(() => screenHome()); await tp.waitForTimeout(1500);
    const m1 = await tp.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, ovx: document.documentElement.scrollWidth - innerWidth,
      broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')) }));
    await tp.screenshot({ path: 'th-' + name + '-1.png' });
    // حالة ٢: ٦ حلقات
    for (const nm of ['حلقة الأحد', 'أميرات القرآن', 'حلقة الفجر', 'براعم النور', 'حلقة الجمعة']) {
      await tp.evaluate(() => screenHome()); await tp.waitForTimeout(900);
      await tp.fill('#nh', nm); await tp.click('#addh'); await tp.waitForTimeout(900);
    }
    await tp.evaluate(() => screenHome()); await tp.waitForTimeout(1500);
    const m2 = await tp.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, ovx: document.documentElement.scrollWidth - innerWidth }));
    await tp.screenshot({ path: 'th-' + name + '-6.png' });
    console.log(name, w + 'x' + h, '| حلقة واحدة:', JSON.stringify(m1), m1.sh <= m1.ih ? 'صفحة واحدة ✅' : 'فيه سكرول ' + (m1.sh - m1.ih) + 'px',
      '| ٦ حلقات:', JSON.stringify(m2), m2.sh <= m2.ih ? 'صفحة واحدة ✅' : 'فيه سكرول ' + (m2.sh - m2.ih) + 'px');
    await t.ctx.close();
  }
  console.log('ERRS', JSON.stringify(T.errs));
  await T.b.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
