// Printable report QA: build R.printable for all sections, save, open, screenshot full page
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const file = path.resolve('out/index.html');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.M && M.ready, { timeout: 60000 });
  await p.waitForTimeout(1200);
  const html = await p.evaluate(() => R.printable(['s-map', 's-ov', 's-ph', 's-ec', 's-hz', 's-pj']));
  fs.writeFileSync('out/report-print.html', html);
  console.log('printable bytes', html.length, 'imgs', (html.match(/<img /g) || []).length);
  const q = await b.newPage({ viewport: { width: 1280, height: 900 } });
  q.on('pageerror', e => errs.push('PRINT PAGEERROR: ' + e.message));
  await q.addInitScript(() => { window.print = () => { window.__printed = true; }; });
  await q.goto('file://' + path.resolve('out/report-print.html'));
  await q.waitForTimeout(1500);
  console.log('print called:', await q.evaluate(() => !!window.__printed));
  await q.screenshot({ path: 'shots/06-print-top.png' });
  await q.evaluate(() => window.scrollTo(0, document.getElementById('s-ph').offsetTop));
  await q.screenshot({ path: 'shots/06-print-ph.png' });
  console.log('errors:', errs.length); errs.forEach(e => console.log(' ', e));
  await b.close();
})();
