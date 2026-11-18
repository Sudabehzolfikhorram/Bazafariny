/* Shared helpers, shell, router, shared components. */
(function () {
  'use strict';
  const B = window.BZ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fa = n => (n == null ? '—' : Number(n).toLocaleString('fa-IR'));
  const pct = n => fa(Math.round(n)) + '٪';
  const spct = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fa(Math.abs(Math.round(n))) + '٪';
  const legend = items => `<div class="lgd">${items.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`;
  const money = n => { const b = n / 1e9; return b >= 1000 ? fa(+(b / 1000).toFixed(1)) + ' هزار میلیارد' : fa(Math.round(b)) + ' میلیارد'; };
  const faDate = (d, o = { day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', o).format(d);
  const rel = d => { const m = Math.round((B.TODAY - d) / 6e4); if (m < 60) return fa(Math.max(1, m)) + ' دقیقه پیش'; const h = Math.round(m / 60); if (h < 24) return fa(h) + ' ساعت پیش'; const dd = Math.round(h / 24); return dd === 1 ? 'دیروز' : fa(dd) + ' روز پیش'; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* line icons (Iconsax-like outline) */
  const P = {
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
    chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
    nodes: 'M6 6m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M18 18m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M18 6m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M8.2 7.2l7.6 9.6M8.5 6h7',
    map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
    city: 'M4 20V8l6-3v15M10 20V9l10 3v8M3 20h18M7 10v.01M7 13v.01M7 16v.01M14 14h2M14 17h2',
    region: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 3v9l7 5M12 12L4.5 16',
    pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
    route: 'M6 4a2 2 0 1 0 0 4a2 2 0 1 0 0-4M18 16a2 2 0 1 0 0 4a2 2 0 1 0 0-4M8 6h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7',
    shape: 'M12 3l4 7H8zM7 14a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M14 14h7v7h-7z',
    bank: 'M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    brief: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    users: 'M9 8a3 3 0 1 0 0 .01M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 19c0-2.6-1.6-4.8-4-5.6',
    money: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.9 2.5 2-1 2-2.5 2c-1.1 0-2.1-.5-2.5-1.5M12 6.5v1.5M12 16v1.5',
    law: 'M14 4l6 6M12 6l6 6M4 20l7-7M9.5 8.5l6 6M8 10l4-4',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4-4',
    bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
    chev: 'M14 6l-6 6 6 6', back: 'M10 6l6 6-6 6', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    alert: 'M12 4l9 16H3zM12 10v4M12 17v.01', clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
    check: 'M5 12l4.5 4.5L19 7', play: 'M8 5l11 7-11 7z', pause: 'M8 5v14M16 5v14', layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    sat: 'M5 13l6 6M3 21l4-4M13 5l6 6-4 4-6-6zM15 3l6 6', home: 'M3 11l9-7 9 7M5 10v10h14V10', target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 11.5v1',
    doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6', send: 'M4 12l16-8-6 16-3-7z', undo: 'M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6'
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const av = (x, cls = '') => `<span class="av ${cls} ${x.role && /پروژه/.test(x.role) ? 'b' : ''}" aria-hidden="true">${esc(x.ini)}</span>`;
  const heat = (days, mini = false, weeks = 4) => { const d = days.slice(-weeks * 7); return `<div class="heat ${mini ? 'mini' : ''}" role="img" aria-label="فعالیت ${fa(weeks)} هفته اخیر">${d.map(v => `<i class="${v === 0 ? '' : v < 3 ? 'l1' : v < 5 ? 'l2' : v < 8 ? 'l3' : 'l4'}"></i>`).join('')}</div>`; };
  const steps = (n, total = 6) => `<div class="steps" role="img" aria-label="${fa(n)} از ${fa(total)} مرحله">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  const statusBadge = s => `<span class="badge ${s === 'تأیید شده' ? 'ok' : s === 'در انتظار تأیید' ? 'wait' : s === 'برگشت برای اصلاح' ? 'warn' : ''}">${s}</span>`;

  /* sequential teal ramp (light → dark) */
  const RAMP = ['#EEF4F4', '#D2E8E7', '#A9D5D3', '#78BCBA', '#459F9D', '#257E7C', '#155E5C'];
  const CAT = { hood: '#0CA5A3', prop: '#3B5BDB', street: '#F59F00', feat: '#F76707', exec: '#495057', part: '#4DABF7', alert: '#C92A2A' };
  const ramp = t => RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(t * RAMP.length)))];
  const inkOn = c => (RAMP.indexOf(c) >= 4 ? '#fff' : '#0F172A');

  /* tooltip */
  let tipEl;
  const tip = (e, html) => { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); } if (!html) { tipEl.classList.remove('on'); return; } tipEl.innerHTML = html; tipEl.classList.add('on'); const x = Math.min(innerWidth - tipEl.offsetWidth - 10, e.clientX + 14), y = Math.min(innerHeight - tipEl.offsetHeight - 10, e.clientY + 14); tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; };

  /* ECharts defaults */
  const EC = { textStyle: { fontFamily: 'Vazirmatn' }, animationDuration: 600 };
  const charts = [];
  const chart = (el, opt) => { if (!el) return; const c = echarts.init(el, null, { renderer: 'svg' }); c.setOption(Object.assign({}, EC, opt)); charts.push(c); return c; };
  addEventListener('resize', () => charts.forEach(c => c.resize()));
  const clearCharts = () => { charts.splice(0).forEach(c => c.dispose()); };

  /* ---------- shell ---------- */
  const NAV = [['grid', 'میز کار', 1], ['spark', 'دستیار', 0, 'تازه'], ['chart', 'گزارش‌ساز'], ['nodes', 'مدل‌ساز'],
    ['g', 'محدوده‌ها'], ['map', 'استان‌ها'], ['city', 'شهرها'], ['region', 'مناطق'], ['pin', 'محله‌ها'], ['route', 'معابر'], ['shape', 'نقاط و محدوده‌ها'],
    ['g', 'دارایی و پروژه'], ['bank', 'املاک و اراضی'], ['folder', 'پروژه‌های مشارکتی'], ['brief', 'پروژه‌های اجرایی'],
    ['g', 'مدیریت'], ['users', 'کاربران و کارشناسان'], ['money', 'منابع مالی'], ['law', 'قوانین']];
  const LOGO = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">${[[17, 3], [10, 10], [24, 10], [3, 17], [17, 17], [31, 17], [10, 24], [24, 24], [17, 31]].map(([x, y], i) => `<rect x="${x - 3.6}" y="${y - 3.6}" width="7.2" height="7.2" rx="1.6" transform="rotate(45 ${x} ${y})" fill="${i % 2 ? '#00ADAB' : '#007C7A'}"/>`).join('')}</svg>`;
  function shell() {
    document.documentElement.lang = 'fa'; document.documentElement.dir = 'rtl';
    document.body.insertAdjacentHTML('beforeend', `<div class="app"><aside class="side" aria-label="منوی اصلی">
      <div class="brand">${LOGO}<div><b>بازآفرینی‌یار</b><small>شرکت بازآفرینی شهری ایران</small></div></div>
      ${NAV.map(([i, t, on, tag]) => i === 'g' ? `<div class="grp">${t}</div>` : `<a class="nav ${on ? 'on' : ''}" href="#" title="${t}">${ic(i)}<span>${t}</span>${tag ? `<em class="tag">${tag}</em>` : ''}</a>`).join('')}
    </aside><div class="main"><header class="top" id="top"></header><main class="page" id="page"></main></div></div>
    <nav class="switch" aria-label="انتخاب مدل">
      <a href="#m1" data-m="m1">مدل الف<span class="long"> · نقشه</span></a><a href="#m2" data-m="m2">مدل ب<span class="long"> · اطلس</span></a>
      <span class="sep arch"></span><a class="arch" href="archive/index.html">کانسپت‌های قبلی</a></nav>`);
    $$('.nav').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  }
  function topbar(title, sub) {
    $('#top').innerHTML = `<div><h1>${title}</h1><div class="sub">${sub || faDate(B.TODAY, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div><div class="grow"></div>
      <label class="search">${ic('search', 'sm')}<input placeholder="جستجوی استان، محله، ملک، پروژه یا کارشناس" aria-label="جستجو"><kbd>/</kbd></label>
      <button class="iconbtn" aria-label="اعلان‌ها">${ic('bell')}<span class="dot"></span></button>
      <div class="me"><span class="av b">ر‌م</span><div><b>رضا محبعلی</b><small>سوپر ادمین · کل کشور</small></div></div>`;
  }

  /* ---------- shared blocks ---------- */
  function aiCard(scopeName = 'کل کشور') {
    const T = B.totals;
    const QA = [['گزارش ماه آبان', `در آبان ${fa(T.thisMonth)} رکورد ثبت شد؛ ${pct(Math.abs(T.thisMonth / T.lastMonth - 1) * 100)} ${T.thisMonth >= T.lastMonth ? 'بیشتر' : 'کمتر'} از مهر. بیشترین ثبت را تهران و اصفهان داشته‌اند و ${fa(B.empty.length)} استان هنوز هیچ داده‌ای ندارند.`],
      ['کدام پروژه‌ها عقب‌اند؟', `${fa(B.late.length)} پروژه بیش از ۱۰٪ از برنامه عقب‌اند. بیشترین عقب‌ماندگی: ${B.late.slice(0, 2).map(p => `${p.n} (${pct(-p.gap)})`).join('، ')}.`],
      ['کارشناسان کم‌فعال', `${B.sleepy.map(x => x.n).join('، ')} بیش از دو هفته است هیچ ثبتی نداشته‌اند.`]];
    const id = 'ai' + Math.random().toString(36).slice(2, 7);
    setTimeout(() => $$(`#${id} .q button`).forEach((b, i) => b.addEventListener('click', () => { const a = $(`#${id} .ai-ans`); a.textContent = QA[i][1]; a.classList.add('on'); })));
    return `<section class="ai" id="${id}" aria-label="دستیار هوشمند" style="flex-wrap:wrap">
      <span class="mark">${ic('spark')}</span><div class="t"><b>دستیار هوشمند</b><small>آمار یا گزارش ${scopeName} را بپرسید</small></div>
      <div class="q">${QA.map(q => `<button>${q[0]}</button>`).join('')}</div>
      <div class="ai-ans" style="flex-basis:100%" aria-live="polite"></div></section>`;
  }
  function attention(limit = 5, scope) {
    const items = [];
    const inScope = p => !scope || p === scope;
    B.queue.filter(q => !scope).slice(0, 1).forEach(() => items.push({ ic: 'clock', b: true, t: `${fa(B.queue.length)} مورد منتظر تأیید شماست`, s: `قدیمی‌ترین: ${B.queue[0].n} · ${fa(B.queue[0].age)} روز`, go: `#d/hood/${B.queue[0].ref}` }));
    B.late.filter(p => inScope(p.prov)).slice(0, 2).forEach(p => items.push({ ic: 'alert', t: `${p.n} ${pct(-p.gap)} عقب‌تر از برنامه`, s: `${p.city} · پروژه ${p.type}`, go: `#d/project/${p.id}` }));
    B.sleepy.filter(x => inScope(x.prov)).slice(0, 2).forEach(x => items.push({ ic: 'users', t: `${x.n} ${fa(x.lastDays)} روز ثبتی نداشته`, s: `${x.role} · ${x.provFa}`, go: `#d/expert/${x.id}` }));
    if (!scope) items.push({ ic: 'map', b: true, t: `${fa(B.empty.length)} استان هنوز هیچ داده‌ای ندارند`, s: B.empty.slice(0, 4).map(p => p.fa).join('، ') + '…', go: '#m2' });
    return `<div class="attn">${items.slice(0, limit).map(i => `<button onclick="location.hash='${i.go}'"><span class="ic ${i.b ? 'b' : ''}">${ic(i.ic, 'sm')}</span><span><b>${i.t}</b><small>${i.s}</small></span></button>`).join('') || '<p class="lede">در این محدوده موردی برای پیگیری نیست.</p>'}</div>`;
  }
  const evGo = ev => ev.ent.startsWith('پروژه') ? `#d/project/${(B.projects.find(p => ev.name.includes(p.n)) || B.projects[0]).id}` : `#d/hood/${ev.hood}`;
  const evText = ev => ({ boundary: `محدوده ${ev.name} را روی نقشه کشید`, progress: `پیشرفت ${ev.name} را به‌روز کرد` }[ev.a.k] || `${ev.name} را ${ev.a.v}`);
  function evChip(ev) { return `<button class="ev" onclick="location.hash='${evGo(ev)}'">${av(ev.x)}<span class="t"><b>${esc(ev.x.n)} · ${esc(evText(ev))}</b><small>${rel(ev.t)} · ${esc(ev.place)}</small></span></button>`; }
  function expertTable(list) {
    return `<table class="lb"><thead><tr><th>کارشناس</th><th>محدوده</th><th>ثبت در ۳۰ روز</th><th>۱۲ هفته اخیر</th><th>نرخ تأیید</th><th>منتظر تأیید</th><th>آخرین فعالیت</th></tr></thead><tbody>
    ${list.map(x => `<tr class="click" tabindex="0" onclick="location.hash='#d/expert/${x.id}'"><td><div class="who">${av(x)}<div><b>${x.n}</b><small>${x.role}</small></div></div></td><td>${x.provFa}</td><td class="num"><b>${fa(x.recs30)}</b></td><td>${heat(x.days, true)}</td><td>${pct(x.approval)}</td><td>${x.pending ? `<span class="badge wait">${fa(x.pending)}</span>` : '<span class="faint">—</span>'}</td><td>${x.lastDays > 14 ? `<span class="badge warn">${fa(x.lastDays)} روز پیش</span>` : x.lastDays === 0 ? 'امروز' : fa(x.lastDays) + ' روز پیش'}</td></tr>`).join('')}
    </tbody></table>`;
  }
  function bullets(list) {
    return `<div class="list">${list.map(p => `<a class="row" href="#d/project/${p.id}"><span class="t"><b>${p.n}</b><small>${p.type} · ${p.city} · ${p.contractor}</small></span>
      <div style="width:42%"><div class="bullet" title="پیشرفت ${fa(p.pr)}٪، برنامه ${fa(p.plan)}٪"><span class="track"></span><span class="act ${p.gap < -10 ? 'late' : ''}" style="width:${p.pr}%"></span><span class="plan" style="right:${p.plan}%"></span></div></div>
      <span style="width:84px;text-align:left" class="num"><b>${pct(p.pr)}</b><br><small class="${p.gap < -10 ? '' : 'muted'}" style="${p.gap < -10 ? 'color:var(--warn)' : ''}">${p.gap >= 0 ? 'طبق برنامه' : pct(-p.gap) + ' عقب'}</small></span></a>`).join('')}</div>`;
  }
  function trendChart(el, months = 8) {
    const T = B.totals; const cols = ['#00ADAB', '#1E40AF', '#7FD3D1', '#93A8E8'];
    return chart(el, { grid: { left: 8, right: 44, top: 12, bottom: 26 }, tooltip: { trigger: 'axis', textStyle: { fontFamily: 'Vazirmatn' }, valueFormatter: v => fa(v) },
      legend: { show: false },
      xAxis: { type: 'category', inverse: true, data: B.MONTHS.slice(-months), axisLine: { lineStyle: { color: '#E2E8F0' } }, axisTick: { show: false }, axisLabel: { color: '#64748B' } },
      yAxis: { type: 'value', position: 'right', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#94A3B8', formatter: v => fa(v) } },
      series: Object.entries(T.monthlyByType).map(([k, v], i) => ({ name: k, type: 'bar', stack: 'a', barWidth: '46%', data: v.slice(-months), itemStyle: { color: cols[i], borderRadius: i === 3 ? [4, 4, 0, 0] : 0 } })) });
  }
  const TREND_LEGEND = () => legend(Object.keys(B.totals.monthlyByType).map((k, i) => [k, ['#00ADAB', '#1E40AF', '#7FD3D1', '#93A8E8'][i]]));
  function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'tip'; t.style.cssText = 'left:50%;top:auto;bottom:80px;transform:translateX(-50%);'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }

  /* polygon helpers */
  const ringsOf = f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map(p => p[0]);
  const bboxOf = pts => pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]);
  const centroid = ring => { let a = 0, x = 0, y = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; a += f; x += (ring[j][0] + ring[i][0]) * f; y += (ring[j][1] + ring[i][1]) * f; } return a ? [x / (3 * a), y / (3 * a)] : ring[0]; };
  const biggest = f => ringsOf(f).sort((a, b) => b.length - a.length)[0];

  window.UI = { CAT, $, $$, fa, pct, spct, legend, money, faDate, rel, esc, ic, av, heat, steps, statusBadge, RAMP, ramp, inkOn, tip, chart, clearCharts, shell, topbar, aiCard, attention, evChip, evGo, evText, expertTable, bullets, trendChart, TREND_LEGEND, toast, ringsOf, bboxOf, centroid, biggest };
})();
