const { chromium } = require('./pw.cjs');
const makeServer = require('./fb2/server.cjs');
const BASE=(process.env.BASE_URL || 'http://127.0.0.1:8765') + '/quran-game.html';
const WAV=Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=','base64');
async function boot(){ const b=await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const sv=makeServer(require('path').join(__dirname, '..', 'rules-v15.json')); const errs=[];
  async function device(name,{w=390,h=844,offline}={}){ const ctx=await b.newContext({ viewport:{width:w,height:h} });
    await sv.attach(ctx,{offline});
    await ctx.route('**everyayah.com**', r=>r.fulfill({contentType:'audio/wav',body:WAV}));
    await ctx.addInitScript(()=>{ window.__toasts=[]; document.addEventListener('DOMContentLoaded',()=>{ new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType!==1) return;
      if(n.classList.contains('toast')) window.__toasts.push(n.textContent);
      const h=n.querySelector&&n.querySelector('h3'); if(h && n.style && n.style.position==='fixed') window.__toasts.push('DIALOG: '+h.textContent); }))).observe(document.body,{childList:true,subtree:true}); });
      try{ localStorage.setItem('quran_game_v1_seenver','99'); }catch(e){} });
    const pg=await ctx.newPage();
    pg.on('pageerror',e=>errs.push(name+' PAGEERROR '+String(e.stack||e).split('\n').slice(0,3).join(' | ')));
    pg.on('console',m=>{ if(m.type()==='error'){ const t=m.text(); if(!/Failed to load resource|net::ERR/.test(t)) errs.push(name+' CONSOLE '+t.slice(0,300)); } });
    pg.on('dialog',d=>d.accept().catch(()=>{}));
    return { name, ctx, pg }; }
  return { b, sv, errs, device, BASE }; }
/* ملخّص للشاشة: العنوان + كل الأزرار والحقول الظاهرة */
async function dump(pg,max=60){ return pg.evaluate(max=>{ const vis=e=>{ const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>2&&r.height>2&&s.visibility!=='hidden'&&s.display!=='none'; };
  const out=[]; const h=[...document.querySelectorAll('h1,h2,h3')].filter(vis).map(x=>x.textContent.trim().slice(0,40)); out.push('H: '+h.slice(0,6).join(' | '));
  [...document.querySelectorAll('button,input,select,textarea,[data-p],.stage,.door,[onclick]')].filter(vis).slice(0,max).forEach(e=>{ out.push((e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA'?'IN ':'BT ')+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ').slice(0,3).join('.'):'')+' '+[...Object.entries(e.dataset||{})].map(([k,v])=>k+'='+v).join(',')+' «'+(e.value&&e.tagName!=='BUTTON'?e.value:(e.textContent||e.placeholder||'')).trim().replace(/\s+/g,' ').slice(0,36)+'»'); });
  out.push('TOASTS: '+JSON.stringify((window.__toasts||[]).slice(-4))); return out.join('\n'); },max); }
const toasts=pg=>pg.evaluate(()=>{ const t=window.__toasts.slice(); window.__toasts.length=0; return t; });
const closeDialogs=async pg=>{ for(let i=0;i<4;i++){ const b=await pg.$('#im1'); if(!b) break; await b.click().catch(()=>{}); await pg.waitForTimeout(150); } };
module.exports={ boot, dump, toasts, closeDialogs };
