"""Bundle src/ + vendor/ into one self-contained index.html (works offline)."""
import pathlib
R = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (R / p).read_text(encoding='utf-8')
css = ''.join(f'<style>{rd(p)}</style>' for p in ['vendor/font.css', 'vendor/leaflet.css', 'src/app.css'])
js = ''.join(f'<script>{rd(p)}</script>' for p in ['vendor/leaflet.js', 'vendor/echarts.js', 'vendor/geo.js', 'src/data.js', 'src/core.js', 'src/shared.js', 'src/renew.js', 'src/mA.js', 'src/mB.js', 'src/detail.js'])
html = f'''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>داشبورد سوپرادمین · بازآفرینی‌یار</title><meta name="description" content="دو مدل داشبورد سوپرادمین بازآفرینی‌یار: نقشه دوبعدی و سه‌بعدی، اطلس استان‌ها">{css}</head><body>{js}</body></html>'''
(R / 'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html))
