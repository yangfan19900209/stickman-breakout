const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {PickupSystem}=load('world/PickupSystem'),{WeaponSystem}=load('combat/WeaponSystem');
const {PlayerController}=load('player/PlayerController'),{LevelController}=load('level/LevelController');
const {directPose,directMuzzle}=load('render/DirectPose'),{RocketWalkFrames,RocketWalkCycle}=load('render/RocketWalkFrames');
const {objectPresentation}=load('render/ObjectPresentation'),{OceanSession}=load('ocean/OceanSession');
const {oceanBlastVisual}=load('ocean/OceanCombatTuning');
const dt=1/120,idle={axis:0,jump:false,shoot:false},floor={x:0,y:0,w:1600,h:150};
test('rocket motion alternates complete contact and passing poses with stable soles through firing',()=>{
 const base={animation:'Run',animationTime:0,deadTime:0,weaponId:'rocket',vx:280,recoil:0};
 const poses=Array.from({length:4},(_,i)=>directPose({...base,stride:(i+.1)/4}));
 assert.equal(new Set(poses).size,4);
 const tips=poses.map(directMuzzle);assert.ok(Math.max(...tips.map(t=>t[1]))-Math.min(...tips.map(t=>t[1]))<3);
 poses.forEach((id,i)=>{assert.equal(directPose({...base,stride:(i+.1)/4,recoil:1.8}),id);const f=load('render/ComicFrames').ComicFrames[id];assert.ok(f.anchor[1]*f.sourceSize[1]*.84<2);assert.ok(f.sourceSize[1]*.84>=78&&f.sourceSize[1]*.84<=86);});
 assert.equal(directPose({...base,stride:1.01}),poses[0]);
});
test('ammunition refills the held or holstered gun without changing weapon or cooldown',()=>{
 for(const knife of [false,true]){
  const p=new PlayerController();p.reset(100,150);const w=new WeaponSystem('rocket');w.ammo=2;w.cooldown=.4;if(knife)w.toggleKnife();
  const drops=new PickupSystem();drops.spawn(100,160,'ammo');drops.update(dt,p,w,[floor]);
  assert.equal(drops.collected,1);assert.equal(w.id,knife?'knife':'rocket');if(knife)w.toggleKnife();assert.equal(w.ammo,4);assert.equal(w.cooldown,.4);
 }
});
test('full grenade supplies remain with an explicit message while a nearby bullet case still refills rockets',()=>{
 const p=new PlayerController();p.reset(100,150);p.grenades=6;const w=new WeaponSystem('rocket');w.ammo=2;
 const drops=new PickupSystem();drops.spawn(100,160,'grenades');drops.update(dt,p,w,[floor]);assert.equal(drops.collected,0);assert.match(drops.lastMessage,/手雷已满/);
 drops.spawn(100,160,'ammo');drops.update(dt,p,w,[floor]);assert.equal(drops.collected,1);assert.equal(w.ammo,4);assert.equal(p.grenades,6);
});
test('pickups follow moving support in both directions and fall after its removal',()=>{
 const p=new PlayerController();p.reset(20,150);const w=new WeaponSystem(),drops=new PickupSystem(),deck={x:200,y:250,w:200,h:24,oneWay:true};
 drops.spawn(280,300,'ammo');for(let n=0;n<160;n++)drops.update(dt,p,w,[floor,deck]);const d=drops.items.find(p=>p.active);assert.equal(d.y,284);
 for(const dy of [3,-4,9,-8]){deck.y+=dy;drops.update(dt,p,w,[floor,deck]);assert.ok(Math.abs(d.y-(deck.y+34))<1e-6);}
 for(let n=0;n<100;n++)drops.update(dt,p,w,[floor]);assert.equal(d.y,160);assert.equal(d.support,floor);
});
test('a visible supply is collected at body height but cannot be taken through a deck',()=>{
 const p=new PlayerController();p.reset(300,150);const w=new WeaponSystem('rocket');w.ammo=0;const drops=new PickupSystem(),deck={x:200,y:226,w:200,h:24,oneWay:true};
 drops.spawn(300,260,'ammo');drops.items[0].vy=0;drops.update(dt,p,w,[floor,deck]);assert.equal(drops.collected,0);
 p.y=250;drops.update(dt,p,w,[floor,deck]);assert.equal(drops.collected,1);
});
test('concrete roof excludes lifting rings and loose edge stones for both facing directions',()=>{
 for(const facing of [-1,1]){
  const l=new LevelController(),o=l.objects.objects.find(o=>o.id==='concrete-C'),v=objectPresentation(o),p=new PlayerController();
  // Isolate this roof: the relocated ammo crate now occupies its right-hand approach.
  l.objects.reset(l.data.objects.filter(q=>q.id==='concrete-C'));l.refreshSolids();
  p.reset(o.x+o.w/2,o.y+v.height+8);p.facing=facing;
  for(let n=0;n<100;n++)p.update(dt,idle,l);
  assert.ok(p.grounded);assert.ok(Math.abs(p.y-(o.y+v.height*85/101))<1e-6);assert.ok(p.y<o.y+v.height-8);
  for(let n=0;n<90;n++)p.update(dt,{...idle,axis:facing},l);assert.equal(p.y,150);
 }
});
test('crouching beneath a one-way floating slab does not trap the player crouched',()=>{
 const l=new LevelController();l.objects.reset([]);l.refreshSolids();const p=new PlayerController();p.reset(1250,190);p.crouched=true;
 p.update(dt,idle,l);assert.equal(p.crouched,false);
});
function sea(x=1100){const s=new OceanSession();s.finishEntry();s.player.x=x;s.player.y=350;s.camera.x=x-400;s.camera.visibleWidth=1400;for(const e of s.enemies)e.hp=0;return s;}
test('repeated hits cannot indefinitely postpone a warned enemy volley',()=>{
 const s=sea(),e=s.enemies[0];Object.assign(e,{hp:99,x:1450,y:350,homeX:1450,homeY:350,mode:'tell',attack:'harpoon',timer:.75,staggered:false,active:true});
 for(let n=0;n<160;n++){if(n%12===0)s.damageEnemy(e,1);s.updateEnemy(e,dt);}
 assert.equal(e.attackCounts.harpoon,1);assert.ok(s.projectiles.some(p=>p.active&&p.owner==='enemy'));
});
test('deep encounters permit three coordinated attacks, while tutorial remains capped at two',()=>{
 for(const [x,count] of [[1100,2],[7100,3]]){
  const s=sea(x),enemies=s.enemies.slice(0,3);
  enemies.forEach((e,i)=>Object.assign(e,{kind:'turret',hp:30,x:x+200+i*70,y:320,homeX:x+200+i*70,mode:'rest',timer:0,active:true}));
  for(const e of enemies)s.updateEnemy(e,dt);
  assert.equal(enemies.filter(e=>e.mode==='tell').length,count);
 }
});
test('enemy death emits one audible explosion without pausing swimming; distant impacts do not shake the view',()=>{
 const s=sea(),e=s.enemies[0];Object.assign(e,{hp:1,x:1400,y:350,mode:'tell'});s.damageEnemy(e,3);s.damageEnemy(e,3);
 assert.equal(s.blastCount,1);assert.equal(s.effects.filter(f=>f.kind==='blast').length,1);assert.equal(s.hitStop,0);assert.ok(s.shakePower>=3);
 s.hitStop=s.shakeTime=s.shakePower=0;const distant=s.enemies[1];Object.assign(distant,{hp:1,x:7000});s.damageEnemy(distant,3);assert.equal(s.hitStop,0);assert.equal(s.shakePower,0);
});
test('authored underwater explosion plays all eight frames and fades within its lifetime',()=>{
 const frames=new Set();for(let n=0;n<120;n++){const v=oceanBlastVisual(n/120);frames.add(v.frame);assert.ok(v.opacity>=0&&v.opacity<=255);}
 assert.equal(oceanBlastVisual(.15).opacity,255);assert.equal(frames.size,8);assert.equal(oceanBlastVisual(1).opacity,0);
});
test('underwater box cutting protects the same press, then releases after leaving the box',()=>{
 const s=sea(),p=s.player;s.weapon=s.storedWeapon='torpedo';s.ammo=8;
 s.crates=[{id:'near-box',x:p.x+65,y:p.y,hp:3,drop:'depth-charge',vy:0,deadTime:0}];
 for(let n=0;n<90;n++)s.update(dt,{...idle,shoot:true});
 assert.equal(s.crates[0].hp,0);assert.equal(s.ammo,8);assert.equal(s.protectedPress,true);
 for(let n=0;n<140;n++)s.update(dt,{...idle,axis:-1,shoot:true});
 assert.equal(s.protectedPress,false);assert.ok(s.shots>0);assert.ok(s.ammo<8);
});
