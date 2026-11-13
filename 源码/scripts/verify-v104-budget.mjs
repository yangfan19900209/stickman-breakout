import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const json=f=>JSON.parse(readFileSync(f,'utf8'));
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
const root='build/wechatgame',files=walk(root),game=json(`${root}/game.json`);
const packages=game.subpackages.map(s=>{const prefix=`${root}/${s.root.replace(/\/$/,'')}/`;return {...s,bytes:files.filter(f=>f.startsWith(prefix)).reduce((n,f)=>n+statSync(f).size,0)};});
const total=files.reduce((n,f)=>n+statSync(f).size,0),main=total-packages.reduce((n,s)=>n+s.bytes,0);
const limits={main:4*1024*1024,total:20*1024*1024};
assert.ok(packages.some(s=>s.root.includes('level03')&&s.bytes>0),'Chapter 3 subpackage missing');
for(const chapter of ['landart','level02','level03'])assert.ok(packages.some(s=>s.root.includes(chapter)),chapter);
assert.ok(main<limits.main,`Main package ${main} exceeds local budget`);
assert.ok(total<limits.total,`Total ${total} exceeds local budget`);
assert.ok(existsSync('build/web-mobile/level03.html'));
const runtimeImages=walk('assets/level02').filter(f=>/\.(png|jpg|webp)$/.test(f)).map(file=>({file,bytes:statSync(file).size,sha256:sha(file)}));
assert.ok(runtimeImages.length>0);
const result={version:json('package.json').version,checkedAt:new Date().toISOString(),localBudget:limits,budgetSource:'Existing project budgets, not a claim about current platform policy',mainBytes:main,totalBytes:total,mainRemaining:limits.main-main,totalRemaining:limits.total-total,subpackages:packages,runtimeImages,runtimeImageBytes:runtimeImages.reduce((n,f)=>n+f.bytes,0),wechatRuntimeVerified:false,uploaded:false};
writeFileSync(`../开发进度/验证记录/v${result.version.replaceAll('.','')}-budget.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({mainBytes:main,totalBytes:total,mainRemaining:result.mainRemaining,totalRemaining:result.totalRemaining,runtimeImageBytes:result.runtimeImageBytes,subpackages:packages.map(s=>s.name??s.root)}));



