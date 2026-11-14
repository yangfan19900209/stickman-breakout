const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{StaticRectIndex}=load('core/StaticRectIndex');
const {OCEAN_FISH}=load('ocean/OceanFish'),{overlaps}=load('core/Types');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function scene(){const s=new OceanSession();s.finishEntry();for(const e of s.enemies)e.hp=0;s.crates=[];s.terrainIndex=new StaticRectIndex([]);
 s.player.x=2800;s.player.y=300;s.camera.x=2200;s.camera.visibleWidth=1400;return s;}
test('a diver uses a diagonal when both perpendicular routes hit cover and remains vulnerable while dodging',()=>{
 const s=scene(),e=s.enemies.find(e=>e.kind==='diver');Object.assign(e,{x:3100,y:300,homeX:3100,homeY:300,hp:3,mode:'rest',timer:2,dodgeCooldown:0});
 const blocks=[{x:3092,y:435,w:16,h:16},{x:3092,y:205,w:16,h:15}];s.terrainIndex=new StaticRectIndex(blocks);
 const shot=s.spawnShot('player','harpoon',2780,332,720,0,1,2);shot.age=.1;
 assert.equal(s.tryEnemyDodge(e,.09),false,'reaction is not instantaneous');
 assert.equal(s.tryEnemyDodge(e,.02),true);assert.ok(Math.abs(e.dodgeX)>1&&Math.abs(e.dodgeY)>1);
 assert.ok(e.dodgeCooldown>=1.6&&e.dodgeCooldown<=1.8);
 for(let n=0;n<36;n++){s.updateEnemy(e,dt);assert.ok(blocks.every(r=>!overlaps(r,s.enemyBounds(e))));}
 for(const p of s.projectiles)p.active=false;
 e.mode='dodge';const r=s.enemyBounds(e);s.spawnShot('player','harpoon',r.x-20,r.y+r.h/2,720,0,1,2);s.updateShots(.05);
 assert.equal(e.hp,2,'dodge does not grant invulnerability');
 e.mode='tell';e.dodgeCooldown=0;assert.equal(s.tryEnemyDodge(e,1),false,'committed warning cannot be cancelled');
});
test('fish chase starts farther away and the faster bite reaches the enlarged range with a dodgeable warning',()=>{
 for(const evade of [false,true]){
  const s=scene(),e=s.enemies.find(e=>e.kind==='fish');Object.assign(e,{x:3355,y:303,homeX:3355,homeY:303,hp:3,mode:'rest',timer:0});
  s.updateEnemy(e,dt);assert.equal(e.mode,'tell');assert.equal(e.tellDuration,.6);
  while(!e.locked)s.updateEnemy(e,dt);assert.ok(e.timer>=.32);
  while(e.mode==='tell')s.updateEnemy(e,dt);
  assert.ok(Math.hypot(e.vx,e.vy)>730);assert.ok(e.dashDuration*OCEAN_FISH.speed>=550);
  for(let n=0;n<130;n++){if(evade)s.movePlayer(dt,{...idle,vertical:1});s.updateEnemy(e,dt);}
  assert.equal(s.player.health,evade?5:4);
 }
 const s=scene(),e=s.enemies.find(e=>e.kind==='fish');Object.assign(e,{x:3580,y:303,homeX:3580,homeY:303,hp:3,mode:'rest',timer:1});
 const x=e.x;for(let n=0;n<60;n++)s.updateEnemy(e,dt);
 assert.ok(e.active);assert.ok(x-e.x>70);assert.equal(e.mode,'rest');
});
