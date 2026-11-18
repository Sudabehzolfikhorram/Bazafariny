/* MODEL 3 · نقشه سه‌بعدی و زمان — tilted 3D map, prism height = records, time bar replays 8 months. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc } = U;
  const VW = 1200, VH = 780;
  let level = { k: 'country' }, month = 7, playing = null, cur = {}, popAt = null;

  function render() {
    U.topbar('نقشه سه‌بعدی و زمان', 'ارتفاع هر ستون = حجم داده‌ی ثبت‌شده · با نوار زمان، رشد ۸ ماه را ببینید');
    U.$('#page').innerHTML = `<div class="m3" style="display:flex;flex-direction:column;gap:20px">
      <section class="scene" id="scene" aria-label="نقشه سه‌بعدی">
        <svg class="iso" id="iso" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="hud kpis" id="kpis"></div>
        <div class="hud title3"><span class="eyebrow">مسیر</span><div class="crumb3" id="crumb3"></div><p class="lede" id="lede3" style="margin-top:6px"></p></div>
        <div class="hud levels3" id="levels3"></div>
        <div class="hud pop" id="pop" role="dialog" aria-live="polite"></div>
        <div class="hud time"><button class="play" id="play" aria-label="پخش">${ic('play', 'sm')}</button><div class="months" id="months"></div>
          <div style="min-width:120px"><small class="muted">تا پایان</small><div style="font-weight:800" id="mlabel"></div></div></div>
      </section>

      <div class="sec-title"><span class="n">۲</span><h2>پروژه‌ها روی خط زمان</h2><p>نوار روشن = کل دوره‌ی قرارداد؛ نوار پررنگ = پیشرفت واقعی؛ خط آبی = امروز</p></div>
      <section class="card pad gantt" id="gantt"></section>

      <div class="sec-title"><span class="n">۳</span><h2>ریتم کار کارشناسان</h2><p>هر روز چه نوع کاری انجام شده، و چه چیزی منتظر شماست</p></div>
      <section class="grid g-21">
        <div class="card pad"><div class="h2"><h2>کارهای ۳۰ روز اخیر</h2><div class="grow"></div></div>${U.legend([['ثبت', '#00ADAB'], ['ویرایش', '#7FD3D1'], ['ارسال برای تأیید', '#1E40AF'], ['اصلاح پس از برگشت', '#93A8E8']])}<div class="chart" id="rhythm" style="height:300px"></div></div>
        <div class="card pad"><div class="h2"><h2>نیاز به پیگیری</h2></div>${U.attention(5)}</div>
      </section>
      ${U.aiCard()}
    </div>`;
    U.$('#play').onclick = togglePlay;
    U.$('#scene').addEventListener('click', e => { if (!e.target.closest('.prov,.prism,.pop')) hidePop(); });
    draw(); gantt(); rhythm();
  }

  /* ---------- projection ---------- */
  function projector(rings, box) {
    let lat0 = 0, n = 0; rings.forEach(r => r.forEach(p => { lat0 += p[1]; n++; })); lat0 /= n;
    const k = Math.cos(lat0 * Math.PI / 180);
    const pl = ([lon, lat]) => [lon * k, -lat];
    const t = ([x, y]) => [x + y * 0.42, y * 0.56];
    const pts = rings.flat().map(p => t(pl(p)));
    const bb = U.bboxOf(pts); const s = Math.min((box[2] - box[0]) / (bb[2] - bb[0]), (box[3] - box[1]) / (bb[3] - bb[1]));
    const ox = box[0] + ((box[2] - box[0]) - (bb[2] - bb[0]) * s) / 2, oy = box[1] + ((box[3] - box[1]) - (bb[3] - bb[1]) * s) / 2;
    const P = p => { const q = t(pl(p)); return [ox + (q[0] - bb[0]) * s, oy + (q[1] - bb[1]) * s]; };
    P.planeScale = s; P.k = k; P.pl = pl; P.t = t; P.bb = bb; P.ox = ox; P.oy = oy;
    P.fromPlane = ([x, y]) => { const q = t([x, y]); return [ox + (q[0] - bb[0]) * s, oy + (q[1] - bb[1]) * s]; };
    return P;
  }
  const path = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';

  /* blocks for current level */
  function blocks() {
    if (level.k === 'country') return B.provs.map(p => ({ id: p.id, n: p.short, full: p.fa, rings: U.ringsOf(p.feature), has: p.has, series: p.cum, sub: `${fa(p.hoods)} محله · ${fa(p.props)} ملک`, go: p.has ? () => { level = { k: 'prov', id: p.id }; draw(); } : null, detail: `#d/prov/${p.id}`, p }));
    if (level.k === 'prov') { const pv = B.provBy[level.id]; const cs = B.D.cities.filter(c => c.p === level.id); const tot = cs.reduce((a, c) => a + c.hoods + c.props, 0) || 1;
      return [{ id: '_base', n: '', rings: U.ringsOf(pv.feature), has: true, base: true }].concat(cs.map(c => ({ id: c.id, n: c.n, full: 'شهر ' + c.n, rings: [c.b.map(([a, b]) => [b, a])], has: true, series: pv.cum.map(v => Math.round(v * (c.hoods + c.props) / tot)), sub: `${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک`, go: () => { level = { k: 'city', id: c.id, prov: level.id }; draw(); }, detail: `#d/city/${c.id}` }))); }
    const c = B.cityBy[level.id]; const pv = B.provBy[c.p]; const hs = B.D.hoods.filter(h => h.city === c.id); const tot = hs.reduce((a, h) => a + h.props + h.streets + 1, 0) || 1;
    return [{ id: '_base', n: '', rings: [c.b.map(([a, b]) => [b, a])], has: true, base: true }].concat(hs.map(h => ({ id: h.id, n: h.n, full: 'محله ' + h.n, rings: [h.b.map(([a, b]) => [b, a])], has: true, series: pv.cum.map(v => Math.round(v * (h.props + h.streets + 1) / tot * (pv.cum[7] ? 1 : 0))), sub: `${h.status} · ${fa(h.props)} ملک · ${fa(h.streets)} معبر`, go: null, detail: `#d/hood/${h.id}`, h })));
  }

  function draw() {
    hidePop();
    const bl = blocks(); const P = projector(bl.map(b => b.rings).flat(), [60, 150, VW - 60, VH - 150]);
    const T = level.k === 'country' ? 14 : 10;
    const mx = Math.max(1, ...bl.filter(b => b.series).map(b => b.series[7]));
    const H = level.k === 'country' ? 230 : 190;
    let defs = `<defs><pattern id="h3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#F8FAFC"/><line x1="0" y1="0" x2="0" y2="6" stroke="#E2E8F0" stroke-width="2"/></pattern>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33BEBC"/><stop offset="1" stop-color="#00ADAB"/></linearGradient></defs>`;
    let sides = '', tops = '', prisms = [], labels = '';
    bl.forEach(b => {
      const proj = b.rings.map(r => r.map(P));
      const fillTop = b.base ? '#FFFFFF' : !b.has ? 'url(#h3)' : level.k === 'country' ? '#FFFFFF' : '#F1F5F9';
      const sideCol = b.base ? '#CBD5E1' : '#E2E8F0';
      const th = b.base ? T + 6 : (level.k === 'country' ? T : 5);
      sides += proj.map(r => `<path d="${path(r.map(([x, y]) => [x, y + th]))}" fill="${sideCol}"/>`).join('');
      tops += `<g class="${b.base ? '' : 'prov'}" data-id="${b.id}">${proj.map(r => `<path class="topf" d="${path(r)}" fill="${fillTop}" stroke="${b.base ? '#94A3B8' : '#CBD5E1'}" stroke-width="${b.base ? 1.2 : .8}"/>`).join('')}</g>`;
      if (b.base || !b.series) return;
      const big = b.rings.sort((a, c) => c.length - a.length)[0]; const cc = U.centroid(big);
      const pc = P.pl(cc);
      const w = level.k === 'country' ? 0.34 : (P.bb[2] - P.bb[0]) / 60;
      prisms.push({ b, pc, w, sy: P(cc)[1] });
      if (level.k !== 'country' || b.has) { const lp = P(cc); labels += `<text class="lab" x="${lp[0]}" y="${lp[1] + 18}" text-anchor="middle">${esc(b.n)}</text>`; }
    });
    prisms.sort((a, c) => a.sy - c.sy);
    cur = { P, prisms, mx, H, bl };
    U.$('#iso').innerHTML = defs + `<g>${sides}</g><g>${tops}</g><g id="labs">${labels}</g><g id="prisms"></g>`;
    U.$$('#iso .prov').forEach(g => { const b = bl.find(x => x.id === g.dataset.id); if (!b) return;
      g.addEventListener('mousemove', e => U.tip(e, `<b>${b.full}</b><br>${b.has ? fa(b.series[month]) + ' رکورد تا پایان ' + B.MONTHS[month] : 'هنوز داده‌ای ثبت نشده'}`));
      g.addEventListener('mouseleave', () => U.tip(null));
      g.addEventListener('click', e => showPop(b, e)); });
    paintPrisms(month, true);
    hud(); months(); crumb(); levels();
  }

  function prismSvg(pr, h) {
    const { P } = cur; const [x, y] = pr.pc, w = pr.w;
    const A = P.fromPlane([x - w, y - w]), Bq = P.fromPlane([x + w, y - w]), C = P.fromPlane([x + w, y + w]), Dq = P.fromPlane([x - w, y + w]);
    const up = p => [p[0], p[1] - h];
    const face = (pts, f) => `<path d="${path(pts)}" fill="${f}"/>`;
    const late = pr.b.p && pr.b.p.pending > 6;
    const cTop = 'url(#gTop)', cS = '#007C7A', cE = '#006866', cW = '#00A3A1';
    return `<g class="prism" data-id="${pr.b.id}">${face([A, Bq, up(Bq), up(A)], cS)}${face([A, Dq, up(Dq), up(A)], cW)}${face([Bq, C, up(C), up(Bq)], cE)}${face([Dq, C, up(C), up(Dq)], cS)}<path class="pt" d="${path([up(A), up(Bq), up(C), up(Dq)])}" fill="${cTop}"/>
      ${h > 18 ? `<text class="val" x="${(up(A)[0] + up(C)[0]) / 2}" y="${up(A)[1] - 6}" text-anchor="middle">${fa(pr.v)}</text>` : ''}</g>`;
  }
  function paintPrisms(m, instant) {
    const { prisms, mx, H } = cur; const from = prisms.map(p => p.h || 0); const to = prisms.map(p => p.b.series[m] / mx * H);
    const dur = instant ? 0 : 520; const t0 = performance.now();
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3);
      U.$('#prisms').innerHTML = prisms.map((p, i) => { p.h = from[i] + (to[i] - from[i]) * e; p.v = Math.round(p.b.series[m]); return p.h > 0.5 ? prismSvg(p, p.h) : ''; }).join('');
      if (k < 1) requestAnimationFrame(step); else bindPrisms(); };
    requestAnimationFrame(step);
  }
  function bindPrisms() { U.$$('#prisms .prism').forEach(g => { const pr = cur.prisms.find(p => p.b.id === g.dataset.id); g.addEventListener('click', e => showPop(pr.b, e)); g.addEventListener('mousemove', e => U.tip(e, `<b>${pr.b.full}</b><br>${fa(pr.b.series[month])} رکورد تا پایان ${B.MONTHS[month]}`)); g.addEventListener('mouseleave', () => U.tip(null)); }); }

  function showPop(b, e) {
    e.stopPropagation(); U.tip(null);
    const pop = U.$('#pop'), sc = U.$('#scene').getBoundingClientRect();
    const s = b.series || [], gain = s[month] - (s[month - 1] || 0);
    pop.innerHTML = `<span class="eyebrow">${level.k === 'country' ? 'استان' : level.k === 'prov' ? 'شهر' : 'محله'}</span><h3>${b.full}</h3>
      ${b.has ? `<p class="lede">${b.sub}</p><div style="display:flex;gap:18px;margin:12px 0"><div class="k"><span class="v num" style="font-size:22px">${fa(s[month])}</span><span class="l">رکورد تا ${B.MONTHS[month]}</span></div><div class="k"><span class="v num" style="font-size:22px">+${fa(gain)}</span><span class="l">در همین ماه</span></div></div>
        ${b.p ? `<div class="mini-h">کامل‌بودن<span class="grow"></span><b>${pct(b.p.completeness)}</b></div><div class="bar" style="margin-bottom:12px"><i style="width:${b.p.completeness}%"></i></div>` : ''}
        <div style="display:flex;gap:8px">${b.go ? `<button class="btn pri sm" id="popGo" style="flex:1">${ic('target', 'sm')} ورود به ${level.k === 'country' ? 'استان' : 'شهر'}</button>` : ''}<a class="btn ghost sm" href="${b.detail}" style="flex:1">${ic('eye', 'sm')} صفحه‌ی کامل</a></div>`
        : `<p class="lede">هنوز داده‌ای ثبت نشده.</p><button class="btn pri sm" onclick="UI.toast('فرم «ایجاد شهر» باز می‌شود')">${ic('plus', 'sm')} تعریف شهر</button>`}`;
    pop.classList.add('on');
    let x = e.clientX - sc.left + 16, y = e.clientY - sc.top - 40;
    x = Math.min(sc.width - 316, Math.max(12, x)); y = Math.min(sc.height - pop.offsetHeight - 110, Math.max(100, y));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
    const g = U.$('#popGo'); if (g) g.onclick = () => b.go();
  }
  function hidePop() { const p = U.$('#pop'); if (p) p.classList.remove('on'); }

  function hud() {
    const tot = B.provs.reduce((a, p) => a + p.cum[month], 0), m = B.totals.monthly[month], prev = B.totals.monthly[month - 1] || 0;
    const active = B.provs.filter(p => p.cum[month] > 0).length;
    let scope = 'کل کشور', sc = tot;
    if (level.k !== 'country') { const pv = B.provBy[level.k === 'prov' ? level.id : B.cityBy[level.id].p]; scope = level.k === 'prov' ? pv.fa : 'شهر ' + B.cityBy[level.id].n; sc = cur.prisms.reduce((a, p) => a + p.b.series[month], 0); }
    U.$('#kpis').innerHTML = `<div class="k"><span class="v num">${fa(sc)}</span><span class="l">رکورد در ${scope}</span></div>
      <div class="k"><span class="v num">+${fa(m)}</span><span class="l">ثبت در ${B.MONTHS[month]} ${prev ? `<span class="delta ${m < prev ? 'down' : ''}">${U.spct((m / prev - 1) * 100)}</span>` : ''}</span></div>
      <div class="k"><span class="v num">${fa(active)}<small style="font-size:14px;color:var(--faint)">/۳۱</small></span><span class="l">استان فعال</span></div>`;
    U.$('#mlabel').textContent = B.MONTHS[month] + ' ۱۴۰۵';
    U.$('#lede3').textContent = level.k === 'country' ? 'روی هر ستون بزنید تا وارد استان شوید.' : level.k === 'prov' ? 'ستون‌ها شهرهای این استان‌اند. روی هر کدام بزنید تا محله‌ها را ببینید.' : 'ستون‌ها محله‌های این شهرند؛ ارتفاع = ملک و معبر ثبت‌شده.';
  }
  function months() {
    const mx = Math.max(...B.totals.monthly);
    U.$('#months').innerHTML = B.MONTHS.map((n, i) => `<button class="${i === month ? 'on' : i < month ? 'past' : ''}" data-i="${i}" aria-label="${n}"><i style="height:${8 + B.totals.monthly[i] / mx * 30}px"></i>${n}</button>`).join('');
    U.$$('#months button').forEach(b => b.onclick = () => { stop(); setMonth(+b.dataset.i); });
  }
  function setMonth(m) { month = m; paintPrisms(m); hud(); months(); hidePop(); }
  function togglePlay() { if (playing) return stop(); if (month === 7) setMonth(0); U.$('#play').innerHTML = ic('pause', 'sm'); playing = setInterval(() => { if (month >= 7) return stop(); setMonth(month + 1); }, 900); }
  function stop() { clearInterval(playing); playing = null; const p = U.$('#play'); if (p) p.innerHTML = ic('play', 'sm'); }
  function crumb() {
    const parts = [{ n: 'ایران', l: { k: 'country' } }];
    if (level.k === 'prov') parts.push({ n: B.provBy[level.id].fa });
    if (level.k === 'city') { const c = B.cityBy[level.id]; parts.push({ n: B.provBy[c.p].fa, l: { k: 'prov', id: c.p } }, { n: 'شهر ' + c.n }); }
    U.$('#crumb3').innerHTML = parts.map((p, i) => p.l && i < parts.length - 1 ? `<button class="btn link sm" data-i="${i}">${p.n}</button><span class="faint">›</span>` : `<b>${p.n}</b>`).join('');
    U.$$('#crumb3 button').forEach(b => b.onclick = () => { level = parts[+b.dataset.i].l; draw(); });
  }
  function levels() {
    const top = cur.prisms.filter(p => p.b.series[7] > 0).sort((a, b) => b.b.series[month] - a.b.series[month]).slice(0, 5);
    U.$('#levels3').innerHTML = `<div class="lab">بیشترین تا ${B.MONTHS[month]}</div>` + top.map((p, i) => `<button class="layer" data-id="${p.b.id}"><b class="num" style="width:16px;color:var(--faint)">${fa(i + 1)}</b>${p.b.full.replace(/^(شهر|محله) /, '')}<span class="cnt">${fa(p.b.series[month])}</span></button>`).join('');
    U.$$('#levels3 [data-id]').forEach(b => b.onclick = e => showPop(cur.prisms.find(p => p.b.id === b.dataset.id).b, e));
  }

  function gantt() {
    const ps = B.projects; const lo = Math.min(...ps.map(p => p.startM)), hi = Math.max(...ps.map(p => p.endM)); const span = hi - lo;
    const x = m => (m - lo) / span * 100;
    U.$('#gantt').innerHTML = `<div class="axis"><div></div><div>${[lo, Math.round(lo + span / 3), Math.round(lo + 2 * span / 3), hi].map(m => `<span>${m === 0 ? 'امروز' : m < 0 ? fa(-m) + ' ماه پیش' : fa(m) + ' ماه بعد'}</span>`).join('')}</div><div></div></div>
      ${ps.map(p => `<button class="gr" onclick="location.hash='#d/project/${p.id}'"><span class="t"><b style="font-size:13px">${p.n}</b><br><small class="muted">${p.type} · ${p.city}</small></span>
        <div class="lane"><div class="span ${p.gap < -10 ? 'late' : ''}" style="right:${x(p.startM)}%;width:${x(p.endM) - x(p.startM)}%"><i style="width:${p.pr}%"></i></div><div class="today" style="right:${x(0)}%"></div></div>
        <span class="num" style="text-align:left"><b>${pct(p.pr)}</b><br><small style="color:${p.gap < -10 ? 'var(--warn)' : 'var(--muted)'}">${p.gap < -10 ? pct(-p.gap) + ' عقب' : 'طبق برنامه'}</small></span></button>`).join('')}`;
  }
  function rhythm() {
    const days = 30; const idx = [...Array(days).keys()];
    const total = idx.map(d => B.experts.reduce((a, x) => a + x.days[84 - days + d], 0));
    const share = [['ثبت', .52, '#00ADAB'], ['ویرایش', .24, '#7FD3D1'], ['ارسال برای تأیید', .14, '#1E40AF'], ['اصلاح پس از برگشت', .10, '#93A8E8']];
    const labels = idx.map(d => U.faDate(new Date(B.TODAY - (days - 1 - d) * B.DAY), { day: 'numeric', month: 'short' }));
    U.chart(U.$('#rhythm'), { grid: { left: 8, right: 40, top: 12, bottom: 28 }, tooltip: { trigger: 'axis', valueFormatter: v => fa(v) }, legend: { show: false },
      xAxis: { type: 'category', inverse: true, data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#94A3B8', fontSize: 10.5, interval: 4 } },
      yAxis: { position: 'right', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#94A3B8', formatter: v => fa(v) } },
      series: share.map(([n, s, c], i) => ({ name: n, type: 'bar', stack: 'r', barWidth: '62%', itemStyle: { color: c, borderRadius: i === 3 ? [3, 3, 0, 0] : 0 }, data: total.map(t => Math.round(t * s)) })) });
  }
  window.M3 = { render, destroy: () => { stop(); level = { k: 'country' }; month = 7; } };
})();
