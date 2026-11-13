import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/v107-social-revive';mkdirSync(dir,{recursive:true});
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=['assets','build-config','build-templates','web-shell','settings'].flatMap(walk).concat(['package.json','package-lock.json','scripts/prepare-web-shell.mjs','scripts/prepare-wechat-social.mjs']).sort();
const inputs=files.map(file=>({file,sha256:sha(readFileSync(file))}));
const result={version:JSON.parse(readFileSync('package.json','utf8')).version,createdAt:new Date().toISOString(),sha256:sha(JSON.stringify(inputs)),inputs};
if(process.argv.includes('--verify')){
 const before=JSON.parse(readFileSync(`${dir}/build-inputs.json`,'utf8'));
 assert.equal(result.sha256,before.sha256,'Build inputs changed during compilation; rebuild before freezing the release.');
 console.log(`Build inputs unchanged: ${result.sha256}`);
}else {writeFileSync(`${dir}/build-inputs.json`,JSON.stringify(result,null,2)+'\n');console.log(`Build input snapshot: ${result.sha256}`);}
