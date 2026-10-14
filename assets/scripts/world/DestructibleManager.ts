import { ObjectData, DestructibleObject } from "./DestructibleObject";
import { Rect, surfaceY } from "../core/Types";
export class DestructibleManager {
  objects: DestructibleObject[] = [];
  revision = 0;
  destroyed = 0;
  onHit?: (object: DestructibleObject, destroyed: boolean) => void;
  reset(data: ObjectData[]): void {
    this.objects = data.map((d) => new DestructibleObject(d));
    this.revision++;
    this.destroyed = 0;
  }
  update(dt: number, ground: Rect[]): void {
    for (const o of this.objects) {
      o.hitTime = Math.max(0, o.hitTime - dt);
      if (!o.alive) {
        o.deadTime += dt;
        continue;
      }
      if (o.falling) {
        const oldY = o.y;
        o.vy -= 1000 * dt;
        o.y += o.vy * dt;
        for (const r of ground)
          if (
            o.x + o.w > r.x &&
            o.x < r.x + r.w &&
            oldY >= surfaceY(r, o.x + o.w / 2) &&
            o.y <= surfaceY(r, o.x + o.w / 2)
          ) {
            o.y = surfaceY(r, o.x + o.w / 2);
            o.falling = false;
            o.vy = 0;
            this.onHit?.(o, false);
          }
        o.bounds.y = o.y;
        this.revision++;
      }
      if (o.dirty) {
        o.dirty = false;
        this.revision++;
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
