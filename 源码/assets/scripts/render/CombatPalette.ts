/** Monochrome world/ordnance; one warm accent family for active attack effects only. */
export const CombatPalette = {
  warning: [108, 108, 108],
  fire: [255, 168, 76],
  hot: [255, 226, 155],
  smoke: [194, 194, 194],
} as const;
export type CombatTint = readonly [number, number, number];

export function attackEffectTint(kind: string): CombatTint | undefined {
  // A wave is an attack effect. Bullets, harpoons and missile bodies stay ink-white.
  return kind === "sonar" || kind === "shockwave" ? CombatPalette.fire : undefined;
}

/** Water keeps its bubble-cloud silhouette, with the same warm explosive accent. */
export function waterBlastTint(age: number): CombatTint {
  return age < .12 ? CombatPalette.hot : age < .58 ? CombatPalette.fire : CombatPalette.smoke;
}

/** Shared authored fire sequence for player/enemy rockets, artillery and airbursts. */
export function fireBlastVisual(age: number) {
  const frame = Math.min(6, Math.floor(Math.max(0, age) / .07));
  return { frame, scale: [.22, .48, .85, 1.1, 1.45, 1.7, 1.85][frame],
    alpha: Math.round(Math.max(0, Math.min(255, (.56 - age) * 1800))) };
}
