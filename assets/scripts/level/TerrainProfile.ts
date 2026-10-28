import { Rect, surfaceY } from "../core/Types";

/** Rectangular terraces. Constant-height surface spans retain foot snapping for
 * shallow steps, with true vertical sides for projectile/grenade collision. */
const points: readonly (readonly [number, number])[] = [
  [0, 150],
  [160, 150],
  [270, 174],
  [520, 174],
  [640, 150],
  [805, 150],
  [935, 184],
  [1140, 150],
  [1300, 156],
  [1480, 118],
  [1630, 118],
  [1740, 150],
  [2010, 150],
  [2245, 150],
  [2370, 128],
  [2480, 128],
  [2625, 163],
  [2820, 163],
  [2915, 150],
  [3350, 150],
  [3460, 178],
  [3650, 178],
  [3720, 150],
  [4010, 150],
  [4100, 176],
  [4330, 176],
  [4490, 134],
  [4680, 134],
  [4830, 150],
  [5200, 150],
  [5390, 120],
  [5470, 120],
  [5560, 150],
  [6090, 150],
  [6230, 150],
  [6350, 150],
  [6510, 150],
  [8200, 150],
];
export const road: Rect[] = points.slice(1).reduce<Rect[]>((spans, [x], i) => {
  const [left, height] = points[i];
  const previous = spans[spans.length - 1];
  if (previous?.slope?.left === height) { previous.w = x - previous.x; return spans; }
  spans.push({
    x: left,
    y: -240,
    w: x - left,
    h: height + 240,
    slope: { left: height, right: height },
  });
  return spans;
}, []);
export function roadHeight(x: number): number {
  const r = road.find((r) => x >= r.x && x <= r.x + r.w);
  return r ? surfaceY(r, x) : 150;
}
