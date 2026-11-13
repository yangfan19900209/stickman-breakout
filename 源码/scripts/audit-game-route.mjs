import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const chapter = Number(process.argv[2] ?? 1), tag = process.argv[3] ?? 'v085', expected = process.argv[4] ?? '0.8.5';
assert.ok([1,2].includes(chapter));
assert.match(tag,/^[a-z0-9-]+$/);
const { PlaytestBrain } = require('./playtest-brain.cjs');
const { OceanBrain } = require('./ocean-brain.cjs');
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});
const cdp = await page.context().newCDPSession(page);
const errors=[],failed=[],milestones=[],captures=[],weapons=new Set(),held=new Set();
const startedAt=new Date().toISOString();
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>failed.push(r.url()));
const capture=async name=>{const file=`../开发进度/验证记录/${tag}-chapter${chapter}-${name}.png`;await page.screenshot({path:file});captures.push(file);};
try {
  await cdp.send('Debugger.enable');
  await page.clock.install({time:new Date('2026-11-10T08:00:00Z')});
  await page.goto(`http://127.0.0.1:4190/${chapter===2?'level02.html':''}`);
  await page.waitForFunction(()=>globalThis.__BREAKOUT__);
  if(chapter===2)await page.waitForFunction(()=>globalThis.__BREAKOUT__.snapshot().chapter===2);
  assert.equal(await page.evaluate(()=>globalThis.__BREAKOUT__.version),expected);
  await page.clock.pauseAt(new Date('2026-11-10T08:00:10Z'));
  await page.locator('#GameCanvas').focus();
  if(chapter===1){await page.keyboard.press('Enter');await page.clock.runFor(32);}
  else{
    await page.keyboard.down('KeyD');await page.clock.runFor(900);await page.keyboard.up('KeyD');
    for(let i=0;i<40&&(await read()).stage!=='swimming';i++)await page.clock.runFor(250);
    assert.equal((await read()).stage,'swimming');
  }
  await capture('start');
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.startPreciseCoverage',{callCount:true,detailed:true});
  const brain=chapter===1?new PlaytestBrain({healthThreshold:4}):new OceanBrain();
  let s=await read(),zone='',miniCaptured=false,bossCaptured=false,cheerCaptured=false,cooldownChecks=0;
  for(let n=0;n<6500&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
    const f=brain.next(s),keys=new Set();
    if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');
    if(chapter===1){if(f.jumpHeld)keys.add('Space');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');}
    else{if(f.vertical>0)keys.add('KeyW');if(f.vertical<0)keys.add('KeyS');if(f.jump)keys.add('Space');}
    if(f.shoot)keys.add('KeyJ');
    for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
    for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
    await page.clock.runFor(chapter===1?32:50);s=await read();weapons.add(s.weapon);
    if(chapter===2&&expected==='0.8.5'&&s.state==='playing'&&!s.victory.active){
      const {remaining,duration}=s.attackCooldown;
      assert.equal(s.presentation.controls.buttons.find(b=>b.action==='shoot').cooldown,
        duration>0?Math.ceil(Math.max(0,Math.min(1,remaining/duration))*8):0);
      cooldownChecks++;
    }
    if(s.zone!==zone){zone=s.zone;milestones.push({zone,time:s.time,x:s.player.x,health:s.player.health});console.log(JSON.stringify({chapter,...milestones.at(-1)}));}
    if(s.miniBoss?.active&&!miniCaptured){miniCaptured=true;await capture('mini');}
    const boss=chapter===1?s.guard:s.boss;
    if((boss?.active||s.arenaEntered)&&!bossCaptured){bossCaptured=true;await capture('boss');}
    if(s.victory.phase==='cheer'&&!cheerCaptured){cheerCaptured=true;await capture('cheer');}
  }
  for(const k of held)await page.keyboard.up(k);
  const coverage=await cdp.send('Profiler.takePreciseCoverage');
  writeFileSync(`../开发进度/验证记录/${tag}-chapter${chapter}-coverage.json`,JSON.stringify(coverage));
  writeFileSync(`../开发进度/验证记录/${tag}-chapter${chapter}-snapshot.json`,JSON.stringify({startedAt,final:s,milestones,errors,failed}));
  await cdp.send('Profiler.stopPreciseCoverage');
  // Creator may register eval modules: V8 offsets refer to the executed script,
  // not the escaped containing file on disk. Resolve each coverage script ID.
  const guards=[];
  for(const main of coverage.result.filter(r=>r.url.includes('/assets/main/'))){
    const {scriptSource:source}=await cdp.send('Debugger.getScriptSource',{scriptId:main.scriptId});
    const ranges=main.functions.flatMap(f=>f.ranges.map(r=>({...r,function:f.functionName})));
    for(const m of source.matchAll(/this\.guardInk\.clear\(\)/g)){
      const r=ranges.filter(r=>r.startOffset<=m.index&&r.endOffset>m.index).sort((a,b)=>(a.endOffset-a.startOffset)-(b.endOffset-b.startOffset))[0];
      // An escaped registration string is data, not an executing function.
      if(r)guards.push({offset:m.index,function:r.function,count:r.count});
    }
  }
  assert.ok(guards.length,'Cocos HUD coverage missing');
  await capture('complete');
  const report={startedAt,chapter,version:expected,method:'Normal keyboard route, fixed browser clock, V8 precise block execution coverage of actual Cocos HUD. Counts measure work; not device FPS or wall-clock performance.',final:s,milestones,weapons:[...weapons],captures,cooldownChecks,guardGeometryBuilds:guards.reduce((n,r)=>n+r.count,0),guardSites:guards,errors,failed};
  writeFileSync(`../开发进度/验证记录/${tag}-chapter${chapter}-route.json`,JSON.stringify(report,null,2)+'\n');
  assert.equal(s.state,'complete');assert.ok(s.player.health>0);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log(JSON.stringify({chapter,state:s.state,health:s.player.health,time:s.time,guardGeometryBuilds:report.guardGeometryBuilds,captures:captures.length}));
} finally {await browser.close();}
