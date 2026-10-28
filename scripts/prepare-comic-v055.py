"""Source-only cuts: modular terrain and weapon-free variants of supplied bodies.
No regenerated artwork, body scaling, new character limbs or baked backgrounds.
"""
from pathlib import Path
import hashlib, json, shutil, html
import numpy as np
from PIL import Image, ImageDraw
import runpy

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'art/source/v055'; SRC.mkdir(parents=True, exist_ok=True)
OUT = ROOT/'art/slices/v055'; OUT.mkdir(parents=True, exist_ok=True)
source = SRC/'黑白漫画可拼接地形.png'
if not source.exists():
    shutil.copyfile(Path('C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-f542baf1-7a0b-4da9-a809-5528768d1cbe.png'), source)
sheet = Image.open(source).convert('RGBA')
entries=[]; pixels={}; socket_adjustments={}
def add(id, im, **data):
    im.save(OUT/(id+'.png'), optimize=True)
    entries.append(dict(id=id, size=list(im.size), sourceSize=list(im.size), anchor=[0,0], **data))
    pixels[id]=im
def cut(id,box):
    im=sheet.crop(box);a=np.array(im);a[a[:,:,3]<=8]=0
    # Preserve the actual black outline and white interiors; discard alpha speckle.
    gray=np.rint(a[:,:,:3].astype(float)@np.array([.299,.587,.114])).astype('uint8');a[:,:,:3]=gray[:,:,None]
    add(id,Image.fromarray(a),source='terrain',crop=list(box))

# Top pieces share SOURCE walk line y=94 and the same lower join y=125.
# Interior and bottom rows are independent; their dots and outlines never stretch.
for col,(l,r) in {'left':(17,53),'middle':(280,552),'right':(1390,1434)}.items():
    cut('tile.top.'+col,(l,42 if col=='left' else 40 if col=='right' else 70,r,125))
    cut('tile.fill.'+col,(l,125,r,172))
    cut('tile.bottom.'+col,(l,172,r,194))
for id,box in [
 ('tile.metal.left',(42,848,91,939)),('tile.metal.middle',(480,848,918,939)),('tile.metal.right',(1380,848,1418,939)),
 ('tile.corner-down',(585,225,868,421)),('tile.corner-up',(927,226,1221,421)),
 ('tile.pillar',(1237,442,1408,792)),('tile.ledge',(207,680,550,790)),
]:cut(id,box)

# Reuse and normalize the supplied edge pixels before packing. Every terrain
# join has matching columns; body marks crossing a cut are discarded whole.
pixels=runpy.run_path(str(ROOT/'scripts/normalize-terrain.py'))['normalize'](pixels)
for e in entries:
    if e['source']=='terrain':
        im=pixels[e['id']];e['size']=list(im.size);e['sourceSize']=list(im.size);e['join']='normalized-periodic';im.save(OUT/(e['id']+'.png'),optimize=True)
add('tile.metal.support',pixels['tile.metal.support'],source='terrain',crop=[480,896,552,939],join='fixed-size-bracket')

old=json.loads((ROOT/'art/manifest.json').read_text('utf-8'))
for e in old['frames']:
    id=e['id']
    if not id.startswith('player.') or (id not in old['muzzles'] and id!='player.hit.0'):continue
    im=Image.open(ROOT/e['file']).convert('RGBA');w,h=im.size
    # Source socket and pivot resolve a separate mask for EVERY real animation frame.
    socket=old['muzzles'].get(id,[40,40])
    mx=e['anchor'][0]*w+socket[0]/.64*w/e['sourceSize'][0]
    my=(1-e['anchor'][1])*h-socket[1]/.64*h/e['sourceSize'][1]
    horizontal=any(s in id for s in ['stand-shoot','run-shoot','crouch-shoot','crouch.'])
    # The old sockets were measured a few pixels below the actual barrel.
    # Removing pixels must follow the painted barrel, not that old approximation.
    correction = 3 if horizontal else 8
    my-=correction;mx-=2
    socket_adjustments[id]=[-1.28, correction*.64]
    dx,dy=(56,0) if horizontal else (52,18 if '.idle.' in id else 12)
    if id=='player.fall.0':dx,dy=59,-33
    if id=='player.fall.1':continue # This source pose has no gun.
    # Remove the rifle silhouette and magazine, leaving legs/head/pack untouched.
    # Supporting hands below the weapon are retained as a separate ORIGINAL-pixel layer.
    length=(dx*dx+dy*dy)**.5;nx=-dy/length;ny=dx/length
    bx,by=mx-dx,my-dy
    mask=Image.new('L',(w,h));d=ImageDraw.Draw(mask)
    d.polygon([(bx+nx*-10,by+ny*-10),(mx+7+nx*-10,my+ny*-10),
               (mx+7+nx*9,my+ny*9),(bx+nx*9,by+ny*9)],fill=255)
    d.polygon([(mx-dx*.72,my-dy*.72),(mx-dx*.35,my-dy*.35),
               (mx-dx*.4,my-dy*.4+18),(mx-dx*.77,my-dy*.77+18)],fill=255)
    a=np.array(im);m=np.array(mask)>0
    # White hand areas are below the barrel, not in the weapon's upper outline.
    yy,xx=np.indices((h,w));t=((xx-bx)*dx+(yy-by)*dy)/(length*length)
    below=(xx-bx)*nx+(yy-by)*ny
    hand=m & (a[:,:,:3].min(axis=2)>150) & (a[:,:,3]>128) & (t>.20)&(t<.78)&(below>5)
    # Preserve the original hand outline, not just disconnected white finger
    # pixels. The old all-transparent removal also punched holes in the torso.
    expanded=hand.copy()
    for sy,sx in [(1,0),(-1,0),(0,1),(0,-1)]:expanded |= np.roll(hand,(sy,sx),(0,1))
    expanded &= m & (below>4) & (t>.16)&(t<.82)
    grips=np.zeros_like(a);grips[expanded]=a[expanded]
    original_alpha=a[:,:,3].copy()
    a[m]=0
    waist=e['anchor'][0]*w
    torso=m & (xx<waist+11) & (original_alpha>128)
    a[torso]=[250,250,250,255]
    data=dict(source='player',original=id,sourceFile=e['file'],removalMask='rifle barrel and magazine; original white grip pixels retained',anchor=e['anchor'],sourceSize=e['sourceSize'])
    # add accepts default metadata then caller overrides without resizing the image.
    for name,arr in [('unarmed.',a),('grip.',grips)]:
        add(name+id,Image.fromarray(arr),**{k:v for k,v in data.items() if k not in ('anchor','sourceSize')})
        entries[-1]['anchor']=e['anchor'];entries[-1]['sourceSize']=e['sourceSize']

# Reuse the knife already present in the supplied enemy art. Isolate only its
# blade/hilt, rotate to a horizontal attachment, and retain its black outline.
knife_source=ROOT/'art/slices/enemy.melee.png'
knife=Image.open(knife_source).convert('RGBA');mask=Image.new('L',knife.size)
ImageDraw.Draw(mask).polygon([(140,77),(150,77),(199,10),(207,17),(207,36),(163,90),(154,97),(140,86)],fill=255)
knife.putalpha(Image.fromarray(np.minimum(np.array(knife)[:,:,3],np.array(mask))))
knife=knife.rotate(-50,resample=Image.Resampling.BICUBIC,expand=True);knife=knife.crop(knife.getbbox())
add('weapon.knife',knife,source='existing-knife',sourceFile=knife_source.relative_to(ROOT).as_posix(),sourceSHA256=hashlib.sha256(knife_source.read_bytes()).hexdigest())

atlas=Image.new('RGBA',(2048,1024));x=y=4;row=0
for e in sorted(entries,key=lambda e:-e['size'][1]):
    im=pixels[e['id']]
    if x+im.width+4>atlas.width:x=4;y+=row+8;row=0
    if y+im.height+4>atlas.height:raise ValueError('Supplement atlas overflow')
    atlas.paste(im,(x,y));e['atlas']=[x,y,*im.size]
    for box,sz,pos in [((0,0,im.width,1),(im.width,4),(x,y-4)),((0,im.height-1,im.width,im.height),(im.width,4),(x,y+im.height)),((0,0,1,im.height),(4,im.height),(x-4,y)),((im.width-1,0,im.width,im.height),(4,im.height),(x+im.width,y))]:
        atlas.paste(im.crop(box).resize(sz),pos)
    x+=im.width+8;row=max(row,im.height)
runtime=ROOT/'assets/resources/comic/supplement.png'
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(runtime,optimize=True)
data={e['id']:{k:e[k] for k in ['atlas','anchor','sourceSize','size']} for e in entries}
(ROOT/'assets/scripts/render/SupplementFrames.ts').write_text('// Generated by scripts/prepare-comic-v055.py\nexport const SupplementFrames = '+json.dumps(data,separators=(',',':'))+' as const;\nexport const SupplementSockets: Record<string, readonly [number, number]> = '+json.dumps(socket_adjustments,separators=(',',':'))+';\n',encoding='utf-8')
# Re-running either original or supplement cut pipeline restores the merged registry.
registry=ROOT/'assets/scripts/render/ComicFrames.ts';text=registry.read_text('utf-8')
if 'import { SupplementFrames }' not in text:
    text=text.replace('export const ComicFrames = ','import { SupplementFrames } from "./SupplementFrames";\nconst BaseComicFrames = ',1)
    text=text.replace('export type ComicFrameId =','export const ComicFrames = { ...BaseComicFrames, ...SupplementFrames } as const;\nexport type ComicFrameId =',1)
    registry.write_text(text,encoding='utf-8')
record=dict(version='0.5.5',source=dict(file=source.relative_to(ROOT).as_posix(),size=list(sheet.size),mode=sheet.mode,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),transparentPixels=int((np.array(sheet)[:,:,3]==0).sum())),
    playerSourceSHA256=old['sources']['player']['sha256'],textureSize=list(atlas.size),textureBytes=runtime.stat().st_size,frames=entries,groundScale=.6,metalScale=.5,walkLine=94,extrusion=4,padding=8)
(ROOT/'art/v055-manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''.join(f'<article><b>{e["id"]}</b><div><img src="slices/v055/{e["id"]}.png"></div><small>{html.escape(str(e.get("crop",e.get("original"))))}</small></article>' for e in entries)
(ROOT/'art/v055-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>V0.5.5 tiles and weapon replacement</title><style>body{font:15px system-ui;background:#fafafa;margin:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}article{border:1px solid #bbb;padding:10px}article div{height:200px;background:repeating-conic-gradient(#ddd 0% 25%,white 0% 50%) 50%/16px 16px;display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:190px}b{font-size:12px}</style><h1>原图模块 / 去枪身体帧</h1><p>固定比例拼接，末块裁切；身体保留原帧尺寸/脚底锚点。</p><a href="v055-manifest.json">来源与裁切 manifest</a><div class="grid">'+cards+'</div>',encoding='utf-8')
print(f'{len(entries)} cuts; {runtime.stat().st_size} bytes; packed bottom {y+row}')
