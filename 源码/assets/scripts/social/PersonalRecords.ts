import { RunClock } from "./RunClock";
import { Chapter, emptyRecords, Records, validateRecords, validTime } from "./RunRecords";
import { Invite } from "./InviteRoute";
export interface RecordPersistence { load(): Records; save(records: Records): boolean }
export class PersonalRecords {
  readonly clock: RunClock;
  records: Records;
  changed: () => void = () => {};
  saved = true;
  /** Display-only target; never serialized or merged into earned progress. */
  challenge?: Invite;
  assisted = false;
  result?: { chapter: Chapter; ms: number; best: boolean; valid: boolean; reason?: "revived" | "practice" | "clock" };
  private chapter?: Chapter;
  private accepted = false;
  private finished = false;
  private serial = 0;
  constructor(private readonly persistence: RecordPersistence, now: () => number, private readonly wall = () => Date.now()) {
    this.records = validateRecords(persistence.load()) ?? emptyRecords();
    this.clock = new RunClock(now);
  }
  begin(chapter: number, eligible: boolean): void {
    this.clock.reset(); this.result = undefined; this.finished = false; this.assisted = false; this.serial++;
    this.chapter = chapter === 1 || chapter === 2 ? chapter : undefined;
    this.accepted = eligible && !!this.chapter && (chapter === 1 || this.records.cleared >= chapter - 1);
    if (this.accepted && chapter > this.records.reached) { this.records.reached = chapter; this.persist(); }
  }
  active(value: boolean): void { if (this.chapter && !this.finished) this.clock.setActive(value); }
  markRevived(): void { if(this.chapter && !this.finished)this.assisted=true; }
  win(): void {
    if (!this.chapter || this.finished) return;
    this.finished = true;
    const ms = this.clock.stop(), valid = this.accepted && !this.assisted && this.clock.valid && validTime(ms);
    const old = this.records.times[this.chapter];
    this.result = { chapter: this.chapter, ms, best: valid && (!old || ms < old.ms), valid,
      reason: this.assisted ? "revived" : !this.accepted ? "practice" : !valid ? "clock" : undefined };
    if (!this.accepted) return;
    this.records.cleared = Math.max(this.records.cleared, this.chapter);
    if (this.result.best) this.records.times[this.chapter] = { ms, run: `${this.wall().toString(36)}-${this.serial}`, at: Math.floor(this.wall() / 1000) };
    this.persist();
  }
  cancel(): void { this.clock.setActive(false); this.chapter = undefined; this.finished = true; }
  private persist(): void { this.saved = this.persistence.save(this.records); this.changed(); }
  snapshot() { return { assisted: this.assisted, records: this.records, result: this.result, saved: this.saved, clockMs: this.clock.milliseconds, clockValid: this.clock.valid }; }
}
