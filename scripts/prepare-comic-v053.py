"""Deterministic cuts of the four supplied V0.5.3 sheets. No generated artwork.
Coordinates are source pixels; pivot is measured at the feet, not the trimmed box.
The fifth image is archived for review ONLY and never enters the runtime atlas.
"""
from pathlib import Path
import json, shutil, hashlib, html
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'art/slices/v053'; OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT/'art/source/v053'; SOURCE.mkdir(parents=True, exist_ok=True)
FILES = {
 'player': ('卡通士兵动作精灵表.png','05fc6322-36fa-4929-9179-70d721789c9a'),
 'enemy': ('黑白军用角色与坦克精灵图集.png','8d3c5ab1-bba9-497b-82f6-e2729b0a0db5'),
 'fx': ('卡通射击游戏特效与武器精灵图集.png','eee913d7-110e-4311-bb30-1278ba4d694c'),
 'env': ('黑白平台游戏环境精灵素材表.png','31316c18-a7da-4321-a0dd-04ab1651d717'),
 'reference': ('黑白涂鸦战场_突击关卡.png','d5e8ef52-4830-469e-a4c8-4c5ba7940dcc'),
}
images={}; sources={}
for key,(name,uid) in FILES.items():
 dest=SOURCE/name
 if not dest.exists(): shutil.copyfile(Path('C:/Users/ADMINI~1/AppData/Local/Temp')/f'codex-clipboard-{uid}.png',dest)
 im=Image.open(dest); a=np.array(im)
 sources[key]=dict(file=dest.relative_to(ROOT).as_posix(),size=list(im.size),mode=im.mode,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),role='reference-only' if key=='reference' else 'runtime',transparentPixels=int((a[:,:,3]==0).sum()) if im.mode=='RGBA' else 0)
 images[key]=im.convert('RGBA')

cuts=[]; clips={}
def cut(id,src,box,pivot=None,state='',muzzle=None):
 cuts.append(dict(id=id,source=src,crop=list(box),pivot=pivot,state=state,muzzle=muzzle))
def row(prefix,src,top,bottom,edges,feet=None,centres=None):
 ids=[]
 for i,(l,r) in enumerate(zip(edges,edges[1:])):
  id=f'{prefix}.{i}'; ids.append(id)
  cx=centres[i] if centres else (l+r)/2
  cut(id,src,(l,top,r,bottom),(cx,feet or bottom-3),prefix)
 clips[prefix]=ids

# Sheet labels are deliberately outside each selection. Counts follow visible poses,
# including nine run poses and seven run-shoot poses (the printed labels undercount).
row('player.idle','player',9,145,[110,214,318,422,537],142,[157,263,363,470])
row('player.run','player',14,146,[635,744,837,929,1023,1112,1200,1283,1366,1448],142,[689,791,883,978,1063,1151,1235,1320,1404])
row('player.jump','player',156,311,[111,271,400,551,691],302,[193,338,480,610])
row('player.fall','player',184,294,[808,973,1137],284,[887,1052])
row('player.crouch','player',201,311,[1228,1337,1448],304,[1279,1390])
row('player.crouch-walk','player',318,426,[180,296,421,550,675,802,936],419,[232,350,478,604,731,858])
row('player.stand-shoot','player',438,560,[188,345,516,680,864],554,[240,398,566,723])
row('player.run-shoot','player',564,695,[174,349,514,666,807,958,1090,1255],685,[245,410,572,716,866,1009,1141])
row('player.crouch-shoot','player',698,802,[188,367,537,695,858],796,[246,417,580,739])
row('player.throw','player',803,924,[212,360,548,738,898,1040],916,[285,439,600,798,960])
row('player.hit','player',910,1018,[108,289,464,640,806],1009,[192,366,534,707])
row('player.death','player',1017,1086,[119,301,474,650,831,1007,1170],1080,[202,379,555,740,914,1090])

row('rifle.idle','enemy',101,208,[14,93,177],202)
row('rifle.walk','enemy',101,208,[179,253,317,380,468],202,[218,282,350,416])
row('rifle.shoot','enemy',101,208,[472,553,635,717,825],202,[509,590,670,751])
row('rifle.hit','enemy',96,208,[833,918,990,1067],202)
row('rifle.dead','enemy',109,209,[1074,1159,1250,1338,1440],202)
row('knife.walk','enemy',319,430,[15,100,184,266,360],424)
row('knife.attack','enemy',303,430,[376,477,601,686,780],424)
row('knife.hit','enemy',316,432,[793,879,971,1054],424)
row('knife.dead','enemy',323,432,[1068,1155,1249,1339,1440],424)
row('shield.walk','enemy',548,657,[13,94,172,250,321],650)
row('shield.brace','enemy',553,658,[333,425,515],650)
row('shield.shoot','enemy',548,660,[523,631,716,798],650)
row('shield.hit','enemy',541,661,[811,899,980,1055],650)
row('shield.dead','enemy',560,666,[1072,1157,1252,1340,1441],654)
row('rocket.idle','enemy',768,879,[16,112,211],872)
row('rocket.aim','enemy',769,879,[214,315,414],872)
row('rocket.fire','enemy',752,880,[415,515,649,802],872,[459,554,694])
row('rocket.hit','enemy',760,884,[809,897,977,1071],873)
row('rocket.dead','enemy',781,891,[1080,1169,1249,1335,1441],880)
for id,box in [('idle',(12,956,197,1086)),('fire',(198,956,434,1086)),('damaged',(436,957,614,1086)),('heavy',(626,960,822,1086)),('wreck',(1266,958,1448,1086))]:
 cut('tank.'+id,'enemy',box,({'idle':103,'fire':283,'damaged':520,'heavy':720,'wreck':1350}[id],1077),'tank.'+id)
row('tank.explode','enemy',963,1086,[831,949,1046,1160,1263],1077)

for id,box in [
 ('weapon.rifle',(36,23,321,137)),('weapon.shotgun',(355,34,618,134)),('weapon.rocket',(643,22,963,141)),('projectile.grenade',(978,25,1075,142)),('pickup.grenades',(1091,24,1242,148)),('pickup.health',(1260,25,1409,145)),
 ('effect.muzzle',(40,164,114,240)),('effect.muzzle-large',(201,145,366,249)),('effect.smoke',(608,153,738,251)),
 ('projectile.bullet',(241,274,397,325)),('projectile.pellet',(43,282,109,320)),('projectile.rocket',(222,466,439,517)),
 ('effect.impact',(851,675,1018,794)),('effect.metal',(212,679,344,781)),('effect.wood',(368,664,546,795)),('effect.explosion',(763,825,1074,1066)),
 ('effect.trail',(411,815,652,900)),('effect.dust',(1290,601,1409,667))]: cut(id,'fx',box)
for i,box in enumerate([(36,958,112,1045),(119,928,228,1051),(235,925,387,1061),(390,921,556,1064),(560,861,762,1064),(763,825,1074,1066),(1074,782,1420,1066)]):
 cut(f'explosion.{i}','fx',box,((box[0]+box[2])/2,box[3]-5),'Explosion')
clips['explosion']=[f'explosion.{i}' for i in range(7)]
for id,box in [
 ('ground.flat-a',(17,72,219,199)),('ground.flat-b',(226,74,548,199)),('ground.small',(552,79,697,199)),('ground.slope',(857,35,1182,199)),
 ('platform.stone',(38,240,248,358)),('platform.short',(278,248,534,326)),('platform.metal',(582,247,834,326)),('platform.wood',(868,239,1131,359)),
 ('crate.intact',(66,406,226,541)),('crate.broken',(274,406,466,541)),('crate.debris',(490,404,720,543)),('barrel.intact',(760,402,875,551)),('barrel.dented',(939,402,1119,551)),('barrel.broken',(1127,380,1419,556)),
 ('cover.sandbags',(24,574,308,715)),('cover.concrete',(318,592,583,715)),('prop.sign',(607,567,865,717)),('prop.warning',(888,576,1101,717)),('prop.rocks',(1183,663,1315,719)),
 ('building.base',(12,731,418,950)),('prop.tent',(418,774,798,950)),('prop.tower',(804,724,979,950)),('building.barracks',(979,731,1438,949)),
 ('background.cloud',(12,955,275,1064)),('background.cloud-small',(281,957,495,1019)),('background.mountains',(918,959,1438,1079))]: cut(id,'env',box)

def main_island(a):
 # Alpha-only cleanup never removes black outlines or white body fills.
 mask=a[:,:,3]>128; seen=np.zeros(mask.shape,bool); groups=[]; hh,ww=mask.shape
 for yy,xx in zip(*np.nonzero(mask)):
  if seen[yy,xx]:continue
  todo=[(int(xx),int(yy))]; seen[yy,xx]=True; group=[]
  while todo:
   cx,cy=todo.pop(); group.append((cx,cy))
   for nx,ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
    if 0<=nx<ww and 0<=ny<hh and mask[ny,nx] and not seen[ny,nx]:
     seen[ny,nx]=True;todo.append((nx,ny))
  groups.append(group)
 keep=max(groups,key=len); result=np.zeros(mask.shape,'uint8')
 for xx,yy in keep:result[yy,xx]=255
 fringe=np.array(Image.fromarray(result).filter(ImageFilter.MaxFilter(5)))>0
 a[~fringe]=0
 return a

entries=[]
for c in cuts:
 # Overlapping selections preserve extended boots/guns. Alpha component isolation
 # discards the neighbouring pose instead of shearing a silhouette at a grid edge.
 if c['source'] in ('player','enemy') and not c['id'].startswith('tank.'):
  l,t,r,b=c['crop']; c['crop']=[max(0,l-14),t,min(1448,r+14),b]
 # Boots and fallen bodies extend beyond the apparent column boundaries.
 left_edges={'player.run.8':1328,'shield.hit.1':870,'rocket.dead.2':1220,'rocket.dead.3':1305}
 if c['id'] in left_edges:c['crop'][0]=left_edges[c['id']]
 if c['id'].startswith('tank.explode.'):
  c['crop'][0]=max(0,c['crop'][0]-12);c['crop'][2]=min(1448,c['crop'][2]+18)
 im=images[c['source']].crop(c['crop']); a=np.array(im); a[a[:,:,3]<=8]=0
 if c['source'] in ('player','enemy') or c['id'].startswith('explosion.') or c['id']=='effect.explosion':a=main_island(a)
 # Keep original warm accents in FX; characters/environment remain clean monochrome.
 if c['source'] in ('player','enemy','env'):
  gray=np.round(a[:,:,:3].astype(float)@np.array([.299,.587,.114])).astype('uint8');a[:,:,:3]=gray[:,:,None]
 im=Image.fromarray(a);bb=im.getbbox()
 if not bb: raise ValueError(c['id'])
 im=im.crop(bb);size=im.size
 pivot=c['pivot']
 anchor=[(pivot[0]-c['crop'][0]-bb[0])/size[0],1-(pivot[1]-c['crop'][1]-bb[1])/size[1]] if pivot else [.5,.5]
 limit=520 if c['id']=='background.mountains' else 340 if c['id'].startswith(('building.','background.cloud','explosion.','effect.explosion')) else 240
 im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
 im.save(OUT/(c['id']+'.png'),optimize=True)
 entries.append(dict(**c,trim=list(bb),sourceSize=list(size),size=list(im.size),anchor=anchor,qa='reviewed',file=(OUT/(c['id']+'.png')).relative_to(ROOT).as_posix()))

# Compatibility names point to NEW supplied artwork, never old rig fragments.
aliases={'crate.worn':'crate.broken','barrel.worn':'barrel.dented','barrel.wreck':'barrel.broken','cover.sandbags-broken':'cover.sandbags','cover.concrete-broken':'cover.concrete','platform.scaffold':'platform.metal','building.bunker':'building.base','prop.flag':'prop.warning','prop.rock':'prop.rocks','prop.scrub':'prop.rocks'}
atlas=Image.new('RGBA',(2048,2048)); x=y=4;rh=0
for e in sorted(entries,key=lambda e: -e['size'][1]):
 im=Image.open(ROOT/e['file'])
 if x+im.width+4>2048:x=4;y+=rh+8;rh=0
 if y+im.height+4>=2048:raise ValueError(f'Atlas overflow {e["id"]}: {y}')
 atlas.paste(im,(x,y));e['atlas']=[x,y,im.width,im.height]
 for box,sz,pos in [((0,0,im.width,1),(im.width,2),(x,y-2)),((0,im.height-1,im.width,im.height),(im.width,2),(x,y+im.height)),((0,0,1,im.height),(2,im.height),(x-2,y)),((im.width-1,0,im.width,im.height),(2,im.height),(x+im.width,y))]:atlas.paste(im.crop(box).resize(sz),pos)
 x+=im.width+8;rh=max(rh,im.height)
runtime=ROOT/'assets/resources/comic/comic.png'
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(runtime,optimize=True)
missing=[dict(id='boss.colossus',qa='needs-remake',reason='No giant walking boss supplied. Its original encounter and renderer are retained outside the first two zones.'),dict(id='player.aim-up',qa='needs-remake',reason='No upward-facing gun poses. Full-body animation retained; independent gun overlay supplies aiming direction.'),dict(id='cover.broken',qa='shared-debris',reason='No broken sandbag/concrete variants in new sheet; impact and debris used without invented textures.')]
manifest=dict(version='0.5.3',alphaCutoff=8,grayscale=False,padding=8,extrusion=2,textureSize=[2048,2048],textureBytes=runtime.stat().st_size,sources=sources,frames=entries,aliases=aliases,clips=clips,unavailable=missing)
(ROOT/'art/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
data={e['id']:{k:e[k] for k in ['atlas','anchor','sourceSize','size']} for e in entries}
# Source muzzle tips. Scale is shared by whole-frame art and the firing pipeline.
sockets={}
tips={
 'player.idle':[(207,97),(312,96),(414,96),(524,96)],
 'player.run':[(742,94),(836,97),(928,96),(1020,98),(1109,98),(1198,98),(1281,99),(1364,98),(1440,99)],
 'player.jump':[(264,252),(394,244),(541,240),(680,263)],
 'player.fall':[(938,204),(1119,237)],
 'player.crouch':[(1330,266),(1438,271)],
 'player.crouch-walk':[(288,380),(413,380),(544,382),(667,379),(798,380),(926,380)],
 'player.stand-shoot':[(299,488),(459,488),(630,489),(791,489)],
 'player.run-shoot':[(319,609),(488,610),(640,609),(779,610),(922,608),(1056,609),(1202,610)],
 'player.crouch-shoot':[(323,752),(490,750),(654,751),(789,753)],
}
for prefix,pts in tips.items():
 for ident,(mx,my) in zip(clips[prefix],pts):
  e=next(e for e in entries if e['id']==ident);px,py=e['pivot'];sockets[ident]=[round((mx-px)*.64,3),round((py-my)*.64,3)]
manifest['muzzles']=sockets
(ROOT/'art/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
for alias,target in aliases.items():data[alias]=data[target]
(ROOT/'assets/scripts/render/ComicFrames.ts').write_text('// Generated by scripts/prepare-comic-v053.py\nexport const ComicFrames = '+json.dumps(data,separators=(',',':'))+' as const;\nexport type ComicFrameId = keyof typeof ComicFrames;\nexport const ComicClips = '+json.dumps(clips,separators=(',',':'))+' as const;\nexport const ComicSockets: Partial<Record<ComicFrameId, readonly [number,number]>> = '+json.dumps(sockets,separators=(',',':'))+';\n',encoding='utf-8')
cards=''.join(f'<article><div><img src="slices/v053/{e["id"]}.png"></div><b>{e["id"]}</b><p>{e["source"]} {e["crop"]}<br>foot {e["anchor"]}</p></article>' for e in entries)
(ROOT/'art/preview.html').write_text('<!doctype html><meta charset="utf-8"><title>V0.5.3 supplied atlas review</title><style>body{font:15px system-ui;background:#fafafa;margin:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}article{background:white;border:1px solid #ccc;padding:10px}article div{height:170px;display:flex;align-items:flex-end;justify-content:center;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 50%/16px 16px}img{max-width:100%;max-height:165px}p{font-size:11px}</style><h1>V0.5.3 · 原图切片 / 脚底锚点</h1><p>四张 RGBA 源图直接切分；不生成新资源。暖色仅保留在独立战斗特效。第五张图仅供对照。</p><a href="manifest.json">manifest / 动作映射</a><div class="grid">'+cards+'</div>',encoding='utf-8')
for start in range(0,len(entries),30):
 page=Image.new('RGB',(1500,1000),'#f9f9f7');draw=ImageDraw.Draw(page)
 for i,e in enumerate(entries[start:start+30]):
  im=Image.open(ROOT/e['file']);im.thumbnail((235,165));px=i%6*250;py=i//6*200
  page.paste(im,(px+(250-im.width)//2,py+170-im.height),im);draw.text((px+8,py+180),e['id'],fill='black')
 page.save(ROOT/f'reports/v053-contact-{start//30}.jpg')
print(f'{len(entries)} original cuts, {len(clips)} clips, {runtime.stat().st_size} bytes; atlas bottom={y+rh}')
