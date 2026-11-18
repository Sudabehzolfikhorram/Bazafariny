/* Shell: collapsible sidebar rail (only «محله‌ها» with its two sub-pages), top bar with global search, routing */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M, R = window.R, E = window.E;
  const ic = U.ic;
  const APP = window.APP = {};
  document.documentElement.lang = 'fa'; document.documentElement.dir = 'rtl';
  let pinned = false; try { pinned = localStorage.getItem('sirous.pin') === '1'; } catch (e) { }
  const shell = `<div class="app ${pinned ? 'pinned' : ''}">
    <aside class="sb" aria-label="منوی اصلی"><div class="sbi">
      <div class="brand"><span class="lg">${ic('hood', 's')}</span><div class="lb"><b>بازآفرینی‌یار</b><small>سامانه‌ی بازآفرینی شهری</small></div><button class="pin lb" data-pin aria-pressed="${pinned}" data-tt="${pinned ? 'جمع کردن منو' : 'ثابت نگه داشتن منو'}">${ic(pinned ? 'chevr' : 'chevl', 's')}</button></div>
      <nav class="nav"><div class="cap lb">مدیریت محدوده‌ها</div>
        <div class="ng open" data-ng><button class="nb" data-tog aria-expanded="true">${ic('hood', 's')}<span class="lb">محله‌ها</span>${ic('chev', 's chev lb')}</button>
          <div class="sub"><button class="si" data-go="entry">${ic('entry', 's')}<span class="lb">ورود داده</span><span class="bd" data-pbadge></span></button><button class="si" data-go="reports">${ic('report', 's')}<span class="lb">گزارش‌ها</span></button></div></div>
      </nav>
      <div class="sbf"><div class="me"><span class="av">س‌ا</span><div class="lb"><b>سوپر ادمین</b><small>مدیر سیستم</small></div></div></div></div></aside>
    <div class="main"><header class="tb"><div class="crumb" data-crumb></div>
      <div class="gs">${ic('search', 's')}<input placeholder="جستجو در محله: معبر، خدمات، شاخص، پروژه…" data-gq aria-label="جستجو"><kbd>Ctrl K</kbd><div class="gsr" data-gr></div></div>
      <span class="date">${ic('cal', 's')}${S.updated}</span><button class="tbi" aria-label="اعلان‌ها" data-tt="اعلان‌ها" data-bell>${ic('bell', 's')}<span class="dot"></span></button></header>
      <div class="view" data-view><div data-page="reports"></div><div data-page="entry" hidden></div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', shell);
  const app = U.$('.app');

  let cur = null, mapReady = false;
  const resizeAll = () => { if (mapReady && cur === 'reports') M.map.resize(); U.charts.forEach(c => { const d = c.getDom(); if (d && d.offsetParent) c.resize(); }); if (M.atlas) M.atlas.show(); };
  APP.go = function (page) {
    if (page !== 'entry' && page !== 'reports') page = 'reports';
    if (cur === page) return;
    cur = page;
    U.hideTip && U.hideTip();
    U.$$('[data-page]').forEach(p => { p.hidden = p.dataset.page !== page; });
    U.$$('.si[data-go]').forEach(b => { b.classList.toggle('on', b.dataset.go === page); if (b.dataset.go === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    U.$('[data-crumb]').innerHTML = `محله‌ها ${ic('chevl', 'xs')} <b>${page === 'entry' ? 'ورود داده' : 'گزارش‌ها'}</b> ${ic('chevl', 'xs')} محله سیروس`;
    U.$('[data-view]').scrollTop = 0;
    try { history.replaceState(null, '', '#' + page); } catch (e) { }
    requestAnimationFrame(resizeAll);
  };

  // pending count: sidebar badge (a dot in the collapsed rail) and the bell
  function pend() {
    const n = E.pending(), b = U.$('[data-pbadge]');
    b.textContent = n ? U.fi(n) : ''; b.hidden = !n;
    U.$('[data-bell] .dot').hidden = !n;
    U.$('[data-bell]').dataset.tt = n ? `${U.fi(n)} فیلد در انتظار بازبینی` : 'اعلان تازه‌ای نیست';
  }

  // render both pages up-front so switching is instant
  R.render(U.$('[data-page="reports"]'));
  E.render(U.$('[data-page="entry"]'));
  E.on(pend); pend();
  M.init(U.$('#map'), () => { mapReady = true; M.atlas.init(U.$('#atlas')); R.syncPanel(); });
  let start = 'reports'; try { const h = location.hash.slice(1); if (h === 'entry') start = 'entry'; } catch (e) { }
  APP.go(start);

  function setPin(on) {
    pinned = on; app.classList.toggle('pinned', on);
    const b = U.$('[data-pin]'); b.setAttribute('aria-pressed', on); b.dataset.tt = on ? 'جمع کردن منو' : 'ثابت نگه داشتن منو'; b.innerHTML = ic(on ? 'chevr' : 'chevl', 's');
    U.hideTip && U.hideTip();
    try { localStorage.setItem('sirous.pin', on ? '1' : '0'); } catch (e) { }
    setTimeout(resizeAll, 230);
  }
  document.body.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { APP.go(g.dataset.go); if (g.closest('.sb') && !pinned) g.blur(); return; }
    if (e.target.closest('[data-pin]')) { setPin(!pinned); return; }
    const tg = e.target.closest('[data-tog]'); if (tg) { const ng = U.$('[data-ng]'); ng.classList.toggle('open'); tg.setAttribute('aria-expanded', ng.classList.contains('open')); return; }
    if (e.target.closest('[data-bell]')) { const n = E.pending(); if (n) { E.showPending(); U.toast(`${U.fi(n)} فیلد محله سیروس در انتظار بازبینی است`, 'bell'); } else U.toast('اعلان تازه‌ای نیست', 'bell'); }
  });

  /* ---------- global search ---------- */
  const idx = [];
  const toTop = () => U.$('.view').scrollTo({ top: 0, behavior: 'smooth' });
  const KPI_MAP = { area: 0, worn: 1, pop: 2, hh: 2, res: 3, com: 3, unst: 4, cap: 5 };
  R.SECS.forEach(([id, t, i]) => idx.push({ g: 'بخش‌های گزارش', t, s: 'گزارش‌ها', i, run: () => { APP.go('reports'); setTimeout(() => R.jump(id), 30); } }));
  S.kpi.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.v) + ' ' + k.u, i: k.ic, run: () => { APP.go('reports'); setTimeout(() => { toTop(); R.flashKpi(KPI_MAP[k.k] != null ? KPI_MAP[k.k] : 0); }, 30); } }));
  S.percap.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.v, 2) + ' مترمربع', i: 'target', run: () => { APP.go('reports'); setTimeout(() => R.jump('s-ov'), 30); } }));
  S.hazards.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.pct) + '٪ مساحت', i: 'warn', run: () => { APP.go('reports'); setTimeout(() => R.jump('s-hz'), 30); } }));
  S.informal.forEach(k => idx.push({ g: 'شاخص‌ها', t: k.t, s: U.fa(k.v, 1) + ' ' + k.u, i: k.ic, run: () => { APP.go('reports'); setTimeout(() => R.jump('s-ec'), 30); } }));
  S.projects.forEach(p => idx.push({ g: 'پروژه‌ها', t: p.t, s: p.st, i: 'cal', run: () => { APP.go('reports'); setTimeout(() => { R.jump('s-pj'); const q = U.$('#t-pj [data-q]'); if (q) { q.value = p.t; q.dispatchEvent(new Event('input', { bubbles: true })); } }, 30); } }));
  S.form.steps.forEach((s, i) => idx.push({ g: 'ورود داده', t: 'مرحله ' + M.toFa(i + 1) + ': ' + s, s: 'فرم محله', i: 'edit', run: () => { APP.go('entry'); setTimeout(() => { const b = U.$(`[data-page="entry"] .steps [data-step="${i}"]`); if (b) b.click(); else { U.$('[data-page="entry"] [data-m="form"]').click(); U.$(`[data-page="entry"] .steps [data-step="${i}"]`).click(); } }, 30); } }));
  let mapIdx = null;
  const gq = U.$('[data-gq]'), gr = U.$('[data-gr]');
  let act = 0, res = [];
  function draw() {
    const q = U.norm(gq.value); if (!q) { gr.classList.remove('on'); res = []; return; }
    if (!mapIdx && M.ready) mapIdx = M.index().map(x => ({ g: 'روی نقشه', t: x.t, s: x.s, i: x.k === 'road' ? 'road' : x.k === 'lm' ? 'star' : 'pin', run: () => { APP.go('reports'); setTimeout(() => { R.jump('s-map'); setTimeout(() => x.k === 'poi' ? M.flyPoi(x.i) : M.flyTo(x.c, x.k === 'road' ? 17.6 : 18), 350); }, 30); } }));
    res = idx.concat(mapIdx || []).filter(x => U.norm(x.t).includes(q) || U.norm(x.s).includes(q)).slice(0, 14); act = 0;
    if (!res.length) { gr.innerHTML = '<div class="emp">نتیجه‌ای پیدا نشد</div>'; gr.classList.add('on'); return; }
    let h = '', last = '';
    res.forEach((x, n) => { if (x.g !== last) { h += `<div class="grp">${x.g}</div>`; last = x.g; } h += `<button data-n="${n}" class="${n ? '' : 'act'}">${ic(x.i || 'search', 's')}<span>${U.hl(x.t, gq.value)}</span><small>${U.esc(x.s)}</small></button>`; });
    gr.innerHTML = h; gr.classList.add('on');
  }
  const run = x => { gr.classList.remove('on'); gq.value = ''; gq.blur(); x.run(); };
  gq.addEventListener('input', draw); gq.addEventListener('focus', draw);
  gq.addEventListener('keydown', e => {
    if (e.key === 'Escape') { gr.classList.remove('on'); gq.blur(); return; }
    if (!res.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { act = (act + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; U.$$('button', gr).forEach((b, i) => b.classList.toggle('act', i === act)); const a = U.$$('button', gr)[act]; if (a) a.scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
    if (e.key === 'Enter') { e.preventDefault(); run(res[act]); }
  });
  gr.addEventListener('mousedown', e => { const b = e.target.closest('[data-n]'); if (b) { e.preventDefault(); run(res[+b.dataset.n]); } });
  gq.addEventListener('blur', () => setTimeout(() => gr.classList.remove('on'), 120));
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); gq.focus(); gq.select(); } });
})();
