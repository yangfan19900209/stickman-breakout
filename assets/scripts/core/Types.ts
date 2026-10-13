export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Facing = -1 | 1;
export type AnimationState =
  | "Idle"
  | "Run"
  | "Jump"
  | "Fall"
  | "Shoot"
  | "Hit"
  | "Dead";
export type EnemyState =
  | "Idle"
  | "Patrol"
  | "Chase"
  | "Attack"
  | "Hit"
  | "Dead";
export type EnemyKind = "melee" | "ranged" | "guard";
export type GameState =
  | "title"
  | "playing"
  | "paused"
  | "dying"
  | "gameover"
  | "complete";
export type InputAction = "left" | "right" | "jump" | "shoot" | "pause";
export interface InputFrame {
  axis: number;
  jump: boolean;
  shoot: boolean;
}
export interface Damageable {
  x: number;
  y: number;
  alive: boolean;
  bounds: Rect;
  takeDamage(amount: number, direction: Facing): boolean;
}
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
/** Swept segment / expanded AABB: prevents fast bullets tunnelling. Returns hit fraction. */
export function segmentRect(
  a: Vec,
  b: Vec,
  r: Rect,
  radius = 0,
): number | null {
  let enter = 0,
    leave = 1;
  for (const [start, delta, min, max] of [
    [a.x, b.x - a.x, r.x - radius, r.x + r.w + radius],
    [a.y, b.y - a.y, r.y - radius, r.y + r.h + radius],
  ]) {
    if (Math.abs(delta) < 1e-8) {
      if (start < min || start > max) return null;
      continue;
    }
    let t1 = (min - start) / delta,
      t2 = (max - start) / delta;
    if (t1 > t2) [t1, t2] = [t2, t1];
    enter = Math.max(enter, t1);
    leave = Math.min(leave, t2);
    if (enter > leave) return null;
  }
  return enter;
}
