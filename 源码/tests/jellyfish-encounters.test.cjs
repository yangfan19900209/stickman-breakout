const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:O}=load('ocean/OceanLevel');
const {GameSession}=load('core/GameSession'),{AbandonedBase:L}=load('level/LevelData');
const {StaticRectIndex}=load('core/StaticRectIndex'),{overlaps}=load('core/Types');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function scene(){const s=new OceanSession();s.finishEntry();for(const e of s.enemies)e.hp=0;
 s.player.x=1100;s.player.y=350;s.camera.x=700;s.camera.visibleWidth=1400;s.crates=[];
 const e=s.enemies.find(e=>e.kind==='jellyfish');Object.assign(e,{x:1480,y:200,homeX:1480,homeY:200,hp:3,mode:'rest',timer:0});return {s,e};}
test('four former kelp targets become harmless decoration and four three-HP jellyfish spawn outside terrain',()=>{
 const s=new OceanSession(),j=s.enemies.filter(e=>e.kind==='jellyfish');
 assert.equal(O.ambientKelp.length,4);assert.equal(j.length,4);assert.equal(s.enemies.filter(e=>e.kind==='kelp').length,0);
 for(const e of j){assert.equal(e.hp,3);assert.ok(!O.obstacles.some(r=>overlaps(r,s.enemyBounds(e))),e.id);}
 for(const e of s.enemies)s.damageEnemy(e,999);
 assert.equal(s.drops.filter(d=>d.kind==='torpedo'||d.kind==='sonar').length,0);
 assert.equal(s.drops.filter(d=>d.kind==='medkit').length,1);
});
test('jellyfish swim across both axes, warn before a moving sting, and a late vertical dodge escapes',()=>{
 for(const evade of [false,true]){
  const {s,e}=scene();let frames=0;
  while(e.mode!=='tell'&&frames++<600){s.time+=dt;s.updateEnemy(e,dt);}
  assert.equal(e.mode,'tell');assert.ok(e.x<1360&&e.y>250,'must chase in two dimensions');
  const start={x:e.x,y:e.y};while(!e.locked){s.updateEnemy(e,dt);assert.equal(s.player.health,5);}
  const a=e.angle;
  while(e.mode==='tell'){s.updateEnemy(e,dt);if(evade)s.player.y+=2;assert.equal(s.player.health,5);}
  while(e.mode==='attack'){s.updateEnemy(e,dt);if(evade)s.player.y+=2;}
  assert.equal(e.angle,a);assert.ok(Math.hypot(e.x-start.x,e.y-start.y)>100);
  assert.equal(s.player.health,evade?5:4);assert.equal(e.attackCounts.sting,1);assert.ok(e.timer>=1.39);
  assert.equal(s.projectiles.filter(p=>p.active).length,0);
 }
});
test('jellyfish sting stops at reef, and death, pause and restart cancel further attacks',()=>{
 const {s,e}=scene();s.player.y=200;Object.assign(e,{x:1450,y:190,mode:'attack',attack:'sting',angle:Math.PI,vx:-220,vy:0,timer:.82});
 s.terrainIndex=new StaticRectIndex([{x:1250,y:70,w:35,h:610}]);
 for(let i=0;i<120;i++)s.updateEnemy(e,dt);
 assert.ok(e.x>=1321-.01);assert.equal(s.player.health,5);
 s.pause();const state=JSON.stringify(e);s.update(.5,idle);assert.equal(JSON.stringify(e),state);
 s.damageEnemy(e,999);const position=e.x;for(let i=0;i<120;i++)s.updateEnemy(e,dt);assert.equal(e.x,position);
 s.reset();assert.equal(s.enemies.filter(e=>e.kind==='jellyfish'&&e.hp===3).length,4);
});
test('both final bosses summon only one two-person wave even after its defeat and phase changes',()=>{
 const a=new GameSession();a.reset();const b=a.spawner.guard;
 a.player.reset(b.x-500,b.y);b.active=true;b.introTime=0;b.introduced=true;
 for(let i=0;i<9600&&b.summons<2;i++)b.update(dt,a.player,a.level,a.projectiles);
 assert.equal(b.summons,2);let reinforcements=a.spawner.enemies.filter(e=>e.id.startsWith('reinforce'));
 assert.equal(reinforcements.length,2);reinforcements.forEach(e=>e.health=0);b.health=40;
 for(let i=0;i<7200;i++)b.update(dt,a.player,a.level,a.projectiles);
 assert.equal(a.spawner.enemies.filter(e=>e.id.startsWith('reinforce')).length,2);assert.equal(b.summons,2);
 const s=new OceanSession();s.finishEntry();s.player.x=15500;s.player.y=330;
 for(let i=0;i<1201;i++)s.updateBoss(dt);
 const adds=s.enemies.filter(e=>e.id.startsWith('sea-reinforce'));assert.equal(adds.length,2);
 assert.deepEqual(adds.map(e=>[e.role,e.hp]),[['harpoon',3],['sonar',3]]);
 for(const e of adds){assert.equal(e.mode,'rest');assert.ok(e.timer>=1.2);s.damageEnemy(e,999);}
 s.boss.hp=20;for(let i=0;i<7200;i++)s.updateBoss(dt);
 assert.equal(s.boss.summons,2);assert.equal(s.enemies.filter(e=>e.id.startsWith('sea-reinforce')).length,2);
 assert.equal(s.drops.length,0);s.reset();assert.equal(s.boss.summons,0);assert.equal(s.enemies.length,44);
});
test('three added land launchers stay supported and each early heavy-ammo crate precedes a combat wave',()=>{
 assert.equal(L.enemies.filter(e=>e.kind==='turret').length,6);
 const a=new GameSession();a.reset();a.spawner.miniBoss.health=0;a.spawner.releaseAfterMini();
 for(const id of ['turret-C','turret-E','turret-F0']){const e=a.spawner.enemies.find(e=>e.id===id);assert.ok(e);
  assert.ok(!a.level.objects.objects.some(o=>o.alive&&overlaps(o.bounds,e.bounds)),id);}
 const rocket=L.objects.find(o=>o.id==='rocket-before-tank'),tank=L.enemies.find(e=>e.encounter==='mini');
 assert.ok(L.enemies.filter(e=>!e.encounter&&e.x>rocket.x&&e.x<tank.x-900).length>=3);
 const torpedo=O.crates.find(c=>c.drop==='torpedo');assert.ok(torpedo.x<4400);
 assert.ok(O.enemies.filter(e=>e[0]!=='captain'&&e[1]>torpedo.x&&e[1]<5040).length>=2);
});
