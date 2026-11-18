/* Blocks shared by both models: compact experts card, 30-day rhythm card, item detail panels. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc, CAT } = U;
  const month = x => x.days.slice(-28).reduce((a, b) => a + b, 0);
  B.experts.forEach(x => { x.recs28 = month(x); x.prev28 = x.days.slice(-56, -28).reduce((a, b) => a + b, 0); });

  /* ---------- experts (compact, 4 weeks) ---------- */
  const SORTS = [['recs28', 'بیشترین ثبت'], ['lastDays', 'کم‌فعال‌ها'], ['pending', 'منتظر تأیید']];
  const weeks = x => { const w = [0, 1, 2, 3].map(i => x.days.slice(-28 + i * 7, -28 + i * 7 + 7 || undefined).reduce((a, b) => a + b, 0)); const m = Math.max(1, ...w);
    return `<span class="wk4" title="ثبت هفتگی، ۴ هفته‌ی اخیر: ${w.map(fa).join('، ')}">${w.map((v, i) => `<i style="height:${Math.max(8, v / m * 100)}%;background:${v === 0 ? '#E2E8F0' : i === 3 ? 'linear-gradient(180deg,#9DB2FF,#4C6EF5)' : 'linear-gradient(180deg,#DDE4FF,#B4C3FC)'}"></i>`).join('')}</span>`; };
  function expertRows(list) {
    return list.map(x => { const d = x.recs28 - x.prev28; const status = x.lastDays > 14 ? `<span class="badge warn">${fa(x.lastDays)} روز بی‌فعالیت</span>` : x.pending ? `<span class="badge wait">${fa(x.pending)} منتظر تأیید</span>` : `<span class="badge ok">فعال</span>`;
      return `<a class="xrow" href="#d/expert/${x.id}">${U.av(x)}<span class="t"><b>${x.n}</b><small>${x.role.replace('کارشناس ', '')} · ${x.provFa}</small></span>
        <span class="xn num"><b>${fa(x.recs28)}</b><small class="${d < 0 ? 'neg' : ''}">${d >= 0 ? '▲' : '▼'} ${fa(Math.abs(d))}</small></span>
        ${weeks(x)}
        <span class="xa"><span class="bar"><i style="width:${x.approval}%;background:${x.approval < 80 ? 'linear-gradient(90deg,#FFE08A,#F59F00)' : 'linear-gradient(90deg,#63D3D1,#0CA5A3)'}"></i></span><small>${pct(x.approval)} تأیید</small></span>
        <span class="xs">${status}</span></a>`; }).join('');
  }
  function expertsCard(limit = 6) {
    const id = 'xc' + Math.random().toString(36).slice(2, 6);
    const T = B.experts.reduce((a, x) => a + x.recs28, 0), P = B.experts.reduce((a, x) => a + x.prev28, 0);
    setTimeout(() => { const root = U.$('#' + id); if (!root) return; const body = U.$('.xbody', root);
      const draw = k => { body.innerHTML = expertRows([...B.experts].sort((a, b) => b[k] - a[k]).slice(0, limit)); };
      U.$$('.seg button', root).forEach(b => b.onclick = () => { U.$$('.seg button', root).forEach(x => x.classList.toggle('on', x === b)); draw(b.dataset.s); }); draw('recs28'); });
    return `<section class="card pad xcardc" id="${id}"><div class="h2"><h2>کارشناسان در ۴ هفته‌ی اخیر</h2><div class="grow"></div><div class="seg">${SORTS.map(([k, t], i) => `<button data-s="${k}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div></div>
      <div class="xsum"><span><b class="num">${fa(T)}</b> ثبت <span class="delta ${T < P ? 'down' : ''}">${U.spct((T / P - 1) * 100)}</span></span><span><b class="num">${fa(B.totals.activeExperts)}</b> از ${fa(B.experts.length)} نفر فعال</span><span><b class="num">${fa(B.sleepy.length)}</b> نفر بیش از دو هفته بی‌فعالیت</span></div>
      <div class="xhead"><span></span><span>کارشناس</span><span>ثبت ماه</span><span>۴ هفته</span><span>کیفیت</span><span>وضعیت</span></div>
      <div class="xbody"></div><a class="btn link" href="#" onclick="UI.toast('فهرست کامل کارشناسان باز می‌شود');return false">همه‌ی ${fa(B.experts.length)} کارشناس ${ic('chev', 'sm')}</a></section>`;
  }

  /* ---------- rhythm: 30 days, compact ---------- */
  const KINDS = [['ثبت', .52, 'linear-gradient(180deg,#63D3D1,#0CA5A3)'], ['ویرایش', .24, 'linear-gradient(180deg,#C5D0FF,#91A7FF)'], ['ارسال برای تأیید', .14, 'linear-gradient(180deg,#9DB2FF,#4C6EF5)'], ['اصلاح پس از برگشت', .10, 'linear-gradient(180deg,#FFE08A,#F59F00)']];
  function rhythmCard() {
    const days = 30; const tot = [...Array(days).keys()].map(d => B.experts.reduce((a, x) => a + x.days[84 - days + d], 0));
    const sum = tot.reduce((a, b) => a + b, 0), mx = Math.max(...tot), best = tot.indexOf(mx);
    const date = i => U.faDate(new Date(B.TODAY - (days - 1 - i) * B.DAY), { weekday: 'long', day: 'numeric', month: 'long' });
    const id = 'rh' + Math.random().toString(36).slice(2, 6);
    setTimeout(() => U.$$(`#${id} .col`).forEach((c, i) => { c.onmousemove = e => U.tip(e, `<b>${date(i)}</b><br>${tot[i] ? KINDS.map(k => `${k[0]}: ${fa(Math.round(tot[i] * k[1]))}`).join('<br>') : 'تعطیل · بدون ثبت'}`); c.onmouseleave = () => U.tip(null); }));
    return `<section class="card pad rhythm" id="${id}"><div class="h2"><h2>ریتم کار ۳۰ روز</h2></div>
      <div class="rsum"><div><b class="num">${fa(sum)}</b><small>کار انجام‌شده</small></div><div><b class="num">${fa(Math.round(sum / 26))}</b><small>میانگین روز کاری</small></div><div><b class="num">${fa(mx)}</b><small>پرکارترین روز</small></div></div>
      <div class="propbar" role="img" aria-label="سهم نوع کارها">${KINDS.map(k => `<i style="flex:${k[1]};background:${k[2]}"></i>`).join('')}</div>
      <div class="lgd">${KINDS.map(k => `<span><i style="background:${k[2]}"></i>${k[0]} <b class="num">${pct(k[1] * 100)}</b></span>`).join('')}</div>
      <div class="cols" aria-hidden="true">${tot.map((v, i) => `<span class="col ${i === best ? 'best' : ''}" style="height:${Math.max(3, v / mx * 100)}%">${v ? KINDS.map(k => `<i style="flex:${k[1]};background:${k[2]}"></i>`).join('') : ''}</span>`).join('')}</div>
      <div class="caxis"><span>${U.faDate(new Date(B.TODAY - 29 * B.DAY), { day: 'numeric', month: 'long' })}</span><span>امروز</span></div></section>`;
  }

  /* ---------- item detail panels (map click) ---------- */
  const len = l => { let d = 0; for (let i = 1; i < l.length; i++) { const [a, b] = l[i - 1], [c, e] = l[i]; const k = Math.cos(a * Math.PI / 180); d += Math.hypot((c - a) * 111320, (e - b) * 111320 * k); } return Math.round(d); };
  const fields = rows => `<div class="pfields">${rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
  function itemPanel(kind, it) {
    const hood = B.hoodBy[it.h] || {}; const city = B.cityBy[hood.city] || {};
    const where = `${city.n || ''}، محله ${hood.n || ''}`;
    const by = B.experts[(String(it.id).length * 7 + (it.code ? +it.code.slice(-2) : 3)) % B.experts.length];
    const head = (chip, color, title, sub) => `<span class="ichip" style="--c:${color}">${chip}</span><h3 class="ititle">${title}</h3><p class="lede">${sub}</p>`;
    if (kind === 'prop') return head('ملک و اراضی', CAT.prop, 'ملک ' + it.code, where) + `
      <div class="ladder" style="grid-template-columns:repeat(2,1fr)"><div class="cell"><b class="num">${fa(it.area)}</b><small>مترمربع</small></div><div class="cell"><b>${it.t}</b><small>کاربری</small></div></div>
      ${fields([['وضعیت ثبت', it.s], ['کد شناسایی', 'MLK-' + it.code], ['نوع سند', 'تک‌برگ'], ['وضعیت حقوقی', 'فاقد معارض'], ['قیمت کارشناسی روز', U.money(it.area * 185e6) + ' تومان'], ['ثبت‌کننده', by.n]])}
      <div class="mini-h">فرم ملک<span class="grow"></span><small class="muted">${it.s === 'ثبت کامل' ? '۵ از ۵' : '۳ از ۵'} مرحله</small></div>${U.steps(it.s === 'ثبت کامل' ? 5 : 3, 5)}`;
    if (kind === 'street') { const L = len(it.l); return head('معبر', CAT.street, it.n, where) + `
      <div class="ladder" style="grid-template-columns:repeat(2,1fr)"><div class="cell"><b class="num">${fa(L)}</b><small>متر طول</small></div><div class="cell"><b class="num">${it.m ? '۲۰' : '۱۲'}</b><small>متر عرض</small></div></div>
      ${fields([['وضعیت', it.s], ['نوع', it.m ? 'معبر اصلی' : 'معبر فرعی'], ['روسازی', it.s.includes('بهسازی') ? 'نیازمند ترمیم' : 'مناسب'], ['روشنایی', 'مناسب'], ['دسترسی پیاده', it.m ? 'مناسب' : 'نیازمند رفع موانع'], ['ثبت‌کننده', by.n]])}`; }
    if (kind === 'feat') return head('عارضه مکانی', CAT.feat, it.n, where) + fields([['نوع', it.t], ['هندسه', 'محدوده (چندضلعی)'], ['وضعیت', 'فعال'], ['ثبت‌کننده', by.n]]);
    const p = B.projects.find(x => x.id === it.id);
    return head('پروژه ' + p.type, p.type === 'اجرایی' ? CAT.exec : CAT.part, p.n, where) + `
      <div class="ladder" style="grid-template-columns:repeat(2,1fr)"><div class="cell"><b class="num">${pct(p.pr)}</b><small>پیشرفت واقعی</small></div><div class="cell"><b class="num">${pct(p.plan)}</b><small>پیشرفت برنامه‌ای</small></div></div>
      <div class="bullet"><span class="track"></span><span class="act ${p.gap < -10 ? 'late' : ''}" style="width:${p.pr}%"></span><span class="plan" style="right:${p.plan}%"></span></div>
      ${fields([['پیمانکار', p.contractor], ['مبلغ کل', U.money(p.budget) + ' تومان'], ['پرداخت‌شده', U.money(p.paid) + ' تومان'], ['کارشناس مسئول', p.expert.n]])}
      <a class="btn pri" href="#d/project/${p.id}">${ic('eye', 'sm')} پرونده‌ی پروژه</a>`;
  }
  Object.assign(U, { expertsCard, rhythmCard, itemPanel, CAT });
})();
