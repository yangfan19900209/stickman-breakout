const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=n=>require(`../.test-build/assets/scripts/${n}.js`);
const {GameSession}=load('core/GameSession');
const {PlayerController}=load('player/PlayerController');
const {EnemyController}=load('enemy/EnemyController');
const {LevelController}=load('level/LevelController');
const {MeleeSystem}=load('combat/MeleeSystem');
const {ParticlePool}=load('combat/ParticlePool');
const {ProjectileManager}=load('combat/ProjectileManager');
const {GameConfig:C}=load('core/GameConfig');
const soldier=(x,kind='ranged',y=150)=>new EnemyController({id:'test',x,y,kind,patrol:40,health:20});
test('knife has a windup, hits once per swing, respects front reach and solid cover',()=>{
  const p=new PlayerController();p.reset(100,150);
  const m=new MeleeSystem(), fx=new ParticlePool(), front=soldier(165), rear=soldier(60), high=soldier(160,'ranged',270);
  m.update(1/120,p,[front,rear,high],[],true,false,fx);
  assert.equal(front.health,20);assert.equal(m.swings,1);
  for(let i=0;i<35;i++)m.update(1/120,p,[front,rear,high],[],false,false,fx);
  assert.equal(front.health,16);assert.equal(rear.health,20);assert.equal(high.health,20);assert.equal(m.hits,1);
  m.reset();const wall=[{x:130,y:150,w:12,h:90}];
  for(let i=0;i<36;i++)m.update(1/120,p,[front],wall,true,false,fx);
  assert.equal(m.swings,0);assert.equal(front.health,16);
  m.update(1/120,p,[front],wall,false,true,fx);
  for(let i=0;i<36;i++)m.update(1/120,p,[front],wall,false,false,fx);
  assert.equal(front.health,16);assert.equal(m.swings,1);
});
test('close ordinary fire switches to knife without spending ammo; pause and restart clear correctly',()=>{
  const s=new GameSession();s.reset();const e=s.spawner.enemies[0];e.x=170;e.y=150;e.health=3;
  s.update(1/120,{axis:0,jump:false,shoot:true});
  assert.equal(s.melee.swings,1);assert.equal(s.weapon.shots,0);
  const time=s.melee.time;s.pause();s.update(.2,{axis:0,jump:false,shoot:true});assert.equal(s.melee.time,time);
  s.resume();for(let i=0;i<20;i++)s.update(1/120,{axis:0,jump:false,shoot:false});
  assert.equal(e.alive,false);assert.equal(s.melee.hits,1);
  s.reset();assert.equal(s.melee.swings,0);assert.equal(s.player.meleeTime,0);
});
test('front knife respects shields and a rear knife bypasses the shield',()=>{
  const front=soldier(160,'shield'),rear=soldier(160,'shield');rear.facing=1;
  front.takeDamage(4,1,'melee');rear.takeDamage(4,1,'melee');
  assert.equal(front.shieldHealth,4);assert.ok(front.health>rear.health);assert.equal(rear.shieldHealth,8);
});
test('tracking rocket turns at a bounded rate and actually hits an elevated enemy',()=>{
  const q=new ProjectileManager(new ParticlePool()),p=new PlayerController(),target=soldier(380,'ranged',235);
  let explosions=0;q.onExplosion=()=>explosions++;
  q.spawn({owner:'player',x:100,y:194,direction:1,speed:460,damage:9,range:1150,kind:'rocket',blastRadius:160,homing:true});
  const shot=q.items[0];let previous=0,locked=false;
  for(let i=0;i<200&&shot.active;i++){
    q.update(1/120,p,[target],[]);const angle=Math.atan2(shot.vy,shot.vx);
    assert.ok(Math.abs(angle-previous)<=C.homing.turnRate/120+1e-6);previous=angle;locked ||= !!shot.target;
  }
  assert.ok(locked);assert.equal(explosions,1);assert.ok(shot.x>330);assert.ok(shot.y>235);
});
test('tracking rejects targets behind walls or behind the shot and pool reuse removes the lock',()=>{
  const q=new ProjectileManager(new ParticlePool()),p=new PlayerController();
  q.spawn({owner:'player',x:100,y:194,direction:1,speed:460,damage:9,range:1150,kind:'rocket',homing:true});
  const shot=q.items[0];q.update(.09,p,[soldier(20),soldier(380)], [{x:220,y:150,w:20,h:200}]);
  assert.equal(shot.target,undefined);assert.equal(shot.vy,0);
  q.update(.02,p,[soldier(380)],[]);assert.ok(shot.target);
  shot.target.health=0;q.update(.02,p,[],[]);assert.equal(shot.target,undefined);
  shot.active=false;q.spawn({owner:'enemy',x:100,y:194,direction:-1,speed:430,damage:1,range:1000});
  assert.equal(shot.homing,false);assert.equal(shot.target,undefined);assert.equal(shot.age,0);
});
test('ground is rectangular with shallow transitions and sufficient headroom under platforms',()=>{
  const l=new LevelController(), spans=l.staticSolids.filter(s=>s.kind==='ground');
  for(let i=0;i<spans.length;i++){
    const s=spans[i];assert.equal(s.slope.left,s.slope.right);assert.ok(s.w>=70);
    if(i)assert.ok(Math.abs(s.slope.left-spans[i-1].slope.left)<=48);
    for(const platform of l.staticSolids.filter(p=>p.kind==='platform'))
      if(s.x<platform.x+platform.w&&s.x+s.w>platform.x)assert.ok(platform.y-s.slope.left>=C.player.height,`headroom at ${platform.x}`);
  }
});
test('mobile infantry hop when walking into a blocking ledge; fixed rocket soldiers do not slide from hits',()=>{
  for(const kind of ['melee','ranged','shield']){
    const l=new LevelController();l.objects.reset([]);l.staticSolids.splice(0,l.staticSolids.length,
      {x:0,y:0,w:8200,h:150,kind:'ground'}, {x:150,y:150,w:60,h:88,kind:'step'});l.refreshSolids();
    const p=new PlayerController();p.reset(430,150);const e=soldier(130,kind);let hopped=false;
    for(let i=0;i<360;i++){e.update(1/120,p,l,new ProjectileManager(new ParticlePool()));hopped ||= e.vy>300;}
    assert.ok(hopped,kind);assert.ok(e.x>145||e.y>155,`${kind} stuck at ${e.x},${e.y}`);
  }
  const turret=soldier(300,'turret');turret.takeDamage(1,1);assert.equal(turret.vx,0);
});

test('airborne actors cannot enter a raised terrace through its vertical side',()=>{
  for(const direction of [1,-1]) {
    const l=new LevelController();l.objects.reset([]);
    l.staticSolids.splice(0,l.staticSolids.length,
      {x:0,y:-240,w:100,h:358,kind:'ground',slope:{left:118,right:118}},
      {x:100,y:-240,w:100,h:390,kind:'ground',slope:{left:150,right:150}},
      {x:200,y:-240,w:100,h:358,kind:'ground',slope:{left:118,right:118}});l.refreshSolids();
    const p=new PlayerController();p.reset(direction>0?94:206,130);p.grounded=false;p.vy=-30;p.vx=direction*280;
    for(let i=0;i<60;i++) {p.vy-=1200/120;l.move(p,1/120);}
    assert.equal(p.y,118);assert.ok(p.grounded);
    assert.ok(direction>0?p.x<100:p.x>200);
  }
});
