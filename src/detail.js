/* Detail pages (separate page, not a drawer) + router. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc } = U;
  let lastModel = 'm1', dmap;

  function back() { return `<a class="back" href="#${lastModel}">${ic('back', 'sm')} بازگشت به داشبورد</a>`; }
  function kpis(list) { return `<section class="dkpis">${list.map(([l, v, s]) => `<div class="card"><div class="k"><span class="l">${l}</span><span class="v num">${v}</span>${s ? `<small class="muted">${s}</small>` : ''}</div></div>`).join('')}</section>`; }
  function timeline(evs) { return `<div class="tl">${evs.map(e => `<div class="it">${U.av(e.x)}<div><b>${esc(e.x.n)} ${esc(U.evText(e))}</b><small>${U.rel(e.t)} · ${esc(e.place)}</small></div></div>`).join('') || '<p class="lede">هنوز فعالیتی ثبت نشده.</p>'}</div>`; }
  function head(eyebrow, title, crumb, actions = '') { return `${back()}<div class="dhead"><div style="flex:1"><nav class="crumb">${crumb.join('<span>›</span>')}</nav><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div>${actions}</div>`; }
  function mini(el, items, fit) {
    if (dmap) { dmap.remove(); dmap = null; }
    dmap = L.map(el, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
    L.geoJSON(window.GEO_NB, { style: { color: '#E2E8F0', weight: 1, fillColor: '#F1F5F9', fillOpacity: 1 }, interactive: false }).addTo(dmap);
    L.geoJSON(B.GI, { style: { color: '#fff', weight: 1, fillColor: '#E9EEF3', fillOpacity: 1 }, interactive: false }).addTo(dmap);
    const g = L.featureGroup(items.map(f => f())).addTo(dmap); dmap.fitBounds(fit ? fit : g.getBounds(), { padding: [24, 24], maxZoom: 15 });
  }
  const ll = c => [c[0], c[1]];

  function prov(id) {
    const p = B.provBy[id]; const cs = B.D.cities.filter(c => c.p === id); const xs = B.experts.filter(x => x.prov === id);
    U.topbar('پرونده‌ی استان', p.fa);
    U.$('#page').innerHTML = `<div class="detail" style="display:flex;flex-direction:column;gap:20px">${head('استان', p.fa, ['ایران', p.fa], `<button class="btn ghost" onclick="UI.toast('گزارش PDF استان ساخته می‌شود')">${ic('doc', 'sm')} گزارش استان</button><button class="btn pri" onclick="UI.toast('فرم «ایجاد شهر» باز می‌شود')">${ic('plus', 'sm')} تعریف شهر</button>`)}
      ${kpis([['شهر', fa(p.cities)], ['منطقه', fa(p.regions)], ['محله', fa(p.hoods)], ['معبر', fa(p.streets)], ['ملک و اراضی', fa(p.props)]])}
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>شهرهای ثبت‌شده</h2></div><div class="dmap" id="dm"></div>
        <div class="list" style="margin-top:8px">${cs.map(c => `<a class="row" href="#d/city/${c.id}"><span class="t"><b>شهر ${c.n}</b><small>${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک</small></span><span style="width:90px"><div class="bar"><i style="width:${c.completeness}%"></i></div></span><b class="num" style="width:40px">${pct(c.completeness)}</b></a>`).join('') || '<p class="lede">هنوز شهری تعریف نشده.</p>'}</div></div>
        <div style="display:flex;flex-direction:column;gap:20px"><div class="card pad"><div class="h2"><h2>ثبت ماهانه</h2></div><div class="chart" id="dc" style="height:220px"></div></div>
          <div class="card pad"><div class="h2"><h2>کارشناسان این استان</h2></div>${xs.length ? U.expertTable(xs) : '<p class="lede">کارشناسی تخصیص داده نشده.</p>'}</div></div></div>
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>آخرین کارها در ${p.fa}</h2></div>${timeline(B.events.filter(e => e.prov === id).slice(0, 8))}</div>
        <div class="card pad"><div class="h2"><h2>نیاز به پیگیری</h2></div>${U.attention(5, id)}<div style="margin-top:16px">${U.aiCard(p.fa)}</div></div></div></div>`;
    mini(U.$('#dm'), [() => L.geoJSON(p.feature, { style: { color: '#3B5BDB', weight: 2, fillColor: '#E6F7F7', fillOpacity: .7 } })].concat(cs.map(c => () => L.polygon(c.b.map(ll), { color: '#fff', weight: 1, fillColor: '#00ADAB', fillOpacity: .8 }).bindTooltip('شهر ' + c.n))));
    U.chart(U.$('#dc'), { grid: { left: 8, right: 40, top: 10, bottom: 26 }, tooltip: { trigger: 'axis', valueFormatter: v => fa(v) }, xAxis: { type: 'category', inverse: true, data: B.MONTHS, axisTick: { show: false }, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B' } }, yAxis: { position: 'right', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#94A3B8', formatter: v => fa(v) } }, series: [{ type: 'bar', data: p.monthly, barWidth: '50%', itemStyle: { color: '#00ADAB', borderRadius: [4, 4, 0, 0] } }] });
  }
  function city(id) {
    const c = B.cityBy[id]; const p = B.provBy[c.p]; const hs = B.D.hoods.filter(h => h.city === id);
    U.topbar('پرونده‌ی شهر', 'شهر ' + c.n);
    U.$('#page').innerHTML = `<div class="detail" style="display:flex;flex-direction:column;gap:20px">${head('شهر', 'شهر ' + c.n, ['ایران', p.fa, c.n], `<button class="btn pri" onclick="UI.toast('فرم «ایجاد محله» باز می‌شود')">${ic('plus', 'sm')} تعریف محله</button>`)}
      ${kpis([['منطقه', fa(c.regions)], ['محله', fa(c.hoods)], ['معبر', fa(hs.reduce((a, h) => a + h.streets, 0))], ['ملک', fa(c.props)], ['کامل‌بودن', pct(c.completeness)]])}
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>مناطق و محله‌ها</h2></div><div class="dmap" id="dm"></div></div>
        <div class="card pad"><div class="h2"><h2>محله‌ها</h2><div class="grow"></div><small class="muted">مرحله‌ی فرم</small></div><div class="list">${hs.map(h => `<a class="row" href="#d/hood/${h.id}"><span class="t"><b>محله ${h.n}</b><small>${h.status} · ${fa(h.props)} ملک</small></span><span style="width:110px">${U.steps(h.steps)}</span></a>`).join('')}</div></div></div>
      <div class="card pad"><div class="h2"><h2>آخرین کارها</h2></div>${timeline(B.events.filter(e => e.city === id).slice(0, 8))}</div></div>`;
    mini(U.$('#dm'), [() => L.polygon(c.b.map(ll), { color: '#3B5BDB', weight: 2, fillColor: '#fff', fillOpacity: 1 })].concat(B.D.regions.filter(r => r.city === id).map(r => () => L.polygon(r.b.map(ll), { color: '#94A3B8', weight: 1, fillOpacity: 0 }))).concat(hs.map(h => () => L.polygon(h.b.map(ll), { color: '#fff', weight: 1, fillColor: h.status === 'تأیید شده' ? '#40BDBB' : '#B3E6E5', fillOpacity: .9 }).bindTooltip('محله ' + h.n))));
  }
  function hood(id) {
    const h = B.hoodBy[id]; const c = B.cityBy[h.city]; const p = B.provBy[c.p]; const r = B.regionBy[h.reg] || { n: '' };
    const q = B.queue.find(x => x.ref === id);
    U.topbar('پرونده‌ی محله', 'محله ' + h.n);
    U.$('#page').innerHTML = `<div class="detail" style="display:flex;flex-direction:column;gap:20px">${head('محله · ' + h.status, 'محله ' + h.n, ['ایران', p.fa, c.n, r.n, h.n],
      h.status === 'در انتظار تأیید' ? `<button class="btn ghost" onclick="UI.toast('محله برای اصلاح به کارشناس برگشت داده شد')">${ic('undo', 'sm')} برگشت برای اصلاح</button><button class="btn pri" onclick="UI.toast('محله تأیید شد')">${ic('check', 'sm')} تأیید محله</button>` : `<button class="btn ghost" onclick="UI.toast('فرم ویرایش محله باز می‌شود')">ویرایش</button>`)}
      ${q ? `<div class="card pad" style="border-color:var(--s-100);background:var(--s-50);display:flex;gap:12px;align-items:center">${U.av(q.x)}<div style="flex:1"><b>${q.x.n}</b> این محله را ${fa(q.age)} روز پیش برای تأیید فرستاده است.</div></div>` : ''}
      <section class="card pad"><div class="h2"><h2>فرم ثبت محله</h2><div class="grow"></div><b>${fa(h.steps)} از ۶ مرحله</b></div>
        <div class="formsteps" style="margin-top:10px">${B.STEP_NAMES.map((n, i) => `<div class="fs ${i < h.steps ? 'on' : ''}"><small>مرحله ${fa(i + 1)}</small><b>${n}</b><span>${i < h.steps ? ic('check', 'sm') + ' کامل' : 'خالی'}</span></div>`).join('')}</div></section>
      ${U.hoodDetail(h)}
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>نقشه‌ی محله</h2><div class="grow"></div><small class="muted">${fa(h.streets)} معبر · ${fa(h.props)} ملک · ${fa(h.feats)} عارضه</small></div><div class="dmap" id="dm"></div></div>
        <div class="card pad"><div class="h2"><h2>تاریخچه</h2></div>${timeline(B.events.filter(e => e.hood === id).concat(B.events.filter(e => e.city === h.city)).slice(0, 6))}</div></div></div>`;
    U.hoodDetailCharts(h);
    const sts = B.D.streets.filter(s => s.h === id), pts = B.D.pts.filter(x => x.h === id), fts = B.D.feats.filter(f => f.h === id);
    mini(U.$('#dm'), [() => L.polygon(h.b.map(ll), { color: '#1E40AF', weight: 2, fillColor: '#EEF2FF', fillOpacity: .5 })]
      .concat(sts.map(s => () => L.polyline(s.l.map(ll), { color: '#F59F00', weight: 3 }).bindTooltip(s.n)))
      .concat(fts.map(f => () => L.polygon(f.b.map(ll), { color: '#F76707', weight: 1, fillColor: '#FFC08A', fillOpacity: .6 }).bindTooltip(f.n)))
      .concat(pts.map(x => () => L.circleMarker(ll(x.c), { radius: 4, color: '#fff', weight: 1, fillColor: '#3B5BDB', fillOpacity: 1 }).bindTooltip('ملک ' + x.code))), L.polygon(h.b.map(ll)).getBounds());
  }
  function expert(id) {
    const x = B.expBy[id]; const evs = B.events.filter(e => e.x.id === id);
    U.topbar('پرونده‌ی کارشناس', x.n);
    U.$('#page').innerHTML = `<div class="detail" style="display:flex;flex-direction:column;gap:20px">${back()}
      <div class="dhead"><span class="av lg ${/پروژه/.test(x.role) ? 'b' : ''}">${x.ini}</span><div style="flex:1"><span class="eyebrow">${x.role}</span><h1>${x.n}</h1><small class="muted">محدوده‌ی کار: ${x.provFa}</small></div>
        ${x.lastDays > 14 ? `<span class="badge warn" style="font-size:12.5px;padding:4px 10px">${fa(x.lastDays)} روز بدون فعالیت</span>` : ''}<button class="btn ghost" onclick="UI.toast('پیام برای کارشناس فرستاده می‌شود')">${ic('send', 'sm')} پیام</button></div>
      ${kpis([['ثبت در ۳۰ روز', fa(x.recs30)], ['نرخ تأیید', pct(x.approval)], ['منتظر تأیید', fa(x.pending)], ['برگشت‌خورده', fa(x.returned)], ['میانگین کامل‌بودن فرم‌ها', pct(x.avgComplete)]])}
      <section class="card pad"><div class="h2"><h2>فعالیت ۱۲ هفته‌ی اخیر</h2><div class="grow"></div><span class="muted" style="font-size:12px;display:flex;gap:4px;align-items:center">کم<span class="heat" style="display:flex;grid-auto-flow:unset"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span>زیاد</span></div>
        <div style="overflow-x:auto;padding:8px 0">${U.heat(x.days)}</div></section>
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>کارهای اخیر</h2></div>${timeline(evs.slice(0, 10))}</div>
        <div class="card pad"><div class="h2"><h2>ثبت روزانه</h2></div><div class="chart" id="dc" style="height:260px"></div></div></div></div>`;
    U.chart(U.$('#dc'), { grid: { left: 8, right: 36, top: 10, bottom: 26 }, tooltip: { trigger: 'axis', valueFormatter: v => fa(v) }, xAxis: { type: 'category', inverse: true, data: x.days.slice(-30).map((_, i) => U.faDate(new Date(B.TODAY - (29 - i) * B.DAY), { day: 'numeric', month: 'short' })), axisTick: { show: false }, axisLabel: { color: '#94A3B8', interval: 6 }, axisLine: { lineStyle: { color: '#E2E8F0' } } }, yAxis: { position: 'right', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#94A3B8', formatter: v => fa(v) } }, series: [{ type: 'bar', data: x.days.slice(-30), barWidth: '55%', itemStyle: { color: /پروژه/.test(x.role) ? '#1E40AF' : '#00ADAB', borderRadius: [3, 3, 0, 0] } }] });
  }
  function project(id) {
    const p = B.projects.find(x => x.id === id); const h = B.hoodBy[p.h] || B.D.hoods[0];
    U.topbar('پرونده‌ی پروژه', p.n);
    const ms = [['تعریف پروژه و ثبت اطلاعات اولیه', p.startM - 2, 1], ['عقد قرارداد با ' + p.contractor, p.startM, 1], ['شروع عملیات اجرایی', p.startM + 1, 1], ['۵۰٪ پیشرفت فیزیکی', Math.round((p.startM + p.endM) / 2), p.pr >= 50], ['تحویل و بهره‌برداری', p.endM, 0]];
    U.$('#page').innerHTML = `<div class="detail" style="display:flex;flex-direction:column;gap:20px">${head('پروژه ' + p.type, p.n, ['ایران', p.provFa, p.city, 'محله ' + p.hood], `<button class="btn ghost" onclick="UI.toast('گزارش پیشرفت ساخته می‌شود')">${ic('doc', 'sm')} گزارش پیشرفت</button>`)}
      ${kpis([['پیشرفت واقعی', pct(p.pr)], ['پیشرفت برنامه‌ای', pct(p.plan), p.gap < -10 ? pct(-p.gap) + ' عقب‌تر از برنامه' : 'طبق برنامه'], ['مبلغ کل', U.money(p.budget), 'تومان'], ['پرداخت‌شده', U.money(p.paid), 'تومان'], ['کارشناس مسئول', p.expert.n]])}
      <section class="card pad"><div class="h2"><h2>پیشرفت در برابر برنامه</h2></div><div class="bullet" style="height:34px;margin-top:10px"><span class="track" style="inset:10px 0"></span><span class="act ${p.gap < -10 ? 'late' : ''}" style="width:${p.pr}%;top:10px;bottom:10px"></span><span class="plan" style="right:${p.plan}%"></span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px" class="muted"><span>شروع: ${fa(Math.abs(p.startM))} ماه پیش</span><span>پایان: ${p.endM > 0 ? fa(p.endM) + ' ماه دیگر' : 'گذشته'}</span></div></section>
      <div class="grid g2"><div class="card pad"><div class="h2"><h2>مراحل</h2></div><div class="tl">${ms.map(([t, m, done]) => `<div class="it"><span class="av ${done ? '' : 'b'}" style="${done ? '' : 'background:var(--sunk);color:var(--faint)'}">${done ? ic('check', 'sm') : ic('clock', 'sm')}</span><div><b>${t}</b><small>${m <= 0 ? fa(-m) + ' ماه پیش' : fa(m) + ' ماه دیگر'}</small></div></div>`).join('')}</div></div>
        <div class="card pad"><div class="h2"><h2>موقعیت</h2></div><div class="dmap" id="dm"></div></div></div></div>`;
    mini(U.$('#dm'), [() => L.polygon(h.b.map(ll), { color: '#3B5BDB', weight: 2, fillColor: '#E6F7F7', fillOpacity: .5 })].concat(p.geom ? [() => L.polygon(p.geom.map(ll), { color: '#3B5BDB', weight: 2, dashArray: '5 4', fillColor: '#00ADAB', fillOpacity: .2 })] : [() => L.circleMarker(ll(p.c), { radius: 9, color: '#fff', weight: 2, fillColor: '#C2410C', fillOpacity: 1 })]));
  }

  /* ---------- router ---------- */
  const MODELS = { m1: window.MA, m2: window.MB };
  let active;
  function route() {
    const h = location.hash.replace('#', '') || 'm1';
    if (active && active.destroy) active.destroy(); active = null;
    if (dmap) { dmap.remove(); dmap = null; }
    U.clearCharts(); U.tip(null);
    window.scrollTo(0, 0);
    if (MODELS[h]) { lastModel = h; active = MODELS[h]; active.render(); }
    else { const [, type, id] = h.split('/'); try { ({ prov, city, hood, expert, project })[type](id); } catch (e) { console.error(e); location.hash = '#' + lastModel; } }
    U.$$('.switch [data-m]').forEach(a => a.classList.toggle('on', a.dataset.m === (MODELS[h] ? h : lastModel)));
  }
  U.shell(); addEventListener('hashchange', route); route();
  addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); const s = U.$('.search input'); s && s.focus(); } });
})();
