/* Atlas view: stock-heatmap style treemap. Size = records in the system, colour = 30-day change. Drill: provinces > cities > regions > neighbourhoods. */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M;
  const A = M.atlas = {};
  const LV = ['استان', 'شهر', 'منطقه', 'محله'];
  const RAMP_HOODS = 'linear-gradient(270deg,#E6EAF0,#9DD8EF,#4DABF7,#1E40AF)';
  let chart = null, path = [], sizeBy = 'value', colorBy = 'chg';
  // at the neighbourhood level every tile is one neighbourhood, so «تعداد محله» means nothing there
  const leaf = () => path.length >= 3;
  const sb = () => (leaf() ? 'value' : sizeBy), cb = () => (leaf() ? 'chg' : colorBy);
  const ramp = v => { // diverging, soft: orange (−) → neutral → teal (+)
    const stops = cb() === 'chg' ? [[-8, '#E8590C'], [-3, '#F7B267'], [0, '#E6EAF0'], [6, '#7FD6D4'], [14, '#1DB3B1'], [24, '#0A8F8D']] : [[0, '#E6EAF0'], [10, '#9DD8EF'], [25, '#4DABF7'], [46, '#1E40AF']];
    if (v <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cbb] = stops[i]; return mix(ca, cbb, (v - a) / (b - a)); }
    return stops[stops.length - 1][1];
  };
  function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  const lum = c => { const p = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255; };
  const size = n => (sb() === 'value' ? n.value : n.hoods);
  function nodes(list) {
    return list.map(n => {
      const col = ramp(cb() === 'chg' ? n.chg : n.hoods), dark = lum(col) < 0.62;
      return { name: n.name, value: size(n), raw: n, itemStyle: { color: col, borderColor: n.me ? '#1E40AF' : '#FFFFFF', borderWidth: n.me ? 3 : 2, gapWidth: 2 }, label: { color: dark ? '#FFFFFF' : '#1E293B' } };
    });
  }
  function cur() { let l = S.atlas; path.forEach(n => { l = n.children; }); return l; }
  function draw() {
    const list = cur(), tot = list.reduce((a, n) => a + size(n), 0);
    chart.setOption({
      tooltip: Object.assign({}, U.tipStyle, { formatter: p => { const n = p.data && p.data.raw; if (!n) return ''; const share = size(n) / tot * 100; return `<b style="font-size:13px">${U.esc(n.name)}</b><br>رکورد ثبت‌شده: <b>${U.fi(n.value)}</b>${n.children ? `<br>محله‌ها: <b>${U.fi(n.hoods)}</b>` : ''}<br>سهم از این سطح: <b>${U.fa(share, 1)}٪</b><br>تغییر ۳۰ روز: <b style="color:${n.chg >= 0 ? '#0A8F8D' : '#E8590C'}">${n.chg >= 0 ? '+' : '−'}${U.fa(Math.abs(n.chg), 1)}٪</b>${n.children ? '<br><span style="color:#7A8798">برای جزئیات کلیک کنید</span>' : n.me ? '<br><span style="color:#0A8F8D">کلیک: بازگشت به نقشه‌ی محله</span>' : ''}`; } }),
      series: [{
        type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, width: '100%', height: '100%', top: 0, left: 0, squareRatio: 0.9,
        data: nodes(list), animationDurationUpdate: 450,
        label: { show: true, fontFamily: 'Vazirmatn', overflow: 'truncate', formatter: p => { const n = p.data && p.data.raw; if (!n) return ''; return `{n|${n.name}}\n{v|${U.fi(size(n))}}  {c|${n.chg >= 0 ? '▲' : '▼'} ${U.fa(Math.abs(n.chg), 1)}٪}`; }, rich: { n: { fontSize: 13, fontWeight: 600, lineHeight: 20, fontFamily: 'Vazirmatn' }, v: { fontSize: 11.5, fontWeight: 500, fontFamily: 'Vazirmatn', opacity: .9 }, c: { fontSize: 11, fontWeight: 500, fontFamily: 'Vazirmatn' } }, position: 'insideTopRight', padding: [8, 10] },
        itemStyle: { borderRadius: 6 },
        emphasis: { itemStyle: { borderColor: '#0A9593', borderWidth: 3 } },
        levels: [{ itemStyle: { gapWidth: 3 } }]
      }]
    }, { replaceMerge: ['series'] });
    crumbs(); controls();
    const t = U.$('.atlas .ttl'); if (t) t.innerHTML = `${U.fi(list.length)} ${LV[Math.min(path.length, 3)]} · مجموع ${U.fi(list.reduce((a, n) => a + n.value, 0))} رکورد`;
  }
  function crumbs() {
    const el = U.$('.atlas .bc'); if (!el) return;
    const parts = [{ name: 'ایران', d: 0 }].concat(path.map((n, i) => ({ name: n.name, d: i + 1 })));
    el.innerHTML = parts.map((p, i) => (i ? U.ic('chevl', 'xs') : '') + `<button data-d="${p.d}" ${i === parts.length - 1 ? 'aria-current="true"' : ''}>${U.esc(p.name)}</button>`).join('');
  }
  function controls() {
    const lf = leaf();
    U.$$('.atlas [data-size]').forEach(x => { x.classList.toggle('on', x.dataset.size === sb()); x.disabled = lf && x.dataset.size === 'hoods'; });
    U.$$('.atlas [data-col]').forEach(x => { x.classList.toggle('on', x.dataset.col === cb()); x.disabled = lf && x.dataset.col === 'hoods'; });
    const chg = cb() === 'chg';
    const r = U.$('.atlas .al .ramp'); if (r) r.style.background = chg ? '' : RAMP_HOODS;
    const lo = U.$('.atlas .al .lo'), hi = U.$('.atlas .al .hi');
    if (lo) lo.textContent = chg ? 'کاهش' : 'کم'; if (hi) hi.textContent = chg ? 'افزایش' : 'زیاد';
    const sr = U.$('.atlas [data-sirous]'); if (sr) sr.hidden = path.length === 3 && path[2] === S.atlas[0].children[0].children[11];
  }
  A.init = function (el) {
    chart = U.chart(el, {});
    chart.on('click', p => {
      const n = p.data && p.data.raw; if (!n) return;
      if (n.children) { path.push(n); draw(); }
      else if (n.me) { M.setView('map'); M.home(); }
      else U.toast('داده‌ی نمونه فقط برای محله سیروس آماده شده است', 'info');
    });
    U.$('.atlas').addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (b) { path = path.slice(0, +b.dataset.d); draw(); return; }
      const s = e.target.closest('[data-size]'); if (s && !s.disabled) { sizeBy = s.dataset.size; draw(); return; }
      const c = e.target.closest('[data-col]'); if (c && !c.disabled) { colorBy = c.dataset.col; draw(); return; }
      if (e.target.closest('[data-sirous]')) { path = [S.atlas[0], S.atlas[0].children[0], S.atlas[0].children[0].children[11]]; draw(); }
    });
    draw();
  };
  A.show = () => { if (chart) requestAnimationFrame(() => chart.resize()); };
})();
