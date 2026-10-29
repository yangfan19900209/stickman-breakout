import { GameConfig as C } from "../core/GameConfig";
import { Damageable, Facing, Rect, segmentRect } from "../core/Types";
import { ParticlePool } from "./ParticlePool";
import type { BlastStyle } from "./ExplosionSystem";
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
  kind: "bullet" | "pellet" | "rocket" | "cannon" | "shockwave";
  blastRadius: number;
  knockback: number;
  gravity: number;
  smokeTime: number;
  firstFrame: boolean;
  originX: number;
  originY: number;
  homing: boolean;
  age: number;
  launchRemaining: number;
  launchAngle: number;
  target?: Damageable;
  visual?:"mech-round"|"mech-shell"|"mech-missile";
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
  homing?: boolean;
  /** Eject along the visible tube, then turn to pitch before target acquisition. */
  launchPitch?: number;
  visual?:Projectile["visual"];
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
      homing: false,
      age: 0,
      launchRemaining: 0,
      launchAngle: 0,
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
    style: BlastStyle,
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
      vx: s.direction * Math.cos(s.launchPitch ?? s.pitch ?? 0) * s.speed,
      vy: Math.sin(s.launchPitch ?? s.pitch ?? 0) * s.speed,
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
      homing: s.homing ?? false,
      age: 0,
      target: undefined,
      visual:s.visual,
      launchAngle: Math.atan2(Math.sin(s.pitch ?? 0),s.direction*Math.cos(s.pitch ?? 0)),
      launchRemaining: s.launchPitch === undefined ? 0 : Math.abs((s.pitch ?? 0)-s.launchPitch)/C.rocketLaunch.turnRate,
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
      p.age += dt;
      // The first sweep leaves the painted barrel. Upward input used to rotate
      // the entire 116-unit missile instantly beside a horizontal launcher.
      if (p.launchRemaining > 0) {
        if (p.age > dt + 1e-8) {
          const angle=Math.atan2(p.vy,p.vx),speed=Math.hypot(p.vx,p.vy);
          const delta=Math.atan2(Math.sin(p.launchAngle-angle),Math.cos(p.launchAngle-angle));
          const turn=Math.max(-C.rocketLaunch.turnRate*dt,Math.min(C.rocketLaunch.turnRate*dt,delta));
          p.vx=Math.cos(angle+turn)*speed;p.vy=Math.sin(angle+turn)*speed;
          p.launchRemaining=Math.max(0,p.launchRemaining-dt);
        }
      } else if (p.homing && p.owner === "player" && p.age >= C.homing.delay) this.guide(p, dt, enemies, solids);
      p.vy -= p.gravity * dt;
      if (p.kind === "rocket" || p.kind === "cannon") {
        p.smokeTime -= dt;
        if (p.smokeTime <= 0) {
          const speed = Math.hypot(p.vx, p.vy) || 1;
          const tail=p.kind==="rocket"&&p.owner==="player"
            ? Math.max(32,Math.min(C.rocketLaunch.visualLength,C.rocketLaunch.exposedNose+p.distance)):50;
          this.particles.emit(
            p.x - (p.vx / speed) * tail,
            p.y - (p.vy / speed) * tail,
            "smoke",
            -p.vx * 0.05,
            20,
          );
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
          p.kind === "shockwave"
            ? 12
            : p.kind === "cannon"
              ? 6
              : p.kind === "rocket"
                ? 4
                : 2,
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
        const material = target && "kind" in target ? target.kind : undefined;
        this.particles.impact(
          p.x,
          p.y,
          material === "wood" || material === "hanging"
            ? "wood"
            : material === "steel" ||
                material === "barrel" ||
                material === "guard" ||
                material === "colossus" ||
                material === "turret" ||
                material === "shield"
              ? "metal"
              : target && !("category" in target)
                ? "enemy"
                : "stone",
        );
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
          this.onExplosion?.(
            p.x,
            p.y,
            p.blastRadius,
            p.damage,
            p.owner,
            p.visual ? 'boss' : p.kind === "rocket" ? "rocket" : "cannon",
          );
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
  private guide(p: Projectile, dt: number, enemies: Damageable[], solids: Rect[]): void {
    const angle = Math.atan2(p.vy, p.vx);
    const delta = (to: number) => Math.atan2(Math.sin(to - angle), Math.cos(to - angle));
    const visible = (e: Damageable) => {
      const b = e.bounds, point = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      return e.alive && Math.hypot(point.x - p.x, point.y - p.y) < C.homing.acquireRange
        && !solids.some(s => segmentRect(p, point, s, 1) !== null);
    };
    if (p.target && !visible(p.target)) p.target = undefined;
    if (!p.target) {
      let nearest = Infinity;
      for (const e of enemies) {
        const b = e.bounds, dx = b.x + b.w / 2 - p.x, dy = b.y + b.h / 2 - p.y;
        const distance = Math.hypot(dx, dy);
        if (distance < nearest && Math.abs(delta(Math.atan2(dy, dx))) <= C.homing.cone && visible(e)) {
          nearest = distance; p.target = e;
        }
      }
    }
    if (!p.target) return;
    const b = p.target.bounds;
    const turn = delta(Math.atan2(b.y + b.h / 2 - p.y, b.x + b.w / 2 - p.x));
    const next = angle + Math.max(-C.homing.turnRate * dt, Math.min(C.homing.turnRate * dt, turn));
    const speed = Math.hypot(p.vx, p.vy);
    p.vx = Math.cos(next) * speed; p.vy = Math.sin(next) * speed;
  }
}
