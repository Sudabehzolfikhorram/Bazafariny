/* Shared helpers: number formatting, icons, gradients, toast, sortable/filterable table */
(function () {
  'use strict';
  const U = window.U = {};
  const nf = new Intl.NumberFormat('fa-IR');
  U.fa = (n, d) => {
    if (n == null || n === '') return '—';
    if (typeof n === 'string') return n;
    const v = d != null ? Number(n.toFixed(d)) : n;
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: d != null ? d : 2, minimumFractionDigits: 0 }).format(v).replace(/\./g, '٫');
  };
  U.fi = n => nf.format(Math.round(n));
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.norm = s => String(s || '').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/‌/g, ' ').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).toLowerCase().trim();
  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // gradient pairs — soft, never sharp (rules: no pink/purple, no black)
  U.G = { teal: ['#63D3D1', '#0CA5A3'], blue: ['#9DB2FF', '#4C6EF5'], sky: ['#A5D8FF', '#4DABF7'], amber: ['#FFE08A', '#F59F00'], orange: ['#FFC08A', '#F76707'], red: ['#FFB3B3', '#E03131'], green: ['#B2F2BB', '#2F9E44'], slate: ['#DCE3EC', '#94A3B8'], navy: ['#93A8E8', '#1E40AF'] };
  U.C = { teal: '#00ADAB', blue: '#4C6EF5', sky: '#4DABF7', amber: '#F59F00', orange: '#F76707', red: '#E03131', green: '#2F9E44', slate: '#94A3B8', navy: '#1E40AF' };
  U.grad = (g, dir) => `linear-gradient(${dir || '135deg'},${U.G[g][0]},${U.G[g][1]})`;
  U.eg = (g, h) => ({ type: 'linear', x: 0, y: h ? 0 : 1, x2: h ? 1 : 0, y2: 0, colorStops: [{ offset: 0, color: U.G[g][1] }, { offset: 1, color: U.G[g][0] }] });
  U.egv = g => ({ type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: U.G[g][0] }, { offset: 1, color: U.G[g][1] }] });

  const P = {
    area: '<path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/><rect x="7" y="7" width="10" height="10" rx="1.5"/>',
    worn: '<path d="M4 21V9l8-6 8 6v12"/><path d="m9 13 2 3-2 3M14 11l1 3-2 2"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    shop: '<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
    warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>',
    family: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="13" r="2"/><path d="M3 20v-3a4 4 0 0 1 4-4M21 20v-3a4 4 0 0 0-4-4M9 20v-1a3 3 0 0 1 6 0v1"/>',
    build: '<path d="M3 21h18M6 21V8l6-4 6 4v13"/><path d="M10 12h4M10 16h4"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    sat: '<path d="m13 7 4-4 4 4-4 4zM3 17l4-4 4 4-4 4z"/><path d="m9 15 6-6"/><path d="M14.5 14.5a3 3 0 0 0 0-4.2"/><path d="M17 17a6.5 6.5 0 0 0 0-9.2"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    grid: '<rect x="3" y="3" width="10" height="10" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="11" width="6" height="10" rx="1.5"/><rect x="3" y="15" width="10" height="6" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    chev: '<path d="m6 9 6 6 6-6"/>', chevl: '<path d="m15 6-6 6 6 6"/>', chevr: '<path d="m9 6 6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>', pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    entry: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    hood: '<path d="M3 21h18"/><path d="M4 21V10l5-3 5 3v11"/><path d="M14 21v-8l6-3v11"/><path d="M7 13h3M7 17h3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    dl: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    tree: '<path d="M12 22v-6"/><path d="M8 16h8l-2-4h2l-4-6-4 6h2z"/>',
    edu: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    health: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
    sport: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    green: '<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 21 14 12"/>',
    coin: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>', wave: '<path d="M2 8c3-2 5 2 8 0s5-2 8 0 4 0 4 0M2 14c3-2 5 2 8 0s5-2 8 0 4 0 4 0M2 20c3-2 5 2 8 0s5-2 8 0"/>',
    slope: '<path d="M3 20h18L9 6z"/><path d="m9 6 2 5"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    road: '<path d="M8 3 5 21M16 3l3 18M12 4v3M12 11v3M12 18v2"/>',
    mosque: '<path d="M4 21V12a8 8 0 0 1 16 0v9z"/><path d="M12 4V2M9 21v-4a3 3 0 0 1 6 0v4"/>',
    bank: '<path d="m3 9 9-5 9 5z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11l2-8H6.3"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5z"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16" cy="16.5" r="1.5"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
    upload: '<path d="M12 20V9M7 13l5-5 5 5"/><path d="M5 4h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>'
  };
  U.P = P;
  U.ic = (n, c) => `<svg class="i ${c || ''}" viewBox="0 0 24 24">${P[n] || P.info}</svg>`;
  U.icb = (n, g, c) => `<span class="ii" style="background:${U.grad(g)}">${U.ic(n, c || 's')}</span>`;

  let tt;
  U.toast = (msg, icon) => {
    let el = U.$('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.innerHTML = `<span class="ti">${U.ic(icon || 'check', 's')}</span>${U.esc(msg)}`;
    el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600);
  };
  U.src = s => ({
    sirous: '<span class="src" data-tt="«آشنایی با محله سیروس»">داده‌ی محله</span>',
    fars: '<span class="src smp" data-tt="از قالب «پایش محلات فرسوده»؛ مقدار نمونه">قالب پایش · نمونه</span>',
    infor: '<span class="src smp" data-tt="از قالب «سکونتگاه غیررسمی»؛ مقدار نمونه">قالب سکونتگاه · نمونه</span>',
    haz: '<span class="src smp" data-tt="از قالب «مخاطرات»؛ مقدار نمونه">قالب مخاطرات · نمونه</span>',
    form: '<span class="src smp" data-tt="مقدار نمونه‌ی فرم ایجاد محله">نمونه</span>',
    osm: '<span class="src osm" data-tt="OpenStreetMap">OSM</span>',
    est: '<span class="src" data-tt="برآورد از داده‌های نقشه">برآورد</span>',
    map: '<span class="src osm" data-tt="محاسبه‌شده از لایه‌های نقشه">محاسبه از نقشه</span>'
  }[s] || '');
  U.statusBadge = s => {
    const m = { 'در حال اجرا': 'b-ok', 'مطالعات': 'b-in', 'شروع نشده': 'b-mu', 'در انتظار تامین اعتبار': 'b-wa', 'در برنامه': 'b-pr', 'ثبت شده': 'b-ok', 'تایید شده': 'b-ok', 'در انتظار بازبینی': 'b-wa', 'نیاز به اصلاح': 'b-er', 'ناقص': 'b-wa', 'پیش‌نویس': 'b-mu', 'فعال': 'b-ok', 'غیرفعال': 'b-mu', 'تکمیل': 'b-ok' }[s] || 'b-mu';
    return `<span class="badge ${m}">${U.esc(s)}</span>`;
  };
  U.hl = (text, q) => {
    const t = U.esc(text);
    const nq = U.norm(q);
    if (!nq) return t;
    const raw = String(text == null ? '' : text);
    const lead = raw.length - raw.replace(/^\s+/, '').length;
    const i = U.norm(raw).indexOf(nq);
    if (i < 0) return t;
    const a = i + lead, b = a + nq.length;
    return U.esc(raw.slice(0, a)) + '<mark>' + U.esc(raw.slice(a, b)) + '</mark>' + U.esc(raw.slice(b));
  };

  /* ---------- info tips: hover / focus shows, click pins (one shared floating element) ---------- */
  U.tips = [];
  U.info = (html, cls) => { let n = U.tips.indexOf(html); if (n < 0) n = U.tips.push(html) - 1; return `<button type="button" class="inf ${cls || ''}" data-ti="${n}" aria-label="توضیح">${U.ic('info', 'xs')}</button>`; };
  const tipEl = document.createElement('div'); tipEl.className = 'tipx'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
  let pinned = null;
  const tipHtml = el => el.dataset.ti != null ? U.tips[+el.dataset.ti] : U.esc(el.dataset.tt || '');
  function showTip(el) {
    tipEl.innerHTML = tipHtml(el); tipEl.classList.add('on');
    const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    let y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function hideTip() { tipEl.classList.remove('on'); if (pinned) { pinned.classList.remove('pin'); pinned = null; } }
  U.hideTip = hideTip;
  document.addEventListener('mouseover', e => { if (pinned) return; const el = e.target.closest('.inf,[data-tt]'); if (el) showTip(el); });
  document.addEventListener('mouseout', e => { if (pinned) return; const el = e.target.closest('.inf,[data-tt]'); if (el && !el.contains(e.relatedTarget)) tipEl.classList.remove('on'); });
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('.inf'); if (el && !pinned) showTip(el); });
  document.addEventListener('focusout', e => { if (!pinned && e.target.closest && e.target.closest('.inf')) tipEl.classList.remove('on'); });
  document.addEventListener('click', e => {
    const el = e.target.closest('.inf');
    if (el) { e.preventDefault(); e.stopPropagation(); if (pinned === el) { hideTip(); return; } hideTip(); pinned = el; el.classList.add('pin'); showTip(el); return; }
    if (pinned) hideTip();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
  document.addEventListener('scroll', () => { if (tipEl.classList.contains('on')) hideTip(); }, true);

  /* ---------- modal ---------- */
  U.modal = o => {
    let m = U.$('.modal'); if (!m) { m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="mbox ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${U.esc(o.title)}"><div class="mh"><b>${o.title}</b><button class="ib" data-mx aria-label="بستن" style="margin-inline-start:auto">${U.ic('x', 's')}</button></div><div class="mb">${o.body}</div>${o.ok === false ? '' : `<div class="mf"><button class="btn ${o.danger ? 'dg' : 'pr'}" data-mok>${o.ok || 'ذخیره'}</button><button class="btn" data-mx>${o.cancel || 'انصراف'}</button></div>`}</div>`;
    m.classList.add('on');
    const box = m.querySelector('.mbox');
    const esc = e => { if (e.key === 'Escape') close(); };
    function close() { m.classList.remove('on'); document.removeEventListener('keydown', esc); if (o.onClose) o.onClose(); }
    document.addEventListener('keydown', esc);
    m.onclick = e => {
      if (e.target === m || e.target.closest('[data-mx]')) { close(); return; }
      if (e.target.closest('[data-mok]')) { const r = o.onOk ? o.onOk(box) : undefined; if (r !== false) close(); }
    };
    if (o.onOpen) o.onOpen(box, close);
    setTimeout(() => { const f = box.querySelector('input:not([type=checkbox]):not([type=file]),textarea,select'); if (f) f.focus(); }, 40);
    return close;
  };

  /* Generic table: cols [{k, t, w, sort:fn|true, render:(row,q)=>html, num}], rows, el.
     opts.search (fields), opts.filters [{k, t, opts:[...]}], opts.foot(rows)=>html, opts.onRow(row) */
  U.table = function (el, cols, rows, opts) {
    opts = opts || {};
    const st = { q: '', sort: opts.sort || null, dir: opts.dir || 1, f: {} };
    const id = 't' + Math.random().toString(36).slice(2, 7);
    const fhtml = (opts.filters || []).map(f => `<select class="sel" data-f="${f.k}"><option value="">${U.esc(f.t)}: همه</option>${f.opts.map(o => `<option>${U.esc(o)}</option>`).join('')}</select>`).join('');
    el.innerHTML = `<div class="tbar">${opts.search !== false ? `<div class="sbx">${U.ic('search', 's')}<input class="inp" style="width:240px" placeholder="${U.esc(opts.ph || 'جستجو در جدول…')}" data-q></div>` : ''}${fhtml}${opts.extra || ''}<span class="cnt" data-c></span></div>
      <div class="tw" style="${opts.maxh ? 'max-height:' + opts.maxh + 'px' : ''}"><table class="dt" id="${id}"><thead><tr>${cols.map(c => `<th class="${c.sort !== false ? 'so' : ''}" data-k="${c.k}" style="${c.w ? 'width:' + c.w : ''}">${c.t}${c.sort !== false ? '<span class="ar">↕</span>' : ''}</th>`).join('')}</tr></thead><tbody></tbody><tfoot></tfoot></table></div>`;
    const tb = el.querySelector('tbody'), tf = el.querySelector('tfoot'), cnt = el.querySelector('[data-c]');
    const val = (r, k) => { const c = cols.find(x => x.k === k); return c && typeof c.sort === 'function' ? c.sort(r) : r[k]; };
    function draw() {
      let rs = rows.slice();
      if (opts.pre) rs = rs.filter(opts.pre);
      for (const [k, v] of Object.entries(st.f)) if (v) rs = rs.filter(r => String(r[k]) === v);
      if (st.q) { const q = U.norm(st.q); rs = rs.filter(r => (opts.search || cols.map(c => c.k)).some(k => U.norm(r[k]).includes(q))); }
      if (st.sort) rs.sort((a, b) => { const x = val(a, st.sort), y = val(b, st.sort); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fa')) * st.dir; });
      tb.innerHTML = rs.length ? rs.map((r, i) => `<tr data-i="${rows.indexOf(r)}">${cols.map(c => `<td${c.num ? ' class="num"' : ''}>${c.render ? c.render(r, st.q, i) : U.hl(r[c.k], st.q)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}"><div class="empty">موردی با این فیلتر پیدا نشد.</div></td></tr>`;
      tf.innerHTML = opts.foot && rs.length ? opts.foot(rs) : '';
      cnt.textContent = U.fi(rs.length) + ' از ' + U.fi(rows.length) + ' ردیف';
      el.querySelectorAll('th').forEach(th => { th.classList.toggle('asc', th.dataset.k === st.sort && st.dir === 1); th.classList.toggle('desc', th.dataset.k === st.sort && st.dir === -1); const a = th.querySelector('.ar'); if (a) a.textContent = th.dataset.k === st.sort ? (st.dir === 1 ? '↑' : '↓') : '↕'; });
      if (opts.after) opts.after(rs);
    }
    el.addEventListener('input', e => { if (e.target.matches('[data-q]')) { st.q = e.target.value; draw(); } });
    el.addEventListener('change', e => { if (e.target.matches('[data-f]')) { st.f[e.target.dataset.f] = e.target.value; draw(); } });
    el.querySelector('thead').addEventListener('click', e => { const th = e.target.closest('th.so'); if (!th) return; const k = th.dataset.k; if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = 1; } draw(); });
    tb.addEventListener('click', e => { const tr = e.target.closest('tr[data-i]'); if (tr && opts.onRow) opts.onRow(rows[+tr.dataset.i], e, tr); });
    draw();
    return { draw, st, setRows(r) { rows = r; draw(); }, setFilter(k, v) { st.f[k] = v; const s = el.querySelector(`[data-f="${k}"]`); if (s) s.value = v; draw(); } };
  };

  // ECharts base options (RTL-friendly)
  U.tipStyle = { backgroundColor: '#fff', borderColor: '#E4E9F0', borderWidth: 1, padding: [8, 11], textStyle: { color: '#1E293B', fontFamily: 'Vazirmatn', fontSize: 12 }, extraCssText: 'box-shadow:0 8px 24px rgba(30,41,59,.12);border-radius:10px;direction:rtl;text-align:right' };
  U.axisTxt = { color: '#7A8798', fontFamily: 'Vazirmatn', fontSize: 11 };
  U.charts = [];
  U.chart = (el, opt) => {
    const c = echarts.init(el, null, { renderer: 'canvas' });
    c.setOption(Object.assign({ textStyle: { fontFamily: 'Vazirmatn' }, animationDuration: 500 }, opt));
    U.charts.push(c);
    return c;
  };
  window.addEventListener('resize', () => U.charts.forEach(c => c.resize()));
})();
