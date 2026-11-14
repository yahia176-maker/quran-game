/* خادم اختبار: قاعدة بيانات مشتركة بين «الأجهزة» + حسابات + مُقيِّم لقواعد أمان Firebase الحقيقية */
const fs=require('fs');
String.prototype.beginsWith=function(s){return this.startsWith(s);};
String.prototype.contains=function(s){return this.includes(s);};
String.prototype.matches=function(r){return r.test(this);};
const parts=p=>String(p||'').split('/').filter(Boolean);
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const getAt=(d,ps)=>ps.reduce((o,k)=>(o&&typeof o==='object'&&o[k]!==undefined)?o[k]:null,d);
function setAt(d,ps,v){ let o=d; for(let i=0;i<ps.length-1;i++){ if(typeof o[ps[i]]!=='object'||o[ps[i]]===null) o[ps[i]]={}; o=o[ps[i]]; }
  if(v===null||v===undefined) delete o[ps[ps.length-1]]; else o[ps[ps.length-1]]=clone(v); }
function prune(o){ if(o&&typeof o==='object'){ for(const k of Object.keys(o)){ prune(o[k]); if(o[k]===null||(typeof o[k]==='object'&&!Object.keys(o[k]).length)) delete o[k]; } } }
class Snap{ constructor(root,ps){ this.r=root; this.ps=ps; }
  val(){ const v=getAt(this.r,this.ps); return v===undefined?null:v; }
  child(p){ return new Snap(this.r,this.ps.concat(parts(p))); }
  parent(){ return new Snap(this.r,this.ps.slice(0,-1)); }
  exists(){ const v=this.val(); return v!==null && !(typeof v==='object' && !Object.keys(v).length); }
  hasChild(p){ return this.child(p).exists(); }
  hasChildren(a){ const v=this.val(); if(!v||typeof v!=='object') return false; return a?a.every(k=>this.hasChild(k)):Object.keys(v).length>0; }
  isNumber(){ return typeof this.val()==='number'; } isString(){ return typeof this.val()==='string'; } isBoolean(){ return typeof this.val()==='boolean'; }
  getPriority(){ return null; } }
const cache=new Map();
function ev(expr,ctx,vars){ if(expr===true||expr===false) return expr;
  const names=Object.keys(vars); const key=expr+'|'+names.join(',');
  let f=cache.get(key); if(!f){ f=new Function('auth','root','data','newData','now',...names,'return ('+expr.replace(/\.replace\(/g,'.replaceAll(')+');'); cache.set(key,f); }
  try{ return !!f(ctx.auth,ctx.root,ctx.data,ctx.newData,ctx.now,...names.map(n=>vars[n])); }catch(e){ return false; } }
function step(node,key,vars){ if(!node||typeof node!=='object') return null;
  if(Object.prototype.hasOwnProperty.call(node,key) && key[0]!=='.') return node[key];
  const w=Object.keys(node).find(k=>k[0]==='$'); if(w){ vars[w]=key; return node[w]; } return null; }
module.exports=function makeServer(rulesFile){
  const RULES=JSON.parse(fs.readFileSync(rulesFile,'utf8')).rules;
  const S={ db:{}, accounts:{}, anon:0, pages:new Set(), denied:[], log:[], writes:0, reads:0 };
  function canRead(ps,auth){ const root=new Snap(S.db,[]); let node=RULES; const vars={};
    for(let i=0;i<=ps.length;i++){ if(node && node['.read']!==undefined){ const cur=ps.slice(0,i);
        if(ev(node['.read'],{auth,root,data:new Snap(S.db,cur),newData:new Snap(S.db,cur),now:Date.now()},vars)) return true; }
      if(i<ps.length) node=step(node,ps[i],vars); if(!node && i<ps.length) return false; } return false; }
  function checkWrite(ps,newDb,auth){ const root=new Snap(S.db,[]); const now=Date.now(); let node=RULES; const vars={}; let granted=false;
    const mk=cur=>({auth,root,data:new Snap(S.db,cur),newData:new Snap(newDb,cur),now});
    const chain=[];
    for(let i=0;i<=ps.length;i++){ const cur=ps.slice(0,i);
      if(node){ if(node['.write']!==undefined && !granted && ev(node['.write'],mk(cur),vars)) granted=true;
        chain.push({node,cur,vars:Object.assign({},vars)}); }
      if(i<ps.length) node=step(node,ps[i],vars); }
    if(!granted) return 'no .write rule grants /'+ps.join('/');
    for(const c of chain){ if(c.node['.validate']!==undefined && new Snap(newDb,c.cur).exists() && !ev(c.node['.validate'],mk(c.cur),c.vars)) return '.validate failed at /'+c.cur.join('/')+' :: '+c.node['.validate']; }
    const bad=(function walk(node,cur,vars){ const v=getAt(newDb,cur); if(v===null||typeof v!=='object') return null;
      for(const k of Object.keys(v)){ const vv=Object.assign({},vars); const ch=step(node,k,vv); const p=cur.concat(k);
        if(!ch) continue;
        if(ch['.validate']!==undefined && new Snap(newDb,p).exists() && !ev(ch['.validate'],mk(p),vv)) return '.validate failed at /'+p.join('/')+' :: '+ch['.validate'];
        const r=walk(ch,p,vv); if(r) return r; } return null; })(node,ps,Object.assign({},vars));
    return (node && bad) || null; }
  const A={ byUid:uid=>Object.values(S.accounts).find(a=>a.uid===uid) };
  async function poke(){ for(const p of [...S.pages]){ if(p.isClosed()){ S.pages.delete(p); continue; } p.evaluate(()=>window.__fbPoke&&window.__fbPoke()).catch(()=>{}); } }
  async function rpc(json){ const m=JSON.parse(json); const auth=m.auth||null;
    switch(m.op){
      case 'read':{ S.reads++; const ps=parts(m.path); if(!canRead(ps,auth)){ S.denied.push({op:'read',path:m.path,uid:auth&&auth.uid,email:auth&&auth.token.email}); return JSON.stringify({err:'PERMISSION_DENIED'}); }
        return JSON.stringify({val:clone(getAt(S.db,ps))}); }
      case 'write':{ S.writes++; const newDb=clone(S.db); for(const w of m.writes) setAt(newDb,parts(w.path),w.value); prune(newDb);
        for(const w of m.writes){ const why=checkWrite(parts(w.path),newDb,auth);
          if(why){ S.denied.push({op:m.kind,path:w.path,uid:auth&&auth.uid,email:auth&&auth.token.email,why,value:JSON.stringify(w.value).slice(0,160)}); return JSON.stringify({err:'PERMISSION_DENIED'}); } }
        S.db=newDb; S.log.push(m.kind+' '+m.path); poke(); return '{}'; }
      case 'authAnon':{ const uid='anon'+(++S.anon)+Math.random().toString(36).slice(2,6); return JSON.stringify({user:{uid}}); }
      case 'authLink':{ if(S.accounts[m.email]) return JSON.stringify({err:'auth/email-already-in-use'}); if(String(m.pass).length<6) return JSON.stringify({err:'auth/weak-password'});
        S.accounts[m.email]={uid:m.uid,pass:m.pass,email:m.email,emailVerified:false}; return '{}'; }
      case 'authCreate':{ if(S.accounts[m.email]) return JSON.stringify({err:'auth/email-already-in-use'}); const uid='acct'+(++S.anon);
        S.accounts[m.email]={uid,pass:m.pass,email:m.email,emailVerified:false}; return JSON.stringify({user:S.accounts[m.email]}); }
      case 'authSignIn': case 'authCheck':{ const a=S.accounts[m.email]; if(!a) return JSON.stringify({err:'auth/user-not-found'}); if(a.pass!==m.pass) return JSON.stringify({err:'auth/wrong-password'}); return JSON.stringify({user:a}); }
      case 'authGet':{ const a=A.byUid(m.uid); return JSON.stringify({user:a||null}); }
      case 'authSetEmail':{ const a=A.byUid(m.uid); if(!a) return JSON.stringify({err:'auth/user-not-found'}); if(S.accounts[m.email]) return JSON.stringify({err:'auth/email-already-in-use'});
        delete S.accounts[a.email]; a.email=m.email; a.emailVerified=false; S.accounts[m.email]=a; return '{}'; }
      case 'authLog':{ S.log.push('AUTH '+m.what+' '+m.email); return '{}'; }
    } return '{}'; }
  const FAKE=fs.readFileSync(__dirname+'/fake.js','utf8');
  async function attach(ctx,{offline}={}){ await ctx.exposeFunction('__fbRpc',rpc);
    await ctx.route('**/firebasejs/**', r => offline&&offline() ? r.abort() : r.fulfill({ contentType:'application/javascript', body: r.request().url().includes('firebase-app.js') ? FAKE : '' }));
    ctx.on('page',p=>S.pages.add(p)); }
  return { S, attach, rpc, verify:email=>{ if(S.accounts[email]) S.accounts[email].emailVerified=true; } };
};
