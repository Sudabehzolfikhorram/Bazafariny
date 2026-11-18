"""Parse the OSM bbox extract of Sirous into compact GeoJSON-like layers (buildings, roads, landuse, pois)."""
import xml.etree.ElementTree as ET, json, collections, pathlib, sys
R = pathlib.Path(__file__).parent
root = ET.parse(R / 'raw/osm.xml').getroot()
nodes = {}; ntags = {}
for n in root.iter('node'):
    nodes[n.get('id')] = (float(n.get('lon')), float(n.get('lat')))
    t = {x.get('k'): x.get('v') for x in n.findall('tag')}
    if t: ntags[n.get('id')] = t
ways = []
for w in root.iter('way'):
    t = {x.get('k'): x.get('v') for x in w.findall('tag')}
    ref = [nd.get('ref') for nd in w.findall('nd')]
    ways.append((w.get('id'), t, ref))
c = collections.Counter()
for _, t, _ in ways:
    for k in ('building', 'highway', 'landuse', 'leisure', 'amenity', 'natural', 'railway', 'shop'):
        if k in t: c[k + '=' + (t[k] if k != 'building' else 'yes*')] += 1
print(len(nodes), 'nodes', len(ways), 'ways'); print(c.most_common(40))
pois = collections.Counter((t.get('amenity') or t.get('shop') or t.get('tourism') or t.get('historic') or '') for t in ntags.values())
print('node pois', pois.most_common(25))
names = [t.get('name') for _, t, _ in ways if t.get('highway') and t.get('name')]
print(collections.Counter(names).most_common(30))
