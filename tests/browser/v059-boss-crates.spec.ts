import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
test.use({serviceWorkers:'block'});
async function boot(page:any){
 await page.clock.install({time:new Date('2026-10-29T00:00:00Z')});await page.goto('/');
 await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);await page.locator('#GameCanvas').focus();
 await page.clock.pauseAt(new Date('2026-10-29T00:00:10Z'));await page.keyboard.press('Enter');await page.clock.runFor(34);
 expect(await page.evaluate(()=>(globalThis as any).__BREAKOUT__.version)).toBe('0.5.9');
}
test('real shots crack one full-sized crate before it breaks, removes collision and releases the pickup',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
 const frames:any[]=[];const initial=await read(page),first=initial.art.objects.find((o:any)=>o.id==='shotgun-cache');
 expect(first.frame).toBe('crate.intact');await page.screenshot({path:'reports/v059-crate-intact.png'});
 await page.keyboard.down('KeyJ');const health=new Set<number>();
 for(let n=0;n<90;n++){
  await page.clock.runFor(17);const s=await read(page),o=s.objects.find((o:any)=>o.id==='shotgun-cache');
  const v=s.art.objects.find((o:any)=>o.id==='shotgun-cache');
  frames.push({health:o.health,alive:o.alive,solid:o.solid,visual:v??null,hasCollider:s.terrain.some((r:any)=>r.entityId===o.id)});
  if(o.alive){
   expect(v).toBeDefined();expect(v.frame).toBe('crate.intact');expect(v.width).toBe(first.width);expect(v.height).toBe(first.height);expect(v.y).toBe(first.y);
   if(o.health<3&&!health.has(o.health)){await page.screenshot({path:`reports/v059-crate-damage-${o.health}.png`});health.add(o.health);}
  }else{
   expect(o.solid).toBe(false);expect(v).toBeUndefined();expect(s.terrain.some((r:any)=>r.entityId===o.id)).toBe(false);
   await page.keyboard.up('KeyJ');await page.screenshot({path:'reports/v059-crate-break.png'});await page.clock.runFor(100);
   const end=await read(page);expect(end.pickups.some((p:any)=>p.kind==='shotgun')).toBe(true);break;
  }
 }
 expect(health.size).toBe(2);expect(frames.at(-1).alive).toBe(false);expect(errors).toEqual([]);
 writeFileSync('reports/v059-crate.json',JSON.stringify({initial:first,frames,errors},null,2));
});

test('real-keyboard full campaign renders the supplied mech, all six attacks, both phases and destruction before completion',async({page})=>{
 test.setTimeout(360000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await boot(page);const brain=new PlaytestBrain(),held=new Set<string>(),warnings=new Set<string>(),phases=new Set<number>(),captured=new Set<string>(),captures:any[]=[],trace:any[]=[];
 async function shot(label:string,s:any){if(captured.has(label))return;captured.add(label);captures.push({label,snapshot:s});await page.screenshot({path:`reports/v059-${label}.png`});}
 let lastTrace=-5;
 for(let n=0;n<8000;n++){
  const s=await read(page);if(s.state!=='playing')break;
  if(s.time-lastTrace>=5){lastTrace=s.time;trace.push({time:s.time,x:s.player.x,health:s.player.health,boss:s.guardHealth,attack:s.boss.attack});writeFileSync('reports/v059-campaign-progress.json',JSON.stringify({snapshot:s,trace},null,2));}
  if(s.boss.active){
   phases.add(s.boss.phase);expect(s.art.active).toBe('comic');
   // Crossing the arena trigger precedes the giant entering the camera. Do
   // not mistake intentional offscreen culling for a missing sprite.
   if(s.art.renderedBoss.visible){expect(s.art.renderedBoss.frame).toMatch(/^mech\./);await shot('boss-intro',s);}
   if(s.boss.windup>0){warnings.add(s.boss.attack);if(['laser','missiles','burst'].includes(s.boss.attack))await shot('boss-warning-'+s.boss.attack,s);}
   if(s.boss.beam?.active){
    expect(s.art.combat.bossBeam.visible).toBe(true);expect(s.art.renderedBoss.frame).toBe('mech.charge');
    expect(s.art.combat.bossBeam.x).toBe(s.boss.beam.x);expect(s.art.combat.bossBeam.y).toBe(s.boss.beam.y);
    expect(s.art.combat.bossBeam.length).toBe(s.boss.beam.length);await shot('boss-laser',s);
    const giant=s.enemies.find((e:any)=>e.kind==='colossus');
    expect(giant.x-s.cameraX).toBeLessThan(s.display.worldVisibleWidth-150);
   }
   if(s.projectileStates.some((p:any)=>p.visual==='mech-missile'))await shot('boss-missiles',s);
   if(s.projectileStates.some((p:any)=>p.visual==='mech-round'))await shot('boss-fan',s);
   if(s.art.renderedBoss.frame==='mech.damaged'&&s.guardHealth>0)await shot('boss-damaged',s);
   if(s.art.renderedBoss.frame==='mech.collapse')await shot('boss-collapse',s);
   if(s.art.renderedBoss.frame==='mech.wreck')await shot('boss-wreck',s);
  }
  const f=brain.next(s),keys=new Set<string>();
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(34);
 }
 for(const k of held)await page.keyboard.up(k);const end=await read(page);await page.screenshot({path:'reports/v059-complete.png'});
 writeFileSync('reports/v059-campaign.json',JSON.stringify({snapshot:end,trace,captures,warnings:[...warnings],phases:[...phases],errors},null,2));
 expect(end.state,JSON.stringify({state:end.state,health:end.player.health,x:end.player.x,boss:end.guardHealth,trace})).toBe('complete');
 expect(end.guardHealth).toBe(0);expect(end.exitOpen).toBe(true);expect(end.player.health).toBeGreaterThan(0);expect(end.miniBoss.health).toBe(0);
 expect(warnings.size).toBe(6);expect([...phases]).toEqual([1,2]);
 for(const count of Object.values(end.boss.attackCounts))expect(count).toBeGreaterThan(0);
 for(const label of ['boss-laser','boss-missiles','boss-fan','boss-collapse','boss-wreck'])expect(captured.has(label),label).toBe(true);
 expect(end.droppedBullets).toBe(0);expect(errors).toEqual([]);
});
