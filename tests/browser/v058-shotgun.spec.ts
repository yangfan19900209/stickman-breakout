import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());

async function boot(page:any){
 await page.setViewportSize({width:844,height:390});
 await page.clock.install({time:new Date('2026-10-28T00:00:00Z')});await page.goto('/');
 await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
 await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-10-28T00:00:10Z'));
 await page.keyboard.press('Enter');await page.clock.runFor(34);
}

test('ordinary player bullets visibly travel at the reduced 760 speed in the real Web build',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
 await page.keyboard.down('KeyJ');let s:any;
 for(let n=0;n<6;n++){await page.clock.runFor(17);s=await read(page);if(s.projectileStates.some((b:any)=>b.owner==='player'&&b.kind==='bullet'))break;}
 await page.keyboard.up('KeyJ');
 const first=s.projectileStates.find((b:any)=>b.owner==='player'&&b.kind==='bullet');expect(first).toBeDefined();expect(first.vx).toBe(760);
 await page.clock.runFor(68);const second=(await read(page)).projectileStates.find((b:any)=>b.owner==='player'&&b.kind==='bullet');
 expect(second).toBeDefined();expect(second.x-first.x).toBeCloseTo(760*(second.age-first.age),5);
 expect(second.x-first.x).toBeGreaterThan(35);expect(second.x-first.x).toBeLessThan(65);
 await page.screenshot({path:'reports/v058-rifle-flight.png'});
 expect(errors).toEqual([]);writeFileSync('reports/v058-rifle.json',JSON.stringify({first,second,errors},null,2));
});

test('real shotgun pickup uses intact sprites through running, crouch-walking, firing, jumping and repeated weapon switches',async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await boot(page);const brain=new PlaytestBrain(),held=new Set<string>(),captures:any[]=[];
 async function apply(keys:Set<string>,ms=34){
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(ms);
 }
 await page.evaluate(()=>{
  const samples:any[]=[];(globalThis as any).__shotgunSamples=samples;
  function sample(){const s=(globalThis as any).__BREAKOUT__.snapshot();
   if(s.weapon==='shotgun'&&s.melee.time===0&&!s.art.equipment.pose.startsWith('player.throw.')&&s.state==='playing')samples.push({
    body:s.art.renderedPlayer.body,visible:s.art.renderedPlayer.weaponVisible,weapon:s.art.renderedPlayer.weapon,
    hud:s.art.hudWeapon.id,player:s.playerWeapon,overlay:s.art.equipment.weapon,grip:s.art.equipment.grip});
   requestAnimationFrame(sample);
  }requestAnimationFrame(sample);
 });
 let s:any;
 for(let n=0;n<1300;n++){
  s=await read(page);if(s.weapon==='shotgun')break;expect(s.state).toBe('playing');
  const f=brain.next(s),keys=new Set<string>();
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');
  if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  await apply(keys);
 }
 expect(s.weapon).toBe('shotgun');await apply(new Set());
 // Return through the real cleared route before spending several seconds on
 // pose sampling. Keep all enemies, damage and colliders active.
 for(let n=0;n<100;n++){if((await read(page)).player.x<240)break;await apply(new Set(['KeyA']));}
 await apply(new Set());
 for(let n=0;n<60;n++){s=await read(page);if(s.player.grounded&&s.player.animation!=='Hit')break;await page.clock.runFor(17);}
 // Face the cleared starting area so short posture checks cannot trigger the
 // independent contextual knife against an approaching enemy in front.
 await apply(new Set(['KeyA']));await apply(new Set(),300);
 async function capture(label:string,pose:string){
  let s=await read(page);
  // An authentic enemy hit takes animation priority for 0.22s. Wait for it;
  // never suppress damage or force the player's visual state for a screenshot.
  for(let n=0;n<20&&s.player.animation==='Hit';n++){await page.clock.runFor(17);s=await read(page);}
  expect(s.state).toBe('playing');expect(s.weapon).toBe('shotgun');
  expect(s.art.renderedPlayer.body).toMatch(new RegExp('^direct\\.shotgun\\.'+pose));
  expect(s.art.equipment.weapon).toBeNull();expect(s.art.equipment.grip).toBeNull();
  expect(s.art.renderedPlayer.weapon).toBe('baked.shotgun');expect(s.art.renderedPlayer.weaponVisible).toBe(true);
  expect(s.art.hudWeapon.frame).toBe('weapon.shotgun');expect(s.playerWeapon).toBe('shotgun');
  captures.push({label,snapshot:s});await page.screenshot({path:`reports/v058-shotgun-${label}.png`});return s;
 }
 async function fire(keys:Set<string>){
  const before=(await read(page)).playerShots;
  for(let n=0;n<40;n++){await apply(keys,17);if((await read(page)).playerShots>before)return;}
  expect((await read(page)).playerShots).toBeGreaterThan(before);
 }
 await capture('idle','idle');
 await fire(new Set(['KeyJ']));await capture('stand-fire','stand-shoot');await apply(new Set(),500);
 await apply(new Set(['KeyA']),68);await capture('run','run');
 await fire(new Set(['KeyA','KeyJ']));await capture('run-fire','run-shoot');await apply(new Set(),500);
 await apply(new Set(['KeyS']),34);await capture('crouch','crouch');
 await fire(new Set(['KeyS','KeyJ']));await capture('crouch-fire','crouch-shoot');await apply(new Set(['KeyS']),500);
 const legs=new Set<string>();
 // Cover more than one 96-unit gait cycle at the real 115-unit crouch speed.
 for(let n=0;n<40;n++){
  await apply(new Set(['KeyS','KeyD','KeyJ']),34);const s=await read(page);
  if(s.melee.time===0&&s.player.animation!=='Hit'){expect(s.art.renderedPlayer.body).toMatch(/^direct\.shotgun\.crouch-walk\./);legs.add(s.art.renderedPlayer.body);}
 }
 expect(legs.size).toBe(6);await capture('crouch-walk','crouch-walk');
 await apply(new Set(),100);await apply(new Set(['Space']),68);await capture('jump','jump');await apply(new Set());
 for(let n=0;n<50;n++){const s=await read(page);if(s.player.animation==='Fall')break;await page.clock.runFor(17);}
 await capture('fall','fall');
 for(let n=0;n<60;n++){if((await read(page)).player.grounded)break;await page.clock.runFor(17);}
 for(let n=0;n<8;n++){
  const ammo=(await read(page)).ammo;await page.keyboard.press('KeyQ');
  for(let f=0;f<8&&(await read(page)).weapon!=='knife';f++)await page.clock.runFor(17);
  expect((await read(page)).weapon).toBe('knife');await page.keyboard.press('KeyQ');
  for(let f=0;f<8&&(await read(page)).weapon!=='shotgun';f++)await page.clock.runFor(17);
  const s=await read(page);expect(s.weapon).toBe('shotgun');expect(s.ammo).toBe(ammo);expect(s.art.renderedPlayer.weaponVisible).toBe(true);
 }
 await capture('switched','idle');
 const samples=await page.evaluate(()=>(globalThis as any).__shotgunSamples);
 expect(samples.length).toBeGreaterThan(40);
 for(const f of samples){expect(f.body).toMatch(/^direct\.shotgun\./);expect(f.visible).toBe(true);expect(f.weapon).toBe('baked.shotgun');
  expect(f.overlay).toBeNull();expect(f.grip).toBeNull();expect(f.hud).toBe('shotgun');expect(f.player).toBe('shotgun');}
 expect(errors).toEqual([]);
 writeFileSync('reports/v058-shotgun.json',JSON.stringify({captures,samples,legs:[...legs],errors},null,2));
});
