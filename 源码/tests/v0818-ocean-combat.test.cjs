const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:L}=load('ocean/OceanLevel');
const {oceanEnemyPose,oceanShotVisual}=load('ocean/OceanEnemyPose');
const {StaticRectIndex}=load('core/StaticRectIndex');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function scene(shield=false){
 const s=new OceanSession();s.finishEntry();s.player.x=1100;s.player.y=350;
 s.camera.x=700;s.camera.y=0;s.camera.visibleWidth=1400;s.crates=[];
 const target=s.enemies.find(e=>e.kind==='diver'&&e.shielded===shield);
 for(const e of s.enemies)e.hp=0;
 Object.assign(target,{x:1450,y:350,homeX:1450,homeY:350,hp:shield?5:3,maxHp:shield?5:3,shieldHp:shield?2:0,active:true,mode:'rest',timer:100});
 return {s,e:target};
}
function contact(s,e,kind){
 const shot=s.spawnShot('player',kind,e.x-80,e.y+32,720,0,kind==='torpedo'?12:kind==='sonar'?5:3,2);
 s.updateShots(.1);s.flushBlasts();shot.active=false;
}
test('all ordinary targets have three pips; only four existing divers gain two shield pips',()=>{
 const s=new OceanSession();assert.equal(s.enemies.length,L.enemies.length);
 assert.equal(s.enemies.filter(e=>e.shielded).length,4);
 for(const e of s.enemies){if(['captain','mine'].includes(e.kind))continue;assert.equal(e.hp,e.shielded?5:3);assert.equal(e.shieldHp,e.shielded?2:0);}
});
test('real harpoons take three/five hits; sonar takes two/three hits against ordinary/shield divers',()=>{
 for(const shield of [false,true])for(const kind of ['harpoon','sonar']){
  const {s,e}=scene(shield),hp=shield?5:3,damage=kind==='sonar'?2:1,count=Math.ceil(hp/damage);
  for(let n=1;n<=count;n++){
   contact(s,e,kind);assert.equal(e.hp,Math.max(0,hp-n*damage));assert.equal(e.shieldHp,Math.max(0,(shield?2:0)-n*damage));
   assert.equal(s.kills,n===count?1:0);assert.equal(s.effects.filter(f=>f.kind==='shield').length,shield&&n*damage>=2?1:0);
  }
  s.damageEnemy(e,10);assert.equal(s.kills,1);
 }
});
test('one torpedo collision/explosion defeats ordinary and shield divers without multiplying blast damage',()=>{
 for(const shield of [false,true]){const {s,e}=scene(shield);contact(s,e,'torpedo');assert.equal(e.hp,0);assert.equal(e.shieldHp,0);assert.equal(s.kills,1);assert.equal(s.blastQueue.length,0);}
});
test('shield swimming and aim frames emit from their own socket; broken shield returns to an unshielded diver',()=>{
 const {s,e}=scene(true);const ids=new Set();
 for(const angle of [0,Math.PI,.6,2.5])for(const time of [0,.2]){
  Object.assign(e,{angle,vx:60,hit:0,mode:'rest'});s.time=time;
  const p=oceanEnemyPose(e,time);ids.add(p.id);s.fireEnemy(e);
  const shot=s.projectiles.filter(p=>p.active).at(-1);assert.ok(Math.hypot(shot.x-p.muzzle.x,shot.y-p.muzzle.y)<1e-6);
 }
 assert.equal(ids.size,2);s.damageEnemy(e,1);assert.equal(oceanEnemyPose(e,0).id,'enemy.shield.hit');
 s.damageEnemy(e,1);assert.equal(e.hp,3);assert.match(oceanEnemyPose(e,0).id,/^enemy.harpoon\./);
 s.reset();assert.equal(s.enemies.filter(e=>e.shieldHp===2).length,4);
});
test('idle aim preview and emitted shots use the exact same muzzle ray in both directions and every ranged loadout',()=>{
 for(const weapon of ['harpoon','sonar','torpedo'])for(const facing of [-1,1]){
  const {s,e}=scene();s.weapon=weapon;s.ammo=10;s.player.facing=facing;e.x=s.player.x+facing*240;e.y=430;
  s.updateAim(dt,idle);const a=s.aimIndicator();assert.ok(a.visible&&a.locked);assert.equal(a.targetId,e.id);
  const dx=a.x-a.origin.x,dy=a.y-a.origin.y;
  assert.ok(Math.abs(dx*Math.sin(a.angle)-dy*Math.cos(a.angle))<.02);
  s.firePlayer();const shot=s.projectiles.find(p=>p.active);assert.ok(shot);
  assert.ok(Math.abs(Math.atan2(shot.vy,shot.vx)-a.angle)<1e-9);assert.deepEqual({x:shot.x,y:shot.y},s.aimIndicator().origin);
  assert.ok(Math.abs((a.x-shot.x)*Math.sin(a.angle)-(a.y-shot.y)*Math.cos(a.angle))<.02,'recoil stays on the preview ray');
 }
});
test('occlusion and death clear the locked reticle immediately even during reacquire delay',()=>{
 const {s,e}=scene();s.updateAim(dt,idle);assert.equal(s.aimIndicator().locked,true);
 s.terrainIndex=new StaticRectIndex([{x:1275,y:320,w:30,h:150}]);
 s.updateAim(dt,idle);let a=s.aimIndicator();assert.equal(a.locked,false);assert.equal(a.targetId,'');assert.equal(a.blocked,true);assert.ok(a.x<1275);
 s.terrainIndex=new StaticRectIndex([]);s.updateAim(.2,idle);assert.equal(s.aimIndicator().locked,true);
 s.damageEnemy(e,3);assert.equal(s.aimIndicator().locked,false);
 s.weapon='knife';assert.equal(s.aimIndicator().visible,false);
 s.reset();assert.equal(s.aimTarget,'');assert.equal(s.aimIndicator().visible,false);
});
test('aim ignores offscreen targets and destroyed submarine modules',()=>{
 const {s,e}=scene();e.y=650;s.updateCamera(dt,600);s.updateAim(dt,idle);assert.equal(s.aimTarget,'');
 e.hp=0;s.boss.active=true;s.boss.x=1500;s.boss.y=350;s.boss.hp=180;
 s.updateAim(.2,idle);assert.ok(s.aimTarget);const id=s.aimTarget;
 if(id!=='submarine'){s.boss[id]=0;assert.equal(s.aimIndicator().locked,false);s.updateAim(dt,idle);assert.notEqual(s.aimTarget,id);}
});
test('water grenade leaves the hand forwards, retains aim with drag and never acquires downward gravity',()=>{
 for(const [axis,vertical] of [[1,0],[-1,0],[1,1],[-1,1]]){
  const {s,e}=scene();e.hp=0;const start={x:s.player.x,y:s.player.y+36};
  s.update(dt,{...idle,axis,vertical,grenade:true});const bomb=s.projectiles.find(p=>p.active&&p.kind==='bomb');
  assert.ok(bomb);assert.equal(s.player.grenades,2);assert.equal(s.depthThrown,1);assert.ok((bomb.x-start.x)*axis>0);
  const angle=Math.atan2(bomb.vy,bomb.vx),speed=Math.hypot(bomb.vx,bomb.vy),y=bomb.y;
  s.updateShots(.2);assert.ok(bomb.active);assert.ok(Math.hypot(bomb.vx,bomb.vy)<speed);
  assert.ok(Math.abs(Math.atan2(bomb.vy,bomb.vx)-angle)<1e-9);assert.ok(bomb.y>=y);
 }
});
test('a held grenade press consumes once, pause freezes it, and a full pool consumes no stock',()=>{
 const {s,e}=scene();e.hp=0;s.update(dt,{...idle,grenade:true});
 for(let n=0;n<30;n++)s.update(dt,{...idle,grenade:true});assert.equal(s.depthThrown,1);assert.equal(s.player.grenades,2);
 s.pause();const before=s.snapshot();s.update(1,{...idle,grenade:true});assert.deepEqual(s.snapshot(),before);
 s.resume();s.update(dt,idle);s.update(dt,{...idle,grenade:true});assert.equal(s.depthThrown,2);
 const {s:t,e:other}=scene();other.hp=0;
 for(const p of t.projectiles)Object.assign(p,{active:true,owner:'enemy',kind:'harpoon',x:1500,y:600,life:5,vx:0,vy:0});
 t.update(dt,{...idle,grenade:true});assert.equal(t.depthThrown,0);assert.equal(t.player.grenades,3);
});
test('forward grenade hits a wall instead of spawning through it and has one explosion at collision or timeout',()=>{
 for(const wall of [false,true]){
  const {s,e}=scene();e.hp=0;if(wall)s.terrainIndex=new StaticRectIndex([{x:1110,y:350,w:30,h:100}]);
  s.update(dt,{...idle,grenade:true});
  if(wall){
   assert.ok(s.projectiles.find(p=>p.active&&p.kind==='bomb').x<1110);
   for(let n=0;n<12;n++)s.update(dt,idle);
   assert.equal(s.blastCount,1);assert.ok(s.effects.find(f=>f.kind==='blast').x<=1110);
  }
  for(let n=0;n<300;n++)s.update(dt,idle);
  const blasts=s.effects.filter(f=>f.kind==='blast');assert.equal(s.blastCount,1);assert.equal(s.projectiles.filter(p=>p.active&&p.kind==='bomb').length,0);
  if(wall)assert.equal(blasts.length,0,'old blast expires');
 }
});
test('impact produces directional contact art and bounded stagger without moving the camera',()=>{
 const {s,e}=scene();const x=s.camera.x,y=s.camera.y;contact(s,e,'harpoon');
 assert.equal(s.effects.filter(f=>f.kind==='hit').length,1);assert.ok(e.hit>0);assert.equal(s.camera.x,x);assert.equal(s.camera.y,y);
 for(let n=0;n<120;n++)s.update(dt,idle);
 assert.equal(e.hit,0);assert.equal(s.effects.filter(f=>f.kind==='hit').length,0);
});
test('sonar and harpoon artwork and dimensions match across owners; only boss tiers enlarge them',()=>{
 for(const kind of ['harpoon','sonar']){
  assert.deepEqual(oceanShotVisual(kind,'enemy'),oceanShotVisual(kind,'player'));
  assert.ok(oceanShotVisual(kind,'enemy','boss').width>oceanShotVisual(kind,'player').width);
 }
});
