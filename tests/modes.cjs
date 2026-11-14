/* تسميع كامل + استماع وتكرار + طريق الحفظ + مراجعة + فحص تمدد أفقي على شاشة صغيرة */
const { boot, dump, toasts, closeDialogs } = require('./lib.cjs');
const R = []; const ok = (n, c, d) => { R.push((c ? '✅ ' : '❌ ') + n + (d ? '  — ' + String(d).slice(0, 260) : '')); };
(async () => {
  const T = await boot();
  const mk = async (name, w, h) => {
    const k = await T.device(name, { w, h }); const pg = k.pg;
    await pg.goto(T.BASE); await pg.waitForTimeout(1100);
    await pg.fill('#npName', 'ليلى'); await pg.click('#chRow [data-c="girl"]'); await pg.click('[data-ag="small"]'); await pg.click('#mk');
    await pg.waitForTimeout(1300); await closeDialogs(pg); return pg;
  };
  const txt = pg => pg.evaluate(() => document.querySelector('#app').innerText.replace(/\s+/g, ' '));

  // ---------- التسميع للآخر ----------
  let pg = await mk('tasmee', 390, 844);
  await pg.click('#mLis'); await pg.waitForTimeout(600); await pg.click('#lTas'); await pg.waitForTimeout(600);
  let ay = 0;
  for (let i = 0; i < 40; i++) {
    if (!(await pg.$('#tAll'))) break;
    await pg.click('#tOne'); await pg.waitForTimeout(120);
    await pg.click('#tAll'); await pg.waitForTimeout(200);
    const okb = await pg.$('#tOk'); if (!okb) break;
    if (i === 1) await pg.click('#tNo'); else await okb.click();
    ay++; await pg.waitForTimeout(350);
  }
  const tEnd = await txt(pg);
  ok('P1 التسميع خلص وظهرت النتيجة', /خلّصت التسميع/.test(tEnd), 'آيات=' + ay + ' :: ' + tEnd.slice(0, 120));
  ok('P2 زر «عيد التسميع» موجود', !!(await pg.$('#tAgain')));
  if (await pg.$('#tAgain')) { await pg.click('#tAgain'); await pg.waitForTimeout(600); ok('P3 «عيد التسميع» رجّع للتسميع', !!(await pg.$('#tAll'))); }

  // ---------- الاستماع والتكرار ----------
  pg = await mk('listen', 390, 844);
  await pg.click('#mLis'); await pg.waitForTimeout(600);
  await pg.click('[data-rep="3"]'); await pg.waitForTimeout(200);
  await pg.click('#lPlay'); await pg.waitForTimeout(2500);
  const l1 = await pg.evaluate(() => ({ pos: (document.querySelector('#lPos') || document.querySelector('.lsnPos') || {}).textContent || '', btn: document.querySelector('#lPlay').textContent, body: document.querySelector('#app').innerText.replace(/\s+/g, ' ').slice(0, 200) }));
  ok('P4 الاستماع اشتغل (المشغّل شغّال أو خلص)', /⏸|🔁|▶/.test(l1.btn), JSON.stringify(l1));
  await pg.waitForTimeout(6000);
  const l2 = await pg.evaluate(() => ({ btn: document.querySelector('#lPlay') ? document.querySelector('#lPlay').textContent : null, body: document.querySelector('#app').innerText.replace(/\s+/g, ' ').slice(0, 160) }));
  console.log('listen after 8.5s:', JSON.stringify(l2));
  await pg.click('#lTaf'); await pg.waitForTimeout(900);
  ok('P5 «وريني المعنى» فتح التفسير', /المعنى|التفسير|تفسير|أي:|معنى/.test(await pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))), (await pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).slice(-160));

  // ---------- طريق الحفظ ----------
  pg = await mk('path', 390, 844);
  await pg.click('#mPick'); await pg.waitForTimeout(400); await pg.click('#pP'); await pg.waitForTimeout(700);
  const nodes = await pg.evaluate(() => { const c = [...document.querySelectorAll('#app [data-sn], #app [data-s], #app .pnode, #app .node, #app [data-k]')]; return c.slice(0, 6).map(e => e.className + '|' + JSON.stringify(e.dataset) + '|' + e.textContent.trim().slice(0, 14)); });
  console.log('path nodes:', JSON.stringify(nodes));
  const first = await pg.$('#app [data-sn], #app .pnode, #app .node');
  if (first) { await first.click(); await pg.waitForTimeout(800); ok('P6 محطة في طريق الحفظ بتفتح', !/طريق الحفظ 0\/37/.test(await txt(pg)) || !!(await pg.$('body > div[style*="fixed"]')), (await txt(pg)).slice(0, 120)); }
  else ok('P6 محطة في طريق الحفظ بتفتح', false, 'مش لاقي محطات — ' + (await dump(pg, 20)));

  // ---------- المراجعة ----------
  pg = await mk('review', 390, 844);
  await pg.evaluate(() => { startReview(); }); await pg.waitForTimeout(800);
  ok('P7 المراجعة من غير أخطاء سابقة مابتقعش', true, (await txt(pg)).slice(0, 140) + ' ' + JSON.stringify(await toasts(pg)));

  // ---------- تمدد أفقي على موبايل صغير 320 ----------
  pg = await mk('small', 320, 568);
  const over = [];
  const check = async name => { const o = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 2) over.push(name + ' +' + o + 'px'); };
  await check('الرئيسية');
  for (const [sel, name] of [['#mPick', 'اختر'], ['#mHal', 'حلقتي'], ['#mProg', 'تقدّمي'], ['#mAlb', 'ألبومي'], ['#mDress', 'شكلي'], ['#cog', 'الإعدادات'], ['#mLis', 'استماع'], ['#mRace', 'سباق']]) {
    await pg.evaluate(() => { document.querySelectorAll('body > div[style*="fixed"]').forEach(d => d.remove()); screenHome(); }); await pg.waitForTimeout(250);
    await pg.click(sel).catch(() => {}); await pg.waitForTimeout(600); await check(name);
  }
  await pg.evaluate(() => { screenHome(); startDaily(); }); await pg.waitForTimeout(600); await check('تحدي');
  await pg.evaluate(() => { localStorage.removeItem('quran_game_v1_active'); screenProfiles('new'); }); await pg.waitForTimeout(500); await check('البداية');
  const startFit = await pg.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, btn: Math.round(document.querySelector('#mk').getBoundingClientRect().bottom) }));
  ok('P8 مفيش تمدد أفقي على موبايل ٣٢٠', !over.length, over.join(' · '));
  ok('P9 شاشة البداية كلها ظاهرة على ٣٢٠×٥٦٨ من غير سكرول', startFit.btn <= startFit.ih, JSON.stringify(startFit));
  await pg.screenshot({ path: 'small-start.png' });

  console.log('\n' + R.join('\n'));
  console.log('ERRS', JSON.stringify(T.errs, null, 1));
  await T.b.close();
})().catch(e => { console.log(R.join('\n')); console.log('CRASH', e); process.exit(1); });
