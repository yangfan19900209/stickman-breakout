import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser',fullyParallel:false,workers:1,timeout:60000,
  reporter:[['list'],['json',{outputFile:'reports/browser-results.json'}]],
  use:{baseURL:'http://127.0.0.1:4190',viewport:{width:1280,height:720},hasTouch:true,headless:true,screenshot:'only-on-failure'},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4190',reuseExistingServer:true,timeout:15000},
});
