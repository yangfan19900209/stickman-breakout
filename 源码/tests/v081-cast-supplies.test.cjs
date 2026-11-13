const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {AbandonedBase}=load('level/LevelData'),{LevelController}=load('level/LevelController');
const {comicEquipment}=load('render/ComicEquipment'),{comicPose}=load('render/ComicPose');
const {UnifiedActorFrames,UnifiedActorBarrels:barrels}=load('render/UnifiedActorFrames');
const {FeedbackFrames}=load('render/FeedbackFrames'),frames={...UnifiedActorFrames,...FeedbackFrames};
const {directScale}=load('render/DirectPose'),{bridgeRig}=load('render/BridgePresentation');
const {objectPresentation,objectSolid}=load('render/ObjectPresentation');
const base={animation:'Idle',animationTime:.12,deadTime:.2,recoil:0,vx:0,stride:.4};
test('both boss approaches are the only rocket sources and normal routes contain no shotgun or rocket refills',()=>{
 const drops=AbandonedBase.objects.filter(o=>o.drop==='rocket');assert.equal(drops.length,2);
 assert.deepEqual(drops.map(o=>o.id),['rocket-before-tank','rocket-before-colossus']);
 for(const [i,kind]of ['guard','colossus'].entries()){const boss=AbandonedBase.enemies.find(e=>e.kind===kind);assert.ok(drops[i].x<boss.x&&boss.x-drops[i].x<1300);assert.equal(drops[i].y,150);assert.equal(drops[i].dropChance,1);}
 assert.ok(drops[0].x+drops[0].w+120<AbandonedBase.enemies.find(e=>e.kind==='guard').x-740,'tank supply must be reachable before its activation radius');
 assert.ok(AbandonedBase.objects.every(o=>o.drop!=='shotgun'&&o.drop!=='ammo'));
 const {GameSession}=load('core/GameSession'),s=new GameSession();s.reset();s.spawner.miniBoss.active=true;s.spawner.miniBoss.takeDamage(999,1,'explosion');assert.equal(s.spawner.miniBoss.health,0);s.update(1/120,{axis:0,shoot:false,jump:false});assert.equal(s.pickups.items.filter(p=>p.active&&p.kind==='rocket').length,0);
 const {PlaytestBrain}=require('../scripts/playtest-brain.cjs'),route=new GameSession(),brain=new PlaytestBrain({healthThreshold:4});route.reset();let input;
 for(let tick=0;tick<120*60&&route.state==='playing'&&route.weapon.id!=='rocket';tick++){
  if(tick%4===0)input=brain.next(route.snapshot());route.update(1/120,{...input,jump:tick%4===0&&input.jump,grenade:tick%4===0&&input.grenade});
 }
 assert.equal(route.weapon.id,'rocket');assert.equal(route.spawner.miniBoss.active,false);assert.equal(route.spawner.miniBoss.health,route.spawner.miniBoss.maxHealth);
});
test('all active land soldier actions resolve to the same unified cast atlas including throw, hurt and victory',()=>{
 const states=[{}, {animation:'Run',vx:280}, {animation:'Jump'}, {animation:'Fall'}, {crouched:true}, {crouched:true,vx:115}, {animation:'Hit',hitTime:.1}, {animation:'Dead'}, {throwTime:.1}, {meleeTime:.1,meleeStage:2,meleeProgress:.5}, {aimPitch:Math.PI/2},{aimPitch:Math.PI/4}];
 for(const weaponId of ['rifle','rocket','knife'])for(const s of states){const v=comicEquipment({...base,weaponId,...s});assert.ok(frames[v.body],JSON.stringify({weaponId,s,v}));assert.equal(v.weapon,null);assert.equal(v.grip,null);}
 for(const kind of ['ranged','melee','shield','turret'])for(const s of [{},{animation:'Run',vx:60},{recoil:1.5,action:'swing',windup:.1},{animation:'Hit'},{animation:'Dead'}])assert.ok(frames[comicPose({...base,kind,...s})],kind);
 for(let i=0;i<4;i++)assert.ok(frames['celebrate.'+i]);
});
test('equipped stance changes share head scale, foot anchor and barrel axis without old-source fallback',()=>{
 for(const weaponId of ['rifle','rocket']){
  const stand=frames[comicPose({...base,weaponId})],standScale=weaponId==='rifle'?.64:.84;
  assert.ok(stand.sourceSize[1]*standScale>82&&stand.sourceSize[1]*standScale<88);
  for(const s of [{animation:'Run',vx:280},{animation:'Jump'},{animation:'Fall'},{aimPitch:Math.PI/2},{aimPitch:Math.PI/4}]){
   const id=comicPose({...base,weaponId,...s}),f=frames[id],scale=id.startsWith('direct.')?directScale(id):.64;
   assert.ok(f.anchor[1]*f.sourceSize[1]*scale<2);
   if(weaponId==='rocket'){
    const b=barrels[id];assert.ok(b);assert.ok(Math.abs(Math.atan2(b.y-b.backY,b.x-b.backX)-(s.aimPitch??0))<1e-8);
    for(const [x,y]of [[b.x,b.y],[b.backX,b.backY]]){assert.ok(x>=-f.anchor[0]*f.sourceSize[0]*scale&&x<=(1-f.anchor[0])*f.sourceSize[0]*scale);assert.ok(y>=0&&y<=f.sourceSize[1]*scale);}
   }
  }
 }
});
test('every stone and steel obstacle is readable chest height and uses its actual solid roof',()=>{
 const l=new LevelController();for(const o of l.objects.objects.filter(o=>o.kind==='concrete'||o.kind==='steel')){
  const v=objectPresentation(o),solid=objectSolid(o);assert.ok(v.width>=140&&v.height>=60,o.id);assert.equal(o.bounds.h,solid.height);assert.ok(o.bounds.h<v.height);assert.ok(o.bounds.h>=50);
  if(o.kind==='steel'){o.takeDamage(Math.ceil(o.maxHealth*.5),1,'bullet');assert.ok(o.alive);const hit=objectPresentation(o);assert.equal(hit.id,'cover.concrete');assert.equal(hit.height,v.height);assert.equal(hit.width,v.width);}
 }
});
test('every bridge rope joins its real bridle junction and pulley, releasing the complete deck',()=>{
 const l=new LevelController();for(const m of l.mechanisms.filter(m=>m.data.kind==='bridge')){
  const rig=bridgeRig(m.data),rope=l.objects.objects.find(o=>o.id===m.data.ropeId);assert.ok(rope);
  assert.equal(rope.x+rope.w/2,rig.cx);assert.equal(rope.y,rig.junctionY);assert.equal(rope.y+rope.h,rig.pulleyY);
  assert.ok(rig.junctionY>m.rect.y+m.rect.h+40);rope.takeDamage(999,1,'bullet');l.objects.flushHits();l.updateWorld(1/120,{x:0,y:150,halfWidth:13,height:74,vy:0},[]);
  assert.equal(m.released,true);
 }
});
