const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');

test('periodic ground texture edges are pixel-identical and atlas has four-pixel extrusion',()=>{
 for(const row of ['top','fill','bottom']){
  const im=PNG.sync.read(fs.readFileSync(`art/slices/v055/tile.${row}.middle.png`));
  for(let y=0;y<im.height;y++)for(let c=0;c<4;c++)assert.equal(im.data[(y*im.width)*4+c],im.data[(y*im.width+im.width-1)*4+c],`${row} edge ${y}`);
  if(row==='fill')for(let x=0;x<im.width;x++)for(let c=0;c<4;c++)assert.equal(im.data[x*4+c],im.data[((im.height-1)*im.width+x)*4+c]);
 }
 assert.equal(JSON.parse(fs.readFileSync('art/v055-manifest.json')).extrusion,4);
});
test('terrain neighbours hide shared walls and platform brackets stay fixed as length changes',()=>{
 const {terrainTiles,metalTiles}=load('render/TerrainTiles');
 const joined=terrainTiles(100,150,300,104,{left:174,right:150});
 assert.ok(!joined.some(t=>t.id==='native.fill.left'||t.id==='native.fill.right'));
 for(const w of [70,140,260,500]){
  const supports=metalTiles(0,262,w).filter(t=>t.id==='native.metal.bracket');
  assert.ok(supports.length>=1);for(const s of supports)assert.equal(s.crop[2]*s.scale,53);
 }
});
test('pickup, ammo, actor and HUD derive one weapon state; rejected equipment never clears the old one',()=>{
 const {GameSession}=load('core/GameSession');const s=new GameSession();s.reset();
 for(const id of ['shotgun','rocket','rifle']){
  s.weapon.equip(id);const snap=s.snapshot();
  assert.equal(s.player.weaponId,id);assert.equal(snap.weaponPresentation.id,id);assert.equal(snap.playerWeapon,id);
  assert.equal(snap.weaponPresentation.icon,'weapon.'+id);assert.equal(snap.weaponPresentation.ammo,s.weapon.ammo);
 }
 s.weapon.equip('shotgun');const ammo=s.weapon.ammo,rev=s.weapon.revision;
 s.weapon.canPresent=id=>id!=='rocket';assert.equal(s.weapon.equip('rocket'),false);
 assert.equal(s.weapon.id,'shotgun');assert.equal(s.weapon.ammo,ammo);assert.equal(s.weapon.revision,rev);
 s.pickups.spawn(s.player.x,s.player.y+25,'rocket');s.pickups.update(1/120,s.player,s.weapon,s.level.solids);
 assert.equal(s.pickups.collected,0);assert.ok(s.pickups.items.some(p=>p.active&&p.kind==='rocket'));
 s.weapon.canPresent=()=>true;s.pickups.update(1/120,s.player,s.weapon,s.level.solids);
 assert.equal(s.player.weaponId,'rocket');assert.equal(s.pickups.collected,1);
 s.weapon.ammo=0;s.weapon.cooldown=0;s.weapon.fire(s.player,s.projectiles,'player');
 assert.equal(s.weapon.id,'rifle');assert.equal(s.player.weaponId,'rifle');assert.equal(s.weapon.lastShot,'rifle');
});

function knifeSetup(kind='ranged',x=165,health=30){
 const {PlayerController}=load('player/PlayerController'),{EnemyController}=load('enemy/EnemyController'),{MeleeSystem}=load('combat/MeleeSystem'),{ParticlePool}=load('combat/ParticlePool');
 const p=new PlayerController();p.reset(100,150);p.weaponId='knife';
 const enemy=new EnemyController({id:'target',kind,x,y:150,health,patrol:0});
 return{p,enemy,m:new MeleeSystem(),fx:new ParticlePool()};
}
test('knife performs three distinct cuts once per target, with a stronger lifting finisher and no bullets',()=>{
 const {p,enemy,m,fx}=knifeSetup();const stages=new Set();
 for(let i=0;i<130;i++){m.update(1/120,p,[enemy],[],true,false,fx);if(m.time>0)stages.add(m.stage);}
 assert.deepEqual([...stages],[1,2,3]);assert.equal(m.swings,3);assert.equal(m.hits,3);assert.equal(enemy.health,15);
 assert.equal(enemy.vy,180);assert.ok(enemy.vx>=250);assert.equal(m.heavyHits,1);
 const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager');
 const w=new WeaponSystem('knife'),q=new ProjectileManager(fx);assert.equal(w.fire(p,q,'player'),false);assert.equal(w.shots,0);
 assert.ok(!q.items.some(p=>p.active));assert.match(w.presentation.ammoText,/近战/);assert.ok(!w.presentation.ammoText.includes('弹药'));
});
test('knife sector rejects rear and distant targets and respects solid cover',()=>{
 const {sectorHitsRect}=load('combat/MeleeGeometry');
 assert.equal(sectorHitsRect(100,192,100,-.3,.3,{x:150,y:180,w:25,h:30},1),true);
 assert.equal(sectorHitsRect(100,192,100,-.3,.3,{x:40,y:180,w:25,h:30},1),false);
 assert.equal(sectorHitsRect(100,192,100,-.3,.3,{x:150,y:270,w:25,h:30},1),false);
 assert.equal(sectorHitsRect(100,192,100,-.3,.3,{x:240,y:180,w:25,h:30},1),false);
 const {p,enemy,m,fx}=knifeSetup();for(let i=0;i<35;i++)m.update(1/120,p,[enemy],[{x:125,y:150,w:12,h:100}],true,false,fx);
 assert.equal(m.hits,0);assert.equal(enemy.health,30);
});
test('knife lunges advance through real collision handling and cannot push the player through a wall',()=>{
 const {LevelController}=load('level/LevelController');const {p,m,fx}=knifeSetup();
 const l=new LevelController();l.objects.reset([]);l.staticSolids.splice(0,l.staticSolids.length,
  {x:0,y:0,w:1000,h:150,kind:'ground'},{x:160,y:150,w:30,h:120,kind:'step'});l.refreshSolids();
 for(let i=0;i<260;i++)m.update(1/120,p,[],l.solids,true,false,fx,l);
 assert.ok(p.x>120);assert.ok(p.x<=147+.001);assert.equal(p.y,150);
});
test('shield blocks the knife front, rocket soldiers lose windup, and bosses retain attack control',()=>{
 const shield=knifeSetup('shield');for(let i=0;i<30;i++)shield.m.update(1/120,shield.p,[shield.enemy],[],true,false,shield.fx);
 assert.ok(shield.m.blockedHits>0);assert.equal(shield.enemy.vy,0);assert.equal(shield.enemy.shieldHealth,4);
 const rocket=knifeSetup('turret');rocket.enemy.windup=.7;rocket.enemy.state='Attack';
 for(let i=0;i<25;i++)rocket.m.update(1/120,rocket.p,[rocket.enemy],[],true,false,rocket.fx);
 assert.equal(rocket.enemy.windup,0);assert.ok(rocket.enemy.hitTime>0);assert.equal(rocket.enemy.vx,0);
 const {TankBoss}=load('enemy/TankBoss');const k=knifeSetup();const tank=new TankBoss({id:'mini',kind:'guard',x:180,y:150,health:42,patrol:0,encounter:'mini'});tank.active=true;tank.mode='aiming';tank.windup=.5;
 for(let i=0;i<25;i++)k.m.update(1/120,k.p,[tank],[],true,false,k.fx);
 assert.ok(tank.health<42);assert.equal(tank.mode,'aiming');assert.equal(tank.vx,0);
});
test('crouch and airborne attacks have distinct states; damage, timeout and weapon changes reset the combo',()=>{
 for(const stance of ['crouch','jump']){
  const {p,enemy,m,fx}=knifeSetup();p.crouched=stance==='crouch';p.grounded=stance!=='jump';
  for(let i=0;i<20;i++)m.update(1/120,p,[enemy],[],true,false,fx);
  assert.equal(m.stance,stance);assert.equal(p.meleeStance,stance);p.hitTime=.2;m.update(1/120,p,[enemy],[],false,false,fx);
  assert.equal(m.time,0);assert.equal(m.stage,0);assert.equal(p.meleeTime,0);
 }
 const {p,enemy,m,fx}=knifeSetup();for(let i=0;i<110;i++)m.update(1/120,p,[enemy],[],i<1,false,fx);
 assert.equal(m.stage,0);assert.equal(m.comboRemaining,0);
 const {GameSession}=load('core/GameSession'),s=new GameSession();s.reset();s.weapon.equip('shotgun');s.weapon.ammo=7;
 s.update(1/120,{axis:0,jump:false,shoot:false,switchWeapon:true});assert.equal(s.weapon.id,'knife');
 s.update(1/120,{axis:0,jump:false,shoot:true});assert.ok(s.melee.time>0);s.pause();const before=s.melee.time;s.update(.2,{axis:0,jump:false,shoot:true});assert.equal(s.melee.time,before);
 s.resume();s.update(1/120,{axis:0,jump:false,shoot:false,switchWeapon:true});assert.equal(s.weapon.id,'shotgun');assert.equal(s.weapon.ammo,7);assert.equal(s.melee.time,0);
});
test('knife can destroy wood with its sector and removes its real collider',()=>{
 const {GameSession}=load('core/GameSession');const s=new GameSession();s.reset();s.weapon.equip('knife');
 s.player.x=315;const wood=s.level.objects.objects.find(o=>o.id==='shotgun-cache');
 for(let i=0;i<35&&wood.alive;i++)s.update(1/120,{axis:0,jump:false,shoot:true});
 assert.equal(wood.alive,false);assert.ok(!s.level.solids.some(r=>r.entityId===wood.id));assert.equal(s.weapon.shots,0);
});
test('switching knife and gun preserves remaining ammo and firing cooldown',()=>{
 const {WeaponSystem}=load('combat/WeaponSystem');const w=new WeaponSystem('rocket');w.ammo=3;w.cooldown=.9;
 w.toggleKnife();w.update(.1);assert.equal(w.id,'knife');w.toggleKnife();assert.equal(w.id,'rocket');assert.equal(w.ammo,3);assert.ok(Math.abs(w.cooldown-.8)<1e-9);
});
