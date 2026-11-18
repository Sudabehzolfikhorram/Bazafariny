/* Sample data model for the super-admin dashboard.
   Geometry (provinces, cities, regions, neighbourhoods, streets, points) comes from window.D / GEO_IR.
   Everything the system does not record yet (activity log, dates, progress) is generated here
   deterministically, as the user asked to design as if those fields exist. */
(function () {
  'use strict';
  const D = window.D, GI = window.GEO_IR;
  let seed = 1405;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];

  const TODAY = new Date('2026-11-18T09:00:00');
  const DAY = 864e5;

  /* ---------- provinces ---------- */
  const GRID = { 'West Azarbaijan': [0, 0], 'East Azarbaijan': [1, 0], 'Ardebil': [2, 0], 'Gilan': [3, 0], 'Mazandaran': [4, 0], 'Golestan': [5, 0], 'North Khorasan': [6, 0],
    'Kordestan': [0, 1], 'Zanjan': [1, 1], 'Qazvin': [2, 1], 'Alborz': [3, 1], 'Tehran': [4, 1], 'Semnan': [5, 1], 'Razavi Khorasan': [6, 1],
    'Kermanshah': [0, 2], 'Hamadan': [1, 2], 'Markazi': [2, 2], 'Qom': [3, 2], 'Esfahan': [4, 2], 'Yazd': [5, 2], 'South Khorasan': [6, 2],
    'Ilam': [0, 3], 'Lorestan': [1, 3], 'Chahar Mahall and Bakhtiari': [2, 3], 'Kohgiluyeh and Buyer Ahmad': [3, 3], 'Fars': [4, 3], 'Kerman': [5, 3], 'Sistan and Baluchestan': [6, 3],
    'Khuzestan': [1, 4], 'Bushehr': [3, 4], 'Hormozgan': [5, 4] };
  const SHORT = { 'Chahar Mahall and Bakhtiari': 'چهارمحال', 'Kohgiluyeh and Buyer Ahmad': 'کهگیلویه', 'Sistan and Baluchestan': 'سیستان', 'Razavi Khorasan': 'خراسان ر.', 'North Khorasan': 'خراسان ش.', 'South Khorasan': 'خراسان ج.', 'East Azarbaijan': 'آذربایجان ش.', 'West Azarbaijan': 'آذربایجان غ.' };

  const provs = GI.features.map(f => {
    const en = f.properties.en, p = D.prov[en];
    const fa = f.properties.fa.replace(/^استان /, '');
    const has = !!p;
    const hoods = has ? p.hoods : 0, cities = has ? p.cities : 0;
    const o = {
      id: en, en, fa, short: SHORT[en] || fa, iso: f.properties.iso, grid: GRID[en], feature: f, has,
      cities, regions: has ? Math.max(1, Math.round(cities * 1.6 + hoods / 6)) : 0, hoods,
      streets: has ? Math.round(hoods * 2.4 + ri(0, 6)) : 0, props: has ? p.props : 0,
      feats: has ? Math.round(hoods * 0.7 + ri(0, 3)) : 0,
      partner: has ? p.partner : 0, exec: has ? p.exec : 0,
      completeness: has ? ri(38, 96) : 0,
      pending: has ? ri(0, 9) : 0,
      boundaryDone: has ? ri(55, 100) : 0
    };
    o.records = o.cities + o.regions + o.hoods + o.streets + o.props + o.feats + o.partner + o.exec;
    /* 8 months of cumulative records (فروردین..آبان ۱۴۰۵) */
    let acc = 0; const start = has ? ri(0, 3) : 99;
    const w = [0.05, 0.08, 0.10, 0.12, 0.13, 0.15, 0.17, 0.20];
    o.monthly = w.map((x, i) => i < start ? 0 : Math.round(o.records * x * (0.9 + rnd() * 0.2)));
    const s = o.monthly.reduce((a, b) => a + b, 0) || 1; o.monthly = o.monthly.map(v => Math.round(v * o.records / s));
    o.cum = o.monthly.map(v => (acc += v));
    o.thisMonth = o.monthly[7]; o.lastMonth = o.monthly[6];
    return o;
  });
  provs.forEach(p => { if (p.has) { const d = p.cum[7] - p.records; p.cum[7] -= d; } });
  const provBy = Object.fromEntries(provs.map(p => [p.id, p]));

  /* ---------- hierarchy helpers on top of D ---------- */
  const cityBy = Object.fromEntries(D.cities.map(c => [c.id, c]));
  const regionBy = Object.fromEntries(D.regions.map(r => [r.id, r]));
  const hoodBy = Object.fromEntries(D.hoods.map(h => [h.id, h]));
  const STEP_NAMES = ['مشخصات اولیه', 'آمار و خط پایه', 'شاخص‌ها و خدمات', 'ظرفیت و آمادگی اجرا', 'سنجش و مستندات', 'مرور و تأیید'];
  const HOOD_STATUS = ['پیش‌نویس', 'در انتظار تأیید', 'تأیید شده', 'برگشت برای اصلاح'];
  D.hoods.forEach(h => {
    h.steps = h.s === 'تایید شده' ? 6 : ri(1, 5);
    h.status = h.steps === 6 ? 'تأیید شده' : h.steps === 5 ? 'در انتظار تأیید' : (rnd() < .15 ? 'برگشت برای اصلاح' : 'پیش‌نویس');
    h.streets = D.streets.filter(s => s.h === h.id).length;
    h.props = D.pts.filter(p => p.h === h.id).length;
    h.feats = D.feats.filter(f => f.h === h.id).length;
    h.pop = h.res ? h.res * 6 : ri(4000, 26000);
    h.updated = new Date(TODAY - ri(0, 60) * DAY);
  });
  D.cities.forEach(c => {
    c.regions = D.regions.filter(r => r.city === c.id).length;
    c.hoods = D.hoods.filter(h => h.city === c.id).length;
    c.props = D.pts.filter(p => (hoodBy[p.h] || {}).city === c.id).length;
    c.completeness = ri(40, 95);
  });

  /* ---------- experts ---------- */
  const NAMES = ['سارا موسوی', 'علیرضا کریمی', 'مریم احمدی', 'احسان عزتی', 'حمید نوری', 'زهرا کاظمی', 'رضا جعفری', 'نگار حسینی', 'امیر صادقی', 'فاطمه رحیمی', 'محمد طاهری', 'لیلا شریفی', 'کاوه مرادی', 'الهام یوسفی', 'بهنام قاسمی', 'سمیرا اکبری', 'پویا نیک‌نام', 'شیما فرهادی', 'داوود امینی', 'نرگس باقری'];
  const ROLES = ['کارشناس استان', 'کارشناس شهر', 'کارشناس محلات', 'کارشناس املاک', 'کارشناس پروژه‌های اجرایی', 'کارشناس پروژه‌های مشارکتی'];
  const active = provs.filter(p => p.has).sort((a, b) => b.records - a.records);
  const experts = NAMES.map((n, i) => {
    const prov = active[i < 8 ? i % 6 : ri(0, active.length - 1)];
    const role = ROLES[i % ROLES.length];
    const sleepy = i === 13 || i === 17 || i === 9;
    const days = []; // 84 days activity
    for (let d = 0; d < 84; d++) {
      const wd = (d + 3) % 7; const off = wd === 6; // Friday off
      let v = off ? 0 : (rnd() < .28 ? 0 : ri(1, 9));
      if (sleepy && d > 60) v = 0;
      days.push(v);
    }
    const last = sleepy ? ri(16, 29) : ri(0, 3);
    const recs = days.slice(-30).reduce((a, b) => a + b, 0);
    return { id: 'x' + (i + 1), n: n, ini: n.split(' ').map(s => s[0]).join('‌'), role, prov: prov.id, provFa: prov.fa,
      days, recs30: recs, lastDays: last, approval: ri(68, 99), pending: ri(0, 6), returned: ri(0, 4), avgComplete: ri(52, 97), sleepy };
  });
  const expBy = Object.fromEntries(experts.map(e => [e.id, e]));

  /* ---------- projects (execs + partners) with dates and money ---------- */
  const projects = [];
  D.execs.forEach((e, i) => projects.push({ id: e.id, type: 'اجرایی', n: e.n, h: e.h, pr: e.pr, geom: e.b }));
  D.partners.forEach((p, i) => projects.push({ id: p.id, type: 'مشارکتی', n: p.n.replace(/^پروژه /, ''), h: p.h, pr: p.pr, co: p.co, c: p.c }));
  projects.forEach((p, i) => {
    const h = hoodBy[p.h] || {}; const c = cityBy[h.city] || {};
    p.hood = h.n || '—'; p.city = c.n || '—'; p.prov = c.p || 'Tehran'; p.provFa = (provBy[p.prov] || {}).fa || '';
    p.startM = ri(-14, -2); p.endM = p.startM + ri(10, 24);
    const elapsed = Math.min(1, Math.max(0, (0 - p.startM) / (p.endM - p.startM)));
    p.plan = Math.round(elapsed * 100);
    p.gap = p.pr - p.plan;
    p.budget = ri(40, 420) * 1e9; p.paid = Math.round(p.budget * (p.pr / 100) * (0.7 + rnd() * 0.5));
    p.contractor = p.co || pick(['شرکت توسعه عمران نمونه', 'نوسازان شهر', 'سازه‌گستر البرز', 'پارس نوین']);
    p.expert = experts.find(x => x.role.includes(p.type === 'اجرایی' ? 'اجرایی' : 'مشارکتی') && x.prov === p.prov) || experts[4 + (i % 2)];
  });
  projects.sort((a, b) => a.gap - b.gap);

  /* ---------- activity log ---------- */
  const ACTIONS = [
    { k: 'create', v: 'ثبت کرد', w: 5 }, { k: 'edit', v: 'ویرایش کرد', w: 3 }, { k: 'submit', v: 'برای تأیید فرستاد', w: 2 },
    { k: 'boundary', v: 'محدوده‌اش را روی نقشه کشید', w: 1 }, { k: 'progress', v: 'پیشرفت را به‌روز کرد', w: 1 }];
  const ENT = { 'کارشناس استان': ['شهر', 'منطقه'], 'کارشناس شهر': ['منطقه', 'محله'], 'کارشناس محلات': ['محله', 'معبر', 'عارضه مکانی'], 'کارشناس املاک': ['ملک'], 'کارشناس پروژه‌های اجرایی': ['پروژه اجرایی'], 'کارشناس پروژه‌های مشارکتی': ['پروژه مشارکتی'] };
  const events = [];
  for (let i = 0; i < 90; i++) {
    const x = experts.filter(e => !e.sleepy)[ri(0, 16)];
    const ent = pick(ENT[x.role]);
    let a = ACTIONS[ri(0, 2)];
    if (ent.startsWith('پروژه') && rnd() < .5) a = ACTIONS[4];
    if (['شهر', 'منطقه', 'محله'].includes(ent) && rnd() < .3) a = ACTIONS[3];
    const hood = pick(D.hoods.filter(h => (cityBy[h.city] || {}).p === x.prov).concat(D.hoods.slice(0, 3)));
    const city = cityBy[hood.city] || D.cities[0];
    let name = ent === 'محله' ? 'محله ' + hood.n : ent === 'شهر' ? 'شهر ' + city.n : ent === 'منطقه' ? (regionBy[hood.reg] || { n: 'منطقه ۱' }).n + ' ' + city.n
      : ent === 'معبر' ? (D.streets.find(s => s.h === hood.id) || { n: 'خیابان بهار' }).n : ent === 'ملک' ? 'ملک ' + (D.pts.find(p => p.h === hood.id) || { code: '1200482' }).code
      : ent === 'عارضه مکانی' ? (D.feats.find(f => f.h === hood.id) || { n: 'بوستان محله' }).n : 'پروژه ' + pick(projects.filter(p => p.type === ent.split(' ')[1])).n;
    const mins = Math.round(Math.pow(rnd(), 1.8) * 60 * 24 * 12);
    events.push({ id: 'ev' + i, x, ent, name, a, t: new Date(TODAY - mins * 6e4), place: city.n + '، ' + hood.n, hood: hood.id, city: city.id, prov: x.prov });
  }
  events.sort((a, b) => b.t - a.t);

  /* ---------- review queue (waiting on the super admin) ---------- */
  const queue = D.hoods.filter(h => h.status === 'در انتظار تأیید').slice(0, 6).map((h, i) => ({ id: 'q' + i, kind: 'محله', n: 'محله ' + h.n, ref: h.id, city: (cityBy[h.city] || {}).n, x: experts[i % 8], age: ri(1, 12), steps: h.steps }));
  queue.push({ id: 'qa', kind: 'ملک', n: 'ملک ' + D.pts[12].code, ref: D.pts[12].h, city: 'تهران', x: experts[3], age: 3, steps: 5 });
  queue.push({ id: 'qb', kind: 'شهر', n: 'شهر کاشان', ref: 'ksn', city: 'کاشان', x: experts[1], age: 9, steps: 3 });
  queue.sort((a, b) => b.age - a.age);

  /* ---------- needs attention ---------- */
  const late = projects.filter(p => p.gap < -10);
  const sleepy = experts.filter(e => e.lastDays > 14);
  const stale = D.hoods.filter(h => h.status === 'پیش‌نویس' && (TODAY - h.updated) / DAY > 30);
  const empty = provs.filter(p => !p.has);

  const totals = ['cities', 'regions', 'hoods', 'streets', 'props', 'feats', 'partner', 'exec', 'records', 'thisMonth', 'lastMonth'].reduce((o, k) => (o[k] = provs.reduce((a, p) => a + p[k], 0), o), {});
  totals.provsWith = provs.filter(p => p.has).length;
  totals.monthly = [0, 1, 2, 3, 4, 5, 6, 7].map(i => provs.reduce((a, p) => a + p.monthly[i], 0));
  totals.byType = { 'ملک': totals.props, 'محله': totals.hoods, 'معبر': totals.streets, 'عارضه': totals.feats };
  totals.completeness = Math.round(provs.filter(p => p.has).reduce((a, p) => a + p.completeness, 0) / totals.provsWith);
  totals.pending = provs.reduce((a, p) => a + p.pending, 0);
  totals.activeExperts = experts.filter(e => e.lastDays <= 7).length;

  /* monthly records split by type (for trend chart) */
  const typeShare = { 'ملک': .62, 'محله': .07, 'معبر': .16, 'عوارض و پروژه‌ها': .15 };
  totals.monthlyByType = Object.fromEntries(Object.entries(typeShare).map(([k, s]) => [k, totals.monthly.map(v => Math.round(v * s * (0.85 + rnd() * 0.3)))]));

  window.BZ = { D, GI, provs, provBy, cityBy, regionBy, hoodBy, experts, expBy, projects, events, queue, late, sleepy, stale, empty, totals, TODAY, DAY, STEP_NAMES, MONTHS: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان'] };
})();
