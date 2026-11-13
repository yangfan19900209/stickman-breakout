import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { PNG } from 'pngjs';

// Deterministic cropping, premultiplied resampling and packing of generated art.
// This does not invent poses or reconstruct body parts.
const sourceFiles = ['jetpack-actors','falcon-helicopter','sky-structures-final'];
const sources = Object.fromEntries(sourceFiles.map(n=>[n,PNG.sync.read(readFileSync(`../素材/游戏美术/source/level03/${n}.png`))]));
const frames = {}, records = [];
const atlas = new PNG({width:1024,height:1152});
let cursorX=4,cursorY=4,rowHeight=0;
const ids = ['hero.rifle.hover.0','hero.rifle.hover.1','hero.rifle.fly','hero.hit','hero.rocket.hover','hero.rocket.fly','hero.knife.hover','hero.knife.slash','enemy.rifle.hover','enemy.rifle.fly','enemy.drone.0','enemy.drone.1'];
const muzzles=[[331,173],[331,174],[349,195],[321,157],[331,173],[345,194],[244,163],[338,154],[331,174],[332,194],[185,181],[185,181]];
function pack(id,source,crop,resize,anchor=[.5,.5],extra={}) {
  const src=sources[source], sw=crop[2],sh=crop[3], w=Math.round(sw*resize),h=Math.round(sh*resize);
  if(cursorX+w+4>atlas.width){cursorX=4;cursorY+=rowHeight+8;rowHeight=0;}
  if(cursorY+h+4>atlas.height)throw Error(`Atlas overflow at ${id}`);
  const dx=cursorX,dy=cursorY;cursorX+=w+8;rowHeight=Math.max(rowHeight,h);
  let visible=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const fx=crop[0]+(x+.5)*sw/w-.5,fy=crop[1]+(y+.5)*sh/h-.5,x0=Math.floor(fx),y0=Math.floor(fy);
    let a=0,r=0,g=0,b=0;
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){
      const px=Math.max(crop[0],Math.min(crop[0]+sw-1,x0+i)),py=Math.max(crop[1],Math.min(crop[1]+sh-1,y0+j));
      const k=(py*src.width+px)*4,weight=(i?fx-x0:1-(fx-x0))*(j?fy-y0:1-(fy-y0)),alpha=src.data[k+3]*weight;
      a+=alpha;r+=src.data[k]*alpha;g+=src.data[k+1]*alpha;b+=src.data[k+2]*alpha;
    }
    const out=((dy+y)*atlas.width+dx+x)*4;
    atlas.data[out]=a?r/a:0;atlas.data[out+1]=a?g/a:0;atlas.data[out+2]=a?b/a:0;atlas.data[out+3]=Math.round(a);
    if(a>0)visible++;
  }
  if(!visible)throw Error(`Empty frame ${id}`);
  frames[id]={atlas:[dx,dy,w,h],size:[w,h],sourceSize:[sw,sh],anchor,...extra};
  records.push({id,source:`../素材/游戏美术/source/level03/${source}.png`,sourceCrop:crop,resample:resize,visiblePixels:visible});
}
for(let i=0;i<12;i++){
  const col=i%4,row=Math.floor(i/4),crop=[col*362,row*362,362,362];
  if(i===6)crop[2]=316;
  // Knife's flame crosses the nominal cell boundary; its actual transparent gutter is earlier.
  if(i===7){crop[0]=1040;crop[2]=408;}
  const muzzle=[muzzles[i][0]+col*362-crop[0],muzzles[i][1]];
  pack(ids[i],'jetpack-actors',crop,.46,[muzzle[0]/crop[2],1-muzzle[1]/crop[3]],{muzzle,sourceGunAngle:i===3?5:0});
}
for(let i=0;i<4;i++){
  const col=i%2,row=Math.floor(i/2);
  // Machine body bounds exclude harmless rotor, skids and the tail extremity.
  const body=i===0?[210,177,425,296]:i===1?[191,177,425,296]:i===2?[210,129,425,307]:[190,129,425,307];
  const muzzle=i===0?[691,429]:i===1?[674,431]:i===2?[654,385]:[681,385];
  const missiles=i===0?[[370,377],[370,435]]:i===1?[[351,377],[351,435]]:i===2?[[370,340],[370,397]]:[[350,340],[350,397]];
  pack(`boss.falcon.${i}`,'falcon-helicopter',[col*724,row*543,724,543],.4,[.5,0],{body,muzzle,missiles});
}
const env=[
 ['scenery.deck',[26,252,452,127],[.5,1]],
 ['scenery.roof',[541,201,440,181],[.5,1]],
 ['scenery.bridge',[1034,234,478,120],[.5,.68]],
 ['scenery.city',[25,681,486,208],[.5,0]],
 ['scenery.airship',[579,674,379,226],[.5,.5]],
 ['supply.parachute',[1115,589,319,341],[.5,0]],
];
for(const [id,crop,anchor] of env)pack(id,'sky-structures-final',crop,id==='supply.parachute'?.35:.5,anchor);
mkdirSync('assets/level03',{recursive:true});
const bytes=PNG.sync.write(atlas,{deflateLevel:9,filterType:4});
writeFileSync('assets/level03/flight-atlas.png',bytes);
writeFileSync('assets/scripts/flight/FlightFrames.ts','// Generated image assets. Regenerate via scripts/pack-flight-art.mjs.\nexport const FlightFrames = '+JSON.stringify(frames,null,2)+' as const;\nexport type FlightFrameId = keyof typeof FlightFrames;\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest={generator:'image_gen built-in',source:sources&&sourceFiles.map(n=>({file:`../素材/游戏美术/source/level03/${n}.png`,size:[sources[n].width,sources[n].height],sha256:sha(readFileSync(`../素材/游戏美术/source/level03/${n}.png`))})),runtime:'assets/level03/flight-atlas.png',runtimeBytes:bytes.length,runtimeSHA256:sha(bytes),atlasSize:[atlas.width,atlas.height],method:'Cropped complete generated frames, uniform premultiplied bilinear downsampling, preserved alpha, no procedural pose replacement. Runtime scale is not lossless; original art retained.',frames,records};
writeFileSync('../素材/游戏美术/level03-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({runtime:manifest.runtime,bytes:bytes.length,frames:Object.keys(frames).length,lastRowBottom:cursorY+rowHeight}));
