export type Vec = { x: number; y: number };
export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  slope?: { left: number; right: number };
};
/** Surface coordinates are shared by walking, falling objects and projectile sweeps. */
export function surfaceY(r: Rect, x: number): number {
  return r.slope
    ? r.slope.left +
        (r.slope.right - r.slope.left) * clamp((x - r.x) / r.w, 0, 1)
    : r.y + r.h;
}
export type Facing = -1 | 1;
export type DamageKind = "bullet" | "explosion";
export type DamageOwner = "player" | "enemy" | "neutral";
export type AnimationState =
  | "Idle"
  | "Run"
  | "Jump"
  | "Fall"
  | "Shoot"
  | "Hit"
  | "Crouch"
  | "Land"
  | "Dead";
export type EnemyState =
  | "Idle"
  | "Patrol"
  | "Chase"
  | "Attack"
  | "Hit"
  | "Dead";
export type EnemyKind = "melee" | "ranged" | "shield" | "turret" | "guard";
export type GameState =
  | "title"
  | "playing"
  | "paused"
  | "dying"
  | "gameover"
  | "complete";
export type InputAction =
  | "left"
  | "right"
  | "jump"
  | "shoot"
  | "pause"
  | "crouch"
  | "aimUp"
  | "grenade";
export interface InputFrame {
  axis: number;
  jump: boolean;
  shoot: boolean;
  jumpHeld?: boolean;
  crouch?: boolean;
  aimY?: number;
  grenade?: boolean;
}
export interface Damageable {
  x: number;
  y: number;
  alive: boolean;
  bounds: Rect;
  takeDamage(amount: number, direction: Facing, kind?: DamageKind): boolean;
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
  for (let axis = 0; axis < 2; axis++) {
    const start = axis === 0 ? a.x : a.y,
      delta = axis === 0 ? b.x - a.x : b.y - a.y,
      min = (axis === 0 ? r.x : r.y) - radius,
      max = axis === 0 ? r.x + r.w + radius : r.y + r.h + radius;
    if (Math.abs(delta) < 1e-8) {
      if (start < min || start > max) return null;
      continue;
    }
    let t1 = (min - start) / delta,
      t2 = (max - start) / delta;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    enter = Math.max(enter, t1);
    leave = Math.min(leave, t2);
    if (enter > leave) return null;
  }
  if (r.slope) {
    const m = (r.slope.right - r.slope.left) / r.w;
    const height = (v: Vec) =>
      v.y - r.slope!.left - m * (v.x - r.x) - radius * Math.hypot(1, m);
    const start = height(a),
      delta = height(b) - start;
    if (Math.abs(delta) < 1e-8) {
      if (start > 0) return null;
    } else if (delta < 0) enter = Math.max(enter, -start / delta);
    else leave = Math.min(leave, -start / delta);
    if (enter > leave) return null;
  }
  return enter;
}
