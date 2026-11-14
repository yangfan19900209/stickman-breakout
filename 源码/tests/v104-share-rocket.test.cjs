const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {ShareBridge,SHARE_COVER_PATH}=load('platform/ShareBridge');
const {GameSession}=load('core/GameSession'),{GameConfig:C}=load('core/GameConfig');
const {EnemyController}=load('enemy/EnemyController');
test('missing Cocos source image or pending cover rendering never blocks immediate native sharing',()=>{
 for(const source of [undefined,'']){
  const sent=[],toasts=[];let menu,opened=0;
  const api={shareAppMessage:o=>sent.push(o),onShareAppMessage:f=>menu=f,showToast:o=>toasts.push(o),createImage:()=>({width:0}),createCanvas:()=>{throw Error('not ready');}};
  const s=new ShareBridge(()=>true,()=>api);s.configure(source);s.install();s.onOpenRequest=()=>opened++;s.request();
  assert.equal(sent.length,1);assert.equal(sent[0].imageUrl,SHARE_COVER_PATH);assert.equal(sent[0].query,'from=invite&sv=1');assert.equal(opened,1);assert.deepEqual(toasts,[]);assert.equal(menu().imageUrl,SHARE_COVER_PATH);
 }
});
test('failed temporary card retries the same native share with packaged artwork and no duplicate opening event',()=>{
 const calls=[];let opens=0;const api={shareAppMessage:o=>{calls.push(o);if(o.imageUrl!==(SHARE_COVER_PATH))throw Error('stale temporary file');}};
 const s=new ShareBridge(()=>true,()=>api);s.configure('wxfile://expired.jpg');s.prepare(1,90000);s.onOpenRequest=()=>opens++;s.request();
 assert.equal(calls.length,2);assert.equal(calls[1].imageUrl,SHARE_COVER_PATH);assert.equal(calls[1].query,calls[0].query);assert.equal(opens,1);assert.equal(s.status().requests,1);assert.equal(s.status().error,'');
});
test('an input-cleanup exception does not swallow the user-requested native share',()=>{
 let calls=0;const s=new ShareBridge(()=>true,()=>({shareAppMessage:()=>calls++}));s.onOpenRequest=()=>{throw Error('cleanup failed');};s.request();assert.equal(calls,1);
});
test('broken or empty canvas export retains a valid independent artwork path',()=>{
 for(const result of ['',undefined,'throw']){
  let card,image;const context={fillRect(){},drawImage(){},fillText(){}};
  const s=new ShareBridge(()=>true,()=>({createImage:()=>image={width:500,height:400},createCanvas:()=>({getContext:()=>context,toTempFilePathSync(){if(result==='throw')throw Error('export');return result;}}),shareAppMessage:o=>card=o}));
  s.configure();image.onload();s.request();assert.equal(card.imageUrl,SHARE_COVER_PATH);
 }
});
function flush(s){s.explosions.flush((...args)=>s.applyBlast(...args));}
test('every enemy rocket/cannon tier deals exactly two player HP on actual direct impact, once',()=>{
 for(const kind of ['rocket','cannon'])for(const tier of ['standard','mini','boss'])for(const direction of [-1,1]){
  const s=new GameSession();s.reset();s.player.reset(400,150);
  s.projectiles.spawn({owner:'enemy',kind,tier,visual:tier==='boss'?'mech-shell':undefined,x:400-direction*90,y:185,direction,speed:600,range:900,blastRadius:100,damage:1});
  assert.equal(s.projectiles.items.find(p=>p.active).damage,2);
  for(let i=0;i<30;i++){s.projectiles.update(1/120,s.player,[],[]);flush(s);}
  assert.equal(s.player.health,3,`${kind}/${tier}/${direction}`);assert.equal(s.explosions.total,1);assert.ok(s.player.invincible>0);
 }
});
test('rocket splash at the blast rim still deals two HP; outside radius is harmless and bullets stay one HP',()=>{
 for(const outside of [false,true]){
  const s=new GameSession();s.reset();s.player.reset(outside?520:500,150);
  s.projectiles.spawn({owner:'enemy',kind:'cannon',tier:'mini',x:300,y:185,direction:1,speed:700,range:800,blastRadius:100,damage:1});
  for(let i=0;i<30;i++){s.projectiles.update(1/120,s.player,[],[{x:400,y:150,w:10,h:100}]);flush(s);}
  assert.equal(s.player.health,outside?5:3);
 }
 const s=new GameSession();s.reset();s.player.reset(400,150);s.projectiles.spawn({owner:'enemy',kind:'bullet',x:330,y:185,direction:1,speed:600,range:800,damage:1});
 for(let i=0;i<25;i++)s.projectiles.update(1/120,s.player,[],[]);assert.equal(s.player.health,4);
});
test('one player rocket kills ordinary soldiers and shield soldiers through the real explosion pipeline from either side',()=>{
 for(const kind of ['melee','ranged','turret','shield'])for(const facing of [-1,1])for(const direction of [-1,1]){
  const s=new GameSession();s.reset();const e=new EnemyController({id:'rocket-target',kind,x:400,y:150});e.facing=facing;s.spawner.enemies=[e];
  s.projectiles.spawn({owner:'player',kind:'rocket',x:400-direction*90,y:185,direction,speed:600,range:800,damage:C.weapons.rocket.damage,blastRadius:C.weapons.rocket.blastRadius});
  for(let i=0;i<30;i++){s.projectiles.update(1/120,s.player,[e],[]);flush(s);}
  assert.equal(e.alive,false,`${kind}/${facing}/${direction}`);assert.equal(s.explosions.total,1);if(kind==='shield')assert.equal(e.shieldBreakCount,1);
 }
});
test('ordinary and shield soldiers also die to one edge-of-radius rocket blast, while heavy bosses keep their own HP rules',()=>{
 for(const kind of ['melee','ranged','turret','shield']){
  const s=new GameSession();s.reset();const e=new EnemyController({id:'edge',kind,x:500,y:150});s.spawner.enemies=[e];
  s.applyBlast(e.bounds.x-C.weapons.rocket.blastRadius,180,C.weapons.rocket.blastRadius,C.weapons.rocket.damage,'player','rocket');assert.equal(e.alive,false,kind);
 }
 const s=new GameSession();s.reset();for(const b of [s.spawner.miniBoss,s.spawner.guard]){b.active=true;const before=b.health;s.applyBlast(b.x,b.y+40,160,C.weapons.rocket.damage,'player','rocket');assert.ok(b.alive&&b.health<before);}
});
test('mini tank and final boss cannon/rocket emission consume the unified damage rule; burst bullets remain one',()=>{
 const s=new GameSession();s.reset();const q=s.projectiles,m=s.spawner.miniBoss,b=s.spawner.guard;
 m.shell(m.x+300,150,q);assert.ok(q.items.filter(p=>p.active).every(p=>p.kind==='cannon'&&p.damage===2));q.reset();
 for(const attack of ['missiles','salvo','burst']){
  b.attack=attack;b.warningX=b.x-400;b.lockedY=190;b.warningY=150;b.warningPoints=[{x:b.x-400,y:150}];b.emit(q,0);
  assert.ok(q.items.some(p=>p.active));for(const p of q.items.filter(p=>p.active))assert.equal(p.damage,p.kind==='bullet'?1:2);q.reset();
 }
});
