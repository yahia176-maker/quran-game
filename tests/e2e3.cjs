/* إدارة الطلاب + دخول المعلمة من جهاز تاني + خروج الطفل من الحلقة */
const setup = require('./setup.cjs');
const R = []; const ok = (n, c, d) => { R.push((c ? '✅ ' : '❌ ') + n + (d ? '  — ' + String(d).slice(0, 240) : '')); };
(async () => {
  const s = await setup(); const { T, tp, kp, hid, link, dump, toasts, closeDialogs } = s;
  const db = () => T.sv.S.db; const mem = () => (db().members || {})[hid] || {};
  const kidUid = Object.keys(mem())[0];

  // ---- تعليق مؤقت
  await tp.click('.stMg'); await tp.waitForTimeout(400); await tp.click('#smP'); await tp.waitForTimeout(1200);
  ok('M1 المعلمة علّقت الطفلة مؤقتًا', mem()[kidUid] && mem()[kidUid].off === true, JSON.stringify(mem()[kidUid]));
  await kp.reload(); await kp.waitForTimeout(4200);
  const kt1 = await toasts(kp);
  ok('M2 الطفلة اتبلّغت بالتعليق ولسه شايفة حلقتها', kt1.some(x => x.includes('علّق')) && (await kp.textContent('#mHal')).includes('1 حلقة'), JSON.stringify(kt1));
  await closeDialogs(kp);
  await tp.click('.stMg'); await tp.waitForTimeout(400); await tp.click('#smP'); await tp.waitForTimeout(1200);
  ok('M3 رجّعتها تاني', mem()[kidUid] && !mem()[kidUid].off, JSON.stringify(mem()[kidUid]));

  // ---- تحديد المحفوظ من المعلمة
  await tp.click('.memoEd'); await tp.waitForTimeout(700);
  console.log('--- memo dialog\n' + (await dump(tp, 70)).split('\n').filter(l => !/hws/.test(l)).slice(0, 30).join('\n'));

  // ---- شيل من الحلقة
  await tp.evaluate(() => { document.querySelectorAll('body > div[style*="fixed"]').forEach(d => d.remove()); });
  await tp.click('.stMg'); await tp.waitForTimeout(400); await tp.click('#smX'); await tp.waitForTimeout(500);
  await tp.click('#k2y'); await tp.waitForTimeout(1300);
  ok('M4 المعلمة شالت الطفلة من الحلقة', !mem()[kidUid], JSON.stringify(mem()));
  await kp.reload(); await kp.waitForTimeout(4200);
  const kt2 = await toasts(kp);
  ok('M5 الطفلة اتبلّغت إنها اتشالت والحلقة اختفت عندها', kt2.some(x => x.includes('اتشلت')) && (await kp.textContent('#mHal')).includes('انضم بالكود'), JSON.stringify(kt2));

  // ---- ترجع تنضم بنفس الرابط
  await kp.goto(link); await kp.waitForTimeout(2600);
  ok('M6 فتحت الرابط تاني ورجعت للحلقة (ملف موجود)', Object.values(mem()).some(m => m.name === 'ليلى'), JSON.stringify(await toasts(kp)));
  await closeDialogs(kp);

  // ---- الطفلة تخرج بنفسها
  await kp.click('#mHal'); await kp.waitForTimeout(900);
  await kp.click('.lv'); await kp.waitForTimeout(500);
  const y = await kp.$('#k2y'); if (y) { await y.click(); await kp.waitForTimeout(1200); }
  ok('M7 الطفلة خرجت من الحلقة بنفسها', !Object.values(mem()).some(m => m.name === 'ليلى'), JSON.stringify(mem()) + ' ' + JSON.stringify(await toasts(kp)));

  // ---- المعلمة تدخل من جهاز جديد بنفس الإيميل
  const t2 = await T.device('teacher-phone2'); const p2 = t2.pg;
  await p2.goto(T.BASE); await p2.waitForTimeout(1200);
  await p2.fill('#npName', 'أ. سارة'); await p2.click('[data-role="teacher"]'); await p2.click('#mk'); await p2.waitForTimeout(700);
  await p2.click('#k2y'); await p2.waitForTimeout(600);
  await p2.click('#acLogin'); await p2.waitForTimeout(600);
  console.log('--- login screen\n' + await dump(p2, 20));
  const em = await p2.$('#liEmail'); const pw = await p2.$('#liPass');
  // كلمة سر غلط أولًا
  await em.fill('sara@test.com'); await pw.fill('wrongpass');
  const go = await p2.$('#liGo');
  await go.click(); await p2.waitForTimeout(900);
  const wrongT = await toasts(p2);
  ok('L1 كلمة سر غلط → رسالة عربي واضحة', wrongT.some(x => x.includes('كلمة السر غلط')), JSON.stringify(wrongT));
  await (await p2.$('#liPass')).fill('secret12'); await (await p2.$('#liGo')).click(); await p2.waitForTimeout(1800); await closeDialogs(p2);
  const scr = await p2.evaluate(() => document.querySelector('#app').innerText.replace(/\s+/g, ' ').slice(0, 200));
  ok('L2 دخلت من جهاز تاني ولقت حلقتها مباشرة', scr.includes('1 حلقة') && !scr.includes('إنت مين'), scr);
  console.log('--- teacher on 2nd device\n' + await dump(p2, 24));

  // ---- نسيت كلمة السر
  const before = T.sv.S.log.length;
  await p2.evaluate(() => teacherResetPass('sara@test.com').then(() => resetSentMsg()));
  await p2.waitForTimeout(600);
  ok('L3 «نسيت كلمة السر» بعت طلب الاسترجاع وظهرت رسالة الشرح', T.sv.S.log.slice(before).some(x => x.includes('AUTH reset sara@test.com')) && (await toasts(p2)).some(x => x.includes('DIALOG')), '');

  console.log('\n' + R.join('\n'));
  console.log('ERRS', JSON.stringify(T.errs, null, 1));
  console.log('DENIED', JSON.stringify(T.sv.S.denied.filter(d => !/^ann\/(teachers|mgrs)/.test(d.path)), null, 1));
  await T.b.close();
})().catch(e => { console.log(R.join('\n')); console.log('CRASH', e); process.exit(1); });
