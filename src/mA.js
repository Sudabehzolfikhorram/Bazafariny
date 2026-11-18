/* MODEL A · نقشه — one stage, two views (2D drill-down / tilted 3D with time); the side panel follows the level or the clicked item. */
(function () {
  'use strict';
  const B = window.BZ, U = window.UI, { fa, pct, ic, esc } = U;
  const LV = ['کشور', 'استان', 'شهر', 'منطقه', 'محله'];
  const CHILD = { 0: 'استان', 1: 'شهر', 2: 'منطقه', 3: 'محله', 4: 'معبر یا عارضه' };
  let map, st, layers = {}, sat, labelsLayer, shapes, sel = null, view = '2d', month = 7, playing = null, cur3 = null, selLayer = null;
  const C = U.CAT; const LAYERS = [['props', 'املاک و اراضی', C.prop], ['streets', 'معابر', C.street], ['feats', 'عوارض مکانی', C.feat], ['exec', 'پروژه‌های اجرایی', C.exec], ['partner', 'پروژه‌های مشارکتی', C.part]];
  const on = { props: true, streets: true, feats: true, exec: true, partner: true };
  const METRICS = [['records', 'تعداد ثبت'], ['completeness', 'کامل‌بودن'], ['pending', 'منتظر تأیید']];
  let metric = 'records';

  const ll = c => [c[0], c[1]];
  const fit = (b, o) => { map.stop(); if (map._animatingZoom) map.fitBounds(b, Object.assign({}, o, { animate: false })); else map.fitBounds(b, o); };
  const PAD = mz => Object.assign(innerWidth < 760 ? { padding: [16, 16] } : { paddingTopLeft: [60, 70], paddingBottomRight: [400, 110] }, mz ? { maxZoom: mz } : {});
  const boundsOf = pts => L.latLngBounds(pts.map(ll));

  function render() {
    U.topbar('نقشه‌ی بازآفرینی', 'کل کشور روی یک نقشه · دوبعدی برای کاوش تا معبر، سه‌بعدی برای دیدن حجم و روند');
    U.$('#page').innerHTML = `<div class="ma" id="ma">
      <section class="stage" aria-label="نقشه">
        <div id="map1"></div>
        <div class="iso3" id="iso3"><svg id="iso" class="iso" preserveAspectRatio="xMidYMid meet"></svg></div><div class="atl" id="atl"></div>
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
        <div class="float time3" id="time3"><button class="play" id="play" aria-label="پخش روند">${ic('play', 'sm')}</button><div class="months" id="months"></div><div style="min-width:96px"><small class="muted">تا پایان</small><div style="font-weight:800" id="mlabel"></div></div></div>
        <div class="float viewsw" role="tablist" aria-label="نوع نمایش"><button role="tab" data-v="2d" class="on">${ic('map', 'sm')} نقشه</button><button role="tab" data-v="sat">${ic('sat', 'sm')} ماهواره</button><button role="tab" data-v="3d">${ic('chart', 'sm')} سه‌بعدی و زمان</button><button role="tab" data-v="atlas">${ic('grid', 'sm')} اطلس استان‌ها</button></div>
      </section>

      <div class="sec-title" style="margin-top:28px"><span class="n">۲</span><h2>وضعیت محلات هدف</h2><p id="renewScope">همراه نقشه عوض می‌شود</p></div>
      <div id="renew" class="renew"></div>

      <div class="sec-title" style="margin-top:28px"><span class="n">۳</span><h2>کارشناسان چه کرده‌اند؟</h2><p>بازه‌ی یک ماه اخیر</p></div>
      <div class="grid g-21 xgrid">${U.expertsCard(6)}<div class="stackcol">${U.rhythmCard()}${U.formStatusCard()}</div></div>

      <div class="sec-title" style="margin-top:28px"><span class="n">۴</span><h2>پروژه‌ها و کارهای منتظر شما</h2><p>پیشرفت واقعی در برابر برنامه، و صف تأیید</p></div>
      <div class="grid g2">
        <div class="card pad"><div class="h2"><h2>پیشرفت پروژه‌ها</h2><div class="grow"></div><span class="muted" style="font-size:12px">خط آبی = جایی که باید باشد</span></div>${U.bullets(B.projects.slice(0, 6))}</div>
        <div class="card pad"><div class="h2"><h2>منتظر تأیید شما</h2><div class="grow"></div><span class="badge wait">${fa(B.queue.length)} مورد</span></div>
          <div class="list">${B.queue.slice(0, 6).map(q => `<a class="row" href="#d/hood/${q.ref}">${U.av(q.x)}<span class="t"><b>${q.n}</b><small>${q.x.n} · ${q.city}</small></span><span style="width:84px">${U.steps(q.steps)}<small class="muted">${fa(q.age)} روز در صف</small></span></a>`).join('')}</div></div>
      </div>
      <div style="margin-top:20px">${U.aiCard()}</div>
    </div>`;
    U.$$('.viewsw button').forEach(b => b.onclick = () => setView(b.dataset.v));
    U.$('#play').onclick = togglePlay;
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
    let gp = null; try { gp = sessionStorage.getItem('goProv'); sessionStorage.removeItem('goProv'); } catch (e) {}
    go(gp && B.provBy[gp] ? { lv: 1, id: gp } : { lv: 0 });
  }

  const provColor = p => { if (!p.has) return null; const vals = B.provs.filter(x => x.has).map(x => x[metric]); const mx = Math.max(...vals); return U.ramp(p[metric] / (mx || 1) * 0.999); };
  function label(latlng, name, val) { L.marker(latlng, { interactive: false, icon: L.divIcon({ className: 'm1-lab', html: `<span>${esc(name)}</span>${val != null ? `<span class="c">${val}</span>` : ''}`, iconSize: [90, 32], iconAnchor: [45, 16] }) }).addTo(labelsLayer); }

  function go(s, keepView) {
    st = s; sel = null; selLayer = null; shapes.clearLayers(); labelsLayer.clearLayers(); U.tip(null);
    const hint = U.$('#hint'); if (hint) hint.style.display = s.lv === 0 ? '' : 'none';
    if (s.lv === 0) drawCountry(keepView);
    else if (s.lv === 1) drawProv(s.id, keepView);
    else if (s.lv === 2) drawCity(s.id, keepView);
    else if (s.lv === 3) drawRegion(s.id, keepView);
    else drawHood(s.id, keepView);
    panel(); legend(); renew(); if (view === '3d') draw3d(); if (view === 'atlas') drawAtlas();
  }

  function drawCountry(keep) {
    const gj = L.geoJSON(B.GI, {
      style: f => { const p = B.provBy[f.properties.en]; const c = provColor(p); return { color: '#fff', weight: 1.2, fillColor: c || '#E2E8F0', fillOpacity: 1, className: c ? '' : 'nodata' }; },
      onEachFeature: (f, l) => { const p = B.provBy[f.properties.en];
        l.on('mousemove', e => { l.setStyle({ weight: 2.5, color: '#3B5BDB' }); U.tip(e.originalEvent, `<b>${p.fa}</b><br>${p.has ? `${fa(p.records)} رکورد · ${pct(p.completeness)} کامل<br>${fa(p.pending)} مورد منتظر تأیید` : 'هنوز داده‌ای ثبت نشده'}`); });
        l.on('mouseout', () => { l.setStyle({ weight: 1.2, color: '#fff' }); U.tip(null); });
        l.on('click', () => go({ lv: 1, id: p.id })); }
    }).addTo(shapes);
    B.provs.forEach(p => { const c = U.centroid(U.biggest(p.feature)); if (p.has) label([c[1], c[0]], p.short, p.has ? (metric === 'completeness' ? pct(p.completeness) : fa(p[metric])) : null); });
    if (!keep) fit(gj.getBounds(), PAD());
  }
  function fadeOthers(exceptEn) {
    L.geoJSON(B.GI, { style: f => ({ color: '#fff', weight: 1, fillColor: f.properties.en === exceptEn ? '#FFFFFF' : '#E9EEF3', fillOpacity: 1 }), onEachFeature: (f, l) => { if (f.properties.en !== exceptEn) l.on('click', () => go({ lv: 1, id: f.properties.en })); } }).addTo(shapes);
  }
  function drawProv(id, keep) {
    const p = B.provBy[id]; fadeOthers(id);
    const outline = L.geoJSON(p.feature, { style: { color: '#3B5BDB', weight: 2, fill: false }, interactive: false }).addTo(shapes);
    const cities = B.D.cities.filter(c => c.p === id);
    const mx = Math.max(1, ...cities.map(c => c.hoods));
    cities.forEach(c => {
      const pg = L.polygon(c.b.map(ll), { color: '#fff', weight: 1.2, fillColor: U.ramp(c.hoods / mx * .99), fillOpacity: .95 }).addTo(shapes);
      pg.on('mousemove', e => U.tip(e.originalEvent, `<b>شهر ${c.n}</b><br>${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک`)); pg.on('mouseout', () => U.tip(null));
      pg.on('click', () => go({ lv: 2, id: c.id }));
      L.circleMarker(ll(c.c), { radius: 6 + Math.sqrt(c.hoods) * 3.2, color: '#fff', weight: 2, fillColor: C.hood, fillOpacity: .9 }).on('click', () => go({ lv: 2, id: c.id })).on('mousemove', e => U.tip(e.originalEvent, `<b>شهر ${c.n}</b><br>${fa(c.regions)} منطقه · ${fa(c.hoods)} محله · ${fa(c.props)} ملک`)).on('mouseout', () => U.tip(null)).addTo(shapes);
      label(ll(c.c), c.n, fa(c.hoods) + ' محله');
    });
    if (!keep) fit(outline.getBounds(), PAD());
  }
  function drawPoints(hoodIds) {
    const hs = new Set(hoodIds);
    const hov = (l, html) => l.on('mousemove', e => U.tip(e.originalEvent, html)).on('mouseout', () => U.tip(null));
    if (on.streets) B.D.streets.filter(s => hs.has(s.h)).forEach(s => { const l = L.polyline(s.l.map(ll), { color: C.street, weight: s.m ? 5 : 3, opacity: .95 }); hov(l, `<b>${s.n}</b><br>${s.s}`).on('click', e => pick('street', s, e)).addTo(shapes); });
    if (on.feats) B.D.feats.filter(f => hs.has(f.h)).forEach(f => { const l = L.polygon(f.b.map(ll), { color: C.feat, weight: 1.5, fillColor: C.feat, fillOpacity: .25 }); hov(l, `<b>${f.n}</b><br>عارضه مکانی · ${f.t}`).on('click', e => pick('feat', f, e)).addTo(shapes); });
    if (on.exec) B.D.execs.filter(x => hs.has(x.h)).forEach(x => { const l = L.polygon(x.b.map(ll), { color: C.exec, weight: 2, dashArray: '5 4', fillColor: C.exec, fillOpacity: .08 }); hov(l, `<b>${x.n}</b><br>پروژه اجرایی · ${pct(x.pr)} پیشرفت`).on('click', e => pick('proj', x, e)).addTo(shapes); });
    if (on.props) B.D.pts.filter(p => hs.has(p.h)).forEach(p => { const l = L.circleMarker(ll(p.c), { radius: 5, color: '#fff', weight: 1.5, fillColor: C.prop, fillOpacity: 1 }); hov(l, `<b>ملک ${p.code}</b><br>${p.t} · ${fa(p.area)} مترمربع`).on('click', e => pick('prop', p, e)).addTo(shapes); });
    if (on.partner) B.D.partners.filter(x => hs.has(x.h)).forEach(x => { const l = L.circleMarker(ll(x.c), { radius: 8, color: '#fff', weight: 2, fillColor: C.part, fillOpacity: 1 }); hov(l, `<b>${x.n}</b><br>پروژه مشارکتی · ${pct(x.pr)} پیشرفت`).on('click', e => pick('proj', x, e)).addTo(shapes); });
  }
  function pick(kind, it, e) {
    if (e) L.DomEvent.stopPropagation(e);
    sel = { kind, it }; U.tip(null);
    if (selLayer) { shapes.removeLayer(selLayer); selLayer = null; }
    const pos = it.c ? ll(it.c) : it.l ? ll(it.l[Math.floor(it.l.length / 2)]) : L.polygon(it.b.map(ll)).getBounds().getCenter();
    selLayer = L.circleMarker(pos, { radius: 14, color: '#3B5BDB', weight: 2, fill: false, interactive: false }).addTo(shapes);
    panel();
  }
  function drawCity(id, keep) {
    const c = B.cityBy[id]; fadeOthers('_');
    const outline = L.polygon(c.b.map(ll), { color: '#3B5BDB', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(shapes);
    const regs = B.D.regions.filter(r => r.city === id);
    regs.forEach(r => { const hs = B.D.hoods.filter(h => h.reg === r.id); const pg = L.polygon(r.b.map(ll), { color: '#94A3B8', weight: 1, fillColor: hs.length ? U.ramp(Math.min(.99, hs.length / 5)) : '#F8FAFC', fillOpacity: .55 }).addTo(shapes);
      pg.on('click', () => go({ lv: 3, id: r.id })); pg.on('mousemove', e => U.tip(e.originalEvent, `<b>${r.n}</b><br>${fa(hs.length)} محله ثبت‌شده`)); pg.on('mouseout', () => U.tip(null));
      label(ll(r.c), r.n, null); });
    const hoods = B.D.hoods.filter(h => h.city === id);
    hoods.forEach(h => L.polygon(h.b.map(ll), { color: '#3B5BDB', weight: 1, fillOpacity: 0, dashArray: '3 3' }).on('click', () => go({ lv: 4, id: h.id })).addTo(shapes));
    drawPoints(hoods.map(h => h.id));
    if (!keep) fit(outline.getBounds(), PAD());
  }
  function drawRegion(id, keep) {
    const r = B.regionBy[id], c = B.cityBy[r.city]; fadeOthers('_');
    L.polygon(c.b.map(ll), { color: '#CBD5E1', weight: 1, fillColor: '#fff', fillOpacity: 1, interactive: false }).addTo(shapes);
    const outline = L.polygon(r.b.map(ll), { color: '#3B5BDB', weight: 2, fillColor: '#F8FAFC', fillOpacity: 1 }).addTo(shapes);
    const hoods = B.D.hoods.filter(h => h.reg === id);
    hoods.forEach(h => { const col = h.status === 'تأیید شده' ? C.hood : h.status === 'در انتظار تأیید' ? '#91A7FF' : h.status === 'برگشت برای اصلاح' ? '#FFC9C9' : '#E2E8F0';
      const pg = L.polygon(h.b.map(ll), { color: '#fff', weight: 1.5, fillColor: col, fillOpacity: .85 }).addTo(shapes);
      pg.on('click', () => go({ lv: 4, id: h.id })); pg.on('mousemove', e => U.tip(e.originalEvent, `<b>محله ${h.n}</b><br>${h.status} · مرحله ${fa(h.steps)} از ۶`)); pg.on('mouseout', () => U.tip(null));
      label(ll(h.c), h.n, null); });
    drawPoints(hoods.map(h => h.id));
    if (!keep) fit(outline.getBounds(), PAD());
  }
  function drawHood(id, keep) {
    const h = B.hoodBy[id]; fadeOthers('_');
    const sib = B.D.hoods.filter(x => x.reg === h.reg && x.id !== id);
    sib.forEach(x => L.polygon(x.b.map(ll), { color: '#CBD5E1', weight: 1, fillColor: '#F8FAFC', fillOpacity: 1 }).on('click', () => go({ lv: 4, id: x.id })).addTo(shapes));
    const outline = L.polygon(h.b.map(ll), { color: '#1E40AF', weight: 2.5, fillColor: '#F1F5F9', fillOpacity: .7 }).addTo(shapes);
    drawPoints([id]);
    if (!keep) fit(outline.getBounds(), PAD(16));
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
    if (sel) return itemPanel();
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
      extra = `<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px" class="muted">${[[C.hood, 'تأیید شده'], ['#91A7FF', 'منتظر تأیید'], ['#FFC9C9', 'برگشت‌خورده'], ['#E2E8F0', 'پیش‌نویس']].map(([c, t]) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${c};margin-inline-end:4px"></i>${t}</span>`).join('')}</div>`;
    } else {
      const h = B.hoodBy[st.id]; title = 'محله ' + h.n; prov = B.provBy[B.cityBy[h.city].p];
      cells = [['ساکنان', h.pop], ['خانوار', h.hh], ['واحد مسکونی', h.units], ['معبر', h.streets], ['ملک', h.props], ['عارضه', h.feats]];
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
        ${st.lv === 4 ? U.hoodPanel(B.hoodBy[st.id]) : ''}
        <div><div class="mini-h">نیاز به پیگیری</div>${U.attention(3, st.lv === 0 ? null : (prov && prov.id))}</div>
        ${kids.length ? `<div><div class="mini-h">${st.lv === 4 ? 'معابر این محله' : CHILD[st.lv] + '‌ها'}<span class="grow"></span><small class="muted">${fa(kids.length)}</small></div><div class="list">${kids.map((k, i) => `<button class="row" data-k="${i}"><span class="t"><b>${k.n}</b><small>${k.s}</small></span>${k.v != null ? `<span style="width:70px"><div class="bar"><i style="width:${k.v / mx * 100}%"></i></div></span><b class="num" style="width:44px;text-align:left;font-size:12.5px">${k.vs || fa(k.v)}</b>` : ''}</button>`).join('')}</div></div>` : ''}`}
        <div style="display:flex;gap:8px;margin-top:auto">${detail ? `<a class="btn pri" href="${detail}" style="flex:1">${ic('eye', 'sm')} صفحه‌ی کامل ${title}</a>` : ''}${st.lv < 4 && !empty ? `<button class="btn ghost" onclick="UI.toast('فرم «ایجاد ${CHILD[st.lv]}» باز می‌شود')" style="${detail ? '' : 'flex:1'}">${ic('plus', 'sm')} تعریف ${CHILD[st.lv]}</button>` : ''}</div>
      </div>`;
    U.$$('#ctx .crumb button').forEach(b => b.onclick = () => go(ch[+b.dataset.i]));
    U.$$('#ctx [data-k]').forEach(b => b.onclick = () => kids[+b.dataset.k].go());
  }
  function renew() {
    const el = U.$('#renew'); if (!el) return;
    let hs = B.D.hoods, name = 'کل کشور';
    if (st.lv === 1) { hs = hs.filter(h => (B.cityBy[h.city] || {}).p === st.id); name = 'استان ' + B.provBy[st.id].fa; }
    else if (st.lv === 2) { hs = hs.filter(h => h.city === st.id); name = 'شهر ' + B.cityBy[st.id].n; }
    else if (st.lv === 3) { hs = hs.filter(h => h.reg === st.id); name = B.regionBy[st.id].n + ' ' + B.cityBy[B.regionBy[st.id].city].n; }
    else if (st.lv === 4) { hs = [B.hoodBy[st.id]]; name = 'محله ' + B.hoodBy[st.id].n; }
    U.$('#renewScope').textContent = `${name} · همراه نقشه عوض می‌شود`;
    el.innerHTML = U.renewSection(hs, name);
  }
  function itemPanel() {
    const ch = chain();
    U.$('#ctx').innerHTML = `<div class="hd"><button class="backlink" id="selBack">${ic('back', 'sm')} بازگشت به ${ch[ch.length - 1].n}</button><nav class="crumb" aria-label="مسیر">${ch.map(c => `<span>${c.n}</span>`).join('<span>›</span>')}</nav></div><div class="bd">${U.itemPanel(sel.kind, sel.it)}</div>`;
    U.$('#selBack').onclick = () => { sel = null; if (selLayer) { shapes.removeLayer(selLayer); selLayer = null; } panel(); };
  }
  function legend() {
    const el = U.$('#legend');
    if (st.lv === 0) { const vals = B.provs.filter(x => x.has).map(x => x[metric]); const mx = Math.max(...vals), mn = Math.min(...vals);
      el.innerHTML = `<b style="color:var(--ink)">${METRICS.find(m => m[0] === metric)[1]}</b><div class="ramp">${U.RAMP.map(c => `<i style="background:${c}"></i>`).join('')}</div><div style="display:flex;justify-content:space-between"><span>${metric === 'completeness' ? pct(mn) : fa(mn)}</span><span>${metric === 'completeness' ? pct(mx) : fa(mx)}</span></div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><i style="width:12px;height:12px;border-radius:3px;background:#E2E8F0"></i> بدون داده (${fa(B.empty.length)} استان)</div>`; }
    else el.innerHTML = `<b style="color:var(--ink)">${st.lv === 1 ? 'رنگ شهرها: تعداد محله' : st.lv === 2 ? 'رنگ مناطق: تعداد محله' : 'لایه‌های روشن روی نقشه'}</b><div style="display:flex;flex-direction:column;gap:3px;margin-top:6px">${LAYERS.filter(l => on[l[0]]).map(l => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${l[2]};margin-inline-end:6px"></i>${l[1]}</span>`).join('')}</div>`;
  }
  /* ---------- view switch ---------- */
  function setView(v) {
    view = v; U.$('#ma').classList.toggle('is3d', v === '3d'); U.$('#ma').classList.toggle('isatl', v === 'atlas');
    const sb = U.$('#satBtn'); const wantSat = v === 'sat'; if (sb && map) { sb.classList.toggle('off', !wantSat); sb.setAttribute('aria-pressed', wantSat); if (wantSat) sat.addTo(map).bringToBack(); else map.removeLayer(sat); }
    if (v === 'atlas') drawAtlas();
    U.$$('.viewsw button').forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-selected', b.dataset.v === v); });
    U.$('#hint').style.display = v === '3d' || v === 'atlas' ? 'none' : (st.lv === 0 ? '' : 'none');
    if (v === '3d') draw3d(); else { stop(); setTimeout(() => { map.invalidateSize(); if (v !== 'atlas') go(st); }, 60); }
  }

  /* ---------- 3D (tilted extrusion) ---------- */
  const path = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
  function projector(rings, box) {
    let lat0 = 0, n = 0; rings.forEach(r => r.forEach(p => { lat0 += p[1]; n++; })); lat0 /= n;
    const k = Math.cos(lat0 * Math.PI / 180);
    const pl = ([lon, lat]) => [lon * k, -lat];
    const t = ([x, y]) => [x + y * 0.42, y * 0.56];
    const pts = rings.flat().map(p => t(pl(p)));
    const bb = U.bboxOf(pts); const s = Math.min((box[2] - box[0]) / (bb[2] - bb[0]), (box[3] - box[1]) / (bb[3] - bb[1]));
    const ox = box[0] + ((box[2] - box[0]) - (bb[2] - bb[0]) * s) / 2, oy = box[1] + ((box[3] - box[1]) - (bb[3] - bb[1]) * s) / 2;
    const P = p => { const q = t(pl(p)); return [ox + (q[0] - bb[0]) * s, oy + (q[1] - bb[1]) * s]; };
    P.pl = pl; P.bb = bb; P.fromPlane = q0 => { const q = t(q0); return [ox + (q[0] - bb[0]) * s, oy + (q[1] - bb[1]) * s]; };
    return P;
  }
  function level3() {
    if (st.lv === 0) return { k: 'country' };
    if (st.lv === 1) return { k: 'prov', id: st.id };
    const ch = chain(); return { k: 'city', id: ch[2].id, hood: st.lv === 4 ? st.id : null };
  }
  function blocks3(lv) {
    const flip = b => b.map(([a, c]) => [c, a]);
    if (lv.k === 'country') return B.provs.map(p => ({ id: p.id, n: p.short, full: p.fa, rings: U.ringsOf(p.feature), has: p.has, series: p.cum, go: () => go({ lv: 1, id: p.id }) }));
    if (lv.k === 'prov') { const pv = B.provBy[lv.id]; const cs = B.D.cities.filter(c => c.p === lv.id); const tot = cs.reduce((a, c) => a + c.hoods + c.props, 0) || 1;
      return [{ id: '_base', rings: U.ringsOf(pv.feature), base: true, has: true }].concat(cs.map(c => ({ id: c.id, n: c.n, full: 'شهر ' + c.n, rings: [flip(c.b)], has: true, series: pv.cum.map(v => Math.round(v * (c.hoods + c.props) / tot)), go: () => go({ lv: 2, id: c.id }) }))); }
    const c = B.cityBy[lv.id]; const pv = B.provBy[c.p]; const hs = B.D.hoods.filter(h => h.city === c.id); const tot = hs.reduce((a, h) => a + h.props + h.streets + 1, 0) || 1;
    return [{ id: '_base', rings: [flip(c.b)], base: true, has: true }].concat(hs.map(h => ({ id: h.id, n: h.n, full: 'محله ' + h.n, rings: [flip(h.b)], has: true, series: pv.cum.map(v => Math.round(v * (h.props + h.streets + 1) / tot)), go: () => go({ lv: 4, id: h.id }) })));
  }
  function draw3d() {
    const svg = U.$('#iso'); const r = U.$('#iso3').getBoundingClientRect(); const W = Math.max(600, r.width), H = Math.max(480, r.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const narrow = innerWidth < 760;
    const lv = level3(); const bl = blocks3(lv);
    const box = narrow ? [12, 40, W - 12, H - 40] : [36, 90, W - 420, H - 150];
    const P = projector(bl.map(b => b.rings).flat(), box);
    const th = lv.k === 'country' ? 12 : 8;
    const mx = Math.max(1, ...bl.filter(b => b.series).map(b => b.series[7]));
    let Hmax = (box[3] - box[1]) * (lv.k === 'country' ? .5 : .42);
    let sides = '', tops = '', labels = ''; const prisms = [];
    bl.forEach(b => {
      const proj = b.rings.map(rr => rr.map(P));
      const fillTop = b.base ? '#FFFFFF' : !b.has ? 'url(#h3)' : lv.k === 'country' ? '#FFFFFF' : '#F1F5F9';
      const t2 = b.base ? th + 6 : lv.k === 'country' ? th : 4;
      sides += proj.map(rr => `<path d="${path(rr.map(([x, y]) => [x, y + t2]))}" fill="${b.base ? '#CBD5E1' : '#DEE4EA'}"/>`).join('');
      tops += `<g class="${b.base ? '' : 'prov'}" data-id="${b.id}">${proj.map(rr => `<path d="${path(rr)}" fill="${fillTop}" stroke="${b.base ? '#94A3B8' : '#CBD5E1'}" stroke-width="${b.base ? 1.2 : .8}"/>`).join('')}</g>`;
      if (b.base || !b.series) return;
      const big = [...b.rings].sort((a, c) => c.length - a.length)[0]; const cc = U.centroid(big);
      const w = lv.k === 'country' ? 0.3 : (P.bb[2] - P.bb[0]) / 70;
      const lp = P(cc); prisms.push({ b, pc: P.pl(cc), w, sy: lp[1] });
      if (b.has) labels += `<text class="lab" x="${lp[0]}" y="${lp[1] + 16}" text-anchor="middle">${esc(b.n)}</text>`;
    });
    prisms.sort((a, c) => a.sy - c.sy);
    prisms.forEach(p => { const v = p.b.series[7] / mx; if (v > 0) Hmax = Math.min(Hmax, (p.sy - 44) / v); });
    cur3 = { P, prisms, mx, Hmax, bl, lv };
    svg.innerHTML = `<defs><pattern id="h3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#F8FAFC"/><line x1="0" y1="0" x2="0" y2="6" stroke="#E2E8F0" stroke-width="2"/></pattern></defs><g>${sides}</g><g>${tops}</g><g>${labels}</g><g id="prisms"></g>`;
    U.$$('#iso .prov').forEach(g => { const b = bl.find(x => x.id === g.dataset.id); if (!b) return;
      g.onmousemove = e => U.tip(e, `<b>${b.full}</b><br>${b.has ? fa(b.series[month]) + ' رکورد تا پایان ' + B.MONTHS[month] : 'هنوز داده‌ای ثبت نشده'}`); g.onmouseleave = () => U.tip(null);
      g.onclick = () => { U.tip(null); if (b.has) b.go(); }; });
    paint(month, true); months();
  }
  function prismSvg(pr, h) {
    const { P } = cur3; const [x, y] = pr.pc, w = pr.w;
    const A = P.fromPlane([x - w, y - w]), Bq = P.fromPlane([x + w, y - w]), Cq = P.fromPlane([x + w, y + w]), Dq = P.fromPlane([x - w, y + w]);
    const up = p => [p[0], p[1] - h];
    const isSel = st.lv === 4 && pr.b.id === st.id || st.lv === 1 && cur3.lv.k === 'country' && pr.b.id === st.id;
    const top = isSel ? '#2FB8B6' : '#A5B4FC', s1 = isSel ? '#0B8583' : '#6E7FD8', s2 = isSel ? '#086E6C' : '#5466C4', s3 = isSel ? '#119C9A' : '#8494E6';
    const f = (pts, c) => `<path d="${path(pts)}" fill="${c}"/>`;
    return `<g class="prism ${isSel ? 'sel' : ''}" data-id="${pr.b.id}">${f([A, Bq, up(Bq), up(A)], s1)}${f([A, Dq, up(Dq), up(A)], s3)}${f([Bq, Cq, up(Cq), up(Bq)], s2)}${f([Dq, Cq, up(Cq), up(Dq)], s1)}<path class="pt" d="${path([up(A), up(Bq), up(Cq), up(Dq)])}" fill="${top}"/>
      ${h > 16 ? `<text class="val" x="${(up(A)[0] + up(Cq)[0]) / 2}" y="${up(A)[1] - 6}" text-anchor="middle">${fa(pr.v)}</text>` : ''}</g>`;
  }
  function paint(m, instant) {
    const { prisms, mx, Hmax } = cur3; const from = prisms.map(p => p.h || 0); const to = prisms.map(p => p.b.series[m] / mx * Hmax);
    const dur = instant ? 0 : 520, t0 = performance.now();
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3);
      const g = U.$('#prisms'); if (!g) return;
      g.innerHTML = prisms.map((p, i) => { p.h = from[i] + (to[i] - from[i]) * e; p.v = p.b.series[m]; return p.h > .5 ? prismSvg(p, p.h) : ''; }).join('');
      if (k < 1) requestAnimationFrame(step); else U.$$('#prisms .prism').forEach(el => { const pr = prisms.find(p => p.b.id === el.dataset.id);
        el.onclick = () => { U.tip(null); pr.b.go(); }; el.onmousemove = e => U.tip(e, `<b>${pr.b.full}</b><br>${fa(pr.b.series[month])} رکورد تا پایان ${B.MONTHS[month]}<br><small>برای ورود بزنید</small>`); el.onmouseleave = () => U.tip(null); }); };
    requestAnimationFrame(step);
  }
  function months() {
    const mx = Math.max(...B.totals.monthly);
    U.$('#months').innerHTML = B.MONTHS.map((n, i) => `<button class="${i === month ? 'on' : i < month ? 'past' : ''}" data-i="${i}" aria-label="${n}"><i style="height:${6 + B.totals.monthly[i] / mx * 26}px"></i>${n}</button>`).join('');
    U.$$('#months button').forEach(b => b.onclick = () => { stop(); setMonth(+b.dataset.i); });
    U.$('#mlabel').textContent = B.MONTHS[month] + ' ۱۴۰۵';
  }
  function setMonth(m) { month = m; paint(m); months(); }
  function togglePlay() { if (playing) return stop(); if (month === 7) setMonth(0); U.$('#play').innerHTML = ic('pause', 'sm'); playing = setInterval(() => { if (month >= 7) return stop(); setMonth(month + 1); }, 900); }
  function stop() { clearInterval(playing); playing = null; const p = U.$('#play'); if (p) p.innerHTML = ic('play', 'sm'); }
  addEventListener('resize', () => { if (view === '3d' && U.$('#iso')) draw3d(); if (view === 'atlas' && U.$('#atl')) drawAtlas(); });
  /* ---------- atlas view: every province one equal tile, roughly in its geographic place ---------- */
  function drawAtlas() {
    const el = U.$('#atl'); if (!el) return;
    const S = 96, G = 10, W = 7 * S + 6 * G, H = 5 * S + 4 * G;
    const key = metric === 'completeness' ? 'completeness' : 'records';
    const vals = B.provs.filter(p => p.has).map(p => p[key]); const mx = Math.max(...vals), mn = Math.min(...vals);
    const selId = st.lv === 1 ? st.id : null;
    el.innerHTML = `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" role="img" aria-label="اطلس استان‌ها"><defs><pattern id="hatchA" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#F1F5F9"/><line x1="0" y1="0" x2="0" y2="7" stroke="#E2E8F0" stroke-width="2"/></pattern></defs>
      ${B.provs.map(p => { const [c, r] = p.grid; const X = c * (S + G), y = r * (S + G);
        const t = p.has ? (p[key] - mn) / ((mx - mn) || 1) : 0; const fill = p.has ? U.ramp(t * .999) : 'url(#hatchA)'; const ink = p.has ? U.inkOn(fill) : '#94A3B8';
        return `<g class="atile ${p.id === selId ? 'sel' : ''}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.fa}">
          <rect x="${X}" y="${y}" width="${S}" height="${S}" rx="14" fill="${fill}" stroke="${p.id === selId ? '#1E40AF' : p.has ? 'none' : '#E2E8F0'}" stroke-width="${p.id === selId ? 3 : 1}"/>
          <text x="${X + S - 10}" y="${y + 22}" direction="rtl" font-size="12" font-weight="700" fill="${ink}">${esc(p.short)}</text>
          ${p.has ? `<text x="${X + S - 10}" y="${y + 56}" direction="rtl" font-size="20" font-weight="800" fill="${ink}">${key === 'completeness' ? pct(p[key]) : fa(p[key])}</text>
          <rect x="${X + 10}" y="${y + S - 18}" width="${S - 20}" height="5" rx="2.5" fill="${ink === '#fff' ? 'rgba(255,255,255,.3)' : 'rgba(15,23,42,.08)'}"/><rect x="${X + 10 + (S - 20) * (1 - p.completeness / 100)}" y="${y + S - 18}" width="${(S - 20) * p.completeness / 100}" height="5" rx="2.5" fill="${ink === '#fff' ? '#fff' : '#1E40AF'}"/>`
          : `<text x="${X + S - 10}" y="${y + 56}" direction="rtl" font-size="11.5" fill="#94A3B8">بدون داده</text>`}
          ${p.pending ? `<circle cx="${X + 15}" cy="${y + 17}" r="9" fill="#3B5BDB"/><text x="${X + 15}" y="${y + 21}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${fa(p.pending)}</text>` : ''}</g>`; }).join('')}</svg>
      <div class="atl-key"><span><i style="background:#1E40AF;width:16px;height:4px"></i>نوار پایین: کامل‌بودن</span><span><i style="background:#3B5BDB;border-radius:50%"></i>منتظر تأیید</span><span><i class="empty-hatch"></i>بدون داده</span><span>غرب در چپ، شرق در راست</span></div>`;
    U.$$('#atl .atile').forEach(g => { const p = B.provBy[g.dataset.id];
      g.onclick = () => { U.tip(null); go({ lv: 1, id: p.id }); };
      g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.onclick(); } };
      g.onmousemove = e => U.tip(e, `<b>${p.fa}</b><br>${p.has ? `${fa(p.records)} رکورد · ${pct(p.completeness)} کامل` : 'هنوز داده‌ای ثبت نشده'}<br><small>برای دیدن پرونده کلیک کنید</small>`);
      g.onmouseleave = () => U.tip(null); });
  }
  window.MA = { render, destroy: () => { stop(); view = '2d'; month = 7; if (map) { map.remove(); map = null; } } };
})();
