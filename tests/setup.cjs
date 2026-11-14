const { boot, dump, toasts, closeDialogs } = require('./lib.cjs');
/* معلمة عندها حلقة + طفلة منضمة من الرابط */
module.exports = async function setup(){ const T=await boot(); const t=await T.device('teacher'); const tp=t.pg;
  await tp.goto(T.BASE); await tp.waitForTimeout(1200);
  await tp.fill('#npName','أ. سارة'); await tp.click('#chRow [data-c="hijab"]'); await tp.click('[data-role="teacher"]'); await tp.click('#mk'); await tp.waitForTimeout(700);
  await tp.click('#k2y'); await tp.waitForTimeout(600);
  await tp.fill('#acEmail','sara@test.com'); await tp.fill('#acPass','secret12'); await tp.click('#acGo'); await tp.waitForTimeout(900);
  await closeDialogs(tp); await tp.click('#hm'); await tp.waitForTimeout(700);
  await tp.fill('#tgrp','أميرات القرآن'); await tp.click('#reg'); await tp.waitForTimeout(1300); await closeDialogs(tp);
  const regMadeHalaqa = !!(await tp.$('#lk'));
  if(!regMadeHalaqa){ await tp.fill('#nh','أميرات القرآن'); await tp.click('#addh'); await tp.waitForTimeout(1000); }
  const link=(await tp.textContent('#lk')).trim(); const hid=link.split('?h=')[1];
  const k=await T.device('kid1'); const kp=k.pg;
  await kp.goto(link); await kp.waitForTimeout(1500);
  await kp.fill('#npName','ليلى'); await kp.click('#chRow [data-c="girl"]'); await kp.click('[data-ag="small"]'); await kp.click('#mk'); await kp.waitForTimeout(2200);
  await closeDialogs(kp); await toasts(kp); await toasts(tp);
  return { T, tp, kp, hid, link, regMadeHalaqa, dump, toasts, closeDialogs }; };
