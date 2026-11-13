import { MechanismData, Solid } from "./LevelData";
import { Rect, surfaceY } from "../core/Types";
export class MechanismController {
  readonly rect: Solid;
  readonly supports: Solid[] = [];
  released = false;
  landed = false;
  direction = 1;
  vy = 0;
  private landingSupport?: Rect;
  constructor(readonly data: MechanismData) {
    this.rect = {
      x: data.x,
      y: data.y,
      w: data.w,
      h: data.h,
      kind: "platform",
      oneWay: true,
    };
  }
  update(dt: number, surfaces?: readonly Rect[]): number {
    const old = this.rect.y;
    if (this.data.kind === "lift") {
      this.rect.y += this.direction * this.data.speed * dt;
      if (this.rect.y >= this.data.maxY) {
        this.rect.y = this.data.maxY;
        this.direction = -1;
      }
      if (this.rect.y <= this.data.minY) {
        this.rect.y = this.data.minY;
        this.direction = 1;
      }
    } else if (this.released) {
      const overlaps = (r: Rect) => r !== this.rect &&
        this.rect.x + this.rect.w > r.x && this.rect.x < r.x + r.w;
      const roof = (r: Rect) => Math.max(
        surfaceY(r, Math.max(r.x, this.rect.x)),
        surfaceY(r, Math.min(r.x + r.w, this.rect.x + this.rect.w)),
      );
      if (this.landed && this.landingSupport && surfaces?.includes(this.landingSupport) && overlaps(this.landingSupport)) {
        this.rect.y = roof(this.landingSupport);
        return this.rect.y - old;
      }
      if (this.landed && !surfaces) return 0;
      this.landed = false;
      this.landingSupport = undefined;
      this.vy -= 650 * dt;
      const next = this.rect.y + this.vy * dt;
      let floor = surfaces ? -Infinity : this.data.minY;
      for (const r of surfaces ?? []) {
        if (!overlaps(r)) continue;
        const top = roof(r);
        if (top <= old + .01 && top >= next && top > floor) {
          floor = top;
          this.landingSupport = r;
        }
      }
      this.rect.y = Math.max(floor, next);
      if (this.rect.y === floor) {
        this.landed = true;
        this.vy = 0;
      }
    }
    this.syncSupports();
    return this.rect.y - old;
  }
  syncSupports(): void {
    if(this.supports.length)this.supports[1].h=Math.max(0,this.rect.y-164);
  }
}
