const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {CameraFollow}=load('camera/CameraFollow'),{EnemyController}=load('enemy/EnemyController');
const {GameConfig:C}=load('core/GameConfig'),{GameSession}=load('core/GameSession');
const {ParticlePool}=load('combat/ParticlePool'),{comicPose}=load('render/ComicPose');
const {ShieldBreakFrames,ShieldBreakDuration,shieldBreakFrame}=load('render/ShieldBreakFrames');
const make=()=>new EnemyController({id:'shield-test',kind:'shield',x:500,y:150});
const idle={axis:0,jump:false,shoot:false};

test('camera trajectory is identical during rapid facing reversals at different frame rates and viewport widths',()=>{
 for(const width of [700,1250,1980])for(const hz of [30,60,120]){
  const a=new CameraFollow(),b=new CameraFollow();a.visibleWidth=b.visibleWidth=width;a.reset();b.reset();
  for(let n=0;n<hz*8;n++){
   const x=3000+Math.sin(n/hz)*180,y=150+Math.max(0,Math.sin(n/hz*2))*50;
   a.update(x,1/hz,9000,1,y,2100);b.update(x,1/hz,9000,n%2?1:-1,y,2100);
   assert.equal(a.x,b.x);assert.equal(a.y,b.y);
  }
 }
});

test('shield soldier has exactly two more HP, breaks on the third front hit, and dies on the fifth without extra armor HP',()=>{
 const e=make();assert.equal(e.health,C.enemies.ranged.health+2);
 for(let n=1;n<=5;n++){
  e.takeDamage(1,1,'bullet');assert.equal(e.health,5-n);assert.equal(e.alive,n<5);
  assert.equal(e.shieldHealth,Math.max(0,3-n));assert.equal(e.shieldBreakCount,n<3?0:1);
  if(n===3){assert.equal(e.health,2);assert.ok(e.shieldBreakEvent);assert.ok(comicPose(e).startsWith('rifle.'));}
 }
 const event=e.shieldBreakEvent;e.takeDamage(100,1,'explosion');assert.equal(e.shieldBreakCount,1);assert.equal(e.shieldBreakEvent,event);
});

test('rear hits and lethal explosives shatter a remaining shield once, while a knife executes the shield soldier',()=>{
 const rear=make();for(let n=0;n<4;n++)rear.takeDamage(1,-1,'bullet');assert.equal(rear.shieldHealth,3);
 rear.takeDamage(1,-1,'bullet');assert.equal(rear.shieldHealth,0);assert.equal(rear.shieldBreakCount,1);
 const rocket=make();rocket.takeDamage(C.weapons.rocket.damage,1,'explosion');assert.equal(rocket.alive,false);assert.equal(rocket.shieldBreakCount,1);
 const knife=make();knife.takeDamage(C.melee.damage,1,'melee');assert.equal(knife.health,0);
});

test('session emits one break animation after damage, freezes it in pause and clears it on restart',()=>{
 const s=new GameSession();s.reset();const e=s.spawner.enemies.find(e=>e.kind==='shield');
 e.takeDamage(3,1,'bullet');s.update(1/120,idle);
 const fx=s.particles.items.filter(p=>p.active&&p.kind==='shield');assert.equal(fx.length,1);assert.equal(e.shieldBreakEvent,undefined);
 s.update(1/120,idle);assert.equal(s.particles.items.filter(p=>p.active&&p.kind==='shield').length,1);
 const life=fx[0].life;s.pause();s.update(.3,idle);assert.equal(fx[0].life,life);s.resume();s.update(1/120,idle);assert.ok(fx[0].life<life);
 s.reset();assert.equal(s.particles.items.filter(p=>p.active&&p.kind==='shield').length,0);assert.equal(s.spawner.enemies.find(e=>e.kind==='shield').shieldBreakCount,0);
});

test('shield debris follows real support, falls when support disappears, finishes every frame and returns to the pool',()=>{
 const p=new ParticlePool(),ground={x:0,y:0,w:1000,h:150},deck={x:300,y:230,w:200,h:20};
 p.shieldBreak(400,250,-1);const fx=p.items.find(p=>p.active),seen=new Set();
 for(let n=0;n<30;n++){p.update(1/120,[ground,deck]);seen.add(shieldBreakFrame(fx.maxLife-fx.life));assert.equal(fx.y,deck.y+deck.h);}
 deck.y+=10;p.update(1/120,[ground,deck]);assert.equal(fx.y,260);
 for(let n=0;n<90;n++){p.update(1/120,[ground]);if(fx.active){seen.add(shieldBreakFrame(fx.maxLife-fx.life));assert.ok(fx.y>=150);}}
 assert.equal(fx.active,false);assert.equal(seen.size,5);assert.equal(fx.y,150);
});

test('generated shield animation has transparent padding, shared scale and anchor, and distinct painted frames',()=>{
 const p=PNG.sync.read(fs.readFileSync('assets/landart/shield-break.png')),sums=new Set();
 for(const f of Object.values(ShieldBreakFrames)){
  assert.deepEqual(f.anchor,[.5,.09]);assert.deepEqual(f.sourceSize,[106,106]);const [x,y,w,h]=f.atlas;let sum=0;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const a=p.data[((y+j)*p.width+x+i)*4+3];sum+=a;if(i===0||j===0||i===w-1||j===h-1)assert.ok(a<8);
  }sums.add(sum);assert.ok(sum>10000);
 }
 assert.equal(sums.size,6);assert.equal(ShieldBreakDuration,.9);
});
