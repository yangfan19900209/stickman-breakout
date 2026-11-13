const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {AbandonedBase}=load('level/LevelData'),{LevelController}=load('level/LevelController');
const {PlayerController}=load('player/PlayerController'),{GameSession}=load('core/GameSession');
const {InputManager}=load('core/InputManager'),{GameConfig:C}=load('core/GameConfig');
const {EnemyController}=load('enemy/EnemyController'),{ColossusBoss}=load('enemy/ColossusBoss'),{TankBoss}=load('enemy/TankBoss');
const {ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool'),{PickupSystem}=load('world/PickupSystem');
const dt=1/120,idle={axis:0,jump:false,jumpHeld:false,shoot:false};
function stacked(){return new LevelController({name:'drop',width:4000,spawn:{x:400,y:350},exit:{x:3900,y:150},enemies:[],objects:[],solids:[
 {x:0,y:0,w:4000,h:150,kind:'ground'},
 {x:300,y:236,w:300,h:24,kind:'platform',oneWay:true},
 {x:300,y:326,w:300,h:24,kind:'platform',oneWay:true},
]});}

test('chapter has fixed two-tier routes, no lifts, and both mini-arena approaches reach the high deck with one jump',()=>{
 const l=new LevelController();assert.equal(l.mechanisms.filter(m=>m.data.kind==='lift').length,0);
 const pairs=[[1150,1610,1],[2300,2750,1],[4300,4670,1],[5030,4670,-1],[5520,5890,1],[6300,5890,-1],[7300,7780,1],[8190,7780,-1],[9000,9440,1],[11300,11770,1]];
 for(const [lowX,highX,axis]of pairs){
  const low=l.staticSolids.find(d=>d.kind==='platform'&&d.x===lowX),high=l.staticSolids.find(d=>d.kind==='platform'&&d.x===highX);
  assert.ok(low&&high);assert.ok(high.y+high.h>low.y+low.h+60);const p=new PlayerController();
  p.reset(axis>0?low.x+low.w-25:low.x+25,low.y+low.h);let landed=false;
  for(let n=0;n<180;n++){p.update(dt,{...idle,axis,jump:n===0,jumpHeld:n<80},l);if(p.grounded&&Math.abs(p.y-high.y-high.h)<.01&&p.x>high.x&&p.x<high.x+high.w){landed=true;break;}}
  assert.ok(landed,`${lowX} -> ${highX}`);assert.ok(p.jumpSerial===1);
 }
});

test('Down+Jump drops only the current deck and lands on the lower deck; holding it cannot repeat',()=>{
 for(const hz of [30,60,120]){
  const l=stacked(),p=new PlayerController();p.reset(400,350);
  for(let n=0;n<hz;n++)p.update(1/hz,{...idle,crouch:true,jump:true,jumpHeld:true},l);
  assert.equal(p.dropCount,1);assert.equal(p.jumpSerial,0);assert.equal(p.y,260);assert.ok(p.grounded);
  p.update(1/hz,idle,l);p.update(1/hz,{...idle,jump:true,crouch:true},l);
  for(let n=0;n<hz;n++)p.update(1/hz,idle,l);assert.equal(p.y,150);assert.equal(p.dropCount,2);
  p.update(1/hz,{...idle,jump:true,crouch:true,jumpHeld:true},l);assert.ok(p.vy>0,'solid ground stays jumpable');assert.equal(p.dropCount,2);
 }
});

test('keyboard and downward joystick use the same drop action, while a diagonal still jumps',()=>{
 for(const mode of ['keyboard','touch','diagonal']){
  const l=stacked(),p=new PlayerController(),i=new InputManager();p.reset(400,350);
  if(mode==='keyboard')i.press('s','crouch');else i.joystick.start(1,mode==='diagonal'?80:0,-80);
  i.press('space','jump');p.update(dt,{...i.consume()},l);
  assert.equal(p.dropCount,mode==='diagonal'?0:1);assert.equal(p.vy<0,mode!=='diagonal');
 }
});

test('drop respects solid ledges, landing surfaces and actor-local collision, and restart clears it',()=>{
 const l=stacked(),p=new PlayerController(),other=new PlayerController();p.reset(400,350);other.reset(400,350);
 p.update(dt,{...idle,crouch:true,jump:true},l);other.update(dt,idle,l);assert.equal(other.y,350);
 for(let n=0;n<120;n++)p.update(dt,idle,l);assert.equal(p.y,260);
 p.reset(400,350);p.update(dt,idle,l);assert.equal(p.dropCount,0);assert.equal(p.y,350);
 l.staticSolids.push({x:350,y:326,w:100,h:24,kind:'crate'});l.objects.revision++;l.refreshSolids();
 assert.equal(l.dropSurfaces(p).length,0);p.update(dt,{...idle,crouch:true,jump:true,jumpHeld:true},l);assert.ok(p.vy>0);
});

test('ordinary player bullets deal two to the final boss, one to the mini boss and soldier, without changing other projectile rules',()=>{
 const shoot=(target,kind='bullet',owner='player')=>{
  const shots=new ProjectileManager(new ParticlePool()),hp=target.health;
  shots.spawn({owner,kind,x:target.bounds.x-50,y:target.bounds.y+30,direction:1,speed:1000,damage:1,range:1000});
  shots.update(.1,owner==='enemy'?target:{alive:false,bounds:{x:0,y:0,w:1,h:1}},owner==='player'?[target]:[],[]);
  assert.equal(shots.hits,1);return hp-target.health;
 };
 const boss=new ColossusBoss({id:'b',kind:'colossus',x:1500,y:150,patrol:0});boss.active=true;
 const mini=new TankBoss({id:'m',kind:'guard',encounter:'mini',x:1500,y:150,patrol:0});mini.active=true;
 assert.equal(shoot(boss),2);assert.equal(shoot(mini),1);assert.equal(shoot(new EnemyController({id:'r',kind:'ranged',x:1500,y:150,patrol:0})),1);
 assert.equal(shoot(boss,'pellet'),1.5);assert.equal(shoot(boss,'bullet','enemy'),1);
 const hp=boss.health;boss.takeDamage(9,1,'explosion');assert.equal(hp-boss.health,9);assert.equal(C.weapons.rifle.damage,1);
});

test('mini encounter has a clear approach, later enemies cannot update, render or be hit before the kill, then spawn once',()=>{
 const s=new GameSession();s.reset();const mini=s.spawner.miniBoss,queued=s.spawner.pendingCount;
 assert.ok(queued>15);assert.ok(s.spawner.enemies.every(e=>e.spawn.x<6740||e.kind==='colossus'));
 assert.ok(!s.level.data.enemies.some(e=>!e.encounter&&e.x>=5100&&e.x<7000));
 s.update(dt,idle);assert.ok(!s.level.clearedZones.has('E'));assert.equal(s.spawner.pendingCount,queued);
 mini.active=true;mini.takeDamage(999,1,'explosion');s.update(dt,idle);
 assert.equal(s.spawner.pendingCount,0);assert.equal(s.spawner.enemies.length,s.level.data.enemies.length);
 const count=s.spawner.enemies.length;s.update(dt,idle);assert.equal(s.spawner.enemies.length,count);
 assert.equal(s.pickups.items.filter(p=>p.active&&p.sourceId==='after-tank').length,1);
 s.reset();assert.equal(s.spawner.pendingCount,queued);assert.ok(!s.pickups.recoveryIds.includes('after-tank'));
});

test('post-mini health pack is guaranteed at full health, heals two after damage, retries a full pool and persists unused',()=>{
 const s=new GameSession();s.reset();const b=s.spawner.miniBoss;b.active=true;b.takeDamage(999,1,'bullet');s.update(dt,idle);
 const pack=s.pickups.items.find(p=>p.active&&p.sourceId==='after-tank');assert.ok(pack);
 s.player.reset(pack.x,150);for(let n=0;n<150;n++)s.pickups.update(dt,s.player,s.weapon,s.level.solids);assert.ok(pack.active);
 s.player.health=3;s.pickups.update(dt,s.player,s.weapon,s.level.solids);assert.equal(s.player.health,5);assert.equal(pack.active,false);
 s.pickups.offerBossRecovery('after-tank',b.x,b.y);assert.ok(!s.pickups.items.some(p=>p.active&&p.sourceId==='after-tank'));
 const pool=new PickupSystem();for(let n=0;n<32;n++)pool.spawn(400,150,'ammo');pool.offerBossRecovery('reward',400,150);assert.equal(pool.recoveryIds.length,0);
 pool.items[0].active=false;pool.offerBossRecovery('reward',400,150);assert.deepEqual(pool.recoveryIds,['reward']);
});
