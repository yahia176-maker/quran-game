/* هل المالك بيشوف صورة المعلم فعلًا في لوحته؟ (تحقق يدوي قبل المساعدة في كلمة السر) */
const setup = require('./setup.cjs');
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const OWNER = 'yahia176@gmail.com';   /* الإيميل ده مكتوب في ملف القواعد — الاختبار محلي بالكامل */
(async () => {
  const s = await setup(); const { T, tp, dump, toasts, closeDialogs } = s;
  const tUid = T.sv.S.accounts['sara@test.com'].uid;
  // المعلمة تحط صورة بروفايل
  await tp.evaluate(u => { setAvatarImg(u); if (typeof P !== 'undefined') { P.avatar = 'img'; saveP(); } }, PNG);
  await tp.waitForTimeout(2500);
  const prof = ((T.sv.S.db.users || {})[tUid] || {}).profile || {};
  console.log('1) صورة المعلمة متخزنة في حسابها على القاعدة:', !!prof.img, '| avatar =', prof.avatar);

  // المالك يدخل من جهازه
  T.sv.S.accounts[OWNER] = { uid: 'ownerUid', pass: 'ownerpass', email: OWNER, emailVerified: true };
  const o = await T.device('owner', { w: 1280, h: 800 }); const op = o.pg;
  await op.goto(T.BASE); await op.waitForTimeout(1200);
  await op.fill('#npName', 'المالك'); await op.click('#mk'); await op.waitForTimeout(1200); await closeDialogs(op);
  await op.click('#cog'); await op.waitForTimeout(500);
  const acc = await op.$('#acc') || await op.$('#sAcc') || await op.$('#account');
  await op.evaluate(() => screenAccount()); await op.waitForTimeout(500);
  await op.click('#acLogin'); await op.waitForTimeout(500);
  await op.fill('#liEmail', OWNER); await op.fill('#liPass', 'ownerpass'); await op.click('#liGo'); await op.waitForTimeout(1800); await closeDialogs(op);
  console.log('2) المالك دخل:', JSON.stringify(await toasts(op)));

  await op.evaluate(() => screenOwner('')); await op.waitForTimeout(2500);
  await op.click('.otab[data-t="qz"]'); await op.waitForTimeout(1200);
  let row = await op.$('.tOpen[data-u="' + tUid + '"]');
  console.log('2b) صف المعلمة موجود في جدول المعلمين:', !!row);
  if (row) { await row.click(); await op.waitForTimeout(1500); } else { await op.evaluate(u => ownerUser(u), tUid); await op.waitForTimeout(1500); }
  const card = await op.evaluate(() => { const t = document.querySelector('#app').innerText;
    return { img: !!document.querySelector('#app img.ava[src^="data:image"]'), email: t.includes('sara@test.com'), hal: t.includes('أميرات القرآن'),
      text: t.split('\n').join(' ').slice(0, 420) }; });
  console.log('3) كارت المعلمة: صورة', card.img, '| إيميل', card.email, '| اسم حلقتها', card.hal);
  console.log('   بيانات الكارت:', card.text);
  await op.screenshot({ path: 'owner-user.png' });

  await op.evaluate(() => ownerPhotos()); await op.waitForTimeout(1500);
  const gal = await op.evaluate(() => ({ n: document.querySelectorAll('#app img.ava[src^="data:image"]').length, h: (document.querySelector('h2') || {}).textContent }));
  console.log('4) شاشة «مراجعة الصور»:', JSON.stringify(gal));

  // مدير مركز/معلم عادي: هل يقدر يقرا حساب معلم تاني؟
  const before = T.sv.S.denied.length;
  const r = JSON.parse(await T.sv.rpc(JSON.stringify({ op: 'read', path: 'users/' + tUid + '/profile', auth: { uid: 'someTeacher', token: { email: 'other@test.com' } } })));
  console.log('5) معلم/مدير تاني يحاول يقرا حساب المعلمة →', r.err ? 'مرفوض (القواعد بتمنعه)' : 'مسموح!');
  console.log('ERRS', JSON.stringify(T.errs));
  console.log('DENIED(owner)', JSON.stringify(T.sv.S.denied.slice(0, before).filter(d => d.email === OWNER)));
  await T.b.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
