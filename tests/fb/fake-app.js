(function(){
  const KEY='__fakefb';
  const load=()=>{ try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};} };
  const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const parts=p=>p.split('/').filter(Boolean);
  const get=(d,path)=>parts(path).reduce((o,k)=>(o&&typeof o==='object')?o[k]:undefined,d);
  function setAt(d,path,v){ const ps=parts(path); let o=d;
    for(let i=0;i<ps.length-1;i++){ if(typeof o[ps[i]]!=='object'||o[ps[i]]===null) o[ps[i]]={}; o=o[ps[i]]; }
    if(v===null||v===undefined) delete o[ps[ps.length-1]]; else o[ps[ps.length-1]]=JSON.parse(JSON.stringify(v)); }
  window.__fbLog=[];
  const listeners=[];
  function mkSnap(path,v){ if(v===undefined) v=null; return { key:parts(path).pop()||null, val:()=>v, exists:()=>v!==null,
    child:c=>mkSnap(path+'/'+c,(v&&typeof v==='object'&&v[c]!==undefined)?v[c]:null),
    forEach:fn=>{ if(v&&typeof v==='object') Object.keys(v).forEach(k=>fn(mkSnap(path+'/'+k,v[k]))); },
    numChildren:()=>(v&&typeof v==='object')?Object.keys(v).length:0, hasChild:c=>!!(v&&typeof v==='object'&&v[c]!==undefined) }; }
  const snap=path=>mkSnap(path,get(load(),path));
  function notify(){ listeners.slice().forEach(l=>{ try{ l.cb(snap(l.path)); }catch(e){ console.error('listener',e); } }); }
  function ref(path){ path=parts(path||'').join('/');
    const r={ key:parts(path).pop()||null, path,
      child:c=>ref(path+'/'+c), once:async()=>snap(path),
      on:(ev,cb)=>{ listeners.push({path,cb}); setTimeout(()=>{ try{cb(snap(path));}catch(e){console.error(e);} },0); return cb; },
      off:()=>{ for(let i=listeners.length-1;i>=0;i--) if(listeners[i].path===path) listeners.splice(i,1); },
      set:async v=>{ const d=load(); setAt(d,path,v); save(d); __fbLog.push('set '+path); notify(); },
      update:async v=>{ const d=load(); Object.keys(v).forEach(k=>setAt(d,path+'/'+k,v[k])); save(d); __fbLog.push('update '+path); notify(); },
      remove:async()=>{ const d=load(); setAt(d,path,null); save(d); __fbLog.push('remove '+path); notify(); },
      push:v=>{ const id='-K'+Date.now()+Math.random().toString(36).slice(2,6); const c=ref(path+'/'+id);
        const p=(v!==undefined)?c.set(v):Promise.resolve(); c.then=(a,b)=>p.then(()=>undefined).then(a,b); c.catch=f=>p.catch(f); return c; },
      transaction:async fn=>{ const cur=get(load(),path); const nv=fn(cur===undefined?null:cur);
        if(nv!==undefined){ const d=load(); setAt(d,path,nv); save(d); notify(); } return {committed:nv!==undefined,snapshot:snap(path)}; },
      onDisconnect:()=>({remove:async()=>{},set:async()=>{},cancel:async()=>{},update:async()=>{}}) };
    ['orderByChild','orderByKey','orderByValue','equalTo','limitToLast','limitToFirst','startAt','endAt'].forEach(m=>r[m]=()=>r);
    return r; }
  let user=null;
  const mkUser=uid=>({uid,isAnonymous:true,email:null,emailVerified:false,reload:async()=>{},getIdToken:async()=>'x',sendEmailVerification:async()=>{}});
  const authObj={ get currentUser(){return user;},
    onAuthStateChanged:(cb)=>{ const u=localStorage.getItem('__fakeuid'); user=u?mkUser(u):null; const t=setTimeout(()=>cb(user),30); return ()=>clearTimeout(t); },
    signInAnonymously:async()=>{ const uid='anon'+Math.random().toString(36).slice(2,10); localStorage.setItem('__fakeuid',uid); user=mkUser(uid); return {user}; },
    signOut:async()=>{ user=null; localStorage.removeItem('__fakeuid'); } };
  const fb={ apps:[], initializeApp(){ this.apps.push({}); } };
  fb.auth=()=>authObj; fb.database=()=>({ref}); fb.database.ServerValue={TIMESTAMP:Date.now()};
  window.firebase=fb;
})();
