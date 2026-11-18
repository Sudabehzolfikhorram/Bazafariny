/* MODEL 2 · اطلس استان‌ها — equal-size tile cartogram (every province readable), coverage matrix, review board. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc } = U;
  const MET = [['records', 'تعداد ثبت'], ['completeness', 'کامل‌بودن'], ['pending', 'منتظر تأیید'], ['growth', 'رشد این ماه']];
  let metric = 'records', sel = 'Tehran';
  B.provs.forEach(p => p.growth = p.has && p.lastMonth ? Math.round((p.thisMonth / p.lastMonth - 1) * 100) : 0);
  const fmtM = (p, k) => k === 'growth' ? U.spct(p[k]) : k === 'completeness' ? pct(p[k]) : fa(p[k]);

  function render() {
    const T = B.totals;
    U.topbar('اطلس بازآفرینی', 'هر استان یک خانه · مقایسه‌ی ۳۱ استان در یک نگاه');
    U.$('#page').innerHTML = `<div class="m2" style="display:flex;flex-direction:column;gap:20px">
      <section class="hero">
        <div class="card statement"><span class="eyebrow">وضعیت امروز · ${U.faDate(B.TODAY, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <p class="big">در <em>${fa(T.provsWith)} استان</em> از ۳۱ استان داده ثبت شده است؛ <span>${fa(B.empty.length)} استان هنوز خالی‌اند.</span></p>
          <div class="kstrip">${[['شهر', T.cities], ['محله', T.hoods], ['معبر', T.streets], ['ملک و اراضی', T.props], ['پروژه', T.exec + T.partner]].map(([l, v]) => `<div class="k"><span class="v num">${fa(v)}</span><span class="l">${l}</span></div>`).join('')}</div></div>
        <div class="card pad"><div class="h2"><h2>از استان تا معبر</h2><div class="grow"></div><span class="muted" style="font-size:12px">تعداد · درصد کامل‌بودن</span></div>
          <p class="lede" style="margin-bottom:10px">هر سطح باید پیش از سطح پایین‌تر کامل شود. شکاف‌ها این‌جا پیداست.</p>
          <div class="stair">${[['استان', T.provsWith, 100, '/۳۱'], ['شهر', T.cities, 88], ['منطقه', T.regions, 74], ['محله', T.hoods, Math.round(B.D.hoods.reduce((a, h) => a + h.steps, 0) / B.D.hoods.length / 6 * 100)], ['معبر', T.streets, 57], ['نقاط و محدوده‌ها', T.feats + T.props, 49]].map(([l, v, c, s]) => `<div class="st"><span>${l}</span><div class="bar"><i style="width:${c}%;background:${c < 55 ? '#F59F00' : U.CAT.hood}"></i></div><b class="num">${fa(v)}${s || ''}</b></div>`).join('')}</div>
        </div>
      </section>

      <div class="sec-title"><span class="n">۱</span><h2>کدام استان کجای کار است؟</h2><p>روی هر خانه بزنید تا پرونده‌ی استان کنار آن باز شود</p></div>
      <section class="atlas-wrap">
        <div class="card atlas"><div class="h2" style="margin-bottom:12px"><div class="seg" id="met">${MET.map(([k, t]) => `<button data-k="${k}" class="${k === metric ? 'on' : ''}">${t}</button>`).join('')}</div><div class="grow"></div>
          <span class="muted" style="font-size:12px;display:flex;align-items:center;gap:6px"><i class="empty-hatch" style="width:14px;height:14px;border-radius:4px;display:inline-block"></i>بدون داده</span></div>
          <div id="tiles"></div></div>
        <aside class="card prof2" id="prof" aria-live="polite"></aside>
      </section>

      <div class="sec-title"><span class="n">۲</span><h2>داده‌ها چقدر کامل‌اند؟</h2><p>درصد پر بودن فرم‌ها برای هر استان و هر نوع داده</p></div>
      <section class="card pad matrix-wrap" id="matrix"></section>

      <div class="sec-title"><span class="n">۳</span><h2>کارشناسان و کارهای منتظر</h2><p>چه کسی چه کرده، و چه چیزی منتظر تصمیم شماست</p></div>
      <section class="kanban" id="kanban"></section>
      <section class="grid g-21">${U.expertsCard(6)}${U.rhythmCard()}</section>
      ${U.aiCard()}
    </div>`;
    U.$$('#met button').forEach(b => b.onclick = () => { metric = b.dataset.k; U.$$('#met button').forEach(x => x.classList.toggle('on', x === b)); tiles(); });
    tiles(); profile(); matrix(); kanban();
  }

  function tiles() {
    const S = 104, G = 10, W = 7 * S + 6 * G, H = 5 * S + 4 * G;
    const vals = B.provs.filter(p => p.has).map(p => p[metric]); const mx = Math.max(...vals), mn = Math.min(0, ...vals);
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="نقشه‌ی خانه‌ای استان‌ها"><defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#F1F5F9"/><line x1="0" y1="0" x2="0" y2="7" stroke="#E2E8F0" stroke-width="2"/></pattern></defs>
      ${B.provs.map(p => { const [c, r] = p.grid; const x = W - (c + 1) * S - c * G + (r === 4 ? 0 : 0), y = r * (S + G);
        // geographic: west on the left → column 0 at the left edge
        const X = c * (S + G);
        const t = p.has ? (p[metric] - mn) / ((mx - mn) || 1) : 0; const fill = p.has ? U.ramp(t * .999) : 'url(#hatch)'; const ink = p.has ? U.inkOn(fill) : '#94A3B8';
        return `<g class="tile ${p.id === sel ? 'sel' : ''}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.fa}">
          <rect class="bg" x="${X}" y="${y}" width="${S}" height="${S}" rx="16" fill="${fill}" stroke="${p.has ? 'none' : '#E2E8F0'}"/>
          <text x="${X + S - 12}" y="${y + 24}" text-anchor="start" direction="rtl" font-size="12.5" font-weight="700" fill="${ink}">${esc(p.short)}</text>
          ${p.has ? `<text x="${X + S - 12}" y="${y + 60}" direction="rtl" font-size="22" font-weight="800" fill="${ink}">${fmtM(p, metric)}</text>
          <rect x="${X + 12}" y="${y + S - 20}" width="${S - 24}" height="5" rx="2.5" fill="${ink === '#fff' ? 'rgba(255,255,255,.3)' : 'rgba(15,23,42,.08)'}"/><rect x="${X + 12 + (S - 24) * (1 - p.completeness / 100)}" y="${y + S - 20}" width="${(S - 24) * p.completeness / 100}" height="5" rx="2.5" fill="${ink === '#fff' ? '#fff' : '#0F172A'}"/>`
          : `<text x="${X + S - 12}" y="${y + 60}" direction="rtl" font-size="12" fill="#94A3B8">بدون داده</text>`}
          ${p.pending && metric !== 'pending' ? `<circle cx="${X + 16}" cy="${y + 18}" r="9" fill="#3B5BDB"/><text x="${X + 16}" y="${y + 22}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${fa(p.pending)}</text>` : ''}
        </g>`; }).join('')}
    </svg>
    <div style="display:flex;gap:16px;align-items:center;margin-top:12px;font-size:12px;color:var(--muted);flex-wrap:wrap"><span style="display:flex;align-items:center;gap:6px"><i style="width:18px;height:5px;border-radius:3px;background:#0F172A;display:inline-block"></i>نوار پایین هر خانه: کامل‌بودن داده</span><span style="display:flex;align-items:center;gap:6px"><i style="width:12px;height:12px;border-radius:50%;background:#3B5BDB;display:inline-block"></i>تعداد منتظر تأیید</span><span>چیدمان خانه‌ها تقریباً جای جغرافیایی استان‌هاست؛ غرب در چپ.</span></div>`;
    U.$('#tiles').innerHTML = svg;
    U.$$('#tiles .tile').forEach(g => { const p = B.provBy[g.dataset.id];
      g.onclick = () => { sel = p.id; U.$$('#tiles .tile').forEach(x => x.classList.toggle('sel', x === g)); profile(); };
      g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.onclick(); } };
      g.onmousemove = e => U.tip(e, `<b>${p.fa}</b><br>${p.has ? `${fa(p.records)} رکورد · ${pct(p.completeness)} کامل<br>این ماه ${fa(p.thisMonth)} ثبت` : 'هنوز داده‌ای ثبت نشده'}`);
      g.onmouseleave = () => U.tip(null); });
  }

  function shapeSvg(p) {
    const rings = U.ringsOf(p.feature); const bb = U.bboxOf(rings.flat()); const s = 64 / Math.max(bb[2] - bb[0], bb[3] - bb[1]);
    const d = rings.map(r => 'M' + r.map(([x, y]) => `${((x - bb[0]) * s + 4).toFixed(1)},${((bb[3] - y) * s + 4).toFixed(1)}`).join('L') + 'Z').join('');
    return `<svg viewBox="0 0 72 72" aria-hidden="true"><path d="${d}" fill="${p.has ? '#0F172A' : '#CBD5E1'}" stroke="#fff" stroke-width="1"/></svg>`;
  }
  function profile() {
    const p = B.provBy[sel]; const rank = [...B.provs].sort((a, b) => b.records - a.records).indexOf(p) + 1;
    const C = U.CAT; const el = U.$('#prof');
    if (!p.has) {
      el.innerHTML = `<div class="phead"><div class="shape">${shapeSvg(p)}</div><div style="flex:1"><span class="rank" style="background:var(--sunk);color:var(--muted)">بدون داده</span><h3>${p.fa}</h3><small class="muted">هیچ شهری تعریف نشده</small></div></div>
        <div class="pbody"><div class="empty-hatch" style="border-radius:14px;padding:26px 18px;text-align:center"><b>هنوز چیزی در ${p.fa} ثبت نشده</b><p class="lede" style="margin:6px 0 14px">برای شروع، یک کارشناس استان تعیین کنید یا خودتان شهرها را تعریف کنید.</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn pri" onclick="UI.toast('فرم «ایجاد شهر» باز می‌شود')">${ic('plus', 'sm')} تعریف شهر</button><button class="btn ghost" onclick="UI.toast('فهرست کارشناسان برای تخصیص باز می‌شود')">${ic('users', 'sm')} تعیین کارشناس</button></div></div></div>`;
      return;
    }
    const xs = B.experts.filter(x => x.prov === p.id); const evs = B.events.filter(e => e.prov === p.id).slice(0, 6);
    const ring = v => { const r = 15, c = 2 * Math.PI * r; return `<svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="${r}" fill="none" stroke="#EEF2F6" stroke-width="5"/><circle cx="19" cy="19" r="${r}" fill="none" stroke="${v < 50 ? '#F59F00' : C.hood}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c * v / 100} ${c}" transform="rotate(-90 19 19)"/></svg>`; };
    const lv = [['شهر', p.cities, 92, C.hood], ['منطقه', p.regions, 80, C.hood], ['محله', p.hoods, p.completeness, C.hood], ['معبر', p.streets, Math.max(20, p.completeness - 18), C.street], ['ملک', p.props, Math.max(25, p.completeness - 8), C.prop], ['عوارض', p.feats, Math.max(10, p.completeness - 30), C.feat]];
    el.innerHTML = `<div class="phead"><div class="shape">${shapeSvg(p)}</div><div style="flex:1;min-width:0"><span class="rank">رتبه ${fa(rank)} از ${fa(B.totals.provsWith)}</span><h3>${p.fa}</h3><small class="muted">${fa(xs.length)} کارشناس · آخرین ثبت ${evs[0] ? U.rel(evs[0].t) : '—'}</small></div></div>
      <div class="pstats"><div><span><b class="num">${fa(p.records)}</b><small>رکورد</small></span></div><div>${ring(p.completeness)}<span><b class="num">${pct(p.completeness)}</b><small>کامل</small></span></div><div><span><b class="num" style="color:${p.pending ? C.prop : 'inherit'}">${fa(p.pending)}</b><small>منتظر تأیید</small></span></div></div>
      <div class="ptabs" role="tablist"><button class="on" data-t="o">نمای کلی</button><button data-t="x">کارشناسان (${fa(xs.length)})</button><button data-t="e">آخرین کارها</button></div>
      <div class="pbody" id="pbody"></div>
      <div class="pacts"><a class="btn pri" style="flex:1" href="#d/prov/${p.id}">${ic('eye', 'sm')} پرونده‌ی کامل</a><a class="btn ghost" href="#m1" onclick="try{sessionStorage.setItem('goProv','${p.id}')}catch(e){}">${ic('map', 'sm')} روی نقشه</a></div>`;
    const tabs = {
      o: () => `<div><div class="mini-h">زنجیره‌ی سطوح<span class="grow"></span><small class="muted">تعداد · کامل‌بودن</small></div>
          <div class="chain">${lv.map(([n, v, c, col]) => `<div class="lv" style="--c:${col}"><span>${n}</span><b class="num">${fa(v)}</b><div class="bar"><i style="width:${c}%;background:${c < 45 ? '#F59F00' : col}"></i></div><small>${pct(c)} کامل</small></div>`).join('')}</div></div>
        <div><div class="mini-h">ثبت ماهانه<span class="grow"></span>${p.growth ? `<span class="delta ${p.growth < 0 ? 'down' : ''}">${U.spct(p.growth)} نسبت به مهر</span>` : ''}</div><div id="spark2" style="height:110px"></div></div>`,
      x: () => `<div class="list">${xs.map(x => `<a class="row" href="#d/expert/${x.id}">${U.av(x)}<span class="t"><b>${x.n}</b><small>${x.role} · ${fa(x.recs28)} ثبت در ماه</small></span>${U.heat(x.days, true, 4)}${x.lastDays > 14 ? `<span class="badge warn">${fa(x.lastDays)} روز</span>` : ''}</a>`).join('') || '<p class="lede">کارشناسی به این استان اختصاص ندارد.</p>'}</div>`,
      e: () => `<div class="tl">${evs.map(e => `<div class="it">${U.av(e.x)}<div><b>${esc(U.evText(e))}</b><small>${e.x.n} · ${U.rel(e.t)}</small></div></div>`).join('') || '<p class="lede">فعالیتی نیست.</p>'}</div>`
    };
    const show = k => { U.$$('#prof .ptabs button').forEach(b => { b.classList.toggle('on', b.dataset.t === k); b.setAttribute('aria-selected', b.dataset.t === k); }); U.$('#pbody').innerHTML = tabs[k]();
      if (k === 'o') U.chart(U.$('#spark2'), { grid: { left: 4, right: 4, top: 18, bottom: 20 }, tooltip: { trigger: 'axis', valueFormatter: v => fa(v) },
        xAxis: { type: 'category', inverse: true, boundaryGap: false, data: B.MONTHS, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#94A3B8', fontSize: 10, interval: 1 } }, yAxis: { show: false },
        series: [{ type: 'line', smooth: .35, data: p.monthly, symbol: 'circle', symbolSize: 6, showSymbol: false, lineStyle: { color: C.prop, width: 2 }, itemStyle: { color: C.prop },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,91,219,.18)' }, { offset: 1, color: 'rgba(59,91,219,0)' }] } },
          markPoint: { symbol: 'circle', symbolSize: 8, label: { show: true, position: 'top', formatter: o => fa(o.value), color: '#0F172A', fontWeight: 700, fontFamily: 'Vazirmatn' }, itemStyle: { color: C.prop }, data: [{ coord: [7, p.monthly[7]], value: p.monthly[7] }] } }] }); };
    U.$$('#prof .ptabs button').forEach(b => b.onclick = () => show(b.dataset.t));
    show('o');
  }

  function matrix() {
    const cols = [['cities', 'شهر'], ['regions', 'منطقه'], ['hoods', 'محله'], ['streets', 'معبر'], ['props', 'ملک'], ['feats', 'عوارض'], ['proj', 'پروژه']];
    const list = B.provs.filter(p => p.has).sort((a, b) => b.records - a.records);
    let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const cell = (p, k) => { const v = k === 'proj' ? p.exec + p.partner : p[k]; if (!v) return `<td style="background:#F8FAFC;color:#CBD5E1">—</td>`; const c = Math.max(8, Math.min(100, Math.round(p.completeness + (k === 'cities' ? 18 : k === 'regions' ? 8 : k === 'feats' ? -32 : k === 'streets' ? -16 : 0) + (r() * 20 - 10)))); const [f, ink] = c >= 75 ? ['#E6F4F4', '#0B6B69'] : c >= 45 ? ['#FFF3BF', '#8F5B00'] : ['#FFE3E3', '#C92A2A']; return `<td style="background:${f};color:${ink}" title="${fa(v)} مورد · ${fa(c)}٪ کامل">${fa(c)}٪</td>`; };
    U.$('#matrix').innerHTML = `<div class="h2"><h2>ماتریس کامل‌بودن</h2><div class="grow"></div>${U.legend([['کمتر از ۴۵٪: نیاز به پیگیری', '#FFC9C9'], ['۴۵ تا ۷۵٪', '#FFE066'], ['بیش از ۷۵٪', '#A9D5D3']])}</div>
      <p class="lede" style="margin-bottom:10px">ستون‌ها همان فرم‌های ثبت‌اند. خانه‌های روشن یعنی فرم‌ها نیمه‌کاره مانده‌اند.</p>
      <table class="matrix"><thead><tr><th class="p">استان</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}<th>کل رکورد</th></tr></thead><tbody>
      ${list.map(p => `<tr class="click" onclick="location.hash='#d/prov/${p.id}'"><td class="p">${p.fa}</td>${cols.map(c => cell(p, c[0])).join('')}<td style="background:none;font-weight:700" class="num">${fa(p.records)}</td></tr>`).join('')}
      <tr><td class="p muted">${fa(B.empty.length)} استان دیگر</td><td colspan="8" class="empty-hatch" style="color:var(--muted);font-weight:500">${B.empty.map(p => p.fa).join('، ')}</td></tr></tbody></table>`;
  }

  function kanban() {
    const drafts = B.D.hoods.filter(h => h.status === 'پیش‌نویس').sort((a, b) => a.updated - b.updated).slice(0, 4);
    const ret = B.D.hoods.filter(h => h.status === 'برگشت برای اصلاح').slice(0, 4);
    const card = (h, x, meta) => `<a class="kcard" href="#d/hood/${h.id}"><b>محله ${h.n}</b><div class="meta">${U.av(x)}<span>${x.n}</span></div>${U.steps(h.steps)}<div class="meta">${meta}</div></a>`;
    U.$('#kanban').innerHTML = `
      <div class="kcol"><h4><span class="badge wait">${fa(B.queue.length)}</span>منتظر تأیید شما</h4>${B.queue.slice(0, 4).map(q => `<a class="kcard" href="#d/hood/${q.ref}"><b>${q.n}</b><div class="meta">${U.av(q.x)}<span>${q.x.n} · ${q.city}</span></div>${U.steps(q.steps)}<div class="meta">${ic('clock', 'sm')} ${fa(q.age)} روز در صف</div></a>`).join('')}</div>
      <div class="kcol"><h4><span class="badge">${fa(B.D.hoods.filter(h => h.status === 'پیش‌نویس').length)}</span>پیش‌نویس‌های قدیمی</h4>${drafts.map((h, i) => card(h, B.experts[(i * 3) % 20], `${ic('clock', 'sm')} آخرین تغییر ${U.rel(h.updated)}`)).join('')}</div>
      <div class="kcol"><h4><span class="badge warn">${fa(ret.length)}</span>برگشت‌خورده برای اصلاح</h4>${ret.map((h, i) => card(h, B.experts[(i * 5 + 2) % 20], `${ic('undo', 'sm')} منتظر اصلاح کارشناس`)).join('') || '<p class="lede">موردی نیست.</p>'}</div>`;
  }
  window.MB = { render, destroy() {} };
})();
