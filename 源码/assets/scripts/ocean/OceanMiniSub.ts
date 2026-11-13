import type { SeaEnemy } from "./OceanSession";
import { MiniPoses } from "./OceanMiniFrames";

/** The piloted vehicle has its own footprint; it never borrows a diver's body or aim rotation. */
export const MINI_SUB = {
  scale: 0.28,
  halfWidth: 96,
  height: 124,
  centerY: 58,
  deathDuration: 2.1,
};
export function miniSubBounds(e: Pick<SeaEnemy, "x" | "y">) {
  // Fins and the open propeller guard are excluded from the damage hull.
  return { x: e.x - 88, y: e.y + 8, w: 176, h: 108 };
}
export function miniSubPose(e: SeaEnemy, time: number) {
  const dead = e.hp <= 0;
  const id = dead
    ? "minisub.wreck"
    : e.hp < e.maxHp * 0.4
      ? "minisub.damaged"
      : `minisub.intact.${Math.floor(time * (e.mode === "attack" && e.attack === "dash" ? 14 : 7)) % 2}`;
  const d = MiniPoses[id],
    scale = MINI_SUB.scale,
    flip = Math.cos(e.angle) <= 0 ? 1 : -1;
  const angle = dead ? -Math.min(0.24, e.deadTime * 0.14) : 0;
  const pivot = {
    x: e.x,
    y: e.y + 52 - (dead ? Math.min(35, e.deadTime * 18) : 0),
  };
  const sockets = d.sockets.map(([x, y]) => {
    const dx = (x - d.pivot[0]) * scale * flip,
      dy = (d.pivot[1] - y) * scale;
    return {
      x: pivot.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: pivot.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  });
  return {
    id,
    scale,
    width: d.size[0] * scale,
    height: d.size[1] * scale,
    flip,
    angle,
    pivot,
    anchor: [d.pivot[0] / d.size[0], 1 - d.pivot[1] / d.size[1]] as const,
    muzzle: sockets[e.attack === "torpedo" ? 1 : 0],
    sockets,
  };
}
