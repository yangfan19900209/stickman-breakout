const {test}=require('node:test');
const assert=require('node:assert/strict');
const {comicPose,comicMuzzle}=require('../.test-build/assets/scripts/render/ComicPose.js');
const {ComicFrames,ComicClips}=require('../.test-build/assets/scripts/render/ComicFrames.js');
const fs=require('node:fs');
const base={animation:'Idle',animationTime:0,recoil:0,deadTime:0,stride:0,vx:0};
test('all twelve requested player states select whole supplied frame sequences',()=>{
 const cases=[['idle',{}],['run',{animation:'Run',vx:280}],['jump',{animation:'Jump'}],['fall',{animation:'Fall'}],['crouch',{crouched:true}],['crouch-walk',{crouched:true,vx:115}],['stand-shoot',{recoil:1}],['run-shoot',{vx:280,recoil:1}],['crouch-shoot',{crouched:true,recoil:1}],['throw',{throwTime:.24}],['hit',{animation:'Hit',hitTime:.22}],['death',{animation:'Dead'}]];
 for(const [name,change] of cases) assert.ok(comicPose({...base,...change}).startsWith('player.'+name+'.'),name);
 const poses=new Set();for(let i=0;i<6;i++)poses.add(comicPose({...base,crouched:true,vx:115,recoil:1,stride:i/6+.001}));
 assert.equal(poses.size,6,'firing while crouch-walking must not freeze the legs');
 assert.equal(comicPose({...base,animation:'Dead',deadTime:10}),'player.death.5');
});
test('shield broken silhouette loses shield; tank health and death select actual damage frames',()=>{
 assert.ok(comicPose({...base,kind:'shield',shieldHealth:8}).startsWith('shield.'));
 assert.ok(comicPose({...base,kind:'shield',shieldHealth:0}).startsWith('rifle.'));
 for(const [health,id] of [[100,'idle'],[50,'damaged'],[20,'heavy']])assert.equal(comicPose({...base,kind:'guard',health,maxHealth:100}),'tank.'+id);
 assert.ok(comicPose({...base,kind:'guard',animation:'Dead',deadTime:.2}).startsWith('tank.explode.'));
 assert.equal(comicPose({...base,kind:'guard',animation:'Dead',deadTime:1}),'tank.wreck');
});
test('supplied atlas provenance excludes reference and source sockets keep horizontal shots near hands',()=>{
 const m=JSON.parse(fs.readFileSync('art/manifest.json'));
 assert.equal(m.version,'0.5.3');assert.equal(Object.values(m.sources).filter(s=>s.role==='runtime').length,4);
 assert.ok(m.frames.every(f=>f.source!=='reference'));
 for(const clip of ['player.stand-shoot','player.run-shoot','player.crouch-shoot'])for(const id of ComicClips[clip])assert.ok(ComicFrames[id]);
 const standing=comicMuzzle({...base,recoil:1},0),crouched=comicMuzzle({...base,crouched:true,recoil:1},0);
 assert.ok(standing.y>38&&standing.y<55);assert.ok(crouched.y<standing.y-10);
 const up=comicMuzzle({...base,recoil:1},Math.PI/2);assert.ok(up.y>standing.y+20);
});
test('airborne firing uses the animation getter and the same supplied-frame muzzle as drawing',()=>{
 const {PlayerController}=require('../.test-build/assets/scripts/player/PlayerController.js');
 const {WeaponSystem}=require('../.test-build/assets/scripts/combat/WeaponSystem.js');
 const {ProjectileManager}=require('../.test-build/assets/scripts/combat/ProjectileManager.js');
 const {ParticlePool}=require('../.test-build/assets/scripts/combat/ParticlePool.js');
 const p=new PlayerController();p.grounded=false;p.vy=-200;p.animationTime=.1;p.x=200;p.y=280;
 const w=new WeaponSystem(),shots=new ProjectileManager(new ParticlePool());
 assert.equal(p.animation,'Fall');assert.equal(w.fire(p,shots,'player'),true);
 const tip=comicMuzzle(p,0),bullet=shots.items.find(p=>p.active);
 assert.ok(Math.abs(bullet.x-(p.x+tip.x))<.001);assert.ok(Math.abs(bullet.y-(p.y+tip.y))<.001);
});
