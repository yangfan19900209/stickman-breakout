import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('cancelling active joystick and firing fingers releases all input ownership',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__,{},{timeout:45000});await page.locator('#GameCanvas').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>(globalThis as any).__BREAKOUT__.snapshot().time>0.05);
  const layout=await page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot().controls.layout),b=await page.locator('#GameCanvas').boundingBox();if(!b)throw Error('No canvas');const scale=Math.min(b.width/1280,b.height/720);
  const xy=(x:number,y:number)=>({x:b.x+(b.width-1280*scale)/2+x*scale,y:b.y+(b.height-720*scale)/2+(720-y)*scale});
  const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...xy(layout.joystick.x+50,layout.joystick.y)},{id:2,...xy(layout.shoot.x,layout.shoot.y)}]});
  await page.waitForFunction(()=>(globalThis as any).__BREAKOUT__.snapshot().shots>1);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await page.waitForTimeout(250);const a=await page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());await page.waitForTimeout(250);const z=await page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
  expect(z.controls.stick.owner).toBe(null);expect(z.shots).toBe(a.shots);expect(Math.abs(z.player.x-a.player.x)).toBeLessThan(2);
  const diagnostic='Ignored attempt to cancel a touchcancel event with cancelable=false, for example because scrolling is in progress and cannot be interrupted.';
  const applicationErrors=errors.filter(e=>e!==diagnostic);expect(applicationErrors).toEqual([]);writeFileSync('reports/mobile-cancellation.json',JSON.stringify({inputReleased:true,engineDiagnostics:errors.filter(e=>e===diagnostic),applicationErrors},null,2));
});
