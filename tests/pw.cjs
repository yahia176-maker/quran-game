/* Playwright: من المشروع لو متثبت (npm i playwright)، وإلا من مسار بيئة التطوير */
try { module.exports = require('playwright'); }
catch (e) { module.exports = require('/opt/node22/lib/node_modules/playwright'); }
