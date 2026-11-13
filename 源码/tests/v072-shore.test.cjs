const {test}=require('node:test');
const assert=require('node:assert/strict');
const {OceanSession}=require('../.test-build/assets/scripts/ocean/OceanSession.js');
const {comicPose}=require('../.test-build/assets/scripts/render/ComicPose.js');
const idle={axis:0,vertical:0,jump:false,shoot:false};
test('automatic shore approach animates real travel, ignores steering, and stops at the chest',()=>{
 const s=new OceanSession(), poses=new Set();
 assert.equal(s.introActive,true);assert.equal(s.controlEnabled,false);
 for(let i=0;i<80;i++){s.update(1/120,idle);poses.add(comicPose(s.player));}
 assert.ok(poses.size>=4,'walking must display both contacts and passing legs');
 const x=s.player.x;
 for(let i=0;i<24;i++)s.update(1/120,{...idle,axis:-1});
 assert.ok(s.player.x>x);assert.equal(s.player.x,350);assert.equal(s.stage,'equipping');
 assert.equal(s.player.vx,0);const stride=s.player.stride;
 for(let i=0;i<30;i++)s.update(1/120,idle);
 assert.equal(s.player.stride,stride);assert.equal(s.player.facing,1);
});
test('pausing the shore freezes footsteps and ambient clock; reset restores both',()=>{
 const s=new OceanSession();s.update(.1,{...idle,axis:1});s.pause();
 const before={time:s.time,stride:s.player.stride,x:s.player.x};
 s.update(2,{...idle,axis:1});assert.deepEqual({time:s.time,stride:s.player.stride,x:s.player.x},before);
 s.reset();assert.equal(s.time,0);assert.equal(s.player.stride,0);
});
