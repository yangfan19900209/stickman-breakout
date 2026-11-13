const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {LevelController}=load('level/LevelController'),{PlayerController}=load('player/PlayerController');
const {EnemyController}=load('enemy/EnemyController'),{ProjectileManager}=load('combat/ProjectileManager');
const {ParticlePool}=load('combat/ParticlePool'),{GameConfig:C}=load('core/GameConfig');
// Fixed scaffolds share the open-underpass contract; this fixture isolates cover spacing.
const {AbandonedBase}=load('level/LevelData');
function openUnderpass(){
 const data=structuredClone(AbandonedBase);
 for(const p of data.solids)p.supported=false;
 const bags=data.objects.find(o=>o.id==='sandbags-B');bags.x=3520;
 return data;
}


test('open underpass fixture has standing headroom at the raised exit and room before the sandbags',()=>{
 const l=new LevelController(openUnderpass()),deck=l.staticSolids.find(s=>s.kind==='platform'&&s.x===3300);
 const bags=l.objects.objects.find(o=>o.id==='sandbags-B');assert.ok(deck&&bags);
 const exit=deck.x+deck.w;
 assert.ok(deck.y-l.groundY(exit+C.player.halfWidth)>=C.player.height+12,'standing actor and helmet retain headroom');
 assert.ok(bags.x-exit>=C.player.halfWidth*2+16,'need a full actor width between deck and sandbags');
});

test('ranged soldier treats a solid sandbag as blocked sight and approaches rather than shooting uselessly through it',()=>{
 // The sandbag's real image/collider is wide and low. A tall blocking stack
 // needs the matching width instead of inventing an invisible 70-unit top.
 const l=new LevelController(openUnderpass());l.objects.reset([{id:'cover',kind:'sandbag',x:3450,y:150,w:152,h:70}]);
 l.staticSolids.splice(0,l.staticSolids.length,{x:0,y:0,w:8200,h:150,kind:'ground'});l.refreshSolids();
 const p=new PlayerController();p.reset(3650,150);
 const e=new EnemyController({id:'probe',kind:'ranged',x:3370,y:150,patrol:35});
 e.update(1/120,p,l,new ProjectileManager(new ParticlePool()));
 assert.equal(e.state,'Chase');assert.ok(e.vx>0);assert.equal(e.weapon.shots,0);
});

test('mobile soldiers leave the open underpass fixture and can climb or shoot over its low cover',()=>{
 for(const kind of ['ranged','melee','shield']){
  const l=new LevelController(openUnderpass()),p=new PlayerController();p.reset(3740,l.groundY(3740));
  const e=new EnemyController({id:'probe',kind,x:3380,y:l.groundY(3380),patrol:35});
  const q=new ProjectileManager(new ParticlePool());let escaped=false,climbed=false,hit=false;
  const bags=l.objects.objects.find(o=>o.id==='sandbags-B');
  for(let i=0;i<1800;i++){
   e.update(1/120,p,l,q);
   q.update(1/120,p,[],l.solids,undefined,l.objects.objects);
   l.refreshSolids();
   escaped ||= e.x>3460+e.halfWidth;
   climbed ||= e.x>=bags.bounds.x-e.halfWidth && e.y>=bags.bounds.y+bags.bounds.h;
   hit ||= p.health<5;
   if(escaped&&(climbed||hit))break;
  }
  assert.ok(escaped,`${kind} trapped at ${e.x},${e.y}`);
  assert.ok(climbed||hit,`${kind} has neither a crossing nor a usable firing lane at ${e.x},${e.y}`);
 }
});

test('standing player can traverse the open underpass fixture in both directions without crossing its solid ceiling',()=>{
 for(const direction of [-1,1]){
  const l=new LevelController(openUnderpass());
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
  const s=new GameSession(openUnderpass());s.reset();const boss=s.spawner.guard;
  const e=new EnemyController({id:'probe',kind:'ranged',x:3380,y:150,patrol:35});s.spawner.enemies=[e,boss];
  const x=side==='right'?3740:3250;s.player.reset(x,s.level.groundY(x));s.player.facing=side==='right'?-1:1;
  for(let i=0;i<1200&&e.alive&&s.player.alive;i++)s.update(1/120,{axis:0,jump:false,shoot:true});
  assert.equal(e.alive,false,side);assert.ok(s.player.health>0);assert.ok(s.projectiles.hits>0);
 }
});
