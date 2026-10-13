import { GameConfig as C } from "../core/GameConfig";
import { Damageable, Facing, Rect, segmentRect } from "../core/Types";
import { ParticlePool } from "./ParticlePool";
export interface Projectile {
  active: boolean;
  owner: "player" | "enemy";
  x: number;
  y: number;
  lastX: number;
  vx: number;
  damage: number;
  distance: number;
  range: number;
}
export interface ProjectileSpawn {
  owner: "player" | "enemy";
  x: number;
  y: number;
  direction: Facing;
  speed: number;
  damage: number;
  range: number;
}
export class ProjectileManager {
  readonly items: Projectile[] = Array.from(
    { length: C.pools.projectiles },
    () => ({
      active: false,
      owner: "player",
      x: 0,
      y: 0,
      lastX: 0,
      vx: 0,
      damage: 0,
      distance: 0,
      range: 0,
    }),
  );
  fired = 0;
  hits = 0;
  dropped = 0;
  peak = 0;
  constructor(readonly particles: ParticlePool) {}
  reset(): void {
    for (const p of this.items) p.active = false;
    this.fired = this.hits = this.dropped = this.peak = 0;
  }
  spawn(s: ProjectileSpawn): boolean {
    const p = this.items.find((p) => !p.active);
    if (!p) {
      this.dropped++;
      return false;
    }
    Object.assign(p, {
      active: true,
      owner: s.owner,
      x: s.x,
      y: s.y,
      lastX: s.x,
      vx: s.direction * s.speed,
      damage: s.damage,
      distance: 0,
      range: s.range,
    });
    this.fired++;
    this.peak = Math.max(this.peak, this.items.filter((p) => p.active).length);
    return true;
  }
  update(
    dt: number,
    player: Damageable,
    enemies: Damageable[],
    solids: Rect[],
    onHit?: (target: Damageable) => void,
  ): void {
    for (const p of this.items) {
      if (!p.active) continue;
      p.lastX = p.x;
      const end = { x: p.x + p.vx * dt, y: p.y },
        start = { x: p.x, y: p.y };
      let nearest = 1.01,
        target: Damageable | undefined;
      for (const solid of solids) {
        const t = segmentRect(start, end, solid, 1.5);
        if (t !== null && t < nearest) {
          nearest = t;
          target = undefined;
        }
      }
      for (const candidate of p.owner === "player" ? enemies : [player]) {
        if (!candidate.alive) continue;
        const t = segmentRect(start, end, candidate.bounds, 2);
        if (t !== null && t < nearest) {
          nearest = t;
          target = candidate;
        }
      }
      if (nearest <= 1) {
        p.x = start.x + (end.x - start.x) * nearest;
        p.active = false;
        this.particles.burst(p.x, p.y, target ? 9 : 4);
        if (target && target.takeDamage(p.damage, p.vx > 0 ? 1 : -1)) {
          this.hits++;
          onHit?.(target);
        }
      } else {
        p.x = end.x;
        p.distance += Math.abs(p.vx * dt);
        if (p.distance >= p.range || p.x < -20 || p.x > 4020) p.active = false;
      }
    }
  }
}
