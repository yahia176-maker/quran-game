const { chromium } = require('./pw.cjs');
(async()=>{ const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args:['--no-sandbox'] });
  for (const [w,h,q] of [[320,568,''],[320,568,'?h=ABCDE'],[360,640,'?h=ABCDE'],[375,667,''],[390,844,''],[412,915,''],[768,1024,''],[1366,768,''],[1920,1080,'']]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} }); const pg = await ctx.newPage();
    await pg.route('**/firebasejs/**', r => r.abort());
    await pg.goto((process.env.BASE_URL || 'http://127.0.0.1:8765') + '/quran-game.html'+q); await pg.waitForTimeout(900);
    const m = await pg.evaluate(()=>{ const r=id=>{ const e=document.querySelector(id); return e?Math.round(e.getBoundingClientRect().bottom):null; };
      const c=document.querySelector('.startCard'); return { mk:r('#mk'), rc:r('#rcBtn'), ih:innerHeight, cardScroll:c.scrollHeight-c.clientHeight, ovx:document.documentElement.scrollWidth-innerWidth, inv:!!document.querySelector('#invBox') }; });
    console.log(w+'x'+h+q, JSON.stringify(m), (m.rc<=m.ih && m.cardScroll<=1 && m.ovx<=1)?'OK':'<<< NOT FIT');
    if(w===320) await pg.screenshot({ path:'fit-'+w+(q?'inv':'')+'.png' });
    await ctx.close(); }
  await b.close(); })();
