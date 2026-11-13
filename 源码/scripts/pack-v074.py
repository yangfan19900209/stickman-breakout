from os.path import relpath
"""Crop preserved generated RGBA; quantize separate runtime copies, never erase sprite interiors."""
from pathlib import Path
from PIL import Image
import json,hashlib
R=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
frames={};land={};records=[]
def crop(sheet,id,box,factor=0.6,bundle='level02'):
    src=R/'../素材/游戏美术/source/v074'/f'{sheet}.png';im=Image.open(src).convert('RGBA')
    assert im.getchannel('A').getextrema()[0]==0,f'{sheet}: missing transparent background'
    cell=im.crop(box);bb=cell.getchannel('A').point(lambda a:255 if a>30 else 0).getbbox();assert bb
    part=cell.crop(bb);dest=R/'../素材/游戏美术/slices/v074'/f'{id}.png';part.save(dest)
    x,y,w,h=box[0]+bb[0],box[1]+bb[1],part.width,part.height
    if bundle=='landart':
        land[id]={'atlas':[x,y,w,h],'size':[w,h],'sourceSize':[w,h],'anchor':[.5,0]}
        runtime=R/'assets/landart'/('terrain.png' if sheet=='land' else 'landmarks.png')
    else:
        rt=part.resize((round(w*factor),round(h*factor)),Image.Resampling.LANCZOS)
        runtime=R/'assets/level02'/f'{id}.png';rt.quantize(colors=192,method=Image.Quantize.FASTOCTREE).save(runtime,optimize=True)
        frames[id]={'file':id,'size':list(rt.size),'sourceSize':[w,h],'source':str(Path(relpath(dest, R))).replace('\\','/'),'sha256':sha(runtime)}
    records.append({'id':id,'sheet':str(Path(relpath(src, R))).replace('\\','/'),'sheetSHA256':sha(src),'crop':[x,y,w,h],'source':str(Path(relpath(dest, R))).replace('\\','/'),'sourceSHA256':sha(dest),'runtime':str(Path(relpath(runtime, R))).replace('\\','/'),'runtimeSHA256':sha(runtime)})
    print(id,[x,y,w,h])
for sheet,file in [('land','terrain'),('landmarks','landmarks')]:
    im=Image.open(R/'../素材/游戏美术/source/v074'/f'{sheet}.png').convert('RGBA');im.quantize(colors=192,method=Image.Quantize.FASTOCTREE).save(R/'assets/landart'/f'{file}.png',optimize=True)
for id,box in [('grass',[0,0,625,375]),('concrete',[625,0,1254,375]),('steel',[0,385,642,755]),('wall',[642,385,1254,755])]:crop('land','land.'+id,box,1,'landart')
crop('landmarks','land.coast',[0,0,794,887],1,'landart')
crop('landmarks','land.factory',[794,0,1774,887],1,'landart')
fill_src=R/'../素材/游戏美术/source/v074/fill.png'
fill=Image.open(fill_src).convert('RGBA')
assert fill.size==(1536,1024)
fill_runtime=R/'assets/landart/fill.png'
fill.quantize(colors=192,method=Image.Quantize.FASTOCTREE).save(fill_runtime,optimize=True)
for name,x in [('soil',0),('concrete',768)]:
    id='land.fill.'+name;dest=R/'../素材/游戏美术/slices/v074'/f'{id}.png'
    fill.crop((x,0,x+768,1024)).save(dest)
    land[id]={'atlas':[x,0,768,1024],'size':[768,1024],'sourceSize':[768,1024],'anchor':[0,0]}
    records.append({'id':id,'sheet':str(Path(relpath(fill_src, R))).replace('\\','/'),'sheetSHA256':sha(fill_src),'crop':[x,0,768,1024],'source':str(Path(relpath(dest, R))).replace('\\','/'),'sourceSHA256':sha(dest),'runtime':str(Path(relpath(fill_runtime, R))).replace('\\','/'),'runtimeSHA256':sha(fill_runtime)})
for i,id in enumerate(['hover.0','hover.1','swim.0','swim.1','swim.2','boost']):
    # The leading flipper of swim.0 extends left of x=1024.
    boxes=[[0,0,512,512],[512,0,984,512],[984,0,1536,512],[0,512,512,1024],[512,512,984,1024],[984,512,1536,1024]]
    crop('torpedo-alpha','diver.torpedo.'+id,boxes[i])
for i,id in enumerate(['chest.closed','chest.half','chest.open','shore.reach','shore.take','shore.mask']):
    x=i%3*512;y=0 if i<3 else 480;crop('entry',id,[x,y,x+512,480 if i<3 else 1024])
(R/'assets/scripts/render/LandDetailFrames.ts').write_text('// Generated from preserved V074 land art.\nexport const LandDetailFrames = '+json.dumps(land,separators=(',',':'))+' as const;\n',encoding='utf-8')
(R/'assets/scripts/ocean/OceanMotionFrames.ts').write_text('// Generated from preserved V074 movement and entry art.\nexport const OceanMotionFrames = '+json.dumps(frames,separators=(',',':'))+';\n',encoding='utf-8')
(R/'../素材/游戏美术/v074-manifest.json').write_text(json.dumps({'processing':'Original-alpha crops; runtime resize and 192-color palette quantization are lossy. Torpedo background repaired by built-in imagegen before cropping.','frames':records},indent=2),encoding='utf-8')
