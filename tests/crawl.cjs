/* جولة آلية: بتدوس على كل عنصر قابل للضغط مرة على الأقل وتسجّل أي خطأ/صورة مكسورة/تمدد أفقي */
module.exports = async function crawl(pg, errs, label, steps, opts={}){
  const clicked=new Map(); const issues=new Map(); const screens=new Set(); let trail=[];
  const note=(k,d)=>{ if(!issues.has(k)) issues.set(k,d); };
  await pg.evaluate(()=>{ window.open=()=>null; window.print=()=>{}; if(navigator.clipboard) navigator.clipboard.writeText=async()=>{}; });
  let errSeen=errs.length, idle=0;
  const until=Date.now()+(opts.ms||240000);
  for(let i=0;i<steps;i++){ if(Date.now()>until) break;
    const els=await pg.evaluate(skip=>{ const vis=e=>{ const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>4&&r.height>4&&s.visibility!=='hidden'&&s.display!=='none'&&s.pointerEvents!=='none'&&r.bottom>0&&r.top<innerHeight*6; };
      const head=[...document.querySelectorAll('h1,h2')].filter(vis).map(x=>x.textContent.trim().slice(0,30))[0]||'';
      const all=[...document.querySelectorAll('button,.stage,.door,.opt,.chip,[data-p],[data-sn],[data-s],[data-c],[data-k],[data-th],[data-d],[data-g],[data-j],[data-i],select,input[type=range],input[type=checkbox]')].filter(vis).filter(e=>!e.disabled);
      const out=all.map((e,ix)=>{ e.setAttribute('data-cx',ix); const sig=(e.id?'#'+e.id:(e.className&&typeof e.className==='string'?'.'+e.className.split(' ').filter(c=>c&&!['on','fade','pop','sel','done','ok','bad','live','turnGlow'].includes(c)).slice(0,2).join('.'):e.tagName))+'|'+Object.keys(e.dataset).filter(k=>k!=='cx').slice(0,2).join(',');
        return {ix,sig,id:e.id||'',txt:(e.textContent||'').trim().slice(0,18)}; });
      return {head,out,ov:document.documentElement.scrollWidth-innerWidth, broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.src&&!i.src.startsWith('data:')).map(i=>i.getAttribute('src')).slice(0,3)}; });
    screens.add(els.head);
    if(els.ov>3) note('OVERFLOW '+els.head, 'تمدد أفقي '+els.ov+'px في «'+els.head+'» بعد: '+trail.slice(-3).join(' → '));
    els.broken.forEach(b=>note('IMG '+b,'صورة مكسورة '+b+' في «'+els.head+'»'));
    const deny=/^#(acDel|acOut|k2y|rcBtn|own|beT|lv)$|خروج من الحلقة|شيل ملفي|🗑/;
    let cand=els.out.filter(e=>!deny.test(e.sig.split('|')[0]) && !deny.test(e.txt) && !(opts.skip&&opts.skip.test(e.sig+e.txt)));
    if(!cand.length){ idle++; await pg.evaluate(()=>{ try{ document.querySelectorAll('body > div[style*="position:fixed"],body > div[style*="position: fixed"]').forEach(d=>d.remove()); screenHome(); }catch(e){} }); await pg.waitForTimeout(300); if(idle>6) break; continue; }
    idle=0;
    cand.forEach(e=>e.key=els.head+'::'+e.sig);
    const min=Math.min(...cand.map(e=>clicked.get(e.key)||0));
    const pool=cand.filter(e=>(clicked.get(e.key)||0)===min); const pick=pool[Math.floor(Math.random()*pool.length)];
    clicked.set(pick.key,(clicked.get(pick.key)||0)+1); trail.push(els.head+'/'+(pick.id?'#'+pick.id:pick.txt||pick.sig)); if(trail.length>8) trail.shift();
    try{ const h=await pg.$('[data-cx="'+pick.ix+'"]'); if(h){ const tag=await h.evaluate(e=>e.tagName); if(tag==='SELECT'){ await h.evaluate(e=>{ e.selectedIndex=(e.selectedIndex+1)%e.options.length; e.dispatchEvent(new Event('change',{bubbles:true})); }); } else await h.click({timeout:1200,force:true}); } }catch(e){}
    await pg.waitForTimeout(opts.wait||140);
    if(opts.watchUid){ const u=await pg.evaluate(()=>{ try{ return JSON.parse(localStorage.getItem('__fakeuser')||'{}').uid+'|'+(JSON.parse(localStorage.getItem('__fakeuser')||'{}').email||''); }catch(e){ return ''; } });
      if(opts._uid===undefined) opts._uid=u; else if(u!==opts._uid){ note('UID '+u,'الهوية اتغيّرت من '+opts._uid+' إلى '+u+'\n      المسار: '+trail.slice(-8).join(' → ')); opts._uid=u; if(opts.stopOnUid) break; } }
    if(errs.length>errSeen){ for(const e of errs.slice(errSeen)) note('ERR '+e.replace(/\d{6,}/g,'N').slice(0,160), e.slice(0,400)+'\n      المسار: '+trail.slice(-5).join(' → ')); errSeen=errs.length; }
    if(i%45===44){ await pg.evaluate(()=>{ try{ document.querySelectorAll('body > div[style*="position:fixed"]').forEach(d=>d.remove()); screenHome(); }catch(e){} }); await pg.waitForTimeout(250); trail.push('[home]'); }
  }
  return { label, screens:[...screens], nClicked:clicked.size, issues:[...issues.values()] };
};
