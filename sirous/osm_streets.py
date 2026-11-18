import xml.etree.ElementTree as ET, pathlib, collections
R = pathlib.Path(__file__).parent
root = ET.parse(R / 'raw/osm.xml').getroot()
nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
agg = collections.defaultdict(list)
for w in root.iter('way'):
    t = {x.get('k'): x.get('v') for x in w.findall('tag')}
    if t.get('highway') in ('primary', 'secondary', 'tertiary', 'trunk', 'primary_link', 'unclassified', 'busway') or (t.get('highway') == 'residential' and t.get('name') and len(t.get('name')) > 4):
        pts = [nodes[nd.get('ref')] for nd in w.findall('nd') if nd.get('ref') in nodes]
        agg[(t.get('name', '?'), t['highway'])] += pts
for (n, h), pts in sorted(agg.items(), key=lambda kv: -len(kv[1]))[:45]:
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    print(f'{n:28s} {h:12s} lon {min(xs):.4f}-{max(xs):.4f} lat {min(ys):.4f}-{max(ys):.4f} n={len(pts)}')
