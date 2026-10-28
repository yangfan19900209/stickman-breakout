import {test, expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());

test('modular terrain and one equipped weapon remain correct through real pickups, firing and ammo fallback',async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width:844,height:390});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.clock.install({time:new Date('2026-10-19T00:00:00Z')});
  await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-10-19T00:00:10Z'));
  await page.keyboard.press('Enter');await page.clock.runFor(34);
  await page.screenshot({path:'reports/v057-first-screen.png'});
  const brain=new PlaytestBrain(),held=new Set<string>(),seen=new Set<string>(),captures:any[]=[];
  let last:any, returned=false, prior='rifle';
  for(let n=0;n<2400;n++){
    last=await read(page);if(last.state!=='playing'||last.player.x>3900)break;
    expect(last.art.active).toBe('comic');expect(last.art.terrain).toBe('native-v057');
    expect(last.weaponPresentation.id).toBe(last.playerWeapon);
    expect(last.art.hudWeapon.id).toBe(last.weapon);expect(last.art.hudWeapon.frame).toBe('weapon.'+last.weapon);
    if(last.melee.time===0&&last.player.animation!=='Dead'&&last.player.animation!=='Hit'&&last.art.equipment.weapon)
      expect(last.art.renderedPlayer.weaponVisible).toBe(true);
    const e=last.art.equipment;
    if(e.weapon){expect(e.bakedRifle).toBe(false);expect(e.weapon).toBe('weapon.'+last.weapon);}
    if(last.weapon==='rocket'&&last.player.animation!=='Dead'&&last.player.animation!=='Hit'&&last.melee.time===0&&last.player.throwTime===0){expect(e.body).toMatch(/^direct\.rocket\./);expect(e.weapon).toBeNull();expect(e.grip).toBeNull();}
    if(last.weapon==='rifle'&&prior!=='rifle')returned=true;
    prior=last.weapon;
    if(!seen.has(last.weapon)){
      seen.add(last.weapon);captures.push({weapon:last.weapon,body:e.body,equipment:e,x:last.player.x});
      await page.screenshot({path:`reports/v057-${last.weapon}.png`});
      if(last.weapon!=='rifle') {
        const box=await page.locator('#GameCanvas').boundingBox(),z=last.display.combatZoom;
        const k=box!.height/last.display.height;
        const x=box!.x+(last.player.x-last.cameraX)*z*k,
          y=box!.y+(last.display.height-(last.player.y-last.display.cameraY)*z)*k;
        await page.screenshot({path:`reports/v057-${last.weapon}-detail.png`,clip:{x:Math.max(0,x-65),y:Math.max(0,y-110),width:170,height:145}});
      }
    }
    if(last.player.x>1250&&!seen.has('platform')){seen.add('platform');await page.screenshot({path:'reports/v057-platform.png'});}
    if(last.player.x>2500&&!seen.has('terrain-second')){seen.add('terrain-second');await page.screenshot({path:'reports/v057-second-zone.png'});}
    const f=brain.next(last),keys=new Set<string>();
    if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
    for(const key of held)if(!keys.has(key)){await page.keyboard.up(key);held.delete(key);}
    for(const key of keys)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
    await page.clock.runFor(34);
  }
  for(const key of held)await page.keyboard.up(key);
  writeFileSync('reports/v057-browser.json',JSON.stringify({captures,returned,snapshot:last,errors},null,2));
  expect(seen.has('rifle')&&seen.has('shotgun')&&seen.has('rocket')).toBe(true);
  expect(returned).toBe(true);expect(last.player.x).toBeGreaterThan(3900);expect(errors).toEqual([]);
});
