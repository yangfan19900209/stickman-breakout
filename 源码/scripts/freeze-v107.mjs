import {readFileSync,readdirSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
const platform=process.argv[2];assert.ok(['web-mobile','wechatgame'].includes(platform));
const report='../开发进度/验证记录/v107-social-revive',release='../交付/版本/1.0.7-社交复活',destination=`${release}/${platform}`;
assert.equal(existsSync(destination),false,'Fixed build already exists; never overwrite.');
const inputs=JSON.parse(readFileSync(`${report}/build-inputs.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const isolated=process.argv.includes('--isolated'),project=isolated?`${report}/build-workspace`:'.';
for(const f of inputs.inputs)assert.equal(hash(readFileSync(`${project}/${f.file}`)),f.sha256,`Source changed: ${f.file}`);
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const source=`${project}/build/${platform}`,files=walk(source).map(p=>({file:p.slice(source.length+1),bytes:readFileSync(p).length,sha256:hash(readFileSync(p))}));
for(const f of files){const target=`${destination}/${f.file}`;mkdirSync(path.dirname(target),{recursive:true});copyFileSync(`${source}/${f.file}`,target);assert.equal(hash(readFileSync(target)),f.sha256);assert.equal(hash(readFileSync(`${source}/${f.file}`)),f.sha256);}
copyFileSync(isolated?`${report}/build-wechatgame-isolated.log`:`../开发进度/验证记录/构建日志/build-${platform}.log`,`${release}/build-${platform}.log`);
writeFileSync(`${release}/${platform}-files.json`,JSON.stringify({platform,version:inputs.version,frozenAt:new Date().toISOString(),inputSHA256:inputs.sha256,files},null,2)+'\n');
if(!existsSync(`${release}/构建输入.zip`)){
 const zip=new AdmZip();for(const f of inputs.inputs)zip.addFile(f.file,readFileSync(`${project}/${f.file}`));zip.addFile('build-inputs.json',readFileSync(`${report}/build-inputs.json`));zip.writeZip(`${release}/构建输入.zip`);
 const check=new AdmZip(`${release}/构建输入.zip`);for(const f of inputs.inputs)assert.equal(hash(check.readFile(f.file)),f.sha256);
}
console.log(JSON.stringify({platform,destination,files:files.length,inputSHA256:inputs.sha256}));
