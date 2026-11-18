/* «ورود داده» — data-entry table + 6-step form (Figma «ایجاد محله», restyled).
   Form values persist while moving between steps and pages; drafts, validation and submit update the table. */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M;
  const E = window.E = {};
  const fa = U.fa, fi = U.fi, ic = U.ic, inf = U.info, F = S.form, tf = M.toFa;
  const DATES = ['۲۷ آبان ۱۴۰۵', '۲۶ آبان ۱۴۰۵', '۲۴ آبان ۱۴۰۵', '۲۱ آبان ۱۴۰۵', '۱۸ آبان ۱۴۰۵', '۱۴ آبان ۱۴۰۵'];
  const PEND = 'در انتظار بازبینی', OK = 'تایید شده';
  let mode = 'table', step = 0, isNew = false, grp = 0, submitted = false, stF = '', shown = [];
  const srcStatus = s => s === 'sirous' ? OK : PEND;
  const SRC_T = { sirous: 'داده‌ی محله', form: 'نمونه', est: 'برآورد', osm: 'OSM' };
  const subs = []; E.on = fn => subs.push(fn); const emit = () => subs.forEach(fn => fn());

  /* ---------- rows (built once, then edited in place) ---------- */
  const ROWS = (function () {
    const R = []; let n = 0;
    const add = (st, g, f, v, u, src, extra) => { n++; R.push(Object.assign({ st, stT: F.steps[st], g, f, v, vs: typeof v === 'number' ? fa(v) : String(v), u: u || '', src, srcT: SRC_T[src] || src, who: S.who[n % 4], date: DATES[n % 6], dn: 6 - n % 6, status: srcStatus(src) }, extra || {})); };
    const s1 = F.s1;
    [['استان', s1.prov], ['شهر', s1.city], ['منطقه', s1.reg], ['نام محله', s1.name], ['آدرس', s1.addr], ['کد پستی', s1.post]].forEach(([f, v]) => add(0, 'موقعیت محله', f, v, '', f === 'کد پستی' ? 'osm' : 'sirous'));
    F.s2a.forEach(([f, v, u, s]) => add(1, 'آمار و شمارش‌ها', f, v, u, s));
    F.s2b.forEach(([f, v, u, s]) => add(1, 'خط پایه کالبدی و جمعیتی', f, v, u, s));
    F.s3a.forEach(([f, v]) => add(2, 'شاخص‌های انسانی، اقتصادی و مسکن', f, v, '٪', 'form'));
    F.s3b.forEach(([f, v]) => add(2, 'خدمات زیربنایی', f, v, '٪', 'form'));
    F.s3c.forEach(([f, v]) => add(2, 'سرانه‌ها', f, v, 'مترمربع/نفر', 'sirous'));
    F.s4.forEach(([f, v]) => add(3, 'معیارهای انتخاب و آمادگی اجرا', f, v, '', 'form'));
    add(3, 'معیارهای انتخاب و آمادگی اجرا', 'نیازهای اولویت‌دار محله', F.needs, '', 'sirous');
    F.pop.forEach(([f, v]) => add(4, 'ارزیابی تفصیلی · جمعیت', f, v, '', 'form'));
    F.docs.forEach(([t, ty, y, ind, st]) => { add(4, 'مستندات و شواهد', t, ty + ' · ' + y, '', 'form', { doc: 1 }); R[R.length - 1].status = st; });
    return R;
  })();
  E.pending = () => ROWS.filter(r => r.status === PEND).length;

  /* ---------- form state: s = Sirous, n = new neighbourhood ---------- */
  const ST = { s: { work: {}, saved: {} }, n: { work: {}, saved: {} } };
  const DEF = {};
  const cs = () => ST[isNew ? 'n' : 's'];
  const key = (st, label) => st + ':' + label;
  const get = (k, def) => { DEF[k] = isNew ? '' : def; const w = cs().work; return k in w ? w[k] : DEF[k]; };
  const changed = k => { const c = cs(); return k in c.work && c.work[k] !== (k in c.saved ? c.saved[k] : DEF[k]); };
  const dirty = () => Object.keys(cs().work).some(changed);
  const set = (k, v) => { cs().work[k] = v; };

  /* ---------- head ---------- */
  function head() {
    const done = submitted ? 6 : 5, conf = ROWS.filter(r => r.status === OK || r.status === 'ثبت شده').length;
    const ind = F.groups.reduce((a, g) => a + g[2], 0), indT = F.groups.reduce((a, g) => a + g[1], 0);
    const pct = Math.round((conf / ROWS.length * 0.5 + ind / indT * 0.5) * 100);
    const C = 2 * Math.PI * 27, pend = E.pending();
    const cards = [
      ['entry', 'teal', 'مراحل تکمیل‌شده', `${fa(done)} از ${fa(6)}`, submitted ? 'ارسال‌شده برای بازبینی' : 'فقط مرحله‌ی آخر مانده'],
      ['check', 'green', 'فیلدهای تاییدشده', `${fi(conf)} از ${fi(ROWS.length)}`, pend ? `<a data-pend>${fi(pend)} فیلد در انتظار بازبینی</a>` : 'همه‌ی فیلدها بررسی شده‌اند'],
      ['target', 'blue', 'شاخص‌های ارزیابی', `${fi(ind)} از ${fi(indT)}`, `${fi(F.groups.filter(g => g[2] < g[1]).length)} گروه ناقص`],
      ['file', 'amber', 'مستندات', fi(F.docs.length), `${fi(F.docs.filter(d => d[4] !== 'ثبت شده').length)} مورد نیازمند اقدام`],
      ['pin', 'sky', 'خدمات ثبت‌شده', fi(svcRows().length), 'همگام با لایه‌ی خدمات نقشه']
    ];
    return `<div class="ek">
        <div class="kp ek0"><div class="rec"><div class="cring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#EEF2F6" stroke-width="7"/><circle cx="32" cy="32" r="27" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 32 32)"/><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63D3D1"/><stop offset="1" stop-color="#0CA5A3"/></linearGradient></defs></svg><b class="num">${fa(pct)}٪</b></div>
          <div style="min-width:0"><div class="ekt"><b>محله سیروس</b>${U.statusBadge(PEND)}${inf('درصد کامل بودن پرونده: میانگین سهم فیلدهای تاییدشده و شاخص‌های ارزیابی ثبت‌شده.')}</div><div class="muted">تهران · منطقه ۱۲ · کد ${tf(1554456)}</div><div class="muted">آخرین ویرایش ${DATES[0]} · ${S.who[0]}</div></div></div></div>
        ${cards.map(([i, g, t, v, d]) => `<div class="kp"><div class="kh"><span class="ic" style="background:${U.grad(g)}">${ic(i, 'xs')}</span><span class="l">${t}</span></div><div class="v num">${v}</div><div class="d">${d}</div></div>`).join('')}
      </div>`;
  }
  function refreshHead() { const h = U.$('[data-ehead]'); if (h) h.innerHTML = head(); emit(); }

  /* ---------- table mode ---------- */
  let tbl;
  function tableView() {
    return `<div class="card"><div class="ch"><h3>داده‌های ثبت‌شده</h3>${inf('همه‌ی فیلدهای فرم محله سیروس. با کلیک روی هر ردیف، فرم همان مرحله باز می‌شود و فیلد آن برجسته می‌شود.')}<div class="ac"><div class="seg" data-stf><button class="${stF === '' ? 'on' : ''}" data-s="">همه</button>${F.steps.slice(0, 5).map((s, i) => `<button class="${stF === String(i) ? 'on' : ''}" data-s="${i}">${tf(i + 1)}. ${s}</button>`).join('')}</div></div></div><div id="t-entry"></div></div>`;
  }
  function drawTable() {
    tbl = U.table(U.$('#t-entry'), [
      { k: 'st', t: 'مرحله', w: '150px', sort: r => r.st, render: r => `<span class="ax" style="background:var(--prl);color:var(--pr2)">${tf(r.st + 1)}</span> <span class="t2">${r.stT}</span>` },
      { k: 'g', t: 'بخش' },
      { k: 'f', t: 'فیلد', render: (r, q) => `<span class="t1">${U.hl(r.f, q)}</span>` },
      { k: 'vs', t: 'مقدار', sort: r => typeof r.v === 'number' ? r.v : r.vs, render: (r, q) => `<span class="vv">${U.hl(r.vs, q)}</span> <span class="t2">${r.u}</span>` },
      { k: 'srcT', t: 'منبع', render: r => U.src(r.src) || `<span class="src">${r.srcT}</span>` },
      { k: 'who', t: 'ثبت‌کننده', render: r => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span class="av" style="width:24px;height:24px;font-size:10px;background:${U.grad(['teal', 'blue', 'sky', 'green', 'navy'][Math.max(0, S.who.indexOf(r.who))] || 'navy')}">${r.who[0]}</span>${r.who}</span>` },
      { k: 'date', t: 'آخرین ویرایش', sort: r => r.dn },
      { k: 'status', t: 'وضعیت', render: r => U.statusBadge(r.status) },
      { k: 'op', t: '', sort: false, w: '84px', render: r => `<button class="ib" data-tt="ویرایش" aria-label="ویرایش" data-ed>${ic('edit', 's')}</button>${r.status === OK || r.status === 'ثبت شده' ? `<span class="ib ok" data-tt="تایید شده">${ic('check', 's')}</span>` : `<button class="ib" data-tt="تایید" aria-label="تایید" data-ok>${ic('check', 's')}</button>`}` }
    ], ROWS, {
      ph: 'جستجوی فیلد یا مقدار…', search: ['f', 'vs', 'g', 'who'],
      filters: [{ k: 'status', t: 'وضعیت', opts: [OK, PEND, 'ثبت شده', 'نیاز به اصلاح'] }, { k: 'srcT', t: 'منبع', opts: ['داده‌ی محله', 'نمونه', 'برآورد', 'OSM'] }, { k: 'who', t: 'ثبت‌کننده', opts: S.who.concat(['سوپر ادمین']) }],
      extra: `<button class="btn sm" data-bulk>${ic('check', 'xs')}<span></span></button>`,
      pre: r => stF === '' || String(r.st) === stF, maxh: 560,
      after: rs => { shown = rs; const b = U.$('[data-bulk]'); if (!b) return; const n = rs.filter(r => r.status === PEND).length; b.disabled = !n; b.querySelector('span').textContent = n ? `تایید ${fi(n)} ردیف در انتظار` : 'ردیف در انتظاری نیست'; },
      onRow: (r, e) => {
        if (e.target.closest('[data-ok]')) { r.status = OK; tbl.draw(); refreshHead(); U.toast(`«${r.f}» تایید شد`); return; }
        if (e.target.closest('.ib.ok')) return;
        openForm(r.st, r.doc ? null : key(r.st, r.f));
      }
    });
  }
  E.showPending = () => {
    window.APP.go('entry'); stF = '';
    if (mode !== 'table') { mode = 'table'; draw(); } else U.$$('[data-stf] button').forEach(b => b.classList.toggle('on', b.dataset.s === ''));
    tbl.setFilter('status', PEND); scrollTo(U.$('#t-entry'));
  };

  /* ---------- form mode ---------- */
  const fld = (st, label, val, o) => {
    o = o || {}; const k = key(st, label), v = get(k, val);
    const req = o.req ? '<em>*</em>' : '', src = !isNew && o.src ? U.src(o.src) : '', cls = `fld ${o.cls || (o.ta ? 'sp3' : '')} ${changed(k) ? 'chg' : ''}`;
    const lab = `<label>${label}${req}${src}${o.tip ? inf(o.tip) : ''}</label>`;
    if (o.sel) return `<div class="${cls}">${lab}<select data-k="${U.esc(k)}">${isNew || !o.sel.includes(v) ? '<option value="">انتخاب کنید</option>' : ''}${o.sel.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
    if (o.ta) return `<div class="${cls}">${lab}<textarea data-k="${U.esc(k)}" placeholder="${o.ph || ''}">${U.esc(v)}</textarea></div>`;
    return `<div class="${cls}">${lab}<div class="iw"><input data-k="${U.esc(k)}" value="${U.esc(typeof v === 'number' ? fa(v) : v)}" placeholder="${o.ph || (o.u ? 'عدد' : '')}" ${o.num ? 'inputmode="decimal"' : ''}>${o.u ? `<span class="u">${o.u}</span>` : ''}</div></div>`;
  };
  const pctF = (st, label, val) => { const k = key(st, label), v = +get(k, val) || 0; return `<div class="fld ${changed(k) ? 'chg' : ''}"><label>${label}</label><div class="pctf"><input type="range" min="0" max="100" value="${v}" data-pct data-k="${U.esc(k)}" aria-label="${label}"><output class="num">${fa(v)}٪</output></div></div>`; };
  const pick = (cls, opts) => (st, label, val) => { const k = key(st, label), v = get(k, val); return `<div class="fld ${changed(k) ? 'chg' : ''}"><label>${label}</label><div class="${cls}" data-k="${U.esc(k)}">${opts.map(([t, c]) => `<button type="button" class="${c || ''} ${v === t ? 'on' : ''}" data-pick>${t}</button>`).join('')}</div></div>`; };
  // lv: higher is worse (hazards); lvGood: higher is better (participation)
  const lv = pick('lv', [['کم', 'l1'], ['متوسط', 'l2'], ['بالا', 'l3']]), lvGood = pick('lv', [['کم', 'l3'], ['متوسط', 'l2'], ['بالا', 'l1']]), yn = pick('yn', [['بله'], ['خیر']]);
  const sec = (t, tip, body, ac, badge) => `<div class="fsec"><div class="fh"><b>${t}</b>${badge ? `<span class="badge b-mu">${badge}</span>` : ''}${tip ? inf(tip) : ''}${ac ? `<div class="ac">${ac}</div>` : ''}</div>${body}</div>`;
  function svcRows() {
    return M.pois.filter(f => f.properties.n && ['مذهبی', 'آموزشی', 'درمانی', 'ورزشی', 'فضای سبز', 'امدادی', 'اداری', 'تاریخی', 'مالی'].includes(f.properties.cat)).map((f, i) => ({ n: f.properties.n, t: f.properties.cat, st: 'فعال', cap: ['—', '۲۴۰ نفر', '۱۲۰ نفر', '—', '۸۰ نفر'][i % 5], i: f.properties.i }));
  }
  const stepsHtml = {
    0: () => sec('موقعیت محله', 'فیلدهای ستاره‌دار الزامی‌اند.', `<div class="fg">${fld(0, 'استان', F.s1.prov, { req: 1, sel: ['تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'البرز'] })}${fld(0, 'شهر', F.s1.city, { req: 1, sel: ['تهران', 'شهریار', 'ورامین'] })}${fld(0, 'منطقه', F.s1.reg, { req: 1, sel: Array.from({ length: 22 }, (_, i) => 'منطقه ' + tf(i + 1)) })}${fld(0, 'نام محله', F.s1.name, { req: 1, ph: 'مثلاً سیروس' })}${fld(0, 'آدرس', F.s1.addr, { cls: 'sp2' })}${fld(0, 'کد پستی', F.s1.post, { src: 'osm', num: 1 })}</div>`) +
      sec('محدوده‌ی محله روی نقشه', '', `<div class="cb bnd"><span class="ii" style="background:${U.grad('teal')}">${ic('map')}</span><div style="flex:1;min-width:0"><b>${isNew ? 'هنوز محدوده‌ای ترسیم نشده' : 'مرز محله ترسیم شده است'}</b><div class="muted">${isNew ? 'پس از ذخیره‌ی مشخصات، محدوده را روی نقشه رسم کنید.' : `${fa(window.GEO.meta.ha, 1)} هکتار · ${fi(M.parcels.length)} پلاک`}</div></div>${isNew ? '' : `<button class="btn sm" data-go="reports">${ic('eye', 'xs')}مشاهده روی نقشه</button>`}</div>`),
    1: () => sec('آمار و شمارش‌ها', '', `<div class="fg">${F.s2a.map(([f, v, u, s]) => fld(1, f, v, { u, num: 1, src: s, req: /ساکنین|بلوک/.test(f) })).join('')}</div>`) + sec('خط پایه‌ی کالبدی و جمعیتی', 'سال مرجع داده: ۱۴۰۵', `<div class="fg">${F.s2b.map(([f, v, u, s]) => fld(1, f, v, { u, num: typeof v === 'number' || /کد|سال/.test(f) ? 1 : 0, src: s, tip: f === 'تعداد واحد مسکونی' ? 'برآورد بر اساس تعداد خانوار؛ نیازمند تایید.' : '' })).join('')}</div>`),
    2: () => sec('شاخص‌های انسانی، اقتصادی و مسکن', 'درصد از کل خانوار یا جمعیت.', `<div class="fg">${F.s3a.map(([f, v]) => pctF(2, f, v)).join('')}</div>`, U.src('form')) + sec('خدمات زیربنایی، روبنایی و سرانه‌ها', 'درصد پوشش خدمات زیربنایی و سرانه‌ها به مترمربع برای هر نفر.', `<div class="fg">${F.s3b.map(([f, v]) => pctF(2, f, v)).join('')}${F.s3c.map(([f, v]) => fld(2, f, v, { u: 'مترمربع/نفر', num: 1, src: 'sirous' })).join('')}</div>`),
    3: () => {
      const s = F.s4, sv = isNew ? [] : svcRows();
      return sec('معیارهای انتخاب و آمادگی اجرا', '', `<div class="fg">${lv(3, s[0][0], s[0][1])}${lvGood(3, s[1][0], s[1][1])}${s.slice(2).map(([f, v]) => yn(3, f, v)).join('')}${fld(3, 'نیازهای اولویت‌دار محله', F.needs, { ta: 1, src: 'sirous', ph: 'نیازها را با ویرگول جدا کنید' })}</div>`, U.src('form')) +
        sec('ساختمان‌ها و خدمات موجود', 'همگام با لایه‌ی خدمات نقشه (OpenStreetMap).', `<div class="tw" style="max-height:300px"><table class="dt"><thead><tr><th>نام ساختمان / خدمت</th><th>نوع خدمت</th><th>وضعیت</th><th>ظرفیت</th><th style="width:96px">عملیات</th></tr></thead><tbody>${sv.length ? sv.map((r, n) => `<tr><td class="t1">${U.esc(r.n)}</td><td>${r.t}</td><td>${U.statusBadge(r.st)}</td><td class="num">${r.cap}</td><td><button class="ib" data-svmap="${r.i}" data-tt="روی نقشه" aria-label="روی نقشه">${ic('pin', 's')}</button><button class="ib" data-tt="ویرایش" aria-label="ویرایش" data-svedit="${n}">${ic('edit', 's')}</button></td></tr>`).join('') : `<tr><td colspan="5"><div class="empty">هنوز خدمتی ثبت نشده است.</div></td></tr>`}</tbody></table></div>`, `<button class="btn sm" data-svadd>${ic('plus', 'xs')}افزودن خدمت</button>`, `${fi(sv.length)} مورد`);
    },
    4: () => {
      const g = F.groups[grp];
      const body = grp === 0 && !isNew ? `<div class="fg">${F.pop.map(([f, v]) => fld(4, f, v, { src: 'form' })).join('')}${fld(4, 'ملاحظات ارزیابی', 'داده‌ها از سرشماری ۱۴۰۵ و پیمایش میدانی محله گردآوری شده است.', { ta: 1 })}</div>` : `<div class="fg">${Array.from({ length: g[1] }, (_, i) => fld(4, `شاخص ${tf(i + 1)} · ${g[0]}`, i < g[2] ? 'ثبت شده' : '', { ph: 'مقدار یا توضیح شاخص' })).join('')}</div>`;
      return sec('گروه‌های ارزیابی', `${fi(F.groups.length)} گروه و ${fi(F.groups.reduce((a, x) => a + x[1], 0))} شاخص. روی هر گروه کلیک کنید تا شاخص‌هایش باز شود.`, `<div class="grpg">${F.groups.map(([t, n, d], i) => { const p = isNew ? 0 : d / n * 100; return `<button class="gp ${i === grp ? 'on' : ''}" data-grp="${i}"><b>${t}</b><div class="m"><div class="b"><i style="width:${p}%;background:${U.grad(p >= 100 ? 'green' : p >= 50 ? 'teal' : 'amber', '270deg')}"></i></div><small>${fa(isNew ? 0 : d)} از ${fa(n)}</small></div></button>`; }).join('')}</div>`) +
        sec(`شاخص‌های گروه «${g[0]}»`, '', body, U.src('form')) +
        sec('مستندات و شواهد', '', `<div class="tw" style="max-height:300px"><table class="dt"><thead><tr><th>عنوان مستند</th><th>نوع سند</th><th>سال / دوره مرجع</th><th>شاخص مرتبط</th><th>وضعیت</th><th style="width:96px">عملیات</th></tr></thead><tbody>${isNew ? `<tr><td colspan="6"><div class="empty">هنوز مستندی اضافه نشده است.</div></td></tr>` : F.docs.map((d, n) => `<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><span class="fi ext" style="background:${U.grad({ pdf: 'red', xlsx: 'green', dwg: 'blue', zip: 'amber' }[d[5]])}">${d[5].toUpperCase()}</span><span class="t1">${d[0]}</span></span></td><td>${d[1]}</td><td class="num">${d[2]}</td><td class="t2">${d[3]}</td><td>${U.statusBadge(d[4])}</td><td><button class="ib" data-tt="مشاهده" aria-label="مشاهده" data-dview="${n}">${ic('eye', 's')}</button><button class="ib" data-tt="دانلود" aria-label="دانلود" data-ddl="${n}">${ic('dl', 's')}</button></td></tr>`).join('')}</tbody></table></div>`, `<button class="btn sm" data-upl>${ic('upload', 'xs')}افزودن مستند</button>`, isNew ? '' : `${fi(F.docs.length)} مستند`);
    },
    5: () => {
      const v = (st, label, def) => { const k = key(st, label), w = cs().work; const x = k in w ? w[k] : def; return x === '' || x == null ? '—' : typeof x === 'number' ? fa(x) : U.esc(x); };
      const card = (n, t, items) => `<div class="rc"><h5><span class="ax" style="background:var(--prl);color:var(--pr2)">${tf(n)}</span>${t}<button class="btn sm gh" data-step="${n - 1}">${ic('edit', 'xs')}ویرایش</button></h5><dl>${items.map(([a, b]) => `<dt>${a}</dt><dd class="num">${b}</dd>`).join('')}</dl></div>`;
      const g = (st, l, d) => v(st, l, isNew ? '' : d);
      const pend = E.pending();
      const checks = [['مشخصات اولیه کامل است', 1], ['آمار پایه با منبع ثبت شده', 1], [`${fi(ROWS.filter(r => r.src === 'form' && r.status === PEND).length)} فیلد با مقدار نمونه نیازمند تایید است`, 0], ['شاخص‌های ارزیابی: ' + fi(F.groups.reduce((a, x) => a + x[2], 0)) + ' از ' + fi(F.groups.reduce((a, x) => a + x[1], 0)), 0], [`${fi(F.docs.filter(d => d[4] !== 'ثبت شده').length)} مستند در انتظار بازبینی یا اصلاح`, 0]];
      return `<div class="rv">${card(1, 'مشخصات اولیه', [['استان / شهر', g(0, 'استان', F.s1.prov) + ' / ' + g(0, 'شهر', F.s1.city)], ['منطقه', g(0, 'منطقه', F.s1.reg)], ['نام محله', g(0, 'نام محله', F.s1.name)], ['کد پستی', g(0, 'کد پستی', F.s1.post)]])}${card(2, 'آمار و خط پایه', [['ساکنین', g(1, 'تعداد ساکنین', 4363)], ['خانوار', g(1, 'تعداد خانوار', 1445)], ['بلوک مسکونی / تجاری', g(1, 'تعداد بلوک‌های مسکونی', 1018) + ' / ' + g(1, 'تعداد بلوک‌های تجاری', 272)], ['مساحت (هکتار)', g(1, 'مساحت محله', 44)], ['واحد ناپایدار', g(1, 'تعداد واحد ناپایدار', 1007)], ['ظرفیت نوسازی', g(1, 'ظرفیت نوسازی واحدها', 3000)]])}${card(3, 'سرانه‌ها', F.s3c.map(([a, b]) => [a, g(2, a, b)]))}${card(4, 'آمادگی اجرا', F.s4.map(([a, b]) => [a, g(3, a, b)]))}${card(5, 'سنجش و مستندات', [['گروه‌های کامل', isNew ? '—' : fi(F.groups.filter(x => x[2] === x[1]).length) + ' از ' + fi(F.groups.length)], ['مستندات', isNew ? '—' : fi(F.docs.length)], ['تراکم جمعیت', g(4, 'تراکم جمعیت', '۹۹٫۲ نفر در هکتار')]])}
        <div class="rc"><h5>${ic('check', 's')}کنترل پیش از ثبت</h5><div class="chk2">${(isNew ? [['فیلدهای الزامی را در مراحل ۱ و ۲ تکمیل کنید', 0]] : checks).map(([t, ok]) => `<div class="ci"><span class="st" style="background:${ok ? 'var(--okl)' : 'var(--wal)'};color:${ok ? '#23803A' : '#B86A00'}">${ic(ok ? 'check' : 'warn', 'xs')}</span><b>${t}</b></div>`).join('')}${!isNew && pend ? `<button class="btn sm gh" data-pend style="margin-top:6px">${ic('eye', 'xs')}دیدن ${fi(pend)} فیلد در انتظار</button>` : ''}</div></div></div>
        <div class="cb" style="padding-top:0"><div class="ck" data-confirm role="checkbox" aria-checked="false" tabindex="0" style="max-width:560px"><span class="bx">${ic('check', 'xs')}</span><div><b>صحت اطلاعات واردشده را تایید می‌کنم</b><small>پس از ثبت نهایی، پرونده برای بازبینی کارشناس ارسال می‌شود</small></div></div></div>`;
    }
  };
  function side() {
    const st = submitted && !isNew ? [1, 1, 1, 1, 1, 1] : [1, 1, 1, 1, 0.82, 0];
    const act = isNew ? [] : [['edit', 'teal', 'مریم احمدی', 'سرانه‌ها را به‌روز کرد', DATES[0]], ['file', 'amber', 'رضا کاظمی', 'مستند «برداشت میدانی» را افزود', DATES[1]], ['check', 'green', 'سارا نوری', 'آمار پایه را تایید کرد', DATES[2]], ['map', 'blue', 'علی رضایی', 'مرز محله را روی نقشه اصلاح کرد', DATES[3]]];
    return `<div class="fst">وضعیت پرونده ${inf('برچسب «نمونه» یعنی مقدار از نمونه‌ی فرم یا قالب گزارش آمده و باید با داده‌ی میدانی جایگزین شود.')}</div>
      <div class="chk2">${F.steps.map((s, i) => { const v = isNew ? 0 : st[i]; const done = v >= 1; return `<button data-step="${i}" class="${i === step ? 'on' : ''}"><span class="st" style="background:${done ? 'var(--prl)' : v > 0 ? 'var(--wal)' : 'var(--sf3)'};color:${done ? 'var(--pr2)' : v > 0 ? '#B86A00' : 'var(--tx3)'}">${done ? ic('check', 'xs') : tf(i + 1)}</span><div><b>${s}</b><small>${done ? 'تکمیل شده' : v > 0 ? `${fa(v * 100, 0)}٪ تکمیل` : 'شروع نشده'}</small></div></button>`; }).join('')}</div>
      <div class="fst" style="margin-top:18px">آخرین فعالیت‌ها</div>
      <div class="hist">${act.map(([i, g, w, t, d]) => `<div><span class="fi" style="background:${U.grad(g)}">${ic(i, 'xs')}</span><div style="flex:1;min-width:0"><b>${w}</b><div class="muted">${t} · ${d}</div></div></div>`).join('') || '<div class="muted">هنوز فعالیتی ثبت نشده است.</div>'}</div>`;
  }
  function svText() { return dirty() ? `${ic('clock', 'xs')}تغییرات ذخیره نشده` : cs().t ? `${ic('check', 'xs')}پیش‌نویس ذخیره شد · ${cs().t}` : `${ic('check', 'xs')}بدون تغییر`; }
  function formView() {
    const doneSteps = isNew ? 0 : submitted ? 6 : 5;
    return `<div class="card" id="fcard">${isNew ? `<div class="note w" style="margin:14px 18px 0">${ic('plus', 's')}<span>در حال ایجاد محله‌ی جدید. فیلدها خالی‌اند؛ داده‌ی نمونه فقط برای محله سیروس ثبت شده است.</span><button class="btn sm" data-cancel style="margin-inline-start:auto">بازگشت به سیروس</button></div>` : ''}
      <div class="steps">${F.steps.map((s, i) => { const done = i < doneSteps; return `<button class="stp2 ${i === step ? 'cur' : done ? 'done' : ''}" data-step="${i}" ${i === step ? 'aria-current="step"' : ''}><span class="c">${done && i !== step ? ic('check', 's') : tf(i + 1)}</span><div><b>${s}</b><small>${i === step ? 'مرحله‌ی جاری' : done ? 'تکمیل شده' : 'تکمیل نشده'}</small></div></button>`; }).join('')}</div>
      <div class="fbody"><div class="fmain" data-fmain>${stepsHtml[step]()}</div><aside class="fside">${side()}</aside></div>
      <div class="ffoot"><button class="btn gh" data-cancel>لغو</button><span class="sp"></span><span class="sv" data-sv>${svText()}</span><button class="btn" data-draft>${ic('save', 's')}ذخیره پیش‌نویس</button><button class="btn" data-prev ${step === 0 ? 'disabled' : ''}>${ic('chevr', 's')}مرحله قبل</button><button class="btn pr" data-next>${step === 5 ? `${ic('check', 's')}ثبت نهایی` : `مرحله بعد${ic('chevl', 's')}`}</button></div></div>`;
  }
  function scrollTo(el) { if (!el) return; const v = U.$('.view'); const top = el.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - 16; v.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); }
  function focusKey(k) {
    const el = U.$$('[data-fmain] [data-k]').find(x => x.dataset.k === k); if (!el) return;
    const f = el.closest('.fld'); f.classList.add('hl'); setTimeout(() => f.classList.remove('hl'), 2200);
    setTimeout(() => { scrollTo(f); if (el.focus) el.focus({ preventScroll: true }); }, 60);
  }
  function openForm(s, k) { mode = 'form'; step = s || 0; if (s === 4 && k) grp = 0; draw(); if (k) focusKey(k); else scrollTo(U.$('#fcard')); }
  function goStep(s) { step = s; draw(); const c = U.$('#fcard'); if (c && c.getBoundingClientRect().top < U.$('.view').getBoundingClientRect().top) scrollTo(c); }

  /* ---------- validation ---------- */
  const num = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  function validate() {
    let first = null;
    U.$$('[data-fmain] .fld').forEach(f => {
      f.classList.remove('err'); const eh = f.querySelector('.eh'); if (eh) eh.remove();
      const inp = f.querySelector('input:not([type=range]),select,textarea'); if (!inp) return;
      const val = inp.value.trim(); let msg = '';
      if (f.querySelector('label em') && !val) msg = 'این فیلد الزامی است';
      else if (val && inp.getAttribute('inputmode') === 'decimal' && !/^-?\d+(\.\d+)?$/.test(num(val))) msg = 'فقط عدد وارد کنید';
      if (msg) { f.classList.add('err'); f.insertAdjacentHTML('beforeend', `<div class="eh">${ic('warn', 'xs')}${msg}</div>`); if (!first) first = inp; }
    });
    if (first) { U.toast('چند فیلد نیاز به اصلاح دارد', 'warn'); scrollTo(first.closest('.fld')); first.focus({ preventScroll: true }); }
    return !first;
  }

  /* ---------- actions ---------- */
  function saveDraft() { const c = cs(); c.saved = Object.assign({}, c.work); c.t = 'همین حالا'; U.$$('[data-fmain] .fld.chg').forEach(f => f.classList.remove('chg')); const s = U.$('[data-sv]'); if (s) s.innerHTML = svText(); U.toast('پیش‌نویس ذخیره شد', 'save'); }
  function leaveForm() { isNew = false; mode = 'table'; draw(); }
  function cancel() {
    if (!dirty()) { leaveForm(); return; }
    U.modal({ title: 'خروج بدون ذخیره؟', body: '<div style="font-size:13px;line-height:1.9">تغییرات این فرم هنوز ذخیره نشده است. با خروج، این تغییرات از بین می‌رود.</div>', ok: 'خروج و حذف تغییرات', cancel: 'ادامه‌ی ویرایش', danger: true,
      onOk: () => { const c = cs(); c.work = Object.assign({}, c.saved); leaveForm(); } });
  }
  function submit() {
    const c = U.$('[data-confirm]');
    if (!c.classList.contains('on')) { U.toast('ابتدا صحت اطلاعات را تایید کنید', 'warn'); c.classList.add('err'); c.focus(); return; }
    const w = cs().work; let n = 0;
    if (!isNew) {
      ROWS.forEach(r => { const k = key(r.st, r.f); if (k in w && changed(k)) { const nv = num(w[k]); r.v = typeof w[k] === 'number' ? w[k] : /^-?\d+(\.\d+)?$/.test(nv) ? +nv : w[k]; r.vs = typeof w[k] === 'number' ? fa(w[k]) : tf(String(w[k])); r.status = PEND; r.who = 'سوپر ادمین'; r.date = 'همین حالا'; r.dn = 7; n++; } });
      submitted = true; ST.s.saved = Object.assign({}, w);
      const tag = U.$('[data-page="reports"] .ph .tag'); if (tag) { tag.classList.remove('w'); tag.innerHTML = `${ic('check', 'xs')}ارسال‌شده برای بازبینی · ${fa(6)} از ${fa(6)} مرحله`; }
      U.toast(n ? `پرونده با ${fi(n)} تغییر برای بازبینی کارشناس ارسال شد` : 'پرونده برای بازبینی کارشناس ارسال شد');
    } else { ST.n = { work: {}, saved: {} }; U.toast('محله‌ی جدید برای بازبینی کارشناس ارسال شد'); }
    isNew = false; mode = 'table'; stF = ''; draw(); emit();
  }
  function fileModal() {
    const tpl = () => { const cols = ROWS.filter(r => !r.doc).map(r => r.f); const csv = '﻿' + cols.map(c => '"' + c.replace(/"/g, '""') + '"').join(',') + '\r\n'; window.R.download('neighbourhood-template.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' })).then(ok => { if (ok) U.toast('قالب CSV ساخته شد', 'dl'); }); };
    let file = null;
    U.modal({ title: 'بارگذاری از اکسل', ok: `${ic('upload', 's')}بارگذاری`,
      body: `<label class="drop" data-drop><input type="file" accept=".xlsx,.xls,.csv" hidden data-file>${ic('upload', 'l')}<b data-fname>فایل را اینجا رها کنید یا برای انتخاب کلیک کنید</b><small>XLSX یا CSV · یک ردیف برای هر محله، ستون‌ها مطابق فیلدهای فرم</small></label><button type="button" class="btn sm gh" data-tpl style="margin-top:10px">${ic('dl', 'xs')}دریافت قالب CSV</button>`,
      onOpen: box => {
        const inp = box.querySelector('[data-file]'), zone = box.querySelector('[data-drop]'), nm = box.querySelector('[data-fname]');
        const setF = f => { if (!f) return; file = f; nm.textContent = f.name; zone.classList.add('has'); };
        inp.addEventListener('change', () => setF(inp.files[0]));
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('ov'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('ov'));
        zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('ov'); setF(e.dataTransfer.files[0]); });
        box.querySelector('[data-tpl]').addEventListener('click', tpl);
      },
      onOk: () => { if (!file) { U.toast('ابتدا فایل را انتخاب کنید', 'warn'); return false; } U.toast(`«${file.name}» دریافت شد؛ پس از بررسی ستون‌ها، داده‌ها به جدول اضافه می‌شوند`, 'upload'); } });
  }
  function formModal(title, fields, ok, okMsg) {
    U.modal({ title, ok: ok || 'ذخیره',
      body: `<div class="fg mfg">${fields.map(([f, ph, req, val, full]) => `<div class="fld ${full ? 'full' : ''}"><label>${f}${req ? '<em>*</em>' : ''}</label>${full ? `<textarea placeholder="${ph}">${U.esc(val || '')}</textarea>` : `<input placeholder="${ph}" value="${U.esc(val || '')}">`}</div>`).join('')}</div>`,
      onOk: box => {
        let bad = null;
        box.querySelectorAll('.fld').forEach(f => { f.classList.remove('err'); const e = f.querySelector('.eh'); if (e) e.remove(); const i = f.querySelector('input,textarea'); if (f.querySelector('em') && !i.value.trim()) { f.classList.add('err'); f.insertAdjacentHTML('beforeend', `<div class="eh">${ic('warn', 'xs')}این فیلد الزامی است</div>`); bad = bad || i; } });
        if (bad) { bad.focus(); return false; }
        U.toast(okMsg || title + ' ذخیره شد');
      } });
  }
  const SV_F = ['نوع خدمت', 'نام', 'سال ساخت', 'سازنده', 'بهره‌بردار', 'مساحت (مترمربع)', 'ظرفیت (نفر)', 'وضعیت فعلی'];
  const SV_PH = ['آموزشی', 'مدرسه محله', '۱۳۸۵', 'سازمان نوسازی مدارس', 'آموزش‌وپرورش', '۱٬۸۰۰', '۲۴۰', 'فعال'];

  let root;
  function draw() {
    root.innerHTML = `<div class="wrap"><div class="ph"><div class="t"><div class="pre">محله‌ها ${ic('chevl', 'xs')} ورود داده</div><h1>ورود داده‌ی محله‌ها${inf('ثبت و ویرایش مشخصات، آمار پایه، شاخص‌ها، خدمات و مستندات محله')}</h1></div>
      <div class="acts"><button class="btn" data-imp>${ic('upload', 's')}بارگذاری از اکسل</button><button class="btn pr" data-new>${ic('plus', 's')}ایجاد محله جدید</button></div></div>
      <div data-ehead>${head()}</div>
      <div class="emode"><div class="seg" data-mode><button class="${mode === 'table' ? 'on' : ''}" data-m="table">${ic('entry', 'xs')}جدول داده‌ها</button><button class="${mode === 'form' ? 'on' : ''}" data-m="form">${ic('edit', 'xs')}فرم مرحله‌ای</button></div>${mode === 'form' ? `<span class="badge ${isNew ? 'b-wa' : 'b-pr'}">${isNew ? 'محله‌ی جدید' : 'ویرایش پرونده‌ی محله سیروس'}</span>` : ''}</div>
      ${mode === 'table' ? tableView() : formView()}</div>`;
    if (mode === 'table') drawTable();
  }
  E.render = function (el) {
    root = el; draw();
    el.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-pend]')) { E.showPending(); return; }
      const md = t.closest('[data-mode] button'); if (md) { if (md.dataset.m === mode) return; mode = md.dataset.m; draw(); return; }
      const sf = t.closest('[data-stf] button'); if (sf) { stF = sf.dataset.s; U.$$('[data-stf] button').forEach(b => b.classList.toggle('on', b === sf)); tbl.draw(); return; }
      if (t.closest('[data-bulk]')) {
        const L = shown.filter(r => r.status === PEND); if (!L.length) return;
        U.modal({ title: 'تایید گروهی', ok: `${ic('check', 's')}تایید ${fi(L.length)} ردیف`, body: `<div style="font-size:13px;line-height:1.9">${fi(L.length)} ردیف «در انتظار بازبینی» که الان در جدول نمایش داده می‌شوند تایید می‌شوند.</div>`, onOk: () => { L.forEach(r => { r.status = OK; }); tbl.draw(); refreshHead(); U.toast(`${fi(L.length)} ردیف تایید شد`); } });
        return;
      }
      const sp = t.closest('[data-step]'); if (sp) { if (mode !== 'form') { openForm(+sp.dataset.step); return; } goStep(+sp.dataset.step); return; }
      if (t.closest('[data-next]')) { if (step < 5) { if (!validate()) return; goStep(step + 1); scrollTo(U.$('#fcard')); } else submit(); return; }
      if (t.closest('[data-prev]')) { if (step > 0) goStep(step - 1); return; }
      if (t.closest('[data-draft]')) { saveDraft(); return; }
      if (t.closest('[data-cancel]')) { cancel(); return; }
      if (t.closest('[data-new]')) { isNew = true; mode = 'form'; step = 0; grp = 0; draw(); scrollTo(U.$('#fcard')); return; }
      if (t.closest('[data-imp]')) { fileModal(); return; }
      if (t.closest('[data-svadd]')) { formModal('افزودن ساختمان / خدمت', SV_F.map((f, i) => [f, SV_PH[i], i < 2]), 'افزودن', 'ساختمان / خدمت اضافه شد'); return; }
      const se = t.closest('[data-svedit]'); if (se) { const r = svcRows()[+se.dataset.svedit]; formModal('ویرایش ساختمان / خدمت', SV_F.map((f, i) => [f, SV_PH[i], i < 2, i === 0 ? r.t : i === 1 ? r.n : i === 6 && r.cap !== '—' ? r.cap.replace(' نفر', '') : i === 7 ? r.st : '']), 'ذخیره', `«${r.n}» به‌روز شد`); return; }
      if (t.closest('[data-upl]')) { formModal('افزودن مستند', [['عنوان مستند', 'گزارش جمعیتی محله', 1], ['نوع سند', 'گزارش'], ['سال / دوره مرجع', '۱۴۰۵'], ['شاخص مرتبط', 'جمعیت / تحولات جمعیت'], ['توضیحات مستند', 'گزارش آمار جمعیت و خانوار در محدوده محله؛ تهیه‌شده برای ارزیابی سال ۱۴۰۵.', 0, '', 1]], 'افزودن', 'مستند اضافه شد'); return; }
      const dv = t.closest('[data-dview]'); if (dv) { const d = F.docs[+dv.dataset.dview]; U.modal({ title: d[0], ok: false, body: `<dl class="ddl"><dt>نوع سند</dt><dd>${d[1]}</dd><dt>سال / دوره مرجع</dt><dd class="num">${d[2]}</dd><dt>شاخص مرتبط</dt><dd>${d[3]}</dd><dt>قالب فایل</dt><dd>${d[5].toUpperCase()}</dd><dt>وضعیت</dt><dd>${U.statusBadge(d[4])}</dd></dl><div class="note" style="margin-top:12px">${ic('info', 's')}<span>این مستند نمونه است و فایل اصلی آن هنوز بارگذاری نشده است.</span></div>` }); return; }
      const dd = t.closest('[data-ddl]'); if (dd) { U.toast(`فایل «${F.docs[+dd.dataset.ddl][0]}» نمونه است و نسخه‌ی قابل دانلود ندارد`, 'info'); return; }
      const sv = t.closest('[data-svmap]'); if (sv) { window.APP.go('reports'); setTimeout(() => { window.R.jump('s-map'); setTimeout(() => M.flyPoi(+sv.dataset.svmap), 400); }, 80); return; }
      const g = t.closest('[data-grp]'); if (g) { grp = +g.dataset.grp; U.$('[data-fmain]').innerHTML = stepsHtml[4](); return; }
      const pk = t.closest('[data-pick]'); if (pk) { const box = pk.parentElement; box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === pk)); set(box.dataset.k, pk.textContent); markDirty(box); return; }
      const cf = t.closest('[data-confirm]'); if (cf) { toggleConfirm(cf); return; }
    });
    el.addEventListener('keydown', e => { const cf = e.target.closest && e.target.closest('[data-confirm]'); if (cf && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleConfirm(cf); } });
    el.addEventListener('input', e => {
      const k = e.target.dataset && e.target.dataset.k; if (!k) return;
      if (e.target.matches('[data-pct]')) { e.target.nextElementSibling.textContent = fa(+e.target.value) + '٪'; set(k, +e.target.value); }
      else set(k, e.target.value);
      const f = e.target.closest('.fld'); if (f) { f.classList.remove('err'); const eh = f.querySelector('.eh'); if (eh) eh.remove(); }
      markDirty(e.target);
    });
    el.addEventListener('change', e => { if (e.target.matches('select[data-k]')) { set(e.target.dataset.k, e.target.value); markDirty(e.target); } });
  };
  function toggleConfirm(cf) { cf.classList.toggle('on'); cf.classList.remove('err'); cf.setAttribute('aria-checked', cf.classList.contains('on')); }
  function markDirty(el) { const f = el && el.closest('.fld'); if (f) f.classList.toggle('chg', changed(el.dataset.k)); const s = U.$('[data-sv]'); if (s) s.innerHTML = svText(); }
  E.isDirty = () => mode === 'form' && dirty();
})();
