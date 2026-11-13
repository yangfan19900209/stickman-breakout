import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const [previous,next]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(previous)||!/^[a-z0-9-]+$/.test(next))throw Error('Pass previous and current verification tags');
const baseline=JSON.parse(fs.readFileSync(`../开发进度/验证记录/${previous}-skill-verification.json`,'utf8'));
const skillId=baseline.skillId??path.basename(baseline.installedPath);
const source='../doc/skills/'+skillId;
const dest=baseline.installedPath,changed=[];
const mergePath=`../开发进度/验证记录/${next}-skill-merge.json`;
const reviewed=fs.existsSync(mergePath)?JSON.parse(fs.readFileSync(mergePath,'utf8')).files:[];
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const names=d=>walk(d).map(f=>path.relative(d,f).replaceAll('\\','/')).sort();
const expected=baseline.files.map(f=>f.file).sort();
if(JSON.stringify(names(source))!==JSON.stringify(expected)||JSON.stringify(names(dest))!==JSON.stringify(expected))
  throw Error('Skill file set changed; inspect and merge before synchronization');
// Validate the entire installed set BEFORE writing any of it.
for(const old of baseline.files){
  const from=path.join(source,old.file),to=path.join(dest,old.file),current=sha(to);
  if(current!==old.sha256&&current!==sha(from)&&!reviewed.some(f=>f.file===old.file&&f.sha256===current))
    throw Error('Independent installed skill edits: '+old.file);
}
for(const old of baseline.files){
  const from=path.join(source,old.file),to=path.join(dest,old.file);
  if(sha(from)!==sha(to)){fs.copyFileSync(from,to);changed.push(old.file);}
}
const files=baseline.files.map(({file})=>{
  const a=sha(path.join(source,file)),b=sha(path.join(dest,file));
  if(a!==b)throw Error('Skill mismatch: '+file);return {file,sha256:a};
});
const report={checkedAt:new Date().toISOString(),skillId,projectPath:source,officialQuickValidator:'Not executed by this sync tool; format validation must be recorded separately',filesMatched:files.length,installedPath:dest,changedFiles:changed,mergedInstalledFiles:reviewed.map(f=>f.file),files};
fs.writeFileSync(`../开发进度/验证记录/${next}-skill-verification.json`,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(`../开发进度/验证记录/${skillId}-skill-verification.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({filesMatched:files.length,changed},null,2));
