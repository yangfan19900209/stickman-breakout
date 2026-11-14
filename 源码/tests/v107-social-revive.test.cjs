const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {Revival}=load('core/Revival'),{GameSession}=load('core/GameSession'),{OceanSession}=load('ocean/OceanSession');
const {PersonalRecords}=load('social/PersonalRecords'),{emptyRecords}=load('social/RunRecords');
const idle={axis:0,shoot:false,jump:false};
function die(s){s.player.health=0;for(let i=0;i<240&&s.state!=='gameover';i++)s.update(1/120,idle);assert.equal(s.state,'gameover');}

test('each chapter attempt allows ten separate completed videos, never ten upfront or a free revival',()=>{
 for(const s of [new GameSession(),new OceanSession()]){
  s.reset();s.finishEntry?.();assert.equal(s.revival.remaining,0);
  for(let i=0;i<10;i++){
   die(s);assert.equal(s.revive(),false);assert.ok(s.revival.canWatchVideo);
   const award=s.revival.rewardVideo();assert.equal(award(true),true);assert.equal(award(true),false);
   assert.equal(s.revival.remaining,1);assert.equal(s.revival.videos,i+1);assert.equal(s.revival.canWatchVideo,false);
   const kills=s.snapshot().kills;assert.ok(s.revive());assert.equal(s.revival.remaining,0);
   assert.equal(s.player.health,5);assert.equal(s.snapshot().kills,kills);assert.equal(award(true),false);s.update(1,idle);
  }
  die(s);assert.equal(s.revival.used,10);assert.equal(s.revival.canWatchVideo,false);
  assert.equal(s.revival.rewardVideo()(true),false);assert.equal(s.revive(),false);
  s.reset();assert.equal(s.revival.remaining,0);assert.equal(s.revival.videos,0);assert.equal(s.revival.used,0);assert.ok(s.revival.canWatchVideo);
 }
});
test('incomplete/unknown outcomes give nothing and cannot later turn into a reward on the same callback',()=>{
 for(const result of [false,undefined,null,'true',1]){
  const r=new Revival(),grant=r.rewardVideo();assert.equal(grant(result),false);assert.equal(grant(true),false);
  assert.equal(r.videos,0);assert.equal(r.remaining,0);assert.ok(r.canWatchVideo);
  assert.ok(r.rewardVideo()(true));assert.equal(r.remaining,1);
 }
});
test('credits cannot stack or leak across consumed lives and restarted attempts',()=>{
 const r=new Revival(),a=r.rewardVideo(),b=r.rewardVideo();
 assert.ok(a(true));assert.equal(b(true),false);assert.equal(r.videos,1);assert.equal(r.remaining,1);
 const full=r.rewardVideo();r.begin();assert.equal(full(true),false);assert.equal(a(true),false);
 const stale=r.rewardVideo();r.reset();assert.equal(stale(true),false);assert.equal(r.remaining,0);
 r.begin();assert.equal(r.used,0);assert.ok(r.rewardVideo()(true));r.begin();assert.equal(r.used,1);
});
test('an earned video credit survives a missing safe revive position and does not allow another video',()=>{
 const s=new GameSession();s.reset();die(s);assert.ok(s.revival.rewardVideo()(true));
 s.level.solids.length=0;const x=s.player.x;assert.equal(s.revive(),false);
 assert.equal(s.revival.remaining,1);assert.equal(s.revival.used,0);assert.equal(s.revival.videos,1);
 assert.equal(s.revival.canWatchVideo,false);assert.equal(s.player.x,x);assert.equal(s.player.health,0);
});
test('video-assisted clears preserve progress but exclude fastest times; a fresh chapter restores timing eligibility',()=>{
 let now=0;const p=new PersonalRecords({load:emptyRecords,save:()=>true},()=>now);p.begin(1,true);p.active(true);now=1000;
 for(let i=0;i<5;i++){p.active(false);p.markRevived();now+=10000;p.active(true);now+=1000;}
 p.win();assert.equal(p.result.reason,'revived');assert.equal(p.result.ms,6000);assert.equal(p.records.cleared,1);assert.equal(p.records.times[1],undefined);
 p.begin(2,true);p.active(true);now+=2000;p.win();assert.equal(p.result.valid,true);assert.equal(p.records.times[2].ms,2000);
});
