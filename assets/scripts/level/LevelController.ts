import { AbandonedBase, Solid, LevelDefinition } from "./LevelData";
import { Rect } from "../core/Types";
import { DestructibleManager } from "../world/DestructibleManager";
import { MechanismController } from "./MechanismController";
import type { PlayerController } from "../player/PlayerController";
import type { EnemyController } from "../enemy/EnemyController";
export interface KinematicBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  halfWidth: number;
  height: number;
}

/** Deterministic kinematic collisions, independent of Box2D and platform/browser APIs. */
export class LevelController {
  readonly data: LevelDefinition;
  readonly solids: Solid[] = [];
  readonly staticSolids: Solid[] = [];
  readonly objects = new DestructibleManager();
  private objectRevision = -1;
  guardDefeated = false;
  arenaEntered = false;
  mechanisms: MechanismController[] = [];
  clearedZones = new Set<string>();
  private barriers: Solid[] = [];
  constructor(data: LevelDefinition = AbandonedBase) {
    this.data = data;
    this.reset();
  }
  reset(): void {
    this.guardDefeated = false;
    this.arenaEntered = false;
    this.clearedZones.clear();
    this.mechanisms = (this.data.mechanisms ?? []).map(
      (d) => new MechanismController(d),
    );
    this.barriers = (this.data.zones ?? [])
      .filter((z) => z.id !== "D")
      .map((z) => ({
        x: z.end,
        y: 150,
        w: 12,
        h: 380,
        kind: "step",
        entityId: `gate:${z.id}`,
      }));
    this.staticSolids.length = 0;
    for (const s of this.data.solids)
      if (s.kind !== "crate") this.staticSolids.push({ ...s });
    this.objects.reset(this.data.objects);
    this.objectRevision = -1;
    this.refreshSolids();
  }
  refreshSolids(): void {
    if (this.objectRevision === this.objects.revision) return;
    this.objectRevision = this.objects.revision;
    this.solids.length = 0;
    for (const s of this.staticSolids) this.solids.push(s);
    for (const o of this.objects.objects)
      if (o.solid)
        this.solids.push(
          Object.assign(o.bounds, {
            kind: "crate" as const,
            entityId: o.id,
            breakable: o.category !== "indestructible",
          }),
        );
    for (const m of this.mechanisms) this.solids.push(m.rect);
    for (const b of this.barriers)
      if (!this.clearedZones.has(b.entityId!.slice(5))) this.solids.push(b);
  }
  updateWorld(
    dt: number,
    p: PlayerController,
    enemies: EnemyController[],
  ): void {
    let changed = false;
    for (const m of this.mechanisms) {
      if (
        m.data.ropeId &&
        !this.objects.objects.find((o) => o.id === m.data.ropeId)?.alive
      )
        m.released = true;
      const top = m.rect.y + m.rect.h,
        delta = m.update(dt);
      if (delta !== 0) {
        changed = true;
        if (
          p.grounded &&
          Math.abs(p.y - top) < 1 &&
          p.x + 13 > m.rect.x &&
          p.x - 13 < m.rect.x + m.rect.w
        )
          p.y += delta;
      }
    }
    for (const z of this.data.zones ?? []) {
      if (z.id === "D" || this.clearedZones.has(z.id)) continue;
      if (
        !enemies.some(
          (e) => e.alive && e.spawn.x >= z.start && e.spawn.x < z.end,
        )
      ) {
        this.clearedZones.add(z.id);
        changed = true;
      }
    }
    if (this.data.arena && p.x >= this.data.arena.start + 70)
      this.arenaEntered = true;
    if (changed) {
      this.objectRevision = -1;
      this.refreshSolids();
    }
  }
  get zone() {
    return (
      (this.data.zones ?? []).find((z) => !this.clearedZones.has(z.id)) ?? null
    );
  }
  bounds(body: KinematicBody): Rect {
    return {
      x: body.x - body.halfWidth,
      y: body.y,
      w: body.halfWidth * 2,
      h: body.height,
    };
  }
  move(body: KinematicBody, dt: number): void {
    const oldX = body.x,
      dx = body.vx * dt;
    body.x += dx;
    for (const s of this.solids) {
      if (s.oneWay) continue;
      if (body.y >= s.y + s.h - 0.01 || body.y + body.height <= s.y + 0.01)
        continue;
      if (
        dx > 0 &&
        oldX + body.halfWidth <= s.x + 0.01 &&
        body.x + body.halfWidth >= s.x
      ) {
        body.x = Math.min(body.x, s.x - body.halfWidth);
        body.vx = 0;
      } else if (
        dx < 0 &&
        oldX - body.halfWidth >= s.x + s.w - 0.01 &&
        body.x - body.halfWidth <= s.x + s.w
      ) {
        body.x = Math.max(body.x, s.x + s.w + body.halfWidth);
        body.vx = 0;
      }
    }
    const oldY = body.y,
      dy = body.vy * dt;
    body.y += dy;
    body.grounded = false;
    for (const s of this.solids) {
      if (
        body.x + body.halfWidth <= s.x ||
        body.x - body.halfWidth >= s.x + s.w
      )
        continue;
      const top = s.y + s.h;
      if (dy <= 0 && oldY >= top - 0.01 && body.y <= top) {
        body.y = Math.max(body.y, top);
        body.vy = 0;
        body.grounded = true;
      } else if (
        !s.oneWay &&
        dy > 0 &&
        oldY + body.height <= s.y + 0.01 &&
        body.y + body.height >= s.y
      ) {
        body.y = Math.min(body.y, s.y - body.height);
        body.vy = 0;
      }
    }
    body.x = Math.max(
      body.halfWidth,
      Math.min(this.data.width - body.halfWidth, body.x),
    );
    if (this.arenaEntered && this.data.arena && "isPlayer" in body)
      body.x = Math.max(
        this.data.arena.start + 30,
        Math.min(this.data.arena.end - 30, body.x),
      );
  }
  reachedExit(x: number): boolean {
    return this.guardDefeated && x >= this.data.exit.x - 28;
  }
}
