import { GameConfig as C } from "../core/GameConfig";
import { GameSession } from "../core/GameSession";

export function cooldownRatio(remaining: number, duration: number): number {
  return duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
}

/** The HUD reads the action actually recovering, including a contextual crate cut. */
export function landAttackCooldown(s: GameSession): number {
  if (s.weapon.id === "knife") {
    const stage = Math.max(0, s.melee.stage - 1);
    return cooldownRatio(s.melee.cooldown, C.melee.combo[stage].duration + (s.melee.stage === 3 ? 0.14 : 0));
  }
  if (s.melee.time > 0 || s.melee.protectingCrateAmmo)
    return cooldownRatio(s.melee.cooldown, C.melee.interval);
  return cooldownRatio(s.weapon.cooldown, C.weapons[s.weapon.id].interval);
}
