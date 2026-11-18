"""Build Sirous map layers from the OSM extract: boundary, blocks, parcels, roads, POIs, hazards.
Output: data/geo.json (lon/lat, 6 decimals) + printed stats."""
import xml.etree.ElementTree as ET, json, math, random, pathlib, collections
from shapely.geometry import LineString, Polygon, Point, MultiPolygon, box, mapping
from shapely.ops import unary_union, polygonize, transform
from shapely import affinity

R = pathlib.Path(__file__).parent
random.seed(7)
LON0, LAT0 = 51.4335, 35.6720
KX = math.cos(math.radians(LAT0)) * 111320.0
KY = 110540.0
def fwd(x, y, z=None): return ((x - LON0) * KX, (y - LAT0) * KY)
def inv(x, y, z=None): return (x / KX + LON0, y / KY + LAT0)
P = lambda g: transform(fwd, g)
G = lambda g: transform(inv, g)

root = ET.parse(R / 'raw/osm.xml').getroot()
nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
ntag = {}
for n in root.iter('node'):
    t = {x.get('k'): x.get('v') for x in n.findall('tag')}
    if t: ntag[n.get('id')] = t
ways = []
for w in root.iter('way'):
    t = {x.get('k'): x.get('v') for x in w.findall('tag')}
    ref = [nd.get('ref') for nd in w.findall('nd') if nd.get('ref') in nodes]
    if len(ref) >= 2: ways.append((w.get('id'), t, ref))

MAIN = {'primary', 'trunk', 'busway'}
SEC = {'secondary', 'tertiary', 'primary_link', 'unclassified', 'secondary_link', 'tertiary_link', 'trunk_link'}
NARROW = {'footway', 'service', 'steps', 'pedestrian', 'path', 'living_street', 'track'}
roads = []
for wid, t, ref in ways:
    h = t.get('highway')
    if not h or h in ('construction', 'proposed', 'platform'): continue
    ls = P(LineString([nodes[r] for r in ref]))
    roads.append(dict(id=wid, h=h, name=t.get('name', ''), geom=ls, oneway=t.get('oneway') == 'yes'))

# ---- boundary: face bounded by the 4 primaries around the centre
bnames = {'مصطفی خمینی', 'مولوی', 'ری', 'پانزده خرداد', 'میدان قیام', 'خیابان ری'}
blines = [r['geom'] for r in roads if r['h'] in MAIN | {'primary_link'} or r['name'] in bnames]
faces = list(polygonize(unary_union(blines)))
c = Point(0, 0)
cand = [f for f in faces if f.contains(c)]
print('faces', len(faces), 'containing centre', len(cand), [round(f.area / 1e4, 2) for f in cand])
bound = max(cand, key=lambda f: f.area) if cand else None
# fallback / sanity: the face must be ~40-50 ha; if the centre face is a thin island, union neighbours
if bound is None or bound.area < 30e4:
    near = [f for f in faces if f.distance(c) < 400 and f.area > 2000]
    bound = unary_union(near).convex_hull
bound = bound.buffer(0)
print('boundary ha', round(bound.area / 1e4, 2))

# ---- road widths (m) by class for carving blocks
def width(r):
    h = r['h']
    if h in MAIN: return 22 if h != 'busway' else 8
    if h in SEC: return 12
    if h == 'residential': return 7 if len(r['name']) > 4 else 5
    if h in NARROW: return 3.2
    return 5
inside_roads = [r for r in roads if r['geom'].intersects(bound.buffer(30))]
carve = unary_union([r['geom'].buffer(width(r) / 2, cap_style=2, join_style=2) for r in inside_roads])
blocks_raw = bound.buffer(-6).difference(carve)
blocks = [g for g in (blocks_raw.geoms if hasattr(blocks_raw, 'geoms') else [blocks_raw]) if g.area > 250]
print('blocks', len(blocks), 'block ha', round(sum(b.area for b in blocks) / 1e4, 2))

# ---- parcels: oriented strip subdivision
def oriented(poly):
    mrr = poly.minimum_rotated_rectangle
    xs = list(mrr.exterior.coords)
    best = max(((xs[i], xs[i + 1]) for i in range(4)), key=lambda e: math.dist(*e))
    ang = math.degrees(math.atan2(best[1][1] - best[0][1], best[1][0] - best[0][0]))
    return ang

def subdivide(poly, front=(10, 17), depth_max=24):
    ang = oriented(poly)
    cx, cy = poly.centroid.x, poly.centroid.y
    q = affinity.rotate(poly, -ang, origin=(cx, cy))
    x0, y0, x1, y1 = q.bounds
    H = y1 - y0
    rows = max(1, round(H / depth_max))
    out = []
    for i in range(rows):
        ya, yb = y0 + H * i / rows, y0 + H * (i + 1) / rows
        x = x0
        while x < x1:
            w = random.uniform(*front)
            if x1 - (x + w) < front[0] * 0.6: w = x1 - x
            cell = box(x, ya, x + w, yb)
            g = q.intersection(cell)
            for p in (g.geoms if hasattr(g, 'geoms') else [g]):
                if p.geom_type == 'Polygon' and p.area > 35:
                    out.append(affinity.rotate(p, ang, origin=(cx, cy)))
            x += w
    return out

parcels = []
for b in blocks:
    if b.area < 600: parcels.append(b); continue
    parcels += subdivide(b)
print('parcels raw', len(parcels))
TARGET = 1290
# adjust density: merge or split to approach target
if len(parcels) > TARGET * 1.08 or len(parcels) < TARGET * 0.92:
    f = (len(parcels) / TARGET) ** 0.5
    random.seed(7); parcels = []
    for b in blocks:
        if b.area < 600: parcels.append(b); continue
        parcels += subdivide(b, front=(10 * f, 17 * f), depth_max=24 * f)
    print('parcels adj', len(parcels))
# inset parcels slightly so the edges read as plots
parcels = [p.buffer(-0.6, join_style=2) for p in parcels]
parcels = [p for p in parcels if not p.is_empty and p.area > 30]
parcels = [max(p.geoms, key=lambda g: g.area) if hasattr(p, 'geoms') else p for p in parcels]
print('parcels final', len(parcels), 'mean m2', round(sum(p.area for p in parcels) / len(parcels)))

# ---- attributes
prim = unary_union([r['geom'] for r in roads if r['h'] in ('primary',) and r['geom'].distance(bound) < 40])
seed_pts = [(random.uniform(-320, 320), random.uniform(-330, 330), random.uniform(60, 160), random.choice([-1, 1])) for _ in range(14)]
def field(x, y):
    v = 0
    for sx, sy, s, sg in seed_pts: v += sg * math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (2 * s * s))
    return v
dist = [p.centroid.distance(prim) for p in parcels]
order = sorted(range(len(parcels)), key=lambda i: dist[i] + random.uniform(0, 14))
N = len(parcels)
ncom = 272
use = ['res'] * N
for i in order[:ncom]: use[i] = 'com'
# services: parcels containing service POIs
SERV = {'place_of_worship', 'school', 'college', 'hospital', 'clinic', 'pharmacy', 'bank', 'fire_station', 'townhall', 'public_bath', 'library', 'kindergarten', 'police', 'post_office'}
pois = []
for nid, t in ntag.items():
    a = t.get('amenity') or t.get('shop') or t.get('leisure') or t.get('tourism') or t.get('historic')
    if not a: continue
    lon, lat = nodes[nid]
    pt = P(Point(lon, lat))
    if pt.distance(bound) > 120: continue
    pois.append(dict(kind=a, name=t.get('name', ''), x=pt.x, y=pt.y, inside=bound.contains(pt)))
for wid, t, ref in ways:
    a = t.get('amenity') or t.get('leisure') or t.get('shop')
    if not a or t.get('highway'): continue
    g = P(Polygon([nodes[r] for r in ref])) if ref[0] == ref[-1] and len(ref) > 3 else None
    if g is None: continue
    c0 = g.centroid
    if c0.distance(bound) > 120: continue
    pois.append(dict(kind=a, name=t.get('name', ''), x=c0.x, y=c0.y, inside=bound.contains(c0)))
from shapely.strtree import STRtree
tree = STRtree(parcels)
for p in pois:
    if p['kind'] in SERV:
        for i in tree.query(Point(p['x'], p['y']).buffer(6)):
            use[int(i)] = 'srv'
k = ncom
while sum(u == 'com' for u in use) < 272 and k < N:
    if use[order[k]] == 'res': use[order[k]] = 'com'
    k += 1
# exactly 1,018 residential: surplus smallest residential plots become vacant land (زمین بایر)
resi = sorted([i for i in range(N) if use[i] == 'res'], key=lambda i: parcels[i].area)
for i in resi[:max(0, len(resi) - 1018)]: use[i] = 'vac'
srvi = sorted([i for i in range(N) if use[i] == 'srv'], key=lambda i: parcels[i].area)
for i in srvi[:max(0, 1018 - len(resi))]: use[i] = 'res'
# condition: noise field ranking, commercial a little newer
score = []
for i, p in enumerate(parcels):
    c0 = p.centroid
    s = field(c0.x, c0.y) + random.gauss(0, 0.35) + (0.35 if use[i] == 'com' else 0)
    score.append(s)
rk = sorted(range(N), key=lambda i: -score[i])
shares = [('new', .233), ('std', .387), ('weak', .245), ('ruin', .135)]
cond = [None] * N; k = 0
for name, sh in shares:
    n = round(sh * N) if name != 'ruin' else N - k
    for i in rk[k:k + n]: cond[i] = name
    k += n
FL = {'new': (4, 6), 'std': (2, 4), 'weak': (1, 2), 'ruin': (1, 1)}
YB = {'new': (1392, 1404), 'std': (1365, 1391), 'weak': (1335, 1364), 'ruin': (1310, 1340)}
feat = []
for i, p in enumerate(parcels):
    fl = random.randint(*FL[cond[i]])
    if use[i] == 'com' and cond[i] in ('new', 'std'): fl = min(7, fl + 1)
    yb = random.randint(*YB[cond[i]])
    units = 0 if use[i] != 'res' else max(1, round(fl * p.area / 160))
    feat.append(dict(g=p, c=cond[i], u=use[i], f=fl, yb=yb, a=round(p.area), un=units))
# scale units so unstable units (weak+ruin residential) = 1007
uu = sum(f['un'] for f in feat if f['c'] in ('weak', 'ruin'))
sc = 1007 / max(1, uu)
for f in feat:
    if f['c'] in ('weak', 'ruin'): f['un'] = max(1 if f['u'] == 'res' else 0, round(f['un'] * sc))
d = 1007 - sum(f['un'] for f in feat if f['c'] in ('weak', 'ruin'))
for f in feat:
    if d == 0: break
    if f['c'] in ('weak', 'ruin') and f['u'] == 'res':
        st = 1 if d > 0 else -1
        if f['un'] + st >= 1: f['un'] += st; d -= st
print('units unstable', sum(f['un'] for f in feat if f['c'] in ('weak', 'ruin')), 'units total', sum(f['un'] for f in feat))
print('cond', collections.Counter(f['c'] for f in feat), 'use', collections.Counter(f['u'] for f in feat))

# ---- road classes for the map (narrow < 6m)
CLS = {}
def cls(r):
    return CLS.get(r['id'], 'loc')
def cls0(r):
    h = r['h']
    if h in MAIN: return 'main'
    if h in SEC: return 'sec'
    if h in NARROW: return 'nar'
    if h == 'residential':
        nm = r['name']
        ordinal = any(w in nm for w in ('اول', 'دوم', 'سوم', 'چهارم', 'یکم', 'پنجم', 'فرعی', 'بن بست', 'بن‌بست'))
        if not nm or ordinal or r['geom'].length < 70: return 'nar'
        return 'loc'
    return 'loc'
for r in roads: CLS[r['id']] = cls0(r)
# narrow-street share target 32% (council indicator): keep the narrowest candidates, promote the rest to local
inl = {r['id']: (r['geom'].intersection(bound).length if r['geom'].intersects(bound) else 0) for r in roads}
tot = sum(inl.values())
cands = sorted([r for r in roads if CLS[r['id']] == 'nar'], key=lambda r: (0 if r['h'] in NARROW else 1, inl[r['id']]))
acc = 0
for r in cands:
    if acc + inl[r['id']] <= tot * .32 + 30: acc += inl[r['id']]
    else: CLS[r['id']] = 'loc'
rl = collections.Counter(); rlin = []
for r in roads:
    k = cls(r)
    if r['geom'].intersects(bound):
        L = r['geom'].intersection(bound).length
        rl[k] += L
print('road length in boundary', {k: round(v) for k, v in rl.items()}, 'narrow share', round(rl['nar'] / sum(rl.values()) * 100, 1))

# ---- hazards (illustrative zones scaled from the hazard template %: 14/19/11/6 of 44 ha)
A = bound.area
def band(line, target):
    lo, hi = 1, 200
    for _ in range(40):
        m = (lo + hi) / 2
        a = line.buffer(m, cap_style=2).intersection(bound).area
        lo, hi = (m, hi) if a < target else (lo, m)
    return line.buffer(lo, cap_style=2).intersection(bound)
haz = {
    'fault': band(LineString([(-420, -260), (-80, 30), (420, 300)]), A * .14),
    'flood': band(LineString([(120, -420), (60, -150), (150, 80), (90, 420)]), A * .19),
    'slope': None,
    'power': band(LineString([(-420, 250), (420, 210)]), A * .06),
}
blob = Point(-200, -230).buffer(1)
lo, hi = 1, 300
for _ in range(40):
    m = (lo + hi) / 2
    a = Point(-210, -200).buffer(m).intersection(bound).area
    lo, hi = (m, hi) if a < A * .11 else (lo, m)
haz['slope'] = affinity.scale(Point(-210, -200).buffer(lo), 1.25, .8).intersection(bound)
for k, v in haz.items(): print('haz', k, round(v.area / 1e4, 2), 'ha', round(v.area / A * 100, 1), '%')

# ---- export
def rnd(g):
    return G(g)
def coords(g):
    m = mapping(rnd(g))
    def r(o):
        if isinstance(o, (list, tuple)):
            if o and isinstance(o[0], (int, float)): return [round(o[0], 6), round(o[1], 6)]
            return [r(x) for x in o]
        return o
    return {'type': m['type'], 'coordinates': r(m['coordinates'])}
F = lambda g, pr: {'type': 'Feature', 'geometry': coords(g), 'properties': pr}
out = {}
out['bound'] = F(bound, {})
x0_, y0_ = fwd(51.4262, 35.6670); x1_, y1_ = fwd(51.4398, 35.6780)
ctx = box(x0_, y0_, x1_, y1_)
out['mask'] = F(box(-3000, -3000, 3000, 3000).difference(bound), {})
out['parcels'] = {'type': 'FeatureCollection', 'features': [F(f['g'], {'i': i, 'c': f['c'], 'u': f['u'], 'f': f['f'], 'yb': f['yb'], 'a': f['a'], 'un': f['un']}) for i, f in enumerate(feat)]}
# context blocks outside the boundary (lighter), from polygonized streets within the context box
ctx_roads = [r for r in roads if r['geom'].intersects(ctx)]
carve2 = unary_union([r['geom'].buffer(width(r) / 2, cap_style=2, join_style=2) for r in ctx_roads])
outer = ctx.difference(bound.buffer(4)).difference(carve2)
ob = [g for g in (outer.geoms if hasattr(outer, 'geoms') else [outer]) if g.area > 300]
out['ctx'] = {'type': 'FeatureCollection', 'features': [F(g.buffer(-1.5, join_style=2), {}) for g in ob if not g.buffer(-1.5).is_empty]}
rf = []
for r in roads:
    if not r['geom'].intersects(ctx): continue
    g = r['geom'].intersection(ctx)
    if g.is_empty: continue
    for s in (g.geoms if hasattr(g, 'geoms') else [g]):
        if s.geom_type != 'LineString': continue
        rf.append(F(s, {'k': cls(r), 'n': r['name'], 'h': r['h'], 'in': 1 if s.intersects(bound) else 0, 'L': round(s.length)}))
out['roads'] = {'type': 'FeatureCollection', 'features': rf}
# parks/green from OSM
green = []
for wid, t, ref in ways:
    if (t.get('leisure') in ('park', 'garden', 'playground') or t.get('landuse') in ('grass',) or t.get('natural') == 'water') and ref[0] == ref[-1] and len(ref) > 3:
        g = P(Polygon([nodes[r] for r in ref])).buffer(0)
        if g.intersects(ctx): green.append(F(g, {'k': 'water' if t.get('natural') == 'water' else 'green', 'n': t.get('name', '')}))
out['green'] = {'type': 'FeatureCollection', 'features': green}
out['pois'] = [dict(k=p['kind'], n=p['name'], ll=[round(v, 6) for v in inv(p['x'], p['y'])], i=p['inside']) for p in pois]
out['haz'] = {'type': 'FeatureCollection', 'features': [F(v, {'k': k, 'ha': round(v.area / 1e4, 1)}) for k, v in haz.items()]}
bb = G(bound).bounds
out['meta'] = dict(bbox=[round(v, 6) for v in bb], ha=round(bound.area / 1e4, 2), parcels=len(feat), narrow=round(rl['nar'] / sum(rl.values()) * 100, 1),
                   center=[LON0, LAT0])
(R / 'data').mkdir(exist_ok=True)
s = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
(R / 'data/geo.json').write_text(s)
print('geo.json', len(s) // 1024, 'KB', 'pois', len(pois), collections.Counter(p['kind'] for p in pois).most_common(15))
