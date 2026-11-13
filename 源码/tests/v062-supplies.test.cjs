const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{GameConfig:C}=load('core/GameConfig');
const {AbandonedBase}=load('level/LevelData'),{surfaceY}=load('core/Types');
const {PickupSystem}=load('world/PickupSystem'),{PlayerController}=load('player/PlayerController');
const {WeaponSystem}=load('combat/WeaponSystem'),{pickupPresentation}=load('render/ObjectPresentation');
const dt=1/120,idle={axis:0,jump:false,shoot:false};
const floor={x:0,y:0,w:3000,h:150,kind:'ground'};
function fixture(kind='wood',facing=1,drop,wall=false) {
  const s=new GameSession({name:'supply regression',width:3000,spawn:{x:facing===1?100:250,y:150},exit:{x:2950,y:150},
    solids:[floor,...(wall?[{x:135,y:150,w:15,h:100,kind:'step'}]:[])],enemies:[{id:'final',kind:'colossus',x:2700,y:150,patrol:0,encounter:'final'}],
    objects:[{id:'crate',kind,x:170,y:150,w:55,h:50,...(drop?{drop,dropChance:1}:{})}],arena:{start:2400,end:3000}});
  s.reset();s.player.facing=facing;s.weapon.equip('rocket',6);return s;
}

test('health is limited to costly stretches and the two boss approaches, with no random crates or immediate tank heal',()=>{
  assert.equal(AbandonedBase.recoveryPoints.length,5);
  assert.equal(AbandonedBase.objects.filter(o=>o.drop==='health').length,0);
  const points=AbandonedBase.recoveryPoints,bosses=AbandonedBase.enemies.filter(e=>e.encounter);
  for(const boss of bosses) assert.ok(points.some(p=>p.purpose==='before-boss'&&p.x<boss.x&&boss.x-p.x<1400));
  assert.equal(points.filter(p=>p.purpose==='after-encounter').length,3);
  for(const p of points) assert.ok(AbandonedBase.solids.some(r=>(r.kind==='ground'||r.kind==='platform')&&p.x>=r.x&&p.x<=r.x+r.w&&Math.abs(surfaceY(r,p.x)-p.y)<.01));
  const s=new GameSession();s.reset();s.spawner.miniBoss.takeDamage(999,1,'bullet');s.update(dt,idle);
  assert.equal(s.pickups.items.filter(p=>p.active&&p.kind==='health').length,0);
});

test('recovery appears near a costly stretch only with two missing hearts, once per run',()=>{
  const points=[{id:'aid',x:500,y:150,purpose:'after-encounter'}],pool=new PickupSystem(),p=new PlayerController(),w=new WeaponSystem();
  p.reset(400,150);
  for(const hp of [5,4]){p.health=hp;pool.offerRecovery(points,p);assert.equal(pool.recoveryIds.length,0);}
  p.health=2;p.x=50;pool.offerRecovery(points,p);assert.equal(pool.recoveryIds.length,0);
  p.x=400;p.y=400;pool.offerRecovery(points,p);assert.equal(pool.recoveryIds.length,0);
  p.y=150;pool.offerRecovery(points,p);pool.offerRecovery(points,p);
  assert.deepEqual(pool.recoveryIds,['aid']);assert.equal(pool.items.filter(q=>q.active).length,1);
  p.x=500;pool.update(dt,p,w,[floor]);assert.equal(p.health,4);assert.equal(pool.collected,1);
  p.health=1;pool.offerRecovery(points,p);assert.equal(pool.items.filter(q=>q.active).length,0);
  pool.reset();pool.offerRecovery(points,p);assert.deepEqual(pool.recoveryIds,['aid']);
});

test('recovery does not pile up and a full pickup pool does not consume a recovery point',()=>{
  const pool=new PickupSystem(),p=new PlayerController(),points=[{id:'aid',x:500,y:150,purpose:'before-boss'}];
  p.reset(400,150);p.health=2;pool.spawn(550,160,'health');pool.offerRecovery(points,p);
  assert.equal(pool.recoveryIds.length,0);pool.reset();
  for(let i=0;i<32;i++)pool.spawn(900,160,'rocket');pool.offerRecovery(points,p);assert.equal(pool.recoveryIds.length,0);
  pool.items[0].active=false;pool.offerRecovery(points,p);assert.deepEqual(pool.recoveryIds,['aid']);
});

test('all four checkpoints integrate with the real session and never spawn health elsewhere',()=>{
  for(const point of AbandonedBase.recoveryPoints){
    const s=new GameSession();s.reset();s.player.health=3;s.player.x=point.x-150;s.player.y=point.y;
    s.update(dt,idle);assert.ok(s.snapshot().pickups.some(p=>p.sourceId===point.id&&p.kind==='health'));
  }
  const s=new GameSession();s.reset();s.player.health=1;for(let i=0;i<180;i++)s.update(dt,idle);
  assert.equal(s.pickups.recoveryIds.length,0);
});

test('a nearby crate is cut with the gun equipped, both directions, and holding never spends rockets',()=>{
  for(const facing of [1,-1])for(const kind of ['wood','steel']){
    const s=fixture(kind,facing),crate=s.level.objects.objects[0];
    for(let i=0;i<180;i++)s.update(dt,{...idle,shoot:true});
    assert.equal(crate.alive,false,kind+' '+facing);assert.ok(s.melee.hits>0);
    assert.equal(s.weapon.id,'rocket');assert.equal(s.weapon.ammo,6);assert.equal(s.weapon.shots,0);
    assert.ok(!s.level.solids.some(r=>r.entityId===crate.id));
    s.update(dt,idle);s.update(dt,{...idle,shoot:true});assert.equal(s.weapon.shots,1);assert.equal(s.weapon.ammo,5);
  }
});

test('crate protection survives its automatic weapon pickup and ends when the player moves away',()=>{
  const s=fixture('wood',1,'shotgun');
  for(let i=0;i<60;i++)s.update(dt,{...idle,shoot:true});
  s.player.x=175;s.update(dt,{...idle,shoot:true});assert.equal(s.weapon.id,'shotgun');
  for(let i=0;i<90;i++)s.update(dt,{...idle,shoot:true});
  assert.equal(s.weapon.shots,0);assert.equal(s.weapon.ammo,C.weapons.shotgun.ammo);
  s.player.x=240;s.update(dt,{...idle,shoot:true});assert.equal(s.weapon.shots,1);
});

test('contextual knife respects walls, distance, aim and dangerous barrels',()=>{
  for(const mode of ['wall','far','behind','up','barrel']){
    const s=fixture(mode==='barrel'?'barrel':'wood',1,undefined,mode==='wall');
    if(mode==='far')s.player.x=30;
    if(mode==='behind')s.player.facing=-1;
    s.update(dt,{...idle,shoot:true,...(mode==='up'?{aimY:1}:{})});
    assert.equal(s.melee.swings,0,mode);assert.equal(s.weapon.shots,1,mode);
  }
});

test('manual knife still opens crates and preserves the stowed rocket ammunition',()=>{
  const s=fixture();s.update(dt,{...idle,switchWeapon:true});
  for(let i=0;i<45;i++)s.update(dt,{...idle,shoot:true});
  assert.equal(s.level.objects.objects[0].alive,false);assert.equal(s.weapon.shots,0);
  s.update(dt,{...idle,switchWeapon:true});assert.equal(s.weapon.id,'rocket');assert.equal(s.weapon.ammo,6);
});

test('pickup silhouettes are enlarged without stretching their aspect ratios',()=>{
  const {ComicFrames}=load('render/ComicFrames');
  for(const kind of ['rifle','shotgun','rocket','knife','health','grenades']){
    const v=pickupPresentation(kind),size=ComicFrames[v.id].size;
    assert.ok(v.width>33);assert.ok(Math.abs(v.width/v.height-size[0]/size[1])<1e-8);
    if(['rifle','shotgun','rocket'].includes(kind))assert.ok(v.width>=70);
    else if(kind==='health'||kind==='grenades')assert.ok(v.height>=30);
  }
});
