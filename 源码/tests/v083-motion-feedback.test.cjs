const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {PlayerController}=load('player/PlayerController'),{LevelController}=load('level/LevelController');
const {AbandonedBase}=load('level/LevelData'),{GameConfig:C}=load('core/GameConfig');
const {comicPose,comicMuzzle}=load('render/ComicPose'),{MotionFrames,MotionSockets,MotionBarrels}=load('render/MotionFrames');
const idle={axis:0,jump:false,shoot:false,jumpHeld:false},dt=1/120;
function fixture(extra=[]){const l=new LevelController({...AbandonedBase,solids:[{x:0,y:0,w:2400,h:150,kind:'ground'},...extra],objects:[],enemies:[],mechanisms:[]}),p=new PlayerController();p.reset(110,150);return {l,p};}
function tick(p,l,n,input=idle){for(let i=0;i<n;i++)p.update(dt,input,l);}
test('down+jump is an ordinary jump and cannot produce a dash',()=>{
 const {p,l}=fixture();p.update(dt,{...idle,axis:1,crouch:true,jump:true,jumpHeld:true},l);
 assert.equal(p.animation,'Jump');assert.equal(p.jumpSerial,1);assert.equal(p.height,C.player.height);assert.ok(p.vx<=C.player.speed);
 tick(p,l,18,{...idle,axis:1,jumpHeld:true});assert.equal(p.vx,C.player.speed);assert.equal(p.jumpSerial,1);
});

test('normal jump and airborne down+jump retain exactly one second jump',()=>{
 const {p,l}=fixture();p.update(dt,{...idle,jump:true,jumpHeld:true},l);tick(p,l,12,{...idle,jumpHeld:true});
 assert.equal(p.jumpCount,1);p.update(dt,{...idle,jump:true,crouch:true,jumpHeld:true},l);assert.equal(p.jumpCount,2);
 tick(p,l,3);const serial=p.jumpSerial;p.update(dt,{...idle,jump:true,jumpHeld:true},l);assert.equal(p.jumpSerial,serial);
});
test('all rifle/rocket aimed locomotion phases keep whole-body gait and one measured firing socket during recoil',()=>{
 const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
 for(const weaponId of ['rifle','rocket'])for(const aimPitch of [Math.PI/4,Math.PI/2])for(const facing of [-1,1]){
  const seen=new Set();for(let n=0;n<4;n++){
   const a={x:200,y:150,weaponId,animation:'Run',animationTime:0,vx:facing*280,facing,stride:(n+.2)/4,recoil:0,deadTime:0,aimPitch};
   const id=comicPose(a);assert.ok(MotionFrames[id]);seen.add(id);assert.equal(comicPose({...a,recoil:1.9}),id);
   const tip=comicMuzzle(a,aimPitch);assert.deepEqual([tip.x,tip.y],MotionSockets[id]);
   const w=new WeaponSystem(weaponId),q=new ProjectileManager(new ParticlePool());assert.ok(w.fire(a,q,'player'));const b=q.items.find(b=>b.active);
   const firedTip=comicMuzzle(a,aimPitch);
   assert.ok(Math.abs(b.x-a.x-firedTip.x*facing)<1e-6&&Math.abs(b.y-a.y-firedTip.y)<1e-6);
   if(weaponId==='rocket'){const tube=MotionBarrels[id];assert.ok(Math.abs(Math.atan2(b.vy,b.vx*facing)-tube.pitch)<1e-8);}
  }assert.equal(seen.size,4);
 }
});
test('hurt pose wins over raised guns, walking and melee; interrupted fire consumes no ammo',()=>{
 const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
 for(const weaponId of ['rifle','rocket','knife']){const a={weaponId,animation:'Hit',hitTime:.2,animationTime:0,recoil:1,deadTime:0,aimPitch:Math.PI/2,vx:280,meleeTime:.2};
  assert.equal(comicPose(a),'direct.player.hurt');const w=new WeaponSystem(weaponId),ammo=w.ammo;assert.equal(w.fire(a,new ProjectileManager(new ParticlePool()),'player'),false);assert.equal(w.ammo,ammo);
 }
});
test('quick-cut visual active flag follows actual windup/active/recovery and resets after cancellation',()=>{
 const {MeleeSystem}=load('combat/MeleeSystem'),{ParticlePool}=load('combat/ParticlePool');const {p,l}=fixture(),m=new MeleeSystem(),fx=new ParticlePool();
 p.weaponId='knife';const states=new Set();for(let n=0;n<45;n++){
  m.update(dt,p,[],l.solids,n===0,false,fx,l,[]);states.add(m.state);assert.equal(p.meleeActive,m.state==='active');
 }assert.ok(states.has('windup')&&states.has('active')&&states.has('recovery'));m.cancel(p);assert.equal(p.meleeActive,false);
});
test('packed motion frames have transparent gutters, stable scale and no clipped measured muzzle',()=>{
 const {PNG}=require('pngjs'),fs=require('fs'),m=JSON.parse(fs.readFileSync('../素材/游戏美术/v083-motion-manifest.json')),a=PNG.sync.read(fs.readFileSync(m.atlas.file));
 assert.equal(m.frames.length,28);for(const f of m.frames){const [x,y,w,h]=f.atlas;assert.ok(x>0&&y>0&&x+w<a.width&&y+h<a.height);
  assert.equal(a.data[((y-1)*a.width+x)*4+3],0);assert.ok(f.anchor[1]*f.worldSize[1]<2);
  if(f.muzzle){const [l,t,sw,sh]=f.crop;assert.ok(f.muzzle[0]>=l&&f.muzzle[0]<l+sw&&f.muzzle[1]>=t&&f.muzzle[1]<t+sh,f.id);}
 }
});
