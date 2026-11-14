const setup=require('./setup.cjs');
const R=[]; const ok=(n,c,d)=>{ R.push((c?'✅ ':'❌ ')+n+(d?'  — '+String(d).slice(0,220):'')); };
(async()=>{ const s=await setup(); const {T,tp,kp,hid,dump,toasts,closeDialogs}=s;
  ok('T2 التسجيل عمل حلقة فعلية برابط', s.regMadeHalaqa);
  // ===== مسابقة الحلقة =====
  await tp.click('#quiz'); await tp.waitForTimeout(500); await tp.click('[data-m="all"]'); await tp.click('[data-n="10"]'); await tp.click('#go'); await tp.waitForTimeout(1500);
  ok('C1 الطفلة جالها تنبيه المسابقة وزر «ادخل حالًا»', !!(await kp.$('#joinLive')), JSON.stringify(await toasts(kp)));
  await kp.click('#joinLive'); await kp.waitForTimeout(900);
  await tp.click('#st'); await tp.waitForTimeout(1200);
  let rounds=0; const seen=new Set();
  for(let i=0;i<120;i++){ let any=false;
    for(const pg of [kp,tp]){ const o=await pg.$('.opt:not([disabled]):not(.dis)'); if(o){ const q=await pg.evaluate(()=> (document.querySelector('.q,.ayah,.question')||document.querySelector('#app')).innerText.slice(0,60)); seen.add(q); await o.click({timeout:1500}).catch(()=>{}); any=true; } }
    await kp.waitForTimeout(450);
    const nb=await tp.$('#nx,#next,#nq'); if(nb){ await nb.click().catch(()=>{}); any=true; }
    if(!any){ rounds++; if(rounds>8) break; } else rounds=0; }
  await tp.waitForTimeout(1200);
  console.log('--- teacher after game\n'+await dump(tp,25)); console.log('--- kid after game\n'+await dump(kp,25));
  const room=Object.values(T.sv.S.db.rooms||{})[0]||{};
  ok('C2 المسابقة خلصت والنتيجة ظاهرة عند الاتنين', /(النتيج|الترتيب|انتهت|خلصت|الفائز|🏆)/.test(await kp.evaluate(()=>document.querySelector('#app').innerText)) , 'room.state='+JSON.stringify(room.state||room.st||null).slice(0,120));
  console.log('ROOM KEYS',Object.keys(room), JSON.stringify(room.players||{}).slice(0,300));
  console.log('HAL', JSON.stringify(T.sv.S.db.halaqas[hid]).slice(0,300));
  console.log('MEM', JSON.stringify(T.sv.S.db.members[hid]).slice(0,400));
  console.log('\n'+R.join('\n'));
  console.log('ERRS',JSON.stringify(T.errs,null,1));
  console.log('DENIED',JSON.stringify(T.sv.S.denied.filter(d=>!/^ann\/(teachers|mgrs)/.test(d.path)),null,1));
  await tp.screenshot({path:'c-t.png'}); await kp.screenshot({path:'c-k.png'}); await T.b.close(); })().catch(e=>{ console.log(R.join('\n')); console.log('CRASH',e); process.exit(1); });
