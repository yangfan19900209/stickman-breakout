const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {LevelController}=load('level/LevelController'),{PlayerController}=load('player/PlayerController');
const {EnemyController}=load('enemy/EnemyController'),{ProjectileManager}=load('combat/ProjectileManager');
const {ParticlePool}=load('combat/ParticlePool'),{GameConfig:C}=load('core/GameConfig');

test('B-zone underpass has standing headroom at the raised exit and room before the sandbags',()=>{
 const l=new LevelController(),deck=l.staticSolids.find(s=>s.kind==='platform'&&s.x===3300);
 const bags=l.objects.objects.find(o=>o.id==='sandbags-B');assert.ok(deck&&bags);
 const exit=deck.x+deck.w;
 assert.ok(deck.y-l.groundY(exit+C.player.halfWidth)>=C.player.height+24,'raised lip must not wedge a standing actor into the deck');
 assert.ok(bags.x-exit>=C.player.halfWidth*2+16,'need a full actor width between deck and sandbags');
});

test('ranged soldier treats a solid sandbag as blocked sight and approaches rather than shooting uselessly through it',()=>{
 const l=new LevelController();l.objects.reset([{id:'cover',kind:'sandbag',x:3450,y:150,w:75,h:70}]);
 l.staticSolids.splice(0,l.staticSolids.length,{x:0,y:0,w:8200,h:150,kind:'ground'});l.refreshSolids();
 const p=new PlayerController();p.reset(3650,150);
 const e=new EnemyController({id:'probe',kind:'ranged',x:3370,y:150,patrol:35});
 e.update(1/120,p,l,new ProjectileManager(new ParticlePool()));
 assert.equal(e.state,'Chase');assert.ok(e.vx>0);assert.equal(e.weapon.shots,0);
});

test('mobile soldiers can leave the actual underpass and climb its cover toward a player on the right',()=>{
 for(const kind of ['ranged','melee','shield']){
  const l=new LevelController(),p=new PlayerController();p.reset(3670,l.groundY(3670));
  const e=new EnemyController({id:'probe',kind,x:3380,y:l.groundY(3380),patrol:35});
  const q=new ProjectileManager(new ParticlePool());let escaped=false,climbed=false;
  const bags=l.objects.objects.find(o=>o.id==='sandbags-B');
  for(let i=0;i<1800;i++){
   e.update(1/120,p,l,q);
   escaped ||= e.x>3460+e.halfWidth;
   climbed ||= e.x>=bags.x-e.halfWidth && e.y>=bags.y+bags.h;
   if(escaped&&climbed)break;
  }
  assert.ok(escaped,`${kind} trapped at ${e.x},${e.y}`);
  assert.ok(climbed,`${kind} cannot reach cover at ${e.x},${e.y}`);
 }
});

test('standing player can traverse the actual underpass in both directions without crossing its solid ceiling',()=>{
 for(const direction of [-1,1]){
  const l=new LevelController();
  // Keep the deck and raised ground. Cover is separately tested above; this
  // check isolates the standing entrance/exit corner that used to be too low.
  l.objects.reset([]);l.refreshSolids();
  const p=new PlayerController();p.reset(direction>0?3260:3510,l.groundY(direction>0?3260:3510));
  const deck=l.staticSolids.find(s=>s.kind==='platform'&&s.x===3300);
  for(let i=0;i<180;i++){
   p.update(1/120,{axis:direction,jump:false,shoot:false},l);
   if(p.x+p.halfWidth>deck.x&&p.x-p.halfWidth<deck.x+deck.w)
    assert.ok(p.y+p.height<=deck.y+.001,'player overlaps the solid deck');
  }
  assert.ok(direction>0?p.x>3510:p.x<3260);
 }
});

test('the real rifle can damage and kill a soldier below this deck from either side without bypassing cover collisions',()=>{
 const {GameSession}=load('core/GameSession');
 for(const side of ['left','right']){
  const s=new GameSession();s.reset();const boss=s.spawner.guard;
  const e=new EnemyController({id:'probe',kind:'ranged',x:3380,y:150,patrol:35});s.spawner.enemies=[e,boss];
  const x=side==='right'?3670:3250;s.player.reset(x,s.level.groundY(x));s.player.facing=side==='right'?-1:1;
  for(let i=0;i<1200&&e.alive&&s.player.alive;i++)s.update(1/120,{axis:0,jump:false,shoot:true});
  assert.equal(e.alive,false,side);assert.ok(s.player.health>0);assert.ok(s.projectiles.hits>0);
 }
});
