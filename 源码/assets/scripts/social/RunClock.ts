/** Milliseconds from an injected monotonic source. Simulation dt is never used. */
export class RunClock {
  private stamp = 0;
  private running = false;
  private total = 0;
  valid = true;
  constructor(private readonly now: () => number) {}
  reset(): void { this.total = 0; this.running = false; this.valid = true; this.stamp = this.now(); }
  setActive(active: boolean): void {
    const now = this.now(), delta = now - this.stamp;
    if (!Number.isFinite(now) || !Number.isFinite(delta) || delta < 0) this.valid = false;
    else if (this.running) this.total += delta;
    this.stamp = now; this.running = active;
  }
  stop(): number { this.setActive(false); return Math.round(this.total); }
  get milliseconds(): number { return Math.round(this.total); }
}
