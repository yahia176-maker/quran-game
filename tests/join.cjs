const { chromium } = require('./pw.cjs');
const fs = require('fs');
const FAKE = fs.readFileSync(require('path').join(__dirname,'fb','fake-app.js'),'utf8');
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8765') + '/quran-game.html';
const SEED = ()=>{ if(!localStorage.getItem('__fakefb')) localStorage.setItem('__fakefb', JSON.stringify({
  halaqas:{ ABCDE:{ name:'أميرات القرآن', t:'teacherUid', tname:'أ. سارة', created:1 } } })); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args:['--no-sandbox'] });
  const out = {};
  async function scenario(name, opts, steps){ const {sdkDelay=0, failFirst=false, seedProfile=false, link='?h=ABCDE'} = opts;
    const ctx = await b.newContext({ viewport:{width:400,height:860} });
    const pg = await ctx.newPage(); const errs=[], toasts=[];
    pg.on('pageerror', e=>errs.push(String(e.stack||e).split('\n').slice(0,2).join(' @ ')));
    let fail = failFirst;
    await pg.route('**/firebasejs/**', async r => {
      if(fail) return r.abort();
      if(sdkDelay) await new Promise(x=>setTimeout(x, sdkDelay));
      r.fulfill({ contentType:'application/javascript', body: r.request().url().includes('firebase-app.js') ? FAKE : '' });
    });
    await pg.addInitScript(SEED);
    if(seedProfile) await pg.addInitScript(()=>{ if(!localStorage.getItem('quran_game_v1_profiles')){
      localStorage.setItem('quran_game_v1_profiles', JSON.stringify([{id:'p9',name:'عمر',char:'boy',role:'student',stars:{},sstars:{},stats:{c:1,w:0,per:{}},streak:0,memo:{},mistakes:[],badges:[]}]));
      localStorage.setItem('quran_game_v1_active','p9'); localStorage.setItem('quran_game_v1_role','student'); } });
    await pg.addInitScript(()=>{ window.__toasts=[]; document.addEventListener('DOMContentLoaded',()=>{ new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1){ if(n.classList.contains('toast')) window.__toasts.push(n.textContent); const h=n.querySelector&&n.querySelector('h3'); if(h && n.style && n.style.zIndex==='70') window.__toasts.push('DIALOG: '+h.textContent); } }))).observe(document.body,{childList:true,subtree:true}); }); });
    if(opts.two) await pg.addInitScript(()=>{ if(!localStorage.getItem('quran_game_v1_profiles')){
      const mk=(id,name)=>({id,name,char:'boy',role:'student',stars:{},sstars:{},stats:{c:1,w:0,per:{}},streak:0,memo:{},mistakes:[],badges:[]});
      localStorage.setItem('quran_game_v1_profiles', JSON.stringify([mk('p1','عمر'),mk('p2','يوسف')]));
      localStorage.setItem('quran_game_v1_active','p1'); localStorage.setItem('quran_game_v1_role','student'); } });
    if(opts.uid) await pg.addInitScript(u=>{ localStorage.setItem('__fakeuid', u); }, opts.uid);
    await pg.goto(BASE+link, { waitUntil:'domcontentloaded' });
    const state = async()=> pg.evaluate(()=>{ const db=JSON.parse(localStorage.getItem('__fakefb')||'{}'); const ps=JSON.parse(localStorage.getItem('quran_game_v1_profiles')||'[]');
      return { members: db.members||null, halaqasInProfile: ps.map(p=>(p.halaqas||[]).map(h=>h.hid)), toasts: window.__toasts,
        url: location.search, pend: localStorage.getItem('quran_game_v1_pendhal'), invite: (document.querySelector('#invBox')||{}).textContent||null, screen: (document.querySelector('h1,h2')||{}).textContent, halTile: (document.querySelector('#mHal .muted')||{}).textContent||null }; });
    const res = await steps(pg, state, v=>{ fail=v; });
    out[name] = { ...res, errs };
    await ctx.close();
  }
  const makeProfile = async (pg, nm='ليلى') => { await pg.fill('#npName', nm); await pg.click('#mk'); };

  await scenario('A_new_kid_fast', {}, async (pg, state) => {
    await pg.waitForTimeout(1200); await makeProfile(pg); await pg.waitForTimeout(2500); return await state(); });
  await scenario('B_slow_firebase_profile_first', {sdkDelay:1500}, async (pg, state) => {
    await pg.waitForTimeout(800); await makeProfile(pg); await pg.waitForTimeout(7000); return await state(); });
  await scenario('C_typing_when_firebase_arrives', {sdkDelay:700}, async (pg, state) => {
    await pg.waitForTimeout(500); await pg.fill('#npName','ليلى'); await pg.click('#chRow [data-c="girl"]');
    await pg.waitForTimeout(3500);
    const typed = await pg.inputValue('#npName').catch(()=> 'NO_INPUT');
    const picked = await pg.evaluate(()=> (document.querySelector('#chRow .on')||{dataset:{}}).dataset.c);
    return { nameStillThere: typed, charStillPicked: picked }; });
  await scenario('D_firebase_fails_then_reopen', {failFirst:true}, async (pg, state, setFail) => {
    await pg.waitForTimeout(1200); await makeProfile(pg); await pg.waitForTimeout(1500);
    const first = await state();
    setFail(false); await pg.goto(BASE, { waitUntil:'domcontentloaded' }); await pg.waitForTimeout(3500);
    return { afterFail: {members:first.members, toasts:first.toasts}, afterReopen: await state() }; });
  await scenario('E_existing_kid_clicks_link', {seedProfile:true}, async (pg, state) => { await pg.waitForTimeout(3000); return await state(); });
  await scenario('F_lowercase_link', {seedProfile:true, link:'?h=abcde'}, async (pg, state) => { await pg.waitForTimeout(3000); return await state(); });
  await scenario('G_wrong_code', {seedProfile:true, link:'?h=ZZZZZ'}, async (pg, state) => { await pg.waitForTimeout(3000); return await state(); });
  await scenario('H_two_profiles_pick_second', {two:true}, async (pg, state) => { await pg.waitForTimeout(2500);
    const before = await state(); await pg.click('[data-p="p2"]'); await pg.waitForTimeout(2500);
    const after = await state(); return { beforePick:{members:before.members, invite:before.invite}, after }; });
  await scenario('I_fail_no_profile_then_reopen', {failFirst:true}, async (pg, state, setFail) => {
    await pg.waitForTimeout(1200); const first = await state();
    setFail(false); await pg.goto(BASE, { waitUntil:'domcontentloaded' }); await pg.waitForTimeout(2500);
    const reopened = await state(); await makeProfile(pg); await pg.waitForTimeout(2500);
    return { first:{invite:first.invite,pend:first.pend}, reopenedInvite: reopened.invite, final: await state() }; });
  await scenario('J_teacher_own_link', {seedProfile:true, uid:'teacherUid'}, async (pg, state) => { await pg.waitForTimeout(3000); return await state(); });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
