const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {InputManager}=load('core/InputManager'),{TouchInputManager}=load('core/TouchInputManager');
const {controlLayout}=load('ui/ControlLayout'),{PlayerController}=load('player/PlayerController');
const {LevelController}=load('level/LevelController'),{ColossusBoss}=load('enemy/ColossusBoss');
const {ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
const {BossFrames,ColossusScale}=load('render/BossFrames');
const {colossusSocket}=load('render/ColossusPresentation');
const dt=1/120,idle={axis:0,jump:false,shoot:false};
const ground={solids:[],movePlayer(p,t){p.x+=p.vx*t;p.y=150;p.grounded=true;p.vy=0;}};

test('short thumb drags run at full speed even after regripping at the right edge of the left zone',()=>{
 for(const cssHeight of [375,393,430])for(const shoot of [false,true]){
  const i=new InputManager(),t=new TouchInputManager(i),p=new PlayerController();
  const k=720/cssHeight,insets={left:59*k,right:0,top:0,bottom:0},layout=controlLayout(insets,1560,720,cssHeight);
  t.configure(1560,720,layout,insets);t.enabled=true;p.reset(100,150);
  if(shoot)i.press('second-finger','shoot');
  for(const x of [layout.joystick.x,610,770,450,220])for(const side of [-1,1]){
   t.start(7,x,170);assert.equal(i.consume().axis,0);
   for(const distance of [11,15,25,50,20,12]){
    t.move(7,x+side*distance*k,170+distance*k*.12);
    for(let n=0;n<30;n++){const f=i.consume();assert.equal(f.axis,side);assert.equal(f.crouch,false);assert.equal(f.shoot,shoot);p.update(dt,f,ground);}
    assert.equal(p.vx,side*280);
   }
   t.end(7,x,170);for(let n=0;n<30;n++)p.update(dt,i.consume(),ground);
   assert.equal(p.vx,0);assert.equal(i.consume().shoot,shoot);
  }
 }
});

test('a small rest deadzone stops movement without intermediate slow walking or cross-device stickiness',()=>{
 const i=new InputManager(),r=i.joystick.radius;i.joystick.start(1,0,0);
 for(const amount of [.02,.1,.15,.17]){i.joystick.move(1,r*amount,0);assert.equal(i.consume().axis,0);}
 i.joystick.move(1,r*.22,0);assert.equal(i.consume().axis,1);
 for(const amount of [.19,.16,.13,.17]){i.joystick.move(1,r*amount,0);assert.equal(i.consume().axis,1);}
 i.joystick.move(1,r*.1,0);assert.equal(i.consume().axis,0);
 i.joystick.move(1,-r*.22,0);assert.equal(i.consume().axis,-1);
 for(const mode of ['swim','flight']){const f=i.consume(mode);assert.equal(f.axis,i.joystick.axis);assert.equal(f.vertical,0);assert.ok(f.axis>-.1);}
 i.clear();assert.equal(i.consume().axis,0);
});

test('short, imperfect downward gestures crouch and drop through the actual arena platform',()=>{
 for(const angle of [-66,-76,-90,-105,-114]){
  const i=new InputManager(),l=new LevelController(),p=new PlayerController();
  const deck=l.staticSolids.find(s=>s.kind==='platform'&&s.x===13870);p.reset(deck.x+deck.w/2,deck.y+deck.h);
  const a=angle*Math.PI/180,r=i.joystick.radius*.25;i.joystick.start(1,r*Math.cos(a),r*Math.sin(a));
  i.press('shot','shoot');let f=i.consume();assert.equal(f.axis,0);assert.equal(f.crouch,true);assert.equal(f.shoot,true);
  p.update(dt,f,l);assert.ok(p.crouched);i.press('jump','jump');p.update(dt,i.consume(),l);assert.equal(p.dropCount,1);
  i.release('jump');for(let n=0;n<120;n++)p.update(dt,i.consume(),l);
  assert.ok(p.grounded&&p.y<deck.y);assert.ok(l.solids.some(s=>Math.abs(s.y+s.h-p.y)<.01));
  i.joystick.move(1,r,0);for(let n=0;n<24;n++)p.update(dt,i.consume(),l);assert.equal(p.crouched,false);assert.equal(p.vx,280);
 }
});

test('a single tap from either high-deck lip clears the new boss without contact damage or a second jump',()=>{
 for(const hz of [30,60,120])for(const direction of [-1,1]){
  const l=new LevelController();l.arenaVisited=true;l.objects.reset([]);l.refreshSolids();
  const high=l.staticSolids.find(s=>s.kind==='platform'&&s.x===13870),edge=high.x+(direction>0?high.w:0);
  const b=new ColossusBoss({id:'escape',kind:'colossus',x:edge+direction*100,y:150,patrol:0});
  Object.assign(b,{active:true,introduced:true,introTime:0,mode:'recovering',attackCooldown:3,pursuitCheck:3});
  const p=new PlayerController(),q=new ProjectileManager(new ParticlePool());p.reset(edge-direction*20,high.y+high.h);p.vx=direction*280;
  let crossed=false,overlapFrames=0;
  for(let n=0;n<hz*2;n++){
   p.update(1/hz,{...idle,axis:direction,jump:n===0},l);b.update(1/hz,p,l,q);
   if(Math.abs(p.x-b.x)<b.halfWidth+p.halfWidth){overlapFrames++;assert.ok(p.y>b.y+b.height,`clear visible hull: ${hz} ${direction}`);}
   if((p.x-b.x)*direction>b.halfWidth+p.halfWidth){crossed=true;break;}
  }
  assert.ok(crossed&&overlapFrames>0);assert.equal(p.health,5);assert.equal(p.jumpSerial,1);assert.equal(p.airJumpsRemaining,1);
 }
});

test('redrawn full poses retain the original sampling scale, shorter silhouette and mirrored native sockets',()=>{
 assert.equal(ColossusScale,.88);
 const b=new ColossusBoss({id:'visual',kind:'colossus',x:1000,y:150});
 assert.equal(b.height,200);assert.equal(b.bounds.w,172);assert.equal(b.bounds.h,184);
 for(const [id,f] of Object.entries(BossFrames).filter(([id])=>id.startsWith('colossus.'))){
  assert.ok(f.size[1]*(1-f.anchor[1])*ColossusScale<=210,id);
  assert.ok(f.anchor[1]>=0&&f.anchor[1]<.03,`${id}: foot baseline`);
 }
 for(const attack of ['salvo','laser','stomp','missiles']){
  Object.assign(b,{attack,mode:'aiming',windup:1,facing:-1});const a=colossusSocket(b);b.facing=1;const c=colossusSocket(b);
  assert.equal(a.x+c.x,2000);assert.equal(a.y,c.y);assert.ok(a.x<1000&&a.y>150);
 }
});
