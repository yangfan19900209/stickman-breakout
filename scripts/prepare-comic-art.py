"""Deterministic atlas slicing, not generative art. Requires Pillow + numpy.
Original pixels/alpha are retained; only alpha <= 8 compression dust is discarded.
The visually reviewed rectangles below refer to the supplied 1448 x 1086 PNGs.
"""
from pathlib import Path
import json, shutil, hashlib, html
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source'
SOURCE.mkdir(parents=True, exist_ok=True)
FILES = {
    'A': ('characters.png', r'C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-2a05c2a1-e171-47fa-a552-fe09ef056da4.png'),
    'B': ('environment.png', r'C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-8735b2f6-4b48-4c0c-ab43-d5a1a90a24a6.png'),
}
images = {}
for key, (name, supplied) in FILES.items():
    dest = SOURCE / name
    if not dest.exists(): shutil.copyfile(supplied, dest)
    images[key] = Image.open(dest).convert('RGBA')
    assert images[key].size == (1448, 1086)

# id, source, l/t/r/b selection, state, source foot pivot x (or None).
SLICES = [
 ('player.idle','A',(36,25,175,215),'Idle',91),
 ('player.run-a','A',(188,28,337,216),'Run',247),
 ('player.run-b','A',(346,30,488,216),'Run',421),
 ('player.sprint-a','A',(500,29,640,216),'Run',561),
 ('player.sprint-b','A',(642,29,807,216),'Run',735),
 ('player.jump','A',(814,12,990,218),'Jump/Fall',911),
 ('player.crouch','A',(1002,69,1148,216),'Crouch',1064),
 ('player.crouch-low','A',(1151,91,1288,216),'Crouch',1206),
 ('player.crouch-aim','A',(1290,94,1444,216),'Crouch/Shoot',1352),
 ('player.shoot','A',(28,230,254,420),'Shoot',100),
 ('player.aim-up','A',(277,218,477,420),'Aim',356),
 ('player.launcher','A',(463,240,622,421),'Rocket',527),
 ('player.throw','A',(630,258,805,421),'Throw',720),
 ('player.hit','A',(908,243,1097,421),'Hit',1002),
 ('player.dead','A',(1120,310,1402,417),'Dead',1252),
 ('enemy.soldier','A',(27,444,243,632),'Shoot',100),
 ('enemy.soldier-run','A',(228,446,418,632),'Run',330),
 ('enemy.melee','A',(430,448,643,634),'Attack',522),
 ('enemy.melee-run','A',(586,454,761,634),'Run',685),
 ('enemy.melee-charge','A',(760,449,950,634),'Charge',839),
 ('enemy.shield','A',(948,436,1118,635),'Idle',1001),
 ('enemy.shield-run','A',(1113,439,1268,635),'Run',1170),
 ('enemy.shield-hit','A',(1269,444,1446,637),'Hit',1340),
 ('tank.idle','A',(17,617,466,849),'Idle',231),
 ('tank.wreck','A',(994,640,1405,851),'Dead',1194),
 ('weapon.rifle','A',(47,860,316,966),'Rifle',None),
 ('weapon.shotgun','A',(341,871,572,966),'Shotgun',None),
 ('weapon.rocket','A',(594,865,891,965),'Rocket',None),
 ('pickup.grenades','A',(914,862,1087,965),'Supply',None),
 ('pickup.health','A',(1119,864,1238,965),'Supply',None),
 ('projectile.bullet','A',(23,995,187,1045),'Bullet',None),
 ('projectile.rocket','A',(410,976,636,1053),'Rocket',None),
 ('projectile.grenade','A',(751,979,806,1047),'Grenade',None),
 ('effect.muzzle','A',(817,975,938,1067),'Muzzle',None),
 ('effect.impact','A',(941,970,1088,1081),'Impact',None),
 ('effect.explosion','A',(1088,960,1306,1085),'Explosion',None),
 ('effect.smoke','A',(1311,971,1447,1085),'Smoke',None),
 ('ground.flat-a','B',(12,68,280,169),'Ground',None),
 ('ground.flat-b','B',(280,71,567,169),'Ground',None),
 ('ground.slope','B',(567,63,882,170),'Ground',None),
 ('platform.stone','B',(879,67,1023,190),'Platform',None),
 ('platform.rock','B',(1025,28,1201,191),'Platform',None),
 ('platform.tall','B',(1254,20,1439,193),'Platform',None),
 ('platform.wood','B',(13,195,278,310),'Platform',None),
 ('platform.short','B',(284,207,429,310),'Platform',None),
 ('platform.scaffold','B',(637,184,879,313),'Platform',None),
 ('platform.bridge','B',(884,216,1126,314),'Platform',None),
 ('platform.metal','B',(1131,215,1437,314),'Platform',None),
 ('crate.intact','B',(14,325,146,439),'Full',None),
 ('crate.worn','B',(151,325,282,440),'Damaged',None),
 ('crate.broken','B',(286,328,428,440),'Damaged',None),
 ('crate.debris','B',(434,329,638,442),'Dead',None),
 ('barrel.intact','B',(647,328,761,454),'Full',None),
 ('barrel.worn','B',(766,328,876,454),'Damaged',None),
 ('barrel.dented','B',(881,330,984,454),'Damaged',None),
 ('barrel.broken','B',(986,337,1113,456),'Dead',None),
 ('barrel.wreck','B',(1123,330,1249,455),'Dead',None),
 ('cover.sandbags','B',(9,464,228,546),'Full',None),
 ('cover.sandbags-short','B',(229,465,331,546),'Full',None),
 ('cover.sandbags-tall','B',(333,458,450,546),'Full',None),
 ('cover.sandbags-broken','B',(449,459,651,549),'Dead',None),
 ('cover.concrete','B',(655,468,838,566),'Full',None),
 ('cover.concrete-broken','B',(839,475,1017,576),'Damaged',None),
 ('prop.sign','B',(26,550,147,748),'Scenery',None),
 ('prop.warning','B',(164,557,257,740),'Scenery',None),
 ('prop.flag','B',(264,551,403,766),'Scenery',None),
 ('prop.tent','B',(370,611,597,769),'Scenery',None),
 ('prop.tower','B',(1250,564,1434,789),'Scenery',None),
 ('building.base','B',(10,748,458,943),'Scenery',None),
 ('building.barracks','B',(454,787,692,932),'Scenery',None),
 ('building.bunker','B',(686,783,1055,933),'Scenery',None),
 ('prop.rocks','B',(1002,908,1315,975),'Scenery',None),
 ('prop.rock','B',(1051,840,1132,892),'Scenery',None),
 ('prop.scrub','B',(1209,830,1298,895),'Scenery',None),
 ('background.cloud','B',(7,968,357,1064),'Scenery',None),
 ('background.cloud-small','B',(291,951,496,1008),'Scenery',None),
]
OUT = ROOT / 'art/slices'
OUT.mkdir(parents=True, exist_ok=True)
runtime = ROOT / 'assets/resources/comic'
runtime.mkdir(parents=True, exist_ok=True)
entries=[]
def largest_island(arr):
    """Remove disconnected pieces of adjacent sprites, never key out black ink.
    Flood-fill uses alpha only. Each chosen bounding box is reviewed on paper below.
    """
    mask=(arr[:,:,3]>8).astype('uint8')
    seen=np.zeros(mask.shape,dtype=bool)
    components=[]
    hh,ww=mask.shape
    for yy,xx in zip(*np.nonzero(mask)):
        if seen[yy,xx]: continue
        stack=[(int(xx),int(yy))];seen[yy,xx]=True;component=[]
        while stack:
            cx,cy=stack.pop();component.append((cx,cy))
            for nx,ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
                if 0<=nx<ww and 0<=ny<hh and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True;stack.append((nx,ny))
        components.append(component)
    keep=max(components,key=len)
    result=np.zeros_like(mask)
    for xx,yy in keep: result[yy,xx]=1
    # 1px antialias fringe belongs to the selected silhouette.
    from PIL import ImageFilter
    fringe=np.array(Image.fromarray(result*255).filter(ImageFilter.MaxFilter(3)))>0
    arr[~fringe]=0
    return arr
for ident, src, rect, state, pivot in SLICES:
    im=images[src].crop(rect)
    arr=np.array(im)
    arr[arr[:,:,3]<=8]=0
    if ident not in ['player.dead']:
        arr=largest_island(arr)
    # Preserve every visible black outline and white fill. Grayscale accents only.
    gray=np.round(arr[:,:,:3].astype(float) @ np.array([.299,.587,.114])).astype('uint8')
    arr[:,:,:3]=gray[:,:,None]
    im=Image.fromarray(arr)
    bb=im.getbbox()
    if not bb: raise ValueError(ident)
    im=im.crop(bb)
    scale=min(1, (300 if ident.startswith(('tank','building')) else 220)/max(im.size))
    # Foot pivots are measured per key pose; common pixels-per-unit preserves head scale.
    anchor=((pivot-rect[0]-bb[0])/im.width if pivot else .5,0 if pivot else .5)
    size=im.size
    im.thumbnail((round(size[0]*scale),round(size[1]*scale)),Image.Resampling.LANCZOS)
    im.save(OUT/f'{ident}.png',optimize=True)
    entries.append(dict(id=ident,source=src,crop=list(rect),trim=list(bb),sourceSize=list(size),size=list(im.size),anchor=list(anchor),state=state,qa='reviewed',file=f'art/slices/{ident}.png'))

# Derived cutout rig pieces. Polygons exclude the other leg and preserve ink borders.
# Source A idle: waist (91,149), muzzle (165,121). No newly painted raster art.
RIG = [
 ('rig.torso',(43,40,167,153),[(43,40),(167,40),(167,112),(122,112),(122,143),(98,153),(75,149),(43,143)],(91,149)),
 ('rig.thigh',(63,142,100,181),[(79,142),(100,146),(83,181),(63,174)],(86,148)),
 ('rig.shin',(48,170,86,205),[(68,170),(86,176),(73,205),(48,205)],(75,175)),
 ('rig.boot',(43,193,85,215),[(43,193),(85,193),(85,215),(43,215)],(63,201)),
 ('rig.enemy-torso',(36,457,181,572),[(36,457),(181,457),(181,552),(143,556),(111,572),(80,572),(36,557)],(100,568)),
 ('rig.tank-body',(17,648,458,849),[(17,648),(278,648),(278,719),(458,719),(458,849),(17,849)],(231,846)),
 ('rig.tank-barrel',(275,676,459,721),[(275,693),(459,676),(459,710),(275,721)],(452,695)),
]
for ident,rect,poly,pivot in RIG:
    im=images['A'].crop(rect)
    mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon([(x-rect[0],y-rect[1]) for x,y in poly],fill=255)
    a=np.array(im);a[:,:,3]=np.minimum(a[:,:,3],np.array(mask));a[a[:,:,3]<=8]=0
    gray=np.round(a[:,:,:3].astype(float) @ np.array([.299,.587,.114])).astype('uint8');a[:,:,:3]=gray[:,:,None]
    im=Image.fromarray(a);im.save(OUT/f'{ident}.png',optimize=True)
    anchor=((pivot[0]-rect[0])/im.width,1-(pivot[1]-rect[1])/im.height)
    entries.append(dict(id=ident,source='A',crop=list(rect),polygon=[list(p) for p in poly],trim=[0,0,im.width,im.height],sourceSize=list(im.size),size=list(im.size),anchor=list(anchor),state='Segmented rig',qa='reviewed',file=f'art/slices/{ident}.png'))

# Infantry cutouts reuse the cleaned parent silhouette; no neighbouring knife/feet survive.
for ident,parent,pivot,cut,shield in [
    ('rig.melee-torso','enemy.melee-run',(674,559),566,False),
    ('rig.shield-torso','enemy.shield',(1007,566),568,True),
]:
    base=next(e for e in entries if e['id']==parent)
    im=Image.open(OUT/f'{parent}.png')
    origin=(base['crop'][0]+base['trim'][0],base['crop'][1]+base['trim'][1])
    a=np.array(im)
    for yy in range(im.height):
        for xx in range(im.width):
            if origin[1]+yy>cut and (not shield or origin[0]+xx<1015):a[yy,xx]=0
    im=Image.fromarray(a);bb=im.getbbox();im=im.crop(bb);im.save(OUT/f'{ident}.png',optimize=True)
    anchor=((pivot[0]-origin[0]-bb[0])/im.width,1-(pivot[1]-origin[1]-bb[1])/im.height)
    entries.append(dict(id=ident,source='A',derivedFrom=parent,crop=base['crop'],trim=list(bb),sourceSize=list(im.size),size=list(im.size),anchor=list(anchor),state='Segmented rig',qa='reviewed',file=f'art/slices/{ident}.png'))

# One padded runtime texture; static frame rectangles are created once at load.
atlas=Image.new('RGBA',(2048,2048))
x=y=4; row=0
for e in entries:
    im=Image.open(OUT/f"{e['id']}.png")
    if x+im.width+4>2048: x=4;y+=row+8;row=0
    if y+im.height+4>2048: raise ValueError('Atlas overflow')
    atlas.paste(im,(x,y))
    e['atlas']=[x,y,im.width,im.height]
    # Extrude the outermost texels 2px, separated by a further 4px transparent gutter.
    atlas.paste(im.crop((0,0,im.width,1)).resize((im.width,2)),(x,y-2))
    atlas.paste(im.crop((0,im.height-1,im.width,im.height)).resize((im.width,2)),(x,y+im.height))
    atlas.paste(im.crop((0,0,1,im.height)).resize((2,im.height)),(x-2,y))
    atlas.paste(im.crop((im.width-1,0,im.width,im.height)).resize((2,im.height)),(x+im.width,y))
    x+=im.width+8;row=max(row,im.height)
atlas=atlas.crop((0,0,2048,1536))
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(runtime/'comic.png',optimize=True)
missing=[
 dict(id='tank.fire',qa='needs-remake',reason='The flash overlaps the barrel. Use isolated tank body plus independent muzzle/smoke; no baked flash frame.'),
 dict(id='background.poles',qa='needs-remake',reason='Cable is joined to another prop and wall. Keep procedural cables instead of cutting wires.'),
 dict(id='background.desert',qa='needs-remake',reason='Clouds and foreground rocks overlap the skyline. Use layered building/cloud slices; desert ridge remains original drawing.'),
 dict(id='player.run-loop',qa='keyposes-only',reason='The poses are not a continuous loop; use a segmented leg rig and upper-body keyposes.'),
 dict(id='enemy.hit-dead',qa='keyposes-only',reason='Only player has complete hit/dead illustration. Enemy uses its own body rotation/collapse, not a mismatched player skin.'),
 dict(id='boss.colossus',qa='needs-remake',reason='No towering boss in supplied atlas; original articulated Colossus retained as explicit fallback.'),
]
manifest=dict(version=1,alphaCutoff=8,grayscale=True,padding=8,extrusion=2,compression='PNG indexed RGBA 256; original/slices preserved as RGBA',textureSize=[2048,1536],textureBytes=(runtime/'comic.png').stat().st_size,sources={k:dict(file=f'art/source/{v[0]}',size=list(images[k].size),mode='RGBA',sha256=hashlib.sha256((SOURCE/v[0]).read_bytes()).hexdigest()) for k,v in FILES.items()},frames=entries,unavailable=missing)
(ROOT/'art/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# Static TS data is engine-independent, also used by weapon/muzzle and regression tests.
(ROOT/'assets/scripts/render/ComicFrames.ts').write_text('// Generated by scripts/prepare-comic-art.py; source/crop/QA: art/manifest.json\nexport const ComicFrames = '+json.dumps({e['id']:{k:e[k] for k in ['atlas','anchor','sourceSize','size']} for e in entries},separators=(',',':'))+' as const;\nexport type ComicFrameId = keyof typeof ComicFrames;\n',encoding='utf-8')
cards=''.join(f'<article><div class="sample"><img src="slices/{e["id"]}.png"></div><b>{e["id"]}</b><p>{e["state"]} · {e["size"][0]}×{e["size"][1]}<br>source {e["source"]}: {e["crop"]}<br>foot/centre {e["anchor"]}</p></article>' for e in entries)
missinghtml=''.join(f'<li><b>{e["id"]}</b> · {e["qa"]}: {html.escape(e["reason"])}</li>' for e in missing)
(ROOT/'art/preview.html').write_text('<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>线条突围 · 美术切片检查</title><style>body{font:16px system-ui;margin:24px;background:#f6f5f1;color:#222}h1{font-size:27px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}article{border:1px solid #aaa;border-radius:14px;padding:14px;background:white}.sample{height:210px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 50%/20px 20px}.sample img{max-width:100%;max-height:205px}p{font-size:12px;line-height:1.7}li{margin:12px 0}</style><h1>线条突围 V0.5 · 资源检查</h1><p>原图均为 1448×1086 RGBA。透明度≤8的微尘清零；保留黑色轮廓；红色点缀转为灰阶。角色脚底锚点逐姿势设定；碰撞体独立。下列切片是插画关键姿势，并非完整连续动画。</p><a href="manifest.json">完整 manifest</a><h2>待重制 / 有限姿势</h2><ul>'+missinghtml+'</ul><h2>已切分 '+str(len(entries))+' 项</h2><div class="grid">'+cards+'</div></html>',encoding='utf-8')
# Contact sheets on paper show alpha halos and adjacent-sprite contamination.
for start in range(0,len(entries),24):
    page=Image.new('RGB',(1200,900),(246,245,241))
    d=ImageDraw.Draw(page)
    for i,e in enumerate(entries[start:start+24]):
        im=Image.open(OUT/f"{e['id']}.png");im.thumbnail((185,175))
        px=(i%6)*200;py=(i//6)*225
        page.paste(im,(px+(200-im.width)//2,py+10),im)
        d.text((px+5,py+192),e['id'],fill='#222')
    page.save(ROOT/f'reports/comic-contact-{start//24}.jpg')
print(f'{len(entries)} reviewed selections; atlas {manifest["textureBytes"]} bytes; art/preview.html')
