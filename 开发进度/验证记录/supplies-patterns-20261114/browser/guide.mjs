import {chromium} from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/supplies-patterns-20261114/browser/guide';mkdirSync(dir,{recursive:true});
const file='/Users/yangfan/Desktop/线条突围/stickman-breakout/开发计划/关卡/道具清单/两关配置说明-20261114.html';
const source=readFileSync(file,'utf8');assert.ok(!/X=|Y=|4590|6160|6020/.test(source),'reader copy should use landmarks');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],views=[];
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(file).href);const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,heads:document.querySelectorAll('h2').length,tables:document.querySelectorAll('table').length,rows:document.querySelectorAll('tbody tr').length,blankCells:[...document.querySelectorAll('td')].filter(e=>!e.textContent.trim()).length}));
  assert.equal(layout.width,layout.viewport);assert.equal(layout.heads,26);assert.equal(layout.blankCells,0);
  await page.screenshot({path:`${dir}/${viewport.width}-overview.png`});
  if(viewport.width===1280){await page.locator('h2').filter({hasText:'1-3 机械阵地'}).scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/land-mini-section.png`});}
  views.push({viewport,layout});await page.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(`${dir}/result.json`,JSON.stringify({passed:true,views,errors},null,2));console.log(JSON.stringify({passed:true,views}));
}finally{await browser.close();}
