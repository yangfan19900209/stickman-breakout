import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,cpSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';

const liveRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.resolve(process.argv[2]||path.join(liveRoot,'源码'));
const evidence=path.resolve(source,'../开发进度/验证记录');
const read=f=>JSON.parse(readFileSync(f,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const version=read(path.join(source,'package.json')).version,prefix='v'+version.replaceAll('.','');
const verified=read(path.join(evidence,'verification.json')),campaign=read(path.join(evidence,`${prefix}-ocean-campaign/result.json`));
assert.equal(verified.version,version);assert.ok(verified.passed);
assert.equal(campaign.version,version);assert.equal(campaign.final.state,'complete');assert.ok(campaign.final.player.health>0);
assert.deepEqual(campaign.errors,[]);assert.deepEqual(campaign.failed,[]);
assert.ok(Date.parse(campaign.startedAt)>verified.web.entryTime,'Campaign must match the final build');
const destination=path.join(liveRoot,'交付/版本',version);assert.ok(!existsSync(destination),'Fixed versions cannot be overwritten');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const sourceFiles=walk(path.join(source,'assets/scripts')).filter(f=>f.endsWith('.ts')).sort();
const sourceHash=createHash('sha256');for(const file of sourceFiles)sourceHash.update(path.relative(source,file).replaceAll('\\','/')).update(readFileSync(file));
assert.equal(sourceHash.digest('hex'),verified.sourceSHA256,'Source changed after validation');
mkdirSync(destination,{recursive:true});cpSync(path.join(source,'build/wechatgame'),path.join(destination,'wechatgame'),{recursive:true,errorOnExist:true});
cpSync(path.join(source,'build/web-mobile'),path.join(destination,'web-mobile'),{recursive:true,errorOnExist:true});
const packages=[];
for(const [platform,label] of [['wechatgame','微信小游戏'],['web-mobile','Web']]){
 const base=path.join(destination,platform),z=new AdmZip(),records=[];
 for(const f of walk(base)){const file=path.relative(base,f).replaceAll('\\','/'),bytes=readFileSync(f);z.addFile(file,bytes);records.push({file,bytes:bytes.length,sha256:sha(bytes)});}
 const filename=`线条突围-${label}-${version}.zip`,file=path.join(destination,filename);z.writeZip(file);
 const reread=new AdmZip(file);assert.equal(reread.getEntryCount(),records.length);
 for(const r of records)assert.equal(sha(reread.readFile(r.file)),r.sha256);
 packages.push({platform,file:filename,bytes:statSync(file).size,sha256:sha(readFileSync(file)),files:records});
}
const notes=readFileSync(path.join(liveRoot,'交付/更新说明',`${version}-update.txt`),'utf8');writeFileSync(path.join(destination,'更新说明.txt'),notes);
writeFileSync(path.join(destination,'导入说明.txt'),`线条突围 ${version} 固定本地包\n\n微信开发者工具选择本目录的 wechatgame 文件夹。\n浏览器试玩：双击“试玩第二关.cmd”，保持服务运行。\n本版本由独立源码副本构建，包含第二关五项修复；共享源码中的后续复活、选关及推荐功能由对应任务继续交付。\n原始源码及构建证据保留在“历史归档/交付构建/${version}”。\n本地构建和浏览器验证通过；微信开发者工具与手机真机尚未验证。未上传、送审或发布。\n`);
const preview=`const http=require('http'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');\nconst root=path.join(__dirname,'web-mobile'),port=4195;\nconst mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.webmanifest':'application/manifest+json'};\nconst open=()=>spawn('powershell.exe',['-NoProfile','-Command',\"Start-Process 'http://127.0.0.1:\"+port+\"/level02.html'\"],{windowsHide:true,stdio:'ignore'});\nconst server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,decodeURIComponent(url.pathname).replace(/^\\//,'')||'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));}catch{res.writeHead(400);res.end();}});\nserver.on('error',e=>{if(e.code==='EADDRINUSE'){console.log('Port 4195 is occupied. Close the previous preview before retrying.');process.exitCode=1;}else throw e;});\nserver.listen(port,'127.0.0.1',()=>{console.log('Fixed ${version} preview: http://127.0.0.1:'+port+'/level02.html');if(process.argv.includes('--open'))open();});\n`;
writeFileSync(path.join(destination,'preview.cjs'),preview);
writeFileSync(path.join(destination,'试玩第二关.cmd'),'@echo off\r\ncd /d "%~dp0"\r\nnode preview.cjs --open\r\nif errorlevel 1 pause\r\n');
const finalEvidence=path.join(liveRoot,'开发进度/验证记录',`${prefix}-final`);assert.ok(!existsSync(finalEvidence));
cpSync(evidence,finalEvidence,{recursive:true,errorOnExist:true});
writeFileSync(path.join(destination,'verification.json'),JSON.stringify(verified,null,2)+'\n');
const manifest={version,createdAt:new Date().toISOString(),source:path.relative(liveRoot,source).replaceAll('\\','/'),sourceSHA256:verified.sourceSHA256,verification:`开发进度/验证记录/${prefix}-final/verification.json`,chapterAvailability:[1,2],thirdChapterOpen:false,uploaded:false,published:false,wechatDeviceVerified:false,packages};
writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({destination,sourceSHA256:manifest.sourceSHA256,packages:packages.map(({files,...p})=>({...p,verifiedFiles:files.length}))},null,2));
