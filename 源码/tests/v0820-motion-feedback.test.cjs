const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {InputManager}=load('core/InputManager'),{PlayerController}=load('player/PlayerController');
const {GameSession}=load('core/GameSession');
const dt=1/120,idle={axis:0,jump:false,shoot:false};
const floor={solids:[],movePlayer(p,t){p.x+=p.vx*t;p.y=150;p.grounded=true;p.vy=0;}};
function flat(enemies=[],objects=[]){const s=new GameSession({name:'movement regression',width:8000,spawn:{x:150,y:150},exit:{x:7900,y:150},objects,enemies:[...enemies,{id:'guard',kind:'colossus',x:7700,y:150}],solids:[{x:0,y:0,w:8000,h:150,kind:'ground'}]});s.reset();return s;}

test('down-diagonal thumb drift does not switch walking into crouch, with or without fire',()=>{
 for(const shoot of [false,true])for(const side of [-1,1]){
  const input=new InputManager(),p=new PlayerController();p.reset(0,150);input.joystick.start(1,0,0);
  if(shoot)input.press('finger:2','shoot');
  // V101 restores an accessible downward cone; ordinary diagonals still run.
  for(const angle of [-20,-35,-45,-52,-58,-45]){
   const a=angle*Math.PI/180,r=input.joystick.radius;input.joystick.move(1,side*r*Math.cos(a),r*Math.sin(a));
   for(let n=0;n<24;n++){const f=input.consume();assert.equal(f.crouch,false,angle);assert.equal(f.shoot,shoot);p.update(dt,f,floor);}
   assert.ok(Math.abs(p.vx)>230,`${angle}: ${p.vx}`);
  }
 }
});
test('deliberate down still crouches and drops through a deck, then lateral movement immediately releases crouch',()=>{
 const s=flat(),i=new InputManager();const deck={x:0,y:250,w:800,h:18,kind:'platform',oneWay:true};s.level.staticSolids.push(deck);s.level.objects.revision++;s.level.refreshSolids();s.player.reset(150,268);
 i.joystick.start(1,0,-i.joystick.radius);s.update(dt,i.consume());assert.ok(s.player.crouched);
 i.press('jump','jump');s.update(dt,i.consume());assert.equal(s.player.dropCount,1);assert.ok(s.player.y<268);
 i.release('jump');i.joystick.move(1,i.joystick.radius*.8,-i.joystick.radius*.6);
 for(let n=0;n<120;n++)s.update(dt,i.consume());assert.equal(s.player.crouched,false);assert.ok(s.player.vx>275);
 i.clear();assert.equal(i.consume().crouch,false);
});
test('ordinary ranged contacts keep world time and movement running while the target still recoils and takes damage',()=>{
 const s=flat([{id:'target',kind:'ranged',x:650,y:150,patrol:0}]);let hits=0,reacted=false;
 for(let n=0;n<240&&s.player.x<440;n++){
  const before=s.projectiles.hits;s.update(dt,{...idle,axis:1,shoot:true});
  if(s.projectiles.hits>before){hits++;assert.equal(s.hitStop,0);reacted ||= s.spawner.enemies[0].hitTime>0;assert.ok(s.player.vx>275);}
 }
 assert.ok(hits>=2);assert.ok(reacted);assert.ok(s.particles.peak>0);
});
test('distant chained barrel blasts do not pause a walking player who is not shooting',()=>{
 const s=flat([], [{id:'a',kind:'barrel',x:1200,y:150,w:38,h:58},{id:'b',kind:'barrel',x:1275,y:150,w:38,h:58}]);
 for(let n=0;n<30;n++)s.update(dt,{...idle,axis:1});
 s.level.objects.objects[0].takeDamage(99,1,'bullet');const start=s.player.x;
 for(let n=0;n<120;n++){s.update(dt,{...idle,axis:1});assert.equal(s.hitStop,0);}
 assert.equal(s.explosions.total,2);assert.ok(Math.abs(s.player.x-start-280)<1e-6);assert.equal(s.player.health,5);assert.ok(s.particles.peak>0);
});
test('a moving automatic knife cut stays fluid; planted knife and actual player damage retain brief reactions',()=>{
 for(const axis of [0,1]){
  const s=flat([{id:'near',kind:'melee',x:215,y:150,patrol:0}]);let hit=false;
  for(let n=0;n<70&&!hit;n++){const before=s.melee.hits;s.update(dt,{...idle,axis,shoot:true});if(s.melee.hits>before){hit=true;assert.equal(s.hitStop>0,axis===0);}}
  assert.ok(hit);
 }
 const s=flat();s.explosions.enqueue(s.player.x,s.player.y+35,60,1,'enemy');s.update(dt,idle);
 assert.equal(s.player.health,4);assert.ok(s.hitStop>0&&s.hitStop<.08);assert.ok(s.player.hitTime>0);
});
