/* Neighbourhood regeneration indicators (from the «پایش محلات ناکارآمد» reference dashboards):
   type of inefficiency, building condition, per-capita services vs norm, hazard exposure, income tiers, actions.
   Values are generated deterministically per neighbourhood until the system stores them. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, esc, ic } = U;
  let seed = 7310; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  /* soft semantic gradients: never flat, never black */
  const G = {
    teal: ['#63D3D1', '#0CA5A3'], blue: ['#9DB2FF', '#4C6EF5'], sky: ['#A5D8FF', '#4DABF7'], amber: ['#FFE08A', '#F59F00'],
    orange: ['#FFC08A', '#F76707'], red: ['#FFB3B3', '#E03131'], green: ['#B2F2BB', '#2F9E44'], violet: ['#C5CDF5', '#6E7FD8'], slate: ['#DCE3EC', '#94A3B8']
  };
  const grad = (k, dir = '90deg') => `linear-gradient(${dir},${G[k][0]},${G[k][1]})`;
  const solid = k => G[k][1];

  const TYPES = [['فرسوده', 'بافت فرسوده', 'amber'], ['غیررسمی', 'سکونتگاه غیررسمی', 'blue'], ['مخاطره', 'در معرض مخاطره', 'red']];
  const COND = [['نوساز', 'teal'], ['استاندارد', 'blue'], ['کم‌دوام', 'amber'], ['مخروبه', 'red']];
  const SERV = [['آموزشی', 'education', 1.9, 'blue'], ['درمانی', 'health', .6, 'sky'], ['ورزشی', 'sport', .9, 'orange'], ['فضای سبز', 'green', 7, 'green'], ['فرهنگی', 'culture', .5, 'violet']];
  const HAZ = [['حریم گسل', 'red'], ['حریم رودخانه و مسیل', 'sky'], ['ناپایداری شیب', 'amber'], ['حریم خطوط نیرو', 'violet']];
  const INC = [['دهک ۱ تا ۳ (زیر خط فقر)', 'red'], ['دهک ۴ و ۵', 'amber'], ['دهک ۶ و ۷', 'blue'], ['دهک ۸ به بالا', 'teal']];
  const ACT = [['ایجاد دیواره و ساماندهی بستر رودخانه', 'حریم رودخانه'], ['تقویت و پایدارسازی شیب‌های بحرانی', 'بخش شرقی محله'], ['بهسازی و مقاوم‌سازی ساختمان‌های ناپایدار', 'بافت مسکونی'],
    ['احداث مسیر دسترسی اضطراری', 'شمال محله'], ['آزادسازی و ساخت فضای سبز محله‌ای', 'مرکز محله'], ['احداث مرکز محله و کتابخانه', 'ضلع غربی'], ['ساماندهی بازارچه و کسب‌وکار خرد', 'محور اصلی'], ['نوسازی شبکه‌ی معابر زیر ۶ متر', 'کل محله']];
  const STAT = [['در حال اجرا', 'teal'], ['مطالعات', 'blue'], ['آماده‌ی اجرا', 'amber'], ['متوقف', 'red']];
  const PRIO = { 'فرسوده': ['نوسازی و مقاوم‌سازی', 'بهسازی معابر', 'ارتقای خدمات محله‌ای'], 'غیررسمی': ['توانمندسازی اجتماعی و اقتصادی', 'بهسازی عملکردی', 'نوسازی و مقاوم‌سازی'], 'مخاطره': ['کاهش خطر و جابه‌جایی از حریم', 'پایدارسازی زمین', 'ایجاد دسترسی اضطراری'] };

  B.D.hoods.forEach((h, i) => {
    seed = 7310 + i * 131;
    const t = rnd(); h.type = t < .5 ? 'فرسوده' : t < .8 ? 'غیررسمی' : 'مخاطره';
    h.area = Math.round((25 + rnd() * 150) * 10) / 10;
    h.hh = Math.round(h.pop / (3.1 + rnd() * .6)); h.units = Math.round(h.hh * (0.82 + rnd() * .12));
    const base = h.type === 'فرسوده' ? [10, 30, 42, 18] : h.type === 'غیررسمی' ? [8, 22, 48, 22] : [16, 38, 34, 12];
    let c = base.map(v => Math.max(3, v + ri(-6, 6))); const s = c.reduce((a, b) => a + b, 0); c = c.map(v => v / s * 100);
    h.cond = c; h.unstable = Math.round(h.units * (c[2] + c[3]) / 100); h.renewed = Math.round(h.units * c[0] / 100);
    h.capacity = Math.round(h.unstable * (0.35 + rnd() * .3));
    h.serv = SERV.map(([, , norm]) => { const v = norm * (0.45 + rnd() * 1.25); return { v: Math.round(v * 100) / 100, city: Math.round(norm * (0.9 + rnd() * .5) * 100) / 100, norm }; });
    h.haz = h.type === 'مخاطره' ? [ri(8, 28), ri(10, 34), ri(6, 22), ri(3, 12)] : [ri(0, 6), ri(0, 8), ri(0, 6), ri(0, 4)];
    const inc = h.type === 'غیررسمی' ? [46, 28, 18, 8] : h.type === 'فرسوده' ? [34, 30, 24, 12] : [30, 30, 26, 14];
    let ic2 = inc.map(v => Math.max(2, v + ri(-5, 5))); const si = ic2.reduce((a, b) => a + b, 0); h.inc = ic2.map(v => v / si * 100);
    h.prio = PRIO[h.type];
    h.acts = [...Array(ri(3, 6)).keys()].map(k => { const a = ACT[(i * 3 + k * 5) % ACT.length]; const y = 1404 + ri(0, 1);
      return { n: a[0], at: a[1], from: y, to: y + ri(1, 3), budget: ri(8, 48) * 10, st: STAT[(i + k * 2) % 7 < 3 ? 0 : (i + k) % 4][0] }; });
  });

  /* ---------- aggregation for any scope ---------- */
  function agg(hoods) {
    const sum = f => hoods.reduce((a, h) => a + f(h), 0); const n = hoods.length || 1;
    const units = sum(h => h.units);
    return {
      n: hoods.length, pop: sum(h => h.pop), hh: sum(h => h.hh), units, area: sum(h => h.area), unstable: sum(h => h.unstable), renewed: sum(h => h.renewed), capacity: sum(h => h.capacity),
      types: TYPES.map(([k]) => hoods.filter(h => h.type === k).length),
      cond: COND.map((_, j) => units ? sum(h => h.units * h.cond[j] / 100) / units * 100 : 0),
      serv: SERV.map((_, j) => ({ v: sum(h => h.serv[j].v) / n, norm: SERV[j][2], short: hoods.filter(h => h.serv[j].v < h.serv[j].norm).length })),
      haz: HAZ.map((_, j) => sum(h => h.area * h.haz[j] / 100)),
      acts: hoods.flatMap(h => h.acts.map(a => Object.assign({ h }, a))),
    };
  }

  /* ---------- small chart primitives (HTML/CSS, gradients) ---------- */
  const stack = (parts, h = 14) => `<div class="stk" style="height:${h}px">${parts.filter(p => p[1] > 0).map(([lab, v, k]) => `<i style="flex:${v};background:${grad(k)}" title="${lab}: ${pct(v)}"></i>`).join('')}</div>`;
  const keyRow = parts => `<div class="lgd2">${parts.map(([lab, v, k, extra]) => `<span><i style="background:${grad(k)}"></i>${lab}<b class="num">${extra != null ? extra : pct(v)}</b></span>`).join('')}</div>`;
  /* dumbbell-ish: bar = value, tick = norm; red tint when short */
  /* rows: [label, value, norm, colourKey, note]; bar width = value/norm (tick at the norm) */
  function servRows(rows) {
    const max = 1.7, W = x => Math.min(100, x / max * 100);
    return `<div class="srv">${rows.map(([lab, v, norm, k, note]) => { const short = v < norm * .98;
      return `<div class="sr"><span class="l">${lab}</span><div class="tr"><i class="b" style="width:${W(v / norm)}%;background:${grad(short ? 'red' : k)}"></i><i class="n" style="right:${W(1)}%" title="معیار ${fa(norm)}"></i></div>
        <b class="num ${short ? 'neg' : ''}">${fa(Math.round(v * 100) / 100)}</b><small class="${short ? 'neg' : 'muted'}">${note || (short ? 'کمبود' : 'مناسب')}</small></div>`; }).join('')}</div>`;
  }
  const kpiStrip = items => `<div class="kstrip2">${items.map(([l, v, s, tone]) => `<div class="k ${tone || ''}"><span class="v num">${v}</span><span class="l">${l}</span>${s ? `<small>${s}</small>` : ''}</div>`).join('')}</div>`;

  /* ---------- section under the map (follows map scope) ---------- */
  function renewSection(hoods, scopeName) {
    const a = agg(hoods);
    if (!a.n) return `<div class="card pad empty-hatch" style="text-align:center"><b>در ${scopeName} هنوز محله‌ای ثبت نشده</b><p class="lede">شاخص‌های محلات پس از ثبت اولین محله این‌جا نمایش داده می‌شوند.</p></div>`;
        const bud = STAT.map(([s, k]) => [s, a.acts.filter(x => x.st === s).reduce((t, x) => t + x.budget, 0), k]); const budT = bud.reduce((t, x) => t + x[1], 0) || 1;
    const hazT = a.haz.reduce((t, v) => t + v, 0);
    const worst = [...hoods].sort((x, y) => (y.cond[2] + y.cond[3]) - (x.cond[2] + x.cond[3])).slice(0, 5);
    return `
      ${kpiStrip([['محله‌ی هدف', fa(a.n)], ['جمعیت', fa(a.pop)], ['خانوار', fa(a.hh)], ['واحد مسکونی', fa(a.units)], ['واحد ناپایدار', fa(a.unstable), pct(a.unstable / a.units * 100) + ' از واحدها', 'bad'], ['واحد نوساز', fa(a.renewed), pct(a.renewed / a.units * 100), 'good'], ['ظرفیت نوسازی', fa(a.capacity), 'واحد']])}
      <div class="rn-grid">
        <div class="card pad"><div class="h2"><h2>نوع ناکارآمدی</h2><div class="grow"></div><small class="muted">${fa(a.n)} محله</small></div>
          ${stack(TYPES.map(([k, lab, c], j) => [lab, a.types[j], c]), 16)}
          ${keyRow(TYPES.map(([k, lab, c], j) => [lab, a.types[j], c, fa(a.types[j])]))}
          <div class="mini-h" style="margin-top:14px">وضعیت ابنیه<span class="grow"></span><small class="muted">سهم از واحدهای مسکونی</small></div>
          ${stack(COND.map(([lab, k], j) => [lab, a.cond[j], k]), 16)}${keyRow(COND.map(([lab, k], j) => [lab, a.cond[j], k]))}</div>
        <div class="card pad"><div class="h2"><h2>سرانه‌ی خدمات</h2><div class="grow"></div><small class="muted">مترمربع برای هر نفر · خط عمودی = معیار</small></div>
          ${servRows(SERV.map(([lab, , norm, k], j) => [lab, a.serv[j].v, norm, k, a.serv[j].short ? `${fa(a.serv[j].short)} محله کمبود` : 'بدون کمبود']))}
          <p class="lede" style="margin-top:auto;padding-top:10px">عدد، میانگین سرانه‌ی محلات است و خط آبی معیار شورای عالی. نوار قرمز یعنی میانگین زیر معیار است.</p></div>
        <div class="card pad"><div class="h2"><h2>در معرض مخاطرات</h2><div class="grow"></div><small class="muted">${fa(Math.round(hazT))} هکتار</small></div>
          <div class="hz">${HAZ.map(([lab, k], j) => `<div class="hr"><span>${lab}</span><div class="tr"><i style="width:${hazT ? a.haz[j] / Math.max(...a.haz) * 100 : 0}%;background:${grad(k)}"></i></div><b class="num">${fa(Math.round(a.haz[j]))}</b><small class="muted">${pct(a.haz[j] / a.area * 100)}</small></div>`).join('')}</div>
          <div class="mini-h" style="margin-top:14px">اعتبار اقدامات<span class="grow"></span><small class="muted">${fa(budT)} میلیارد ریال</small></div>
          ${stack(bud.map(([s, v, k]) => [s, v / budT * 100, k]), 16)}${keyRow(bud.map(([s, v, k]) => [s, v / budT * 100, k, fa(v)]))}</div>
      </div>
      <div class="card pad wcard"><div class="h2"><h2>محلاتی که بیشترین ابنیه‌ی ناپایدار را دارند</h2><div class="grow"></div><small class="muted">برای دیدن پرونده روی هر ردیف بزنید</small></div>
        <div class="wtab">${worst.map(h => { const c = B.cityBy[h.city] || {}; return `<a class="wr" href="#d/hood/${h.id}"><span class="t"><b>محله ${h.n}</b><small>${c.n || ''} · ${TYPES.find(t => t[0] === h.type)[1]}</small></span>
          ${stack(COND.map(([lab, k], j) => [lab, h.cond[j], k]), 10)}<b class="num neg">${pct(h.cond[2] + h.cond[3])}</b><small class="muted">${fa(h.unstable)} واحد</small></a>`; }).join('')}</div></div>`;
  }

  /* ---------- hood: side panel block ---------- */
  function hoodPanel(h) {
    return `<div><div class="mini-h">وضعیت ابنیه<span class="grow"></span><span class="tchip t-${h.type}">${TYPES.find(t => t[0] === h.type)[1]}</span></div>${stack(COND.map(([lab, k], j) => [lab, h.cond[j], k]), 12)}${keyRow(COND.map(([lab, k], j) => [lab, h.cond[j], k]))}</div>
      <div><div class="mini-h">سرانه در برابر معیار<span class="grow"></span><small class="muted">م‌م برای هر نفر</small></div>${servRows(SERV.map(([lab, , , k], j) => [lab, h.serv[j].v, h.serv[j].norm, k]))}</div>`;
  }

  /* ---------- hood: detail page sections ---------- */
  function hoodDetail(h) {
    const T = TYPES.find(t => t[0] === h.type);
    const acts = h.acts; const budT = acts.reduce((a, x) => a + x.budget, 0);
    const stc = s => STAT.find(x => x[0] === s)[1];
    return `
      ${kpiStrip([['مساحت', fa(h.area), 'هکتار'], ['جمعیت', fa(h.pop), 'نفر'], ['خانوار', fa(h.hh)], ['واحد مسکونی', fa(h.units)], ['واحد ناپایدار', fa(h.unstable), pct(h.unstable / h.units * 100), 'bad'], ['واحد نوساز', fa(h.renewed), pct(h.renewed / h.units * 100), 'good'], ['تراکم جمعیت', fa(Math.round(h.pop / h.area)), 'نفر در هکتار']])}
      <div class="rn-grid">
        <div class="card pad"><div class="h2"><h2>وضعیت پایداری مسکن</h2><div class="grow"></div><span class="tchip t-${h.type}">${T[1]}</span></div>
          <div class="donut-wrap"><div class="chart" id="dCond" style="height:200px"></div><div class="dl">${COND.map(([lab, k], j) => `<span><i style="background:${grad(k)}"></i>${lab}<b class="num">${pct(h.cond[j])}</b></span>`).join('')}</div></div></div>
        <div class="card pad"><div class="h2"><h2>مقایسه‌ی سرانه‌ی خدمات</h2><div class="grow"></div><small class="muted">مترمربع برای هر نفر</small></div><div class="lgd2"><span><i style="background:${grad('teal')}"></i>محله</span><span><i style="background:${grad('blue')}"></i>میانگین شهر</span><span><i style="background:#F59F00;border-radius:50%"></i>معیار</span><span><i style="background:${grad('red')}"></i>زیر معیار</span></div><div class="chart" id="dServ" style="height:210px"></div></div>
        <div class="card pad"><div class="h2"><h2>توزیع درآمد خانوارها</h2><div class="grow"></div><small class="muted">${fa(h.hh)} خانوار</small></div>
          ${stack(INC.map(([lab, k], j) => [lab, h.inc[j], k]), 16)}<div class="hz" style="margin-top:12px">${INC.map(([lab, k], j) => `<div class="hr"><span>${lab}</span><div class="tr"><i style="width:${h.inc[j] / Math.max(...h.inc) * 100}%;background:${grad(k)}"></i></div><b class="num">${pct(h.inc[j])}</b><small class="muted">${fa(Math.round(h.hh * h.inc[j] / 100))}</small></div>`).join('')}</div>
          <div class="mini-h" style="margin-top:14px">در معرض مخاطرات<span class="grow"></span><small class="muted">درصد مساحت محله</small></div>
          <div class="hz">${HAZ.map(([lab, k], j) => `<div class="hr"><span>${lab}</span><div class="tr"><i style="width:${Math.max(2, h.haz[j] / 35 * 100)}%;background:${grad(k)}"></i></div><b class="num">${pct(h.haz[j])}</b><small class="muted">${fa(Math.round(h.area * h.haz[j] / 100))} هکتار</small></div>`).join('')}</div></div>
      </div>
      <div class="grid g-12">
        <div class="card pad"><div class="h2"><h2>اولویت رویکرد مداخله</h2></div><div class="prio">${h.prio.map((p, i) => `<div class="pi"><span class="pn">${fa(i + 1)}</span><b>${p}</b></div>`).join('')}</div>
          <div class="mini-h" style="margin-top:16px">ظرفیت نوسازی</div><div class="cap"><b class="num">${fa(h.capacity)}</b><span>واحد از ${fa(h.unstable)} واحد ناپایدار</span></div>${stack([['ظرفیت', h.capacity / h.unstable * 100, 'teal'], ['باقی', 100 - h.capacity / h.unstable * 100, 'slate']], 10)}</div>
        <div class="card pad"><div class="h2"><h2>اقدامات و پروژه‌های جاری</h2><div class="grow"></div><small class="muted">${fa(acts.length)} اقدام · ${fa(budT)} میلیارد ریال</small></div>
          <div class="atab"><div class="ah"><span>اقدام</span><span>موقعیت</span><span>زمان‌بندی</span><span>اعتبار</span><span>وضعیت</span></div>
          ${acts.map(a => `<div class="ar"><b>${a.n}</b><span>${a.at}</span><span class="num">${fa(a.from)}–${fa(a.to)}</span><span class="num">${fa(a.budget)}</span><span><span class="sbadge" style="--g:${grad(stc(a.st))};--c:${solid(stc(a.st))}">${a.st}</span></span></div>`).join('')}</div></div>
      </div>`;
  }
  function hoodDetailCharts(h) {
    const ech = window.echarts; const lg = (k) => new ech.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: G[k][0] }, { offset: 1, color: G[k][1] }]);
    const lgv = (k) => new ech.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: G[k][0] }, { offset: 1, color: G[k][1] }]);
    U.chart(U.$('#dCond'), { tooltip: { trigger: 'item', valueFormatter: v => pct(v) }, series: [{ type: 'pie', radius: ['58%', '86%'], padAngle: 2, itemStyle: { borderRadius: 6 }, label: { show: true, position: 'center', formatter: () => `${pct(h.cond[2] + h.cond[3])}\nناپایدار`, fontFamily: 'Vazirmatn', fontSize: 15, fontWeight: 800, color: '#1C2B45', lineHeight: 22 },
      data: COND.map(([lab, k], j) => ({ name: lab, value: Math.round(h.cond[j] * 10) / 10, itemStyle: { color: lg(k) } })) }] });
    U.chart(U.$('#dServ'), { grid: { left: 8, right: 8, top: 14, bottom: 8, containLabel: true }, tooltip: { trigger: 'axis', valueFormatter: v => fa(v) },
      legend: { show: false },
      xAxis: { type: 'category', inverse: true, data: SERV.map(s => s[0]), axisTick: { show: false }, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#3B4A63', fontFamily: 'Vazirmatn' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF2F6' } }, axisLabel: { color: '#94A3B8', formatter: v => fa(v) } },
      series: [
        { name: 'محله', type: 'bar', barWidth: 14, itemStyle: { borderRadius: [5, 5, 0, 0], color: p => lgv(h.serv[p.dataIndex].v < h.serv[p.dataIndex].norm ? 'red' : 'teal') }, data: h.serv.map(s => s.v) },
        { name: 'میانگین شهر', type: 'bar', barWidth: 14, itemStyle: { borderRadius: [5, 5, 0, 0], color: lgv('blue') }, data: h.serv.map(s => s.city) },
        { name: 'معیار', type: 'line', symbol: 'circle', symbolSize: 7, lineStyle: { width: 0 }, itemStyle: { color: '#F59F00', borderColor: '#fff', borderWidth: 2 }, data: h.serv.map(s => s.norm) }] });
  }

  /* ---------- registration status card (fills the space under the 30-day rhythm) ---------- */
  function formStatusCard() {
    const H = B.D.hoods; const S = [['تأیید شده', 'teal'], ['در انتظار تأیید', 'blue'], ['برگشت برای اصلاح', 'red'], ['پیش‌نویس', 'slate']];
    const c = S.map(([s]) => H.filter(h => h.status === s).length); const old = [...H].filter(h => h.status === 'پیش‌نویس').sort((a, b) => a.updated - b.updated)[0];
    const avg = H.reduce((a, h) => a + h.steps, 0) / H.length;
    return `<section class="card pad fsc"><div class="h2"><h2>وضعیت فرم‌های محله</h2><div class="grow"></div><small class="muted">${fa(H.length)} محله</small></div>
      ${stack(S.map(([s, k], j) => [s, c[j], k]), 14)}${keyRow(S.map(([s, k], j) => [s, c[j], k, fa(c[j])]))}
      <div class="fsn"><div><b class="num">${fa(Math.round(avg * 10) / 10)}</b><small>میانگین مرحله از ۶</small></div><div><b class="num">${pct(c[0] / H.length * 100)}</b><small>نرخ تأیید نهایی</small></div><div><b class="num">${old ? U.rel(old.updated) : '—'}</b><small>قدیمی‌ترین پیش‌نویس</small></div></div></section>`;
  }

  Object.assign(U, { renewSection, hoodPanel, hoodDetail, hoodDetailCharts, formStatusCard, grad, RENEW: { TYPES, COND, SERV, HAZ, agg } });
})();
