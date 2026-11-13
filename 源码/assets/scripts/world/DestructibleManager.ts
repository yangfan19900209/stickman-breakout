import { ObjectData, DestructibleObject } from "./DestructibleObject";
import { Rect, surfaceY } from "../core/Types";
export class DestructibleManager {
  objects: DestructibleObject[] = [];
  revision = 0;
  destroyed = 0;
  private supports = new Map<DestructibleObject, { rect: Rect; top: number }>();
  onHit?: (object: DestructibleObject, destroyed: boolean) => void;
  reset(data: ObjectData[]): void {
    this.objects = data.map((d) => new DestructibleObject(d));
    this.revision++;
    this.destroyed = 0;
    this.supports.clear();
  }
  initializeSupports(surfaces: readonly Rect[]): void {
    // Register authored contacts before the first world tick moves lifts.
    // Otherwise a rising deck is already above the crate's old bottom when
    // the first downward sweep runs, and the crate falls through that deck.
    this.supports.clear();
    for (const o of this.objects) {
      if (!o.solid) continue;
      const support = surfaces.find(r => r !== o.bounds &&
        o.bounds.x + o.bounds.w > r.x && o.bounds.x < r.x + r.w &&
        Math.abs(o.y - surfaceY(r, o.x + o.w / 2)) < 0.01);
      if (support) this.supports.set(o, { rect: support, top: o.y });
    }
  }
  update(dt: number, ground: Rect[]): void {
    // A destroyed collider may still be in LevelController.solids until the
    // next refresh. Rebuild the prop portion from living objects, never from
    // those stale entries, and include platforms / moving mechanisms.
    const surfaces = ground.filter((r) => !("entityId" in r));
    for (const o of this.objects) if (o.solid && !surfaces.includes(o.bounds)) surfaces.push(o.bounds);
    for (const o of this.objects) {
      o.hitTime = Math.max(0, o.hitTime - dt);
      if (!o.alive) o.deadTime += dt;
      const suspended = o.kind === "rope" || (o.kind === "hanging" && !o.triggered && o.alive);
      if (!suspended && (o.alive || o.deadTime < 3)) {
        const previousSupport = this.supports.get(o);
        if (previousSupport && surfaces.includes(previousSupport.rect) && Math.abs(o.y - previousSupport.top) < 0.1) {
          o.y += surfaceY(previousSupport.rect, o.x + o.w / 2) - previousSupport.top;
        }
        const oldY = o.y;
        o.vy -= 1000 * dt;
        o.y += o.vy * dt;
        let support: Rect | undefined;
        let landingY = -Infinity;
        for (const r of surfaces)
          if (
            r !== o.bounds &&
            o.bounds.x + o.bounds.w > r.x &&
            o.bounds.x < r.x + r.w &&
            oldY >= surfaceY(r, o.x + o.w / 2) - 0.01 &&
            o.y <= surfaceY(r, o.x + o.w / 2) &&
            surfaceY(r, o.x + o.w / 2) > landingY
          ) {
            support = r;
            landingY = surfaceY(r, o.x + o.w / 2);
          }
        if (support) {
          const landed = o.falling && o.vy < -60;
          o.y = landingY;
          o.falling = false;
          o.vy = 0;
          this.supports.set(o, { rect: support, top: landingY });
          if (landed && o.alive) this.onHit?.(o, false);
        } else {
          o.falling = true;
          this.supports.delete(o);
        }
        if (o.bounds.y !== o.y) this.revision++;
        o.bounds.y = o.y;
      }
      if (o.dirty) {
        o.dirty = false;
        this.revision++;
        if (!o.alive) this.destroyed++;
        this.onHit?.(o, !o.alive);
      }
    }
  }
  flushHits(): void {
    for (const o of this.objects)
      if (o.dirty) {
        o.dirty = false;
        this.revision++;
        if (!o.alive) this.destroyed++;
        this.onHit?.(o, !o.alive);
      }
  }
}
