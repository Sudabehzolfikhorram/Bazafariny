// QA: load page, collect errors, screenshot each view and section.  node qa.js [file] [outdir]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2] || 'out/index.html'), od = process.argv[3] || 'shots';
  require('fs').mkdirSync(od, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +(process.env.VW || 1600), height: +(process.env.VH || 1000) } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/GPU stall|GL Driver|ReadPixels/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 300)); } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + String(e.stack || '').split('\n').slice(1, 4).map(s => s.trim().slice(-90)).join(' / ')));
  const t0 = Date.now();
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.M && M.ready, { timeout: 60000 }).catch(() => errs.push('map not ready'));
  await p.waitForTimeout(1500);
  console.log('ready ms', Date.now() - t0);
  const shot = async n => p.screenshot({ path: `${od}/${n}.png` });
  await shot('01-top');
  const steps = process.argv[4] ? process.argv[4].split(',') : ['views', 'sections', 'entry'];
  if (steps.includes('views')) {
    for (const v of ['sat', '3d', 'atlas', 'map']) {
      await p.click(`.vsw [data-v="${v}"]`); await p.waitForTimeout(v === '3d' ? 1400 : 900);
      await p.evaluate(() => document.querySelector('#s-map').scrollIntoView());
      await p.waitForTimeout(300); await shot('02-view-' + v);
    }
  }
  if (steps.includes('sections')) {
    for (const id of ['s-ov', 's-pc', 's-ph', 's-ec', 's-hz', 's-pj', 's-rp']) {
      await p.evaluate(id => { const v = document.querySelector('.view'); v.style.scrollBehavior = 'auto'; v.scrollTop = document.getElementById(id).offsetTop - 8; }, id);
      await p.waitForTimeout(500); await shot('03-' + id);
    }
  }
  if (steps.includes('entry')) {
    await p.click('.si[data-go="entry"]'); await p.waitForTimeout(500); await shot('04-entry-table');
    await p.click('[data-page="entry"] [data-m="form"]'); await p.waitForTimeout(300); await shot('05-form-0');
    for (const s of [1, 2, 3, 4, 5]) { await p.click(`[data-page="entry"] .stp2[data-step="${s}"]`); await p.waitForTimeout(250); await p.evaluate(() => { const v = document.querySelector('.view'); v.style.scrollBehavior = 'auto'; v.scrollTop = document.querySelector('#fcard').offsetTop - 70; }); await shot('05-form-' + s); }
  }
  console.log('errors:', errs.length); errs.slice(0, 30).forEach(e => console.log(' ', e));
  await b.close();
})();
