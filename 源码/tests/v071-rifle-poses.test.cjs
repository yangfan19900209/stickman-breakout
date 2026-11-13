const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {comicEquipment}=load('render/ComicEquipment'),{comicMuzzle}=load('render/ComicPose');
const {RifleActionFrames}=load('render/RifleActionFrames');
const base={animation:'Jump',animationTime:0,recoil:0,deadTime:0,weaponId:'rifle'};
test('rifle keeps a complete equipped body throughout rising and falling, including upward aim',()=>{
 const seen=new Set();
 for(const animation of ['Jump','Fall'])for(const aimPitch of [0,Math.PI/4,Math.PI/2])for(let i=0;i<60;i++){
   const e=comicEquipment({...base,animation,aimPitch,animationTime:i/60,recoil:i%2?1:0});
   assert.ok(e.body in RifleActionFrames);assert.equal(e.body,e.pose);
   assert.equal(e.weapon,null,'No detached rotated weapon');assert.equal(e.grip,null,'No erased-body grip overlay');
   assert.equal(e.bakedWeapon,'rifle');seen.add(e.body);
 }
 assert.equal(seen.size,8,'Two horizontal rise/fall frames and four aimed air poses');
 for(const aimPitch of [Math.PI/4,Math.PI/2])for(const crouched of [false,true]){
   const e=comicEquipment({...base,animation:'Idle',aimPitch,crouched});
   assert.ok(e.body in RifleActionFrames);assert.equal(e.weapon,null);assert.equal(e.grip,null);
 }
});
test('rifle fire uses the same full-pose muzzle as the rendered actor in either direction',()=>{
 const {PlayerController}=load('player/PlayerController'),{WeaponSystem}=load('combat/WeaponSystem');
 const {ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
 for(const vy of [200,-200])for(const facing of [-1,1])for(const aimPitch of [0,Math.PI/4,Math.PI/2])for(const age of [.05,.25]){
  const p=new PlayerController(),w=new WeaponSystem(),q=new ProjectileManager(new ParticlePool());
  p.grounded=false;p.vy=vy;p.facing=facing;p.aimPitch=aimPitch;p.animationTime=age;p.x=200;p.y=300;
  const e=comicEquipment(p);assert.equal(e.bakedWeapon,'rifle');assert.ok(w.fire(p,q,'player'));
  const tip=comicMuzzle(p,aimPitch),b=q.items.find(b=>b.active);
  assert.ok(Math.abs(b.x-p.x-tip.x*facing)<1e-6);assert.ok(Math.abs(b.y-p.y-tip.y)<1e-6);
  assert.equal(comicEquipment(p).body,e.body,'Firing recoil must not switch to a detached or unarmed pose');
 }
});
test('whole rifle replacements preserve throw, death and contextual knife actions',()=>{
 assert.ok(comicEquipment({...base,throwTime:.2}).body.startsWith('player.throw.'));
 assert.ok(comicEquipment({...base,animation:'Dead',deadTime:.2}).body.startsWith('player.death.'));
 const knife=comicEquipment({...base,meleeTime:.1,meleeStance:'jump',meleeProgress:.5});
 assert.ok(knife.body.startsWith('direct.knife.'));assert.equal(knife.weapon,null);
});
