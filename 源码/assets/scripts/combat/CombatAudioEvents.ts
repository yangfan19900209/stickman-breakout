export type CombatSound = "enemy-shot" | "boss-shot" | "rocket" | "cannon"
  | "beam" | "slam" | "charge" | "enemy-melee" | "enemy-sonar" | "rocket-blast";
export interface CombatAudioEvent { sound: CombatSound; x: number; y: number }

/** Actual attacks survive multiple simulation steps and even same-step projectile removal.
 * The audio bridge drains once per frame, including while silent; never retain a backlog. */
export class CombatAudioEvents {
  private pending: CombatAudioEvent[] = [];
  emit(sound: CombatSound, x: number, y: number): void {
    if (this.pending.length === 64) this.pending.shift();
    this.pending.push({ sound, x, y });
  }
  drain(): CombatAudioEvent[] {
    if (!this.pending.length) return this.pending;
    const events = this.pending;
    this.pending = [];
    return events;
  }
  reset(): void { this.pending.length = 0; }
}
