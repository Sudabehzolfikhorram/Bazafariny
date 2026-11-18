/* «ورود داده» — data-entry table + 6-step form (Figma «ایجاد محله», restyled) */
(function () {
  'use strict';
  const U = window.U, S = window.S, M = window.M;
  const E = window.E = {};
  const fa = U.fa, fi = U.fi, ic = U.ic, F = S.form;
  const DATES = ['۲۷ آبان ۱۴۰۵', '۲۶ آبان ۱۴۰۵', '۲۴ آبان ۱۴۰۵', '۲۱ آبان ۱۴۰۵', '۱۸ آبان ۱۴۰۵', '۱۴ آبان ۱۴۰۵'];
  let mode = 'table', step = 0, isNew = false, grp = 0, dirty = false;
  const srcStatus = s => s === 'sirous' ? 'تایید شده' : 'در انتظار بازبینی';
  const SRC_T = { sirous: 'داده‌ی محله', form: 'نمونه', est: 'برآورد', osm: 'OSM' };

  function rows() {
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
    F.docs.forEach(([t, ty, y, ind, st]) => { add(4, 'مستندات و شواهد', t, ty + ' · ' + y, '', 'form'); R[R.length - 1].status = st; });
    return R;
  }

  function head() {
    const done = 5, fields = rows(), conf = fields.filter(r => r.status === 'تایید شده' || r.status === 'ثبت شده').length;
    const ind = F.groups.reduce((a, g) => a + g[2], 0), indT = F.groups.reduce((a, g) => a + g[1], 0);
    const pct = Math.round((conf / fields.length * 0.5 + ind / indT * 0.5) * 100);
    const C = 2 * Math.PI * 27;
    return `<div class="ph"><div class="t"><div class="pre">محله‌ها ${ic('chevl', 'xs')} ورود داده</div><h1>ورود داده‌ی محله‌ها</h1><p>ثبت و ویرایش مشخصات، آمار پایه، شاخص‌ها، خدمات و مستندات محله</p></div>
      <div class="acts"><button class="btn" data-imp>${ic('upload', 's')}بارگذاری از اکسل</button><button class="btn pr" data-new>${ic('plus', 's')}ایجاد محله جدید</button></div></div>
      <div class="ek">
        <div class="kp" style="cursor:default"><div class="rec"><div class="cring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#EEF2F6" stroke-width="7"/><circle cx="32" cy="32" r="27" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}"/><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63D3D1"/><stop offset="1" stop-color="#0CA5A3"/></linearGradient></defs></svg><b class="num">${fa(pct)}٪</b></div>
          <div style="min-width:0"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:15px">محله سیروس</b>${U.statusBadge('در انتظار بازبینی')}</div><div class="muted" style="font-size:11.5px">تهران · منطقه ۱۲ · کد ۱۵۵۴۴۵۶</div><div class="muted" style="font-size:11.5px">آخرین ویرایش ${DATES[0]} · ${S.who[0]}</div></div></div></div>
        ${[['entry', 'teal', 'مراحل تکمیل‌شده', `${fa(done)} از ${fa(6)}`, 'مرحله‌ی «مرور و تایید» باقی مانده'], ['check', 'green', 'فیلدهای تاییدشده', `${fi(conf)} از ${fi(fields.length)}`, `${fi(fields.length - conf)} فیلد در انتظار بازبینی`], ['target', 'blue', 'شاخص‌های ارزیابی', `${fi(ind)} از ${fi(indT)}`, `${fi(F.groups.filter(g => g[2] < g[1]).length)} گروه ناقص`], ['file', 'amber', 'مستندات', fi(F.docs.length), `${fi(F.docs.filter(d => d[4] !== 'ثبت شده').length)} مورد نیازمند اقدام`], ['pin', 'sky', 'خدمات ثبت‌شده', fi(svcRows().length), 'همگام با لایه‌ی خدمات نقشه']].map(([i, g, t, v, d]) => `<div class="kp" style="cursor:default"><div class="ic" style="background:${U.grad(g)}">${ic(i, 's')}</div><div class="l">${t}</div><div class="v num" style="font-size:19px">${v}</div><div class="d">${d}</div></div>`).join('')}
      </div>`;
  }

  /* ---------- table mode ---------- */
  let tbl;
  function tableView() {
    return `<div class="card"><div class="ch" style="padding-bottom:12px;border-bottom:1px solid var(--ln)"><h3>جدول کلی داده‌های ثبت‌شده</h3><span class="muted" style="font-size:12px">محله سیروس · همه‌ی مراحل فرم</span><div class="ac"><div class="seg" data-stf><button class="on" data-s="">همه‌ی مراحل</button>${F.steps.slice(0, 5).map((s, i) => `<button data-s="${i}">${M.toFa(i + 1)}. ${s}</button>`).join('')}</div></div></div><div id="t-entry"></div></div>`;
  }
  let stF = '';
  function drawTable() {
    const R = rows();
    tbl = U.table(U.$('#t-entry'), [
      { k: 'st', t: 'مرحله', w: '150px', sort: r => r.st, render: r => `<span class="ax" style="background:var(--prl);color:var(--pr2)">${M.toFa(r.st + 1)}</span> <span class="t2">${r.stT}</span>` },
      { k: 'g', t: 'بخش' },
      { k: 'f', t: 'فیلد', render: (r, q) => `<span class="t1">${U.hl(r.f, q)}</span>` },
      { k: 'vs', t: 'مقدار', sort: r => typeof r.v === 'number' ? r.v : r.vs, render: (r, q) => `<span style="font-weight:700">${U.hl(r.vs, q)}</span> <span class="t2">${r.u}</span>` },
      { k: 'srcT', t: 'منبع', render: r => U.src(r.src) || `<span class="src">${r.srcT}</span>` },
      { k: 'who', t: 'ثبت‌کننده', render: r => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span class="av" style="width:24px;height:24px;font-size:10px;background:${U.grad(['teal', 'blue', 'sky', 'green'][S.who.indexOf(r.who)])}">${r.who[0]}</span>${r.who}</span>` },
      { k: 'date', t: 'آخرین ویرایش', sort: r => r.dn },
      { k: 'status', t: 'وضعیت', render: r => U.statusBadge(r.status) },
      { k: 'op', t: '', sort: false, w: '84px', render: () => `<button class="ib" title="ویرایش" data-ed>${ic('edit', 's')}</button><button class="ib" title="تایید" data-ok>${ic('check', 's')}</button>` }
    ], R, { ph: 'جستجوی فیلد یا مقدار…', search: ['f', 'vs', 'g', 'who'], filters: [{ k: 'status', t: 'وضعیت', opts: ['تایید شده', 'در انتظار بازبینی', 'ثبت شده', 'نیاز به اصلاح'] }, { k: 'srcT', t: 'منبع', opts: ['داده‌ی محله', 'نمونه', 'برآورد', 'OSM'] }, { k: 'who', t: 'ثبت‌کننده', opts: S.who }], pre: r => stF === '' || String(r.st) === stF, maxh: 560,
      onRow: (r, e, tr) => {
        if (e.target.closest('[data-ok]')) { r.status = 'تایید شده'; tr.querySelector('td:nth-child(8)').innerHTML = U.statusBadge('تایید شده'); U.toast(`«${r.f}» تایید شد`); return; }
        openForm(r.st);
      } });
  }

  /* ---------- form mode ---------- */
  const fld = (label, val, o) => { o = o || {}; const req = o.req ? '<em>*</em>' : ''; const v = isNew ? '' : val; const src = !isNew && o.src ? U.src(o.src) : '';
    if (o.sel) return `<div class="fld ${o.cls || ''}"><label>${label}${req}${src}</label><select>${isNew ? '<option value="">انتخاب کنید</option>' : ''}${o.sel.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
    if (o.ta) return `<div class="fld ${o.cls || 'sp3'}"><label>${label}${req}${src}</label><textarea placeholder="${o.ph || ''}">${U.esc(v)}</textarea></div>`;
    return `<div class="fld ${o.cls || ''}"><label>${label}${req}${src}</label><div class="iw"><input value="${U.esc(typeof v === 'number' ? fa(v) : v)}" placeholder="${o.ph || (o.u ? 'عدد' : '')}" ${o.num ? 'inputmode="decimal"' : ''}>${o.u ? `<span class="u">${o.u}</span>` : ''}</div>${o.hint ? `<div class="hint">${ic('info', 'xs')}${o.hint}</div>` : ''}</div>`; };
  const pctF = (label, v) => `<div class="fld"><label>${label}</label><div class="pctf"><input type="range" min="0" max="100" value="${isNew ? 0 : v}" data-pct><output class="num">${fa(isNew ? 0 : v)}٪</output></div></div>`;
  const sec = (t, sub, body, ac) => `<div class="fsec"><div class="fh"><b>${t}</b>${sub ? `<span class="muted" style="font-size:11.5px">${sub}</span>` : ''}${ac ? `<div class="ac">${ac}</div>` : ''}</div>${body}</div>`;
  function svcRows() {
    return M.pois.filter(f => f.properties.n && ['مذهبی', 'آموزشی', 'درمانی', 'ورزشی', 'فضای سبز', 'امدادی', 'اداری', 'تاریخی', 'مالی'].includes(f.properties.cat)).map((f, i) => ({ n: f.properties.n, t: f.properties.cat, st: 'فعال', cap: ['—', '۲۴۰ نفر', '۱۲۰ نفر', '—', '۸۰ نفر'][i % 5], i: f.properties.i }));
  }
  const stepsHtml = {
    0: () => sec('موقعیت محله', 'فیلدهای ستاره‌دار الزامی‌اند', `<div class="fg">${fld('استان', F.s1.prov, { req: 1, sel: ['تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'البرز'] })}${fld('شهر', F.s1.city, { req: 1, sel: ['تهران', 'شهریار', 'ورامین'] })}${fld('منطقه', F.s1.reg, { req: 1, sel: Array.from({ length: 22 }, (_, i) => 'منطقه ' + M.toFa(i + 1)) })}${fld('نام محله', F.s1.name, { req: 1, ph: 'مثلاً سیروس' })}${fld('آدرس', F.s1.addr, { cls: 'sp2' })}${fld('کد پستی', F.s1.post, { src: 'osm' })}</div>`) +
      sec('محدوده‌ی محله روی نقشه', '', `<div class="cb" style="display:flex;align-items:center;gap:14px"><span class="ii" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:#fff;background:${U.grad('teal')}">${ic('map')}</span><div style="flex:1"><b>${isNew ? 'هنوز محدوده‌ای ترسیم نشده' : 'مرز محله ترسیم شده است'}</b><div class="muted" style="font-size:12px">${isNew ? 'پس از ذخیره‌ی مشخصات، محدوده را روی نقشه رسم کنید.' : `مساحت ترسیم‌شده ${fa(window.GEO.meta.ha, 1)} هکتار · ${fi(M.parcels.length)} پلاک · بین خیابان‌های مصطفی خمینی، مولوی، ری و پانزده خرداد`}</div></div><button class="btn sm" data-go="reports">${ic('eye', 'xs')}مشاهده روی نقشه</button></div>`),
    1: () => sec('آمار و شمارش‌ها', '', `<div class="fg">${F.s2a.map(([f, v, u, s]) => fld(f, v, { u, num: 1, src: s, req: /ساکنین|بلوک/.test(f) })).join('')}</div>`) + sec('خط پایه‌ی کالبدی و جمعیتی', 'سال مرجع داده: ۱۴۰۵', `<div class="fg">${F.s2b.map(([f, v, u, s]) => fld(f, v, { u, num: 1, src: s, hint: f === 'تعداد واحد مسکونی' ? 'برآورد بر اساس تعداد خانوار؛ نیازمند تایید' : '' })).join('')}</div>`),
    2: () => sec('شاخص‌های انسانی، اقتصادی و مسکن', 'درصد از کل خانوار یا جمعیت', `<div class="fg">${F.s3a.map(([f, v]) => pctF(f, v)).join('')}</div>`, U.src('form')) + sec('خدمات زیربنایی، روبنایی و سرانه‌ها', '', `<div class="fg">${F.s3b.map(([f, v]) => pctF(f, v)).join('')}${F.s3c.map(([f, v]) => fld(f, v, { u: 'مترمربع/نفر', num: 1, src: 'sirous' })).join('')}</div>`),
    3: () => {
      const lv = (label, v) => `<div class="fld"><label>${label}</label><div class="lv">${[['کم', 'l1'], ['متوسط', 'l2'], ['بالا', 'l3']].map(([t, c]) => `<button class="${c} ${!isNew && v === t ? 'on' : ''}" data-lv>${t}</button>`).join('')}</div></div>`;
      const yn = (label, v) => `<div class="fld"><label>${label}</label><div class="yn">${['بله', 'خیر'].map(t => `<button class="${!isNew && v === t ? 'on' : ''}" data-yn>${t}</button>`).join('')}</div></div>`;
      const s = F.s4;
      const sv = isNew ? [] : svcRows();
      return sec('معیارهای انتخاب و آمادگی اجرا', '', `<div class="fg">${lv(s[0][0], s[0][1])}${lv(s[1][0], s[1][1])}${yn(s[2][0], s[2][1])}${yn(s[3][0], s[3][1])}${yn(s[4][0], s[4][1])}${yn(s[5][0], s[5][1])}${fld('نیازهای اولویت‌دار محله', F.needs, { ta: 1, src: 'sirous', ph: 'نیازها را با ویرگول جدا کنید' })}</div>`, U.src('form')) +
        sec('ساختمان‌ها و خدمات موجود', `${fi(sv.length)} مورد · همگام با نقشه`, `<div class="tw" style="max-height:300px"><table class="dt"><thead><tr><th>نام ساختمان / خدمت</th><th>نوع خدمت</th><th>وضعیت</th><th>ظرفیت</th><th style="width:96px">عملیات</th></tr></thead><tbody>${sv.length ? sv.map(r => `<tr><td class="t1">${U.esc(r.n)}</td><td>${r.t}</td><td>${U.statusBadge(r.st)}</td><td class="num">${r.cap}</td><td><button class="ib" data-svmap="${r.i}" title="روی نقشه">${ic('pin', 's')}</button><button class="ib" title="ویرایش" data-svadd>${ic('edit', 's')}</button></td></tr>`).join('') : `<tr><td colspan="5"><div class="empty">هنوز خدمتی ثبت نشده است.</div></td></tr>`}</tbody></table></div>`, `<button class="btn sm" data-svadd>${ic('plus', 'xs')}افزودن خدمت</button>`);
    },
    4: () => {
      const g = F.groups[grp];
      const body = grp === 0 && !isNew ? `<div class="fg">${F.pop.map(([f, v]) => fld(f, v, { src: 'form' })).join('')}${fld('ملاحظات ارزیابی', 'داده‌ها از سرشماری ۱۴۰۵ و پیمایش میدانی محله گردآوری شده است.', { ta: 1 })}</div>` : `<div class="fg">${Array.from({ length: g[1] }, (_, i) => fld(`شاخص ${M.toFa(i + 1)} · ${g[0]}`, i < g[2] && !isNew ? 'ثبت شده' : '', { ph: 'مقدار یا توضیح شاخص' })).join('')}</div>`;
      return sec('گروه‌های ارزیابی', `${fi(F.groups.length)} گروه · ${fi(F.groups.reduce((a, x) => a + x[1], 0))} شاخص`, `<div class="grpg">${F.groups.map(([t, n, d], i) => { const p = isNew ? 0 : d / n * 100; return `<button class="gp ${i === grp ? 'on' : ''}" data-grp="${i}"><b>${t}</b><div class="m"><div class="b"><i style="width:${p}%;background:${U.grad(p >= 100 ? 'green' : p >= 50 ? 'teal' : 'amber', '270deg')}"></i></div><small>${fa(isNew ? 0 : d)} از ${fa(n)}</small></div></button>`; }).join('')}</div>`) +
        sec(`شاخص‌های گروه «${g[0]}»`, '', body, U.src('form')) +
        sec('مستندات و شواهد', '', `<div class="tw" style="max-height:300px"><table class="dt"><thead><tr><th>عنوان مستند</th><th>نوع سند</th><th>سال / دوره مرجع</th><th>شاخص مرتبط</th><th>وضعیت</th><th style="width:96px">عملیات</th></tr></thead><tbody>${isNew ? `<tr><td colspan="6"><div class="empty">هنوز مستندی اضافه نشده است.</div></td></tr>` : F.docs.map(d => `<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><span class="fi" style="width:28px;height:28px;border-radius:8px;display:inline-grid;place-items:center;font-size:9px;font-weight:800;color:#fff;background:${U.grad({ pdf: 'red', xlsx: 'green', dwg: 'blue', zip: 'amber' }[d[5]])}">${d[5].toUpperCase()}</span><span class="t1">${d[0]}</span></span></td><td>${d[1]}</td><td class="num">${d[2]}</td><td class="t2">${d[3]}</td><td>${U.statusBadge(d[4])}</td><td><button class="ib" title="مشاهده">${ic('eye', 's')}</button><button class="ib" title="دانلود">${ic('dl', 's')}</button></td></tr>`).join('')}</tbody></table></div>`, `<button class="btn sm" data-upl>${ic('upload', 'xs')}افزودن مستند</button>`);
    },
    5: () => {
      const card = (n, t, items) => `<div class="rc"><h5><span class="ax" style="background:var(--prl);color:var(--pr2)">${M.toFa(n)}</span>${t}<button class="btn sm gh" data-step="${n - 1}">${ic('edit', 'xs')}ویرایش</button></h5><dl>${items.map(([a, b]) => `<dt>${a}</dt><dd class="num">${isNew ? '—' : b}</dd>`).join('')}</dl></div>`;
      const checks = [['مشخصات اولیه کامل است', 1], ['آمار پایه با منبع ثبت شده', 1], ['۳ فیلد با مقدار نمونه نیازمند تایید است', 0], ['شاخص‌های ارزیابی: ' + fi(F.groups.reduce((a, g) => a + g[2], 0)) + ' از ' + fi(F.groups.reduce((a, g) => a + g[1], 0)), 0], ['۳ مستند در انتظار بازبینی یا اصلاح', 0]];
      return `<div class="rv">${card(1, 'مشخصات اولیه', [['استان / شهر', 'تهران / تهران'], ['منطقه', 'منطقه ۱۲'], ['نام محله', 'سیروس'], ['کد پستی', F.s1.post]])}${card(2, 'آمار و خط پایه', [['ساکنین', fi(4363) + ' نفر'], ['خانوار', fi(1445)], ['بلوک مسکونی / تجاری', fi(1018) + ' / ' + fi(272)], ['مساحت', '۴۴ هکتار'], ['واحد ناپایدار', fi(1007)], ['ظرفیت نوسازی', fi(3000) + ' واحد']])}${card(3, 'شاخص‌ها و خدمات', F.s3c.map(([a, b]) => [a, fa(b, 2)]).concat([['دسترسی آب / برق / گاز', '۹۹ / ۱۰۰ / ۹۸٪']]))}${card(4, 'ظرفیت و آمادگی اجرا', F.s4.slice(0, 5))}${card(5, 'سنجش و مستندات', [['گروه‌های کامل', fi(F.groups.filter(g => g[2] === g[1]).length) + ' از ' + fi(F.groups.length)], ['مستندات', fi(F.docs.length)], ['تراکم جمعیت', '۹۹٫۲ نفر در هکتار']])}
        <div class="rc"><h5>${ic('check', 's')}کنترل پیش از ثبت</h5><div class="chk2">${checks.map(([t, ok]) => `<button><span class="st" style="background:${ok ? 'var(--okl)' : 'var(--wal)'};color:${ok ? '#23803A' : '#B86A00'}">${ic(ok ? 'check' : 'warn', 'xs')}</span><b>${t}</b></button>`).join('')}</div></div></div>
        <div class="cb" style="padding-top:0"><label class="ck" data-confirm style="max-width:560px"><span class="bx">${ic('check', 'xs')}</span><div><b>صحت اطلاعات واردشده را تایید می‌کنم</b><small>پس از ثبت نهایی، پرونده برای بازبینی کارشناس ارسال می‌شود</small></div></label></div>`;
    }
  };
  function side() {
    const st = [1, 1, 1, 1, 0.82, 0];
    return `<div style="font-size:12.5px;font-weight:800;margin-bottom:10px">وضعیت پرونده</div>
      <div class="chk2">${F.steps.map((s, i) => { const v = isNew ? 0 : st[i]; const done = v >= 1; return `<button data-step="${i}"><span class="st" style="background:${done ? 'var(--prl)' : v > 0 ? 'var(--wal)' : 'var(--sf3)'};color:${done ? 'var(--pr2)' : v > 0 ? '#B86A00' : 'var(--tx3)'}">${done ? ic('check', 'xs') : M.toFa(i + 1)}</span><div><b>${s}</b><small>${done ? 'تکمیل شده' : v > 0 ? `${fa(v * 100, 0)}٪ تکمیل` : 'شروع نشده'}</small></div></button>`; }).join('')}</div>
      <div style="font-size:12.5px;font-weight:800;margin:18px 0 8px">آخرین فعالیت‌ها</div>
      <div class="hist">${(isNew ? [] : [['edit', 'teal', 'مریم احمدی', 'سرانه‌ها را به‌روز کرد', DATES[0]], ['file', 'amber', 'رضا کاظمی', 'مستند «برداشت میدانی» را افزود', DATES[1]], ['check', 'green', 'سارا نوری', 'آمار پایه را تایید کرد', DATES[2]], ['map', 'blue', 'علی رضایی', 'مرز محله را روی نقشه اصلاح کرد', DATES[3]]]).map(([i, g, w, t, d]) => `<div><span class="fi" style="background:${U.grad(g)}">${ic(i, 'xs')}</span><div style="flex:1"><b style="font-size:12px">${w}</b><div class="muted" style="font-size:11px">${t} · ${d}</div></div></div>`).join('') || '<div class="muted" style="font-size:12px">هنوز فعالیتی ثبت نشده است.</div>'}</div>
      <div class="note" style="margin-top:14px">${ic('info', 's')}<span>برچسب «نمونه» یعنی مقدار از نمونه‌ی فرم یا قالب گزارش آمده و باید با داده‌ی میدانی جایگزین شود.</span></div>`;
  }
  function formView() {
    return `<div class="card" id="fcard">${isNew ? `<div class="note w" style="margin:14px 18px 0">${ic('plus', 's')}<span>در حال ایجاد محله‌ی جدید. فیلدها خالی‌اند؛ داده‌ی نمونه فقط برای محله سیروس ثبت شده است.</span><button class="btn sm" data-cancel style="margin-inline-start:auto">بازگشت به سیروس</button></div>` : ''}
      <div class="steps">${F.steps.map((s, i) => { const done = !isNew && i < 5; return `<button class="stp2 ${i === step ? 'cur' : done ? 'done' : ''}" data-step="${i}"><span class="c">${done && i !== step ? ic('check', 's') : M.toFa(i + 1)}</span><div><b>${s}</b><small>${i === step ? 'مرحله‌ی جاری' : done ? 'تکمیل شده' : 'تکمیل نشده'}</small></div></button>`; }).join('')}</div>
      <div class="fbody"><div class="fmain" data-fmain>${stepsHtml[step]()}</div><aside class="fside">${side()}</aside></div>
      <div class="ffoot"><button class="btn gh" data-cancel>لغو</button><span class="sp"></span><span class="sv" data-sv>${ic('clock', 'xs')}${dirty ? 'تغییرات ذخیره نشده' : 'همه‌ی تغییرات ذخیره شده'}</span><button class="btn" data-draft>${ic('save', 's')}ذخیره پیش‌نویس</button><button class="btn" data-prev ${step === 0 ? 'disabled' : ''}>${ic('chevr', 's')}مرحله قبل</button><button class="btn pr" data-next>${step === 5 ? `${ic('check', 's')}ثبت نهایی` : `مرحله بعد${ic('chevl', 's')}`}</button></div></div>`;
  }
  function openForm(s) { mode = 'form'; step = s || 0; draw(); U.$('.view').scrollTo({ top: U.$('#fcard').offsetTop - 70, behavior: 'smooth' }); }

  let root;
  function draw() {
    root.innerHTML = `<div class="wrap">${head()}<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div class="seg" data-mode><button class="${mode === 'table' ? 'on' : ''}" data-m="table">${ic('entry', 'xs')}جدول داده‌ها</button><button class="${mode === 'form' ? 'on' : ''}" data-m="form">${ic('edit', 'xs')}فرم مرحله‌ای</button></div><span class="muted" style="font-size:12px">${mode === 'table' ? 'با کلیک روی هر ردیف، فرم همان مرحله باز می‌شود' : isNew ? 'محله‌ی جدید' : 'ویرایش پرونده‌ی محله سیروس'}</span></div>${mode === 'table' ? tableView() : formView()}</div>`;
    if (mode === 'table') drawTable();
  }
  function modal(title, body, ok) {
    let m = U.$('.modal'); if (!m) { m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="mbox"><div class="mh"><b>${title}</b><button class="ib" data-mx style="margin-inline-start:auto">${ic('x', 's')}</button></div><div class="mb">${body}</div><div class="mf"><button class="btn pr" data-mok>${ok || 'ذخیره'}</button><button class="btn" data-mx>انصراف</button></div></div>`;
    m.classList.add('on');
    m.onclick = e => { if (e.target === m || e.target.closest('[data-mx]')) m.classList.remove('on'); if (e.target.closest('[data-mok]')) { m.classList.remove('on'); U.toast(title + ' ذخیره شد'); } };
  }
  E.render = function (el) {
    root = el; draw();
    el.addEventListener('click', e => {
      const t = e.target;
      const md = t.closest('[data-mode] button'); if (md) { mode = md.dataset.m; draw(); return; }
      const sf = t.closest('[data-stf] button'); if (sf) { stF = sf.dataset.s; U.$$('[data-stf] button').forEach(b => b.classList.toggle('on', b === sf)); tbl.draw(); return; }
      const sp = t.closest('[data-step]'); if (sp) { step = +sp.dataset.step; if (mode !== 'form') mode = 'form'; draw(); return; }
      if (t.closest('[data-next]')) { if (step < 5) { step++; draw(); U.$('.view').scrollTo({ top: U.$('#fcard').offsetTop - 70, behavior: 'smooth' }); } else { const c = U.$('[data-confirm]'); if (!c.classList.contains('on')) { U.toast('ابتدا صحت اطلاعات را تایید کنید', 'warn'); c.style.borderColor = 'var(--wa)'; return; } U.toast('پرونده برای بازبینی کارشناس ارسال شد'); dirty = false; isNew = false; mode = 'table'; draw(); } return; }
      if (t.closest('[data-prev]')) { if (step > 0) { step--; draw(); } return; }
      if (t.closest('[data-draft]')) { dirty = false; U.$('[data-sv]').innerHTML = `${ic('check', 'xs')}پیش‌نویس ذخیره شد · همین حالا`; U.$$('.fld.chg').forEach(f => f.classList.remove('chg')); U.toast('پیش‌نویس ذخیره شد', 'save'); return; }
      if (t.closest('[data-cancel]')) { isNew = false; dirty = false; mode = 'table'; draw(); return; }
      if (t.closest('[data-new]')) { isNew = true; mode = 'form'; step = 0; dirty = false; draw(); return; }
      if (t.closest('[data-imp]')) { modal('بارگذاری از اکسل', `<div style="border:2px dashed var(--ln2);border-radius:14px;padding:30px;text-align:center;color:var(--tx3)">${ic('upload', 'l')}<div style="margin-top:8px;font-weight:700;color:var(--tx2)">فایل اکسل را اینجا رها کنید یا انتخاب کنید</div><div style="font-size:11.5px;margin-top:4px">قالب استاندارد: یک ردیف برای هر محله، ستون‌ها مطابق فیلدهای فرم</div></div>`, 'بارگذاری'); return; }
      if (t.closest('[data-svadd]')) { modal('افزودن ساختمان / خدمت', `<div class="fsec" style="border:0;margin:0"><div class="fg" style="padding:0;grid-template-columns:1fr 1fr">${['نوع خدمت', 'نام', 'سال ساخت', 'سازنده', 'بهره‌بردار', 'مساحت (مترمربع)', 'ظرفیت (نفر)', 'وضعیت فعلی'].map((f, i) => `<div class="fld"><label>${f}${i < 2 ? '<em>*</em>' : ''}</label><input placeholder="${['آموزشی', 'مدرسه محله', '۱۳۸۵', 'سازمان نوسازی مدارس', 'آموزش‌وپرورش', '۱٬۸۰۰', '۲۴۰', 'فعال'][i]}"></div>`).join('')}</div></div>`); return; }
      if (t.closest('[data-upl]')) { modal('افزودن مستند', `<div class="fsec" style="border:0;margin:0"><div class="fg" style="padding:0;grid-template-columns:1fr 1fr">${['عنوان مستند', 'نوع سند', 'سال / دوره مرجع', 'شاخص مرتبط'].map((f, i) => `<div class="fld"><label>${f}${i === 0 ? '<em>*</em>' : ''}</label><input placeholder="${['گزارش جمعیتی محله', 'گزارش', '۱۴۰۵', 'جمعیت / تحولات جمعیت'][i]}"></div>`).join('')}<div class="fld sp3" style="grid-column:1/-1"><label>توضیحات مستند</label><textarea placeholder="گزارش آمار جمعیت و خانوار در محدوده محله؛ تهیه‌شده برای ارزیابی سال ۱۴۰۵."></textarea></div></div></div>`, 'افزودن'); return; }
      const sv = t.closest('[data-svmap]'); if (sv) { window.APP.go('reports'); setTimeout(() => { window.R.jump('s-map'); setTimeout(() => M.flyPoi(+sv.dataset.svmap), 400); }, 80); return; }
      const g = t.closest('[data-grp]'); if (g) { grp = +g.dataset.grp; U.$('[data-fmain]').innerHTML = stepsHtml[4](); return; }
      const lv = t.closest('[data-lv]'); if (lv) { lv.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === lv)); markDirty(); return; }
      const yn = t.closest('[data-yn]'); if (yn) { yn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === yn)); markDirty(); return; }
      const cf = t.closest('[data-confirm]'); if (cf) { cf.classList.toggle('on'); cf.style.borderColor = ''; return; }
    });
    el.addEventListener('input', e => {
      if (e.target.matches('[data-pct]')) e.target.nextElementSibling.textContent = fa(+e.target.value) + '٪';
      if (e.target.closest('.fld')) { e.target.closest('.fld').classList.add('chg'); markDirty(); }
    });
  };
  function markDirty() { dirty = true; const s = U.$('[data-sv]'); if (s) s.innerHTML = `${ic('clock', 'xs')}تغییرات ذخیره نشده`; }
})();
