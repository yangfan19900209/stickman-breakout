export const OceanEntry = {
  approachSpeed: 280,
  stopX: 350,
  chestX: 410,
  ledgeX: 455,
  openAt: 0.4,
  takeAt: 1,
  maskAt: 1.5,
  tankAt: 2.25,
  readyAt: 3.1,
  walkAt: 3.4,
  leapAt: 4,
  end: 7.2,
} as const;
export function entryPhase(time: number) {
  if (time < OceanEntry.openAt) return "reach";
  if (time < OceanEntry.takeAt) return "open";
  if (time < OceanEntry.maskAt) return "take";
  if (time < OceanEntry.tankAt) return "mask";
  if (time < OceanEntry.readyAt) return "tank";
  if (time < OceanEntry.walkAt) return "ready";
  if (time < OceanEntry.leapAt) return "walk";
  return "dive";
}
