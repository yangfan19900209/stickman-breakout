const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{GameConfig:C}=load('core/GameConfig');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:O}=load('ocean/OceanLevel');
const {AbandonedBase:L}=load('level/LevelData'),{StaticRectIndex}=load('core/StaticRectIndex');
const {OceanWeaponDamage}=load('ocean/OceanCombatTuning');
const idle={axis:0,vertical:0,jump:false,shoot:false},dt=1/120;
function sea(){const s=new OceanSession();s.finishEntry();s.player.x=2800;s.player.y=300;
 s.terrainIndex=new StaticRectIndex([]);s.crates=[];for(const e of s.enemies)e.hp=0;return s;}
function landHit(s,e,kind){const r=e.bounds,c=C.weapons[kind==='rocket'?'rocket':'rifle'];
 s.projectiles.spawn({owner:'player',kind,x:r.x-80,y:r.y+r.h/2,direction:1,speed:c.speed,
 damage:c.damage,range:c.range,blastRadius:c.blastRadius});
 s.projectiles.update(.4,s.player,[e],[]);s.explosions.flush((...args)=>s.applyBlast(...args));}
function seaHit(s,e,kind){const r=s.enemyBounds(e);
 s.spawnShot('player',kind,r.x-80,r.y+r.h/2,720,0,OceanWeaponDamage[kind],2);
 s.updateShots(.2);s.flushBlasts();}

test('both chapters start and restart with mini bosses at 70 and final bosses at 120/140',()=>{
 const a=new GameSession(),b=new OceanSession();
 for(let n=0;n<2;n++){assert.equal(a.spawner.miniBoss.maxHealth,70);assert.equal(a.spawner.miniBoss.health,70);
  assert.equal(a.spawner.guard.health,120);assert.equal(b.mini.hp,70);assert.equal(b.mini.maxHp,70);
  assert.equal(b.boss.hp,140);assert.equal(b.boss.maxHp,140);a.reset();b.reset();}
});
test('land rifle deals 2 to each boss and 1 to every ordinary type through real projectile collisions',()=>{
 for(const type of ['mini','final','melee','ranged','shield','turret']){
  const s=new GameSession();s.reset();const e=type==='mini'?s.spawner.miniBoss:type==='final'?s.spawner.guard:s.spawner.enemies.find(e=>e.kind===type);
  e.active=true;const hp=e.health;landHit(s,e,'bullet');assert.equal(hp-e.health,['mini','final'].includes(type)?2:1,type);
 }
});
test('land rockets execute ordinary enemies and deal exactly 5 to either boss even at blast edge',()=>{
 for(const type of ['mini','final','shield','turret'])for(const edge of [false,true]){
  const s=new GameSession();s.reset();const e=type==='mini'?s.spawner.miniBoss:type==='final'?s.spawner.guard:s.spawner.enemies.find(e=>e.kind===type);
  e.active=true;const hp=e.health;
  if(edge){const r=e.bounds;s.explosions.enqueue(r.x-150,r.y+r.h/2,160,C.weapons.rocket.damage,'player','rocket');s.explosions.flush((...args)=>s.applyBlast(...args));}
  else landHit(s,e,'rocket');
  assert.equal(e.health,['mini','final'].includes(type)?hp-5:0,`${type}/${edge}`);
 }
});
test('water shots use 1/2/execute for ordinary enemies and 2/3/5 for the mini boss',()=>{
 for(const kind of ['harpoon','sonar','torpedo'])for(const type of ['diver','shield','fish','jellyfish','turret','captain']){
  const s=sea(),e=type==='shield'?s.enemies.find(e=>e.shielded):s.enemies.find(e=>e.kind===type&&!e.shielded);
  Object.assign(e,{x:3200,y:300,hp:type==='captain'?60:type==='shield'?5:3,active:true});const hp=e.hp;
  seaHit(s,e,kind);const damage=type==='captain'?{harpoon:2,sonar:3,torpedo:5}[kind]:{harpoon:1,sonar:2,torpedo:hp}[kind];
  assert.equal(e.hp,hp-damage,`${type}/${kind}`);
 }
});
test('submarine hull and a module each lose 2/3/5 per real hit without double-counting hull damage',()=>{
 for(const kind of ['harpoon','sonar','torpedo']){
  const s=sea();Object.assign(s.boss,{x:3300,y:350,active:true});
  const part=s.bossParts().find(p=>p.id==='torpedoHp'),hp=s.boss.hp,moduleHp=s.boss.torpedoHp;
  s.spawnShot('player',kind,part.x+part.w/2,part.y-60,0,720,OceanWeaponDamage[kind],2);
  s.updateShots(.2);s.flushBlasts();const damage={harpoon:2,sonar:3,torpedo:5}[kind];
  assert.equal(hp-s.boss.hp,damage,kind);assert.equal(moduleHp-s.boss.torpedoHp,damage,kind);
 }
});
test('knife executes shield and ordinary enemies in both chapters while boss melee stays nonlethal',()=>{
 const a=new GameSession();a.reset();a.weapon.equip('knife');const e=a.spawner.enemies.find(e=>e.kind==='shield');
 Object.assign(e,{x:a.player.x+55,y:a.player.y});
 for(let n=0;n<35;n++)a.melee.update(dt,a.player,[e],[],true,false,a.particles);
 assert.equal(e.health,0);assert.equal(e.shieldHealth,0);
 for(const type of ['shield','turret','captain']){
  const s=sea(),e=type==='shield'?s.enemies.find(e=>e.shielded):s.enemies.find(e=>e.kind===type);
  Object.assign(e,{x:s.player.x+60,y:s.player.y,hp:type==='captain'?60:5,active:true});s.slash();
  assert.equal(e.hp,type==='captain'?56:0,type);
 }
 const tank=a.spawner.miniBoss;tank.active=true;tank.takeDamage(C.melee.damage,1,'melee');assert.equal(tank.health,66);
});
test('enemy rockets/torpedoes cost 2 hearts and bullets/sonar cost 1 for ordinary, mini and final sources',()=>{
 for(const tier of ['standard','mini','boss'])for(const kind of ['harpoon','sonar','torpedo']){
  const s=sea(),p=s.player;s.spawnShot('enemy',kind,p.x-90,p.y+35,720,0,1,2,tier);
  s.updateShots(.2);s.flushBlasts();assert.equal(p.health,kind==='torpedo'?3:4,`${tier}/${kind}`);
 }
 for(const kind of ['bullet','rocket','cannon']){
  const s=new GameSession();s.reset();const p=s.player;
  s.projectiles.spawn({owner:'enemy',kind,x:p.x-90,y:p.y+35,direction:1,speed:720,damage:1,range:1000,blastRadius:kind==='bullet'?0:95});
  s.projectiles.update(.2,p,[],[]);s.explosions.flush((...args)=>s.applyBlast(...args));assert.equal(p.health,kind==='bullet'?4:3,kind);
 }
});
test('only the requested medical anchors disappear and both pre-boss land anchors remain',()=>{
 assert.deepEqual(L.recoveryPoints.map(p=>p.id),['after-industry','before-tank','after-freight','before-colossus']);
 assert.deepEqual(O.recovery.map(p=>p.id),['captain-prep','abyss-rest','defense-rest','sub-prep']);
 const a=new GameSession();a.reset();Object.assign(a.player,{x:10800,y:150,health:3});a.pickups.offerRecovery(L.recoveryPoints,a.player);
 assert.equal(a.pickups.items.filter(p=>p.active).length,0);
 for(const x of [4050,12720]){const s=new OceanSession();s.finishEntry();s.player.x=x;s.player.health=3;s.updateSupplies(dt);assert.equal(s.drops.filter(d=>d.kind==='medkit').length,0);}
});
test('sonar has exactly two acquisition sources and every torpedo pickup supplies eight rounds',()=>{
 const s=new OceanSession();s.finishEntry();for(const c of s.crates)s.damageCrate(c,3);
 for(const e of s.enemies)s.damageEnemy(e,999);
 const sonar=s.drops.filter(d=>d.kind==='sonar'),torpedoes=s.drops.filter(d=>d.kind==='torpedo');
 assert.deepEqual(sonar.map(d=>d.x),[1180,9100]);assert.equal(torpedoes.length,3);
 assert.equal(s.drops.filter(d=>d.source===s.mini.id).length,0,'captain no longer drops post-fight torpedoes');
 assert.equal(s.drops.filter(d=>d.source===s.mini.id+'-recovery').length,1);
 for(const d of torpedoes){s.drops=[d];s.weapon=s.storedWeapon='harpoon';s.ammo=0;s.player.x=d.x;s.player.y=d.y-30;s.updateSupplies(0);assert.equal(s.ammo,8,d.source);}
 const a=new GameSession();a.reset();a.pickups.spawn(a.player.x,a.player.y+25,'rocket');a.pickups.update(dt,a.player,a.weapon,a.level.solids);assert.equal(a.weapon.ammo,8);
 a.weapon.ammo=1;a.weapon.equip('knife');a.pickups.spawn(a.player.x,a.player.y+25,'rocket');a.pickups.update(dt,a.player,a.weapon,a.level.solids);assert.equal(a.weapon.ammo,8);
});
