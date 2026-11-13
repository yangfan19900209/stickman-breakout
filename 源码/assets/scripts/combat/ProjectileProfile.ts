import { GameConfig as C } from "../core/GameConfig";
import type { Projectile } from "./ProjectileManager";

/** Weapon families share art and dimensions regardless of who fired them. */
export function projectileProfile(p: Pick<Projectile, "kind" | "tier">) {
  const scale = p.tier === "boss" ? 1.25 : p.tier === "mini" ? 1.15 : 1;
  const rocket = p.kind === "rocket" || p.kind === "cannon";
  return {
    frame: rocket
      ? ("projectile.rocket" as const)
      : p.kind === "pellet"
        ? ("projectile.pellet" as const)
        : ("projectile.bullet" as const),
    width:
      (rocket ? C.rocketLaunch.visualLength : p.kind === "pellet" ? 30 : 86) *
      scale,
    height: rocket ? undefined : (p.kind === "pellet" ? 11 : 19) * scale,
    hitRadius: (p.kind === "shockwave" ? 12 : rocket ? 4 : 2) * scale,
    rocket,
    scale,
  };
}
