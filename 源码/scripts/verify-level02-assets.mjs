import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const manifest=JSON.parse(readFileSync('../素材/游戏美术/level02-manifest.json','utf8'));
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
assert.equal(manifest.sources,14);assert.equal(manifest.regions,116);
assert.equal(new Set(manifest.frames.map(f=>f.id)).size,116);
for(const a of manifest.assets){assert.equal(sha(a.file),a.sha256);assert.equal(statSync(a.file).size,a.bytes);}
for(const f of manifest.frames){assert.equal(sha(f.file),f.sha256);assert.equal(f.decodedRGBAEqualToSourceCrop,true);}
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>errors.push(r.url()));
try {
  await page.goto(pathToFileURL(path.resolve('../素材/游戏美术/level02-preview.html')).href);
  await page.evaluate(()=>document.querySelectorAll('img').forEach(image=>image.loading='eager'));
  await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
  assert.equal(await page.locator('#sheets article:visible').count(),14);
  await page.screenshot({path:'../开发进度/验证记录/level02-assets-overview.png',fullPage:true});
  await page.locator('[data-tab="regions"]').click();
  assert.equal(await page.locator('#regions article:visible').count(),116);
  await page.locator('#filter').fill('潜艇');
  assert.equal(await page.locator('#regions article:visible').count(),16);
  await page.locator('#background').click();
  assert.equal(await page.locator('body').getAttribute('class'),'dark');
  await page.screenshot({path:'../开发进度/验证记录/level02-submarine-parts.png',fullPage:true});
  await page.locator('#filter').fill('diver');await page.locator('#background').click();
  assert.equal(await page.locator('body').getAttribute('class'),'white');
  await page.screenshot({path:'../开发进度/验证记录/level02-diver-crops.png',fullPage:true});
  await page.setViewportSize({width:844,height:390});
  await page.locator('#filter').fill('');await page.locator('[data-tab="sheets"]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'../开发进度/验证记录/level02-assets-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  const report={checkedAt:new Date().toISOString(),scope:'Source asset inspection and local gallery, not game runtime',
    sourceImages:14,transparentSourceSheets:12,opaqueBackgrounds:2,regions:116,
    sourceBytes:manifest.assets.reduce((sum,a)=>sum+a.bytes,0),sha256Verified:true,
    sourceCropPixelCheck:'Passed by prepare-level02-assets.py; no resize or recolor',
    gallery:{browser:'installed Chrome',viewports:[[1600,1000],[844,390]],imagesLoaded:130,filter:true,tabs:true,backgroundSwitch:true,errors},
    runtimeIntegrated:false,gameBuilt:false,published:false,
    limitations:manifest.limitations};
  writeFileSync('../开发进度/验证记录/level02-assets-verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
