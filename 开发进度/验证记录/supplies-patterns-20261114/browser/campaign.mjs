import {chromium} from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {OceanBrain}=createRequire(import.meta.url)('../../../../源码/scripts/ocean-brain.cjs');
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const visual=process.argv.includes('--visual'),desktop=process.argv.includes('--desktop');
const prefix=`v${version.replaceAll('.','')}-ocean-${visual?'visual':desktop?'desktop':'campaign'}`;
const dir=`../开发进度/验证记录/supplies-patterns-20261114/browser/${visual?'sonar':'campaign'}`;mkdirSync(dir,{recursive:true});
const viewport=desktop?{width:1280,height:720}:{width:852,height:393};
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport,deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'});
const startedAt=new Date().toISOString(),errors=[],failed=[],captures=[],held=new Set(),seen=new Set();
const frames={harpoon:new Set(),sonar:new Set(),torpedo:new Set()},fishFrames=new Set(),bossShots=new Set(),damage=[],milestones=[],reticles=[],sprites=[];
let s,zone='',lastProgress=0,visualStage=0;
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
async function capture(name){if(seen.has(name))return;seen.add(name);const file=`${dir}/${name}.png`;await page.screenshot({path:file});captures.push(file);}
async function actualPlayer(){return page.evaluate(async()=>{
 const cc=await System.import('cc'),snapshot=globalThis.__BREAKOUT__.snapshot(),list=[];
 function visit(n){if(!n.activeInHierarchy)return;const sp=n.getComponent(cc.Sprite),f=sp?.spriteFrame;
  if(f?.name===snapshot.oceanArt?.playerFrame){const t=n.getComponent(cc.UITransform);list.push({frame:f.name,position:[n.position.x,n.position.y],scale:[n.scale.x,n.scale.y],angle:n.angle,size:[t.width,t.height],anchor:[t.anchorX,t.anchorY],rect:[f.rect.x,f.rect.y,f.rect.width,f.rect.height],texture:[f.texture.width,f.texture.height]});}
  for(const c of n.children)visit(c);
 }visit(cc.director.getScene());return list;
});}
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url()+':'+r.status());});
try{
 await page.clock.install({time:new Date('2026-11-13T08:00:00Z')});
 await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:4190')+'/level02.html');
 await page.waitForFunction(()=>globalThis.__BREAKOUT__?.snapshot().chapter===2&&globalThis.__BREAKOUT__.snapshot().oceanArt.loaded);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 assert.equal(await page.evaluate(()=>globalThis.__BREAKOUT__.version),version);
 await page.locator('#GameCanvas').focus();s=await read();const brain=new OceanBrain();
 for(let n=0;n<6500&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
  let f=brain.next(s);
  if(visual&&s.stage==='swimming'){
   if(visualStage===0){f={axis:s.player.x<1130?1:0,vertical:s.player.y>102?-1:0,shoot:true};if(s.weapon==='sonar')visualStage=1;}
   if(visualStage===1){f={axis:1,vertical:s.player.y<330?1:0,shoot:true};if(s.player.x>1840)visualStage=2;}
  }
  const keys=new Set();if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');
  if(f.vertical>0)keys.add('KeyW');if(f.vertical<0)keys.add('KeyS');if(f.shoot)keys.add('KeyJ');if(f.jump)keys.add('Space');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  const before=s;await page.clock.runFor(50);s=await read();
  if(s.zone!==zone){zone=s.zone;milestones.push({zone,time:s.time,x:s.player.x,hp:s.player.health});console.log(JSON.stringify(milestones.at(-1)));}
  if(s.player.health<before.player.health)damage.push({time:s.time,x:s.player.x,y:s.player.y,hp:s.player.health,boss:s.boss.attack,mini:s.miniBoss.attack});
  if(f.shoot&&Math.hypot(s.player.vx,s.player.vy)>25){
   const frame=s.oceanArt.playerFrame,weapon=/diver\.(harpoon|sonar|torpedo)\.swim/.exec(frame)?.[1];
   if(weapon&&!frames[weapon].has(frame)){frames[weapon].add(frame);sprites.push({time:s.time,muzzle:s.oceanArt.muzzle,actual:await actualPlayer()});await capture('moving-fire-'+frame);}
  }
  for(const e of s.oceanArt.enemies){if(e.frame?.startsWith('fish.predator.')){
   const real=s.enemies.find(f=>f.id===e.id);if(real.x>s.cameraX+40&&real.x<s.cameraX+s.display.worldVisibleWidth-40&&!fishFrames.has(e.frame)){
    fishFrames.add(e.frame);await capture(e.frame);
   }
  }}
  const aim=s.oceanArt.aim;
  if(aim?.locked){const screenRadius=aim.radius*s.display.combatZoom;
   if(screenRadius>45&&!seen.has('reticle-acquire')){reticles.push({phase:'acquire',...aim,screenRadius});await capture('reticle-acquire');}
   if(aim.acquireProgress===1&&!seen.has('reticle-locked')){reticles.push({phase:'locked',...aim,screenRadius});await capture('reticle-locked');}
  }
  for(const shot of s.oceanArt.projectiles.filter(p=>p.kind==='sonar')){assert.equal(shot.width,shot.fullWidth);assert.equal(shot.width,shot.height);await capture('sonar-rings-'+shot.owner+'-'+shot.tier);}
  if(s.miniBoss.active&&s.miniBoss.hp>0){
   await capture('mini-'+s.miniBoss.mode+'-'+s.miniBoss.attack);
   if(Math.abs(s.miniBoss.x-s.miniBoss.homeX)>430)await capture('mini-beyond-old-boundary');
  }
  if(s.boss.active&&s.boss.hp>0){
   if(['tell','fire'].includes(s.boss.mode))await capture('boss-'+s.boss.mode+'-'+s.boss.attack);
   for(const shot of s.oceanArt.projectiles.filter(p=>p.owner==='enemy'&&p.tier==='boss')){bossShots.add(shot.kind);assert.notEqual(shot.kind,'harpoon');await capture('boss-ammunition-'+shot.kind);}
  }
  if(s.time>lastProgress+15){lastProgress=s.time;writeFileSync(`${dir}/progress.json`,JSON.stringify({time:s.time,player:s.player,mini:s.miniBoss.hp,boss:s.boss.hp,frames:Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,[...v]]))}));}
  if(visual&&visualStage===2&&frames.sonar.size>=4)break;
 }
 for(const k of held)await page.keyboard.up(k);
 await capture('result');
 const report={version,startedAt,finishedAt:new Date().toISOString(),method:'Real browser keyboard movement/shoot/grenade; read-only snapshots; controlled animation clock; original health/ammo/collisions, no teleports or state edits.',viewport,visualOnly:visual,milestones,damage,frames:Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,[...v]])),fishFrames:[...fishFrames],bossShots:[...bossShots],reticles,sprites,captures,errors,failed,final:s};
 writeFileSync(`${dir}/result.json`,JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 if(visual){assert.equal(frames.sonar.size,4);assert.ok(s.shots>3);}
 else {assert.equal(s.state,'complete');assert.equal(s.miniBoss.hp,0);assert.equal(s.boss.hp,0);assert.ok(s.player.health>0);assert.ok(bossShots.has('bomb'));assert.ok(frames.harpoon.size>=2);}
 console.log(JSON.stringify({passed:true,time:s.time,hp:s.player.health,frames:report.frames,bossShots:report.bossShots}));
}catch(error){await capture('failure');writeFileSync(`${dir}/failure.json`,JSON.stringify({error:String(error),errors,failed,damage,final:s},null,2));throw error;}
finally{await browser.close();}
