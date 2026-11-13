const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {LevelController}=load('level/LevelController'),{PlayerController}=load('player/PlayerController');
const {GameSession}=load('core/GameSession'),{ParticlePool,sandbagPieceSize}=load('combat/ParticlePool');
const {GameConfig}=load('core/GameConfig');
const {EnemyController}=load('enemy/EnemyController');
const dt=1/120,idle={axis:0,jump:false,shoot:false};
const liftFixture=require('./fixtures/lift-level.cjs');
test('both floating lifts admit a normal jump then carry and release their rider',()=>{
 for(const id of ['lift-C','lift-E']){
  const l=liftFixture(),m=l.mechanisms.find(m=>m.data.id===id),p=new PlayerController();
  l.objects.reset([]);l.refreshSolids();m.rect.y=m.data.minY;m.direction=1;p.reset(m.rect.x+45,150);
  let landed=false,rideTicks=0;
  for(let n=0;n<600;n++){
   l.updateWorld(dt,p,[]);p.update(dt,{...idle,jump:n===0,jumpHeld:n<46},l);
   if(p.grounded&&Math.abs(p.y-m.rect.y-m.rect.h)<.01){landed=true;rideTicks++;}
  }
  assert.ok(landed&&rideTicks>180,id+' failed boarding/carrying');
  for(let n=0;n<180;n++){l.updateWorld(dt,p,[]);p.update(dt,{...idle,axis:-1},l);}
  assert.ok(p.x<m.rect.x-50);assert.equal(p.y,150);
 }
});
test('transport lift keeps its full cycle with a shield-sized enemy below',()=>{
 const l=liftFixture(),m=l.mechanisms.find(m=>m.data.id==='lift-E'),p=new PlayerController();
 const e=new EnemyController({id:'underlift',kind:'shield',x:m.rect.x+m.rect.w/2,y:150});
 p.reset(m.rect.x-60,150);
 let low=false,high=false;
 for(let n=0;n<900;n++){l.updateWorld(dt,p,[e]);low||=m.rect.y===m.data.minY;high||=m.rect.y===m.data.maxY;assert.equal(e.y,150);}
 assert.ok(low&&high);
});
test('sandbag rupture removes the collider once and emits a bounded material-specific effect',()=>{
 const s=new GameSession(),o=s.level.objects.objects.find(o=>o.kind==='sandbag');
 o.takeDamage(999,1);s.level.objects.flushHits();s.level.refreshSolids();
 const pieces=s.particles.items.filter(p=>p.active&&p.kind==='sandbag');
 assert.equal(pieces.length,5);assert.equal(o.solid,false);assert.ok(!s.level.solids.includes(o.bounds));
 assert.ok(s.particles.items.some(p=>p.active&&p.kind==='sand'));
 assert.ok(s.particles.items.some(p=>p.active&&p.kind==='dust'));
 assert.ok(!s.particles.items.some(p=>p.active&&p.kind==='spark'));
 const active=s.particles.items.filter(p=>p.active).length;s.level.objects.flushHits();
 assert.equal(s.particles.items.filter(p=>p.active).length,active);assert.equal(s.level.objects.destroyed,1);
 assert.ok(active<=22);assert.equal(s.particles.dropped,0);
});
test('bag pieces separate, land, persist briefly and expire without a flattened duplicate',()=>{
 const pool=new ParticlePool(),floor={x:0,y:0,w:1200,h:150};
 pool.sandbags({x:400,y:150,w:150,h:66.875},1,true);
 const pieces=pool.items.filter(p=>p.kind==='sandbag'&&p.active),start=pieces.map(p=>({x:p.x,y:p.y}));
 for(let n=0;n<30;n++)pool.update(dt,[floor]);
 assert.ok(pieces.every((p,i)=>Math.abs(p.x-start[i].x)>2));assert.ok(pieces.some((p,i)=>p.y>start[i].y+10));
 for(let n=0;n<150;n++)pool.update(dt,[floor]);
 for(const p of pieces){assert.ok(p.active);assert.equal(p.vy,0);assert.equal(p.spin,0);assert.ok(Math.abs(p.y-sandbagPieceSize(p.fragment,p.size).height/2-150)<.01);}
 for(let n=0;n<240;n++)pool.update(dt,[floor]);
 assert.equal(pool.items.some(p=>p.active),false);assert.equal(pool.items.length,GameConfig.pools.particles);
});
test('settled bag pieces follow a moving support and fall if it disappears',()=>{
 const pool=new ParticlePool(),deck={x:0,y:270,w:1200,h:30},floor={x:0,y:0,w:1200,h:150};
 pool.sandbags({x:400,y:300,w:150,h:66.875},1,true);
 for(let n=0;n<180;n++)pool.update(dt,[deck,floor]);
 const p=pool.items.find(p=>p.active&&p.kind==='sandbag'),before=p.y;
 deck.y+=10;pool.update(dt,[deck,floor]);assert.ok(Math.abs(p.y-before-10)<.01);
 for(let n=0;n<100;n++)pool.update(dt,[floor]);assert.ok(p.y<before-80);
 pool.reset();pool.emit(10,10,'spark');assert.equal(pool.items[0].support,undefined);assert.equal(pool.items[0].fragment,undefined);
});
