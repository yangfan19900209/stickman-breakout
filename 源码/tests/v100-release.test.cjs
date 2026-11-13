const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm');
const {ReleaseConfig,isChapterAvailable,nextCampaignChapter}=require('../.test-build/assets/scripts/core/ReleaseConfig.js');

test('release campaign ends after chapter two and rejects unavailable or malformed chapter requests',()=>{
 assert.equal(ReleaseConfig.version,require('../package.json').version);
 assert.equal(isChapterAvailable(1),true);assert.equal(isChapterAvailable(2),true);
 for(const chapter of [0,-1,3,4,2.5,NaN,Infinity])assert.equal(isChapterAvailable(chapter),false);
 assert.equal(nextCampaignChapter(1),2);
 for(const chapter of [0,2,3,4,NaN])assert.equal(nextCampaignChapter(chapter),undefined);
});

test('actual browser entry filter permits only the local chapter-two test link',()=>{
 const source=readFileSync('web-shell/browser-platform.js','utf8');
 const start=source.indexOf('    previewChapter() {'),end=source.indexOf('\n    viewport,',start);
 assert.ok(start>=0&&end>start);
 const method=source.slice(start,end).trim().replace(/,$/,'');
 for(const hostname of ['localhost','127.0.0.1','[::1]','example.com','localhost.example.com','127.0.0.1.example.com']){
  for(const search of ['', '?chapter=1','?chapter=2','?chapter=3','?chapter=03','?chapter=NaN']){
   const actual=vm.runInNewContext(`({${method}}).previewChapter()`,{location:{hostname,search},URLSearchParams});
   const expected=['localhost','127.0.0.1','[::1]'].includes(hostname)&&search==='?chapter=2'?2:undefined;
   assert.equal(actual,expected,hostname+search);
  }
 }
});
