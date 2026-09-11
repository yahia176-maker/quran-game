/* ============ أداة طوارئ للمالك: تغيير كلمة سر معلم يدويًا ============
   تشتغل على جهازك (مش سيرفر) — لما «نسيت كلمة السر» مش بيوصل للمعلم.

   ⚠️ كلمات السر المخزنة لا يمكن لأحد رؤيتها (مشفرة باتجاه واحد) —
   الأداة دي «بتحدد كلمة جديدة»، مش بتعرض القديمة.

   التحضير (مرة واحدة):
   1. Firebase Console ← ⚙️ Project settings ← Service accounts
      ← Generate new private key ← نزّل الملف (مثلًا key.json)
   2. الملف ده مفتاح المالك الكامل: خليه على جهازك بس —
      ماتحطوش في الريبو ولا تبعته لحد أبدًا.

   الاستخدام (محتاج Node 18 أو أحدث):
      node tools-admin-pass.mjs key.json teacher@gmail.com كلمة_السر_الجديدة

   بعدها ابعت كلمة السر الجديدة للمعلم على واتساب وخلاص.            */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const [keyFile, email, newPass] = process.argv.slice(2);
if (!keyFile || !email || !newPass) {
  console.log('الاستخدام: node tools-admin-pass.mjs key.json teacher@gmail.com كلمة_السر_الجديدة');
  process.exit(1);
}
if (newPass.length < 6) { console.log('❌ كلمة السر لازم ٦ أحرف على الأقل'); process.exit(1); }

let sa;
try { sa = JSON.parse(readFileSync(keyFile, 'utf8')); }
catch (e) { console.log('❌ مش قادر أقرأ ملف المفتاح: ' + keyFile); process.exit(1); }
if (!sa.client_email || !sa.private_key || !sa.project_id) {
  console.log('❌ الملف ده مش مفتاح خدمة سليم — نزّله من Service accounts في إعدادات المشروع');
  process.exit(1);
}

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
    iss: sa.client_email, aud: sa.token_uri,
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
    iat: now, exp: now + 3600
  });
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')
        + '&assertion=' + unsigned + '.' + sig
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('مقدرناش ناخد تصريح من جوجل — اتأكد إن ملف المفتاح سليم ومتولّد من نفس المشروع.\n' + JSON.stringify(j));
  return j.access_token;
}

async function api(tok, method, body) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:${method}`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

let tok;
try { tok = await accessToken(); }
catch (e) { console.log('❌ ' + e.message); process.exit(1); }
const found = await api(tok, 'lookup', { email: [email.trim()] });
if (!found.users || !found.users.length) {
  console.log(`❌ مفيش حساب مسجل بالإيميل: ${email}\n   (يبقى المعلم متسجل بإيميل تاني — شوف القايمة في Authentication → Users)`);
  process.exit(1);
}
const u = found.users[0];
console.log(`✔ لقينا الحساب: ${u.email} (uid: ${u.localId})`);
const upd = await api(tok, 'update', { localId: u.localId, password: newPass });
if (upd.localId) {
  console.log('✅ كلمة السر اتغيرت. ابعتها للمعلم على واتساب ويدخل بيها عادي.');
} else {
  console.log('❌ التغيير فشل:\n' + JSON.stringify(upd, null, 2));
  process.exit(1);
}
