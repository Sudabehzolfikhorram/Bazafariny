/* Shell: sidebar (only «محله‌ها» with its two sub-pages), top bar with global search, routing */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M, R = window.R, E = window.E;
  const ic = U.ic;
  const APP = window.APP = {};
  document.documentElement.lang = 'fa'; document.documentElement.dir = 'rtl';
  const shell = `<div class="app">
    <aside class="sb"><div class="brand"><span class="lg">${ic('hood', 's')}</span><div><b>بازآفرینی‌یار</b><small>سامانه‌ی بازآفرینی شهری</small></div></div>
      <nav class="nav"><div class="cap">مدیریت محدوده‌ها</div>
        <div class="ng open" data-ng><button class="nb" data-tog>${ic('hood', 's')}محله‌ها${ic('chev', 's chev')}</button>
          <div class="sub"><button class="si" data-go="entry">${ic('entry', 's')}ورود داده<span class="bd">۱</span></button><button class="si" data-go="reports">${ic('report', 's')}گزارش‌ها</button></div></div>
      </nav>
      <div class="sbf"><div class="me"><span class="av">س‌ا</span><div><b>سوپر ادمین</b><small>مدیر سیستم</small></div></div></div></aside>
    <div class="main"><header class="tb"><div class="crumb" data-crumb></div>
      <div class="gs">${ic('search', 's')}<input placeholder="جستجو در محله: معبر، خدمات، شاخص، پروژه…" data-gq><kbd>Ctrl K</kbd><div class="gsr" data-gr></div></div>
      <span class="date">${ic('cal', 's')}${S.updated}</span><button class="tbi" title="اعلان‌ها" data-bell>${ic('bell', 's')}<span class="dot"></span></button></header>
      <div class="view" data-view><div data-page="reports"></div><div data-page="entry" hidden></div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', shell);

  let cur = null, mapReady = false;
  APP.go = function (page) {
    if (page !== 'entry' && page !== 'reports') page = 'reports';
    if (cur === page) return;
    cur = page;
    U.$$('[data-page]').forEach(p => { p.hidden = p.dataset.page !== page; });
    U.$$('.si[data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === page));
    U.$('[data-crumb]').innerHTML = `محله‌ها ${ic('chevl', 'xs')} <b>${page === 'entry' ? 'ورود داده' : 'گزارش‌ها'}</b> ${ic('chevl', 'xs')} محله سیروس`;
    U.$('[data-view]').scrollTop = 0;
    try { history.replaceState(null, '', '#' + page); } catch (e) { }
    if (page === 'reports' && mapReady) requestAnimationFrame(() => { M.map.resize(); U.charts.forEach(c => c.resize()); });
    if (page === 'entry') requestAnimationFrame(() => U.charts.forEach(c => c.resize()));
  };

  // render both pages up-front so switching is instant
  R.render(U.$('[data-page="reports"]'));
  E.render(U.$('[data-page="entry"]'));
  M.init(U.$('#map'), () => { mapReady = true; M.atlas.init(U.$('#atlas')); R.syncPanel(); });
  let start = 'reports'; try { const h = location.hash.slice(1); if (h === 'entry') start = 'entry'; } catch (e) { }
  APP.go(start);

  document.body.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { APP.go(g.dataset.go); return; }
    if (e.target.closest('[data-tog]')) { U.$('[data-ng]').classList.toggle('open'); return; }
    if (e.target.closest('[data-bell]')) { U.toast('۳ فیلد محله سیروس در انتظار بازبینی است', 'bell'); }
  });

  /* ---------- global search ---------- */
  const idx = [];
  R.SECS.forEach(([id, t, i]) => idx.push({ g: 'بخش‌های گزارش', t, s: 'گزارش‌ها', i, run: () => { APP.go('reports'); setTimeout(() => R.jump(id), 30); } }));
  S.kpi.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.v) + ' ' + k.u, i: k.ic, run: () => { APP.go('reports'); } }));
  S.percap.forEach(k => idx.push({ g: 'شاخص‌ها', t: 'سرانه ' + k.t, s: U.fa(k.v, 2) + ' مترمربع', i: 'target', run: () => { APP.go('reports'); setTimeout(() => R.jump('s-pc'), 30); } }));
  S.hazards.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.pct) + '٪ مساحت', i: 'warn', run: () => { APP.go('reports'); setTimeout(() => R.jump('s-hz'), 30); } }));
  S.informal.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.v, 1) + ' ' + k.u, i: k.ic, run: () => { APP.go('reports'); setTimeout(() => R.jump('s-ec'), 30); } }));
  S.projects.forEach(p => idx.push({ g: 'پروژه‌ها', t: p.t, s: p.st, i: 'cal', run: () => { APP.go('reports'); setTimeout(() => { R.jump('s-pj'); const q = U.$('#t-pj [data-q]'); if (q) { q.value = p.t; q.dispatchEvent(new Event('input', { bubbles: true })); } }, 30); } }));
  S.form.steps.forEach((s, i) => idx.push({ g: 'ورود داده', t: 'مرحله ' + M.toFa(i + 1) + ': ' + s, s: 'فرم محله', i: 'edit', run: () => { APP.go('entry'); setTimeout(() => { const b = U.$(`[data-page="entry"] [data-step="${i}"]`); if (b) b.click(); else { U.$('[data-page="entry"] [data-m="form"]').click(); U.$(`[data-page="entry"] [data-step="${i}"]`).click(); } }, 30); } }));
  let mapIdx = null;
  const gq = U.$('[data-gq]'), gr = U.$('[data-gr]');
  let act = 0, res = [];
  function draw() {
    const q = U.norm(gq.value); if (!q) { gr.classList.remove('on'); return; }
    if (!mapIdx && M.ready) mapIdx = M.index().map(x => ({ g: 'روی نقشه', t: x.t, s: x.s, i: x.k === 'road' ? 'road' : x.k === 'lm' ? 'star' : 'pin', run: () => { APP.go('reports'); setTimeout(() => { R.jump('s-map'); setTimeout(() => x.k === 'poi' ? M.flyPoi(x.i) : M.flyTo(x.c, x.k === 'road' ? 17.6 : 18), 350); }, 30); } }));
    res = idx.concat(mapIdx || []).filter(x => U.norm(x.t).includes(q) || U.norm(x.s).includes(q)).slice(0, 14); act = 0;
    if (!res.length) { gr.innerHTML = '<div class="emp">نتیجه‌ای پیدا نشد</div>'; gr.classList.add('on'); return; }
    let h = '', last = '';
    res.forEach((x, n) => { if (x.g !== last) { h += `<div class="grp">${x.g}</div>`; last = x.g; } h += `<button data-n="${n}" class="${n ? '' : 'act'}">${ic(x.i || 'search', 's')}<span>${U.hl(x.t, gq.value)}</span><small>${U.esc(x.s)}</small></button>`; });
    gr.innerHTML = h; gr.classList.add('on');
  }
  const run = x => { gr.classList.remove('on'); gq.blur(); x.run(); };
  gq.addEventListener('input', draw); gq.addEventListener('focus', draw);
  gq.addEventListener('keydown', e => { if (e.key === 'Escape') { gr.classList.remove('on'); gq.blur(); } if (!res.length) return; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { act = (act + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; U.$$('button', gr).forEach((b, i) => b.classList.toggle('act', i === act)); e.preventDefault(); } if (e.key === 'Enter') run(res[act]); });
  gr.addEventListener('mousedown', e => { const b = e.target.closest('[data-n]'); if (b) { e.preventDefault(); run(res[+b.dataset.n]); } });
  gq.addEventListener('blur', () => setTimeout(() => gr.classList.remove('on'), 120));
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); gq.focus(); gq.select(); } });
})();
