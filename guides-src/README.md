# مصادر الأدلة

الأدلة كلها بتتولّد من الملفات دي — عدّل هنا مش في الـ HTML.

| الملف | بيولّد |
|---|---|
| `_base.py` | التنسيق المشترك (ألوان، طباعة A4، الخط) |
| `g_child.py` | دليل-الطفل.html → guide-child.html |
| `g_teacher.py` | دليل-المعلم.html → guide.html + ابدأ-في-دقيقة.html → guide-quick.html |
| `g_owner.py` | دليل-المالك.html → guide-owner.html |
| `g_story.py` | سجل-المشروع.html → story.html |

## التوليد

```bash
python g_child.py && python g_teacher.py && python g_owner.py && python g_story.py
```

## تحويل PDF

```bash
chrome.exe --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="<مسار مطلق>/الملف.pdf" "file:///<مسار مطلق>/الملف.html"
```

مسار الإخراج **لازم يكون مطلق** وإلا Chrome بيرفض. و`virtual-time-budget`
هو اللي بيخلي خط Tajawal يتحمّل قبل الطباعة.

## قاعدة

**أي تعديل في اللعبة → حدّث `g_story.py` (وغيّر `UPDATED`) + الدليل المتأثر.**
