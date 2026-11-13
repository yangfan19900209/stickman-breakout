const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {InputManager}=load('core/InputManager'),{GameConfig:C}=load('core/GameConfig');
const {GameSession}=load('core/GameSession'),{LevelController}=load('level/LevelController');
const {PlayerController}=load('player/PlayerController'),{CameraFollow}=load('camera/CameraFollow');
const {ColossusBoss}=load('enemy/ColossusBoss'),{comicPose}=load('render/ComicPose');
const {EnemyController}=load('enemy/EnemyController'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
const dt=1/120,idle={axis:0,jump:false,jumpHeld:false,shoot:false};
function flat(){return new LevelController({name:'edge',width:8000,spawn:{x:150,y:150},exit:{x:7900,y:150},objects:[],enemies:[],solids:[{x:0,y:0,w:8000,h:150,kind:'ground'}]});}

test('land diagonals preserve horizontal speed, crouch has a distinct sector, and swim retains a radial vector',()=>{
 for(const strength of [.65,1])for(const direction of [-1,1])for(const angle of [-50,-45,-30,0,30,45,50]){
  const i=new InputManager(),r=i.joystick.radius*strength,a=angle*Math.PI/180;
  i.joystick.start(1,direction*Math.cos(a)*r,Math.sin(a)*r);
  const f={...i.consume()},expected=(strength-C.input.deadZone)/(1-C.input.deadZone);
  assert.equal(f.axis,direction,angle);assert.equal(f.crouch,false,angle);
  const water=i.consume('swim');assert.ok(Math.abs(Math.hypot(water.axis,water.vertical)-expected)<1e-9);
 }
 const i=new InputManager(),r=i.joystick.radius;i.joystick.start(1,0,-r);assert.ok(i.consume().crouch);
 for(const ratio of [12,10,7]){i.joystick.move(1,r*.08,-r*.08*ratio);assert.ok(i.consume().crouch);}
 i.joystick.move(1,r,-r);assert.equal(i.consume().crouch,false);i.clear();assert.equal(i.consume().axis,0);
});

test('camera stops at the retreat edge before the player, including narrow, wide and boss zoom viewports',()=>{
 for(const width of [700,1250,1700]){
  const l=flat(),p=new PlayerController(),c=new CameraFollow();p.reset(150,150);c.visibleWidth=width;c.zoom=1.2;c.reset(150);
  const step=axis=>{p.update(dt,{...idle,axis},l);c.update(p.x,dt,l.data.width,p.facing,p.y,l.retreatLimit>0?l.retreatLimit:undefined);};
  for(let n=0;n<1500;n++)step(1);assert.ok(l.retreatLimit>1500);
  let stoppedBeforePlayer=false,edgeCamera;
  for(let n=0;n<900;n++){step(-1);if(Math.abs(c.x-l.retreatLimit)<.5&&p.x-c.x>80){stoppedBeforePlayer=true;edgeCamera=c.x;}}
  assert.ok(stoppedBeforePlayer,width);assert.ok(Math.abs(p.x-c.x-p.halfWidth)<1e-6);
  const end=c.x;for(let n=0;n<100;n++)step(-1);assert.equal(c.x,end);assert.ok(Math.abs(edgeCamera-end)<.5);
  for(let n=0;n<120;n++)step(1);assert.ok(p.x-c.x>100);
 }
});

test('final boss pursues across the entrance, stays vulnerable and resumes the same encounter after pause',()=>{
 const s=new GameSession();s.reset();const b=s.spawner.guard,entrance=s.level.data.arena.start;
 s.player.x=entrance+45;s.update(dt,idle);assert.ok(b.active);b.takeDamage(7,1);const hp=b.health;
 s.player.x=entrance-600;s.player.invincible=1000;const start=b.x;let crossed=false;
 for(let n=0;n<1800;n++){s.update(dt,idle);assert.ok(b.active);assert.equal(b.health,hp);crossed ||= b.x<entrance;}
 assert.ok(crossed&&b.x<start-500);assert.notEqual(b.mode,'dormant');assert.ok(s.bossFraming);
 s.pause();const x=b.x;s.update(1,idle);assert.equal(b.x,x);s.resume();s.update(dt,idle);
 assert.ok(b.takeDamage(1,1));assert.equal(b.health,hp-1);s.reset();assert.equal(s.spawner.guard.active,false);
});

test('boss navigation uses a warned physical jump over cover and onto a reachable platform',()=>{
 for(const oneWay of [false,true]){
  const l=flat();l.arenaVisited=true;l.staticSolids.push({x:2200,y:150,w:320,h:110,kind:'platform',oneWay});l.objects.revision++;l.refreshSolids();
  const b=new ColossusBoss({id:'test',kind:'colossus',x:2040,y:150,patrol:0}),p=new PlayerController();p.reset(2400,260);p.invincible=1000;
  const q=new ProjectileManager(new ParticlePool());let warned=false,air=false,landed=false,lastY=b.y;
  for(let n=0;n<1600;n++){b.update(dt,p,l,q);if(b.attack==='leap'&&b.windup>0)warned=true;
   if(!b.grounded){air=true;assert.ok(warned);assert.ok(Math.abs(b.y-lastY)<7);}
   if(b.grounded&&b.y===260){landed=true;break;}lastY=b.y;
  }
  assert.ok(warned&&air&&landed,oneWay?'platform':'cover');
 }
});

test('advancing the retreat edge never pushes a stationary boss or its locked muzzle forward',()=>{
 const l=flat();l.arenaVisited=true;const b=new ColossusBoss({id:'test',kind:'colossus',x:2000,y:150,patrol:0}),p=new PlayerController();p.reset(2500,150);
 const q=new ProjectileManager(new ParticlePool());b.active=true;b.introTime=0;b.introduced=true;b.mode='aiming';b.attack='laser';b.windup=.8;b.warningX=2500;
 const muzzle=b.muzzle;l.retreatLimit=2200;b.update(dt,p,l,q);assert.equal(b.x,2000);assert.deepEqual(b.muzzle,muzzle);assert.equal(b.warningX,2500);
});

test('wide boss can walk off an arena deck even when the ground combat apron intersects its lip',()=>{
 for(const edge of [13176,13183.75]){
 const l=new LevelController();l.arenaVisited=true;l.retreatLimit=edge;
 const b=new ColossusBoss({id:'test',kind:'colossus',x:13492,y:260,patrol:0}),p=new PlayerController();p.reset(13240,150);
 const q=new ProjectileManager(new ParticlePool());b.active=true;b.introduced=true;b.introTime=0;b.mode='recovering';b.attackCooldown=0;
 let descended=false,attack=false,minX=b.x,maxX=b.x;const start=b.x;
 for(let n=0;n<120*8;n++){b.update(dt,p,l,q);minX=Math.min(minX,b.x);maxX=Math.max(maxX,b.x);descended ||= b.grounded&&b.y===150;attack ||= descended&&b.windup>0;}
 const deck=l.staticSolids.find(s=>s.kind==='platform'&&s.x===13480);
 assert.ok(descended&&attack);assert.ok(maxX>=deck.x+deck.w+b.halfWidth);
 assert.ok(minX>=Math.min(start,edge+b.halfWidth+C.colossus.edgeClearance)-.01);
 assert.equal(p.health,C.player.maxHealth,'descending must preserve space at the retreat edge');
 assert.ok(b.active);assert.notEqual(b.mode,'dormant');
 }
});

test('arena decks provide three optional footholds with a reachable high link in both directions',()=>{
 const l=new LevelController();l.objects.reset([]);l.refreshSolids();
 const decks=l.staticSolids.filter(s=>s.kind==='platform'&&s.x>=l.data.arena.start);assert.equal(decks.length,3);
 for(const d of decks){assert.ok(d.oneWay);assert.ok(d.y-150>=86);}
 const high=decks[1];for(const direction of [-1,1]){
  const low=direction>0?decks[0]:decks[2],p=new PlayerController();
  p.reset(direction>0?low.x+low.w-25:low.x+25,low.y+low.h);
  let landed=false;for(let n=0;n<180;n++){
   p.update(dt,{...idle,axis:direction,jump:n===0,jumpHeld:n<70},l);
   if(p.grounded&&p.x>high.x&&p.x<high.x+high.w&&p.y===high.y+high.h){landed=true;break;}
  }assert.ok(landed,direction);
 }
});

test('moving launchers render multiple equipped gait frames and stop advancing at rest',()=>{
 const l=flat(),p=new PlayerController();p.reset(3000,150);
 const e=new EnemyController({id:'rocket',kind:'turret',x:2200,y:150,patrol:0}),q=new ProjectileManager(new ParticlePool()),frames=new Set();
 for(let n=0;n<500;n++){p.x=e.x+800;e.update(dt,p,l,q);if(e.grounded&&Math.abs(e.vx)>5)frames.add(comicPose(e));}
 assert.ok(frames.size>=4,[...frames].join(','));assert.ok([...frames].every(f=>f.startsWith('direct.rocket.stride.')));
 const resting={kind:'turret',animation:'Idle',vx:0,stride:e.stride,animationTime:0,recoil:0,deadTime:0};
 assert.ok(comicPose(resting).startsWith('rocket.idle.'));
});

test('crouch remains safe below a ceiling after slide removal',()=>{
 const l=flat();l.staticSolids.push({x:100,y:204,w:300,h:20,kind:'step'});l.objects.revision++;l.refreshSolids();
 const p=new PlayerController();p.reset(160,150);p.crouched=true;
 for(let n=0;n<90;n++){p.update(dt,{...idle,axis:1,jump:n===0,jumpHeld:true},l);assert.equal(p.y,150);assert.ok(p.crouched);}
 for(let n=0;n<240;n++)p.update(dt,{...idle,axis:1},l);assert.ok(p.x>440);assert.equal(p.crouched,false);assert.ok(p.vx<=C.player.speed);
});
