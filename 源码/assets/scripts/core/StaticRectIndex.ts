import { Rect } from "./Types";

/** Broad phase only: exact collision continues to use the original rectangles.
 * Static geometry is indexed once; callers own/reuse their result buffers. */
export class StaticRectIndex<T extends Rect = Rect> {
  private readonly columns = new Map<number, Map<number, number[]>>();
  private readonly seen: Uint32Array;
  private stamp = 0;
  private readonly ids: number[] = [];
  constructor(private readonly rects: readonly T[], private readonly cellSize = 128) {
    this.seen = new Uint32Array(rects.length);
    rects.forEach((r, id) => {
      for (let x = Math.floor(r.x / cellSize); x <= Math.floor((r.x + r.w) / cellSize); x++) {
        let column = this.columns.get(x);
        if (!column) this.columns.set(x, column = new Map());
        for (let y = Math.floor(r.y / cellSize); y <= Math.floor((r.y + r.h) / cellSize); y++) {
          let bucket = column.get(y);
          if (!bucket) column.set(y, bucket = []);
          bucket.push(id);
        }
      }
    });
  }
  query(left: number, bottom: number, right: number, top: number, out: T[]): T[] {
    out.length = this.ids.length = 0;
    if (++this.stamp >= 0xffffffff) { this.seen.fill(0); this.stamp = 1; }
    for (let x = Math.floor(left / this.cellSize); x <= Math.floor(right / this.cellSize); x++) {
      const column = this.columns.get(x);
      if (!column) continue;
      for (let y = Math.floor(bottom / this.cellSize); y <= Math.floor(top / this.cellSize); y++) {
        const bucket = column.get(y);
        if (!bucket) continue;
        for (const id of bucket) {
          if (this.seen[id] === this.stamp) continue;
          this.seen[id] = this.stamp;
          const r = this.rects[id];
          // Inclusive so an exact tangent still reaches the narrow phase.
          if (r.x <= right && r.x + r.w >= left && r.y <= top && r.y + r.h >= bottom) this.ids.push(id);
        }
      }
    }
    this.ids.sort((a, b) => a - b); // Preserve deterministic equal-distance/contact ordering.
    for (const id of this.ids) out.push(this.rects[id]);
    return out;
  }
}
