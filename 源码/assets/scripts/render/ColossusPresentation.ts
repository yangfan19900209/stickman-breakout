import { BossFrames, BossSockets, ColossusScale } from "./BossFrames";
import type { Facing } from "../core/Types";
import { GameConfig as C } from "../core/GameConfig";

const colossusBodyTop = Math.max(...Object.entries(BossFrames)
  .filter(([id]) => id.startsWith('colossus.'))
  .map(([, f]) => f.size[1] * (1 - f.anchor[1]) * ColossusScale * C.colossus.sizeScale));

export interface MechPose {
  x: number;
  y: number;
  facing: Facing;
  animation: string;
  animationTime: number;
  deadTime: number;
  health?: number;
  maxHealth?: number;
  action?: string;
  windup?: number;
  recoil: number;
  hitTime?: number;
  laserTime?: number;
  stride?: number;
  vx?: number;
  plannedLeapTop?: number;
}
export function colossusPresentation(a: MechPose) {
  let id: keyof typeof BossFrames = "colossus.idle";
  if (a.animation === "Dead")
    id =
      a.deadTime < 0.45
        ? "colossus.damaged"
        : a.deadTime < 1.2
          ? "colossus.collapse"
          : "colossus.wreck";
  else if (
    (a.action === "walk" || a.action === "charging") &&
    Math.abs(a.vx ?? 0) > 1
  )
    id = (
      [
        "colossus.walk.0",
        "colossus.walk.1",
        "colossus.walk.2",
        "colossus.walk.3",
      ] as const
    )[Math.floor((a.stride ?? 0) * 4) % 4];
  else if (
    a.action === "enrage" ||
    (a.action === "charge" && (a.windup ?? 0) > 0)
  )
    id = "colossus.charge";
  else if (a.action === "leaping") id = "colossus.stomp-tell";
  else if (a.action === "leap")
    id =
      (a.windup ?? 0) > 0
        ? "colossus.stomp-tell"
        : a.recoil > 0.1
          ? "colossus.stomp"
          : "colossus.idle";
  else if (
    a.action === "laser" &&
    ((a.windup ?? 0) > 0 || (a.laserTime ?? 0) > 0 || a.recoil > 0.1)
  )
    id = "colossus.charge";
  else if (a.action === "stomp" && (a.windup ?? 0) > 0)
    id = "colossus.stomp-tell";
  else if (a.action === "stomp" && a.recoil > 0.1) id = "colossus.stomp";
  else if (a.recoil > 0.1) id = "colossus.fire";
  else if ((a.hitTime ?? 0) > 0.05) id = "colossus.damaged";
  else if (a.action === "intro") id = "colossus.idle";
  const f = BossFrames[id];
  const scale = ColossusScale * C.colossus.sizeScale;
  return {
    id,
    scale,
    width: f.size[0] * scale,
    height: f.size[1] * scale,
    flip: -a.facing,
    anchor: f.anchor,
  };
}
export function colossusSocket(
  a: MechPose,
  slot: "muzzle" | "core" | "leftPod" | "rightPod" = "muzzle",
) {
  const view = colossusPresentation(a),
    map = BossSockets[view.id] as Partial<
      Record<typeof slot, readonly [number, number]>
    >;
  const local = map[slot] ?? BossSockets["colossus.idle"][slot];
  return {
    x: a.x - local[0] * view.scale * a.facing,
    y: a.y + local[1] * view.scale,
  };
}

/** Fit the full drawn body and telegraph below the HUD, anticipating a leap. */
export function colossusArenaZoom(a: MechPose, groundY: number, ceiling: number, screenGround: number) {
  const leap = a.action === 'leaping' || a.action === 'leap' && (a.windup ?? 0) > 0;
  const rise = Math.max(0, a.y - groundY,
    leap ? (a.plannedLeapTop || groundY + C.colossus.leapVelocity ** 2 / (2 * C.player.gravity)) - groundY : 0);
  const top = Math.max(colossusBodyTop + rise, C.colossus.height * C.colossus.sizeScale + 59);
  return Math.max(.3, (ceiling - screenGround - 14) / top);
}
