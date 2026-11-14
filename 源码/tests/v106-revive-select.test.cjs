const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{OceanSession}=load('ocean/OceanSession');
const {GameConfig:C}=load('core/GameConfig'),{overlaps}=load('core/Types');
const {landRevivePoint,waterRevivePoint,landAnchor}=load('core/Revival');
const {PersonalRecords}=load('social/PersonalRecords'),{emptyRecords,cloudValues,fromCloud}=load('social/RunRecords');
const {canEnterChapter}=load('social/ChapterAccess');
const idle={axis:0,jump:false,shoot:false};
function die(s){s.player.health=0;for(let i=0;i<240&&s.state!=='gameover';i++)s.update(1/120,idle);assert.equal(s.state,'gameover');}
function earn(s){assert.equal(s.revival.rewardVideo()(true),true);}
function prepare(s){for(let i=0;i<120;i++)s.update(1/120,{axis:1,shoot:true,jump:true,grenade:true});assert.equal(s.state,'playing');}

test('land revival preserves battle, inventory, consumed loot and run counters, clears queued damage',()=>{
 const s=new GameSession();s.reset();s.weapon.equip('rocket');s.weapon.ammo=3;s.player.grenades=1;
 s.spawner.enemies[0].health=0;const boss=s.spawner.guard;boss.health-=13;
 const object=s.level.objects.objects[0];object.health=0;
 s.pickups.recoveryIds; s.pickups.offerBossSupply('already-given',200,160,'rocket');
 s.grenades.thrown=4;s.weapon.shots=7;s.time=8;
 die(s);earn(s);const before={kills:s.spawner.kills,hp:boss.health,shots:s.weapon.shots,objects:s.level.objects.objects.length,time:s.time,ammo:s.weapon.ammo};
 s.explosions.schedule(s.player.x,s.player.y,100,5,'enemy');s.explosions.enqueue(s.player.x,s.player.y,100,5,'enemy');
 s.projectiles.items[0].active=true;s.grenades.items[0].active=true;
 assert.equal(s.revive(),true);assert.equal(s.revive(),false);assert.equal(s.state,'reviving');
 assert.equal(s.player.health,5);assert.equal(s.player.grenades,1);assert.equal(s.weapon.id,'rocket');assert.equal(s.weapon.ammo,before.ammo);
 assert.equal(s.spawner.kills,before.kills);assert.equal(boss.health,before.hp);assert.equal(object.health,0);assert.equal(s.level.objects.objects.length,before.objects);
 assert.equal(s.grenades.thrown,4);assert.equal(s.weapon.shots,before.shots);assert.equal(s.time,before.time);
 assert.ok(s.projectiles.items.every(p=>!p.active));assert.ok(s.grenades.items.every(p=>!p.active));
 let blasts=0;s.explosions.advance(1);s.explosions.flush(()=>blasts++);assert.equal(blasts,0);
 assert.equal(s.pickups.offerBossSupply('already-given',200,160,'rocket'),false);
});
test('one-second preparation freezes world/input; pause freezes preparation; protection starts on actual play',()=>{
 const s=new GameSession();s.reset();die(s);earn(s);assert.ok(s.revive());const x=s.player.x,time=s.time;
 s.update(.4,{axis:1,shoot:true,jump:true,grenade:true});assert.equal(s.player.x,x);assert.equal(s.time,time);assert.equal(s.player.invincible,3);
 s.pause();s.update(60,idle);assert.equal(s.revival.preparation,.6);s.resume();assert.equal(s.state,'reviving');
 s.update(.6,idle);assert.equal(s.state,'playing');assert.equal(s.player.invincible,3);
 assert.equal(s.player.takeDamage(2,1),false);s.update(1/120,idle);assert.ok(s.player.invincible<3);
});
test('land second death needs another video; restart resets the ten-video allowance without a free credit',()=>{
 const s=new GameSession();s.reset();die(s);earn(s);assert.ok(s.revive());prepare(s);die(s);
 assert.equal(s.revive(),false);assert.equal(s.revival.remaining,0);s.reset();assert.equal(s.revival.remaining,0);assert.ok(s.revival.canWatchVideo);
 assert.equal(s.revive(),false);s.state='complete';assert.equal(s.revive(),false);
});
test('land safety resolves a pit, avoids boss and barrel footprints, respects reached/retreat limits',()=>{
 const surfaces=[{x:0,y:0,w:200,h:60},{x:260,y:0,w:300,h:60}];
 const area={left:20,right:350,bottom:0,top:600};
 const avoid=[{x:260,y:60,w:90,h:120}];
 const p=landRevivePoint({x:230,y:-200},surfaces,avoid,area);
 assert.ok(p);assert.equal(p.y,60);assert.ok(p.x<=185);assert.ok(p.x>=20);
 assert.ok(!overlaps({x:p.x-15,y:p.y+.1,w:30,h:73.9},avoid[0]));
 assert.equal(landRevivePoint({x:230,y:-200},surfaces,avoid,{...area,left:201,right:259}),undefined);
});
test('land support anchors follow moving geometry, reject vanished supports and insufficient headroom',()=>{
 const support={x:100,y:100,w:120,h:20},area={left:0,right:300,bottom:0,top:600};
 const anchor=landAnchor({x:160,y:120},[support]);support.y=200;
 const p=landRevivePoint({x:160,y:120},[support],[],area,anchor);assert.equal(p.y,220);
 assert.equal(landRevivePoint({x:160,y:120},[],[],area,anchor),undefined);
 assert.equal(landRevivePoint({x:160,y:120},[support,{x:100,y:240,w:120,h:30}],[],{...area,top:300},anchor),undefined);
});
test('no legal revival point consumes no life and leaves dead body/world intact',()=>{
 const s=new GameSession();s.reset();die(s);earn(s);s.level.solids.length=0;
 const old={x:s.player.x,y:s.player.y,time:s.time};assert.equal(s.revive(),false);
 assert.equal(s.revival.remaining,1);assert.equal(s.state,'gameover');assert.equal(s.player.health,0);assert.ok(s.revival.error);
 assert.deepEqual({x:s.player.x,y:s.player.y,time:s.time},old);
});
test('both land bosses cancel pending salvos, contact charges and beams without restoring health',()=>{
 const s=new GameSession();s.reset();
 for(const boss of [s.spawner.miniBoss,s.spawner.guard]){
   boss.active=true;boss.health-=3;const hp=boss.health;
   boss.mode='aiming';boss.windup=1;boss.warningTime=1;boss.warningPoints.push({x:100,y:100});
   boss.secondShell=.1;boss.pendingShots=2;boss.shotDelay=.1;boss.ramTime=1;boss.chargeTime=1;
   if(boss.beam)boss.beam.time=2;
   boss.recoverAfterRevive();assert.equal(boss.health,hp);assert.equal(boss.mode,'recovering');assert.equal(boss.windup,0);assert.equal(boss.warningPoints.length,0);
   if(boss.beam){assert.equal(boss.beam.time,0);assert.equal(boss.pendingShots,0);}else assert.equal(boss.secondShell,0);
 }
});
test('water revival retains weapons/ammo, boss modules, kills and supplies, cancels active attack chains',()=>{
 const s=new OceanSession();s.finishEntry();s.weapon='torpedo';s.storedWeapon='sonar';s.ammo=3;s.player.grenades=1;
 s.kills=8;s.recoveryUsed.add('kelp-rest');s.crates[0].hp=0;s.boss.hp=120;s.boss.laserHp=0;
 die(s);earn(s);s.boss.mode='fire';s.boss.volleyRemaining=3;s.boss.beamActive=true;s.boss.ringRadius=200;
 s.blastQueue.push({x:s.player.x,y:s.player.y,r:100,damage:5,owner:'enemy'});
 s.mini.burstLeft=2;s.mini.dashDuration=1;s.mini.locked=true;
 assert.ok(s.revive());assert.equal(s.player.health,5);assert.equal(s.player.grenades,1);assert.equal(s.weapon,'torpedo');assert.equal(s.storedWeapon,'sonar');assert.equal(s.ammo,3);
 assert.equal(s.kills,8);assert.equal(s.crates[0].hp,0);assert.ok(s.recoveryUsed.has('kelp-rest'));
 assert.equal(s.boss.hp,120);assert.equal(s.boss.laserHp,0);assert.equal(s.boss.beamActive,false);assert.equal(s.boss.volleyRemaining,0);assert.equal(s.boss.ringRadius,0);
 assert.equal(s.blastQueue.length,0);assert.equal(s.mini.burstLeft,0);assert.equal(s.mini.dashDuration,0);assert.equal(s.mini.locked,false);
 prepare(s);assert.equal(s.player.invincible,3);die(s);assert.equal(s.revive(),false);
});
test('water search avoids full terrain and boss hulls, including narrow crevices',()=>{
 const rocks=[{x:50,y:70,w:200,h:250}],boss={x:250,y:200,w:100,h:150};
 const area={left:20,right:400,bottom:74,top:674};
 const p=waterRevivePoint({x:240,y:210},rocks,[boss],area);
 assert.ok(p);assert.ok(p.x<=400);assert.ok(p.y>=74);assert.ok(p.y+74<=674);
 for(const r of [...rocks,boss])assert.equal(overlaps({x:p.x-20,y:p.y,w:40,h:74},r),false);
 assert.equal(waterRevivePoint({x:100,y:200},[{x:0,y:0,w:1000,h:1000}],[],area),undefined);
});
test('water revival stays in the current zone behind reached progress and obeys retreat boundary',()=>{
 const s=new OceanSession();s.finishEntry();s.player.x=8100;s.player.y=430;s.furthestX=8140;s.retreatLimit=7500;
 die(s);earn(s);assert.ok(s.revive());assert.ok(s.player.x>=7520 && s.player.x<=8140);assert.ok(s.player.y>=74 && s.player.y<=600);
 for(const r of s.level.obstacles)assert.equal(overlaps({x:s.player.x-18,y:s.player.y+.1,w:36,h:73.9},r),false);
});
test('assisted clear preserves old PB, unlocks chapter two, resumes same clock and cannot submit a faster cloud record',()=>{
 let n=0;const saved=[];const old={...emptyRecords(),reached:1,cleared:1,times:{1:{ms:9000,run:'old',at:1}}};
 const p=new PersonalRecords({load:()=>old,save:r=>{saved.push(JSON.parse(JSON.stringify(r)));return true}},()=>n);
 p.begin(1,true);p.active(true);n=1000;p.active(false);p.markRevived();n=30000;p.active(true);n=31000;p.win();p.win();
 assert.equal(p.result.ms,2000);assert.equal(p.result.valid,false);assert.equal(p.result.best,false);assert.equal(p.result.reason,'revived');
 assert.equal(p.records.times[1].ms,9000);assert.equal(fromCloud(cloudValues(p.records)).times[1].ms,9000);assert.ok(canEnterChapter(p.records,2));
 p.begin(2,true);assert.equal(p.assisted,false);p.active(true);n+=2000;p.win();assert.equal(p.result.valid,true);assert.equal(p.records.times[2].ms,2000);assert.equal(p.records.cleared,2);
});
test('first assisted clear unlocks without manufacturing a time; preview revival never unlocks anything',()=>{
 for(const eligible of [true,false]){
 let n=0;const p=new PersonalRecords({load:emptyRecords,save:()=>true},()=>n);
 p.begin(1,eligible);p.active(true);n=1000;p.markRevived();p.win();assert.equal(p.records.cleared,eligible?1:0);assert.equal(p.records.times[1],undefined);
 assert.equal(canEnterChapter(p.records,2),eligible);
 }
});
test('chapter access depends only on earned clears and never opens chapter three or malformed values',()=>{
 for(const cleared of [0,1,2]){
 const r={cleared,reached:2,challenge:{chapter:2}};assert.equal(canEnterChapter(r,1),true);assert.equal(canEnterChapter(r,2),cleared>=1);
 for(const c of [0,3,-1,NaN,1.5,'2'])assert.equal(canEnterChapter(r,c),false);
 }
});
