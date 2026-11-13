const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager');
const {ParticlePool}=load('combat/ParticlePool'),{comicPose}=load('render/ComicPose'),{directBarrel}=load('render/DirectPose');
const base={x:200,y:150,facing:1,animation:'Idle',animationTime:0,recoil:0,deadTime:0,weaponId:'rocket'};
const target={alive:true,bounds:{x:-1000,y:-1000,w:10,h:10},hit(){}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('aimed rockets leave the raised tube directly along the requested axis in every stance and facing',()=>{
 for(const stance of [{},{animation:'Run',vx:280,stride:.2},{crouched:true},{animation:'Jump',animationTime:.1},{animation:'Fall',animationTime:.1},{animation:'Hit'}])
 for(const facing of [-1,1])for(const aimPitch of [Math.PI/4,Math.PI/2]){
  const a={...base,...stance,facing,aimPitch},w=new WeaponSystem('rocket'),q=new ProjectileManager(new ParticlePool());
  if(stance.animation==='Hit'){assert.equal(w.fire(a,q,'player'),false);assert.equal(q.items.filter(p=>p.active).length,0);continue;}
  const barrel=directBarrel(comicPose({...a,recoil:1.9}));assert.ok(barrel);
  assert.ok(Math.abs(barrel.pitch-aimPitch)<.08,'whole moving pose keeps the requested aim direction');
  assert.ok(w.fire(a,q,'player'));const p=q.items.find(p=>p.active);
  near(p.x,a.x+barrel.x*facing);near(p.y,a.y+barrel.y);near(w.flashPitch,barrel.pitch);
  near(p.vx,facing*Math.cos(barrel.pitch)*460);near(p.vy,Math.sin(barrel.pitch)*460);
  assert.equal(p.launchRemaining,0);
  near(p.originX,a.x+barrel.backX*facing);near(p.originY,a.y+barrel.backY);
  const x=p.x,y=p.y;q.update(1/120,target,[],[]);
  near(p.x,x+Math.cos(barrel.pitch)*facing*460/120);near(p.y,y+Math.sin(barrel.pitch)*460/120);
  for(let i=0;i<20;i++)q.update(1/120,target,[],[]);
  assert.equal(p.launchRemaining,0);near(p.vx,Math.cos(barrel.pitch)*facing*460);near(p.vy,Math.sin(barrel.pitch)*460);
 }
});

test('raised tube cannot skip a thin solid ceiling even when the muzzle protrudes above it',()=>{
 const a={...base,aimPitch:Math.PI/2},w=new WeaponSystem('rocket'),q=new ProjectileManager(new ParticlePool());
 const barrel=directBarrel(comicPose({...a,recoil:1.9}));let blast;
 q.onExplosion=(x,y)=>blast={x,y};w.fire(a,q,'player');
 const wall={x:a.x-50,y:a.y+70,w:150,h:8,kind:'step'};q.update(1/120,target,[],[wall]);
 assert.equal(q.items.filter(p=>p.active).length,0);assert.ok(blast);assert.ok(blast.y<=wall.y+2);
 near(blast.x,a.x+barrel.x);
});

test('vertical launch never makes a horizontal sweep across a wall beside the raised tube',()=>{
 for(const facing of [-1,1]){
  const a={...base,facing,aimPitch:Math.PI/2},w=new WeaponSystem('rocket'),q=new ProjectileManager(new ParticlePool());
  w.fire(a,q,'player');const p=q.items.find(p=>p.active),x=p.x;
  q.update(1/60,target,[],[{x:a.x+(facing>0?4:-10),y:a.y+80,w:6,h:70}]);
  assert.ok(p.active);near(p.x,x);assert.ok(p.y>a.y+directBarrel(comicPose({...a,recoil:1.9})).y);
 }
});

test('holding aim uses the same complete tube pose before, during and after recoil',()=>{
 for(const aimPitch of [Math.PI/4,Math.PI/2])for(const stance of [{},{crouched:true},{animation:'Jump'},{animation:'Fall'}]){
  const a={...base,...stance,aimPitch},pose=comicPose(a);
  assert.equal(comicPose({...a,recoil:1.9}),pose);assert.equal(comicPose({...a,recoil:.3}),pose);
  const {comicMuzzle}=load('render/ComicPose'),barrel=directBarrel(pose);
  assert.deepEqual(comicMuzzle({...a,aimPitch:0},aimPitch),{x:barrel.x,y:barrel.y});
 }
 assert.match(comicPose({...base,aimPitch:Math.PI/2,animation:'Dead'}),/^direct\.rocket\.death\./);
 assert.match(comicPose({...base,aimPitch:Math.PI/2,meleeTime:.2}),/^direct\.knife\./);
});

test('every aimed frame keeps its measured muzzle and rear inside the rendered source geometry',()=>{
 const {readFileSync}=require('node:fs'),manifest=JSON.parse(readFileSync('../素材/游戏美术/v065-manifest.json','utf8'));
 const {RocketAimFrames,RocketAimBarrels,RocketAimScale}=load('render/RocketAimFrames');
 assert.equal(Object.keys(RocketAimFrames).length,8);
 for(const f of manifest.frames){
  const b=RocketAimBarrels[f.id],d=RocketAimFrames[f.id],anchor=d.anchor;
  for(const [point,x,y] of [[f.muzzleSource,b.x,b.y],[f.rearSource,b.backX,b.backY]]){
   near((point[0]-f.crop[0]-anchor[0]*d.sourceSize[0])*RocketAimScale,x);
   near((d.sourceSize[1]*(1-anchor[1])-(point[1]-f.crop[1]))*RocketAimScale,y);
   assert.ok(point[0]>=f.crop[0]&&point[0]<f.crop[0]+d.sourceSize[0]);
   assert.ok(point[1]>=f.crop[1]&&point[1]<f.crop[1]+d.sourceSize[1]);
  }
  near(Math.atan2(b.y-b.backY,b.x-b.backX),b.pitch);
 }
});

test('flight smoke starts only once the rocket tail clears the tube',()=>{
 const fx=new ParticlePool(),q=new ProjectileManager(fx);
 q.spawn({owner:'player',x:200,y:200,direction:1,speed:460,damage:1,range:1000,pitch:Math.PI/2,kind:'rocket'});
 for(let i=0;i<25;i++)q.update(1/120,target,[],[]);
 assert.equal(fx.items.filter(p=>p.active&&p.kind==='smoke').length,0);
 for(let i=0;i<5;i++)q.update(1/120,target,[],[]);
 const smoke=fx.items.filter(p=>p.active&&p.kind==='smoke');assert.ok(smoke.length>0);
 assert.ok(smoke.every(p=>p.y>=190));
});

test('reusing an aimed rocket pool entry clears its old launch turn and heading',()=>{
 const q=new ProjectileManager(new ParticlePool());
 q.spawn({owner:'player',x:0,y:0,direction:1,speed:100,damage:1,range:200,pitch:Math.PI/2,launchPitch:0,kind:'rocket'});
 const p=q.items[0];assert.ok(p.launchRemaining>0);p.active=false;
 q.spawn({owner:'enemy',x:0,y:0,direction:-1,speed:100,damage:1,range:200,kind:'bullet'});
 assert.equal(q.items[0],p);assert.equal(p.launchRemaining,0);near(p.vx,-100);near(p.vy,0);
 q.update(.1,target,[],[]);near(p.vx,-100);near(p.vy,0);
});

test('rocket exposes its original nose from the barrel instead of spawning a full body below the player; cached crops stay bounded',()=>{
 const {rocketCrop}=load('render/RocketPresentation');const crops=new Set();let previous=0;
 for(let d=0;d<250;d+=.1){
  const c=rocketCrop(d,200,47);assert.equal(c[0]+c[2],200);assert.equal(c[1],0);assert.equal(c[3],47);
  assert.ok(c[2]>=previous);previous=c[2];crops.add(c.join(','));
 }
 assert.ok(crops.size<=50);assert.ok(rocketCrop(0,200,47)[2]*116/200<=12);
 assert.deepEqual(rocketCrop(200,200,47),[0,0,200,47]);
});

test('crouched rocket backblast follows the low painted launcher rather than a standing-height constant',()=>{
 const a={...base,crouched:true,aimPitch:Math.PI/2},fx=new ParticlePool(),q=new ProjectileManager(fx),w=new WeaponSystem('rocket');
 const barrel=directBarrel(comicPose({...a,recoil:1.9}));w.fire(a,q,'player');
 const smoke=fx.items.filter(p=>p.active&&p.kind==='smoke');assert.equal(smoke.length,5);
 near(smoke[2].x,a.x+barrel.backX);near(smoke[2].y,a.y+barrel.backY);
 assert.ok(smoke.every(p=>p.vy<0));
 assert.ok(smoke.every(p=>Math.abs(p.y-(a.y+barrel.backY))<1e-7));
});
