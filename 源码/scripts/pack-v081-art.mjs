import {PNG} from 'pngjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const legacy=require('../.test-build/assets/scripts/render/ComicFrames.js').ComicFrames;
const root='../素材/游戏美术/source/v081/',atlas=new PNG({width:2048,height:1024});
const frames={},sockets={},barrels={},sources=[],cuts=[],aliases=[];
let packX=4,packY=4,rowH=0;
const source=n=>{const file=root+n+'.png',bytes=readFileSync(file),png=PNG.sync.read(bytes);sources.push({file,size:[png.width,png.height],sha256:createHash('sha256').update(bytes).digest('hex')});return png};
function gap(count,center,radius){let best=-1,d=Infinity;for(let i=Math.max(1,Math.floor(center-radius));i<Math.min(count.length-1,center+radius);i++)if(count[i]===0&&Math.abs(i-center)<d){best=i;d=Math.abs(i-center)}if(best<0)throw Error('No clear cell boundary at '+center);return best;}
function cells(p,cols,rows){
 const activeY=Array(p.height).fill(0);for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]>100)activeY[y]++;
 const yb=[0,...Array.from({length:rows-1},(_,i)=>gap(activeY,p.height*(i+1)/rows,p.height/rows*.22)),p.height],out=[];
 for(let r=0;r<rows;r++){
  const ax=Array(p.width).fill(0);for(let x=0;x<p.width;x++)for(let y=yb[r];y<yb[r+1];y++)if(p.data[(y*p.width+x)*4+3]>100)ax[x]++;
  const xb=[0,...Array.from({length:cols-1},(_,i)=>gap(ax,p.width*(i+1)/cols,p.width/cols*.22)),p.width];
  for(let c=0;c<cols;c++){
   let l=xb[c+1],t=yb[r+1],right=xb[c],b=yb[r];
   for(let y=yb[r];y<yb[r+1];y++)for(let x=xb[c];x<xb[c+1];x++)if(p.data[(y*p.width+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);right=Math.max(right,x);b=Math.max(b,y)}
   const left=Math.max(xb[c],l-2),top=Math.max(yb[r],t-2),end=Math.min(xb[c+1],right+3),bottom=Math.min(yb[r+1],b+3);
   out.push({crop:[left,top,end-left,bottom-top],sole:b,hip:(c+.475)*p.width/cols,cell:[xb[c],yb[r],xb[c+1]-xb[c],yb[r+1]-yb[r]],index:r*cols+c});
  }
 }
 return out;
}
function sample(p,crop,out,dx,dy,ratio){
 const [left,top,sw,sh]=crop,w=Math.ceil(sw*ratio),h=Math.ceil(sh*ratio);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const x0=left+x/ratio,x1=Math.min(left+sw,left+(x+1)/ratio),y0=top+y/ratio,y1=Math.min(top+sh,top+(y+1)/ratio);
  let a=0,r=0,g=0,b=0,qsum=0;
  for(let yy=Math.floor(y0);yy<Math.ceil(y1);yy++)for(let xx=Math.floor(x0);xx<Math.ceil(x1);xx++){
   const q=Math.max(0,Math.min(xx+1,x1)-Math.max(xx,x0))*Math.max(0,Math.min(yy+1,y1)-Math.max(yy,y0)),i=(yy*p.width+xx)*4,alpha=p.data[i+3]*q;
   a+=alpha;qsum+=q;r+=p.data[i]*alpha;g+=p.data[i+1]*alpha;b+=p.data[i+2]*alpha;
  }
  const i=((dy+y)*out.width+dx+x)*4;out.data[i]=a?r/a:0;out.data[i+1]=a?g/a:0;out.data[i+2]=a?b/a:0;out.data[i+3]=qsum?a/qsum:0;
 }
 return [w,h];
}
function sheet(name,cols,rows,height){
 const p=source(name),list=cells(p,cols,rows),scale=height/(list[0].sole-list[0].crop[1]-2);
 return list.map(c=>{
  const ratio=scale*1.6,[l,t,sw,sh]=c.crop,w=Math.ceil(sw*ratio),h=Math.ceil(sh*ratio);
  if(packX+w+4>atlas.width){packX=4;packY+=rowH+8;rowH=0}if(packY+h+4>atlas.height)throw Error('Atlas full');
  const size=sample(p,c.crop,atlas,packX,packY,ratio),record={...c,source:name,worldScale:scale,atlas:[packX,packY,...size],size,worldSize:[sw*scale,sh*scale],anchor:[(c.hip-l)/sw,(t+sh-c.sole)/sh]};
  packX+=w+8;rowH=Math.max(rowH,h);cuts.push(record);
  return record;
 });
}
const rifle=sheet('rifle',4,4,84),rocket=sheet('rocket',4,4,84),actions=sheet('actions',6,4,84),enemies=sheet('enemies',6,4,82),shared=sheet('shared',4,2,84);
function legacyScale(id){return id.startsWith('celebrate.')?.18:id.startsWith('direct.rifle.')?.3:id.startsWith('direct.rocket.up-')||id.startsWith('direct.rocket.diagonal-')?.25:id.startsWith('direct.')?.84:id.startsWith('player.')?.64:.8;}
function bind(id,c){const scale=legacyScale(id);frames[id]={atlas:c.atlas,size:c.size,sourceSize:c.worldSize.map(n=>n/scale),anchor:c.anchor};aliases.push({id,source:c.source,index:c.index,worldSize:c.worldSize});}
// Muzzle samples lie at the middle of the painted opening, measured in source
// coordinates. All poses use the same sheet scale; no per-frame resizing.
const tips={
 rifle:[[267,174],[582,177],[897,176],[1205,180],[278,487],[583,510],[896,507],[1205,516],[278,778],[579,780],[821,648],[1133,691],[201,957],[567,1005],[875,1060],[1186,995]],
 rocket:[[261,161],[579,163],[891,165],[1193,165],[268,479],[575,506],[888,507],[1195,513],[270,765],[570,771],[816,659],[1127,699],[193,967],[558,1009],[869,1064],[1183,997]]
};
function gun(id,family,index){const c=(family==='rifle'?rifle:rocket)[index];bind(id,c);const [tx,ty]=tips[family][index];
 const tip=[(tx-c.hip)*c.worldScale,(c.sole-ty)*c.worldScale];sockets[id]=tip;
 if(family==='rocket'){const pitch=index>=10&&index<=12?Math.PI/2:index>=13?Math.PI/4:0,length=(pitch===0?142:166)*c.worldScale;barrels[id]={x:tip[0],y:tip[1],pitch,backX:tip[0]-Math.cos(pitch)*length,backY:tip[1]-Math.sin(pitch)*length};}
}
function equippedIndex(id,n){if(id.includes('diagonal'))return id.includes('crouch')?14:id.includes('air')||id.includes('jump')||id.includes('fall')?15:13;
 if(id.includes('.up-'))return id.includes('crouch')?11:id.includes('jump')||id.includes('fall')?12:10;
 if(id.includes('jump'))return 8;if(id.includes('fall'))return 9;if(id.includes('crouch-walk'))return 6+n%2;if(id.includes('crouch'))return 5;
 if(id.includes('.run')||id.includes('.stride'))return 1+n%4;return 0;}
for(const id of Object.keys(legacy)){
 const n=Number(id.match(/\.(\d+)$/)?.[1]||0);
 if(id.startsWith('player.')||id.startsWith('direct.rifle.')||id.startsWith('direct.rocket.')){
  if(id.includes('death'))bind(id,shared[n<1?2:n<3?3:4]);
  else if(id.includes('throw'))bind(id,shared[n<2?0:1]);
  else gun(id,id.startsWith('direct.rocket.')?'rocket':'rifle',equippedIndex(id,n));
 }else if(id.startsWith('direct.knife.')){
  let i=0;if(id.includes('.run'))i=1+n%4;else if(id.includes('crouch-walk'))i=6+n%2;else if(id.includes('crouch'))i=5;
  else if(id.includes('combo1'))i=[8,9,10,10][n];else if(id.includes('combo2'))i=[11,12,13,13][n];else if(id.includes('combo3'))i=[14,14,15,15,10][n];
  else if(id.includes('jump')||id.includes('fall')||id.includes('air-attack'))i=17;
  if(id.includes('death'))bind(id,shared[n<1?2:n<3?3:4]);else if(id.includes('hit'))bind(id,actions[0]);else bind(id,actions[i]);
 }else if(/^(rifle|knife|shield|rocket)\./.test(id)){
  const row=['rifle','knife','shield','rocket'].indexOf(id.split('.')[0]);
  const index=id.includes('.dead')?5:id.includes('.shoot')||id.includes('.fire')||id.includes('.attack')?4:id.includes('.walk')?[1,2,3,2][n%4]:0;
  bind(id,enemies[row*6+index]);
 }else if(id.startsWith('celebrate.'))bind(id,shared[[5,7,6,7][n]]);
}
// Every consumed current gait ID has an explicit mapped frame.
mkdirSync('assets/landart',{recursive:true});writeFileSync('assets/landart/cast.png',PNG.sync.write(atlas));
const soilSource=source('soil'),soil=new PNG({width:512,height:512});sample(soilSource,[0,0,soilSource.width,soilSource.height],soil,0,0,512/soilSource.width);writeFileSync('assets/landart/soil.png',PNG.sync.write(soil));
const ts='// Generated by scripts/pack-v081-art.mjs. Whole frames, shared sheet scales.\n';
writeFileSync('assets/scripts/render/UnifiedActorFrames.ts',ts+'export const UnifiedActorFrames = '+JSON.stringify(frames)+' as const;\nexport const UnifiedActorSockets: Record<string, readonly [number,number]> = '+JSON.stringify(sockets)+';\nexport const UnifiedActorBarrels: Record<string,{x:number;y:number;backX:number;backY:number;pitch:number}> = '+JSON.stringify(barrels)+';\n');
writeFileSync('assets/scripts/render/UnifiedSoilFrame.ts',ts+'export const UnifiedSoilFrame = {"unified.fill":{atlas:[0,0,512,512],size:[512,512],sourceSize:[512,512],anchor:[0,0]}} as const;\n');
writeFileSync('../素材/游戏美术/v081-art-manifest.json',JSON.stringify({sources,cast:{path:'assets/landart/cast.png',size:[atlas.width,atlas.height],usedHeight:packY+rowH+4},soil:'assets/landart/soil.png',frames:cuts.map(c=>({...c,id:c.source+'.'+c.index})),aliases},null,2)+'\n');
console.log({uniqueFrames:cuts.length,mappedActions:aliases.length,usedHeight:packY+rowH+4});
