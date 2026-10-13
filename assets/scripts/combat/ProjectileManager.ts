import { GameConfig as C } from "../core/GameConfig";
import { Damageable, Facing, Rect, segmentRect } from "../core/Types";
import { ParticlePool } from "./ParticlePool";
export interface Projectile {
  active: boolean;
  owner: "player" | "enemy";
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  vy: number;
  vx: number;
  damage: number;
  distance: number;
  range: number;
  kind: "bullet" | "pellet" | "rocket" | "cannon";
  blastRadius: number;
  knockback: number;
  gravity: number;
  smokeTime: number;
  firstFrame: boolean;
  originX: number;
  originY: number;
}
export interface ProjectileSpawn {
  owner: "player" | "enemy";
  x: number;
  y: number;
  direction: Facing;
  speed: number;
  damage: number;
  range: number;
  pitch?: number;
  kind?: Projectile["kind"];
  blastRadius?: number;
  knockback?: number;
  gravity?: number;
  originX?: number;
  originY?: number;
}
export class ProjectileManager {
  readonly marks = Array.from({ length: 36 }, () => ({
    active: false,
    x: 0,
    y: 0,
  }));
  private markCursor = 0;
  readonly items: Projectile[] = Array.from(
    { length: C.pools.projectiles },
    () => ({
      active: false,
      owner: "player",
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      vy: 0,
      vx: 0,
      damage: 0,
      distance: 0,
      range: 0,
      kind: "bullet",
      blastRadius: 0,
      knockback: 0,
      gravity: 0,
      smokeTime: 0,
      firstFrame: false,
      originX: 0,
      originY: 0,
    }),
  );
  fired = 0;
  hits = 0;
  dropped = 0;
  peak = 0;
  onExplosion?: (
    x: number,
    y: number,
    radius: number,
    damage: number,
    owner: "player" | "enemy",
  ) => void;
  private playerTargets: Damageable[] = [];
  constructor(readonly particles: ParticlePool) {}
  reset(): void {
    for (const m of this.marks) m.active = false;
    this.markCursor = 0;
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
      vx: s.direction * Math.cos(s.pitch ?? 0) * s.speed,
      vy: Math.sin(s.pitch ?? 0) * s.speed,
      lastY: s.y,
      damage: s.damage,
      distance: 0,
      range: s.range,
      kind: s.kind ?? "bullet",
      blastRadius: s.blastRadius ?? 0,
      knockback: s.knockback ?? 0,
      gravity: s.gravity ?? 0,
      smokeTime: 0,
      firstFrame: true,
      originX: s.originX ?? s.x,
      originY: s.originY ?? s.y,
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
    objects: Damageable[] = [],
  ): void {
    for (const p of this.items) {
      if (!p.active) continue;
      p.lastX = p.x;
      p.lastY = p.y;
      p.vy -= p.gravity * dt;
      if (p.kind === "rocket") {
        p.smokeTime -= dt;
        if (p.smokeTime <= 0) {
          this.particles.emit(p.x, p.y, "smoke", -p.vx * 0.05, 20);
          p.smokeTime = 0.045;
        }
      }
      const end = { x: p.x + p.vx * dt, y: p.y + p.vy * dt },
        start = {
          x: p.firstFrame ? p.originX : p.x,
          y: p.firstFrame ? p.originY : p.y,
        };
      p.firstFrame = false;
      let nearest = 1.01,
        target: Damageable | undefined;
      for (const solid of solids) {
        if ("entityId" in solid) continue;
        const t = segmentRect(start, end, solid, 1.5);
        if (t !== null && t < nearest) {
          nearest = t;
          target = undefined;
        }
      }
      this.playerTargets[0] = player;
      const actors = p.owner === "player" ? enemies : this.playerTargets;
      for (let index = 0; index < actors.length + objects.length; index++) {
        const candidate =
          index < actors.length
            ? actors[index]
            : objects[index - actors.length];
        if (!candidate.alive) continue;
        const t = segmentRect(
          start,
          end,
          candidate.bounds,
          p.kind === "cannon" ? 6 : p.kind === "rocket" ? 4 : 2,
        );
        if (t !== null && t < nearest) {
          nearest = t;
          target = candidate;
        }
      }
      if (nearest <= 1) {
        p.x = start.x + (end.x - start.x) * nearest;
        p.y = start.y + (end.y - start.y) * nearest;
        p.active = false;
        this.particles.burst(p.x, p.y, target ? 9 : 4);
        if (
          !target ||
          ("category" in target && target.category === "indestructible")
        ) {
          const m = this.marks[this.markCursor++ % this.marks.length];
          m.active = true;
          m.x = p.x;
          m.y = p.y;
        }
        if (p.blastRadius > 0) {
          this.onExplosion?.(p.x, p.y, p.blastRadius, p.damage, p.owner);
        } else if (
          target &&
          target.takeDamage(
            p.kind === "pellet" && p.distance < 180 ? p.damage * 1.5 : p.damage,
            p.vx > 0 ? 1 : -1,
            "bullet",
          )
        ) {
          this.hits++;
          const body = target as Damageable & {
            vx?: number;
            vy?: number;
            hitTime?: number;
          };
          if (body.vx !== undefined && p.knockback > 0) {
            body.vx = (p.vx > 0 ? 1 : -1) * p.knockback;
            if (p.kind === "pellet" && body.vy !== undefined)
              body.vy = Math.max(body.vy, 100);
          }
          onHit?.(target);
        }
      } else {
        p.x = end.x;
        p.y = end.y;
        p.distance += Math.hypot(p.vx, p.vy) * dt;
        if (p.distance >= p.range) p.active = false;
      }
    }
  }
}
