/* لاعب آلي: يكمّل اللعبة لحد شاشة النهاية من غير ما يدوس رجوع/خروج */
module.exports = async function play(pg, maxTicks=260, log){
  const seq=[]; let last='', same=0;
  for(let i=0;i<maxTicks;i++){
    const st=await pg.evaluate(()=>{ const vis=e=>{ const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>4&&r.height>4&&s.visibility!=='hidden'&&s.display!=='none'&&s.pointerEvents!=='none'; };
      const head=[...document.querySelectorAll('h1,h2,h3,.qtitle,.qt')].filter(vis).map(x=>x.textContent.trim().slice(0,34))[0]||'';
      const txt=document.querySelector('#app').innerText.replace(/\s+/g,' ').slice(0,90);
      const els=[...document.querySelectorAll('#app button, #app .opt, #app .chip, #app .wchip, #app [data-w], #app [data-i], #app .stage, body > div[style*="fixed"] button')].filter(vis).filter(e=>!e.disabled&&!e.classList.contains('dis')&&!e.classList.contains('used')&&!(e.classList.contains('chip')&&e.classList.contains('in')));
      const bad=/^(hm|hm2|homeFab|lv|bk|bk2|cog|whoBtn|lHome|beT|rep|again|tAgain|rp|retry)$/; const badT=/رجوع|خروج|الرئيسية|🏠|إعادة|تاني|عيد|شارك|واتساب|انسخ|بلّغ/;
      document.querySelectorAll('[data-px]').forEach(e=>e.removeAttribute('data-px')); const list=els.filter(e=>!bad.test(e.id)&&!badT.test(e.textContent)).map((e,ix)=>{ e.setAttribute('data-px',ix); return {ix,id:e.id,cls:(typeof e.className==='string'?e.className:''),t:e.textContent.trim().slice(0,22)}; });
      return {head,txt,list}; });
    const key=st.head+'|'+st.list.length+'|'+st.txt.slice(0,40);
    if(seq[seq.length-1]!==st.head) seq.push(st.head);
    if(key===last){ same++; } else { same=0; last=key; }
    if(/(خلّصت|خلصت|نتيجة|النتيجة|انتهى|انتهت|أحسنت يا|مبروك|خلص!|خلص الوقت|رقم قياسي)/.test(st.head+st.txt) && i>3) return {done:true, ticks:i, seq, end:st.head+' :: '+st.txt};
    if(same>25) return {done:false, ticks:i, seq, stuck:st.head+' :: '+st.txt+' :: '+st.list.map(x=>x.id||x.cls.split(' ')[0]+'«'+x.t+'»').join(',')};
    /* لعبة التوصيل: الكلمة ومعناها ليهم نفس data-i */
    const paired=await pg.evaluate(()=>{ const l=document.querySelector('#colL .pair:not(.done)'); if(!l) return false; const r=document.querySelector('#colR .pair[data-i="'+l.dataset.i+'"]'); l.click(); if(r) setTimeout(()=>r.click(),80); return true; });
    if(paired){ if(log) log.push(st.head+' → pair'); await pg.waitForTimeout(330); continue; }
    const L=st.list; let pick=null;
    const go=L.filter(e=>/التالي|كمّل|كمل|تحقق|تأكيد|تأكد|يلا|ابدأ|متابعة|تمام|جاهز|خلصت|سمّعت|نعم|صح|عرفتها|▶/.test(e.t) && !/opt|chip/.test(e.cls));
    const opts=L.filter(e=>/\bopt\b/.test(e.cls)); const chips=L.filter(e=>/chip/.test(e.cls));
    if(opts.length) pick=opts[Math.floor(Math.random()*opts.length)];
    else if(chips.length) pick=chips[0];
    else if(go.length) pick=go[0];
    else if(L.length) pick=L[Math.floor(Math.random()*L.length)];
    if(pick){ const h=await pg.$('[data-px="'+pick.ix+'"]'); if(h) await h.click({timeout:1000,force:true}).catch(()=>{}); if(log) log.push(st.head+' → '+(pick.id||pick.t)); }
    await pg.waitForTimeout(260);
  }
  return {done:false, ticks:maxTicks, seq, stuck:'max ticks'};
};
