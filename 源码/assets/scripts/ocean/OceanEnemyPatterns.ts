import type { SeaEnemy } from "./OceanSession";
/** Attack identity is chosen before warning, and the saved direction is never re-aimed mid-burst. */
export function enemyPattern(e: SeaEnemy) {
  if (e.kind === "captain") return ["torpedo", "sweep", "dive", "sonar", "dash"][e.serial % 5];
  if (e.kind === "fish") return "dash";
  if (e.kind === "jellyfish") return "sting";
  if (e.kind === "mine") return "proximity";
  if (e.kind === "turret") return "torpedo";
  return e.role;
}
