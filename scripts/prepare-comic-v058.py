"""Import the user's complete shotgun soldiers, without removing or attaching guns.

All rectangles, sole pivots and barrel tips refer to original source pixels.
Only transparent speckle and tiny fragments at crop edges are discarded.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/v058/霰弹枪士兵动作.png'
OUT = ROOT / 'art/slices/v058'
OUT.mkdir(parents=True, exist_ok=True)
sheet = Image.open(SOURCE).convert('RGBA')
SCALE = .7
entries, pictures, clips, sockets = [], {}, {}, {}


def row(action, y0, y1, cells, exclude=()):
    """Cells: left, right, pivot-x, sole-y, tip-x, tip-y; optional top/bottom."""
    ids = []
    for index, cell in enumerate(cells):
        if index in exclude:
            continue
        left, right, pivot, floor, tipx, tipy, *vertical = cell
        box = [left, vertical[0] if vertical else y0, right, vertical[1] if len(vertical) > 1 else y1]
        a = np.array(sheet.crop(box))
        a[a[:, :, 3] < 16] = 0
        mask = a[:, :, 3] > 0
        seen = np.zeros(mask.shape, dtype=bool)
        height, width = mask.shape
        for yy, xx in zip(*np.where(mask)):
            if seen[yy, xx]:
                continue
            seen[yy, xx] = True
            stack, component, edge = [(int(yy), int(xx))], [], False
            while stack:
                cy, cx = stack.pop()
                component.append((cy, cx))
                edge |= cy == 0 or cx == 0 or cy == height - 1 or cx == width - 1
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(component) < 6 or (edge and len(component) < 2000):
                for cy, cx in component:
                    a[cy, cx] = 0
        im = Image.fromarray(a)
        trim = im.getbbox()
        if trim is None:
            raise ValueError(f'Empty frame: {action}/{index}')
        im = im.crop(trim)
        origin = [box[0] + trim[0], box[1] + trim[1]]
        frame_id = f'direct.shotgun.{action}.{index}'
        anchor = [(pivot - origin[0]) / im.width, 1 - (floor - origin[1]) / im.height]
        entry = dict(id=frame_id, crop=box, trim=list(trim), origin=origin, size=list(im.size),
                     sourceSize=list(im.size), footSource=[pivot, floor], muzzleSource=[tipx, tipy],
                     anchor=anchor, scale=SCALE, file=(OUT / f'{frame_id}.png').relative_to(ROOT).as_posix())
        entries.append(entry)
        pictures[frame_id] = im
        sockets[frame_id] = [round((tipx - pivot) * SCALE, 4), round((floor - tipy) * SCALE, 4)]
        im.save(ROOT / entry['file'], optimize=True)
        ids.append(frame_id)
    clips['shotgun.' + action] = ids


row('idle', 59, 196, [
    (40, 158, 83, 185, 151, 128), (162, 278, 207, 185, 270, 131),
    (281, 396, 323, 186, 388, 132), (397, 518, 439, 186, 509, 132)])
# Nine actual running bodies are visible despite the source's RUN (8) label.
row('run', 55, 196, [
    (575, 674, 618, 186, 669, 132), (672, 765, 714, 186, 759, 134),
    (752, 856, 803, 186, 849, 125), (844, 947, 890, 186, 941, 125),
    (939, 1038, 986, 183, 1032, 123), (1029, 1132, 1081, 186, 1126, 126),
    (1117, 1232, 1177, 188, 1225, 123), (1219, 1331, 1272, 186, 1324, 121),
    (1320, 1442, 1374, 186, 1427, 127)])
row('jump', 244, 380, [
    (37, 166, 91, 364, 158, 309, 246), (176, 297, 226, 370, 291, 286, 239),
    (301, 422, 350, 358, 415, 276, 226), (427, 551, 474, 375, 543, 323, 264)])
row('fall', 264, 386, [(720, 854, 771, 375, 844, 304), (876, 1018, 928, 380, 1009, 306, 269)])
row('crouch', 445, 555, [(54, 184, 108, 548, 176, 503), (191, 325, 245, 548, 317, 506)])
row('crouch-walk', 440, 555, [
    (414, 551, 476, 548, 543, 507), (566, 708, 628, 548, 700, 506),
    (726, 866, 790, 548, 858, 509), (884, 1026, 948, 548, 1018, 503),
    (1057, 1194, 1120, 548, 1186, 501), (1212, 1351, 1274, 548, 1343, 503)])
# Five bodies are painted in STAND SHOOT (4); crop away neighbouring bodies.
row('stand-shoot', 604, 744, [
    (29, 173, 81, 735, 129, 668), (172, 282, 219, 734, 273, 670),
    (282, 399, 331, 735, 377, 668), (399, 510, 442, 735, 502, 668),
    (505, 628, 552, 734, 620, 668)], exclude=(2, 3))
row('run-shoot', 605, 747, [
    (659, 785, 710, 735, 779, 669), (782, 911, 837, 739, 887, 666),
    (899, 1035, 952, 735, 1003, 668), (1010, 1175, 1078, 738, 1138, 668),
    (1166, 1303, 1226, 737, 1260, 670), (1297, 1438, 1356, 738, 1430, 664)], exclude=(1, 2, 3, 5))
row('crouch-shoot', 800, 914, [
    (35, 182, 92, 905, 138, 857), (182, 325, 231, 907, 289, 856),
    (323, 476, 374, 907, 440, 853), (475, 596, 528, 907, 588, 853)])
row('reload', 793, 925, [
    (626, 749, 676, 911, 741, 865, 793, 916), (760, 885, 811, 918, 877, 852),
    (887, 1019, 946, 918, 1011, 851), (1023, 1153, 1073, 919, 1144, 870),
    (1158, 1292, 1208, 919, 1284, 860)])
row('hit', 954, 1080, [
    (47, 143, 89, 1071, 133, 1007, 964), (166, 277, 215, 1070, 264, 1005),
    (288, 421, 346, 1070, 406, 1013), (429, 565, 485, 1071, 516, 995)])
row('death', 973, 1086, [
    (613, 728, 674, 1070, 719, 991), (727, 851, 789, 1070, 838, 986),
    (860, 972, 917, 1067, 961, 1001, 990), (969, 1113, 1037, 1068, 1104, 1044, 1007),
    (1120, 1287, 1203, 1066, 1279, 1049, 1015), (1288, 1443, 1365, 1066, 1433, 1047, 1013)])

# These source figures overlap their neighbour's muzzle flash/backpack. Use
# intact native alternatives instead of repairing or repainting hidden parts.
excluded = [f'direct.shotgun.stand-shoot.{i}' for i in (2, 3)] + [f'direct.shotgun.run-shoot.{i}' for i in (1, 2, 3, 5)]
for frame_id in excluded:
    old = (OUT / f'{frame_id}.png').resolve()
    assert old.parent == OUT.resolve()
    if old.exists():
        old.unlink()

# Shared atlas, original-size frames, four-pixel extrusion including corners.
placements, x, y, shelf = {}, 4, 4, 0
for entry in sorted(entries, key=lambda e: (-e['size'][1], e['id'])):
    w, h = entry['size']
    if x + w + 4 > 2048:
        x, y, shelf = 4, y + shelf + 8, 0
    entry['atlas'] = [x, y, w, h]
    placements[entry['id']] = (x, y)
    x, shelf = x + w + 8, max(shelf, h)
atlas_height = 1 << (y + shelf + 3).bit_length()
if atlas_height > 1024:
    raise ValueError('Shotgun atlas exceeded the mobile texture budget')
atlas = Image.new('RGBA', (2048, atlas_height))
for entry in entries:
    im = pictures[entry['id']]
    x, y = placements[entry['id']]
    w, h = im.size
    atlas.paste(im, (x, y))
    for box, size, point in [
        ((0, 0, w, 1), (w, 4), (x, y - 4)), ((0, h - 1, w, h), (w, 4), (x, y + h)),
        ((0, 0, 1, h), (4, h), (x - 4, y)), ((w - 1, 0, w, h), (4, h), (x + w, y)),
        ((0, 0, 1, 1), (4, 4), (x - 4, y - 4)), ((w - 1, 0, w, 1), (4, 4), (x + w, y - 4)),
        ((0, h - 1, 1, h), (4, 4), (x - 4, y + h)), ((w - 1, h - 1, w, h), (4, 4), (x + w, y + h))]:
        atlas.paste(im.crop(box).resize(size, Image.Resampling.NEAREST), point)
runtime = ROOT / 'assets/resources/comic/shotgun.png'
atlas.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(runtime, optimize=True)
frames = {e['id']: {key: e[key] for key in ['atlas', 'anchor', 'sourceSize', 'size']} for e in entries}
(ROOT / 'assets/scripts/render/ShotgunFrames.ts').write_text(
    '// Generated from the supplied complete shotgun soldiers by prepare-comic-v058.py.\n'
    + 'export const ShotgunScale = .7;\n'
    + 'export const ShotgunFrames = ' + json.dumps(frames, separators=(',', ':')) + ' as const;\n'
    + 'export const ShotgunClips = ' + json.dumps(clips, separators=(',', ':')) + ' as const;\n'
    + 'export const ShotgunSockets: Partial<Record<keyof typeof ShotgunFrames, readonly [number,number]>> = '
    + json.dumps(sockets, separators=(',', ':')) + ';\n', encoding='utf-8')
record = dict(version='0.5.8', source=dict(file=SOURCE.relative_to(ROOT).as_posix(),
    sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(), size=list(sheet.size), mode=sheet.mode,
    transparentPixels=int((np.array(sheet)[:, :, 3] == 0).sum())), frames=entries, clips=clips,
    textureSize=list(atlas.size), textureBytes=runtime.stat().st_size, scale=SCALE, extrusion=4, padding=8,
    excludedOverlaps=excluded,
    notes=['57 source figures; use 51 clean complete figures. Six fire poses overlap a neighbouring figure/flash or truncate the flash and are excluded.',
           'RUN has 9 bodies, STAND SHOOT has 5 despite printed labels; clean firing clips use 3 standing / 2 running frames.',
           'Reload frames are archived; no new magazine/reload gameplay is introduced.',
           'No separate crouch-running fire or grenade-throw row: use crouch-walk plus existing muzzle FX, and the earlier supplied throw action.'])
(ROOT / 'art/v058-manifest.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
contact = Image.new('RGB', (180 * 8, 175 * ((len(entries) + 7) // 8)), '#eeeeee')
draw = ImageDraw.Draw(contact)
for i, entry in enumerate(entries):
    im = pictures[entry['id']]
    px, py = (i % 8) * 180, (i // 8) * 175
    contact.paste(im, (px + (180 - im.width) // 2, py + 165 - im.height), im)
    draw.text((px + 3, py + 3), entry['id'].replace('direct.shotgun.', ''), fill='black')
contact.save(ROOT / 'reports/v058-contact.png')
cards = ''.join(f'<article><b>{e["id"]}</b><img src="slices/v058/{e["id"]}.png"></article>' for e in entries)
(ROOT / 'art/v058-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>V0.5.8 霰弹枪原图动作</title>'
    + '<style>body{font:14px sans-serif;background:#fafafa;margin:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,180px);gap:12px}article{border:1px solid #bbb;min-height:175px;padding:5px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:#eee}b{font-size:10px}img{max-width:175px;max-height:145px}</style>'
    + '<h1>完整霰弹枪人物帧</h1><p>使用51个完整人物；原图6个重叠或爆闪被截断的射击姿势不接入，采用其余完整射击帧。统一脚底锚点，4像素挤出；无去枪、武器覆盖或身体补片。</p>'
    + '<a href="v058-manifest.json">来源、锚点与枪口清单</a><div class="grid">' + cards + '</div>', encoding='utf-8')
print(f'{len(entries)} complete shotgun frames, {len(clips)} clips, atlas {atlas.size}, {runtime.stat().st_size} bytes')
