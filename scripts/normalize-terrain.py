"""Normalize joins of the existing terrain cuts; no new illustrations.
Mirror-periodic interiors and matching border columns keep source lines connected.
"""
import numpy as np
from PIL import Image, ImageOps

def normalize(pixels):
    paper=(250,250,250,255)
    def opaque(im):
        base=Image.new('RGBA',im.size,paper);base.alpha_composite(im);return base
    def periodic(im,vertical=False):
        im=opaque(im)
        h=Image.new('RGBA',(im.width*2,im.height));h.paste(im,(0,0));h.paste(ImageOps.mirror(im),(im.width,0))
        if not vertical:return h
        v=Image.new('RGBA',(h.width,h.height*2));v.paste(h,(0,0));v.paste(ImageOps.flip(h),(0,h.height));return v
    def edge_clear(im,margin=3):
        # Dirt dots crossing a cut boundary are removed as whole connected marks,
        # so repetition never joins two unrelated halves of a stone.
        a=np.array(opaque(im));result=np.empty_like(a);result[:]=paper
        mask=a[:,:,:3].min(axis=2)<180;seen=np.zeros(mask.shape,bool)
        for y,x in zip(*np.nonzero(mask)):
            if seen[y,x]:continue
            q=[(int(x),int(y))];seen[y,x]=True;group=[];edge=False
            while q:
                xx,yy=q.pop();group.append((xx,yy));edge|=xx<margin or yy<margin or xx>=im.width-margin or yy>=im.height-margin
                for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
                    if 0<=nx<im.width and 0<=ny<im.height and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
            if not edge and len(group)>3:
                xs=[v[0] for v in group];ys=[v[1] for v in group]
                l=max(margin,min(xs)-2);r=min(im.width-margin,max(xs)+3)
                t=max(margin,min(ys)-2);b=min(im.height-margin,max(ys)+3)
                result[t:b,l:r]=a[t:b,l:r]
        return Image.fromarray(result)
    top=pixels['tile.top.middle']
    # Keep the transparent grass silhouette; mirrored boundary pixels match exactly.
    top=top.crop((48,0,112,top.height));p=Image.new('RGBA',(128,top.height));p.paste(top,(0,0));p.paste(ImageOps.mirror(top),(64,0))
    pixels['tile.top.middle']=p
    body=edge_clear(pixels['tile.fill.middle'].crop((0,0,128,47)))
    pixels['tile.fill.middle']=periodic(body,True)
    bottom=pixels['tile.bottom.middle'].crop((48,0,112,22));pixels['tile.bottom.middle']=periodic(bottom)
    # The inner edge of each end cap uses the EXACT neighbouring middle column.
    for row in ['top','fill','bottom']:
        mid=pixels[f'tile.{row}.middle']
        for side in ['left','right']:
            im=pixels[f'tile.{row}.{side}'].copy();a=np.array(im)
            column=np.array(mid)[:,0 if side=='left' else -1]
            if row=='top':
                # All top pieces share y=125 at the lower join.
                aligned=np.zeros((im.height,4),dtype='uint8');aligned[-mid.height:]=column
            else:
                aligned=np.tile(np.array(paper,dtype='uint8'),(im.height,1))
                if row=='bottom':aligned[-min(im.height,len(column)):]=column[-min(im.height,len(column)):]
            for n in range(5):
                x=im.width-1-n if side=='left' else n
                blend=1-n/5
                a[:,x]=np.rint(a[:,x]*(1-blend)+aligned*blend).astype('uint8')
            pixels[f'tile.{row}.{side}']=Image.fromarray(a)
    # Repeat only the metal beam; support brackets are separate fixed-size pieces.
    metal=pixels['tile.metal.middle'];beam=metal.crop((12,0,76,56))
    pixels['tile.metal.middle']=periodic(beam)
    pixels['tile.metal.support']=metal.crop((0,48,72,91))
    for side in ['left','right']:
        pixels[f'tile.metal.{side}']=pixels[f'tile.metal.{side}'].crop((0,0,pixels[f'tile.metal.{side}'].width,56))
    return pixels
