/* Runs only inside WeChat's isolated open-data domain. */
const R = require('./records.js');
function createStore(api, changed, schedule = setTimeout, cancel = clearTimeout) {
  let pending = R.emptyRecords(), own = R.emptyRecords(), busy = false, timer, attempt = 0, status = '未同步';
  const publish = () => changed({ own, status });
  function flush() {
    if (busy) return;
    if (timer) { cancel(timer); timer = undefined; }
    busy = true; status = '正在同步个人纪录'; publish();
    const fail = () => {
      busy = false; status = '同步失败，个人纪录仍保存在本机'; publish();
      if (attempt < 3) timer = schedule(flush, [2000, 5000, 15000][attempt++]);
    };
    // Never write from a stale/empty local snapshot before reading existing cloud bests.
    try { api.getUserCloudStorage({ keyList: [...R.RECORD_KEYS], success(result) {
      own = R.mergeRecords(R.fromCloud(result.KVDataList || []), pending);
      const snapshot = JSON.stringify(pending), merged = own;
      try { api.setUserCloudStorage({ KVDataList: R.cloudValues(merged), success() {
        busy = false; attempt = 0; status = '云端纪录已同步'; publish();
        if (snapshot !== JSON.stringify(pending)) flush();
      }, fail }); } catch { fail(); }
    }, fail }); } catch { fail(); }
  }
  return {
    submit(value) {
      const valid = R.validateRecords(value); if (!valid) return;
      pending = R.mergeRecords(pending, valid); attempt = 0; flush();
    },
    retry() { attempt = 0; flush(); },
    current() { return { own, status, busy }; },
  };
}
module.exports = { createStore };
