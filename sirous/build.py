"""Bundle the Sirous page into one self-contained HTML (no network needed)."""
import pathlib, base64, json
R = pathlib.Path(__file__).parent
L, S, D = R / 'lib', R / 'src', R / 'data'
rd = lambda p: p.read_text(encoding='utf-8')
sat = {k: 'data:image/jpeg;base64,' + base64.b64encode((D / f'sat_{k}.jpg').read_bytes()).decode() for k in ('ctx', 'core')}
sat['meta'] = json.loads(rd(D / 'sat_meta.json'))
safe = lambda s: s.replace('</script', '<\\/script')
html = f'''<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>محله سیروس · بازآفرینی‌یار</title>
<style>{rd(L / 'font.css')}</style>
<style>{rd(L / 'maplibre-gl.css')}</style>
<style>{rd(S / 'app.css')}</style>
</head><body>
<script>{safe(rd(L / 'maplibre-gl.js'))}</script>
<script>{safe(rd(L / 'echarts.js'))}</script>
<script>window.GEO={rd(D / 'geo.json')};window.SAT={json.dumps(sat)};</script>
''' + ''.join(f'<script>{safe(rd(S / f))}</script>\n' for f in ['data.js', 'ui.js', 'map.js', 'atlas.js', 'report.js', 'entry.js', 'app.js']) + '</body></html>'
out = R / 'out'; out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html, encoding='utf-8')
# artifact-skeleton simulation: styles end up inside <body>
w = html.replace('<head>', '<head></head><body>', 1).replace('</head><body>', '', 1)
(out / 'wrapped.html').write_text('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html.split('<head>', 1)[1].replace('</head><body>', '', 1), encoding='utf-8')
print('index.html', round(len(html.encode()) / 1024 / 1024, 2), 'MB')
