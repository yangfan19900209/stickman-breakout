"""Crop the four user supplied sheets. Never erase guns or assemble body parts.

Coordinates and feet/muzzles are authored in SOURCE pixels. No image generation,
mirror synthesis, non-uniform resizing, or baked reference background is used.
"""
from pathlib import Path
import hashlib, html, json
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art/source/v057'
OUT = ROOT / 'art/slices/v057'
OUT.mkdir(parents=True, exist_ok=True)
names = {'knife':'持刀士兵动作.png', 'rocket':'火箭筒士兵动作.png',
         'ground':'漫画地形模块.png', 'metal':'金属平台模块.png'}
sheets = {k:Image.open(SRC/v).convert('RGBA') for k,v in names.items()}
entries, pixels, clips, sockets = [], {}, {}, {}

def cut(id, source, box, foot=None, muzzle=None, scale=.84):
    im = sheets[source].crop(box)
    a = np.array(im)
    a[a[:,:,3] < 16] = 0  # alpha speckle only; all painted RGB pixels stay intact
    im = Image.fromarray(a)
    if foot:
        # Discard only small cropped fragments touching another cell's boundary.
        # Keep detached native stars, dust, knife arcs and dropped weapons.
        mask=a[:,:,3]>0; seen=np.zeros(mask.shape,dtype=bool); h,w=mask.shape
        for yy,xx in zip(*np.where(mask)):
            if seen[yy,xx]: continue
            stack=[(int(yy),int(xx))]; seen[yy,xx]=True; component=[]; edge=False
            while stack:
                cy,cx=stack.pop();component.append((cy,cx))
                edge |= cy==0 or cx==0 or cy==h-1 or cx==w-1
                for ny,nx in [(cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)]:
                    if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                        seen[ny,nx]=True;stack.append((ny,nx))
            if len(component)<6 or (edge and len(component)<400):
                for cy,cx in component:a[cy,cx]=0
        im=Image.fromarray(a)
    trim = im.getbbox() if foot else (0,0,im.width,im.height)
    if not trim: raise ValueError(id)
    im = im.crop(trim)
    origin = [box[0]+trim[0], box[1]+trim[1]]
    anchor = [(foot[0]-origin[0])/im.width, 1-(foot[1]-origin[1])/im.height] if foot else [0,0]
    e = dict(id=id, source=source, crop=list(box), trim=list(trim), origin=origin,
             size=list(im.size), sourceSize=list(im.size), anchor=anchor, scale=scale,
             file=(OUT/(id+'.png')).relative_to(ROOT).as_posix())
    if muzzle and foot:
        sockets[id] = [round((muzzle[0]-foot[0])*scale,4), round((foot[1]-muzzle[1])*scale,4)]
        e['muzzleSource'] = list(muzzle)
    entries.append(e); pixels[id] = im
    im.save(ROOT/e['file'], optimize=True)

def row(family, action, y0, y1, cells, baseline, muzzles=None):
    ids=[]
    for i, cell in enumerate(cells):
        # l, r, pelvis x; an optional per-frame floor avoids foot sliding.
        l,r,pivot,*floor = cell
        id = f'direct.{family}.{action}.{i}'
        cut(id, family, (l,y0,r,y1), (pivot,floor[0] if floor else baseline),
            muzzles[i] if muzzles else None)
        ids.append(id)
    clips[f'{family}.{action}'] = ids

row('knife','idle',0,116,[(168,270,207),(276,379,318),(387,491,429),(500,605,540)],110)
row('knife','run',113,233,[(163,276,211),(278,388,324),(389,498,436),(499,608,544),(609,719,657),(720,831,768),(833,958,883),(960,1077,999),(1078,1187,1117)],224)
row('knife','jump',234,359,[(167,279,211,342),(292,410,344,354),(418,526,461,356),(535,647,581,356)],356)
row('knife','fall',244,364,[(895,1023,941,363),(1033,1154,1079,361)],361)
row('knife','crouch',353,442,[(211,322,260),(330,444,380)],439)
row('knife','crouch-walk',439,531,[(255,365,305),(386,498,435),(509,620,558),(623,735,671),(736,849,783),(849,960,894),(965,1078,1009)],526)
row('knife','combo1',532,632,[(268,387,315),(401,541,450),(542,664,590),(680,786,724)],626)
row('knife','combo2',630,735,[(259,405,321),(409,537,480),(558,676,612),(701,844,754)],727)
row('knife','combo3',730,834,[(272,404,322),(404,541,449),(546,737,627),(739,870,797),(880,993,934)],827)
row('knife','air-attack',827,915,[(264,425,325,923),(476,620,538,923)],923)
row('knife','hit',914,1012,[(189,294,226),(321,446,365),(451,578,503),(593,743,657)],1007)
row('knife','death',1011,1086,[(211,343,258),(351,486,414),(489,635,553),(636,778,700),(779,925,842),(928,1116,989)],1081)

row('rocket','idle',0,113,[(177,287,224),(299,404,344),(419,524,463),(539,645,584)],108,
    [(278,40),(398,39),(516,39),(637,37)])
row('rocket','run',112,222,[(164,285,215),(277,404,335),(403,525,455),(519,645,574),(646,763,695),(766,898,823)],215,
    [(277,145),(397,144),(518,137),(637,135),(754,137),(888,129)])
row('rocket','jump',224,346,[(168,289,220,339),(292,422,349,338),(429,550,481,342),(564,690,614,343)],343,
    [(281,260),(414,253),(543,259),(682,262)])
row('rocket','fall',246,350,[(993,1125,1043,358),(1126,1259,1177,358)],358,
    [(1103,266),(1239,277)])
row('rocket','crouch',346,438,[(195,316,245),(333,453,385)],433,
    [(308,379),(446,379)])
row('rocket','crouch-walk',434,529,[(242,367,292),(394,514,443),(542,662,591),(682,803,729)],522,
    [(360,461),(506,461),(655,462),(796,457)])
row('rocket','aim',527,626,[(170,291,218),(312,435,365),(456,582,510)],620,
    [(283,557),(429,555),(575,553)])
# Each fire row has THREE bodies and one detached travelling missile. The missile
# is deliberately NOT part of an actor frame; projectiles belong to the pool.
row('rocket','stand-fire',615,720,[(243,358,290),(410,530,466),(844,1057,897)],711,
    [(353,650),(527,649),(949,648)])
row('rocket','crouch-fire',718,805,[(245,375,296),(398,531,459),(831,1022,886)],797,
    [(366,745),(529,744),(941,747)])
row('rocket','run-fire',799,902,[(225,368,286),(387,534,449),(789,962,850)],898,
    [(360,832),(532,829),(918,841)])
row('rocket','hit',897,1001,[(183,302,233),(320,442,370),(448,596,508),(625,778,688)],997)
row('rocket','death',997,1086,[(188,377,242),(378,536,435),(537,748,590),(749,891,805),(898,1083,963)],1075)

# Ground uses unmodified, measured source strips. Joins are chosen in bare white
# soil and calm grass profiles; no mirrored texture, circles, or stretched ends.
for col,(l,r) in {'left':(22,49),'middle':(743,883),'right':(937,966)}.items():
    cut('native.top.'+col,'ground',(l,106 if col!='middle' else 126,r,177),scale=.6)
cut('native.fill.left','ground',(1118,414,1145,452),scale=.6)
cut('native.fill.right','ground',(1214,410,1243,448),scale=.6)
cut('native.bottom.left','ground',(189,205,226,238),scale=.6)
cut('native.bottom.middle','ground',(800,205,850,238),scale=.6)
cut('native.bottom.right','ground',(153,205,182,238),scale=.6)
# Taller white soil comes from a broad, quiet source panel, not a 33px dot loop.
cut('native.soil','ground',(430,350,599,455),scale=.6)
cut('native.grass','ground',(1115,105,1236,156),scale=.6)
cut('native.stone-ledge','ground',(1108,739,1255,838),scale=.6)
# The top beam's actual standing surface is source y=69. Caps stay native width,
# a continuous centre strip repeats rivets; brackets are independent full cuts.
cut('native.metal.left','metal',(36,64,86,134),scale=.5)
cut('native.metal.middle','metal',(322,64,557,134),scale=.5)
cut('native.metal.right','metal',(1355,64,1412,134),scale=.5)
cut('native.metal.bracket','metal',(78,128,184,174),scale=.5)
cut('native.metal.post','metal',(892,501,998,729),scale=.5)

# Stable shelf packing, 4px RGBA extrusion on all sides INCLUDING corners.
atlas=Image.new('RGBA',(2048,1024)); x=y=4; height=0
for e in sorted(entries,key=lambda e:(-e['size'][1],e['id'])):
    im=pixels[e['id']]; w,h=im.size
    if x+w+4>atlas.width: x=4; y+=height+8; height=0
    if y+h+4>atlas.height: raise ValueError('Native atlas overflow')
    atlas.paste(im,(x,y)); e['atlas']=[x,y,w,h]
    for box,sz,pos in [((0,0,w,1),(w,4),(x,y-4)),((0,h-1,w,h),(w,4),(x,y+h)),
                       ((0,0,1,h),(4,h),(x-4,y)),((w-1,0,w,h),(4,h),(x+w,y)),
                       ((0,0,1,1),(4,4),(x-4,y-4)),((w-1,0,w,1),(4,4),(x+w,y-4)),
                       ((0,h-1,1,h),(4,4),(x-4,y+h)),((w-1,h-1,w,h),(4,4),(x+w,y+h))]:
        atlas.paste(im.crop(box).resize(sz,Image.Resampling.NEAREST),pos)
    x+=w+8; height=max(height,h)
runtime=ROOT/'assets/resources/comic/native.png'
# Indexed compression only, never a geometric transform. Original RGBA cuts
# remain archived for inspection/re-export; this keeps the WeChat package small.
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(runtime,optimize=True)
data={e['id']:{k:e[k] for k in ['atlas','anchor','sourceSize','size']} for e in entries}
(ROOT/'assets/scripts/render/DirectFrames.ts').write_text(
    '// Generated by scripts/prepare-comic-v057.py. Original complete action frames.\n'
    +'export const DirectFrames = '+json.dumps(data,separators=(',',':'))+' as const;\n'
    +'export const DirectClips = '+json.dumps(clips,separators=(',',':'))+' as const;\n'
    +'export const DirectSockets: Partial<Record<keyof typeof DirectFrames, readonly [number,number]>> = '
    +json.dumps(sockets,separators=(',',':'))+';\n',encoding='utf-8')
sources={k:dict(file=(SRC/v).relative_to(ROOT).as_posix(),size=list(sheets[k].size),mode='RGBA',
               sha256=hashlib.sha256((SRC/v).read_bytes()).hexdigest(),
               transparentPixels=int((np.array(sheets[k])[:,:,3]==0).sum())) for k,v in names.items()}
record=dict(version='0.5.7',sources=sources,frames=entries,clips=clips,textureSize=list(atlas.size),
            textureBytes=runtime.stat().st_size,extrusion=4,padding=8,
            notes=['Knife run: 9 actual bodies; crouch-walk: 7; air attack: 2.',
                   'Rocket fire: 3 actual bodies per row, detached missile excluded. Death: 5 actual bodies.',
                   'No weapon removal masks, body-part assembly, mirroring or RGB repainting.'])
(ROOT/'art/v057-manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''.join(f'<article><b>{e["id"]}</b><div><img src="slices/v057/{e["id"]}.png"></div></article>' for e in entries)
(ROOT/'art/v057-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>V0.5.7 原图裁切</title>'
    +'<style>body{font:14px system-ui;margin:24px;background:#fafafa}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}article{border:1px solid #bbb;padding:8px}article div{height:150px;background:repeating-conic-gradient(#ddd 0% 25%,white 0% 50%) 50%/16px 16px;display:flex;align-items:end;justify-content:center}img{max-width:100%;max-height:145px}b{font-size:11px}</style>'
    +'<h1>完整持刀 / 火箭筒动作与新地形</h1><p>只裁切原图。角色脚底和枪口单独标注，数量以实际可见身体为准。</p><a href="v057-manifest.json">裁切与来源记录</a><div class="grid">'+cards+'</div>',encoding='utf-8')
# One compact contact sheet for human crop review, on paper (halos are visible).
cw,ch=210,155;preview=Image.new('RGB',(cw*8,ch*((len(entries)+7)//8)),'#eeeeee');d=ImageDraw.Draw(preview)
for i,e in enumerate(entries):
    im=pixels[e['id']].copy();im.thumbnail((200,127))
    px=(i%8)*cw;py=(i//8)*ch
    preview.paste(im,(px+(cw-im.width)//2,py+145-im.height),im)
    d.text((px+3,py+2),e['id'],fill='black')
preview.save(ROOT/'reports/v057-contact.png')
print(f'{len(entries)} direct cuts; {len(clips)} clips; atlas {runtime.stat().st_size} bytes; bottom {y+height}')
# Restore the registry after an intentional re-export of an older source pack.
registry=ROOT/'assets/scripts/render/ComicFrames.ts'
text=registry.read_text('utf-8')
if 'import { DirectFrames }' not in text:
    text='import { DirectFrames } from "./DirectFrames";\n'+text
    text=text.replace('...SupplementFrames }','...SupplementFrames, ...DirectFrames }')
    registry.write_text(text,encoding='utf-8')
