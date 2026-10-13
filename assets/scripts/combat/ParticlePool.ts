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
    }),
  );
  dropped = 0;
  private seed = 19283;
  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  reset(): void {
    for (const p of this.items) p.active = false;
    this.dropped = 0;
    this.seed = 19283;
  }
  burst(x: number, y: number, count = 8): void {
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
      });
      p.maxLife = p.life;
    }
  }
  update(dt: number): void {
    for (const p of this.items)
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.vy -= 500 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
  }
}
