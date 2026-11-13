import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const atlas = new PNG({ width: 768, height: 384 }), frames = {}, regions = {}, poses = {}, records = [];
const sha = b => createHash('sha256').update(b).digest('hex');
let ax = 4, ay = 4, rowHeight = 0;
const entries = [
  ['harpoon', 'shot.shared.harpoon', null, .1],
  ['grenade', 'projectile.water-grenade', null, .08],
  ['shield-diver', 'enemy.shield.aim', [0,0,555,620], .26, [338,257], [157,254]],
  ['shield-diver', 'enemy.shield.swim.0', [555,0,1261,620], .26, [885,260], [704,257]],
  ['shield-diver', 'enemy.shield.swim.1', [0,620,660,1247], .26, [333,884], [155,883]],
  ['shield-diver', 'enemy.shield.hit', [660,620,1261,1247], .26, [1010,870], [800,856]],
];
for (const [name,id,cell,scale,pivot,muzzle] of entries) {
  const source = `../素材/游戏美术/source/v0818/${name}.png`, bytes = readFileSync(source), p = PNG.sync.read(bytes);
  const [x0,y0,x1,y1] = cell ?? [0,0,p.width,p.height];
  let l=x1,t=y1,r=x0,b=y0,visible=0,black=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++) {
    const i=(y*p.width+x)*4;
    if(p.data[i+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);visible++;if(p.data[i]<70&&p.data[i+1]<70&&p.data[i+2]<70)black++;}
  }
  if(visible<500||l<=x0||t<=y0||r>=x1-1||b>=y1-1)throw Error(`Empty or clipped ${id}`);
  l-=1;t-=1;r+=1;b+=1;
  const sw=r-l+1,sh=b-t+1,w=Math.round(sw*scale),h=Math.round(sh*scale);
  if(ax+w+4>atlas.width){ax=4;ay+=rowHeight+8;rowHeight=0;}
  if(ay+h+4>atlas.height)throw Error('Atlas overflow');
  // Premultiplied area downsampling only: preserve generated ink, colour and alpha.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
    const xa=l+x*sw/w,xb=l+(x+1)*sw/w,ya=t+y*sh/h,yb=t+(y+1)*sh/h;
    let area=0,alpha=0;const rgb=[0,0,0];
    for(let sy=Math.floor(ya);sy<Math.ceil(yb);sy++)for(let sx=Math.floor(xa);sx<Math.ceil(xb);sx++) {
      const weight=Math.max(0,Math.min(sx+1,xb)-Math.max(sx,xa))*Math.max(0,Math.min(sy+1,yb)-Math.max(sy,ya)),i=(sy*p.width+sx)*4;
      area+=weight;alpha+=weight*p.data[i+3];for(let k=0;k<3;k++)rgb[k]+=weight*p.data[i+3]*p.data[i+k];
    }
    const out=((ay+y)*atlas.width+ax+x)*4;
    for(let k=0;k<3;k++)atlas.data[out+k]=alpha?Math.round(rgb[k]/alpha):0;
    atlas.data[out+3]=Math.round(alpha/area);
  }
  frames[id]={file:'combat-v0818',size:[w,h],sourceSize:[sw,sh],source,sha256:sha(bytes)};
  regions[id]=[ax,ay,w,h];
  if(pivot)poses[id]={size:[sw,sh],pivot:[pivot[0]-l,pivot[1]-t],muzzle:[muzzle[0]-l,muzzle[1]-t],scale:.15};
  records.push({id,source,sourceSHA256:sha(bytes),crop:[l,t,sw,sh],region:regions[id],visiblePixels:visible,darkPixelRatio:black/visible});
  ax+=w+8;rowHeight=Math.max(rowHeight,h);
}
const bytes=PNG.sync.write(atlas);writeFileSync('assets/level02/combat-v0818.png',bytes);
writeFileSync('assets/scripts/ocean/OceanFeedbackFrames.ts',`// Generated from original imagegen artwork by pack-v0818-ocean.mjs.\nexport const FeedbackFrames = ${JSON.stringify(frames,null,2)};\nexport const FeedbackRegions: Record<string,[number,number,number,number]> = ${JSON.stringify(regions)};\nexport const ShieldDiverPoses: Record<string,{size:number[];pivot:number[];muzzle:number[];scale:number}> = ${JSON.stringify(poses,null,2)};\n`);
writeFileSync('../开发进度/验证记录/v0818-art.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'Built-in image generation; crop and alpha-preserving area downsample into one local level02 atlas.',atlas:{path:'assets/level02/combat-v0818.png',width:atlas.width,height:atlas.height,bytes:bytes.length,sha256:sha(bytes)},records},null,2));
console.log(JSON.stringify({frames:records.length,bytes:bytes.length,records:records.map(r=>({id:r.id,crop:r.crop,dark:r.darkPixelRatio}))}));
