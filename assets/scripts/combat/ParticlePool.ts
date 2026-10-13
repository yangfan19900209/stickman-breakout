import { GameConfig as C } from "../core/GameConfig";
export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "spark" | "wood" | "shell" | "smoke" | "dust";
  gravity: number;
  spin: number;
}
export class ParticlePool {
  readonly items: Particle[] = Array.from(
    { length: C.pools.particles },
    () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      kind: "spark",
      gravity: 500,
      spin: 0,
    }),
  );
  dropped = 0;
  peak = 0;
  private seed = 19283;
  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  reset(): void {
    for (const p of this.items) p.active = false;
    this.dropped = 0;
    this.peak = 0;
    this.seed = 19283;
  }
  burst(
    x: number,
    y: number,
    count = 8,
    kind: Particle["kind"] = "spark",
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.items.find((p) => !p.active);
      if (!p) {
        this.dropped++;
        break;
      }
      const a = this.random() * Math.PI * 2,
        speed = 90 + this.random() * 180;
      Object.assign(p, {
        active: true,
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.18 + this.random() * 0.2,
        size: 1 + this.random() * 2,
        kind,
        gravity: kind === "smoke" ? -30 : 500,
        spin: this.random() * 6,
      });
      p.maxLife = p.life;
      this.peak = Math.max(
        this.peak,
        this.items.reduce((n, p) => n + Number(p.active), 0),
      );
    }
  }
  emit(x: number, y: number, kind: Particle["kind"], vx = 0, vy = 0): void {
    const p = this.items.find((p) => !p.active);
    if (!p) {
      this.dropped++;
      return;
    }
    const life = kind === "shell" ? 1 : kind === "smoke" ? 0.6 : 0.3;
    Object.assign(p, {
      active: true,
      x,
      y,
      vx,
      vy,
      kind,
      life,
      maxLife: life,
      size: kind === "smoke" ? 7 : kind === "dust" ? 4 : 2,
      gravity: kind === "smoke" ? -25 : 650,
      spin: this.random() * 6,
    });
    this.peak = Math.max(
      this.peak,
      this.items.reduce((n, p) => n + Number(p.active), 0),
    );
  }
  update(dt: number): void {
    for (const p of this.items)
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.vy -= p.gravity * dt;
        p.spin += dt * 6;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
  }
}
