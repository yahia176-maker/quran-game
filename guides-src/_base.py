# -*- coding: utf-8 -*-
"""قالب مشترك لكل الأدلة — ستايل واحد، طباعة A4 نظيفة."""

URL = 'https://yahia176-maker.github.io/quran-game/'

CSS = """
@page{size:A4;margin:15mm 14mm}
*{box-sizing:border-box}
:root{--ink:#2b3d34;--muted:#5c7265;--gold:#8a6d24;--gold2:#bb9a55;--ok:#4a8168;
  --info:#3f7a9e;--line:rgba(138,109,36,.28);--card:#fbfcfa;--bg:#f7faf6}
html,body{margin:0;padding:0}
body{font-family:'Tajawal','Segoe UI','Noto Kufi Arabic',sans-serif;color:var(--ink);
  background:#fff;line-height:1.75;font-size:11.5pt}
.wrap{max-width:190mm;margin:0 auto;padding:0}
h1{font-size:23pt;color:var(--gold);margin:0 0 2px;line-height:1.25}
h2{font-size:15pt;color:var(--gold);margin:20px 0 8px;padding-bottom:5px;
  border-bottom:2.5px solid var(--line);page-break-after:avoid}
h3{font-size:12.5pt;margin:14px 0 5px;color:var(--ink);page-break-after:avoid}
p{margin:0 0 8px}
ul,ol{margin:0 0 10px;padding-right:20px}
li{margin-bottom:5px}
.lead{font-size:12pt;color:var(--muted);margin:0 0 14px}
.cover{text-align:center;padding:14px 0 18px;border-bottom:3px solid var(--gold2);margin-bottom:18px}
.cover .em{font-size:44pt;line-height:1}
.box{background:var(--card);border:1.5px solid var(--line);border-radius:12px;
  padding:11px 14px;margin:10px 0;page-break-inside:avoid}
.tip{background:rgba(74,129,104,.09);border-right:4px solid var(--ok)}
.warn{background:rgba(168,95,86,.09);border-right:4px solid #a85f56}
.note{background:rgba(63,122,158,.09);border-right:4px solid var(--info)}
.box b:first-child{color:var(--gold)}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10.5pt;page-break-inside:avoid}
th,td{border:1px solid var(--line);padding:7px 9px;text-align:right;vertical-align:top}
th{background:rgba(138,109,36,.10);font-weight:700;color:var(--gold)}
.step{display:flex;gap:11px;align-items:flex-start;margin-bottom:10px;page-break-inside:avoid}
.step .num{flex:none;width:27px;height:27px;border-radius:50%;background:var(--gold);color:#fffdf6;
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11pt}
.step .txt{flex:1}
.step .txt b{display:block;margin-bottom:1px}
.chips{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}
.chip{border:1.5px solid var(--line);border-radius:20px;padding:3px 11px;font-size:10pt;background:var(--card)}
.legend{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0}
.legend span{display:inline-flex;align-items:center;gap:6px;font-size:10.5pt}
.sw{width:15px;height:15px;border-radius:5px;display:inline-block;border:1px solid rgba(0,0,0,.14)}
.foot{margin-top:22px;padding-top:9px;border-top:1.5px solid var(--line);
  font-size:9.5pt;color:var(--muted);display:flex;justify-content:space-between;gap:10px}
.url{direction:ltr;display:inline-block;color:var(--gold);font-weight:700}
.pb{page-break-before:always}
.noprint{margin:14px 0;text-align:center}
.noprint button{font:inherit;font-weight:700;background:linear-gradient(180deg,var(--gold),var(--gold2));
  color:#fffdf6;border:none;border-radius:12px;padding:11px 26px;cursor:pointer;box-shadow:0 4px 0 #6f5a1d}
@media print{ .noprint{display:none!important} body{font-size:11pt} }
@media screen{ body{background:var(--bg);padding:22px 14px}
  .wrap{background:#fff;padding:26px 24px;border-radius:16px;box-shadow:0 8px 30px rgba(50,70,58,.12)} }
"""

HEAD = """<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">
<style>{css}</style>
</head>
<body><div class="wrap">
<div class="noprint"><button onclick="window.print()">🖨️ احفظ الدليل PDF أو اطبعه</button></div>
"""

FOOT = """
<div class="foot">
  <span>رحلة القرآن — <span class="url">{url}</span></span>
  <span>{who}</span>
</div>
</div></body></html>
"""


def page(title, who, body):
    return (HEAD.format(title=title, css=CSS) + body + FOOT.format(url=URL, who=who))
