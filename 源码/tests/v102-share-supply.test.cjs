const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {ShareBridge}=load('platform/ShareBridge');
const {GameSession}=load('core/GameSession');
const {GameConfig:C}=load('core/GameConfig');
const dt=1/120,idle={axis:0,jump:false,jumpHeld:false,shoot:false};
function host(enabled=true){
 const calls={menus:[],cards:[],toasts:[],off:[],opens:0};let listener;
 const api={showShareMenu:o=>calls.menus.push(o),onShareAppMessage:f=>listener=f,
 offShareAppMessage:f=>calls.off.push(f),shareAppMessage:o=>calls.cards.push(o),showToast:o=>calls.toasts.push(o)};
 const share=new ShareBridge(()=>enabled,()=>api);share.configure('../素材/游戏美术/cover.jpg');share.onOpenRequest=()=>calls.opens++;
 return{share,api,calls,listener:()=>listener};
}
test('share installs one menu handler, both entries use the same public card and only record requests',()=>{
 const h=host();h.share.install();h.share.install();assert.equal(h.calls.menus.length,1);
 assert.deepEqual(h.calls.menus[0].menus,['shareAppMessage']);assert.equal(h.calls.menus[0].withShareTicket,false);
 const card=h.listener()();h.share.request();assert.deepEqual(h.calls.cards,[card]);assert.equal(h.calls.opens,2);
 assert.equal(h.share.status().requests,2);assert.equal(card.query,'from=invite&sv=1');assert.ok(!('success'in card));
 assert.ok(!('path'in card));assert.equal(card.imageUrl,'../素材/游戏美术/cover.jpg','explicit art never captures friend data');
});
test('share disabled on browser; unsupported hosts retain diagnostics without a misleading tutorial toast',()=>{
 const browser=host(false);browser.share.install();browser.share.request();assert.equal(browser.calls.menus.length,0);assert.equal(browser.calls.cards.length,0);
 const h=host();delete h.api.shareAppMessage;h.share.install();h.share.request();assert.equal(h.calls.toasts.length,0);assert.equal(h.share.status().requests,0);assert.match(h.share.status().error,/主动分享接口/);
 h.api.shareAppMessage=()=>{throw Error('unavailable');};assert.doesNotThrow(()=>h.share.request());assert.equal(h.calls.toasts.length,0);assert.match(h.share.status().error,/unavailable/);
});
test('share destroys its own listener once and late callbacks cannot reopen or mutate status',()=>{
 const h=host();h.share.install();const listener=h.listener();h.share.destroy();h.share.destroy();
 assert.deepEqual(h.calls.off,[listener]);listener();h.share.request();assert.equal(h.calls.opens,0);assert.equal(h.share.status().requests,0);
 h.calls.menus[0].fail({errMsg:'late failure'});assert.equal(h.share.status().error,'');
});
test('share menu failure does not disable explicit sharing or retry registration every frame',()=>{
 const h=host();h.api.showShareMenu=()=>{throw Error('menu unavailable');};h.share.install();assert.match(h.share.status().error,/menu unavailable/);
 h.share.request();assert.equal(h.calls.cards.length,1);assert.equal(h.calls.opens,1);
});
function fight(side=-1){
 const s=new GameSession();s.reset();const b=s.spawner.guard;
 s.spawner.enemies=[b];b.x=14000;b.active=true;b.introTime=0;
 s.player.reset(b.x+side*500,150);s.level.arenaVisited=true;
 return{s,b,step:()=>s.update(dt,idle),drops:()=>s.pickups.items.filter(p=>p.active&&p.sourceId==='colossus-half-rockets')};
}
test('final boss has 120 HP but crossing half health no longer grants rockets on either side',()=>{
 for(const side of [-1,1]){
  const f=fight(side);assert.equal(f.b.maxHealth,120);f.b.takeDamage(f.b.maxHealth/2-1,1);f.step();assert.equal(f.drops().length,0);
  f.b.takeDamage(1,1);f.step();assert.equal(f.drops().length,0);
  f.b.takeDamage(10,1);for(let i=0;i<20;i++)f.step();assert.equal(f.drops().length,0);
  assert.ok(!f.s.pickups.recoveryIds.includes('colossus-half-rockets'));
  assert.ok(!f.s.pickups.items.some(p=>p.active&&p.kind==='rocket'));
 }
});
test('removed mid-fight rocket supply cannot reappear after pool space, pause, death or restart',()=>{
 const f=fight();for(let i=0;i<32;i++)f.s.pickups.spawn(50,160,'ammo');f.b.takeDamage(80,1);f.step();assert.equal(f.drops().length,0);
 f.s.pause();f.s.pickups.items[0].active=false;f.step();assert.equal(f.drops().length,0);
 f.s.resume();f.step();assert.equal(f.drops().length,0);f.s.reset();assert.ok(!f.s.pickups.recoveryIds.includes('colossus-half-rockets'));
 const killed=fight();killed.b.takeDamage(999,1);killed.step();assert.equal(killed.drops().length,0);
 const dead=fight();dead.b.takeDamage(80,1);dead.s.player.health=0;dead.step();assert.equal(dead.drops().length,0);
});
function authoredRocket(){
 const s=new GameSession();s.reset();const box=s.level.objects.objects.find(o=>o.id==='rocket-before-colossus');
 box.takeDamage(999,1);s.update(dt,idle);
 const p=s.pickups.items.find(p=>p.active&&p.kind==='rocket');assert.ok(p,'pre-fight crate remains available');
 return{s,p};
}
test('pre-fight rocket crate still equips rifle/knife users, refills rockets and waits for art',()=>{
 for(const weapon of ['rifle','knife','rocket']){
  const f=authoredRocket(),p=f.p;
  f.s.weapon.equip(weapon,weapon==='rocket'?1:undefined);f.s.player.reset(p.x,p.y-10);
  f.s.weapon.canPresent=()=>false;f.s.pickups.update(dt,f.s.player,f.s.weapon,[]);assert.ok(p.active);
  f.s.weapon.canPresent=()=>true;f.s.pickups.update(dt,f.s.player,f.s.weapon,[]);
  assert.equal(f.s.weapon.id,'rocket');assert.equal(f.s.weapon.ammo,8);assert.equal(p.active,false);
  f.s.update(dt,idle);assert.ok(!p.active);
 }
});
test('pre-fight rocket drop still lands on authored surfaces without duplicating itself',()=>{
 const f=authoredRocket(),p=f.p;
 for(let i=0;i<300;i++)f.s.pickups.update(dt,f.s.player,f.s.weapon,f.s.level.solids);
 assert.ok(p.active);assert.ok(p.support);assert.ok(Math.abs(p.y-p.supportTop-10)<.01);
 const x=p.x;f.s.update(dt,idle);assert.equal(f.s.pickups.items.filter(p=>p.active&&p.kind==='rocket').length,1);assert.equal(p.x,x);
});
