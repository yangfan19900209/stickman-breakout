import { emptyRecords, Records, validateRecords } from "../social/RunRecords";
export interface StorageApi { get(key: string): string | null; set(key: string, value: string): void }
/** Two complete slots; a failed primary write leaves the last valid slot intact. */
export class RecordStore {
  private last = "";
  constructor(private readonly api: StorageApi, private readonly key = "breakout.records.r1") {}
  load(): Records {
    for (const key of [this.key, this.key + ".backup"]) {
      try {
        const raw = this.api.get(key); if (!raw) continue;
        const records = validateRecords(JSON.parse(raw));
        if (records) { this.last = raw; return records; }
      } catch { /* Try the previous complete snapshot. */ }
    }
    return emptyRecords();
  }
  save(records: Records): boolean {
    try {
      if (this.last) this.api.set(this.key + ".backup", this.last);
      const raw = JSON.stringify(records); this.api.set(this.key, raw); this.last = raw; return true;
    } catch { return false; }
  }
}
