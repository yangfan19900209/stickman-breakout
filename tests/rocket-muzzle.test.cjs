const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager');
const {ParticlePool}=load('combat/ParticlePool'),{comicPose}=load('render/ComicPose'),{directBarrel}=load('render/DirectPose');
const base={x:200,y:150,facing:1,animation:'Idle',animationTime:0,recoil:0,deadTime:0,weaponId:'rocket'};
const target={alive:true,bounds:{x:-1000,y:-1000,w:10,h:10},hit(){}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('aimed rockets leave the painted tube before turning upward, for standing, moving, crouched and airborne poses facing either way',()=>{
 for(const stance of [{},{animation:'Run',vx:280,stride:.2},{crouched:true},{animation:'Jump',animationTime:.1},{animation:'Fall',animationTime:.1}])
 for(const facing of [-1,1])for(const aimPitch of [Math.PI/4,Math.PI/2]){
  const a={...base,...stance,facing,aimPitch},w=new WeaponSystem('rocket'),q=new ProjectileManager(new ParticlePool());
  const barrel=directBarrel(comicPose({...a,recoil:1.9}));assert.ok(barrel);
  assert.ok(w.fire(a,q,'player'));const p=q.items.find(p=>p.active);
  near(p.x,a.x+barrel.x*facing);near(p.y,a.y+barrel.y);near(w.flashPitch,barrel.pitch);
  near(p.vx,facing*Math.cos(barrel.pitch)*460);near(p.vy,Math.sin(barrel.pitch)*460);
  const x=p.x,y=p.y;q.update(1/120,target,[],[]);
  near(p.x,x+Math.cos(barrel.pitch)*facing*460/120);near(p.y,y+Math.sin(barrel.pitch)*460/120);
  for(let i=0;i<20;i++)q.update(1/120,target,[],[]);
  assert.equal(p.launchRemaining,0);near(p.vx,Math.cos(aimPitch)*facing*460);near(p.vy,Math.sin(aimPitch)*460);
 }
});

test('upward launch still collides with cover immediately in front of the tube and cannot skip that wall',()=>{
 const a={...base,aimPitch:Math.PI/2},w=new WeaponSystem('rocket'),q=new ProjectileManager(new ParticlePool());
 const barrel=directBarrel(comicPose({...a,recoil:1.9}));let blast;
 q.onExplosion=(x,y)=>blast={x,y};w.fire(a,q,'player');
 const wall={x:a.x+barrel.x+2,y:a.y,w:10,h:120};q.update(1/120,target,[],[wall]);
 assert.equal(q.items.filter(p=>p.active).length,0);assert.ok(blast);assert.ok(blast.x<=wall.x+2);
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
});
