const {test}=require('node:test'),assert=require('node:assert/strict');
const {InputManager}=require('../.test-build/assets/scripts/core/InputManager.js');
const {PlayerController}=require('../.test-build/assets/scripts/player/PlayerController.js');
const ground={solids:[],movePlayer(p,t){p.x+=p.vx*t;p.y=150;p.grounded=true;p.vy=0;}};
const dt=1/120;
function move(i,angle,strength=1){const a=angle*Math.PI/180;i.joystick.move(1,Math.cos(a)*i.joystick.radius*strength,Math.sin(a)*i.joystick.radius*strength);return {...i.consume()};}
function input(){const i=new InputManager();i.joystick.start(1,0,0);return i;}

test('upward thumb drift holds position and aim while another finger fires',()=>{
 for(const angles of [[70,78,85,96,111,104,90],[110,99,88,71,77,90]]){
  const i=input(),p=new PlayerController();p.reset(300,150);i.press('right-finger','shoot');
  for(const angle of angles)for(let n=0;n<12;n++){const f=move(i,angle);assert.equal(f.axis,0);assert.equal(f.aimY,1);assert.equal(f.shoot,true);assert.equal(f.crouch,false);p.update(dt,f,ground);}
  assert.equal(p.x,300);assert.equal(p.vx,0);
 }
});
test('ordinary diagonal running enters upward aim decisively, with hysteresis on the way out',()=>{
 for(const sign of [1,-1]){
  const i=input(),a=d=>sign===1?d:180-d;
  assert.ok(Math.abs(move(i,a(45)).axis-sign)<1e-8);
  assert.equal(move(i,a(62)).axis,0);
  for(const d of [59,57,54,58,61,55])assert.equal(move(i,a(d)).axis,0);
  assert.ok(Math.abs(move(i,a(49)).axis-sign)<1e-8);
  for(const d of [52,56,59])assert.ok(Math.abs(move(i,a(d)).axis-sign)<1e-8);
  assert.equal(move(i,a(66)).axis,0);
 }
});
test('light upward input responds earlier without creating idle drift',()=>{
 const i=input();assert.equal(move(i,90,.15).aimY,0);
 const f=move(i,76,.4);assert.equal(f.axis,0);assert.equal(f.aimY,1);
 i.joystick.end(1);assert.equal(i.consume().aimY,0);assert.equal(i.consume().axis,0);
 i.joystick.start(1,0,0);assert.ok(move(i,45).axis>.99);
});
test('upward cone preserves keyboard movement, jump and explicit crouch ownership',()=>{
 const i=input();move(i,90);i.press('keyboard','right');i.press('jump-finger','jump');i.press('shot-finger','shoot');
 let f={...i.consume()};assert.equal(f.axis,1);assert.equal(f.aimY,1);assert.equal(f.jump,true);assert.equal(f.shoot,true);
 i.release('jump-finger');i.release('keyboard');f={...i.consume()};assert.equal(f.axis,0);assert.equal(f.jump,false);assert.equal(f.shoot,true);
 i.clear();f={...i.consume()};assert.equal(f.shoot,false);assert.equal(f.aimY,0);assert.equal(f.axis,0);
});
test('water and flight use the raw two-axis stick after land upward aiming',()=>{
 for(const mode of ['swim','flight']){
  const i=input();move(i,75);
  for(const angle of [45,65,75,85,95,115,180,270]){
   const a=angle*Math.PI/180;i.joystick.move(1,Math.cos(a)*i.joystick.radius,Math.sin(a)*i.joystick.radius);
   const f=i.consume(mode);assert.equal(f.axis,i.joystick.axis);assert.equal(f.vertical,i.joystick.vertical);assert.equal(f.crouch,false);
   assert.ok(Math.abs(Math.hypot(f.axis,f.vertical)-1)<1e-8);
  }
 }
});
