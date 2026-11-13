import { GameConfig as C } from "../core/GameConfig";
import { Rect, surfaceY } from "../core/Types";
import { SandbagFrames } from "../render/SandbagFrames";
import { ShieldBreakDuration } from "../render/ShieldBreakFrames";
export type ImpactMaterial = "enemy" | "wood" | "metal" | "stone";
// Initial bag positions within the intact pile. Complete torn-bag sprites are
// used for flight, so scattering never exposes rectangular atlas cut edges.
export const SandbagFragments: readonly (readonly [number, number, number, number])[] = [
  [64, 0, 110, 34], [10, 34, 110, 33], [120, 34, 110, 33],
  [0, 67, 110, 40], [130, 67, 110, 40],
];
export const SandbagFrameIds = ["bag.debris.0","bag.debris.1","bag.debris.2","bag.debris.3"] as const;
export function sandbagPieceSize(fragment: number, scale: number): {width:number;height:number} {
  const width=SandbagFragments[fragment][2]*scale,size=SandbagFrames[SandbagFrameIds[fragment%4]].size;
  return {width,height:width*size[1]/size[0]};
}
export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "spark" | "wood" | "metal" | "shell" | "smoke" | "dust" | "impact" | "sandbag" | "sand" | "shield";
  fragment?: number;
  support?: Rect;
  supportY?: number;
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
          (kind === "wood" || kind === "metal" ? 1.6 : 0.18) +
          this.random() * 0.22,
        size: (kind === "wood" ? 3 : 1.5) + this.random() * 2,
        kind,
        material: undefined,
        fragment: undefined, support: undefined, supportY: undefined,
        gravity: kind === "smoke" ? -30 : kind === "wood" || kind === "metal" ? 1000 : 500,
        spin: this.random() * 6,
      });
      p.maxLife = p.life;
      this.peak = Math.max(
        this.peak,
        this.items.reduce((n, p) => n + Number(p.active), 0),
      );
    }
  }
  emit(x: number, y: number, kind: Particle["kind"], vx = 0, vy = 0): Particle | undefined {
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
      fragment: undefined, support: undefined, supportY: undefined,
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
    return p;
  }
  sandbags(bounds: Rect, direction: number, destroyed: boolean): void {
    const scale = bounds.w / 240;
    if (destroyed) for (let i = 0; i < SandbagFragments.length; i++) {
      const [cx, cy, w, h] = SandbagFragments[i];
      const p = this.emit(bounds.x + (cx + w / 2) * scale,
        bounds.y + (107 - cy - h / 2) * scale, "sandbag");
      if (!p) break;
      Object.assign(p, { fragment: i, size: scale, spin: 0,
        vx: (i === 0 ? direction : cx < 100 ? -1 : 1) * (50 + this.random() * 45) + direction * 20,
        vy: 75 + (107 - cy) * .8 + this.random() * 35,
        gravity: 650, life: 3, maxLife: 3 });
    }
    for (let i = 0; i < (destroyed ? 12 : 3); i++) {
      const p = this.emit(bounds.x + bounds.w * (.2 + this.random() * .6),
        bounds.y + bounds.h * (.2 + this.random() * .6), "sand",
        direction * 65 + (this.random() - .5) * 230, 90 + this.random() * 180);
      if (p) Object.assign(p, { size: 1.4 + this.random(), life: 1.1, maxLife: 1.1 });
    }
    for (let i = 0; i < (destroyed ? 5 : 1); i++) {
      const p = this.emit(bounds.x + bounds.w * (i + .5) / (destroyed ? 5 : 1),
        bounds.y + bounds.h * .32, "dust", (i - 2) * 28, 30);
      if (p) Object.assign(p, { gravity: -12, life: .65, maxLife: .65 });
    }
  }
  shieldBreak(x: number, y: number, facing: number): void {
    const p = this.emit(x, y, "shield", facing * 12, 0);
    if (p) Object.assign(p, { life: ShieldBreakDuration, maxLife: ShieldBreakDuration,
      size: 106, fragment: facing, gravity: 650, spin: 0 });
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
  update(dt: number, solids: Rect[] = []): void {
    for (const p of this.items)
      if (p.active) {
        const firstStep = p.life === p.maxLife;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        const bag = p.kind === "sandbag", shield = p.kind === "shield";
        const physical = bag || shield || p.kind === "sand" || p.kind === "wood" || p.kind === "metal" || p.kind === "shell";
        const radius = shield ? 0 : bag ? sandbagPieceSize(p.fragment!,p.size).height/2 : p.kind === "shell" || p.kind === "sand" ? p.size : 3;
        if ((bag || shield) && p.support) {
          if (solids.includes(p.support) && p.x >= p.support.x && p.x <= p.support.x + p.support.w)
            p.y += surfaceY(p.support, p.x) - p.supportY!;
          p.support = undefined;
        }
        if (firstStep && physical) {
          // A surface impact can emit the center directly on the floor, with
          // its radius already embedded. Resolve just that initial overlap.
          // Requiring the center to be on/above the surface prevents debris
          // beneath an overhead deck (or inside cover) jumping onto its top.
          for (const s of solids) {
            const top = surfaceY(s, p.x);
            if (p.x >= s.x && p.x <= s.x + s.w && p.y >= top - 0.01 && p.y - radius < top)
              p.y = top + radius;
          }
        }
        const oldY = p.y;
        p.vy -= p.gravity * dt;
        p.spin += dt * (bag ? p.vx * .025 : 6);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (physical) {
          let floor = -Infinity, support: Rect | undefined;
          for (const s of solids) {
            const top = surfaceY(s, p.x);
            if (p.x >= s.x && p.x <= s.x + s.w && oldY - radius >= top - 0.01 && p.y - radius <= top)
              if (top > floor) { floor = top; support = s; }
          }
          if (floor !== -Infinity) {
            p.y = floor + radius;
            p.vy = !shield && p.vy < -85 ? -p.vy * 0.22 : 0;
            p.vx *= p.vy ? 0.5 : Math.exp(-dt * 18);
            if (!p.vy) p.spin = 0;
            if (bag || shield) {
              p.spin = 0;
              if (!p.vy) { p.support = support; p.supportY = floor; }
            } else p.life = Math.min(p.life, 0.75);
          }
        }
      }
  }
}
