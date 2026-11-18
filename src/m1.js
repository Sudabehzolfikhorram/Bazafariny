/* MODEL 1 · اتاق فرمان نقشه — full-bleed zoomable map, context panel follows the level you are on. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc } = U;
  const LV = ['کشور', 'استان', 'شهر', 'منطقه', 'محله'];
  const CHILD = { 0: 'استان', 1: 'شهر', 2: 'منطقه', 3: 'محله', 4: 'معبر یا عارضه' };
  let map, st, layers = {}, sat, labelsLayer, shapes;
  const LAYERS = [['props', 'املاک و اراضی', '#1E40AF'], ['streets', 'معابر', '#64748B'], ['feats', 'عوارض مکانی', '#7FD3D1'], ['exec', 'پروژه‌های اجرایی', '#00ADAB'], ['partner', 'پروژه‌های مشارکتی', '#C2410C']];
  const on = { props: true, streets: true, feats: true, exec: true, partner: true };
  const METRICS = [['records', 'تعداد ثبت'], ['completeness', 'کامل‌بودن'], ['pending', 'منتظر تأیید']];
  let metric = 'records';

  const ll = c => [c[0], c[1]];
  const PAD = mz => Object.assign(innerWidth < 760 ? { padding: [16, 16] } : { paddingTopLeft: [60, 70], paddingBottomRight: [400, 110] }, mz ? { maxZoom: mz } : {});
  const boundsOf = pts => L.latLngBounds(pts.map(ll));

  function render() {
    U.topbar('اتاق فرمان', 'همه‌ی کشور روی یک نقشه · از استان تا معبر');
    U.$('#page').innerHTML = `<div class="m1">
      <section class="stage" aria-label="نقشه">
        <div id="map1"></div>
        <aside class="float ctx" id="ctx" aria-live="polite"></aside>
        <button class="float layersBtn" id="layersBtn" aria-expanded="false">${ic('layers', 'sm')} لایه‌ها و رنگ نقشه</button>
        <div class="float tools" id="tools" role="group" aria-label="لایه‌ها" hidden>
          <div class="lab">رنگ نقشه بر اساس</div>
          <div class="seg" id="metric">${METRICS.map(([k, t]) => `<button data-k="${k}" class="${k === metric ? 'on' : ''}">${t}</button>`).join('')}</div>
          <div class="lab">لایه‌ها (از سطح شهر به پایین)</div>
          ${LAYERS.map(([k, t, c]) => `<button class="layer ${on[k] ? '' : 'off'}" data-l="${k}" aria-pressed="${on[k]}"><span class="sw" style="background:${c}"></span>${t}<span class="cnt">${fa(k === 'props' ? B.totals.props : k === 'streets' ? B.totals.streets : k === 'feats' ? B.totals.feats : B.totals[k])}</span><span class="toggle"></span></button>`).join('')}
          <button class="layer off" id="satBtn" aria-pressed="false">${ic('sat', 'sm')} تصویر ماهواره<span class="cnt"></span><span class="toggle"></span></button>
        </div>
        <div class="float zoom"><button id="zin" aria-label="بزرگ‌نمایی">${ic('plus', 'sm')}</button><button id="zout" aria-label="کوچک‌نمایی">${ic('minus', 'sm')}</button><button id="zhome" aria-label="کل کشور">${ic('home', 'sm')}</button></div>
        <div class="float legend" id="legend"></div>
        <div class="hint" id="hint">روی هر استان بزنید تا تا سطح محله و معبر پایین بروید</div>
        <div class="float ticker"><div class="lbl"><b>آخرین کارها</b><small id="tickScope">کل کشور</small></div><div class="rail" id="rail"></div></div>
      </section>

      <div class="sec-title" style="margin-top:28px"><span class="n">۲</span><h2>کارشناسان چه کرده‌اند؟</h2><p>ثبت‌ها، کیفیت و کارهای منتظر هر کارشناس</p></div>
      <div class="grid g-21">
        <div class="card pad" style="overflow:auto"><div class="h2"><h2>عملکرد کارشناسان</h2><div class="grow"></div><div class="seg" id="xsort"><button class="on" data-s="recs30">بیشترین ثبت</button><button data-s="lastDays">کم‌فعال‌ها</button><button data-s="pending">منتظر تأیید</button></div></div>
          <div id="xtable"></div></div>
        <div class="card pad"><div class="h2"><h2>منتظر تأیید شما</h2><div class="grow"></div><span class="badge wait">${fa(B.queue.length)} مورد</span></div>
          <p class="lede">موارد قدیمی‌تر بالاتر آمده‌اند.</p>
          <div class="list">${B.queue.map(q => `<a class="row" href="#d/hood/${q.ref}">${U.av(q.x)}<span class="t"><b>${q.n}</b><small>${q.x.n} · ${q.city}</small></span><span style="width:70px">${U.steps(q.steps)}<small class="muted">${fa(q.age)} روز</small></span></a>`).join('')}</div></div>
      </div>

      <div class="sec-title" style="margin-top:28px"><span class="n">۳</span><h2>پروژه‌ها و روند ثبت</h2><p>پیشرفت واقعی در برابر برنامه، و حجم ثبت ماهانه</p></div>
      <div class="grid g2">
        <div class="card pad"><div class="h2"><h2>پیشرفت پروژه‌ها</h2><div class="grow"></div><span class="muted" style="font-size:12px">خط سیاه = جایی که باید باشد</span></div>${U.bullets(B.projects.slice(0, 7))}</div>
        <div class="card pad"><div class="h2"><h2>ثبت ماهانه به تفکیک نوع</h2><div class="grow"></div><span class="delta ${B.totals.thisMonth < B.totals.lastMonth ? 'down' : ''}">${U.spct((B.totals.thisMonth / B.totals.lastMonth - 1) * 100)} نسبت به مهر</span></div>${U.TREND_LEGEND()}<div class="chart" id="trend1" style="height:310px"></div></div>
      </div>
      <div style="margin-top:20px">${U.aiCard()}</div>
    </div>`;

    U.$('#xtable').innerHTML = U.expertTable([...B.experts].sort((a, b) => b.recs30 - a.recs30).slice(0, 8));
    U.$$('#xsort button').forEach(b => b.onclick = () => { U.$$('#xsort button').forEach(x => x.classList.toggle('on', x === b)); const k = b.dataset.s; U.$('#xtable').innerHTML = U.expertTable([...B.experts].sort((a, c) => c[k] - a[k]).slice(0, 8)); });
    U.trendChart(U.$('#trend1'));
    initMap();
  }

  function initMap() {
    map = L.map('map1', { zoomControl: false, attributionControl: true, minZoom: 4, maxZoom: 17, zoomSnap: 0.25, preferCanvas: false });
    map.attributionControl.setPrefix('');
    sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 18 });
    L.geoJSON(window.GEO_NB, { style: { color: '#E2E8F0', weight: 1, fillColor: '#F1F5F9', fillOpacity: 1 }, interactive: false }).addTo(map);
    shapes = L.layerGroup().addTo(map); labelsLayer = L.layerGroup().addTo(map);
    U.$('#layersBtn').onclick = e => { const t = U.$('#tools'), o = t.hidden; t.hidden = !o; e.currentTarget.setAttribute('aria-expanded', o); };
    U.$('#zin').onclick = () => map.zoomIn(); U.$('#zout').onclick = () => map.zoomOut(); U.$('#zhome').onclick = () => go({ lv: 0 });
    U.$$('#metric button').forEach(b => b.onclick = () => { metric = b.dataset.k; U.$$('#metric button').forEach(x => x.classList.toggle('on', x === b)); go(st); });
    U.$$('.layer[data-l]').forEach(b => b.onclick = () => { const k = b.dataset.l; on[k] = !on[k]; b.classList.toggle('off', !on[k]); b.setAttribute('aria-pressed', on[k]); go(st, true); });
    U.$('#satBtn').onclick = e => { const b = e.currentTarget, onSat = b.classList.toggle('off'); b.setAttribute('aria-pressed', !onSat); if (!onSat) sat.addTo(map).bringToBack(); else map.removeLayer(sat); };
    go({ lv: 0 });
  }

  const provColor = p => { if (!p.has) return null; const vals = B.provs.filter(x => x.has).map(x => x[metric]); const mx = Math.max(...vals); return U.ramp(p[metric] / (mx || 1) * 0.999); };
  function label(latlng, name, val) { L.marker(latlng, { interactive: false, icon: L.divIcon({ className: 'm1-lab', html: `<span>${esc(name)}</span>${val != null ? `<span class="c">${val}</span>` : ''}`, iconSize: [90, 32], iconAnchor: [45, 16] }) }).addTo(labelsLayer); }

  function go(s, keepView) {
    st = s; shapes.clearLayers(); labelsLayer.clearLayers(); U.tip(null);
    const hint = U.$('#hint'); if (hint) hint.style.display = s.lv === 0 ? '' : 'none';
    if (s.lv === 0) drawCountry(keepView);
    else if (s.lv === 1) drawProv(s.id, keepView);
    else if (s.lv === 2) drawCity(s.id, keepView);
    else if (s.lv === 3) drawRegion(s.id, keepView);
    else drawHood(s.id, keepView);
    panel(); legend(); ticker();
  }

  function drawCountry(keep) {
    const gj = L.geoJSON(B.GI, {
      style: f => { const p = B.provBy[f.properties.en]; const c = provColor(p); return { color: '#fff', weight: 1.2, fillColor: c || '#E2E8F0', fillOpacity: 1, className: c ? '' : 'nodata' }; },
      onEachFeature: (f, l) => { const p = B.provBy[f.properties.en];
        l.on('mousemove', e => { l.setStyle({ weight: 2.5, color: '#0F172A' }); U.tip(e.originalEvent, `<b>${p.fa}</b><br>${p.has ? `${fa(p.records)} رکورد · ${pct(p.completeness)} کامل<br>${fa(p.pending)} مورد منتظر تأیید` : 'هنوز داده‌ای ثبت نشده'}`); });
        l.on('mouseout', () => { l.setStyle({ weight: 1.2, color: '#fff' }); U.tip(null); });
        l.on('click', () => go({ lv: 1, id: p.id })); }
    }).addTo(shapes);
    B.provs.forEach(p => { const c = U.centroid(U.biggest(p.feature)); if (p.has) label([c[1], c[0]], p.short, p.has ? (metric === 'completeness' ? pct(p.completeness) : fa(p[metric])) : null); });
    if (!keep) map.fitBounds(gj.getBounds(), PAD());
  }
  function fadeOthers(exceptEn) {
    L.geoJSON(B.GI, { style: f => ({ color: '#fff', weight: 1, fillColor: f.properties.en === exceptEn ? '#FFFFFF' : '#E9EEF3', fillOpacity: 1 }), onEachFeature: (f, l) => { if (f.properties.en !== exceptEn) l.on('click', () => go({ lv: 1, id: f.properties.en })); } }).addTo(shapes);
  }
  function drawProv(id, keep) {
    const p = B.provBy[id]; fadeOthers(id);
    const outline = L.geoJSON(p.feature, { style: { color: '#007C7A', weight: 2, fill: false }, interactive: false }).addTo(shapes);
    const cities = B.D.cities.filter(c => c.p === id);
    const mx = Math.max(1, ...cities.map(c => c.hoods));
    cities.forEach(c => {
      const pg = L.polygon(c.b.map(ll), { color: '#fff', weight: 1.2, fillColor: U.ramp(c.hoods / mx * .99), fillOpacity: .95 }).addTo(shapes);
      pg.on('mousemove', e => U.tip(e.originalEvent, `<b>شهر ${c.n}</b><br>${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک`)); pg.on('mouseout', () => U.tip(null));
      pg.on('click', () => go({ lv: 2, id: c.id }));
      L.circleMarker(ll(c.c), { radius: 6 + Math.sqrt(c.hoods) * 3.2, color: '#fff', weight: 2, fillColor: '#007C7A', fillOpacity: .9 }).on('click', () => go({ lv: 2, id: c.id })).on('mousemove', e => U.tip(e.originalEvent, `<b>شهر ${c.n}</b><br>${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک`)).on('mouseout', () => U.tip(null)).addTo(shapes);
      label(ll(c.c), c.n, fa(c.hoods) + ' محله');
    });
    if (!keep) map.fitBounds(outline.getBounds(), PAD());
  }
  function drawPoints(hoodIds) {
    const hs = new Set(hoodIds);
    if (on.streets) B.D.streets.filter(s => hs.has(s.h)).forEach(s => L.polyline(s.l.map(ll), { color: s.m ? '#334155' : '#94A3B8', weight: s.m ? 4 : 2.5, opacity: .9 }).on('mousemove', e => U.tip(e.originalEvent, `<b>${s.n}</b><br>${s.s}`)).on('mouseout', () => U.tip(null)).on('click', () => location.hash = '#d/hood/' + s.h).addTo(shapes));
    if (on.feats) B.D.feats.filter(f => hs.has(f.h)).forEach(f => L.polygon(f.b.map(ll), { color: '#40BDBB', weight: 1, fillColor: '#B3E6E5', fillOpacity: .8 }).on('mousemove', e => U.tip(e.originalEvent, `<b>${f.n}</b><br>عارضه مکانی · ${f.t}`)).on('mouseout', () => U.tip(null)).addTo(shapes));
    if (on.exec) B.D.execs.filter(x => hs.has(x.h)).forEach(x => L.polygon(x.b.map(ll), { color: '#007C7A', weight: 2, dashArray: '5 4', fillColor: '#00ADAB', fillOpacity: .12 }).on('click', () => location.hash = '#d/project/' + x.id).on('mousemove', e => U.tip(e.originalEvent, `<b>${x.n}</b><br>پروژه اجرایی · ${pct(x.pr)} پیشرفت`)).on('mouseout', () => U.tip(null)).addTo(shapes));
    if (on.props) B.D.pts.filter(p => hs.has(p.h)).forEach(p => L.circleMarker(ll(p.c), { radius: 4, color: '#fff', weight: 1.2, fillColor: '#1E40AF', fillOpacity: 1 }).on('mousemove', e => U.tip(e.originalEvent, `<b>ملک ${p.code}</b><br>${p.t} · ${fa(p.area)} مترمربع<br>${p.s}`)).on('mouseout', () => U.tip(null)).addTo(shapes));
    if (on.partner) B.D.partners.filter(x => hs.has(x.h)).forEach(x => L.circleMarker(ll(x.c), { radius: 8, color: '#fff', weight: 2, fillColor: '#C2410C', fillOpacity: 1 }).on('click', () => location.hash = '#d/project/' + x.id).on('mousemove', e => U.tip(e.originalEvent, `<b>${x.n}</b><br>پروژه مشارکتی · ${pct(x.pr)} پیشرفت`)).on('mouseout', () => U.tip(null)).addTo(shapes));
  }
  function drawCity(id, keep) {
    const c = B.cityBy[id]; fadeOthers('_');
    const outline = L.polygon(c.b.map(ll), { color: '#007C7A', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(shapes);
    const regs = B.D.regions.filter(r => r.city === id);
    regs.forEach(r => { const hs = B.D.hoods.filter(h => h.reg === r.id); const pg = L.polygon(r.b.map(ll), { color: '#94A3B8', weight: 1, fillColor: hs.length ? U.ramp(Math.min(.99, hs.length / 5)) : '#F8FAFC', fillOpacity: .55 }).addTo(shapes);
      pg.on('click', () => go({ lv: 3, id: r.id })); pg.on('mousemove', e => U.tip(e.originalEvent, `<b>${r.n}</b><br>${fa(hs.length)} محله ثبت‌شده`)); pg.on('mouseout', () => U.tip(null));
      label(ll(r.c), r.n, null); });
    const hoods = B.D.hoods.filter(h => h.city === id);
    hoods.forEach(h => L.polygon(h.b.map(ll), { color: '#007C7A', weight: 1, fillOpacity: 0, dashArray: '3 3' }).on('click', () => go({ lv: 4, id: h.id })).addTo(shapes));
    drawPoints(hoods.map(h => h.id));
    if (!keep) map.fitBounds(outline.getBounds(), PAD());
  }
  function drawRegion(id, keep) {
    const r = B.regionBy[id], c = B.cityBy[r.city]; fadeOthers('_');
    L.polygon(c.b.map(ll), { color: '#CBD5E1', weight: 1, fillColor: '#fff', fillOpacity: 1, interactive: false }).addTo(shapes);
    const outline = L.polygon(r.b.map(ll), { color: '#007C7A', weight: 2, fillColor: '#F8FAFC', fillOpacity: 1 }).addTo(shapes);
    const hoods = B.D.hoods.filter(h => h.reg === id);
    hoods.forEach(h => { const col = h.status === 'تأیید شده' ? '#40BDBB' : h.status === 'در انتظار تأیید' ? '#93A8E8' : h.status === 'برگشت برای اصلاح' ? '#FED7AA' : '#E2E8F0';
      const pg = L.polygon(h.b.map(ll), { color: '#fff', weight: 1.5, fillColor: col, fillOpacity: .85 }).addTo(shapes);
      pg.on('click', () => go({ lv: 4, id: h.id })); pg.on('mousemove', e => U.tip(e.originalEvent, `<b>محله ${h.n}</b><br>${h.status} · مرحله ${fa(h.steps)} از ۶`)); pg.on('mouseout', () => U.tip(null));
      label(ll(h.c), h.n, null); });
    drawPoints(hoods.map(h => h.id));
    if (!keep) map.fitBounds(outline.getBounds(), PAD());
  }
  function drawHood(id, keep) {
    const h = B.hoodBy[id]; fadeOthers('_');
    const sib = B.D.hoods.filter(x => x.reg === h.reg && x.id !== id);
    sib.forEach(x => L.polygon(x.b.map(ll), { color: '#CBD5E1', weight: 1, fillColor: '#F8FAFC', fillOpacity: 1 }).on('click', () => go({ lv: 4, id: x.id })).addTo(shapes));
    const outline = L.polygon(h.b.map(ll), { color: '#007C7A', weight: 2.5, fillColor: '#E6F7F7', fillOpacity: .6 }).addTo(shapes);
    drawPoints([id]);
    if (!keep) map.fitBounds(outline.getBounds(), PAD(16));
  }

  function chain() {
    const out = [{ lv: 0, n: 'ایران' }];
    if (st.lv >= 1) { let prov, city, reg, hood;
      if (st.lv === 4) { hood = B.hoodBy[st.id]; reg = B.regionBy[hood.reg]; city = B.cityBy[hood.city]; }
      if (st.lv === 3) { reg = B.regionBy[st.id]; city = B.cityBy[reg.city]; }
      if (st.lv === 2) city = B.cityBy[st.id];
      prov = st.lv === 1 ? B.provBy[st.id] : B.provBy[city.p];
      out.push({ lv: 1, id: prov.id, n: prov.fa }); if (city) out.push({ lv: 2, id: city.id, n: city.n }); if (reg) out.push({ lv: 3, id: reg.id, n: reg.n }); if (hood) out.push({ lv: 4, id: hood.id, n: hood.n }); }
    return out;
  }
  function panel() {
    const ch = chain(), cur = ch[ch.length - 1], T = B.totals;
    let title = cur.n, lv = LV[st.lv], cells = [], comp = 0, kids = [], prov = null, detail = '', extra = '';
    if (st.lv === 0) {
      cells = [['استان', T.provsWith, '/۳۱'], ['شهر', T.cities], ['منطقه', T.regions], ['محله', T.hoods], ['معبر', T.streets], ['ملک', T.props]]; comp = T.completeness;
      kids = B.provs.filter(p => p.has).sort((a, b) => b.records - a.records).slice(0, 6).map(p => ({ n: p.fa, s: `${fa(p.hoods)} محله · ${fa(p.props)} ملک`, v: p.records, go: () => go({ lv: 1, id: p.id }) }));
      detail = '';
    } else if (st.lv === 1) {
      prov = B.provBy[st.id];
      cells = [['شهر', prov.cities], ['منطقه', prov.regions], ['محله', prov.hoods], ['معبر', prov.streets], ['ملک', prov.props], ['پروژه', prov.exec + prov.partner]]; comp = prov.completeness;
      kids = B.D.cities.filter(c => c.p === st.id).map(c => ({ n: 'شهر ' + c.n, s: `${fa(c.regions)} منطقه · ${fa(c.hoods)} محله`, v: c.hoods, go: () => go({ lv: 2, id: c.id }) }));
      detail = `#d/prov/${st.id}`;
    } else if (st.lv === 2) {
      const c = B.cityBy[st.id]; title = 'شهر ' + c.n; prov = B.provBy[c.p];
      const hs = B.D.hoods.filter(h => h.city === c.id);
      cells = [['منطقه', c.regions], ['محله', c.hoods], ['معبر', hs.reduce((a, h) => a + h.streets, 0)], ['ملک', c.props], ['عارضه', hs.reduce((a, h) => a + h.feats, 0)], ['پروژه', B.projects.filter(p => hs.some(h => h.id === p.h)).length]]; comp = c.completeness;
      kids = B.D.regions.filter(r => r.city === c.id).map(r => { const n = B.D.hoods.filter(h => h.reg === r.id).length; return { n: r.n, s: `${fa(n)} محله`, v: n, go: () => go({ lv: 3, id: r.id }) }; }).sort((a, b) => b.v - a.v).slice(0, 8);
      detail = `#d/city/${c.id}`;
    } else if (st.lv === 3) {
      const r = B.regionBy[st.id]; const hs = B.D.hoods.filter(h => h.reg === r.id); prov = B.provBy[B.cityBy[r.city].p];
      cells = [['محله', hs.length], ['معبر', hs.reduce((a, h) => a + h.streets, 0)], ['ملک', hs.reduce((a, h) => a + h.props, 0)], ['عارضه', hs.reduce((a, h) => a + h.feats, 0)], ['تأیید شده', hs.filter(h => h.status === 'تأیید شده').length], ['منتظر', hs.filter(h => h.status === 'در انتظار تأیید').length]];
      comp = hs.length ? hs.reduce((a, h) => a + h.steps, 0) / hs.length / 6 * 100 : 0;
      kids = hs.map(h => ({ n: 'محله ' + h.n, s: h.status, v: h.steps, vs: fa(h.steps) + '/۶', go: () => go({ lv: 4, id: h.id }) }));
      extra = `<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px" class="muted">${[['#40BDBB', 'تأیید شده'], ['#93A8E8', 'منتظر تأیید'], ['#FED7AA', 'برگشت‌خورده'], ['#E2E8F0', 'پیش‌نویس']].map(([c, t]) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${c};margin-inline-end:4px"></i>${t}</span>`).join('')}</div>`;
    } else {
      const h = B.hoodBy[st.id]; title = 'محله ' + h.n; prov = B.provBy[B.cityBy[h.city].p];
      cells = [['معبر', h.streets], ['ملک', h.props], ['عارضه', h.feats], ['ساکنان', h.pop], ['بلوک', h.blk || 0], ['پروژه', B.projects.filter(p => p.h === h.id).length]];
      comp = h.steps / 6 * 100;
      extra = `<div><div class="mini-h">فرم محله ${U.statusBadge(h.status)}<span class="grow"></span><small class="muted">مرحله ${fa(h.steps)} از ۶</small></div>${U.steps(h.steps)}<small class="muted">${B.STEP_NAMES[Math.min(5, h.steps)]}${h.steps < 6 ? ' هنوز کامل نشده' : ' انجام شد'}</small></div>`;
      kids = B.D.streets.filter(s => s.h === h.id).map(s => ({ n: s.n, s: s.s, v: null, go: () => location.hash = '#d/hood/' + h.id }));
      detail = `#d/hood/${h.id}`;
    }
    const empty = st.lv === 1 && !prov.has;
    const mx = Math.max(1, ...kids.map(k => k.v || 0));
    U.$('#ctx').innerHTML = `<div class="hd"><nav class="crumb" aria-label="مسیر">${ch.map((c, i) => i < ch.length - 1 ? `<button data-i="${i}">${c.n}</button><span>›</span>` : `<span>${c.n}</span>`).join('')}</nav>
      <h2>${title}<span class="lvl">${lv}</span></h2></div>
      <div class="bd">${empty ? `<div class="empty-hatch" style="border-radius:14px;padding:20px;text-align:center"><b>هنوز چیزی در ${prov.fa} ثبت نشده</b><p class="lede" style="margin:6px 0 12px">اولین قدم، تعریف شهرهای این استان و کشیدن محدوده‌ی آن‌هاست.</p><button class="btn pri" onclick="UI.toast('فرم «ایجاد شهر» باز می‌شود')">${ic('plus', 'sm')} تعریف شهر در ${prov.fa}</button></div>` : `
        <div class="ladder">${cells.map(([l, v, suf]) => `<div class="cell ${v ? '' : 'dim'}"><b class="num">${fa(v)}${suf || ''}</b><small>${l}</small></div>`).join('')}</div>
        <div><div class="mini-h">کامل‌بودن اطلاعات<span class="grow"></span><b>${pct(comp)}</b></div><div class="bar"><i style="width:${comp}%"></i></div></div>
        ${extra}
        <div><div class="mini-h">نیاز به پیگیری</div>${U.attention(3, st.lv === 0 ? null : (prov && prov.id))}</div>
        ${kids.length ? `<div><div class="mini-h">${st.lv === 4 ? 'معابر این محله' : CHILD[st.lv] + '‌ها'}<span class="grow"></span><small class="muted">${fa(kids.length)}</small></div><div class="list">${kids.map((k, i) => `<button class="row" data-k="${i}"><span class="t"><b>${k.n}</b><small>${k.s}</small></span>${k.v != null ? `<span style="width:70px"><div class="bar"><i style="width:${k.v / mx * 100}%"></i></div></span><b class="num" style="width:44px;text-align:left;font-size:12.5px">${k.vs || fa(k.v)}</b>` : ''}</button>`).join('')}</div></div>` : ''}`}
        <div style="display:flex;gap:8px;margin-top:auto">${detail ? `<a class="btn pri" href="${detail}" style="flex:1">${ic('eye', 'sm')} صفحه‌ی کامل ${title}</a>` : ''}${st.lv < 4 && !empty ? `<button class="btn ghost" onclick="UI.toast('فرم «ایجاد ${CHILD[st.lv]}» باز می‌شود')" style="${detail ? '' : 'flex:1'}">${ic('plus', 'sm')} تعریف ${CHILD[st.lv]}</button>` : ''}</div>
      </div>`;
    U.$$('#ctx .crumb button').forEach(b => b.onclick = () => go(ch[+b.dataset.i]));
    U.$$('#ctx [data-k]').forEach(b => b.onclick = () => kids[+b.dataset.k].go());
  }
  function legend() {
    const el = U.$('#legend');
    if (st.lv === 0) { const vals = B.provs.filter(x => x.has).map(x => x[metric]); const mx = Math.max(...vals), mn = Math.min(...vals);
      el.innerHTML = `<b style="color:var(--ink)">${METRICS.find(m => m[0] === metric)[1]}</b><div class="ramp">${U.RAMP.map(c => `<i style="background:${c}"></i>`).join('')}</div><div style="display:flex;justify-content:space-between"><span>${metric === 'completeness' ? pct(mn) : fa(mn)}</span><span>${metric === 'completeness' ? pct(mx) : fa(mx)}</span></div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><i style="width:12px;height:12px;border-radius:3px;background:#E2E8F0"></i> بدون داده (${fa(B.empty.length)} استان)</div>`; }
    else el.innerHTML = `<b style="color:var(--ink)">${st.lv === 1 ? 'رنگ شهرها: تعداد محله' : st.lv === 2 ? 'رنگ مناطق: تعداد محله' : 'لایه‌های روشن روی نقشه'}</b><div style="display:flex;flex-direction:column;gap:3px;margin-top:6px">${LAYERS.filter(l => on[l[0]]).map(l => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${l[2]};margin-inline-end:6px"></i>${l[1]}</span>`).join('')}</div>`;
  }
  function ticker() {
    const ch = chain(); let evs = B.events;
    if (st.lv >= 1) { const prov = ch[1].id; evs = evs.filter(e => e.prov === prov); }
    if (st.lv >= 2) { const city = ch[2].id; evs = evs.filter(e => e.city === city); }
    if (st.lv === 4) evs = evs.filter(e => e.hood === st.id).concat(evs.filter(e => e.hood !== st.id));
    U.$('#tickScope').textContent = ch[ch.length - 1].n;
    U.$('#rail').innerHTML = evs.slice(0, 14).map(U.evChip).join('') || '<span class="muted" style="padding:0 10px">در این محدوده هنوز فعالیتی ثبت نشده</span>';
  }
  window.M1 = { render, destroy: () => { if (map) { map.remove(); map = null; } } };
})();
