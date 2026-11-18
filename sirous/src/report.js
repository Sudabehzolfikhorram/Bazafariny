/* «گزارش‌ها» — one-page report of محله سیروس.
   Key numbers first; explanations, sources and data-quality notes live in info tips (U.info). */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M, GEO = window.GEO;
  const R = window.R = {};
  const fa = U.fa, fi = U.fi, ic = U.ic, inf = U.info, tf = M.toFa;
  const SECS = [['s-map', 'نقشه', 'map'], ['s-ov', 'خلاصه', 'hood'], ['s-ph', 'کالبد و مسکن', 'build'], ['s-ec', 'اجتماعی و اقتصادی', 'people'], ['s-hz', 'مخاطرات', 'warn'], ['s-pj', 'پروژه‌ها', 'cal']];
  const SEC_D = { 's-map': 'تصویر نقشه با فیلترهای فعلی', 's-ov': 'یافته‌ها و سرانه‌ها', 's-ph': 'ابنیه، مسکن، پلاک‌ها و معابر', 's-ec': 'درآمد، معیشت و اولویت مداخله', 's-hz': 'حریم‌ها و پلاک‌های در معرض', 's-pj': 'جدول و زمان‌بندی پروژه‌ها' };
  R.SECS = SECS;
  const SHARE_URL = 'https://claude.ai/artifact/SJnE91iKRiyKB4C9qgAv9Q';
  const P = M.parcels.map(f => f.properties);
  const NP = P.length;
  const small = P.filter(p => p.a < 200).length / NP * 100;
  const roadLen = { main: 0, sec: 0, loc: 0, nar: 0 };
  GEO.roads.features.forEach(f => { if (f.properties.in && f.properties.h !== 'busway') roadLen[f.properties.k] += f.properties.L || 0; });
  const totalRoad = Object.values(roadLen).reduce((a, b) => a + b, 0);
  const cnt = k => P.filter(p => p.c === k).length;
  R.stats = { small, roadLen, totalRoad };
  const SRC = {
    sirous: 'منبع: «آشنایی با محله سیروس»',
    fars: 'منبع: قالب «پایش محلات فرسوده» · <b>مقدار نمونه</b>',
    infor: 'منبع: قالب «سکونتگاه غیررسمی» · <b>مقدار نمونه</b>',
    haz: 'منبع: قالب «مخاطرات» · <b>مقدار نمونه</b>',
    osm: 'منبع: OpenStreetMap',
    map: 'محاسبه‌شده از لایه‌های نقشه'
  };
  const tip = (txt, src) => inf((txt ? txt + '<br>' : '') + '<span class="tsrc">' + SRC[src] + '</span>');
  const AX = { haz: ['کاهش مخاطرات', 'red', 0], a1: ['توانمندسازی اجتماعی و اقتصادی', 'green', 1], a2: ['بهسازی عملکردی', 'blue', 2], a3: ['نوسازی و مقاوم‌سازی', 'orange', 3] };
  const NOW = 1405 + 7.9 / 12; // ۲۷ آبان ۱۴۰۵
  const prog = p => Math.max(0, Math.min(100, (NOW - p.y0) / (p.y1 + 1 - p.y0) * 100));
  const LATE_ST = ['شروع نشده', 'در انتظار تامین اعتبار'];

  /* ---------- head + KPIs ---------- */
  function head() {
    const about = `<b>${S.tagline}</b><br>محدوده: ${S.edges.map(e => e[0] + ' ' + e[1]).join('، ')}<br>نشانه‌ها: ${S.landmarks.join('، ')}<br>محله‌ی هدف بازآفرینی · به‌روزرسانی ${S.updated}`;
    return `<div class="ph"><div class="t">
        <div class="pre">${S.path.map(U.esc).join(` ${ic('chevl', 'xs')} `)}</div>
        <h1>محله ${S.name}${inf(about)}<button class="tag w" data-go="entry" data-tt="۵ از ۶ مرحله‌ی فرم ثبت شده؛ برای تکمیل به ورود داده بروید">${ic('clock', 'xs')}در انتظار بازبینی · ${fa(5)} از ${fa(6)} مرحله</button></h1>
      </div>
      <div class="acts"><button class="btn" data-go="entry">${ic('edit', 's')}ویرایش داده‌ها</button><button class="btn" data-share>${ic('share', 's')}اشتراک</button><button class="btn pr" data-rep>${ic('report', 's')}گزارش‌گیری</button></div></div>`;
  }
  const b0 = S.bench;
  const KPI = [
    { t: 'مساحت محله', v: 44, u: 'هکتار', ic: 'area', g: 'teal', d: `${fi(NP)} پلاک روی نقشه`, j: 's-map', tip: `تراکم ناخالص ${fa(4363 / 44, 1)} نفر در هکتار<br>محله‌ی مرجع قالب (${b0.name}): ${fa(b0.area, 1)} هکتار` },
    { t: 'بافت فرسوده', v: 57, u: '٪', ic: 'worn', g: 'orange', d: `حدود ${fa(44 * .57, 1)} هکتار`, bar: [[57, 'orange']], j: 's-ph', tip: 'سهم سطح بافت فرسوده از مساحت محله' },
    { t: 'ساکنین', v: 4363, u: 'نفر', ic: 'people', g: 'teal', d: `${fi(1445)} خانوار · بعد ${fa(4363 / 1445, 2)}`, j: 's-ec', tip: `محله‌ی مرجع قالب (${b0.name}): ${fi(b0.pop)} نفر و ${fi(b0.hh)} خانوار` },
    { t: 'بلوک‌ها', v: 1290, u: 'بلوک', ic: 'home', g: 'blue', d: `مسکونی ${fi(1018)} · تجاری ${fi(272)}`, bar: [[1018 / 1290 * 100, 'blue'], [272 / 1290 * 100, 'sky']], j: 's-ph', tip: `مسکونی ${fa(1018 / 1290 * 100, 1)}٪ و تجاری ${fa(272 / 1290 * 100, 1)}٪ از کل بلوک‌ها` },
    { t: 'واحد ناپایدار', v: 1007, u: 'واحد', ic: 'warn', g: 'red', d: `${fa(1007 / 1445, 2)} به ازای هر خانوار`, j: 's-ph', tip: `محله‌ی مرجع قالب (${b0.name}): ${fi(b0.unst)} واحد (${fa(b0.unstP, 1)}٪)` },
    { t: 'ظرفیت نوسازی', v: 3000, u: 'واحد', ic: 'build', g: 'green', d: `${fa(3000 / 1007, 1)} برابر واحدهای ناپایدار`, j: 's-pj', tip: 'ظرفیت ساخت واحد جدید در طرح بازآفرینی' }
  ];
  function kpis() {
    return `<div class="kpis">${KPI.map((k, n) => `<div class="kp" data-jump="${k.j}" data-kn="${n}" tabindex="0" role="link"><div class="kh"><span class="ic" style="background:${U.grad(k.g)}">${ic(k.ic, 'xs')}</span><span class="l">${k.t}</span>${inf(k.tip + '<br><span class="tsrc">' + SRC.sirous + '</span>')}</div><div class="v num">${fi(k.v)}<small>${k.u}</small></div><div class="d">${k.d}</div>${k.bar ? `<div class="bar">${k.bar.map(([w, g]) => `<i style="width:${w}%;background:${U.grad(g, '270deg')}"></i>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
  }
  function tabs() { return `<div class="stabs">${SECS.map(([id, t, i], n) => `<button data-jump="${id}" class="${n ? '' : 'on'}">${ic(i, 's')}${t}</button>`).join('')}</div>`; }
  const sh = (n, t, ac) => `<div class="sh"><span class="n">${tf(n)}</span><h2>${t}</h2>${ac ? `<div class="ac">${ac}</div>` : ''}</div>`;
  const ch = (t, tp, ac) => `<div class="ch"><h3>${t}</h3>${tp || ''}${ac ? `<div class="ac">${ac}</div>` : ''}</div>`;

  /* ---------- map ---------- */
  const acc = (t, body, open, extra) => `<div class="grp acc ${open ? 'open' : ''}"><div class="gt"><button data-acc>${t}${ic('chev', 'xs accc')}</button>${extra || ''}</div><div class="gbd">${body}</div></div>`;
  function mapSec() {
    const uc = {}; P.forEach(p => { uc[p.u] = (uc[p.u] || 0) + 1; });
    const ticks = [1310, 1330, 1350, 1370, 1390, 1410];
    return `<section class="sec" id="s-map">${sh(1, 'نقشه‌ی محله', `<button class="btn sm" data-fs>${ic('expand', 'xs')}تمام‌صفحه</button>`)}
      <div class="card mapcard" id="mapcard">
        <aside class="mp"><div class="hd"><b>لایه‌ها و فیلترها</b>${inf('فیلترها روی نقشه، نمای سه‌بعدی، راهنما و خلاصه‌ی بالای پنل اعمال می‌شوند. با کلیک روی هر پلاک جزئیات آن را ببینید.')}<a data-reset>بازنشانی</a></div>
          <div class="msum" data-msum></div>
          <div class="atn">${ic('info', 's')}<span>فیلترهای پلاک در نمای اطلس اعمال نمی‌شوند. برای برگشت، روی «نقشه» یا خانه‌ی «سیروس» کلیک کنید.</span></div>
          <div class="bd">
            ${acc('رنگ‌بندی پلاک‌ها', `<div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(4,1fr)" data-color>${[['cond', 'وضعیت'], ['use', 'کاربری'], ['floors', 'طبقات'], ['year', 'سال ساخت']].map(([k, t], i) => `<button data-c="${k}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>`, true)}
            ${acc('وضعیت ابنیه', `<div class="chips">${Object.entries(M.COND).map(([k, o]) => `<button class="chip on" data-cond="${k}"><i class="sw" style="background:${o.c}"></i>${o.t}<span class="c">${fi(cnt(k))}</span></button>`).join('')}</div>`, true, '<a data-all="cond">همه</a>')}
            ${acc('کاربری', `<div class="chips">${Object.entries(M.USE).map(([k, o]) => `<button class="chip on" data-use="${k}"><i class="sw" style="background:${o.c}"></i>${o.t}<span class="c">${fi(uc[k] || 0)}</span></button>`).join('')}</div>`, true, '<a data-all="use">همه</a>')}
            ${acc('طبقات و سال ساخت', `<div class="gtl">تعداد طبقات</div><div class="dual" data-dual="fl"><div class="trk"></div><div class="fil"></div><input type="range" min="1" max="7" value="1" step="1" aria-label="کمترین طبقه"><input type="range" min="1" max="7" value="7" step="1" aria-label="بیشترین طبقه"></div><div class="dvals"><span data-v0>۱ طبقه</span><span data-v1>۷ طبقه</span></div>
              <div class="gtl" style="margin-top:12px">سال ساخت</div><div class="dual" data-dual="yb"><div class="trk"></div><div class="fil"></div><input type="range" min="1310" max="1404" value="1310" step="1" aria-label="از سال"><input type="range" min="1310" max="1404" value="1404" step="1" aria-label="تا سال"></div><div class="dvals"><span data-v0>۱۳۱۰</span><span data-v1>۱۴۰۴</span></div>`, false, '<span class="muted" data-flsum style="font-size:11px"></span>')}
            ${acc('لایه‌ها', [['bound', 'مرز محله', 'map', 'teal'], ['roads', 'شبکه معابر', 'road', 'slate'], ['labels', 'نام معابر', 'info', 'slate'], ['pois', 'خدمات و نقاط شاخص', 'pin', 'blue'], ['green', 'فضای سبز', 'green', 'green'], ['haz', 'پهنه‌های مخاطره', 'warn', 'red'], ['narrow', 'معابر کمتر از ۶ متر', 'road', 'amber'], ['sat3', 'ماهواره در نمای سه‌بعدی', 'sat', 'navy']].map(([k, t, i, g]) => `<button class="lyr ${['bound', 'roads', 'labels', 'pois', 'green'].includes(k) ? 'on' : ''}" data-lyr="${k}" role="switch"><span class="lsw" style="background:${U.G[g][0]}55;color:${U.C[g]}">${ic(i, 's')}</span><span>${t}</span><i class="tg"></i></button>`).join(''), true)}
          </div></aside>
        <div class="mstage"><div id="map"></div>
          <div class="mo vsw">${[['map', 'نقشه', 'map'], ['sat', 'ماهواره', 'sat'], ['3d', 'سه‌بعدی و زمان', 'cube'], ['atlas', 'اطلس', 'grid']].map(([k, t, i], n) => `<button data-v="${k}" class="${n ? '' : 'on'}">${ic(i, 's')}${t}</button>`).join('')}</div>
          <div class="mo msearch">${ic('search', 's')}<input placeholder="جستجوی معبر، خدمات یا نشانه…" data-msq aria-label="جستجو روی نقشه"><div class="gsr" data-msr></div></div>
          <div class="mo zc"><button data-z="in" data-tt="بزرگ‌نمایی">${ic('plus', 's')}</button><button data-z="out" data-tt="کوچک‌نمایی">${ic('minus', 's')}</button><button data-z="home" data-tt="نمای کامل محله">${ic('target', 's')}</button><button data-z="north" data-tt="جهت شمال">${ic('compass', 's')}</button></div>
          <div class="mo lgd"></div>
          <div class="mo scl"></div>
          <div class="mo tline"><button class="play" data-play aria-label="پخش">${ic('play', 's')}</button><div class="yr">۱۴۰۴</div><div class="tt"><div class="tth"><span class="tph">روند ساخت بر اساس سال ساخت</span><span class="muted"><i class="fzk"></i>۱۴۰۶ تا ۱۴۱۰: پیش‌بینی</span></div><div class="trw"><i class="fz"></i><input type="range" min="1310" max="1410" value="1404" step="1" data-year aria-label="سال"></div><div class="tk2">${ticks.map(y => `<span style="${y === 1310 ? 'right:0' : y === 1410 ? 'left:0' : `right:${y - 1310}%;transform:translateX(50%)`}">${tf(y)}</span>`).join('')}</div></div><div class="cnt"></div></div>
          <div class="mtip"></div><div class="mdet"></div>
          <div class="atlas"><div class="ah"><div class="bc"></div><span class="muted ttl" style="font-size:12px"></span><div class="ac"><span class="muted" style="font-size:11.5px">اندازه:</span><div class="seg"><button class="on" data-size="value">رکوردها</button><button data-size="hoods">محله‌ها</button></div><span class="muted" style="font-size:11.5px">رنگ:</span><div class="seg"><button class="on" data-col="chg">تغییر ۳۰ روز</button><button data-col="hoods">تعداد محله</button></div><span class="al"><span class="lo">کاهش</span><span class="ramp"></span><span class="hi">افزایش</span></span><button class="btn sm" data-sirous>${ic('pin', 'xs')}منطقه‌ی ۱۲</button></div></div><div class="tm" id="atlas"></div></div>
        </div>
      </div></section>`;
  }

  /* ---------- summary: findings + per-capita + services ---------- */
  function ovSec() {
    const ins = [
      ['sport', 'red', 'کمبود سرانه‌ی ورزشی', `${fa(0.16, 2)} در برابر ${fa(0.22, 2)} مترمربع استاندارد`, 's-ov'],
      ['worn', 'amber', `${fa(24.5 + 13.5, 0)}٪ ابنیه کم‌دوام یا مخروبه`, `${fi(cnt('weak') + cnt('ruin'))} پلاک، بیشتر در بخش مرکزی`, 's-ph'],
      ['coin', 'orange', `${fa(46.7, 1)}٪ خانوار زیر حداقل دستمزد`, 'اولویت نخست: توانمندسازی اجتماعی', 's-ec'],
      ['road', 'sky', '۳۲٪ معابر کمتر از ۶ متر', `${fa(roadLen.nar / 1000, 1)} کیلومتر معبر باریک`, 's-ph'],
      ['edu', 'blue', 'مازاد سرانه‌ی آموزشی', `${fa(2.27 / 0.33, 1)} برابر استاندارد؛ قابل بازتعریف`, 's-ov'],
      ['build', 'green', `ظرفیت نوسازی ${fi(3000)} واحد`, `${fa(3000 / 1007, 1)} برابر واحدهای ناپایدار`, 's-pj']
    ];
    return `<section class="sec" id="s-ov">${sh(2, 'خلاصه')}
      <div class="grid g2">
        <div class="card fx">${ch('یافته‌های کلیدی', inf('مهم‌ترین نکته‌های داده‌های محله. با کلیک روی هر مورد به بخش مرتبط بروید.'))}<div class="cb"><div class="ins">${ins.map(([i, g, t, d, j]) => `<button class="in" data-jump="${j}">${U.icb(i, g, 'xs')}<div><b>${t}</b><p>${d}</p></div></button>`).join('')}</div></div></div>
        <div class="card fx">${ch('سرانه‌ی خدمات', tip(S.percapNote + '<br>مترمربع به ازای هر نفر. مقایسه با میانگین شهر از قالب «پایش» آمده است.', 'sirous'), `<div class="seg" data-pcv><button class="on" data-m="std">در برابر استاندارد</button><button data-m="city">در برابر میانگین شهر</button></div>`)}
          <div class="cb"><div class="pc" data-pcl></div><div class="chart" id="ch-city" style="height:196px;display:none"></div>
            <div class="svc"><span class="svt">خدمات روی نقشه ${inf('نقاط خدماتی از OpenStreetMap، داخل محدوده و ۱۲۰ متر پیرامون. با کلیک روی هر دسته، همان دسته روی نقشه نمایش داده می‌شود.')}</span><div class="chips" data-pcat></div><button class="btn sm gh" data-poit>${ic('entry', 'xs')}فهرست</button></div>
            <div id="t-poi" style="display:none;margin:12px -18px -18px;border-top:1px solid var(--ln)"></div>
          </div></div>
      </div></section>`;
  }
  function drawPercap() {
    const el = U.$('[data-pcl]'); if (!el) return;
    const mx = Math.max(...S.percap.map(r => Math.max(r.v, r.norm))) * 1.1;
    const icn = { green: ['green', 'green'], sport: ['sport', 'orange'], health: ['health', 'red'], edu: ['edu', 'blue'] };
    el.innerHTML = S.percap.map(r => { const ok = r.v >= r.norm; return `<div class="pcr"><div class="nm"><i style="background:${U.grad(icn[r.k][1])}">${ic(icn[r.k][0], 'xs')}</i>${r.t}</div>
      <div class="pbar" data-tt="${r.t}: ${fa(r.v, 2)} مترمربع · استاندارد ${fa(r.norm, 2)} · ${fa(r.v / r.norm, 2)} برابر"><div class="f" style="width:${r.v / mx * 100}%;background:${U.grad(ok ? 'teal' : 'orange', '270deg')}"></div><div class="nrm" style="right:${r.norm / mx * 100}%"></div><div class="vl" style="right:calc(${Math.max(r.v, r.norm) / mx * 100}% + 8px)">${fa(r.v, 2)}</div></div>
      <span class="badge ${ok ? 'b-ok' : 'b-er'}">${ok ? 'مناسب' : 'کمبود'}</span></div>`; }).join('') + `<div class="pcl"><span><i class="nrmk"></i>استاندارد</span><span><i style="background:${U.grad('teal')}"></i>بالاتر از استاندارد</span><span><i style="background:${U.grad('orange')}"></i>کمبود</span></div>`;
  }
  let cityChart;
  function drawCity() {
    const d = S.percapCity;
    const o = {
      grid: { top: 22, right: 34, left: 8, bottom: 26 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>محله: ${fa(ps[0].value, 1)}<br>میانگین شهر: ${fa(ps[1].value, 1)}<br>${fa(ps[0].value / ps[1].value * 100, 0)}٪ از میانگین شهر` }, U.tipStyle),
      legend: { show: false },
      xAxis: { type: 'category', inverse: true, data: d.map(r => r.t), axisLabel: U.axisTxt, axisLine: { lineStyle: { color: '#E4E9F0' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: Object.assign({ formatter: v => fa(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } }, position: 'right' },
      series: [
        { name: 'محله', type: 'bar', barWidth: 18, barGap: '25%', data: d.map(r => r.hood), itemStyle: { color: U.egv('navy'), borderRadius: [5, 5, 0, 0] }, label: { show: true, position: 'top', formatter: p => fa(p.value, 1), fontFamily: 'Vazirmatn', fontWeight: 500, fontSize: 11, color: '#1E40AF' } },
        { name: 'میانگین شهر', type: 'bar', barWidth: 18, data: d.map(r => r.city), itemStyle: { color: U.egv('sky'), borderRadius: [5, 5, 0, 0] }, label: { show: true, position: 'top', formatter: p => fa(p.value, 1), fontFamily: 'Vazirmatn', fontWeight: 500, fontSize: 11, color: '#3B8FD6' } }
      ]
    };
    if (!cityChart) cityChart = U.chart(U.$('#ch-city'), o); else cityChart.setOption(o, true);
  }
  let poiTable;
  function poiSec() {
    const rows = M.pois.filter(f => f.properties.n).map(f => { const p = f.properties, inf2 = M.poiInfo(p.k); return { i: p.i, n: p.n, cat: inf2[0], ic: inf2[1], col: inf2[2], loc: isIn(f.geometry.coordinates) ? 'داخل محله' : 'پیرامون' }; });
    const cats = {}; rows.forEach(r => { cats[r.cat] = (cats[r.cat] || 0) + 1; });
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    U.$('[data-pcat]').innerHTML = `<button class="chip on" data-cat="">همه<span class="c">${fi(rows.length)}</span></button>` + top.map(([c, n]) => { const col = rows.find(r => r.cat === c).col; return `<button class="chip" data-cat="${c}"><i class="sw" style="background:${col}"></i>${c}<span class="c">${fi(n)}</span></button>`; }).join('');
    U.$('[data-poit]').innerHTML = `${ic('entry', 'xs')}فهرست (${fi(rows.length)})`;
    poiTable = U.table(U.$('#t-poi'), [
      { k: 'n', t: 'نام', render: (r, q) => `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:24px;height:24px;border-radius:7px;display:inline-grid;place-items:center;color:#fff;background:${r.col}">${ic(r.ic, 'xs')}</span><span class="t1">${U.hl(r.n, q)}</span></span>` },
      { k: 'cat', t: 'دسته' }, { k: 'loc', t: 'موقعیت', render: r => `<span class="badge ${r.loc === 'داخل محله' ? 'b-pr' : 'b-mu'}">${r.loc}</span>` },
      { k: 'act', t: '', sort: false, w: '110px', render: () => `<button class="btn sm gh">${ic('pin', 'xs')}روی نقشه</button>` }
    ], rows, { ph: 'جستجوی نام خدمات…', search: ['n', 'cat'], sort: 'cat', filters: [{ k: 'loc', t: 'موقعیت', opts: ['داخل محله', 'پیرامون'] }], pre: r => !M.st.poiCat || r.cat === M.st.poiCat, maxh: 300, onRow: r => { R.jump('s-map'); setTimeout(() => M.flyPoi(r.i), 350); } });
  }
  function isIn(pt) { const ring = GEO.bound.geometry.coordinates[0]; let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }

  /* ---------- physical & housing ---------- */
  function phSec() {
    const cs = S.cond;
    const bars = S.council.map(c => [c.t, c.v, c.g, c.s]).concat([['ریزدانگی', small, 'teal', 'سهم پلاک‌های کمتر از ۲۰۰ مترمربع (محاسبه از نقشه)']]);
    const over = bars.filter(b => b[1] >= 50).length;
    const H = S.housing, cap = H[3].v, seg = [['واحد موجود', H[0].v, 'blue'], ['در حال ساخت', H[4].v, 'teal'], ['قابل برنامه‌ریزی', H[5].v, 'green']];
    return `<section class="sec" id="s-ph">${sh(3, 'کالبد و مسکن')}
      <div class="grid g-73">
        <div class="card">${ch('کیفیت ابنیه', tip('روی هر دسته در نمودار یا فهرست کلیک کنید تا نقشه فقط همان دسته را نشان دهد. تعداد پلاک‌ها از نقشه محاسبه شده است.', 'fars'))}
          <div class="cb qa">
            <div class="qd"><div class="chart" id="ch-cond" style="height:170px"></div>
              <div class="cl2">${cs.map(c => `<button data-cf="${c.k}"><i style="background:${U.grad(c.g)}"></i><span>${c.t}</span><b class="num">${fa(c.v, 1)}٪</b><small class="num">${fi(cnt(c.k))} پلاک</small></button>`).join('')}</div></div>
            <div class="qi"><div class="qt">شاخص‌های شناسایی بافت فرسوده ${inf('شاخص‌های مصوب شورای عالی معماری و شهرسازی. خط عمودی آستانه‌ی ۵۰٪ است.<br>' + S.councilNote + '<br><span class="tsrc">' + SRC.fars + '</span>')}</div>
              <div class="gauge">${bars.map(([t, v, g, s]) => `<div class="gr" data-tt="${s}"><div class="t">${t}</div><div class="v num">${fa(v, 1)}٪</div><div class="tr"><i style="width:${v}%;background:${U.grad(v >= 50 ? 'orange' : g, '270deg')}"></i><em style="right:50%"></em></div></div>`).join('')}</div>
              <div class="qf">${ic(over ? 'warn' : 'check', 's')}<span>${over ? `${fi(over)} شاخص بالاتر از آستانه است.` : 'همه‌ی شاخص‌ها پایین‌تر از آستانه‌ی ۵۰٪ هستند.'} خروج از فهرست محلات هدف: <b>${fi(S.exit.cost)} میلیارد ریال</b> · ${fa(S.exit.projects)} پروژه و ${fa(S.exit.actions)} اقدام</span></div>
            </div>
          </div></div>
        <div class="card fx">${ch('ظرفیت مسکن', tip('ظرفیت کل واحد مسکونی محله، از واحدهای موجود تا ظرفیت قابل برنامه‌ریزی.', 'fars'))}
          <div class="cb hs"><div class="big"><b class="num">${fi(cap)}</b><span>واحد ظرفیت کل</span></div>
            <div class="stk1">${seg.map(([t, v, g]) => `<i style="width:${v / cap * 100}%;background:${U.grad(g, '270deg')}" data-tt="${t}: ${fi(v)} واحد (${fa(v / cap * 100, 1)}٪)"></i>`).join('')}</div>
            <div class="hl3">${seg.map(([t, v, g]) => `<div><i style="background:${U.grad(g)}"></i><span>${t}</span><b class="num">${fi(v)}</b><small class="num">${fa(v / cap * 100, 0)}٪</small></div>`).join('')}</div>
            <div class="mini2"><div><b class="num">${fa(H[1].v, 1)}</b><small>نفر در هکتار</small></div><div><b class="num">${fa(H[2].v, 1)}</b><small>واحد مسکونی در هکتار</small></div></div>
          </div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card">${ch('ساختار پلاک‌ها', tip('توزیع پلاک‌های روی نقشه بر اساس طبقات، سال ساخت یا مساحت.', 'map'), `<div class="seg" data-dist><button class="on" data-m="f">طبقات</button><button data-m="y">سال ساخت</button><button data-m="a">مساحت</button></div>`)}<div class="cb"><div class="chart" id="ch-dist" style="height:200px"></div></div></div>
        <div class="card">${ch('شبکه معابر', tip(`طول معابر داخل محدوده به تفکیک نوع. تراکم شبکه ${fa(totalRoad / 1000 / GEO.meta.ha, 2)} کیلومتر در هکتار.`, 'osm'))}<div class="cb"><div class="rdw"><div class="chart" id="ch-road" style="height:170px"></div><div class="gauge" style="gap:9px" data-roadlg></div></div>
          <button class="lyr" data-narrowbtn role="switch" style="margin-top:8px"><span class="lsw" style="background:#FFE08A55;color:#F59F00">${ic('road', 's')}</span><span>نمایش ${fa(roadLen.nar / 1000, 1)} کیلومتر معبر کمتر از ۶ متر روی نقشه</span><i class="tg"></i></button></div></div>
      </div></section>`;
  }
  let condChart, distChart, roadChart;
  function drawCond() {
    condChart = U.chart(U.$('#ch-cond'), {
      tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(p.value, 1)}٪ از ابنیه<br><span style="color:#7A8798">${fi(cnt(S.cond[p.dataIndex].k))} پلاک روی نقشه</span>` }, U.tipStyle),
      series: [{ type: 'pie', radius: ['58%', '88%'], center: ['50%', '50%'], padAngle: 2, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'center', formatter: () => `{a|${fa(38, 0)}٪}\n{b|ناپایدار}`, rich: { a: { fontSize: 20, fontWeight: 600, fontFamily: 'Vazirmatn', color: '#1E293B' }, b: { fontSize: 11, fontFamily: 'Vazirmatn', color: '#7A8798' } } }, emphasis: { scale: true, scaleSize: 4, label: { show: true } }, labelLine: { show: false },
        data: S.cond.map(c => ({ name: c.t, value: c.v, itemStyle: { color: U.eg(c.g) } })) }]
    });
    condChart.on('click', p => filterCond(S.cond[p.dataIndex].k));
  }
  function filterCond(k) { M.st.cond = new Set([k]); M.apply(); R.syncPanel(); U.toast(`نقشه فقط «${M.COND[k].t}» را نشان می‌دهد`, 'filter'); }
  function drawDist(m) {
    let cats, vals, g;
    if (m === 'f') { cats = [1, 2, 3, 4, 5, 6, 7].map(v => fa(v) + ' طبقه'); vals = [1, 2, 3, 4, 5, 6, 7].map(v => P.filter(p => p.f === v).length); g = 'teal'; }
    else if (m === 'y') { const bins = [[1310, 1339, 'قبل از ۱۳۴۰'], [1340, 1357, '۱۳۴۰–۵۷'], [1358, 1374, '۱۳۵۸–۷۴'], [1375, 1389, '۱۳۷۵–۸۹'], [1390, 1404, '۱۳۹۰–۱۴۰۴']]; cats = bins.map(b => b[2]); vals = bins.map(b => P.filter(p => p.yb >= b[0] && p.yb <= b[1]).length); g = 'blue'; }
    else { const bins = [[0, 99, 'زیر ۱۰۰ م²'], [100, 199, '۱۰۰–۲۰۰'], [200, 299, '۲۰۰–۳۰۰'], [300, 499, '۳۰۰–۵۰۰'], [500, 1e9, 'بالای ۵۰۰']]; cats = bins.map(b => b[2]); vals = bins.map(b => P.filter(p => p.a >= b[0] && p.a <= b[1]).length); g = 'amber'; }
    const o = { grid: { top: 22, right: 8, left: 36, bottom: 26 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>${fi(ps[0].value)} پلاک (${fa(ps[0].value / NP * 100, 1)}٪)` }, U.tipStyle),
      xAxis: { type: 'category', inverse: true, data: cats, axisLabel: Object.assign({ interval: 0 }, U.axisTxt), axisTick: { show: false }, axisLine: { lineStyle: { color: '#E4E9F0' } } },
      yAxis: { type: 'value', position: 'right', axisLabel: Object.assign({ formatter: v => fi(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } } },
      series: [{ type: 'bar', barWidth: '54%', data: vals, itemStyle: { color: U.egv(g), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', formatter: p => fi(p.value), fontFamily: 'Vazirmatn', fontSize: 11, color: '#475569' } }] };
    if (!distChart) distChart = U.chart(U.$('#ch-dist'), o); else distChart.setOption(o, true);
  }
  function drawRoad() {
    const items = [['main', 'شریانی اصلی', 'navy'], ['sec', 'جمع‌وپخش', 'blue'], ['loc', 'محلی (۶ متر و بیشتر)', 'sky'], ['nar', 'کمتر از ۶ متر', 'amber']];
    roadChart = U.chart(U.$('#ch-road'), {
      tooltip: Object.assign({ trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fa(p.value / 1000, 2)} کیلومتر · ${fa(p.percent, 1)}٪` }, U.tipStyle),
      series: [{ type: 'pie', radius: ['56%', '88%'], center: ['50%', '50%'], padAngle: 2, itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'center', formatter: () => `{a|${fa(totalRoad / 1000, 1)}}\n{b|کیلومتر}`, rich: { a: { fontSize: 18, fontWeight: 600, fontFamily: 'Vazirmatn', color: '#1E293B' }, b: { fontSize: 10.5, fontFamily: 'Vazirmatn', color: '#7A8798' } } }, emphasis: { scale: true, scaleSize: 4, label: { show: true } }, data: items.map(([k, t, g]) => ({ name: t, value: Math.round(roadLen[k]), itemStyle: { color: U.eg(g) } })) }]
    });
    U.$('[data-roadlg]').innerHTML = items.map(([k, t, g]) => `<div class="rlg"><i style="background:${U.grad(g)}"></i><span>${t}</span><b class="num">${fa(roadLen[k] / totalRoad * 100, 1)}٪</b></div>`).join('');
  }

  /* ---------- economic & social ---------- */
  function ecSec() {
    const pj = a => S.projects.filter(x => x.ax === a);
    const nine = S.projects.filter(x => x.ax !== 'haz');
    return `<section class="sec" id="s-ec">${sh(4, 'اجتماعی و اقتصادی')}
      <div class="grid g-73">
        <div class="card">${ch('درآمد و معیشت خانوارها', inf('کنترل کیفیت داده: در قالب مرجع، سهم «درآمد متوسط» ۱۸٫۳٪ و «طبقه ۳ (متوسط)» ۱۸٫۷٪ ثبت شده است. مجموع طبقات ۱۰۰٫۴٪ می‌شود و پیش از انتشار نهایی باید بازبینی شود.<br><span class="tsrc">' + SRC.infor + '</span>', 'w'), `<div class="seg" data-inc><button class="on" data-m="p">درصد</button><button data-m="h">تعداد خانوار</button></div>`)}
          <div class="cb"><div class="mstat">${S.informal.map(k => `<div><span class="ic" style="background:${U.grad(k.g)}">${ic(k.ic, 'xs')}</span><div><b class="num">${fa(k.v, 1)}<small>${k.u}</small></b><span>${k.t}</span></div></div>`).join('')}</div><div data-incb></div></div></div>
        <div class="card fx">${ch('اولویت رویکرد مداخله', inf('با کلیک روی هر رویکرد، پروژه‌های آن را در جدول پروژه‌ها ببینید.<br>شاخص‌هایی که هنوز داده ندارند: ' + S.otherInd.join('، ') + '<br><span class="tsrc">' + SRC.infor + '</span>'))}
          <div class="cb"><div class="prl">${S.priority.map(p => { const L = pj('a' + p.n); return `<button class="pri" data-ax="a${p.n}"><span class="rk" style="background:${U.grad(p.g)}">${tf(p.n)}</span><div><b>${p.t}</b><small>${fi(L.length)} پروژه · ${fi(L.reduce((a, x) => a + x.rial, 0))} میلیارد ریال</small></div>${ic('chevl', 's')}</button>`; }).join('')}</div>
            <div class="prt"><span>مجموع ${fi(nine.length)} پروژه</span><b class="num">${fi(nine.reduce((a, x) => a + x.rial, 0))} <small>میلیارد ریال</small></b><span class="muted">${tf(1404)} تا ${tf(1409)}</span></div></div></div>
      </div></section>`;
  }
  function drawInc(m) {
    const hh = v => Math.round(v / 100 * 1445);
    const row = (t, list) => `<div class="stk"><div class="sl">${t}</div><div class="sbar">${list.map(x => `<i style="width:${x.v}%;background:${U.grad(x.g, '270deg')}" data-tt="${x.t}${x.s ? ' (' + x.s + ')' : ''}: ${fa(x.v, 1)}٪ · حدود ${fi(hh(x.v))} خانوار">${x.v >= 7 ? `<span>${m === 'h' ? fi(hh(x.v)) : fa(x.v, 1) + '٪'}</span>` : ''}</i>`).join('')}</div>
      <div class="slg">${list.map(x => `<span><i style="background:${U.grad(x.g)}"></i>${x.s ? x.t + ' · ' + x.s : x.t}</span>`).join('')}</div></div>`;
    // one colour language for both bars: low income → warm, high income → blue
    const IG = ['red', 'amber', 'green', 'sky', 'blue'];
    U.$('[data-incb]').innerHTML = row('سطح درآمد', S.income.map((x, i) => Object.assign({}, x, { g: IG[i] || x.g }))) + row('طبقات معیشتی', S.tiers);
  }

  /* ---------- hazards ---------- */
  function hzSec() {
    return `<section class="sec" id="s-hz">${sh(5, 'مخاطرات', `<button class="btn sm" data-hzmap>${ic('map', 'xs')}همه روی نقشه</button>`)}
      <div class="card">${ch('حریم‌ها و پلاک‌های در معرض', inf('سهم هر حریم از مساحت محله و درصد مواجهه از قالب «مخاطرات» آمده است. با کلیک روی هر حریم، همان حریم روی نقشه نمایش داده می‌شود.<br>شاخص‌های بدون مصداق در محدوده: ' + S.hazMissing.join('، ') + '<br><span class="tsrc">' + SRC.haz + '</span>'), `<div class="seg" data-exm><button class="on" data-m="n">تعداد پلاک</button><button data-m="p">درصد</button></div>`)}
        <div class="cb hzg">
          <div class="hzl">${S.hazards.map(h => `<button class="hzr" data-hz="${h.k}">${U.icb(h.ic, h.g, 'xs')}<div class="hn"><b>${h.t}</b><div class="hb"><i style="width:${h.pct}%;background:${U.grad(h.g, '270deg')}"></i></div></div><div class="hv"><b class="num">${fa(h.pct)}٪</b><small>≈ ${fa(44 * h.pct / 100, 1)} هکتار</small></div><span class="hx" data-tt="درصد مواجهه با این مخاطره · در قالب مرجع ${fi(h.ref)} هکتار">مواجهه ${fa(h.exp)}٪</span></button>`).join('')}</div>
          <div class="hzc"><div class="chart" id="ch-expo" style="height:200px"></div><div class="hzins" data-hzins></div></div>
        </div></div></section>`;
  }
  let expoChart;
  function drawExpo(m) {
    const ks = S.hazards.map(h => h.k);
    const by = c => ks.map(k => P.filter(p => p.c === c && p.hz && p.hz.split(',').includes(k)).length);
    const tot = ks.map(k => P.filter(p => p.hz && p.hz.split(',').includes(k)).length);
    const ser = S.cond.slice().reverse().map(c => ({ name: c.t, type: 'bar', stack: 's', barWidth: 20, data: by(c.k).map((v, i) => m === 'p' ? (tot[i] ? v / tot[i] * 100 : 0) : v), itemStyle: { color: U.eg(c.g, true) }, emphasis: { focus: 'series' } }));
    const o = { grid: { top: 8, right: 150, left: 36, bottom: 24 }, tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>` + ps.map(p => `${p.marker}${p.seriesName}: ${m === 'p' ? fa(p.value, 1) + '٪' : fi(p.value) + ' پلاک'}`).join('<br>') }, U.tipStyle),
      yAxis: { type: 'category', data: S.hazards.map(h => h.t), position: 'right', axisLabel: { fontSize: 11.5, color: '#475569', fontFamily: 'Vazirmatn' }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#E4E9F0' } } },
      xAxis: { type: 'value', inverse: true, max: m === 'p' ? 100 : null, axisLabel: Object.assign({ formatter: v => m === 'p' ? fa(v) + '٪' : fi(v) }, U.axisTxt), splitLine: { lineStyle: { color: '#EEF2F6' } } }, series: ser };
    if (!expoChart) expoChart = U.chart(U.$('#ch-expo'), o); else expoChart.setOption(o, true);
    const fu = P.filter(p => p.hz && p.hz.includes('fault') && (p.c === 'weak' || p.c === 'ruin')).length;
    const any = P.filter(p => p.hz).length;
    U.$('[data-hzins]').innerHTML = `<span class="lgx">${S.cond.map(c => `<span><i style="background:${U.grad(c.g)}"></i>${c.t}</span>`).join('')}</span><span>${fi(any)} پلاک (${fa(any / NP * 100, 1)}٪) در دست‌کم یک حریم؛ <b>${fi(fu)} پلاک کم‌دوام یا مخروبه</b> در حریم گسل اولویت مقاوم‌سازی دارند.</span>`;
  }

  /* ---------- projects ---------- */
  function pjSec() {
    return `<section class="sec" id="s-pj">${sh(6, 'برنامه‌ها و پروژه‌ها')}
      <div class="card"><div class="ch"><h3>اقدامات و پروژه‌ها</h3>${inf('اقدامات کاهش مخاطرات از قالب «مخاطرات» و پروژه‌های رویکردهای مداخله از قالب «سکونتگاه غیررسمی» آمده‌اند.<br>اعتبار پروژه‌های قالب سکونتگاه به میلیارد تومان ثبت شده و برای جمع‌پذیری به میلیارد ریال تبدیل شده است (×۱۰).<br>«تأخیر در شروع» یعنی زمان شروع برنامه گذشته و پروژه هنوز آغاز نشده است.')}</div><div class="pk" data-pk></div>
        <div class="tbar" style="border-bottom:0;padding-bottom:0"><div class="seg" data-axf><button class="on" data-a="">همه</button>${Object.entries(AX).map(([k, [t, , r]]) => `<button data-a="${k}">${r ? `<span class="rkx">${tf(r)}</span>` : ''}${t}</button>`).join('')}</div><span style="flex:1"></span><div class="seg" data-pv><button class="on" data-v="t">${ic('entry', 'xs')}جدول</button><button data-v="g">${ic('cal', 'xs')}زمان‌بندی</button></div></div>
        <div id="t-pj"></div><div class="gantt" id="g-pj" style="display:none"></div>
      </div></section>`;
  }
  let pjTable, pjAx = '';
  function drawPj() {
    const rows = S.projects.map((p, i) => Object.assign({}, p, { n: i + 1, axT: AX[p.ax][0], range: `${tf(p.y0)}–${tf(p.y1)}`, pr: prog(p), late: prog(p) > 0 && LATE_ST.includes(p.st) }));
    const cols = [
      { k: 'n', t: '#', w: '44px', num: true, render: r => tf(r.n) },
      { k: 't', t: 'عنوان اقدام / پروژه', render: (r, q) => `<div class="t1">${U.hl(r.t, q)}</div><div class="t2">${U.hl(r.loc, q)}</div>` },
      { k: 'axT', t: 'محور', render: r => `<span class="ax" style="background:${U.G[AX[r.ax][1]][0]}40;color:${U.C[AX[r.ax][1]]}">${r.axT}</span>` },
      { k: 'range', t: 'زمان‌بندی', sort: r => r.y0 * 10000 + r.y1, num: true },
      { k: 'rial', t: 'اعتبار (میلیارد ریال)', num: true, sort: r => r.rial, render: r => `<b>${fi(r.rial)}</b>${r.unit === 't' ? `<div class="t2">${fi(r.b0)} میلیارد تومان</div>` : ''}` },
      { k: 'st', t: 'وضعیت', render: r => U.statusBadge(r.st) },
      { k: 'pr', t: 'پیشرفت زمانی', sort: r => r.pr, render: r => `<div class="prg"><div class="b"><i style="width:${r.pr}%;background:${U.grad(r.late ? 'amber' : r.pr >= 100 ? 'green' : 'teal', '270deg')}"></i></div><span>${fa(r.pr, 0)}٪</span></div>${r.late ? `<div class="late">${ic('warn', 'xs')}تأخیر در شروع</div>` : ''}` }
    ];
    pjTable = U.table(U.$('#t-pj'), cols, rows, {
      ph: 'جستجوی عنوان یا موقعیت…', search: ['t', 'loc', 'axT', 'st'], filters: [{ k: 'st', t: 'وضعیت', opts: [...new Set(rows.map(r => r.st))] }, { k: 'y0', t: 'سال شروع', opts: [...new Set(rows.map(r => String(r.y0)))].sort() }],
      pre: r => !pjAx || r.ax === pjAx, maxh: 440,
      foot: rs => `<tr><td></td><td>جمع ${fi(rs.length)} ردیف</td><td></td><td></td><td class="num">${fi(rs.reduce((a, r) => a + r.rial, 0))}</td><td colspan="2"></td></tr>`,
      after: rs => { pk(rs); gantt(rs); }
    });
    U.$$('#t-pj [data-f="y0"] option').forEach(o => { if (o.value) o.textContent = tf(o.value); });
  }
  function pk(rs) {
    const t = rs.reduce((a, r) => a + r.rial, 0), run = rs.filter(r => r.st === 'در حال اجرا').length, late = rs.filter(r => r.late).length, dur = rs.length ? rs.reduce((a, r) => a + (r.y1 - r.y0 + 1), 0) / rs.length : 0;
    U.$('[data-pk]').innerHTML = `<div><small>اقدام و پروژه</small><b class="num">${fi(rs.length)}</b></div><div><small>اعتبار کل</small><b class="num">${fi(t)} <span>میلیارد ریال</span></b></div><div><small>در حال اجرا</small><b class="num">${fi(run)}</b></div><div class="${late ? 'wa' : ''}"><small>تأخیر در شروع</small><b class="num">${fi(late)}</b></div><div><small>میانگین مدت اجرا</small><b class="num">${fa(dur, 1)} <span>سال</span></b></div>`;
  }
  function gantt(rs) {
    const el = U.$('#g-pj'); const Y0 = 1404, N = 6;
    const pos = y => (y - Y0) / N * 100;
    el.innerHTML = `<div class="gth"><div></div><div class="yrs">${Array.from({ length: N }, (_, i) => `<span>${tf(Y0 + i)}</span>`).join('')}</div></div><div style="position:relative">${rs.map(r => `<div class="grw"><div class="gt2"><span class="ax" style="background:${U.G[AX[r.ax][1]][0]}40;color:${U.C[AX[r.ax][1]]};padding:0 6px">${tf(r.n)}</span><span data-tt="${U.esc(r.t)}">${U.esc(r.t)}</span></div><div class="gl"><div class="gb" style="right:${pos(r.y0)}%;width:${pos(r.y1 + 1) - pos(r.y0)}%;background:${U.grad(r.late ? 'amber' : AX[r.ax][1], '270deg')}" data-tt="${U.esc(r.t)} · ${r.range} · ${fi(r.rial)} میلیارد ریال · ${r.st}">${fi(r.rial)} م.ر</div></div></div>`).join('')}
      <div class="today" style="right:calc(300px + (100% - 300px) * ${pos(NOW) / 100})"><span>امروز</span></div></div>`;
  }
  function setAx(a) { pjAx = a; U.$$('[data-axf] button').forEach(b => b.classList.toggle('on', b.dataset.a === a)); pjTable.draw(); }

  /* ---------- report builder (modal) ---------- */
  const HIST = [['PDF', 'گزارش کامل محله سیروس', '۲۰ آبان ۱۴۰۵ · مریم احمدی'], ['CSV', 'جدول پروژه‌ها و اعتبارات', '۱۲ آبان ۱۴۰۵ · رضا کاظمی']];
  function openReport() {
    const fmts = [['pdf', 'PDF / چاپ', 'red', 'print'], ['csv', 'اکسل (CSV)', 'green', 'entry'], ['png', 'تصویر نقشه', 'blue', 'map']];
    const hist = () => HIST.map(([f, t, d]) => `<div><span class="fi" style="background:${U.grad(f === 'PDF' ? 'red' : f === 'CSV' ? 'green' : 'blue')}">${f}</span><div style="flex:1;min-width:0"><b>${t}</b><div class="muted" style="font-size:11px">${d}</div></div></div>`).join('');
    U.modal({ title: 'گزارش‌گیری', wide: true, ok: `${ic('dl', 's')}ساخت گزارش`,
      body: `<div class="rb"><div><div class="rbt">بخش‌ها</div><div class="rbs">${SECS.map(([id, t]) => `<div class="ck on" data-rs="${id}" role="checkbox" aria-checked="true" tabindex="0"><span class="bx">${ic('check', 'xs')}</span><div><b>${t}</b><small>${SEC_D[id]}</small></div></div>`).join('')}</div>
        <div class="rbt" style="margin-top:14px">قالب خروجی</div><div class="fmt">${fmts.map(([k, t, g, i], n) => `<div class="ck ${n ? '' : 'on'}" data-fmt="${k}" role="radio" tabindex="0"><span class="ii" style="background:${U.grad(g)}">${ic(i, 's')}</span><b>${t}</b></div>`).join('')}</div></div>
        <div><div class="rbt">گزارش‌های اخیر</div><div class="hist" data-hist>${hist()}</div></div></div>`,
      onOpen: box => {
        box.addEventListener('click', e => {
          const rs = e.target.closest('[data-rs]'); if (rs) { rs.classList.toggle('on'); rs.setAttribute('aria-checked', rs.classList.contains('on')); box.querySelector('[data-mok]').disabled = !box.querySelector('[data-rs].on'); return; }
          const fm = e.target.closest('[data-fmt]'); if (fm) box.querySelectorAll('[data-fmt]').forEach(x => x.classList.toggle('on', x === fm));
        });
      },
      onOk: box => {
        const on = [...box.querySelectorAll('[data-rs].on')].map(e => e.dataset.rs), fmt = box.querySelector('[data-fmt].on').dataset.fmt;
        if (!on.length) { U.toast('دست‌کم یک بخش را انتخاب کنید', 'warn'); return false; }
        gen(on, fmt);
        HIST.unshift([fmt === 'pdf' ? 'PDF' : fmt.toUpperCase(), fmt === 'png' ? 'تصویر نقشه‌ی محله سیروس' : `گزارش ${fi(on.length)} بخشی محله سیروس`, `${S.updated} · شما`]);
      } });
  }
  R.openReport = openReport;
  function csvOut(on) {
    const L = [];
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    L.push(['گزارش محله سیروس', S.updated].map(q).join(','));
    L.push(''); L.push(q('شاخص‌های کلیدی')); S.kpi.forEach(k => L.push([k.t, k.v, k.u].map(q).join(',')));
    if (on.includes('s-ov')) { L.push(''); L.push(['سرانه', 'استاندارد', 'سیروس', 'وضعیت'].map(q).join(',')); S.percap.forEach(r => L.push([r.t, r.norm, r.v, r.v >= r.norm ? 'مناسب' : 'کمبود'].map(q).join(','))); }
    if (on.includes('s-ph')) { L.push(''); L.push(['وضعیت ابنیه', 'درصد', 'پلاک روی نقشه'].map(q).join(',')); S.cond.forEach(c => L.push([c.t, c.v, cnt(c.k)].map(q).join(','))); S.council.forEach(c => L.push([c.t, c.v + '%'].map(q).join(','))); S.housing.forEach(h => L.push([h.t, h.v, h.u].map(q).join(','))); }
    if (on.includes('s-ec')) { L.push(''); S.informal.forEach(k => L.push([k.t, k.v, k.u].map(q).join(','))); S.income.forEach(k => L.push([k.t, k.v + '%'].map(q).join(','))); S.tiers.forEach(k => L.push([k.t + ' (' + k.s + ')', k.v + '%'].map(q).join(','))); }
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
  R.download = download;
  function mapShot() {
    return new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      M.map.once('render', () => { try { fin(M.map.getCanvas().toDataURL('image/jpeg', .9)); } catch (e) { fin(''); } });
      M.map.triggerRepaint(); setTimeout(() => fin(''), 2500); });
  }
  async function printable(on) {
    const css = U.$$('style').map(s => s.textContent).join('\n');
    U.charts.forEach((c, i) => { const d = c.getDom(); if (d && d.offsetParent) d.setAttribute('data-ci', i); });
    const img = on.includes('s-map') ? await mapShot() : '';
    const parts = [U.$('[data-page="reports"] .wrap > .ph'), U.$('[data-page="reports"] .wrap > .kpis')].filter(Boolean).map(e => e.cloneNode(true));
    on.forEach(id => { const s = document.getElementById(id); if (s) parts.push(s.cloneNode(true)); });
    parts.forEach(p => {
      p.querySelectorAll('[data-ci]').forEach(d => { let u = ''; try { u = U.charts[+d.dataset.ci].getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }); } catch (e) {} d.innerHTML = u ? `<img src="${u}" alt="" style="width:100%;height:100%;object-fit:contain">` : ''; });
      const st = p.querySelector('.mstage'); if (st) st.innerHTML = img ? `<img src="${img}" alt="نقشه‌ی محله سیروس" style="width:100%;height:100%;object-fit:cover;display:block">` : '';
      p.querySelectorAll('.inf,[data-poit],#t-poi').forEach(x => x.remove());
    });
    U.$$('[data-ci]').forEach(d => d.removeAttribute('data-ci'));
    const extra = 'html,body{background:#fff!important;height:auto!important;overflow:visible!important}.rwrap{max-width:1200px;margin:0 auto;padding:24px}.rwrap .sec{break-inside:avoid-page;margin-bottom:22px}.stabs,.mapcard .mp,.vsw,.msearch,.zc,.lgd,.tline,.mtip,.mdet,[data-fs],.tipx{display:none!important}.mapcard{grid-template-columns:1fr!important}.mstage{height:540px}.rwrap .ph .btn,.rwrap .ph .tag{display:none!important}.rwrap .ch .ac,.rwrap .sh .ac,.rwrap .tbar,.rwrap [data-narrowbtn]{display:none!important}';
    return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>گزارش محله سیروس</title><style>${css}\n${extra}</style></head><body><div class="wrap rwrap">${parts.map(p => p.outerHTML).join('')}</div><script>addEventListener('load',function(){setTimeout(function(){print()},600)})<\/script></body></html>`;
  }
  R.printable = printable;
  function gen(on, fmt) {
    if (fmt === 'csv') { download('sirous-report.csv', new Blob([csvOut(on)], { type: 'text/csv;charset=utf-8' })).then(ok => { if (ok) U.toast('فایل CSV ساخته شد', 'dl'); }); }
    else if (fmt === 'png') { M.map.once('render', () => { M.map.getCanvas().toBlob(b => { if (b) download('sirous-map.png', b).then(ok => { if (ok) U.toast('تصویر نقشه ساخته شد', 'dl'); }); }); }); M.map.triggerRepaint(); }
    else if (DL) { U.toast('نسخه‌ی چاپی در حال آماده شدن است…', 'info'); printable(on).then(h => download('sirous-report.html', new Blob([h], { type: 'text/html;charset=utf-8' }))).then(ok => { if (ok) U.toast('گزارش ذخیره شد؛ با باز کردن فایل، پنجره‌ی چاپ و ذخیره‌ی PDF باز می‌شود', 'dl'); }); }
    else {
      U.$$('[data-page="reports"] .sec').forEach(s => s.classList.toggle('no-print', !on.includes(s.id)));
      setTimeout(() => { try { window.print(); } catch (e) { U.toast('چاپ در این محیط در دسترس نیست', 'info'); } U.$$('.sec').forEach(s => s.classList.remove('no-print')); }, 60);
    }
  }
  function share() {
    U.modal({ title: 'اشتراک‌گذاری گزارش', ok: `${ic('check', 's')}کپی پیوند`, cancel: 'بستن',
      body: `<div class="fld"><label>پیوند گزارش محله سیروس</label><input readonly value="${SHARE_URL}" data-shu style="direction:ltr;text-align:left"></div><div class="muted" style="font-size:11.5px;margin-top:8px">هر کسی که این پیوند را داشته باشد می‌تواند گزارش را ببیند.</div>`,
      onOk: box => {
        const i = box.querySelector('[data-shu]');
        const fallback = () => { i.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } U.toast(ok ? 'پیوند کپی شد' : 'پیوند را انتخاب و دستی کپی کنید', ok ? 'share' : 'info'); };
        try { navigator.clipboard.writeText(SHARE_URL).then(() => U.toast('پیوند کپی شد', 'share'), fallback); } catch (e) { fallback(); }
      } });
  }

  /* ---------- render ---------- */
  R.render = function (root) {
    root.innerHTML = `<div class="wrap">${head()}${kpis()}${tabs()}${mapSec()}${ovSec()}${phSec()}${ecSec()}${hzSec()}${pjSec()}</div>`;
    drawPercap(); poiSec(); drawCond(); drawDist('f'); drawRoad(); drawInc('p'); drawExpo('n'); drawPj();
    bind(root);
  };
  R.jump = id => {
    const el = document.getElementById(id); if (!el) return; const v = U.$('.view'), tb = U.$('.stabs');
    const top = el.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - (tb ? tb.offsetHeight : 0) - 10;
    v.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };
  R.flashKpi = n => { const el = U.$(`[data-kn="${n}"]`); if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  R.syncPanel = () => {
    const st = M.st;
    U.$$('[data-cond]').forEach(b => b.classList.toggle('on', st.cond.has(b.dataset.cond)));
    U.$$('[data-use]').forEach(b => b.classList.toggle('on', st.use.has(b.dataset.use)));
    U.$$('[data-color] button').forEach(b => b.classList.toggle('on', b.dataset.c === st.color));
    U.$$('[data-lyr]').forEach(l => { const k = l.dataset.lyr, on = k === 'narrow' ? st.narrowHL : k === 'sat3' ? st.satIn3d : !!st.lay[k]; l.classList.toggle('on', on); l.setAttribute('aria-checked', on); });
    U.$$('[data-narrowbtn]').forEach(l => { l.classList.toggle('on', st.narrowHL); l.setAttribute('aria-checked', st.narrowHL); });
    U.$$('[data-hz]').forEach(b => b.classList.toggle('on', st.lay.haz && (!st.hazK || st.hazK === b.dataset.hz)));
    U.$$('[data-cat]').forEach(b => b.classList.toggle('on', (b.dataset.cat || '') === (st.poiCat || '')));
    U.$$('[data-cf]').forEach(b => b.classList.toggle('off', !st.cond.has(b.dataset.cf)));
    const fs = M.filtered(), area = fs.reduce((a, f) => a + f.properties.a, 0), un = fs.filter(f => f.properties.c === 'weak' || f.properties.c === 'ruin').length;
    const ms = U.$('[data-msum]'); if (ms) ms.innerHTML = `<div data-tt="پلاک‌های منطبق با فیلتر از ${fi(NP)} پلاک"><b class="num">${fi(fs.length)}</b><small>پلاک</small></div><div data-tt="مساحت عرصه‌ی پلاک‌های منطبق"><b class="num">${fa(area / 1e4, 1)}</b><small>هکتار</small></div><div data-tt="سهم پلاک‌های کم‌دوام و مخروبه"><b class="num">${fa(fs.length ? un / fs.length * 100 : 0, 0)}٪</b><small>ناپایدار</small></div><div data-tt="میانگین تعداد طبقات"><b class="num">${fa(fs.length ? fs.reduce((a, f) => a + f.properties.f, 0) / fs.length : 0, 1)}</b><small>طبقه</small></div>`;
    const fl = U.$('[data-flsum]'); if (fl) { const d = st.fl[0] !== 1 || st.fl[1] !== 7 || st.yb[0] !== 1310 || st.yb[1] !== 1404; fl.textContent = d ? 'فعال' : ''; }
    duals();
  };
  function duals() {
    U.$$('[data-dual]').forEach(d => {
      const k = d.dataset.dual, [a, b] = d.querySelectorAll('input'), lo = +a.min, hi = +a.max;
      const v = M.st[k]; a.value = v[0]; b.value = v[1];
      a.style.zIndex = v[0] === v[1] && v[0] > (lo + hi) / 2 ? 3 : 1; b.style.zIndex = 2;
      const fil = d.querySelector('.fil'); fil.style.right = ((v[0] - lo) / (hi - lo) * 100) + '%'; fil.style.left = (100 - (v[1] - lo) / (hi - lo) * 100) + '%';
      const p = d.nextElementSibling; p.querySelector('[data-v0]').textContent = k === 'fl' ? tf(v[0]) + ' طبقه' : tf(v[0]); p.querySelector('[data-v1]').textContent = k === 'fl' ? tf(v[1]) + ' طبقه' : tf(v[1]);
    });
  }
  const tog = (set, k, all) => { if (set.has(k) && set.size > 1) set.delete(k); else set.add(k); };

  function bind(root) {
    const st = M.st;
    root.addEventListener('click', e => {
      const t = e.target;
      const j = t.closest('[data-jump]'); if (j) { R.jump(j.dataset.jump); return; }
      if (t.closest('[data-rep]')) { openReport(); return; }
      if (t.closest('[data-share]')) { share(); return; }
      const a = t.closest('[data-acc]'); if (a) { a.closest('.acc').classList.toggle('open'); return; }
      const v = t.closest('.vsw [data-v]'); if (v) { M.setView(v.dataset.v); return; }
      const c = t.closest('[data-color] [data-c]'); if (c) { st.color = c.dataset.c; M.apply(); return; }
      const cd = t.closest('[data-cond]'); if (cd) { tog(st.cond, cd.dataset.cond); M.apply(); return; }
      const us = t.closest('[data-use]'); if (us) { tog(st.use, us.dataset.use); M.apply(); return; }
      const al = t.closest('[data-all]'); if (al) { if (al.dataset.all === 'cond') st.cond = new Set(Object.keys(M.COND)); else st.use = new Set(Object.keys(M.USE)); M.apply(); return; }
      const lc = t.closest('.lgd [data-lc]'); if (lc) { tog(st.cond, lc.dataset.lc); M.apply(); return; }
      const lu = t.closest('.lgd [data-lu]'); if (lu) { tog(st.use, lu.dataset.lu); M.apply(); return; }
      if (t.closest('.lgd [data-poiclr]')) { st.poiCat = ''; M.apply(); poiTable.draw(); return; }
      if (t.closest('.lgd [data-hzclr]')) { st.hazK = null; M.apply(); return; }
      const ly = t.closest('[data-lyr]'); if (ly) { const k = ly.dataset.lyr; if (k === 'narrow') st.narrowHL = !st.narrowHL; else if (k === 'sat3') { st.satIn3d = !st.satIn3d; if (st.satIn3d && st.view !== '3d') { M.setView('3d'); return; } } else { st.lay[k] = !st.lay[k]; if (k === 'haz') st.hazK = null; if (k === 'pois' && !st.lay.pois) st.poiCat = ''; } M.apply(); return; }
      if (t.closest('[data-narrowbtn]')) { st.narrowHL = !st.narrowHL; M.apply(); if (st.narrowHL) { R.jump('s-map'); U.toast('معابر کمتر از ۶ متر روی نقشه برجسته شد', 'road'); } return; }
      if (t.closest('[data-reset]')) { st.cond = new Set(Object.keys(M.COND)); st.use = new Set(Object.keys(M.USE)); st.fl = [1, 7]; st.yb = [1310, 1404]; st.color = 'cond'; st.hazK = null; st.poiCat = ''; st.narrowHL = false; M.apply(); poiTable.draw(); U.toast('فیلترهای نقشه بازنشانی شد', 'filter'); return; }
      const z = t.closest('[data-z]'); if (z) { const m = M.map; ({ in: () => m.zoomIn({ duration: 250 }), out: () => m.zoomOut({ duration: 250 }), home: () => M.home(), north: () => m.easeTo({ bearing: 0, pitch: st.view === '3d' ? 58 : 0, duration: 400 }) })[z.dataset.z](); return; }
      if (t.closest('[data-play]')) { M.togglePlay(); return; }
      if (t.closest('[data-fs]')) { fullscreen(); return; }
      const pcv = t.closest('[data-pcv] button'); if (pcv) { U.$$('[data-pcv] button').forEach(b => b.classList.toggle('on', b === pcv)); const city = pcv.dataset.m === 'city'; U.$('[data-pcl]').style.display = city ? 'none' : ''; U.$('#ch-city').style.display = city ? '' : 'none'; if (city) { if (!cityChart) drawCity(); else cityChart.resize(); } return; }
      if (t.closest('[data-poit]')) { const tp = U.$('#t-poi'), open = tp.style.display === 'none'; tp.style.display = open ? '' : 'none'; U.$('[data-poit]').classList.toggle('on', open); return; }
      const cat = t.closest('[data-cat]'); if (cat) { st.poiCat = cat.dataset.cat; if (st.poiCat) st.lay.pois = true; M.apply(); poiTable.draw(); if (st.poiCat) { R.jump('s-map'); M.focusPoiCat(st.poiCat); U.toast(`«${st.poiCat}» روی نقشه نمایش داده شد`, 'pin'); } return; }
      const cf = t.closest('[data-cf]'); if (cf) { filterCond(cf.dataset.cf); return; }
      const ds = t.closest('[data-dist] button'); if (ds) { U.$$('[data-dist] button').forEach(b => b.classList.toggle('on', b === ds)); drawDist(ds.dataset.m); return; }
      const inc = t.closest('[data-inc] button'); if (inc) { U.$$('[data-inc] button').forEach(b => b.classList.toggle('on', b === inc)); drawInc(inc.dataset.m); return; }
      const exm = t.closest('[data-exm] button'); if (exm) { U.$$('[data-exm] button').forEach(b => b.classList.toggle('on', b === exm)); drawExpo(exm.dataset.m); return; }
      const hz = t.closest('[data-hz]'); if (hz) { const k = hz.dataset.hz; st.lay.haz = true; st.hazK = k; M.apply(); R.jump('s-map'); M.focusHaz(k); U.toast(`«${S.hazards.find(h => h.k === k).t}» روی نقشه نمایش داده شد`, 'warn'); return; }
      if (t.closest('[data-hzmap]')) { st.lay.haz = true; st.hazK = null; M.apply(); R.jump('s-map'); M.focusHaz(null); U.toast('همه‌ی پهنه‌های مخاطره روی نقشه نمایش داده شد', 'warn'); return; }
      const ax = t.closest('[data-ax]'); if (ax) { setAx(ax.dataset.ax); R.jump('s-pj'); return; }
      const axf = t.closest('[data-axf] button'); if (axf) { setAx(axf.dataset.a); return; }
      const pv = t.closest('[data-pv] button'); if (pv) { U.$$('[data-pv] button').forEach(b => b.classList.toggle('on', b === pv)); U.$('#t-pj .tw').style.display = pv.dataset.v === 't' ? '' : 'none'; U.$('#g-pj').style.display = pv.dataset.v === 'g' ? '' : 'none'; return; }
    });
    root.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.kp[data-jump]')) { e.preventDefault(); R.jump(e.target.dataset.jump); } });
    // dual ranges: thumbs never cross; the dragged thumb stops at the other one
    U.$$('[data-dual]').forEach(d => { const k = d.dataset.dual, [a, b] = d.querySelectorAll('input'); const on = e => { let x = +a.value, y = +b.value; if (x > y) { if (e.target === a) { x = y; a.value = x; } else { y = x; b.value = y; } } st[k] = [x, y]; M.apply(); }; a.addEventListener('input', on); b.addEventListener('input', on); });
    const yr = U.$('[data-year]'); yr.addEventListener('input', () => M.setYear(+yr.value));
    // map search
    const idx = M.index(); const inp = U.$('[data-msq]'), box = U.$('[data-msr]');
    let act = 0, res = [];
    const draw = () => {
      const q = U.norm(inp.value); if (!q) { box.classList.remove('on'); res = []; return; }
      res = idx.filter(x => U.norm(x.t).includes(q)).slice(0, 10); act = 0;
      box.innerHTML = res.length ? res.map((x, i) => `<button data-i="${i}" class="${i ? '' : 'act'}">${ic(x.k === 'road' ? 'road' : x.k === 'lm' ? 'star' : 'pin', 's')}<span>${U.hl(x.t, inp.value)}</span><small>${x.s}</small></button>`).join('') : '<div class="emp">نتیجه‌ای پیدا نشد</div>';
      box.classList.add('on');
    };
    const go = x => { box.classList.remove('on'); inp.value = x.t; inp.blur(); if (x.k === 'poi') M.flyPoi(x.i); else M.flyTo(x.c, x.k === 'road' ? 17.6 : 18); };
    inp.addEventListener('input', draw); inp.addEventListener('focus', draw);
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') { box.classList.remove('on'); return; } if (!res.length) return; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { act = (act + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; U.$$('button', box).forEach((b, i) => b.classList.toggle('act', i === act)); e.preventDefault(); } if (e.key === 'Enter') go(res[act]); });
    box.addEventListener('mousedown', e => { const b = e.target.closest('[data-i]'); if (b) { e.preventDefault(); go(res[+b.dataset.i]); } });
    inp.addEventListener('blur', () => setTimeout(() => box.classList.remove('on'), 120));
    // scrollspy + sticky shadow
    const view = U.$('.view'), tabsEl = U.$('.stabs');
    const spy = () => {
      if (root.hidden) return;
      // positions relative to the scroll container (offsetTop would include the top bar)
      const vt = view.getBoundingClientRect().top, y = tabsEl.offsetHeight + 40; let cur = SECS[0][0];
      SECS.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top - vt <= y) cur = id; });
      if (view.scrollTop + view.clientHeight >= view.scrollHeight - 4) cur = SECS[SECS.length - 1][0];
      U.$$('.stabs [data-jump]').forEach(b => b.classList.toggle('on', b.dataset.jump === cur));
      tabsEl.classList.toggle('stuck', tabsEl.getBoundingClientRect().top <= view.getBoundingClientRect().top + 1);
    };
    view.addEventListener('scroll', spy, { passive: true });
    R.spy = spy;
    M.on(() => R.syncPanel());
    R.syncPanel();
  }
  let fsOn = false;
  function fullscreen() {
    const c = U.$('#mapcard'); fsOn = !fsOn;
    c.classList.toggle('fs', fsOn);
    U.$('[data-fs]').innerHTML = fsOn ? `${ic('x', 'xs')}بستن تمام‌صفحه` : `${ic('expand', 'xs')}تمام‌صفحه`;
    if (fsOn) { M.map.cooperativeGestures.disable(); c.querySelector('.mstage').insertAdjacentHTML('beforeend', `<button class="btn sm fsx" data-fsx>${ic('x', 'xs')}بستن</button>`); c.querySelector('[data-fsx]').onclick = fullscreen; }
    else { M.map.cooperativeGestures.enable(); const x = c.querySelector('[data-fsx]'); if (x) x.remove(); }
    setTimeout(() => { M.map.resize(); M.atlas && M.atlas.show(); }, 30);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fsOn && !U.$('.modal.on')) fullscreen(); });
})();
