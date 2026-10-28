import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const logic=json('reports/logic-results.json'), browser=json('reports/v055-browser-results.json'), play=json('reports/v055-browser.json');
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=87);
assert.equal(browser.stats.unexpected,0);assert.ok(browser.stats.expected>=8);
assert.ok(play.returned);assert.ok(play.snapshot.player.x>3900);assert.equal(play.errors.length,0);
for(const id of ['rifle','shotgun','rocket'])assert.ok(play.captures.some(c=>c.weapon===id));
const manifest=json('art/v055-manifest.json');
assert.equal(createHash('sha256').update(readFileSync(manifest.source.file)).digest('hex'),manifest.source.sha256);
const list=folder=>readdirSync(folder).flatMap(name=>{const p=path.join(folder,name);return statSync(p).isDirectory()?list(p):[p];});
const source=list('assets/scripts').filter(p=>p.endsWith('.ts'));
for(const file of source){
 const tree=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const visit=n=>{assert.ok(!(ts.isIdentifier(n)&&['window','document','localStorage'].includes(n.text)),`browser API in ${file}`);ts.forEachChild(n,visit);};visit(tree);
}
const build=folder=>{const files=list(folder);return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0)};};
const web=build('build/web-mobile'),wechat=build('build/wechatgame');
assert.ok(wechat.bytes<4*1024*1024);
assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
assert.equal(json('build/wechatgame/project.config.json').appid,'wx7d2aae02691fc088');
const hash=createHash('sha256');for(const file of source.sort())hash.update(file).update(readFileSync(file));
const report={version:json('package.json').version,date:'2026-10-19',creator:'3.8.8',typecheck:'passed',sourceSHA256:hash.digest('hex'),
 logicTests:logic,browserTests:{passed:browser.stats.expected,failed:browser.stats.unexpected,report:'reports/v055-browser-results.json',scope:'First two zones, real pickups/ammo fallback, weapon art, crouch/run/air fire, knife/tracking and mobile analog/multitouch.'},
 currentBrowserPlay:{x:play.snapshot.player.x,health:play.snapshot.player.health,captures:play.captures,returnedToRifle:play.returned,errors:play.errors},
 web:{...web,creatorExitCode:36},wechat:{...wechat,creatorExitCode:36,runtimeVerified:false,uploaded:false},
 resources:{newSource:manifest.source,additionalCuts:manifest.frames.length,additionalTextureBytes:manifest.textureBytes,additionalTextureSize:manifest.textureSize},
 notes:['Only map rendering and player weapon composition changed; collision geometry is unchanged. Gun sockets were aligned to the actual replacement grip.',
 'Current 87 logic tests include complete campaign victory. Full real-keyboard browser campaign belongs to V0.5.4 and is retained separately in reports/v054-verification.json; it was not rerun for this visual pass.',
 'Ground and platform source pixels repeat at fixed uniform scales; partial end pieces crop UVs. No regenerated character/terrain artwork.',
 'Body cleanup uses deterministic masks and retained source hand pixels. Dedicated replacement-weapon arm poses at extreme aiming angles remain unavailable.'],
 unverified:['WeChat developer tools runtime','Android/iOS/WeChat physical devices','Sustained real-device 60FPS']};
writeFileSync('reports/verification.json',JSON.stringify(report,null,2));
writeFileSync('reports/v055-verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
