// Interaction QA: parcel click, map search, layers, colour modes, 3D future year, atlas drill, global search, report gen
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2] || 'out/index.html'), od = 'shots2';
  require('fs').mkdirSync(od, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/GPU stall|GL Driver|ReadPixels/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 200)); } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + String(e.stack || '').split('\n').slice(1, 3).map(s => s.trim().slice(-60)).join(' / ')));
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.M && M.ready, { timeout: 60000 });
  await p.waitForTimeout(800);
  const sc = async n => p.screenshot({ path: `${od}/${n}.png` });
  const toMap = () => p.evaluate(() => { const v = document.querySelector('.view'); v.style.scrollBehavior = 'auto'; v.scrollTop = document.getElementById('s-map').offsetTop - 8; });
  await toMap();
  // parcel click at a parcel's centroid
  const pt = await p.evaluate(() => { const f = M.parcels[600]; const q = M.map.project(f.properties.cx); const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left + q.x, y: r.top + q.y }; });
  await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(300); await sc('a-hover');
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(400); await sc('b-detail');
  // map search
  await p.fill('[data-msq]', 'مولوی'); await p.waitForTimeout(200); await sc('c-msearch');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  // colour mode + layers
  await p.click('[data-color] [data-c="year"]'); await p.click('[data-lyr="haz"]'); await p.click('[data-lyr="narrow"]'); await p.waitForTimeout(600); await sc('d-year-haz');
  await p.click('[data-z="home"]'); await p.waitForTimeout(800);
  await p.click('[data-color] [data-c="use"]'); await p.waitForTimeout(400); await sc('e-use');
  await p.click('[data-lyr="haz"]'); await p.click('[data-lyr="narrow"]'); await p.click('[data-color] [data-c="cond"]');
  // 3D future
  await p.click('.vsw [data-v="3d"]'); await p.waitForTimeout(900);
  await p.evaluate(() => M.setYear(1409)); await p.waitForTimeout(700); await sc('f-3d-1409');
  await p.evaluate(() => M.setYear(1350)); await p.waitForTimeout(700); await sc('g-3d-1350');
  // atlas drill
  await p.click('.vsw [data-v="atlas"]'); await p.waitForTimeout(700);
  await p.click('.atlas [data-sirous]'); await p.waitForTimeout(900); await sc('h-atlas-r12');
  await p.click('.vsw [data-v="map"]'); await p.waitForTimeout(700);
  // global search
  await p.fill('[data-gq]', 'سرانه'); await p.waitForTimeout(300); await sc('i-gsearch');
  await p.keyboard.press('Escape');
  // fullscreen
  await p.click('[data-fs]'); await p.waitForTimeout(600); await sc('j-fullscreen'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // CSV gen
  await p.evaluate(() => { document.querySelector('[data-fmt="csv"]').click(); });
  const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await p.evaluate(() => document.querySelector('[data-gen]').click());
  const d = await dl; console.log('download:', d ? d.suggestedFilename() : 'none');
  // project gantt
  await p.evaluate(() => { const v = document.querySelector('.view'); v.scrollTop = document.getElementById('s-pj').offsetTop - 8; });
  await p.click('[data-pv] [data-v="g"]'); await p.waitForTimeout(300); await sc('k-gantt');
  // scroll test: wheel over map should scroll page (cooperative gestures)
  await toMap(); const y0 = await p.evaluate(() => document.querySelector('.view').scrollTop);
  const r = await p.evaluate(() => { const b = document.getElementById('map').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 200 }; });
  await p.mouse.move(r.x, r.y); await p.mouse.wheel(0, 400); await p.waitForTimeout(600);
  const y1 = await p.evaluate(() => document.querySelector('.view').scrollTop);
  console.log('wheel over map scrolls page:', y1 > y0, y0, y1);
  console.log('errors:', errs.length); errs.slice(0, 20).forEach(e => console.log(' ', e));
  await b.close();
})();
