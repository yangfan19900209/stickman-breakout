import type { SeaEnemy } from "./OceanSession";
/** Attack identity is chosen before warning, and the saved direction is never re-aimed mid-burst. */
export function enemyPattern(e: SeaEnemy) {
  if (e.kind === "captain") return ["torpedo", "sonar", "dash"][e.serial % 3];
  if (e.kind === "fish") return "dash";
  if (e.kind === "kelp") return "lash";
  if (e.kind === "mine") return "proximity";
  if (e.kind === "turret") return e.serial % 2 ? "sonar" : "harpoon";
  return e.role;
}
