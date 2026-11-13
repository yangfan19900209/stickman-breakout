import { AbandonedBase, Solid, LevelDefinition } from "./LevelData";
import { Rect, surfaceY } from "../core/Types";
import { DestructibleManager } from "../world/DestructibleManager";
import { MechanismController } from "./MechanismController";
import type { PlayerController } from "../player/PlayerController";
import type { EnemyController } from "../enemy/EnemyController";
import { GameConfig as C } from "../core/GameConfig";
export interface KinematicBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  halfWidth: number;
  height: number;
  groundSlope?: number;
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
  arenaVisited = false;
  mechanisms: MechanismController[] = [];
  clearedZones = new Set<string>();
  private playerX = 0;
  furthestPlayerX = 0;
  retreatLimit = 0;
  constructor(data: LevelDefinition = AbandonedBase) {
    this.data = data;
    this.reset();
  }
  reset(): void {
    this.guardDefeated = false;
    this.arenaEntered = false;
    this.arenaVisited = false;
    this.clearedZones.clear();
    this.mechanisms = (this.data.mechanisms ?? []).map(
      (d) => new MechanismController(d),
    );
    this.playerX = this.data.spawn.x;
    this.furthestPlayerX = this.data.spawn.x;
    this.retreatLimit = 0;
    this.staticSolids.length = 0;
    for (const s of this.data.solids) {
      if (s.kind !== "crate") this.staticSolids.push({ ...s });
    }
    this.objects.reset(this.data.objects);
    this.objectRevision = -1;
    this.refreshSolids();
    this.objects.initializeSupports(this.solids);
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
    for (const m of this.mechanisms) this.solids.push(m.rect,...m.supports.filter(s=>s.h>0));
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
      const top = m.rect.y + m.rect.h, oldBottom=m.rect.y;
      let delta = m.update(dt, this.solids);
      const riders=[p,...enemies].filter(b=>b.alive&&b.x+b.halfWidth>m.rect.x&&b.x-b.halfWidth<m.rect.x+m.rect.w);
      // Only solid undersides can hit a head. Floating one-way decks keep
      // their full travel even with a player or enemy walking underneath.
      if(!m.rect.oneWay && delta<0){
        for(const b of riders)if(oldBottom>=b.y+b.height-.01&&m.rect.y<b.y+b.height)
          delta=Math.max(delta,b.y+b.height-oldBottom);
        if(delta!==m.rect.y-oldBottom){m.rect.y=oldBottom+delta;m.direction=1;m.syncSupports();}
      }
      if(m.data.kind === "lift" && delta>0){
        for(const b of riders)if(b.grounded&&Math.abs(b.y-top)<1){
          for(const wall of this.solids){
            if(wall===m.rect||m.supports.includes(wall)||wall.oneWay)continue;
            if(b.x+b.halfWidth<=wall.x||b.x-b.halfWidth>=wall.x+wall.w)continue;
            if(b.y+b.height<=wall.y+.01&&b.y+b.height+delta>wall.y)
              delta=Math.min(delta,Math.max(0,wall.y-b.y-b.height));
          }
        }
        if(delta!==m.rect.y-oldBottom){m.rect.y=oldBottom+delta;m.direction=-1;m.syncSupports();}
      }
      if (delta !== 0) {
        changed = true;
        for(const b of riders){
          if(b.grounded&&Math.abs(b.y-top)<1)b.y+=delta;
          else if(delta>0&&b.vy<=0&&top<=b.y+.01&&top+delta>=b.y){
            b.y=top+delta;b.vy=Math.max(0,b.vy);b.grounded=b.vy===0;
          }
        }
      }
    }
    for (const z of this.data.zones ?? []) {
      if (z.id === "D" || this.clearedZones.has(z.id)) continue;
      if (!this.data.enemies.some(e => e.unlockAfter === "mini" && e.x >= z.start && e.x < z.end &&
          !enemies.some(active => active.id === e.id)) &&
        !enemies.some(
          (e) => e.alive && e.spawn.x >= z.start && e.spawn.x < z.end,
        )
      ) {
        this.clearedZones.add(z.id);
        changed = true;
      }
    }
    this.playerX = p.x;
    // Clearance is optional. The encounter entrance remains crossable inside
    // the rolling retreat boundary, with enough room for the full boss arena.
    // Hysteresis keeps the camera/encounter stable while moving across the entrance.
    this.arenaEntered =
      !!this.data.arena &&
      p.x >= this.data.arena.start + (this.arenaEntered ? -80 : 30);
    this.arenaVisited ||= this.arenaEntered;
    if (changed) {
      this.objectRevision = -1;
      this.refreshSolids();
    }
  }
  get zone() {
    return (
      (this.data.zones ?? []).find(
        (z) => this.playerX >= z.start && this.playerX < z.end,
      ) ?? null
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
  dropSurfaces(body: KinematicBody): Solid[] {
    if (!body.grounded) return [];
    const supports = this.solids.filter(s => body.x + body.halfWidth > s.x &&
      body.x - body.halfWidth < s.x + s.w && Math.abs(body.y - surfaceY(s, body.x)) < .5);
    // A solid ledge sharing the same height must still support the player.
    return supports.some(s => !s.oneWay) ? [] : supports;
  }
  movePlayer(body: KinematicBody, dt: number, ignored: readonly Solid[] = []): void {
    this.move(body, dt, this.retreatLimit + body.halfWidth, ignored);
    if (body.x > this.furthestPlayerX) {
      this.furthestPlayerX = body.x;
      let next = Math.max(0, body.x - C.progression.retreatDistance);
      const arena = this.data.arena;
      if (arena && !this.guardDefeated && body.x >= arena.start)
        next = Math.min(next, arena.start - C.progression.arenaRetreatMargin);
      this.retreatLimit = Math.max(this.retreatLimit, next);
    }
  }
  move(body: KinematicBody, dt: number, leftEdge = body.halfWidth, ignored: readonly Solid[] = []): void {
    const oldX = body.x,
      dx = body.vx * dt;
    const onTerrain =
      body.grounded &&
      body.vy <= 0 &&
      this.solids.some(
        (s) =>
          s.slope &&
          oldX >= s.x &&
          oldX <= s.x + s.w &&
          Math.abs(body.y - surfaceY(s, oldX)) < 0.6,
      );
    // Clamp the proposed horizontal move BEFORE resolving the landing surface;
    // Ground, air and knockback all obey the camera's visible left boundary.
    body.x = Math.max(leftEdge, body.x + dx);
    if (body.x === leftEdge && body.vx < 0) body.vx = 0;
    for (const s of this.solids) {
      // Shallow terraces snap while walking, but their vertical faces must
      // remain solid when an airborne body approaches below the top.
      if (s.oneWay || (s.slope && (onTerrain || s.slope.left !== s.slope.right))) continue;
      if (body.y >= s.y + s.h - 0.01 || body.y + body.height <= s.y + 0.01)
        continue;
      if (s.slope) {
        // Feet can overlap the lip before the body center crosses it. Resolve
        // that partial overlap too; a swept-edge-only check misses this case.
        if (dx > 0 && oldX < s.x && body.x + body.halfWidth >= s.x) {
          body.x = Math.min(body.x, s.x - body.halfWidth); body.vx = 0;
        } else if (dx < 0 && oldX > s.x + s.w && body.x - body.halfWidth <= s.x + s.w) {
          body.x = Math.max(body.x, s.x + s.w + body.halfWidth); body.vx = 0;
        }
        continue;
      }
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
    body.groundSlope = 0;
    for (const s of this.solids) {
      if (s.oneWay && ignored.includes(s)) continue;
      if (
        body.x + body.halfWidth <= s.x ||
        body.x - body.halfWidth >= s.x + s.w
      )
        continue;
      if (s.slope && (body.x < s.x || body.x > s.x + s.w)) continue;
      const top = surfaceY(s, body.x);
      if (
        dy <= 0 &&
        ((onTerrain && s.slope) ||
          (oldY >= surfaceY(s, oldX) - 0.01 && body.y <= top))
      ) {
        body.y = onTerrain && s.slope ? top : Math.max(body.y, top);
        body.vy = 0;
        body.grounded = true;
        body.groundSlope = s.slope ? (s.slope.right - s.slope.left) / s.w : 0;
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
  }
  groundY(x: number): number {
    const s = this.staticSolids.find(
      (s) => s.kind === "ground" && x >= s.x && x <= s.x + s.w,
    );
    return s ? surfaceY(s, x) : 150;
  }
  reachedExit(x: number): boolean {
    return this.guardDefeated && x >= this.data.exit.x - 28;
  }
}
