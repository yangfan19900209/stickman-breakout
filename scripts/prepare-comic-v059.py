"""Cut the three supplied mech sheets. No generated artwork or assembled bodies."""
from pathlib import Path
import hashlib, json
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'art/slices/v059'
OUT.mkdir(parents=True, exist_ok=True)
files = ['重装机甲Boss.png', '机甲攻击与预警.png', 'Boss弹体与特效.png']
sheets, sources = [], []
for name in files:
    path = ROOT / 'art/source/v059' / name
    sheet = Image.open(path).convert('RGBA')
    a = np.array(sheet)
    sheets.append(sheet)
    sources.append(dict(file=path.relative_to(ROOT).as_posix(), size=list(sheet.size), mode=sheet.mode,
        sha256=hashlib.sha256(path.read_bytes()).hexdigest(), transparentPixels=int((a[:,:,3]==0).sum())))
entries, pictures, sockets = [], {}, {}

def cut(name, sheet, box, pivot=None, muzzle=None, shoulders=None, core=None, scale=.8):
    im = sheets[sheet].crop(box)
    a = np.array(im)
    a[a[:,:,3] < 18] = 0
    # Remove only tiny disconnected speckle. Never erase or reconstruct body parts.
    mask, seen = a[:,:,3] > 0, np.zeros(a.shape[:2], dtype=bool)
    h,w = mask.shape
    components=[]
    for yy,xx in zip(*np.where(mask)):
        if seen[yy,xx]: continue
        seen[yy,xx] = True
        stack, component, edge = [(int(yy),int(xx))], [], False
        while stack:
            cy,cx = stack.pop(); component.append((cy,cx));edge |= cy==0 or cx==0 or cy==h-1 or cx==w-1
            for ny,nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True;stack.append((ny,nx))
        components.append((component,edge))
    largest=max(len(component) for component,_ in components)
    for component,edge in components:
        if len(component)<10 or (sheet>0 and edge and len(component)<min(5000,largest*.6)):
            for cy,cx in component:a[cy,cx]=0
    im=Image.fromarray(a); trim=im.getbbox()
    if not trim: raise ValueError(name)
    im=im.crop(trim); origin=[box[0]+trim[0],box[1]+trim[1]]
    pivot=pivot or (origin[0]+im.width/2,origin[1]+im.height/2)
    anchor=[(pivot[0]-origin[0])/im.width,1-(pivot[1]-origin[1])/im.height]
    key='mech.'+name
    entry=dict(id=key,source=sheet,crop=list(box),trim=list(trim),origin=origin,size=list(im.size),sourceSize=list(im.size),anchor=anchor,scale=scale,
        pivotSource=list(pivot),file=(OUT/(key+'.png')).relative_to(ROOT).as_posix())
    entry['sockets']={}
    for n,point in [('muzzle',muzzle),('core',core),('leftPod',shoulders[0] if shoulders else None),('rightPod',shoulders[1] if shoulders else None)]:
        if point:
            entry['sockets'][n]=list(point)
            # Canonical coordinates face LEFT in the native mech drawings.
            sockets.setdefault(key,{})[n]=[round((point[0]-pivot[0])*scale,4),round((pivot[1]-point[1])*scale,4)]
    entries.append(entry);pictures[key]=im;im.save(ROOT/entry['file'],optimize=True)

cut('idle',0,(28,8,566,374),(335,367),(49,195),((215,69),(465,72)),(336,137))
cut('step.0',0,(578,10,1010,375),(804,368),(601,194),((712,66),(919,79)),(835,142))
cut('step.1',0,(1020,14,1448,373),(1230,365),(1049,199),((1178,67),(1374,82)),(1290,141))
cut('charge',0,(5,411,553,760),(305,752),(58,519),((210,462),(458,476)),(301,535))
cut('damaged',0,(1078,388,1445,758),(1270,747),(1101,580),((1190,488),(1355,485)),(1280,565))
cut('collapse',0,(245,758,700,1086),(474,1065),(309,976),core=(489,905))
cut('wreck',0,(740,790,1448,1086),(1090,1066),core=(1100,958))
# Only standalone effects are taken from the attack sheet. Its small alternate
# mech drawings are not layered on top of the full native armored soldier.
cut('warning',1,(20,925,246,1086))
cut('ground-ring',1,(478,932,788,1082))
# The adjacent shock ring overlaps the next smoke illustration; use the clean
# ground ring plus independently simulated impact/debris rather than that crop.
obsolete=OUT/'mech.stomp-ring.png'
if obsolete.exists():obsolete.unlink()
cut('round',2,(43,36,111,93))
cut('round-heavy',2,(42,208,215,294))
cut('missile',2,(797,198,914,293))
cut('missile-fire',2,(926,202,1117,295))
cut('orb',2,(40,341,165,464))
cut('beam',2,(824,400,1425,513))
cut('target',2,(1020,518,1438,742))
cut('muzzle',2,(262,625,418,739))
cut('hit',2,(27,842,137,950))
cut('blast.0',2,(32,952,133,1062))
cut('blast.1',2,(129,931,293,1086))
cut('blast.2',2,(295,926,556,1086))
cut('blast.3',2,(555,920,790,1086))
cut('smoke',2,(782,932,1014,1080))

x,y,shelf=4,4,0
for e in sorted(entries,key=lambda e:(-e['size'][1],e['id'])):
    w,h=e['size']
    if x+w+4>2048:x,y,shelf=4,y+shelf+8,0
    e['atlas']=[x,y,w,h];x+=w+8;shelf=max(shelf,h)
height=1<<(y+shelf+3).bit_length()
if height>2048:raise ValueError('Mech atlas exceeds 2048 texture budget')
atlas=Image.new('RGBA',(2048,height))
for e in entries:
    im=pictures[e['id']];x,y,w,h=e['atlas'];atlas.paste(im,(x,y))
    for box,size,point in [((0,0,w,1),(w,4),(x,y-4)),((0,h-1,w,h),(w,4),(x,y+h)),((0,0,1,h),(4,h),(x-4,y)),((w-1,0,w,h),(4,h),(x+w,y)),
        ((0,0,1,1),(4,4),(x-4,y-4)),((w-1,0,w,1),(4,4),(x+w,y-4)),((0,h-1,1,h),(4,4),(x-4,y+h)),((w-1,h-1,w,h),(4,4),(x+w,y+h))]:
        atlas.paste(im.crop(box).resize(size,Image.Resampling.NEAREST),point)
runtime=ROOT/'assets/resources/comic/mech.png'
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(runtime,optimize=True)
frames={e['id']:{k:e[k] for k in ['atlas','anchor','sourceSize','size']} for e in entries}
(ROOT/'assets/scripts/render/MechFrames.ts').write_text('// Generated from the three supplied sheets by prepare-comic-v059.py.\n'
    +'export const MechFrames = '+json.dumps(frames,separators=(',',':'))+' as const;\n'
    +'export const MechScale = .8;\n'
    +'export const MechSockets = '+json.dumps(sockets,separators=(',',':'))+' as const;\n',encoding='utf-8')
manifest=dict(version='0.5.9',sources=sources,frames=entries,textureSize=list(atlas.size),textureBytes=runtime.stat().st_size,extrusion=4,padding=8,
    notes=['Whole native mech drawings; no procedural armor, gun attachments or alternate small mech layered underneath.',
           'The large missile-firing pose embeds detached missiles; use the clean complete idle/charge body with real shoulder projectiles instead of duplicating painted missiles.',
           'Attack sheet supplies warning/ground/shock rings; projectile sheet supplies real boss rounds, missiles, beam, impacts, smoke and staged destruction.'])
(ROOT/'art/v059-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
contact=Image.new('RGB',(240*6,240*((len(entries)+5)//6)),'#eee');d=ImageDraw.Draw(contact)
for i,e in enumerate(entries):
    im=pictures[e['id']].copy();im.thumbnail((226,204));px,py=i%6*240,i//6*240
    contact.paste(im,(px+(240-im.width)//2,py+233-im.height),im);d.text((px+4,py+4),e['id'],fill='black')
contact.save(ROOT/'reports/v059-contact.png')
cards=''.join(f'<article><b>{e["id"]}</b><img src="slices/v059/{e["id"]}.png"></article>' for e in entries)
(ROOT/'art/v059-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>V0.5.9 机甲Boss原图切片</title><style>body{font:14px sans-serif;background:#fafafa;margin:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,240px);gap:12px}article{background:#eee;border:1px solid #bbb;min-height:235px;padding:5px;display:flex;flex-direction:column;align-items:center}img{max-width:230px;max-height:210px}</style><h1>机甲Boss、攻击预警与弹体</h1><p>3张用户原图，整帧机甲、固定脚底与炮口、4px挤出/8px间隔。</p><a href="v059-manifest.json">来源与坐标</a><div class="grid">'+cards+'</div>',encoding='utf-8')
print(json.dumps(dict(frames=len(entries),textureSize=atlas.size,textureBytes=runtime.stat().st_size,sources=sources),ensure_ascii=False))
