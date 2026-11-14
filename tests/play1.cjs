const { boot, dump, toasts, closeDialogs } = require('./lib.cjs'); const play=require('./player.cjs');
const R=[];
(async()=>{ const T=await boot();
  async function run(name, path, max){ const k=await T.device(name); const pg=k.pg; const e0=T.errs.length;
    await pg.goto(T.BASE); await pg.waitForTimeout(1100);
    await pg.fill('#npName','ليلى'); await pg.click('#chRow [data-c="girl"]'); await pg.click('[data-ag="small"]'); await pg.click('#mk'); await pg.waitForTimeout(1300); await closeDialogs(pg);
    for(const sel of path){ try{ if(sel.startsWith('js:')) await pg.evaluate(c=>{ (0,eval)(c); }, sel.slice(3)); else await pg.click(sel,{timeout:3500}); }catch(e){ R.push('❌ '+name+' — مش لاقي '+sel); console.log(await dump(pg,40)); await k.ctx.close(); return; } await pg.waitForTimeout(600); }
    const log=[]; const r=await play(pg, max||260, log);
    const errs=T.errs.slice(e0);
    R.push((r.done&&!errs.length?'✅ ':'❌ ')+name+' — '+(r.done?'خلص في '+r.ticks+' خطوة: '+r.end.slice(0,90):'وقف: '+r.stuck.slice(0,300))+(errs.length?'\n     أخطاء: '+errs.join('\n     ').slice(0,600):''));
    console.log('SEQ '+name+': '+r.seq.join(' › ').slice(0,700));
    if(!r.done){ console.log(await dump(pg,40)); console.log('LOG tail', log.slice(-12).join(' ; ')); await pg.screenshot({path:'stuck-'+name+'.png'}); }
    await k.ctx.close(); }
  const jobs=JSON.parse(process.argv[2]);
  for(const [name,path,max] of jobs) await run(name,path,max);
  console.log('\n'+R.join('\n')); await T.b.close(); })().catch(e=>{ console.log(R.join('\n')); console.log('CRASH',e); process.exit(1); });
