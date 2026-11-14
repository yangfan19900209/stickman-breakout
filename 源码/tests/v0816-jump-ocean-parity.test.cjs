const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {PlayerController}=load('player/PlayerController'),{LevelController}=load('level/LevelController');
const {ColossusBoss}=load('enemy/ColossusBoss'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:L}=load('ocean/OceanLevel');
const {oceanShotVisual}=load('ocean/OceanEnemyPose'),{oceanShotProfile,oceanBossTuning:B}=load('ocean/OceanCombatTuning');
const {GameConfig:C}=load('core/GameConfig'),{overlaps}=load('core/Types');
const dt=1/120,idle={axis:0,vertical:0,jump:false,jumpHeld:false,shoot:false};
function sea(){const s=new OceanSession();s.finishEntry();for(const e of s.enemies)e.hp=0;s.player.x=L.arena+60;s.player.y=350;s.camera.x=L.arena-450;s.camera.visibleWidth=1330;return s;}

test('one-tick first tap reaches full height at 30, 60 and 120 Hz; second jump keeps its release cut and cannot become a third',()=>{
 for(const hz of [30,60,120]){
  const peaks=[];
  for(const hold of [false,true]){
   const p=new PlayerController(),l=new LevelController();let peak=150;
   for(let n=0;n<hz;n++){p.update(1/hz,{...idle,jump:n===0,jumpHeld:hold},l);peak=Math.max(peak,p.y);}
   peaks.push(peak);assert.equal(p.jumpSerial,1);assert.equal(p.airJumpsRemaining,1);
  }
  assert.equal(peaks[0],peaks[1]);assert.ok(peaks[0]>266);
 }
 const p=new PlayerController(),l=new LevelController();p.update(dt,{...idle,jump:true},l);
 for(let n=0;n<20;n++)p.update(dt,idle,l);
 p.update(dt,{...idle,jump:true,jumpHeld:true},l);assert.equal(p.jumpCount,2);assert.equal(p.airJumpsRemaining,0);
 const vy=p.vy;p.update(dt,idle,l);assert.ok(Math.abs(p.vy-(vy*C.player.jumpCut-C.player.gravity*dt))<1e-9);
 p.update(dt,{...idle,jump:true,jumpHeld:true},l);assert.equal(p.jumpSerial,2);
});

test('shrunk land boss allows a high-deck tap plus the retained second jump to cross either way without contact damage',()=>{
 for(const direction of [-1,1]){
  const l=new LevelController();l.arenaVisited=true;l.objects.reset([]);l.refreshSolids();
  const high=l.staticSolids.find(s=>s.kind==='platform'&&s.x===13870);
  const p=new PlayerController(),q=new ProjectileManager(new ParticlePool());
  // Start at the opposite lip and use the available second jump to keep the
  // feet above the full hull until reaching the low route behind it.
  const bx=direction>0?high.x+high.w+100:high.x-100;
  const b=new ColossusBoss({id:'escape',kind:'colossus',x:bx,y:150,patrol:0});
  Object.assign(b,{active:true,introduced:true,introTime:0,mode:'recovering',attackCooldown:2,pursuitCheck:2});
  p.reset(direction>0?bx-135:bx+135,high.y+high.h);p.vx=direction*C.player.speed;
  let cleared=false,crossed=false;
  for(let n=0;n<160;n++){
   p.update(dt,{...idle,axis:direction,jump:n===0||n===44,jumpHeld:n>=44&&n<100},l);b.update(dt,p,l,q);
   if(Math.abs(p.x-b.x)<40){assert.ok(p.y>=b.bounds.y+b.bounds.h);cleared=true;}
   if((p.x-b.x)*direction>b.halfWidth+p.halfWidth){crossed=true;break;}
  }
  assert.ok(cleared&&crossed);assert.equal(p.health,5);assert.equal(b.height,C.colossus.height);
 }
});

test('ocean owners share complete ammunition geometry and pooling resets boss tiers',()=>{
 const s=sea();
 for(const kind of ['harpoon','sonar','torpedo']){
  const a=oceanShotVisual(kind,'player'),b=oceanShotVisual(kind,'enemy');
  assert.equal(a.id,b.id,'same ammunition must use the same actual artwork');
  for(const k of ['width','height','radius'])assert.equal(a[k],b[k]);
  for(const tier of ['standard','mini','boss']){
   const shot=s.spawnShot('enemy',kind,1000,350,100,0,1,3,tier),v=oceanShotVisual(kind,'enemy',tier);
   assert.equal(shot.r,v.radius);assert.equal(shot.tier,tier);
   assert.ok(v.width>=a.width&&v.height>=a.height);shot.active=false;
  }
  const shot=s.spawnShot('player',kind,1000,350,100,0,3,2);
  assert.equal(shot.tier,'standard');assert.equal(shot.r,oceanShotProfile(kind).radius);shot.active=false;
 }
});

test('submarine pursues a retreat, preserves HP and pause state, then locks its hull throughout warnings and fire',()=>{
 const s=sea();s.update(dt,idle);assert.ok(s.boss.active);s.damageBoss(7,s.boss.x,s.boss.y);const hp=s.boss.hp,start=s.boss.x;
 s.player.x=L.arena-470;s.player.y=180;
 let locked=0;
 for(let n=0;n<120*12;n++){
  const b=s.boss,before={x:b.x,y:b.y,mode:b.mode};s.update(dt,idle);
  if(['tell','fire'].includes(before.mode)){assert.equal(b.x,before.x);assert.equal(b.y,before.y);locked++;}
  assert.ok(b.active);assert.equal(b.hp,hp);
 }
 assert.ok(s.boss.x<start-500&&s.bossBounds().x<L.arena);assert.ok(locked>120&&s.boss.travel>500);
 s.pause();const frozen={...s.boss};s.update(1,{...idle,axis:1});assert.deepEqual(s.boss,frozen);s.resume();s.update(dt,idle);
 assert.ok(s.boss.active);s.reset();assert.equal(s.boss.active,false);assert.equal(s.boss.travel,0);assert.equal(s.retreatLimit,0);
});

test('submarine leaves swimmable upper and lower escape lanes at both corners',()=>{
 for(const side of [-1,1])for(const y of [74,600]){
  const s=sea(),b=s.boss;b.active=true;b.mode='rest';b.timer=100;
  b.x=side<0?L.arena-B.retreatApron+300+B.edgeClearance:L.width-300-B.edgeClearance;b.y=y<300?315:405;
  s.player.x=b.x+side*350;s.player.y=y;s.retreatLimit=L.arena-B.retreatApron;
  const start=s.player.x;
  for(let n=0;n<120*4;n++){s.movePlayer(dt,{...idle,axis:-side});s.moveBoss(dt);assert.ok(!overlaps(s.player.bounds,s.bossBounds()));}
  assert.ok((s.player.x-start)*-side>650);assert.equal(s.player.health,5);
 }
});

test('ocean retreat edge stops the camera before the swimmer and does not depend on facing',()=>{
 const s=sea();s.boss.active=true;s.boss.timer=100;s.player.y=74;s.player.x=L.arena+50;
 for(let n=0;n<700;n++){s.movePlayer(dt,{...idle,axis:-1});s.updateCamera(dt,600);}
 assert.equal(s.camera.x,s.retreatLimit);assert.ok(Math.abs(s.player.x-s.camera.x-18)<1e-8);
 const x=s.camera.x;s.player.facing*=-1;s.updateCamera(dt,600);assert.equal(s.camera.x,x);
 for(let n=0;n<30;n++)s.movePlayer(dt,{...idle,axis:1});assert.ok(s.player.x>s.retreatLimit+18);
});

test('harpoon and sonar deal two/three damage on submarine and mini boss',()=>{
 for(const kind of ['harpoon','sonar']){
  const s=sea();s.boss.active=true;
  const damage=kind==='harpoon'?2:3;
  s.spawnShot('player',kind,s.boss.x-325,s.boss.y,720,0,damage,2);s.updateShots(.1);
  assert.equal(s.boss.maxHp-s.boss.hp,damage);
 }
 const s=sea(),e=s.mini;e.hp=e.maxHp;e.active=true;
 s.spawnShot('player','harpoon',e.x-160,e.y+60,720,0,1,2);s.updateShots(.15);assert.equal(e.hp,e.maxHp-2);
});

test('mini submarine drops exactly one persistent two-heart recovery even if defeated at full health',()=>{
 const s=sea(),e=s.mini;e.hp=2;e.x=6000;e.y=300;s.player.x=e.x-140;s.player.y=300;
 s.damageEnemy(e,3);s.damageEnemy(e,3);
 let packs=s.drops.filter(d=>d.source===e.id+'-recovery');assert.equal(packs.length,1);
 s.updateSupplies(dt);assert.ok(packs[0].active);s.player.health=2;s.updateSupplies(dt);assert.equal(s.player.health,4);assert.equal(packs[0].active,false);
});
