/* «گزارش‌ها» — single page report of محله سیروس */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M, GEO = window.GEO;
  const R = window.R = {};
  const fa = U.fa, fi = U.fi, ic = U.ic;
  const SECS = [['s-map', 'نقشه', 'map'], ['s-ov', 'نمای کلی', 'hood'], ['s-pc', 'سرانه و خدمات', 'target'], ['s-ph', 'کالبد و مسکن', 'build'], ['s-ec', 'اقتصادی و اجتماعی', 'people'], ['s-hz', 'مخاطرات', 'warn'], ['s-pj', 'برنامه‌ها و پروژه‌ها', 'cal'], ['s-rp', 'گزارش‌گیری', 'report']];
  R.SECS = SECS;
  const P = M.parcels.map(f => f.properties);
  const NP = P.length;
  const small = P.filter(p => p.a < 200).length / NP * 100;
  const roadLen = { main: 0, sec: 0, loc: 0, nar: 0 };
  GEO.roads.features.forEach(f => { if (f.properties.in && f.properties.h !== 'busway') roadLen[f.properties.k] += f.properties.L || 0; });
  const totalRoad = Object.values(roadLen).reduce((a, b) => a + b, 0);
  R.stats = { small, roadLen, totalRoad };

  function head() {
    return `<div class="ph"><div class="t">
        <div class="pre">${S.path.map(U.esc).join(` ${ic('chevl', 'xs')} `)}</div>
        <h1>محله ${S.name}<span class="tag t">${ic('check', 'xs')}ثبت کامل</span></h1>
        <p>${S.tagline}</p>
        <div class="tags"><span class="tag w">${ic('worn', 'xs')}بافت فرسوده · ۵۷٪</span><span class="tag">${ic('target', 'xs')}محله‌ی هدف بازآفرینی</span><span class="tag">${ic('clock', 'xs')}به‌روزرسانی ${S.updated}</span><span class="tag">${ic('map', 'xs')}محدوده: ${S.edges.map(e => e[1].replace('خیابان ', '').replace(' (سیروس)', '')).join('، ')}</span></div>
      </div>
      <div class="acts"><button class="btn" data-go="entry">${ic('edit', 's')}ویرایش داده‌ها</button><button class="btn" data-share>${ic('share', 's')}اشتراک</button><button class="btn pr" data-jump="s-rp">${ic('report', 's')}گزارش‌گیری</button></div></div>`;
  }
  function kpis() {
    const der = { area: `${fa(4363 / 44, 1)} نفر در هکتار`, worn: `حدود ${fa(44 * .57, 1)} هکتار از محله`, res: `${fa(1018 / 1290 * 100, 1)}٪ از کل بلوک‌ها`, com: `${fa(272 / 1290 * 100, 1)}٪ از کل بلوک‌ها`, unst: `${fa(1007 / 1445, 2)} واحد به ازای هر خانوار`, pop: `${fa(4363 / 1445, 2)} نفر در هر خانوار`, hh: `بعد خانوار ${fa(4363 / 1445, 2)} نفر`, cap: `${fa(3000 / 1007, 1)} برابر واحدهای ناپایدار` };
    const bar = { worn: 57, res: 1018 / 1290 * 100, com: 272 / 1290 * 100, unst: 1007 / 3000 * 100 };
    const jump = { area: 's-map', worn: 's-ph', res: 's-ph', com: 's-ph', unst: 's-ph', pop: 's-ec', hh: 's-ec', cap: 's-pj' };
    return `<div class="kpis">${S.kpi.map(k => `<button class="kp" data-jump="${jump[k.k]}" title="رفتن به بخش مرتبط"><div class="ic" style="background:${U.grad(k.g)}">${ic(k.ic, 's')}</div><div class="l">${k.t}</div><div class="v num">${fi(k.v)}<small>${k.u}</small></div><div class="d">${der[k.k]}</div>${bar[k.k] != null ? `<div class="bar"><i style="width:${bar[k.k]}%;background:${U.grad(k.g, '90deg')}"></i></div>` : ''}</button>`).join('')}</div>`;
  }
  function tabs() { return `<div class="stabs">${SECS.map(([id, t, i], n) => `<button data-jump="${id}" class="${n ? '' : 'on'}">${ic(i, 's')}${t}</button>`).join('')}<span class="sp"></span><span class="muted snote" title="برچسب «نمونه» یعنی مقدار از قالب گزارش آمده است" style="font-size:11.5px;display:flex;align-items:center;gap:6px;white-space:nowrap">${ic('info', 'xs')}<em style="font-style:normal">برچسب «نمونه» یعنی مقدار از قالب گزارش آمده است</em></span></div>`; }
  const sh = (n, id, t, p, ac) => `<div class="sh"><span class="n">${U.toFa ? M.toFa(n) : n}</span><div><h2>${t}</h2>${p ? `<p>${p}</p>` : ''}</div>${ac ? `<div class="ac">${ac}</div>` : ''}</div>`;

  /* ---------- map section ---------- */
  function mapSec() {
    const cc = {}; P.forEach(p => { cc[p.c] = (cc[p.c] || 0) + 1; });
    const uc = {}; P.forEach(p => { uc[p.u] = (uc[p.u] || 0) + 1; });
    return `<section class="sec" id="s-map">${sh(1, 's-map', 'نقشه‌ی محله', 'پلاک‌ها، معابر و خدمات از داده‌ی واقعی نقشه؛ با کلیک روی هر پلاک جزئیات را ببینید', `<button class="btn sm" data-fs>${ic('expand', 'xs')}تمام‌صفحه</button>`)}
      <div class="card mapcard" id="mapcard">
        <aside class="mp"><div class="hd"><b>لایه‌ها و فیلترها</b><div class="muted" style="font-size:11.5px">فیلترها روی نقشه، سه‌بعدی و آمار اعمال می‌شوند</div></div>
          <div class="bd">
            <div class="grp"><div class="gt">رنگ‌بندی پلاک‌ها</div><div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(4,1fr)" data-color>${[['cond', 'وضعیت'], ['use', 'کاربری'], ['floors', 'طبقات'], ['year', 'سال ساخت']].map(([k, t], i) => `<button data-c="${k}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div></div>
            <div class="grp"><div class="gt">وضعیت ابنیه <a data-all="cond">همه</a></div><div class="chips">${Object.entries(M.COND).map(([k, o]) => `<button class="chip on" data-cond="${k}"><i class="sw" style="background:${o.c}"></i>${o.t}<span class="c">${fi(cc[k] || 0)}</span></button>`).join('')}</div></div>
            <div class="grp"><div class="gt">کاربری <a data-all="use">همه</a></div><div class="chips">${Object.entries(M.USE).map(([k, o]) => `<button class="chip on" data-use="${k}"><i class="sw" style="background:${o.c}"></i>${o.t}<span class="c">${fi(uc[k] || 0)}</span></button>`).join('')}</div></div>
            <div class="grp"><div class="gt">تعداد طبقات</div><div class="dual" data-dual="fl"><div class="trk"></div><div class="fil"></div><input type="range" min="1" max="7" value="1" step="1"><input type="range" min="1" max="7" value="7" step="1"></div><div class="dvals"><span data-v0>۱ طبقه</span><span data-v1>۷ طبقه</span></div></div>
            <div class="grp"><div class="gt">سال ساخت</div><div class="dual" data-dual="yb"><div class="trk"></div><div class="fil"></div><input type="range" min="1310" max="1404" value="1310" step="1"><input type="range" min="1310" max="1404" value="1404" step="1"></div><div class="dvals"><span data-v0>۱۳۱۰</span><span data-v1>۱۴۰۴</span></div></div>
            <div class="grp"><div class="gt">لایه‌ها</div>
              ${[['bound', 'مرز محله', 'map', 'teal'], ['roads', 'شبکه معابر', 'road', 'slate'], ['labels', 'نام معابر', 'info', 'slate'], ['pois', 'خدمات و نقاط شاخص', 'pin', 'blue'], ['green', 'فضای سبز', 'green', 'green'], ['haz', 'پهنه‌های مخاطره (نمونه)', 'warn', 'red'], ['narrow', 'معابر کمتر از ۶ متر', 'road', 'amber'], ['sat3', 'ماهواره در حالت سه‌بعدی', 'sat', 'navy']].map(([k, t, i, g]) => `<div class="lyr ${['bound', 'roads', 'labels', 'pois', 'green'].includes(k) ? 'on' : ''}" data-lyr="${k}"><span class="lsw" style="background:${U.G[g][0]}55;color:${U.C[g]}">${ic(i, 's')}</span><span>${t}</span><i class="tg"></i></div>`).join('')}
            </div>
            <div class="grp"><div class="gt">خلاصه‌ی انتخاب <a data-reset>بازنشانی</a></div><div class="msum" data-msum></div></div>
          </div></aside>
        <div class="mstage"><div id="map"></div>
          <div class="mo vsw">${[['map', 'نقشه', 'map'], ['sat', 'ماهواره', 'sat'], ['3d', 'سه‌بعدی و زمان', 'cube'], ['atlas', 'اطلس', 'grid']].map(([k, t, i], n) => `<button data-v="${k}" class="${n ? '' : 'on'}">${ic(i, 's')}${t}</button>`).join('')}</div>
          <div class="mo msearch">${ic('search', 's')}<input placeholder="جستجوی معبر، خدمات یا نشانه…" data-msq><div class="gsr" data-msr></div></div>
          <div class="mo zc"><button data-z="in" title="بزرگ‌نمایی">${ic('plus', 's')}</button><button data-z="out" title="کوچک‌نمایی">${ic('minus', 's')}</button><button data-z="home" title="نمای کامل محله">${ic('target', 's')}</button><button data-z="north" title="جهت شمال">${ic('compass', 's')}</button></div>
          <div class="mo lgd"></div>
          <div class="mo scl"></div>
          <div class="mo tline"><button class="play" data-play>${ic('play', 's')}</button><div class="yr">۱۴۰۴</div><div class="tt"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--tx2)"><span class="tph">روند ساخت بر اساس سال ساخت</span><span class="muted">۱۴۰۶ تا ۱۴۱۰: پیش‌بینی</span></div><input type="range" min="1310" max="1410" value="1404" step="1" data-year><div class="tk"><span>۱۳۱۰</span><span>۱۳۳۵</span><span>۱۳۶۰</span><span>۱۳۸۵</span><span>۱۴۰۵</span><span>۱۴۱۰</span></div></div><div class="cnt"></div></div>
          <div class="mtip"></div><div class="mdet"></div>
          <div class="atlas"><div class="ah"><div class="bc"></div><span class="muted ttl" style="font-size:12px"></span><div class="ac"><span class="muted" style="font-size:11.5px">اندازه:</span><div class="seg"><button class="on" data-size="value">رکوردها</button><button data-size="hoods">محله‌ها</button></div><span class="muted" style="font-size:11.5px">رنگ:</span><div class="seg"><button class="on" data-col="chg">تغییر ۳۰ روز</button><button data-col="hoods">تعداد محله</button></div><span class="al"><span class="lo">کاهش</span><span class="ramp"></span><span class="hi">افزایش</span></span><button class="btn sm" data-sirous>${ic('pin', 'xs')}منطقه‌ی ۱۲</button></div></div><div class="tm" id="atlas"></div></div>
        </div>
      </div></section>`;
  }

  /* ---------- overview ---------- */
  function ovSec() {
    const ins = [
      ['sport', 'red', 'کمبود سرانه‌ی ورزشی', `${fa(0.16, 2)} در برابر استاندارد ${fa(0.22, 2)} مترمربع؛ ${fa((1 - 0.16 / 0.22) * 100, 0)}٪ کمتر از استاندارد`, 's-pc'],
      ['edu', 'blue', 'مازاد سرانه‌ی آموزشی', `${fa(2.27 / 0.33, 1)} برابر استاندارد؛ ظرفیت بازتعریف کاربری`, 's-pc'],
      ['worn', 'amber', `${fa(24.5 + 13.5, 0)}٪ ابنیه کم‌دوام یا مخروبه`, `${fi(P.filter(p => p.c === 'weak' || p.c === 'ruin').length)} پلاک روی نقشه؛ تمرکز در بخش مرکزی`, 's-ph'],
      ['coin', 'orange', '۴۶٫۷٪ خانوار زیر حداقل دستمزد', 'اولویت نخست: توانمندسازی اجتماعی و اقتصادی', 's-ec'],
      ['road', 'sky', '۳۲٪ معابر کمتر از ۶ متر', `${fa(roadLen.nar / 1000, 1)} کیلومتر معبر باریک داخل محدوده`, 's-ph'],
      ['build', 'green', 'ظرفیت نوسازی ۳٬۰۰۰ واحد', `حدود ${fa(3000 / 1007, 1)} برابر واحدهای ناپایدار موجود`, 's-pj']
    ];
    const b = S.bench;
    const rows = [['مساحت (هکتار)', 44, b.area], ['جمعیت (نفر)', 4363, b.pop], ['خانوار', 1445, b.hh], ['واحد ناپایدار', 1007, b.unst], ['تراکم ناخالص (نفر در هکتار)', 4363 / 44, b.pop / b.area], ['بعد خانوار (نفر)', 4363 / 1445, b.pop / b.hh]];
    return `<section class="sec" id="s-ov">${sh(2, '', 'نمای کلی', 'شناسنامه، یافته‌های کلیدی و مقایسه با محله‌ی مرجع')}
      <div class="grid g-37">
        <div class="card"><div class="ch"><h3>شناسنامه‌ی محله</h3><div class="ac">${U.src('sirous')}</div></div><div class="cb">
          <dl class="idt"><dt>استان / شهر</dt><dd>تهران / تهران</dd><dt>منطقه / ناحیه</dt><dd>منطقه ۱۲ · ناحیه ۳</dd>
          ${S.edges.map(e => `<dt>${e[0]}</dt><dd>${e[1]}</dd>`).join('')}
          <dt>نشانه‌ها</dt><dd><div class="cl">${S.landmarks.map(l => `<button class="chip" data-lm="${l}">${ic('pin', 'xs')}${l}</button>`).join('')}</div></dd></dl>
          <div class="minis"><div><b class="num">${fa(4363 / 44, 1)}</b><small>نفر در هکتار</small></div><div><b class="num">${fa(4363 / 1445, 2)}</b><small>بعد خانوار</small></div><div><b class="num">${fa(small, 0)}٪</b><small>پلاک زیر ۲۰۰ مترمربع</small></div></div>
        </div></div>
        <div class="card fx"><div class="ch"><h3>یافته‌های کلیدی</h3><span class="muted" style="font-size:12px">برای جزئیات روی هر مورد کلیک کنید</span></div><div class="cb"><div class="ins">${ins.map(([i, g, t, d, j]) => `<button class="in" data-jump="${j}">${U.icb(i, g)}<div><b>${t}</b><p>${d}</p></div></button>`).join('')}</div></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="ch"><h3>مقایسه با محله‌ی مرجع قالب پایش (${b.name})</h3><div class="ac">${U.src('fars')}<div class="seg" data-bm><button class="on" data-m="abs">مقدار</button><button data-m="rel">نسبت سیروس به مرجع</button></div></div></div><div class="cb">
        <table class="cmp" data-bmt><thead><tr><th style="width:26%">شاخص</th><th>سیروس</th><th>${b.name}</th><th style="width:34%">مقایسه</th></tr></thead><tbody>${rows.map(([t, a, c]) => { const mx = Math.max(a, c); return `<tr data-a="${a}" data-c="${c}"><td>${t}</td><td class="num">${fa(a, a < 10 ? 2 : 1)}</td><td class="num">${fa(c, c < 10 ? 2 : 1)}</td><td><div style="display:flex;flex-direction:column;gap:4px"><div class="bb"><i style="width:${a / mx * 100}%;background:${U.grad('teal', '90deg')}"></i></div><div class="bb"><i style="width:${c / mx * 100}%;background:${U.grad('slate', '90deg')}"></i></div></div></td></tr>`; }).join('')}</tbody></table>
        <div class="lg2" style="margin-top:10px"><span><i style="background:${U.grad('teal')}"></i>سیروس</span><span><i style="background:${U.grad('slate')}"></i>${b.name} (سرآیند قالب‌ها: واحد مسکونی ${fi(b.units)}، ناپایدار ${fi(b.unst)} (${fa(b.unstP, 1)}٪)، نوساز ${fi(b.nw)} (${fa(b.nwP, 1)}٪))</span></div>
      </div></div></section>`;
  }

  /* ---------- per-capita & services ---------- */
  function pcSec() {
    return `<section class="sec" id="s-pc">${sh(3, '', 'سرانه‌ها و خدمات', 'مقایسه با استاندارد و میانگین شهر، و فهرست خدمات روی نقشه')}
      <div class="grid g-73">
        <div class="card"><div class="ch"><h3>سرانه‌ها در برابر استاندارد</h3><span class="muted" style="font-size:12px">مترمربع به ازای هر نفر</span><div class="ac">${U.src('sirous')}<div class="seg" data-pcf><button class="on" data-f="all">همه</button><button data-f="low">کمبود</button><button data-f="ok">مناسب</button></div><select class="sel" data-pcs><option value="def">ترتیب پیش‌فرض</option><option value="gap">بیشترین کمبود</option><option value="sur">بیشترین مازاد</option></select></div></div>
          <div class="cb"><div class="pc" data-pcl></div><div class="note" style="margin-top:14px">${ic('info', 's')}<span>${S.percapNote}</span></div></div></div>
        <div class="card"><div class="ch"><h3>سرانه‌ی خدمات در برابر میانگین شهر</h3><div class="ac">${U.src('fars')}<div class="seg" data-pcc><button class="on" data-m="bar">ستونی</button><button data-m="gap">درصد از میانگین</button></div></div></div>
          <div class="cb"><div class="chart" id="ch-city" style="height:250px"></div><div class="lg2"><span><i style="background:${U.grad('navy')}"></i>محله</span><span><i style="background:${U.grad('sky')}"></i>میانگین شهر</span></div></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="ch"><h3>خدمات و نقاط شاخص</h3><span class="muted" style="font-size:12px">از OpenStreetMap؛ داخل محدوده و ۱۲۰ متر پیرامون</span><div class="ac">${U.src('osm')}</div></div><div class="cb" style="padding-bottom:0"><div class="chips" data-pcat></div></div><div id="t-poi"></div></div>
      </section>`;
  }
  function drawPercap() {
    const el = U.$('[data-pcl]'); if (!el) return;
    const f = U.$('[data-pcf] .on').dataset.f, s = U.$('[data-pcs]').value;
    let rows = S.percap.slice();
    if (f === 'low') rows = rows.filter(r => r.v < r.norm); if (f === 'ok') rows = rows.filter(r => r.v >= r.norm);
    if (s === 'gap') rows.sort((a, b) => a.v / a.norm - b.v / b.norm); if (s === 'sur') rows.sort((a, b) => b.v / b.norm - a.v / a.norm);
    const mx = Math.max(...S.percap.map(r => Math.max(r.v, r.norm))) * 1.08;
    const icn = { green: ['green', 'green'], sport: ['sport', 'orange'], health: ['health', 'red'], edu: ['edu', 'blue'] };
    el.innerHTML = rows.length ? rows.map(r => { const ok = r.v >= r.norm, ratio = r.v / r.norm; return `<div class="pcr"><div class="nm"><i style="background:${U.grad(icn[r.k][1])}">${ic(icn[r.k][0], 'xs')}</i>${r.t}</div>
      <div class="pbar"><div class="f" style="width:${r.v / mx * 100}%;background:${U.grad(ok ? 'teal' : 'orange', '270deg')}"></div><div class="nrm" style="right:${r.norm / mx * 100}%"><span>استاندارد ${fa(r.norm, 2)}</span></div><div class="vl" style="right:calc(${Math.max(r.v, r.norm) / mx * 100}% + 8px)">${fa(r.v, 2)}</div></div>
      <div class="st"><span class="badge ${ok ? 'b-ok' : 'b-er'}">${ok ? 'مناسب' : 'کمبود دارد'}</span><div class="muted" style="font-size:11px;margin-top:3px">${fa(ratio, 2)} برابر</div></div></div>`; }).join('') : '<div class="empty">موردی نیست.</div>';
  }
  let cityChart;
  function drawCity(mode) {
    const d = S.percapCity;
    const o = mode === 'gap' ? {
      grid: { top: 20, right: 40, left: 10, bottom: 30 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>محله ${fa(ps[0].value, 0)}٪ از میانگین شهر` }, U.tipStyle),
      xAxis: { type: 'category', inverse: true, data: d.map(r => r.t), axisLabel: U.axisTxt, axisLine: { lineStyle: { color: '#E4E9F0' } }, axisTick: { show: false } },
      yAxis: { type: 'value', max: 100, axisLabel: Object.assign({ formatter: v => fa(v) + '٪' }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } }, position: 'right' },
      series: [{ type: 'bar', barWidth: 30, data: d.map(r => ({ value: r.hood / r.city * 100, itemStyle: { color: U.egv(r.hood / r.city < 0.5 ? 'orange' : 'amber'), borderRadius: [6, 6, 0, 0] } })), label: { show: true, position: 'top', formatter: p => fa(p.value, 0) + '٪', fontFamily: 'Vazirmatn', fontWeight: 700, color: '#475569' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 100 }], lineStyle: { color: '#94A3B8', type: 'dashed' }, label: { formatter: 'برابر میانگین', fontFamily: 'Vazirmatn', color: '#7A8798' } } }]
    } : {
      grid: { top: 26, right: 36, left: 10, bottom: 30 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>محله: ${fa(ps[0].value, 1)}<br>میانگین شهر: ${fa(ps[1].value, 1)}<br><span style="color:#7A8798">مترمربع به ازای هر نفر</span>` }, U.tipStyle),
      xAxis: { type: 'category', inverse: true, data: d.map(r => r.t), axisLabel: U.axisTxt, axisLine: { lineStyle: { color: '#E4E9F0' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: Object.assign({ formatter: v => fa(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } }, position: 'right' },
      series: [
        { name: 'محله', type: 'bar', barWidth: 22, barGap: '20%', data: d.map(r => r.hood), itemStyle: { color: U.egv('navy'), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', formatter: p => fa(p.value, 1), fontFamily: 'Vazirmatn', fontWeight: 700, color: '#1E40AF' } },
        { name: 'میانگین شهر', type: 'bar', barWidth: 22, data: d.map(r => r.city), itemStyle: { color: U.egv('sky'), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', formatter: p => fa(p.value, 1), fontFamily: 'Vazirmatn', fontWeight: 700, color: '#3B8FD6' } }
      ]
    };
    if (!cityChart) cityChart = U.chart(U.$('#ch-city'), o); else cityChart.setOption(o, true);
  }
  let poiTable, poiCat = '';
  function poiSec() {
    const rows = M.pois.filter(f => f.properties.n).map(f => { const p = f.properties, inf = M.poiInfo(p.k); return { i: p.i, n: p.n, cat: inf[0], ic: inf[1], col: inf[2], loc: GEO.pois[0] && f.properties ? (isIn(f.geometry.coordinates) ? 'داخل محله' : 'پیرامون') : '' }; });
    const cats = {}; rows.forEach(r => { cats[r.cat] = (cats[r.cat] || 0) + 1; });
    U.$('[data-pcat]').innerHTML = `<button class="chip on" data-cat="">همه<span class="c">${fi(rows.length)}</span></button>` + Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => { const col = rows.find(r => r.cat === c).col; return `<button class="chip" data-cat="${c}"><i class="sw" style="background:${col}"></i>${c}<span class="c">${fi(n)}</span></button>`; }).join('');
    poiTable = U.table(U.$('#t-poi'), [
      { k: 'n', t: 'نام', render: (r, q) => `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:26px;height:26px;border-radius:8px;display:inline-grid;place-items:center;color:#fff;background:${r.col}">${ic(r.ic, 'xs')}</span><span class="t1">${U.hl(r.n, q)}</span></span>` },
      { k: 'cat', t: 'دسته' }, { k: 'loc', t: 'موقعیت', render: r => `<span class="badge ${r.loc === 'داخل محله' ? 'b-pr' : 'b-mu'}">${r.loc}</span>` },
      { k: 'act', t: '', sort: false, w: '120px', render: () => `<button class="btn sm gh">${ic('pin', 'xs')}روی نقشه</button>` }
    ], rows, { ph: 'جستجوی نام خدمات…', search: ['n', 'cat'], sort: 'cat', filters: [{ k: 'loc', t: 'موقعیت', opts: ['داخل محله', 'پیرامون'] }], pre: r => !poiCat || r.cat === poiCat, maxh: 330, onRow: r => { R.jump('s-map'); setTimeout(() => M.flyPoi(r.i), 350); } });
  }
  function isIn(pt) { const ring = GEO.bound.geometry.coordinates[0]; let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }

  /* ---------- physical & housing ---------- */
  function phSec() {
    const cs = S.cond;
    return `<section class="sec" id="s-ph">${sh(4, '', 'کالبد و مسکن', 'کیفیت ابنیه، شاخص‌های مصوب، مسکن و شبکه معابر')}
      <div class="grid g3">
        <div class="card"><div class="ch"><h3>وضعیت ابنیه</h3><div class="ac">${U.src('fars')}</div><div class="sub2">برای فیلتر نقشه، روی هر دسته کلیک کنید</div></div><div class="cb"><div class="chart" id="ch-cond" style="height:200px"></div>
          <div class="lg2" data-condlg style="justify-content:center">${cs.map(c => `<span data-cf="${c.k}"><i style="background:${U.grad(c.g)}"></i>${c.t} ${fa(c.v, 1)}٪</span>`).join('')}</div>
          <div class="tiles" style="grid-template-columns:repeat(4,1fr);margin-top:14px;gap:8px">${cs.map(c => `<button class="tile" data-cf="${c.k}" style="padding:8px 6px;text-align:center;cursor:pointer;font:inherit"><small>${c.t}</small><b class="num" style="font-size:15px">${fi(P.filter(p => p.c === c.k).length)}</b></button>`).join('')}</div><div class="muted" style="font-size:11px;text-align:center;margin-top:6px">تعداد پلاک روی نقشه · ${U.src('map')}</div></div></div>
        <div class="card"><div class="ch"><h3>شاخص‌های مصوب شورای عالی</h3><div class="ac">${U.src('fars')}</div><div class="sub2">خط عمودی: آستانه‌ی ۵۰٪ برای شناسایی بافت فرسوده</div></div><div class="cb"><div class="gauge">
          ${S.council.map(c => `<div class="gr"><div class="t">${c.t}<small>${c.s}</small></div><div class="v num">${fa(c.v, 1)}٪</div><div class="tr"><i style="width:${c.v}%;background:${U.grad(c.g, '270deg')}"></i><em style="right:${c.th}%"></em></div></div>`).join('')}
          <div class="gr"><div class="t">ریزدانگی ${U.src('map')}<small>سهم پلاک‌های کمتر از ۲۰۰ مترمربع</small></div><div class="v num">${fa(small, 1)}٪</div><div class="tr"><i style="width:${small}%;background:${U.grad('teal', '270deg')}"></i><em style="right:50%"></em></div></div>
          </div><div class="note" style="margin-top:12px">${ic('info', 's')}<span>${S.councilNote}</span></div></div></div>
        <div class="card"><div class="ch"><h3>وضعیت مسکن در محله</h3><div class="ac">${U.src('fars')}</div></div><div class="cb">
          <div class="tiles">${S.housing.map(h => `<div class="tile"><small>${h.t}</small><b class="num">${fa(h.v, 1)}</b><span>${h.u}</span></div>`).join('')}</div>
          <div style="font-size:12px;font-weight:800;margin:14px 0 6px">چرخه‌ی ظرفیت مسکن</div>
          <div class="pipe">${[['ظرفیت واحد', 593, 'navy'], ['واحد موجود', 447, 'blue'], ['در حال ساخت', 18, 'teal'], ['قابل برنامه‌ریزی', 128, 'green']].map(([t, v, g]) => `<div class="ps"><b class="num">${fi(v)}</b><small>${t}</small><div class="rb" style="background:${U.grad(g, '90deg')};width:${Math.max(12, v / 593 * 100)}%;margin-inline:auto"></div></div>`).join('')}</div>
        </div></div>
      </div>
      <div class="grid g3" style="margin-top:16px">
        <div class="card"><div class="ch"><h3>ساختار پلاک‌ها</h3><div class="ac">${U.src('map')}<div class="seg" data-dist><button class="on" data-m="f">طبقات</button><button data-m="y">سال ساخت</button><button data-m="a">مساحت</button></div></div></div><div class="cb"><div class="chart" id="ch-dist" style="height:230px"></div></div></div>
        <div class="card"><div class="ch"><h3>شبکه معابر داخل محدوده</h3><div class="ac">${U.src('osm')}</div></div><div class="cb"><div style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:8px"><div class="chart" id="ch-road" style="height:180px"></div><div class="gauge" style="gap:8px" data-roadlg></div></div>
          <div class="lyr ${'' }" data-narrowbtn style="margin-top:6px"><span class="lsw" style="background:#FFE08A55;color:#F59F00">${ic('road', 's')}</span><span>نمایش معابر کمتر از ۶ متر روی نقشه</span><i class="tg"></i></div>
          <div class="tiles" style="grid-template-columns:1fr 1fr;margin-top:10px"><div class="tile"><small>تراکم شبکه</small><b class="num">${fa(totalRoad / 1000 / GEO.meta.ha, 2)}</b><span>کیلومتر در هکتار</span></div><div class="tile"><small>معابر باریک</small><b class="num">${fa(roadLen.nar / 1000, 1)}</b><span>کیلومتر</span></div></div></div></div>
        <div class="card"><div class="ch"><h3>قابلیت خروج محله از محلات هدف</h3><div class="ac">${U.src('fars')}</div></div><div class="cb">
          <div class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><small>هزینه‌ی موردنیاز</small><b class="num">${fi(S.exit.cost)}</b><span>میلیارد ریال</span></div><div class="tile"><small>تعداد پروژه / اقدام</small><b class="num">${fa(S.exit.projects)}</b><span>پروژه و</span> <b class="num">${fa(S.exit.actions)}</b><span>اقدام</span></div></div>
          <div style="font-size:12px;font-weight:800;margin:14px 0 8px">فاصله تا آستانه‌ی خروج (۵۰٪)</div>
          ${[['ناپایداری (کم‌دوام + مخروبه)', 38], ['نفوذناپذیری (معابر زیر ۶ متر)', 32], ['ریزدانگی', small]].map(([t, v]) => `<div class="gr" style="margin-bottom:10px"><div class="t" style="font-size:12px">${t}</div><div class="v num" style="font-size:14px">${fa(v, 0)}٪</div><div class="tr"><i style="width:${v}%;background:${U.grad(v >= 50 ? 'orange' : 'green', '270deg')}"></i><em style="right:50%"></em></div></div>`).join('')}
          <div class="note ${small >= 50 ? 'w' : ''}">${ic(small >= 50 ? 'warn' : 'check', 's')}<span>${small >= 50 ? 'شاخص ریزدانگی بالاتر از آستانه است؛ تجمیع پلاک‌ها کلید خروج از فهرست محلات هدف است.' : 'هر سه شاخص پایین‌تر از آستانه‌اند.'}</span></div>
        </div></div>
      </div></section>`;
  }
  let condChart, distChart, roadChart;
  function drawCond() {
    condChart = U.chart(U.$('#ch-cond'), {
      tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(p.value, 1)}٪ از ابنیه<br><span style="color:#7A8798">${fi(P.filter(x => x.c === S.cond[p.dataIndex].k).length)} پلاک روی نقشه</span>` }, U.tipStyle),
      series: [{ type: 'pie', radius: ['56%', '86%'], center: ['50%', '50%'], padAngle: 2, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'center', formatter: () => `{a|${fa(38, 0)}٪}\n{b|ناپایدار}`, rich: { a: { fontSize: 22, fontWeight: 900, fontFamily: 'Vazirmatn', color: '#1E293B' }, b: { fontSize: 11, fontFamily: 'Vazirmatn', color: '#7A8798' } } }, emphasis: { scale: true, scaleSize: 5, label: { show: true } }, labelLine: { show: false },
        data: S.cond.map(c => ({ name: c.t, value: c.v, itemStyle: { color: U.eg(c.g) } })) }]
    });
    condChart.on('click', p => { const k = S.cond[p.dataIndex].k; M.st.cond = new Set([k]); M.apply(); U.toast(`نقشه فقط «${S.cond[p.dataIndex].t}» را نشان می‌دهد`, 'filter'); R.syncPanel(); });
  }
  function drawDist(m) {
    let cats, vals, name, g;
    if (m === 'f') { cats = [1, 2, 3, 4, 5, 6, 7].map(v => fa(v) + ' طبقه'); vals = [1, 2, 3, 4, 5, 6, 7].map(v => P.filter(p => p.f === v).length); name = 'پلاک'; g = 'teal'; }
    else if (m === 'y') { const bins = [[1310, 1339, 'قبل از ۱۳۴۰'], [1340, 1357, '۱۳۴۰–۵۷'], [1358, 1374, '۱۳۵۸–۷۴'], [1375, 1389, '۱۳۷۵–۸۹'], [1390, 1404, '۱۳۹۰–۱۴۰۴']]; cats = bins.map(b => b[2]); vals = bins.map(b => P.filter(p => p.yb >= b[0] && p.yb <= b[1]).length); name = 'پلاک'; g = 'blue'; }
    else { const bins = [[0, 99, 'زیر ۱۰۰'], [100, 199, '۱۰۰–۲۰۰'], [200, 299, '۲۰۰–۳۰۰'], [300, 499, '۳۰۰–۵۰۰'], [500, 1e9, 'بالای ۵۰۰']]; cats = bins.map(b => b[2]); vals = bins.map(b => P.filter(p => p.a >= b[0] && p.a <= b[1]).length); name = 'پلاک'; g = 'amber'; }
    const o = { grid: { top: 24, right: 8, left: 36, bottom: 28 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>${fi(ps[0].value)} ${name} (${fa(ps[0].value / NP * 100, 1)}٪)` }, U.tipStyle),
      xAxis: { type: 'category', inverse: true, data: cats, axisLabel: Object.assign({ interval: 0 }, U.axisTxt), axisTick: { show: false }, axisLine: { lineStyle: { color: '#E4E9F0' } } },
      yAxis: { type: 'value', position: 'right', axisLabel: Object.assign({ formatter: v => fi(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } } },
      series: [{ type: 'bar', barWidth: '56%', data: vals, itemStyle: { color: U.egv(g), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', formatter: p => fi(p.value), fontFamily: 'Vazirmatn', fontSize: 11, color: '#475569' } }] };
    if (!distChart) distChart = U.chart(U.$('#ch-dist'), o); else distChart.setOption(o, true);
  }
  function drawRoad() {
    const items = [['main', 'شریانی اصلی', 'navy'], ['sec', 'جمع‌وپخش', 'blue'], ['loc', 'محلی (۶ متر و بیشتر)', 'sky'], ['nar', 'کمتر از ۶ متر', 'amber']];
    roadChart = U.chart(U.$('#ch-road'), {
      tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(p.value / 1000, 2)} کیلومتر · ${fa(p.percent, 1)}٪` }, U.tipStyle),
      legend: { show: false },
      series: [{ type: 'pie', radius: ['54%', '86%'], center: ['50%', '50%'], padAngle: 2, itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, data: items.map(([k, t, g]) => ({ name: t, value: Math.round(roadLen[k]), itemStyle: { color: U.eg(g) } })) },
        { type: 'pie', radius: [0, 0], center: ['50%', '50%'], label: { show: true, position: 'center', formatter: `{a|${fa(totalRoad / 1000, 1)}}\n{b|کیلومتر}`, rich: { a: { fontSize: 18, fontWeight: 900, fontFamily: 'Vazirmatn', color: '#1E293B' }, b: { fontSize: 10.5, fontFamily: 'Vazirmatn', color: '#7A8798' } } }, data: [{ value: 1, itemStyle: { color: 'transparent' } }], silent: true }],
    });
    U.$('[data-roadlg]').innerHTML = items.map(([k, t, g]) => `<div style="display:flex;align-items:center;gap:8px;font-size:12px"><i style="width:10px;height:10px;border-radius:3px;background:${U.grad(g)};flex:none"></i><span style="flex:1;color:var(--tx2)">${t}</span><b class="num">${fa(roadLen[k] / totalRoad * 100, 1)}٪</b></div>`).join('');
  }

  /* ---------- economic & social ---------- */
  function ecSec() {
    return `<section class="sec" id="s-ec">${sh(5, '', 'اقتصادی و اجتماعی', 'شاخص‌های سکونتگاه غیررسمی، درآمد و اولویت مداخله')}
      <div class="grid g4">${S.informal.map(k => `<div class="kp" style="cursor:default"><div class="ic" style="background:${U.grad(k.g)}">${ic(k.ic, 's')}</div><div class="l">${k.t}</div><div class="v num">${fa(k.v, 1)}<small>${k.u}</small></div><div class="d">${U.src('infor')}</div></div>`).join('')}</div>
      <div class="grid g-73" style="margin-top:16px">
        <div class="card"><div class="ch"><h3>توزیع درآمد خانوارها</h3><div class="ac">${U.src('infor')}<div class="seg" data-inc><button class="on" data-m="p">درصد</button><button data-m="h">تعداد خانوار (برآورد)</button></div></div></div><div class="cb">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center"><div class="chart" id="ch-inc" style="height:230px"></div><div data-incl></div></div>
          <div style="font-size:12px;font-weight:800;margin:10px 0 8px">طبقات معیشتی</div>
          <div class="grid g4" style="gap:10px">${S.tiers.map(t => `<div class="tile" style="text-align:center"><span style="display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;color:#fff;background:${U.grad(t.g)};margin:0 auto 4px">${ic('people', 'xs')}</span><small>${t.t} (${t.s})</small><b class="num">${fa(t.v, 1)}٪</b></div>`).join('')}</div>
          <div class="note w" style="margin-top:12px">${ic('info', 's')}<span>کنترل کیفیت داده: در قالب مرجع، سهم «درآمد متوسط» ۱۸٫۳٪ و «طبقه ۳ (متوسط)» ۱۸٫۷٪ ثبت شده است. مجموع طبقات ۱۰۰٫۴٪ می‌شود و پیش از انتشار نهایی باید بازبینی شود.</span></div>
        </div></div>
        <div class="card"><div class="ch"><h3>اولویت رویکرد مداخله در محله</h3><div class="ac">${U.src('infor')}</div><div class="sub2">با کلیک روی هر رویکرد، پروژه‌های آن را ببینید</div></div><div class="cb">
          <div class="stp" style="flex-direction:column">${S.priority.map(p => `<button class="sti in" data-ax="a${p.n}" style="display:flex;gap:12px;align-items:center"><span class="n" style="background:${U.grad(p.g)};margin:0;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800">${M.toFa(p.n)}</span><div style="flex:1"><b>${p.t}</b><small>${fi(S.projects.filter(x => x.ax === 'a' + p.n).length)} پروژه · ${fi(S.projects.filter(x => x.ax === 'a' + p.n).reduce((a, x) => a + x.b0, 0))} میلیارد تومان</small></div>${ic('chevl', 's')}</button>`).join('')}</div>
          <div class="tiles" style="grid-template-columns:1fr 1fr;margin-top:12px"><div class="tile"><small>مجموع اعتبار ۹ پروژه</small><b class="num">${fi(S.projects.filter(x => x.ax !== 'haz').reduce((a, x) => a + x.b0, 0))}</b><span>میلیارد تومان</span></div><div class="tile"><small>بازه‌ی اجرا</small><b class="num">${M.toFa(1404)}–${M.toFa(1409)}</b></div></div>
          <div style="font-size:12px;font-weight:800;margin:16px 0 8px">سایر شاخص‌ها <span class="muted" style="font-weight:500">(هنوز داده‌ای ثبت نشده)</span></div>
          <div class="cl">${S.otherInd.map(t => `<span>${t}</span>`).join('')}</div>
        </div></div>
      </div></section>`;
  }
  let incChart;
  function drawInc(m) {
    const d = S.income, hh = v => Math.round(v / 100 * 1445);
    const o = { tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(d[p.dataIndex].v, 1)}٪ · حدود ${fi(hh(d[p.dataIndex].v))} خانوار` }, U.tipStyle),
      series: [{ type: 'pie', radius: ['48%', '84%'], padAngle: 2, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'inside', formatter: p => m === 'h' ? fi(hh(d[p.dataIndex].v)) : fa(d[p.dataIndex].v, 1) + '٪', fontFamily: 'Vazirmatn', fontWeight: 700, color: '#fff', fontSize: 11 }, data: d.map(x => ({ name: x.t, value: x.v, itemStyle: { color: U.eg(x.g) } })) }] };
    if (!incChart) incChart = U.chart(U.$('#ch-inc'), o); else incChart.setOption(o, true);
    U.$('[data-incl]').innerHTML = `<table class="cmp"><thead><tr><th>سطح درآمد</th><th>${m === 'h' ? 'خانوار' : 'درصد خانوار'}</th></tr></thead><tbody>${d.map(x => `<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><i style="width:10px;height:10px;border-radius:3px;background:${U.grad(x.g)}"></i>${x.t}</span></td><td class="num">${m === 'h' ? fi(hh(x.v)) : fa(x.v, 1) + '٪'}</td></tr>`).join('')}</tbody></table>`;
  }

  /* ---------- hazards ---------- */
  function hzSec() {
    return `<section class="sec" id="s-hz">${sh(6, '', 'مخاطرات طبیعی و انسان‌ساخت', 'حریم‌ها، سهم از مساحت و پلاک‌های در معرض', `<button class="btn sm" data-hzmap>${ic('map', 'xs')}نمایش همه روی نقشه</button>`)}
      <div class="hz">${S.hazards.map(h => `<button class="hzt" data-hz="${h.k}"><div class="top">${U.icb(h.ic, h.g)}<div><b>${h.t}</b><small class="muted" style="font-size:11px">${h.s}</small></div></div>
        <div class="vals"><span class="p num">${fa(h.pct)}٪</span><small>از مساحت محله<br>≈ ${fa(44 * h.pct / 100, 1)} هکتار در سیروس</small></div><div class="ring"><i style="width:${h.pct / 20 * 100}%;background:${U.grad(h.g, '270deg')}"></i></div>
        <div class="muted" style="font-size:10.5px;margin-top:6px">در قالب مرجع: ${fi(h.ref)} هکتار</div><span class="chk">${U.src('haz')}</span></button>`).join('')}</div>
      <div class="grid g-37" style="margin-top:16px">
        <div class="card"><div class="ch"><h3>درصد مواجهه با مخاطرات</h3><div class="ac">${U.src('haz')}</div></div><div class="cb"><div class="chart" id="ch-exp" style="height:220px"></div><div class="lg2" style="justify-content:center">${S.hazards.map(h => `<span><i style="background:${U.grad(h.g)}"></i>${h.t} ${fa(h.exp)}٪</span>`).join('')}</div></div></div>
        <div class="card"><div class="ch"><h3>پلاک‌های در معرض به تفکیک وضعیت ابنیه</h3><div class="ac">${U.src('map')}<div class="seg" data-exm><button class="on" data-m="n">تعداد</button><button data-m="p">درصد</button></div></div><div class="sub2">هم‌پوشانی پهنه‌های مخاطره با پلاک‌های روی نقشه</div></div><div class="cb"><div class="chart" id="ch-expo" style="height:220px"></div>
          <div class="note" data-hzins>${ic('warn', 's')}<span></span></div></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="cb" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><b style="font-size:12.5px">شاخص‌های بدون مصداق در محدوده:</b><div class="cl">${S.hazMissing.map(t => `<span>${t}</span>`).join('')}</div><span class="muted" style="font-size:11.5px;margin-inline-start:auto">فاقد سایر شاخص‌ها</span></div></div>
      </section>`;
  }
  let expChart, expoChart;
  function drawExp() {
    expChart = U.chart(U.$('#ch-exp'), { tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(p.value)}٪ مواجهه` }, U.tipStyle), series: [{ type: 'pie', radius: ['50%', '84%'], padAngle: 2, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'inside', formatter: p => fa(p.value) + '٪', color: '#fff', fontWeight: 800, fontFamily: 'Vazirmatn' }, data: S.hazards.map(h => ({ name: h.t, value: h.exp, itemStyle: { color: U.eg(h.g) } })) }] });
  }
  function drawExpo(m) {
    const ks = S.hazards.map(h => h.k);
    const by = c => ks.map(k => P.filter(p => p.c === c && p.hz && p.hz.split(',').includes(k)).length);
    const tot = ks.map(k => P.filter(p => p.hz && p.hz.split(',').includes(k)).length);
    const ser = S.cond.slice().reverse().map(c => ({ name: c.t, type: 'bar', stack: 's', barWidth: 22, data: by(c.k).map((v, i) => m === 'p' ? (tot[i] ? v / tot[i] * 100 : 0) : v), itemStyle: { color: U.eg(c.g, true) }, emphasis: { focus: 'series' } }));
    const o = { grid: { top: 10, right: 150, left: 40, bottom: 26 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>` + ps.map(p => `${p.marker}${p.seriesName}: ${m === 'p' ? fa(p.value, 1) + '٪' : fi(p.value) + ' پلاک'}`).join('<br>') }, U.tipStyle),
      yAxis: { type: 'category', data: S.hazards.map(h => h.t), position: 'right', axisLabel: Object.assign({ fontSize: 11.5, color: '#475569' }, { fontFamily: 'Vazirmatn' }), axisTick: { show: false }, axisLine: { lineStyle: { color: '#E4E9F0' } } },
      xAxis: { type: 'value', inverse: true, max: m === 'p' ? 100 : null, axisLabel: Object.assign({ formatter: v => m === 'p' ? fa(v) + '٪' : fi(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } } }, series: ser };
    if (!expoChart) expoChart = U.chart(U.$('#ch-expo'), o); else expoChart.setOption(o, true);
    const fu = P.filter(p => p.hz && p.hz.includes('fault') && (p.c === 'weak' || p.c === 'ruin')).length;
    const any = P.filter(p => p.hz).length;
    U.$('[data-hzins] span').innerHTML = `${fi(any)} پلاک (${fa(any / NP * 100, 1)}٪) در دست‌کم یک پهنه‌ی مخاطره قرار دارند؛ <b>${fi(fu)} پلاک کم‌دوام یا مخروبه</b> در حریم گسل، اولویت نخست مقاوم‌سازی‌اند.`;
  }

  /* ---------- projects ---------- */
  const AX = { haz: ['کاهش مخاطرات', 'red'], a1: ['توانمندسازی اجتماعی و اقتصادی', 'green'], a2: ['بهسازی عملکردی', 'blue'], a3: ['نوسازی و مقاوم‌سازی', 'orange'] };
  const NOW = 1405 + 7.9 / 12; // ۲۷ آبان ۱۴۰۵
  const prog = p => Math.max(0, Math.min(100, (NOW - p.y0) / (p.y1 + 1 - p.y0) * 100));
  function pjSec() {
    const tot = S.projects.reduce((a, p) => a + p.rial, 0);
    return `<section class="sec" id="s-pj">${sh(7, '', 'برنامه‌ها و پروژه‌ها', 'اقدامات کاهش مخاطرات و پروژه‌های رویکردهای مداخله، با فیلتر، مرتب‌سازی و زمان‌بندی')}
      <div class="card"><div class="pk" data-pk></div>
        <div class="tbar" style="border-bottom:0;padding-bottom:0"><div class="seg" data-axf><button class="on" data-a="">همه</button>${Object.entries(AX).map(([k, [t]]) => `<button data-a="${k}">${t}</button>`).join('')}</div><span style="flex:1"></span><div class="seg" data-pv><button class="on" data-v="t">${ic('entry', 'xs')}جدول</button><button data-v="g">${ic('cal', 'xs')}زمان‌بندی</button></div></div>
        <div id="t-pj"></div><div class="gantt" id="g-pj" style="display:none"></div>
        <div class="cb" style="padding-top:0"><div class="note">${ic('info', 's')}<span>اعتبار پروژه‌های قالب «سکونتگاه غیررسمی» به میلیارد تومان ثبت شده و برای جمع‌پذیری به میلیارد ریال تبدیل شده است (×۱۰). جمع کل همه‌ی ردیف‌ها: <b>${fi(tot)} میلیارد ریال</b>.</span></div></div>
      </div></section>`;
  }
  let pjTable, pjAx = '';
  function drawPj() {
    const rows = S.projects.map((p, i) => Object.assign({}, p, { n: i + 1, axT: AX[p.ax][0], range: `${M.toFa(p.y0)}–${M.toFa(p.y1)}`, pr: prog(p) }));
    const cols = [
      { k: 'n', t: '#', w: '44px', num: true, render: r => M.toFa(r.n) },
      { k: 't', t: 'عنوان اقدام / پروژه', render: (r, q) => `<div class="t1">${U.hl(r.t, q)}</div><div class="t2">${U.hl(r.loc, q)}</div>` },
      { k: 'axT', t: 'محور', render: r => `<span class="ax" style="background:${U.G[AX[r.ax][1]][0]}40;color:${U.C[AX[r.ax][1]]}">${r.axT}</span>` },
      { k: 'range', t: 'زمان‌بندی', sort: r => r.y0 * 10000 + r.y1, num: true },
      { k: 'rial', t: 'اعتبار (میلیارد ریال)', num: true, sort: r => r.rial, render: r => `<b>${fi(r.rial)}</b>${r.unit === 't' ? `<div class="t2">${fi(r.b0)} میلیارد تومان</div>` : ''}` },
      { k: 'st', t: 'وضعیت', render: r => U.statusBadge(r.st) },
      { k: 'pr', t: 'پیشرفت زمانی', sort: r => r.pr, render: r => `<div class="prg"><div class="b"><i style="width:${r.pr}%;background:${U.grad(r.pr >= 100 ? 'green' : 'teal', '270deg')}"></i></div><span>${fa(r.pr, 0)}٪</span></div>` }
    ];
    pjTable = U.table(U.$('#t-pj'), cols, rows, {
      ph: 'جستجوی عنوان یا موقعیت…', search: ['t', 'loc', 'axT', 'st'], filters: [{ k: 'st', t: 'وضعیت', opts: [...new Set(rows.map(r => r.st))] }, { k: 'y0', t: 'سال شروع', opts: ['1404', '1405'] }],
      pre: r => !pjAx || r.ax === pjAx, maxh: 460,
      foot: rs => `<tr><td></td><td>جمع ${fi(rs.length)} ردیف</td><td></td><td></td><td class="num">${fi(rs.reduce((a, r) => a + r.rial, 0))}</td><td colspan="2"></td></tr>`,
      after: rs => { pk(rs); gantt(rs); }
    });
    U.$$('#t-pj [data-f="y0"] option').forEach(o => { if (o.value) o.textContent = M.toFa(o.value); });
  }
  function pk(rs) {
    const t = rs.reduce((a, r) => a + r.rial, 0), run = rs.filter(r => r.st === 'در حال اجرا').length, dur = rs.length ? rs.reduce((a, r) => a + (r.y1 - r.y0 + 1), 0) / rs.length : 0;
    U.$('[data-pk]').innerHTML = `<div><small>تعداد</small><b class="num">${fi(rs.length)} <span class="muted" style="font-size:12px;font-weight:600">اقدام و پروژه</span></b></div><div><small>اعتبار کل</small><b class="num">${fi(t)} <span class="muted" style="font-size:12px;font-weight:600">میلیارد ریال</span></b></div><div><small>در حال اجرا</small><b class="num">${fi(run)}</b></div><div><small>میانگین مدت اجرا</small><b class="num">${fa(dur, 1)} <span class="muted" style="font-size:12px;font-weight:600">سال</span></b></div>`;
  }
  function gantt(rs) {
    const el = U.$('#g-pj'); const Y0 = 1404, N = 6;
    const pos = y => (y - Y0) / N * 100;
    el.innerHTML = `<div class="gth"><div></div><div class="yrs">${Array.from({ length: N }, (_, i) => `<span>${M.toFa(Y0 + i)}</span>`).join('')}</div></div><div style="position:relative">${rs.map(r => `<div class="grw"><div class="gt2"><span class="ax" style="background:${U.G[AX[r.ax][1]][0]}40;color:${U.C[AX[r.ax][1]]};padding:0 6px">${M.toFa(r.n)}</span><span title="${U.esc(r.t)}">${U.esc(r.t)}</span></div><div class="gl"><div class="gb" style="right:${pos(r.y0)}%;width:${pos(r.y1 + 1) - pos(r.y0)}%;background:${U.grad(AX[r.ax][1], '270deg')}">${fi(r.rial)} م.ر</div></div></div>`).join('')}
      <div class="today" style="right:calc(300px + (100% - 300px) * ${pos(NOW) / 100})"><span>امروز</span></div></div>`;
  }

  /* ---------- report builder ---------- */
  function rpSec() {
    const secs = SECS.slice(0, 7);
    return `<section class="sec" id="s-rp">${sh(8, '', 'گزارش‌گیری', 'بخش‌ها و قالب خروجی را انتخاب کنید')}
      <div class="card"><div class="cb rb">
        <div><div style="font-size:12.5px;font-weight:800;margin-bottom:8px">بخش‌های گزارش</div><div class="rbs">${secs.map(([id, t, i]) => `<div class="ck on" data-rs="${id}"><span class="bx">${ic('check', 'xs')}</span><div><b>${t}</b><small>${{ 's-map': 'تصویر نقشه و خلاصه‌ی فیلترها', 's-ov': 'شناسنامه و یافته‌ها', 's-pc': 'سرانه‌ها و خدمات', 's-ph': 'ابنیه، مسکن، معابر', 's-ec': 'درآمد و اولویت مداخله', 's-hz': 'حریم‌ها و پلاک‌های در معرض', 's-pj': 'جدول و زمان‌بندی پروژه‌ها' }[id]}</small></div></div>`).join('')}</div>
          <div style="font-size:12.5px;font-weight:800;margin:16px 0 8px">قالب خروجی</div>
          <div class="fmt">${[['pdf', 'PDF / چاپ', 'red', 'print'], ['csv', 'اکسل (CSV)', 'green', 'entry'], ['png', 'تصویر نقشه', 'blue', 'map']].map(([k, t, g, i], n) => `<div class="ck ${n ? '' : 'on'}" data-fmt="${k}"><span class="ii" style="background:${U.grad(g)}">${ic(i, 's')}</span><b>${t}</b></div>`).join('')}</div>
          <div style="display:flex;gap:10px;margin-top:16px;align-items:center"><button class="btn pr" data-gen>${ic('dl', 's')}ساخت گزارش</button><span class="muted" style="font-size:11.5px" data-rinfo></span></div>
        </div>
        <div class="rprev"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:12.5px">پیش‌نمایش</b><span class="muted" style="font-size:11.5px" data-rcount></span></div>
          <div class="pg"><h4>گزارش محله ${S.name}</h4><div class="muted" style="font-size:11px">تهران · منطقه ۱۲ · ${S.updated}</div><div class="ln" style="width:70%"></div><div class="ln" style="width:48%"></div><div data-rlist></div></div>
          <div><div style="font-size:12px;font-weight:800;margin-bottom:4px">گزارش‌های اخیر</div><div class="hist" data-hist>
            <div><span class="fi" style="background:${U.grad('red')}">PDF</span><div style="flex:1"><b>گزارش کامل محله سیروس</b><div class="muted" style="font-size:11px">۲۰ آبان ۱۴۰۵ · مریم احمدی</div></div></div>
            <div><span class="fi" style="background:${U.grad('green')}">CSV</span><div style="flex:1"><b>جدول پروژه‌ها و اعتبارات</b><div class="muted" style="font-size:11px">۱۲ آبان ۱۴۰۵ · رضا کاظمی</div></div></div></div></div>
        </div>
      </div></div></section>`;
  }
  function rpUpdate() {
    const on = U.$$('[data-rs].on').map(e => e.dataset.rs);
    U.$('[data-rlist]').innerHTML = on.map(id => `<div class="bl"><i></i>${SECS.find(s => s[0] === id)[1]}</div>`).join('') || '<div class="empty">هیچ بخشی انتخاب نشده</div>';
    U.$('[data-rcount]').textContent = `${fi(on.length)} بخش`;
    U.$('[data-gen]').disabled = !on.length;
  }
  function csvOut(on) {
    const L = [];
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    L.push(['گزارش محله سیروس', S.updated].map(q).join(','));
    if (on.includes('s-ov') || on.includes('s-map')) { L.push(''); L.push(q('شاخص‌های کلیدی')); S.kpi.forEach(k => L.push([k.t, k.v, k.u].map(q).join(','))); }
    if (on.includes('s-pc')) { L.push(''); L.push(['سرانه', 'استاندارد', 'سیروس', 'وضعیت'].map(q).join(',')); S.percap.forEach(r => L.push([r.t, r.norm, r.v, r.v >= r.norm ? 'مناسب' : 'کمبود دارد'].map(q).join(','))); }
    if (on.includes('s-ph')) { L.push(''); L.push(['وضعیت ابنیه', 'درصد'].map(q).join(',')); S.cond.forEach(c => L.push([c.t, c.v].map(q).join(','))); S.housing.forEach(h => L.push([h.t, h.v, h.u].map(q).join(','))); }
    if (on.includes('s-ec')) { L.push(''); S.informal.forEach(k => L.push([k.t, k.v, k.u].map(q).join(','))); S.income.forEach(k => L.push([k.t, k.v + '%'].map(q).join(','))); }
    if (on.includes('s-hz')) { L.push(''); L.push(['مخاطره', 'درصد مساحت', 'هکتار در سیروس', 'درصد مواجهه'].map(q).join(',')); S.hazards.forEach(h => L.push([h.t, h.pct, (44 * h.pct / 100).toFixed(1), h.exp].map(q).join(','))); }
    if (on.includes('s-pj')) { L.push(''); L.push(['عنوان', 'موقعیت/شرح', 'محور', 'شروع', 'پایان', 'اعتبار (میلیارد ریال)', 'وضعیت'].map(q).join(',')); S.projects.forEach(p => L.push([p.t, p.loc, AX[p.ax][0], p.y0, p.y1, p.rial, p.st].map(q).join(','))); }
    return '﻿' + L.join('\r\n');
  }
  let DL = null;
  try { if (window.claude && typeof claude.use === 'function') claude.use('downloads').then(d => { DL = d; }).catch(() => {}); } catch (e) {}
  async function download(name, blob) {
    if (DL) {
      try { await DL.save({ filename: name, data: blob }); return true; }
      catch (e) { if (!e || e.code !== 'declined') U.toast('ذخیره‌ی فایل در این نما ممکن نشد', 'info'); return false; }
    }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); return true; } catch (e) { return false; }
  }
  function mapShot() {
    return new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      M.map.once('render', () => { try { fin(M.map.getCanvas().toDataURL('image/jpeg', .9)); } catch (e) { fin(''); } });
      M.map.triggerRepaint(); setTimeout(() => fin(''), 2500); });
  }
  async function printable(on) {
    const css = U.$$('style').map(s => s.textContent).join('\n');
    U.charts.forEach((c, i) => { const d = c.getDom(); if (d && d.offsetParent) d.setAttribute('data-ci', i); });
    const img = on.includes('s-map') ? await mapShot() : '';
    const parts = [U.$('.wrap > .ph'), U.$('.wrap > .kpis')].filter(Boolean).map(e => e.cloneNode(true));
    on.forEach(id => { const s = document.getElementById(id); if (s) parts.push(s.cloneNode(true)); });
    parts.forEach(p => {
      p.querySelectorAll('[data-ci]').forEach(d => { let u = ''; try { u = U.charts[+d.dataset.ci].getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }); } catch (e) {} d.innerHTML = u ? `<img src="${u}" alt="" style="width:100%;height:100%;object-fit:contain">` : ''; });
      const st = p.querySelector('.mstage'); if (st) st.innerHTML = img ? `<img src="${img}" alt="نقشه‌ی محله سیروس" style="width:100%;height:100%;object-fit:cover;display:block">` : '';
    });
    U.$$('[data-ci]').forEach(d => d.removeAttribute('data-ci'));
    const extra = 'html,body{background:#fff!important;height:auto!important;overflow:visible!important}.rwrap{max-width:1200px;margin:0 auto;padding:24px}.rwrap .sec{break-inside:avoid-page;margin-bottom:22px}.stabs,.mapcard .mp,.vsw,.msearch,.zc,.lgd,.tline,.mtip,.mdet,[data-fs]{display:none!important}.mapcard{grid-template-columns:1fr!important}.mstage{height:540px}.rwrap .ph .btn{display:none!important}';
    return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>گزارش محله سیروس</title><style>${css}\n${extra}</style></head><body><div class="wrap rwrap">${parts.map(p => p.outerHTML).join('')}</div><script>addEventListener('load',function(){setTimeout(function(){print()},600)})<\/script></body></html>`;
  }
  R.printable = printable;
  function gen() {
    const on = U.$$('[data-rs].on').map(e => e.dataset.rs), fmt = U.$('[data-fmt].on').dataset.fmt;
    const add = (f, t) => { const h = U.$('[data-hist]'); h.insertAdjacentHTML('afterbegin', `<div><span class="fi" style="background:${U.grad(f === 'PDF' ? 'red' : f === 'CSV' ? 'green' : 'blue')}">${f}</span><div style="flex:1"><b>${t}</b><div class="muted" style="font-size:11px">${S.updated} · شما</div></div><span class="badge b-ok">آماده</span></div>`); };
    if (fmt === 'csv') { download('sirous-report.csv', new Blob([csvOut(on)], { type: 'text/csv;charset=utf-8' })); add('CSV', `گزارش ${fi(on.length)} بخشی محله سیروس`); U.toast('فایل CSV ساخته شد', 'dl'); }
    else if (fmt === 'png') { M.map.once('render', () => { M.map.getCanvas().toBlob(b => { if (b) download('sirous-map.png', b); }); }); M.map.triggerRepaint(); add('PNG', 'تصویر نقشه‌ی محله سیروس'); U.toast('تصویر نقشه ساخته شد', 'dl'); }
    else {
      U.$$('.sec').forEach(s => s.classList.toggle('no-print', s.id !== 's-rp' && !on.includes(s.id)));
      const rp = U.$('#s-rp'); rp.classList.add('no-print');
      add('PDF', `گزارش ${fi(on.length)} بخشی محله سیروس`);
      if (DL) {
        U.$$('.sec').forEach(s => s.classList.remove('no-print'));
        U.toast('نسخه‌ی چاپی در حال آماده شدن است…', 'info');
        printable(on).then(h => download('sirous-report.html', new Blob([h], { type: 'text/html;charset=utf-8' }))).then(ok => { if (ok) U.toast('گزارش ذخیره شد؛ با باز کردن فایل، پنجره‌ی چاپ و ذخیره‌ی PDF باز می‌شود', 'dl'); });
        return;
      }
      setTimeout(() => { try { window.print(); } catch (e) { U.toast('چاپ در این محیط در دسترس نیست', 'info'); } U.$$('.sec').forEach(s => s.classList.remove('no-print')); }, 60);
    }
  }

  /* ---------- render ---------- */
  R.render = function (root) {
    root.innerHTML = `<div class="wrap">${head()}${kpis()}${tabs()}${mapSec()}${ovSec()}${pcSec()}${phSec()}${ecSec()}${hzSec()}${pjSec()}${rpSec()}</div>`;
    drawPercap(); drawCity('bar'); poiSec(); drawCond(); drawDist('f'); drawRoad(); drawInc('p'); drawExp(); drawExpo('n'); drawPj(); rpUpdate();
    bind(root);
  };
  R.jump = id => { const el = document.getElementById(id); if (!el) return; const v = U.$('.view'); v.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' }); };
  R.syncPanel = () => {
    const st = M.st;
    U.$$('[data-cond]').forEach(b => b.classList.toggle('on', st.cond.has(b.dataset.cond)));
    U.$$('[data-use]').forEach(b => b.classList.toggle('on', st.use.has(b.dataset.use)));
    U.$$('[data-color] button').forEach(b => b.classList.toggle('on', b.dataset.c === st.color));
    U.$$('[data-lyr]').forEach(l => { const k = l.dataset.lyr; l.classList.toggle('on', k === 'narrow' ? st.narrowHL : k === 'sat3' ? st.satIn3d : !!st.lay[k]); });
    U.$$('[data-narrowbtn]').forEach(l => l.classList.toggle('on', st.narrowHL));
    U.$$('[data-hz]').forEach(b => b.classList.toggle('on', st.lay.haz));
    const fs = M.filtered(), area = fs.reduce((a, f) => a + f.properties.a, 0), un = fs.filter(f => f.properties.c === 'weak' || f.properties.c === 'ruin').length;
    const ms = U.$('[data-msum]'); if (ms) ms.innerHTML = `<div><b class="num">${fi(fs.length)}</b><small>پلاک از ${fi(NP)}</small></div><div><b class="num">${fa(area / 1e4, 1)}</b><small>هکتار عرصه</small></div><div><b class="num">${fa(fs.length ? un / fs.length * 100 : 0, 0)}٪</b><small>کم‌دوام و مخروبه</small></div><div><b class="num">${fa(fs.length ? fs.reduce((a, f) => a + f.properties.f, 0) / fs.length : 0, 1)}</b><small>میانگین طبقات</small></div>`;
    duals();
  };
  function duals() {
    U.$$('[data-dual]').forEach(d => {
      const k = d.dataset.dual, [a, b] = d.querySelectorAll('input'), lo = +a.min, hi = +a.max;
      const v = M.st[k]; a.value = v[0]; b.value = v[1];
      const fil = d.querySelector('.fil'); fil.style.right = ((v[0] - lo) / (hi - lo) * 100) + '%'; fil.style.left = (100 - (v[1] - lo) / (hi - lo) * 100) + '%';
      const p = d.nextElementSibling; p.querySelector('[data-v0]').textContent = k === 'fl' ? M.toFa(v[0]) + ' طبقه' : M.toFa(v[0]); p.querySelector('[data-v1]').textContent = k === 'fl' ? M.toFa(v[1]) + ' طبقه' : M.toFa(v[1]);
    });
  }

  function bind(root) {
    const st = M.st;
    root.addEventListener('click', e => {
      const t = e.target;
      const j = t.closest('[data-jump]'); if (j) { R.jump(j.dataset.jump); return; }
      const v = t.closest('.vsw [data-v]'); if (v) { M.setView(v.dataset.v); return; }
      const c = t.closest('[data-color] [data-c]'); if (c) { st.color = c.dataset.c; M.apply(); R.syncPanel(); return; }
      const cd = t.closest('[data-cond]'); if (cd) { const k = cd.dataset.cond; if (st.cond.has(k) && st.cond.size > 1) st.cond.delete(k); else st.cond.add(k); M.apply(); R.syncPanel(); return; }
      const us = t.closest('[data-use]'); if (us) { const k = us.dataset.use; if (st.use.has(k) && st.use.size > 1) st.use.delete(k); else st.use.add(k); M.apply(); R.syncPanel(); return; }
      const al = t.closest('[data-all]'); if (al) { if (al.dataset.all === 'cond') st.cond = new Set(Object.keys(M.COND)); else st.use = new Set(Object.keys(M.USE)); M.apply(); R.syncPanel(); return; }
      const lc = t.closest('.lgd [data-lc]'); if (lc) { const k = lc.dataset.lc; if (st.cond.has(k) && st.cond.size > 1) st.cond.delete(k); else st.cond.add(k); M.apply(); R.syncPanel(); return; }
      const lu = t.closest('.lgd [data-lu]'); if (lu) { const k = lu.dataset.lu; if (st.use.has(k) && st.use.size > 1) st.use.delete(k); else st.use.add(k); M.apply(); R.syncPanel(); return; }
      const ly = t.closest('[data-lyr]'); if (ly) { const k = ly.dataset.lyr; if (k === 'narrow') st.narrowHL = !st.narrowHL; else if (k === 'sat3') { st.satIn3d = !st.satIn3d; if (st.satIn3d && st.view !== '3d') M.setView('3d'); } else st.lay[k] = !st.lay[k]; M.apply(); R.syncPanel(); return; }
      if (t.closest('[data-narrowbtn]')) { st.narrowHL = !st.narrowHL; M.apply(); R.syncPanel(); if (st.narrowHL) { R.jump('s-map'); U.toast('معابر کمتر از ۶ متر روی نقشه برجسته شد', 'road'); } return; }
      if (t.closest('[data-reset]')) { st.cond = new Set(Object.keys(M.COND)); st.use = new Set(Object.keys(M.USE)); st.fl = [1, 7]; st.yb = [1310, 1404]; st.color = 'cond'; M.apply(); R.syncPanel(); return; }
      const z = t.closest('[data-z]'); if (z) { const m = M.map; ({ in: () => m.zoomIn({ duration: 250 }), out: () => m.zoomOut({ duration: 250 }), home: () => M.home(), north: () => m.easeTo({ bearing: 0, pitch: st.view === '3d' ? 58 : 0, duration: 400 }) })[z.dataset.z](); return; }
      if (t.closest('[data-play]')) { M.togglePlay(); return; }
      if (t.closest('[data-fs]')) { fullscreen(); return; }
      const lm = t.closest('[data-lm]'); if (lm) { R.jump('s-map'); const c2 = M.landmarks[lm.dataset.lm]; setTimeout(() => M.flyTo(c2, 18), 350); return; }
      const pcf = t.closest('[data-pcf] button'); if (pcf) { U.$$('[data-pcf] button').forEach(b => b.classList.toggle('on', b === pcf)); drawPercap(); return; }
      const pcc = t.closest('[data-pcc] button'); if (pcc) { U.$$('[data-pcc] button').forEach(b => b.classList.toggle('on', b === pcc)); drawCity(pcc.dataset.m); return; }
      const cat = t.closest('[data-cat]'); if (cat) { poiCat = cat.dataset.cat; U.$$('[data-cat]').forEach(b => b.classList.toggle('on', b === cat)); poiTable.draw(); return; }
      const cf = t.closest('[data-cf]'); if (cf) { st.cond = new Set([cf.dataset.cf]); M.apply(); R.syncPanel(); U.toast(`نقشه فقط «${M.COND[cf.dataset.cf].t}» را نشان می‌دهد`, 'filter'); return; }
      const ds = t.closest('[data-dist] button'); if (ds) { U.$$('[data-dist] button').forEach(b => b.classList.toggle('on', b === ds)); drawDist(ds.dataset.m); return; }
      const inc = t.closest('[data-inc] button'); if (inc) { U.$$('[data-inc] button').forEach(b => b.classList.toggle('on', b === inc)); drawInc(inc.dataset.m); return; }
      const exm = t.closest('[data-exm] button'); if (exm) { U.$$('[data-exm] button').forEach(b => b.classList.toggle('on', b === exm)); drawExpo(exm.dataset.m); return; }
      const bm = t.closest('[data-bm] button'); if (bm) { U.$$('[data-bm] button').forEach(b => b.classList.toggle('on', b === bm)); U.$$('[data-bmt] tbody tr').forEach(tr => { const a = +tr.dataset.a, c3 = +tr.dataset.c, tds = tr.querySelectorAll('td'); if (bm.dataset.m === 'rel') { tds[1].textContent = fa(a / c3 * 100, 0) + '٪'; tds[2].textContent = '۱۰۰٪'; } else { tds[1].textContent = fa(a, a < 10 ? 2 : 1); tds[2].textContent = fa(c3, c3 < 10 ? 2 : 1); } }); return; }
      const hz = t.closest('[data-hz]'); if (hz || t.closest('[data-hzmap]')) { st.lay.haz = true; M.apply(); R.syncPanel(); R.jump('s-map'); U.toast('پهنه‌های مخاطره روی نقشه نمایش داده شد', 'warn'); return; }
      const ax = t.closest('[data-ax]'); if (ax) { setAx(ax.dataset.ax); R.jump('s-pj'); return; }
      const axf = t.closest('[data-axf] button'); if (axf) { setAx(axf.dataset.a); return; }
      const pv = t.closest('[data-pv] button'); if (pv) { U.$$('[data-pv] button').forEach(b => b.classList.toggle('on', b === pv)); U.$('#t-pj .tw').style.display = pv.dataset.v === 't' ? '' : 'none'; U.$('#g-pj').style.display = pv.dataset.v === 'g' ? '' : 'none'; return; }
      const rs = t.closest('[data-rs]'); if (rs) { rs.classList.toggle('on'); rpUpdate(); return; }
      const fm = t.closest('[data-fmt]'); if (fm) { U.$$('[data-fmt]').forEach(x => x.classList.toggle('on', x === fm)); return; }
      if (t.closest('[data-gen]')) { gen(); return; }
      if (t.closest('[data-share]')) { try { navigator.clipboard.writeText(location.href); } catch (er) { } U.toast('پیوند صفحه کپی شد', 'share'); return; }
    });
    // dual ranges
    U.$$('[data-dual]').forEach(d => { const k = d.dataset.dual, [a, b] = d.querySelectorAll('input'); const on = () => { let x = +a.value, y = +b.value; if (x > y) [x, y] = [y, x]; st[k] = [x, y]; M.apply(); R.syncPanel(); }; a.addEventListener('input', on); b.addEventListener('input', on); });
    const yr = U.$('[data-year]'); yr.addEventListener('input', () => M.setYear(+yr.value));
    U.$('[data-pcs]').addEventListener('change', drawPercap);
    // map search
    const idx = M.index(); const inp = U.$('[data-msq]'), box = U.$('[data-msr]');
    let act = 0, res = [];
    const draw = () => {
      const q = U.norm(inp.value); if (!q) { box.classList.remove('on'); return; }
      res = idx.filter(x => U.norm(x.t).includes(q)).slice(0, 10); act = 0;
      box.innerHTML = res.length ? res.map((x, i) => `<button data-i="${i}" class="${i ? '' : 'act'}">${ic(x.k === 'road' ? 'road' : x.k === 'lm' ? 'star' : 'pin', 's')}<span>${U.hl(x.t, inp.value)}</span><small>${x.s}</small></button>`).join('') : '<div class="emp">نتیجه‌ای پیدا نشد</div>';
      box.classList.add('on');
    };
    const go = x => { box.classList.remove('on'); inp.value = x.t; if (x.k === 'poi') M.flyPoi(x.i); else M.flyTo(x.c, x.k === 'road' ? 17.6 : 18); };
    inp.addEventListener('input', draw); inp.addEventListener('focus', draw);
    inp.addEventListener('keydown', e => { if (!res.length) return; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { act = (act + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; U.$$('button', box).forEach((b, i) => b.classList.toggle('act', i === act)); e.preventDefault(); } if (e.key === 'Enter') go(res[act]); if (e.key === 'Escape') box.classList.remove('on'); });
    box.addEventListener('mousedown', e => { const b = e.target.closest('[data-i]'); if (b) { e.preventDefault(); go(res[+b.dataset.i]); } });
    inp.addEventListener('blur', () => setTimeout(() => box.classList.remove('on'), 120));
    // scrollspy + sticky shadow
    const view = U.$('.view'), tabsEl = U.$('.stabs');
    const spy = () => {
      const y = view.scrollTop + 90; let cur = SECS[0][0];
      SECS.forEach(([id]) => { const el = document.getElementById(id); if (el && el.offsetTop <= y) cur = id; });
      if (view.scrollTop + view.clientHeight >= view.scrollHeight - 4) cur = SECS[SECS.length - 1][0];
      U.$$('.stabs [data-jump]').forEach(b => b.classList.toggle('on', b.dataset.jump === cur));
      tabsEl.classList.toggle('stuck', tabsEl.getBoundingClientRect().top <= view.getBoundingClientRect().top + 1);
    };
    view.addEventListener('scroll', spy, { passive: true });
    R.spy = spy;
    M.on(() => R.syncPanel());
    R.syncPanel();
  }
  function setAx(a) { pjAx = a; U.$$('[data-axf] button').forEach(b => b.classList.toggle('on', b.dataset.a === a)); pjTable.draw(); }
  let fsOn = false;
  function fullscreen() {
    const c = U.$('#mapcard'); fsOn = !fsOn;
    c.style.cssText = fsOn ? 'position:fixed;inset:12px;z-index:90;height:auto;box-shadow:0 20px 60px rgba(30,41,59,.25)' : '';
    U.$('[data-fs]').innerHTML = fsOn ? `${ic('x', 'xs')}بستن تمام‌صفحه` : `${ic('expand', 'xs')}تمام‌صفحه`;
    if (fsOn) { M.map.cooperativeGestures.disable(); c.insertAdjacentHTML('afterbegin', `<button class="btn sm" data-fsx style="position:absolute;top:14px;left:14px;z-index:20">${ic('x', 'xs')}بستن</button>`); c.querySelector('[data-fsx]').onclick = fullscreen; }
    else { M.map.cooperativeGestures.enable(); const x = c.querySelector('[data-fsx]'); if (x) x.remove(); }
    setTimeout(() => { M.map.resize(); M.atlas && M.atlas.show(); }, 30);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fsOn) fullscreen(); });
})();
