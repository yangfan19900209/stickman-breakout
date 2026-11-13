import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
const source='../素材/游戏美术/source/v0814/shield-break.png',bytes=readFileSync(source),src=PNG.sync.read(bytes);
if(src.width!==1536||src.height!==1024)throw Error('Expected six equal 512px cells');
const atlas=new PNG({width:512,height:512}),frames={},cells=[];
// Mechanical atlas packing only: preserve generated RGBA, relative scale and
// the same origin across all cells. Premultiplied sampling keeps soft alpha clean.
for(let frame=0;frame<6;frame++){
 const sx=frame%3*512,sy=Math.floor(frame/3)*512,dx=4+frame%3*168,dy=4+Math.floor(frame/3)*168,size=160;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const fx=sx+(x+.5)*512/size-.5,fy=sy+(y+.5)*512/size-.5,x0=Math.floor(fx),y0=Math.floor(fy),out=(dy+y)*atlas.width*4+(dx+x)*4;
  let alpha=0,r=0,g=0,b=0;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){
   const k=((y0+j)*src.width+x0+i)*4,w=(i?fx-x0:1-(fx-x0))*(j?fy-y0:1-(fy-y0)),a=src.data[k+3]*w;
   alpha+=a;r+=src.data[k]*a;g+=src.data[k+1]*a;b+=src.data[k+2]*a;
  }
  atlas.data[out]=alpha?r/alpha:0;atlas.data[out+1]=alpha?g/alpha:0;atlas.data[out+2]=alpha?b/alpha:0;atlas.data[out+3]=Math.round(alpha);
 }
 const id='shield.break.'+frame;frames[id]={atlas:[dx,dy,size,size],size:[size,size],sourceSize:[106,106],anchor:[.5,.09]};cells.push({id,sourceCrop:[sx,sy,512,512]});
}
const output='assets/landart/shield-break.png',packed=PNG.sync.write(atlas);writeFileSync(output,packed);
writeFileSync('assets/scripts/render/ShieldBreakFrames.ts','// Generated from imagegen art by scripts/pack-v0814-shield.mjs.\nexport const ShieldBreakFrames = '+JSON.stringify(frames)+' as const;\n'+
 'export const ShieldBreakDuration = .9;\nexport function shieldBreakFrame(age: number): keyof typeof ShieldBreakFrames {\n  const index = age < .07 ? 1 : age < .16 ? 2 : age < .28 ? 3 : age < .46 ? 4 : 5;\n  return `shield.break.${index}` as keyof typeof ShieldBreakFrames;\n}\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
writeFileSync('../素材/游戏美术/v0814-shield-manifest.json',JSON.stringify({generator:'imagegen',source,sourceSHA256:sha(bytes),sourceSize:[src.width,src.height],reference:'assets/landart/cast.png',output,outputSHA256:sha(packed),atlasSize:[512,512],method:'Equal-cell resampling, preserved alpha, shared scale and ground anchor; no procedural replacement art',cells,frames},null,2));
console.log(JSON.stringify({output,bytes:packed.length,frames:Object.keys(frames).length}));
