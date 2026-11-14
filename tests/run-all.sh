#!/bin/bash
# يشغّل كل الاختبارات ويطبع ملخّص. لازم خادم محلي شغال على المنفذ 8765 من فولدر المشروع.
cd "$(dirname "$0")" || exit 1
BASE="${BASE_URL:-http://127.0.0.1:8765}"
if ! curl -s -o /dev/null "$BASE/quran-game.html"; then
  echo "شغّل الخادم الأول:  python3 -m http.server 8765 --bind 127.0.0.1   (من فولدر المشروع)"; exit 1
fi
OUT="$(mktemp)"
run() { echo "=== $1" | tee -a "$OUT"; shift; timeout 600 "$@" 2>&1 | grep -E '^(✅|❌|ERRS|DENIED|CRASH)|NOT FIT|broken|errs' | tee -a "$OUT"; }
run "رابط الحلقة بجهازين"        node e2e1.cjs
run "مسابقة كاملة"               node e2e2.cjs
run "إدارة الطلاب وجهاز تاني"    node e2e3.cjs
run "أنواع اللعب"                node modes.cjs
run "لاعب آلي"                   node play1.cjs '[["سورة",["#mPick","#pS","[data-s=\"114\"]"],320],["جلسة-ذكية",["js:startSmart()"],320],["تحدي-اليوم",["js:startDaily()"],200],["سباق",["#mRace"],420],["جزء",["#mPick","#pJ"],320]]'
run "لوحة المعلم صفحة واحدة"     node thome.cjs
run "كارت المعلم عند المالك"     node owner-photo.cjs
run "شاشة البداية ٩ مقاسات"      node fit.cjs
run "بدون نت"                    node sw-test.cjs
echo
echo "نجح: $(grep -c '^✅' "$OUT")   فشل: $(grep -c '^❌' "$OUT")   أعطال تشغيل: $(grep -c 'CRASH' "$OUT")"
