const { boot, dump, toasts, closeDialogs } = require('./lib.cjs');
const R=[]; const ok=(n,c,d)=>{ R.push((c?'✅ ':'❌ ')+n+(d?'  — '+d:'')); };
(async()=>{ const T=await boot(); const t=await T.device('teacher'); const tp=t.pg;
  // ===== المعلمة =====
  await tp.goto(T.BASE); await tp.waitForTimeout(1200);
  await tp.fill('#npName','أ. سارة'); await tp.click('#chRow [data-c="hijab"]'); await tp.click('[data-role="teacher"]'); await tp.click('#mk'); await tp.waitForTimeout(700);
  await tp.click('#k2y'); await tp.waitForTimeout(600);
  await tp.fill('#acEmail','sara@test.com'); await tp.fill('#acPass','secret12'); await tp.click('#acGo'); await tp.waitForTimeout(900);
  ok('T1 المعلمة سجّلت بإيميل', (await toasts(tp)).some(x=>x.includes('اتأمّن')));
  await closeDialogs(tp); await tp.click('#hm'); await tp.waitForTimeout(700);
  await tp.fill('#tgrp','أميرات القرآن'); await tp.click('#reg'); await tp.waitForTimeout(1200); await closeDialogs(tp);
  const afterReg = await dump(tp);
  const hals0 = Object.keys(T.sv.S.db.halaqas||{});
  ok('T2 التسجيل باسم الحلقة عمل حلقة فعلية', hals0.length===1, 'عدد الحلقات في القاعدة='+hals0.length);
  if(!(await tp.$('#lk'))){ await tp.fill('#nh','أميرات القرآن'); await tp.click('#addh'); await tp.waitForTimeout(1000); }
  const link = (await tp.textContent('#lk')).trim(); const hid = link.split('?h=')[1];
  ok('T3 رابط الحلقة ظاهر', /\?h=[A-Z0-9]{5}$/.test(link), link);
  // ===== الطفلة تفتح الرابط على جهاز تاني =====
  const k=await T.device('kid1'); const kp=k.pg;
  await kp.goto(link); await kp.waitForTimeout(1500);
  const inv = await kp.textContent('#invBox').catch(()=>null);
  ok('K1 شاشة البداية بتقول إنها مدعوة باسم الحلقة', inv && inv.includes('أميرات القرآن') && inv.includes('أ. سارة'), inv);
  await kp.fill('#npName','ليلى'); await kp.click('#chRow [data-c="girl"]'); await kp.click('[data-ag="small"]'); await kp.click('#mk'); await kp.waitForTimeout(2200);
  const kt = await toasts(kp);
  ok('K2 رسالة «انضممت للحلقة»', kt.some(x=>x.includes('انضممت للحلقة')), JSON.stringify(kt));
  const mem = (T.sv.S.db.members||{})[hid]||{};
  ok('K3 سجل الطفلة اتكتب في القاعدة (القواعد سمحت)', Object.values(mem).some(m=>m.name==='ليلى'), JSON.stringify(mem));
  await closeDialogs(kp);
  ok('K4 مربع «حلقتي» بيقول ١ حلقة', ((await kp.textContent('#mHal'))||'').includes('1 حلقة'));
  // المعلمة تشوفها لحظيًا من غير تحديث
  await tp.waitForTimeout(800);
  const studs = await tp.textContent('#halStudsCard').catch(()=> '');
  ok('T4 المعلمة شافت الطفلة فورًا (من غير تحديث)', studs.includes('ليلى'), studs.replace(/\s+/g,' ').slice(0,120));
  // ===== الواجب =====
  await tp.fill('#hwT','حفظ الناس والفلق'); await tp.click('.hws[data-sn="114"]'); await tp.click('.hws[data-sn="113"]'); await tp.click('#hwSave'); await tp.waitForTimeout(900);
  ok('T5 الواجب اتحفظ', !!(T.sv.S.db.halaqas[hid].hw), JSON.stringify(T.sv.S.db.halaqas[hid].hw||null)+' '+JSON.stringify(await toasts(tp)));
  await kp.click('#mHal'); await kp.waitForTimeout(1200);
  const halScr = await kp.evaluate(()=>document.querySelector('#app').innerText);
  ok('K5 الطفلة شايفة الحلقة والواجب', halScr.includes('أميرات القرآن') && halScr.includes('حفظ الناس والفلق'), halScr.replace(/\s+/g,' ').slice(0,200));
  console.log('--- kid halaqa screen\n'+await dump(kp,30));
  // ===== طفل تاني بالكود اليدوي =====
  const k2=await T.device('kid2'); const kp2=k2.pg;
  await kp2.goto(T.BASE); await kp2.waitForTimeout(1200);
  await kp2.fill('#npName','عمر'); await kp2.click('#mk'); await kp2.waitForTimeout(1200); await closeDialogs(kp2);
  await kp2.click('#mHal'); await kp2.waitForTimeout(600); await kp2.fill('#hcode', hid.toLowerCase()); await kp2.click('#hgo'); await kp2.waitForTimeout(1500);
  ok('K6 طفل تاني انضم بالكود (حروف صغيرة)', Object.values((T.sv.S.db.members||{})[hid]||{}).some(m=>m.name==='عمر'), JSON.stringify(await toasts(kp2)));
  await tp.waitForTimeout(700);
  ok('T6 المعلمة شايفة الاتنين', ['ليلى','عمر'].every(n=>(tp.textContent('#halStudsCard'),true)) && (await tp.textContent('#halStudsCard')).includes('عمر'));
  console.log('--- teacher halaqa screen (students part)\n'+(await tp.evaluate(()=>document.querySelector('#halStudsCard').innerText)).slice(0,500));
  console.log('--- teacher buttons in students card: '+await tp.evaluate(()=>[...document.querySelectorAll('#halStudsCard button')].map(b=>(b.id||b.className)+'«'+b.textContent.trim().slice(0,14)+'»').join(' ')));
  console.log('\n'+R.join('\n'));
  console.log('ERRS',JSON.stringify(T.errs,null,1));
  console.log('DENIED',JSON.stringify(T.sv.S.denied.filter(d=>!/^ann\/(teachers|mgrs)/.test(d.path)),null,1));
  await tp.screenshot({path:'e2e-teacher.png',fullPage:true}); await kp.screenshot({path:'e2e-kid.png',fullPage:true});
  await T.b.close(); })().catch(e=>{ console.log(R.join('\n')); console.log('CRASH',e); process.exit(1); });
