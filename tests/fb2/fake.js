/* Firebase وهمي (compat 8) — كل قراءة/كتابة بتروح لخادم الاختبار في Node اللي بيطبّق قواعد الأمان الحقيقية */
(function(){
  const UK='__fakeuser';
  const parts=p=>String(p||'').split('/').filter(Boolean);
  const rpc=(op,a)=>window.__fbRpc(JSON.stringify(Object.assign({op,auth:tok()},a||{}))).then(s=>JSON.parse(s));
  let user=null;
  const stored=()=>{ try{ return JSON.parse(localStorage.getItem(UK)||'null'); }catch(e){ return null; } };
  const tok=()=> user ? { uid:user.uid, token:{ email:user.email||undefined, email_verified:!!user.emailVerified } } : null;
  const err=(code,msg)=>Object.assign(new Error(msg||code),{code});
  function mkUser(u){ if(!u) return null;
    const o={ uid:u.uid, email:u.email||null, isAnonymous:!u.email, emailVerified:!!u.emailVerified,
      reload:async()=>{ const r=await rpc('authGet',{uid:o.uid}); if(r.user){ o.email=r.user.email||null; o.emailVerified=!!r.user.emailVerified; o.isAnonymous=!o.email; persist(o); } },
      getIdToken:async()=>'tok', sendEmailVerification:async()=>{ await rpc('authLog',{what:'verify-email',email:o.email}); },
      linkWithCredential:async c=>{ const r=await rpc('authLink',{uid:o.uid,email:c.email,pass:c.pass}); if(r.err) throw err(r.err);
        o.email=c.email; o.isAnonymous=false; persist(o); return {user:o}; },
      reauthenticateWithCredential:async c=>{ const r=await rpc('authCheck',{email:c.email,pass:c.pass}); if(r.err) throw err(r.err); return {user:o}; },
      verifyBeforeUpdateEmail:async e=>{ const r=await rpc('authSetEmail',{uid:o.uid,email:e}); if(r.err) throw err(r.err); o.email=e; o.emailVerified=false; persist(o); },
      updateEmail:async e=>{ const r=await rpc('authSetEmail',{uid:o.uid,email:e}); if(r.err) throw err(r.err); o.email=e; persist(o); } };
    return o; }
  const persist=o=>{ if(o) localStorage.setItem(UK,JSON.stringify({uid:o.uid,email:o.email,emailVerified:o.emailVerified})); else localStorage.removeItem(UK); };
  const authObj={ get currentUser(){ return user; },
    onAuthStateChanged:(cb)=>{ user=mkUser(stored()); const t=setTimeout(()=>cb(user),20); return ()=>clearTimeout(t); },
    signInAnonymously:async()=>{ const r=await rpc('authAnon'); user=mkUser(r.user); persist(user); return {user}; },
    createUserWithEmailAndPassword:async(e,p)=>{ const r=await rpc('authCreate',{email:e,pass:p}); if(r.err) throw err(r.err); user=mkUser(r.user); persist(user); return {user}; },
    signInWithEmailAndPassword:async(e,p)=>{ const r=await rpc('authSignIn',{email:e,pass:p}); if(r.err) throw err(r.err); user=mkUser(r.user); persist(user); return {user}; },
    sendPasswordResetEmail:async e=>{ await rpc('authLog',{what:'reset',email:e}); },
    signOut:async()=>{ user=null; persist(null); } };
  function mkSnap(path,v){ if(v===undefined) v=null; return { key:parts(path).pop()||null, val:()=>v, exists:()=>v!==null,
    child:c=>mkSnap(path+'/'+c,(v&&typeof v==='object'&&v[c]!==undefined)?v[c]:null),
    forEach:fn=>{ if(v&&typeof v==='object') Object.keys(v).forEach(k=>fn(mkSnap(path+'/'+k,v[k]))); },
    numChildren:()=>(v&&typeof v==='object')?Object.keys(v).length:0, hasChild:c=>!!(v&&typeof v==='object'&&v[c]!==undefined) }; }
  const listeners=[];
  async function read(path){ const r=await rpc('read',{path}); if(r.err) throw err(r.err,'PERMISSION_DENIED: '+path); return mkSnap(path,r.val); }
  async function write(path,ws,kind){ const r=await rpc('write',{path,writes:ws,kind}); if(r.err) throw err(r.err,'PERMISSION_DENIED: '+path); }
  window.__fbPoke=async()=>{ for(const l of listeners.slice()){ try{ const s=await read(l.path); const j=JSON.stringify(s.val());
      if(j!==l.last && listeners.includes(l)){ l.last=j; l.cb(s); } }catch(e){ if(l.ecb) try{ l.ecb(e); }catch(x){} } } };
  function ref(path){ path=parts(path).join('/');
    const r={ key:parts(path).pop()||null, path, toString:()=>path,
      child:c=>ref(path+'/'+c), once:()=>read(path),
      on:(ev,cb,ecb)=>{ const l={path,cb,ecb,last:undefined}; listeners.push(l);
        read(path).then(s=>{ if(!listeners.includes(l)) return; l.last=JSON.stringify(s.val()); cb(s); }).catch(e=>{ console.warn('fakefb on denied',path); if(ecb) ecb(e); }); return cb; },
      off:()=>{ for(let i=listeners.length-1;i>=0;i--) if(listeners[i].path===path) listeners.splice(i,1); },
      set:v=>write(path,[{path,value:v===undefined?null:v}],'set'),
      update:v=>write(path,Object.keys(v).map(k=>({path:path+'/'+k,value:v[k]===undefined?null:v[k]})),'update'),
      remove:()=>write(path,[{path,value:null}],'remove'),
      push:v=>{ const id='-N'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); const c=ref(path+'/'+id);
        const p=(v!==undefined)?c.set(v):Promise.resolve(); c.then=(a,b)=>p.then(()=>c).then(a,b); c.catch=f=>p.catch(f); return c; },
      transaction:async fn=>{ const cur=(await read(path)).val(); const nv=fn(cur);
        if(nv!==undefined) await write(path,[{path,value:nv}],'transaction'); return {committed:nv!==undefined,snapshot:await read(path)}; },
      onDisconnect:()=>({remove:async()=>{},set:async()=>{},cancel:async()=>{},update:async()=>{}}) };
    return r; }
  const fb={ apps:[], initializeApp(){ this.apps.push({}); } };
  fb.auth=()=>authObj; fb.auth.EmailAuthProvider={ credential:(email,pass)=>({email,pass}) };
  fb.database=()=>({ref, goOffline(){}, goOnline(){}}); fb.database.ServerValue={TIMESTAMP:Date.now()};
  window.firebase=fb;
})();
