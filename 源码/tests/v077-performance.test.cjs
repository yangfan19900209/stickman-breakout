const {test}=require('node:test'),assert=require('node:assert/strict');
const {StaticRectIndex}=require('../.test-build/assets/scripts/core/StaticRectIndex.js');
const {OceanLevel:L}=require('../.test-build/assets/scripts/ocean/OceanLevel.js');
const {swimMove}=require('../.test-build/assets/scripts/ocean/SwimCollision.js');
const {segmentRect}=require('../.test-build/assets/scripts/core/Types.js');
const {PoseInterpolation}=require('../.test-build/assets/scripts/render/PoseInterpolation.js');
const {PlayerController}=require('../.test-build/assets/scripts/player/PlayerController.js');
function rng(){let v=77;return()=>((v=(Math.imul(v,1664525)+1013904223)>>>0)/4294967296)}
test('spatial index preserves exact earliest projectile hits, tangencies and long reverse rays',()=>{
 const random=rng(),index=new StaticRectIndex(L.obstacles),out=[];let total=0;
 for(let i=0;i<2400;i++){
   const r=L.obstacles[i%L.obstacles.length];
   const a=i%3?{x:random()*L.width,y:random()*800}:{x:r.x,y:r.y+r.h};
   const b={x:a.x+(random()-.5)*2600,y:a.y+(random()-.5)*750},radius=i%4?8:0;
   index.query(Math.min(a.x,b.x)-radius,Math.min(a.y,b.y)-radius,Math.max(a.x,b.x)+radius,Math.max(a.y,b.y)+radius,out);
   const hit=list=>{let nearest=1;for(const r of list){const t=segmentRect(a,b,r,radius);if(t!==null)nearest=Math.min(nearest,t)}return nearest};
   assert.equal(hit(out),hit(L.obstacles),`ray ${i}`);assert.equal(new Set(out).size,out.length);total+=out.length;
 }
 assert.ok(total/2400<L.obstacles.length*.15,'localized candidate workload');
});
test('indexed swim sweeps and initial rock-union recovery match full terrain, including boost-sized moves',()=>{
 const random=rng(),index=new StaticRectIndex(L.obstacles),out=[];
 for(let i=0;i<3000;i++){
   const r=L.obstacles[i%L.obstacles.length],hw=13,h=68;
   const a={x:r.x+(random()-.25)*(r.w+70),y:r.y+r.h+(random()-.5)*100},b={...a};
   const dx=(random()-.5)*100,dy=(random()-.5)*100;
   index.query(a.x-hw-100+Math.min(0,dx),a.y-100+Math.min(0,dy),a.x+hw+100+Math.max(0,dx),a.y+h+100+Math.max(0,dy),out);
   swimMove(a,dx,dy,hw,h,out);swimMove(b,dx,dy,hw,h,L.obstacles);
   assert.ok(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8,`body ${i}: ${JSON.stringify({a,b})}`);
 }
});
test('render interpolation removes fixed-step position jitter and keeps getters and physics untouched',()=>{
 const source={x:0,y:150,stride:0,equipped:'rifle',get weaponId(){return this.equipped}},pose=new PoseInterpolation(source);
 let accumulator=0,time=0;const step=1/120;
 for(const dt of Array.from({length:80},(_,i)=>[.014,.018,.015,.021][i%4])){
   time+=dt;accumulator+=dt;
   while(accumulator>=step){pose.capture();source.x+=280*step;source.stride+=280*step/96;accumulator-=step}
   const original={...source},v=pose.sample(accumulator/step);
   assert.ok(Math.abs(v.x-280*(time-step))<1e-8);assert.equal(v.weaponId,'rifle');assert.equal({...v}.equipped,'rifle');assert.deepEqual({...source},original);
 }
 source.equipped='rocket';assert.equal(pose.sample(1).weaponId,'rocket');
 source.x=110;source.y=720;assert.equal(pose.sample(0).x,110);assert.equal(pose.sample(0).y,720);
});
test('changing direction during deceleration never reverses the walking animation phase',()=>{
 const p=new PlayerController(),level={solids:[],movePlayer(body,dt){body.x+=body.vx*dt;body.y=150;body.grounded=true;body.vy=0}};
 for(let i=0;i<40;i++)p.update(1/120,{axis:1,jump:false,shoot:false},level);
 const start=p.stride;
 for(let i=0;i<10;i++){const before=p.stride;p.update(1/120,{axis:-1,jump:false,shoot:false},level);assert.ok(p.stride>=before)}
 assert.ok(p.stride>start);
});
test('packed combat sprites retain every RGBA pixel, logical size and a filtering gutter',()=>{
 const fs=require('node:fs'),{PNG}=require('pngjs'),m=require('../../素材/游戏美术/v077-combat-atlas.json');
 const atlas=PNG.sync.read(fs.readFileSync(m.texture));
 assert.equal(m.frames.length,83);
 for(const f of m.frames){
   const original=PNG.sync.read(fs.readFileSync(f.runtimeSource)),[x,y,w,h]=f.atlas;
   assert.equal(w,original.width);assert.equal(h,original.height);assert.ok(x>=3&&y>=3&&x+w+3<=atlas.width&&y+h+3<=atlas.height);
   for(let row=0;row<h;row++)assert.deepEqual(atlas.data.subarray(((y+row)*atlas.width+x)*4,((y+row)*atlas.width+x+w)*4),original.data.subarray(row*w*4,(row+1)*w*4),f.id);
 }
});
