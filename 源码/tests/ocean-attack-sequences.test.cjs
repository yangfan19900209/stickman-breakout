const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{StaticRectIndex}=load('core/StaticRectIndex');
const {enemyPattern}=load('ocean/OceanEnemyPatterns');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function sea(x=8000){const s=new OceanSession();s.finishEntry();s.player.x=x;s.player.y=300;
 s.camera.x=x-650;s.camera.visibleWidth=1400;s.crates=[];s.terrainIndex=new StaticRectIndex([]);
 for(const e of s.enemies)e.hp=0;return s;}

test('harpoon and sonar divers fire one shot per warning, change direction between rounds and leave longer rests',()=>{
 for(const role of ['harpoon','sonar'])for(const [x,waves] of [[1100,1],[3500,2],[8000,3]]){
  const s=sea(x),e=s.enemies.find(e=>e.kind==='diver');
  Object.assign(e,{x:x+350,homeX:x+350,y:300,homeY:300,hp:3,active:true,mode:'rest',timer:0,role});
  const fired=[],tells=[];let last=0,oldMode=e.mode,t=0;
  const spawn=s.spawnShot.bind(s);s.spawnShot=(...args)=>{const shot=spawn(...args);if(shot)fired.push({t,y:e.y,angle:Math.atan2(shot.vy,shot.vx),kind:shot.kind});return shot;};
  let restAt=0;
  for(let n=0;n<1800;n++){
   t+=dt;s.time=t;s.updateEnemy(e,dt);
   if(e.mode==='tell'&&oldMode!=='tell'){
    if(tells.length)assert.ok(t-restAt>=1.39,'each follow-up has at least 1.4 seconds of recovery');
    tells.push({t,duration:e.tellDuration});
   }
   if(e.mode==='rest'&&oldMode==='attack')restAt=t;
   last=e.attackCounts[role]??0;
   assert.equal(e.burstLeft,0,'ordinary attacks cannot queue an unannounced second shot');
   for(const p of s.projectiles)p.active=false;
   oldMode=e.mode;
   if(last===waves&&e.mode==='rest'&&e.volleysLeft===0)break;
  }
  assert.equal(fired.length,waves);assert.equal(tells.length,waves);
  for(let i=0;i<waves;i++){
   assert.equal(fired[i].kind,role);assert.ok(fired[i].t-tells[i].t>=tells[i].duration-.01,'each shot gives full warning');
  }
  if(waves>1){assert.ok(Math.abs(fired[0].y-fired[1].y)>25);assert.ok(Math.abs(fired[0].angle-fired[1].angle)>.07);}
  for(let i=1;i<waves;i++)assert.ok(fired[i].t-fired[i-1].t>=(role==='sonar'?2.86:2.71),'single shots separated by recovery and a new warning');
  assert.ok(e.timer>=1.99,'at least 2 seconds of recovery after the sequence');
 }
});

test('seabed cannon warns and fires only three mildly homing rockets in different directions',()=>{
 const s=sea(),e=s.enemies.find(e=>e.kind==='turret');
 Object.assign(e,{x:8350,homeX:8350,y:300,hp:3,active:true,mode:'rest',timer:0});
 for(let i=0;i<6;i++){e.serial=i;assert.equal(enemyPattern(e),'torpedo');}
 s.updateEnemy(e,dt);assert.equal(e.attack,'torpedo');assert.equal(e.tellDuration,1.05);
 for(let i=0;i<100;i++)s.updateEnemy(e,dt);
 assert.equal(s.projectiles.filter(p=>p.active).length,0);
 while(e.mode==='tell')s.updateEnemy(e,dt);
 const shots=s.projectiles.filter(p=>p.active);assert.equal(shots.length,3);
 assert.ok(shots.every(p=>p.kind==='torpedo'&&p.homing===.6));
 assert.equal(new Set(shots.map(p=>Math.atan2(p.vy,p.vx).toFixed(3))).size,3);
 const shot=shots[0],a=Math.atan2(shot.vy,shot.vx);s.player.y=540;s.updateShots(.1);
 const b=Math.atan2(shot.vy,shot.vx),turn=Math.atan2(Math.sin(b-a),Math.cos(b-a));
 assert.ok(Math.abs(turn)>.03&&Math.abs(turn)<=.060001);
 shot.age=1.3;const locked=Math.atan2(shot.vy,shot.vx);s.player.y=100;s.updateShots(.1);
 assert.equal(Math.atan2(shot.vy,shot.vx),locked,'steering ends, allowing a late dodge');
});

test('pausing freezes follow-up attacks; disengage, revival and restart clear them',()=>{
 const s=sea(),e=s.enemies.find(e=>e.kind==='diver');
 Object.assign(e,{x:8350,y:300,hp:3,mode:'rest',timer:.5,volleysLeft:2});
 s.pause();s.update(.3,idle);assert.equal(e.volleysLeft,2);assert.equal(e.timer,.5);s.resume();
 s.player.x=1000;s.updateEnemy(e,dt);assert.equal(e.volleysLeft,0);
 e.volleysLeft=2;s.player.health=0;s.state='gameover';s.revival.rewardVideo()(true);
 assert.equal(s.revive(),true);assert.equal(e.volleysLeft,0);
 e.volleysLeft=2;s.reset();assert.ok(s.enemies.every(e=>e.volleysLeft===0));
});

test('wide salvos still respect the ordinary live projectile budget',()=>{
 const s=sea(),e=s.enemies.find(e=>e.kind==='turret');
 Object.assign(e,{x:8350,y:300,hp:3,attack:'torpedo',angle:Math.PI,burstLeft:1});
 for(let i=0;i<13;i++)s.spawnShot('enemy','harpoon',8500,500,-100,0,1,4);
 s.fireEnemy(e);assert.equal(s.projectiles.filter(p=>p.active&&p.owner==='enemy').length,14);
});
