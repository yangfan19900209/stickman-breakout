import type { SeaEnemy } from "./OceanSession";
import { EnemyPoses } from "./OceanCombatFrames";
import { miniSubPose } from "./OceanMiniSub";
import { oceanShotProfile, OceanShotTier } from "./OceanCombatTuning";
import { ShieldDiverPoses } from "./OceanFeedbackFrames";
/** The frame, body pivot and muzzle share one transform, including left/right aims. */
export function oceanEnemyPose(e: SeaEnemy, time: number) {
  if (e.kind === "captain") return miniSubPose(e, time);
  const weapon = e.role;
  const moving = Math.hypot(e.vx, e.vy) > 12;
  const state =
    e.mode === "dodge"
      ? "evade"
      : e.mode === "tell" || e.mode === "attack"
        ? "aim"
        : moving
          ? `swim.${Math.floor(time * 7) % 2}`
          : "aim";
  const shield = e.shieldHp > 0;
  const id = shield ? `enemy.shield.${e.hit > .13 ? "hit" : state === "evade" ? "swim.1" : state}` : `enemy.${weapon}.${state}`,
    d = shield ? ShieldDiverPoses[id] : EnemyPoses[id],
    scale = d.scale;
  const flip = Math.cos(e.angle) <= 0 ? 1 : -1,
    angle = e.angle - (flip === 1 ? Math.PI : 0) +
      (e.hit > 0 && e.mode !== "tell" && e.mode !== "attack" ? -.13 * e.hitDirection * Math.sin(Math.PI * e.hit / .24) : 0);
  const dx = (d.muzzle[0] - d.pivot[0]) * scale * flip,
    dy = (d.pivot[1] - d.muzzle[1]) * scale;
  const pivot = { x: e.x, y: e.y + 32 };
  return {
    id,
    scale,
    width: d.size[0] * scale,
    height: d.size[1] * scale,
    flip,
    angle,
    pivot,
    anchor: [d.pivot[0] / d.size[0], 1 - d.pivot[1] / d.size[1]] as const,
    muzzle: {
      x: pivot.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: pivot.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    },
  };
}

/** Every ammunition family shares artwork and geometry, including torpedoes. */
export function oceanShotVisual(kind: string, owner: string, tier: OceanShotTier = "standard") {
  return {
    id: kind === "bomb" ? "projectile.water-grenade" : kind === "harpoon" ? "shot.shared.harpoon"
      : kind === "sonar" ? "shot.player.sonar" : kind === "torpedo" ? "shot.player.torpedo" : `shot.${owner}.${kind}`,
    ...oceanShotProfile(kind, tier),
    thickness: 1,
  };
}
