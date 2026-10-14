import { GameConfig as C } from "../core/GameConfig";
export type ImpactMaterial = "enemy" | "wood" | "metal" | "stone";
export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "spark" | "wood" | "metal" | "shell" | "smoke" | "dust" | "impact";
  material?: ImpactMaterial;
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
        life:
          (kind === "wood" || kind === "metal" ? 0.45 : 0.18) +
          this.random() * 0.22,
        size: (kind === "wood" ? 3 : 1.5) + this.random() * 2,
        kind,
        material: undefined,
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
      material: undefined,
      life,
      maxLife: life,
      size: kind === "smoke" ? 9 : kind === "dust" ? 4 : 2,
      gravity: kind === "smoke" ? -25 : 650,
      spin: this.random() * 6,
    });
    this.peak = Math.max(
      this.peak,
      this.items.reduce((n, p) => n + Number(p.active), 0),
    );
  }
  impact(x: number, y: number, material: ImpactMaterial): void {
    this.emit(x, y, "impact");
    const p = this.items.find(
      (p) =>
        p.active &&
        p.kind === "impact" &&
        p.x === x &&
        p.y === y &&
        !p.material,
    );
    if (p) {
      p.material = material;
      p.size = material === "enemy" ? 22 : material === "metal" ? 18 : 15;
      p.life = p.maxLife = 0.14;
      p.gravity = 0;
    }
    this.burst(
      x,
      y,
      material === "enemy" ? 7 : 5,
      material === "wood" ? "wood" : "spark",
    );
    if (material === "metal") this.burst(x, y, 3, "metal");
  }
  blast(x: number, y: number, radius: number, groundY = 150): void {
    this.burst(x, y, 12, "metal");
    this.burst(x, y, 8, "wood");
    if (y - radius < groundY + 5)
      for (let n = 0; n < 8; n++)
        this.emit(
          x + (n - 3.5) * 12,
          groundY + 6,
          "dust",
          (n - 3.5) * 58,
          35 + (n % 3) * 15,
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
