/* Sirous map: one MapLibre instance, four views (map / satellite / 3D+time / atlas treemap). All data is inline. */
(function () {
  'use strict';
  const U = window.U, GEO = window.GEO, SAT = window.SAT, S = window.S;
  const M = window.M = {};
  const COND = { new: { t: 'نوساز', c: '#3FAE5A', c3: '#46B562' }, std: { t: 'استاندارد', c: '#5AAEF0', c3: '#62B2F0' }, weak: { t: 'کم‌دوام', c: '#F5B23E', c3: '#F6B13A' }, ruin: { t: 'مخروبه', c: '#EC6161', c3: '#E85B5B' } };
  const USE = { res: { t: 'مسکونی', c: '#F1CF95' }, com: { t: 'تجاری', c: '#5B8DEF' }, srv: { t: 'خدماتی', c: '#22B5B2' } };
  const HAZ = { fault: { t: 'حریم گسل', c: '#E03131' }, flood: { t: 'حریم رودخانه و مسیل', c: '#3B82F6' }, slope: { t: 'ناپایداری شیب', c: '#F59F00' }, power: { t: 'خطوط انتقال نیرو', c: '#2F9E44' } };
  const POI = {
    place_of_worship: ['مذهبی', 'mosque', '#0CA5A3'], school: ['آموزشی', 'edu', '#4C6EF5'], college: ['آموزشی', 'edu', '#4C6EF5'], kindergarten: ['آموزشی', 'edu', '#4C6EF5'],
    hospital: ['درمانی', 'health', '#E03131'], clinic: ['درمانی', 'health', '#E03131'], pharmacy: ['درمانی', 'health', '#E03131'], doctors: ['درمانی', 'health', '#E03131'],
    bank: ['مالی', 'bank', '#1E40AF'], atm: ['مالی', 'bank', '#1E40AF'], park: ['فضای سبز', 'green', '#2F9E44'], playground: ['فضای سبز', 'green', '#2F9E44'], garden: ['فضای سبز', 'green', '#2F9E44'],
    fitness_centre: ['ورزشی', 'sport', '#F76707'], sports_centre: ['ورزشی', 'sport', '#F76707'], fire_station: ['امدادی', 'fire', '#E8590C'], parking: ['پارکینگ', 'car', '#64748B'], fuel: ['پارکینگ', 'car', '#64748B'],
    townhall: ['اداری', 'build', '#475569'], public_bath: ['تاریخی', 'star', '#B7791F'], hotel: ['اقامتی', 'home', '#64748B']
  };
  const poiInfo = k => POI[k] || ['تجاری و خرده‌فروشی', 'cart', '#F59F00'];
  M.COND = COND; M.USE = USE; M.HAZ = HAZ; M.poiInfo = poiInfo;

  const parcels = GEO.parcels.features;
  // planned renewal (sample): ruins and part of the weak stock get rebuilt 1406–1410 within the 3,000-unit capacity
  let sd = 77; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  parcels.forEach(f => { const p = f.properties; if (p.u !== 'srv' && (p.c === 'ruin' || (p.c === 'weak' && r() < 0.35))) p.rn = 1406 + Math.floor(r() * 5); p.h = p.f * 3.3; p.code = 'SR-' + String(1001 + p.i); });
  const hazPolys = GEO.haz.features;
  function pip(pt, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
  function inGeom(pt, g) { const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; return polys.some(p => pip(pt, p[0]) && !p.slice(1).some(h => pip(pt, h))); }
  function centroid(g) { const ring = (g.type === 'Polygon' ? g.coordinates : g.coordinates[0])[0]; let x = 0, y = 0; ring.forEach(p => { x += p[0]; y += p[1]; }); return [x / ring.length, y / ring.length]; }
  parcels.forEach(f => { const c = centroid(f.geometry); f.properties.cx = c; f.properties.hz = hazPolys.filter(h => inGeom(c, h.geometry)).map(h => h.properties.k).join(','); });
  M.parcels = parcels;
  M.pois = GEO.pois.filter(p => p.n || POI[p.k]).map((p, i) => ({ type: 'Feature', id: i, geometry: { type: 'Point', coordinates: p.ll }, properties: { k: p.k, n: p.n, ic: 'poi-' + (POI[p.k] ? p.k : 'shop'), lb: p.n ? 'pl-' + i : '', cat: poiInfo(p.k)[0], i } }));

  const st = M.st = { view: 'map', color: 'cond', cond: new Set(Object.keys(COND)), use: new Set(Object.keys(USE)), fl: [1, 7], yb: [1310, 1404], year: 1404, play: null, satIn3d: false, narrowHL: false,
    lay: { bound: true, roads: true, labels: true, pois: true, haz: false, parcels: true, green: true } };
  const subs = []; M.on = fn => subs.push(fn); const emit = () => subs.forEach(fn => fn(st));

  function filtered() { return parcels.filter(f => { const p = f.properties; return st.cond.has(p.c) && st.use.has(p.u) && p.f >= st.fl[0] && p.f <= st.fl[1] && p.yb >= st.yb[0] && p.yb <= st.yb[1]; }); }
  M.filtered = filtered;
  function pfilter() {
    const a = ['all', ['in', ['get', 'c'], ['literal', [...st.cond]]], ['in', ['get', 'u'], ['literal', [...st.use]]], ['>=', ['get', 'f'], st.fl[0]], ['<=', ['get', 'f'], st.fl[1]], ['>=', ['get', 'yb'], st.yb[0]], ['<=', ['get', 'yb'], st.yb[1]]];
    return a;
  }
  function colorExpr(three) {
    if (st.color === 'use') return ['match', ['get', 'u'], 'res', USE.res.c, 'com', USE.com.c, USE.srv.c];
    if (st.color === 'floors') return ['interpolate', ['linear'], ['get', 'f'], 1, '#DCEFF5', 2, '#A9DCE6', 3, '#6CC4CF', 4, '#2FA8B4', 5, '#1E86A8', 6, '#2D5FB6', 7, '#1E40AF'];
    if (st.color === 'year') return ['interpolate', ['linear'], ['get', 'yb'], 1310, '#F28A3C', 1340, '#F7C46B', 1365, '#E9EDF2', 1385, '#8CC3F2', 1404, '#2F5FD0'];
    return ['match', ['get', 'c'], 'new', COND.new[three ? 'c3' : 'c'], 'std', COND.std[three ? 'c3' : 'c'], 'weak', COND.weak[three ? 'c3' : 'c'], COND.ruin[three ? 'c3' : 'c']];
  }

  /* ---------- label images (canvas → addImage) so Persian text renders without a glyph server ---------- */
  function textImage(text, o) {
    o = Object.assign({ size: 12, weight: 700, color: '#334155', halo: '#ffffff', pad: 3, bg: null, haloW: 3.2 }, o);
    const pr = 2, cv = document.createElement('canvas'), x = cv.getContext('2d');
    const font = `${o.weight} ${o.size * pr}px Vazirmatn`;
    x.font = font; const w = Math.ceil(x.measureText(text).width) + (o.pad * 2 + 6) * pr, h = Math.ceil(o.size * 1.9 * pr);
    cv.width = w; cv.height = h; x.font = font; x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (o.bg) { x.fillStyle = o.bg; const rr = h / 2; x.beginPath(); x.roundRect(1, 1, w - 2, h - 2, rr); x.fill(); x.strokeStyle = o.bd || 'rgba(0,0,0,.08)'; x.lineWidth = 1.5; x.stroke(); }
    else { x.lineJoin = 'round'; x.strokeStyle = o.halo; x.lineWidth = o.haloW * pr; x.strokeText(text, w / 2, h / 2 + pr); }
    x.fillStyle = o.color; x.fillText(text, w / 2, h / 2 + pr);
    return { img: x.getImageData(0, 0, w, h), pr };
  }
  function iconImage(kind) {
    const [, ic, col] = poiInfo(kind), pr = 2, s = 26 * pr, cv = document.createElement('canvas'), x = cv.getContext('2d');
    cv.width = s; cv.height = s;
    x.beginPath(); x.arc(s / 2, s / 2, s / 2 - 2 * pr, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    x.beginPath(); x.arc(s / 2, s / 2, s / 2 - 4 * pr, 0, Math.PI * 2); x.fillStyle = col; x.fill();
    const p = new Path2D(); const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tmp.innerHTML = U.P[ic];
    x.save(); x.translate(s / 2 - 7.2 * pr, s / 2 - 7.2 * pr); x.scale(0.6 * pr, 0.6 * pr); x.strokeStyle = '#fff'; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    tmp.querySelectorAll('path,circle,rect,ellipse').forEach(n => {
      let d;
      if (n.tagName === 'path') d = n.getAttribute('d');
      else if (n.tagName === 'circle') { const cx = +n.getAttribute('cx'), cy = +n.getAttribute('cy'), rr = +n.getAttribute('r'); d = `M${cx - rr},${cy}a${rr},${rr} 0 1,0 ${rr * 2},0a${rr},${rr} 0 1,0 -${rr * 2},0`; }
      else if (n.tagName === 'ellipse') { const cx = +n.getAttribute('cx'), cy = +n.getAttribute('cy'), rx = +n.getAttribute('rx'), ry = +n.getAttribute('ry'); d = `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0`; }
      else { const X = +n.getAttribute('x'), Y = +n.getAttribute('y'), W = +n.getAttribute('width'), H = +n.getAttribute('height'); d = `M${X},${Y}h${W}v${H}h-${W}z`; }
      const pp = new Path2D(d); if (n.getAttribute('fill') === 'currentColor') { x.fillStyle = '#fff'; x.fill(pp); } else x.stroke(pp);
    });
    x.restore();
    x.lineWidth = 1; p;
    return { img: x.getImageData(0, 0, s, s), pr };
  }

  /* ---------- build ---------- */
  M.init = function (el, onReady) {
    const B = GEO.meta.bbox;
    const map = M.map = new maplibregl.Map({
      container: el, attributionControl: false, antialias: true, fadeDuration: 0, maxPitch: 70,
      style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#EDF0F3' } }] },
      bounds: [[B[0] - 0.0012, B[1] - 0.0006], [B[2] + 0.0012, B[3] + 0.0006]], fitBoundsOptions: { padding: 30 },
      maxBounds: [[51.4205, 35.6630], [51.4455, 35.6820]], minZoom: 14.6, maxZoom: 19.4,
      cooperativeGestures: true,
      locale: { 'CooperativeGesturesHandler.WindowsHelpText': 'برای بزرگ‌نمایی نقشه، Ctrl را نگه دارید و اسکرول کنید', 'CooperativeGesturesHandler.MacHelpText': 'برای بزرگ‌نمایی نقشه، ⌘ را نگه دارید و اسکرول کنید', 'CooperativeGesturesHandler.MobileHelpText': 'برای جابه‌جایی نقشه از دو انگشت استفاده کنید' }
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap · تصویر ماهواره: Esri, Maxar' }), 'top-left');
    M.home = () => map.fitBounds([[B[0] - 0.0012, B[1] - 0.0006], [B[2] + 0.0012, B[3] + 0.0006]], { padding: 30, pitch: st.view === '3d' ? 58 : 0, bearing: st.view === '3d' ? -24 : 0, duration: 600 });

    // decode satellite mosaics while the style loads
    const satReady = Promise.all(['ctx', 'core'].map(k => new Promise(res => { const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext('2d').drawImage(im, 0, 0); res([k, cv]); }; im.onerror = () => res([k, null]); im.src = SAT[k]; })));
    const fontReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('700 12px Vazirmatn'), document.fonts.load('600 12px Vazirmatn')]).catch(() => 0) : Promise.resolve();

    map.on('load', async () => {
      const [sats] = await Promise.all([satReady, fontReady]);
      sats.forEach(([k, cv]) => { if (!cv) return; map.addSource('sat-' + k, { type: 'canvas', canvas: cv, coordinates: SAT.meta[k].coords, animate: false }); });
      map.addSource('ctx', { type: 'geojson', data: GEO.ctx });
      map.addSource('green', { type: 'geojson', data: GEO.green });
      map.addSource('roads', { type: 'geojson', data: { type: 'FeatureCollection', features: GEO.roads.features.filter(f => f.properties.h !== 'busway') } });
      map.addSource('parcels', { type: 'geojson', data: GEO.parcels, promoteId: 'i' });
      map.addSource('bound', { type: 'geojson', data: GEO.bound });
      map.addSource('mask', { type: 'geojson', data: GEO.mask });
      map.addSource('haz', { type: 'geojson', data: GEO.haz });
      const poiF = M.pois;
      map.addSource('pois', { type: 'geojson', data: { type: 'FeatureCollection', features: poiF } });

      // images
      const kinds = new Set(poiF.map(f => f.properties.k));
      kinds.forEach(k => { const im = iconImage(POI[k] ? k : 'shop'); const id = 'poi-' + (POI[k] ? k : 'shop'); if (!map.hasImage(id)) map.addImage(id, im.img, { pixelRatio: im.pr }); });
      poiF.forEach(f => { if (f.properties.n) { const im = textImage(f.properties.n, { size: 11, weight: 600, color: '#475569' }); map.addImage(f.properties.lb, im.img, { pixelRatio: im.pr }); } });
      const rnames = new Set();
      GEO.roads.features.forEach(f => { const p = f.properties; if (p.n && p.h !== 'busway' && !/^(اول|دوم|سوم|چهارم|یکم|پنجم|فرعی)$/.test(p.n)) rnames.add(p.n); });
      const big = new Set(['مصطفی خمینی', 'مولوی', 'ری', 'پانزده خرداد', 'خیابان ری', 'بلوار قیام', 'خراسان']);
      [...rnames].forEach(n => { const im = textImage(n, { size: big.has(n) ? 12.5 : 11, weight: big.has(n) ? 800 : 600, color: big.has(n) ? '#1E293B' : '#475569' }); map.addImage('rl-' + n, im.img, { pixelRatio: im.pr }); });
      const satLbl = new Set(); [...rnames].forEach(n => { const im = textImage(n, { size: big.has(n) ? 12.5 : 11, weight: 700, color: '#ffffff', halo: 'rgba(15,23,42,.75)', haloW: 3 }); map.addImage('rs-' + n, im.img, { pixelRatio: im.pr }); satLbl.add(n); });

      const L = (o, before) => map.addLayer(o, before);
      // base
      if (map.getSource('sat-ctx')) L({ id: 'sat-ctx', type: 'raster', source: 'sat-ctx', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-saturation': -0.08 } });
      if (map.getSource('sat-core')) L({ id: 'sat-core', type: 'raster', source: 'sat-core', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-saturation': -0.05 } });
      L({ id: 'ctx', type: 'fill', source: 'ctx', paint: { 'fill-color': '#E2E6EB', 'fill-outline-color': '#D5DBE2' } });
      L({ id: 'green', type: 'fill', source: 'green', paint: { 'fill-color': ['match', ['get', 'k'], 'water', '#BFDDF7', '#CBE8C9'], 'fill-outline-color': '#A8D5A4' } });
      // roads: casing then fill, by class
      const W = { main: [14, 3.5, 17, 16, 19, 46], sec: [14, 2.2, 17, 10, 19, 30], loc: [14, 1, 17, 6, 19, 18], nar: [14, .5, 17, 3, 19, 9] };
      const wexp = (k, add) => ['interpolate', ['exponential', 1.6], ['zoom'], W[k][0], W[k][1] + add, W[k][2], W[k][3] + add, W[k][4], W[k][5] + add];
      ['nar', 'loc', 'sec', 'main'].forEach(k => L({ id: 'rc-' + k, type: 'line', source: 'roads', filter: ['==', ['get', 'k'], k], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': k === 'main' ? '#C9D1DC' : '#D3D9E1', 'line-width': wexp(k, 1.6) } }));
      ['nar', 'loc', 'sec', 'main'].forEach(k => L({ id: 'rf-' + k, type: 'line', source: 'roads', filter: ['==', ['get', 'k'], k], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': k === 'main' ? '#FFFFFF' : k === 'sec' ? '#FFFDF7' : '#FFFFFF', 'line-width': wexp(k, 0) } }));
      L({ id: 'r-narrow', type: 'line', source: 'roads', filter: ['all', ['==', ['get', 'k'], 'nar'], ['==', ['get', 'in'], 1]], layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#F59F00', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 17, 4, 19, 9] } });
      // hazards
      L({ id: 'haz-f', type: 'fill', source: 'haz', layout: { visibility: 'none' }, paint: { 'fill-color': ['match', ['get', 'k'], 'fault', HAZ.fault.c, 'flood', HAZ.flood.c, 'slope', HAZ.slope.c, HAZ.power.c], 'fill-opacity': 0.2 } });
      L({ id: 'haz-l', type: 'line', source: 'haz', layout: { visibility: 'none' }, paint: { 'line-color': ['match', ['get', 'k'], 'fault', HAZ.fault.c, 'flood', HAZ.flood.c, 'slope', HAZ.slope.c, HAZ.power.c], 'line-width': 1.6, 'line-dasharray': [3, 2] } });
      // parcels 2D
      L({ id: 'p-fill', type: 'fill', source: 'parcels', filter: pfilter(), paint: { 'fill-color': colorExpr(), 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.86] } });
      L({ id: 'p-line', type: 'line', source: 'parcels', filter: pfilter(), paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.3, 18, 1.2], 'line-opacity': 0.9 } });
      L({ id: 'p-dim', type: 'fill', source: 'parcels', filter: ['!', pfilter()], paint: { 'fill-color': '#D9DEE5', 'fill-opacity': 0.55 } });
      // 3D
      L({ id: 'p-3d', type: 'fill-extrusion', source: 'parcels', filter: pfilter(), layout: { visibility: 'none' }, paint: { 'fill-extrusion-color': colorExpr(true), 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.92, 'fill-extrusion-vertical-gradient': true } });
      L({ id: 'ctx-3d', type: 'fill-extrusion', source: 'ctx', layout: { visibility: 'none' }, paint: { 'fill-extrusion-color': '#E4E8ED', 'fill-extrusion-height': 7, 'fill-extrusion-opacity': 0.75 } });
      // mask + boundary
      L({ id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#F3F5F8', 'fill-opacity': 0.42 } });
      L({ id: 'b-glow', type: 'line', source: 'bound', paint: { 'line-color': '#00ADAB', 'line-width': 9, 'line-opacity': 0.16, 'line-blur': 3 } });
      L({ id: 'b-line', type: 'line', source: 'bound', paint: { 'line-color': '#0A9593', 'line-width': 2.4, 'line-dasharray': [2.4, 1.4] } });
      L({ id: 'p-hl', type: 'line', source: 'parcels', filter: ['==', ['get', 'i'], -1], paint: { 'line-color': '#1E40AF', 'line-width': 2.6 } });
      // labels
      L({ id: 'r-lbl', type: 'symbol', source: 'roads', filter: ['in', ['get', 'n'], ['literal', [...rnames]]], layout: { 'icon-image': ['concat', 'rl-', ['get', 'n']], 'symbol-placement': 'line', 'symbol-spacing': 260, 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'viewport', 'icon-keep-upright': true, 'icon-allow-overlap': false, 'icon-padding': 2, 'symbol-sort-key': ['match', ['get', 'k'], 'main', 0, 'sec', 1, 2] }, paint: { 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 14.8, ['match', ['get', 'k'], 'main', 1, 0], 15.6, 1] } });
      L({ id: 'r-lbl-s', type: 'symbol', source: 'roads', filter: ['in', ['get', 'n'], ['literal', [...rnames]]], layout: { visibility: 'none', 'icon-image': ['concat', 'rs-', ['get', 'n']], 'symbol-placement': 'line', 'symbol-spacing': 260, 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'viewport', 'icon-keep-upright': true, 'icon-padding': 2, 'symbol-sort-key': ['match', ['get', 'k'], 'main', 0, 'sec', 1, 2] } });
      L({ id: 'poi-i', type: 'symbol', source: 'pois', layout: { 'icon-image': ['get', 'ic'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 0.72, 18, 1], 'icon-allow-overlap': ['step', ['zoom'], false, 17, true], 'symbol-sort-key': ['match', ['get', 'cat'], 'آموزشی', 0, 'درمانی', 0, 'مذهبی', 1, 2] } });
      L({ id: 'poi-l', type: 'symbol', source: 'pois', filter: ['!=', ['get', 'lb'], ''], minzoom: 16.6, layout: { 'icon-image': ['get', 'lb'], 'icon-offset': [0, 21], 'icon-optional': false, 'icon-padding': 1 } });

      bindInteractions(map);
      M.ready = true;
      setView(st.view, true);
      apply();
      updScale();
      onReady && onReady();
      emit();
    });
    map.on('move', updScale);
    return map;
  };

  let hoverId = null;
  function bindInteractions(map) {
    const tip = U.$('.mtip');
    const pl = ['p-fill', 'p-3d'];
    pl.forEach(id => {
      map.on('mousemove', id, e => {
        const f = e.features[0]; if (!f) return;
        if (hoverId !== null && hoverId !== f.id) map.setFeatureState({ source: 'parcels', id: hoverId }, { hover: false });
        hoverId = f.id; map.setFeatureState({ source: 'parcels', id: hoverId }, { hover: true });
        map.setFilter('p-hl', ['==', ['get', 'i'], f.properties.i]);
        map.getCanvas().style.cursor = 'pointer';
        const p = f.properties, c = COND[p.c], u = USE[p.u] || { t: 'زمین بایر' };
        tip.innerHTML = `<b><i style="background:${c.c}"></i>پلاک ${p.code ? toFa(p.code.replace('SR-', '')) : ''} · ${u.t}</b><div class="r"><span>وضعیت ابنیه</span><span>${c.t}</span></div><div class="r"><span>طبقات</span><span>${U.fi(p.f)}</span></div><div class="r"><span>سال ساخت</span><span>${U.fa(String(p.yb).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]))}</span></div><div class="r"><span>مساحت</span><span>${U.fi(p.a)} مترمربع</span></div>`;
        tip.style.display = 'block';
        const W = map.getContainer().clientWidth;
        const x = e.point.x, y = e.point.y;
        tip.style.left = (x > W - 230 ? x - 206 : x + 16) + 'px'; tip.style.top = (y + 16) + 'px';
      });
      map.on('mouseleave', id, () => { if (hoverId !== null) map.setFeatureState({ source: 'parcels', id: hoverId }, { hover: false }); hoverId = null; map.setFilter('p-hl', ['==', ['get', 'i'], -1]); tip.style.display = 'none'; map.getCanvas().style.cursor = ''; });
      map.on('click', id, e => { if (map.queryRenderedFeatures(e.point, { layers: ['poi-i'] }).length) return; showParcel(e.features[0].properties.i); });
    });
    map.on('mouseenter', 'poi-i', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'poi-i', () => { map.getCanvas().style.cursor = ''; });
    map.on('click', 'poi-i', e => { const f = e.features[0]; showPoi(f.properties.i); });
  }

  const toFa = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  M.toFa = toFa;
  function showParcel(i) {
    const f = parcels[i], p = f.properties, c = COND[p.c], u = USE[p.u] || { t: 'زمین بایر' };
    const hz = p.hz ? p.hz.split(',').map(k => `<span class="badge b-er" style="background:${HAZ[k].c}1a;color:${HAZ[k].c}">${HAZ[k].t}</span>`).join(' ') : '<span class="badge b-ok">خارج از پهنه‌های مخاطره</span>';
    const pri = Math.min(100, Math.round(({ ruin: 62, weak: 44, std: 18, new: 6 })[p.c] + (p.hz ? p.hz.split(',').length * 14 : 0) + (p.yb < 1340 ? 10 : 0)));
    const pg = pri >= 60 ? 'red' : pri >= 35 ? 'amber' : 'green';
    det(`<div class="hd"><span class="ii" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,${c.c}99,${c.c})">${U.ic(p.u === 'com' ? 'shop' : p.u === 'srv' ? 'build' : 'home', 's')}</span><div><b>پلاک ${toFa(p.code.replace('SR-', ''))}</b><small>${u.t} · ${c.t}</small></div><button class="x" data-x>${U.ic('x', 's')}</button></div>
      <div class="bd"><div class="kv"><div><small>طبقات</small><b>${U.fi(p.f)} طبقه</b></div><div><small>ارتفاع تقریبی</small><b>${U.fa(p.h, 1)} متر</b></div><div><small>سال ساخت</small><b>${toFa(p.yb)}</b></div><div><small>مساحت عرصه</small><b>${U.fi(p.a)} مترمربع</b></div></div>
      <div style="margin:10px 0 6px;font-size:11.5px;color:var(--tx3);font-weight:600">پهنه‌ی مخاطره</div><div style="display:flex;gap:6px;flex-wrap:wrap">${hz}</div>
      <div style="margin:12px 0 4px;display:flex;justify-content:space-between;font-size:11.5px"><span style="color:var(--tx3);font-weight:600">اولویت نوسازی (برآورد)</span><b>${U.fi(pri)} از ۱۰۰</b></div><div class="kp" style="padding:0;border:0;box-shadow:none"><div class="bar" style="margin:0"><i style="width:${pri}%;background:${U.grad(pg, '90deg')}"></i></div></div>
      ${p.rn ? `<div class="note" style="margin-top:10px">${U.ic('build', 's')}<span>در برنامه‌ی نوسازی نمونه، سال ${toFa(p.rn)}</span></div>` : ''}
      <div class="ft"><button class="btn sm" data-zoom>${U.ic('target', 'xs')}بزرگ‌نمایی</button><button class="btn sm gh" data-same>${U.ic('filter', 'xs')}فقط «${c.t}»</button></div></div>`);
    const el = U.$('.mdet');
    el.querySelector('[data-zoom]').onclick = () => M.map.easeTo({ center: p.cx, zoom: 18.6, duration: 600 });
    el.querySelector('[data-same]').onclick = () => { st.cond = new Set([p.c]); apply(); emit(); };
    M.map.setFilter('p-hl', ['==', ['get', 'i'], p.i]);
  }
  function showPoi(i) {
    const f = M.pois[i], p = f.properties, [cat, ic, col] = poiInfo(p.k);
    det(`<div class="hd"><span style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:#fff;background:${col}">${U.ic(ic, 's')}</span><div><b>${U.esc(p.n || cat)}</b><small>${cat}</small></div><button class="x" data-x>${U.ic('x', 's')}</button></div>
      <div class="bd"><div class="kv"><div><small>دسته</small><b>${cat}</b></div><div><small>منبع</small><b>OpenStreetMap</b></div></div><div class="ft"><button class="btn sm" data-zoom>${U.ic('target', 'xs')}بزرگ‌نمایی</button></div></div>`);
    U.$('.mdet [data-zoom]').onclick = () => M.map.easeTo({ center: f.geometry.coordinates, zoom: 18.4, duration: 600 });
  }
  function det(html) { const el = U.$('.mdet'); el.innerHTML = html; el.classList.add('on'); el.querySelector('[data-x]').onclick = () => { el.classList.remove('on'); M.map.setFilter('p-hl', ['==', ['get', 'i'], -1]); }; }
  M.showParcel = showParcel; M.showPoi = showPoi;
  M.flyPoi = i => { const f = M.pois[i]; if (!f) return; if (st.view === 'atlas') setView('map'); M.map.easeTo({ center: f.geometry.coordinates, zoom: 18.2, duration: 700 }); showPoi(i); };

  function vis(id, on) { if (M.map.getLayer(id)) M.map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); }
  function apply() {
    if (!M.ready) return;
    const map = M.map, v = st.view, three = v === '3d', sat = v === 'sat' || (three && st.satIn3d);
    const pf = pfilter();
    let f3 = pf;
    if (three) f3 = ['all', pf, ['<=', ['get', 'yb'], st.year]];
    ['p-fill', 'p-line'].forEach(id => map.setFilter(id, pf));
    map.setFilter('p-dim', ['!', pf]);
    map.setFilter('p-3d', f3);
    map.setPaintProperty('p-fill', 'fill-color', colorExpr());
    const ce = colorExpr(true);
    if (three && st.year > 1405) {
      map.setPaintProperty('p-3d', 'fill-extrusion-color', ['case', ['all', ['has', 'rn'], ['<=', ['get', 'rn'], st.year]], '#3CC6C3', ce]);
      map.setPaintProperty('p-3d', 'fill-extrusion-height', ['case', ['all', ['has', 'rn'], ['<=', ['get', 'rn'], st.year]], 16.5, ['get', 'h']]);
    } else { map.setPaintProperty('p-3d', 'fill-extrusion-color', ce); map.setPaintProperty('p-3d', 'fill-extrusion-height', ['get', 'h']); }
    vis('sat-ctx', sat); vis('sat-core', sat);
    vis('ctx', !sat); vis('green', !sat && st.lay.green);
    ['nar', 'loc', 'sec', 'main'].forEach(k => { vis('rc-' + k, !sat && st.lay.roads); vis('rf-' + k, !sat && st.lay.roads); });
    vis('r-narrow', st.narrowHL);
    vis('p-fill', !three && st.lay.parcels); vis('p-line', !three && st.lay.parcels); vis('p-dim', !three && st.lay.parcels);
    map.setPaintProperty('p-fill', 'fill-opacity', sat ? ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.5] : ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.86]);
    map.setPaintProperty('p-line', 'line-opacity', sat ? 0.55 : 0.9);
    map.setPaintProperty('p-dim', 'fill-opacity', sat ? 0 : 0.55);
    vis('p-3d', three && st.lay.parcels); vis('ctx-3d', three && !sat);
    vis('haz-f', st.lay.haz); vis('haz-l', st.lay.haz);
    map.setPaintProperty('mask', 'fill-opacity', sat ? 0.32 : 0.42);
    map.setPaintProperty('mask', 'fill-color', sat ? '#0F172A' : '#F3F5F8');
    map.setPaintProperty('b-line', 'line-color', sat ? '#FFFFFF' : '#0A9593');
    vis('b-line', st.lay.bound); vis('b-glow', st.lay.bound); vis('mask', st.lay.bound);
    vis('r-lbl', st.lay.labels && !sat); vis('r-lbl-s', st.lay.labels && sat);
    vis('poi-i', st.lay.pois); vis('poi-l', st.lay.pois && !three);
    map.setPaintProperty('ctx', 'fill-color', '#E2E6EB');
    legend(); timeCount();
  }
  M.apply = () => { apply(); emit(); };

  function setView(v, silent) {
    const prev = st.view; st.view = v;
    U.$$('.vsw button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    const atlas = U.$('.atlas'); atlas.classList.toggle('on', v === 'atlas');
    U.$('.tline').classList.toggle('on', v === '3d');
    U.$('.lgd').style.display = v === 'atlas' ? 'none' : '';
    U.$('.zc').style.display = v === 'atlas' ? 'none' : '';
    U.$('.msearch').style.display = v === 'atlas' ? 'none' : '';
    if (v === 'atlas') { M.atlas && M.atlas.show(); const d = U.$('.mdet'); if (d) d.classList.remove('on'); const tp = U.$('.mtip'); if (tp) tp.style.display = 'none'; }
    if (!M.ready) return;
    if (v === '3d' && prev !== '3d') M.map.easeTo({ pitch: 58, bearing: -24, zoom: Math.max(M.map.getZoom(), 16.2), duration: silent ? 0 : 650 });
    if (v !== '3d' && v !== 'atlas' && (M.map.getPitch() > 1 || Math.abs(M.map.getBearing()) > 1)) M.map.easeTo({ pitch: 0, bearing: 0, duration: silent ? 0 : 500 });
    if (v !== '3d') stopPlay();
    apply(); emit();
  }
  M.setView = setView;

  /* ---------- legend ---------- */
  function legend() {
    const el = U.$('.lgd'); if (!el) return;
    const cnt = {}; filtered().forEach(f => { const k = st.color === 'use' ? f.properties.u : f.properties.c; cnt[k] = (cnt[k] || 0) + 1; });
    let h = '';
    if (st.color === 'cond') h = `<div class="lt"><span>وضعیت ابنیه</span><span class="muted">پلاک</span></div>` + Object.entries(COND).map(([k, o]) => `<div class="li ${st.cond.has(k) ? '' : 'off'}" data-lc="${k}"><i style="background:${o.c}"></i>${o.t}<b>${U.fi(cnt[k] || 0)}</b></div>`).join('');
    else if (st.color === 'use') h = `<div class="lt"><span>کاربری</span><span class="muted">پلاک</span></div>` + Object.entries(USE).map(([k, o]) => `<div class="li ${st.use.has(k) ? '' : 'off'}" data-lu="${k}"><i style="background:${o.c}"></i>${o.t}<b>${U.fi(cnt[k] || 0)}</b></div>`).join('');
    else if (st.color === 'floors') h = `<div class="lt"><span>تعداد طبقات</span></div><div class="ramp" style="background:linear-gradient(90deg,#1E40AF,#2FA8B4,#A9DCE6,#DCEFF5)"></div><div class="rl"><span>۷</span><span>۴</span><span>۱</span></div>`;
    else h = `<div class="lt"><span>سال ساخت</span></div><div class="ramp" style="background:linear-gradient(90deg,#2F5FD0,#8CC3F2,#E9EDF2,#F7C46B,#F28A3C)"></div><div class="rl"><span>۱۴۰۴</span><span>۱۳۶۵</span><span>۱۳۱۰</span></div>`;
    if (st.view === '3d' && st.year > 1405) h += `<div class="li" style="margin-top:4px"><i style="background:#3CC6C3"></i>نوسازی برنامه‌ریزی‌شده</div>`;
    const ex = [];
    if (st.lay.haz) ex.push(...Object.values(HAZ).map(o => `<div class="li"><i style="background:${o.c}33;border:1.5px dashed ${o.c}"></i>${o.t}</div>`));
    if (st.narrowHL) ex.push(`<div class="li"><i class="ln" style="background:#F59F00"></i>معابر کمتر از ۶ متر</div>`);
    ex.push(`<div class="li"><i class="ln" style="background:${st.view === 'sat' ? '#94A3B8' : '#0A9593'}"></i>مرز محله</div>`);
    el.innerHTML = h + `<div style="border-top:1px dashed var(--ln);margin-top:6px;padding-top:6px">${ex.join('')}</div>`;
  }
  M.legend = legend;

  function updScale() {
    const el = U.$('.scl'); if (!el || !M.map) return;
    const z = M.map.getZoom(), lat = M.map.getCenter().lat;
    const mpp = 40075016.686 * Math.cos(lat * Math.PI / 180) / (512 * Math.pow(2, z));
    const nice = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
    let d = nice[0]; for (const n of nice) if (n / mpp <= 110) d = n;
    el.innerHTML = `<i style="width:${Math.round(d / mpp)}px"></i>${toFa(d)} متر`;
  }

  /* ---------- time ---------- */
  function timeCount() {
    const el = U.$('.tline .cnt'); if (!el) return;
    const fs = filtered().filter(f => f.properties.yb <= st.year);
    const rn = st.year > 1405 ? fs.filter(f => f.properties.rn && f.properties.rn <= st.year).length : 0;
    el.innerHTML = st.year > 1405 ? `<b>${U.fi(rn)}</b>پلاک نوسازی‌شده` : `<b>${U.fi(fs.length)}</b>پلاک ساخته‌شده`;
    U.$('.tline .yr').textContent = toFa(st.year);
    const lab = U.$('.tline .tph'); if (lab) lab.textContent = st.year > 1405 ? 'پیش‌بینی نوسازی (نمونه)' : 'روند ساخت بر اساس سال ساخت';
  }
  function stopPlay() { if (st.play) { clearInterval(st.play); st.play = null; const b = U.$('.tline .play'); if (b) b.innerHTML = U.ic('play', 's'); } }
  M.setYear = y => { st.year = y; const i = U.$('.tline input'); if (i) i.value = y; apply(); };
  M.togglePlay = () => {
    if (st.play) return stopPlay();
    if (st.year >= 1410) M.setYear(1310);
    U.$('.tline .play').innerHTML = U.ic('pause', 's');
    st.play = setInterval(() => { if (st.year >= 1410) return stopPlay(); M.setYear(st.year + (st.year < 1340 ? 3 : st.year < 1400 ? 2 : 1)); }, 110);
  };

  /* ---------- search index ---------- */
  M.index = function () {
    const out = [];
    const seen = new Map();
    GEO.roads.features.forEach(f => { const p = f.properties; if (!p.n || p.h === 'busway' || /^(اول|دوم|سوم|چهارم|یکم|پنجم|فرعی)$/.test(p.n)) return; const c = f.geometry.coordinates; const mid = c[Math.floor(c.length / 2)]; const L = p.L || 0; if (!seen.has(p.n) || seen.get(p.n).L < L) seen.set(p.n, { t: p.n, s: p.in ? 'معبر داخل محله' : 'معبر پیرامون', c: mid, L, k: 'road' }); });
    out.push(...seen.values());
    M.pois.forEach(f => { if (f.properties.n) out.push({ t: f.properties.n, s: f.properties.cat, c: f.geometry.coordinates, k: 'poi', i: f.properties.i }); });
    const ring = GEO.bound.geometry.coordinates[0], B = GEO.meta.bbox;
    const near = (x, y) => ring.reduce((a, p) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(a[0] - x, a[1] - y) ? p : a), ring[0]);
    const lm = { 'چهارراه سیروس': near(B[0], B[3]), 'پل ری': near(B[2], B[3]), 'میدان قیام': near(B[2], B[1]), 'چهارراه مولوی': near(B[0], B[1]) };
    Object.entries(lm).forEach(([t, c]) => out.push({ t, s: 'نشانه‌ی شهری', c, k: 'lm' }));
    M.landmarks = lm;
    return out;
  };
  M.flyTo = (c, z) => { if (st.view === 'atlas') setView('map'); M.map.easeTo({ center: c, zoom: z || 17.8, duration: 700 }); };
})();
