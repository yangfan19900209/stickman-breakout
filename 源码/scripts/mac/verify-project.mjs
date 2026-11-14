import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {sourceRoot,workspaceRoot,reportsRoot} from '../project-paths.mjs';
import {partitionMissingArtifacts} from './artifact-links.mjs';

const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const relative=f=>path.relative(workspaceRoot,f).replaceAll('\\','/');
const required=['源码/package.json','源码/assets/scenes/Main.scene','素材/README.md','运营/README.md','开发计划/README.md','开发进度/README.md','交付/README.md','doc/skills/yangfan-game-development/SKILL.md'];
for(const f of required)assert.ok(fs.existsSync(path.join(workspaceRoot,f)),f);
const files=walk(path.join(sourceRoot,'assets'));const uuid=new Map();
for(const f of files.filter(f=>f.endsWith('.meta'))){
  assert.ok(fs.existsSync(f.slice(0,-5)),'Orphan meta: '+relative(f));
  const m=JSON.parse(fs.readFileSync(f,'utf8'));if(m.uuid){assert.ok(!uuid.has(m.uuid),'Duplicate UUID: '+m.uuid);uuid.set(m.uuid,f);}
}
const imports=[];
for(const f of files.filter(f=>f.endsWith('.ts'))){
  for(const m of fs.readFileSync(f,'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)){
    const target=path.resolve(path.dirname(f),m[1]);assert.ok(fs.existsSync(target+'.ts')||fs.existsSync(target+'/index.ts'),'Missing import: '+relative(f)+' -> '+m[1]);imports.push([relative(f),m[1]]);
  }
}
const docDirs=['doc','开发计划','素材/说明','素材/游戏美术','开发进度/迭代记录'];
const docs=[...docDirs.flatMap(d=>walk(path.join(workspaceRoot,d))),...['README.md','AGENTS.md','源码/README.md','素材/README.md','运营/README.md','开发计划/README.md','开发进度/README.md','开发进度/当前进度.md','交付/README.md','历史归档/README.md'].map(f=>path.join(workspaceRoot,f))].filter(f=>f.endsWith('.md'));
const missing=[];let links=0;
for(const f of docs){const text=fs.readFileSync(f,'utf8');for(const m of text.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)){
  const url=m[1].replace(/^<|>$/g,'');if(/^(?:https?:|mailto:|#|skill:|plugin:)/.test(url))continue;
  const target=decodeURIComponent(url.split('#')[0]);if(!target)continue;links++;
  if(!fs.existsSync(path.resolve(path.dirname(f),target)))missing.push({file:relative(f),target});
}}
let htmlReferences=0;
for(const f of ['素材/游戏美术','开发计划/原型'].flatMap(d=>walk(path.join(workspaceRoot,d))).filter(f=>f.endsWith('.html'))){
  const text=fs.readFileSync(f,'utf8');
  const urls=[...text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);
  urls.push(...[...text.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)].map(m=>m[1]));
  for(const url of urls){if(/^(https?:|data:|#|javascript:|\$)/.test(url))continue;htmlReferences++;const target=decodeURIComponent(url.split('#')[0]);if(!fs.existsSync(path.resolve(path.dirname(f),target)))missing.push({file:relative(f),target});}
}
const sourceOnly=process.argv.includes('--source-only');
const classified=sourceOnly?partitionMissingArtifacts(missing,workspaceRoot):{missing,unavailableArtifacts:[]};
const report={checkedAt:new Date().toISOString(),mode:sourceOnly?'source-only':'full-archive',sourceRoot:relative(sourceRoot),uuidCount:uuid.size,imports:imports.length,documents:docs.length,links,htmlReferences,...classified};
fs.mkdirSync(path.join(reportsRoot,'mac'),{recursive:true});fs.writeFileSync(path.join(reportsRoot,'mac','project-structure.json'),JSON.stringify(report,null,2)+'\n');
assert.deepEqual(report.missing,[],'Broken local documentation links');console.log(JSON.stringify({...report,unavailableArtifacts:report.unavailableArtifacts.length},null,2));
