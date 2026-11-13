from os.path import relpath
"""Inspect generated chapter-two sources and losslessly crop their real cells.

No drawing, repainting, resizing or runtime integration. Original PNGs remain intact.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import html
import json
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
record = json.loads((ROOT / '../素材/游戏美术/level02-generation.json').read_text(encoding='utf-8'))
OUT = ROOT / '../素材/游戏美术/slices/level02'
OUT.mkdir(parents=True, exist_ok=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cuts(mask, count, vertical=False):
    """Move nominal grid boundaries to actual alpha-empty inter-cell gaps."""
    span = mask.width if vertical else mask.height
    boundaries = [0]
    for index in range(1, count):
        target = round(span * index / count)
        radius = round(span / count * .27)
        start, end = max(boundaries[-1] + 1, target - radius), min(span, target + radius)
        gaps, active = [], None
        for value in range(start, end):
            region = (value, 0, value + 1, mask.height) if vertical else (0, value, mask.width, value + 1)
            empty = mask.crop(region).getbbox() is None
            if empty and active is None:
                active = value
            if not empty and active is not None:
                if value - active >= 3:
                    gaps.append((active, value))
                active = None
        if active is not None and end - active >= 3:
            gaps.append((active, end))
        if not gaps:
            raise ValueError(f'No clean gap near boundary {index}/{count}; inspect this source manually')
        left, right = min(gaps, key=lambda pair: abs((pair[0] + pair[1]) / 2 - target))
        boundaries.append((left + right) // 2)
    return boundaries + [span]


assets, frames = [], []
for item in record['assets']:
    path = ROOT / '../素材/游戏美术/source/level02' / item['file']
    with Image.open(path) as image:
        original_mode = image.mode
        rgba = image.convert('RGBA')
    alpha = rgba.getchannel('A')
    histogram = alpha.histogram()
    stats = dict(transparent=histogram[0], partial=sum(histogram[1:255]), opaque=histogram[255])
    assert len(item['frames']) == item['rows'] * item['cols'], item['id']
    if item['transparent']:
        assert histogram[0] > 0 and sum(histogram[64:]) > 0, f"Missing true alpha or visible subject: {item['id']}"
    else:
        assert histogram[255] == rgba.width * rgba.height, f"Background must be opaque: {item['id']}"
    entry = dict(id=item['id'], role=item['role'], file=Path(relpath(path, ROOT)).as_posix(),
                 size=list(rgba.size), mode=original_mode, bytes=path.stat().st_size,
                 sha256=sha(path), alpha=stats, grid=[item['cols'], item['rows']],
                 reviewNote=item.get('reviewNote', ''), frames=[])
    mask = alpha.point(lambda value: 255 if value >= 64 else 0)
    rows = cuts(mask, item['rows']) if item['transparent'] else [0, rgba.height]
    for row in range(item['rows']):
        top, bottom = rows[row:row + 2]
        row_mask = mask.crop((0, top, rgba.width, bottom))
        columns = cuts(row_mask, item['cols'], True) if item['transparent'] else [0, rgba.width]
        for col in range(item['cols']):
            frame_id = item['frames'][row * item['cols'] + col]
            left, right = columns[col:col + 2]
            cell = (left, top, right, bottom)
            bbox = mask.crop(cell).getbbox()
            assert bbox, frame_id
            if item['transparent']:
                # Threshold selects only the crop extent; retained RGBA pixels are unchanged.
                crop = (max(left, left + bbox[0] - 4), max(top, top + bbox[1] - 4),
                        min(right, left + bbox[2] + 4), min(bottom, top + bbox[3] + 4))
                assert bbox[0] > 0 and bbox[1] > 0 and bbox[2] < right-left and bbox[3] < bottom-top, f'Clipped cell: {frame_id}'
            else:
                crop = cell
            piece = rgba.crop(crop)
            dest = OUT / (frame_id + '.png')
            piece.save(dest, optimize=True)
            with Image.open(dest) as check:
                difference = ImageChops.difference(piece, check.convert('RGBA'))
                assert all(channel.getbbox() is None for channel in difference.split()), frame_id
            frame = dict(id=frame_id, sheet=item['id'], role=item['role'],
                         sourceRect=[crop[0], crop[1], crop[2]-crop[0], crop[3]-crop[1]],
                         cellRect=[left, top, right-left, bottom-top], size=list(piece.size),
                         file=Path(relpath(dest, ROOT)).as_posix(), sha256=sha(dest),
                         decodedRGBAEqualToSourceCrop=True,
                         anchor=None, sockets=None,
                         usage='design-reference' if frame_id.endswith('assembled-reference') else 'source-candidate')
            frames.append(frame)
            entry['frames'].append(frame_id)
    assets.append(entry)

manifest = dict(chapter=2, status='generated-source-assets-not-integrated',
                tool='built-in imagegen', checkedAt=datetime.now(timezone.utc).isoformat(),
                sources=len(assets), regions=len(frames),
                processing='Crop only, native source resolution, RGBA pixels unchanged inside each selected rectangle; originals preserved.',
                limitations=['Cell gaps and crop alpha validated; animation timing, in-game scale, muzzle sockets and terrain seams await integration.',
                             'A source-candidate is not proof of a complete animation or playable level.'],
                assets=assets, frames=frames)
(ROOT / '../素材/游戏美术/level02-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

names = {'hero-swim':'主角 · 游动', 'hero-combat':'主角 · 战斗', 'hero-transition':'换装与欢呼',
         'hero-entry':'向下俯冲入水', 'diver-enemies':'潜水敌人与队长', 'submarine-hull':'潜艇船体',
         'submarine-modules':'潜艇炮塔与部件', 'marine-life':'鱼群与水草', 'terrain':'海床与沉船模块',
         'props-weapons':'武器、道具与补给', 'combat-effects':'声纳、激光与弹体', 'water-effects':'水花、气泡与水下爆炸',
         'coast-background':'悬崖海岸背景', 'undersea-background':'海底背景'}
cards = []
for a in assets:
    src = a['file'].removeprefix('../素材/游戏美术/')
    cards.append(f'<article data-search="{html.escape(a["id"]+" "+names.get(a["id"],a["id"]))}"><a class="picture" href="{src}" target="_blank"><img src="{src}" alt="{names.get(a["id"],a["id"])}"></a><h2>{names.get(a["id"],a["id"])}</h2><p>{a["size"][0]} × {a["size"][1]} · {len(a["frames"])} 个图块</p></article>')
regions = []
for f in frames:
    src = f['file'].removeprefix('../素材/游戏美术/')
    regions.append(f'<article data-search="{f["id"]} {names.get(f["sheet"], f["sheet"])}"><a class="picture" href="{src}" target="_blank"><img loading="lazy" src="{src}" alt="{f["id"]}"></a><p>{f["id"]}</p></article>')
page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>深海突围 · 资源图</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f3ee;color:#181918;font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1540px;margin:auto;padding:36px}h1{font-size:38px;margin:0}header p{color:#62645f;margin:8px 0 18px}a{color:inherit}nav{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}button,input{font:inherit;padding:9px 14px;border:1px solid #babbb5;border-radius:6px;background:#fff}button{cursor:pointer}button.active{background:#242823;color:white}input{flex:1;min-width:180px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}article{background:#fff;border:1px solid #d4d4cd;border-radius:8px;overflow:hidden}h2{font-size:17px;margin:10px 14px 0}article p{font-size:12px;color:#5b5f57;margin:6px 14px 14px;overflow-wrap:anywhere}.picture{height:245px;display:flex;align-items:center;justify-content:center;background-color:#e8e9e2;background-image:linear-gradient(45deg,#d5d8ce 25%,transparent 25%),linear-gradient(-45deg,#d5d8ce 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d5d8ce 75%),linear-gradient(-45deg,transparent 75%,#d5d8ce 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}.picture img{max-width:100%;max-height:100%;object-fit:contain;padding:8px}body.dark .picture{background:#30372f}body.white .picture{background:#fff}#regions{grid-template-columns:repeat(6,minmax(0,1fr))}#regions .picture{height:160px}[hidden]{display:none!important}.note{padding:14px 18px;background:#e9ebe4;border-left:3px solid #59654e;margin-bottom:24px}@media(max-width:900px){main{padding:18px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}#regions{grid-template-columns:repeat(3,minmax(0,1fr))}.picture{height:220px}h1{font-size:28px}}</style>
<main><header><h1>深海突围 · 第二关资源图</h1><p>__COUNT__ 张生成原图 · __REGIONS__ 个原尺寸图块 · 黑白漫画 / 独立角色与特效</p><a href="level02-manifest.json">切片与来源清单</a>　<a href="level02-generation.json">完整生成提示词</a>　<a href="../说明/LEVEL-02-ASSETS.md">使用说明</a></header><div class="note">原图和切片已检查。当前为美术源资源，尚未接入游戏；动画节奏、统一世界尺寸、炮口挂点和地形接缝需要在接入时验证。点击图片查看原图。</div><nav><button class="active" data-tab="sheets">资源总览</button><button data-tab="regions">单独图块</button><input id="filter" placeholder="搜索名称，如 torpedo / 潜艇"><button id="background">切换底色</button></nav><section id="sheets" class="grid">__CARDS__</section><section id="regions" class="grid" hidden>__FRAMES__</section></main>
<script>const tabs=[...document.querySelectorAll('[data-tab]')];tabs.forEach(b=>b.onclick=()=>{tabs.forEach(t=>t.classList.toggle('active',t===b));document.querySelectorAll('section').forEach(s=>s.hidden=s.id!==b.dataset.tab)});document.getElementById('filter').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.search.toLowerCase().includes(q))};let shade=0;document.getElementById('background').onclick=()=>{shade=(shade+1)%3;document.body.className=['','dark','white'][shade]};</script></html>'''
page = page.replace('__COUNT__', str(len(assets))).replace('__REGIONS__', str(len(frames))).replace('__CARDS__', ''.join(cards)).replace('__FRAMES__', ''.join(regions))
(ROOT / '../素材/游戏美术/level02-preview.html').write_text(page, encoding='utf-8')
print(json.dumps(dict(sources=len(assets), regions=len(frames), sourceBytes=sum(a['bytes'] for a in assets), cropPixelsPreserved=True), ensure_ascii=False))
