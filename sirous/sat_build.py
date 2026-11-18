"""Stitch Esri World_Imagery tiles into two JPEG mosaics (core z18, context z17), cropped to exact lon/lat bounds."""
import math, subprocess, pathlib, io, json, base64
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageEnhance
R = pathlib.Path(__file__).parent
T = R / 'tiles'; T.mkdir(exist_ok=True)
URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

def fxy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def get(z, x, y):
    p = T / f'{z}_{x}_{y}.jpg'
    if p.exists() and p.stat().st_size > 500: return p
    for _ in range(3):
        r = subprocess.run(['curl', '-sS', '-m', '30', '-o', str(p), '-w', '%{http_code}', URL.format(z=z, x=x, y=y)], capture_output=True, text=True)
        if r.stdout == '200': return p
    raise SystemExit(f'tile fail {z}/{x}/{y} {r.stdout} {r.stderr}')

def mosaic(name, z, w, s, e, n, q, maxpx=None):
    x0, y0 = fxy(w, n, z); x1, y1 = fxy(e, s, z)
    tx = range(int(x0), int(x1) + 1); ty = range(int(y0), int(y1) + 1)
    jobs = [(z, x, y) for x in tx for y in ty]
    with ThreadPoolExecutor(12) as ex: list(ex.map(lambda a: get(*a), jobs))
    im = Image.new('RGB', (len(tx) * 256, len(ty) * 256))
    for x in tx:
        for y in ty:
            im.paste(Image.open(T / f'{z}_{x}_{y}.jpg').convert('RGB'), ((x - tx[0]) * 256, (y - ty[0]) * 256))
    crop = (round((x0 - tx[0]) * 256), round((y0 - ty[0]) * 256), round((x1 - tx[0]) * 256), round((y1 - ty[0]) * 256))
    im = im.crop(crop)
    if maxpx and max(im.size) > maxpx:
        f = maxpx / max(im.size); im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    # gentle grade: lift shadows a touch, slight saturation, keep it natural
    im = ImageEnhance.Brightness(im).enhance(1.05)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    im = ImageEnhance.Color(im).enhance(1.06)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True, progressive=True)
    (R / 'data' / f'{name}.jpg').write_bytes(b.getvalue())
    print(name, len(jobs), 'tiles', im.size, len(b.getvalue()) // 1024, 'KB')
    return dict(coords=[[w, n], [e, n], [e, s], [w, s]], w=im.width, h=im.height)

meta = {}
# context = OSM extract bbox
meta['ctx'] = mosaic('sat_ctx', 17, 51.4262, 35.6670, 51.4398, 35.6780, 68)
# core = boundary bbox + ~45 m pad
meta['core'] = mosaic('sat_core', 18, 51.4287, 35.6689, 51.4386, 35.6762, 64)
(R / 'data/sat_meta.json').write_text(json.dumps(meta))
