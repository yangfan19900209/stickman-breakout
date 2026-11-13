import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {reportsRoot,sourceRoot} from './project-paths.mjs';

const base=process.env.PREVIEW_URL||'http://127.0.0.1:4190';
const dir=path.join(reportsRoot,'current-smoke');mkdirSync(dir,{recursive:true});
const errors=[],failed=[],chapters=[],startedAt=new Date().toISOString();
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  for(const chapter of [1,2]) {
    const context=await browser.newContext({viewport:{width:852,height:393},hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push({url:r.url(),status:r.status()});});
    page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
    await page.goto(base+(chapter===2?'/level02.html':'/'));
    await page.waitForFunction(()=>!!globalThis.__BREAKOUT__);
    await page.locator('#GameCanvas').focus();
    if(chapter===1)await page.keyboard.press('Enter');
    await page.waitForFunction(c=>{const s=globalThis.__BREAKOUT__.snapshot();return s.state==='playing'&&s.chapter===c;},chapter,{timeout:30000});
    const before=await page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
    await page.keyboard.down('KeyD');await page.keyboard.down('KeyJ');
    await page.waitForFunction(x=>globalThis.__BREAKOUT__.snapshot().player.x>x+10,before.player.x,{timeout:15000});
    await page.keyboard.up('KeyD');await page.keyboard.up('KeyJ');
    const after=await page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
    assert.ok(after.player.x>before.player.x);assert.equal(after.chapter,chapter);
    await page.screenshot({path:path.join(dir,`chapter-${chapter}.png`)});
    await page.keyboard.press('KeyP');
    await page.waitForFunction(()=>globalThis.__BREAKOUT__.snapshot().state==='paused');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>globalThis.__BREAKOUT__.snapshot().state==='playing');
    chapters.push({chapter,loaded:true,moved:true,pauseResume:true,beforeX:before.player.x,afterX:after.player.x});
    await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={version:JSON.parse(readFileSync(path.join(sourceRoot,'package.json'),'utf8')).version,startedAt,finishedAt:new Date().toISOString(),passed:true,scope:'Browser startup, both chapter resource loaders, real keyboard movement/fire and pause/resume; not a device or full-campaign test.',chapters,errors,failed};
  writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
