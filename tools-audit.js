/* ================= فحص شامل لرحلة القرآن =================
   بيشتغل جوّه الصفحة. بيختبر منطق العميل على نسخة مؤقتة من الملف،
   وبيختبر قواعد الأمان على تطبيق Firebase منفصل بحساب مجهول.
   مابيلمسش بيانات المالك الحقيقية إطلاقًا. */
window.__AUDIT = 'running';
(async function () {
  const R = [];
  const ok = (name, cond, detail) => R.push({ name, pass: !!cond, detail: detail || '' });
  const eq = (name, got, want) => R.push({
    name, pass: JSON.stringify(got) === JSON.stringify(want),
    detail: 'got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)
  });
  const secD = (name, promise) => promise.then(v => ({ name, v })).catch(e => ({ name, err: e }));

  /* نحفظ الحالة الحقيقية ونرجّعها في الآخر */
  const SAVE = { P: (typeof P !== 'undefined') ? P : null, role: (typeof myRole === 'function') ? myRole() : '' };

  // ===================== A) منطق العميل =====================
  try {
    // 1) بروفايل جديد سليم
    const np = newProfile('طفل فحص', '🧪');
    ok('A1 newProfile فيه الحقول الأساسية',
      np.id && np.stats && np.sstars && np.memo && np.streak === 0 && np.stars,
      'keys=' + Object.keys(np).join(','));

    // نشتغل على بروفايل وهمي بدل الحقيقي
    const realP = (typeof P !== 'undefined') ? P : null;
    P = np;

    // 2) السلسلة: يوم ورا يوم بتزيد
    const d = new Date();
    const ymd = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const daysAgo = k => { const t = new Date(); t.setDate(t.getDate() - k); return ymd(t); };
    P.streak = 5; P.shield = 0; P.lastPlay = daysAgo(1);
    touchStreak();
    eq('A2 يوم ورا يوم يزوّد السلسلة', P.streak, 6);

    // 3) درع كل ٧ أيام
    P.streak = 6; P.shield = 0; P.lastPlay = daysAgo(1);
    touchStreak();
    ok('A3 كسب درع عند ٧ أيام', P.streak === 7 && P.shield === 1, 'streak=' + P.streak + ' shield=' + P.shield);

    // 4) غياب يوم واحد: الدرع يحمي
    P.streak = 40; P.shield = 2; P.lastPlay = daysAgo(2);
    touchStreak();
    ok('A4 الدرع يحمي غياب يوم', P.streak === 41 && P.shield === 1, 'streak=' + P.streak + ' shield=' + P.shield);

    // 5) غياب يومين بلا درع: تصفير
    P.streak = 30; P.shield = 0; P.lastPlay = daysAgo(3);
    touchStreak();
    eq('A5 غياب طويل بلا درع يصفّر', P.streak, 1);

    // 6) نفس اليوم مايزودش
    P.streak = 8; P.lastPlay = today();
    touchStreak();
    eq('A6 اللعب مرتين في يوم مايكررش', P.streak, 8);

    // 7) درع بحد أقصى ٣
    P.streak = 6; P.shield = 3; P.lastPlay = daysAgo(1);
    touchStreak();
    ok('A7 الدرع سقفه ٣', P.shield === 3, 'shield=' + P.shield);

    // 8) memo يتحدد ويتقصّر على طول السورة
    P.memo = {};
    setMemo(112, 999);
    eq('A8 memo بيتقصّر على طول السورة', P.memo[112], QURAN[112].ay.length);
    setMemo(112, 0);
    ok('A9 memo=0 بيمسح', !(112 in P.memo), JSON.stringify(P.memo));

    // 10) surProgress بيحسب المعلن
    P.sstars = {}; P.memo = {};
    setMemo(112, QURAN[112].ay.length);
    const sp = surProgress(112);
    ok('A10 surProgress بيعدّ المعلن', sp.covered === QURAN[112].ay.length && sp.pct === 100,
      'covered=' + sp.covered + ' pct=' + sp.pct);

    // 11) totalStars بيجمع
    P.sstars = { 112: { '1-4': 3 } }; P.stars = {};
    ok('A11 totalStars بيجمع نجوم السور', totalStars() === 3, 'total=' + totalStars());

    // 12) توليد أسئلة سورة كاملة
    const entry = surahEntry(112);
    const qs = genSolo(entry, 112);
    ok('A12 genSolo بيطلّع أسئلة', Array.isArray(qs) && qs.length >= 1, 'count=' + (qs ? qs.length : 0));
    ok('A13 كل سؤال ليه نوع', qs.every(q => q.type), 'types=' + [...new Set(qs.map(q => q.type))].join(','));

    // 14) packProfile رو*undtrip
    P.focus = 112; P.avatar = 'char';
    const packed = packProfile(P);
    ok('A14 packProfile بيحفظ التقدّم', packed.sstars && packed.memo && 'streak' in packed && 'focus' in packed,
      'keys=' + Object.keys(packed).length);

    // 15) pageOfAyah صح على حالات معروفة
    ok('A15 صفحة الفاتحة ١', pageOfAyah(1, 1) === 1, 'p=' + pageOfAyah(1, 1));
    ok('A16 صفحة الناس (١١٤) قرب ٦٠٤', pageOfAyah(114, 1) >= 600, 'p=' + pageOfAyah(114, 1));
    ok('A17 صفحة البقرة ٢٥٥ (الكرسي)', pageOfAyah(2, 255) >= 42 && pageOfAyah(2, 255) <= 43, 'p=' + pageOfAyah(2, 255));

    // 18) awardBadges بيدّي أول وسام
    P.stats = { c: 1, w: 0, per: {} }; P.badges = [];
    awardBadges();
    ok('A18 أول إجابة صح = وسام', P.badges.includes('first'), 'badges=' + P.badges.join(','));

    // نرجّع البروفايل الحقيقي
    P = realP;
  } catch (e) {
    ok('A منطق العميل — استثناء غير متوقع', false, (e && e.message) || String(e));
    try { P = SAVE.P; } catch (x) {}
  }

  // ===================== B) قواعد الأمان (حساب مجهول منفصل) =====================
  let a2, d2, probeUid;
  try {
    await fbInit();
    const cfg = firebase.app().options;
    const app2 = firebase.apps.find(x => x.name === 'audit') || firebase.initializeApp(cfg, 'audit');
    a2 = app2.auth(); d2 = app2.database();
    if (!a2.currentUser) await a2.signInAnonymously();
    probeUid = a2.currentUser.uid;
    ok('B0 حساب مجهول اشتغل', a2.currentUser.isAnonymous, 'uid=' + probeUid.slice(0, 6));

    const rd = p => d2.ref(p).once('value').then(() => 'ALLOW').catch(() => 'DENY');
    const wr = (p, v) => d2.ref(p).set(v).then(() => 'ALLOW').catch(() => 'DENY');

    // قراءات ممنوعة (تسريب بيانات)
    const denyReads = ['users', 'halaqas', 'members', 'centers', 'index', 'reports', 'audit',
      'msgs/someoneelse', 'inbox/someoneelse', 'config/owners'];
    for (const p of denyReads) ok('B قراءة ممنوعة: ' + p, (await rd(p)) === 'DENY');

    // كتابات ممنوعة
    ok('B كتابة config ممنوعة', (await wr('config/hack', 1)) === 'DENY');
    ok('B كتابة owners ممنوعة', (await wr('config/owners/x', true)) === 'DENY');
    ok('B كتابة إعلان ممنوعة', (await wr('ann/all', { txt: 'x', on: true, at: Date.now() })) === 'DENY');
    ok('B كتابة على مستخدم تاني ممنوعة', (await wr('users/SOMEONE/profile', { name: 'x' })) === 'DENY');

    // قنوات الإعلان
    ok('B ann/all يتقري', (await rd('ann/all')) === 'ALLOW');
    ok('B ann/students يتقري', (await rd('ann/students')) === 'ALLOW');
    ok('B ann/teachers ممنوع للطفل', (await rd('ann/teachers')) === 'DENY');
    ok('B ann/mgrs ممنوع للطفل', (await rd('ann/mgrs')) === 'DENY');

    // مسموح: يكتب لاعب في غرفة، وملفه هو
    ok('B يكتب اسمه في غرفة', (await wr('rooms/ABCDE/players/' + probeUid + '/name', 'فحص')) === 'ALLOW');
    ok('B يكتب ملفه الشخصي', (await wr('users/' + probeUid + '/profile/name', 'فحص')) === 'ALLOW');

    // كود استعادة: يكتب بتاعه، والتحقق من طول الصورة
    const code = 'ZZZ' + Math.floor(Date.now() % 900 + 100);
    ok('B يكتب كود استعادة بتاعه', (await wr('restore/' + code, { name: 'x', o: probeUid })) === 'ALLOW');
    const bigImg = 'data:image/png;base64,' + 'A'.repeat(40000);
    ok('B صورة ضخمة في الاستعادة مرفوضة', (await wr('restore/' + code + '/img', bigImg)) === 'DENY');

    // memo: قيمة خارج المدى مرفوضة (لازم عضوية حلقة أصلًا، فنكتفي بالتحقق إن الكتابة على حلقة مش بتاعته مرفوضة)
    ok('B عضوية في حلقة مش بتاعته مرفوضة',
      (await wr('members/ABCDE/' + probeUid + '/memo/sn', 999)) === 'DENY' ||
      (await wr('members/ABCDE/' + probeUid + '/memo/sn', 999)) === 'DENY');

    // تنظيف بيانات الفحص اللي كتبناها
    await d2.ref('rooms/ABCDE').remove().catch(() => {});
    await d2.ref('restore/' + code).remove().catch(() => {});
    await d2.ref('users/' + probeUid).remove().catch(() => {});
  } catch (e) {
    ok('B قواعد الأمان — استثناء', false, (e && e.message) || String(e));
  }

  // ===================== C) جهة المالك (الحساب الحالي) =====================
  try {
    if (typeof isOwner === 'function' && isOwner()) {
      const D = await ownerLoad(true);
      ok('C1 اللوحة بتحمّل كل الأقسام',
        D.players && D.halaqas && D.centers && D.reports && D.audits, 'players=' + D.players.length);
      ok('C2 كل المستخدمين ظاهرين (مش الفهرس بس)', D.players.length >= 19, 'count=' + D.players.length);
      const bk = await ownerBackup();
      ok('C3 النسخة الاحتياطية فيها أقسام النظام',
        bk && ('users' in bk) && ('config' in bk), 'keys=' + (bk ? Object.keys(bk).join(',') : 'null'));
    } else {
      ok('C جهة المالك — الحساب الحالي مش مالك (اتخطّت)', true, 'not owner');
    }
  } catch (e) {
    ok('C جهة المالك — استثناء', false, (e && e.message) || String(e));
  }

  // ===================== النتيجة =====================
  const fails = R.filter(r => !r.pass);
  window.__AUDIT = JSON.stringify({
    total: R.length, passed: R.length - fails.length, failed: fails.length,
    fails: fails.map(f => ({ name: f.name, detail: f.detail })),
    all: R.map(r => (r.pass ? '✅ ' : '❌ ') + r.name)
  });
})();
'started';
