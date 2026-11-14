import type { GameSession } from "../core/GameSession";
import type { OceanSession } from "../ocean/OceanSession";
import type { FlightSession } from "../flight/FlightSession";

export type MusicTheme = "turkish-march" | "canon";
export type MusicTempo = 80 | 120;
export interface MusicCue {
  theme: MusicTheme;
  tempo: MusicTempo;
  mode: "playing" | "paused" | "stopped";
}

/** Consume actual encounter state, including mini-bosses; never use camera distance. */
export function selectMusicCue(land: GameSession, ocean?: OceanSession, flight?: FlightSession): MusicCue {
  const active = flight ?? ocean ?? land;
  const boss = flight ? flight.boss.active && flight.boss.alive
    : ocean ? (ocean.boss.active && ocean.boss.hp > 0) || !!(ocean.mini?.active && ocean.mini.hp > 0)
    : (land.spawner.guard.active && land.spawner.guard.alive)
      || !!(land.spawner.miniBoss?.active && land.spawner.miniBoss.alive);
  const mode = active.victory.active ? "stopped"
    : active.state === "paused" ? "paused"
    : active.state === "playing" || active.state === "dying" || active.state === "reviving" ? "playing" : "stopped";
  return { theme: ocean && !flight ? "canon" : "turkish-march", tempo: boss ? 120 : 80, mode };
}
