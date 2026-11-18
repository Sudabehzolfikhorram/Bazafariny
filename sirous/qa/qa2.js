// Interaction QA (v2): map, filters from report cards, tips, modals, search, entry flows. node qa2.js [file]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2] || 'out/index.html'), od = 'shots2';
  require('fs').mkdirSync(od, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: +(process.env.VW || 1600), height: +(process.env.VH || 1000) }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/GPU stall|GL Driver|ReadPixels/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 200)); } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + String(e.stack || '').split('\n').slice(1, 3).map(s => s.trim().slice(-60)).join(' / ')));
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.M && M.ready, { timeout: 60000 });
  await p.waitForTimeout(800);
  const sc = async n => p.screenshot({ path: `${od}/${n}.png` });
  const ev = (f, a) => p.evaluate(f, a);
  const scrollTo = id => ev(id => { const v = document.querySelector('.view'); v.style.scrollBehavior = 'auto'; const el = document.getElementById(id); v.scrollTop = el.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - 58; }, id);
  const away = () => p.mouse.move(800, 5);
  await scrollTo('s-map');
  // parcel hover + click → selection outline separate from hover
  const pt = await ev(() => { const f = M.parcels[600]; const q = M.map.project(f.properties.cx); const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left + q.x, y: r.top + q.y }; });
  await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(300); await sc('a-hover');
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(400);
  ok(await ev(() => document.querySelector('.mdet').classList.contains('on')), 'parcel click opens detail');
  await p.mouse.move(pt.x + 300, pt.y + 150); await p.waitForTimeout(200);
  ok(await ev(() => JSON.stringify(M.map.getFilter('p-sel')) !== JSON.stringify(['==', ['get', 'i'], -1])), 'selection outline stays after hover leaves');
  await sc('b-detail');
  // map search closes the detail and flies
  await p.fill('[data-msq]', 'مولوی'); await p.waitForTimeout(200); await sc('c-msearch');
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  ok(await ev(() => !document.querySelector('.mdet').classList.contains('on')), 'map search closes detail');
  // colour mode legend (RTL ramp) + accordion + dual slider
  await p.click('[data-color] [data-c="year"]'); await p.waitForTimeout(300);
  ok(await ev(() => /270deg/.test(document.querySelector('.lgd .ramp').style.background)), 'year legend ramp runs right→left');
  await p.click('.acc:nth-of-type(4) [data-acc]').catch(async () => { await ev(() => document.querySelectorAll('[data-acc]')[3].click()); });
  await p.waitForTimeout(200);
  await ev(() => { const a = document.querySelector('[data-dual="fl"] input'); a.value = 3; a.dispatchEvent(new Event('input', { bubbles: true })); });
  ok(await ev(() => M.st.fl[0] === 3 && document.querySelector('[data-flsum]').textContent === 'فعال'), 'floor slider filters and marks the group active');
  await sc('d-year-acc');
  await p.click('[data-reset]'); await p.waitForTimeout(300);
  ok(await ev(() => M.st.fl[0] === 1 && M.st.color === 'cond'), 'reset clears filters');
  // hazard row in report → map shows only that hazard; legend clear chip
  await scrollTo('s-hz'); await p.click('[data-hz="fault"]'); await p.waitForTimeout(900);
  ok(await ev(() => M.st.hazK === 'fault' && JSON.stringify(M.map.getFilter('haz-f')).includes('fault')), 'hazard row filters the map layer');
  await away(); await sc('e-haz-fault');
  await ev(() => document.querySelector('.lgd [data-hzclr]').click()); await p.waitForTimeout(200);
  ok(await ev(() => M.st.hazK === null && M.map.getFilter('haz-f') == null), 'legend clear shows all hazards');
  // service category chip → map filter + legend chip
  await scrollTo('s-ov'); await ev(() => document.querySelector('[data-cat="آموزشی"]').click()); await p.waitForTimeout(900);
  ok(await ev(() => M.st.poiCat === 'آموزشی' && JSON.stringify(M.map.getFilter('poi-i')).includes('آموزشی')), 'service chip filters map POIs');
  await away(); await sc('f-poi-edu');
  await ev(() => document.querySelector('.lgd [data-poiclr]').click()); await p.waitForTimeout(200);
  ok(await ev(() => M.st.poiCat === ''), 'legend clear shows all services');
  // condition legend item from the report card
  await scrollTo('s-ph'); await ev(() => document.querySelector('[data-cf="ruin"]').click()); await p.waitForTimeout(300);
  ok(await ev(() => M.st.cond.size === 1 && M.st.cond.has('ruin') && document.querySelector('[data-cf="new"]').classList.contains('off')), 'condition button filters map and dims others');
  await ev(() => document.querySelector('[data-all="cond"]').click());
  // 3D future + atlas leaf controls
  await scrollTo('s-map');
  await p.click('.vsw [data-v="3d"]'); await p.waitForTimeout(900);
  await ev(() => M.setYear(1409)); await p.waitForTimeout(700); await sc('g-3d-1409');
  await p.click('.vsw [data-v="atlas"]'); await p.waitForTimeout(700);
  ok(await ev(() => document.getElementById('mapcard').classList.contains('atl')), 'atlas view dims the parcel filters');
  await p.click('.atlas [data-sirous]'); await p.waitForTimeout(900);
  ok(await ev(() => document.querySelector('.atlas [data-size="hoods"]').disabled && document.querySelector('.atlas [data-sirous]').hidden), 'neighbourhood level disables «تعداد محله» and hides the shortcut');
  await sc('h-atlas-r12');
  await p.click('.vsw [data-v="map"]'); await p.waitForTimeout(700);
  // info tip: hover shows, click pins, Escape hides
  const inf = await ev(() => { const e = document.querySelector('.kpis .inf'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await ev(() => { const v = document.querySelector('.view'); v.scrollTop = 0; }); await p.waitForTimeout(200);
  const inf2 = await ev(() => { const e = document.querySelector('.kpis .inf'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(inf2.x, inf2.y); await p.waitForTimeout(250);
  ok(await ev(() => document.querySelector('.tipx').classList.contains('on')), 'info tip shows on hover');
  await sc('i-tip-hover');
  await p.mouse.click(inf2.x, inf2.y); await p.mouse.move(inf2.x + 200, inf2.y + 300); await p.waitForTimeout(200);
  ok(await ev(() => document.querySelector('.tipx').classList.contains('on')), 'info tip stays pinned after click');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await ev(() => !document.querySelector('.tipx').classList.contains('on')), 'Escape hides pinned tip');
  // global search: KPI result flashes the card
  await p.fill('[data-gq]', 'ساکنین'); await p.waitForTimeout(300); await sc('j-gsearch');
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok(await ev(() => !!document.querySelector('.kp.flash')), 'KPI search result flashes the KPI');
  // fullscreen
  await p.click('[data-fs]'); await p.waitForTimeout(600); await sc('k-fullscreen');
  ok(await ev(() => document.getElementById('mapcard').classList.contains('fs') && !!document.querySelector('[data-fsx]')), 'fullscreen opens with a close button');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await ev(() => !document.getElementById('mapcard').classList.contains('fs')), 'Escape leaves fullscreen');
  // report modal → CSV
  await ev(() => document.querySelector('[data-rep]').click()); await p.waitForTimeout(300); await sc('l-report-modal');
  await ev(() => document.querySelector('.modal [data-fmt="csv"]').click());
  const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await ev(() => document.querySelector('.modal [data-mok]').click());
  const d = await dl; ok(!!d && d.suggestedFilename() === 'sirous-report.csv', 'report modal downloads CSV');
  ok(await ev(() => !document.querySelector('.modal').classList.contains('on')), 'report modal closes after generating');
  // share modal
  await ev(() => document.querySelector('[data-share]').click()); await p.waitForTimeout(250); await sc('m-share');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await ev(() => !document.querySelector('.modal').classList.contains('on')), 'Escape closes the share modal');
  // project gantt
  await scrollTo('s-pj'); await p.click('[data-pv] [data-v="g"]'); await p.waitForTimeout(300); await sc('n-gantt');
  await ev(() => document.querySelector('[data-ax="a1"]').click()); await p.waitForTimeout(300);
  ok(await ev(() => document.querySelector('[data-axf] .on').dataset.a === 'a1'), 'priority row filters projects by axis');
  // wheel over map scrolls page (cooperative gestures)
  await scrollTo('s-map'); const y0 = await ev(() => document.querySelector('.view').scrollTop);
  const r = await ev(() => { const b = document.getElementById('map').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 200 }; });
  await p.mouse.move(r.x, r.y); await p.mouse.wheel(0, 400); await p.waitForTimeout(600);
  const y1 = await ev(() => document.querySelector('.view').scrollTop);
  ok(y1 > y0, 'wheel over map scrolls the page');
  // sidebar pin
  await ev(() => document.querySelector('[data-pin]').click()); await p.waitForTimeout(350);
  ok(await ev(() => document.querySelector('.app').classList.contains('pinned') && document.querySelector('.sbi').offsetWidth === 248), 'pin keeps the menu open');
  await away(); await sc('o-pinned');
  await ev(() => document.querySelector('[data-pin]').click()); await p.waitForTimeout(350);
  // entry: bell → pending filter; bulk confirm
  const pend0 = await ev(() => E.pending());
  await p.click('[data-bell]'); await p.waitForTimeout(400);
  ok(await ev(() => !document.querySelector('[data-page="entry"]').hidden && document.querySelector('#t-entry [data-f="status"]').value === 'در انتظار بازبینی'), 'bell opens entry filtered to pending');
  await away(); await sc('p-pending');
  await ev(() => document.querySelector('[data-stf] [data-s="0"]').click()); await p.waitForTimeout(200);
  await ev(() => document.querySelector('[data-bulk]').click()); await p.waitForTimeout(200);
  await ev(() => document.querySelector('.modal [data-mok]').click()); await p.waitForTimeout(200);
  const pend1 = await ev(() => E.pending());
  ok(pend1 < pend0 && (await ev(() => document.querySelector('[data-pbadge]').textContent)) !== '', `bulk confirm lowers pending (${pend0} → ${pend1}) and the badge follows`);
  // entry form: validation, persistence, cancel confirm, submit
  await ev(() => document.querySelector('[data-page="entry"] [data-m="form"]').click()); await p.waitForTimeout(200);
  await ev(() => document.querySelector('.steps [data-step="1"]').click()); await p.waitForTimeout(200);
  const k1 = '1:تعداد ساکنین';
  await ev(k => { const i = [...document.querySelectorAll('[data-k]')].find(x => x.dataset.k === k); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, k1);
  await ev(k => { const i = [...document.querySelectorAll('[data-k]')].find(x => x.dataset.k === '1:سرانه طرح تفصیلی'); i.value = 'abc'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await ev(() => document.querySelector('[data-next]').click()); await p.waitForTimeout(500);
  ok(await ev(() => document.querySelectorAll('.fld.err').length === 2 && document.querySelector('.stp2.cur').dataset.step === '1'), 'next step blocked by required + numeric errors');
  await sc('q-validation');
  await ev(k => { const i = [...document.querySelectorAll('[data-k]')].find(x => x.dataset.k === k); i.value = '۴۴۰۰'; i.dispatchEvent(new Event('input', { bubbles: true })); }, k1);
  await ev(() => { const i = [...document.querySelectorAll('[data-k]')].find(x => x.dataset.k === '1:سرانه طرح تفصیلی'); i.value = '6600'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await ev(() => document.querySelector('[data-next]').click()); await p.waitForTimeout(300);
  ok(await ev(() => document.querySelector('.stp2.cur').dataset.step === '2'), 'valid values move to the next step');
  await ev(() => document.querySelector('.steps [data-step="1"]').click()); await p.waitForTimeout(200);
  ok(await ev(k => [...document.querySelectorAll('[data-k]')].find(x => x.dataset.k === k).value === '۴۴۰۰', k1), 'typed value persists across steps');
  await ev(() => document.querySelector('[data-page="entry"] .ffoot [data-cancel]').click()); await p.waitForTimeout(200);
  ok(await ev(() => document.querySelector('.modal').classList.contains('on')), 'cancel with unsaved changes asks for confirmation');
  await sc('r-cancel-confirm');
  await ev(() => document.querySelector('.modal [data-mx]').click()); await p.waitForTimeout(150);
  await ev(() => document.querySelector('.steps [data-step="5"]').click()); await p.waitForTimeout(200);
  await ev(() => document.querySelector('[data-next]').click()); await p.waitForTimeout(200);
  ok(await ev(() => document.querySelector('[data-confirm]').classList.contains('err')), 'submit without the confirm box is blocked');
  await ev(() => document.querySelector('[data-confirm]').click());
  await ev(() => document.querySelector('[data-next]').click()); await p.waitForTimeout(300);
  ok(await ev(() => { const t = [...document.querySelectorAll('#t-entry tbody tr')].find(tr => tr.textContent.includes('تعداد ساکنین')); return !!t && (t.textContent.includes('۴٬۴۰۰') || t.textContent.includes('۴۴۰۰')); }), 'submitted value shows in the table');
  await sc('s-after-submit');
  // excel modal + template
  await ev(() => document.querySelector('[data-imp]').click()); await p.waitForTimeout(200); await sc('t-import');
  const dl2 = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await ev(() => document.querySelector('.modal [data-tpl]').click());
  const d2 = await dl2; ok(!!d2, 'template CSV downloads');
  await p.keyboard.press('Escape');
  console.log('fails:', fails.length); fails.forEach(f => console.log('  -', f));
  console.log('errors:', errs.length); errs.slice(0, 20).forEach(e => console.log(' ', e));
  await b.close();
})();
