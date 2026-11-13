import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const require=createRequire(path.resolve('源码/package.json')),{chromium}=require('playwright');
const dir='开发进度/验证记录/revive-select-design-20261113',errors=[],captures=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:820}});
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
const read=()=>page.evaluate(()=>__REVIVE_DESIGN__),click=a=>page.locator(`[data-action="${a}"]`).click();
async function revive(){await click('revive');await page.waitForFunction(()=>__REVIVE_DESIGN__.screen==='play');}
async function capture(name){const file=`${dir}/${name}.png`;await page.screenshot({path:file,fullPage:true});captures.push(file);}
try{
 await page.goto(pathToFileURL(path.resolve('开发计划/原型/revive-chapter-select.html')).href);
 assert.equal(await page.locator('[data-action="select"]').count(),0);
 await click('start1');await click('die');await capture('death-desktop');
 await click('share');await click('share-cancel');assert.equal((await read()).revives,0);
 await click('share');await click('share-send');assert.equal((await read()).revives,0);assert.equal((await read()).screen,'dead');
 await revive();let s=await read();assert.equal(s.assisted,true);assert.equal(s.revives,1);assert.equal(s.bossHp,62);assert.equal(s.ammo,3);
 await click('die');assert.equal(await page.locator('[data-action="revive"]').count(),0);
 await click('select');assert.equal(await page.locator('[data-action="start2"]').isDisabled(),true);
 await click('start1');assert.equal((await read()).revives,0);await click('win');assert.equal((await read()).best[1],97.2);
 await click('home');assert.equal(await page.locator('[data-action="select"]').count(),1);await click('select');await capture('chapters-first-cleared');
 await click('start2');assert.equal((await read()).chapter,2);await click('die');await revive();await click('win');s=await read();assert.equal(s.cleared,2);assert.equal(s.best[2],undefined);assert.equal(s.best[1],97.2);await capture('assisted-result');
 await page.locator('#profile').selectOption('2');await click('select');await click('start1');await click('die');await revive();await click('win');assert.equal((await read()).best[1],88.6);
 const dimensions=[];
 for(const size of [{width:852,height:600},{width:667,height:530}]){
  await page.setViewportSize(size);await click('home');await click('select');await capture(`chapters-${size.width}`);
  const measure=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('button')].filter(b=>!b.disabled).map(b=>({text:b.textContent,height:b.getBoundingClientRect().height}))}));
  assert.equal(measure.overflow,false);assert.ok(measure.buttons.every(b=>b.height>=44));dimensions.push({viewport:size,...measure});
  await click('start2');await click('die');await capture(`death-${size.width}`);
  const inside=await page.evaluate(()=>{const a=document.querySelector('.frame').getBoundingClientRect(),b=document.querySelector('.death-panel').getBoundingClientRect();return b.top>=a.top&&b.bottom<=a.bottom});assert.ok(inside,'Death panel must fit its frame');
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,checkedAt:new Date().toISOString(),scope:'Design prototype only; not the Cocos game or real WeChat. No messages sent, no game records modified.',flows:['new-player entry','cancel/send leaves revival entitlement unchanged','one revive per attempt','boss/ammo retained in prototype','locked chapter remains disabled','clear unlocks selection','assisted run saves progress without fastest time','prior best retained','restart resets revival'],dimensions,errors,captures,prototypeBytes:statSync('开发计划/原型/revive-chapter-select.html').size};
 writeFileSync(`${dir}/prototype-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,flows:report.flows.length,captures:captures.length}));
}finally{await browser.close();}
