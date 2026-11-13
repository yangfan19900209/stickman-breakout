import { GameConfig as C } from "../core/GameConfig";
import { clamp, surfaceY } from "../core/Types";
import type { KinematicBody, LevelController } from "../level/LevelController";
import type { Solid } from "../level/LevelData";

export interface PursuitJump {
  targetX: number;
  speed: number;
  velocity: number;
  surface?: Solid;
  offset?: number;
}

/** Walk off a supporting deck before chasing a target directly underneath it. */
export function pursuitWalkTarget(
  body: KinematicBody,
  target: { x: number; y: number },
  level: LevelController,
  minimumX = body.halfWidth,
  maximumX = level.data.width - body.halfWidth,
): number {
  if (target.y >= body.y - 35) return target.x;
  const support = level.solids.find(
    (s) =>
      Math.abs(surfaceY(s, body.x) - body.y) < 2 &&
      body.x + body.halfWidth > s.x &&
      body.x - body.halfWidth < s.x + s.w &&
      s.kind !== "ground",
  );
  if (!support) return target.x;
  const left = support.x - body.halfWidth - 8,
    right = support.x + support.w + body.halfWidth + 8;
  // A wide actor may land on a small crate beside the retreat edge. If the
  // nearest exit is outside its legal movement bounds, use the other edge.
  if (left < minimumX && right <= maximumX) return right;
  if (right > maximumX && left >= minimumX) return left;
  if (target.x < support.x) return left;
  if (target.x > support.x + support.w) return right;
  return Math.abs(body.x - left) < Math.abs(body.x - right) ? left : right;
}

export function jumpVelocityX(plan: PursuitJump, body: KinematicBody): number {
  const x = plan.surface ? plan.surface.x + (plan.offset ?? 0) : plan.targetX;
  return clamp((x - body.x) * 7, -plan.speed, plan.speed);
}

/** Plan against live geometry, then prove the arc with the same collision mover.
 * Only a temporary body is simulated; real actors are never snapped or warped.
 */
export function findPursuitJump(
  body: KinematicBody,
  level: LevelController,
  target: { x: number; y: number },
  speed: number,
  velocity: number,
): PursuitJump | undefined {
  if (!body.grounded) return;
  const direction = target.x >= body.x ? 1 : -1,
    apex = (velocity * velocity) / (2 * C.player.gravity),
    candidates: { surface: Solid; x: number; score: number }[] = [];
  const raised = target.y > body.y + 35;
  const blockers = level.solids.filter(
    (s) =>
      !s.oneWay &&
      s.y < body.y + body.height - 2 &&
      surfaceY(s, body.x) > body.y + 4 &&
      (direction > 0
        ? s.x >= body.x - body.halfWidth && s.x - body.x - body.halfWidth < 36
        : s.x + s.w <= body.x + body.halfWidth &&
          body.x - body.halfWidth - s.x - s.w < 36),
  );
  for (const s of level.solids) {
    const top = surfaceY(s, clamp(target.x, s.x, s.x + s.w)),
      rise = top - body.y;
    if (rise < 5 || rise > apex - 8 || s.w < 24) continue;
    const isBlock = blockers.includes(s),
      overBlock = s.oneWay && blockers.some(b => s.x < b.x + b.w + body.halfWidth && s.x + s.w > b.x - body.halfWidth),
      underTarget =
        target.x >= s.x - 8 &&
        target.x <= s.x + s.w + 8 &&
        Math.abs(top - target.y) < 8;
    if (!isBlock && !overBlock && !raised) continue;
    if (
      !isBlock && !overBlock &&
      !underTarget &&
      (top > target.y + 10 || Math.abs(s.x + s.w / 2 - target.x) > 420)
    )
      continue;
    const inset = Math.min(body.halfWidth + 8, s.w / 2 - 6);
    const x = clamp(
      isBlock || overBlock ? (direction > 0 ? s.x + inset : s.x + s.w - inset) : target.x,
      s.x + inset,
      s.x + s.w - inset,
    );
    const flight =
      (velocity +
        Math.sqrt(velocity * velocity - 2 * C.player.gravity * rise)) /
      C.player.gravity;
    if (Math.abs(x - body.x) > speed * flight * 0.94) continue;
    candidates.push({
      surface: s,
      x,
      score:
        (underTarget ? -500 : 0) +
        (isBlock ? -200 : 0) +
        Math.abs(x - body.x) +
        Math.abs(top - target.y) * 0.7,
    });
  }
  candidates.sort((a, b) => a.score - b.score);
  for (const candidate of candidates.slice(0, 4)) {
    const plan: PursuitJump = {
      targetX: candidate.x,
      speed,
      velocity,
      surface: candidate.surface,
      offset: candidate.x - candidate.surface.x,
    };
    const probe: KinematicBody = {
      x: body.x,
      y: body.y,
      vx: 0,
      vy: velocity,
      grounded: false,
      halfWidth: body.halfWidth,
      height: body.height,
    };
    for (let step = 0; step < 100; step++) {
      probe.vx = jumpVelocityX(plan, probe);
      probe.vy -= C.player.gravity / 60;
      level.move(probe, 1 / 60);
      if (probe.grounded) {
        const s = candidate.surface;
        if (
          Math.abs(probe.y - surfaceY(s, probe.x)) < 2 &&
          probe.x > s.x + 3 &&
          probe.x < s.x + s.w - 3
        )
          return plan;
        break;
      }
    }
  }
}
