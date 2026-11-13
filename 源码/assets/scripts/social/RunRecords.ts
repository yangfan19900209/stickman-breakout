/** Pure protocol, also compiled into the isolated WeChat open-data package. */
export const RULE = "r1";
export const RECORD_KEYS = ["sb_p_r1", "sb_t_r1_l1", "sb_t_r1_l2"] as const;
export type Chapter = 1 | 2;
export type Board = "progress" | "level1" | "level2";
export interface BestRun { ms: number; run: string; at: number }
export interface Records { v: 1; rule: string; reached: number; cleared: number; times: Partial<Record<Chapter, BestRun>> }
export const emptyRecords = (): Records => ({ v: 1, rule: RULE, reached: 0, cleared: 0, times: {} });
export function validTime(ms: unknown): ms is number {
  return Number.isSafeInteger(ms) && (ms as number) > 0 && (ms as number) <= 86400000;
}
export function validateRecords(value: unknown): Records | undefined {
  if (!value || typeof value !== "object") return;
  const r = value as Records;
  if (r.v !== 1 || r.rule !== RULE || !Number.isInteger(r.reached) || r.reached < 0 || r.reached > 2 ||
      !Number.isInteger(r.cleared) || r.cleared < 0 || r.cleared > r.reached || !r.times || typeof r.times !== "object") return;
  const out = emptyRecords(); out.reached = r.reached; out.cleared = r.cleared;
  for (const chapter of [1, 2] as Chapter[]) {
    const t = r.times[chapter]; if (t === undefined) continue;
    if (!t || typeof t !== "object" || !validTime(t.ms) || typeof t.run !== "string" || t.run.length < 1 || t.run.length > 80 ||
        !Number.isSafeInteger(t.at) || t.at < 0 || chapter > r.cleared) return;
    out.times[chapter] = { ms: t.ms, run: t.run, at: t.at };
  }
  return out;
}
export function mergeRecords(a: Records, b: Records): Records {
  const out = emptyRecords();
  out.reached = Math.max(a.reached, b.reached); out.cleared = Math.max(a.cleared, b.cleared);
  for (const c of [1, 2] as Chapter[]) {
    const x = a.times[c], y = b.times[c];
    const best = !x ? y : !y ? x : x.ms <= y.ms ? x : y;
    if (best) out.times[c] = { ...best };
  }
  return out;
}
export function cloudValues(r: Records): { key: string; value: string }[] {
  const values: { key: string; value: string }[] = [{ key: RECORD_KEYS[0], value: JSON.stringify({ v: 1, rule: RULE, reached: r.reached, cleared: r.cleared }) }];
  for (const c of [1, 2] as Chapter[]) if (r.times[c]) values.push({ key: RECORD_KEYS[c], value: JSON.stringify({ v: 1, rule: RULE, ...r.times[c] }) });
  return values;
}
export function fromCloud(list: { key: string; value: string }[]): Records {
  const r = emptyRecords();
  for (const kv of list ?? []) {
    try {
      const v = JSON.parse(kv.value);
      if (v.v !== 1 || v.rule !== RULE) continue;
      if (kv.key === RECORD_KEYS[0]) {
        const p = validateRecords({ ...v, times: {} });
        if (p) { r.reached = p.reached; r.cleared = p.cleared; }
      }
    } catch { /* One corrupt key must not hide the rest of the board. */ }
  }
  for (const c of [1, 2] as Chapter[]) {
    try {
      const kv = list.find(k => k.key === RECORD_KEYS[c]); if (!kv) continue;
      const v = JSON.parse(kv.value);
      if (v.v !== 1 || v.rule !== RULE) continue;
      const candidate = validateRecords({ ...r, times: { [c]: v } });
      if (candidate?.times[c]) r.times[c] = candidate.times[c];
    } catch { /* Invalid time is absent, never zero. */ }
  }
  return r;
}
export function formatTime(ms?: number): string { return validTime(ms) ? `${(ms / 1000).toFixed(1)} 秒` : "暂无通关纪录"; }
export function progressText(r: Records): string {
  if (r.cleared === 2) return "已通关 2 关 · 全部完成";
  if (!r.reached) return "还未开始突围";
  if (r.cleared === r.reached) return `已通第 ${r.cleared} 关`;
  return `闯至第 ${r.reached} 关 · 已通 ${r.cleared} 关`;
}
export function compareRecords(a: Records, b: Records, board: Board): number {
  if (board === "progress") return b.cleared - a.cleared || b.reached - a.reached;
  const c = board === "level1" ? 1 : 2;
  return (a.times[c]?.ms ?? Infinity) - (b.times[c]?.ms ?? Infinity) || 0;
}
