"""Draw existing Sirous streets, boundary and parks. No modelled parcel or hazard layers."""
import json, math
from pathlib import Path
R = Path(__file__).resolve().parent
g = json.loads((R.parent/'sirous/data/geo.json').read_text())
west,south,east,north = g['meta']['bbox']
height=296; scale=height/(north-south); mid=(west+east)/2
def pos(x,y):
    return f'{310+(x-mid)*math.cos(math.radians(north))*scale:.1f},{28+(north-y)*scale:.1f}'
def path(geom):
    coords=geom['coordinates']
    if geom['type']=='LineString': return 'M'+' '.join(pos(*p) for p in coords)
    if geom['type']=='Polygon': return ''.join('M'+' '.join(pos(*p) for p in ring)+'Z' for ring in coords)
    raise ValueError(geom['type'])
def el(d,style): return f'<path d="{d}" {style}/>'
boundary=path(g['bound']['geometry'])
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 352"><rect width="620" height="352" fill="#edf2f4"/>',el(boundary,'fill="#d4ece9"')]
for f in g['green']['features']: parts.append(el(path(f['geometry']),'fill="#bddecb"'))
for k,width in [('loc',1.1),('nar',.8),('sec',2.1),('main',3.8)]:
    d=''.join(path(f['geometry']) for f in g['roads']['features'] if f['properties']['k']==k)
    parts.append(el(d,f'fill="none" stroke="#fff" stroke-width="{width}" stroke-linecap="round"'))
parts += [el(boundary,'fill="none" stroke="#008782" stroke-width="2.4"'),'</svg>']
(R/'assets/sirous.svg').write_text(''.join(parts))
