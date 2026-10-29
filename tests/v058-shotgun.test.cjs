const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {ShotgunFrames,ShotgunClips,ShotgunScale}=load('render/ShotgunFrames');
const {comicPose,comicMuzzle}=load('render/ComicPose');
const {comicEquipment}=load('render/ComicEquipment');
const {WeaponSystem}=load('combat/WeaponSystem');
const {ProjectileManager}=load('combat/ProjectileManager');
const {ParticlePool}=load('combat/ParticlePool');
const {GameConfig:C}=load('core/GameConfig');
const base={animation:'Idle',animationTime:0,recoil:0,deadTime:0,weaponId:'shotgun'};
const dummy={x:-2000,y:-2000,alive:false,bounds:{x:-2000,y:-2000,w:1,h:1},takeDamage(){return false;}};

test('shotgun atlas preserves the supplied whole soldiers, fixed sole pivots, source pixels and four-pixel padding',()=>{
 const m=JSON.parse(fs.readFileSync('art/v058-manifest.json'));
 const source=PNG.sync.read(fs.readFileSync(m.source.file)),atlas=PNG.sync.read(fs.readFileSync('assets/resources/comic/shotgun.png'));
 assert.equal(m.source.sha256,crypto.createHash('sha256').update(fs.readFileSync(m.source.file)).digest('hex'));
 assert.deepEqual(m.source.size,[1448,1086]);assert.ok(m.source.transparentPixels>900000);
 assert.equal(m.frames.length,51);assert.equal(m.excludedOverlaps.length,6);assert.equal(Object.keys(ShotgunClips).length,12);
 assert.equal(ShotgunScale,.7);assert.deepEqual([atlas.width,atlas.height],[2048,512]);
 for(const f of m.frames){
  assert.deepEqual(ShotgunFrames[f.id].size,f.size);assert.deepEqual(f.sourceSize,f.size);
  const cut=PNG.sync.read(fs.readFileSync(f.file));
  assert.ok(Math.abs(f.origin[0]+f.anchor[0]*f.size[0]-f.footSource[0])<1e-8);
  assert.ok(Math.abs(f.origin[1]+(1-f.anchor[1])*f.size[1]-f.footSource[1])<1e-8);
  // Every retained opaque pixel comes from the original figure, never a hand/gun patch.
  for(let y=0;y<cut.height;y++)for(let x=0;x<cut.width;x++){
   const k=(y*cut.width+x)*4;if(!cut.data[k+3])continue;
   const o=((y+f.origin[1])*source.width+x+f.origin[0])*4;
   for(let c=0;c<4;c++)assert.equal(cut.data[k+c],source.data[o+c],f.id);
  }
  const [x,y,w,h]=f.atlas;assert.ok(x>=4&&y>=4&&x+w+4<=atlas.width&&y+h+4<=atlas.height);
  for(let c=0;c<4;c++)for(let p=1;p<=4;p++)assert.equal(atlas.data[(y*atlas.width+x)*4+c],atlas.data[(y*atlas.width+x-p)*4+c]);
 }
 for(const id of m.excludedOverlaps)assert.equal(ShotgunFrames[id],undefined);
});

test('shotgun idle/run/jump/fall/crouch/fire/hit/death never assemble a body, hand or weapon overlay',()=>{
 const states=[{}, {animation:'Run',vx:280,stride:.4},{animation:'Jump',animationTime:.2},
  {animation:'Fall',animationTime:.2},{crouched:true},{crouched:true,vx:115,stride:.4},
  {recoil:1.65},{recoil:.6},{animation:'Run',vx:280,stride:.6,recoil:1.65},
  {crouched:true,recoil:1.2},{crouched:true,vx:115,stride:.6,recoil:1.65},
  {animation:'Hit',hitTime:.18},{animation:'Dead',deadTime:.5}];
 for(const state of states){const e=comicEquipment({...base,...state});
  assert.ok(e.body.startsWith('direct.shotgun.'),JSON.stringify(state));assert.ok(ShotgunFrames[e.body]);
  assert.equal(e.weapon,null);assert.equal(e.grip,null);assert.equal(e.bakedRifle,false);assert.equal(e.bakedWeapon,'shotgun');
 }
 assert.ok(comicPose({...base,throwTime:.2}).startsWith('player.throw.'));
 assert.ok(comicPose({...base,meleeTime:.1,meleeStage:2,meleeProgress:.5,meleeStance:'stand'}).startsWith('direct.knife.combo2.'));
});

test('firing while crouch-walking advances all six native leg poses and preserves the low muzzle',()=>{
 const seen=new Set();
 for(let n=0;n<60;n++){
  const a={...base,crouched:true,vx:115,stride:n/60,recoil:1.65};
  const id=comicPose(a);assert.ok(id.startsWith('direct.shotgun.crouch-walk.'));seen.add(id);
  const tip=comicMuzzle(a,0,9);assert.ok(tip.y<35);assert.ok(tip.x>40);
 }
 assert.equal(seen.size,6);
});

test('shotgun fire originates at the painted barrel in both directions, including crouch, run and air',()=>{
 for(const facing of [-1,1])for(const stance of [{},{crouched:true},{animation:'Run',vx:280,stride:.4},{animation:'Jump',animationTime:.2},{animation:'Fall',animationTime:.3},{crouched:true,vx:115,stride:.3}]){
  const source={...base,...stance,x:100,y:150,facing};const w=new WeaponSystem('shotgun'),p=new ProjectileManager(new ParticlePool());
  const tip=comicMuzzle({...source,recoil:1.65},0,9);assert.ok(w.fire(source,p,'player'));
  const pellets=p.items.filter(b=>b.active);assert.equal(pellets.length,6);
  for(const b of pellets){assert.equal(b.x,100+tip.x*facing);assert.equal(b.y,150+tip.y);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-880)<1e-8);}
  assert.equal(w.ammo,17);assert.equal(w.cooldown,.48);
 }
});

test('player rifle travels 76 units per tenth-second; enemy, pellet and rocket speeds are preserved',()=>{
 const source={...base,weaponId:'rifle',x:100,y:150,facing:1},p=new ProjectileManager(new ParticlePool());
 assert.ok(new WeaponSystem().fire(source,p,'player'));const b=p.items.find(b=>b.active),x=b.x;
 assert.equal(b.vx,760);assert.equal(b.range,980);assert.equal(b.damage,1);
 p.update(.1,dummy,[],[]);assert.ok(Math.abs(b.x-x-76)<1e-8);
 const enemy=new ProjectileManager(new ParticlePool());assert.ok(new WeaponSystem().fire({...source,kind:'ranged'},enemy,'enemy'));
 assert.equal(enemy.items.find(b=>b.active).vx,430);assert.equal(C.weapons.rifle.interval,.14);
 assert.equal(C.weapons.shotgun.speed,880);assert.equal(C.weapons.rocket.speed,460);
});

test('slower rifle retains real hits and its original range-based recycling rather than expiring too early',()=>{
 const p=new ProjectileManager(new ParticlePool()),source={...base,weaponId:'rifle',x:0,y:0,facing:1};
 let hits=0;const target={x:600,y:0,alive:true,bounds:{x:600,y:0,w:20,h:120},takeDamage(){hits++;return true;}};
 new WeaponSystem().fire(source,p,'player');for(let n=0;n<120;n++)p.update(1/120,dummy,[target],[]);
 assert.equal(hits,1);assert.equal(p.items.filter(b=>b.active).length,0);
 new WeaponSystem().fire(source,p,'player');for(let n=0;n<200;n++)p.update(1/120,dummy,[],[]);
 assert.equal(p.items.filter(b=>b.active).length,0);assert.equal(p.dropped,0);
});
