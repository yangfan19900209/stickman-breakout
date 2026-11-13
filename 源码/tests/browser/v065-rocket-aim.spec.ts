import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
test.use({serviceWorkers:'block',channel:'chrome'});

async function acquire(page:any) {
  const errors:string[]=[];
  page.on('pageerror',(e:any)=>errors.push(e.message));
  page.on('console',(m:any)=>{if(m.type()==='error')errors.push(m.text());});
  await page.clock.install({time:new Date('2026-11-06T00:00:00Z')});
  await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-11-06T00:00:10Z'));
  expect(await page.evaluate(()=>(globalThis as any).__BREAKOUT__.version)).toBe('0.6.5');
  await page.keyboard.press('Enter');await page.clock.runFor(34);
  const brain=new PlaytestBrain(),held=new Set<string>();let s=await read(page);
  for(let n=0;n<1200&&s.weapon!=='rocket';n++) {
    expect(s.state).toBe('playing');const f=brain.next(s),keys=new Set<string>();
    if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');
    if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
    for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
    for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
    await page.clock.runFor(34);s=await read(page);
  }
  for(const k of held)await page.keyboard.up(k);
  expect(s.weapon).toBe('rocket');
  // Free-flight validation must leave the real platform over the pickup.
  // Its blocking collision has a separate model regression.
  await page.keyboard.down('KeyA');
  for(let n=0;n<90;n++){await page.clock.runFor(17);s=await read(page);if(s.player.x<1180)break;}
  await page.keyboard.up('KeyA');await page.clock.runFor(1000);
  return errors;
}

function check(s:any,before:any,pitch:number,facing:number,body:RegExp) {
  expect(s.state).toBe('playing');expect(s.weapon).toBe('rocket');
  expect(s.playerShots).toBe(before.playerShots+1);expect(s.ammo).toBe(before.ammo-1);
  expect(s.player.aimPitch).toBeCloseTo(pitch,6);expect(s.player.facing).toBe(facing);
  expect(s.weaponShot.pitch).toBeCloseTo(pitch,6);
  expect(s.art.renderedPlayer.body).toMatch(body);
  expect(s.art.equipment.weapon).toBeNull();expect(s.art.equipment.grip).toBeNull();
  const p=s.projectileStates.find((p:any)=>p.owner==='player'&&p.kind==='rocket'&&p.age<.06);
  expect(p).toBeDefined();expect(p.vx).toBeCloseTo(facing*Math.cos(pitch)*460,4);expect(p.vy).toBeCloseTo(Math.sin(pitch)*460,4);
  const dx=p.x-s.weaponShot.x,dy=p.y-s.weaponShot.y;
  expect(Math.abs(dx*Math.sin(pitch)-dy*facing*Math.cos(pitch))).toBeLessThan(.02);
  expect(Math.hypot(dx,dy)).toBeLessThan(24);
  const visual=s.art.combat.rockets.find((r:any)=>r.age<.06);
  expect(visual).toBeDefined();expect(visual.angle).toBeCloseTo(Math.atan2(p.vy,p.vx)*180/Math.PI,3);
  expect(visual.width).toBeLessThan(40);expect(visual.x).toBeCloseTo(p.x,3);expect(visual.y).toBeCloseTo(p.y,3);
  expect(s.art.combat.muzzle).toBeDefined();
  // Muzzle FX follow the current moving body; the shot preserves launch coordinates.
  expect(Math.hypot(s.art.combat.muzzle.x-s.weaponShot.x,s.art.combat.muzzle.y-s.weaponShot.y)).toBeLessThan(12);
}

async function shoot(page:any,label:string,pitch:number,facing:number,body:RegExp,captures:any[]) {
  const before=await read(page);await page.keyboard.down('KeyJ');
  let s:any;
  for(let n=0;n<8;n++){await page.clock.runFor(17);s=await read(page);if(s.playerShots>before.playerShots)break;}
  await page.keyboard.up('KeyJ');check(s,before,pitch,facing,body);
  captures.push({label,snapshot:s});await page.screenshot({path:`../开发进度/验证记录/v065-${label}.png`});
  await page.clock.runFor(100);const flight=await read(page);
  const p=flight.projectileStates.find((p:any)=>p.owner==='player'&&p.kind==='rocket'&&p.age>.08&&p.age<.22);
  expect(p).toBeDefined();expect(p.vy).toBeGreaterThan(280);
  captures.push({label:`${label}-flight`,snapshot:flight});
  await page.screenshot({path:`../开发进度/验证记录/v065-${label}-flight.png`});
}

test('vertical and diagonal rockets emerge along the raised barrel on both sides',async({page})=>{
  test.setTimeout(180000);const errors=await acquire(page),captures:any[]=[];
  for(const facing of [1,-1])for(const diagonal of [false,true]){
    const key=facing===1?'KeyD':'KeyA';await page.keyboard.down(key);await page.clock.runFor(17);
    if(!diagonal)await page.keyboard.up(key);
    await page.keyboard.down('KeyW');await page.clock.runFor(17);
    await shoot(page,`${diagonal?'diagonal':'up'}-${facing===1?'right':'left'}`,diagonal?Math.PI/4:Math.PI/2,facing,
      diagonal?/^direct\.rocket\.diagonal-run\./:/^direct\.rocket\.up-stand$/,captures);
    await page.keyboard.up(key);await page.keyboard.up('KeyW');await page.clock.runFor(1000);
  }
  expect(errors).toEqual([]);writeFileSync('../开发进度/验证记录/v065-standing.json',JSON.stringify({captures,errors},null,2));
});

test('jumping, falling and crouching keep the aimed muzzle attached to the full soldier',async({page})=>{
  test.setTimeout(180000);const errors=await acquire(page),captures:any[]=[];
  await page.keyboard.down('KeyW');await page.keyboard.down('Space');await page.clock.runFor(100);
  await shoot(page,'jump-up',Math.PI/2,-1,/^direct\.rocket\.up-jump$/,captures);
  await page.keyboard.up('Space');await page.clock.runFor(1100);
  await page.keyboard.down('Space');await page.clock.runFor(100);await page.keyboard.up('Space');
  for(let n=0;n<50;n++){await page.clock.runFor(17);if((await read(page)).player.vy<0)break;}
  await shoot(page,'fall-up',Math.PI/2,-1,/^direct\.rocket\.up-fall$/,captures);
  await page.clock.runFor(1100);await page.keyboard.down('KeyS');await page.clock.runFor(17);
  await shoot(page,'crouch-up',Math.PI/2,-1,/^direct\.rocket\.up-crouch$/,captures);
  await page.keyboard.up('KeyS');await page.clock.runFor(1100);
  await page.keyboard.down('KeyD');await page.keyboard.down('Space');await page.clock.runFor(100);
  await shoot(page,'jump-diagonal',Math.PI/4,1,/^direct\.rocket\.diagonal-air$/,captures);
  for(const key of ['KeyD','Space','KeyW'])await page.keyboard.up(key);
  expect(errors).toEqual([]);writeFileSync('../开发进度/验证记录/v065-stances.json',JSON.stringify({captures,errors},null,2));
});

test('phone landscape joystick plus attack fires straight from the raised tube',async({page,context})=>{
  test.setTimeout(180000);await page.setViewportSize({width:844,height:390});
  const errors=await acquire(page),captures:any[]=[],s=await read(page),cdp=await context.newCDPSession(page);
  const point=(x:number,y:number,id:number)=>({x:x*844/s.display.width,y:(s.display.height-y)*390/s.display.height,id});
  const stick=s.controls.layout.joystick,shootButton=s.controls.layout.shoot;
  const origin=point(stick.x,stick.y,71),up=point(stick.x,stick.y+80,71),fire=point(shootButton.x,shootButton.y,72);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[up]});await page.clock.runFor(34);
  const before=await read(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[up,fire]});await page.clock.runFor(17);
  const shot=await read(page);check(shot,before,Math.PI/2,-1,/^direct\.rocket\.up-stand$/);
  captures.push({label:'touch-up',snapshot:shot});await page.screenshot({path:'../开发进度/验证记录/v065-touch-up.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(34);
  const released=await read(page);expect(released.controls.shootHeld).toBe(false);expect(released.controls.stick.owner).toBeNull();
  expect(errors).toEqual([]);writeFileSync('../开发进度/验证记录/v065-touch.json',JSON.stringify({captures,released,errors},null,2));
});
