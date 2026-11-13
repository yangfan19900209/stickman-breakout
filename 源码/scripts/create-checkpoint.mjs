import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import {workspaceRoot,sourceRoot} from './project-paths.mjs';

const id=process.argv[2];if(!/^[A-Z0-9-]+$/.test(id??''))throw Error('Provide a unique checkpoint ID');
const destination=path.join(workspaceRoot,'历史归档','体验锚点',id);
if(existsSync(destination))throw Error('Checkpoint exists; never overwrite');
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const relative=f=>path.relative(workspaceRoot,f).replaceAll('\\','/');
const source=['assets','scripts','tests','types','settings','build-config','build-templates','web-shell'].flatMap(d=>walk(path.join(sourceRoot,d)));
source.push(...['doc','素材','开发计划'].flatMap(d=>walk(path.join(workspaceRoot,d))));
source.push(...['源码/package.json','源码/package-lock.json','源码/tsconfig.json','源码/tsconfig.check.json','源码/playwright.config.ts','源码/README.md','AGENTS.md','README.md','.gitignore','.gitattributes','试玩.cmd','第二关测试.cmd','第三关测试.cmd','开发进度/当前进度.md'].map(f=>path.join(workspaceRoot,f)).filter(existsSync));
const groups=[['source',source],...['web-mobile','wechatgame'].map(p=>[p,walk(path.join(sourceRoot,'build',p))])];
mkdirSync(destination,{recursive:true});const archives=[];
for(const [name,files] of groups){
  const zip=new AdmZip();const entries=[...new Set(files)].sort().map(f=>{const b=readFileSync(f),file=relative(f);if(/\.(pem|key)$/i.test(file))throw Error('Private credential in snapshot');zip.addFile(file,b);return{file,bytes:b.length,sha256:sha(b)};});
  const target=path.join(destination,name+'.zip');zip.writeZip(target);const check=new AdmZip(target);
  for(const e of entries)if(sha(check.readFile(e.file))!==e.sha256)throw Error('Archive differs: '+e.file);
  archives.push({file:relative(target),bytes:statSync(target).size,sha256:sha(readFileSync(target)),entries});
}
const report={id,version:JSON.parse(readFileSync(path.join(sourceRoot,'package.json'),'utf8')).version,createdAt:new Date().toISOString(),scope:'Recoverable workspace snapshot; not user acceptance or device verification.',recovery:'Verify hashes and extract to a NEW EMPTY workspace; open its 源码 folder with Creator. Never overwrite the active workspace.',archives};
writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id,archives:archives.map(a=>({file:a.file,entries:a.entries.length}))}));
